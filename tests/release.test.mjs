// Release hygiene & multi-agent manifest integrity checks (upstream plugin layout).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = path.join(REPO, "plugins", "nateherk-design");
const SKILL = path.join(PLUGIN, "skills", "scroll-craft");
const read = (abs) => fs.readFileSync(abs, "utf8");
const readJson = (abs) => JSON.parse(read(abs));

const marketplace = readJson(path.join(REPO, ".claude-plugin", "marketplace.json"));
const claude = readJson(path.join(PLUGIN, ".claude-plugin", "plugin.json"));
const agy = readJson(path.join(PLUGIN, ".antigravity-plugin", "plugin.json"));
const geminiExt = readJson(path.join(PLUGIN, "gemini-extension.json"));
const pkg = readJson(path.join(REPO, "package.json"));

test("all plugin manifests share one semantic version and name", () => {
  assert.match(claude.version, /^\d+\.\d+\.\d+$/);
  for (const [label, m] of [
    [".antigravity-plugin/plugin.json", agy],
    ["gemini-extension.json", geminiExt],
  ]) {
    assert.equal(m.name, claude.name, `${label} name`);
    assert.equal(m.version, claude.version, `${label} version`);
  }
  assert.equal(pkg.version, claude.version, "root package.json version");
});

test("root Claude marketplace points cleanly at ./plugins/nateherk-design", () => {
  const entry = marketplace.plugins.find((p) => p.name === claude.name);
  assert.ok(entry, ".claude-plugin/marketplace.json lists nateherk-design");
  assert.equal(entry.source, "./plugins/nateherk-design");
  assert.equal(entry.version, claude.version);
});

test("Antigravity and Gemini CLI extension paths resolve to real files inside the plugin", () => {
  assert.ok(fs.existsSync(path.join(PLUGIN, agy.logo)), `Antigravity logo: ${agy.logo}`);
  assert.ok(
    fs.existsSync(path.join(PLUGIN, geminiExt.contextFileName)),
    `Gemini contextFileName: ${geminiExt.contextFileName}`
  );
  assert.ok(fs.existsSync(path.join(SKILL, "SKILL.md")));
});

test("plugin icon is a valid 512x512 PNG", () => {
  const buf = fs.readFileSync(path.join(PLUGIN, agy.logo));
  assert.deepEqual(buf.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(buf.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(buf.readUInt32BE(16), 512);
  assert.equal(buf.readUInt32BE(20), 512);
});

test("SKILL.md is strictly under Antigravity's 24,000-byte cap, has concise description, and all links exist", () => {
  const skillPath = path.join(SKILL, "SKILL.md");
  const bytes = fs.statSync(skillPath).size;
  assert.ok(bytes < 24000, `SKILL.md is ${bytes} bytes; must stay strictly below 24,000 bytes`);

  const text = read(skillPath);
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fm, "SKILL.md must start with YAML frontmatter");
  assert.match(fm[1], /^name:\s*scroll-craft$/m);
  assert.doesNotMatch(fm[1], /^allowed-tools:/m, "SKILL.md must not hardcode Claude-only allowed-tools");

  const desc = fm[1].replace(/^name:.*$/m, "").replace(/^description:\s*>?/m, "").replace(/\s+/g, " ").trim();
  assert.ok(desc.length >= 60 && desc.length <= 1024, `Frontmatter description length (${desc.length}) should stay concise (60..1024 chars)`);

  assert.doesNotMatch(text, /bash\s+<skill>\/scripts\/encode\.sh/, "SKILL.md must use cross-platform node encode.mjs");

  for (const [, ref] of text.matchAll(/\]\((references\/[\w.-]+\.(?:md|html))/g)) {
    assert.ok(fs.existsSync(path.join(SKILL, ref)), `Missing reference linked by SKILL.md: ${ref}`);
  }
  for (const [, script] of text.matchAll(/scripts\/([\w.-]+\.mjs)/g)) {
    assert.ok(fs.existsSync(path.join(SKILL, "scripts", script)), `Missing script linked by SKILL.md: ${script}`);
  }
});

test("repository contains zero unredacted local user paths, personal Gmail, or live Squarespace preview subdomains", () => {
  const textExts = new Set([".md", ".txt", ".json", ".mjs", ".js", ".css", ".html", ".sh", ".example"]);
  const allowedSqs = new Set(["static1", "login", "your-site", "example"]);
  const violations = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === ".git" || ent.name === "node_modules" || ent.name === "lab") continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (textExts.has(path.extname(ent.name).toLowerCase())) {
        const content = read(full);
        if (/[A-Za-z]:\\Users\\[^\\<%\s"']+/i.test(content) || /\/Users\/[^/<%\s"']+/i.test(content)) {
          violations.push(path.relative(REPO, full));
        }
        if (/@gmail\.com\b/i.test(content)) {
          violations.push(`${path.relative(REPO, full)} (gmail)`);
        }
        for (const [, sub] of content.matchAll(/\b([a-z0-9-]+)\.squarespace\.com\b/gi)) {
          if (!allowedSqs.has(sub.toLowerCase())) {
            violations.push(`${path.relative(REPO, full)} (${sub}.squarespace.com)`);
          }
        }
      }
    }
  }
  walk(REPO);
  assert.deepEqual(violations, [], `Found privacy/leak violations: ${violations.join(", ")}`);
});
