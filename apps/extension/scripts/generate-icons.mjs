import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple "AI" icon with retro pixel-art style colors
const sizes = [16, 32, 48, 128];

async function generateIcon(size) {
  // Create SVG with the icon design
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e43b44"/>
          <stop offset="100%" style="stop-color:#c42d35"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.15}"/>
      <text
        x="50%"
        y="55%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="#f4f4f4"
        font-family="Arial, sans-serif"
        font-weight="bold"
        font-size="${size * 0.5}"
      >AI</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(iconsDir, `icon-${size}.png`));

  console.log(`Generated icon-${size}.png`);
}

async function main() {
  console.log('Generating extension icons...');

  for (const size of sizes) {
    await generateIcon(size);
  }

  console.log('Done!');
}

main().catch(console.error);
