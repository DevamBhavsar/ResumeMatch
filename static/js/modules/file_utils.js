export function updateFilesPreview(files) {
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
                <span class="file-name" title="${file.name}">${file.name}</span>
                <div class="file-meta">
                    <span class="file-size">${formatFileSize(file.size)}</span>
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
