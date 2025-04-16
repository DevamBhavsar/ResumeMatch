import axios from "axios";
import { BatchResult, MatchResult, UploadResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required for cookies/sessions
});

// Update the error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error("API Error:", error.response.data);
      throw new Error(error.response.data.error || "An error occurred");
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error:", error.request);
      throw new Error("Network error - please check your connection");
    } else {
      // Request setup error
      console.error("Request Error:", error.message);
      throw new Error("Failed to make request");
    }
  }
);

// Update uploadResumeAndMatch to handle the actual response structure
export async function uploadResumeAndMatch(
  resume: File,
  jobDescription: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("resume", resume);
  formData.append("job_description", jobDescription);

  try {
    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Add typecasting to ensure response.data matches our interface
    const data = response.data as UploadResponse;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

// Update uploadBatchAndMatch to use the api instance consistently
export async function uploadBatchAndMatch(
  resumes: File[],
  jobDescription: string
) {
  const formData = new FormData();

  resumes.forEach((resume) => {
    formData.append("resumes", resume);
  });

  formData.append("job_description", jobDescription);

  const response = await api.post("/batch-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function getMatchResult(resultId: string): Promise<MatchResult> {
  const response = await axios.get(`${API_BASE_URL}/results/${resultId}`);
  return response.data;
}

export async function getBatchResults(resultId: string): Promise<BatchResult> {
  const url = `${API_BASE_URL}/batch-results/${resultId}`;
  console.log(`Fetching batch results from: ${url}`);

  try {
    const response = await axios.get(url);

    if (response.status === 202) {
      // Still processing
      throw new Error("Results are still being processed");
    }

    if (!response.data.candidates) {
      throw new Error(response.data.message || "Invalid response format");
    }

    return response.data;
  } catch (error) {
    console.error("Error in getBatchResults:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Results not found or have expired");
      }
      throw new Error(error.response?.data?.message || error.message);
    }

    throw error;
  }
}

export async function generateCoverLetter(
  matchingSkills: string[],
  missingSkills: string[]
) {
  const response = await axios.post(`${API_BASE_URL}/generate-cover-letter`, {
    matching_skills: matchingSkills,
    missing_skills: missingSkills,
  });

  return response.data.cover_letter;
}

// Get chart as image from server
export async function getChartImage(
  chartType: "skill-gap" | "skill-radar",
  data: any
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/generate-chart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chart_type: chartType,
      data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate chart: ${response.statusText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
