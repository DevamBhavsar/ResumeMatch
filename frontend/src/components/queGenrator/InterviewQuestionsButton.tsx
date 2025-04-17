"use client";

import { InterviewQuestionsModal } from "@/components/queGenrator/InterviewQuestionsModal";
import { Button } from "@/components/ui/button";
import { CandidateResult } from "@/lib/types";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

interface InterviewQuestionsButtonProps {
  jobDescription: string;
  candidates: CandidateResult[];
}

export function InterviewQuestionsButton({
  jobDescription,
  candidates,
}: InterviewQuestionsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract skills from the job description
  // Use the first candidate's jd_skills if available
  const skills =
    candidates.length > 0 && candidates[0].jd_skills
      ? candidates[0].jd_skills
      : [];

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Generate Interview Questions
      </Button>

      <InterviewQuestionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobDescription={jobDescription}
        skills={skills}
      />
    </>
  );
}
