"use client";

import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Header } from "@/components/layout/Header";
import { QuestionCard } from "@/components/queGenrator/QuestionCard";
import { SkillsInput } from "@/components/queGenrator/SkillsInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { generateInterviewQuestions } from "@/lib/api";
import { QuestionAnswer } from "@/lib/types";
import {
  Clipboard,
  Copy,
  Loader2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

export default function InterviewQuestionsPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [manualSkills, setManualSkills] = useState<string[]>([]);
  const [technicalQuestions, setTechnicalQuestions] = useState<
    QuestionAnswer[]
  >([]);
  const [softSkillQuestions, setSoftSkillQuestions] = useState<
    QuestionAnswer[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("job-description");
  const [questionsTab, setQuestionsTab] = useState("technical");

  const handleGenerateQuestions = async () => {
    if (activeTab === "job-description" && !jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }

    if (activeTab === "manual-skills" && manualSkills.length === 0) {
      setError("Please add at least one skill");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use either job description or manual skills based on active tab
      const {
        technicalQuestions: techQuestions,
        softSkillQuestions: softQuestions,
      } = await generateInterviewQuestions(
        activeTab === "manual-skills" ? manualSkills : [],
        activeTab === "job-description" ? jobDescription : "",
        true // Always include soft skills
      );

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

  const copyAllToClipboard = (questions: QuestionAnswer[]) => {
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">
            Smart Interview Questions Generator
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Generate tailored technical interview questions with expert answers
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate Questions</CardTitle>
              <CardDescription>
                Choose how you want to generate interview questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="job-description">
                    From Job Description
                  </TabsTrigger>
                  <TabsTrigger value="manual-skills">From Skills</TabsTrigger>
                </TabsList>

                <TabsContent value="job-description" className="mt-4">
                  <Textarea
                    placeholder="Paste job description here..."
                    className="min-h-[200px] mb-4"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </TabsContent>

                <TabsContent value="manual-skills" className="mt-4">
                  <div className="mb-4">
                    <SkillsInput
                      skills={manualSkills}
                      onChange={setManualSkills}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleGenerateQuestions}
                disabled={
                  loading ||
                  (activeTab === "job-description" && !jobDescription.trim()) ||
                  (activeTab === "manual-skills" && manualSkills.length === 0)
                }
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Questions & Answers...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Generate Interview Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <ErrorDisplay
              title="Error Generating Questions"
              message={error}
              onRetry={handleGenerateQuestions}
            />
          )}

          {hasQuestions && !error && (
            <div className="space-y-6">
              <Tabs value={questionsTab} onValueChange={setQuestionsTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="technical">
                    Technical Questions
                  </TabsTrigger>
                  <TabsTrigger value="soft-skills">
                    Soft Skills Questions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="technical" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Technical Interview Questions</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateQuestions}
                            disabled={loading}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyAllToClipboard(technicalQuestions)
                            }
                            disabled={
                              loading || technicalQuestions.length === 0
                            }
                          >
                            {copied ? (
                              <>
                                <Clipboard className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy All
                              </>
                            )}
                          </Button>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        Click "Show Answer" to reveal expert answers for each
                        question
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {technicalQuestions.length > 0 ? (
                          technicalQuestions.map((qa, index) => (
                            <QuestionCard
                              key={index}
                              questionAnswer={qa}
                              index={index}
                            />
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            No technical questions generated yet.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="soft-skills" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Soft Skills Interview Questions</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyAllToClipboard(softSkillQuestions)}
                          disabled={softSkillQuestions.length === 0}
                        >
                          {copied ? (
                            <>
                              <Clipboard className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy All
                            </>
                          )}
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Common behavioral and soft skill questions for any
                        interview
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {softSkillQuestions.length > 0 ? (
                          softSkillQuestions.map((qa, index) => (
                            <QuestionCard
                              key={index}
                              questionAnswer={qa}
                              index={index}
                            />
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            No soft skill questions available.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
