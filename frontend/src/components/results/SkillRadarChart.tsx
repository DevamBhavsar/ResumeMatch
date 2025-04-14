"use client";

import { MatchResult } from "@/lib/types";
import { Chart, ChartConfiguration, ChartData, ChartOptions, registerables } from "chart.js";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

Chart.register(...registerables);

interface SkillRadarChartProps {
  result: MatchResult;
}

export function SkillRadarChart({ result }: SkillRadarChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Get top 5 skills from each category for the radar chart
    const topMatchingSkills = result.matching_skills.slice(0, 5);
    const topMissingSkills = result.missing_skills.slice(0, 5);

    // Combine all skills for labels
    const allSkills = [...topMatchingSkills, ...topMissingSkills];

    // Create data for matching skills with strength values
    const matchingData = allSkills.map((skill) => {
      if (topMatchingSkills.includes(skill)) {
        return result.skill_strengths?.[skill] || 100;
      }
      return 0;
    });

    // Prepare chart data
    const data: ChartData = {
      labels: allSkills,
      datasets: [
        {
          label: "Your Skills",
          data: matchingData,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgb(54, 162, 235)",
          pointBackgroundColor: "rgb(54, 162, 235)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(54, 162, 235)",
        },
        {
          label: "Required Skills",
          data: allSkills.map(() => 100), // All skills at 100%
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgb(255, 99, 132)",
          pointBackgroundColor: "rgb(255, 99, 132)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(255, 99, 132)",
        },
      ],
    };

    // Chart options
    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            display: true,
          },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: {
            display: false,
            stepSize: 20,
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.raw as number;
              return `${label}: ${value}%`;
            },
          },
        },
      },
    };

    // Create chart
    const config: ChartConfiguration = {
      type: "radar",
      data,
      options,
    };

    chartInstanceRef.current = new Chart(ctx, config);

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [result]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Radar Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  );
}
