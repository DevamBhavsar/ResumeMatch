export function initBatchFormSubmission() {
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
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = "flex";
      // Position the loading indicator in the viewport
      const windowHeight = window.innerHeight;
      const loadingHeight = loadingIndicator.offsetHeight || 400;
      const scrollPosition =
        window.scrollY + (windowHeight - loadingHeight) / 2;

      window.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });

      // Start the loading animation
      if (window.startLoadingAnimation) {
        window.startLoadingAnimation();
      }
    }

    // Submit the form after a short delay to allow the animation to start
    setTimeout(() => {
      form.submit();
    }, 500);
  });
}
