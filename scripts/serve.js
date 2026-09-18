import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

/**
 * Liefert Projektdateien für lokale Vorschau und Browsertests.
 * @param {http.IncomingMessage} request HTTP-Anfrage.
 * @param {http.ServerResponse} response HTTP-Antwort.
 * @returns {Promise<void>} Abschluss der Dateiauslieferung.
 */
async function serve(request, response) {
  try {
    let pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (pathname === "/") {
      pathname = "/index.html";
    }
    const file = path.resolve(root, "." + pathname);
    const relative = path.relative(root, file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(file);
    let type = types[path.extname(file)];
    if (!type) {
      type = "application/octet-stream";
    }
    response
      .writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" })
      .end(content);
  } catch {
    response.writeHead(404).end();
  }
}

http.createServer(serve).listen(4173, "127.0.0.1");
