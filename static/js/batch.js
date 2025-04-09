import { initThemeToggle } from "./modules/theme.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize theme toggle
  initThemeToggle();

  // Initialize dropzone functionality
  initDropzone();

  // Initialize form validation
  initBatchFormValidation();
});

function initDropzone() {
  const dropzone = document.getElementById("resume-dropzone");
  const fileInput = document.getElementById("resumes");
  const filesPreview = document.getElementById("files-preview");

  if (!dropzone || !fileInput || !filesPreview) return;

  // Handle drag and drop events
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Add visual feedback when files are dragged over the dropzone
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, () => {
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, () => {
      dropzone.classList.remove("dragover");
    });
  });

  // Handle dropped files
  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    updateFilesPreview();
  });

  // Handle files selected via file input
  fileInput.addEventListener("change", updateFilesPreview);

  function updateFilesPreview() {
    filesPreview.innerHTML = "";

    if (fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach((file, index) => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";

        // Determine file icon based on type
        let fileIcon = "📄";
        if (file.type === "application/pdf") {
          fileIcon = "📕";
        } else if (
          file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          fileIcon = "📘";
        }

        fileItem.innerHTML = `
          <span class="file-icon">${fileIcon}</span>
          <span class="file-name" title="${file.name}">${file.name}</span>
          <button type="button" class="remove-file" data-index="${index}">×</button>
        `;

        filesPreview.appendChild(fileItem);
      });

      // Add event listeners to remove buttons
      document.querySelectorAll(".remove-file").forEach((button) => {
        button.addEventListener("click", function () {
          removeFile(parseInt(this.getAttribute("data-index")));
        });
      });
    }
  }

  function removeFile(index) {
    // Create a new FileList without the removed file
    const dt = new DataTransfer();
    const files = fileInput.files;

    for (let i = 0; i < files.length; i++) {
      if (i !== index) {
        dt.items.add(files[i]);
      }
    }

    fileInput.files = dt.files;
    updateFilesPreview();
  }
}

function initBatchFormValidation() {
  const form = document.getElementById("batch_matching_form");
  const fileInput = document.getElementById("resumes");
  const jdInput = document.getElementById("job_description");

  if (form && fileInput && jdInput) {
    form.addEventListener("submit", function (e) {
      // Check if files are selected
      if (fileInput.files.length === 0) {
        e.preventDefault();
        alert("Please select at least one resume file");
        return;
      }

      // Check if job description is provided
      if (!jdInput.value.trim()) {
        e.preventDefault();
        alert("Please provide a job description");
        return;
      }

      // Check if too many files are selected
      if (fileInput.files.length > 10) {
        e.preventDefault();
        alert("Maximum 10 files allowed");
        return;
      }

      // Check file sizes
      const maxSize = 5 * 1024 * 1024; // 5MB
      for (let i = 0; i < fileInput.files.length; i++) {
        if (fileInput.files[i].size > maxSize) {
          e.preventDefault();
          alert(
            `File "${fileInput.files[i].name}" exceeds the maximum size of 5MB`
          );
          return;
        }
      }

      // If all validations pass, show loading indicator
      const loadingIndicator = document.getElementById("loading-indicator");
      if (loadingIndicator) {
        loadingIndicator.style.display = "flex";
      }
    });
  }
}
