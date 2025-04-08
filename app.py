# import os
# import re
# import json
# import torch
# import fitz  # PyMuPDF
# import pandas as pd
# from pathlib import Path
# from typing import Dict, List, Any, Tuple
# from transformers import (
#     RobertaTokenizer,
#     RobertaForTokenClassification,
#     RobertaForSequenceClassification,
#     pipeline,
# )
# from sklearn.metrics import classification_report
# import nltk
# from nltk.tokenize import sent_tokenize
# import spacy
# import logging

# # Setup logging
# logging.basicConfig(
#     level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
# )
# logger = logging.getLogger(__name__)


# class ResumeParser:
#     """
#     A comprehensive resume parser using transformer models to extract
#     structured information from resume documents.
#     """

#     def __init__(
#         self, model_dir: str = "resume_parser_models", patterns_json: str = None
#     ):
#         """Initialize with option to pass patterns as string"""
#         if patterns_json:
#             self.patterns = json.loads(patterns_json)
#         else:
#             try:
#                 with open("pattern.json", "r") as f:
#                     self.patterns = json.load(f)
#             except FileNotFoundError:
#                 logger.error("Pattern file not found, using default patterns")
#         self.model_dir = Path(model_dir)
#         self.model_dir.mkdir(exist_ok=True)

#         # Define entity types for resume parsing
#         self.entity_types = [
#             "PERSON",
#             "ORGANIZATION",
#             "DATE",
#             "JOB_TITLE",
#             "EDUCATION_DEGREE",
#             "SKILL",
#             "LOCATION",
#             "EMAIL",
#             "PHONE",
#             "CERTIFICATION",
#             "PROJECT",
#         ]

#         # Define resume sections
#         self.resume_sections = [
#             "HEADER",
#             "SUMMARY",
#             "EXPERIENCE",
#             "EDUCATION",
#             "SKILLS",
#             "CERTIFICATIONS",
#             "PROJECTS",
#             "PUBLICATIONS",
#             "REFERENCES",
#             "OTHER",
#         ]

#         # Initialize NLP components
#         logger.info("Loading NLP components...")

#         # Download necessary NLTK data
#         try:
#             nltk.data.find("tokenizers/punkt")
#         except LookupError:
#             nltk.download("punkt")

#         # Load spaCy for additional NLP tasks
#         try:
#             self.nlp = spacy.load("en_core_web_trf")
#         except OSError:
#             logger.info("Downloading spaCy model...")
#             os.system("python -m spacy download en_core_web_trf")
#             self.nlp = spacy.load("en_core_web_trf")

#         # Load models
#         self._load_models()

#     def _load_models(self):
#         """Load or download the required transformer models."""

#         # 1. Entity recognition model
#         entity_model_path = self.model_dir / "entity_model"
#         if entity_model_path.exists():
#             self.entity_tokenizer = RobertaTokenizer.from_pretrained(entity_model_path)
#             self.entity_model = RobertaForTokenClassification.from_pretrained(
#                 entity_model_path
#             )
#         else:
#             logger.info("Downloading entity recognition model...")
#             self.entity_tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
#             self.entity_model = RobertaForTokenClassification.from_pretrained(
#                 "roberta-base",
#                 num_labels=len(self.entity_types) + 1,  # +1 for "O" (outside)
#             )
#             # In a real implementation, you would fine-tune this model on resume data

#         # 2. Section classification model
#         section_model_path = self.model_dir / "section_model"
#         if section_model_path.exists():
#             self.section_tokenizer = RobertaTokenizer.from_pretrained(
#                 section_model_path
#             )
#             self.section_model = RobertaForSequenceClassification.from_pretrained(
#                 section_model_path
#             )
#         else:
#             logger.info("Downloading section classification model...")
#             self.section_tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
#             self.section_model = RobertaForSequenceClassification.from_pretrained(
#                 "roberta-base", num_labels=len(self.resume_sections)
#             )
#             # In a real implementation, you would fine-tune this model on resume data

#         # Create pipelines for easier inference
#         self.ner_pipeline = pipeline(
#             "token-classification",
#             model=self.entity_model,
#             tokenizer=self.entity_tokenizer,
#             aggregation_strategy="simple",
#         )

#         self.section_pipeline = pipeline(
#             "text-classification",
#             model=self.section_model,
#             tokenizer=self.section_tokenizer,
#         )

#         logger.info("Models loaded successfully")

#     def _extract_text_from_pdf(self, file_path: str) -> str:
#         """
#         Extract text content from a PDF file.

#         Args:
#             file_path: Path to the PDF file

#         Returns:
#             Extracted text content
#         """
#         try:
#             doc = fitz.open(file_path)
#             text = ""
#             for page in doc:
#                 text += page.get_text()
#             return text
#         except Exception as e:
#             logger.error(f"Error extracting text from PDF: {e}")
#             return ""

