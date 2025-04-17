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
from services.question_generator_service import QuestionGeneratorService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Initialize global state for job processing
job_queue = queue.Queue()
job_progress = {}  # Tracks progress updates for each job
job_results = {}  # Stores final results for each job
job_results_lock = Lock()  # Ensures thread-safe access to job_results
job_events = {}  # For WebSocket event handling

# Initialize Flask app with session support
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")
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

# Initialize WebSocket support
sock = Sock(app)

# Initialize configuration
Config.init_app()

# Initialize components
try:
    question_generator = QuestionGeneratorService()
    logger.info("Question generator service initialized")
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


# Background worker for processing jobs
def process_job_queue():
    """
    Background worker that processes jobs from the queue.
    Handles both single file and batch processing jobs.
    """
    while True:
        try:
            job_id, job_data = job_queue.get()

            # Check if this is a cancellation request
            if job_id in job_events and job_events[job_id].is_set():
                logger.info(f"Job {job_id} was cancelled")
                job_queue.task_done()
                continue

            # Determine job type and process accordingly
            if "filepaths" in job_data:
                # Batch processing
                process_batch_with_progress(job_id, **job_data)
            elif "filepath" in job_data:
                # Single file processing
                process_single_file_with_progress(job_id, **job_data)
            else:
                logger.error(f"Unknown job type for job {job_id}")

            job_queue.task_done()

        except Exception as e:
            logger.error(f"Error processing job: {e}", exc_info=True)
            job_queue.task_done()


# Start background worker thread
worker_thread = Thread(target=process_job_queue, daemon=True)
worker_thread.start()


# WebSocket progress tracking
async def handle_websocket_messages(websocket, job_id):
    """
    Handles WebSocket connections for real-time progress updates.
    """
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
    """
    WebSocket endpoint for real-time progress updates.
    """
    try:
        await handle_websocket_messages(websocket, job_id)
    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {str(e)}")
    finally:
        logger.info(f"WebSocket connection closed for job {job_id}")


# Single file processing implementation
def process_single_file_with_progress(job_id, filepath, temp_dir, job_description):
    """
    Process a single resume file with real-time progress updates.

    Args:
        job_id: Unique identifier for the job
        filepath: Path to the resume file
        temp_dir: Directory for temporary files
        job_description: Job description text
    """
    try:
        logger.info(f"Starting single file processing for job_id: {job_id}")

        def update_progress(progress, stage, message):
            """Update progress for the current job"""
            progress_data = {
                "status": "processing",
                "progress": progress,
                "stage": stage,
                "message": message,
            }
            job_progress[job_id] = progress_data
            logger.info(f"Updated progress for job {job_id}: {progress}% - {stage}")

        # Check if file exists
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        # Extract text from resume
        update_progress(10, "extracting", "Extracting text from resume...")

        # Analyze skills
        update_progress(30, "analyzing", "Analyzing resume skills...")

        # Parse job description
        update_progress(50, "parsing", "Parsing job description...")

        # Calculate match score
        update_progress(70, "matching", "Calculating match score...")

        # Generate recommendations
        update_progress(90, "finalizing", "Generating recommendations...")

        # Process the match
        result = matching_service.process_match(filepath, job_description)
        logger.info(f"Processed resume successfully for job {job_id}")

        # Store results
        with job_results_lock:
            job_results[job_id] = result

        # Clean up files
        file_handler.cleanup_temp_files(filepath, temp_dir)

        # Update final progress
        completion_data = {
            "status": "completed",
            "progress": 100,
            "stage": "complete",
            "message": "Processing complete!",
            "redirect_url": f"/results?id={job_id}",
        }
        job_progress[job_id] = completion_data
        logger.info(f"Job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}", exc_info=True)
        error_data = {
            "status": "error",
            "progress": 100,
            "stage": "error",
            "message": f"Error: {str(e)}",
        }
        job_progress[job_id] = error_data

        # Cleanup
        try:
            file_handler.cleanup_temp_files(filepath, temp_dir)
        except Exception as cleanup_error:
            logger.error(f"Error during cleanup: {str(cleanup_error)}")


