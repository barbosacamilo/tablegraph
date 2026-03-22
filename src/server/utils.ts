import path from "node:path";
import fs from "node:fs/promises";
import type { ServerResponse } from "node:http";

interface SendResponseOptions {
  statusCode: number;
  contentType?: string;
  body?: string | Buffer;
}

export function sendResponse(
  res: ServerResponse,
  options: SendResponseOptions,
): void {
  const {
    statusCode,
    contentType = "text/plain; charset=utf-8",
    body = "",
  } = options;

  res.statusCode = statusCode;
  res.setHeader("Content-Type", contentType);
  res.end(body);
}

export function sendText(
  res: ServerResponse,
  statusCode: number,
  body = "",
): void {
  sendResponse(res, {
    statusCode,
    contentType: "text/plain; charset=utf-8",
    body,
  });
}

export function sendJson(
  res: ServerResponse,
  statusCode: number,
  data: unknown,
): void {
  sendResponse(res, {
    statusCode,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(data),
  });
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

export function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  return MIME_TYPES[extension] ?? "application/octet-stream";
}

export function getPathname(requestUrl: string): string {
  return decodeURIComponent(requestUrl.split("?")[0] ?? "/");
}

export function resolveStaticFilePath(
  rootDir: string,
  requestUrl: string,
): string | null {
  const pathname = decodeURIComponent(requestUrl.split("?")[0] ?? "/");
  const relativePath =
    pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(rootDir, relativePath);

  if (!filePath.startsWith(rootDir)) {
    return null;
  }

  return filePath;
}

export async function readStaticFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}
