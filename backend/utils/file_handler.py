import os
import tempfile
import shutil
import logging
from werkzeug.utils import secure_filename
import magic

logger = logging.getLogger(__name__)


class FileHandler:
    """Handles file operations for the application"""

    def __init__(self, config):
        self.config = config

    def allowed_file(self, filename):
        """Check if the file has an allowed extension"""
        return (
            "." in filename
            and filename.rsplit(".", 1)[1].lower() in self.config.ALLOWED_EXTENSIONS
        )

    def validate_file_content(self, file_path, expected_extension):
        """Validate file content matches its extension"""
        try:
            mime = magic.Magic(mime=True)
            file_mime = mime.from_file(file_path)
            expected_mime = self.config.ALLOWED_MIMETYPES.get(expected_extension)

            if expected_mime and file_mime.startswith(expected_mime):
                return True
            logger.warning(
                f"File content validation failed: {file_path} has MIME {file_mime}, expected {expected_mime}"
            )
            return False
        except Exception as e:
            logger.error(f"Error validating file content: {e}")
            return False

    def secure_temp_file(self, file):
        """Create a secure temporary file with a unique name"""
        try:
            # Get secure filename
            filename = secure_filename(file.filename)

            # Create a temporary directory
            temp_dir = tempfile.mkdtemp(dir=self.config.UPLOAD_FOLDER)
            filepath = os.path.join(temp_dir, filename)

            return filepath, temp_dir
        except Exception as e:
            logger.error(f"Error creating secure temp file: {e}")
            raise

    def cleanup_temp_files(self, filepath, temp_dir):
        """Safely clean up temporary files"""
        try:
            if filepath and os.path.exists(filepath):
                os.remove(filepath)
                logger.debug(f"Removed temporary file: {filepath}")

            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
                logger.debug(f"Removed temporary directory: {temp_dir}")
        except Exception as e:
            logger.error(f"Error cleaning up temporary files: {e}")
