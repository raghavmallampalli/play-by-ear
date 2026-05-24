const fs = require('fs');
const path = require('path');
const https = require('https');

// Define targets
const targetDir = path.join(__dirname, '../assets/audio');
const constantsFile = path.join(__dirname, '../src/constants/piano_samples.ts');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(path.dirname(constantsFile))) {
  fs.mkdirSync(path.dirname(constantsFile), { recursive: true });
}

// Generate the 88 note names and their MIDI numbers
// MIDI 21 (A0) to MIDI 108 (C8)
const notesMap = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const allNotes = [];

for (let midi = 21; midi <= 108; midi++) {
  const octave = Math.floor(midi / 12) - 1;
  const noteName = notesMap[midi % 12];
  allNotes.push({
    midi: midi,
    note: `${noteName}${octave}`,
    filename: `${noteName}${octave}.mp3`
  });
}

const cdnUrl = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/';

console.log(`Starting secure download of all 88 Grand Piano notes into: ${targetDir}...`);

let completed = 0;
let errors = 0;

const downloadNote = (item) => {
  const destPath = path.join(targetDir, item.filename);
  const fileUrl = `${cdnUrl}${item.filename}`;

  // Skip download if file already exists and is non-empty
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    completed++;
    checkFinish();
    return;
  }

  const file = fs.createWriteStream(destPath);
  https.get(fileUrl, response => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${item.filename}: HTTP ${response.statusCode}`);
      file.close();
      fs.unlinkSync(destPath);
      errors++;
      completed++;
      checkFinish();
      return;
    }

    response.pipe(file);
    file.on('finish', () => {
      file.close();
      completed++;
      if (completed % 10 === 0 || completed === allNotes.length) {
        console.log(`[Progress: ${completed}/${allNotes.length}] Downloader active...`);
      }
      checkFinish();
    });
  }).on('error', err => {
    console.error(`Error downloading ${item.filename}:`, err.message);
    file.close();
    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
    }
    errors++;
    completed++;
    checkFinish();
  });
};

const checkFinish = () => {
  if (completed === allNotes.length) {
    console.log(`\n🎉 Grand Piano downloads completed! (${allNotes.length - errors} success, ${errors} failed)`);
    generateConstantsFile();
  }
};

const generateConstantsFile = () => {
  console.log(`Generating typescript constant mapping at: ${constantsFile}...`);
  
  let code = `// Automatically generated Grand Piano 88-key mapping constants. Do not edit manually.\n`;
  code += `export const pianoSamples: Record<number, any> = {\n`;
  
  allNotes.forEach(item => {
    // Generates relative path from src/constants to assets/audio
    code += `  ${item.midi}: require('../../assets/audio/${item.filename}'), // ${item.note}\n`;
  });
  
  code += `};\n`;
  
  fs.writeFileSync(constantsFile, code);
  console.log(`🎉 Static require mapping with all 88 keys written successfully!`);
};

// Start batch download
allNotes.forEach(downloadNote);
