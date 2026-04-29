import { CanvasTexture } from "three";

const W = 512;
const H = 700;
const PAD = 44;

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

function fitFontSize(ctx, text, maxWidth, maxSize) {
  let size = maxSize;
  while (size > 22) {
    ctx.font = `400 ${size}px 'Instrument Serif', Georgia, serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

export async function createCardTexture(product) {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const isDark = product.isDark;
  const ink = isDark ? "#f2efe8" : "#0a0a0a";
  const inkDim = isDark ? "rgba(242,239,232,0.5)" : "rgba(10,10,10,0.5)";
  const inkFaint = isDark ? "rgba(242,239,232,0.25)" : "rgba(10,10,10,0.22)";
  const borderColor = isDark ? "rgba(242,239,232,0.12)" : "rgba(10,10,10,0.12)";
  const mono = "'JetBrains Mono', 'Courier New', monospace";
  const serif = "'Instrument Serif', Georgia, serif";
  const sans = "'Inter', system-ui, sans-serif";

  // --- Background ---
  if (product.gradient) {
    const grad = ctx.createLinearGradient(0, 0, W * 0.8, H);
    product.gradient.forEach(([stop, color]) => grad.addColorStop(stop, color));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = product.bg;
  }
  ctx.fillRect(0, 0, W, H);

  // --- PerformOS concentric circle icon ---
  const ix = PAD + 16, iy = PAD + 16;
  ctx.beginPath();
  ctx.arc(ix, iy, 18, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? "rgba(242,239,232,0.12)" : "#0a0a0a";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix, iy, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#d4ff3b";
  ctx.fill();

  // --- Product number overline ---
  ctx.font = `400 10px ${mono}`;
  ctx.fillStyle = inkFaint;
  ctx.fillText(product.number.toUpperCase(), PAD, PAD + 70);

  // --- Product name (one or two lines) ---
  const nameMaxW = W - PAD * 2;
  const words = product.name.split(" ");
  let nameEndY;

  if (words.length === 1) {
    const sz = fitFontSize(ctx, product.name, nameMaxW, 68);
    ctx.font = `400 ${sz}px ${serif}`;
    ctx.fillStyle = ink;
    ctx.fillText(product.name, PAD, PAD + 160);
    nameEndY = PAD + 160 + sz * 0.25;
  } else {
    const sz1 = fitFontSize(ctx, words[0], nameMaxW, 68);
    ctx.font = `400 ${sz1}px ${serif}`;
    ctx.fillStyle = ink;
    ctx.fillText(words[0], PAD, PAD + 145);

    const remaining = words.slice(1).join(" ");
    const sz2 = fitFontSize(ctx, remaining, nameMaxW, 60);
    ctx.font = `400 ${sz2}px ${serif}`;
    ctx.fillStyle = isDark ? "rgba(242,239,232,0.75)" : "rgba(10,10,10,0.7)";
    ctx.fillText(remaining, PAD, PAD + 145 + sz1 * 1.08);
    nameEndY = PAD + 145 + sz1 * 1.08 + sz2 * 0.25;
  }

  // --- Tagline ---
  const tagY = Math.max(nameEndY + 36, PAD + 295);
  ctx.font = `600 15px ${sans}`;
  ctx.fillStyle = ink;
  const afterTag = wrapText(ctx, product.tagline, PAD, tagY, nameMaxW, 22);

  // --- Description ---
  ctx.font = `400 13px ${sans}`;
  ctx.fillStyle = inkDim;
  wrapText(ctx, product.description, PAD, afterTag + 14, nameMaxW, 20);

  // --- Divider ---
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - 128);
  ctx.lineTo(W - PAD, H - 128);
  ctx.stroke();

  // --- Status chip ---
  const isLive = product.status === "Shipping";
  const chipY = H - 100;
  const chipW = isLive ? 105 : 85;

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundRect(ctx, PAD, chipY, chipW, 26, 13);
  ctx.stroke();

  if (isLive) {
    ctx.beginPath();
    ctx.arc(PAD + 16, chipY + 13, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#d4ff3b";
    ctx.fill();
    ctx.shadowColor = "rgba(212,255,59,0.6)";
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.font = `400 10px ${mono}`;
  ctx.fillStyle = inkDim;
  ctx.fillText(product.status.toUpperCase(), PAD + (isLive ? 28 : 14), chipY + 17);

  // --- URL ---
  ctx.font = `400 10px ${mono}`;
  ctx.fillStyle = inkFaint;
  ctx.fillText(product.url, PAD, H - 44);

  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
