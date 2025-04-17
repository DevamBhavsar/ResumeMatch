"use client";

import { CandidateTable } from "@/components/batch/CandidateTable";
import { SkillsDistributionChart } from "@/components/batch/SkillsDistributionChart";
import { Header } from "@/components/layout/Header";
import { RankingDistributionChart } from "@/components/results/RankingDistributionChart";
import { SkillsList } from "@/components/results/SkillsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBatchResults } from "@/lib/api";
import { BatchResult } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
function BatchResultsContent() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");
  const [results, setResults] = useState<BatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5; // More retries for batch processing
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setPollingEnabled(true);

    pollingIntervalRef.current = setInterval(async () => {
      if (!resultId) return;

      try {
        const data = await getBatchResults(resultId);
        setResults(data);
        setLoading(false);

        // Stop polling once we get results
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } catch (err) {
        // Only log errors, don't update state to avoid UI flicker
        if (
          err instanceof Error &&
          !err.message.includes("still being processed")
        ) {
          console.error("Polling error:", err);
        }
      }
    }, 5000); // Poll every 5 seconds
  }, [resultId]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function fetchResults() {
      try {
        if (!resultId) {
          setError("No result ID provided");
          setLoading(false);
          return;
        }

        try {
          const data = await getBatchResults(resultId);
          setResults(data);
          setLoading(false);
        } catch (err) {
          // Check if we should retry (only for "still processing" errors)
          if (
            err instanceof Error &&
            err.message.includes("still being processed") &&
            retryCount < maxRetries
          ) {
            console.log(
              `Batch results still processing, retrying in 3 seconds (${
                retryCount + 1
              }/${maxRetries})`
            );
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, 3000);
            return;
          } else if (
            err instanceof Error &&
            (err.message.includes("Lost connection") ||
              err.message.includes("Network error"))
          ) {
            console.log("Connection issues detected, falling back to polling");
            startPolling();
            return;
          }

          throw err;
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load batch results"
        );
        setLoading(false);
      }
    }

    fetchResults();
  }, [resultId, retryCount, startPolling]);
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-10 px-4">
          <div className="flex flex-col justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">
              {retryCount > 0
                ? `Loading batch results (attempt ${retryCount}/${maxRetries})...`
                : "Loading batch results..."}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Batch processing may take longer for multiple resumes
              </p>
            )}
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

          {/* Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Skills Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {results?.candidates && results.candidates.length > 0 && (
                  <SkillsDistributionChart candidates={results.candidates} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {results?.candidates && (
                  <RankingDistributionChart candidates={results.candidates} />
                )}
              </CardContent>
            </Card>
          </div>

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

export default function BatchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-10 px-4">
            <div className="flex justify-center items-center h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      }
    >
      <BatchResultsContent />
    </Suspense>
  );
}
