export class ProgressTracker {
  constructor(jobId) {
    this.jobId = jobId;
    this.eventSource = null;
    this.ws = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.lastUpdate = 0;
    this.updateBuffer = [];
    this.updateTimeout = null;
    this.DEBOUNCE_TIME = 100; // ms
    this.BATCH_SIZE = 5;
    this.wsRetryCount = 0;
    this.maxWsRetries = 3;
    this.wsRetryDelay = 1000; // Start with 1 second delay
  }

  startTracking(onProgress) {
    // Try WebSocket first
    this.connectWebSocket(onProgress);

    // Fallback to EventSource if WebSocket fails
    this.eventSource = new EventSource(`/progress/${this.jobId}`);

    this.eventSource.onmessage = (event) => {
      this.handleUpdate(JSON.parse(event.data), onProgress);
    };

    this.eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(
          () => this.startTracking(onProgress),
          1000 * this.retryCount
        );
      } else {
        this.stopTracking();
        onProgress({ status: "error", message: "Connection lost" });
      }
    };
  }

  connectWebSocket(onProgress) {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/progress/${this.jobId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connection established");
        this.wsRetryCount = 0; // Reset retry count on successful connection
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Handle heartbeat
        if (data.type === "heartbeat") {
          this.lastHeartbeat = data.timestamp;
          return;
        }

        this.handleUpdate(data, onProgress);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.retryWebSocketConnection(onProgress);
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        this.retryWebSocketConnection(onProgress);
      };
    } catch (error) {
      console.warn("WebSocket connection failed:", error);
      this.retryWebSocketConnection(onProgress);
    }
  }

  retryWebSocketConnection(onProgress) {
    if (this.wsRetryCount < this.maxWsRetries) {
      this.wsRetryCount++;
      const delay = this.wsRetryDelay * Math.pow(2, this.wsRetryCount - 1); // Exponential backoff

      console.log(
        `Retrying WebSocket connection in ${delay}ms (attempt ${this.wsRetryCount})`
      );

      setTimeout(() => {
        this.connectWebSocket(onProgress);
      }, delay);
    } else {
      console.warn(
        "WebSocket connection failed after retries, falling back to EventSource"
      );
      this.ws = null;
      // Initialize EventSource fallback if not already done
      if (!this.eventSource) {
        this.initEventSource(onProgress);
      }
    }
  }

  initEventSource(onProgress) {
    this.eventSource = new EventSource(`/progress/${this.jobId}`);

    this.eventSource.onmessage = (event) => {
      this.handleUpdate(JSON.parse(event.data), onProgress);
    };

    this.eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(
          () => this.startTracking(onProgress),
          1000 * this.retryCount
        );
      } else {
        this.stopTracking();
        onProgress({ status: "error", message: "Connection lost" });
      }
    };
  }

  handleUpdate(data, onProgress) {
    const now = Date.now();

    // Add update to buffer
    this.updateBuffer.push(data);

    // Clear existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Process updates if we have enough or after debounce time
    if (
      this.updateBuffer.length >= this.BATCH_SIZE ||
      now - this.lastUpdate >= this.DEBOUNCE_TIME
    ) {
      this.processUpdates(onProgress);
    } else {
      // Set timeout for debouncing
      this.updateTimeout = setTimeout(() => {
        this.processUpdates(onProgress);
      }, this.DEBOUNCE_TIME);
    }

    // Check for completion
    if (data.status === "completed" || data.status === "error") {
      this.stopTracking();
    }
  }

  processUpdates(onProgress) {
    if (this.updateBuffer.length === 0) return;

    // Get the latest update
    const latestUpdate = this.updateBuffer[this.updateBuffer.length - 1];

    // Call progress callback with latest data
    onProgress(latestUpdate);

    // Clear buffer and update timestamp
    this.updateBuffer = [];
    this.lastUpdate = Date.now();
  }

  stopTracking() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
  }
}
