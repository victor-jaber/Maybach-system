import { useState, useCallback } from "react";
import type { UppyFile } from "@uppy/core";

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL?: string;
  objectPath: string;
  metadata?: UploadMetadata;
  useDirectUpload?: boolean;
  directUploadUrl?: string;
  url?: string;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for handling file uploads with presigned URLs.
 *
 * This hook implements the two-step presigned URL upload flow:
 * 1. Request a presigned URL from your backend (sends JSON metadata, NOT the file)
 * 2. Upload the file directly to the presigned URL
 *
 * @example
 * ```tsx
 * function FileUploader() {
 *   const { uploadFile, isUploading, error } = useUpload({
 *     onSuccess: (response) => {
 *       console.log("Uploaded to:", response.objectPath);
 *     },
 *   });
 *
 *   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (file) {
 *       await uploadFile(file);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileChange} disabled={isUploading} />
 *       {isUploading && <p>Uploading...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Request a presigned URL from the backend.
   * IMPORTANT: Send JSON metadata, NOT the file itself.
   */
  const requestUploadUrl = useCallback(
    async (file: File): Promise<UploadResponse> => {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao obter URL de upload");
      }

      return response.json();
    },
    []
  );

  /**
   * Upload a file directly to the presigned URL.
   */
  const uploadToPresignedUrl = useCallback(
    async (file: File, uploadURL: string): Promise<void> => {
      const response = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload file to storage");
      }
    },
    []
  );

  /**
   * Upload a file directly to server (for non-Replit environments).
   */
  const uploadDirectly = useCallback(
    async (file: File, uploadUrl: string): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao enviar arquivo");
      }

      return response.json();
    },
    []
  );

  /**
   * Upload a file using the appropriate flow (presigned URL or direct upload).
   *
   * @param file - The file to upload
   * @returns The upload response containing the object path
   */
  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Step 1: Check which upload method to use
        setProgress(10);
        const initialResponse = await requestUploadUrl(file);

        // Step 2: Use appropriate upload method
        setProgress(30);
        
        if (initialResponse.useDirectUpload && initialResponse.directUploadUrl) {
          // Direct upload to server (non-Replit environment)
          const directResult = await uploadDirectly(file, initialResponse.directUploadUrl);
          setProgress(100);
          const finalResponse = { ...initialResponse, ...directResult };
          options.onSuccess?.(finalResponse);
          return finalResponse;
        } else if (initialResponse.uploadURL) {
          // Presigned URL upload (Replit environment)
          await uploadToPresignedUrl(file, initialResponse.uploadURL);
          setProgress(100);
          options.onSuccess?.(initialResponse);
          return initialResponse;
        } else {
          throw new Error("Nenhum método de upload disponível");
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Falha no upload");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [requestUploadUrl, uploadToPresignedUrl, uploadDirectly, options]
  );

  /**
   * Check if we're in a Replit environment (has Object Storage).
   */
  const checkEnvironment = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test.tmp", size: 0, contentType: "text/plain" }),
      });
      const data = await response.json();
      return !data.useDirectUpload;
    } catch {
      return false;
    }
  }, []);

  /**
   * Get upload parameters for Uppy's AWS S3 plugin.
   * Only works in Replit environments with Object Storage.
   * For non-Replit environments, use uploadFile() instead.
   */
  const getUploadParameters = useCallback(
    async (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>
    ): Promise<{
      method: "PUT";
      url: string;
      headers?: Record<string, string>;
    }> => {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao obter URL de upload");
      }

      const data = await response.json();
      
      if (data.useDirectUpload || !data.uploadURL) {
        throw new Error("Uppy não suportado neste ambiente. Use o método uploadFile().");
      }
      
      return {
        method: "PUT",
        url: data.uploadURL,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      };
    },
    []
  );

  return {
    uploadFile,
    getUploadParameters,
    checkEnvironment,
    isUploading,
    error,
    progress,
  };
}

