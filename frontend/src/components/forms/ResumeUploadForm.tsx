"use client";

import { uploadResumeAndMatch } from "@/lib/api";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useProgressTracker } from "@/lib/hooks/useProgressTracker";
import { formatFileSize } from "@/lib/utils/file-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorDisplay } from "../common/ErrorDisplay";
import { LoadingIndicator } from "../common/LoadingIndicator";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export function ResumeUploadForm() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { files, handleFileSelect, removeFile } = useFileUpload({
    maxFiles: 1,
    onError: (message) => toast.error("Error",{ description: message,  }),
  });
  
  const { progress } = useProgressTracker(jobId, {
    onComplete: (redirectUrl) => {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/results");
      }
    },
    onError: (message) => {
      toast.error("Error",{ description: message,  });
      setIsSubmitting(false);
      setJobId(null);
    },
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (files.length === 0) {
      toast.error("Missing resume", {
        description: "Please upload a resume file",
      });
      return;
    }
    
    if (!jobDescription.trim()) {
      toast.error("Missing job description", {
        description: "Please enter a job description",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await uploadResumeAndMatch(files[0], jobDescription);
      
      if (!response.success) {
        setError(response.error || "Failed to process resume");
        setIsSubmitting(false);
        return;
      }

      // Check if we got a jobId for progress tracking
      if (response.jobId) {
        setJobId(response.jobId);
      } else if (response.result) {
        // Direct result without progress tracking
        const encodedData = encodeURIComponent(JSON.stringify(response.result));
        router.push(`/results?data=${encodedData}`);
      } else {
        throw new Error("Invalid response format");
      }

    } catch (error) {
      console.error("Error submitting form:", error);
      setError(error instanceof Error ? error.message : "Failed to process resume");
      setIsSubmitting(false);
    }
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(Array.from(e.target.files));
    }
  };

  if (error) {
    return (
      <ErrorDisplay 
        title="Processing Error" 
        message={error} 
        onRetry={() => {
          setError(null);
          setIsSubmitting(false);
        }} 
      />
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="resume">Upload Resume (PDF, DOCX, or TXT):</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="file"
              id="resume"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInputChange}
              disabled={isSubmitting}
            />
            <label htmlFor="resume" className="cursor-pointer flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-muted-foreground mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm font-medium">
                Drag & drop files here or click to browse
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Maximum 5MB
              </span>
            </label>
          </div>
        </div>

        {files.length > 0 && (
          <Card>
            <CardContent className="p-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center">
                    <div className="text-2xl mr-2">📄</div>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isSubmitting}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Label htmlFor="job_description">Paste Job Description:</Label>
          <Textarea
            id="job_description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={10}
            disabled={isSubmitting}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Calculate Match"}
        </Button>
      </form>

      <LoadingIndicator progress={progress} visible={isSubmitting} />
    </>
  );
}
