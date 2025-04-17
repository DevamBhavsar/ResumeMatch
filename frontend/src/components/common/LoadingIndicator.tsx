import { ProgressUpdate } from "@/lib/types";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";

interface LoadingIndicatorProps {
  progress: ProgressUpdate | null;
  visible: boolean;
  onCancel?: () => void;
}

export function LoadingIndicator({
  progress,
  visible,
  onCancel,
}: LoadingIndicatorProps) {
  const [displayProgress, setDisplayProgress] = useState<number>(0);

  // Animate progress bar
  useEffect(() => {
    if (progress?.progress !== undefined) {
      const targetProgress = progress.progress;
      const step = Math.max(
        1,
        Math.floor((targetProgress - displayProgress) / 10)
      );

      if (displayProgress < targetProgress) {
        const timer = setTimeout(() => {
          setDisplayProgress((prev) => Math.min(prev + step, targetProgress));
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [progress, displayProgress]);

  // Reset progress when visibility changes
  useEffect(() => {
    if (!visible) {
      setDisplayProgress(0);
    }
  }, [visible]);

  if (!visible) return null;

  // Add default progress value if none provided
  const currentProgress = displayProgress;
  const currentStage = progress?.stage ?? "extracting";
  const message = progress?.message ?? "Processing your resume...";
  const status = progress?.status ?? "processing";

  // Add animation class
  const progressBarClass = "transition-all duration-500 ease-in-out";

  // Define the order of steps for comparison
  const stepsOrder = [
    "extracting",
    "analyzing",
    "parsing",
    "calculating",
    "ranking",
    "finalizing",
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "error"
              ? "Processing Error"
              : status === "cancelled"
              ? "Processing Cancelled"
              : "Processing"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress
            value={currentProgress}
            className={`h-2 ${progressBarClass} ${
              status === "error"
                ? "bg-red-200"
                : status === "cancelled"
                ? "bg-yellow-200"
                : ""
            }`}
          />

          <p className="text-center text-muted-foreground">{message}</p>

          <div className="space-y-2">
            {stepsOrder.map((step) => (
              <StepItem
                key={step}
                step={step}
                label={getStepLabel(step)}
                currentStep={currentStage}
                stepsOrder={stepsOrder}
                status={status}
              />
            ))}
          </div>

          {/* Add progress percentage */}
          <p className="text-center font-medium">{currentProgress}% Complete</p>

          {/* Add cancel button if onCancel is provided and status is processing */}
          {onCancel && status === "processing" && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={onCancel}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Cancel Processing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get step label
function getStepLabel(step: string): string {
  switch (step) {
    case "extracting":
      return "Extracting text from resume";
    case "analyzing":
      return "Analyzing skills and keywords";
    case "parsing":
      return "Parsing job description";
    case "calculating":
      return "Calculating match score";
    case "ranking":
      return "Ranking candidates";
    case "finalizing":
      return "Finalizing results";
    default:
      return "Processing";
  }
}

interface StepItemProps {
  step: string;
  label: string;
  currentStep?: string;
  stepsOrder: string[];
  status: string;
}

function StepItem({
  step,
  label,
  currentStep,
  stepsOrder,
  status,
}: StepItemProps) {
  // Get indices for comparison
  const stepIndex = stepsOrder.indexOf(step);
  const currentStepIndex = currentStep ? stepsOrder.indexOf(currentStep) : -1;

  const isActive = currentStep === step;
  const isCompleted = currentStepIndex > stepIndex;

  // Handle error or cancelled status
  if (status === "error" || status === "cancelled") {
    return (
      <div
        className={`flex items-center gap-3 p-2 rounded-md ${
          isActive ? "bg-muted" : ""
        }`}
      >
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : isActive ? (
          <XCircle className="h-5 w-5 text-red-500" />
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground" />
        )}
        <span
          className={
            isActive
              ? "font-medium"
              : isCompleted
              ? "text-muted-foreground"
              : ""
          }
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-md ${
        isActive ? "bg-muted" : ""
      }`}
    >
      {isCompleted ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : isActive ? (
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      ) : (
        <Clock className="h-5 w-5 text-muted-foreground" />
      )}
      <span
        className={
          isActive ? "font-medium" : isCompleted ? "text-muted-foreground" : ""
        }
      >
        {label}
      </span>
    </div>
  );
}
