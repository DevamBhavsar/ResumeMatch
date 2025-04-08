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
            # Parse resume
            resume_data = self.resume_parser.process_resume(resume_file_path)
            logger.info(
                f"Resume processed successfully: {len(resume_data['skills'])} skills found"
            )

            # Parse job description
            jd_data = self.jd_parser.process_job_description(job_description_text)
            logger.info(
                f"Job description processed successfully: {len(jd_data['skills'])} skills found"
            )

            # Calculate matching score
            result = self.matcher.get_matching_score(resume_data, jd_data)
            logger.info(f"Match score calculated: {result['overall_score']}%")
            
            logger.info(f"Skill strengths data: {json.dumps(result['skill_strengths'])}")
            
            return result
        except Exception as e:
            logger.error(f"Error processing match: {str(e)}", exc_info=True)
            raise e
        
