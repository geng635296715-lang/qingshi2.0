import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile, rename } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import "../frontend/app/bazi-dynamic-engine.js";

const backendRoot = fileURLToPath(new URL(".", import.meta.url));
const frontendRoot = resolve(backendRoot, "../frontend");
const dataRoot = resolve(backendRoot, "data");
const liuyaoDataRoot = resolve(backendRoot, "../../数据库/3.六爻数据库/六爻占卜数据库/exports");
const storageRoot = resolve(backendRoot, "storage");
const archiveStore = resolve(storageRoot, "archives.json");
const port = Number.parseInt(process.env.PORT || "8765", 10);
const host = process.env.HOST || "0.0.0.0";
const dynamicBaziEngine = globalThis.QingshiDynamicUsefulGodEngine;

const apiFiles = new Map([
  ["/api/shensha-rules.json", "shensha-rules.json"],
  ["/api/shensha-wenzhen.json", "shensha-wenzhen.json"],
  ["/api/shensha-profiles.json", "shensha-profiles.json"],
  ["/api/shensha-catalog.json", "shensha-catalog.json"],
]);

const liuyaoApiFiles = new Map([
  ["/api/liuyao-hexagrams.json", "hexagrams.json"],
  ["/api/liuyao-readings.json", "application_readings.json"],
  ["/api/liuyao-details.json", "hexagram_details.json"],
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

async function readArchives() {
  try {
    const data = JSON.parse(await readFile(archiveStore, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function writeArchives(items) {
  await mkdir(storageRoot, { recursive: true });
  const temporary = `${archiveStore}.tmp`;
  await writeFile(temporary, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  await rename(temporary, archiveStore);
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 2_000_000) throw new Error("BODY_TOO_LARGE");
  }
  return JSON.parse(body || "null");
}

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

async function createDoubaoRelationshipAnalysis(context) {
  const apiKey = process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY;
  const model = process.env.DOUBAO_MODEL || process.env.ARK_MODEL;
  if (!apiKey || !model) return null;
  const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 450,
      messages: [
        { role: "system", content: "你是传统民俗合盘文案编辑。只根据输入的结构化评分精简文案，不新增事实，不作宿命判断。仅返回JSON：{\"status\":\"80至120字关系状况\",\"advice\":[\"建议1\",\"建议2\",\"建议3\"]}。每条建议不超过35字。" },
        { role: "user", content: JSON.stringify(context) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`DOUBAO_${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const match = content.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : null;
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
  if (request.url?.split("?")[0] === "/api/bazi-dynamic-analysis") {
    if (request.method !== "POST") {
      send(response, 405, "Method Not Allowed", { Allow: "POST", "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    try {
      const input = await readJsonBody(request);
      if (!input || !Array.isArray(input.pillars) || typeof input.dayun !== "string") {
        send(response, 400, JSON.stringify({ error: "INVALID_BAZI_DYNAMIC_INPUT" }), { "Content-Type": "application/json; charset=utf-8" });
        return;
      }
      const result = input.scope
        ? dynamicBaziEngine.scoreLuckPeriod({ scope: input.scope, pillars: input.pillars, dayun: input.dayun, yearPillar: input.yearPillar || "—", monthPillar: input.monthPillar || "—", usefulOverride: input.usefulOverride || null })
        : input.yearPillar
          ? dynamicBaziEngine.scoreYear({ pillars: input.pillars, dayun: input.dayun, yearPillar: input.yearPillar })
          : dynamicBaziEngine.analyze({ pillars: input.pillars, dayun: input.dayun });
      send(response, 200, JSON.stringify(result), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return;
    } catch (error) {
      send(response, 400, JSON.stringify({ error: error?.message || "BAZI_DYNAMIC_ANALYSIS_ERROR" }), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return;
    }
  }

  if (request.url?.split("?")[0] === "/api/hepan-analysis") {
    if (request.method !== "POST") {
      send(response, 405, "Method Not Allowed", { Allow: "POST", "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    try {
      const context = await readJsonBody(request);
      if (!context || typeof context !== "object" || typeof context.status !== "string" || !Array.isArray(context.advice)) {
        send(response, 400, JSON.stringify({ error: "INVALID_ANALYSIS_CONTEXT" }), { "Content-Type": "application/json; charset=utf-8" });
        return;
      }
      const analysis = await createDoubaoRelationshipAnalysis(context);
      if (!analysis) {
        send(response, 503, JSON.stringify({ error: "DOUBAO_NOT_CONFIGURED" }), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        return;
      }
      send(response, 200, JSON.stringify(analysis), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return;
    } catch (error) {
      console.error(error);
      send(response, 502, JSON.stringify({ error: "DOUBAO_ANALYSIS_ERROR" }), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return;
    }
  }

  if (request.url?.split("?")[0] === "/api/archives") {
    try {
      if (request.method === "GET" || request.method === "HEAD") {
        const body = JSON.stringify(await readArchives());
        send(response, 200, request.method === "HEAD" ? undefined : body, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        return;
      }
      if (request.method === "PUT") {
        const items = await readJsonBody(request);
        if (!Array.isArray(items) || items.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string")) {
          send(response, 400, JSON.stringify({ error: "INVALID_ARCHIVES" }), { "Content-Type": "application/json; charset=utf-8" });
          return;
        }
        await writeArchives(items);
        send(response, 200, JSON.stringify({ ok: true, count: items.length }), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        return;
      }
      send(response, 405, "Method Not Allowed", { Allow: "GET, HEAD, PUT", "Content-Type": "text/plain; charset=utf-8" });
      return;
    } catch (error) {
      console.error(error);
      send(response, error?.message === "BODY_TOO_LARGE" ? 413 : 500, JSON.stringify({ error: "ARCHIVE_STORAGE_ERROR" }), { "Content-Type": "application/json; charset=utf-8" });
      return;
    }
  }

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

  const liuyaoApiFile = liuyaoApiFiles.get(pathname);
  if (liuyaoApiFile) {
    await serveFile(request, response, resolve(liuyaoDataRoot, liuyaoApiFile), "no-store");
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
