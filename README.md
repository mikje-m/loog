# Loog

A free, offline, fully customizable workout tracker. Build your own exercises and workouts, log sets fast between sets, and see whether you are getting stronger. No account, no server, no paywall.

**Use it:** open https://mikje-m.github.io/loog/ on your phone and choose *Add to Home screen*. Everyone who opens the link gets their own private copy: all data stays in that phone's browser storage (IndexedDB). Settings → Export / Import moves it to another device.

The spec is [`docs/loog-handoff.md`](docs/loog-handoff.md), with the design tokens and the 62 approved reference screens in `docs/`.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # PRs, volume, suggestions, goals, chart periods, formatting
npm run build    # production build in dist/
npm run icons    # regenerate the PNG app icons from public/icon.svg
```

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Stack

React + TypeScript, Vite, vite-plugin-pwa, Dexie (IndexedDB), React Router, dnd-kit, self-hosted Lexend Deca. Styling is plain CSS on the Loog tokens (`src/styles/tokens.css`).

Open product questions from the handoff are marked `TODO(Mike)` in the code.
