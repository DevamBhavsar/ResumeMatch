import {
  createSkillRadarChart,
  visualizeSkillGaps,
} from "./modules/chart_utils.js";
import { initFilePreview } from "./modules/file_preview.js";
import { initFormValidation } from "./modules/form_validation.js";
import { initResultsPage } from "./modules/result_page.js";
import { initThemeToggle } from "./modules/theme.js";

document.addEventListener("DOMContentLoaded", function () {
  // Make chart functions globally available for theme toggle
  window.visualizeSkillGaps = visualizeSkillGaps;
  window.createSkillRadarChart = createSkillRadarChart;

  // Initialize theme toggle
  initThemeToggle();

  // Initialize file preview functionality
  initFilePreview("resume", "resume-preview");

  // Initialize form validation
  initFormValidation("matching_form", "resume", "job_description");

  // Initialize results page if we're on that page
  const scoreCircle = document.getElementById("overall-score");
  if (scoreCircle) {
    initResultsPage();

    // Initialize charts with a delay to ensure DOM is ready
    setTimeout(() => {
      visualizeSkillGaps();
      createSkillRadarChart();
    }, 500);
  }
});
