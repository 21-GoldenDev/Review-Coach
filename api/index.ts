import type { Express } from "express";

let app: Express | undefined;
let initError: Error | undefined;

export default async function handler(req: any, res: any) {
  if (initError) {
    return res.status(500).json({ message: initError.message });
  }

  try {
    if (!app) {
      const { createApp } = await import("../server/app.js");
      ({ app } = await createApp());
    }
    return app(req, res);
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error("API initialization failed:", err);
    return res.status(500).json({ message: initError.message });
  }
}
