// Plotted Silence — Plate No. 001
// Cadastral aesthetic: surveyor's ink on warm paper, one gold parcel.
// Generates design/xox-plate.png (2000 x 2828, ~ISO portrait ratio)
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

/* ---------- fonts ---------- */
const F = path.join(__dirname, "..", ".freebuff", "fonts");
GlobalFonts.registerFromPath(path.join(F, "IBMPlexMono-Regular.ttf"), "PlexMono");
GlobalFonts.registerFromPath(path.join(F, "IBMPlexMono-SemiBold.ttf"), "PlexMonoSb");
GlobalFonts.registerFromPath(path.join(F, "Italiana-Regular.ttf"), "Italiana");
GlobalFonts.registerFromPath(path.join(F, "Cairo-Variable.ttf"), "Cairo");

/* ---------- palette ---------- */
const PAPER = "#F3EEE3";
const INK = "#16324F";
const GOLD = "#C9A227";

const W = 2000, H = 2828;
const M = 120; // outer margin

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

/* ---------- helpers ---------- */
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function line(x1, y1, x2, y2, w = 1.6, color = INK, dash = []) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}
function cross(x, y, s = 9, w = 1.4, color = INK) {
  line(x - s, y, x + s, y, w, color);
  line(x, y - s, x, y + s, w, color);
}
// tracked (letterspaced) text — manual so spacing is exact
function tracked(text, x, y, font, size, spacing, color, align = "center", alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${size}px ${font}`;
  ctx.textBaseline = "alphabetic";
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.restore();
  return total;
}
function mono(text, x, y, size, color = INK, align = "left", alpha = 1, bold = false) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${bold ? "600 " : ""}${size}px PlexMono${bold ? "Sb" : ""}`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}
function hatch(x, y, w, h, gap = 14, lw = 1.2, alpha = 0.5) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = INK; ctx.lineWidth = lw;
  ctx.beginPath();
  for (let d = -h; d < w + h; d += gap) {
    ctx.moveTo(x + d, y + h);
    ctx.lineTo(x + d + h, y);
  }
  ctx.stroke();
  ctx.restore();
}
function wash(x, y, w, h, alpha = 0.08) {
  ctx.save();
  ctx.globalAlpha = alpha; ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/* ---------- paper ---------- */
ctx.fillStyle = PAPER;
ctx.fillRect(0, 0, W, H);
// two whisper-faint age stains (2% ink) — material, not decoration
for (const [sx, sy, sr, a] of [[1650, 420, 420, 0.020], [300, 2500, 520, 0.016]]) {
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
  g.addColorStop(0, `rgba(22,50,79,${a})`);
  g.addColorStop(1, "rgba(22,50,79,0)");
  ctx.fillStyle = g; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
}

/* ---------- frame: double hairline + graticule ticks ---------- */
line(M, M, W - M, M, 2.4); line(M, H - M, W - M, H - M, 2.4);
line(M, M, M, H - M, 2.4); line(W - M, M, W - M, H - M, 2.4);
const M2 = M + 14;
line(M2, M2, W - M2, M2, 0.8, INK, []); line(M2, H - M2, W - M2, H - M2, 0.8);
line(M2, M2, M2, H - M2, 0.8); line(W - M2, M2, W - M2, H - M2, 0.8);
// corner registration crosses
for (const [cx, cy] of [[M2, M2], [W - M2, M2], [M2, H - M2], [W - M2, H - M2]]) cross(cx, cy, 13, 1.2);
// graticule ticks + lon/lat micro numbers on inner frame
for (let x = M2 + 200; x < W - M2; x += 200) {
  line(x, M2 - 0, x, M2 + 12, 1);
  line(x, H - M2 - 12, x, H - M2, 1);
  const lon = (31.30 + (x - M2) / (W - 2 * M2) * 0.40).toFixed(2);
  mono(`${lon}° E`, x, M2 + 30, 13, INK, "center", 0.5);
  mono(`${lon}° E`, x, H - M2 - 14, 13, INK, "center", 0.5);
}
for (let y = M2 + 200; y < H - M2; y += 200) {
  line(M2, y, M2 + 12, y, 1);
  line(W - M2 - 12, y, W - M2, y, 1);
  const lat = (30.14 - (y - M2) / (H - 2 * M2) * 0.24).toFixed(2);
  mono(`${lat}° N`, M2 + 18, y + 4, 13, INK, "left", 0.5);
  mono(`${lat}° N`, W - M2 - 18, y + 4, 13, INK, "right", 0.5);
}

/* ---------- title block ---------- */
mono("FIELD ATLAS", W / 2, 208, 17, INK, "center", 0.62) ;
tracked("· PLATE N° 001 ·", W / 2, 236, "PlexMono", 15, 3, INK, "center", 0.5);
tracked("PLOTTED SILENCE", W / 2, 352, "Italiana", 108, 26, INK);
// rule with center diamond
line(W / 2 - 300, 404, W / 2 - 26, 404, 1.2);
line(W / 2 + 26, 404, W / 2 + 300, 404, 1.2);
ctx.save();
ctx.translate(W / 2, 404); ctx.rotate(Math.PI / 4);
ctx.fillStyle = INK; ctx.fillRect(-5, -5, 10, 10);
ctx.restore();
tracked("SURVEY DIVISION — FIELD SERIES", W / 2, 448, "PlexMono", 16, 4, INK, "center", 0.62);

/* ---------- north needle (top-right, inside frame) ---------- */
const nx = W - M2 - 124, ny = 566;
ctx.save();
ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
ctx.beginPath(); ctx.arc(nx, ny, 64, 0, Math.PI * 2); ctx.stroke();
ctx.beginPath(); ctx.arc(nx, ny, 55, 0, Math.PI * 2); ctx.stroke();
ctx.beginPath(); ctx.moveTo(nx, ny + 40); ctx.lineTo(nx, ny - 38); ctx.stroke();
ctx.beginPath(); ctx.moveTo(nx, ny - 50); ctx.lineTo(nx - 11, ny - 22); ctx.lineTo(nx + 11, ny - 22); ctx.closePath();
ctx.fillStyle = GOLD; ctx.fill();
ctx.restore();
tracked("N", nx, ny + 10, "Italiana", 38, 0, INK);

/* ---------- scale note (top-left) ---------- */
mono("SCALE  1 : 2 000", M2 + 44, 556, 17, INK, "left", 0.75, true);
mono("CONTOUR INTERVAL  0.5 M", M2 + 44, 584, 14, INK, "left", 0.5);
mono("DATUM  WGS 84 / UTM 36N", M2 + 44, 606, 14, INK, "left", 0.5);

/* ================= THE SUBDIVISION ================= */
// estate bounds
const EX = 240, EY = 700, EW = 1520, EH = 1330;
// outer boundary heavy
ctx.save();
ctx.strokeStyle = INK; ctx.lineWidth = 3.2;
ctx.strokeRect(EX, EY, EW, EH);
ctx.restore();

// corridors (roads)
const RVX = 1090, RVW = 120;   // vertical road x-range
const RHY = 1530, RHH = 110;   // horizontal road y-range

// parcels: [x, y, w, h, number, kind]  kind: plain|wash|hatch|gold
const parcels = [
  // left-top block (west of vertical road, north of horizontal road)
  [240,  700, 300, 360, "01", "plain"],
  [540,  700, 250, 360, "02", "wash" ],
  [790,  700, 300, 360, "03", "plain"],
  [240, 1060, 220, 470, "04", "plain"],
  [460, 1060, 300, 250, "05", "hatch"],
  [460, 1310, 300, 220, "06", "plain"],
  [760, 1060, 330, 470, "07", "gold" ],
  // right-top block (east of vertical road)
  [1210,  700, 250, 380, "08", "wash" ],
  [1460,  700, 300, 380, "09", "plain"],
  [1210, 1080, 250, 450, "10", "plain"],
  [1460, 1080, 300, 450, "11", "hatch"],
  // bottom strip (south of horizontal road)
  [240, 1640, 420, 390, "12", "plain"],
  [660, 1640, 430, 390, "13", "wash" ],
  [1210, 1530, 550, 500, "14", "plain"],
];

for (const [x, y, w, h, n, kind] of parcels) {
  if (kind === "wash") wash(x, y, w, h, 0.07);
  if (kind === "hatch") hatch(x, y, w, h);
  if (kind === "gold") {
    ctx.save();
    ctx.globalAlpha = 0.9; ctx.fillStyle = GOLD;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
  // plot number + area annotation
  const cx = x + w / 2, cy = y + h / 2;
  if (kind === "gold") {
    mono(n, cx, cy - 2, 46, "#4A3B0A", "center", 1, true);
    mono("PLOT — HELD", cx, cy + 34, 15, "#4A3B0A", "center", 0.9);
  } else {
    mono(n, cx, cy - 2, 30, INK, "center", 0.85, true);
    const area = Math.round((w * h) / 6.2 / 10) * 10;
    mono(`${area} M²`, cx, cy + 26, 13, INK, "center", 0.45);
  }
}

// roads: centerline dashes + labels — الطريق الرأسي بيمدد لكامل حدود الأرض (عبر الطريق الأفقي)
line(RVX + RVW / 2, EY, RVX + RVW / 2, EY + EH, 1, INK, [18, 14]);
line(EX, RHY + RHH / 2, RVX, RHY + RHH / 2, 1, INK, [18, 14]);
line(RVX + RVW, RHY + RHH / 2, EX + EW, RHY + RHH / 2, 1, INK, [18, 14]);
ctx.save();
ctx.font = "15px PlexMono";
ctx.fillStyle = INK; ctx.globalAlpha = 0.55;
ctx.textAlign = "center";
// ROAD A — نص رأسي جوه الطريق الرأسي (النص أعرض منه فلازم يدور) — في نص القطاع العلوي
ctx.save();
ctx.translate(RVX + RVW / 2 + 8, 1115);
ctx.rotate(-Math.PI / 2);
ctx.fillText("ROAD  A — 20 M", 0, 0);
ctx.restore();
// ROAD B — جوه ممر الطريق الأفقي نفسه
ctx.fillText("ROAD  B — 20 M", 880, RHY + RHH / 2 + 5);
ctx.restore();
// road edges — الطريق الرأسي كامل الارتفاع
line(RVX, EY, RVX, EY + EH, 1.2); line(RVX + RVW, EY, RVX + RVW, EY + EH, 1.2);
line(EX, RHY, RVX, RHY, 1.2); line(EX, RHY + RHH, RVX, RHY + RHH, 1.2);
line(RVX + RVW, RHY, EX + EW, RHY, 1.2); line(RVX + RVW, RHY + RHH, EX + EW, RHY + RHH, 1.2);

// one dashed easement crossing exactly two parcels (05 → 06) — عند x=735 بعيد عن أرقام القطع
line(735, 1060, 735, 1530, 1.6, INK, [10, 10]);
// وسم الـ easement رأسي حاعك الخط — عرف المساح مش عرضي يعدي على الرقم
ctx.save();
ctx.font = "13px PlexMono";
ctx.fillStyle = INK; ctx.globalAlpha = 0.55;
ctx.textAlign = "center";
ctx.translate(735 + 12, 1300);
ctx.rotate(-Math.PI / 2);
ctx.fillText("EASEMENT 3 M", 0, 0);
ctx.restore();

// registration crosses at estate corners + road intersection
for (const [cx, cy] of [[EX, EY], [EX + EW, EY], [EX, EY + EH], [EX + EW, EY + EH], [RVX + RVW / 2, RHY + RHH / 2]]) cross(cx, cy, 14, 1.3);

// graticule crosses inside estate (sparse lattice)
for (let gx = EX + 220; gx < EX + EW; gx += 440)
  for (let gy = EY + 220; gy < EY + EH; gy += 380) {
    if (gx > RVX - 30 && gx < RVX + RVW + 30) continue;
    if (gy > RHY - 30 && gy < RHY + RHH + 30) continue;
    cross(gx, gy, 6, 0.9, INK);
  }

/* ---------- survey stations (left margin chain) ---------- */
const stations = [
  ["ST.01", "MAADI",        "29.960° N  31.256° E"],
  ["ST.02", "NEW CAIRO",    "30.022° N  31.468° E"],
  ["ST.03", "SHEIKH ZAYED", "30.025° N  30.975° E"],
];
let sy = 2140;
line(M2 + 40, sy - 90, M2 + 40, sy + 240, 0.8, INK, [4, 6]);
for (const [id, name, coord] of stations) {
  ctx.save();
  ctx.beginPath(); ctx.arc(M2 + 40, sy, 7, 0, Math.PI * 2);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.beginPath(); ctx.arc(M2 + 40, sy, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
  mono(`${id}  ${name}`, M2 + 66, sy - 2, 16, INK, "left", 0.85, true);
  mono(coord, M2 + 66, sy + 22, 13.5, INK, "left", 0.5);
  sy += 86;
}

/* ---------- legend (bottom-right above footer) ---------- */
const LX = W - M2 - 620, LY = 2130;
mono("LEGEND", LX, LY - 22, 15, INK, "left", 0.6, true);
line(LX, LY - 8, LX, LY + 118, 0.8, INK, [4, 6]);
// boundary
line(LX + 22, LY + 4, LX + 82, LY + 4, 2.6);
mono("BOUNDARY", LX + 98, LY + 9, 14.5, INK, "left", 0.7);
// easement
line(LX + 22, LY + 42, LX + 82, LY + 42, 1.6, INK, [8, 8]);
mono("EASEMENT", LX + 98, LY + 47, 14.5, INK, "left", 0.7);
// held (hatch swatch)
hatch(LX + 22, LY + 66, 60, 22, 9, 1, 0.55);
ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(LX + 22, LY + 66, 60, 22); ctx.restore();
mono("UNDER OFFER", LX + 98, LY + 82, 14.5, INK, "left", 0.7);
// gold swatch
ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = GOLD; ctx.fillRect(LX + 22, LY + 102, 60, 22); ctx.restore();
ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(LX + 22, LY + 102, 60, 22); ctx.restore();
mono("HELD · 07", LX + 98, LY + 118, 14.5, INK, "left", 0.7);

/* ---------- scale bar (في النص — بعيد عن المحطات شمال والمفتاح يمين) ---------- */
const SBX = 790, SBY = 2244, SEG = 84, SEGN = 5;
for (let i = 0; i < SEGN; i++) {
  const x = SBX + i * SEG;
  ctx.save();
  if (i % 2 === 0) { ctx.fillStyle = INK; ctx.fillRect(x, SBY, SEG, 14); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  ctx.strokeRect(x, SBY, SEG, 14);
  ctx.restore();
}
mono("0", SBX, SBY - 10, 13, INK, "center", 0.6);
mono("100", SBX + 2 * SEG, SBY - 10, 13, INK, "center", 0.6);
mono("200 M", SBX + 4 * SEG, SBY - 10, 13, INK, "center", 0.6);
mono("METRES — GRAPHIC SCALE", SBX + (4 * SEG) / 2, SBY + 40, 13.5, INK, "center", 0.45);

/* ---------- Arabic whisper (Cairo — the site's own typeface) ---------- */
ctx.save();
ctx.font = "30px Cairo";
ctx.fillStyle = INK; ctx.globalAlpha = 0.62;
ctx.textAlign = "right";
ctx.direction = "rtl";
ctx.fillText("وحدات مختارة في كمبوندات القاهرة الجديدة والشيخ زايد والساحل", W - M2 - 40, 2330);
ctx.restore();
mono("ARABIC INSCRIPTION — SITE MOTTO", W - M2 - 40, 2364, 12.5, INK, "right", 0.4);

/* ---------- footer ---------- */
line(M2 + 300, H - M2 - 150, W - M2 - 300, H - M2 - 150, 0.8, INK, [2, 6]);
tracked("DRAWN BY HAND · CHECKED TWICE · ARCHIVED IN SILENCE", W / 2, H - M2 - 104, "PlexMono", 16, 4, INK, "center", 0.62);
// gold seal dot
ctx.save();
ctx.beginPath(); ctx.arc(W / 2, H - M2 - 62, 5, 0, Math.PI * 2);
ctx.fillStyle = GOLD; ctx.fill();
ctx.restore();

/* ---------- export ---------- */
const out = path.join(__dirname, "xox-plate.png");
fs.writeFileSync(out, canvas.toBuffer("image/png"));
console.log("WROTE", out, `${W}x${H}`);
