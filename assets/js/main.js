/* Dasha Oshyiko — сайт: меню, плавна поява, портфоліо (фільтр + перегляд), відео, бриф. */
(function () {
  'use strict';
  var d = document;
  var root = d.documentElement;
  window.__do = true;
  root.classList.add('js');

  /* ----- mobile menu ----- */
  var burger = d.querySelector('.burger');
  var menu = d.getElementById('menu');
  var behind = [d.getElementById('main'), d.querySelector('.ftr'), d.querySelector('.skip'), d.querySelector('.hdr__logo')];
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    menu.hidden = !open;
    d.body.classList.toggle('menu-open', open); root.classList.toggle('menu-open', open);
    behind.forEach(function (el) { if (el) el.inert = open; });
    if (open) { var first = menu.querySelector('a'); if (first) first.focus(); }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 900 && !menu.hidden) setMenu(false); });
  }

  /* ----- reveal on scroll: starts a little before the block enters the screen ----- */
  var rv = [].slice.call(d.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px 15% 0px', threshold: 0 });
    rv.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) { el.style.transition = 'none'; el.classList.add('in'); return; }
      io.observe(el);
    });
    /* safety net: if a browser throttles the observer, reveal on scroll anyway */
    var ticking = false;
    var sweep = function () {
      ticking = false;
      var limit = window.innerHeight * 1.1;
      rv.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < limit) { el.classList.add('in'); io.unobserve(el); } });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; setTimeout(sweep, 150); } }, { passive: true });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ----- video cards: local file plays right here; one video at a time ----- */
  d.querySelectorAll('.vbox[data-src]').forEach(function (box) {
    var btn = box.querySelector('.vplay');
    if (!btn) return;
    btn.addEventListener('click', function () {
      d.querySelectorAll('.vbox.is-playing video').forEach(function (v) { v.pause(); });
      var v = box.querySelector('video');
      if (!v) {
        v = d.createElement('video');
        v.src = box.getAttribute('data-src');
        v.controls = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
        var poster = box.querySelector('img'); if (poster) v.poster = poster.currentSrc || poster.src;
        var ttl = box.parentNode.querySelector('.vmeta__t'); if (ttl) v.setAttribute('aria-label', 'Відео ' + ttl.textContent);
        v.addEventListener('ended', function () { box.classList.remove('is-playing'); v.currentTime = 0; btn.focus({ preventScroll: true }); });
        v.addEventListener('play', function () {
          d.querySelectorAll('.vbox video').forEach(function (o) { if (o !== v) o.pause(); });
        });
        box.appendChild(v);
      }
      box.classList.add('is-playing');
      var p = v.play(); if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () {}); });
    });
  });

  d.addEventListener('visibilitychange', function () { if (d.hidden) d.querySelectorAll('.vbox video').forEach(function (v) { v.pause(); }); });

  /* ----- video carousel arrows (phones and tablets) ----- */
  d.querySelectorAll('.vcar').forEach(function (car) {
    var track = car.querySelector('.vgrid');
    var cards = [].slice.call(track.querySelectorAll('.vcard'));
    var prev = car.querySelector('[data-dir="-1"]');
    var next = car.querySelector('[data-dir="1"]');
    var num = car.querySelector('.vnav__n span');
    if (!prev || !next || !cards.length) return;
    var current = function () {
      var x = track.scrollLeft, best = 0, bd = Infinity;
      cards.forEach(function (c, i) { var off = Math.abs((c.offsetLeft - cards[0].offsetLeft) - x); if (off < bd) { bd = off; best = i; } });
      if (x + track.clientWidth >= track.scrollWidth - 2) best = cards.length - 1;
      return best;
    };
    var update = function () {
      var i = current();
      num.textContent = String(i + 1);
      cards.forEach(function (c, k) { if (k !== i) { var v = c.querySelector('video'); if (v && !v.paused) v.pause(); } });
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
    };
    var go = function (dir) {
      var i = Math.max(0, Math.min(cards.length - 1, current() + dir));
      track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
    };
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    var t = null;
    track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(update, 80); }, { passive: true });
    update();
  });

  /* ----- portfolio filter (also follows #hash, back/forward) ----- */
  var filters = [].slice.call(d.querySelectorAll('.filter'));
  var groups = [].slice.call(d.querySelectorAll('.pf-group'));
  function applyFilter(key) {
    if (!filters.some(function (f) { return f.dataset.f === key; })) key = 'all';
    filters.forEach(function (f) { f.setAttribute('aria-pressed', f.dataset.f === key ? 'true' : 'false'); });
    groups.forEach(function (g) {
      g.hidden = !(key === 'all' || g.dataset.g === key);
      if (!g.hidden) g.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
    });
  }
  if (filters.length) {
    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        applyFilter(f.dataset.f);
        if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + (f.dataset.f === 'all' ? '' : '#' + f.dataset.f));
      });
    });
    var fromHash = function () { applyFilter((location.hash || '').slice(1) || 'all'); };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* ----- lightbox ----- */
  var lb = d.getElementById('lb');
  if (lb && typeof lb.showModal === 'function') {
    var img = lb.querySelector('.lb__img');
    var cap = lb.querySelector('.lb__cap');
    var items = [];
    var idx = 0;
    var show = function (i) {
      idx = (i + items.length) % items.length;
      var b = items[idx];
      var im = b.querySelector('img');
      img.removeAttribute('src');
      img.src = im.getAttribute('data-full') || im.currentSrc || im.src;
      [idx - 1, idx + 1].forEach(function (j) {
        var n = items[(j + items.length) % items.length].querySelector('img');
        if (n && n.getAttribute('data-full')) { var pre = new Image(); pre.src = n.getAttribute('data-full'); }
      });
      cap.textContent = b.getAttribute('data-cap') || im.alt;
      var cnt = lb.querySelector('.lb__n'); if (cnt) cnt.textContent = (idx + 1) + ' / ' + items.length;
      img.alt = cap.textContent;
    };
    d.addEventListener('click', function (e) {
      var b = e.target.closest('.ph-btn');
      if (!b) return;
      e.preventDefault();
      items = [].slice.call(d.querySelectorAll('.ph-btn')).filter(function (x) { return x.offsetParent !== null; });
      show(items.indexOf(b));
      d.querySelectorAll('.vbox video').forEach(function (v) { v.pause(); });
      root.classList.add('lb-open');
      lb.showModal();
    });
    lb.addEventListener('close', function () { root.classList.remove('lb-open'); });
    lb.querySelector('.lb__close').addEventListener('click', function () { lb.close(); });
    lb.querySelector('.lb__prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* ----- brief form: send straight to Telegram via the site's bot ----- */
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzoDTyeiajPybnOeGu6tMtQe2UxkPE1kIoS3MIcZBTk7t3gIDccDzr8wN4tJPIg3NVD/exec';
  var form = d.getElementById('brief');
  if (form) {
    form.hidden = false;
    var status = form.querySelector('.form__status');
    var btn = form.querySelector('[data-send]');
    var LABEL = 'Надіслати заявку';
    var started = Date.now();
    var sending = false;
    var val = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
    var reset = function () { sending = false; btn.disabled = false; btn.textContent = LABEL; };
    var fail = function (rate) {
      status.innerHTML = (rate ? 'Забагато заявок за останню годину. ' : 'Не вдалося надіслати. ') +
        'Напишіть, будь ласка, напряму в <a href="https://t.me/dasha_oshiyko" target="_blank" rel="noopener">Telegram</a> або на <a href="mailto:oshyikoo@gmail.com">oshyikoo@gmail.com</a>.';
      reset();
    };
    ['brand', 'contact'].forEach(function (n) {
      var el = form.elements[n];
      if (el) el.addEventListener('input', function () { el.setCustomValidity(''); });
    });
    var send = function () {
      var data = { brand: val('brand'), product: val('product'), package: val('package'), name: val('name'), contact: val('contact'), comment: val('comment'), website: val('website') };
      var ctl = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data), signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
        .then(function (res) {
          clearTimeout(timer);
          if (res && res.ok) {
            form.reset();
            status.textContent = 'Дякую, заявку надіслано. Звʼяжуся з вами за вказаним контактом.';
            btn.textContent = 'Надіслано';
            setTimeout(reset, 4000);
          } else { fail(res && res.error === 'rate'); }
        })
        .catch(function () { clearTimeout(timer); fail(false); });
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      ['brand', 'contact'].forEach(function (n) {
        var el = form.elements[n];
        if (el) el.setCustomValidity(el.value.trim() ? '' : 'Заповніть це поле');
      });
      if (!form.reportValidity()) return;
      sending = true;
      btn.disabled = true; btn.textContent = 'Надсилаю…'; status.textContent = '';
      var wait = 2000 - (Date.now() - started);
      if (wait > 0) setTimeout(send, wait); else send();
    });
    var pre = new URLSearchParams(location.search).get('package');
    if (pre && form.elements.package) {
      [].slice.call(form.elements.package.options).forEach(function (o) { if (o.value === pre) o.selected = true; });
    }
  }
})();
