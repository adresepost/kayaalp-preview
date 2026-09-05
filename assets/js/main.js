/* Kaya Alp — prototype interactions v0.6 (vanilla, no dependencies) */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

  /* ---------- header: scrolled state ---------- */
  const onScroll = () => document.body.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mega menu (hover intent + click + keyboard) ---------- */
  $$('.nav__item.has-mega').forEach((item) => {
    const btn = $('.nav__link', item);
    let timer;
    const open = () => { clearTimeout(timer); item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };
    const close = () => { item.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
    item.addEventListener('mouseenter', () => { clearTimeout(timer); timer = setTimeout(open, 60); });
    item.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(close, 160); });
    btn.addEventListener('click', () => (item.classList.contains('is-open') ? close() : open()));
    item.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.focus(); } });
    document.addEventListener('click', (e) => { if (!item.contains(e.target)) close(); });
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) close(); });
  });

  /* ---------- language popover (mobile header) ---------- */
  $$('.lang-menu').forEach((menu) => {
    const btn = $('.lang-menu__btn', menu); const list = $('.lang-menu__list', menu);
    if (!btn || !list) return;
    const set = (open) => { list.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(list.hidden); });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    $$('a', list).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); $$('a', list).forEach((x) => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); btn.firstChild.textContent = (a.getAttribute('hreflang') || 'tr').toUpperCase() + ' '; set(false); }));
  });

  /* ---------- mobile sheet menu ---------- */
  const sheet = $('#mobile-menu');
  const burger = $('.burger');
  if (sheet && burger) {
    const setSheet = (state) => {
      sheet.classList.toggle('is-open', state);
      sheet.setAttribute('aria-hidden', String(!state));
      burger.setAttribute('aria-expanded', String(state));
      burger.setAttribute('aria-label', state ? 'Menüyü kapat' : 'Menüyü aç');
      document.body.style.overflow = state ? 'hidden' : '';
      if (state) { const c = $('[data-sheet-close].icon-btn', sheet); c && c.focus(); } else { burger.focus(); }
    };
    burger.addEventListener('click', () => setSheet(!sheet.classList.contains('is-open')));
    $$('[data-sheet-close]', sheet).forEach((el) => el.addEventListener('click', () => setSheet(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('is-open')) setSheet(false); });
  }

  /* ---------- open-now indicator (Mon–Fri 09–19, Sat 09–17) ---------- */
  (function openNow() {
    const dot = $('[data-open-dot]'); const text = $('[data-open-text]');
    if (!dot || !text) return;
    const now = new Date(); const d = now.getDay(); const h = now.getHours() + now.getMinutes() / 60;
    const open = (d >= 1 && d <= 5 && h >= 9 && h < 19) || (d === 6 && h >= 9 && h < 17);
    dot.classList.toggle('is-closed', !open);
    text.textContent = (open ? 'Şu an açık' : 'Şu an kapalı') + ' · Pzt–Cum 09:00–19:00 · Cmt 09:00–17:00';
  })();

  /* ---------- hero slider (fade, auto-advance, dots, swipe, keyboard) ---------- */
  const hero = $('[data-slider]');
  if (hero) {
    const slides = $$('.slide', hero); const dots = $('.hero__dots', hero); let i = 0; let timer = null;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', String(k !== i)); });
      if (dots) $$('button', dots).forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-selected', String(k === i)); });
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { stop(); if (reduceMotion || slides.length < 2) return; timer = setInterval(() => show(i + 1), 6500); };
    if (dots) slides.forEach((_, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', 'Slayt ' + (k + 1));
      b.addEventListener('click', () => { show(k); start(); }); dots.appendChild(b);
    });
    hero.addEventListener('mouseenter', stop); hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop); hero.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let x0 = null;
    hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { show(dx < 0 ? i + 1 : i - 1); start(); } x0 = null; });
    hero.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { show(i + 1); start(); } if (e.key === 'ArrowLeft') { show(i - 1); start(); } });
    show(0); start();
  }

  /* ---------- scroll-snap carousels (arrows + dots) ---------- */
  $$('[data-carousel]').forEach((wrap) => {
    const track = $('.carousel__track', wrap); if (!track) return;
    const id = wrap.dataset.carousel;
    const step = () => { const first = track.firstElementChild; const gap = parseFloat(getComputedStyle(track).columnGap) || 24; return first ? first.getBoundingClientRect().width + gap : track.clientWidth; };
    const maxLeft = () => track.scrollWidth - track.clientWidth;
    const go = (dir) => {
      let left = track.scrollLeft + dir * step();
      if (dir > 0 && track.scrollLeft >= maxLeft() - 2) left = 0;
      if (dir < 0 && track.scrollLeft <= 2) left = maxLeft();
      track.scrollTo({ left, behavior: scrollBehavior });
    };
    $$('[data-prev="' + id + '"]').forEach((b) => b.addEventListener('click', () => go(-1)));
    $$('[data-next="' + id + '"]').forEach((b) => b.addEventListener('click', () => go(1)));
    const dots = $('[data-dots="' + id + '"]');
    if (dots) {
      const sync = () => { const w = track.clientWidth || 1; const k = Math.round(track.scrollLeft / w); $$('button', dots).forEach((b, n) => b.classList.toggle('is-active', n === k)); };
      const build = () => {
        const pages = Math.max(1, Math.ceil((track.scrollWidth - 4) / (track.clientWidth || 1)));
        dots.innerHTML = '';
        if (pages < 2) return;
        for (let n = 0; n < pages; n++) {
          const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Sayfa ' + (n + 1));
          b.addEventListener('click', () => track.scrollTo({ left: Math.min(n * track.clientWidth, maxLeft()), behavior: scrollBehavior }));
          dots.appendChild(b);
        }
        sync();
      };
      build();
      let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
      track.addEventListener('scroll', sync, { passive: true });
    }
  });

  /* ---------- accordion (single open per group) ---------- */
  $$('.acc').forEach((acc) => {
    const btn = $('.acc__btn', acc); if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = acc.classList.contains('is-open');
      $$('.acc.is-open', acc.parentElement).forEach((o) => { if (o !== acc) { o.classList.remove('is-open'); $('.acc__btn', o).setAttribute('aria-expanded', 'false'); } });
      acc.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ---------- reveal on scroll (with safety nets) ---------- */
  const revealEls = $$('.reveal');
  const revealVisible = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    revealEls.forEach((el) => { if (el.classList.contains('in')) return; const r = el.getBoundingClientRect(); if (r.top < vh * 0.96 && r.bottom > 0) el.classList.add('in'); });
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0 });
    revealEls.forEach((el) => io.observe(el));
    setTimeout(() => revealEls.forEach((el) => el.classList.add('in')), 1500);
    window.addEventListener('scroll', revealVisible, { passive: true });
    window.addEventListener('resize', revealVisible);
    revealVisible();
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- bottom tab bar: active state ---------- */
  const tabs = $$('.tabbar a[data-tab]');
  if (tabs.length) {
    const sections = { tedaviler: $('#tedaviler'), randevu: $('#randevu') };
    const setActive = () => {
      const y = window.scrollY + 140; let key = 'top';
      if (sections.tedaviler && y >= sections.tedaviler.offsetTop) key = 'tedaviler';
      if (sections.randevu && y >= sections.randevu.offsetTop - 300) key = 'randevu';
      tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === key));
    };
    setActive(); window.addEventListener('scroll', setActive, { passive: true });
  }

  /* ---------- toast ---------- */
  const toast = $('#toast'); let toastTimer;
  const showToast = (msg) => { if (!toast) return; toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3200); };

  /* ---------- appointment form (client-side validation, demo submit) ---------- */
  const form = $('#randevu');
  if (form && form.tagName === 'FORM') {
    const validators = {
      name: (v) => v.trim().length >= 3,
      phone: (v) => /^(\+?90|0)?\s?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(v.trim()) || /^\+?\d[\d\s-]{8,}$/.test(v.trim()),
      email: (v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      topic: (v) => v !== '',
    };
    const check = (input) => {
      const rule = validators[input.name]; if (!rule) return true;
      const ok = rule(input.value); const field = input.closest('.field');
      field.classList.toggle('has-error', !ok); input.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    $$('input, select', form).forEach((i) => { i.addEventListener('blur', () => check(i)); i.addEventListener('input', () => { if (i.closest('.field').classList.contains('has-error')) check(i); }); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputs = $$('input[name], select[name]', form).filter((i) => validators[i.name]);
      const allOk = inputs.map(check).every(Boolean);
      const consents = $$('input[type="checkbox"][required]', form);
      const consentOk = consents.every((c) => c.checked);
      if (!allOk) { const first = $('.has-error input, .has-error select', form); first && first.focus(); showToast('Lütfen işaretli alanları kontrol edin.'); return; }
      if (!consentOk) { showToast('Devam etmek için KVKK ve açık rıza onaylarını işaretleyin.'); consents.find((c) => !c.checked).focus(); return; }
      form.classList.add('is-sent');
      form.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
      showToast('Randevu talebiniz iletildi.');
    });
  }

  /* ---------- cookie banner ---------- */
  const cookie = $('#cookie');
  if (cookie) {
    let choice = null;
    try { choice = localStorage.getItem('ka-cookie'); } catch (e) { /* storage unavailable */ }
    if (!choice) setTimeout(() => { cookie.hidden = false; }, 1600);
    $$('[data-cookie]', cookie).forEach((b) => b.addEventListener('click', () => {
      try { localStorage.setItem('ka-cookie', b.dataset.cookie); } catch (e) { /* ignore */ }
      cookie.hidden = true; showToast(b.dataset.cookie === 'all' ? 'Çerez tercihleriniz kaydedildi.' : 'Yalnızca zorunlu çerezler kullanılacak.');
    }));
  }

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('img', lb); const closeBtn = $('.lightbox__close', lb); let lastFocus;
    const openLb = (src, alt) => { lbImg.src = src; lbImg.alt = alt; lb.classList.add('is-open'); lastFocus = document.activeElement; closeBtn.focus(); document.body.style.overflow = 'hidden'; };
    const closeLb = () => { lb.classList.remove('is-open'); lbImg.src = ''; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
    $$('[data-lightbox] figure').forEach((fig) => {
      fig.setAttribute('tabindex', '0'); fig.setAttribute('role', 'button');
      const img = $('img', fig); const act = () => openLb(img.currentSrc || img.src, img.alt);
      fig.addEventListener('click', act);
      fig.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
    closeBtn.addEventListener('click', closeLb);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLb(); });
  }

  /* ---------- table of contents scroll-spy (inner pages) ---------- */
  const tocLinks = $$('.toc__box a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    tocLinks.forEach((a) => { const sec = document.getElementById(a.getAttribute('href').slice(1)); if (sec) map.set(sec, a); });
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { tocLinks.forEach((l) => l.classList.remove('is-active')); map.get(en.target).classList.add('is-active'); } });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    map.forEach((_, sec) => spy.observe(sec));
  }

  /* ---------- smooth anchor offset for sticky header ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const target = document.getElementById(id.slice(1)); if (!target) return;
      e.preventDefault();
      const header = $('.site-header'); const off = header ? header.offsetHeight + 16 : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - off;
      window.scrollTo({ top, behavior: scrollBehavior });
      try { history.replaceState(null, '', id); } catch (err) { /* sandboxed contexts may refuse */ }
    });
  });
})();
