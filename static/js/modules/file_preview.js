export function initFilePreview(fileInputId, previewContainerId) {
  const fileInput = document.getElementById(fileInputId);
  const previewContainer = document.getElementById(previewContainerId);

  if (fileInput && previewContainer) {
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      // Update label with file name
      const fileLabel = document.querySelector(`label[for="${fileInputId}"]`);
      if (fileLabel) {
        fileLabel.innerHTML = `Resume: ${file.name}`;
      }

      // Show loading message
      previewContainer.innerHTML = "Loading preview...";
      previewContainer.classList.add("active");

      if (file.type === "application/pdf") {
        // For PDFs, use embed
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
    });
  }
}
