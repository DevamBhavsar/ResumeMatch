document.addEventListener("DOMContentLoaded", function () {
  // Handle file input styling
  const fileInput = document.getElementById("resume");
  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const fileName = e.target.files[0]?.name || "No file selected";
      const fileLabel = document.querySelector('label[for="resume"]');
      fileLabel.innerHTML = `Resume: ${fileName}`;
    });
  }

  // Animate score circle
  const scoreCircle = document.getElementById("overall-score");
  if (scoreCircle) {
    const score = parseFloat(scoreCircle.getAttribute("data-score"));
    // Set the CSS variable for the animation
    scoreCircle.style.setProperty("--score", score);

    // Set color based on score
    if (score >= 80) {
      scoreCircle.style.background = `conic-gradient(#27ae60 0%, #27ae60 ${
        score * 3.6
      }deg, #f1f1f1 ${score * 3.6}deg, #f1f1f1 360deg)`;
    } else if (score >= 60) {
      scoreCircle.style.background = `conic-gradient(#f39c12 0%, #f39c12 ${
        score * 3.6
      }deg, #f1f1f1 ${score * 3.6}deg, #f1f1f1 360deg)`;
    } else {
      scoreCircle.style.background = `conic-gradient(#e74c3c 0%, #e74c3c ${
        score * 3.6
      }deg, #f1f1f1 ${score * 3.6}deg, #f1f1f1 360deg)`;
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
            bar.style.backgroundColor = "#27ae60";
          } else if (width >= 60) {
            bar.style.backgroundColor = "#f39c12";
          } else {
            bar.style.backgroundColor = "#e74c3c";
          }
        }, 100);
      });
    }, 300);
  }

  // Form validation
  const form = document.getElementById("matching_form");
  if (form) {
    form.addEventListener("submit", function (e) {
      const jdInput = document.getElementById("job_description");
      const resumeInput = document.getElementById("resume");

      if (!jdInput.value.trim() || !resumeInput.files[0]) {
        e.preventDefault();
        alert("Please provide both a resume file and job description");
      }
    });
  }
});
