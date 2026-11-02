/* =====================================================================
   A.K.M Faridul Alam — Portfolio · main.js
   Premium 3D Cinematic Scrolling Experience
   3D Style Mouse Cursor · Section-Morphing 3D Models · Three.js Camera Flight
   Interactive 3D Skill Sphere · Magnetic Buttons · Smooth Quintic Scroll ·
   Reliable CV Download Engine · Theme Synchronization
   ===================================================================== */
(() => {
  'use strict';

  // Mark JS enabled for CSS gating
  document.documentElement.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isTouch = !finePointer;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  /* ---------------------------------------------------------------
      SHARED CINEMATIC STATE (scroll pipeline <-> Three.js <-> models)
   --------------------------------------------------------------- */
  const FX = {
    scrollY: 0,
    progress: 0,       // 0..1 across page
    heroTgt: 0,        // hero scrub target 0..1
    camZ: 320,         // Three.js camera dolly target
    boost: 0,          // skills-sphere velocity boost
    activeSection: 'home',
  };

  /* ---------------------------------------------------------------
      0. PAGE LOADER
   --------------------------------------------------------------- */
  const loader = $('#page-loader');
  const hideLoader = () => {
    if (!loader) return;
    loader.classList.add('loaded');
    setTimeout(() => loader.remove(), 700);
  };
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);

  /* ---------------------------------------------------------------
      0.1 FULLY 3D STYLE MOUSE CURSOR (fine pointers only)
   --------------------------------------------------------------- */
  const cursorDot = $('#cursor-dot');
  const cursorRing = $('#cursor-ring');
  const cursorGlow = $('#cursor-glow');

  if (!isTouch && !reduceMotion) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    let glowX = mouseX, glowY = mouseY;
    let velX = 0, velY = 0;
    let prevMouseX = mouseX, prevMouseY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorDot) {
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
      }
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      cursorRing?.classList.add('active');
    });

    window.addEventListener('mouseup', () => {
      cursorRing?.classList.remove('active');
    });

    // Detect hover over interactive elements
    const interactiveSelector = 'a, button, input, textarea, .btn, .project-card, .skill-tag, .exp-card, .tilt, [role="button"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelector)) {
        cursorRing?.classList.add('hovered');
        cursorDot?.classList.add('hovered');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelector)) {
        cursorRing?.classList.remove('hovered');
        cursorDot?.classList.remove('hovered');
      }
    });

    // Animate ring and glow with 3D gyroscopic tilt
    const animateCursor = () => {
      velX = mouseX - prevMouseX;
      velY = mouseY - prevMouseY;
      prevMouseX = mouseX;
      prevMouseY = mouseY;

      ringX = lerp(ringX, mouseX, 0.18);
      ringY = lerp(ringY, mouseY, 0.18);

      glowX = lerp(glowX, mouseX, 0.08);
      glowY = lerp(glowY, mouseY, 0.08);

      // 3D gyroscopic rotation based on velocity
      const tiltX = clamp(-velY * 1.6, -30, 30);
      const tiltY = clamp(velX * 1.6, -30, 30);

      if (cursorRing) {
        cursorRing.style.left = `${ringX}px`;
        cursorRing.style.top = `${ringY}px`;
        cursorRing.style.transform = `translate(-50%, -50%) perspective(400px) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg)`;
      }

      if (cursorGlow) {
        cursorGlow.style.left = `${glowX}px`;
        cursorGlow.style.top = `${glowY}px`;
      }

      requestAnimationFrame(animateCursor);
    };
    animateCursor();
  }

  /* ---------------------------------------------------------------
      1. THEME TOGGLE (persisted + aria-pressed + 3D recolor)
   --------------------------------------------------------------- */
  const themeBtn = $('#theme-toggle');
  const syncThemeBtn = () => {
    themeBtn?.setAttribute('aria-pressed',
      String(document.documentElement.getAttribute('data-theme') === 'light'));
  };
  const savedTheme = storage.get('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    syncThemeBtn();
  }
  themeBtn?.addEventListener('click', () => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const next = light ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    storage.set('theme', next);
    syncThemeBtn();
    window.__setBgTheme?.(next);
  });

  /* ---------------------------------------------------------------
      2. SCROLL PIPELINE (single rAF-batched handler)
   --------------------------------------------------------------- */
  const bar = $('#progress-bar');
  const nav = $('nav');
  const sections = $$('section[id], footer[id]');
  const navLinks = $$('.nav-links a');
  const topBtn = $('#back-to-top');
  const heroEl = $('.hero');
  const heroContent = $('.hero-content');
  const stageEl = $('.photo-stage');
  const timeline = $('.timeline');

  let heroH = heroEl ? heroEl.offsetHeight : 0;
  let lastY = 0;
  let dirtyScroll = true;

  function processScroll() {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
    FX.progress = clamp(FX.scrollY / max, 0, 1);

    if (bar) bar.style.width = `${(FX.progress * 100).toFixed(2)}%`;
    nav?.classList.toggle('scrolled', FX.scrollY > 30);
    if (topBtn) topBtn.classList.toggle('show', FX.scrollY > 400);

    // Active navigation highlight & section tracking
    let current = 'home';
    for (const sec of sections) {
      if (FX.scrollY >= sec.offsetTop - 160) current = sec.id;
    }
    FX.activeSection = current;

    for (const a of navLinks) {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    }

    // Hero 3D scroll scrub target
    FX.heroTgt = heroH > 0 ? clamp(FX.scrollY / (heroH * 0.85), 0, 1) : 0;

    // Three.js camera target calculation
    FX.camZ = 320 - FX.progress * 180;

    // Skill sphere speed boost based on scroll velocity
    FX.boost = Math.min(1.5, FX.boost + Math.abs(FX.scrollY - lastY) * 0.0015);
    lastY = FX.scrollY;

    // Ambient radial glow subtle parallax
    doc.style.setProperty('--parallax', `${(FX.scrollY * 0.12).toFixed(1)}px`);

    // Timeline gold trace fill
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const fill = clamp((window.innerHeight * 0.75 - r.top) / Math.max(1, r.height), 0, 1);
      const prev = Number(timeline.style.getPropertyValue('--fill')) || 0;
      if (Math.abs(fill - prev) > 0.004) timeline.style.setProperty('--fill', fill.toFixed(3));
    }
  }

  /* ---------------------------------------------------------------
      2.1 SMOOTHING LOOP — hero 3D fade/zoom/blur + photo stage
   --------------------------------------------------------------- */
  let loopRaf = 0;
  let heroCur = 0;
  let mx = 0, my = 0, mxT = 0, myT = 0;

  function stepSmoothing() {
    heroCur = lerp(heroCur, FX.heroTgt, 0.15);
    mx = lerp(mx, mxT, 0.09);
    my = lerp(my, myT, 0.09);
    FX.boost *= 0.92;

    if (heroContent) {
      const v = heroCur;
      heroContent.style.opacity = clamp(1.1 - v * 1.25, 0, 1).toFixed(3);
      heroContent.style.transform =
        `translate3d(0, ${(v * -75).toFixed(1)}px, ${(v * -50).toFixed(1)}px) scale(${(1 - v * 0.1).toFixed(4)})`;
      heroContent.style.filter = v < 0.004 ? '' : `blur(${(v * 8).toFixed(2)}px)`;
    }
    if (stageEl && !isTouch) {
      stageEl.style.transform =
        `rotateY(${(mx * 16 - heroCur * 10).toFixed(2)}deg) rotateX(${(-my * 16 + heroCur * 8).toFixed(2)}deg)`;
    }

    const settled =
      Math.abs(heroCur - FX.heroTgt) < 0.0015 &&
      Math.abs(mx - mxT) < 0.001 && Math.abs(my - myT) < 0.001 &&
      FX.boost < 0.004;
    return settled;
  }

  function tick() {
    loopRaf = 0;
    const hadWork = dirtyScroll;
    dirtyScroll = false;
    if (hadWork) processScroll();
    const settled = stepSmoothing();
    if (hadWork || !settled) loopRaf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (reduceMotion || loopRaf) return;
    loopRaf = requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', () => {
    FX.scrollY = window.scrollY;
    dirtyScroll = true;
    if (reduceMotion) processScroll();
    startLoop();
  }, { passive: true });

  // Initial trigger
  FX.scrollY = window.scrollY;
  processScroll();

  /* ---------------------------------------------------------------
      2.2 SMOOTH ANCHOR SCROLLING (Cinematic 60fps easing)
   --------------------------------------------------------------- */
  const smoothScrollTo = (targetY, duration = 800) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) < 2) return;
    let start = null;
    const step = (now) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 5);
      window.scrollTo(0, startY + diff * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const targetEl = $(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 70;
        const targetPos = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;
        smoothScrollTo(targetPos);
        setMenu(false);
      }
    });
  });

  if (topBtn) {
    topBtn.addEventListener('click', () => {
      smoothScrollTo(0, 900);
    });
  }

  /* ---------------------------------------------------------------
      3. MOBILE MENU
   --------------------------------------------------------------- */
  const burger = $('.hamburger');
  const menu = $('.nav-links');
  const setMenu = (open) => {
    menu?.classList.toggle('open', open);
    burger?.classList.toggle('active', open);
    burger?.setAttribute('aria-expanded', String(open));
  };
  burger?.addEventListener('click', () => setMenu(!menu?.classList.contains('open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu?.classList.contains('open')) {
      setMenu(false);
      burger?.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (menu?.classList.contains('open') && !e.target.closest('nav')) setMenu(false);
  });

  /* ---------------------------------------------------------------
      4. CINEMATIC REVEALS
   --------------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal, .reveal-group').forEach((el) => io.observe(el));

  $$('.reveal-group').forEach((group) => {
    [...group.children].forEach((child, i) => {
      child.style.setProperty('--d', `${Math.min(i * 90, 720)}ms`);
    });
  });

  /* ---------------------------------------------------------------
      5. TYPING EFFECT
   --------------------------------------------------------------- */
  const typeEl = $('#role');
  const roles = [
    'Software Engineer',
    'AI-Powered Full-Stack Developer',
    'Automation Engineer',
    'Web Application Architect'
  ];
  if (typeEl) {
    let r = 0, c = 0, deleting = false;
    const tickType = () => {
      const word = roles[r];
      typeEl.textContent = word.slice(0, c);
      if (!deleting && c < word.length) {
        c++;
        setTimeout(tickType, 80);
      } else if (!deleting && c === word.length) {
        deleting = true;
        setTimeout(tickType, 1800);
      } else if (deleting && c > 0) {
        c--;
        setTimeout(tickType, 40);
      } else {
        deleting = false;
        r = (r + 1) % roles.length;
        setTimeout(tickType, 300);
      }
    };
    setTimeout(tickType, 600);
  }

  /* ---------------------------------------------------------------
      6. DYNAMIC GREETING
   --------------------------------------------------------------- */
  const greet = $('#greeting');
  if (greet) {
    const h = new Date().getHours();
    greet.textContent = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
  }

  /* ---------------------------------------------------------------
      7. TILT CARDS (+ moving glare)
   --------------------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    $$('.tilt').forEach((card) => {
      const glare = card.querySelector('.glare');
      const MAX = 12;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform =
          `rotateY(${((px - 0.5) * MAX * 2).toFixed(2)}deg) rotateX(${((0.5 - py) * MAX * 2).toFixed(2)}deg) translateZ(8px)`;
        if (glare) {
          glare.style.setProperty('--mx', `${px * 100}%`);
          glare.style.setProperty('--my', `${py * 100}%`);
        }
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------
      7.1 HERO MOUSE TARGETS (stage 3D parallax)
   --------------------------------------------------------------- */
  if (heroEl && !isTouch && !reduceMotion) {
    heroEl.addEventListener('mousemove', (e) => {
      const r = heroEl.getBoundingClientRect();
      mxT = clamp((e.clientX - r.left) / r.width - 0.5, -0.6, 0.6);
      myT = clamp((e.clientY - r.top) / r.height - 0.5, -0.6, 0.6);
      startLoop();
    });
    heroEl.addEventListener('mouseleave', () => { mxT = 0; myT = 0; startLoop(); });
  }

  /* ---------------------------------------------------------------
      8. 3D SKILL SPHERE (Fibonacci lattice, mouse + touch interaction)
   --------------------------------------------------------------- */
  let relayoutSphere = null;
  if (!reduceMotion) {
    const sphere = $('#skill-sphere');
    if (sphere) {
      const tags = $$('.skill-tag', sphere);
      const N = tags.length;
      if (N) {
        const units = tags.map((_, i) => {
          const phi = Math.acos(-1 + (2 * i + 1) / N);
          const theta = Math.sqrt(N * Math.PI) * phi;
          return {
            x: Math.cos(theta) * Math.sin(phi),
            y: Math.sin(theta) * Math.sin(phi),
            z: Math.cos(phi),
          };
        });

        let R = sphere.offsetWidth / 2;
        relayoutSphere = () => { R = sphere.offsetWidth / 2; };

        let rx = 0.004, ry = 0.006;
        let ax = 0, ay = 0;
        let targetX = 0.004, targetY = 0.006;

        const zone = sphere.parentElement;

        if (zone) {
          if (!isTouch) {
            zone.addEventListener('mousemove', (e) => {
              const r = zone.getBoundingClientRect();
              targetY = ((e.clientX - r.left) / r.width - 0.5) * 0.04;
              targetX = -((e.clientY - r.top) / r.height - 0.5) * 0.04;
            });
            zone.addEventListener('mouseleave', () => { targetX = 0.004; targetY = 0.006; });
          } else {
            let touchStartX = 0, touchStartY = 0;
            zone.addEventListener('touchstart', (e) => {
              if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
              }
            }, { passive: true });

            zone.addEventListener('touchmove', (e) => {
              if (e.touches.length === 1) {
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                targetY = clamp(dx * 0.0008, -0.05, 0.05);
                targetX = clamp(-dy * 0.0008, -0.05, 0.05);
              }
            }, { passive: true });

            zone.addEventListener('touchend', () => {
              targetX = 0.004;
              targetY = 0.006;
            }, { passive: true });
          }
        }

        const render = () => {
          rx += (targetX - rx) * 0.05;
          ry += (targetY - ry) * 0.05;
          ax += rx;
          ay += ry * (1 + FX.boost * 0.5);
          const sinX = Math.sin(ax), cosX = Math.cos(ax);
          const sinY = Math.sin(ay), cosY = Math.cos(ay);

          for (let i = 0; i < N; i++) {
            const ux = units[i].x * R, uy = units[i].y * R, uz = units[i].z * R;
            let x = ux * cosY - uz * sinY;
            let z = ux * sinY + uz * cosY;
            let y = uy * cosX + z * sinX;
            z = -uy * sinX + z * cosX;

            const scale = (R * 1.6) / (R * 1.6 + z);
            const opacity = Math.max(0.25, (z + R) / (2 * R));
            const el = tags[i];
            el.style.transform =
              `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${scale.toFixed(3)})`;
            el.style.opacity = opacity.toFixed(2);
            el.style.zIndex = Math.round(scale * 100);
          }
          requestAnimationFrame(render);
        };

        sphere.classList.add('is-ready');
        render();
      }
    }
  }

  /* ---------------------------------------------------------------
      9. MAGNETIC BUTTONS (fine pointers)
   --------------------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.setProperty('--mx', `${(x * 8).toFixed(1)}px`);
        btn.style.setProperty('--my', `${(y * 8).toFixed(1)}px`);
        btn.style.transform = `translate(${(x * 6).toFixed(1)}px, ${(y * 6).toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
        btn.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------------
      10. CONTACT FORM
   --------------------------------------------------------------- */
  const form = $('#contact-form');
  if (form) {
    const status = $('#form-status');
    const endpointId = (form.dataset.formspree || '').trim();
    const usesFormspree = /^[a-zA-Z0-9]+$/.test(endpointId);
    const action = usesFormspree ? `https://formspree.io/f/${endpointId}` : '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const msg = String(data.get('message') || '').trim();
      status.className = 'form-status';

      if (!name || !email || !msg) {
        status.className = 'form-status err';
        status.textContent = 'Please complete your name, email and message.';
        return;
      }
      status.textContent = 'Sending message…';

      if (usesFormspree) {
        try {
          const res = await fetch(action, {
            method: 'POST',
            body: data,
            headers: { Accept: 'application/json' },
          });
          if (res.ok) {
            status.className = 'form-status ok';
            status.textContent = '✓ Thanks! Your message has been sent successfully.';
            form.reset();
          } else {
            throw new Error('Bad response');
          }
        } catch {
          status.className = 'form-status err';
          status.textContent = 'Something went wrong. Please email me directly at fashishir4@gmail.com.';
        }
      } else {
        const subject = encodeURIComponent(`Portfolio contact from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${msg}`);
        window.location.href = `mailto:fashishir4@gmail.com?subject=${subject}&body=${body}`;
        status.className = 'form-status ok';
        status.textContent = 'Opening your email client…';
      }
    });
  }

  /* ---------------------------------------------------------------
      11. RIPPLE EFFECT ON BUTTONS
   --------------------------------------------------------------- */
  $$('.ripple').forEach((el) => {
    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect();
      const span = document.createElement('span');
      span.className = 'ripple-span';
      const size = Math.max(rect.width, rect.height);
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(span);
      setTimeout(() => span.remove(), 650);
    });
  });

  /* ---------------------------------------------------------------
      12. CV DOWNLOAD VERIFICATION & FILE SIZE METADATA
   --------------------------------------------------------------- */
  $$('a[download]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      const filename = a.getAttribute('download') || 'AKM_Faridul_Alam_CV.pdf';
      if (!href) return;

      const tempLink = document.createElement('a');
      tempLink.href = href;
      tempLink.download = filename;
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      tempLink.click();
      setTimeout(() => tempLink.remove(), 200);
    });
  });

  const cvMeta = async () => {
    const badges = $$('.cv-meta');
    if (!badges.length) return;
    try {
      const res = await fetch('AKM_Faridul_Alam_CV_With_Photo_final.pdf', { method: 'HEAD' });
      if (!res.ok) return;
      const len = res.headers.get('content-length');
      const lm = res.headers.get('last-modified');
      const size = len ? `PDF · ${(Number(len) / 1024 / 1024).toFixed(1)} MB` : 'PDF';
      const date = lm ? new Date(lm).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';
      badges.forEach((b) => {
        b.textContent = date ? `${size} · ${date}` : size;
        b.setAttribute('title', `CV updated ${date || 'recently'}`);
      });
    } catch {
      // Fallback
    }
  };
  cvMeta();

  /* ---------------------------------------------------------------
      13. PREMIUM 3D ANIMATED SCROLLING BACKGROUND
          Changing 3D Models per Section + Splined Camera Flight
          + Dynamic Real-time Specular Point Lights + Nebula Space
   --------------------------------------------------------------- */
  function initThree() {
    if (typeof THREE === 'undefined') return;
    const canvas = $('#bg-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.0011);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 2200);
    camera.position.set(0, 0, 320);

    const isMobile = window.innerWidth < 768;

    const getAccent = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#10b981';
    const getAccent2 = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim() || '#f59e0b';

    /* ---- 3D LIGHTING ---- */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const emeraldLight = new THREE.PointLight(new THREE.Color(getAccent()), 3.5, 950);
    emeraldLight.position.set(80, 50, 160);
    scene.add(emeraldLight);

    const goldLight = new THREE.PointLight(new THREE.Color(getAccent2()), 3.0, 950);
    goldLight.position.set(-100, -80, 120);
    scene.add(goldLight);

    const indigoLight = new THREE.DirectionalLight(0x6366f1, 1.4);
    indigoLight.position.set(0, 200, -200);
    scene.add(indigoLight);

    /* =============================================================
       SECTION-SPECIFIC 3D MODELS
       1. Hero: Torus Knot Core + Inner Octahedron
       2. Experience: Double-ring Helix & Data Matrix
       3. Projects: Architectural Icosahedron + Orbiting Satellites
       4. Skills: Concentric Armillary Celestial Gyroscope
       5. Contact: Hyper-Dodecahedron & Radiating Signal Waves
       ============================================================= */
    const modelsGroup = new THREE.Group();
    scene.add(modelsGroup);

    // Shared Materials
    const emeraldMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(getAccent()),
      metalness: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75,
      wireframe: false,
    });

    const goldWireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAccent2()),
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    const emeraldWireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(getAccent()),
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    // 1. HERO MODEL: Torus Knot Core
    const modelHero = new THREE.Group();
    const heroKnotGeo = new THREE.TorusKnotGeometry(isMobile ? 36 : 46, isMobile ? 10 : 13, 140, 24, 2, 3);
    const heroKnotMesh = new THREE.Mesh(heroKnotGeo, emeraldMat);
    const heroWireMesh = new THREE.Mesh(heroKnotGeo, goldWireMat);
    const heroCoreGeo = new THREE.OctahedronGeometry(18, 0);
    const heroCore = new THREE.Mesh(heroCoreGeo, goldWireMat);
    modelHero.add(heroKnotMesh, heroWireMesh, heroCore);
    modelHero.position.set(isMobile ? 0 : 90, 0, 15);
    modelsGroup.add(modelHero);

    // 2. EXPERIENCE MODEL: Double Helix & Data Matrix
    const modelExp = new THREE.Group();
    const ringGeo1 = new THREE.TorusGeometry(isMobile ? 34 : 44, 2.5, 16, 80);
    const ring1 = new THREE.Mesh(ringGeo1, emeraldMat);
    ring1.rotation.x = Math.PI * 0.3;
    const ringGeo2 = new THREE.TorusGeometry(isMobile ? 34 : 44, 2.5, 16, 80);
    const ring2 = new THREE.Mesh(ringGeo2, goldWireMat);
    ring2.rotation.x = -Math.PI * 0.3;
    const cylGeo = new THREE.CylinderGeometry(18, 18, 90, 16, 8, true);
    const cylMesh = new THREE.Mesh(cylGeo, emeraldWireMat);
    modelExp.add(ring1, ring2, cylMesh);
    modelExp.position.set(isMobile ? 0 : -90, -280, 20);
    modelsGroup.add(modelExp);

    // 3. PROJECTS MODEL: Architectural Icosahedron + Orbiting Satellites
    const modelProjects = new THREE.Group();
    const icoGeo = new THREE.IcosahedronGeometry(isMobile ? 36 : 46, 0);
    const icoMesh = new THREE.Mesh(icoGeo, emeraldMat);
    const icoCage = new THREE.Mesh(new THREE.IcosahedronGeometry(isMobile ? 42 : 54, 1), goldWireMat);
    modelProjects.add(icoMesh, icoCage);

    const satellites = [];
    for (let s = 0; s < 4; s++) {
      const sat = new THREE.Mesh(new THREE.TetrahedronGeometry(7, 0), goldWireMat);
      sat.userData = { angle: (s * Math.PI) / 2, dist: isMobile ? 55 : 75, speed: 0.02 + s * 0.005 };
      modelProjects.add(sat);
      satellites.push(sat);
    }
    modelProjects.position.set(isMobile ? 0 : 90, -580, 15);
    modelsGroup.add(modelProjects);

    // 4. SKILLS MODEL: Concentric Armillary Gyroscope
    const modelSkills = new THREE.Group();
    const gyroRing1 = new THREE.Mesh(new THREE.TorusGeometry(isMobile ? 42 : 54, 2, 16, 80), emeraldMat);
    const gyroRing2 = new THREE.Mesh(new THREE.TorusGeometry(isMobile ? 35 : 44, 2, 16, 80), goldWireMat);
    gyroRing2.rotation.x = Math.PI / 2;
    const gyroRing3 = new THREE.Mesh(new THREE.TorusGeometry(isMobile ? 28 : 36, 2, 16, 80), emeraldWireMat);
    gyroRing3.rotation.y = Math.PI / 2;
    const gyroCore = new THREE.Mesh(new THREE.SphereGeometry(14, 20, 20), goldWireMat);
    modelSkills.add(gyroRing1, gyroRing2, gyroRing3, gyroCore);
    modelSkills.position.set(0, -880, 25);
    modelsGroup.add(modelSkills);

    // 5. CONTACT MODEL: Hyper-Dodecahedron & Radiating Beacon
    const modelContact = new THREE.Group();
    const dodecMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(isMobile ? 32 : 44, 0), emeraldMat);
    const dodecCage = new THREE.Mesh(new THREE.DodecahedronGeometry(isMobile ? 38 : 50, 1), goldWireMat);
    modelContact.add(dodecMesh, dodecCage);

    const waves = [];
    for (let w = 0; w < 3; w++) {
      const wave = new THREE.Mesh(
        new THREE.RingGeometry(isMobile ? 42 : 52, isMobile ? 45 : 55, 64),
        new THREE.MeshBasicMaterial({ color: getAccent(), transparent: true, opacity: 0.4, side: THREE.DoubleSide })
      );
      wave.rotation.x = Math.PI / 2;
      wave.userData = { phase: w * 0.33 };
      modelContact.add(wave);
      waves.push(wave);
    }
    modelContact.position.set(isMobile ? 0 : -85, -1180, 20);
    modelsGroup.add(modelContact);

    /* ---- AMBIENT FLOATING CRYSTALS ---- */
    const ambientPolyhedra = [];
    const polyGeos = [
      new THREE.OctahedronGeometry(6, 0),
      new THREE.TetrahedronGeometry(7, 0),
      new THREE.BoxGeometry(8, 8, 8),
    ];
    for (let p = 0; p < 22; p++) {
      const g = polyGeos[p % polyGeos.length];
      const m = new THREE.Mesh(g, p % 2 === 0 ? emeraldWireMat : goldWireMat);
      m.position.set(
        (Math.random() - 0.5) * 550,
        150 - Math.random() * 1400,
        (Math.random() - 0.5) * 350
      );
      m.userData = {
        rx: (Math.random() - 0.5) * 0.02,
        ry: (Math.random() - 0.5) * 0.02,
        baseY: m.position.y,
        floatSpeed: 0.5 + Math.random() * 1.5,
      };
      scene.add(m);
      ambientPolyhedra.push(m);
    }

    /* ---- FOREGROUND CONNECTED NODES ---- */
    const COUNT = isMobile ? 65 : 120;
    const positions = new Float32Array(COUNT * 3);
    const velocities = [];
    const SPREAD = 620;

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * SPREAD;
      positions[i * 3 + 1] = 100 - Math.random() * 1400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 320;
      velocities.push(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dotMat = new THREE.PointsMaterial({
      size: 3.2,
      color: new THREE.Color(getAccent()),
      transparent: true,
      opacity: 0.85,
    });
    const points = new THREE.Points(geo, dotMat);
    scene.add(points);

    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(getAccent()),
      transparent: true,
      opacity: 0.16,
    });
    const lineGeo = new THREE.BufferGeometry();
    const lineSeg = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSeg);

    /* ---- DEEP GOLD STARFIELD LAYER ---- */
    const STARS = isMobile ? 130 : 250;
    const starPos = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 1600;
      starPos[i * 3 + 1] = 200 - Math.random() * 1600;
      starPos[i * 3 + 2] = -700 + (Math.random() - 0.5) * 500;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.8,
      color: new THREE.Color(getAccent2()),
      transparent: true,
      opacity: 0.55,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* ---- THEME RECOLOR FUNCTION ---- */
    window.__setBgTheme = () => {
      const c1 = new THREE.Color(getAccent());
      const c2 = new THREE.Color(getAccent2());
      dotMat.color = c1;
      lineMat.color = c1;
      starMat.color = c2;
      emeraldMat.color = c1;
      goldWireMat.color = c2;
      emeraldWireMat.color = c1;
      emeraldLight.color = c1;
      goldLight.color = c2;
    };

    const mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5);
      mouse.y = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    /* Spatial Hash Connection Grid */
    const DIST = 92;
    const DIST2 = DIST * DIST;
    const CELL = DIST;
    const grid = new Map();

    function connect() {
      grid.clear();
      for (let i = 0; i < COUNT; i++) {
        const key = `${Math.floor(positions[i * 3] / CELL)},${Math.floor(positions[i * 3 + 1] / CELL)},${Math.floor(positions[i * 3 + 2] / CELL)}`;
        let bucket = grid.get(key);
        if (!bucket) { bucket = []; grid.set(key, bucket); }
        bucket.push(i);
      }
      const segs = [];
      for (let i = 0; i < COUNT; i++) {
        const ix = positions[i * 3], iy = positions[i * 3 + 1], iz = positions[i * 3 + 2];
        const cx = Math.floor(ix / CELL), cy = Math.floor(iy / CELL), cz = Math.floor(iz / CELL);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            for (let oz = -1; oz <= 1; oz++) {
              const bucket = grid.get(`${cx + ox},${cy + oy},${cz + oz}`);
              if (!bucket) continue;
              for (const j of bucket) {
                if (j <= i) continue;
                const dx = ix - positions[j * 3];
                const dy = iy - positions[j * 3 + 1];
                const dz = iz - positions[j * 3 + 2];
                if (dx * dx + dy * dy + dz * dz < DIST2) {
                  segs.push(ix, iy, iz, positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                }
              }
            }
          }
        }
      }
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
    }

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let frame = 0;
    let rafId = 0;
    let paused = document.hidden;
    const clock = new THREE.Clock();

    function animate() {
      rafId = 0;
      if (paused) return;

      const elapsed = clock.getElapsedTime();

      // Update particle nodes
      for (let i = 0; i < COUNT * 3; i += 3) {
        positions[i]     += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        if (positions[i] > SPREAD / 2 || positions[i] < -SPREAD / 2) velocities[i] *= -1;
        if (positions[i + 2] > 160 || positions[i + 2] < -160) velocities[i + 2] *= -1;
      }
      geo.attributes.position.needsUpdate = true;
      if (frame % 3 === 0) connect();

      // Background stars slow rotation
      stars.rotation.y += 0.0002;

      /* =============================================================
         3D CAMERA SCROLLING TRAJECTORY & MODEL ROTATIONS
         ============================================================= */
      const targetCamY = -FX.progress * 1180;
      const targetCamX = (Math.sin(FX.progress * Math.PI * 2.5) * 45) + (mouse.x * 65);
      const targetCamZ = (320 - Math.sin(FX.progress * Math.PI) * 70);

      camera.position.y += (targetCamY - camera.position.y) * 0.06;
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.rotation.z += ((mouse.x * 0.08) - camera.rotation.z) * 0.04;

      // Update dynamic lights
      emeraldLight.position.set(camera.position.x + 60, camera.position.y + 40, camera.position.z - 70);
      goldLight.position.set(camera.position.x - 70, camera.position.y - 50, camera.position.z - 90);

      // Section Models Animation & Activation Scaling
      const sectionModels = [
        { model: modelHero,     y: 0 },
        { model: modelExp,      y: -280 },
        { model: modelProjects, y: -580 },
        { model: modelSkills,   y: -880 },
        { model: modelContact,  y: -1180 },
      ];

      sectionModels.forEach(({ model, y }) => {
        const dist = Math.abs(camera.position.y - y);
        const activeFactor = clamp(1 - (dist / 320), 0.35, 1);
        model.scale.setScalar(activeFactor);
      });

      // 1. Hero Model Rotations
      modelHero.rotation.x = elapsed * 0.35;
      modelHero.rotation.y = elapsed * 0.45;
      heroCore.rotation.x = -elapsed * 0.7;
      heroCore.rotation.y = -elapsed * 0.7;

      // 2. Experience Model Rotations
      ring1.rotation.z = elapsed * 0.5;
      ring2.rotation.z = -elapsed * 0.5;
      cylMesh.rotation.y = elapsed * 0.4;

      // 3. Projects Model Rotations + Satellites
      modelProjects.rotation.y = elapsed * 0.3;
      modelProjects.rotation.x = Math.sin(elapsed * 0.5) * 0.2;
      satellites.forEach((sat) => {
        sat.userData.angle += sat.userData.speed;
        sat.position.x = Math.cos(sat.userData.angle) * sat.userData.dist;
        sat.position.z = Math.sin(sat.userData.angle) * sat.userData.dist;
        sat.position.y = Math.sin(sat.userData.angle * 2) * 20;
        sat.rotation.x += 0.03;
        sat.rotation.y += 0.03;
      });

      // 4. Skills Gyroscope Rings
      gyroRing1.rotation.z = elapsed * 0.6;
      gyroRing2.rotation.y = elapsed * 0.45;
      gyroRing3.rotation.x = elapsed * 0.55;

      // 5. Contact Beacon Rotations & Signal Waves
      modelContact.rotation.y = elapsed * 0.35;
      modelContact.rotation.x = elapsed * 0.25;
      waves.forEach((wave) => {
        const waveScale = 1 + ((elapsed * 0.8 + wave.userData.phase) % 1) * 0.8;
        const waveOp = clamp(1 - ((waveScale - 1) / 0.8), 0, 0.4);
        wave.scale.set(waveScale, waveScale, 1);
        wave.material.opacity = waveOp;
      });

      // Ambient Crystals Floating
      ambientPolyhedra.forEach((poly) => {
        poly.rotation.x += poly.userData.rx;
        poly.rotation.y += poly.userData.ry;
        poly.position.y = poly.userData.baseY + Math.sin(elapsed * poly.userData.floatSpeed) * 12;
      });

      renderer.render(scene, camera);
      frame++;
      rafId = requestAnimationFrame(animate);
    }

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      if (!paused && !rafId) animate();
    });
    animate();
  }

  if (document.readyState === 'complete') initThree();
  else window.addEventListener('load', initThree);

  /* ---------------------------------------------------------------
      14. RESIZE HOUSEKEEPING (Debounced)
   --------------------------------------------------------------- */
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      heroH = heroEl ? heroEl.offsetHeight : 0;
      dirtyScroll = true;
      startLoop();
      relayoutSphere?.();
    }, 150);
  }, { passive: true });

  // Sync current footer year
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
