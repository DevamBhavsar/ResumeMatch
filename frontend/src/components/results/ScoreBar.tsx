import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ScoreBarProps {
  score: number;
  label: string;
  className?: string;
}

export function ScoreBar({ score, label, className }: ScoreBarProps) {
  const [width, setWidth] = useState(0);

  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Animate width
  useEffect(() => {
    // Small delay before animation starts
    const timeout = setTimeout(() => {
      setWidth(score);
    }, 300);

    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", getScoreColor())}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
