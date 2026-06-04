# Development & Architecture

## Codebase Architecture

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

## Development Instructions

### 1. Prerequisites
- **Node.js**: Ensure you have [Node.js](https://nodejs.org/) (version 22.x is recommended) installed on your machine.
- **ImageMagick**: The local asset generation script uses `convert` (ImageMagick) to render the high-fidelity SVG assets into PNG. Ensure ImageMagick is installed on your system if you plan to regenerate assets.

This app is tested for Android and Web. Install Expo Go on your mobile device to test on it. Ensure Supported SDK is 54 - if you see a newer version, raise an issue.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Run the development server
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

### 5. Lint and Type Check the Codebase
To verify static TypeScript type safety (via `tsc --noEmit`), check for syntax errors, and find styling issues (via ESLint/`expo lint`):
```bash
npm run lint
```

---
