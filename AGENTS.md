# Tenangin — Agent Guide

## Stack
Pure HTML/CSS/JS. No build tools, no package manager, no framework, no tests, no linter.
Font: `Plus Jakarta Sans` (Google Fonts). Icons: `@phosphor-icons/web` (CDN).

## Run
Open with VS Code Live Server on `http://127.0.0.1:5500/index.html`. No install needed.

## Pages & Entrypoints
| Page | File | JS |
|------|------|----|
| Chat (home) | `index.html` | `script.js` |
| Psikolog | `psikolog.html` | `script.js` (shared) |
| Koleksi | `koleksi.html` | `script.js` + `koleksi.js` |
| Pencarian | `pencarian.html` | `script.js` (shared) |
| Auth (login/register) | `features/auth/` | `features/auth/auth.js` |
| Profile | `features/profile/` | `features/profile/profile.js` |
| Psikolog Detail | `features/psikolog/detail.html` | `features/psikolog/psikolog.js` |

All pages share the same sidebar HTML (not a Web Component — `components/app-sidebar.js` is unused).

## Persistence
Everything is **localStorage** — no backend:
- `tenangin_conversations` — chat history + messages
- `tenangin_active_user` — logged-in user `{name, email}`
- `tenangin_koleksi` — saved image/chat assets

## AI Chat
Uses **Gemini 2.5 Flash** via hardcoded API key in `script.js:92` (model: `gemini-2.5-flash`).
The key is exposed client-side — do not commit real keys.

## Git Workflow
- `main` — stable only
- `dev` — integration branch
- `feature/*` — per-feature branches (e.g. `feature/login-page`)
- PR from `feature/*` → `dev`

## CSS Quirks
- `assets/css/variables.css`, `global.css`, `reset.css` are **empty files** (README structure never implemented). All styles live in root `style.css` (2700 lines). Do not create new CSS variables there — use hardcoded green tones (`#0C3932`, `#5E938B`, `#77A19B`, `#346762`, `#44726B`) consistent with existing file.
- Design system: green/teal palette, `Plus Jakarta Sans`, `border-radius: 12px/20px`, box-shadow pattern `0px 5px 10px 0px #0C39321A`.
