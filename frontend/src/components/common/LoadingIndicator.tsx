import { ProgressUpdate } from "@/lib/types";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";

interface LoadingIndicatorProps {
  progress: ProgressUpdate | null;
  visible: boolean;
}

export function LoadingIndicator({ progress, visible }: LoadingIndicatorProps) {
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  
  // Animate progress bar
  useEffect(() => {
    if (progress?.progress !== undefined) {
      const targetProgress = progress.progress;
      const step = Math.max(1, Math.floor((targetProgress - displayProgress) / 10));
      
      if (displayProgress < targetProgress) {
        const timer = setTimeout(() => {
          setDisplayProgress(prev => Math.min(prev + step, targetProgress));
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [progress, displayProgress]);

  if (!visible) return null;

  // Add default progress value if none provided
  const currentProgress = displayProgress;
  const currentStage = progress?.stage ?? "extracting";
  const message = progress?.message ?? "Processing your resume...";

  // Add animation class
  const progressBarClass = "transition-all duration-500 ease-in-out";

  // Define the order of steps for comparison
  const stepsOrder = ["extracting", "analyzing", "calculating", "ranking"];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress 
            value={currentProgress} 
            className={`h-2 ${progressBarClass}`}
          />
          
          <p className="text-center text-muted-foreground">
            {message}
          </p>
          
          <div className="space-y-2">
            {stepsOrder.map((step) => (
              <StepItem 
                key={step}
                step={step} 
                label={getStepLabel(step)} 
                currentStep={currentStage}
                stepsOrder={stepsOrder}
              />
            ))}
          </div>
          
          {/* Add progress percentage */}
          <p className="text-center font-medium">
            {currentProgress}% Complete
          </p>
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
    case "calculating":
      return "Calculating match score";
    case "ranking":
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
}

function StepItem({ step, label, currentStep, stepsOrder }: StepItemProps) {
  // Get indices for comparison
  const stepIndex = stepsOrder.indexOf(step);
  const currentStepIndex = currentStep ? stepsOrder.indexOf(currentStep) : -1;
  
  const isActive = currentStep === step;
  const isCompleted = currentStepIndex > stepIndex;
  
  return (
    <div className={`flex items-center gap-3 p-2 rounded-md ${isActive ? 'bg-muted' : ''}`}>
      {isCompleted ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : isActive ? (
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      ) : (
        <Clock className="h-5 w-5 text-muted-foreground" />
      )}
      <span className={isActive ? 'font-medium' : isCompleted ? 'text-muted-foreground' : ''}>
        {label}
      </span>
    </div>
  );
}