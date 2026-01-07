import type { Express } from "express";
import multer from "multer";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { saveFile, getFile, isReplitEnvironment } from "../../file-upload";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * Register object storage routes for file uploads.
 * Supports both Replit Object Storage and local file system fallback.
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload (Replit only).
   * In non-Replit environments, returns useDirectUpload: true to signal
   * that the client should use the direct upload endpoint instead.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Campo obrigatório ausente: name",
        });
      }

      // Check if we're in Replit environment
      if (!isReplitEnvironment()) {
        // Return signal to use direct upload instead
        return res.json({
          useDirectUpload: true,
          directUploadUrl: "/api/uploads/direct",
          metadata: { name, size, contentType },
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        useDirectUpload: false,
        metadata: { name, size, contentType },
      });
    } catch (error: any) {
      console.error("Error generating upload URL:", error);
      const errorMessage = error?.message || "Falha ao gerar URL de upload";
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * Direct file upload endpoint for non-Replit environments.
   * Saves files to local file system.
   */
  app.post("/api/uploads/direct", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const result = await saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        objectPath: result.url,
        fileName: result.fileName,
        url: result.url,
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Falha ao salvar arquivo" });
    }
  });

  /**
   * Serve files from local storage (non-Replit environments).
   */
  app.get("/api/files/:fileName", async (req, res) => {
    try {
      const result = await getFile(req.params.fileName);
      if (!result) {
        return res.status(404).json({ error: "Arquivo não encontrado" });
      }

      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.send(result.buffer);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ error: "Falha ao servir arquivo" });
    }
  });

  /**
   * Serve uploaded objects from Replit Object Storage.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Objeto não encontrado" });
      }
      return res.status(500).json({ error: "Falha ao servir objeto" });
    }
  });
}