# Batch processing implementation
def process_batch_with_progress(job_id, filepaths, temp_dirs, form_data):
    """
    Process multiple resume files with real-time progress updates.

    Args:
        job_id: Unique identifier for the job
        filepaths: List of paths to resume files
        temp_dirs: List of directories for temporary files
        form_data: Form data including job description
    """
    try:
        logger.info(f"Starting batch processing for job_id: {job_id}")

        def update_progress(progress, stage, message):
            """Update progress for the current job"""
            progress_data = {
                "status": "processing",
                "progress": progress,
                "stage": stage,
                "message": message,
            }
            job_progress[job_id] = progress_data
            logger.info(f"Updated progress for job {job_id}: {progress}% - {stage}")

        # File processing steps
        update_progress(10, "extracting", "Extracting text from resumes...")
        logger.info(f"Processing {len(filepaths)} files")

        # Validate files
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

        # Process files
        logger.info("Starting skill analysis")
        update_progress(40, "analyzing", "Analyzing skills and keywords...")

        logger.info("Starting score calculation")
        update_progress(70, "calculating", "Calculating match scores...")

        logger.info("Starting candidate ranking")
        update_progress(90, "ranking", "Ranking candidates...")

        # Process the batch match with the saved files
        job_description = form_data.get("job_description", "")
        results = batch_matching_service.process_batch_match(
            saved_files, job_description
        )
        logger.info(f"Processed {len(results)} candidates successfully")

        # Store results
        with job_results_lock:
            job_results[job_id] = results

        # Clean up files
        for filepath, temp_dir in zip(filepaths, temp_dirs):
            file_handler.cleanup_temp_files(filepath, temp_dir)

        # Update final progress
        completion_data = {
            "status": "completed",
            "progress": 100,
            "stage": "ranking",
            "message": "Processing complete!",
            "redirect_url": f"/batch-results?id={job_id}",
        }
        job_progress[job_id] = completion_data
        logger.info(f"Job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}", exc_info=True)
        error_data = {
            "status": "error",
            "progress": 100,
            "stage": "error",
            "message": f"Error: {str(e)}",
        }
        job_progress[job_id] = error_data

        # Cleanup
        for filepath, temp_dir in zip(filepaths, temp_dirs):
            try:
                file_handler.cleanup_temp_files(filepath, temp_dir)
            except Exception as cleanup_error:
                logger.error(f"Error during cleanup: {str(cleanup_error)}")


# API Routes
@app.route("/check-progress/<job_id>", methods=["GET"])
def check_progress(job_id):
    """Check the current progress of a job"""
    if job_id in job_progress:
        return jsonify(job_progress[job_id])
    return jsonify({"status": "not_found"}), 404


@app.route("/progress/<job_id>")
def progress(job_id):
    """
    Server-Sent Events endpoint for real-time progress updates.
    Alternative to WebSockets for clients that don't support them.
    """

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


@app.route("/upload", methods=["POST"])
def upload_file():
    """
    Handle single resume upload and processing.
    """
    try:
        job_id = str(uuid.uuid4())
        logger.info(f"Received single file upload request for job {job_id}")

        if "resume" not in request.files:
            return jsonify({"error": "No resume file uploaded"}), 400

        file = request.files["resume"]
        job_description = request.form.get("job_description", "")

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if job_description == "":
            return jsonify({"error": "No job description provided"}), 400

        # Create job directory
        job_dir = os.path.join(Config.UPLOAD_FOLDER, job_id)
        os.makedirs(job_dir, exist_ok=True)
        logger.info(f"Job directory created at: {job_dir}")

        # Save file
        secure_name = secure_filename(file.filename)
        filepath = os.path.join(job_dir, secure_name)
        file.save(filepath)
        logger.info(f"File saved to: {filepath}")

        # Initialize progress tracking
        job_progress[job_id] = {
            "status": "processing",
            "progress": 0,
            "stage": "extracting",
            "message": "Starting resume processing...",
        }

        # Add session tracking
        session["current_job"] = job_id
        session["upload_time"] = time.time()
        session["file_name"] = file.filename

        # Queue the job for processing
        job_data = {
            "filepath": filepath,
            "temp_dir": job_dir,
            "job_description": job_description,
        }
        job_queue.put((job_id, job_data))

        return jsonify({"success": True, "job_id": job_id}), 202

    except Exception as e:
        logger.error(f"Error in upload: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/batch-upload", methods=["POST"])
