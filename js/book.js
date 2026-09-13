/* =====================================================================
   3D Flip-Book CV · js/book.js
   Responsive 3D Flip System (Desktop 2-Page Spread + Mobile Single-Page)
   Keyboard / Swipes / Dots / Sound FX / Fullscreen / 3D Tilt
   ===================================================================== */
(() => {
  'use strict';

  const book = document.getElementById('book');
  if (!book) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sheets = [...book.querySelectorAll('.sheet')];
  const N = sheets.length; // 4 sheets total

  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const indicator = document.getElementById('page-indicator');
  const dotsNav = document.getElementById('book-dots');
  const dotBtns = [...(dotsNav ? dotsNav.querySelectorAll('.dot-btn') : [])];
  const soundBtn = document.getElementById('sound-toggle');
  const fsBtn = document.getElementById('fullscreen-toggle');
  const stage = book.closest('.book-viewport') || book.parentElement;

  /* --- 7 logical step positions ---
     0: Cover (Sheet 0 Front)
     1: Page 01 · Profile (Sheet 1 Front)
     2: Page 02 · Toolbox (Sheet 1 Back)
     3: Page 03 · Experience (Sheet 2 Front)
     4: Page 04 · Projects (Sheet 2 Back)
     5: Page 05 · Contact (Sheet 3 Front)
     6: End · Back Cover (Sheet 3 Back)
  */
  const stepMeta = [
    { title: 'Cover',          flippedCount: 0, spread: 'cover', mobileView: 'right' },
    { title: '01 · Profile',    flippedCount: 1, spread: 'open',  mobileView: 'right' },
    { title: '02 · Toolbox',    flippedCount: 2, spread: 'open',  mobileView: 'left'  },
    { title: '03 · Experience', flippedCount: 2, spread: 'open',  mobileView: 'right' },
    { title: '04 · Projects',   flippedCount: 3, spread: 'open',  mobileView: 'left'  },
    { title: '05 · Contact',    flippedCount: 3, spread: 'open',  mobileView: 'right' },
    { title: 'The End',        flippedCount: 4, spread: 'end',   mobileView: 'left'  }
  ];

  let currentStep = 0;
  let isMobile = window.innerWidth <= 768;

  // Sound effect state (stored in localStorage)
  const readSound = () => { try { return localStorage.getItem('book_sound'); } catch { return null; } };
  const writeSound = (v) => { try { localStorage.setItem('book_sound', v); } catch { /* private mode */ } };
  let soundEnabled = readSound() !== 'muted';
  if (soundBtn) {
    soundBtn.classList.toggle('muted', !soundEnabled);
    soundBtn.setAttribute('title', soundEnabled ? 'Mute audio' : 'Enable audio');
    soundBtn.setAttribute('aria-pressed', String(soundEnabled));
  }

  /* ---------------------------------------------------------------
     1. SYNTHESIZED PAPER FLIP SOUND (Web Audio API)
  --------------------------------------------------------------- */
  let audioCtx = null;
  function playPaperSound() {
    if (!soundEnabled || reduceMotion) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const duration = 0.14;
      const bufferSize = Math.floor(audioCtx.sampleRate * duration);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate organic pinkish noise burst for paper flutter
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.5362;
        const env = Math.sin((i / bufferSize) * Math.PI) * Math.exp(-i / (bufferSize * 0.45));
        data[i] = pink * env * 0.4;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + duration);
      filter.Q.setValueAtTime(1.8, audioCtx.currentTime);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
    } catch (e) {
      // AudioContext unavailable or blocked
    }
  }

  /* ---------------------------------------------------------------
     2. SHEET STACKING & Z-INDEX MANAGEMENT
  --------------------------------------------------------------- */
  function restack() {
    sheets.forEach((sheet, i) => {
      const isFlipped = sheet.classList.contains('flipped');
      sheet.style.zIndex = isFlipped ? i + 1 : N - i;
    });
  }

  /* ---------------------------------------------------------------
     3. STEP NAVIGATION & FLIP EXECUTION
  --------------------------------------------------------------- */
  function goToStep(targetStep, playAudio = true) {
    const next = Math.max(0, Math.min(stepMeta.length - 1, targetStep));
    if (next === currentStep && document.body.dataset.bookInitialized) return;
    document.body.dataset.bookInitialized = 'true';

    const prevFlippedCount = stepMeta[currentStep].flippedCount;
    const targetFlippedCount = stepMeta[next].flippedCount;
    const sheetFlipping = targetFlippedCount !== prevFlippedCount;

    if (sheetFlipping && playAudio) {
      playPaperSound();
    }

    currentStep = next;
    const meta = stepMeta[currentStep];

    // Update book dataset attributes for CSS translation & layout
    book.setAttribute('data-spread', meta.spread);
    book.setAttribute('data-mobile-view', meta.mobileView);

    // Apply flip classes to all sheets
    sheets.forEach((sheet, idx) => {
      const shouldFlip = idx < targetFlippedCount;
      const isCurrentlyFlipped = sheet.classList.contains('flipped');

      if (shouldFlip !== isCurrentlyFlipped) {
        // Bring active animating sheet to top during transition
        sheet.style.zIndex = N + 5;
        sheet.classList.toggle('flipped', shouldFlip);

        const onTransitionEnd = () => {
          sheet.removeEventListener('transitionend', onTransitionEnd);
          restack();
        };
        sheet.addEventListener('transitionend', onTransitionEnd, { once: true });
      }
    });

    if (reduceMotion) restack();
    updateControls();
  }

  function goNext() {
    isMobile = window.innerWidth <= 768;
    if (isMobile) {
      goToStep(currentStep + 1);
    } else {
      // On desktop spread: jump to next spread
      if (currentStep === 0) goToStep(1);
      else if (currentStep === 1 || currentStep === 2) goToStep(3);
      else if (currentStep === 3 || currentStep === 4) goToStep(5);
      else if (currentStep === 5) goToStep(6);
    }
  }

  function goPrev() {
    isMobile = window.innerWidth <= 768;
    if (isMobile) {
      goToStep(currentStep - 1);
    } else {
      // On desktop spread: jump to prev spread
      if (currentStep === 6) goToStep(5);
      else if (currentStep === 5 || currentStep === 4) goToStep(3);
      else if (currentStep === 3 || currentStep === 2) goToStep(1);
      else if (currentStep === 1) goToStep(0);
    }
  }

  /* ---------------------------------------------------------------
     4. UPDATE UI CONTROLS & PAGINATION
  --------------------------------------------------------------- */
  function updateControls() {
    const isFirst = currentStep === 0;
    const isLast = currentStep === stepMeta.length - 1;

    if (prevBtn) prevBtn.disabled = isFirst;
    if (nextBtn) nextBtn.disabled = isLast;

    if (indicator) {
      indicator.textContent = stepMeta[currentStep].title;
    }

    // Update dot buttons active state
    dotBtns.forEach((btn, idx) => {
      const stepIdx = parseInt(btn.getAttribute('data-step'), 10);
      let isActive = false;
      if (isMobile) {
        isActive = stepIdx === currentStep;
      } else {
        if (currentStep === 0 && stepIdx === 0) isActive = true;
        else if ((currentStep === 1 || currentStep === 2) && (stepIdx === 1 || stepIdx === 2)) isActive = (stepIdx === 1);
        else if ((currentStep === 3 || currentStep === 4) && (stepIdx === 3 || stepIdx === 4)) isActive = (stepIdx === 3);
        else if ((currentStep === 5) && stepIdx === 5) isActive = true;
        else if (currentStep === 6 && stepIdx === 6) isActive = true;
      }
      btn.classList.toggle('active', isActive);
      if (isActive) {
        btn.setAttribute('aria-current', 'step');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
  }

  /* ---------------------------------------------------------------
     5. EVENT LISTENERS
  --------------------------------------------------------------- */
  nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
  prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });

  // Dot button clicks
  dotBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = parseInt(btn.getAttribute('data-step'), 10);
      goToStep(target);
    });
  });

  // Table of contents inside front cover clicks
  document.querySelectorAll('.inner-toc li[data-nav-target]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = parseInt(item.getAttribute('data-nav-target'), 10);
      goToStep(target);
    });
  });

  // Sound toggle button
  soundBtn?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    writeSound(soundEnabled ? 'on' : 'muted');
    soundBtn.classList.toggle('muted', !soundEnabled);
    soundBtn.setAttribute('title', soundEnabled ? 'Mute audio' : 'Enable audio');
    soundBtn.setAttribute('aria-pressed', String(soundEnabled));
    if (soundEnabled) playPaperSound();
  });

  // Fullscreen toggle button
  fsBtn?.addEventListener('click', () => {
    const fsTarget = document.querySelector('.book-stage') || document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (fsTarget.requestFullscreen) {
        fsTarget.requestFullscreen().catch(() => {});
      } else if (fsTarget.webkitRequestFullscreen) {
        fsTarget.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  });

  const onFsChange = () => {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    fsBtn?.classList.toggle('in-fs', isFs);
    fsBtn?.setAttribute('title', isFs ? 'Exit fullscreen' : 'Enter fullscreen');
  };
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToStep(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToStep(stepMeta.length - 1);
    }
  });

  // Book Click: right half = next, left half = prev
  book.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, .inner-toc li')) return; // permit direct links/buttons
    const r = book.getBoundingClientRect();
    const isRightHalf = (e.clientX - r.left) / r.width > 0.35;
    isRightHalf ? goNext() : goPrev();
  });

  // Touch Swipe Support
  let touchStartX = null;
  let touchStartY = null;
  book.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  book.addEventListener('touchend', (e) => {
    if (touchStartX === null || touchStartY === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // ensure horizontal swipe dominates vertical scrolling
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX = null;
    touchStartY = null;
  }, { passive: true });

  // Smooth 3D tilt tracking cursor via CSS custom properties
  if (!reduceMotion && stage) {
    let ticking = false;
    stage.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 768) return; // avoid tilt on touch/mobile
      if (!ticking) {
        requestAnimationFrame(() => {
          const r = book.getBoundingClientRect();
          const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          book.classList.add('is-tilting');
          book.style.setProperty('--tilt-ry', `${Math.max(-1, Math.min(1, x)) * 6.5}deg`);
          book.style.setProperty('--tilt-rx', `${Math.max(-1, Math.min(1, -y)) * 6.5}deg`);
          ticking = false;
        });
        ticking = true;
      }
    });

    stage.addEventListener('mouseleave', () => {
      book.classList.remove('is-tilting');
      book.style.setProperty('--tilt-ry', '0deg');
      book.style.setProperty('--tilt-rx', '0deg');
    });
  }

  // Handle window resize dynamically
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const wasMobile = isMobile;
      isMobile = window.innerWidth <= 768;
      if (wasMobile !== isMobile) {
        goToStep(currentStep, false);
      }
    }, 150);
  });

  /* ---------------------------------------------------------------
     6. INITIALIZATION & ENTRANCE ANIMATION
  --------------------------------------------------------------- */
  goToStep(0, false);
  restack();

  if (!reduceMotion) {
    book.style.opacity = '0';
    book.style.transform = 'translateY(40px) scale(0.94)';
    book.style.transition = 'opacity 0.8s cubic-bezier(0.5,0,0,1), transform 0.8s cubic-bezier(0.5,0,0,1)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        book.style.opacity = '1';
        book.style.transform = '';
        setTimeout(() => {
          book.style.transition = '';
        }, 850);
      });
    });
  }
})();
