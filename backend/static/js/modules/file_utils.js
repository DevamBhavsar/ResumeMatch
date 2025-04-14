export function updateFilesPreview(files) {
  const filesPreview = document.getElementById("files-preview");
  const fileCounter = document.getElementById("file-counter");

  if (!filesPreview || !fileCounter) return;

  filesPreview.innerHTML = "";

  if (files.length > 0) {
    fileCounter.style.display = "inline-block";
    document.getElementById("file-count").textContent = files.length;

    // Create file items
    Array.from(files).forEach((file, index) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";

      // Determine file type and icon
      let fileIcon = "📄";
      let fileTypeClass = "";
      let fileTypeLabel = "";

      switch (file.type) {
        case "application/pdf":
          fileIcon = "📕";
          fileTypeClass = "file-type-pdf";
          fileTypeLabel = "PDF";
          break;
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          fileIcon = "📘";
          fileTypeClass = "file-type-docx";
          fileTypeLabel = "DOCX";
          break;
        case "text/plain":
          fileIcon = "📃";
          fileTypeClass = "file-type-txt";
          fileTypeLabel = "TXT";
          break;
        default:
          fileTypeLabel = "Other";
      }

      fileItem.innerHTML = `
        <div class="file-icon">${fileIcon}</div>
        <div class="file-details">
          <span class="file-name" title="${file.name}">${file.name}</span>
          <div class="file-meta">
            <span class="file-size">${formatFileSize(file.size)}</span>
            <span class="file-type-indicator ${fileTypeClass}">${fileTypeLabel}</span>
          </div>
        </div>
        <button type="button" class="remove-file" data-index="${index}" title="Remove file">×</button>
      `;

      filesPreview.appendChild(fileItem);
    });

    // Add event listeners to remove buttons
    const removeButtons = document.querySelectorAll(".remove-file");
    removeButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const index = parseInt(this.getAttribute("data-index"));
        removeFile(index);
      });
    });
  } else {
    fileCounter.style.display = "none";
  }
}

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function removeFile(index) {
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
    document.getElementById("file-count").textContent = fileInput.files.length;
  }
}
