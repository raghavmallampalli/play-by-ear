const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = '/home/raghav/src/play-by-ear';
const IMAGES_DIR = path.join(PROJECT_DIR, 'assets/images');
const INPUT_SVG_PATH = path.join(IMAGES_DIR, 'treble_clef.svg');

function log(msg) {
  console.log(`[Asset Generator] ${msg}`);
}

function generate() {
  log('Reading input SVG...');
  if (!fs.existsSync(INPUT_SVG_PATH)) {
    throw new Error(`Input SVG not found at: ${INPUT_SVG_PATH}`);
  }

  const svgContent = fs.readFileSync(INPUT_SVG_PATH, 'utf8');

  // Extract path9 d attribute in a robust, attribute-order-independent way
  const paths = svgContent.match(/<path[^>]*\/>/gs);
  if (!paths) {
    throw new Error('Failed to find any path elements in the SVG.');
  }
  const path9Tag = paths.find(p => p.includes('id="path9"'));
  if (!path9Tag) {
    throw new Error('Failed to find path element with id="path9".');
  }
  const dMatch = path9Tag.match(/d="([^"]+)"/s);
  if (!dMatch) {
    throw new Error('Failed to extract d attribute from path9.');
  }
  const dAttribute = dMatch[1].replace(/\s+/g, ' ').trim();

  // Extract Layer 1 transform
  const groups = svgContent.match(/<g[^>]*>/gs);
  if (!groups) {
    throw new Error('Failed to find any group elements in the SVG.');
  }
  const layer1Group = groups.find(g => g.includes('id="Layer 1"'));
  if (!layer1Group) {
    throw new Error('Failed to find group with id="Layer 1".');
  }
  const transformMatch = layer1Group.match(/transform="matrix\(([^)]+)\)"/);
  if (!transformMatch) {
    throw new Error('Failed to extract transform matrix from Layer 1 group.');
  }
  const matrix = transformMatch[1].split(',').map(Number);
  const [a, b, c, d, tx, ty] = matrix;

  log('Successfully extracted treble clef vector data.');

  // Parse path coordinates to find exact post-transform bounding box
  const coords = [];
  const matches = dAttribute.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (matches) {
    for (let i = 0; i < matches.length; i += 2) {
      if (matches[i+1] !== undefined) {
        coords.push({ x: Number(matches[i]), y: Number(matches[i+1]) });
      }
    }
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  coords.forEach(({ x, y }) => {
    // Apply matrix: X' = a*x + c*y + tx, Y' = b*x + d*y + ty
    const nx = a * x + c * y + tx;
    const ny = b * x + d * y + ty;
    if (nx < minX) minX = nx;
    if (nx > maxX) maxX = nx;
    if (ny < minY) minY = ny;
    if (ny > maxY) maxY = ny;
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Helper to generate the centered treble clef group.
  const getCenteredClefGroup = (fillColor, targetFillHeight = 0.70) => {
    const targetHeightPx = targetFillHeight * 1024;
    const scaleFactor = targetHeightPx / height;
    
    const finalTx = 512 - centerX * scaleFactor;
    const finalTy = 512 - centerY * scaleFactor;

    const finalTransform = `translate(${finalTx.toFixed(4)}, ${finalTy.toFixed(4)}) scale(${scaleFactor.toFixed(6)}) matrix(${a},${b},${c},${d},${tx},${ty})`;

    return `
    <g transform="${finalTransform}">
      <path
        d="${dAttribute}"
        fill="${fillColor}"
        stroke="none"
        fill-rule="evenodd"
        style="shape-rendering:geometricPrecision;"
      />
    </g>`;
  };

  // 1. Standard App Icon (icon.svg) -> 1024x1024, premium radial glow backdrop + white treble clef
  // Perfect representation of the user's mockup:
  const iconSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Base dark background gradient -->
    <linearGradient id="base-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141923" />
      <stop offset="100%" stop-color="#070A0F" />
    </linearGradient>
    
    <!-- Central soft glowing blue radial gradient orb -->
    <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4E8BF5" stop-opacity="0.85" />
      <stop offset="35%" stop-color="#2D5AA0" stop-opacity="0.5" />
      <stop offset="70%" stop-color="#141923" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#141923" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Dark rounded rectangle backdrop -->
  <rect width="1024" height="1024" rx="224" fill="url(#base-bg)" />

  <!-- Gorgeous soft glowing orb directly centered behind the clef -->
  <circle cx="512" cy="512" r="380" fill="url(#glow-grad)" />

  <!-- High-contrast clean white treble clef -->
  ${getCenteredClefGroup('#FFFFFF', 0.70)}
</svg>`;

  // 2. Android Adaptive Icon Foreground (android-icon-foreground.svg) -> 1024x1024, transparent background
  // S = 0.58 height to fit comfortably inside the adaptive safe-zone circle (inner 66%)
  const foregroundSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  ${getCenteredClefGroup('#A8C7FA', 0.58)}
</svg>`;

  // 3. Android Adaptive Monochrome Image (android-icon-monochrome.svg) -> 1024x1024, flat dark fill
  // Flat black shape for system to dynamically tint based on Material You themes
  const monochromeSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  ${getCenteredClefGroup('#000000', 0.58)}
</svg>`;

  // 4. Web Favicon (favicon.svg) -> 512x512, transparent background
  // Branded blue clef filling the viewport mostly for small size legibility (S = 0.80)
  const faviconSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="512" height="512">
  ${getCenteredClefGroup('#A8C7FA', 0.80)}
</svg>`;

  // Write temporary SVG templates
  const tempFiles = {
    icon: path.join(IMAGES_DIR, 'temp_icon.svg'),
    foreground: path.join(IMAGES_DIR, 'temp_foreground.svg'),
    monochrome: path.join(IMAGES_DIR, 'temp_monochrome.svg'),
    favicon: path.join(IMAGES_DIR, 'temp_favicon.svg'),
  };

  log('Writing temporary SVG templates...');
  fs.writeFileSync(tempFiles.icon, iconSvg, 'utf8');
  fs.writeFileSync(tempFiles.foreground, foregroundSvg, 'utf8');
  fs.writeFileSync(tempFiles.monochrome, monochromeSvg, 'utf8');
  fs.writeFileSync(tempFiles.favicon, faviconSvg, 'utf8');

  // Convert SVG to PNG using ImageMagick (convert)
  log('Rendering PNGs using ImageMagick (convert)...');

  try {
    // 1. icon.png (1024x1024)
    execSync(`convert -background none -density 300 -resize 1024x1024 "${tempFiles.icon}" "${path.join(IMAGES_DIR, 'icon.png')}"`);
    log('Successfully rendered icon.png');

    // 2. android-icon-foreground.png (1024x1024)
    execSync(`convert -background none -density 300 -resize 1024x1024 "${tempFiles.foreground}" "${path.join(IMAGES_DIR, 'android-icon-foreground.png')}"`);
    log('Successfully rendered android-icon-foreground.png');

    // 3. android-icon-monochrome.png (1024x1024)
    execSync(`convert -background none -density 300 -resize 1024x1024 "${tempFiles.monochrome}" "${path.join(IMAGES_DIR, 'android-icon-monochrome.png')}"`);
    log('Successfully rendered android-icon-monochrome.png');

    // 4. android-icon-background.png (512x512)
    execSync(`convert -size 512x512 xc:"#192229" "${path.join(IMAGES_DIR, 'android-icon-background.png')}"`);
    log('Successfully rendered android-icon-background.png');

    // 5. favicon.png (48x48)
    execSync(`convert -background none -density 300 -resize 48x48 "${tempFiles.favicon}" "${path.join(IMAGES_DIR, 'favicon.png')}"`);
    log('Successfully rendered favicon.png');

    // 6. splash-icon.png (1024x1024)
    execSync(`convert -background none -density 300 -resize 1024x1024 "${tempFiles.foreground}" "${path.join(IMAGES_DIR, 'splash-icon.png')}"`);
    log('Successfully rendered splash-icon.png');

  } catch (err) {
    console.error('Error during image rendering:', err.message);
    cleanup(tempFiles);
    throw err;
  }

  cleanup(tempFiles);
  log('Asset generation completed successfully!');
}

function cleanup(tempFiles) {
  log('Cleaning up temporary SVG template files...');
  Object.values(tempFiles).forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

generate();
