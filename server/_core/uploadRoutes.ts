import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import { sdk } from "./sdk";
import { uploadToR2, isR2Configured } from "./r2Storage";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function getMimeExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[mime] ?? "bin";
}

export function registerUploadRoutes(app: Express) {
  // POST /api/upload/image   — accepts raw binary body, Content-Type must be image/*
  // POST /api/upload/video   — accepts raw binary body, Content-Type must be video/*
  app.post(
    ["/api/upload/image", "/api/upload/video"],
    express_raw_middleware,
    async (req: Request, res: Response) => {
      // Auth check
      let authed = false;
      try {
        await sdk.authenticateRequest(req);
        authed = true;
      } catch {
        authed = false;
      }
      if (!authed) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!isR2Configured()) {
        res.status(503).json({ error: "R2 storage not configured on server" });
        return;
      }

      const contentType = req.headers["content-type"] ?? "application/octet-stream";
      const isImage = contentType.startsWith("image/");
      const isVideo = contentType.startsWith("video/");

      if (!isImage && !isVideo) {
        res.status(400).json({ error: "Content-Type must be image/* or video/*" });
        return;
      }

      const body = req.body as Buffer;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        res.status(400).json({ error: "Empty body" });
        return;
      }
      if (body.length > MAX_BYTES) {
        res.status(413).json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` });
        return;
      }

      const folder = isImage ? "images" : "videos";
      const ext = getMimeExtension(contentType);
      const key = `${folder}/${nanoid()}.${ext}`;

      try {
        const url = await uploadToR2(key, body, contentType);
        res.json({ success: true, url, key });
      } catch (err) {
        console.error("[Upload] R2 upload failed:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    },
  );

  // GET /api/upload/status — lets the client know if R2 is configured
  app.get("/api/upload/status", (_req, res) => {
    res.json({ r2Configured: isR2Configured() });
  });
}

// Middleware: parse raw binary body for upload routes
function express_raw_middleware(req: Request, res: Response, next: () => void) {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    req.body = Buffer.concat(chunks);
    next();
  });
  req.on("error", (err) => {
    console.error("[Upload] Body read error:", err);
    res.status(500).json({ error: "Failed to read request body" });
  });
}
