# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
A static browser start page (daily to-do, homework tracker, one deadline countdown, time-based light/dark theme). Plain HTML/CSS/vanilla JS — no build step, no dependencies, no package.json, no test suite. The user sets `index.html` as their browser homepage via a `file:///` URL.

## Running / checking
- Open `index.html` directly in a browser.
- Browser automation tools can't open `file://` URLs; serve it instead: `python -m http.server 8765` from the repo root, then visit `http://localhost:8765/index.html`.
- Syntax check: `node --check app.js`.

## Architecture
- `app.js` is a single IIFE. State lives in three module-level variables (`todos`, `homework`, `deadline`), each mirrored to `localStorage` through the `load`/`save` helpers (both wrapped in try/catch). Storage keys: `hp.todos` (`{date, items}`), `hp.homework` (array), `hp.deadline` (`{label, due}` with `due` as ISO string).
- Rendering is full re-render: each mutation updates state, calls `save`, then `renderTodos()` / `renderHomework()` rebuild the list DOM. `makeItem()` is the shared list-row builder for both lists; `setProgress()` drives both progress bars.
- A single 1-second `tick()` loop updates the clock and deadline countdown; once per minute it also calls `applyTheme()`.
- Nothing auto-clears: to-dos and homework persist until the user deletes them (homework also has "Clear completed"). The user explicitly asked that daily to-dos never reset on their own. `hp.todos.date` is a leftover field and is no longer read.
- Theme: dark when hour ≥ 19 or < 7. The rule is duplicated in an inline `<script>` in `index.html` `<head>` (to avoid a flash before `app.js` loads) and in `applyTheme()` in `app.js` — keep both in sync. `applyTheme(hour)` is exposed on `window` so the theme can be forced from the console for testing.
- Export/import: `exportText()` / `parseText()` in `app.js` define a plain-text format for homework + deadline (documented in README). `parseText` returns `undefined` for a section missing from the text (leave as is) vs. `null` for `Deadline: none` (clear), and throws on an unreadable deadline date. If you change the export format, keep the parser accepting it so exported files round-trip.
- Styling: all colors are CSS variables on `:root`, overridden under `:root[data-theme="dark"]` in `styles.css`. The deadline card's color state (`none`/`ok`/`warn` <24h/`urgent` <3h/`past`) is set via `data-state` on `#countdown` and mapped to `--cd-color` in CSS.
