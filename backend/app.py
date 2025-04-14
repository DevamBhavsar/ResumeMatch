import logging
import os
from flask import (
    Flask,
    jsonify,
    session,
    render_template,
    request,
    send_from_directory,
    send_file,
    Response,
    redirect,
)
from werkzeug.utils import secure_filename
from flask_cors import CORS
import json
import time
import asyncio
import queue
from threading import Thread, Lock, Event
from config import Config
from utils.file_handler import FileHandler
from utils.error_handler import ErrorHandler
from utils.resume_parser import ResumeParser
from utils.jd_parser import JobDescriptionParser
from utils.matcher import ResumeMatcher
from utils.document_generator import DocumentGenerator
from services.matching_service import MatchingService
from services.batch_matching_service import BatchMatchingService
import uuid
from flask_sock import Sock

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Initialize queues for job processing
job_queue = queue.Queue()
processing_status = {}
job_progress = {}
job_results = {}
job_results_lock = Lock()
job_events = {}
progress_queues = {}  # Move this here with other global variables

# Initialize Flask app with session support
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

# Configure CORS
CORS(
    app,
    resources={
        r"/*": {
            "origins": [os.environ.get("FRONTEND_URL", "http://localhost:3000")],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        }
    },
)

# Initialize configuration
Config.init_app()

# Initialize components
try:
    file_handler = FileHandler(Config)
    resume_parser = ResumeParser(Config.SKILLS_DB_PATH)
    jd_parser = JobDescriptionParser(Config.SKILLS_DB_PATH)
    matcher = ResumeMatcher()
    matching_service = MatchingService(resume_parser, jd_parser, matcher)
    batch_matching_service = BatchMatchingService(resume_parser, jd_parser, matcher)
    logger.info("Initialized application components successfully")
except Exception as e:
    logger.error(f"Error initializing components: {e}")
    raise

sock = Sock(app)


# Background worker for processing jobs
def process_job_queue():
    while True:
        try:
            job_id, job_data = job_queue.get()
            if job_id in job_events:
                job_events[job_id].set()
                continue
            process_files_with_progress(job_id, **job_data)
            job_queue.task_done()
        except Exception as e:
            logger.error(f"Error processing job: {e}")
            continue


# Start background worker thread
worker_thread = Thread(target=process_job_queue, daemon=True)
worker_thread.start()


# Async helper for WebSocket connections
async def handle_websocket_messages(websocket, job_id):
    try:
        event = Event()
        job_events[job_id] = event

        while not event.is_set():
            if job_id in job_progress:
                progress_data = job_progress[job_id]
                await websocket.send(json.dumps(progress_data))

                if progress_data["status"] in ["completed", "error"]:
                    break

            await asyncio.sleep(0.1)
    finally:
        if job_id in job_events:
            del job_events[job_id]


@sock.route("/ws/progress/<job_id>")
async def ws_progress(websocket, job_id):
    try:
        await handle_websocket_messages(websocket, job_id)
    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {str(e)}")
    finally:
        logger.info(f"WebSocket connection closed for job {job_id}")


@app.route("/check-progress/<job_id>", methods=["GET"])
def check_progress(job_id):
    if job_id in processing_status:
        return jsonify(processing_status[job_id])
    return jsonify({"status": "not_found"}), 404


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/batch")
def batch_upload():
    return render_template("batch_upload.html")


@app.route("/upload", methods=["POST"])
def upload_file():
    try:
        if "resume" not in request.files:
            return jsonify({"error": "No resume file uploaded"}), 400
        file = request.files["resume"]
        job_description = request.form.get("job_description", "")

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if job_description == "":
            return jsonify({"error": "No job description provided"}), 400

        # Add session tracking
        session["last_upload"] = time.time()
        session["file_name"] = file.filename

        # Process the match
        result = matching_service.process_match(file, job_description)

        # Return JSON response
        return jsonify({"success": True, "result": result})

    except Exception as e:
        logger.error(f"Error in upload: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/progress/<job_id>")
