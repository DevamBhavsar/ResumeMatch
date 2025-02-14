# ResumeMatch

A Flask-based web application that analyzes resumes against job descriptions using Natural Language Processing (NLP) techniques. The application provides similarity scores, skill matching, and detailed analysis of how well a resume matches a given job description.

## Features

- PDF resume parsing and text extraction
- Job description analysis
- Skill extraction and matching
- Similarity scoring using TF-IDF and cosine similarity
- Results storage in MongoDB
- Web interface for easy submission and analysis

## Technical Stack

- Python 3.8+
- Flask (Web Framework)
- spaCy (Natural Language Processing)
- scikit-learn (Text Analysis)
- PyPDF2 (PDF Processing)
- MongoDB (Data Storage)

## Prerequisites

Before running the application, ensure you have:

1. Python 3.8 or higher installed
2. MongoDB installed and running locally
3. Required Python packages (see requirements.txt)
4. spaCy's English language model

## Installation

1. Clone the repository:
```bash
git clone https://github.com/DevamBhavsar/ResumeMatch.git
cd ResumeMatch
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install required packages:
```bash
pip install -r requirements.txt
```

4. Download the spaCy model:
```bash
python -m spacy download en_core_web_lg
```

5. Ensure MongoDB is running on your system:
```bash
mongod  # Start MongoDB server
```

## Usage

1. Start the application:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Upload a PDF resume and enter the job description in the provided form.

4. View the analysis results, including:
   - Overall similarity score
   - Skills match percentage
   - Matching skills list
   - Missing skills list
   - Complete skill analysis

## API Endpoints

### POST /analyze
Analyzes a resume against a job description.

Request format:
- Method: POST
- Content-Type: multipart/form-data
- Parameters:
  - resume: PDF file
  - jobDescription: string

Response format:
```json
{
    "overall_score": float,
    "skills_match_percentage": float,
    "matching_skills": [string],
    "missing_skills": [string],
    "resume_skills": [string],
    "jd_skills": [string],
    "timestamp": string,
    "_id": string
}
```
## Acknowledgments

- spaCy for providing excellent NLP capabilities
- scikit-learn for TF-IDF and similarity calculations
- Flask for the web framework
- PyPDF2 for PDF processing capabilities
