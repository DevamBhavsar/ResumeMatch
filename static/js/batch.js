import { initThemeToggle } from "./modules/theme.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize theme toggle
  if (typeof initThemeToggle === "function") {
    initThemeToggle();
  }

  // Initialize dropzone functionality
  initDropzone();

  // Initialize form submission with loading indicator
  initBatchFormSubmission();

  // Initialize file preview functionality
  initFilePreview();
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
    dropzone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropzone.classList.add("dragover");
  }

  function unhighlight() {
    dropzone.classList.remove("dragover");
  }

  // Handle dropped files
  dropzone.addEventListener("drop", handleDrop, false);

  function validateFiles(files) {
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const invalidFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size
      if (file.size > maxFileSize) {
        invalidFiles.push({
          name: file.name,
          reason: "File size exceeds 5MB limit",
        });
        continue;
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push({
          name: file.name,
          reason: "File type not supported (only PDF, DOCX, and TXT allowed)",
        });
        continue;
      }
    }

    return invalidFiles;
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    // Validate files
    const invalidFiles = validateFiles(files);
    if (invalidFiles.length > 0) {
      let errorMessage = "The following files could not be uploaded:\n\n";
      invalidFiles.forEach((file) => {
        errorMessage += `• ${file.name}: ${file.reason}\n`;
      });
      alert(errorMessage);

      // Filter out invalid files
      const validFiles = Array.from(files).filter((file) => {
        return !invalidFiles.some((invalid) => invalid.name === file.name);
      });

      // Create a new DataTransfer object with only valid files
      const dt = new DataTransfer();
      validFiles.forEach((file) => dt.items.add(file));

      fileInput.files = dt.files;
    } else {
      fileInput.files = files;
    }

    updateFilesPreview(fileInput.files);
  }

  // Handle files selected through the file input
  fileInput.addEventListener("change", function () {
    updateFilesPreview(this.files);
  });

  // Update the files preview section
  function updateFilesPreview(files) {
    filesPreview.innerHTML = "";
    const fileCounter = document.getElementById("file-counter");
    setTimeout(() => {
      const fileItems = document.querySelectorAll(".file-item");
      fileItems.forEach((item, index) => {
        item.style.opacity = "0";
        item.style.transform = "translateY(10px)";

        setTimeout(() => {
          item.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        }, index * 50);
      });
    }, 0);

    if (files.length > 0) {
      // Show file counter
      fileCounter.style.display = "inline-block";
      document.getElementById("file-count").textContent = files.length;

      // Create a summary of file types
      const fileTypes = {
        pdf: 0,
        docx: 0,
        txt: 0,
        other: 0,
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";

        // Count file types
        if (file.type === "application/pdf") {
          fileTypes.pdf++;
        } else if (
          file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          fileTypes.docx++;
        } else if (file.type === "text/plain") {
          fileTypes.txt++;
        } else {
          fileTypes.other++;
        }

        // Determine file icon based on type
        let fileIcon = "📄";
        let fileTypeClass = "";
        let fileTypeLabel = "";

        if (file.type === "application/pdf") {
          fileIcon = "📕";
          fileTypeClass = "file-type-pdf";
          fileTypeLabel = "PDF";
        } else if (
          file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          fileIcon = "📘";
          fileTypeClass = "file-type-docx";
          fileTypeLabel = "DOCX";
        } else if (file.type === "text/plain") {
          fileIcon = "📃";
          fileTypeClass = "file-type-txt";
          fileTypeLabel = "TXT";
        }

        // Create file preview with name, icon, type indicator, and remove button
        fileItem.innerHTML = `
                <span class="file-icon">${fileIcon}</span>
                <div class="file-details">
                    <span class="file-name" title="${file.name}">${
          file.name
        }</span>
                    <div class="file-meta">
                        <span class="file-size">${formatFileSize(
                          file.size
                        )}</span>
                        <span class="file-type-indicator ${fileTypeClass}">${fileTypeLabel}</span>
                    </div>
                </div>
                <button type="button" class="remove-file" data-index="${i}" title="Remove file">×</button>
            `;

        filesPreview.appendChild(fileItem);
      }

      // Add file type summary
      const summaryDiv = document.createElement("div");
      summaryDiv.className = "file-type-summary";
      summaryDiv.innerHTML = `
            <div class="summary-title">File Types:</div>
            <div class="summary-items">
                ${
                  fileTypes.pdf > 0
                    ? `<span class="file-type-indicator file-type-pdf">PDF: ${fileTypes.pdf}</span>`
                    : ""
                }
                ${
                  fileTypes.docx > 0
                    ? `<span class="file-type-indicator file-type-docx">DOCX: ${fileTypes.docx}</span>`
                    : ""
                }
                ${
                  fileTypes.txt > 0
                    ? `<span class="file-type-indicator file-type-txt">TXT: ${fileTypes.txt}</span>`
                    : ""
                }
                ${
                  fileTypes.other > 0
                    ? `<span class="file-type-indicator">Other: ${fileTypes.other}</span>`
                    : ""
                }
            </div>
        `;
      filesPreview.appendChild(summaryDiv);

      if (files.length > 1) {
        // Add clear all button
        const clearButton = document.createElement("button");
        clearButton.className = "clear-files";
        clearButton.textContent = "Clear all files";
        clearButton.addEventListener("click", function () {
          // Clear the file input
          fileInput.value = "";
          // Update the preview
          updateFilesPreview(fileInput.files);
          // Hide the counter
          document.getElementById("file-counter").style.display = "none";
        });
        filesPreview.appendChild(clearButton);
      }

      // Add event listeners to remove buttons
      const removeButtons = document.querySelectorAll(".remove-file");
      removeButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const index = parseInt(this.getAttribute("data-index"));
          removeFile(index);
        });
      });
    } else {
      // Hide file counter when no files
      fileCounter.style.display = "none";
    }
  }

  // Remove a file from the selection
  function removeFile(index) {
    const dt = new DataTransfer();
    const files = fileInput.files;

    for (let i = 0; i < files.length; i++) {
      if (i !== index) {
        dt.items.add(files[i]);
      }
    }

    fileInput.files = dt.files;
    updateFilesPreview(fileInput.files);

    // Update counter
    const fileCounter = document.getElementById("file-counter");
    if (fileInput.files.length === 0) {
      fileCounter.style.display = "none";
    } else {
      document.getElementById("file-count").textContent =
        fileInput.files.length;
    }
  }

  // Format file size for display
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

