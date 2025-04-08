import os

class Config:
    """Application configuration"""
    # File upload settings
    UPLOAD_FOLDER = "data/processed"
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max upload
    ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
    ALLOWED_MIMETYPES = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "txt": "text/plain",
    }
    
    # Paths
    SKILLS_DB_PATH = "data/technical_skills.json"
    
    # Matching weights
    SKILL_MATCH_WEIGHT = 0.6
    TEXT_SIMILARITY_WEIGHT = 0.2
    SEMANTIC_SIMILARITY_WEIGHT = 0.2
    
    # NLP settings
    NLP_MODEL = "en_core_web_md"
    MAX_TEXT_LENGTH = 100000
    
    # Ensure required directories exist
    @classmethod
    def init_app(cls):
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
