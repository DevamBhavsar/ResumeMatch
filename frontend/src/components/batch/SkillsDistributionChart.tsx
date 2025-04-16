"use client";

import { CandidateResult } from "@/lib/types";
import { Chart, ChartConfiguration } from "chart.js";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SkillsDistributionChartProps {
  candidates: CandidateResult[];
}

export function SkillsDistributionChart({
  candidates,
}: SkillsDistributionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !candidates.length) return;

    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Get all unique skills and their frequencies
    const skillFrequency = new Map<string, number>();
    const jdSkills = candidates[0].jd_skills || [];

    candidates.forEach((candidate) => {
      candidate.matching_skills.forEach((skill) => {
        skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
      });
    });

    // Sort skills by frequency and get top 10
    const topSkills = Array.from(skillFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels: topSkills.map(([skill]) => skill),
        datasets: [
          {
            label: "Number of Candidates",
            data: topSkills.map(([_, count]) => count),
            backgroundColor: jdSkills.includes(topSkills[0][0])
              ? "rgb(34, 197, 94)"
              : "rgb(239, 68, 68)",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.parsed.x} candidates`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Number of Candidates",
            },
            grid: {
              display: false,
            },
          },
          y: {
            grid: {
              display: false,
            },
          },
        },
      },
    };

    chartInstanceRef.current = new Chart(ctx, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [candidates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Skills Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: "400px", position: "relative" }}>
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  );
}
