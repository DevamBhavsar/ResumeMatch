import logging
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file

from config import Config
from utils.file_handler import FileHandler
from utils.error_handler import ErrorHandler
from utils.resume_parser import ResumeParser
from utils.jd_parser import JobDescriptionParser
from utils.matcher import ResumeMatcher
from utils.document_generator import DocumentGenerator
from services.matching_service import MatchingService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Initialize configuration
Config.init_app()

# Initialize components
try:
    file_handler = FileHandler(Config)
    resume_parser = ResumeParser(Config.SKILLS_DB_PATH)
    jd_parser = JobDescriptionParser(Config.SKILLS_DB_PATH)
    matcher = ResumeMatcher()
    matching_service = MatchingService(resume_parser, jd_parser, matcher)
    logger.info("Initialized application components successfully")
except Exception as e:
    logger.error(f"Error initializing components: {e}")
    raise

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
        if not file_handler.allowed_file(file.filename):
            logger.warning(f"Unsupported file type: {file.filename}")
            return jsonify({"error": "File type not supported"}), 400

        # Create secure temporary file
        filepath, temp_dir = file_handler.secure_temp_file(file)

        # Save the file
        file.save(filepath)
        logger.info(f"File saved temporarily: {filepath}")

        # Validate file content
        file_ext = file.filename.rsplit(".", 1)[1].lower()
        if not file_handler.validate_file_content(filepath, file_ext):
            file_handler.cleanup_temp_files(filepath, temp_dir)
            return jsonify({"error": "Invalid file content"}), 400

        # Process the match
        result = matching_service.process_match(filepath, job_description)

        # Clean up temporary files
        file_handler.cleanup_temp_files(filepath, temp_dir)

        return render_template("results.html", result=result)

    except Exception as e:
        return ErrorHandler.handle_file_upload_error(e, filepath, temp_dir, file_handler)

@app.route('/js/lib/<path:filename>')
def serve_js_lib(filename):
    return send_from_directory('static/js/lib', filename)

@app.route('/generate-document', methods=['POST'])
def generate_document():
    try:
        text = request.form.get('text', '')
        doc_type = request.form.get('type', 'docx')
        
        if doc_type == 'docx':
            # Generate Word document
            buffer = DocumentGenerator.generate_docx(text)
            
            return send_file(
                buffer,
                as_attachment=True,
                download_name='Cover_Letter.docx',
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
        
        elif doc_type == 'pdf':
            # Generate PDF document
            buffer = DocumentGenerator.generate_pdf(text)
            
            return send_file(
                buffer,
                as_attachment=True,
                download_name='Cover_Letter.pdf',
                mimetype='application/pdf'
            )
        
        else:
            return jsonify({"error": "Unsupported document type"}), 400
            
    except Exception as e:
        logger.error(f"Error generating document: {e}")
        return jsonify({"error": "Failed to generate document"}), 500

# Error handlers
app.errorhandler(413)(ErrorHandler.handle_request_too_large)
app.errorhandler(500)(ErrorHandler.handle_server_error)

if __name__ == "__main__":
    app.run(debug=True)
