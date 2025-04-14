import logging
import json

logger = logging.getLogger(__name__)


class MatchingService:
    """Service for handling resume-job matching operations"""

    def __init__(self, resume_parser, jd_parser, matcher):
        self.resume_parser = resume_parser
        self.jd_parser = jd_parser
        self.matcher = matcher

    def process_match(self, resume_file_path, job_description_text):
        """Process a resume and job description to calculate match"""
        try:
            if not job_description_text:
                return {
                    "error": "Job description cannot be empty",
                    "overall_score": 0,
                    "skill_match": 0,
                    "text_similarity": 0,
                    "semantic_similarity": 0,
                    "matching_skills": [],
                    "missing_skills": [],
                    "resume_skills": [],
                    "jd_skills": [],
                    "skill_strengths": {},
                }

            # Parse resume
            try:
                resume_data = self.resume_parser.process_resume(resume_file_path)
                if not resume_data["text"]:
                    raise ValueError("Could not extract text from resume")
                if not resume_data["skills"]:
                    raise ValueError("No skills found in resume")
            except Exception as e:
                logger.error(f"Resume processing error: {str(e)}")
                return {
                    "error": f"Could not process resume: {str(e)}",
                    "overall_score": 0,
                    "skill_match": 0,
                    "text_similarity": 0,
                    "semantic_similarity": 0,
                    "matching_skills": [],
                    "missing_skills": [],
                    "resume_skills": [],
                    "jd_skills": [],
                    "skill_strengths": {},
                }

            # Parse job description
            try:
                jd_data = self.jd_parser.process_job_description(job_description_text)
                if not jd_data["skills"]:
                    raise ValueError("No skills found in job description")
            except Exception as e:
                logger.error(f"Job description processing error: {str(e)}")
                return {
                    "error": f"Could not process job description: {str(e)}",
                    "overall_score": 0,
                    "skill_match": 0,
                    "text_similarity": 0,
                    "semantic_similarity": 0,
                    "matching_skills": [],
                    "missing_skills": [],
                    "resume_skills": [],
                    "jd_skills": [],
                    "skill_strengths": {},
                }

            # Calculate matching score
            result = self.matcher.get_matching_score(resume_data, jd_data)

            # Add error field to indicate success
            result["error"] = None

            logger.info(f"Match score calculated: {result['overall_score']}%")
            logger.info(
                f"Skill strengths data: {json.dumps(result['skill_strengths'])}"
            )

            return result

        except Exception as e:
            logger.error(f"Error in matching process: {str(e)}")
            return {
                "error": f"Error processing match: {str(e)}",
                "overall_score": 0,
                "skill_match": 0,
                "text_similarity": 0,
                "semantic_similarity": 0,
                "matching_skills": [],
                "missing_skills": [],
                "resume_skills": [],
                "jd_skills": [],
                "skill_strengths": {},
            }
