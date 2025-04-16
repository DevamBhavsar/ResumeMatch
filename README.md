# ResumeMatch

A modern web application that analyzes resumes against job descriptions using Natural Language Processing (NLP) techniques. The application provides detailed analysis including similarity scores, skill matching, and insights on how well a resume matches a given job description.

## Features

- **Resume Parsing**: Extracts text from PDF, DOCX, and TXT files
- **Job Description Analysis**: Extracts skills, requirements, and experience levels
- **Skill Matching**: Advanced comparison of resume skills with job requirements
- **Similarity Scoring**: Uses TF-IDF, cosine similarity, and semantic similarity
- **Batch Processing**: Analyze multiple resumes against a job description
- **Cover Letter Generation**: AI-powered cover letter suggestions
- **Visual Analytics**: Interactive charts and skill gap analysis
- **Modern UI**: Responsive design with dark mode support
- **Real-time Progress Tracking**: WebSocket-based progress updates
- **Document Generation**: Export results as PDF or DOCX

## Technical Stack

### Backend

- **Framework**: Flask 2.0.1
- **NLP Engine**: spaCy 3.5+, scikit-learn 1.0+
- **File Processing**: PyPDF2 2.0+, python-docx 0.8.11+
- **WebSockets**: flask-sock, simple-websocket
- **Deployment**: Docker, Gunicorn 20.1.0

### Frontend

- **Framework**: Next.js 15.3.0 with App Router
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS 4.1.3
- **Charts**: Chart.js 4.4.8, react-chartjs-2 5.3.0
- **Form Handling**: react-hook-form 7.55.0, zod 3.24.2
- **HTTP Client**: Axios 1.8.4
- **React**: React 19.1.0
- **Package Manager**: pnpm 10.8.1
- **TypeScript**: 5.8.3

## Prerequisites

1. Python 3.9 or higher
2. Node.js 18 or higher
3. pnpm package manager
4. Docker (optional)

## Installation

### Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/DevamBhavsar/ResumeMatch.git
   cd ResumeMatch
   ```

2. Setup Python environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   cd backend
   pip install -r requirements.txt
   python -m spacy download en_core_web_md
   ```

### Frontend Setup

1. Navigate to frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development

1. Start the backend server:

   ```bash
   cd backend
   python app.py
   ```

2. Start the frontend development server:

   ```bash
   cd frontend
   pnpm dev
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Deployment

### Using Docker

1. Build and start the application:

   ```bash
   docker build -t resumematch .
   docker run -p 5000:5000 resumematch
   ```

2. For frontend:

   ```bash
   cd frontend
   pnpm build
   pnpm start
   ```

3. Access the application at:
   ```
   http://localhost:3000
   ```

### Manual Deployment

1. Build the frontend:

   ```bash
   cd frontend
   pnpm build
   ```

2. Deploy backend using Gunicorn:
   ```bash
   cd backend
   gunicorn --bind 0.0.0.0:5000 app:app
   ```

## Environment Variables

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)

```
FLASK_ENV=production
FLASK_APP=app.py
SECRET_KEY=your_secret_key_here
FRONTEND_URL=http://localhost:3000
```

## Acknowledgments

- **spaCy**: NLP capabilities
- **scikit-learn**: ML algorithms
- **Next.js**: Frontend framework
- **Shadcn/ui**: UI components
- **Flask**: Backend framework
- **PyPDF2** & **python-docx**: File parsing
- **Chart.js**: Data visualization