def batch_upload_files():
    """
    Handle multiple resume uploads and batch processing.
    """
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

        return jsonify({"job_id": job_id}), 202

    except Exception as e:
        logger.error(f"Error in batch upload: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/results/<job_id>", methods=["GET"])
def results(job_id):
    """
    Retrieve results for a single resume processing job.
    """
    try:
        # Log the current state
        logger.info(f"Retrieving results for job_id: {job_id}")
        logger.info(f"Available job_ids: {list(job_results.keys())}")

        results = job_results.get(job_id)
        if not results:
            logger.warning(f"No results found for job_id: {job_id}")
            # Check if the job is still processing
            if job_id in job_progress:
                progress_status = job_progress[job_id]
                if progress_status["status"] == "processing":
                    return (
                        jsonify(
                            {
                                "error": "Processing",
                                "message": "Results are still being processed",
                                "status": progress_status,
                            }
                        ),
                        202,
                    )

            return (
                jsonify(
                    {
                        "error": "Not found",
                        "message": "The requested results were not found or have expired",
                    }
                ),
                404,
            )

        # Return the results as JSON
        return jsonify({"result": results})

    except Exception as e:
        logger.error(f"Error retrieving results: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@app.route("/batch-results/<job_id>", methods=["GET"])
def batch_results(job_id):
    """
    Retrieve results for a batch processing job.
    """
    try:
        # Log the current state
        logger.info(f"Retrieving batch results for job_id: {job_id}")
        logger.info(f"Available job_ids: {list(job_results.keys())}")

        # Try to get results from our global dictionary
        results = job_results.get(job_id)
        if not results:
            logger.warning(f"No batch results found for job_id: {job_id}")
            # Check if the job is still processing
            if job_id in job_progress:
                progress_status = job_progress[job_id]
                if progress_status["status"] == "processing":
                    return (
                        jsonify(
                            {
                                "error": "Processing",
                                "message": "Results are still being processed",
                                "status": progress_status,
                            }
                        ),
                        202,
                    )

            return (
                jsonify(
                    {
                        "error": "Not found",
                        "message": "The requested batch results were not found or have expired",
                    }
                ),
                404,
            )

        # Log the results size
        logger.info(
            f"Found batch results for job_id {job_id}: {len(results)} candidates"
        )

        # Return the results as JSON
        return jsonify({"candidates": results})

    except Exception as e:
        logger.error(f"Error retrieving batch results: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@app.route("/cancel-job/<job_id>", methods=["POST"])
def cancel_job(job_id):
    """
    Cancel a running job.
    """
    try:
        logger.info(f"Received request to cancel job {job_id}")

        # Check if job exists
        if job_id not in job_progress:
            return jsonify({"error": "Job not found"}), 404

        # Check if job is already completed
        current_status = job_progress[job_id].get("status")
        if current_status in ["completed", "error"]:
            return jsonify({"message": f"Job already {current_status}"}), 200

        # Set cancellation event if job is using WebSockets
        if job_id in job_events:
            job_events[job_id].set()

        # Update job progress to cancelled
        job_progress[job_id] = {
            "status": "cancelled",
            "progress": 100,
            "stage": "cancelled",
            "message": "Job was cancelled by user",
        }

        logger.info(f"Job {job_id} has been cancelled")
        return jsonify({"success": True, "message": "Job cancelled successfully"}), 200

    except Exception as e:
        logger.error(f"Error cancelling job {job_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@app.route("/generate-document", methods=["POST"])
def generate_document():
    """
    Generate a document (PDF or DOCX) from provided text.
    """
    try:
        text = request.form.get("text", "")
        doc_type = request.form.get("type", "docx")

        if not text:
            return jsonify({"error": "No text provided"}), 400

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
        logger.error(f"Error generating document: {e}", exc_info=True)
        return jsonify({"error": "Failed to generate document", "message": str(e)}), 500


@app.route("/js/lib/<path:filename>")
def serve_js_lib(filename):
    """Serve static JavaScript library files."""
    return send_from_directory("static/js/lib", filename)


# Cleanup job to remove old results periodically
def cleanup_old_jobs():
    """
    Periodically clean up old job results to prevent memory leaks.
    This should be run in a separate thread.
    """
    while True:
        try:
            current_time = time.time()
            expiration_time = 3600  # 1 hour

            # Find expired jobs
            expired_jobs = []
            with job_results_lock:
                for job_id in list(job_results.keys()):
                    # Check if job has progress data with timestamp
                    if job_id in job_progress:
                        progress_data = job_progress[job_id]
                        if "timestamp" in progress_data:
                            job_time = progress_data["timestamp"]
                            if current_time - job_time > expiration_time:
                                expired_jobs.append(job_id)

            # Remove expired jobs
            for job_id in expired_jobs:
                with job_results_lock:
                    if job_id in job_results:
                        del job_results[job_id]
                    if job_id in job_progress:
                        del job_progress[job_id]
                logger.info(f"Cleaned up expired job {job_id}")

            # Sleep for a while before next cleanup
            time.sleep(300)  # Check every 5 minutes

        except Exception as e:
            logger.error(f"Error in cleanup job: {str(e)}", exc_info=True)
            time.sleep(60)  # Wait a bit before retrying


# Start cleanup thread
cleanup_thread = Thread(target=cleanup_old_jobs, daemon=True)
cleanup_thread.start()


# Error handlers
@app.errorhandler(500)
def handle_server_error(e):
    """Handle internal server errors."""
    logger.error(f"Server error: {str(e)}", exc_info=True)
    return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.errorhandler(413)
def handle_request_too_large(e):
    """Handle request entity too large errors."""
    logger.error(f"Request too large: {str(e)}")
    return (
        jsonify(
            {"error": "Request too large", "message": "The uploaded file is too large"}
        ),
        413,
    )


@app.route("/generate-interview-questions", methods=["POST"])
def generate_interview_questions():
    """
    Generate interview questions and answers based on job description skills
    """
    try:
        if not question_generator:
            return jsonify({"error": "Question generator service not available"}), 500

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        job_description = data.get("job_description", "")
        skills = data.get("skills", [])
        include_soft_skills = data.get("include_soft_skills", False)

        # Validate input - either job description or skills must be provided
        if not job_description and not skills:
            return jsonify({"error": "Job description or skills required"}), 400

        # If skills not provided but job description is, extract skills from job description
        if not skills and job_description:
            jd_data = jd_parser.process_job_description(job_description)
            skills = jd_data["skills"]
            logger.info(f"Extracted {len(skills)} skills from job description")

        # Generate technical questions
        technical_questions = question_generator.generate_questions(
            skills, job_description
        )
        logger.info(
            f"Generated {len(technical_questions)} technical interview questions"
        )

        # Get soft skill questions if requested
        soft_skill_questions = []
        if include_soft_skills:
            soft_skill_questions = question_generator.get_soft_skill_questions()
            logger.info(f"Added {len(soft_skill_questions)} soft skill questions")

        return jsonify(
            {
                "technical_questions": technical_questions,
                "soft_skill_questions": soft_skill_questions,
            }
        )

    except Exception as e:
        logger.error(f"Error generating interview questions: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Failed to generate questions", "message": str(e)}),
            500,
        )


if __name__ == "__main__":
    # Use Gunicorn or similar for production
    app.run(debug="True")
