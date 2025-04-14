# ResumeMatch

A Flask-based web application that analyzes resumes against job descriptions using Natural Language Processing (NLP) techniques. The application provides similarity scores, skill matching, and detailed analysis of how well a resume matches a given job description.

## Features

- **Resume Parsing**: Extracts text from PDF, DOCX, and TXT files.
- **Job Description Analysis**: Extracts skills, requirements, and experience levels from job descriptions.
- **Skill Matching**: Compares resume skills with job description skills.
- **Similarity Scoring**: Calculates text similarity using TF-IDF, cosine similarity, and semantic similarity.
- **Web Interface**: User-friendly interface for uploading resumes and job descriptions.
- **Detailed Results**: Displays overall match score, skill match percentage, matching skills, and missing skills.

## Technical Stack

- **Backend**: Flask (Python)
- **NLP**: spaCy, scikit-learn
- **File Processing**: PyPDF2, python-docx
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Docker, Gunicorn

## Prerequisites

Before running the application, ensure you have:

1. Python 3.8 or higher installed.
2. Required Python packages (see `requirements.txt`).
3. spaCy's English language model (`en_core_web_md`).

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
   python -m spacy download en_core_web_md
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

3. Upload a resume (PDF, DOCX, or TXT) and paste a job description in the provided form.

4. View the analysis results, including:
   - Overall match score
   - Skill match percentage
   - Matching skills
   - Missing skills
   - Text similarity and semantic similarity scores

## Deployment with Docker

1. Build the Docker image:

   ```bash
   docker build -t resume-match .
   ```

2. Run the Docker container:

   ```bash
   docker run -p 5000:5000 resume-match
   ```

3. Access the application at:
   ```
   http://localhost:5000
   ```

## Acknowledgments

- **spaCy**: For NLP capabilities.
- **scikit-learn**: For TF-IDF and similarity calculations.
- **Flask**: For the web framework.
- **PyPDF2** and **python-docx**: For file parsing.
