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
- **Node.js**: Ensure you have [Node.js](https://nodejs.org/) (version 22.x is recommended) installed on your machine.
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
> [!IMPORTANT]
> This repo will not accept pull requests of greater than 50 lines without prior communication with the maintainer. This has been done to reduce review burden.

---

## 🤖 AI Agent Guidelines

This repository includes a dedicated [AGENTS.md](file:///home/raghav/src/play-by-ear/AGENTS.md) file containing strict instructions, architectural requirements, and coding standards. 

If you are pair-programming with AI assistants (such as **Claude** or **Cursor**), ensure they are prompted to read and adhere to [AGENTS.md](file:///home/raghav/src/play-by-ear/AGENTS.md) before writing any code.

---

## 📝 Roadmap & TODO List

The roadmap and TODO list are maintained in [TODO.md](file:///home/raghav/src/play-by-ear/TODO.md).
---

## 🎨 Asset Attributions & Licenses

This project uses the following high-quality, open-source graphic assets:
- **Treble Clef Vector Shape**: Pulled from [Wikimedia Commons - File:Treble clef.svg](https://commons.wikimedia.org/wiki/File:Treble_clef.svg). This asset was originally uploaded by user *Tlusťa* and has been released into the **Public Domain (CC0 / MIT compatible)**.
- **Launcher Icons & Favicons**: Custom-rendered in high fidelity onto Material 3-inspired glowing gradients using our standard asset builder pipeline.