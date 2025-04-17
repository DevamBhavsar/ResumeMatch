// Resume and Job Description types
export interface ResumeFile {
  name: string;
  size: number;
  type: string;
  content?: string;
}

export interface JobDescription {
  text: string;
}

export interface ProgressUpdate {
  status: "processing" | "completed" | "error" | "cancelled";
  progress: number;
  stage?:
    | "extracting"
    | "analyzing"
    | "calculating"
    | "ranking"
    | "parsing"
    | "finalizing"
    | "complete"
    | "error";
  message: string;
  redirect_url?: string;
  type?: "heartbeat"; //  for WebSocket heartbeat messages
  timestamp?: number; //  for WebSocket heartbeat messages
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface MatchResult {
  overall_score: number;
  skill_match: number;
  text_similarity: number;
  semantic_similarity: number;
  matching_skills: string[];
  missing_skills: string[];
  skill_strengths?: Record<string, number>;
  contact_info?: ContactInfo;
}

export interface CandidateResult extends MatchResult {
  rank: number;
  resume_name: string;
  jd_skills?: string[];
}

export interface BatchResult {
  job_description: string;
  candidates: CandidateResult[];
}

export interface FileWithPreview extends File {
  preview: string;
}

export interface UploadResponse {
  success: boolean;
  error?: string;
  result?: MatchResult;
  job_id?: string;
}

export interface JobStatus {
  jobId: string;
  status: "processing" | "completed" | "error" | "cancelled";
  progress: number;
}
