import axios from "axios";
import {
  BatchResult,
  MatchResult,
  QuestionAnswer,
  UploadResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required for cookies/sessions
  timeout: 30000, // 30 second timeout
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

// Upload a single resume and match against job description
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

    // Log the raw response for debugging
    console.log("Raw API response:", response.data);

    // Handle snake_case to camelCase conversion
    const data: UploadResponse = {
      success: response.data.success || false,
      error: response.data.error,
      result: response.data.result,
      // Convert job_id to jobId if present
      job_id: response.data.job_id || response.data.jobId,
    };

    return data;
  } catch (error) {
    console.error("Error in uploadResumeAndMatch:", error);
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

// Upload multiple resumes and match against job description
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

// Get results for a single resume match
export async function getMatchResult(resultId: string): Promise<MatchResult> {
  const response = await api.get(`/results/${resultId}`);
  return response.data.result;
}

// Get results for a batch match
export async function getBatchResults(resultId: string): Promise<BatchResult> {
  const url = `/batch-results/${resultId}`;
  console.log(`Fetching batch results from: ${url}`);

  try {
    const response = await api.get(url);

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

// Cancel a running job
export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const response = await api.post(`/cancel-job/${jobId}`);
    return response.data.success || false;
  } catch (error) {
    console.error("Error cancelling job:", error);
    return false;
  }
}

// Generate a cover letter based on matching and missing skills
export async function generateCoverLetter(
  matchingSkills: string[],
  missingSkills: string[]
) {
  const response = await api.post(`/generate-cover-letter`, {
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
// Generate interview questions based on job description skills
export async function generateInterviewQuestions(
  skills: string[],
  jobDescription: string,
  includeSoftSkills: boolean = true
): Promise<{
  technicalQuestions: QuestionAnswer[];
  softSkillQuestions: QuestionAnswer[];
}> {
  try {
    console.log("Making API request to generate interview questions:", {
      skills,
      job_description: jobDescription,
      include_soft_skills: includeSoftSkills,
    });

    const response = await api.post("/generate-interview-questions", {
      skills,
      job_description: jobDescription,
      include_soft_skills: includeSoftSkills,
    });

    console.log("Received API response:", response.data);

    return {
      technicalQuestions: response.data.technical_questions || [],
      softSkillQuestions: response.data.soft_skill_questions || [],
    };
  } catch (error) {
    console.error("Error generating interview questions:", error);

    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
      });
    }

    if (error instanceof Error) {
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
    throw new Error("Failed to generate interview questions");
  }
}
