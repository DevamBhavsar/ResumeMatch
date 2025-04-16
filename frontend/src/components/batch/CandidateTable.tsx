import { CandidateResult } from "@/lib/types";
import { useState } from "react";
import { ScoreCircle } from "../results/ScoreCircle";
import { SkillGapChart } from "../results/SkillGapChart";
import { SkillsList } from "../results/SkillsList";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface CandidateTableProps {
  candidates: CandidateResult[];
}

export function CandidateTable({ candidates }: CandidateTableProps) {
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateResult | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead className="w-[120px]">Overall Score</TableHead>
              <TableHead className="w-[100px]">Skill Match</TableHead>
              <TableHead className="w-[100px]">Text Similarity</TableHead>
              <TableHead className="w-[100px]">Semantic Similarity</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.resume_name}>
                <TableCell className="font-medium text-center">
                  {candidate.rank}
                </TableCell>
                <TableCell>
                  {candidate.resume_name}
                  {candidate.contact_info?.name && (
                    <span className="text-muted-foreground text-sm ml-1">
                      ({candidate.contact_info.name})
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${
                        candidate.overall_score >= 80
                          ? "bg-green-500"
                          : candidate.overall_score >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${candidate.overall_score}%` }}
                    >
                      <span className="px-2 text-xs text-white flex items-center h-full font-medium">
                        {candidate.overall_score}%
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={getScoreColor(candidate.skill_match)}>
                  {candidate.skill_match}%
                </TableCell>
                <TableCell className={getScoreColor(candidate.text_similarity)}>
                  {candidate.text_similarity}%
                </TableCell>
                <TableCell
                  className={getScoreColor(candidate.semantic_similarity)}
                >
                  {candidate.semantic_similarity}%
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedCandidate}
        onOpenChange={() => setSelectedCandidate(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Candidate Details: {selectedCandidate?.resume_name}
              {selectedCandidate?.contact_info?.name && (
                <span className="text-muted-foreground text-sm ml-1">
                  ({selectedCandidate.contact_info.name})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedCandidate && (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-6">
                {/* Score Overview */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-medium mb-2">
                      Overall Match Score
                    </h3>
                    <ScoreCircle
                      score={selectedCandidate.overall_score}
                      size="lg"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-medium">Score Breakdown</h3>
                    {/* ... existing score bars ... */}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Skill Match</span>
                          <span>{selectedCandidate.skill_match}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getScoreColor(
                              selectedCandidate.skill_match
                            ).replace("text-", "bg-")}`}
                            style={{
                              width: `${selectedCandidate.skill_match}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Text Similarity</span>
                          <span>{selectedCandidate.text_similarity}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getScoreColor(
                              selectedCandidate.text_similarity
                            ).replace("text-", "bg-")}`}
                            style={{
                              width: `${selectedCandidate.text_similarity}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Semantic Similarity</span>
                          <span>{selectedCandidate.semantic_similarity}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getScoreColor(
                              selectedCandidate.semantic_similarity
                            ).replace("text-", "bg-")}`}
                            style={{
                              width: `${selectedCandidate.semantic_similarity}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skill Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skill Gap Chart */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Skill Gap Analysis
                    </h3>
                    <SkillGapChart result={selectedCandidate} />
                  </div>

                  {/* Skills Lists */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Matching Skills
                      </h3>
                      <SkillsList
                        skills={selectedCandidate.matching_skills}
                        type="matching"
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Missing Skills
                      </h3>
                      <SkillsList
                        skills={selectedCandidate.missing_skills}
                        type="missing"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
