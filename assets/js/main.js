/* Dasha Oshyiko — сайт: меню, плавна поява, портфоліо (фільтр + перегляд), відео, бриф. */
(function () {
  'use strict';
  var d = document;
  d.documentElement.classList.add('js');

  /* ----- mobile menu ----- */
  var burger = d.querySelector('.burger');
  var menu = d.getElementById('menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    menu.hidden = !open;
    d.body.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 900 && !menu.hidden) setMenu(false); });
  }

  /* ----- reveal on scroll ----- */
  var rv = [].slice.call(d.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ----- video cards: play the local file inline, else open the post ----- */
  d.querySelectorAll('.vbox').forEach(function (box) {
    var btn = box.querySelector('.vplay');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var src = box.getAttribute('data-src');
      var href = box.getAttribute('data-href');
      if (!src) { if (href) window.open(href, '_blank', 'noopener'); return; }
      var v = d.createElement('video');
      v.src = src; v.controls = true; v.playsInline = true; v.setAttribute('playsinline', '');
      v.addEventListener('error', function () {
        v.remove(); box.classList.remove('is-playing');
        if (href) window.open(href, '_blank', 'noopener');
      }, { once: true });
      box.appendChild(v);
      box.classList.add('is-playing');
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
      v.focus();
    });
  });

  /* ----- portfolio filter ----- */
  var filters = [].slice.call(d.querySelectorAll('.filter'));
  var groups = [].slice.call(d.querySelectorAll('.pf-group'));
  function applyFilter(key) {
    filters.forEach(function (f) { f.setAttribute('aria-pressed', f.dataset.f === key ? 'true' : 'false'); });
    groups.forEach(function (g) { g.hidden = !(key === 'all' || g.dataset.g === key); if (!g.hidden) g.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); });
  }
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      applyFilter(f.dataset.f);
      if (history.replaceState) history.replaceState(null, '', f.dataset.f === 'all' ? location.pathname : '#' + f.dataset.f);
    });
  });
  if (filters.length) {
    var h = (location.hash || '').slice(1);
    if (h && filters.some(function (f) { return f.dataset.f === h; })) applyFilter(h);
  }

  /* ----- lightbox ----- */
  var lb = d.getElementById('lb');
  if (lb && typeof lb.showModal === 'function') {
    var img = lb.querySelector('.lb__img');
    var cap = lb.querySelector('.lb__cap');
    var items = [];
    var idx = 0;
    function visibleItems() {
      return [].slice.call(d.querySelectorAll('.ph-btn')).filter(function (b) { return b.offsetParent !== null; });
    }
    function show(i) {
      idx = (i + items.length) % items.length;
      var b = items[idx];
      var im = b.querySelector('img');
      img.src = im.currentSrc || im.src;
      img.alt = im.alt;
      cap.textContent = b.getAttribute('data-cap') || im.alt;
    }
    d.addEventListener('click', function (e) {
      var b = e.target.closest('.ph-btn');
      if (!b) return;
      items = visibleItems();
      show(items.indexOf(b));
      lb.showModal();
    });
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

  /* ----- brief form: compose an email or a Telegram message ----- */
  var form = d.getElementById('brief');
  if (form) {
    var status = form.querySelector('.form__status');
    function briefText() {
      var get = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
      var lines = [
        'Бриф на зйомку',
        '',
        'Бренд: ' + get('brand'),
        'Продукт: ' + get('product'),
        'Формат: ' + get('package'),
        "Ім'я: " + get('name'),
        'Контакт: ' + get('contact')
      ];
      var c = get('comment');
      if (c) lines.push('', 'Коментар / референси:', c);
      return lines.join('\n');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var subj = 'Бриф на зйомку — ' + form.elements.brand.value.trim();
      location.href = 'mailto:oshyikoo@gmail.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(briefText());
      status.textContent = 'Відкриваємо вашу пошту з готовим листом.';
    });
    var tg = form.querySelector('[data-tg]');
    if (tg) tg.addEventListener('click', function () {
      if (!form.reportValidity()) return;
      var text = briefText();
      var open = function () { window.open('https://t.me/dasha_oshiyko', '_blank', 'noopener'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          status.textContent = 'Текст брифу скопійовано. Вставте його в чат Telegram.';
          open();
        }, function () { status.textContent = 'Не вдалося скопіювати. Напишіть, будь ласка, у Telegram напряму.'; open(); });
      } else { open(); }
    });
    var pre = new URLSearchParams(location.search).get('package');
    if (pre && form.elements.package) {
      [].slice.call(form.elements.package.options).forEach(function (o) { if (o.value === pre) o.selected = true; });
    }
  }
})();
