import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = fileURLToPath(new URL(".", import.meta.url));
const frontendRoot = resolve(backendRoot, "../frontend");
const dataRoot = resolve(backendRoot, "data");
const port = Number.parseInt(process.env.PORT || "8765", 10);
const host = process.env.HOST || "127.0.0.1";

const apiFiles = new Map([
  ["/api/shensha-rules.json", "shensha-rules.json"],
  ["/api/shensha-wenzhen.json", "shensha-wenzhen.json"],
  ["/api/shensha-profiles.json", "shensha-profiles.json"],
  ["/api/shensha-catalog.json", "shensha-catalog.json"],
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(body);
}

function isInsideRoot(filePath, root) {
  return filePath === root || filePath.startsWith(`${root}${sep}`);
}

async function serveFile(request, response, filePath, cacheControl) {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      send(response, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    const content = request.method === "HEAD" ? undefined : await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": fileStat.size,
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
    });
    response.end(content);
  } catch (error) {
    if (error?.code === "ENOENT") {
      send(response, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    console.error(error);
    send(response, 500, "Internal Server Error", { "Content-Type": "text/plain; charset=utf-8" });
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    send(response, 405, "Method Not Allowed", {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
    });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || "/", `http://${request.headers.host || host}`).pathname);
  } catch {
    send(response, 400, "Bad Request", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const apiFile = apiFiles.get(pathname);
  if (apiFile) {
    await serveFile(request, response, resolve(dataRoot, apiFile), "no-store");
    return;
  }

  const route = pathname === "/" ? "/index.html" : pathname;
  const filePath = resolve(frontendRoot, route.replace(/^\/+/, ""));
  if (!isInsideRoot(filePath, frontendRoot)) {
    send(response, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  await serveFile(request, response, filePath, "no-cache");
});

server.listen(port, host, () => {
  console.log(`青筮问道八字网页已启动：http://${host}:${port}`);
});

