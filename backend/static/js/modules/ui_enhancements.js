export function initUIEnhancements() {
  // Add ripple effect to buttons
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((button) => {
    button.addEventListener("mousedown", function (e) {
      const x = e.clientX - this.getBoundingClientRect().left;
      const y = e.clientY - this.getBoundingClientRect().top;

      const ripple = document.createElement("span");
      ripple.classList.add("ripple-effect");
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // Add staggered animation to file items
  const animateFileItems = () => {
    const fileItems = document.querySelectorAll(".file-item");
    fileItems.forEach((item, index) => {
      setTimeout(() => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      }, index * 100);
    });
  };

  // Observer for file preview container
  const filesPreview = document.getElementById("files-preview");
  if (filesPreview) {
    const observer = new MutationObserver(animateFileItems);
    observer.observe(filesPreview, { childList: true });
  }

  // Enhance dropzone with visual feedback
  const dropzone = document.getElementById("resume-dropzone");
  if (dropzone) {
    dropzone.addEventListener("dragenter", () => {
      dropzone.classList.add("active-dropzone");
    });

    ["dragleave", "drop"].forEach((event) => {
      dropzone.addEventListener(event, () => {
        dropzone.classList.remove("active-dropzone");
      });
    });
  }
}
