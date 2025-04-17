"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface SkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsInput({ skills, onChange }: SkillsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddSkill = () => {
    if (!inputValue.trim()) return;

    // Check if skill already exists (case insensitive)
    const skillExists = skills.some(
      (skill) => skill.toLowerCase() === inputValue.trim().toLowerCase()
    );

    if (!skillExists) {
      const newSkills = [...skills, inputValue.trim()];
      onChange(newSkills);
    }

    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (index: number) => {
    const newSkills = [...skills];
    newSkills.splice(index, 1);
    onChange(newSkills);
  };

  // Common technical skills for quick selection
  const commonSkills = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "SQL",
    "AWS",
    "Docker",
    "Git",
    "TypeScript",
    "Java",
  ];

  const addCommonSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      onChange([...skills, skill]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a skill (e.g., Python, React, AWS)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAddSkill}
          disabled={!inputValue.trim()}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick add common skills */}
      {skills.length === 0 && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-2">
            Quick add common skills:
          </p>
          <div className="flex flex-wrap gap-2">
            {commonSkills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => addCommonSkill(skill)}
              >
                + {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Display added skills */}
      {skills.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-2">Added skills:</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                {skill}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleRemoveSkill(index)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {skill}</span>
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
