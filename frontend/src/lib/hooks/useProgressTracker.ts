"use client";

import { useEffect, useState } from "react";
import { ProgressUpdate } from "../types";

interface UseProgressTrackerOptions {
  onComplete?: (redirectUrl?: string) => void;
  onError?: (message: string) => void;
}

export function useProgressTracker(
  jobId: string | null,
  { onComplete, onError }: UseProgressTrackerOptions = {}
) {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);

  useEffect(() => {
    if (!jobId) return;

    console.log(`Setting up progress tracking for job: ${jobId}`);

    // Use the API_BASE_URL from environment variables or default to empty string
    const API_BASE_URL = process.env.FRONTEND_URL || "";

    // Use SSE for progress tracking
    const eventSource = new EventSource(`${API_BASE_URL}/progress/${jobId}`);
    let lastProgressUpdate = Date.now();

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressUpdate;
        console.log(`Progress update received:`, data);
        setProgress(data);
        lastProgressUpdate = Date.now();

        if (data.status === "completed") {
          console.log(`Job completed with redirect URL: ${data.redirect_url}`);
          eventSource.close();
          if (onComplete) {
            onComplete(data.redirect_url);
          }
        } else if (data.status === "error") {
          console.log(`Job failed with error: ${data.message}`);
          eventSource.close();
          if (onError && data.message) {
            onError(data.message);
          }
        }
      } catch (error) {
        console.error("Error parsing progress update:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
      if (onError) {
        onError("Lost connection to server");
      }
    };

    // Set up a watchdog timer to detect stalled progress
    const watchdog = setInterval(() => {
      const now = Date.now();
      if (now - lastProgressUpdate > 30000) {
        // 30 seconds without updates
        console.warn("Progress updates stalled, closing connection");
        clearInterval(watchdog);
        eventSource.close();
        if (onError) {
          onError("Progress updates stalled");
        }
      }
    }, 5000);

    return () => {
      console.log(`Cleaning up progress tracking for job: ${jobId}`);
      clearInterval(watchdog);
      eventSource.close();
    };
  }, [jobId, onComplete, onError]);

  return { progress };
}
