export function initThemeToggle() {
  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.innerHTML = "☀️";
  themeToggle.setAttribute("aria-label", "Toggle light mode");
  document.body.appendChild(themeToggle);

  themeToggle.addEventListener("click", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.innerHTML = "🌙";
      themeToggle.setAttribute("aria-label", "Toggle dark mode");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggle.innerHTML = "☀️";
      themeToggle.setAttribute("aria-label", "Toggle light mode");
    }

    // Update charts when theme changes
    if (typeof window.visualizeSkillGaps === "function") {
      window.visualizeSkillGaps();
    }
    if (typeof window.createSkillRadarChart === "function") {
      window.createSkillRadarChart();
    }
  });

  // Set default theme to dark on initialization
  if (!document.documentElement.hasAttribute("data-theme")) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}
