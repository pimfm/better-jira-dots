#!/usr/bin/env node
// Generate PNG icons for the extension. Pure-Node, no dependencies.
//
// Design: three dots (grey, yellow, red) on a dark rounded-square background,
// echoing the Jira aging-indicator UI the extension targets.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { Buffer } from "node:buffer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "icons");

const SIZES = [16, 32, 48, 128];

const COLORS = {
  bg: [29, 33, 37, 255],       // #1d2125 — Atlassian dark surface
  grey: [193, 199, 208, 255],  // #c1c7d0
  yellow: [245, 205, 71, 255], // #f5cd47
  red: [227, 73, 53, 255],     // #e34935
  transparent: [0, 0, 0, 0],
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

await mkdir(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const pixels = renderIcon(size);
  const png = encodePng(size, size, pixels);
  const out = join(OUT_DIR, `icon-${size}.png`);
  await writeFile(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}

function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cornerRadius = size * 0.22;
  const dotRadius = size * 0.11;
  const dotY = size * 0.5;
  const dotXs = [size * 0.25, size * 0.5, size * 0.75];
  const dotColors = [COLORS.grey, COLORS.yellow, COLORS.red];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = COLORS.transparent;
      if (insideRoundedRect(x + 0.5, y + 0.5, size, size, cornerRadius)) {
        color = COLORS.bg;
      }
      // Anti-aliased dots: distance check with a 1px feather.
      for (let i = 0; i < dotXs.length; i++) {
        const dx = x + 0.5 - dotXs[i];
        const dy = y + 0.5 - dotY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= dotRadius - 0.5) {
          color = dotColors[i];
          break;
        } else if (dist < dotRadius + 0.5) {
          const t = clamp(dotRadius + 0.5 - dist, 0, 1);
          color = blend(color, dotColors[i], t);
          break;
        }
      }
      const idx = (y * size + x) * 4;
      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = color[3];
    }
  }
  return pixels;
}

function insideRoundedRect(px, py, w, h, r) {
  if (px < r) {
    if (py < r) return distance(px, py, r, r) <= r;
    if (py > h - r) return distance(px, py, r, h - r) <= r;
  } else if (px > w - r) {
    if (py < r) return distance(px, py, w - r, r) <= r;
    if (py > h - r) return distance(px, py, w - r, h - r) <= r;
  }
  return px >= 0 && px <= w && py >= 0 && py <= h;
}

function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function blend(bg, fg, t) {
  const a = fg[3] * t / 255;
  const ba = bg[3] / 255;
  const outA = a + ba * (1 - a);
  if (outA === 0) return [0, 0, 0, 0];
  const r = (fg[0] * a + bg[0] * ba * (1 - a)) / outA;
  const g = (fg[1] * a + bg[1] * ba * (1 - a)) / outA;
  const b = (fg[2] * a + bg[2] * ba * (1 - a)) / outA;
  return [Math.round(r), Math.round(g), Math.round(b), Math.round(outA * 255)];
}

// Minimal PNG encoder for 8-bit RGBA. No filtering.
function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;        // bit depth
  ihdr[9] = 6;        // color type: RGBA
  ihdr[10] = 0;       // compression
  ihdr[11] = 0;       // filter
  ihdr[12] = 0;       // interlace

  // Build raw image stream with one filter byte (0 = None) per scanline.
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.subarray(y * stride, (y + 1) * stride).forEach((byte, i) => {
      raw[y * (stride + 1) + 1 + i] = byte;
    });
  }

  const idat = deflateSync(raw, { level: 9 });
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", iend),
  ]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
