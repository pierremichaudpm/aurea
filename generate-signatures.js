const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const SIGDIR = path.join(__dirname, 'signatures');
fs.mkdirSync(SIGDIR, { recursive: true });

const GOLD = '#c8a44e';
const NAVY = '#1a2332';

// ── Logo geometry (SVG units, viewBox 44×29) ────────────────────────────────
// Scaled ×3 → 132×87px rendered
const S  = 3;                          // scale factor
const LW = 44 * S;  const LH = 29 * S; // 132 × 87

function logoElements(ox, oy, uid) {
  const r  = 13 * S;
  const cx1 = ox + 15 * S;
  const cx2 = ox + 29 * S;
  const cy  = oy + 14.5 * S;
  const pw  = 3 * S;  // pattern cell size
  return `
  <defs>
    <pattern id="hp${uid}" width="${pw}" height="${pw}" patternUnits="userSpaceOnUse"
             patternTransform="rotate(-45 ${ox} ${oy})">
      <line x1="0" y1="0" x2="0" y2="${pw}" stroke="${GOLD}" stroke-width="${S * 0.95}"/>
    </pattern>
    <mask id="hm${uid}">
      <circle cx="${cx2}" cy="${cy}" r="${r}" fill="white"/>
    </mask>
    <clipPath id="hc${uid}">
      <circle cx="${cx1}" cy="${cy}" r="${r}"/>
    </clipPath>
  </defs>
  <circle cx="${cx1}" cy="${cy}" r="${r}" stroke="${GOLD}" stroke-width="${S * 1.4}" fill="none"/>
  <circle cx="${cx2}" cy="${cy}" r="${r}" stroke="${GOLD}" stroke-width="${S * 1.4}" fill="none"/>
  <g clip-path="url(#hc${uid})">
    <rect x="${ox}" y="${oy}" width="${LW}" height="${LH}"
          fill="url(#hp${uid})" mask="url(#hm${uid})"/>
  </g>`;
}

// ── SVG builders ────────────────────────────────────────────────────────────
const PAD  = 44;   // vertical padding
const PADX = 56;   // horizontal padding
const GAP  = 22;   // gap between logo and text

// 1 & 2 — Logo seul
function svgLogoOnly(bg) {
  const W = LW + PADX * 2;
  const H = LH + PAD  * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg ? `<rect width="${W}" height="${H}" fill="${NAVY}"/>` : ''}
  ${logoElements(PADX, PAD, 'a1')}
</svg>`;
}

// 3 & 4 — Logo + "Auréa RH Conseil"
// Georgia at 46px ≈ 320px wide for "Auréa RH Conseil"
const FNAME  = 46;
const TW     = 328;   // measured text width estimate
const TH     = FNAME; // cap-height approx

function svgLogoText(bg) {
  const CX  = PADX;
  const CY  = PAD;
  // content height = max(LH, TH) → LH dominates at 87px
  const CH  = Math.max(LH, TH);
  const W   = PADX + LW + GAP + TW + PADX;
  const H   = PAD  + CH + PAD;
  const tY  = PAD + (CH + TH * 0.72) / 2;  // baseline
  const tx  = PADX + LW + GAP;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg ? `<rect width="${W}" height="${H}" fill="${NAVY}"/>` : ''}
  ${logoElements(CX, CY + (CH - LH) / 2, 'b1')}
  <text x="${tx}" y="${tY}" xml:space="preserve"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${FNAME}" fill="${GOLD}" letter-spacing="1"><tspan font-weight="400">Auréa </tspan><tspan font-weight="300" opacity="0.65">RH Conseil</tspan></text>
</svg>`;
}

// 5 & 6 — Logo + text + tagline
const TSIZE  = 13;   // tagline font-size
const TGAP   = 14;   // gap between name and tagline

function svgLogoTextTagline(bg) {
  const CX   = PADX;
  const BH   = FNAME + TGAP + TSIZE;  // text block height
  const CH   = Math.max(LH, BH);
  const W    = PADX + LW + GAP + TW + PADX;
  const H    = PAD  + CH + PAD;
  const nameY = PAD + (CH - BH) / 2 + FNAME * 0.78;
  const tagY  = nameY + TGAP + TSIZE;
  const tx    = PADX + LW + GAP;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${bg ? `<rect width="${W}" height="${H}" fill="${NAVY}"/>` : ''}
  ${logoElements(CX, PAD + (CH - LH) / 2, 'c1')}
  <text x="${tx}" y="${nameY}" xml:space="preserve"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${FNAME}" fill="${GOLD}" letter-spacing="1"><tspan font-weight="400">Auréa </tspan><tspan font-weight="300" opacity="0.65">RH Conseil</tspan></text>
  <text x="${tx}" y="${tagY}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="${TSIZE}" fill="${GOLD}" opacity="0.55" letter-spacing="3">MÉDIATION — ENQUÊTE — PRÉVENTION
  </text>
</svg>`;
}

// ── Variants ────────────────────────────────────────────────────────────────
const variants = [
  { name: 'logo-seul-fond-navy',              svg: svgLogoOnly(true)  },
  { name: 'logo-seul-transparent',            svg: svgLogoOnly(false) },
  { name: 'logo-texte-fond-navy',             svg: svgLogoText(true)  },
  { name: 'logo-texte-transparent',           svg: svgLogoText(false) },
  { name: 'logo-texte-tagline-fond-navy',     svg: svgLogoTextTagline(true)  },
  { name: 'logo-texte-tagline-transparent',   svg: svgLogoTextTagline(false) },
];

// ── Generate PNGs ────────────────────────────────────────────────────────────
variants.forEach(({ name, svg }) => {
  const svgPath = path.join(SIGDIR, `${name}.svg`);
  const pngPath = path.join(SIGDIR, `${name}.png`);
  fs.writeFileSync(svgPath, svg, 'utf8');
  // density 144 = 2× retina quality
  execSync(`magick -density 144 -background none "${svgPath}" "${pngPath}"`);
  fs.unlinkSync(svgPath);
  console.log(`✓  ${name}.png`);
});

// ── Update zip ───────────────────────────────────────────────────────────────
execSync(`zip -j "${path.join(SIGDIR, 'aurea-logos.zip')}" "${SIGDIR}"/*.png`);
console.log('\nDone → signatures/aurea-logos.zip');
