# CLAUDE.md - Recipes2026

## Project Overview

Cross-platform desktop application built with **Tauri 2 + React 18 + TypeScript**. The Rust backend communicates with the React frontend via Tauri's IPC invoke mechanism. Currently a starter/template app demonstrating the Tauri + React integration pattern with a greeting feature and US cities dropdown.

- **Bundle ID**: `com.recipes.app`
- **App window**: 800x600, title "recipes"

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | React 18.3, TypeScript 5.6, Vite 6 |
| Backend  | Rust, Tauri 2                     |
| IPC      | Tauri invoke (JSON via serde)     |
| Bundler  | Vite (dev port 1420, HMR port 1421) |

## Repository Structure

```
├── src/                    # React/TypeScript frontend
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Main component (greeting form, city selector)
│   ├── App.css             # Styles (light/dark mode, grid layout)
│   ├── assets/             # Static assets (react.svg)
│   └── vite-env.d.ts       # Vite type declarations
├── src-tauri/              # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs         # Rust entry point (delegates to lib.rs)
│   │   └── lib.rs          # Tauri commands and app builder
│   ├── capabilities/
│   │   └── default.json    # Security permissions (core:default, opener:default)
│   ├── icons/              # Platform-specific app icons
│   ├── Cargo.toml          # Rust dependencies
│   ├── Cargo.lock          # Locked Rust deps
│   └── tauri.conf.json     # Tauri app configuration
├── public/                 # Static files served as-is
├── index.html              # HTML entry point
├── package.json            # npm config and scripts
├── vite.config.ts          # Vite/dev server configuration
├── tsconfig.json           # TypeScript config (strict mode, ES2020)
└── tsconfig.node.json      # TypeScript config for build tools
```

## Common Commands

```bash
# Install dependencies
npm install

# Start Vite dev server only (frontend)
npm run dev

# Start full Tauri dev environment (frontend + Rust backend)
npm run tauri dev

# Type-check and build frontend
npm run build

# Build the full desktop app (all platforms)
npm run tauri build

# Preview the built frontend
npm run preview
```

## Architecture & IPC Pattern

Frontend-to-backend communication uses Tauri's `invoke` command pattern:

**Frontend** (TypeScript):
```typescript
import { invoke } from "@tauri-apps/api/core";
const result = await invoke("greet", { name });
```

**Backend** (Rust):
```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
```

New Tauri commands must be:
1. Defined as functions annotated with `#[tauri::command]` in `src-tauri/src/lib.rs`
2. Registered in the invoke handler: `.invoke_handler(tauri::generate_handler![greet, new_command])`
3. Called from the frontend via `invoke("new_command", { args })`

## Code Conventions

### TypeScript / React
- **Functional components** with hooks (`useState`), no class components
- **Strict TypeScript**: `strict: true`, `noUnusedLocals`, `noUnusedParameters` enabled
- **ES modules**: project uses `"type": "module"` in package.json
- **JSX transform**: `react-jsx` (no need to import React in every file)
- **Styling**: Plain CSS files imported into components (not CSS-in-JS)
- **Naming**: camelCase for variables/functions, PascalCase for components

### Rust
- **snake_case** for functions and variables
- **Lib pattern**: `main.rs` delegates to `lib.rs` via `run()`
- **Serde** for all serialization between frontend and backend
- **Tauri plugins** initialized in the builder chain in `lib.rs`

## Configuration Notes

- **Vite dev server**: Fixed port 1420 (strict), HMR on port 1421. The `TAURI_DEV_HOST` env var can override the host binding.
- **Tauri security**: CSP is set to `null` (permissive for desktop). Capabilities are defined in `src-tauri/capabilities/default.json`.
- **TypeScript target**: ES2020 with bundler module resolution.
- **Build output**: Frontend builds to `dist/`, which Tauri bundles into the desktop app.

## Current State

- No test framework or test files configured
- No CI/CD pipeline
- No database or persistent storage
- No linter (ESLint) or formatter (Prettier) configured
- The app is stateless; all data lives in React component state
