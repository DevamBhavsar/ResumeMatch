"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionAnswer } from "@/lib/types";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";

interface QuestionCardProps {
  questionAnswer: QuestionAnswer;
  index: number;
}

export function QuestionCard({ questionAnswer, index }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 bg-muted/30">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-medium text-base">
              <span className="font-bold mr-2">{index + 1}.</span>
              {questionAnswer.question}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-8 w-8 p-0 rounded-full"
              onClick={() => copyToClipboard(questionAnswer.question)}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy question</span>
            </Button>
          </div>
        </div>

        <div className="border-t">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-2 h-auto"
            onClick={toggleAnswer}
          >
            <span className="font-medium">
              {showAnswer ? "Hide Answer" : "Show Answer"}
            </span>
            {showAnswer ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showAnswer && (
            <div className="p-4 bg-muted/10 border-t">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm whitespace-pre-line">
                  {questionAnswer.answer}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 w-8 p-0 rounded-full mt-1"
                  onClick={() => copyToClipboard(questionAnswer.answer)}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy answer</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
