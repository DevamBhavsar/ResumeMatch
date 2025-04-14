"use client";

import { uploadBatchAndMatch } from "@/lib/api";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useProgressTracker } from "@/lib/hooks/useProgressTracker";
import { formatFileSize, getFileTypeIcon, getFileTypeLabel } from "@/lib/utils/file-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../common/LoadingIndicator";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";


export function BatchUploadForm() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { files, handleFileSelect, removeFile, clearFiles } = useFileUpload({
    maxFiles: 10,
    onError: (message) => toast.error(message, {description: "Error uploading files"}),
  });
  
  const { progress } = useProgressTracker(jobId, {
    onComplete: (redirectUrl) => {
      console.log(`Batch processing completed, redirecting to: ${redirectUrl}`);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        // If no redirect URL is provided, try to go to the results page with the job ID
        router.push(`/batch-results?id=${jobId}`);
      }
    },
    onError: (message) => {
      console.error(`Batch processing error: ${message}`);
      
      // If we lose connection but the job might still be processing,
      // provide a way for the user to check results
      if (message === "Lost connection to server" || message === "Progress updates stalled") {
        toast.error("Connection lost", {
          description: "Lost connection to the server, but your job may still be processing. You can check results later.",
          action: {
            label: "Check Results",
            onClick: () => router.push(`/batch-results?id=${jobId}`)
          }
        });
      } else {
        toast.error("Processing error", {
          description: message || "An error occurred during processing"
        });
      }
      
      setIsSubmitting(false);
    },
  });  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error("Missing resumes", {
        description: "Please upload at least one resume file"
      });
      return;
    }
    
    if (!jobDescription.trim()) {
      toast.error("Missing job description", {
        description: "Please enter a job description"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Log the files being uploaded for debugging
      console.log("Uploading files:", files.map(f => `${f.name} (${f.size} bytes)`));
      
      const response = await uploadBatchAndMatch(files, jobDescription);
      console.log("Batch upload response:", response);
      
      if (response.job_id) {
        setJobId(response.job_id);
      } else {
        throw new Error("No job ID returned from server");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Submission error", {
        description: error instanceof Error ? error.message : "Failed to submit form"
      });
      setIsSubmitting(false);
    }
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(Array.from(e.target.files));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="resumes">Upload Multiple Resumes (PDF, DOCX, or TXT):</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="file"
              id="resumes"
              className="hidden"
              accept=".pdf,.docx,.txt"
              multiple
              onChange={handleFileInputChange}
              disabled={isSubmitting}
            />
            <label htmlFor="resumes" className="cursor-pointer flex flex-col items-center">
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
                Maximum 10 files, 5MB each
              </span>
            </label>
          </div>
        </div>

        {files.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline">{files.length} files selected</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFiles}
                  disabled={isSubmitting}
                >
                  Clear all
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center">
                      <div className="text-2xl mr-2">{getFileTypeIcon(file.type)}</div>
                      <div>
                        <div className="font-medium truncate max-w-[200px]">{file.name}</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {getFileTypeLabel(file.type)}
                          </Badge>
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
              </div>
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
          {isSubmitting ? "Processing..." : "Rank Candidates"}
        </Button>
      </form>

      <LoadingIndicator progress={progress} visible={isSubmitting} />
    </>
  );
}
