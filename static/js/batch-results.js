import { initThemeToggle } from "./modules/theme.js";

document.addEventListener("DOMContentLoaded", function () {
  // Initialize theme toggle
  initThemeToggle();

  // Initialize charts
  createRankingChart();

  // Initialize modal functionality
  initCandidateModal();
});

function createRankingChart() {
  const ctx = document.getElementById("rankingChart");
  if (!ctx) return;

  // Get data from the hidden JSON element
  const dataElement = document.getElementById("ranking-data");
  if (!dataElement) return;

  let rankingData;
  try {
    rankingData = JSON.parse(dataElement.textContent);
  } catch (e) {
    console.error("Error parsing ranking data:", e);
    return;
  }

  // Prepare data for chart
  const labels = rankingData.map((item) => {
    // Use resume name or contact name if available
    if (item.contact_info && item.contact_info.name) {
      return item.contact_info.name;
    }
    return item.resume_name;
  });

  const scores = rankingData.map((item) => item.overall_score);

  // Get colors based on scores
  const backgroundColors = scores.map((score) => {
    if (score >= 80)
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--success-color")
        .trim();
    if (score >= 60)
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--warning-color")
        .trim();
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--danger-color")
      .trim();
  });

  // Create horizontal bar chart
  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Match Score (%)",
          data: scores,
          backgroundColor: backgroundColors,
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Match Score: ${context.raw}%`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--text-color")
              .trim(),
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--text-color")
              .trim(),
          },
        },
      },
    },
  });
}

function initCandidateModal() {
  const modal = document.getElementById("candidate-modal");
  const closeBtn = document.querySelector(".close-modal");
  const viewDetailsBtns = document.querySelectorAll(".view-details-btn");

  if (!modal || !closeBtn || !viewDetailsBtns.length) return;

  // Get data from the hidden JSON element
  const dataElement = document.getElementById("ranking-data");
  if (!dataElement) return;

  let candidatesData;
  try {
    candidatesData = JSON.parse(dataElement.textContent);
  } catch (e) {
    console.error("Error parsing candidates data:", e);
    return;
  }

  // Add click event to all "View Details" buttons
  viewDetailsBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const candidateId = parseInt(this.getAttribute("data-candidate-id")) - 1;
      if (candidateId >= 0 && candidateId < candidatesData.length) {
        openCandidateModal(candidatesData[candidateId]);
      }
    });
  });

  // Close modal when clicking the X button
  closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; // Restore scrolling
  });

  // Close modal when clicking outside the modal content
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = ""; // Restore scrolling
    }
  });
}

function openCandidateModal(candidateData) {
  const modal = document.getElementById("candidate-modal");
  const candidateName = document.getElementById("modal-candidate-name");
  const overallScore = document.getElementById("modal-overall-score");
  const scoreText = overallScore.querySelector(".score-text");
  const matchingSkills = document.getElementById("modal-matching-skills");
  const missingSkills = document.getElementById("modal-missing-skills");

  // Set candidate name
  let displayName = candidateData.resume_name;
  if (candidateData.contact_info && candidateData.contact_info.name) {
    displayName = `${candidateData.contact_info.name} (${candidateData.resume_name})`;
  }
  candidateName.textContent = displayName;

  // Set overall score
  const score = candidateData.overall_score;
  scoreText.textContent = `${score}%`;

  // Set color based on score
  let fillColor;
  if (score >= 80) {
    fillColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--success-color")
      .trim();
  } else if (score >= 60) {
    fillColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--warning-color")
      .trim();
  } else {
    fillColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--danger-color")
      .trim();
  }

  overallScore.style.background = `conic-gradient(${fillColor} ${
    score * 3.6
  }deg, #f1f1f1 ${score * 3.6}deg, #f1f1f1 360deg)`;

  // Populate matching skills
  matchingSkills.innerHTML = "";
  if (
    candidateData.matching_skills &&
    candidateData.matching_skills.length > 0
  ) {
    candidateData.matching_skills.forEach((skill) => {
      const skillTag = document.createElement("span");
      skillTag.className = "skill-tag match";
      skillTag.textContent = skill;
      matchingSkills.appendChild(skillTag);
    });
  } else {
    matchingSkills.innerHTML = "<p>No matching skills found.</p>";
  }

  // Populate missing skills
  missingSkills.innerHTML = "";
  if (candidateData.missing_skills && candidateData.missing_skills.length > 0) {
    candidateData.missing_skills.forEach((skill) => {
      const skillTag = document.createElement("span");
      skillTag.className = "skill-tag missing";
      skillTag.textContent = skill;
      missingSkills.appendChild(skillTag);
    });
  } else {
    missingSkills.innerHTML = "<p>No missing skills! Great match!</p>";
  }

  // Create skill gap chart
  createModalSkillGapChart(candidateData);

  // Show the modal
  modal.style.display = "block";
}

function createModalSkillGapChart(candidateData) {
  const ctx = document.getElementById("modalSkillGapChart").getContext("2d");

  // Destroy existing chart if it exists
  if (window.modalSkillChart instanceof Chart) {
    window.modalSkillChart.destroy();
  }

  // Create chart
  window.modalSkillChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Matching Skills", "Missing Skills"],
      datasets: [
        {
          data: [
            candidateData.matching_skills
              ? candidateData.matching_skills.length
              : 0,
            candidateData.missing_skills
              ? candidateData.missing_skills.length
              : 0,
          ],
          backgroundColor: [
            getComputedStyle(document.documentElement)
              .getPropertyValue("--success-color")
              .trim(),
            getComputedStyle(document.documentElement)
              .getPropertyValue("--danger-color")
              .trim(),
          ],
          borderColor: [
            getComputedStyle(document.documentElement)
              .getPropertyValue("--container-bg")
              .trim(),
            getComputedStyle(document.documentElement)
              .getPropertyValue("--container-bg")
              .trim(),
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--text-color")
              .trim(),
            font: {
              size: 14,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              const total = context.dataset.data.reduce(
                (acc, val) => acc + val,
                0
              );
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      cutout: "60%",
      animation: {
        animateScale: true,
        animateRotate: true,
      },
    },
  });
}
