#!/usr/bin/env node
/**
 * scrollcraft static server.
 *
 * A scrollcraft page cannot be verified from file://. The engine fetches each
 * clip as a Blob, and file:// fetches are blocked by CORS in every browser, so
 * the page silently falls back to posters and looks fine while proving nothing.
 * Serve it.
 *
 *   node serve.mjs --root builds/perkform --port 4500
 *   node serve.mjs --root builds/perkform --port 4500 --lan   # real-phone test
 *
 * Binds to 127.0.0.1 by default, so nothing else on the network can read the
 * folder. --lan binds every interface for testing on a phone over Wi-Fi, and
 * makes everything under the root readable by anyone on that network while it
 * runs.
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);

const ROOT = path.resolve(arg("--root", "."));
const PORT = parseInt(arg("--port", "4500"), 10);
const LAN = has("--lan");
const HOST = arg("--host", LAN ? "0.0.0.0" : "127.0.0.1");
const CORS = has("--cors");
// With the separator, a root of builds/acme can't also serve builds/acme-v2.
const BASE = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".mp4": "video/mp4", ".webm": "video/webm",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  // A malformed escape (e.g. /%E0%A4%A) makes decodeURIComponent throw, which
  // would otherwise take the whole server down.
  let url;
  try { url = decodeURIComponent((req.url || "/").split("?")[0]); }
  catch { res.writeHead(400).end("bad request"); return; }

  // Block hidden dotfiles/dotdirs (e.g. /.env, /.git/config).
  const segments = url.split(/[\\/]+/).filter(Boolean);
  if (segments.some((s) => s.startsWith("."))) {
    res.writeHead(403).end("forbidden");
    return;
  }

  let file = path.join(ROOT, url === "/" ? "/index.html" : url);

  // Refuse to serve outside the root even if the path walks up.
  if (file !== ROOT && !file.startsWith(BASE)) { res.writeHead(403).end("forbidden"); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404).end("not found"); return; }

  const ext = path.extname(file).toLowerCase();
  const stat = fs.statSync(file);
  const baseHeaders = {
    "Content-Type": TYPES[ext] || "application/octet-stream",
    // No caching: verification loops re-shoot the same URLs after edits, and a
    // cached clip or stylesheet makes you screenshot the previous build.
    "Cache-Control": "no-store",
    "Accept-Ranges": "bytes",
  };
  if (CORS) baseHeaders["Access-Control-Allow-Origin"] = "*";

  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m) {
      let start = m[1] === "" ? 0 : parseInt(m[1], 10);
      let end = m[2] === "" ? stat.size - 1 : parseInt(m[2], 10);
      if (m[1] === "" && m[2] !== "") {
        start = Math.max(stat.size - end, 0);
        end = stat.size - 1;
      }
      if (start >= stat.size || end < start) {
        res.writeHead(416, { ...baseHeaders, "Content-Range": `bytes */${stat.size}` }).end();
        return;
      }
      end = Math.min(end, stat.size - 1);
      res.writeHead(206, {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Content-Length": end - start + 1,
      });
      if (req.method === "HEAD") { res.end(); return; }
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
  }

  res.writeHead(200, { ...baseHeaders, "Content-Length": stat.size });
  if (req.method === "HEAD") { res.end(); return; }
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  const addr = server.address();
  const actualPort = typeof addr === "object" && addr ? addr.port : PORT;
  console.log(`scrollcraft: ${ROOT}\n  http://localhost:${actualPort}`);
  if (!LAN) return;
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === "IPv4" && !a.internal) console.log(`  http://${a.address}:${actualPort}  (LAN)`);
    }
  }
  console.log("  --lan: everything under the root is readable by anyone on this network until you stop the server.");
});

const shutdown = () => { server.close(() => process.exit(0)); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
