/* Site interactions — pure front-end, no external dependencies.
   Visitor preferences stay in localStorage, nothing leaves the browser. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Theme toggle: auto -> light -> dark ---- */
  var THEME_KEY = 'theme';
  var MODES = ['auto', 'light', 'dark'];
  var GLYPH = { auto: '\u25D0', light: '\u2600', dark: '\u263E' };
  var LABEL = {
    auto: 'Theme: auto (follow system)',
    light: 'Theme: light',
    dark: 'Theme: dark'
  };

  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved === 'light' || saved === 'dark') {
    root.setAttribute('data-theme', saved);
  }

  function currentMode() {
    return root.getAttribute('data-theme') || 'auto';
  }

  var themeBtn = document.getElementById('theme-toggle');
  function renderThemeBtn() {
    if (!themeBtn) return;
    var mode = currentMode();
    themeBtn.textContent = GLYPH[mode];
    themeBtn.setAttribute('aria-label', LABEL[mode]);
    themeBtn.title = LABEL[mode];
  }

  if (themeBtn) {
    renderThemeBtn();
    themeBtn.addEventListener('click', function () {
      var next = MODES[(MODES.indexOf(currentMode()) + 1) % MODES.length];
      if (next === 'auto') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', next);
      }
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      renderThemeBtn();
    });
  }

  /* ---- Reading progress bar + back-to-top ---- */
  var bar = document.querySelector('.progress-bar');
  var toTop = document.querySelector('.to-top');

  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) {
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    if (toTop) {
      toTop.classList.toggle('visible', window.scrollY > window.innerHeight);
    }
  }

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Toast helper ---- */
  var toast = document.querySelector('.toast');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 1600);
  }

  /* ---- Copy email ---- */
  var EMAIL = 'peirongli9890@outlook.com';
  var copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = EMAIL;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove();
        showToast(ok ? 'Email copied to clipboard \u2713' : 'Copy failed \u2014 please select manually');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(
          function () { showToast('Email copied to clipboard \u2713'); },
          fallbackCopy
        );
      } else {
        fallbackCopy();
      }
    });
  }

  /* ---- Typewriter tagline (hero banner) ---- */
  var typewriter = document.getElementById('typewriter');
  if (typewriter) {
    var PHRASES = [
      'MSc CS @ Georgia Tech',
      'Exploring AI products & PM',
      'Gamer & game jammer'
    ];
    if (reduceMotion) {
      typewriter.textContent = PHRASES[0];
    } else {
      var phraseIdx = 0;
      var charIdx = 0;
      var deleting = false;
      (function tick() {
        var phrase = PHRASES[phraseIdx];
        var delay;
        if (!deleting) {
          charIdx++;
          typewriter.textContent = phrase.slice(0, charIdx);
          delay = charIdx === phrase.length ? 2000 : 70;
          if (charIdx === phrase.length) deleting = true;
        } else {
          charIdx--;
          typewriter.textContent = phrase.slice(0, charIdx);
          delay = charIdx === 0 ? 400 : 35;
          if (charIdx === 0) {
            deleting = false;
            phraseIdx = (phraseIdx + 1) % PHRASES.length;
          }
        }
        setTimeout(tick, delay);
      })();
    }
  }

  /* ---- Avatar easter egg: click to spin + confetti (once per visit) ---- */
  var avatar = document.querySelector('.avatar-ring');
  var EGG_KEY = 'avatar-egg-done';
  var eggDone = false;
  try { eggDone = sessionStorage.getItem(EGG_KEY) === '1'; } catch (e) {}

  if (avatar && !eggDone && !reduceMotion) {
    avatar.classList.add('egg-ready');
    avatar.addEventListener('click', function () {
      try { sessionStorage.setItem(EGG_KEY, '1'); } catch (e) {}
      avatar.classList.remove('egg-ready');
      avatar.classList.add('spin');
      burstConfetti(avatar);
      setTimeout(function () {
        avatar.classList.remove('spin');
      }, 900);
    }, { once: true });
  }

  function burstConfetti(anchor) {
    var colors = ['#667eea', '#0d9488', '#0284c7', '#e2603f', '#b45309', '#8b5cf6'];
    var rect = anchor.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    for (var i = 0; i < 28; i++) {
      var p = document.createElement('span');
      p.className = 'confetti';
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = colors[i % colors.length];
      var angle = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 120;
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist - 60 + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      document.body.appendChild(p);
      setTimeout(function (node) {
        return function () { node.remove(); };
      }(p), 1300);
    }
  }
})();
