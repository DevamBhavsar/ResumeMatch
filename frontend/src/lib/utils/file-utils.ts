export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileTypeIcon(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return "📕";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "📘";
    case "text/plain":
      return "📃";
    default:
      return "📄";
  }
}

export function getFileTypeLabel(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return "PDF";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "DOCX";
    case "text/plain":
      return "TXT";
    default:
      return "Unknown";
  }
}

export function validateFile(file: File) {
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  // Check file size
  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit: ${file.name}`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported (only PDF, DOCX, and TXT allowed): ${file.name}`,
    };
  }

  return { valid: true };
}
