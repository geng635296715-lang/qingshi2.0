import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../frontend");
const textExtensions = new Set([".html", ".css", ".js"]);
const errors = [];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const files = await walk(root);
for (const file of files.filter(path => textExtensions.has(extname(path)))) {
  const source = await readFile(file, "utf8");
  const absolute = source.match(/(?:href|src)=["']\/(?!\/)|(?:fetch|import)\(["']\/(?!\/)|url\(["']?\/(?!\/)/g);
  if (absolute) errors.push(`${file}: contains root-absolute website paths`);

  const references = extname(file) === ".js" ? [] : [
    ...source.matchAll(/(?:href|src)=["']([^"'#]+)["']/g),
    ...source.matchAll(/url\(["']?([^"')#]+)["']?\)/g),
  ].map(match => match[1]).filter(value => value.startsWith("./"));

  for (const reference of references) {
    const clean = reference.split("?")[0];
    const target = resolve(dirname(file), clean);
    try {
      await stat(target);
    } catch {
      errors.push(`${file}: missing ${reference}`);
    }
  }
}

for (const file of files.filter(path => extname(path) === ".json")) {
  try {
    JSON.parse(await readFile(file, "utf8"));
  } catch {
    errors.push(`${file}: invalid JSON`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Static website verified: ${files.length} files.`);
}
