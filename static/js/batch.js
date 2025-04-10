import { initThemeToggle } from "./modules/theme.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize theme toggle
  try {
    initThemeToggle();
  } catch (e) {
    console.error("Error initializing theme toggle:", e);
  }

  // Initialize global storage for files
  window.storedFiles = [];

  // Initialize dropzone functionality
  initDropzone();

  // Initialize form submission with loading indicator
  initBatchFormSubmission();

  // Call the initFilePreview function to enable file previews
  initFilePreview();

  function updateFilesPreview(files) {
    const filesPreview = document.getElementById("files-preview");
    const fileCounter = document.getElementById("file-counter");

    filesPreview.innerHTML = "";

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
          document.getElementById("resumes").value = "";
          // Clear our stored files collection
          window.storedFiles = [];
          // Update the file input
          document.getElementById("resumes").files = new DataTransfer().files;
          // Update the preview
          updateFilesPreview(document.getElementById("resumes").files);
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

  // Also move formatFileSize outside of initDropzone
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Move removeFile outside of initDropzone
  function removeFile(index) {
    const fileInput = document.getElementById("resumes");
    const dt = new DataTransfer();
    const files = fileInput.files;

    // Update our stored files collection
    window.storedFiles = [];

    for (let i = 0; i < files.length; i++) {
      if (i !== index) {
        dt.items.add(files[i]);
        window.storedFiles.push(files[i]);
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

        addFilesToInput(validFiles);
      } else {
        // Use the new function instead of directly setting files
        addFilesToInput(files);
      }
    }

    // Handle files selected through the file input
    fileInput.addEventListener("change", function () {
      // Get the new files
      const newFiles = Array.from(this.files);

      // Create a DataTransfer object to manipulate the files
      const dataTransfer = new DataTransfer();

      // First add existing files from our stored collection
      if (window.storedFiles) {
        window.storedFiles.forEach((file) => {
          dataTransfer.items.add(file);
        });
      } else {
        window.storedFiles = [];
      }

      // Then add new files
      newFiles.forEach((file) => {
        // Check if file already exists in the selection
        const fileExists = window.storedFiles.some(
          (existingFile) =>
            existingFile.name === file.name && existingFile.size === file.size
        );

        // Only add if it doesn't exist already
        if (!fileExists) {
          dataTransfer.items.add(file);
          window.storedFiles.push(file);
        }
      });

      // Update the file input with the combined files
      fileInput.files = dataTransfer.files;

      // Update the preview
      updateFilesPreview(fileInput.files);

      // Clear the value to allow selecting the same files again
      this.value = "";
    });
  }

  function addFilesToInput(newFiles) {
    const fileInput = document.getElementById("resumes");

    // Create a DataTransfer object to manipulate the files
    const dataTransfer = new DataTransfer();

    // First add existing files
    if (fileInput.files) {
      Array.from(fileInput.files).forEach((file) => {
        dataTransfer.items.add(file);
      });
    }

    // Then add new files
    Array.from(newFiles).forEach((file) => {
      // Check if file already exists in the selection
      const fileExists = Array.from(dataTransfer.files).some(
        (existingFile) =>
          existingFile.name === file.name && existingFile.size === file.size
      );

      // Only add if it doesn't exist already
      if (!fileExists) {
        dataTransfer.items.add(file);
      }
    });

    // Update the file input with the combined files
    fileInput.files = dataTransfer.files;

    // Update the preview
    updateFilesPreview(fileInput.files);
  }

  function initBatchFormSubmission() {
    const form = document.getElementById("batch_matching_form");
    if (!form) {
      console.error("Form with ID 'batch_matching_form' not found");
      return;
    }

    const loadingIndicator = document.getElementById("loading-indicator");
    if (!loadingIndicator) {
      console.error("Loading indicator not found");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) {
      console.error("Submit button not found within the form");
      return;
    }

    // Check if the event listener is already attached
    if (form.hasAttribute("data-submit-listener")) {
      return;
    }

    form.setAttribute("data-submit-listener", "true");

    submitButton.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default button behavior

      // Validate form
      const fileInput = document.getElementById("resumes");
      const jobDescription = document.getElementById("job_description");

      if (!fileInput) {
        console.error("File input with ID 'resumes' not found");
        return;
      }

      if (!jobDescription) {
        console.error("Textarea with ID 'job_description' not found");
        return;
      }

      // Check if we have files in the stored files array
      const hasFiles = window.storedFiles && window.storedFiles.length > 0;

      if (!hasFiles) {
        alert("Please select at least one resume file.");
        return;
      }

      if (!jobDescription.value.trim()) {
        alert("Please enter a job description.");
        return;
      }

      // Before submission, make sure the file input contains all stored files
      if (window.storedFiles && window.storedFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        window.storedFiles.forEach((file) => {
          dataTransfer.items.add(file);
        });
        fileInput.files = dataTransfer.files;
      } else {
        console.error("No files found in window.storedFiles during submission");
        return;
      }

      // Show loading indicator
      loadingIndicator.style.display = "flex";

      // Submit the form
      form.submit();
    });
  }

  // Add this function to enable file preview
  function initFilePreview() {
    // Add event delegation to the files preview container
    const filesPreview = document.getElementById("files-preview");

    if (!filesPreview) return;

    filesPreview.addEventListener("click", function (e) {
      // Check if the clicked element is a file name
      if (e.target.classList.contains("file-name")) {
        const fileIndex = e.target
          .closest(".file-item")
          .querySelector(".remove-file")
          .getAttribute("data-index");

        // Use window.storedFiles instead of fileInput.files
        const file = window.storedFiles[fileIndex];

        if (!file) {
          console.error("File not found for index:", fileIndex);
          return;
        }

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
});
