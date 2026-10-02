// À personnaliser : fuseau horaire affiché dans le pied de page (ex. "Europe/Paris", "Africa/Lome")
var CONFIG = { city: "Ville, Pays", timeZone: "UTC" };

// Interrupteur de thème : ressorts, glissement au doigt ou à la souris, effet "liquide" à la prise
(function () {
  var root = document.documentElement, btn = document.getElementById('theme');
  if (!btn) return;
  try { var saved = localStorage.getItem('theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}

  var thumb = btn.querySelector('.sw-thumb'), liquid = btn.querySelector('.sw-liquid'), glow = btn.querySelector('.sw-glow');
  var fillOn = btn.querySelector('.sw-on'), sun = btn.querySelector('.sw-sun'), moon = btn.querySelector('.sw-moon');
  var TW = 32, TH = 24, PAD = 4, TRACK = 62, TRAVEL = TRACK - TW - PAD * 2;
  // Vitesse de l'interrupteur : 1 = normal, 0.7 = encore plus lent, 1.5 = plus rapide
  var SPEED = 1;

  function isDarkNow() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }

  var checked = isDarkNow();
  var pos = { x: checked ? TRAVEL : 0, v: 0, t: checked ? TRAVEL : 0 };   // position du bouton
  var grab = { x: 0, v: 0, t: 0 };                                         // 0 = repos, 1 = saisi

  function stepSpring(s, k, c, m, dt) {
    var n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
    for (var i = 0; i < n; i++) { var a = (k * (s.t - s.x) - c * s.v) / m; s.v += a * h; s.x += s.v * h; }
  }

  function render() {
    var gp = grab.x, w = TW + PAD * 4.5 * gp, hh = TH + PAD * 2.3 * gp, ox = pos.x - (w - TW) / 2;
    thumb.style.width = w + 'px'; thumb.style.height = hh + 'px';
    thumb.style.transform = 'translate(' + ox + 'px, -50%)';
    thumb.style.opacity = 1 - 0.8 * clamp(gp, 0, 1);
    liquid.style.width = w + 'px'; liquid.style.height = hh + 'px';
    liquid.style.transform = 'translate(' + ox + 'px, -50%) scale(' + (0.82 + 0.26 * gp) + ')';
    liquid.style.opacity = 0.76 * clamp(gp, 0, 1);
    var p = clamp(pos.x / TRAVEL, 0, 1);
    fillOn.style.opacity = p; sun.style.opacity = p; moon.style.opacity = 1 - p;
    glow.style.opacity = p <= 0.7 ? 0.18 * p / 0.7 : 0.18 + 0.02 * (p - 0.7) / 0.3;
    glow.style.transform = 'scale(' + (0.82 + 0.18 * p) + ')';
  }

  var raf = 0, last = 0;
  function settled() {
    return Math.abs(pos.x - pos.t) < 0.01 && Math.abs(pos.v) < 0.01 && Math.abs(grab.x - grab.t) < 0.002 && Math.abs(grab.v) < 0.01;
  }
  function loop(t) {
    var dt = Math.min((t - last) / 1000, 0.05) || 0.016; last = t;
    stepSpring(pos, 40, 10.5, 1, dt * SPEED);
    stepSpring(grab, 70, 11, 1, dt * SPEED);
    render();
    if (settled()) { pos.x = pos.t; grab.x = grab.t; pos.v = grab.v = 0; render(); raf = 0; }
    else raf = requestAnimationFrame(loop);
  }
  function kick() {
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }

  function apply(next, silent) {
    checked = next;
    btn.setAttribute('aria-checked', String(checked));
    pos.t = checked ? TRAVEL : 0;
    kick();
    if (!silent) {
      var th = checked ? 'dark' : 'light';
      root.setAttribute('data-theme', th);
      try { localStorage.setItem('theme', th); } catch (e) {}
    }
  }

  var activeId = null, dragging = false, startX = 0, startThumb = 0, suppressClick = false;

  btn.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    activeId = e.pointerId; grab.t = 1;
    startX = e.clientX; startThumb = pos.x; pos.t = pos.x; dragging = false;
    kick();
  });
  btn.addEventListener('pointermove', function (e) {
    if (activeId === null || e.pointerId !== activeId) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 3) dragging = true;
    if (!dragging) return;
    e.preventDefault();
    pos.t = clamp(startThumb + dx, 0, TRAVEL);
    kick();
  });
  btn.addEventListener('pointerup', function (e) {
    if (activeId === null || e.pointerId !== activeId) return;
    try { btn.releasePointerCapture(e.pointerId); } catch (err) {}
    activeId = null; grab.t = 0;
    if (!dragging) { kick(); return; }
    dragging = false; suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 60);
    apply(pos.t >= TRAVEL / 2);
  });
  btn.addEventListener('pointercancel', function () {
    activeId = null; dragging = false; grab.t = 0; pos.t = checked ? TRAVEL : 0; kick();
  });
  btn.addEventListener('click', function (e) {
    if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
    apply(!checked);
  });

  // Si l'appareil change de thème et que le visiteur n'a rien choisi, l'interrupteur suit
  if (window.matchMedia) {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!root.getAttribute('data-theme')) { apply(isDarkNow(), true); }
    });
  }

  btn.setAttribute('aria-checked', String(checked));
  render();
})();

