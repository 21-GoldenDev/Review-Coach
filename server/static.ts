import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html for client routes only (never for /api)
  app.use("/{*path}", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({
        message:
          "API endpoint not found. Rebuild the server (npm run build) and restart.",
      });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
