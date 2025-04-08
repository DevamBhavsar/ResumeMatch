import os
import re
import PyPDF2
from docx import Document
import spacy
import logging
from utils.skill_extractor import extract_skills

logger = logging.getLogger(__name__)


class ResumeParser:
    def __init__(self, skills_db_path="data/technical_skills.json"):
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_md")
            # Initialize skill extractor
            self.skill_extractor = extract_skills
            self.skills_db_path = skills_db_path
            logger.info("ResumeParser initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ResumeParser: {e}")
            raise

    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF file"""
        try:
            text = ""
            with open(pdf_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num in range(len(pdf_reader.pages)):
                    text += pdf_reader.pages[page_num].extract_text()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return ""

    def extract_text_from_docx(self, docx_path):
        """Extract text from DOCX file"""
        try:
            doc = Document(docx_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            return ""

    def extract_text(self, file_path):
        """Extract text from various file formats"""
        try:
            if file_path.endswith(".pdf"):
                return self.extract_text_from_pdf(file_path)
            elif file_path.endswith(".docx"):
                return self.extract_text_from_docx(file_path)
            elif file_path.endswith(".txt"):
                with open(file_path, "r", encoding="utf-8", errors="replace") as file:
                    return file.read()
            else:
                raise ValueError("Unsupported file format")
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return ""

    def get_skills(self, resume_text):
        """Extract skills from resume text"""
        try:
            return self.skill_extractor(resume_text)
        except Exception as e:
            logger.error(f"Error extracting skills: {e}")
            return []

    def preprocess_text(self, text):
        """Clean and preprocess the text"""
        try:
            # Remove email addresses
            text = re.sub(r"\S+@\S+", "", text)
            # Remove URLs
            text = re.sub(r"http\S+|www\S+", "", text)
            # Remove phone numbers
            text = re.sub(
                r"\+?[0-9]?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{4}", "", text
            )
            # Convert to lowercase
            text = text.lower()
            # Remove extra whitespace
            text = re.sub(r"\s+", " ", text).strip()
            return text
        except Exception as e:
            logger.error(f"Error preprocessing text: {e}")
            return text

    def extract_contact_info(self, text):
        """Extract contact information from resume text"""
        try:
            doc = self.nlp(
                text[:100000] if len(text) > 100000 else text
            )  # Limit text size

            # Initialize contact info dictionary
            contact_info = {"name": "", "email": "", "phone": "", "location": ""}

            # Extract email using regex
            email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
            emails = re.findall(email_pattern, text)
            if emails:
                contact_info["email"] = emails[0]

            # Extract phone using regex
            phone_pattern = r"\+?[0-9]?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{4}"
            phones = re.findall(phone_pattern, text)
            if phones:
                contact_info["phone"] = phones[0]

            # Extract name and location using NER
            for ent in doc.ents:
                if ent.label_ == "PERSON" and not contact_info["name"]:
                    contact_info["name"] = ent.text
                elif ent.label_ == "GPE" and not contact_info["location"]:
                    contact_info["location"] = ent.text

            return contact_info
        except Exception as e:
            logger.error(f"Error extracting contact info: {e}")
            return {"name": "", "email": "", "phone": "", "location": ""}

    def extract_work_experience(self, text):
        """Extract work experience from resume text"""
        try:
            # Simple extraction based on common patterns
            experience_entries = []

            # Look for common job title patterns
            job_title_pattern = r"((?:Senior|Junior|Lead)?\s?[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:Developer|Engineer|Manager|Analyst|Designer|Consultant|Specialist))"
            job_titles = re.findall(job_title_pattern, text)

            # Look for date patterns
            date_pattern = r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}\s*(?:-|–|to)\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}\s*(?:-|–|to)\s*(?:Present|Current))"
            dates = re.findall(date_pattern, text)

            # Create experience entries from the extracted information
            for i in range(min(len(job_titles), len(dates))):
                experience_entries.append(
                    {
                        "title": job_titles[i],
                        "date_range": dates[i],
                        "description": "",  # Would need more complex parsing for descriptions
                    }
                )

            return experience_entries
        except Exception as e:
            logger.error(f"Error extracting work experience: {e}")
            return []

    def extract_education(self, text):
        """Extract education information from resume text"""
        try:
            education_entries = []

            # Look for degree patterns
            degree_pattern = r"((?:Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|M\.B\.A\.|Ph\.D)\.?\s(?:of|in)?\s?(?:Science|Arts|Engineering|Business|Computer Science|Information Technology|Mathematics|Physics|Chemistry|Biology))"
            degrees = re.findall(degree_pattern, text)

            # Look for university patterns
            university_pattern = (
                r"((?:University|College|Institute|School)\s(?:of)?\s[A-Za-z\s]+)"
            )
            universities = re.findall(university_pattern, text)

            # Create education entries
            for i in range(min(len(degrees), len(universities))):
                education_entries.append(
                    {
                        "degree": degrees[i],
                        "institution": universities[i],
                        "date": "",  # Would need more parsing for dates
                    }
                )

            return education_entries
        except Exception as e:
            logger.error(f"Error extracting education: {e}")
            return []

    def extract_projects(self, text):
        """Extract project information from resume text"""
        try:
            # Simple extraction of project names
            project_pattern = r"(?:Project|PROJECT):\s*([A-Za-z0-9\s]+)"
            projects = re.findall(project_pattern, text)

            project_entries = []
            for project in projects:
                project_entries.append(
                    {
                        "name": project.strip(),
                        "description": "",  # Would need more complex parsing for descriptions
                    }
                )

            return project_entries
        except Exception as e:
            logger.error(f"Error extracting projects: {e}")
            return []

    def process_resume(self, file_path):
        """Process resume file and extract information"""
        try:
            # Extract text
            text = self.extract_text(file_path)
            if not text:
                logger.warning(f"No text extracted from file: {file_path}")
                return {
                    "text": "",
                    "skills": [],
                    "contact_info": {},
                    "experience": [],
                    "education": [],
                    "projects": [],
                }

            # Preprocess text
            processed_text = self.preprocess_text(text)

            # Extract information
            skills = self.get_skills(processed_text)
            contact_info = self.extract_contact_info(
                text
            )  # Use original text for contact info
            experience = self.extract_work_experience(text)
            education = self.extract_education(text)
            projects = self.extract_projects(text)

            logger.info(f"Resume processed successfully: {len(skills)} skills found")

            # Return a consistent structure that matches what matcher.py expects
            return {
                "text": processed_text,
                "skills": skills,
                "contact_info": contact_info,
                "experience": experience,
                "education": education,
                "projects": projects,
                "requirements": "",  # Add empty fields for consistency
                "experience_level": "",
            }
        except Exception as e:
            logger.error(f"Error processing resume: {e}")
            return {
                "text": "",
                "skills": [],
                "contact_info": {},
                "experience": [],
                "education": [],
                "projects": [],
            }
