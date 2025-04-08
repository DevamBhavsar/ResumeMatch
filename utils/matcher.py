import spacy
import numpy as np
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class ResumeMatcher:
    def __init__(self):
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_md")
            self.vectorizer = TfidfVectorizer()
            logger.info("ResumeMatcher initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ResumeMatcher: {e}")
            raise

    def calculate_skill_match(self, resume_skills, jd_skills):
        """Calculate the skill match percentage"""
        try:
            if not jd_skills:
                return 0.0, []

            # Convert to lowercase for comparison
            resume_skills_lower = [s.lower() for s in resume_skills]
            jd_skills_lower = [s.lower() for s in jd_skills]

            # Calculate matching skills
            matching_skills = set(resume_skills_lower).intersection(
                set(jd_skills_lower)
            )

            # Get original case for matching skills
            matching_skills_original = []
            for skill in jd_skills:
                if skill.lower() in matching_skills:
                    matching_skills_original.append(skill)

            # Calculate match percentage
            match_percentage = (len(matching_skills) / len(jd_skills_lower)) * 100

            return match_percentage, matching_skills_original
        except Exception as e:
            logger.error(f"Error calculating skill match: {e}")
            return 0.0, []

    def calculate_text_similarity(self, resume_text, jd_text):
        """Calculate text similarity using TF-IDF and cosine similarity"""
        try:
            # Limit text size to prevent memory issues
            max_text_length = 50000
            resume_text = (
                resume_text[:max_text_length]
                if len(resume_text) > max_text_length
                else resume_text
            )
            jd_text = (
                jd_text[:max_text_length] if len(jd_text) > max_text_length else jd_text
            )

            # Create document vectors
            tfidf_matrix = self.vectorizer.fit_transform([resume_text, jd_text])

            # Calculate cosine similarity
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])

            return cosine_sim[0][0] * 100  # Convert to percentage
        except Exception as e:
            logger.error(f"Error calculating text similarity: {e}")
            return 0.0

    def get_missing_skills(self, resume_skills, jd_skills):
        """Get skills present in JD but missing in resume"""
        try:
            resume_skills_lower = [s.lower() for s in resume_skills]

            missing_skills = []
            for skill in jd_skills:
                if skill.lower() not in resume_skills_lower:
                    missing_skills.append(skill)

            return missing_skills
        except Exception as e:
            logger.error(f"Error calculating missing skills: {e}")
            return []

    def calculate_semantic_similarity(self, resume_text, jd_text):
        """Calculate semantic similarity using spaCy"""
        try:
            # Limit text size to prevent memory issues
            max_text_length = 10000
            resume_text = (
                resume_text[:max_text_length]
                if len(resume_text) > max_text_length
                else resume_text
            )
            jd_text = (
                jd_text[:max_text_length] if len(jd_text) > max_text_length else jd_text
            )

            # Process texts in chunks if needed
            if len(resume_text) > 5000 or len(jd_text) > 5000:
                # For long texts, use a simpler approach to avoid memory issues
                resume_doc = self.nlp.pipe([resume_text], disable=["parser", "ner"])
                jd_doc = self.nlp.pipe([jd_text], disable=["parser", "ner"])

                resume_vector = next(resume_doc).vector
                jd_vector = next(jd_doc).vector

                # Calculate cosine similarity manually
                similarity = np.dot(resume_vector, jd_vector) / (
                    np.linalg.norm(resume_vector) * np.linalg.norm(jd_vector)
                )
            else:
                # For shorter texts, use the full spaCy pipeline
                resume_doc = self.nlp(resume_text)
                jd_doc = self.nlp(jd_text)
                similarity = resume_doc.similarity(jd_doc)

            return similarity * 100  # Convert to percentage
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {e}")
            return 0.0

    def get_matching_score(self, resume_data, jd_data):
        """Calculate overall matching score between resume and job description"""
        try:
            # Calculate skill match
            skill_match, matching_skills = self.calculate_skill_match(
                resume_data["skills"], jd_data["skills"]
            )

            # Calculate text similarity
            text_similarity = self.calculate_text_similarity(
                resume_data["text"], jd_data["text"]
            )

            # Get missing skills
            missing_skills = self.get_missing_skills(
                resume_data["skills"], jd_data["skills"]
            )

            # Calculate semantic similarity
            semantic_similarity = self.calculate_semantic_similarity(
                resume_data["text"], jd_data["text"]
            )

            # Calculate overall score (weighted)
            # 60% skill match, 20% text similarity, 20% semantic similarity
            overall_score = (
                (0.6 * skill_match)
                + (0.2 * text_similarity)
                + (0.2 * semantic_similarity)
            )

            # Prepare result
            result = {
                "overall_score": round(overall_score, 2),
                "skill_match": round(skill_match, 2),
                "text_similarity": round(text_similarity, 2),
                "semantic_similarity": round(semantic_similarity, 2),
                "matching_skills": matching_skills,
                "missing_skills": missing_skills,
                "resume_skills": resume_data["skills"],
                "jd_skills": jd_data["skills"],
            }

            return result
        except Exception as e:
            logger.error(f"Error getting matching score: {e}")
            return {
                "overall_score": 0,
                "skill_match": 0,
                "text_similarity": 0,
                "semantic_similarity": 0,
                "matching_skills": [],
                "missing_skills": [],
                "resume_skills": [],
                "jd_skills": [],
            }
