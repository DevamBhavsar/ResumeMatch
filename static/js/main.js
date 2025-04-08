document.addEventListener("DOMContentLoaded", function () {
  // Add these functions after your existing code in the DOMContentLoaded event listener

  // Word document download using server-side generation
  const downloadWordBtn = document.getElementById("download-word");
  if (downloadWordBtn) {
    downloadWordBtn.addEventListener("click", function () {
      const coverLetterText =
        document.getElementById("cover-letter-text").value;
      if (!coverLetterText) return;

      // Create a form to submit the text to the server
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/generate-document";
      form.style.display = "none";

      // Add text input
      const textInput = document.createElement("input");
      textInput.type = "hidden";
      textInput.name = "text";
      textInput.value = coverLetterText;
      form.appendChild(textInput);

      // Add document type input
      const typeInput = document.createElement("input");
      typeInput.type = "hidden";
      typeInput.name = "type";
      typeInput.value = "docx";
      form.appendChild(typeInput);

      // Submit the form
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    });
  }

  // PDF document download using server-side generation
  const downloadPdfBtn = document.getElementById("download-pdf");
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", function () {
      const coverLetterText =
        document.getElementById("cover-letter-text").value;
      if (!coverLetterText) return;

      // Create a form to submit the text to the server
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/generate-document";
      form.style.display = "none";

      // Add text input
      const textInput = document.createElement("input");
      textInput.type = "hidden";
      textInput.name = "text";
      textInput.value = coverLetterText;
      form.appendChild(textInput);

      // Add document type input
      const typeInput = document.createElement("input");
      typeInput.type = "hidden";
      typeInput.name = "type";
      typeInput.value = "pdf";
      form.appendChild(typeInput);

      // Submit the form
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    });
  }
  // Set default theme to dark
  document.documentElement.setAttribute("data-theme", "dark");

  // Add theme toggle functionality
  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.innerHTML = "☀️";
  themeToggle.setAttribute("aria-label", "Toggle light mode");
  document.body.appendChild(themeToggle);

  themeToggle.addEventListener("click", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.innerHTML = "🌙";
      themeToggle.setAttribute("aria-label", "Toggle dark mode");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggle.innerHTML = "☀️";
      themeToggle.setAttribute("aria-label", "Toggle light mode");
    }
  });

  // Handle file input styling
  const fileInput = document.getElementById("resume");
  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const fileName = e.target.files[0]?.name || "No file selected";
      const fileLabel = document.querySelector('label[for="resume"]');
      fileLabel.innerHTML = `Resume: ${fileName}`;

      // Show resume preview
      if (e.target.files[0]) {
        previewResume(e.target.files[0]);
      }
    });
  }

  // Resume preview function
  function previewResume(file) {
    const previewContainer = document.getElementById("resume-preview");
    if (!previewContainer) return;

    // Show loading message
    previewContainer.innerHTML = "Loading preview...";
    previewContainer.classList.add("active");

    if (file.type === "application/pdf") {
      // For PDFs, use PDF.js or embed
      previewContainer.innerHTML = `<embed src="${URL.createObjectURL(
        file
      )}" type="application/pdf" width="100%" height="250px" />`;
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For DOCX, just show a message (browser can't preview DOCX natively)
      previewContainer.innerHTML = `<p>DOCX preview not available. File: ${file.name}</p>`;
    } else if (file.type === "text/plain") {
      // For TXT files, read and display the content
      const reader = new FileReader();
      reader.onload = function (e) {
        previewContainer.innerHTML = `<pre>${e.target.result}</pre>`;
      };
      reader.readAsText(file);
    } else {
      previewContainer.innerHTML = `<p>Preview not available for this file type.</p>`;
    }
  }

  // Animate score circle
  const scoreCircle = document.getElementById("overall-score");
  if (scoreCircle) {
    const score = parseFloat(scoreCircle.getAttribute("data-score"));
    // Set the CSS variable for the animation
    scoreCircle.style.setProperty("--score", score);

    // Set color based on score
    if (score >= 80) {
      scoreCircle.style.background = `conic-gradient(var(--success-color) 0%, var(--success-color) ${
        score * 3.6
      }deg, #f1f1f1 ${score * 3.6}deg, #f1f1f1 360deg)`;
    } else if (score >= 60) {
      scoreCircle.style.background = `conic-gradient(var(--warning-color) 0%, var(--warning-color) ${
        score * 3.6
      }deg, #f1f1f1 ${score * 3.6}deg, #f1f1f1 360deg)`;
    } else {
      scoreCircle.style.background = `conic-gradient(var(--danger-color) 0%, var(--danger-color) ${
        score * 3.6
      }deg, #f1f1f1 ${score * 3.6}deg, #f1f1f1 360deg)`;
    }

    // Generate cover letter if on results page
    if (document.getElementById("generate-cover-letter")) {
      document
        .getElementById("generate-cover-letter")
        .addEventListener("click", generateCoverLetter);
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

  // Cover letter generator function
  function generateCoverLetter() {
    const coverLetterContainer = document.getElementById(
      "cover-letter-container"
    );
    const coverLetterText = document.getElementById("cover-letter-text");

    if (!coverLetterContainer || !coverLetterText) return;

    // Show the container
    coverLetterContainer.style.display = "block";

    // Get data from the page
    const matchingSkills = Array.from(
      document.querySelectorAll(".skill-tag.match")
    ).map((el) => el.textContent.trim());
    const missingSkills = Array.from(
      document.querySelectorAll(".skill-tag.missing")
    ).map((el) => el.textContent.trim());
    const overallScore = document
      .getElementById("overall-score")
      .getAttribute("data-score");

    // Generate the cover letter
    const today = new Date().toLocaleDateString();
    const coverLetter = `[Your Name]
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

    coverLetterText.value = coverLetter;
  }

  // Copy cover letter button
  const copyBtn = document.getElementById("copy-cover-letter");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      const coverLetterText = document.getElementById("cover-letter-text");
      if (coverLetterText) {
        coverLetterText.select();
        document.execCommand("copy");

        // Show feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      }
    });
  }
});
