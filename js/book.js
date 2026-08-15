/* =====================================================================
   3D Flip-Book CV · js/book.js
   Sheet flipping (click / buttons / keyboard) + cursor tilt + progress
   ===================================================================== */
(() => {
  'use strict';

  const book = document.getElementById('book');
  if (!book) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const sheets = [...book.querySelectorAll('.sheet')];
  const N = sheets.length;

  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const indicator = document.getElementById('page-indicator');

  // one entry per flip position: what becomes visible after that many flips
  const pageNames = ['Cover', 'Profile', 'Toolbox', 'Experience', 'The End'];

  let current = 0; // number of flipped sheets

  /* --- stacking: unflipped sheets sit top-down, flipped sheets bottom-up --- */
  function restack() {
    sheets.forEach((sheet, i) => {
      sheet.style.zIndex = sheet.classList.contains('flipped') ? i : N - i;
    });
  }

  /* --- keep the flipping sheet above everything mid-animation --- */
  function flip(sheet, toFlipped) {
    sheet.style.zIndex = N + 2;
    sheet.classList.toggle('flipped', toFlipped);
    if (reduceMotion) {
      sheet.style.zIndex = toFlipped ? sheets.indexOf(sheet) : N - sheets.indexOf(sheet);
      restackSoon();
    }
    sheet.addEventListener('transitionend', function done() {
      sheet.removeEventListener('transitionend', done);
      restack();
      updateControls();
    });
  }

  let restackTimer;
  function restackSoon() {
    clearTimeout(restackTimer);
    restackTimer = setTimeout(restack, 60);
  }

  function goNext() {
    if (current >= N) return;
    flip(sheets[current], true);
    current++;
    updateControls();
  }

  function goPrev() {
    if (current <= 0) return;
    current--;
    flip(sheets[current], false);
    updateControls();
  }

  function updateControls() {
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === N;
    if (indicator) indicator.textContent = pageNames[Math.min(current, pageNames.length - 1)];
  }

  nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
  prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
  });

  /* click the book itself: right half = forward, left half = back */
  book.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return; // let links act naturally
    const r = book.getBoundingClientRect();
    (e.clientX - r.left) / r.width > 0.35 ? goNext() : goPrev();
  });

  /* swipe support for touch */
  let touchX = null;
  book.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) (dx < 0 ? goNext : goPrev)();
    touchX = null;
  }, { passive: true });

  /* --- subtle 3D tilt following the cursor --- */
  if (!isTouch && !reduceMotion) {
    const stage = book.closest('.book-viewport') || book.parentElement;
    stage.addEventListener('mousemove', (e) => {
      const r = book.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      book.classList.add('is-tilting');
      book.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
    });
    stage.addEventListener('mouseleave', () => {
      book.classList.remove('is-tilting');
      book.style.transform = '';
    });
  }

  /* --- entrance: drop the book in --- */
  if (!reduceMotion) {
    book.style.opacity = '0';
    book.style.transform = 'translateY(50px) scale(0.9)';
    book.style.transition = 'opacity 0.9s cubic-bezier(0.5,0,0,1), transform 0.9s cubic-bezier(0.5,0,0,1)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      book.style.opacity = '1';
      book.style.transform = '';
      setTimeout(() => { // hand transition control back to tilt mode
        book.style.transition = '';
      }, 950);
    }));
  }

  restack();
  updateControls();
})();
