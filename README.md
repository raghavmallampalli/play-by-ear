# 🎧 Play by Ear

A modern, highly interactive, and beautiful MIDI-based ear training application built with **React Native**, **Expo**, and **ToneJS**. Designed to train your musical ear through structured levels, interactive keyboard visualizers, dynamic timelines, and comprehensive feedback modes.

---

## 🏗️ Codebase Architecture

The codebase follows a highly modular, type-safe, and decoupled structure inside the `src` directory to ensure maximum maintainability and testability:

```text
src/
├── app/          # Expo Router file-based screens and navigation pages (dashboard, trainer, sandbox, etc.)
├── components/   # Reusable presentational components (Timeline, KeyboardVisualizer, Settings, etc.)
├── constants/    # Fixed constants, default configs, and global definitions
├── hooks/        # React hooks coordinating stateful systems (useAudioEngine, useTheme, etc.)
├── levels/       # Level configurations, registries, relative intervals, and generator scripts
├── services/     # Core services and background integration workers
├── tests/        # Jest unit and integration test suites
├── theory/       # Theoretical reference guides and educational material
├── types/        # Consolidated TypeScript interface, enum, and type declarations
└── utils/        # Pure utility functions, pitch converters, and mathematical music logic
```

---

## 🚀 Development Instructions

