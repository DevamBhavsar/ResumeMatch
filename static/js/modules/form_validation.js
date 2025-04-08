export function initFormValidation(formId, resumeInputId, jdInputId) {
  const form = document.getElementById(formId);
  const resumeInput = document.getElementById(resumeInputId);
  const jdInput = document.getElementById(jdInputId);

  if (form && resumeInput && jdInput) {
    form.addEventListener("submit", function (e) {
      if (!jdInput.value.trim() || !resumeInput.files[0]) {
        e.preventDefault();
        alert("Please provide both a resume file and job description");
      }
    });
  }
}
