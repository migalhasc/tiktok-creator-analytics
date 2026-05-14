import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { applySecurityHeaders } from "./security-headers";
import { appRouter } from "./trpc/router";
import { createContextFromHeaders } from "./trpc/context";

const distDir = resolve(process.cwd(), "dist");
const host = "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const trpcHandler = createHTTPHandler({
  basePath: "/api/trpc/",
  router: appRouter,
  createContext({ req }) {
    return createContextFromHeaders(req.headers as HeadersInit);
  },
});

function resolveAssetPath(pathname: string): string {
  const decoded = decodeURIComponent(pathname);
  const cleaned = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  const relativePath = cleaned.replace(/^\/+/, "");
  return join(distDir, relativePath);
}

async function sendFile(res: ServerResponse, filePath: string, statusCode = 200) {
  const body = await readFile(filePath);
  const extension = extname(filePath).toLowerCase();
  res.statusCode = statusCode;
  res.setHeader("Content-Type", contentTypes[extension] ?? "application/octet-stream");

  if (filePath.includes(`${join(distDir, "assets")}`)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    res.setHeader("Cache-Control", "no-cache");
  }

  res.end(body);
}

const server = createServer(async (req, res) => {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  applySecurityHeaders(res);

  if (url.pathname.startsWith("/api/trpc")) {
    return trpcHandler(req, res);
  }

  if (url.pathname === "/api/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (!["GET", "HEAD"].includes(method)) {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const requestedPath = url.pathname === "/" ? join(distDir, "index.html") : resolveAssetPath(url.pathname);

  try {
    await sendFile(res, requestedPath);
    return;
  } catch {
    try {
      await sendFile(res, join(distDir, "index.html"));
      return;
    } catch {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Failed to serve application" }));
    }
  }
});

server.listen(port, host, () => {
  console.log(`TikTok Analytics listening on http://${host}:${port}`);
});
