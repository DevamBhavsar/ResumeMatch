"use client";

import { CoverLetterGenerator } from "@/components/common/CoverLetterGenerator";
import { Header } from "@/components/layout/Header";
import { ScoreBar } from "@/components/results/ScoreBar";
import { ScoreCircle } from "@/components/results/ScoreCircle";
import { SkillGapChart } from "@/components/results/SkillGapChart";
import { SkillRadarChart } from "@/components/results/SkillRadarChart";
import { SkillsList } from "@/components/results/SkillsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMatchResult } from "@/lib/api";
import { MatchResult } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");
  const resultData = searchParams.get("data");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        // First check if we have data directly in the URL
        if (resultData) {
          try {
            const parsedData = JSON.parse(decodeURIComponent(resultData)) as MatchResult;
            setResult(parsedData);
            setLoading(false);
            return;
          } catch (parseErr) {
            console.error("Error parsing result data:", parseErr);
            // Continue to try fetching by ID if parsing fails
          }
        }

        // If no data parameter or parsing failed, try to fetch by ID
        if (!resultId) {
          setError("No result ID provided");
          setLoading(false);
          return;
        }

        const data = await getMatchResult(resultId);
        setResult(data);
      } catch (err) {
        console.error("Error fetching result:", err);
        setError("Failed to load match results");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [resultId, resultData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-10 px-4">
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-10 px-4">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold mb-4">Error Loading Results</h2>
                <p className="text-muted-foreground mb-6">{error || "Result not found"}</p>
                <Link href="/">
                  <Button>Return to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Match Results</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-center">Overall Match Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ScoreCircle score={result.overall_score} size="lg" />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBar score={result.skill_match} label="Skill Match" />
                <ScoreBar score={result.text_similarity} label="Text Similarity" />
                <ScoreBar score={result.semantic_similarity} label="Semantic Similarity" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Matching Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <SkillsList skills={result.matching_skills} type="matching" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Missing Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <SkillsList skills={result.missing_skills} type="missing" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <SkillGapChart result={result} />
            <SkillRadarChart result={result} />
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {result.overall_score >= 80 ? (
                <p>
                  You're a strong match for this position! Consider highlighting your
                  matching skills in your application.
                </p>
              ) : result.overall_score >= 60 ? (
                <p>
                  You're a good match for this position, but might want to address
                  some of the missing skills in your application.
                </p>
              ) : (
                <p>
                  This position may require more skills than currently demonstrated on
                  your resume. Consider acquiring the missing skills or highlighting
                  transferable skills.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <CoverLetterGenerator 
              matchingSkills={result.matching_skills} 
              missingSkills={result.missing_skills} 
            />
            <Link href="/">
              <Button variant="outline">Try Another</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
