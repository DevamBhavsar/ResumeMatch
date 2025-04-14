import { validateFile } from "@/lib/utils/file-utils";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileDropzone({ onFilesAdded, maxFiles = 10, disabled = false }: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate files
      const validFiles: File[] = [];
      
      for (const file of acceptedFiles) {
        const { valid } = validateFile(file);
        if (valid) {
          validFiles.push(file);
          
          // Stop adding files if we reach the limit
          if (validFiles.length >= maxFiles) {
            break;
          }
        }
      }
      
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [onFilesAdded, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:bg-muted/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-10 w-10 mb-2 ${
            isDragActive ? "text-primary" : "text-muted-foreground"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <span className="text-sm font-medium">
          {isDragActive
            ? "Drop the files here..."
            : "Drag & drop files here or click to browse"}
        </span>
        <span className="text-xs text-muted-foreground mt-1">
          Maximum {maxFiles} files, 5MB each
        </span>
      </div>
    </div>
  )
}