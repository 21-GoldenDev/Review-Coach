import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Express, Response } from "express";
import multer from "multer";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(UPLOADS_DIR, "temp");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = randomUUID() + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export class LocalStorageService {
  /**
   * Generate a filename with timestamp and extension
   */
  generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    return `${timestamp}${ext}`;
  }

  /**
   * Generate a URL for serving uploaded files
   */
  getFileUrl(filePath: string): string {
    // filePath should be relative like "avatars/filename.jpg"
    return `/uploads/${filePath}`;
  }

  /**
   * Save file to local storage and return the relative path
   */
  async saveFile(
    file: Express.Multer.File,
    subdir: string = "files",
  ): Promise<string> {
    const targetDir = path.join(UPLOADS_DIR, subdir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.filename);
    const filename = randomUUID() + ext;
    const filepath = path.join(targetDir, filename);

    // Move file from temp to final location
    const tempPath = file.path;
    fs.renameSync(tempPath, filepath);

    // Return relative path for storage
    return path.join(subdir, filename).replace(/\\/g, "/");
  }

  /**
   * Serve file from local storage
   */
  async serveFile(filePath: string, res: Response): Promise<void> {
    const fullPath = path.join(UPLOADS_DIR, filePath);

    // Prevent directory traversal attacks
    if (!fullPath.startsWith(UPLOADS_DIR)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    try {
      const stat = fs.statSync(fullPath);
      const filename = path.basename(fullPath);
      const ext = path.extname(filename).toLowerCase();

      const mimeTypes: Record<string, string> = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";

      res.set({
        "Content-Type": contentType,
        "Content-Length": stat.size,
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": `attachment; filename="${filename}"`,
      });

      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error serving file" });
        }
      });
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ error: "Error serving file" });
    }
  }

  /**
   * Save binary stream to local storage
   */
  async saveStream(
    stream: NodeJS.ReadableStream,
    filename: string,
    subdir: string = "files",
  ): Promise<string> {
    const targetDir = path.join(UPLOADS_DIR, subdir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filepath = path.join(targetDir, filename);

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filepath);

      stream.pipe(writeStream);

      writeStream.on("finish", () => {
        // Return relative path for storage
        const relativePath = path.join(subdir, filename).replace(/\\/g, "/");
        resolve(relativePath);
      });

      writeStream.on("error", (err) => {
        console.error("Error writing file:", err);
        reject(err);
      });

      stream.on("error", (err) => {
        console.error("Error reading stream:", err);
        writeStream.destroy();
        reject(err);
      });
    });
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    const fullPath = path.join(UPLOADS_DIR, filePath);

    // Prevent directory traversal attacks
    if (!fullPath.startsWith(UPLOADS_DIR)) {
      console.error("Access denied for delete operation");
      return false;
    }

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }
}

export { upload };
export const localStorageService = new LocalStorageService();
