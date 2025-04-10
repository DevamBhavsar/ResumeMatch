export function initThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  if (!themeToggle) {
    const storedDarkMode = localStorage.getItem("dark-mode");
    if (storedDarkMode === "true") {
      body.classList.add("dark-mode");
      body.setAttribute("data-theme", "dark");
    } else {
      body.classList.remove("dark-mode");
      body.setAttribute("data-theme", "light");
    }
    return;
  }

  themeToggle.addEventListener("click", function () {
    // Toggle dark-mode class
    body.classList.toggle("dark-mode");

    // Set data-theme attribute for CSS variables
    const isDarkMode = body.classList.contains("dark-mode");
    body.setAttribute("data-theme", isDarkMode ? "dark" : "light");

    // Save preference to localStorage
    localStorage.setItem("dark-mode", isDarkMode);

    // Update the icon based on the theme
    themeToggle.textContent = isDarkMode ? "🌙" : "☀️";

    // Add a small delay to ensure CSS variables are updated
    setTimeout(() => {
      // Update charts if they exist
      if (window.visualizeSkillGaps) {
        window.visualizeSkillGaps();
      }
      if (window.createSkillRadarChart) {
        window.createSkillRadarChart();
      }
      if (window.createRankingChart) {
        window.createRankingChart();
      }
      if (window.modalSkillChart) {
        // If there's an open modal with a chart, update it too
        const candidateId = document
          .querySelector(".view-details-btn[data-candidate-id]")
          ?.getAttribute("data-candidate-id");
        if (candidateId) {
          const dataElement = document.getElementById("ranking-data");
          if (dataElement) {
            try {
              const candidatesData = JSON.parse(dataElement.textContent);
              if (candidatesData[candidateId - 1]) {
                createModalSkillGapChart(candidatesData[candidateId - 1]);
              }
            } catch (e) {
              console.error("Error updating modal chart:", e);
            }
          }
        }
      }
    }, 50);
  });

  // Check local storage for saved theme
  const storedDarkMode = localStorage.getItem("dark-mode");
  if (storedDarkMode === "true") {
    body.classList.add("dark-mode");
    body.setAttribute("data-theme", "dark");
    themeToggle.textContent = "🌙";
  } else {
    body.classList.remove("dark-mode");
    body.setAttribute("data-theme", "light");
    themeToggle.textContent = "☀️";
  }
}
