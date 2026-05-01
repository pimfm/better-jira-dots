#!/usr/bin/env node
// Builds store-ready zip artefacts for Chrome and Firefox.
// No third-party dependencies — uses node:zlib for deflate.

import { readFile, writeFile, mkdir, stat, readdir } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import { Buffer } from "node:buffer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const INCLUDE = [
  "manifest.json",
  "LICENSE",
  "README.md",
  "PRIVACY.md",
  "icons",
  "src",
  "styles",
  "_locales",
];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

await mkdir(DIST, { recursive: true });

const manifestRaw = await readFile(join(ROOT, "manifest.json"), "utf8");
const manifest = JSON.parse(manifestRaw);
verifyManifest(manifest);

const chromeManifest = stripFirefoxFields(structuredClone(manifest));
const firefoxManifest = manifest;

await build("chrome", chromeManifest);
await build("firefox", firefoxManifest);

async function build(target, manifestForTarget) {
  const entries = await collectEntries();
  // Replace manifest.json with the target-specific one.
  const targetManifestBytes = Buffer.from(JSON.stringify(manifestForTarget, null, 2) + "\n", "utf8");
  const replaced = entries.map((e) =>
    e.archivePath === "manifest.json" ? { ...e, data: targetManifestBytes } : e
  );

  const zipPath = join(DIST, `better-jira-dots-${target}.zip`);
  const zipBytes = encodeZip(replaced);
  await writeFile(zipPath, zipBytes);
  console.log(`built ${target}: ${zipPath} (${zipBytes.length} bytes, ${replaced.length} entries)`);
}

async function collectEntries() {
  const entries = [];
  for (const item of INCLUDE) {
    const full = join(ROOT, item);
    let info;
    try { info = await stat(full); } catch { continue; }
    if (info.isDirectory()) {
      await walk(full, entries);
    } else if (info.isFile()) {
      entries.push(await readEntry(full));
    }
  }
  // Sort for reproducible builds.
  entries.sort((a, b) => a.archivePath.localeCompare(b.archivePath));
  return entries;
}

async function walk(dir, out) {
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith(".")) continue;
    const full = join(dir, item.name);
    if (item.isDirectory()) {
      await walk(full, out);
    } else if (item.isFile()) {
      out.push(await readEntry(full));
    }
  }
}

async function readEntry(fullPath) {
  const data = await readFile(fullPath);
  const archivePath = relative(ROOT, fullPath).split(sep).join("/");
  return { archivePath, data };
}

function verifyManifest(m) {
  if (m.manifest_version !== 3) throw new Error("manifest_version must be 3");
  if (!m.name || !m.version) throw new Error("manifest must have name and version");
  if (!m.icons || !m.icons["128"]) throw new Error("manifest must declare a 128px icon");
}

function stripFirefoxFields(m) {
  delete m.browser_specific_settings;
  return m;
}

// ZIP encoder (store + deflate). Implements the subset of PKZIP used by browsers.
function encodeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.archivePath, "utf8");
    const crc = crc32(entry.data) >>> 0;
    const uncompressedSize = entry.data.length;
    let compressed = deflateRawSync(entry.data, { level: 9 });
    let method = 8; // deflate
    if (compressed.length >= uncompressedSize) {
      compressed = entry.data;
      method = 0; // stored
    }
    const compressedSize = compressed.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);            // version needed
    local.writeUInt16LE(0x0800, 6);        // bit flag: utf-8 filename
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);            // mod time
    local.writeUInt16LE(0x21, 12);         // mod date (2026-01-01-ish; reproducible)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressedSize, 18);
    local.writeUInt32LE(uncompressedSize, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);            // extra field length
    localParts.push(local, nameBuf, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);          // version made by
    central.writeUInt16LE(20, 6);          // version needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressedSize, 20);
    central.writeUInt32LE(uncompressedSize, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);          // extra field length
    central.writeUInt16LE(0, 32);          // file comment length
    central.writeUInt16LE(0, 34);          // disk number start
    central.writeUInt16LE(0, 36);          // internal attrs
    central.writeUInt32LE(0, 38);          // external attrs
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuf);

    offset += 30 + nameBuf.length + compressedSize;
  }

  const localBytes = Buffer.concat(localParts);
  const centralBytes = Buffer.concat(centralParts);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);                // disk number
  eocd.writeUInt16LE(0, 6);                // disk with central dir
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBytes.length, 12);
  eocd.writeUInt32LE(localBytes.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localBytes, centralBytes, eocd]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
