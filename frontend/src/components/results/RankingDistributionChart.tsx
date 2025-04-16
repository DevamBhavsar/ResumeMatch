import { CandidateResult } from "@/lib/types";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RankingDistributionChartProps {
  candidates: CandidateResult[];
}

export function RankingDistributionChart({
  candidates,
}: RankingDistributionChartProps) {
  const data = [
    { range: "80-100", count: 0 },
    { range: "60-79", count: 0 },
    { range: "40-59", count: 0 },
    { range: "20-39", count: 0 },
    { range: "0-19", count: 0 },
  ];

  candidates.forEach((candidate) => {
    const score = candidate.overall_score;
    if (score >= 80) data[0].count++;
    else if (score >= 60) data[1].count++;
    else if (score >= 40) data[2].count++;
    else if (score >= 20) data[3].count++;
    else data[4].count++;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="range" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
