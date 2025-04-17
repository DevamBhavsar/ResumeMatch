"use client";

import { uploadResumeAndMatch } from "@/lib/api";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useProgressTracker } from "@/lib/hooks/useProgressTracker";
import { formatFileSize } from "@/lib/utils/file-utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
    maxSizeMB: 5,
    acceptedFileTypes: [".pdf", ".docx", ".txt"],
    onError: (message) => toast.error("Error", { description: message }),
  });

  const onComplete = useCallback(
    (redirectUrl: string | undefined) => {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (jobId) {
        router.push(`/results?id=${jobId}`);
      } else {
        router.push("/results");
      }
    },
    [router, jobId]
  );

  const onError = useCallback(
    (message: string) => {
      toast.error("Error", { description: message });
      setIsSubmitting(false);
      setJobId(null);
    },
    [setIsSubmitting, setJobId]
  );

  const { progress, cancelJob } = useProgressTracker(jobId, {
    onComplete,
    onError,
  });
  // Add a ref to track job status
  const jobStatusRef = useRef<string>("processing");

  // Update the job status when progress updates
  useEffect(() => {
    if (progress?.status) {
      jobStatusRef.current = progress.status;
    }
  }, [progress]);

  // Modify the cleanup effect
  useEffect(() => {
    return () => {
      // Only cancel if still submitting AND job is still processing
      if (isSubmitting && jobId && jobStatusRef.current === "processing") {
        console.log(
          "Component unmounting during active processing, cancelling job"
        );
        cancelJob();
      }
    };
  }, [isSubmitting, jobId, cancelJob]);
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
      console.log("Uploading file:", files[0].name);
      const response = await uploadResumeAndMatch(files[0], jobDescription);
      console.log("Upload response:", response);

      if (!response.success) {
        setError(response.error || "Failed to process resume");
        setIsSubmitting(false);
        return;
      }

      // Check if we got a jobId for progress tracking
      if (response.job_id) {
        console.log("Job ID received:", response.job_id);
        // Only set jobId once and don't change it during processing
        setJobId((prevJobId) =>
          prevJobId !== null ? prevJobId : response.job_id || null
        );
      } else if (response.result) {
        // Direct result without progress tracking
        console.log("Direct result received");
        const encodedData = encodeURIComponent(JSON.stringify(response.result));
        router.push(`/results?data=${encodedData}`);
      } else {
        console.error("Invalid response format:", response);
        throw new Error(
          "Invalid response format: neither jobId nor result found in response"
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(
        error instanceof Error ? error.message : "Failed to process resume"
      );
      setIsSubmitting(false);
    }
  };
  const handleCancelJob = async () => {
    try {
      await cancelJob();
      toast.info("Processing cancelled");
      setIsSubmitting(false);
    } catch (error) {
      toast.error("Failed to cancel processing");
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
            <label
              htmlFor="resume"
              className="cursor-pointer flex flex-col items-center"
            >
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

      <LoadingIndicator
        progress={progress}
        visible={isSubmitting}
        onCancel={handleCancelJob}
      />
    </>
  );
}
