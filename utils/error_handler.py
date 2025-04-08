import logging
from flask import jsonify

logger = logging.getLogger(__name__)

class ErrorHandler:
    """Centralized error handling for the application"""
    
    @staticmethod
    def handle_file_upload_error(e, filepath=None, temp_dir=None, file_handler=None):
        """Handle errors during file upload"""
        logger.error(f"Error processing upload: {str(e)}", exc_info=True)
        
        # Clean up on error
        if file_handler and (filepath or temp_dir):
            file_handler.cleanup_temp_files(filepath, temp_dir)
        
        return jsonify({"error": "An error occurred while processing your request"}), 500
    
    @staticmethod
    def handle_request_too_large(error):
        """Handle request too large errors"""
        logger.warning("File too large error")
        return jsonify({"error": "File too large (max 5MB)"}), 413
    
    @staticmethod
    def handle_server_error(error):
        """Handle internal server errors"""
        logger.error(f"Internal server error: {error}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
