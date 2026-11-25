// Qorvex — site interactions
(function () {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');

  // Header background on scroll
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Active nav link based on visible section
  const links = [...document.querySelectorAll('.nav__link')];
  const sections = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navObserver.observe(s));

    // Reveal on scroll
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        obs.unobserve(el);
        // Drop the stagger delay once revealed so it doesn't slow the tilt effect
        setTimeout(() => { el.style.transitionDelay = ''; }, 1000);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  // 3D tilt cards (mouse/trackpad only)
  const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canTilt) {
    const MAX = 4; // degrees — kept gentle so text stays crisp
    document.querySelectorAll('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((px - 0.5) * MAX * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * MAX * 2).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Split the hero headline into words for the 3D flip-in
  document.querySelectorAll('[data-split]').forEach((el) => {
    let index = 0;
    const wrapWords = (text, extraClass) => {
      const frag = document.createDocumentFragment();
      text.split(/\s+/).filter(Boolean).forEach((word) => {
        const outer = document.createElement('span');
        outer.className = 'word';
        const inner = document.createElement('span');
        inner.className = 'word__inner' + (extraClass ? ' ' + extraClass : '');
        inner.style.setProperty('--i', index++);
        inner.textContent = word;
        outer.appendChild(inner);
        frag.append(outer, ' ');
      });
      return frag;
    };
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) node.replaceWith(wrapWords(node.textContent));
      else if (node.nodeType === Node.ELEMENT_NODE) node.replaceWith(wrapWords(node.textContent, node.className));
    });
  });

  // Opening animation — hold the loader until the page is ready (min 1.9s, max 4s)
  const preloader = document.getElementById('preloader');
  const started = performance.now();
  const MIN_INTRO = reduceMotion ? 200 : 1900;
  let ready = false;
  const finishIntro = () => {
    if (ready) return;
    ready = true;
    const wait = Math.max(0, MIN_INTRO - (performance.now() - started));
    setTimeout(() => {
      document.body.classList.add('is-loaded');
      document.dispatchEvent(new Event('qorvex:ready'));
      setTimeout(() => preloader && preloader.remove(), 1400);
    }, wait);
  };
  if (document.readyState === 'complete') finishIntro();
  else window.addEventListener('load', finishIntro);
  setTimeout(finishIntro, 4000);

  // Scroll progress bar
  const progressBar = document.getElementById('scrollProgress');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  // 3D rotating technology ring
  const ring = document.getElementById('techRing');
  if (ring) {
    const items = [...ring.children];
    const layoutRing = () => {
      const radius = Math.min(Math.max(window.innerWidth * 0.34, 220), 440);
      ring.style.setProperty('--radius', radius + 'px');
      items.forEach((li, i) => {
        const rows = 2;
        const perRow = Math.ceil(items.length / rows);
        const row = Math.floor(i / perRow);
        const angle = (360 / perRow) * (i % perRow) + row * (180 / perRow);
        li.style.transform = `rotateY(${angle}deg) translateZ(${radius}px) translateY(${(row - 0.5) * 64}px)`;
      });
    };
    layoutRing();
    window.addEventListener('resize', layoutRing);
  }

  if (finePointer && !reduceMotion) {
    // Cursor glow that trails the pointer
    const glow = document.getElementById('cursorGlow');
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };
    window.addEventListener('pointermove', (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      glow.classList.add('is-active');
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('is-active'));
    const followCursor = () => {
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      glow.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      requestAnimationFrame(followCursor);
    };
    followCursor();

    // Magnetic buttons
    document.querySelectorAll('.magnetic, .nav__cta').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.15;
        const y = (e.clientY - r.top - r.height / 2) * 0.2;
        btn.style.translate = `${x}px ${y}px`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
    });

    // Hero floating cards drift in 3D with the pointer
    const floats = [...document.querySelectorAll('.float-card')];
    window.addEventListener('pointermove', (e) => {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      floats.forEach((card, i) => {
        const depth = (i + 1) * 6;
        card.style.translate = `${px * depth}px ${py * depth}px`;
      });
    }, { passive: true });
  }

  // Contact form — sends enquiries by email through FormSubmit (https://formsubmit.co).
  // The first submission triggers a one-time activation email to this address.
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const ENQUIRY_EMAIL = 'enquiry.qorvex@gmail.com';
  const ENDPOINT = `https://formsubmit.co/ajax/${ENQUIRY_EMAIL}`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach((field) => {
      const ok = field.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())
        : field.value.trim() !== '';
      field.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });

    status.className = 'form__status';
    if (!valid) {
      status.textContent = 'Please fill in all required fields with valid details.';
      status.classList.add('is-error');
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return; // bot filled the hidden field

    // Confirm instantly and send in the background; if sending fails,
    // the visitor's details are put back in the form with an error message.
    status.textContent = 'Thank you! Your enquiry has been sent. Our team will contact you shortly.';
    status.classList.add('is-success');
    form.reset();

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        keepalive: true, // finish sending even if the visitor leaves the page
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          Name: data.name,
          Email: data.email,
          Phone: data.phone || '-',
          Service: data.service,
          Message: data.message,
          _subject: `New Qorvex enquiry: ${data.service} — ${data.name}`,
          _replyto: data.email,
          _template: 'table',
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false || result.success === 'false') {
        throw new Error(result.message || 'Request failed');
      }
    } catch (err) {
      console.error('Enquiry send failed:', err);
      Object.entries(data).forEach(([name, value]) => {
        if (form.elements[name]) form.elements[name].value = value;
      });
      status.className = 'form__status';
      const reason = /activat/i.test(err.message)
        ? 'The enquiry form is not activated yet — please check the enquiry inbox for the FormSubmit "Activate Form" email.'
        : 'Sorry, something went wrong.';
      status.innerHTML = `${reason} You can also email us directly at <a href="mailto:${ENQUIRY_EMAIL}">${ENQUIRY_EMAIL}</a>.`;
      status.classList.add('is-error');
    }
  });

  form.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));

  // "Discuss this project" links pre-select the matching service in the form
  const serviceSelect = form.elements.service;
  document.querySelectorAll('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      serviceSelect.value = link.dataset.service;
      serviceSelect.classList.remove('is-invalid');
    });
  });

  // FAQ — keep one answer open at a time
  const faqItems = [...document.querySelectorAll('.faq__item')];
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) faqItems.forEach((other) => { if (other !== item) other.open = false; });
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
