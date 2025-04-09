import logging
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

class BatchMatchingService:
    """Service for handling multiple resume-job matching operations"""
    
    def __init__(self, resume_parser, jd_parser, matcher):
        self.resume_parser = resume_parser
        self.jd_parser = jd_parser
        self.matcher = matcher
    
    def process_single_resume(self, resume_file_path, jd_data):
        """Process a single resume against the job description"""
        try:
            # Parse resume
            resume_data = self.resume_parser.process_resume(resume_file_path)
            logger.info(
                f"Resume {resume_file_path} processed: {len(resume_data['skills'])} skills found"
            )

            # Calculate matching score
            result = self.matcher.get_matching_score(resume_data, jd_data)
            
            # Add resume metadata to result
            result['resume_name'] = resume_file_path.split('/')[-1]
            result['contact_info'] = resume_data.get('contact_info', {})
            
            return result
        except Exception as e:
            logger.error(f"Error processing resume {resume_file_path}: {str(e)}", exc_info=True)
            return {
                'resume_name': resume_file_path.split('/')[-1],
                'error': str(e),
                'overall_score': 0,
                'skill_match': 0,
                'text_similarity': 0,
                'semantic_similarity': 0,
                'matching_skills': [],
                'missing_skills': [],
                'resume_skills': [],
                'jd_skills': []
            }
    
    def process_batch_match(self, resume_file_paths, job_description_text):
        """Process multiple resumes against a single job description"""
        try:
            # Parse job description (only once)
            jd_data = self.jd_parser.process_job_description(job_description_text)
            logger.info(
                f"Job description processed successfully: {len(jd_data['skills'])} skills found"
            )
            
            results = []
            
            # Process resumes in parallel for better performance
            with ThreadPoolExecutor(max_workers=min(4, len(resume_file_paths))) as executor:
                future_to_resume = {
                    executor.submit(self.process_single_resume, resume_path, jd_data): resume_path 
                    for resume_path in resume_file_paths
                }
                
                for future in as_completed(future_to_resume):
                    resume_path = future_to_resume[future]
                    try:
                        result = future.result()
                        results.append(result)
                    except Exception as e:
                        logger.error(f"Error processing resume {resume_path}: {str(e)}", exc_info=True)
                        results.append({
                            'resume_name': resume_path.split('/')[-1],
                            'error': str(e),
                            'overall_score': 0
                        })
            
            # Sort results by overall score (descending)
            results.sort(key=lambda x: x.get('overall_score', 0), reverse=True)
            
            # Add ranking
            for i, result in enumerate(results):
                result['rank'] = i + 1
            
            return results
        except Exception as e:
            logger.error(f"Error processing batch match: {str(e)}", exc_info=True)
            raise e
