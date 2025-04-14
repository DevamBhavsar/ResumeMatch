import { MatchResult } from "../types";

export function getScoreColor(score: number): string {
  if (score >= 80) {
    return "bg-green-500"; // success color
  } else if (score >= 60) {
    return "bg-yellow-500"; // warning color
  } else {
    return "bg-red-500"; // danger color
  }
}

export function getScoreTextColor(score: number): string {
  if (score >= 80) {
    return "text-green-700"; // success text color
  } else if (score >= 60) {
    return "text-yellow-700"; // warning text color
  } else {
    return "text-red-700"; // danger text color
  }
}

export function prepareSkillGapChartData(result: MatchResult) {
  return {
    labels: ["Matching Skills", "Missing Skills"],
    datasets: [
      {
        data: [result.matching_skills.length, result.missing_skills.length],
        backgroundColor: ["#2ecc71", "#e74c3c"],
        borderWidth: 0,
      },
    ],
  };
}

export function prepareSkillRadarChartData(result: MatchResult) {
  // Get top 5 skills from each category for the radar chart
  const topMatchingSkills = result.matching_skills.slice(0, 5);
  const topMissingSkills = result.missing_skills.slice(0, 5);

  // Combine all skills for labels
  const allSkills = [...topMatchingSkills, ...topMissingSkills];

  // Create data for matching skills with strength values
  const matchingData = allSkills.map((skill) => {
    if (topMatchingSkills.includes(skill)) {
      return result.skill_strengths?.[skill] || 100;
    }
    return 0;
  });

  return {
    labels: allSkills,
    datasets: [
      {
        label: "Your Skills",
        data: matchingData,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgb(54, 162, 235)",
        pointBackgroundColor: "rgb(54, 162, 235)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(54, 162, 235)",
      },
      {
        label: "Required Skills",
        data: allSkills.map(() => 100), // All skills at 100%
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgb(255, 99, 132)",
        pointBackgroundColor: "rgb(255, 99, 132)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(255, 99, 132)",
      },
    ],
  };
}
