"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cancelJob } from "../api";
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
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressUpdateRef = useRef<number>(Date.now());
  const isProcessingRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // Store job status to prevent cancellation after completion
  const jobStatusRef = useRef<string>("processing");

  // Function to cancel the current job
  const cancelCurrentJob = useCallback(async () => {
    if (jobId) {
      try {
        // Don't cancel if job is already completed or cancelled
        if (jobStatusRef.current !== "processing") {
          console.log(
            `Job ${jobId} is already ${jobStatusRef.current}, skipping cancellation`
          );
          return false;
        }

        const success = await cancelJob(jobId);
        if (success) {
          console.log(`Successfully cancelled job: ${jobId}`);
        } else {
          console.error(`Failed to cancel job: ${jobId}`);
        }
        return success;
      } catch (error) {
        console.error(`Error cancelling job ${jobId}:`, error);
        return false;
      }
    }
    return false;
  }, [jobId]);

  // Clean up function to handle connection closure
  const cleanupConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Setup EventSource connection
  const setupEventSource = useCallback(() => {
    if (!jobId) return;

    // Don't reconnect if we've reached max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log(
        `Max reconnection attempts (${maxReconnectAttempts}) reached for job: ${jobId}`
      );
      if (onError) {
        onError("Failed to maintain connection after multiple attempts");
      }
      return;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log(
      `Setting up progress tracking for job: ${jobId} (attempt ${
        reconnectAttemptsRef.current + 1
      })`
    );

    // Use SSE for progress tracking
    const eventSource = new EventSource(`${API_BASE_URL}/progress/${jobId}`);
    eventSourceRef.current = eventSource;
    lastProgressUpdateRef.current = Date.now();

    eventSource.onopen = () => {
      console.log(`Connected to progress stream for job: ${jobId}`);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressUpdate;
        console.log(`Progress update received:`, data);
        setProgress(data);
        lastProgressUpdateRef.current = Date.now();

        // Update job status
        if (data.status) {
          jobStatusRef.current = data.status;
        }

        if (data.status === "completed") {
          console.log(`Job completed with redirect URL: ${data.redirect_url}`);
          isProcessingRef.current = false;
          cleanupConnection();
          if (onComplete) {
            onComplete(data.redirect_url);
          }
        } else if (data.status === "error") {
          console.log(`Job failed with error: ${data.message}`);
          isProcessingRef.current = false;
          cleanupConnection();
          if (onError && data.message) {
            onError(data.message);
          }
        } else if (data.status === "cancelled") {
          console.log(`Job was cancelled: ${data.message}`);
          isProcessingRef.current = false;
          cleanupConnection();
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
      cleanupConnection();

      // Attempt to reconnect if still processing
      if (jobStatusRef.current === "processing") {
        reconnectAttemptsRef.current++;
        console.log(
          `Connection error, attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
        );

        // Exponential backoff for reconnection attempts
        const backoffTime = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current - 1),
          10000
        );
        setTimeout(() => {
          setupEventSource();
        }, backoffTime);
      } else if (onError) {
        onError("Lost connection to server");
      }
    };
  }, [jobId, onComplete, onError, cleanupConnection]);

  useEffect(() => {
    if (!jobId) return;

    isProcessingRef.current = true;
    jobStatusRef.current = "processing"; // Reset job status
    reconnectAttemptsRef.current = 0; // Reset reconnect attempts

    // Initial setup of EventSource
    setupEventSource();

    // Set up a watchdog timer to detect stalled progress
    const watchdog = setInterval(() => {
      const now = Date.now();
      if (now - lastProgressUpdateRef.current > 30000) {
        // 30 seconds without updates
        console.warn("Progress updates stalled, closing connection");
        cleanupConnection();

        // Try to reconnect if still processing
        if (jobStatusRef.current === "processing") {
          reconnectAttemptsRef.current++;
          console.log(
            `Connection stalled, attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
          setupEventSource();
        } else if (onError) {
          onError("Progress updates stalled");
        }
      }
    }, 5000);

    watchdogTimerRef.current = watchdog;

    return () => {
      console.log(`Cleaning up progress tracking for job: ${jobId}`);

      // Skip job cancellation in development mode
      const isDevelopment = process.env.NODE_ENV === "development";

      if (
        isProcessingRef.current &&
        jobStatusRef.current === "processing" &&
        !isDevelopment
      ) {
        console.log(
          `Component unmounting during processing, cancelling job: ${jobId}`
        );
        cancelCurrentJob();
      } else if (isDevelopment) {
        console.log(
          `Skipping job cancellation in development mode for job: ${jobId}`
        );
      }

      cleanupConnection();
    };
  }, [jobId, setupEventSource, onError, cleanupConnection, cancelCurrentJob]);

  return {
    progress,
    isConnected,
    cancelJob: cancelCurrentJob,
  };
}