// Horloge du pied de page
(function () {
  document.getElementById('city').textContent = CONFIG.city;
  var el = document.getElementById('clock');
  var fmt;
  try { fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: CONFIG.timeZone }); }
  catch (e) { fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
  function update() { el.textContent = fmt.format(new Date()); }
  update(); setInterval(update, 1000);
})();

// Copier l'adresse e-mail
(function () {
  var btn = document.getElementById('copy'), mail = document.getElementById('mail').textContent;
  btn.addEventListener('click', function () {
    var done = function () { btn.textContent = 'Adresse copiée'; setTimeout(function () { btn.textContent = "Copier l'adresse e-mail"; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(mail).then(done, function () { location.href = 'mailto:' + mail; });
    } else { location.href = 'mailto:' + mail; }
  });
})();

// Projets : lignes qui s'ouvrent au survol (ressort calculé puis appliqué en CSS)
(function () {
  // Réglage de la vitesse : 1 = normal, 1.5 = plus lent, 0.7 = plus rapide
  var SLOWDOWN = 1;

  // Courbe d'un ressort amorti, convertie en easing CSS linear()
  function spring(k, c, m) {
    var w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m)), pts = [], settleT = 2;
    function x(t) {
      if (z < 1) {
        var wd = w0 * Math.sqrt(1 - z * z);
        return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
      }
      return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    }
    for (var t = 0; t < 2; t += 0.005) {
      if (Math.abs(1 - x(t)) < 0.002 && Math.abs(1 - x(t + 0.1)) < 0.002) { settleT = t; break; }
    }
    var n = 40;
    for (var i = 0; i <= n; i++) pts.push(x(settleT * i / n).toFixed(4));
    pts[n] = '1';
    return { easing: 'linear(' + pts.join(', ') + ')', ms: Math.round(settleT * 1000) };
  }
  if (window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')) {
    var h = spring(140, 24, 1);
    document.documentElement.style.setProperty('--spring-hx', h.easing);
    document.documentElement.style.setProperty('--dur-hx', Math.round(h.ms * SLOWDOWN) + 'ms');
  }

  var list = document.getElementById('projects');
  if (!list) return;
  var items = Array.prototype.slice.call(list.querySelectorAll('.hx-item'));
  var active = null, lastType = 'mouse';

  function setActive(i) {
    active = i;
    list.classList.toggle('is-active', i !== null);
    items.forEach(function (it, k) { it.classList.toggle('on', k === i); });
  }

  items.forEach(function (item, i) {
    item.addEventListener('pointerdown', function (e) { lastType = e.pointerType; });
    item.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') setActive(i); });
    item.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') setActive(null); });
    // Téléphone et tablette : un toucher ouvre, un second toucher referme
    item.addEventListener('click', function () { if (lastType === 'touch') setActive(active === i ? null : i); });
    // Clavier : la ligne s'ouvre quand elle reçoit le focus
    item.addEventListener('focus', function () { if (item.matches(':focus-visible')) setActive(i); });
    item.addEventListener('blur', function () { if (active === i && !item.matches(':hover')) setActive(null); });
  });
})();

