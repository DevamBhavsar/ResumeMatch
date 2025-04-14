import { ResumeUploadForm } from "@/components/forms/ResumeUploadForm"
import { Header } from "@/components/layout/Header"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Resume-Job Description Matcher</h1>
          <p className="text-center text-muted-foreground mb-8">
            Upload your resume and paste a job description to calculate your match score!
          </p>

          <ResumeUploadForm />
        </div>
      </main>
    </div>
  )
}