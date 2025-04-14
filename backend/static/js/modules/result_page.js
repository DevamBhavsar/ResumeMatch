import { addSkillTooltips } from "./chart_utils.js";
import {
  generateCoverLetter,
  initDocumentDownloadButtons,
} from "./cv_genrator.js";
export function initResultsPage() {
  // Animate score circle
  const scoreCircle = document.getElementById("overall-score");
  if (scoreCircle) {
    const score = parseFloat(scoreCircle.getAttribute("data-score"));

    // Get the score text element
    const scoreText = scoreCircle.querySelector(".score-text");
    if (scoreText) {
      // Apply additional styling to ensure visibility
      scoreText.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      scoreText.style.color = "white";
      scoreText.style.padding = "10px";
      scoreText.style.borderRadius = "50%";

      // Add counter animation to the score text
      animateCounter(scoreText, 0, score, 1500);
    }

    // Set color and animation based on score
    let fillColor;
    if (score >= 80) {
      fillColor = "var(--success-color)";
    } else if (score >= 60) {
      fillColor = "var(--warning-color)";
    } else {
      fillColor = "var(--danger-color)";
    }

    // Set initial state
    scoreCircle.style.background = `conic-gradient(${fillColor} 0deg, #f1f1f1 0deg)`;

    // Set CSS variables for the animation
    scoreCircle.style.setProperty("--score", score);
    scoreCircle.style.setProperty("--fill-color", fillColor);

    // Trigger the fill animation after a short delay
    setTimeout(() => {
      scoreCircle.style.animation = "fillAnimation 1.5s ease-out forwards";
      scoreCircle.style.background = `conic-gradient(${fillColor} 0%, ${fillColor} ${
        score * 3.6
      }deg, #f1f1f1 ${score * 3.6}deg, #f1f1f1 360deg)`;
    }, 300);

    // Generate cover letter if on results page
    const generateCoverLetterBtn = document.getElementById(
      "generate-cover-letter"
    );
    if (generateCoverLetterBtn) {
      generateCoverLetterBtn.addEventListener("click", generateCoverLetter);
    }
  }

  // Animate score bars
  const scoreBars = document.querySelectorAll(".score-bar");
  if (scoreBars.length > 0) {
    setTimeout(() => {
      scoreBars.forEach((bar) => {
        const width = parseFloat(bar.getAttribute("data-score"));
        bar.style.width = "0%";

        setTimeout(() => {
          bar.style.width = width + "%";

          // Set color based on score
          if (width >= 80) {
            bar.style.backgroundColor = "var(--success-color)";
          } else if (width >= 60) {
            bar.style.backgroundColor = "var(--warning-color)";
          } else {
            bar.style.backgroundColor = "var(--danger-color)";
          }
        }, 100);
      });
    }, 300);
  }

  // Initialize document download buttons
  initDocumentDownloadButtons();

  // Add tooltips to skills
  addSkillTooltips();
  // Initialize Quill if the cover letter is already visible
  const coverLetterContainer = document.getElementById(
    "cover-letter-container"
  );
  if (coverLetterContainer && coverLetterContainer.style.display !== "none") {
    const quillEditorContainer = document.getElementById("quill-editor");
    const coverLetterText = document.getElementById("cover-letter-text");

    if (quillEditorContainer && !window.quillEditor) {
      try {
        window.quillEditor = new Quill("#quill-editor", {
          modules: {
            toolbar: [
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              [{ color: [] }, { background: [] }],
              ["clean"],
            ],
          },
          theme: "snow",
        });

        // If there's content in the textarea, transfer it to Quill
        if (coverLetterText && coverLetterText.value) {
          const htmlContent = coverLetterText.value
            .split("\n\n")
            .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
            .join("");

          window.quillEditor.clipboard.dangerouslyPasteHTML(htmlContent);
        }
      } catch (error) {
        console.error("Error initializing Quill editor:", error);
        // Show the textarea as fallback if Quill fails
        if (coverLetterText) {
          coverLetterText.style.display = "block";
        }
      }
    }
  }
}
// Function to animate counter
function animateCounter(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentCount = Math.floor(progress * (end - start) + start);
    element.innerHTML = `${currentCount}%`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.innerHTML = `${end}%`;
    }
  };
  window.requestAnimationFrame(step);
}
