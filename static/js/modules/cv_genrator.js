export function generateCoverLetter() {
  const coverLetterContainer = document.getElementById(
    "cover-letter-container"
  );
  const capitalizeFirstLetter = (str) => {
    if (!str) {
      return "";
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  const coverLetterEditorContainer = document.getElementById(
    "cover-letter-editor-container"
  );

  if (!coverLetterContainer || !coverLetterEditorContainer) return;

  // Show the container
  coverLetterContainer.style.display = "block";

  // Get data from the page
  const matchingSkills = Array.from(
    document.querySelectorAll(".skill-tag.match")
  ).map((el) => el.textContent.trim());
  const missingSkills = Array.from(
    document.querySelectorAll(".skill-tag.missing")
  ).map((el) => el.textContent.trim());

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
    .map(capitalizeFirstLetter)
    .join(", ")}${matchingSkills.length > 5 ? ", and others" : ""}.

${
  missingSkills.length > 0
    ? `While I am currently developing expertise in ${missingSkills.join(
        ", "
      )}, my strong foundation in ${matchingSkills
        .slice(0, 3)
        .map(capitalizeFirstLetter)
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

  // Initialize Quill if it hasn't been initialized yet
  if (!window.quillEditor) {
    // Create a div for the editor
    coverLetterEditorContainer.innerHTML = '<div id="quill-editor"></div>';

    // Initialize Quill
    window.quillEditor = new Quill("#quill-editor", {
      theme: "snow",
      modules: {
        toolbar: [
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ header: 1 }, { header: 2 }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],
          [{ size: ["small", false, "large", "huge"] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ align: [] }],
          ["clean"],
        ],
      },
    });

    // Set content
    window.quillEditor.clipboard.dangerouslyPasteHTML(
      coverLetter.replace(/\n/g, "<br>")
    );
  } else {
    // Update content if editor already exists
    window.quillEditor.clipboard.dangerouslyPasteHTML(
      coverLetter.replace(/\n/g, "<br>")
    );
  }
}

export function initDocumentDownloadButtons() {
  // Word document download using server-side generation
  const downloadWordBtn = document.getElementById("download-word");
  if (downloadWordBtn) {
    downloadWordBtn.addEventListener("click", function () {
      submitDocumentForm("docx");
    });
  }

  // PDF document download using server-side generation
  const downloadPdfBtn = document.getElementById("download-pdf");
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", function () {
      submitDocumentForm("pdf");
    });
  }

  // Copy cover letter button
  const copyBtn = document.getElementById("copy-cover-letter");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      // Get content from Quill if it's initialized
      if (window.quillEditor) {
        const content = window.quillEditor.root.innerHTML;

        // Create a temporary textarea to copy HTML content
        const tempTextarea = document.createElement("textarea");
        tempTextarea.value = content;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextarea);
      } else {
        // Fallback to regular textarea
        const coverLetterText = document.getElementById("cover-letter-text");
        if (coverLetterText) {
          coverLetterText.select();
          document.execCommand("copy");
        }
      }

      // Show feedback
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    });
  }
}

function submitDocumentForm(docType) {
  // Get content from Quill if it's initialized
  let coverLetterContent = "";

  if (window.quillEditor) {
    coverLetterContent = window.quillEditor.root.innerHTML;
  } else {
    // Fallback to regular textarea
    coverLetterContent =
      document.getElementById("cover-letter-text")?.value || "";
  }

  if (!coverLetterContent) return;

  // Create a form to submit the text to the server
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/generate-document";
  form.style.display = "none";

  // Add text input
  const textInput = document.createElement("input");
  textInput.type = "hidden";
  textInput.name = "text";
  textInput.value = coverLetterContent;
  form.appendChild(textInput);

  // Add document type input
  const typeInput = document.createElement("input");
  typeInput.type = "hidden";
  typeInput.name = "type";
  typeInput.value = docType;
  form.appendChild(typeInput);

  // Add a flag to indicate this is HTML content
  const formatInput = document.createElement("input");
  formatInput.type = "hidden";
  formatInput.name = "format";
  formatInput.value = "html";
  form.appendChild(formatInput);

  // Submit the form
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
