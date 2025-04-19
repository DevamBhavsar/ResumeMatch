from collections import Counter
import logging
import json

import requests

logger = logging.getLogger(__name__)


class QuestionGeneratorService:
    """Service for generating interview questions based on job skills"""

    def __init__(self, ollama_url="http://localhost:11434"):
        self.ollama_url = ollama_url
        logger.info("QuestionGeneratorService initialized")

    def generate_questions(self, skills, job_description, num_questions=5):
        """
        Generate interview questions and answers based on the most common skills

        Args:
            skills: List of skills from the job description or manually provided
            job_description: The full job description text (optional)
            num_questions: Number of questions to generate

        Returns:
            List of question-answer pairs
        """
        try:
            # Count skill occurrences to find most common
            skill_counter = Counter(skills)
            most_common_skills = [skill for skill, _ in skill_counter.most_common(5)]

            if not most_common_skills:
                logger.warning("No skills found to generate questions")
                return []

            # Create prompt for the LLM
            if job_description:
                prompt = f"""
                You are an expert technical interviewer. Generate {num_questions} interview questions with detailed answers for a position with the following job description:
                
                "{job_description[:500]}..."
                
                Focus on these key skills: {', '.join(most_common_skills)}
                
                For each question:
                1. Make it specific and technical
                2. Include a mix of conceptual and practical questions
                3. Phrase questions in the second person (using "you" to address the candidate)
                4. Provide a detailed answer that demonstrates expertise, also written in the second person
                
                Return ONLY valid JSON in the following format without any additional text or explanation:
                [
                {{
                    "question": "How would you implement...",
                    "answer": "You should approach this by..."
                }},
                ...
                ]
                """
            else:
                # If no job description, just use the skills
                prompt = f"""
                You are an expert technical interviewer. Generate {num_questions} interview questions with detailed answers to assess a candidate's proficiency in the following skills:
                
                {', '.join(most_common_skills)}
                
                For each question:
                1. Make it specific and technical
                2. Include a mix of conceptual and practical questions
                3. Phrase questions in the second person (using "you" to address the candidate)
                4. Provide a detailed answer that demonstrates expertise, also written in the second person
                
                Return ONLY valid JSON in the following format without any additional text or explanation:
                [
                {{
                    "question": "How would you implement...",
                    "answer": "You should approach this by..."
                }},
                ...
                ]
                """

            # Call Ollama API
            try:
                response = requests.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": "deepseek-r1:1.5b",
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.7,
                    },
                    timeout=300,
                )

                if response.status_code != 200:
                    logger.error(f"Ollama API error: {response.text}")
                    return self._get_qa_pairs(most_common_skills)

                # Extract the generated text
                generated_text = response.json().get("response", "")

                # Try to parse JSON from the response
                try:
                    # Improved JSON extraction
                    # Find the first [ and last ] to extract the JSON array
                    json_start = generated_text.find("[")
                    json_end = generated_text.rfind("]") + 1

                    if json_start >= 0 and json_end > json_start:
                        json_str = generated_text[json_start:json_end]

                        # Clean up the JSON string to handle potential formatting issues
                        json_str = (
                            json_str.replace("```json", "").replace("```", "").strip()
                        )

                        # Advanced cleaning of control characters and other problematic characters
                        import re

                        # Remove control characters
                        json_str = re.sub(r"[\x00-\x1F\x7F-\x9F]", "", json_str)
                        # Fix common JSON syntax issues
                        json_str = json_str.replace('\\"', '"').replace("\\n", " ")

                        qa_pairs = json.loads(json_str)

                        # Validate the format
                        validated_pairs = []
                        for pair in qa_pairs:
                            if (
                                isinstance(pair, dict)
                                and "question" in pair
                                and "answer" in pair
                            ):
                                validated_pairs.append(pair)

                        if validated_pairs:
                            return validated_pairs[
                                :num_questions
                            ]  # Limit to requested number
                        else:
                            logger.warning(
                                "No valid question-answer pairs found in JSON"
                            )
                            return self._get_qa_pairs(most_common_skills)
                    else:
                        logger.warning("No JSON array found in LLM response")
                        return self._get_qa_pairs(most_common_skills)

                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON from LLM response: {str(e)}")
                    # Try a more aggressive approach to extract JSON
                    try:
                        # Try to fix common JSON issues
                        import re

                        # First attempt: Try to extract JSON array with regex
                        json_pattern = r"\[\s*\{.*?\}\s*\]"
                        match = re.search(json_pattern, generated_text, re.DOTALL)
                        if match:
                            try:
                                json_str = match.group(0)
                                # Clean control characters
                                json_str = re.sub(r"[\x00-\x1F\x7F-\x9F]", "", json_str)
                                qa_pairs = json.loads(json_str)
                                validated_pairs = [
                                    pair
                                    for pair in qa_pairs
                                    if isinstance(pair, dict)
                                    and "question" in pair
                                    and "answer" in pair
                                ]
                                if validated_pairs:
                                    return validated_pairs[:num_questions]
                            except json.JSONDecodeError:
                                pass

                        # Second attempt: Try to manually construct JSON
                        # Look for patterns like "question": "..." and "answer": "..."
                        question_pattern = r'"question"\s*:\s*"([^"]*)"'
                        answer_pattern = r'"answer"\s*:\s*"([^"]*)"'

                        questions = re.findall(question_pattern, generated_text)
                        answers = re.findall(answer_pattern, generated_text)

                        if questions and answers and len(questions) == len(answers):
                            qa_pairs = []
                            for i in range(min(len(questions), num_questions)):
                                qa_pairs.append(
                                    {"question": questions[i], "answer": answers[i]}
                                )
                            if qa_pairs:
                                return qa_pairs
                    except Exception as regex_error:
                        logger.warning(
                            f"Failed to extract JSON with regex: {str(regex_error)}"
                        )

                    return self._get_qa_pairs(most_common_skills)

            except requests.RequestException as e:
                logger.error(f"Error calling Ollama API: {str(e)}")
                return self._get_qa_pairs(most_common_skills)

        except Exception as e:
            logger.error(f"Error generating questions: {str(e)}", exc_info=True)
            return [
                {
                    "question": "Failed to generate questions. Please try again later.",
                    "answer": "",
                }
            ]

    def _get_qa_pairs(self, skills):
        """Generate question-answer pairs if the LLM call fails"""
        qa_pairs = []

        for skill in skills[:5]:
            qa_pairs.append(
                {
                    "question": f"Can you explain your experience with {skill}?",
                    "answer": f"When discussing experience with {skill}, focus on specific projects where you've applied it. Mention the problem you solved, how {skill} was utilized, challenges faced, and outcomes achieved. Include metrics if possible. Demonstrate both technical knowledge and practical application of {skill}.",
                }
            )

        # Add more specific questions based on common skills
        if "python" in [s.lower() for s in skills]:
            qa_pairs.append(
                {
                    "question": "What are Python decorators and how have you used them?",
                    "answer": "Python decorators are functions that modify the behavior of other functions or methods. They use the @decorator syntax and are a form of metaprogramming. I've used decorators for logging, timing function execution, access control, caching results, and implementing retry logic. For example, I created a custom @retry decorator that would automatically retry a function call when specific exceptions occurred, which was useful for handling transient network errors in our API calls.",
                }
            )

        if "javascript" in [s.lower() for s in skills]:
            qa_pairs.append(
                {
                    "question": "Explain the difference between let, const, and var in JavaScript.",
                    "answer": "In JavaScript, these keywords declare variables with different scoping and reassignment properties. 'var' is function-scoped, can be redeclared, and is hoisted with a default value of undefined. 'let' is block-scoped, cannot be redeclared in the same scope, but can be reassigned. 'const' is also block-scoped, cannot be redeclared in the same scope, and cannot be reassigned after initialization (though properties of objects declared with const can still be modified). Best practice is to use const by default, let when you need to reassign, and avoid var in modern code.",
                }
            )

        if "react" in [s.lower() for s in skills]:
            qa_pairs.append(
                {
                    "question": "How do you manage state in React applications?",
                    "answer": "In React, I manage state using several approaches depending on complexity: 1) Local component state with useState for component-specific data; 2) Context API for sharing state across multiple components without prop drilling; 3) Redux for complex applications with many state interactions; 4) React Query or SWR for server state management. For performance optimization, I use useMemo and useCallback to prevent unnecessary re-renders. I follow the principle of lifting state up to the lowest common ancestor when multiple components need to share state.",
                }
            )

        return qa_pairs[:5]  # Return at most 5 QA pairs

    def get_soft_skill_questions(self):
        """Return a list of common soft skill interview questions with answers"""
        return [
            {
                "question": "Tell me about yourself.",
                "answer": "Start with your current role and experience, then briefly mention your background and qualifications relevant to the position. Highlight 2-3 key achievements that demonstrate your strengths. Conclude with why you're interested in this specific role and company. Keep it professional and concise (1-2 minutes), focusing on aspects that make you a good fit for the position.",
            },
            {
                "question": "What is your greatest strength?",
                "answer": "Choose a strength that's relevant to the position. Provide a specific example that demonstrates this strength in a professional context. Explain how this strength has helped you achieve results in the past and how it would benefit the company you're interviewing with.",
            },
            {
                "question": "What is your greatest weakness?",
                "answer": "Select a genuine weakness that isn't critical to the job. Explain how you've recognized this weakness and the specific steps you're taking to improve. Demonstrate self-awareness and a commitment to professional growth. Avoid clichés like 'I'm a perfectionist' or disguising strengths as weaknesses.",
            },
            {
                "question": "How do you handle stress and pressure?",
                "answer": "Describe your specific strategies for managing stress, such as prioritization, breaking down complex tasks, time management techniques, or mindfulness practices. Provide an example of a high-pressure situation you handled successfully, focusing on your process and the positive outcome. Emphasize your ability to remain calm and productive under pressure.",
            },
            {
                "question": "Describe a challenge or conflict you faced at work and how you dealt with it.",
                "answer": "Use the STAR method (Situation, Task, Action, Result). Briefly describe the specific conflict situation and your role. Explain the actions you took to resolve it, emphasizing communication, empathy, and problem-solving skills. Highlight the positive results and what you learned from the experience.",
            },
            {
                "question": "Why do you want to work for this company?",
                "answer": "Demonstrate that you've researched the company by mentioning specific aspects of their mission, values, products, or culture that align with your career goals and values. Explain how your skills and experience make you a good fit for their specific needs. Show genuine enthusiasm for the company's work and how you hope to contribute.",
            },
            {
                "question": "Where do you see yourself in five years?",
                "answer": "Outline a realistic career progression that shows ambition while remaining relevant to the position and company. Focus on skills you hope to develop and contributions you want to make rather than specific titles. Show that you're committed to growing with the company long-term. Align your goals with the company's growth trajectory if possible.",
            },
            {
                "question": "How do you prioritize your work?",
                "answer": "Explain your specific methodology for prioritization, such as urgent/important matrices, impact assessment, or alignment with team/company goals. Describe the tools you use to stay organized (digital or physical). Provide an example of how you've successfully managed competing priorities. Emphasize your flexibility to adapt when priorities shift.",
            },
            {
                "question": "Describe a time when you demonstrated leadership skills.",
                "answer": "Use the STAR method to describe a specific situation where you took initiative, even if you weren't in a formal leadership role. Explain the actions you took to guide, motivate, or influence others. Highlight the positive results achieved through your leadership. Reflect on what you learned about effective leadership from this experience.",
            },
            {
                "question": "How do you handle feedback and criticism?",
                "answer": "Emphasize that you view feedback as valuable for professional growth. Describe your process for receiving feedback: listening actively, asking clarifying questions, reflecting objectively, and creating an action plan for improvement. Provide an example where you successfully implemented changes based on feedback. Mention how you seek out feedback proactively.",
            },
        ]