### 1. Prerequisites
- **Node.js**: Ensure you have [Node.js](https://nodejs.org/) installed on your machine.
- **ImageMagick**: The local asset generation script uses `convert` (ImageMagick) to render the high-fidelity SVG assets into PNG. Ensure ImageMagick is installed on your system if you plan to regenerate assets:
  - *Ubuntu/Debian*: `sudo apt-get install imagemagick`
  - *macOS*: `brew install imagemagick`
  - *Windows*: Download from the official website.

This app is tested for Android and Web. Install Expo Go on your device to test on a mobile device. Ensure Supported SDK is 54 - if you see a newer version, raise an issue.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Run the Development Server
To start the Expo development server:
```bash
npm start
```
From the interactive terminal output, you can choose where to run your application:
- Press `w` to run in the **Web Browser**
- Press `a` to run on an **Android Emulator** or connected device
- Press `i` to run on an **iOS Simulator**

*Note: For direct platform runs, you can also use `npm run web`, `npm run android`, or `npm run ios`.*

### 4. Run Jest Unit Tests
To execute the comprehensive unit test suite in the `src/tests` directory:
```bash
npm test
```

### 5. Lint the Codebase
To analyze the codebase for potential syntax or styling errors:
```bash
npm run lint
```

---

## 🤖 AI Agent Guidelines

This repository includes a dedicated [AGENTS.md](file:///home/raghav/src/play-by-ear/AGENTS.md) file containing strict instructions, architectural requirements, and coding standards. 

If you are pair-programming with AI assistants (such as **Claude** or **Cursor**), ensure they are prompted to read and adhere to [AGENTS.md](file:///home/raghav/src/play-by-ear/AGENTS.md) before writing any code. For **Cursor**, you can copy the contents of `AGENTS.md` directly into your `.cursorrules` file or project system instructions.

---

## 📝 Roadmap & TODO List

Below is the planned features and bugfixes roadmap. Help us build a premium experience by picking up these tasks:

### ⏱️ Workout Flow & Timeline UI
- [x] **Bugfix**: Restrict user interaction on the tonic, chords, and melody buttons until the exercise set has officially begun (i.e., 'Start' or 'Continue' has been pressed).
- [x] **Feature**: Keep the play/pause button persistently visible in the timeline layout, cleanly disabled and grayed out prior to exercise start to eliminate horizontal layout shifts.
- [x] **Bugfix**: Stabilize timeline layout (fixed vertical height and refined scrollbar overflow checks) to eliminate vertical gutter scrollbar shifts when there is ample free space.
- [x] **Feature**: Implement layout-stable initial positioning for piano visualizer using React's synchronous `useLayoutEffect` to achieve seamless, zero-scroll-jump mount alignment.
- [x] **Bugfix**: move the hashes out of theorytab.tsx - perhaps to constants.py
- [x] **Feature**: Add app icon, splash screen (if needed) and title.
- [x] Timeline follows playing note, keyboard viz snaps to first played note (tonic or actual excercise)
- [x] Bugfix: octave note is always read as wrong (since it thinks it's the 0th degree)

- [x] Refactor: simplify getAnswerChoices in index.ts (levels). 
- [x] Refactor: Preload should be auto handled from the note list, not hardcoded. 
- [x] Refactor: Can levels be converted to a class to reduce boilerplate? 
- [x] Refactor: Move logger to utils. 
- [x] Refactor: Find a way to move the theory registry into md files for ease of editing. 
- [x] Refactor: Understand global.css vs. domStyles and invididual button styling. 
- [x] Refactor: Can we share button styling across as many buttons as possible?
 
### 📱 Responsive Layouts & Orientation
- [x] **Major Bugfix**: Implement complete, robust support for **Landscape Mode** layouts across all dashboard, trainer, and sandbox views to ensure standard phone compatibility. Support react native on web, use that to get the layout correct.

### ⚙️ Dashboard Settings Panel
- [x] **Feature**: Create a dedicated settings button on the dashboard interface.
- [x] **Feature**: Move the existing export & import data actions inside this dashboard settings pane.
- [x] **Feature**: Implement comprehensive custom settings:
  - [x] **Instrument Mode**: Toggle between **Guitar** vs. **Piano** synthesis modes. Disable guitar for now.
  - [x] **Note Labels**: 
    - *Melody*: Carnatic vs. Solfege vs. Note Numbers vs. Absolute pitches.
    - *Chords*: Roman Numerals vs. Absolute chord names.
  - [x] **Visualizer Control**: Add a setting to toggle the active Keyboard Visualizer on/off.
  - [x] **Chord mode**: Currently, chord definitions use root plus inversion. Instead use standard. Make a todo to introduce inversions as a new excercise group after minor chords, i.e in group 4. Tonic can continue to use the slash chords.

### 🎓 Trainer Settings & Level Customization
- [x] **Feature**: Embed a direct shortcut path to the Settings pane from inside the trainer/training page.
- [x] **Feature**: Add trainer-specific controls (like **Tempo/BPM**) at the top of this settings pane (only show this trainer settings section when accessed from the training screen).
- [x] **Feature**: Persist modified tempo values directly into the active level setup so they remain configured for subsequent runs of that exercise.
- [x] **Feature**: Add a "Reset to Default" button to revert the tempo back to the level's standard BPM value.
- [x] Chore: group the 4 button row and call it 'TrackControls'. Define the behavior of each, alongside the next excercise and play/pause button in comments to avoid regressions.
- [x] Bugfix: restart level button no longer restarts level
- [x] Bugfix: A note after being revealed should show up on keyboard visualizer
- [x] Bugfix: sharps and flats not cleanly represented in carnatic. Use the variant system. Use single letter symbols, not two letter. Similarly use the dot above/below to represent octaves above/below (in label and in the excercise options). Example: S R₁ G₃ M₁ P D₁ N₃ Ṡ => re flat and la flat.


### 🎹 MIDI Sandbox & Audio Engines
- [x] **Feature**: Fully hook up, wire, and integrate the MIDI Sandbox page.
- [x] Remember recent midis - cache the midi files so user can reload the midis automatically
- [x] Pre-save ~~30-40~~ **8** midis of different genres in the app (we can't keep orchestral midis)
- [ ] Fur elise is still weird
- [ ] Where did the play melody guide and play chord guide buttons go in midi player?

## Working export and import
- [ ] Do a true invariant slug for each experiment for export
- [ ] Incorporate user notes
- [ ] Shift to expo-fs (similarly all expo variants instead of react variants), make sure save and load works fine

## More exercises
- [ ] Happy birthday notes are in level 6 wrong, pull midi and base edxcercise on it
- [ ] Minor, augmented, dimnished, 7th, suspended
- [ ] More useful notes for chord recognition
- [ ] Difficult selection page should include best performance
- [ ] Lock later levels until earlier levels are passed (with a "pass" threshold, i.e 80%)

## User onboarding
- [ ] Add a demo of UI that auto launches the first launch, wire it up behind a help button on the trainer screen.
- [ ] Ask user about their level and accordingly unlock levels.

### V0.1 release
- [ ] Build the app, check apk size and verify it works on phone without wifi, has correct icon, name etc.
- [x] Tag commit, set up semantic versioning system
- [ ] Exports logs written by app as a debug packet - persist error logs in a separate file with rotation, info logs for current session (dump at end), debug log if setting is turned on for current session
- [ ] Hook up build and push to F-droid so app is available automatically on tagged commits

## V0.2
- [ ] Keyboard shortcuts for web player
- [ ] **Feature**: Add a high-fidelity guitar synthesizer voice for audio synthesis.
  - [ ] **Timeline Display Style**: Toggle between **DAW** vs. standard **Staff** vs. **Guitar Tabs** timeline modes. 

---

## 🎨 Asset Attributions & Licenses

This project uses the following high-quality, open-source graphic assets:
- **Treble Clef Vector Shape**: Pulled from [Wikimedia Commons - File:Treble clef.svg](https://commons.wikimedia.org/wiki/File:Treble_clef.svg). This asset was originally uploaded by user *Tlusťa* and has been released into the **Public Domain (CC0 / MIT compatible)**.
- **Launcher Icons & Favicons**: Custom-rendered in high fidelity onto Material 3-inspired glowing gradients using our standard asset builder pipeline.