def progress(job_id):
    def generate():
        try:
            # Send initial progress if available
            if job_id in job_progress:
                initial_data = job_progress[job_id]
                yield f"data: {json.dumps(initial_data)}\n\n"

                # If already completed or error, stop streaming
                if initial_data.get("status") in ["completed", "error"]:
                    return

            last_progress = 0
            last_update = time.time()

            while True:
                if job_id in job_progress:
                    progress_data = job_progress[job_id]
                    current_progress = progress_data.get("progress", 0)
                    current_status = progress_data.get("status", "processing")

                    # Only send update if progress changed significantly or enough time passed
                    if (
                        current_progress - last_progress >= 5
                        or time.time() - last_update >= 0.5
                        or current_status in ["completed", "error"]
                    ):

                        logger.info(
                            f"Sending progress update for job {job_id}: {current_progress}% - {progress_data.get('stage', '')}"
                        )
                        yield f"data: {json.dumps(progress_data)}\n\n"
                        last_progress = current_progress
                        last_update = time.time()

                    if current_status in ["completed", "error"]:
                        logger.info(
                            f"Ending progress stream for job {job_id}: {current_status}"
                        )
                        break

                time.sleep(0.1)
        except GeneratorExit:
            logger.info(f"Client closed connection for job {job_id}")

    response = Response(generate(), mimetype="text/event-stream")
    response.headers.update(
        {
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
    return response


@app.route("/batch-upload", methods=["POST"])
def batch_upload_files():
    try:
        job_id = str(uuid.uuid4())
        filepaths = []
        temp_dirs = []

        logger.info(f"Starting batch upload for job_id: {job_id}")
        logger.info(f"Received {len(request.files.getlist('resumes'))} files")

        # Create a dedicated directory for this job
        job_dir = os.path.join(Config.UPLOAD_FOLDER, job_id)
        os.makedirs(job_dir, exist_ok=True)
        logger.info(f"Created job directory: {job_dir}")

        # Save files first before starting background process
        for file in request.files.getlist("resumes"):
            try:
                logger.info(f"Processing file: {file.filename}")

                # Create a secure filename
                secure_name = secure_filename(file.filename)
                filepath = os.path.join(job_dir, secure_name)

                # Save the file
                file.save(filepath)
                filepaths.append(filepath)
                temp_dirs.append(job_dir)  # Use job_dir as temp_dir for cleanup

                logger.info(f"File saved successfully: {filepath}")
            except Exception as e:
                logger.error(f"Error saving file {file.filename}: {str(e)}")
                # Continue with other files

        if not filepaths:
            return jsonify({"error": "No valid files were uploaded"}), 400

        # Initialize progress tracking
        job_progress[job_id] = {
            "status": "processing",
            "progress": 0,
            "stage": "extracting",
            "message": "Starting batch processing...",
        }

        # Store job info in session
        session["current_job"] = job_id
        session["upload_time"] = time.time()

        # Pass saved filepaths to background thread
        job_data = {
            "filepaths": filepaths,
            "temp_dirs": temp_dirs,
            "form_data": request.form,
        }
        job_queue.put((job_id, job_data))

        return jsonify({"job_id": job_id})

    except Exception as e:
        logger.error(f"Error in batch upload: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


def process_files_with_progress(job_id, filepaths, temp_dirs, form_data):
    try:
        logger.info(f"Starting batch processing for job_id: {job_id}")

        def update_progress(progress, stage, message):
            progress_data = {
                "status": "processing",
                "progress": progress,
                "stage": stage,
                "message": message,
            }

            # Update progress in shared dict
            job_progress[job_id] = progress_data
            logger.info(f"Updated progress for job {job_id}: {progress}% - {stage}")

        # File processing steps
        update_progress(10, "extracting", "Extracting text from resumes...")
        logger.info(f"Processing {len(filepaths)} files")

        # Save files to disk before processing
        saved_files = []
        for i, filepath in enumerate(filepaths):
            try:
                # Check if file exists
                if not os.path.exists(filepath):
                    logger.error(f"File not found: {filepath}")
                    continue

                # Log file details
                logger.info(f"Processing file {i+1}/{len(filepaths)}: {filepath}")
                saved_files.append(filepath)
            except Exception as e:
                logger.error(f"Error processing file {filepath}: {str(e)}")

        if not saved_files:
            raise ValueError("No valid files to process")

        logger.info("Starting skill analysis")
        update_progress(40, "analyzing", "Analyzing skills and keywords...")

        logger.info("Starting score calculation")
        update_progress(70, "calculating", "Calculating match scores...")

        logger.info("Starting candidate ranking")
        update_progress(90, "ranking", "Ranking candidates...")

        # Process the batch match with the saved files
        results = batch_matching_service.process_batch_match(
            saved_files, form_data["job_description"]
        )
        logger.info(f"Processed {len(results)} candidates successfully")

        # Store results in global dictionary instead of session
        with job_results_lock:
            job_results[job_id] = results

        # Clean up files
        for filepath, temp_dir in zip(filepaths, temp_dirs):
            file_handler.cleanup_temp_files(filepath, temp_dir)

        logger.info(f"Job {job_id} completed successfully")

        # Update final progress with redirect URL
        completion_data = {
            "status": "completed",
            "progress": 100,
            "stage": "ranking",
            "message": "Processing complete!",
            "redirect_url": f"/batch-results?id={job_id}",
        }
        job_progress[job_id] = completion_data
        logger.info(
            f"Set completion data for job {job_id} with redirect to: {completion_data['redirect_url']}"
        )

    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}", exc_info=True)
        error_data = {
            "status": "error",
            "message": str(e),
            "progress": 0,
            "stage": "extracting",
        }
        job_progress[job_id] = error_data

        # Cleanup
        for filepath, temp_dir in zip(filepaths, temp_dirs):
            file_handler.cleanup_temp_files(filepath, temp_dir)


# Update the batch results endpoint
@app.route("/batch-results/<job_id>")
def batch_results(job_id):
    # Try to get results from our global dictionary
    results = job_results.get(job_id)
    if not results:
        logger.warning(f"No results found for job_id: {job_id}")
        return redirect("/batch")

    # Cleanup after retrieving results
    with job_results_lock:
        job_results.pop(job_id, None)

    # Move this after cleanup to avoid unreachable code
    return render_template("batch_results.html", results=results)


@app.route("/js/lib/<path:filename>")
def serve_js_lib(filename):
    return send_from_directory("static/js/lib", filename)


@app.route("/generate-document", methods=["POST"])
def generate_document():
    try:
        text = request.form.get("text", "")
        doc_type = request.form.get("type", "docx")

        if doc_type == "docx":
            # Generate Word document
            buffer = DocumentGenerator.generate_docx(text)
            return send_file(
                buffer,
                as_attachment=True,
                download_name="Cover_Letter.docx",
                mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )

        elif doc_type == "pdf":
            # Generate PDF document
            buffer = DocumentGenerator.generate_pdf(text)
            return send_file(
                buffer,
                as_attachment=True,
                download_name="Cover_Letter.pdf",
                mimetype="application/pdf",
            )

        else:
            return jsonify({"error": "Unsupported document type"}), 400

    except Exception as e:
        logger.error(f"Error generating document: {e}")
        return jsonify({"error": "Failed to generate document"}), 500


# Error handlers
app.errorhandler(500)(ErrorHandler.handle_server_error)
app.errorhandler(413)(ErrorHandler.handle_request_too_large)

if __name__ == "__main__":
    app.run(debug=True)
