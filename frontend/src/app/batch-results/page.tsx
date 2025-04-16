"use client";

import { CandidateTable } from "@/components/batch/CandidateTable";
import { Header } from "@/components/layout/Header";
import { SkillsList } from "@/components/results/SkillsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBatchResults } from "@/lib/api";
import { BatchResult } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BatchResultsPage() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");
  const [results, setResults] = useState<BatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        if (!resultId) {
          setError("No result ID provided");
          setLoading(false);
          return;
        }

        const data = await getBatchResults(resultId);
        setResults(data);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load batch results");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [resultId]);

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

  if (error || !results) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-10 px-4">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold mb-4">
                  Error Loading Results
                </h2>
                <p className="text-muted-foreground mb-6">
                  {error || "Results not found"}
                </p>
                <Link href="/batch">
                  <Button>Return to Batch Upload</Button>
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Candidate Ranking Results
          </h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Job Description Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-medium mb-2">Required Skills</h3>
              {results.candidates &&
              results.candidates.length > 0 &&
              results.candidates[0].jd_skills ? (
                <SkillsList
                  skills={results.candidates[0].jd_skills}
                  type="matching"
                />
              ) : (
                <p className="text-muted-foreground">
                  No skills extracted from job description.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Candidate Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              {results.candidates && results.candidates.length > 0 ? (
                <CandidateTable candidates={results.candidates} />
              ) : (
                <p className="text-muted-foreground">
                  No candidates to display.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Link href="/batch">
              <Button variant="outline">Try Another Batch</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Single Resume Mode</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
