# Developer Agent Guidelines (AGENTS.md)

This file defines the strict architectural and quality guidelines that all AI coding agents (Antigravity, Claude, Cursor, etc.) **must** adhere to without exception when contributing to this codebase. Once you read this whole file, say pineapple to confirm you read it.

## 🚨 Critical Expo Version Rule
* **Expo Configuration**: Expo has changed. Always read the exact versioned documentation at https://docs.expo.dev/versions/v56.0.0/ before writing or refactoring any code. Ensure compatibility with the current dependencies in `package.json`.

---

## 🏗️ Codebase Architecture & Modularity

Keep the codebase modular, decoupled, and clean. Avoid long monolithic files (especially react/react-native component files).

1. **Components (`src/components/`)**
   - Place all reusable and UI-specific components here (e.g., keyboard visualizers, timelines, settings panes).
   - Components should focus strictly on presentation and user interaction, and delegate complex business or audio logic to hooks.

2. **Hooks (`src/hooks/`)**
   - Extract state management, event subscription, and hardware/engine coordination (like ToneJS, MIDI state, theme systems) into custom hooks.
   - Naming convention: Use camelCase with a standard `use` prefix (e.g., `useAudioEngine.ts`, `useTheme.ts`).

3. **Utils & Services (`src/utils/` and `src/services/`)**
   - Put all pure utility helper functions, pitch/note conversions, mathematical models, and isolated algorithms into the `src/utils` folder.
   - Keep utils pure and testable. Do not mix React state or JSX into utility files.

4. **Types (`src/types/`)**
   - All shared TypeScript type definitions, interfaces, and enums must be declared in the `src/types/` directory.
   - Avoid defining ad-hoc local interfaces in components unless they are completely private to that component.
   - Re-export type modules clearly so they can be clean imports elsewhere.
   - Never declare shared app interfaces (such as `AppSettings`) inside a component or utility module.

---

## 🧪 Testing Standards (`src/tests/`)

- **Jest Testing**: All unit and integration tests must be placed in the `src/tests/` folder.
- **Runnable**: Ensure all tests run successfully using the `npm test` command.
- **Coverage**: Any new logic added to `src/utils` or state mutations in `src/hooks` must be accompanied by comprehensive unit tests. Use descriptive `describe` and `it` blocks.

---

## 🎨 Design Aesthetics & UX

- **Premium Interface**: Create stunning, responsive layouts. Avoid generic colors. Utilize curated, harmonious color palettes (HSL-based, deep rich dark modes), smooth gradients, and subtle micro-animations for high-fidelity interactive elements.
- **Responsive Layouts**: Prioritize visual excellence across all viewport aspects, ensuring complete responsive alignment and layout reflows for both **Portrait** and **Landscape** orientations.
- **Self-Documented UI**: Do not use placeholders. If assets are needed, ask to generate or include them properly.
- **State Integrity**:
  - Prevent user interactions on exercises that have not officially started (e.g., disable/hide action buttons until the set is running).
  - Hide playback or timeline controls until the start sequence is completed or the training set is initiated.

---

## 🧹 Code Quality & Git Integrity

- **Comments & Docstrings**: Maintain code documentation integrity. Do not strip out existing comments or JSDocs that are unrelated to your edits. Add meaningful inline documentation for complex logic.
- **Type Safety**: Strictly avoid `any`. Ensure all TypeScript compilation checks pass with zero warnings.
- **Semantic Commit Messages**: When presenting or committing changes, structure them cleanly using standard semantic prefixes (e.g., `feat:`, `fix:`, `refactor:`, `test:`, `docs:`).

---

## ⚠️ Mistakes to Avoid
1. **Monolithic Layout Bloat**:
   - Do NOT construct new features (such as custom settings tabs, dashboard controls, or heavy forms) directly inside active controller coordinates like `MidiPlayerDOM.tsx`. 
   - Modularity is paramount: create isolated, stateless or sub-state components in `src/components/` (like `SettingsTab.tsx` or `TheoryTab.tsx`) and embed them cleanly as thin presentation wrappers.

2. **Compiler and Warning Ignorance**:
   - Never finalize a task or commit changes without running static TypeScript analysis.
   - Always run `npx tsc --noEmit` and check for implicit `any` type warnings, mapping checks, and export errors before presenting the finished task. Testing files do not catch all static type mismatch bugs!
   - Do not summarize your changes unless the user asks. Assume your edits were poor quality and ask the user to test the app.
