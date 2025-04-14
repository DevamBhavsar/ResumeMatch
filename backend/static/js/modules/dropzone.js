import { updateFilesPreview } from "./file_utils.js";

export function initDropzone() {
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

    if (!files || files.length === 0) {
      console.log("No files dropped");
      return;
    }

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

      if (validFiles.length > 0) {
        addFilesToInput(validFiles);
      }
    } else {
      // Use the new function instead of directly setting files
      addFilesToInput(files);
    }
  }

  function addFilesToInput(newFiles) {
    const fileInput = document.getElementById("resumes");

    // Initialize storedFiles if it doesn't exist
    if (!window.storedFiles) {
      window.storedFiles = [];
    }

    // Create a DataTransfer object to manipulate the files
    const dataTransfer = new DataTransfer();

    // First add existing files from storedFiles
    window.storedFiles.forEach((file) => {
      dataTransfer.items.add(file);
    });

    // Then add new files
    Array.from(newFiles).forEach((file) => {
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
  }

  // Handle files selected through the file input
  fileInput.addEventListener("change", function () {
    // Get the new files
    const newFiles = Array.from(this.files);

    // Use the updated addFilesToInput function
    addFilesToInput(newFiles);

    // Clear the value to allow selecting the same files again
    this.value = "";
  });
}
