"use client";

import { FileWithPreview } from "@/lib/types";
import { formatFileSize, getFileTypeIcon, getFileTypeLabel } from "@/lib/utils/file-utils";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface FilePreviewProps {
  files: FileWithPreview[];
  onRemove: (index: number) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function FilePreview({ files, onRemove, onClear, disabled = false }: FilePreviewProps) {
  const [previewFile, setPreviewFile] = useState<FileWithPreview | null>(null);

  if (files.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline">{files.length} files selected</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled}
            >
              Clear all
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div 
                  className="flex items-center cursor-pointer hover:bg-muted/50 p-1 rounded flex-1"
                  onClick={() => setPreviewFile(file)}
                >
                  <div className="text-2xl mr-2">{getFileTypeIcon(file.type)}</div>
                  <div>
                    <div className="font-medium truncate max-w-[200px]">{file.name}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {getFileTypeLabel(file.type)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewFile?.type === "application/pdf" ? (
              <iframe
                src={previewFile.preview}
                className="w-full h-[500px] border rounded"
                title={previewFile.name}
              />
            ) : previewFile?.type === "text/plain" ? (
              <div className="w-full h-[500px] border rounded p-4 overflow-auto bg-muted/20 font-mono text-sm">
                <pre>Loading text content...</pre>
              </div>
            ) : (
              <div className="w-full h-[500px] border rounded flex items-center justify-center">
                <p className="text-muted-foreground">
                  Preview not available for {getFileTypeLabel(previewFile?.type || "")} files.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