// Fond animé : grille de points qui s'écartent, grossissent et s'illuminent autour du curseur
(function () {
  var wrap = document.querySelector('.hero-wrap'), cv = document.getElementById('fx');
  if (!wrap || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');

  var GAP = 28, RADIUS = 150, DOT = 1.7, PUSH = 0.9, SPRING = 0.06, FRICTION = 0.84;
  var w = 0, h = 0, dots = [];
  var mouse = { x: 0, y: 0, sx: 0, sy: 0, on: false, g: 0 };
  var ink = [20, 23, 28], accent = [53, 36, 255];

  function hex(c) {
    c = (c || '').trim();
    if (c.charAt(0) !== '#') return null;
    if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  function readColors() {
    var cs = getComputedStyle(wrap);
    ink = hex(cs.getPropertyValue('--ink')) || ink;
    accent = hex(cs.getPropertyValue('--accent')) || accent;
  }

  function build() {
    var r = wrap.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = Math.ceil(w / GAP) + 1, rows = Math.ceil(h / GAP) + 1;
    var ox = (w - (cols - 1) * GAP) / 2, oy = (h - (rows - 1) * GAP) / 2;
    dots = [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      dots.push({ x: ox + i * GAP, y: oy + j * GAP, ox: 0, oy: 0, vx: 0, vy: 0 });
    }
  }

  function setPointer(e) {
    var r = wrap.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    if (!mouse.on) { mouse.sx = mouse.x; mouse.sy = mouse.y; }
    mouse.on = true;
  }
  wrap.addEventListener('pointermove', setPointer);
  wrap.addEventListener('pointerdown', setPointer);
  wrap.addEventListener('pointerleave', function () { mouse.on = false; });

  var last = 0, running = false, raf = 0;
  function frame(t) {
    var dt = Math.min((t - (last || t)) / 16.67, 2.5); last = t;
    mouse.sx += (mouse.x - mouse.sx) * 0.2 * dt;
    mouse.sy += (mouse.y - mouse.sy) * 0.2 * dt;
    mouse.g += ((mouse.on ? 1 : 0) - mouse.g) * 0.08 * dt;

    ctx.clearRect(0, 0, w, h);

    // Halo qui suit le curseur
    if (mouse.g > 0.01) {
      var g = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 260);
      g.addColorStop(0, 'rgba(' + accent[0] + ',' + accent[1] + ',' + accent[2] + ',' + (0.18 * mouse.g).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + accent[0] + ',' + accent[1] + ',' + accent[2] + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    var damp = Math.pow(FRICTION, dt);
    for (var n = 0; n < dots.length; n++) {
      var d = dots[n];
      var dx = d.x - mouse.sx, dy = d.y - mouse.sy;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var infl = mouse.g > 0.01 && dist < RADIUS ? (1 - dist / RADIUS) * mouse.g : 0;
      if (infl > 0) {
        var f = infl * infl * PUSH;
        d.vx += (dx / dist) * f * dt;
        d.vy += (dy / dist) * f * dt;
      }
      d.vx += -SPRING * d.ox * dt; d.vy += -SPRING * d.oy * dt;
      d.vx *= damp; d.vy *= damp;
      d.ox += d.vx * dt; d.oy += d.vy * dt;

      var m = Math.min(1, infl * 1.4);
      var wave = Math.sin(t * 0.0012 + (d.x + d.y) * 0.012);
      var alpha = 0.26 + 0.1 * wave + infl * 0.7;
      var rr = Math.round(ink[0] + (accent[0] - ink[0]) * m);
      var gg = Math.round(ink[1] + (accent[1] - ink[1]) * m);
      var bb = Math.round(ink[2] + (accent[2] - ink[2]) * m);
      ctx.fillStyle = 'rgba(' + rr + ',' + gg + ',' + bb + ',' + Math.min(alpha, 1).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(d.x + d.ox, d.y + d.oy, DOT * (1 + infl * 1.8), 0, 6.2832);
      ctx.fill();
    }
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  readColors(); build();
  if ('ResizeObserver' in window) new ResizeObserver(build).observe(wrap); else window.addEventListener('resize', build);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(wrap);
  } else { start(); }
})();

// Apparition douce des blocs au défilement
(function () {
  var sel = 'section .sec-head, section .hint, .hx-item, .about > div, .method > div, footer .wrap > *';
  var els = Array.prototype.slice.call(document.querySelectorAll(sel));
  if (!els.length || !('IntersectionObserver' in window)) return;
  els.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (n) { return els.indexOf(n) !== -1; });
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 90 + 'ms');
    el.classList.add('reveal');
  });
  // Le bloc apparaît quand il entre à l'écran et se réarme quand il en sort,
  // donc l'animation se rejoue à chaque passage (en descendant comme en remontant).
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.intersectionRatio >= 0.12) en.target.classList.add('in');
      else if (!en.isIntersecting) en.target.classList.remove('in');
    });
  }, { threshold: [0, 0.12], rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