#     def _preprocess_text(self, text: str) -> str:
#         """
#         Clean and preprocess the extracted text.

#         Args:
#             text: Raw text from resume

#         Returns:
#             Preprocessed text
#         """
#         # Remove excessive whitespace
#         text = re.sub(r"\s+", " ", text)

#         # Fix common OCR and formatting issues
#         text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)  # Fix missing spaces

#         # Remove special characters but keep important ones
#         text = re.sub(r"[^\w\s@.,:;()\-/]", "", text)

#         return text.strip()

#     def _segment_into_sections(self, text: str) -> Dict[str, str]:
#         """Improved section segmentation using pattern matching"""
#         logger.info("Segmenting text into sections...")
#         sections = {}

#         # Convert section header patterns from your JSON into compiled regex
#         section_patterns = {}
#         for section_name, pattern in self.patterns["section_headers"].items():
#             section_patterns[section_name.upper()] = re.compile(pattern)

#         # Split text into lines and identify sections
#         lines = text.split("\n")
#         current_section = "HEADER"
#         current_content = []

#         for line in lines:
#             line_matched = False
#             for section, pattern in section_patterns.items():
#                 if pattern.search(line):
#                     # Save previous section content
#                     if current_content:
#                         sections[current_section] = "\n".join(current_content)
#                     # Start new section
#                     current_section = section.upper()
#                     current_content = []
#                     line_matched = True
#                     logger.info(f"Found section: {current_section}")
#                     break

#             if not line_matched:
#                 current_content.append(line)

#         # Add the last section
#         if current_content:
#             sections[current_section] = "\n".join(current_content)

#         return sections

#     def _extract_entities(self, text: str) -> List[Dict[str, Any]]:
#         """
#         Extract named entities from text using the entity recognition model.

#         Args:
#             text: Text to extract entities from

#         Returns:
#             List of extracted entities with their types and positions
#         """
#         # Break text into chunks if needed (for long text)
#         max_length = 512  # Model's max sequence length
#         sentences = sent_tokenize(text)

#         all_entities = []
#         for sentence in sentences:
#             # Use max_length to chunk long sentences if needed
#             if len(sentence) > max_length:
#                 chunks = [
#                     sentence[i : i + max_length]
#                     for i in range(0, len(sentence), max_length)
#                 ]
#                 for chunk in chunks:
#                     entities = self.ner_pipeline(chunk)
#                     all_entities.extend(entities)
#             else:
#                 entities = self.ner_pipeline(sentence)
#                 all_entities.extend(entities)

#             return all_entities

#     def _extract_skills(self, text: str) -> List[str]:
#         """
#         Extract skills using keyword taxonomy from keywords.json

#         Args:
#             text: Text to extract skills from

#         Returns:
#             List of identified skills
#         """
#         # Load keywords taxonomy
#         with open("keywords.json", "r") as f:
#             categories = json.load(f)

#         # Create a master list of all keywords across categories
#         all_keywords = set()
#         for category in categories:
#             all_keywords.update(category["keywords"])

#         # Extract skills using the comprehensive keyword list
#         found_skills = []
#         text_lower = text.lower()

#         for keyword in all_keywords:
#             if keyword.lower() in text_lower:
#                 found_skills.append(keyword)

#         # Use spaCy for additional entity recognition
#         doc = self.nlp(text)
#         skill_entities = [ent.text for ent in doc.ents if ent.label_ == "SKILL"]

#         # Combine and deduplicate
#         all_skills = list(set(found_skills + skill_entities))

#         return all_skills

    
#     def parse_resume(self, file_path: str) -> Dict[str, Any]:
#         """Parse a resume file with better error handling and complete processing"""
#         try:
#             logger.info(f"Parsing resume: {file_path}")

#             # Extract and preprocess text
#             raw_text = self._extract_text_from_pdf(file_path)
#             if not raw_text:
#                 return {"error": "Failed to extract text from file", "skills": []}

#             text = self._preprocess_text(raw_text)
#             logger.info(f"Extracted {len(text)} characters of text")

#             # Segment into sections
#             sections = self._segment_into_sections(text)
#             logger.info(f"Found {len(sections)} sections: {list(sections.keys())}")

#             # Initialize result dictionary with a fallback for skills
#             result = {"skills": []}

#             # Process each section with proper error handling
#             if "HEADER" in sections:
#                 try:
#                     result["contact_info"] = self._extract_contact_info(
#                         sections["HEADER"]
#                     )
#                 except Exception as e:
#                     logger.error(f"Error extracting contact info: {e}")
#                     result["contact_info"] = {}

#             if "SUMMARY" in sections:
#                 result["summary"] = sections["SUMMARY"].strip()

