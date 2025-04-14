"use client";

import { MatchResult } from "@/lib/types";
import { Chart, registerables } from "chart.js";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

Chart.register(...registerables);

interface SkillGapChartProps {
  result: MatchResult;
}

export function SkillGapChart({ result }: SkillGapChartProps) {
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

    // Create chart with type assertion for the entire configuration
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ["Matching Skills", "Missing Skills"],
        datasets: [
          {
            data: [result.matching_skills.length, result.missing_skills.length],
            backgroundColor: ["#22c55e", "#ef4444"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context: { label: string; raw: number }) {
                const label = context.label || "";
                const value = context.raw;
                const total = result.matching_skills.length + result.missing_skills.length;
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
        cutout: '60%',
        animation: {
          // Use a separate type assertion for the animation object
          ...(({
            animateScale: true,
            animateRotate: true,
          } as any))
        },
      },
    } as any);

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
        <CardTitle>Skill Gap Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  );
}