"use client";

import { useCallback, useEffect, useState } from "react";
import { FileWithPreview } from "../types";
import { validateFile } from "../utils/file-utils";

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  onError?: (message: string) => void;
}

export function useFileUpload({
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedFileTypes = [".pdf", ".docx", ".txt"],
  onError,
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const handleFileSelect = useCallback(
    (newFiles: File[]) => {
      // Check if adding these files would exceed the limit
      if (files.length + newFiles.length > maxFiles) {
        onError?.(`You can only upload up to ${maxFiles} files`);
        // Only take as many files as we can fit
        newFiles = newFiles.slice(0, maxFiles - files.length);
      }

      const validFiles: FileWithPreview[] = [];
      const errors: string[] = [];

      // Validate each file
      for (const file of newFiles) {
        const { valid, error } = validateFile(
          file,
          maxSizeMB,
          acceptedFileTypes
        );

        if (valid) {
          // Check for duplicates
          const isDuplicate = files.some(
            (existingFile) =>
              existingFile.name === file.name && existingFile.size === file.size
          );

          if (!isDuplicate) {
            // Create preview URL
            const fileWithPreview = Object.assign(file, {
              preview: URL.createObjectURL(file),
            }) as FileWithPreview;

            validFiles.push(fileWithPreview);
          } else {
            errors.push(`Duplicate file: ${file.name}`);
          }
        } else if (error) {
          errors.push(error);
        }
      }

      // Report errors
      if (errors.length > 0 && onError) {
        onError(errors.join("\n"));
      }

      // Update state with new files
      if (validFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
      }
    },
    [files, maxFiles, maxSizeMB, acceptedFileTypes, onError]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const clearFiles = useCallback(() => {
    // Revoke all object URLs
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
  }, [files]);

  return {
    files,
    handleFileSelect,
    removeFile,
    clearFiles,
  };
}
