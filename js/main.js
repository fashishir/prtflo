/* =====================================================================
   A.K.M Faridul Alam — Portfolio · main.js
   Three.js bg · tilt cards · parallax · 3D skill sphere ·
   contact form · theme toggle · scroll progress · active nav
   ===================================================================== */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

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
     0. CURSOR GLOW
  --------------------------------------------------------------- */
  const glow = $('#cursor-glow');
  if (glow && !isTouch && !reduceMotion) {
    let gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; }, { passive: true });
    const moveGlow = () => {
      cx += (gx - cx) * 0.08;
      cy += (gy - cy) * 0.08;
      glow.style.left = `${cx}px`;
      glow.style.top = `${cy}px`;
      requestAnimationFrame(moveGlow);
    };
    moveGlow();
  }

  /* ---------------------------------------------------------------
     1. THEME TOGGLE (persisted)
  --------------------------------------------------------------- */
  const themeBtn = $('#theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

  themeBtn?.addEventListener('click', () => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const next = light ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    window.__setBgTheme?.(next);
  });

  /* ---------------------------------------------------------------
     2. SCROLL PROGRESS BAR  +  NAV (scrolled / active link)
  --------------------------------------------------------------- */
  const bar = $('#progress-bar');
  const nav = $('nav');
  const sections = $$('section[id], footer[id]');
  const navLinks = $$('.nav-links a');

  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
    if (bar) bar.style.width = `${Math.min(scrolled * 100, 100)}%`;
    nav?.classList.toggle('scrolled', h.scrollTop > 30);

    // active section
    let current = '';
    for (const sec of sections) {
      if (h.scrollTop >= sec.offsetTop - 140) current = sec.id;
    }
    navLinks.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`)
    );
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
     3. MOBILE MENU
  --------------------------------------------------------------- */
  const burger = $('.hamburger');
  const menu = $('.nav-links');
  const closeMenu = () => { menu?.classList.remove('open'); burger?.classList.remove('active'); };
  burger?.addEventListener('click', () => {
    menu.classList.toggle('open');
    burger.classList.toggle('active');
  });
  navLinks.forEach(a => a.addEventListener('click', closeMenu));

  /* ---------------------------------------------------------------
     4. SCROLL REVEAL
  --------------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------------------------------------------------------------
     5. TYPING EFFECT
  --------------------------------------------------------------- */
  const typeEl = $('#role');
  const roles = ['Software Engineer', 'Full-Stack Web Developer', 'Web App Developer', 'Virtual Assistant'];
  if (typeEl) {
    let r = 0, c = 0, deleting = false;
    const tick = () => {
      const word = roles[r];
      typeEl.textContent = word.slice(0, c);
      if (!deleting && c < word.length) { c++; setTimeout(tick, 90); }
      else if (!deleting && c === word.length) { deleting = true; setTimeout(tick, 1600); }
      else if (deleting && c > 0) { c--; setTimeout(tick, 45); }
      else { deleting = false; r = (r + 1) % roles.length; setTimeout(tick, 350); }
    };
    setTimeout(tick, 600);
  }

  /* ---------------------------------------------------------------
     6. DYNAMIC GREETING
  --------------------------------------------------------------- */
  const g = $('#greeting');
  if (g) {
    const h = new Date().getHours();
    g.textContent = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
  }

  /* ---------------------------------------------------------------
     7. TILT CARDS  (+ glare)
  --------------------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    $$('.tilt').forEach(card => {
      const glare = card.querySelector('.glare');
      const MAX = 12;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform =
          `rotateY(${(px - 0.5) * MAX * 2}deg) rotateX(${(0.5 - py) * MAX * 2}deg) translateZ(6px)`;
        if (glare) { glare.style.setProperty('--mx', `${px * 100}%`); glare.style.setProperty('--my', `${py * 100}%`); }
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------
     8. HERO PARALLAX DEPTH (mouse + scroll)
  --------------------------------------------------------------- */
  const stage = $('.photo-stage');
  if (stage && !isTouch && !reduceMotion) {
    const hero = $('.hero');
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`;
    });
    hero.addEventListener('mouseleave', () => { stage.style.transform = ''; });
  }

  /* ---------------------------------------------------------------
     9. 3D SKILL SPHERE (spherical tag cloud)
  --------------------------------------------------------------- */
  const sphere = $('#skill-sphere');
  if (sphere && !reduceMotion) {
    const tags = $$('.skill-tag', sphere);
    const N = tags.length;
    const R = sphere.offsetWidth / 2;
    const pts = tags.map((tag, i) => {
      // even distribution on a sphere (Fibonacci)
      const phi = Math.acos(-1 + (2 * i + 1) / N);
      const theta = Math.sqrt(N * Math.PI) * phi;
      return {
        el: tag,
        x: R * Math.cos(theta) * Math.sin(phi),
        y: R * Math.sin(theta) * Math.sin(phi),
        z: R * Math.cos(phi),
      };
    });

    let rx = 0.004, ry = 0.006;      // rotation speed
    let ax = 0, ay = 0;              // accumulated angle
    let targetX = 0.004, targetY = 0.006;

    if (!isTouch) {
      sphere.parentElement.addEventListener('mousemove', (e) => {
        const r = sphere.parentElement.getBoundingClientRect();
        targetY = ((e.clientX - r.left) / r.width - 0.5) * 0.04;
        targetX = -((e.clientY - r.top) / r.height - 0.5) * 0.04;
      });
      sphere.parentElement.addEventListener('mouseleave', () => { targetX = 0.004; targetY = 0.006; });
    }

    const render = () => {
      rx += (targetX - rx) * 0.05;
      ry += (targetY - ry) * 0.05;
      ax += rx; ay += ry;
      const sinX = Math.sin(ax), cosX = Math.cos(ax);
      const sinY = Math.sin(ay), cosY = Math.cos(ay);

      for (const p of pts) {
        // rotate around Y then X
        let x = p.x * cosY - p.z * sinY;
        let z = p.x * sinY + p.z * cosY;
        let y = p.y * cosX + z * sinX;
        z = -p.y * sinX + z * cosX;

        const scale = (R * 1.6) / (R * 1.6 + z);
        const opacity = Math.max(0.25, (z + R) / (2 * R));
        p.el.style.transform =
          `translate(-50%,-50%) translate3d(${x}px,${y}px,0) scale(${scale.toFixed(3)})`;
        p.el.style.opacity = opacity.toFixed(2);
        p.el.style.zIndex = Math.round(scale * 100);
      }
      requestAnimationFrame(render);
    };
    render();
  }

  /* ---------------------------------------------------------------
     10. CONTACT FORM  (Formspree → graceful mailto fallback)
  --------------------------------------------------------------- */
  const form = $('#contact-form');
  if (form) {
    const status = $('#form-status');
    const action = form.getAttribute('action') || '';
    const usesFormspree = action.includes('formspree.io/f/') && !action.includes('YOUR_ID');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name'), email = data.get('email'), msg = data.get('message');
      status.className = 'form-status';
      status.textContent = 'Sending…';

      if (usesFormspree) {
        try {
          const res = await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (res.ok) { status.className = 'form-status ok'; status.textContent = '✓ Thanks! Your message has been sent.'; form.reset(); }
          else throw new Error('bad response');
        } catch {
          status.className = 'form-status err';
          status.textContent = 'Something went wrong. Please email me directly.';
        }
      } else {
        // Fallback: open the user's mail client pre-filled
        const subject = encodeURIComponent(`Portfolio contact from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}`);
        window.location.href = `mailto:fashishir4@gmail.com?subject=${subject}&body=${body}`;
        status.className = 'form-status ok';
        status.textContent = 'Opening your email app…';
      }
    });
  }

  /* ---------------------------------------------------------------
     11. RIPPLE EFFECT ON BUTTONS
  --------------------------------------------------------------- */
  $$('.ripple, .btn, .fab').forEach(el => {
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
     12. CV FILE SIZE / LAST UPDATED METADATA
  --------------------------------------------------------------- */
  const cvMeta = async () => {
    const badges = $$('.cv-meta');
    if (!badges.length) return;
    try {
      const res = await fetch('AKM_Faridul_Alam_Resume_Portfolio.pdf', { method: 'HEAD' });
      if (!res.ok) return;
      const len = res.headers.get('content-length');
      const lm = res.headers.get('last-modified');
      const size = len ? `PDF · ${(Number(len) / 1024 / 1024).toFixed(1)} MB` : 'PDF';
      const date = lm ? new Date(lm).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';
      badges.forEach(b => {
        const label = date ? `${size} · ${date}` : size;
        b.textContent = label;
        b.setAttribute('title', `CV updated ${date || 'recently'}`);
      });
    } catch {
      badges.forEach(b => b.textContent = 'PDF');
    }
  };
  cvMeta();

  /* ---------------------------------------------------------------
     13. BACK-TO-TOP
  --------------------------------------------------------------- */
  const topBtn = $('#back-to-top');
  if (topBtn) {
    const toggleTop = () => topBtn.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', toggleTop, { passive: true });
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    toggleTop();
  }

  /* ---------------------------------------------------------------
     14. THREE.JS ANIMATED BACKGROUND (particle network)
  --------------------------------------------------------------- */
  function initThree() {
    if (reduceMotion || typeof THREE === 'undefined') return;
    const canvas = $('#bg-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 1, 1000);
    camera.position.z = 320;

    const COUNT = innerWidth < 768 ? 80 : 160;
    const positions = new Float32Array(COUNT * 3);
    const velocities = [];
    const SPREAD = 600;
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * SPREAD;
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
      velocities.push((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4);
    }

    const accent = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00e5ff';

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dotMat = new THREE.PointsMaterial({ size: 3, color: new THREE.Color(accent()), transparent: true, opacity: 0.9 });
    const points = new THREE.Points(geo, dotMat);
    scene.add(points);

    const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(accent()), transparent: true, opacity: 0.18 });
    const lineGeo = new THREE.BufferGeometry();
    const lineSeg = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSeg);

    window.__setBgTheme = () => {
      const col = new THREE.Color(accent());
      dotMat.color = col; lineMat.color = col;
    };

    const mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / innerWidth - 0.5);
      mouse.y = (e.clientY / innerHeight - 0.5);
    });

    const DIST = 90;
    function connect() {
      const segs = [];
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = positions[i*3] - positions[j*3];
          const dy = positions[i*3+1] - positions[j*3+1];
          const dz = positions[i*3+2] - positions[j*3+2];
          if (dx*dx + dy*dy + dz*dz < DIST*DIST) {
            segs.push(positions[i*3], positions[i*3+1], positions[i*3+2],
                      positions[j*3], positions[j*3+1], positions[j*3+2]);
          }
        }
      }
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
    }

    function resize() {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let frame = 0;
    function animate() {
      for (let i = 0; i < COUNT; i++) {
        for (let k = 0; k < 3; k++) {
          const idx = i*3 + k;
          positions[idx] += velocities[idx];
          const lim = k === 2 ? 150 : SPREAD/2;
          if (positions[idx] > lim || positions[idx] < -lim) velocities[idx] *= -1;
        }
      }
      geo.attributes.position.needsUpdate = true;
      if (frame % 2 === 0) connect();            // rebuild lines every other frame
      points.rotation.y += 0.0006;
      lineSeg.rotation.y += 0.0006;
      camera.position.x += (mouse.x * 80 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 80 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      frame++;
      requestAnimationFrame(animate);
    }
    animate();
  }

  // init Three once the lib (deferred) is ready
  if (document.readyState === 'complete') initThree();
  else window.addEventListener('load', initThree);

  // sync current footer year
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
