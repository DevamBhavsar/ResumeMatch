import re
import json
import spacy
from collections import Counter

def load_skills_database(filepath="data/technical_skills.json"):
    """Load skills database from JSON file"""
    try:
        with open(filepath, 'r') as f:
            skills_data = json.load(f)
        
        # Combine all skills from different categories into a single list
        all_skills = []
        for category, skills in skills_data.items():
            all_skills.extend(skills)
        
        # Remove duplicates
        seen = set()
        unique_skills = [skill for skill in all_skills if not (skill.lower() in seen or seen.add(skill.lower()))]
        
        return {"all_skills": unique_skills}
    except Exception as e:
        print(f"Error loading skills database: {e}")
        return {"all_skills": []}

def extract_skills(text):
    """
    Extract technical skills from text using pattern matching and NLP
    """
    try:
        # Load skills database
        skills_data = load_skills_database()
        all_skills = skills_data["all_skills"]
        
        if not all_skills:
            return []
        
        # Convert skills to lowercase for case-insensitive matching
        skills_lower = {skill.lower(): skill for skill in all_skills}
        
        # Load spaCy model for entity recognition and NLP processing
        try:
            nlp = spacy.load("en_core_web_md")
        except OSError:
            print("Downloading spaCy model...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_md"])
            nlp = spacy.load("en_core_web_md")
        
        # Process the text
        doc = nlp(text[:100000] if len(text) > 100000 else text)  # Limit text size for processing
        
        # Extract potential skills based on known skill list
        found_skills = []
        
        # Direct matching with word boundaries
        for skill in all_skills:
            # Create regex pattern with word boundaries
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                found_skills.append(skill)
        
        # Extract skills using NLP - looking for nouns that might be technical terms
        potential_skills = []
        for token in doc:
            if token.pos_ in ["NOUN", "PROPN"]:
                if token.text.lower() in skills_lower:
                    potential_skills.append(skills_lower[token.text.lower()])
        
        # Combine all found skills
        all_found_skills = found_skills + potential_skills
        
        # Count occurrences to potentially identify importance
        skill_counts = Counter(all_found_skills)
        
        # Create a unique list of skills with their counts
        unique_skills_with_counts = [{"skill": skill, "count": count} 
                                    for skill, count in skill_counts.items()]
        
        # Sort by count (frequency)
        unique_skills_with_counts.sort(key=lambda x: x["count"], reverse=True)
        
        # Return just the unique skills list
        unique_skills = [item["skill"] for item in unique_skills_with_counts]
        
        return unique_skills
    except Exception as e:
        print(f"Error extracting skills: {e}")
        return []