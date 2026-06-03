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

## 🌐 `'use dom'` Architecture (CRITICAL)

This app uses Expo's **`'use dom'`** directive, creating a **two-layer architecture**. Understand this before writing any code.

### How it works
- Files with `'use dom'` at the top render inside a **WebView** on Android/iOS (using the device's built-in Chromium engine).
- Files **without** `'use dom'` (primarily `src/app/` screens) render as **native React Native** UI.
- On web, both layers render identically as standard web content.

### The two layers

| Layer | Files | UI Primitives | APIs Available |
|---|---|---|---|
| **Native RN** | `src/app/*.tsx` | `View`, `Text`, `Pressable`, `StyleSheet` | `useColorScheme`, `expo-router`, `react-native` |
| **DOM (WebView)** | `src/components/*.tsx`, `src/hooks/useAudioEngine.ts` | `<div>`, `<button>`, `<span>`, CSS inline styles | `localStorage`, `window.*`, `Tone.js`, `navigator.clipboard`, `dangerouslySetInnerHTML` |

### Import rules (NEVER VIOLATE)
1. **DOM files can import from other DOM files** and from plain TS/JS modules (`src/types/`, `src/utils/`, `src/constants/`, `src/levels/`).
2. **Native RN files CANNOT import from `'use dom'` files** as utilities. They can only render a DOM component as a child (Expo handles the WebView bridge).
3. **DOM files CANNOT use React Native primitives** (`View`, `Text`, `Pressable`, `StyleSheet`, etc.).
4. **Each `'use dom'` component file must have exactly one default export** (the component). Named-export-only utility files with `'use dom'` (like `TrainerIcons.tsx`) are an exception — they work when imported by other DOM files.
5. **Props crossing the native→DOM boundary must be serializable** (strings, numbers, booleans, plain objects/arrays). Function props must be top-level (not nested) and are always async.
6. **No shared React Context** between native and DOM layers. Data must be passed explicitly via props.

### Icons: Two separate files
Due to the import boundary, icons are split into two files:
- `src/components/icons/DOMIcons.tsx` — `'use dom'`, for DOM components
- `src/components/icons/NativeIcons.tsx` — no directive, for native RN screens in `src/app/`

**Never import `@expo/vector-icons` directly in a component.** Always use the centralized icon files.

### When to use `'use dom'`
- Any new component that needs Web Audio (Tone.js), HTML rendering, or DOM APIs → **must** use `'use dom'`
- Any new component that needs native mobile feel, native navigation, or RN-specific APIs → **must NOT** use `'use dom'`
- Pure logic files (`src/types/`, `src/utils/`, `src/constants/`) → **never** use `'use dom'`

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
- **Semantic Commit Messages**: When presenting or committing changes, structure them cleanly using standard semantic prefixes (e.g., `feat:`, `fix:`, `refactor:`, `test:`, `docs:`). Club changes for each task and only commit them together. NEVER blindly commit the entire worktree unless all changes are related to the same task.

---

## 🏷️ Versioning Policy (Date-Based Semantic Versioning)

This project uses a calendar-based semantic versioning scheme of the form `YEAR.MONTH.PATCH` (e.g. `2026.05.1`) in `package.json` and `app.json`.
- **Year (Major)**: The current calendar year (e.g., `2026`).
- **Month (Minor)**: The current calendar month (e.g., `05`).
- **Patch (Patch)**: The sequential version/build identifier.

### Rules for Updating Versions:
1. **Features**: Increment the **minor version** (month component) when releasing features (or update to the current calendar month if it has changed).
2. **Bugfixes & Refactors**: Increment the **patch version** for bugfixes, refactors, and performance optimizations.
3. **Sync Requirements**: Always update the `version` field in both `package.json` and `app.json` simultaneously.

---

## ⚠️ Mistakes to Avoid
1. **Monolithic Layout Bloat**:
   - Do NOT construct new features (such as custom settings tabs, dashboard controls, or heavy forms) directly inside active controller coordinates like `MidiPlayerDOM.tsx`. 
   - Modularity is paramount: create isolated, stateless or sub-state components in `src/components/` (like `SettingsTab.tsx` or `TheoryTab.tsx`) and embed them cleanly as thin presentation wrappers.

2. **Compiler and Warning Ignorance**:
   - Never finalize a task or commit changes without running static TypeScript analysis.
   - Always run `npm run lint` and check for lint/styling issues, implicit `any` type warnings, mapping checks, and export errors before presenting the finished task. Testing files do not catch all static type mismatch bugs!
   - Do not summarize your changes unless the user asks. Assume your edits were poor quality and ask the user to test the app.
