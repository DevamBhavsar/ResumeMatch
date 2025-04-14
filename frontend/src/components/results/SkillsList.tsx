import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface SkillsListProps {
  skills: string[];
  type: "matching" | "missing";
  className?: string;
}

export function SkillsList({ skills, type, className }: SkillsListProps) {
  if (skills.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground italic">
          {type === "matching" ? "No matching skills found." : "No missing skills! Great job!"}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <TooltipProvider>
        {skills.map((skill, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Badge
                variant={type === "matching" ? "default" : "destructive"}
                className="cursor-help"
              >
                {skill}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {type === "matching"
                  ? `You have this skill: ${skill}`
                  : `Missing skill: ${skill} - Consider adding this to your resume`}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
