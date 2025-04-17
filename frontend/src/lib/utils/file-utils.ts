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

export function validateFile(
  file: File,
  maxSizeMB: number = 5,
  acceptedFileTypes: string[] = [".pdf", ".docx", ".txt"]
): { valid: boolean; error?: string } {
  // Check file size (default 5MB limit)
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File ${file.name} is too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  // Check file type
  const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  if (!acceptedFileTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `File ${
        file.name
      } has an unsupported format. Accepted formats: ${acceptedFileTypes.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
}
