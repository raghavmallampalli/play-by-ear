const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/home/raghav/src/play-by-ear';
const INPUT_SVG_PATH = path.join(PROJECT_DIR, 'assets/images/treble_clef.svg');

const svgContent = fs.readFileSync(INPUT_SVG_PATH, 'utf8');

// Extract path9 d attribute in a robust, attribute-order-independent way
const paths = svgContent.match(/<path[^>]*\/>/gs);
const path9Tag = paths.find(p => p.includes('id="path9"'));
const dMatch = path9Tag.match(/d="([^"]+)"/s);
const dAttribute = dMatch[1];

// Extract Layer 1 transform
const groups = svgContent.match(/<g[^>]*>/gs);
const layer1Group = groups.find(g => g.includes('id="Layer 1"'));
const transformMatch = layer1Group.match(/transform="matrix\(([^)]+)\)"/);
const matrix = transformMatch[1].split(',').map(Number);
const [a, b, c, d, tx, ty] = matrix;

console.log('Matrix:', { a, b, c, d, tx, ty });

// Parse coordinates from d
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

console.log('Raw Path Coordinates Bounding Box after Layer 1 Matrix Transform:');
console.log(`X: [${minX.toFixed(2)}, ${maxX.toFixed(2)}] (Width: ${(maxX - minX).toFixed(2)})`);
console.log(`Y: [${minY.toFixed(2)}, ${maxY.toFixed(2)}] (Height: ${(maxY - minY).toFixed(2)})`);

// Let's compute the transform needed to center it in a 1024x1024 viewport with 10% padding
const targetSize = 1024;
const padding = 0.15; // 15% padding on all sides
const safeSize = targetSize * (1 - 2 * padding); // 716.8

const width = maxX - minX;
const height = maxY - minY;

const scaleX = safeSize / width;
const scaleY = safeSize / height;
const scaleFactor = Math.min(scaleX, scaleY);

const scaledWidth = width * scaleFactor;
const scaledHeight = height * scaleFactor;

const centerX = (minX + maxX) / 2;
const centerY = (minY + maxY) / 2;

// We want the center of the shape to be at (512, 512)
// So we translate from shape center to (0,0), scale it, and then translate to (512, 512)
const finalTx = 512 - centerX * scaleFactor;
const finalTy = 512 - centerY * scaleFactor;

console.log('\nSuggested exact centering transform for 1024x1024 canvas:');
console.log(`transform="translate(${finalTx.toFixed(4)}, ${finalTy.toFixed(4)}) scale(${scaleFactor.toFixed(6)})"`);
