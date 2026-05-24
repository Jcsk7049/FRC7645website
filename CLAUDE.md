# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server (Vite HMR)
npm run build        # Production build → dist/
npm run lint         # ESLint
npm run preview      # Preview production build locally

firebase deploy --only hosting            # Deploy to Firebase Hosting (team7645.web.app)
firebase deploy --only firestore:rules    # Deploy Firestore security rules
```

Environment variables are in `.env` (VITE_ prefix). See `.env.example` for required keys:
`VITE_FIREBASE_*` (6 fields), `VITE_TBA_KEY` (The Blue Alliance API).

## Architecture

**Stack:** React 19 + Vite 8 SPA, Firebase (Auth / Firestore / Storage / Hosting), React Router v7, i18next (zh/en).

### App-level state (App.jsx)

Two `onSnapshot` listeners run at the top of `App.jsx` and pass data down as props:
- `settings/socials` → floating sidebar + footer social links
- `divisions` collection → `<Navbar divisions={divisions} />` (avoids Navbar dropdown flicker on open)

All routes are declared in `App.jsx`. Unknown paths redirect to `/`.

### Firestore collections

| Collection | Purpose |
|---|---|
| `robots/{year}` | Robot specs per season |
| `blog/{postId}` | Blog posts (markdown body) |
| `sponsors/{sponsorId}` | Sponsor listings |
| `bento_cards/{id}` | Homepage bento grid cards |
| `pages/about` | Team overview page content (hero, history, values) |
| `divisions/{divId}` | Team sub-groups; has `name`, `name_en`, `desc`, `desc_en`, `order`, `coverUrl` |
| `mentors/{mentorId}` | Team mentors; `endYear` present = retired |
| `settings/socials` | Social URLs: `instagram`, `facebook`, `youtube`, `github`, `twitter`, `tba`, `first` |
| `settings/contact` | Contact info + sponsorship tiers |
| `users/{uid}` | Role: `admin` / `teacher` / `student` (also `students` — legacy alias) |
| `gallery/{photoId}` | Gallery photos |

Firestore uses **IndexedDB persistence** (`persistentLocalCache`) — first render may serve cached data, then update from network.

### Roles and access

Three roles: `admin` > `teacher` > `student`/`students`. CMS (`/cms`) and Admin (`/admin`) are accessible to `admin` and `teacher`. Firestore rules enforce this server-side.

### i18n

Two locale files: `src/locales/zh.json` (default) and `src/locales/en.json`. Language is stored in `localStorage("lang")`.

**Critical gotcha — TDZ crash:** In any component that imports `i18n` at module level AND uses `useTranslation()`, do **not** destructure `i18n` from the hook (i.e. don't write `const { t, i18n } = useTranslation()`). The module-level `import i18n from "../i18n"` and the hook's `i18n` share the same name in scope, causing a Temporal Dead Zone crash if the `useState(i18n.language)` call appears before the `const { ..., i18n }` line. Pattern used in `Navbar.jsx`: `const { t } = useTranslation()` + module-level `import i18n from "../i18n"` for direct language checks.

### TiptapEditor

`src/components/TiptapEditor.jsx` is the shared WYSIWYG editor. It uses `tiptap-markdown` to store/output Markdown (not HTML). **Always configure** `StarterKit.configure({ link: false })` — StarterKit v3 includes Link internally; adding `@tiptap/extension-link` without disabling it in StarterKit causes a duplicate-extension warning and broken behavior.

Accepts `onImageUpload` callback (async → URL) for in-editor image uploads to Firebase Storage.

### Rich text rendering

Blog posts and division pages render their stored markdown with `react-markdown` + `remark-gfm` using the class `blog-body-text` for scoped prose styles.

### Bento card links (Home.jsx)

Link field logic:
- Starts with `http://` or `https://` → `<a target="_blank" rel="noopener noreferrer">`
- Any other non-empty string → internal `<Link>` (auto-prepends `/` if missing)
- Empty → non-clickable `<div>`

### Auto-translate

`src/lib/translate.js` uses the MyMemory free API (no key, ~500 chars/request limit, chunked). Used in CMS to auto-fill EN fields from ZH content.

### The Blue Alliance (TBA)

`src/lib/tba.js` wraps TBA API v3 calls for team `frc7645`. Used in `RobotDetail.jsx` and `CMS.jsx` to fetch competition events, status, and awards by year.

### 3D Robot Viewer

`RobotDetail.jsx` uses `@react-three/fiber` + `@react-three/drei` to render `.glb` models stored in Firebase Storage. The viewer supports explode/assemble animation.
