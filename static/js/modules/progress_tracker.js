export class ProgressTracker {
  constructor(jobId) {
    this.jobId = jobId;
    this.eventSource = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  startTracking(onProgress) {
    this.eventSource = new EventSource(`/progress/${this.jobId}`);

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Progress update received:", data);
      onProgress(data);

      if (data.status === "completed" || data.status === "error") {
        this.stopTracking();
      }
    };

    this.eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying connection... Attempt ${this.retryCount}`);
        // Wait 1 second before retrying
        setTimeout(() => this.startTracking(onProgress), 1000);
      } else {
        console.error("Max retries reached, stopping progress tracking");
        this.stopTracking();
        onProgress({
          status: "error",
          message: "Lost connection to server",
        });
      }
    };

    this.eventSource.onopen = () => {
      console.log("EventSource connection established");
      this.retryCount = 0;
    };
  }

  stopTracking() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
