from flask import Flask, request, jsonify, render_template
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import PyPDF2
import io
from pymongo import MongoClient
import datetime

app = Flask(__name__)

# Initialize MongoDB connection with error handling
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["resume_scorer"]
    scores_collection = db["scores"]
    # Test the connection
    client.server_info()
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    print("Ensure MongoDB is running on your system")

# Load spaCy model with error handling
try:
    nlp = spacy.load("en_core_web_lg")
except OSError:
    print("Downloading spaCy model...")
    import subprocess

    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_lg"])
    nlp = spacy.load("en_core_web_lg")


def preprocess_text(text):
    """
    Preprocess text by removing stopwords and lemmatizing
    """
    doc = nlp(text.lower())
    tokens = [
        token.lemma_
        for token in doc
        if not token.is_stop and not token.is_punct and token.is_alpha
    ]
    return " ".join(tokens)


def extract_text_from_pdf(pdf_file):
    """
    Extract text content from uploaded PDF file
    """
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise ValueError(f"Error reading PDF file: {str(e)}")


def calculate_similarity_score(resume_text, job_description):
    """
    Calculate similarity score between resume and job description
    using TF-IDF and cosine similarity
    """
    processed_resume = preprocess_text(resume_text)
    processed_jd = preprocess_text(job_description)

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([processed_jd, processed_resume])
    similarity_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    return round(similarity_score * 100, 2)


def extract_key_skills(text):
    """
    Extract key skills from text using spaCy's entity recognition
    and noun phrase detection
    """
    doc = nlp(text)
    skills = set()

    # Extract noun phrases
    for chunk in doc.noun_chunks:
        skills.add(chunk.text.lower())

    # Extract certain named entities
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "GPE"]:
            skills.add(ent.text.lower())

    return list(skills)


@app.route("/analyze", methods=["POST"])
def analyze_resume():
    """
    Endpoint to analyze resume against job description
    """
    try:
        job_description = request.form.get("jobDescription")
        if not job_description:
            return jsonify({"error": "Job description is required"}), 400

        if "resume" not in request.files:
            return jsonify({"error": "No resume file provided"}), 400

        resume_file = request.files["resume"]
        if not resume_file.filename.endswith(".pdf"):
            return jsonify({"error": "Only PDF files are supported"}), 400

        resume_text = extract_text_from_pdf(resume_file.read())
        if not resume_text.strip():
            return jsonify({"error": "Could not extract text from PDF"}), 400

        score = calculate_similarity_score(resume_text, job_description)
        resume_skills = extract_key_skills(resume_text)
        jd_skills = extract_key_skills(job_description)

        matching_skills = set(resume_skills).intersection(set(jd_skills))
        skills_score = len(matching_skills) / len(jd_skills) * 100 if jd_skills else 0

        result = {
            "overall_score": score,
            "skills_match_percentage": round(skills_score, 2),
            "matching_skills": list(matching_skills),
            "missing_skills": list(set(jd_skills) - set(resume_skills)),
            "resume_skills": resume_skills,
            "jd_skills": jd_skills,
            "timestamp": datetime.datetime.now().isoformat(),
        }

        try:
            insert_result = scores_collection.insert_one(result)
            result["_id"] = str(insert_result.inserted_id)
        except Exception as e:
            print(f"MongoDB Storage Error: {e}")

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)  # If you still get reloader issues, try use_reloader=False
