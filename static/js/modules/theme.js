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

    // Update charts if they exist
    if (window.visualizeSkillGaps) {
      window.visualizeSkillGaps();
    }
    if (window.createSkillRadarChart) {
      window.createSkillRadarChart();
    }
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
