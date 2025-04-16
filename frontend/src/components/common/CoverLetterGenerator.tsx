import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
interface CoverLetterGeneratorProps {
  matchingSkills: string[];
  missingSkills: string[];
}
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export function CoverLetterGenerator({
  matchingSkills,
  missingSkills,
}: CoverLetterGeneratorProps) {
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleGenerateCoverLetter = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toLocaleDateString();

      // Format the cover letter
      const letter = `[Your Name]
[Your Address]
[City, State ZIP]
[Your Email]
[Your Phone]
${today}

[Hiring Manager's Name]
[Company Name]
[Company Address]
[City, State ZIP]

Dear Hiring Manager,

I am writing to express my interest in the position at your company. After carefully reviewing the job description, I believe my skills and experience make me a strong candidate for this role.

Based on my analysis, I have ${
        matchingSkills.length
      } of the key skills required for this position, including ${matchingSkills
        .slice(0, 5)
        .join(", ")}${matchingSkills.length > 5 ? ", and others" : ""}.

${
  missingSkills.length > 0
    ? `While I am currently developing expertise in ${missingSkills.join(
        ", "
      )}, my strong foundation in ${matchingSkills
        .slice(0, 3)
        .join(
          ", "
        )} provides me with the capability to quickly learn and apply these skills.`
    : "My comprehensive skill set covers all the requirements mentioned in the job description."
}

Throughout my career, I have demonstrated the ability to [describe relevant achievements and experiences that showcase your matching skills]. I am particularly proud of [specific accomplishment relevant to the job].

I am excited about the opportunity to bring my skills to your team and contribute to [company name]'s mission of [research the company's mission or current projects]. I am confident that my background in [your field] combined with my passion for [relevant industry/technology] makes me well-suited for this position.

I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for considering my application.

Sincerely,

[Your Name]`;

      setCoverLetter(letter);
      setIsVisible(true);
    } catch (error) {
      console.error("Error generating cover letter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          text: coverLetter,
          type: "pdf",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cover_Letter.pdf";
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isVisible) {
    return (
      <Button onClick={handleGenerateCoverLetter} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Cover Letter"}
      </Button>
    );
  }

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle>Generated Cover Letter</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="edit">
          <TabsList className="mb-4">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">
            <textarea
              className="w-full h-96 p-4 border rounded-md bg-background resize-none"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="w-full h-96 p-4 border rounded-md bg-background overflow-y-auto whitespace-pre-line">
              {coverLetter}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setIsVisible(false)}>
          Close
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copyToClipboard}>
            Copy to Clipboard
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? "Downloading..." : "Download as PDF"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
