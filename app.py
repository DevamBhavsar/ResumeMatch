import os
import tempfile
import shutil
import logging
from flask import Flask, render_template, request, jsonify, abort
from werkzeug.utils import secure_filename
import magic  # pip install python-magic

from utils.resume_parser import ResumeParser
from utils.jd_parser import JobDescriptionParser
from utils.matcher import ResumeMatcher

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "data/processed"
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5MB max upload
app.config["ALLOWED_EXTENSIONS"] = {"pdf", "docx", "txt"}
app.config["ALLOWED_MIMETYPES"] = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}

# Ensure upload directory exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Initialize parsers and matcher
try:
    resume_parser = ResumeParser()
    jd_parser = JobDescriptionParser()
    matcher = ResumeMatcher()
    logger.info("Initialized parsers and matcher successfully")
except Exception as e:
    logger.error(f"Error initializing components: {e}")
    raise


def allowed_file(filename):
    """Check if the file has an allowed extension"""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]
    )


def validate_file_content(file_path, expected_extension):
    """Validate file content matches its extension"""
    try:
        mime = magic.Magic(mime=True)
        file_mime = mime.from_file(file_path)
        expected_mime = app.config["ALLOWED_MIMETYPES"].get(expected_extension)

        if expected_mime and file_mime.startswith(expected_mime):
            return True
        logger.warning(
            f"File content validation failed: {file_path} has MIME {file_mime}, expected {expected_mime}"
        )
        return False
    except Exception as e:
        logger.error(f"Error validating file content: {e}")
        return False


def secure_temp_file(file):
    """Create a secure temporary file with a unique name"""
    try:
        # Get secure filename
        filename = secure_filename(file.filename)

        # Create a temporary directory
        temp_dir = tempfile.mkdtemp(dir=app.config["UPLOAD_FOLDER"])
        filepath = os.path.join(temp_dir, filename)

        return filepath, temp_dir
    except Exception as e:
        logger.error(f"Error creating secure temp file: {e}")
        raise


def cleanup_temp_files(filepath, temp_dir):
    """Safely clean up temporary files"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            logger.debug(f"Removed temporary file: {filepath}")

        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.debug(f"Removed temporary directory: {temp_dir}")
    except Exception as e:
        logger.error(f"Error cleaning up temporary files: {e}")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload_file():
    temp_dir = None
    filepath = None

    try:
        if "resume" not in request.files:
            logger.warning("No resume file in request")
            return jsonify({"error": "No resume file uploaded"}), 400

        file = request.files["resume"]
        job_description = request.form.get("job_description", "")

        if file.filename == "":
            logger.warning("Empty filename submitted")
            return jsonify({"error": "No file selected"}), 400

        if job_description == "":
            logger.warning("Empty job description submitted")
            return jsonify({"error": "No job description provided"}), 400

        # Check allowed file extensions
        if not allowed_file(file.filename):
            logger.warning(f"Unsupported file type: {file.filename}")
            return jsonify({"error": "File type not supported"}), 400

        # Create secure temporary file
        filepath, temp_dir = secure_temp_file(file)

        # Save the file
        file.save(filepath)
        logger.info(f"File saved temporarily: {filepath}")

        # Validate file content
        file_ext = file.filename.rsplit(".", 1)[1].lower()
        if not validate_file_content(filepath, file_ext):
            cleanup_temp_files(filepath, temp_dir)
            return jsonify({"error": "Invalid file content"}), 400

        # Parse resume
        resume_data = resume_parser.process_resume(filepath)
        logger.info(
            f"Resume processed successfully: {len(resume_data['skills'])} skills found"
        )

        # Parse job description
        jd_data = jd_parser.process_job_description(job_description)
        logger.info(
            f"Job description processed successfully: {len(jd_data['skills'])} skills found"
        )

        # Calculate matching score
        result = matcher.get_matching_score(resume_data, jd_data)
        logger.info(f"Match score calculated: {result['overall_score']}%")

        # Clean up temporary files
        cleanup_temp_files(filepath, temp_dir)

        return render_template("results.html", result=result)

    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}", exc_info=True)

        # Clean up on error
        if filepath or temp_dir:
            cleanup_temp_files(filepath, temp_dir)

        return (
            jsonify({"error": "An error occurred while processing your request"}),
            500,
        )


@app.errorhandler(413)
def request_entity_too_large(error):
    logger.warning("File too large error")
    return jsonify({"error": "File too large (max 5MB)"}), 413


@app.errorhandler(500)
def internal_server_error(error):
    logger.error(f"Internal server error: {error}", exc_info=True)
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True)
