# Master Plan — 3D Animated Personal Portfolio (Royal Emerald & Gold Edition)

## 1. Goal & Stack
- Modern, dynamic, fully cinematic 3D scrolling portfolio for A.K.M Faridul Alam.
- Palette: Royal Emerald (`#10b981`) & Rich Gold (`#f59e0b`) luxury aesthetic.
- Stack: Semantic HTML5, CSS3 (SCSS source), Vanilla JavaScript (ES6+), WebGL/Three.js. No unnecessary dependencies.

## 2. Codebase Optimization & Polish (Completed)
- **Palette & Theme**: Replaced neon cyan/pink with luxury Royal Emerald (`#10b981`) & Gold (`#f59e0b`) theme, supporting both Dark and Light modes with seamless switching.
- **Cinematic 3D Scrolling**: Added smooth quintic 60fps anchor scrolling, Three.js scroll-driven camera dolly, hero 3D scrub and blur fade, card 3D tilt with specular glare, and draw-on gold timeline thread.
- **3D Skill Sphere**: Fibonacci lattice sphere with scroll velocity acceleration boost and added mobile touch/swipe interaction for phones and tablets.
- **CV Download Button**: Standardized `download="AKM_Faridul_Alam_CV.pdf"` across all 4 CV buttons (Nav, Hero, Contact, FAB, and Book CV) with programmatic download fallback to prevent mobile browser inline blocking.
- **A11y & Form**: Formspree integration with fallback to formatted `mailto:` client opening; full ARIA roles and labels, keyboard-navigable navigation and mobile drawer with Escape key support.
- **Performance**: Spatial-hash collision grid for WebGL line segments, debounced resize handling, tab visibility pause to conserve CPU and battery.

## 3. Architecture
```text
[index.html | book.html] semantic HTML5
  → [scss/main.scss → css/main.css] + [css/book.css] theme vars
  → [js/main.js] loader/theme/nav/reveal/tilt/form/sphere/Three bg/smooth-scroll/CV handler
  → [js/book.js] flip-book state machine (spread/desktop, single/mobile)
  → [Three.js WebGL] #bg-canvas particle network (emerald nodes + gold starfield)
  → [Assets] Photo.jpg, AKM_Faridul_Alam_CV_With_Photo_final.pdf, localStorage
```
- `main.js` shared; `book.js` only on Book CV.
- Theme via `:root` / `[data-theme=light]`; `__setBgTheme()` dynamically recolors particles.

## 4. Validation
- [x] Luxury Royal Emerald & Gold primary palette implemented
- [x] Full cinematic 3D scrolling animations & smooth easing
- [x] Fully responsive across all devices (mobile, tablet, desktop)
- [x] Download CV button tested, verified, and enhanced cross-browser
- [x] Codebase optimized, cleaned, and thoroughly polished
