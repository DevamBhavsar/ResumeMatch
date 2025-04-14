import { BatchUploadForm } from "@/components/forms/BatchUploadForm";
import { Header } from "@/components/layout/Header";

export default function BatchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Multiple Resume Matcher</h1>
          <p className="text-center text-muted-foreground mb-8">
            Upload multiple resumes and match them against a job description to find the best candidates!
          </p>

          <BatchUploadForm />
        </div>
      </main>
    </div>
  );
}
