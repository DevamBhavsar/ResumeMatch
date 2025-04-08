import re
import spacy
import logging
from utils.skill_extractor import extract_skills

logger = logging.getLogger(__name__)

class JobDescriptionParser:
    def __init__(self, skills_db_path="data/technical_skills.json"):
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_md")
            # Initialize skill extractor
            self.skill_extractor = extract_skills
            logger.info("JobDescriptionParser initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing JobDescriptionParser: {e}")
            raise
        
    def preprocess_text(self, text):
        """Clean and preprocess the text"""
        try:
            # Remove URLs
            text = re.sub(r'http\S+|www\S+', '', text)
            # Convert to lowercase
            text = text.lower()
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        except Exception as e:
            logger.error(f"Error preprocessing text: {e}")
            return text
    
    def extract_skills(self, jd_text):
        """Extract skills from job description text"""
        try:
            return self.skill_extractor(jd_text)
        except Exception as e:
            logger.error(f"Error extracting skills: {e}")
            return []
    
    def extract_requirements(self, jd_text):
        """Extract requirements section from job description"""
        try:
            # Look for common requirement section headers
            req_patterns = [
                r"(?:requirements|qualifications|what you need|what you'll need|what we're looking for)"
                r"\s*(?::|\.|\n)?\s*(.*?)(?=(?:\n\s*\n|\n\s*[A-Z][A-Za-z\s]*:|$))",
            ]
            
            for pattern in req_patterns:
                requirements = re.search(pattern, jd_text, re.IGNORECASE | re.DOTALL)
                if requirements:
                    return requirements.group(1).strip()
            
            # If no specific requirements section found, return the entire text
            return jd_text
        except Exception as e:
            logger.error(f"Error extracting requirements: {e}")
            return jd_text
    
    def process_job_description(self, jd_text):
        """Process job description and extract information"""
        try:
            # Preprocess text
            processed_text = self.preprocess_text(jd_text)
            
            # Extract requirements section
            requirements = self.extract_requirements(processed_text)
            
            # Extract skills
            skills = self.extract_skills(processed_text)
            
            # Extract experience level indicators
            experience_level = self.extract_experience_level(processed_text)
            
            return {
                "text": processed_text,
                "requirements": requirements,
                "skills": skills,
                "experience_level": experience_level
            }
        except Exception as e:
            logger.error(f"Error processing job description: {e}")
            return {
                "text": jd_text,
                "requirements": "",
                "skills": [],
                "experience_level": "mid_level"  # Default
            }
    
    def extract_experience_level(self, text):
        """Extract experience level from job description"""
        try:
            experience_patterns = {
                "entry_level": r"\b(?:entry[\s-]level|junior|0-2 years|1-2 years|fresh graduate)\b",
                "mid_level": r"\b(?:mid[\s-]level|intermediate|2-5 years|3-5 years)\b",
                "senior": r"\b(?:senior|experienced|5\+ years|7\+ years|lead|principal)\b"
            }
            
            found_levels = {}
            for level, pattern in experience_patterns.items():
                if re.search(pattern, text, re.IGNORECASE):
                    found_levels[level] = True
            
            # Default to mid-level if nothing found
            if not found_levels:
                return "mid_level"
            
            # Return the highest level found
            if "senior" in found_levels:
                return "senior"
            elif "mid_level" in found_levels:
                return "mid_level"
            else:
                return "entry_level"
        except Exception as e:
            logger.error(f"Error extracting experience level: {e}")
            return "mid_level"  # Default
