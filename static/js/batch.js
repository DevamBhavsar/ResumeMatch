import { initDropzone } from "./modules/dropzone.js";
import { initFilePreview } from "./modules/file_preview.js";
import { initBatchFormSubmission } from "./modules/form_submission.js";
import { initThemeToggle } from "./modules/theme.js";
import { initUIEnhancements } from "./modules/ui_enhancements.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize global storage for files
  window.storedFiles = [];

  // Initialize theme toggle
  initThemeToggle();

  // Initialize dropzone functionality
  initDropzone();

  // Initialize form submission with loading indicator
  initBatchFormSubmission();

  // Call the initFilePreview function to enable file previews
  initFilePreview();

  // Initialize UI enhancements
  initUIEnhancements();

  // Add staggered animation to form groups
  const formGroups = document.querySelectorAll(".form-group");
  formGroups.forEach((group, index) => {
    group.style.animationDelay = `${0.1 + index * 0.1}s`;
  });
});
