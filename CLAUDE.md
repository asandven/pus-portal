# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**8C Skoleportal** – a static school portal for class 8C at Presterød Ungdomsskole (PUS), hosted at `iktpus.no` via GitHub Pages (repo: `asandven/pus-portal`). No build tools, no framework, no package manager — pure vanilla HTML/CSS/JS served directly.

## Development

Open any `.html` file directly in a browser. There is no build step, dev server, or test suite. To verify changes, open the file in a browser or use a simple static file server:

```
npx serve .
```

Deploy by pushing to `main` — GitHub Pages publishes automatically.

## Architecture

### Pages
- `index.html` — homepage with hero slideshow, navigation cards, and teacher login
- `ukeplan.html` — weekly plan (timetable, homework, announcements)
- `proveplan.html` — test/exam schedule
- `matte-agent/index.html` — AI math assistant (two-panel: exercise browser + chat)

### Shared
- `style.css` — global design system (CSS custom properties: `--brand`, `--navy`, `--bg`, `--radius`, `--shadow`, etc.). All pages link this file; page-specific styles are in `<style>` blocks inline.
- `script.js` — homepage logic: nav tab switching, hero slideshow, data fetching, PIN login
- `klassekart/klassekart.js` — classroom seating map tool, loaded on every page but only activated (`startKlassekartModus()`) after successful teacher login

### Data flow
`data/ukeplan.json` and `data/proveplan.json` are the source of truth. Pages fetch them at runtime from the GitHub raw URL:
```
https://raw.githubusercontent.com/asandven/pus-portal/main/data/
```
To update weekly content, edit the JSON files and push to `main`. Fields in `ukeplan.json`: `uke`, `oppdatert`, `meldinger[]`, `prover[]`, `timeplan[]` (rows with `tid`, `mandag`–`fredag`), `lekser[]` (with `fag`, `tema`, `lekse`, `laringsmal[]`).

### Teacher login
`script.js` contains SHA-256 hashed PINs. On correct PIN, `visLaererSone()` is called, which invokes `startKlassekartModus()` — this replaces `document.body.innerHTML` entirely with the classroom map UI.

### Matte-agent backend
`matte-agent/index.html` connects to a Raspberry Pi proxy at `https://raspberrypi.tail063df7.ts.net/chat` (Tailscale). The backend forwards to the Claude API with a cached system prompt. The page keeps the last 6 messages in `history[]` for context.
