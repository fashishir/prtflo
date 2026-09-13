# Master Plan — 3D Animated Personal Portfolio

## 1. Goal & Stack
- Modern, dynamic, fully responsive 3D portfolio for A.K.M Faridul Alam.
- Stack only: HTML5, CSS3 (SCSS source), JavaScript, WebGL/Three.js. No new libs.

## 2. Codebase Cleanup (done)
- Removed prod placeholder `formspree.io/f/YOUR_ID`; form now uses `data-formspree` + validated `mailto:` fallback.
- Fixed `mailto:` newline encoding (`\n` was literal `\\n`), added required-field validation.
- A11y: `div.hamburger` → `button` + `aria-expanded`/`aria-controls`, `aria-hidden` canvas/progress, `aria-pressed` sound toggle.
- Fixed scroll divide-by-zero, null-safe menu toggle, safe `localStorage` wrappers.
- Removed double ripple binding (`.btn,.fab`); single `.ripple` target.
- Copy fix: p-transbd.com description grammar/tech names.
- 3D perf: particle count 160/80 → 130/70, DPR cap 2 → 1.75, O(N²) lines → spatial-grid + rebuild every 3rd frame, pause on `visibilitychange`, respects `prefers-reduced-motion`.

## 3. Architecture
```text
[index.html | book.html] semantic HTML5
  → [scss/main.scss → css/main.css] + [css/book.css] theme vars
  → [js/main.js] loader/theme/nav/reveal/tilt/form/sphere/Three bg
  → [js/book.js] flip-book state machine (spread/desktop, single/mobile)
  → [Three.js WebGL] #bg-canvas particle network
  → [Assets] Photo.jpg, Resume PDF, Formspree opt-in, localStorage
```
- `main.js` shared; `book.js` only on Book CV.
- Theme via `:root` / `[data-theme=light]`; `__setBgTheme()` recolors particles.

## 4. Implementation Outline
- **Hero:** typed roles, CTA row, photo ring + float chips, mouse parallax.
- **Experience:** vertical timeline, `IntersectionObserver` reveal.
- **Projects:** tilt + glare cards, lazy images.
- **Skills:** CSS-3D rotating sphere + tag cloud.
- **Contact:** info rows, socials, Formspree-or-mailto form, live status.
- **Book CV:** 7 steps (Cover/Profile/Toolbox/Experience/Projects/Contact/End), arrows/keyboard/swipe/dots, sound + fullscreen + tilt.
- **Global:** loader, progress bar, cursor glow (fine-pointer only), back-to-top.

## 5. Cleaned Snippets
```html
<canvas id="bg-canvas" aria-hidden="true"></canvas>
<button class="hamburger" aria-expanded="false" aria-controls="nav-links"><span></span><span></span><span></span></button>
<form id="contact-form" method="POST" novalidate></form>
```
```css
:root{--bg:#050507;--text:#f5f7fa;--accent:#00e5ff}
.hero h1{font-size:clamp(2rem,5vw,3.6rem)}
@media(max-width:768px){.hero{flex-direction:column-reverse;text-align:center}}
```
```js
const COUNT = innerWidth < 768 ? 70 : 130; // DPR ≤ 1.75, grid lines, pause when hidden
```

## 6. Responsive / A11y / Perf
- Breakpoints 1024/768/480; drawer nav; sphere 420→320→260px; `clamp()` type; `overflow-x:hidden`.
- Keyboard focus visible, touch disables tilt/glow, reduced-motion disables 3D/audio.
- Compressed Sass (`--no-source-map`), deferred Three.js, lazy below-fold media.

## 7. Timeline (11 days)
- **D1:** audit, gitignore, README, Lighthouse baseline.
- **D1-2:** hygiene + a11y + form (done above).
- **D3-5:** 3D core perf + scroll camera + sphere/book polish (done above).
- **D6-8:** sections content + Book CV chapters.
- **D9-10:** responsive/a11y/perf pass, contrast + keyboard audit.
- **D11:** `npm run build`, preview `npx serve . -l 5173`, Lighthouse ≥90, tag release.

## 8. Validation
- [x] Bad code removed, modular, no dead code
- [x] Phases/tasks/timelines defined
- [x] Stack HTML5/CSS3/JS/WebGL only
- [x] Responsive + reduced-motion documented
- [x] Markdown formatted, concise
