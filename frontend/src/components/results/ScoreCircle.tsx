"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreCircle({ score, size = "md", className }: ScoreCircleProps) {
  const [displayScore, setDisplayScore] = useState(0);

  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  // Determine background gradient based on score
  const getScoreGradient = () => {
    if (score >= 80) return `conic-gradient(#22c55e 0% ${score}%, #e5e7eb ${score}% 100%)`;
    if (score >= 60) return `conic-gradient(#eab308 0% ${score}%, #e5e7eb ${score}% 100%)`;
    return `conic-gradient(#ef4444 0% ${score}%, #e5e7eb ${score}% 100%)`;
  };

  // Determine size classes
  const sizeClasses = {
    sm: "w-20 h-20 text-xl",
    md: "w-32 h-32 text-3xl",
    lg: "w-40 h-40 text-4xl",
  };

  // Animate score counter
  useEffect(() => {
    const duration = 1500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentCount = Math.floor(progress * score);
      
      setDisplayScore(currentCount);
      
      if (frame === totalFrames) {
        clearInterval(counter);
        setDisplayScore(score);
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [score]);

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center font-bold",
        sizeClasses[size],
        className
      )}
      style={{ background: getScoreGradient() }}
    >
      <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
        <span className={getScoreColor()}>{displayScore}%</span>
      </div>
    </div>
  );
}
