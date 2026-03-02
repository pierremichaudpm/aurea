#!/usr/bin/env node
// Generates all favicon and app icon variants for Auréa RH Conseil
// Requires: ImageMagick (convert command)
// Usage: node generate-icons.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Gold two-circle logo on navy blue circle background
function makeSvg(size) {
  const pad = size * 0.18;
  const logoW = size - pad * 2;
  const logoH = logoW * (29 / 44);
  const cx = size / 2;
  const cy = size / 2;
  const logoX = (size - logoW) / 2;
  const logoY = (size - logoH) / 2;
  const scale = logoW / 44;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#1a2332"/>
  <g transform="translate(${logoX}, ${logoY}) scale(${scale})">
    <defs>
      <pattern id="h" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <line x1="0" y1="0" x2="0" y2="3" stroke="#c8a44e" stroke-width="1"/>
      </pattern>
      <mask id="m"><circle cx="29" cy="14.5" r="13" fill="white"/></mask>
      <clipPath id="c"><circle cx="15" cy="14.5" r="13"/></clipPath>
    </defs>
    <circle cx="15" cy="14.5" r="13" stroke="#c8a44e" stroke-width="1.8" fill="none"/>
    <circle cx="29" cy="14.5" r="13" stroke="#c8a44e" stroke-width="1.8" fill="none"/>
    <g clip-path="url(#c)"><rect width="44" height="29" fill="url(#h)" mask="url(#m)"/></g>
  </g>
</svg>`;
}

// Sizes needed
const icons = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'mstile-150x150.png', size: 150 },
];

// Generate PNGs
icons.forEach(({ name, size }) => {
  const svg = makeSvg(size);
  const svgPath = path.join(outDir, `_tmp_${size}.svg`);
  const pngPath = path.join(outDir, name);
  fs.writeFileSync(svgPath, svg);
  // Use higher density for small icons for crisp rendering
  const density = size <= 32 ? 288 : 144;
  execSync(`convert -background none -density ${density} "${svgPath}" -resize ${size}x${size} "${pngPath}"`);
  fs.unlinkSync(svgPath);
  console.log(`✓ ${name} (${size}×${size})`);
});

// Generate favicon.ico (multi-size)
const ico16 = path.join(outDir, 'favicon-16x16.png');
const ico32 = path.join(outDir, 'favicon-32x32.png');
const icoPath = path.join(outDir, 'favicon.ico');
execSync(`convert "${ico16}" "${ico32}" "${icoPath}"`);
console.log('✓ favicon.ico (16+32)');

// Generate SVG favicon
const svgFavicon = makeSvg(32);
fs.writeFileSync(path.join(outDir, 'favicon.svg'), svgFavicon);
console.log('✓ favicon.svg');

// Generate site.webmanifest
const manifest = {
  name: 'Auréa RH Conseil',
  short_name: 'Auréa RH',
  icons: [
    { src: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
  ],
  theme_color: '#1a2332',
  background_color: '#1a2332',
  display: 'standalone'
};
fs.writeFileSync(path.join(outDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log('✓ site.webmanifest');

// Generate browserconfig.xml
const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icons/mstile-150x150.png"/>
      <TileColor>#1a2332</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
fs.writeFileSync(path.join(outDir, 'browserconfig.xml'), browserconfig);
console.log('✓ browserconfig.xml');

console.log('\nAll icons generated in /icons/');
console.log('Add these to your <head>:');
console.log(`
<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
<link rel="manifest" href="/icons/site.webmanifest">
<meta name="msapplication-TileColor" content="#1a2332">
<meta name="theme-color" content="#1a2332">
`);
