export function initLoadingAnimation() {
  const loadingIndicator = document.getElementById("loading-indicator");
  const progressBar = document.getElementById("progress-bar");
  const loadingStatus = document.getElementById("loading-status");
  const loadingSteps = document.querySelectorAll(".loading-step");

  if (!loadingIndicator) return;

  // Make the startLoadingAnimation function globally available
  window.startLoadingAnimation = function () {
    // Reset progress
    let progress = 0;
    progressBar.style.width = "0%";

    // Reset all steps
    loadingSteps.forEach((step) => {
      step.classList.remove("active", "completed");
      const icon = step.querySelector(".step-status");
      icon.textContent = "⏳";
      icon.style.transform = "scale(1)";
      icon.classList.remove("spinning");
      step.style.animation = "none";
      step.style.borderLeft = "3px solid var(--text-muted)";
    });

    // Activate first step immediately
    activateStep(0);

    // Start progress animation
    const interval = 50; // Update every 50ms for smooth animation
    const totalTime = 8000; // 8 seconds total
    const increment = (interval / totalTime) * 100;

    const progressInterval = setInterval(() => {
      progress += increment;
      // Update the progress bar width (animated)
      progressBar.style.width = `${Math.min(progress, 99)}%`;

      // Update steps based on progress
      if (progress < 25) {
        loadingStatus.textContent = "Extracting text from resumes...";
      } else if (progress < 50) {
        loadingStatus.textContent = "Analyzing skills and keywords...";
        completeStep(0);
        activateStep(1);
      } else if (progress < 75) {
        loadingStatus.textContent = "Calculating match scores...";
        completeStep(1);
        activateStep(2);
      } else if (progress < 95) {
        loadingStatus.textContent = "Ranking candidates...";
        completeStep(2);
        activateStep(3);
      } else {
        loadingStatus.textContent = "Almost done!";
        completeStep(3);
      }

      if (progress >= 99) {
        clearInterval(progressInterval);
      }
    }, interval);
  };

  window.updateLoadingProgress = function (progressData) {
    console.log(
      `Updating progress: ${progressData.progress}% - ${progressData.message}`
    );

    // Update progress bar
    progressBar.style.width = `${progressData.progress}%`;
    loadingStatus.textContent = progressData.message;

    // Update steps based on current stage
    const stages = {
      extracting: 0,
      analyzing: 1,
      calculating: 2,
      ranking: 3,
    };

    const currentStageIndex = stages[progressData.stage];
    console.log(`Current stage: ${progressData.stage} (${currentStageIndex})`);

    // Complete all previous steps
    for (let i = 0; i < currentStageIndex; i++) {
      console.log(`Completing step ${i}`);
      completeStep(i);
    }

    // Activate current step
    console.log(`Activating step ${currentStageIndex}`);
    activateStep(currentStageIndex);
  };

  function activateStep(index) {
    const step = loadingSteps[index];
    if (!step) return;

    // Add active class to change border color
    step.classList.add("active");

    // Set border color explicitly (for better browser compatibility)
    step.style.borderLeft = "3px solid var(--primary-color)";

    // Get the status icon and animate it
    const icon = step.querySelector(".step-status");
    icon.textContent = "⏳";
    icon.classList.add("spinning");
    icon.style.color = "var(--primary-color)";

    // Add pulse animation to the active step
    step.style.animation = "pulse 1.5s infinite";
  }

  function completeStep(index) {
    const step = loadingSteps[index];
    if (!step) return;

    // Change classes to show completion
    step.classList.remove("active");
    step.classList.add("completed");

    // Set border color explicitly (for better browser compatibility)
    step.style.borderLeft = "3px solid var(--success-color)";

    // Stop animations
    step.style.animation = "none";

    // Get the status icon
    const icon = step.querySelector(".step-status");

    // Remove spinning animation
    icon.classList.remove("spinning");

    // Animate checkmark appearance
    icon.style.transform = "scale(0)";
    setTimeout(() => {
      // Change from hourglass to checkmark
      icon.textContent = "✓";
      icon.style.transform = "scale(1.2)";
      icon.style.color = "var(--success-color)";

      // Add a slight bounce effect
      setTimeout(() => {
        icon.style.transform = "scale(1)";
      }, 150);
    }, 100);
  }
}
