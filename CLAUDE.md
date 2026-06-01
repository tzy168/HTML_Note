# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HTML Note is a static site generator that runs on GitHub Pages. It provides a navigable file tree for `.html` files stored in the `pages/` directory, allowing users to browse and preview them in an iframe.

## Development Commands

- **Generate the index:** `node build.js` — Scans `pages/` and writes `index.json`. Run this after adding, removing, or renaming files in `pages/`.
- **Local preview:** `npx serve .` — Serves the site locally on a static file server.

There are no build steps, package managers, test suites, or linting tools in this project.

## Architecture

### Data Flow

1. **User drops `.html` files** into `pages/` (supports nested subdirectories).
2. **`build.js`** scans `pages/` recursively and writes `index.json` — a tree structure with `folder` and `file` nodes.
3. **`index.html`** (the SPA) fetches `index.json` at runtime and renders a collapsible sidebar navigation. Clicking a file loads it into an `<iframe>`.
4. **GitHub Actions** (`.github/workflows/build.yml`) auto-runs `build.js` on every push to `main` or `master`, then commits the updated `index.json` back to the repo.

### Key Files

| File | Purpose |
|------|---------|
| `pages/` | Source directory for all `.html` content files. Subdirectories become folders in the nav tree. Only `.html` files are indexed; other file types are ignored. |
| `build.js` | Node.js script that walks `pages/` and produces `index.json`. |
| `index.json` | **Auto-generated.** Tree-shaped index consumed by `index.html`. Do not edit manually. |
| `index.html` | Single-page app. Reads `index.json`, renders sidebar with search/filter, and previews selected files in an iframe. |
| `.github/workflows/build.yml` | CI workflow that regenerates `index.json` on push and commits changes. |

### Index JSON Structure

`index.json` has a top-level `tree` array of nodes:

```json
{
  "generatedAt": "2026-06-01T01:34:23.394Z",
  "tree": [
    {
      "name": "Folder Name",
      "type": "folder",
      "path": "relative/path",
      "children": [...]
    },
    {
      "name": "file name without .html",
      "type": "file",
      "path": "relative/path/file.html"
    }
  ]
}
```

## Important Conventions

- **`index.json` is auto-generated.** Any manual edits will be overwritten by `build.js` or the CI workflow.
- **No frontend build step.** `index.html` is a hand-written single file with embedded CSS and JS. It is served as-is by GitHub Pages.
- **Only `.html` files are indexed.** Other file types in `pages/` are silently ignored by `build.js`.
- **The SPA uses a relative fetch for `index.json`.** On GitHub Pages the path is `/index.json`; locally it resolves to `./index.json`.
- **Keyboard shortcuts in `index.html`:**
  - `/` — Focus search
  - `Escape` — Clear search and blur
  - `[` — Toggle sidebar collapse (except when typing in search)

## Workflow Gotchas

- The GitHub Actions workflow commits `index.json` back to the repo. This means a push that changes `pages/` will result in **two commits**: the user's commit, then the CI commit.
- The workflow requires `permissions: contents: write` to push the updated `index.json`.
- If running `build.js` locally, remember to commit `index.json` if you want the changes reflected before the next CI run.
