export function initFilePreview() {
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