function initBatchFormSubmission() {
  const form = document.getElementById("batch_matching_form");
  const loadingIndicator = document.getElementById("loading-indicator");

  if (!form || !loadingIndicator) return;

  form.addEventListener("submit", function (e) {
    // Validate form
    const fileInput = document.getElementById("resumes");
    const jobDescription = document.getElementById("job_description");

    if (!fileInput.files.length) {
      e.preventDefault();
      alert("Please select at least one resume file.");
      return;
    }

    if (!jobDescription.value.trim()) {
      e.preventDefault();
      alert("Please enter a job description.");
      return;
    }

    // Show loading indicator
    loadingIndicator.style.display = "flex";

    // Add progress bar
    const progressBarContainer = document.createElement("div");
    progressBarContainer.className = "progress-bar-container";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBarContainer.appendChild(progressBar);
    loadingIndicator.appendChild(progressBarContainer);

    // Add progress text
    const progressText = document.createElement("p");
    progressText.id = "progress-text";
    progressText.className = "progress-text";
    progressText.textContent = "Initializing...";
    loadingIndicator.appendChild(progressText);

    // Simulate progress updates
    const files = fileInput.files;
    let currentFile = 0;
    const totalFiles = files.length;

    // Start progress animation
    setTimeout(() => {
      progressText.textContent = "Analyzing job description...";
      progressBar.style.width = "10%";

      const progressInterval = setInterval(() => {
        if (currentFile < totalFiles) {
          currentFile++;
          const progress = 10 + (currentFile / totalFiles) * 70; // 10% to 80%
          progressBar.style.width = `${progress}%`;
          progressText.textContent = `Processing resume ${currentFile} of ${totalFiles}: ${
            files[currentFile - 1].name
          }`;
        } else {
          clearInterval(progressInterval);
          progressText.textContent = "Finalizing results...";
          progressBar.style.width = "90%";

          setTimeout(() => {
            progressBar.style.width = "100%";
            progressText.textContent = "Redirecting to results...";
          }, 1000);
        }
      }, 1000);
    }, 500);

    // Allow form submission
    return true;
  });

  // Check if there's a success message in the URL (for when returning from batch processing)
  const urlParams = new URLSearchParams(window.location.search);
  const successMessage = urlParams.get("success");

  if (successMessage) {
    // Create a success notification
    const notification = document.createElement("div");
    notification.className = "notification success";
    notification.innerHTML = `
        <span class="notification-icon">✓</span>
        <div class="notification-content">
            <div class="notification-title">Success!</div>
            <div class="notification-message">${decodeURIComponent(
              successMessage
            )}</div>
        </div>
        <button class="notification-close">×</button>
    `;

    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(120%)";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);

    // Close button
    notification
      .querySelector(".notification-close")
      .addEventListener("click", function () {
        notification.style.transform = "translateX(120%)";
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      });

    // Remove the success parameter from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Add this function to enable file preview

function initFilePreview() {
  // Add event delegation to the files preview container
  const filesPreview = document.getElementById("files-preview");

  filesPreview.addEventListener("click", function (e) {
    // Check if the clicked element is a file name
    if (e.target.classList.contains("file-name")) {
      const fileIndex = e.target
        .closest(".file-item")
        .querySelector(".remove-file")
        .getAttribute("data-index");
      const file = document.getElementById("resumes").files[fileIndex];

      // Create modal for preview
      showFilePreviewModal(file);
    }
  });
}

function showFilePreviewModal(file) {
  // Create modal elements
  const modal = document.createElement("div");
  modal.className = "file-preview-modal";

  const modalContent = document.createElement("div");
  modalContent.className = "file-preview-content";

  const closeButton = document.createElement("span");
  closeButton.className = "close-preview";
  closeButton.innerHTML = "×";
  closeButton.title = "Close preview";

  const previewTitle = document.createElement("h3");
  previewTitle.textContent = file.name;

  const previewContainer = document.createElement("div");
  previewContainer.className = "preview-container";

  // Add content based on file type
  if (file.type === "application/pdf") {
    // For PDFs, use embed
    const embed = document.createElement("embed");
    embed.src = URL.createObjectURL(file);
    embed.type = "application/pdf";
    embed.width = "100%";
    embed.height = "500px";
    previewContainer.appendChild(embed);
  } else if (file.type === "text/plain") {
    // For text files, read and display content
    const reader = new FileReader();
    reader.onload = function (e) {
      const pre = document.createElement("pre");
      pre.className = "text-preview";
      pre.textContent = e.target.result;
      previewContainer.appendChild(pre);
    };
    reader.readAsText(file);
  } else {
    // For other files (like DOCX), show a message
    const message = document.createElement("p");
    message.className = "preview-message";
    message.textContent = `Preview not available for ${file.type} files.`;
    previewContainer.appendChild(message);
  }

  // Assemble modal
  modalContent.appendChild(closeButton);
  modalContent.appendChild(previewTitle);
  modalContent.appendChild(previewContainer);
  modal.appendChild(modalContent);

  // Add to document
  document.body.appendChild(modal);

  // Show modal
  setTimeout(() => {
    modal.style.opacity = "1";
  }, 10);

  // Close modal when clicking the close button
  closeButton.addEventListener("click", function () {
    closePreviewModal(modal);
  });

  // Close modal when clicking outside the content
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closePreviewModal(modal);
    }
  });
}

function closePreviewModal(modal) {
  modal.style.opacity = "0";
  setTimeout(() => {
    document.body.removeChild(modal);
  }, 300);
}
