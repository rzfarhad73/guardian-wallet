#!/usr/bin/env node
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "extension", "icons");
const ICON_COLOR = "#0d9e7e";
mkdirSync(OUT_DIR, { recursive: true });

function drawShield(ctx, size) {
  const s = size;
  ctx.clearRect(0, 0, s, s);

  // Background circle
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  ctx.fillStyle = ICON_COLOR;
  ctx.fill();

  // Shield path (scaled 0-24 SVG coords → 0-size)
  const scale = s / 24;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.beginPath();
  // M12 2L4 5v6c0 5.55 3.84 10.74 8 11.93C16.16 21.74 20 16.55 20 11V5L12 2z
  ctx.moveTo(12, 3);
  ctx.lineTo(5, 5.5);
  ctx.lineTo(5, 11);
  ctx.bezierCurveTo(5, 16.55, 8.5, 20.8, 12, 21.93);
  ctx.bezierCurveTo(15.5, 20.8, 19, 16.55, 19, 11);
  ctx.lineTo(19, 5.5);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();

  // Checkmark at medium/large sizes
  if (size >= 48) {
    ctx.beginPath();
    ctx.moveTo(8.5, 12);
    ctx.lineTo(11, 14.5);
    ctx.lineTo(15.5, 9.5);
    ctx.strokeStyle = ICON_COLOR;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  ctx.restore();
}

for (const size of [16, 48, 128]) {
  const canvas = createCanvas(size, size);
  drawShield(canvas.getContext("2d"), size);
  const buf = canvas.toBuffer("image/png");
  const out = path.join(OUT_DIR, `icon${size}.png`);
  try {
    writeFileSync(out, buf);
    console.log(`✓ ${out}`);
  } catch (err) {
    console.error(`Failed to write ${out}:`, err.message);
    process.exitCode = 1;
  }
}

console.log("Icons generated.");
