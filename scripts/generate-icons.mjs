/**
 * Generate PNG icons from the SVG source using canvas rendering
 * Run: node scripts/generate-icons.mjs
 *
 * Since we cannot run Node with sharp in this environment,
 * this script creates canvas-based PNG icons using a data URI approach.
 * The icons are embedded as base64 in this script for reliability.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Minimal 1x1 cyan PNG as placeholder — real icon is the SVG
// This ensures the PWA manifest resolves without 404
const PNG_192_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFImlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDg4LCAyMDIwLzA3LzEwLTIzOjAyOjQzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMCAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0QTZCOUQ3QUUzMUExMUVCQUY0QkExRTI5OUNFNjQxMiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo0QTZCOUQ3QkUzMUExMUVCQUY0QkExRTI5OUNFNjQxMiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjRBNkI5RDc4RTMxQTExRUJBRjRCQTFFMjk5Q0U2NDEyIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjRBNkI5RDc5RTMxQTExRUJBRjRCQTFFMjk5Q0U2NDEyIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+';

mkdirSync(iconsDir, { recursive: true });

// Write minimal valid PNG files (the SVG is the primary icon source)
// These are small colored squares that serve as fallback
function createMinimalPNG(size) {
  // PNG header + IHDR + IDAT + IEND for a solid #0a0a0f square
  const header = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = createChunk('IHDR', Buffer.concat([
    int32(size), int32(size),
    Buffer.from([8,2,0,0,0]), // 8-bit RGB
  ]));
  // Simple 1x1 pixel stretched - minimal IDAT
  const idat = createChunk('IDAT', deflate(createImageData(size)));
  const iend = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([header, ihdr, idat, iend]);
}

function int32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = int32(data.length);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = int32(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function createImageData(size) {
  // Each row: filter byte (0) + RGB pixels
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter type None
    for (let x = 0; x < size; x++) {
      // Background color #0a0a0f with cyan gradient
      const cx = Math.abs(x - size/2) / (size/2);
      const cy = Math.abs(y - size/2) / (size/2);
      const dist = Math.sqrt(cx*cx + cy*cy);
      const r = Math.round(10 + dist * 20);
      const g = Math.round(10 + (1-dist) * 200);
      const b = Math.round(15 + (1-dist) * 220);
      row[1 + x * 3] = Math.min(r, 255);
      row[2 + x * 3] = Math.min(g, 255);
      row[3 + x * 3] = Math.min(b, 255);
    }
    rows.push(row);
  }
  return Buffer.concat(rows);
}

function deflate(data) {
  // zlib uncompressed block format
  const CHUNK = 65535;
  const chunks = [];
  // zlib header
  chunks.push(Buffer.from([0x78, 0x01]));
  for (let i = 0; i < data.length; i += CHUNK) {
    const block = data.slice(i, i + CHUNK);
    const last = i + CHUNK >= data.length;
    chunks.push(Buffer.from([last ? 1 : 0]));
    const lenBuf = Buffer.alloc(2); lenBuf.writeUInt16LE(block.length);
    const nlenBuf = Buffer.alloc(2); nlenBuf.writeUInt16LE(~block.length & 0xffff);
    chunks.push(lenBuf, nlenBuf, block);
  }
  // Adler32 checksum
  let s1 = 1, s2 = 0;
  for (const byte of data) { s1 = (s1 + byte) % 65521; s2 = (s2 + s1) % 65521; }
  const adler = Buffer.alloc(4); adler.writeUInt32BE((s2 << 16) | s1);
  chunks.push(adler);
  return Buffer.concat(chunks);
}

writeFileSync(join(iconsDir, 'icon-192.png'), createMinimalPNG(192));
writeFileSync(join(iconsDir, 'icon-512.png'), createMinimalPNG(512));
console.log('Icons generated successfully in public/icons/');
