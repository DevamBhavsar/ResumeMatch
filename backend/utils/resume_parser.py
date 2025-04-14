import os
import re
import PyPDF2
from docx import Document
import spacy
import logging
import tempfile
from utils.skill_extractor import extract_skills

logger = logging.getLogger(__name__)


class ResumeParser:

    def __init__(self, skills_db_path="backend / data / technical_skills.json"):
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

    def extract_text(self, file_obj):
        """Extract text from various file formats"""
        try:
            # Handle both filepath strings and FileStorage objects
            if hasattr(file_obj, "filename"):
                # Create temp file from FileStorage
                temp_fd, temp_path = tempfile.mkstemp(
                    suffix=os.path.splitext(file_obj.filename)[1]
                )
                try:
                    with os.fdopen(temp_fd, "wb") as temp_file:
                        file_obj.save(temp_file)

                    # Log the temp file path for debugging
                    logger.info(f"Created temporary file at: {temp_path}")

                    # Extract text based on file type
                    if file_obj.filename.lower().endswith(".pdf"):
                        text = self.extract_text_from_pdf(temp_path)
                    elif file_obj.filename.lower().endswith(".docx"):
                        text = self.extract_text_from_docx(temp_path)
                    elif file_obj.filename.lower().endswith(".txt"):
                        with open(
                            temp_path, "r", encoding="utf-8", errors="replace"
                        ) as f:
                            text = f.read()
                    else:
                        raise ValueError("Unsupported file format")

                    return text
                finally:
                    # Always cleanup temp file
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                        logger.info(f"Removed temporary file: {temp_path}")
            else:
                # Handle direct file paths
                file_path = str(file_obj)
                logger.info(f"Processing file path: {file_path}")

                # Check if file exists
                if not os.path.exists(file_path):
                    logger.error(f"File does not exist: {file_path}")
                    raise FileNotFoundError(f"File not found: {file_path}")

                if file_path.lower().endswith(".pdf"):
                    return self.extract_text_from_pdf(file_path)
                elif file_path.lower().endswith(".docx"):
                    return self.extract_text_from_docx(file_path)
                elif file_path.lower().endswith(".txt"):
                    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                        return f.read()
                else:
                    raise ValueError(f"Unsupported file format: {file_path}")
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            raise ValueError(f"Could not extract text from file: {str(e)}")

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

    def normalize_job_title(self, title):
        """Normalize job titles by removing noise and standardizing format"""
        try:
            # Remove common noise words
            noise_words = ["professional", "summary", "motivated", "\n", "•"]
            title = " ".join(
                word for word in title.split() if word.lower() not in noise_words
            )

            # Capitalize first letter of each word
            title = " ".join(word.capitalize() for word in title.split())

            return title.strip()
        except Exception as e:
            logger.error(f"Error normalizing job title: {e}")
            return title

    def clean_company_name(self, company):
        """Clean company name by removing education-related terms and noise"""
        noise_terms = [
            "education",
            "university",
            "college",
            "institute",
            "\n",
            "•",
            "relevant coursework",
        ]
        company = " ".join(
            word
            for word in company.split()
            if not any(term.lower() in word.lower() for term in noise_terms)
        )
        return company.strip()

    def extract_work_experience(self, text):
        """Extract work experience from resume text"""
        try:
            doc = self.nlp(text)
            experience_entries = []
            seen_companies = set()

            # Enhanced job title pattern with common variations
            job_title_pattern = r"(?i)((?:senior|junior|lead|principal|staff)?\s*(?:software|systems?|data|cloud|devops|full[\s-]stack|front[\s-]end|back[\s-]end)?\s*(?:developer|engineer|architect|manager|analyst|scientist|consultant|specialist|admin|lead)(?:\s*[IV]{1,3})?)"

            # Date pattern for work experience
            date_pattern = r"(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+\d{4}\s*(?:-|–|to)\s*(?:present|current|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+\d{4}))"

            # Find company mentions
            for ent in doc.ents:
                if ent.label_ == "ORG":
                    company = self.clean_company_name(ent.text)

                    # Skip if empty after cleaning or already processed
                    if not company or company in seen_companies:
                        continue

                    # Skip if it looks like an education entry
                    if any(
                        edu_term in company.lower()
                        for edu_term in ["university", "college", "institute", "school"]
                    ):
                        continue

                    context_window = text[
                        max(0, ent.start_char - 150) : min(
                            len(text), ent.end_char + 150
                        )
                    ]

                    titles = re.findall(job_title_pattern, context_window)
                    dates = re.findall(date_pattern, context_window, re.IGNORECASE)

                    if titles and dates:
                        experience_entries.append(
                            {
                                "company": company,
                                "title": self.normalize_job_title(titles[0]),
                                "date_range": dates[0],
                                "description": self._extract_description(
                                    context_window
                                ),
                            }
                        )
                        seen_companies.add(company)

            return [
                entry
                for entry in experience_entries
                if entry["company"] and entry["title"]
            ]
        except Exception as e:
            logger.error(f"Error extracting work experience: {e}")
            return []

    def _extract_description(self, text, max_length=200):
        """Extract a meaningful description from the context"""
        try:
            # Look for bullet points or sentences
            desc_pattern = r"[•\-\*]([^•\-\*\n]{10,})|(?<=\n)([^•\-\*\n]{10,})"
            descriptions = re.findall(desc_pattern, text)

            if descriptions:
                # Flatten and clean the descriptions
                descriptions = [d[0] or d[1] for d in descriptions]
                description = " ".join(
                    desc.strip() for desc in descriptions[:2]
                )  # Take first 2 points
                return description[:max_length].strip()
            return ""
        except Exception:
            return ""

    def extract_education(self, text):
        """Extract education information from resume text"""
        try:
            doc = self.nlp(text)
            education_entries = []
            seen_institutions = set()

            # Education keywords to validate institutions
            edu_keywords = ["university", "college", "institute", "school"]

            # Comprehensive degree pattern
            degree_pattern = r"(?i)(?:bachelor(?:'s|s)?|master(?:'s|s)?|phd|doctorate|b\.?(?:tech|e|s|a)|m\.?(?:tech|e|s|a)|ph\.?d)\.?\s+(?:of|in|degree\s+in)?\s*(?:science|engineering|technology|computer|information|business|[a-z\s]+)?"

            # GPA pattern
            gpa_pattern = r"(?i)(?:cgpa|gpa)[:\s]*([0-9]+(?:\.[0-9]+)?)"

            for ent in doc.ents:
                if ent.label_ == "ORG":
                    institution = ent.text.strip()

                    # Validate if it's actually an educational institution
                    if not any(
                        keyword in institution.lower() for keyword in edu_keywords
                    ):
                        continue

                    if institution in seen_institutions:
                        continue

                    context_window = text[
                        max(0, ent.start_char - 200) : min(
                            len(text), ent.end_char + 200
                        )
                    ]

                    # Extract degree
                    degree_matches = re.findall(degree_pattern, context_window)
                    degree = degree_matches[0] if degree_matches else ""

                    # Extract dates
                    date_matches = re.findall(
                        r"20\d{2}\s*(?:-|–|to)\s*(?:20\d{2}|present)", context_window
                    )
                    date = date_matches[0] if date_matches else ""

                    # Extract GPA
                    gpa_matches = re.search(gpa_pattern, context_window)
                    gpa = gpa_matches.group(1) if gpa_matches else ""

                    if degree:  # Only add if we found a valid degree
                        education_entries.append(
                            {
                                "institution": institution,
                                "degree": degree.strip(),
                                "date": date,
                                "gpa": gpa,
                            }
                        )
                        seen_institutions.add(institution)

            return education_entries
        except Exception as e:
            logger.error(f"Error extracting education: {e}")
            return []

    def _extract_gpa(self, text):
        """Extract GPA information"""
        try:
            gpa_pattern = r"(?i)(?:gpa|cgpa)[:\s]*([0-4]\.\d{1,2})"
            match = re.search(gpa_pattern, text)
            return match.group(1) if match else ""
        except Exception:
            return ""

    def extract_projects(self, text):
        """Extract project information from resume text"""
        try:
            # Enhanced project pattern
            project_patterns = [
                r"(?i)(?:project|projects?)[\s:]+([A-Za-z0-9\s\-]+)(?:\n|$)",
                r"(?i)(?:developed|created|implemented|built)[\s:]+([A-Za-z0-9\s\-]+)(?:\n|$)",
            ]

            project_entries = []
            for pattern in project_patterns:
                projects = re.finditer(pattern, text)
                for match in projects:
                    project_name = match.group(1).strip()
                    if len(project_name) > 3:  # Filter out too short matches
                        context = text[match.start() : match.start() + 200]
                        project_entries.append(
                            {
                                "name": project_name,
                                "description": self._extract_description(context),
                                "technologies": self._extract_technologies(context),
                            }
                        )

            return project_entries
        except Exception as e:
            logger.error(f"Error extracting projects: {e}")
            return []

    def _extract_technologies(self, text):
        """Extract technologies mentioned in the context"""
        try:
            # Extract skills from the context
            skills = self.get_skills(text)
            return list(set(skills))[:5]  # Return up to 5 unique technologies
        except Exception:
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
            # logger.info(f"""
            #     skills: {skills},
            #     contact_info: {contact_info},
            #     experience: {experience},
            #     education: {education},
            #     projects: {projects},
            #     requirements: ,
            #     experience_level: """)
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
