# CLAUDE.md - Recipes2026

## Project Overview

Cross-platform desktop recipe management application built with **Tauri 2 + React 18 + TypeScript**. Features Hebrew OCR to scan handwritten or printed recipes and store them in a local SQLite database. The Rust backend handles OCR processing (via Tesseract CLI), database operations, and communicates with the React frontend via Tauri's IPC invoke mechanism.

- **Bundle ID**: `com.recipes.app`
- **App window**: 800x600, title "recipes"

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 18.3, TypeScript 5.6, Vite 6 |
| Backend  | Rust, Tauri 2                       |
| Database | SQLite (via rusqlite, bundled)       |
| OCR      | Tesseract CLI (Hebrew language)     |
| IPC      | Tauri invoke (JSON via serde)       |
| Bundler  | Vite (dev port 1420, HMR port 1421) |

## Repository Structure

```
├── src/                        # React/TypeScript frontend
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component (navigation, view routing)
│   ├── App.css                 # Global styles (light/dark, RTL support)
│   ├── types.ts                # Shared TypeScript types (Recipe, RecipeInput, View)
│   ├── components/
│   │   ├── OcrUpload.tsx       # Image upload → OCR → recipe form workflow
│   │   ├── RecipeList.tsx      # Lists all saved recipes as cards
│   │   └── RecipeDetail.tsx    # View/edit/delete a single recipe
│   ├── assets/                 # Static assets (react.svg)
│   └── vite-env.d.ts          # Vite type declarations
├── src-tauri/                  # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs            # Rust entry point (delegates to lib.rs)
│   │   ├── lib.rs             # Tauri commands, plugins, state init
│   │   ├── db.rs              # SQLite database (schema, CRUD operations)
│   │   └── ocr.rs             # Tesseract CLI wrapper for Hebrew OCR
│   ├── capabilities/
│   │   └── default.json       # Security permissions (core, opener, dialog)
│   ├── icons/                 # Platform-specific app icons
│   ├── Cargo.toml             # Rust dependencies
│   ├── Cargo.lock             # Locked Rust deps
│   └── tauri.conf.json        # Tauri app configuration
├── public/                    # Static files served as-is
├── index.html                 # HTML entry point
├── package.json               # npm config and scripts
├── vite.config.ts             # Vite/dev server configuration
├── tsconfig.json              # TypeScript config (strict mode, ES2020)
└── tsconfig.node.json         # TypeScript config for build tools
```

## Prerequisites

### Tesseract OCR (required for recipe scanning)

The OCR feature requires Tesseract with Hebrew language data installed on the system:

- **macOS**: `brew install tesseract tesseract-lang`
- **Ubuntu/Debian**: `sudo apt install tesseract-ocr tesseract-ocr-heb`
- **Windows**: Install from https://github.com/UB-Mannheim/tesseract/wiki (add to PATH, include Hebrew language data)

Use the "Check Tesseract" button in the app to verify the installation.

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
const text = await invoke("ocr_image", { imagePath: "/path/to/image.jpg", lang: "heb" });
```

**Backend** (Rust):
```rust
#[tauri::command]
fn ocr_image(image_path: String, lang: Option<String>) -> Result<String, String> {
    let lang = lang.unwrap_or_else(|| "heb".to_string());
    ocr::run_ocr(&image_path, &lang)
}
```

### Tauri Commands (registered in `lib.rs`)

| Command            | Args                      | Returns          | Description                          |
| ------------------ | ------------------------- | ---------------- | ------------------------------------ |
| `greet`            | `name: &str`              | `String`         | Demo greeting                        |
| `ocr_image`        | `image_path`, `lang?`     | `String`         | Run OCR on an image, return text     |
| `check_ocr_status` | `lang?`                   | `Vec<String>`    | Verify Tesseract + language installed|
| `save_recipe`      | `recipe: RecipeInput`     | `Recipe`         | Create a new recipe in the database  |
| `get_recipes`      | (none)                    | `Vec<Recipe>`    | List all recipes (newest first)      |
| `get_recipe`       | `id: i64`                 | `Recipe`         | Get a single recipe by ID            |
| `update_recipe`    | `id: i64`, `recipe`       | `Recipe`         | Update an existing recipe            |
| `delete_recipe`    | `id: i64`                 | `()`             | Delete a recipe                      |

New Tauri commands must be:
1. Defined as functions annotated with `#[tauri::command]` in `src-tauri/src/lib.rs`
2. Registered in the invoke handler: `.invoke_handler(tauri::generate_handler![..., new_command])`
3. Called from the frontend via `invoke("new_command", { args })`

## Database

SQLite database stored in the Tauri app data directory (`recipes.db`). Initialized automatically on app startup.

### Schema

```sql
CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    ingredients TEXT NOT NULL DEFAULT '',
    instructions TEXT NOT NULL DEFAULT '',
    source_image_path TEXT,          -- path to the original scanned image
    raw_ocr_text TEXT,               -- original OCR output before editing
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

All CRUD operations are in `src-tauri/src/db.rs`. The database connection is held in `DbState` (managed Tauri state) behind a `Mutex<Connection>`.

## OCR Pipeline

1. User selects an image via native file dialog (`@tauri-apps/plugin-dialog`)
2. Frontend calls `invoke("ocr_image", { imagePath, lang: "heb" })`
3. Backend runs `tesseract <image> stdout -l heb --psm 6` via `std::process::Command`
4. Extracted Hebrew text is returned to the frontend
5. User reviews/edits the text, fills in recipe fields (title, ingredients, instructions)
6. Recipe is saved to SQLite via `invoke("save_recipe", { recipe })`

## Code Conventions

### TypeScript / React
- **Functional components** with hooks (`useState`, `useEffect`), no class components
- **Strict TypeScript**: `strict: true`, `noUnusedLocals`, `noUnusedParameters` enabled
- **ES modules**: project uses `"type": "module"` in package.json
- **JSX transform**: `react-jsx` (no need to import React in every file)
- **Styling**: Plain CSS files imported into components (not CSS-in-JS)
- **RTL support**: Hebrew text fields use `.rtl` CSS class for right-to-left direction
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Types**: Shared types in `src/types.ts`, imported with `import type`

### Rust
- **snake_case** for functions and variables
- **Lib pattern**: `main.rs` delegates to `lib.rs` via `run()`
- **Module pattern**: separate modules for `db` and `ocr`
- **Serde** for all serialization between frontend and backend
- **Error handling**: Tauri commands return `Result<T, String>` for frontend error display
- **Tauri plugins** initialized in the builder chain in `lib.rs`
- **State**: `DbState` managed via `app.manage()` with `Mutex<Connection>`

## Configuration Notes

- **Vite dev server**: Fixed port 1420 (strict), HMR on port 1421. The `TAURI_DEV_HOST` env var can override the host binding.
- **Tauri security**: CSP is set to `null` (permissive for desktop). Capabilities are defined in `src-tauri/capabilities/default.json`.
- **Tauri capabilities**: `core:default`, `opener:default`, `dialog:default`
- **TypeScript target**: ES2020 with bundler module resolution.
- **Build output**: Frontend builds to `dist/`, which Tauri bundles into the desktop app.
- **Database location**: Tauri app data directory (platform-specific), auto-created on first run.

## Current State

- No test framework or test files configured
- No CI/CD pipeline
- No linter (ESLint) or formatter (Prettier) configured
- OCR requires system Tesseract installation (not bundled)
