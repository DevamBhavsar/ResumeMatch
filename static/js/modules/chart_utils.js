export function visualizeSkillGaps() {
  const ctx = document.getElementById("skillGapChart").getContext("2d");

  // Get data from the page
  const matchingSkills = Array.from(
    document.querySelectorAll(".skill-tag.match")
  ).map((el) => el.textContent.trim());

  const missingSkills = Array.from(
    document.querySelectorAll(".skill-tag.missing")
  ).map((el) => el.textContent.trim());

  // Destroy existing chart if it exists to prevent duplicates
  if (window.skillChart) {
    window.skillChart.destroy();
  }

  // Create chart with proper colors and fixed size
  window.skillChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Matching Skills", "Missing Skills"],
      datasets: [
        {
          data: [matchingSkills.length, missingSkills.length],
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

export function createSkillRadarChart() {
  const ctx = document.getElementById("skillRadarChart");
  if (!ctx) return; // Exit if element doesn't exist

  // Get data from the page
  const matchingSkills = Array.from(
    document.querySelectorAll(".skill-tag.match")
  ).map((el) => el.textContent.trim());

  const missingSkills = Array.from(
    document.querySelectorAll(".skill-tag.missing")
  ).map((el) => el.textContent.trim());

  // Get top 5 skills from each category for the radar chart
  const topMatchingSkills = matchingSkills.slice(0, 5);
  const topMissingSkills = missingSkills.slice(0, 5);

  // Combine all skills for labels
  const allSkills = [...topMatchingSkills, ...topMissingSkills];

  // Get skill strengths if available
  let skillStrengths = {};
  try {
    const dataElement = document.getElementById("skill-strengths-data");
    if (dataElement && dataElement.textContent.trim()) {
      skillStrengths = JSON.parse(dataElement.textContent);
    }
  } catch (e) {
    console.error("Error parsing skill strengths data:", e);
    // Fallback to binary values if strengths aren't available
    skillStrengths = {};
  }

  // Create data for matching skills with strength values
  const matchingData = allSkills.map((skill) => {
    if (topMatchingSkills.includes(skill)) {
      return skillStrengths[skill] || 100;
    }
    return 0;
  });

  // Destroy existing chart if it exists to prevent duplicates
  if (window.skillRadarChart instanceof Chart) {
    window.skillRadarChart.destroy();
  }

  // Create radar chart with improved configuration
  window.skillRadarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: allSkills,
      datasets: [
        {
          label: "Your Skills",
          data: matchingData,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgb(54, 162, 235)",
          pointBackgroundColor: "rgb(54, 162, 235)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(54, 162, 235)",
        },
        {
          label: "Required Skills",
          data: allSkills.map(() => 100), // All skills at 100%
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgb(255, 99, 132)",
          pointBackgroundColor: "rgb(255, 99, 132)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(255, 99, 132)",
        },
      ],
    },
    options: {
      elements: {
        line: {
          borderWidth: 3,
        },
        point: {
          radius: 4,
          hoverRadius: 6,
        },
      },
      scales: {
        r: {
          angleLines: {
            display: true,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--border-color")
              .trim(),
          },
          grid: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--border-color")
              .trim(),
          },
          pointLabels: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--text-color")
              .trim(),
            font: {
              size: 12,
            },
            padding: 8,
          },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: {
            display: false, // Hide the numeric labels
            backdropColor: "transparent",
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--text-color")
              .trim(),
            showLabelBackdrop: false,
            stepSize: 20,
          },
        },
      },
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
            boxWidth: 15,
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: getComputedStyle(document.documentElement)
            .getPropertyValue("--container-bg")
            .trim(),
          titleColor: getComputedStyle(document.documentElement)
            .getPropertyValue("--heading-color")
            .trim(),
          bodyColor: getComputedStyle(document.documentElement)
            .getPropertyValue("--text-color")
            .trim(),
          borderColor: getComputedStyle(document.documentElement)
            .getPropertyValue("--border-color")
            .trim(),
          borderWidth: 1,
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.raw || 0;
              return `${label}: ${value}%`;
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

export function addSkillTooltips() {
  const skillTags = document.querySelectorAll(".skill-tag");

  skillTags.forEach((tag) => {
    const skill = tag.textContent.trim();
    const isMatching = tag.classList.contains("match");

    // Add tooltip attribute
    tag.setAttribute(
      "title",
      isMatching
        ? `You have this skill: ${skill}`
        : `Missing skill: ${skill} - Consider adding this to your resume`
    );

    // Add hover effect
    tag.style.cursor = "pointer";
  });
}
