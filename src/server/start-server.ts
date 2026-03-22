import * as http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { type DatabaseInfo } from "../core/index.js";
import {
  sendJson,
  sendResponse,
  sendText,
  getContentType,
  readStaticFile,
  resolveStaticFilePath,
} from "./utils.js";

interface StartServerOptions {
  port?: number;
}

export async function startServer(
  dbInfo: DatabaseInfo,
  options: StartServerOptions = {},
): Promise<void> {
  const port = options.port ?? 3001;
  const isDev = process.env.NODE_ENV === "development";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const webDir = path.resolve(__dirname, "../web");
  const cachedResources = new Map<string, Buffer>();

  const server = http.createServer(async (req, res) => {
    const method = req.method ?? "GET";
    const requestUrl = req.url ?? "/";

    if (method !== "GET") {
      sendText(res, 405, "Method Not Allowed");
      return;
    }

    if (requestUrl === "/api/db-info") {
      sendJson(res, 200, dbInfo);
      return;
    }

    if (isDev) {
      sendText(
        res,
        404,
        "Frontend assets are served by the Vite dev server in development.",
      );
      return;
    }

    const filePath = resolveStaticFilePath(webDir, requestUrl);

    if (filePath === null) {
      sendText(res, 403, "Forbidden");
      return;
    }

    try {
      let file = cachedResources.get(filePath);

      if (!file) {
        file = await readStaticFile(filePath);
        cachedResources.set(filePath, file);
      }

      sendResponse(res, {
        statusCode: 200,
        contentType: getContentType(filePath),
        body: file,
      });
    } catch {
      sendText(res, 404, "Not Found");
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);

    server.listen(port, () => {
      if (isDev) {
        console.log(`API server running at http://localhost:${port}`);
        console.log("Frontend is served by the Vite dev server.");
      } else {
        console.log(`View your database graph at http://localhost:${port}`);
      }

      resolve();
    });
  });
}