#             if "EXPERIENCE" in sections:
#                 try:
#                     result["work_experience"] = self._extract_work_experience(
#                         sections["EXPERIENCE"]
#                     )
#                 except Exception as e:
#                     logger.error(f"Error extracting work experience: {e}")
#                     result["work_experience"] = []

#             if "EDUCATION" in sections:
#                 try:
#                     result["education"] = self._extract_education(sections["EDUCATION"])
#                 except Exception as e:
#                     logger.error(f"Error extracting education: {e}")
#                     result["education"] = []

#             # Always extract skills from entire document
#             try:
#                 result["skills"] = self._extract_skills(text)
#             except Exception as e:
#                 logger.error(f"Error extracting skills: {e}")
#                 result["skills"] = []

#             if "PROJECTS" in sections:
#                 try:
#                     result["projects"] = self._extract_projects(sections["PROJECTS"])
#                 except Exception as e:
#                     logger.error(f"Error extracting projects: {e}")
#                     result["projects"] = []

#             logger.info("Resume parsing completed successfully")
#             return result
#         except Exception as e:
#             logger.error(f"Error parsing resume: {e}")
#             return {"error": str(e), "skills": []}

#     def parse_to_json(self, file_path: str, output_path: str = None) -> str:
#         """
#         Parse resume and save results to JSON file.

#         Args:
#             file_path: Path to resume file
#             output_path: Path to save JSON output (optional)

#         Returns:
#             JSON string of parsed data
#         """
#         parsed_data = self.parse_resume(file_path)
#         json_data = json.dumps(parsed_data, indent=2)

#         if output_path:
#             with open(output_path, "w") as f:
#                 f.write(json_data)
#             logger.info(f"Saved parsed resume to {output_path}")

#         return json_data


# # Example usage
# if __name__ == "__main__":
#     parser = ResumeParser()
#     parser.parse_to_json("/home/devam/NLP/DevamBhavsar_Resume.pdf", "output.json")
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
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'data/processed'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max upload
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx', 'txt'}
app.config['ALLOWED_MIMETYPES'] = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain'
}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def validate_file_content(file_path, expected_extension):
    """Validate file content matches its extension"""
    try:
        mime = magic.Magic(mime=True)
        file_mime = mime.from_file(file_path)
        expected_mime = app.config['ALLOWED_MIMETYPES'].get(expected_extension)
        
        if expected_mime and file_mime.startswith(expected_mime):
            return True
        logger.warning(f"File content validation failed: {file_path} has MIME {file_mime}, expected {expected_mime}")
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
        temp_dir = tempfile.mkdtemp(dir=app.config['UPLOAD_FOLDER'])
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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    temp_dir = None
    filepath = None
    
    try:
        if 'resume' not in request.files:
            logger.warning("No resume file in request")
            return jsonify({'error': 'No resume file uploaded'}), 400
        
        file = request.files['resume']
        job_description = request.form.get('job_description', '')
        
        if file.filename == '':
            logger.warning("Empty filename submitted")
            return jsonify({'error': 'No file selected'}), 400
        
        if job_description == '':
            logger.warning("Empty job description submitted")
            return jsonify({'error': 'No job description provided'}), 400
        
        # Check allowed file extensions
        if not allowed_file(file.filename):
            logger.warning(f"Unsupported file type: {file.filename}")
            return jsonify({'error': 'File type not supported'}), 400
        
        # Create secure temporary file
        filepath, temp_dir = secure_temp_file(file)
        
        # Save the file
        file.save(filepath)
        logger.info(f"File saved temporarily: {filepath}")
        
        # Validate file content
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        if not validate_file_content(filepath, file_ext):
            cleanup_temp_files(filepath, temp_dir)
            return jsonify({'error': 'Invalid file content'}), 400
        
        # Parse resume
        resume_data = resume_parser.process_resume(filepath)
        logger.info(f"Resume processed successfully: {len(resume_data['skills'])} skills found")
        
        # Parse job description
        jd_data = jd_parser.process_job_description(job_description)
        logger.info(f"Job description processed successfully: {len(jd_data['skills'])} skills found")
        
        # Calculate matching score
        result = matcher.get_matching_score(resume_data, jd_data)
        logger.info(f"Match score calculated: {result['overall_score']}%")
        
        # Clean up temporary files
        cleanup_temp_files(filepath, temp_dir)
        
        return render_template('results.html', result=result)
    
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}", exc_info=True)
        
        # Clean up on error
        if filepath or temp_dir:
            cleanup_temp_files(filepath, temp_dir)
        
        return jsonify({'error': 'An error occurred while processing your request'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    logger.warning("File too large error")
    return jsonify({'error': 'File too large (max 5MB)'}), 413

@app.errorhandler(500)
def internal_server_error(error):
    logger.error(f"Internal server error: {error}", exc_info=True)
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
