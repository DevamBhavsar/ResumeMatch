import logging
import os
from flask import Flask, jsonify,session,render_template, request, jsonify, send_from_directory, send_file, Response
import json
import time
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
import threading
import time
from queue import Queue
from threading import Thread, Lock
from flask_sock import Sock
import queue
import asyncio
# Remove werkzeug.exceptions import and use built-in ConnectionError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)
processing_status = {}
job_progress = {}
job_results = {}
job_results_lock = Lock()

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
    batch_matching_service = BatchMatchingService(resume_parser, jd_parser, matcher)
    logger.info("Initialized application components successfully")
except Exception as e:
    logger.error(f"Error initializing components: {e}")
    raise

sock = Sock(app)
progress_queues = {}

@sock.route('/ws/progress/<job_id>')
def ws_progress(ws, job_id):
    try:
        q = queue.Queue()
        progress_queues[job_id] = q
        
        # Send initial connection confirmation
        ws.send(json.dumps({"status": "connected", "job_id": job_id}))
        
        while True:
            try:
                progress_data = q.get(timeout=30)
                
                # Check if connection is still alive
                try:
                    ws.send(json.dumps(progress_data))
                except ConnectionError:
                    logger.warning(f"WebSocket connection lost for job {job_id}")
                    break
                    
                if progress_data['status'] in ['completed', 'error']:
                    break
                    
            except queue.Empty:
                try:
                    # Send heartbeat with timestamp
                    ws.send(json.dumps({
                        "type": "heartbeat",
                        "timestamp": time.time()
                    }))
                except ConnectionError:
                    logger.warning(f"WebSocket heartbeat failed for job {job_id}")
                    break
                
    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {str(e)}")
    finally:
        # Cleanup
        if job_id in progress_queues:
            progress_queues.pop(job_id, None)
        logger.info(f"WebSocket connection closed for job {job_id}")

@app.route('/check-progress/<job_id>', methods=['GET'])
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

@app.route('/progress/<job_id>')
def progress(job_id):
    def generate():
        try:
            last_progress = 0
            last_update = time.time()
            
            while True:
                if job_id in job_progress:
                    progress_data = job_progress[job_id]
                    current_progress = progress_data.get('progress', 0)
                    
                    # Only send update if progress changed significantly or enough time passed
                    if (current_progress - last_progress >= 5 or 
                        time.time() - last_update >= 0.5):
                        
                        yield f"data: {json.dumps(progress_data)}\n\n"
                        last_progress = current_progress
                        last_update = time.time()
                    
                    if progress_data['status'] in ['completed', 'error']:
                        break
                
                time.sleep(0.1)
                
        except GeneratorExit:
            logger.info(f"Client closed connection for job {job_id}")
    
    response = Response(generate(), mimetype='text/event-stream')
    response.headers.update({
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    })
    return response

@app.route("/batch-upload", methods=["POST"])
def batch_upload_files():
    try:
        job_id = str(uuid.uuid4())
        temp_dirs = []
        filepaths = []
        
        logger.info(f"Starting batch upload for job_id: {job_id}")
        
        # Save files first before starting background process
        for file in request.files.getlist('resumes'):
            try:
                logger.info(f"Processing file: {file.filename}")
                filepath, temp_dir = file_handler.secure_temp_file(file)
                filepaths.append(filepath)
                temp_dirs.append(temp_dir)
                file.save(filepath)
                logger.info(f"File saved successfully: {filepath}")
            except Exception as e:
                logger.error(f"Error saving file {file.filename}: {str(e)}")
                # Cleanup any files that were saved
                for fp, td in zip(filepaths, temp_dirs):
                    file_handler.cleanup_temp_files(fp, td)
                raise
        
        # Initialize progress tracking
        job_progress[job_id] = {
            "status": "processing",
            "progress": 0,
            "stage": "extracting",
            "message": "Starting batch processing..."
        }
        
        # Pass saved filepaths to background thread
        thread = Thread(
            target=process_files_with_progress,
            args=(job_id, filepaths, temp_dirs, request.form)
        )
        thread.daemon = True
        thread.start()
        
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
                "message": message
            }
            
            # Update progress in shared dict
            job_progress[job_id] = progress_data
            
            # Send to WebSocket if available
            if job_id in progress_queues:
                progress_queues[job_id].put(progress_data)

        # File processing steps
        update_progress(10, "extracting", "Extracting text from resumes...")
        logger.info(f"Processing {len(filepaths)} files")
        
        # Process files using saved filepaths
        update_progress(40, "analyzing", "Analyzing skills and keywords...")
        logger.info("Starting skill analysis")
        
        update_progress(70, "calculating", "Calculating match scores...")
        logger.info("Starting score calculation")
        
        update_progress(90, "ranking", "Ranking candidates...")
        logger.info("Starting candidate ranking")
        
        results = batch_matching_service.process_batch_match(filepaths,form_data['job_description'])
        
        logger.info(f"Processed {len(results)} candidates successfully")
        
        # Store results in global dictionary instead of session
        with job_results_lock:
            job_results[job_id] = results
        
        # Clean up files
        for filepath, temp_dir in zip(filepaths, temp_dirs):
            file_handler.cleanup_temp_files(filepath, temp_dir)
        
        logger.info(f"Job {job_id} completed successfully")
        job_progress[job_id] = {
            "status": "completed",
            "progress": 100,
            "redirect_url": f"/batch-results/{job_id}"
        }

    except Exception as e:
        error_data = {
            "status": "error",
            "message": str(e)
        }
        job_progress[job_id] = error_data
        if job_id in progress_queues:
            progress_queues[job_id].put(error_data)
        
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
        
    return render_template("batch_results.html", results=results)

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
