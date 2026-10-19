/* ==========================================================================
   La tradición semiótica en la comunicación — interacciones
   JS vanilla, sin dependencias. Funciona abriendo el archivo con doble clic.
   Cada componente se inicializa sólo si su nodo existe.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Utilidades ---------- */
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, e) {
    if (e.key !== 'Tab') { return; }
    var items = $$(FOCUSABLE, container).filter(function (el) { return el.offsetParent !== null || el === doc.activeElement; });
    if (!items.length) { return; }
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (err) { return null; }
  }
  function storageSet(key, val) {
    try { window.localStorage.setItem(key, val); } catch (err) { /* sin almacenamiento */ }
  }

  /* ---------- Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) { return; }
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- Copiar al portapapeles (con alternativa) ---------- */
  function fallbackCopy(text) {
    var ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
    doc.body.removeChild(ta);
    return ok;
  }
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext !== false) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  }

  /* ---------- Tema claro / oscuro ---------- */
  function initTheme() {
    var btn = $('#theme-btn');
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var stored = storageGet('semiotica-theme');
    var current = stored || (mq && mq.matches ? 'dark' : 'light');

    function apply(theme) {
      root.setAttribute('data-theme', theme);
      if (btn) {
        var dark = theme === 'dark';
        btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
        btn.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
      }
      var meta = $('meta[name="theme-color"]');
      if (meta) { meta.setAttribute('content', theme === 'dark' ? '#0E0E0E' : '#FAF8F5'); }
    }
    apply(current);

    if (btn) {
      btn.addEventListener('click', function () {
        current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(current);
        storageSet('semiotica-theme', current);
        toast(current === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
      });
    }
    if (mq && mq.addEventListener) {
      mq.addEventListener('change', function (e) {
        if (!storageGet('semiotica-theme')) { apply(e.matches ? 'dark' : 'light'); }
      });
    }
  }

  /* ---------- Compartir (copiar enlace) ---------- */
  function initShare() {
    var btn = $('#share-btn');
    if (!btn) { return; }
    btn.addEventListener('click', function () {
      var url = window.location.href.split('#')[0];
      copyText(url, function (ok) { toast(ok ? 'Enlace copiado al portapapeles' : 'No se pudo copiar el enlace'); });
    });
  }

  /* ---------- Tiempo de lectura ---------- */
  function initReadingTime() {
    var out = $('#reading-time');
    var main = $('#main');
    if (!out || !main) { return; }
    var words = (main.textContent || '').trim().split(/\s+/).length;
    out.textContent = String(Math.max(1, Math.round(words / 200)));
  }

  /* ---------- Scroll: progreso, volver arriba, scrollspy ---------- */
  function initScroll() {
    var bar = $('#progress-bar');
    var topBtn = $('#top-btn');
    var tocBtn = $('#toc-btn');
    var sections = $$('#main > section[id]');
    var tocLinks = $$('.toc__list a');
    var navLinks = $$('.main-nav a');
    var ticking = false;
    var activeId = null;

    function setActive(id) {
      if (id === activeId) { return; }
      activeId = id;
      tocLinks.concat(navLinks).forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) { a.setAttribute('aria-current', 'location'); } else { a.removeAttribute('aria-current'); }
      });
    }

    function update() {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop;
      var max = root.scrollHeight - window.innerHeight;
      if (bar) { bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')'; }

      var show = y > window.innerHeight * 0.8;
      if (topBtn) { topBtn.classList.toggle('is-visible', show); }
      if (tocBtn) { tocBtn.classList.toggle('is-visible', show); }

      var line = window.innerHeight * 0.3;
      var current = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top - line <= 0) { current = sections[i].id; }
      }
      if (current) { setActive(current); }
      else { setActive(''); }
    }

    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    if (topBtn) {
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        var logo = $('.logo');
        if (logo) { logo.focus({ preventScroll: true }); }
      });
    }
  }

  /* ---------- Menú móvil (off-canvas) ---------- */
  function initDrawer() {
    var drawer = $('#drawer');
    var openBtn = $('#menu-btn');
    if (!drawer || !openBtn) { return; }
    var panel = $('.drawer__panel', drawer);
    var lastFocus = null;

    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      trapFocus(panel, e);
    }
    function open() {
      lastFocus = doc.activeElement;
      drawer.hidden = false;
      // forzar reflow para la transición
      void drawer.offsetWidth;
      drawer.classList.add('is-open');
      openBtn.setAttribute('aria-expanded', 'true');
      doc.body.style.overflow = 'hidden';
      doc.addEventListener('keydown', onKey);
      var first = $('a, button', panel);
      if (first) { first.focus(); }
    }
    function close(skipFocus) {
      if (drawer.hidden) { return; }
      drawer.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      doc.body.style.overflow = '';
      doc.removeEventListener('keydown', onKey);
      setTimeout(function () { drawer.hidden = true; }, reduceMotion ? 0 : 260);
      if (!skipFocus && lastFocus) { lastFocus.focus(); }
    }
    openBtn.addEventListener('click', open);
    $$('[data-close-drawer]', drawer).forEach(function (el) { el.addEventListener('click', function () { close(); }); });
    $$('.drawer__list a', drawer).forEach(function (a) { a.addEventListener('click', function () { close(true); }); });
  }

  /* ---------- Índice móvil (bottom sheet) ---------- */
  function initTocSheet() {
    var toc = $('#toc');
    var btn = $('#toc-btn');
    var closeBtn = $('#toc-close');
    if (!toc || !btn) { return; }
    var desktop = window.matchMedia('(min-width: 1024px)');

    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      trapFocus(toc, e);
    }
    function open() {
      toc.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      doc.addEventListener('keydown', onKey);
      var active = $('.toc__list a.is-active', toc) || $('.toc__list a', toc);
      if (active) { setTimeout(function () { active.focus(); }, 30); }
    }
    function close(skipFocus) {
      if (!toc.classList.contains('is-open')) { return; }
      toc.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      doc.removeEventListener('keydown', onKey);
      if (!skipFocus) { btn.focus(); }
    }
    btn.addEventListener('click', function () { if (toc.classList.contains('is-open')) { close(); } else { open(); } });
    if (closeBtn) { closeBtn.addEventListener('click', function () { close(); }); }
    $$('.toc__list a', toc).forEach(function (a) {
      a.addEventListener('click', function () { if (!desktop.matches) { close(true); } });
    });
    doc.addEventListener('click', function (e) {
      if (toc.classList.contains('is-open') && !toc.contains(e.target) && !btn.contains(e.target)) { close(true); }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) { return; }
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    // seguridad: si al imprimir quedan ocultos
    window.addEventListener('beforeprint', function () { items.forEach(function (el) { el.classList.add('is-visible'); }); });
  }

  /* ---------- Corazón rojo ---------- */
  function initHeart() {
    var lab = $('#heart-lab');
    if (!lab) { return; }
    var stage = $('.heart-lab__stage', lab);
    var level = $('#heart-out-level');
    var text = $('#heart-out-text');
    var chips = $('.chips', lab);
    var modeBtns = $$('[data-heart-mode]', lab);
    var ctxBtns = $$('[data-heart-context]', lab);
    var state = { mode: 'connotacion', context: 'romantico' };

    var labels = { romantico: 'publicación romántica', salud: 'campaña de salud', solidaridad: 'causa solidaria' };
    var meanings = {
      romantico: 'Amor, cariño y afecto entre dos personas.',
      salud: 'El órgano del corazón y el cuidado de la salud.',
      solidaridad: 'Solidaridad, apoyo y cuidado hacia los demás.'
    };

    function render() {
      stage.setAttribute('data-mode', state.mode);
      stage.setAttribute('data-context', state.context);
      modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-heart-mode') === state.mode ? 'true' : 'false'); });
      ctxBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-heart-context') === state.context ? 'true' : 'false'); });
      if (chips) { chips.classList.toggle('is-muted', state.mode === 'denotacion'); }
      if (state.mode === 'denotacion') {
        level.textContent = 'Denotación · igual en cualquier contexto';
        text.textContent = 'Una figura con forma de corazón y color rojo.';
      } else {
        level.textContent = 'Connotación · ' + labels[state.context];
        text.textContent = meanings[state.context];
      }
    }
    modeBtns.forEach(function (b) {
      b.addEventListener('click', function () { state.mode = b.getAttribute('data-heart-mode'); render(); });
    });
    ctxBtns.forEach(function (b) {
      b.addEventListener('click', function () { state.context = b.getAttribute('data-heart-context'); render(); });
    });
    render();
  }

  /* ---------- Diagramas SVG (Saussure / Peirce) ---------- */
  function initDiagrams() {
    $$('[data-diagram]').forEach(function (fig) {
      var nodes = $$('.d-node', fig);
      var panels = $$('[data-panel]', fig);
      function select(key) {
        nodes.forEach(function (n) { n.setAttribute('aria-pressed', n.getAttribute('data-key') === key ? 'true' : 'false'); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== key; });
      }
      nodes.forEach(function (n) {
        n.addEventListener('click', function () { select(n.getAttribute('data-key')); });
        n.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); select(n.getAttribute('data-key')); }
        });
      });
    });
  }

  /* ---------- Modal de autores ---------- */
  function initAuthors() {
    var modal = $('#author-modal');
    if (!modal) { return; }
    var title = $('#modal-title');
    var body = $('#modal-body');
    var closeBtn = $('#modal-close');
    var lastFocus = null;
    var native = typeof modal.showModal === 'function';

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      trapFocus(modal, e);
    }
    function open(card, trigger) {
      lastFocus = trigger;
      title.textContent = $('.author-card__name', card).textContent;
      var details = $('.author-card__details', card);
      body.innerHTML = details ? details.innerHTML : '';
      if (native) { modal.showModal(); } else { modal.setAttribute('open', ''); }
      doc.addEventListener('keydown', onKey);
      closeBtn.focus();
    }
    function close() {
      if (native) { if (modal.open) { modal.close(); } } else { modal.removeAttribute('open'); }
    }
    modal.addEventListener('close', function () {
      doc.removeEventListener('keydown', onKey);
      if (lastFocus) { lastFocus.focus(); }
    });
    if (!native) {
      // Sin <dialog> nativo: emular evento close
      var origClose = close;
      close = function () { origClose(); doc.removeEventListener('keydown', onKey); if (lastFocus) { lastFocus.focus(); } };
    }
    closeBtn.addEventListener('click', function () { close(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) { close(); } });

    $$('.author-card__btn').forEach(function (btn) {
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.addEventListener('click', function () { open(btn.closest('.author-card'), btn); });
    });
  }

  /* ---------- Acordeón ---------- */
  function initAccordion() {
    var acc = $('#aportes-acc');
    if (!acc) { return; }
    var btns = $$('.accordion__btn', acc);
    var all = $('#acc-toggle-all');

    function set(btn, open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var panel = doc.getElementById(btn.getAttribute('aria-controls'));
      if (panel) { panel.hidden = !open; }
    }
    function syncAll() {
      if (!all) { return; }
      var allOpen = btns.every(function (b) { return b.getAttribute('aria-expanded') === 'true'; });
      all.textContent = allOpen ? 'Cerrar todos' : 'Abrir todos';
    }
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        set(btn, btn.getAttribute('aria-expanded') !== 'true');
        syncAll();
      });
    });
    if (all) {
      all.addEventListener('click', function () {
        var allOpen = btns.every(function (b) { return b.getAttribute('aria-expanded') === 'true'; });
        btns.forEach(function (b) { set(b, !allOpen); });
        syncAll();
      });
    }
  }

  /* ---------- Tabs (flechas, Inicio, Fin) ---------- */
  function initTabs() {
    $$('[role="tablist"]').forEach(function (list) {
      var tabs = $$('[role="tab"]', list);
      function activate(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.setAttribute('tabindex', on ? '0' : '-1');
          var panel = doc.getElementById(t.getAttribute('aria-controls'));
          if (panel) { panel.hidden = !on; }
        });
        if (focus) { tab.focus(); }
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { activate(tab, false); });
        tab.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight') { next = tabs[(i + 1) % tabs.length]; }
          else if (e.key === 'ArrowLeft') { next = tabs[(i - 1 + tabs.length) % tabs.length]; }
          else if (e.key === 'Home') { next = tabs[0]; }
          else if (e.key === 'End') { next = tabs[tabs.length - 1]; }
          if (next) { e.preventDefault(); activate(next, true); }
        });
      });
    });
  }

  /* ---------- Hotspots (caso Dove) ---------- */
  function initHotspots() {
    var box = $('#analyzer');
    if (!box) { return; }
    var spots = $$('.hotspot', box);
    var contents = $$('.hs-content', box);
    spots.forEach(function (s) {
      s.addEventListener('click', function () {
        var id = s.getAttribute('data-hotspot');
        var already = s.getAttribute('aria-pressed') === 'true';
        spots.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        var show = already ? '0' : id;
        if (!already) { s.setAttribute('aria-pressed', 'true'); }
        contents.forEach(function (c) { c.hidden = c.getAttribute('data-hs') !== show; });
      });
    });
  }

  /* ---------- Quiz ---------- */
  function initQuiz() {
    var form = $('#quiz-form');
    if (!form) { return; }
    var qs = $$('.quiz__q', form);
    var scoreEl = $('#quiz-score');
    var msgEl = $('#quiz-msg');
    var score = 0;
    var answered = 0;

    function message() {
      if (answered < qs.length) {
        msgEl.textContent = 'Llevas ' + answered + ' de ' + qs.length + ' preguntas respondidas.';
        return;
      }
      if (score === qs.length) { msgEl.textContent = '¡Excelente! Dominas los conceptos clave de la tradición semiótica.'; }
      else if (score >= 4) { msgEl.textContent = 'Muy bien. Repasa las preguntas marcadas para afianzar los conceptos.'; }
      else { msgEl.textContent = 'Buen intento. Vuelve a las secciones 01, 03 y 05 y reinicia el quiz.'; }
    }

    qs.forEach(function (q) {
      var answer = q.getAttribute('data-answer');
      var fb = $('.quiz__fb', q);
      $$('input', q).forEach(function (input) {
        input.addEventListener('change', function () {
          if (q.classList.contains('is-answered')) { return; }
          q.classList.add('is-answered');
          answered++;
          var ok = input.value === answer;
          if (ok) { score++; }
          $$('input', q).forEach(function (other) {
            var label = other.closest('label');
            if (other.value === answer) { label.classList.add('is-right'); }
            else if (other === input) { label.classList.add('is-wrong'); }
            other.disabled = true;
          });
          fb.className = 'quiz__fb ' + (ok ? 'is-ok' : 'is-ko');
          fb.innerHTML = '';
          var tag = doc.createElement('b');
          tag.textContent = ok ? 'Correcto' : 'Incorrecto';
          fb.appendChild(tag);
          fb.appendChild(doc.createTextNode(ok ? fb.getAttribute('data-ok').replace(/^Correcto:\s*/, '') : fb.getAttribute('data-ko')));
          scoreEl.textContent = String(score);
          message();
        });
      });
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('reset', function () {
      setTimeout(function () {
        score = 0; answered = 0;
        qs.forEach(function (q) {
          q.classList.remove('is-answered');
          $$('input', q).forEach(function (i) { i.disabled = false; i.checked = false; });
          $$('label', q).forEach(function (l) { l.classList.remove('is-right', 'is-wrong'); });
          var fb = $('.quiz__fb', q);
          fb.textContent = '';
          fb.className = 'quiz__fb';
        });
        scoreEl.textContent = '0';
        msgEl.textContent = 'Responde las preguntas para ver tu puntaje.';
        var first = $('input', qs[0]);
        if (first) { first.focus(); }
      }, 0);
    });
  }

  /* ---------- Glosario: tooltips accesibles ---------- */
  function initTooltips() {
    var tip = $('#tooltip');
    var terms = $$('.term[data-term]');
    if (!tip || !terms.length) { return; }
    var current = null;
    var pinned = null;
    var lastPointer = 'mouse';

    function lookup(key) {
      var entry = doc.querySelector('[data-glossary="' + key + '"]');
      if (!entry) { return null; }
      return { title: $('dt', entry).textContent, text: $('dd', entry).textContent };
    }
    function position(el) {
      var r = el.getBoundingClientRect();
      var tw = tip.offsetWidth;
      var th = tip.offsetHeight;
      var left = r.left + r.width / 2 - tw / 2;
      left = Math.max(16, Math.min(left, window.innerWidth - tw - 16));
      var top = r.top - th - 10;
      if (top < 72) { top = r.bottom + 10; }
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }
    function show(el) {
      var data = lookup(el.getAttribute('data-term'));
      if (!data) { return; }
      if (current && current !== el) { current.removeAttribute('aria-describedby'); }
      current = el;
      tip.innerHTML = '';
      var b = doc.createElement('b');
      b.textContent = data.title;
      tip.appendChild(b);
      tip.appendChild(doc.createTextNode(data.text));
      tip.hidden = false;
      el.setAttribute('aria-describedby', 'tooltip');
      position(el);
    }
    function hide() {
      if (current) { current.removeAttribute('aria-describedby'); }
      current = null;
      pinned = null;
      tip.hidden = true;
    }

    terms.forEach(function (el) {
      el.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType || 'mouse'; });
      el.addEventListener('mouseenter', function () { if (lastPointer === 'mouse') { show(el); } });
      el.addEventListener('mouseleave', function () { if (pinned !== el) { hide(); } });
      el.addEventListener('focus', function () { show(el); });
      el.addEventListener('blur', function () { if (pinned !== el) { hide(); } });
      el.addEventListener('click', function (e) {
        // En pantallas táctiles: primer toque muestra la definición; el segundo lleva al glosario.
        if (lastPointer !== 'mouse' && pinned !== el) {
          e.preventDefault();
          show(el);
          pinned = el;
        } else {
          hide();
        }
        lastPointer = 'mouse';
      });
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tip.hidden) { hide(); } });
    doc.addEventListener('pointerdown', function (e) {
      if (pinned && !e.target.closest('.term')) { hide(); }
    });
    window.addEventListener('scroll', function () { if (current) { if (pinned) { position(current); } else { hide(); } } }, { passive: true });
  }

  /* ---------- Referencias: copiar cita ---------- */
  function initRefs() {
    $$('.ref__copy').forEach(function (btn) {
      var text = $('.ref__text', btn.closest('.ref'));
      btn.setAttribute('aria-label', 'Copiar cita: ' + text.textContent.slice(0, 60) + '…');
      btn.addEventListener('click', function () {
        copyText(text.textContent.trim(), function (ok) {
          if (ok) {
            btn.textContent = 'Copiada';
            btn.classList.add('is-done');
            setTimeout(function () { btn.textContent = 'Copiar cita'; btn.classList.remove('is-done'); }, 2000);
            toast('Cita copiada en formato APA');
          } else {
            toast('No se pudo copiar la cita');
          }
        });
      });
    });
  }

  /* ---------- Arranque ---------- */
  function init() {
    var steps = [initTheme, initShare, initReadingTime, initScroll, initDrawer, initTocSheet, initReveal,
      initHeart, initDiagrams, initAuthors, initAccordion, initTabs, initHotspots, initQuiz, initTooltips, initRefs];
    steps.forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) { console.error('[semiotica]', fn.name, err); } }
    });
  }

  if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
