"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateInterviewQuestions } from "@/lib/api";
import { QuestionAnswer } from "@/lib/types";
import { Clipboard, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { QuestionCard } from "./QuestionCard";

interface InterviewQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobDescription: string;
  skills: string[];
}

export function InterviewQuestionsModal({
  isOpen,
  onClose,
  jobDescription,
  skills,
}: InterviewQuestionsModalProps) {
  const [technicalQuestions, setTechnicalQuestions] = useState<
    QuestionAnswer[]
  >([]);
  const [softSkillQuestions, setSoftSkillQuestions] = useState<
    QuestionAnswer[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("technical");

  const handleGenerateQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        technicalQuestions: techQuestions,
        softSkillQuestions: softQuestions,
      } = await generateInterviewQuestions(skills, jobDescription, true);

      setTechnicalQuestions(techQuestions);
      setSoftSkillQuestions(softQuestions);
    } catch (err) {
      console.error("Error generating questions:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate interview questions"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (questions: QuestionAnswer[]) => {
    if (questions.length === 0) return;

    const text = questions
      .map((qa, i) => `${i + 1}. ${qa.question}\n\nAnswer: ${qa.answer}\n\n`)
      .join("");

    navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const hasQuestions =
    technicalQuestions.length > 0 || softSkillQuestions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Smart Interview Questions</DialogTitle>
          <DialogDescription>
            Generate interview questions based on the job description skills.
          </DialogDescription>
        </DialogHeader>

        {!hasQuestions && !loading && !error ? (
          <div className="py-6 text-center">
            <p className="mb-4 text-muted-foreground">
              Generate technical interview questions based on the most important
              skills in the job description.
            </p>
            <Button onClick={handleGenerateQuestions}>
              Generate Questions
            </Button>
          </div>
        ) : loading ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">
              Generating interview questions...
            </p>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleGenerateQuestions}>Try Again</Button>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="technical">Technical Questions</TabsTrigger>
                <TabsTrigger value="soft-skills">
                  Soft Skills Questions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="technical" className="mt-4">
                <div className="space-y-4">
                  {technicalQuestions.map((qa, index) => (
                    <QuestionCard
                      key={index}
                      questionAnswer={qa}
                      index={index}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="soft-skills" className="mt-4">
                <div className="space-y-4">
                  {softSkillQuestions.map((qa, index) => (
                    <QuestionCard
                      key={index}
                      questionAnswer={qa}
                      index={index}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex flex-row justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={handleGenerateQuestions}
                disabled={loading}
              >
                Regenerate
              </Button>
              <Button
                onClick={() =>
                  copyToClipboard(
                    activeTab === "technical"
                      ? technicalQuestions
                      : softSkillQuestions
                  )
                }
                disabled={loading}
              >
                {copied ? (
                  <>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
