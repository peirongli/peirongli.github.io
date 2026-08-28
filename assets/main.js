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

  /* ---- Snake mini-game (floating button + modal) ---- */
  var fab = document.getElementById('game-fab');
  var gameModal = document.getElementById('game-modal');
  if (fab && gameModal) {
    var canvas = document.getElementById('snake-canvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = document.getElementById('snake-score');
    var bestEl = document.getElementById('snake-best');
    var toggleBtn = document.getElementById('snake-toggle');

    var GRID = 15;
    var CELL = canvas.width / GRID;
    var BASE_MS = 170;
    var MIN_MS = 80;

    var snake, dir, nextDir, food, score, dead, running, timer, interval;
    var best = 0;
    try { best = parseInt(localStorage.getItem('snake-best'), 10) || 0; } catch (e) {}
    bestEl.textContent = best;

    function cssVar(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    function randCell() {
      return Math.floor(Math.random() * GRID);
    }

    function placeFood() {
      do {
        food = { x: randCell(), y: randCell() };
      } while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
    }

    function resetGame() {
      snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
      dir = { x: 1, y: 0 };
      nextDir = dir;
      score = 0;
      dead = false;
      interval = BASE_MS;
      scoreEl.textContent = '0';
      placeFood();
      draw();
    }

    function setRunning(run) {
      running = run;
      if (run) {
        timer = setInterval(step, interval);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
      updateToggleBtn();
    }

    function updateToggleBtn() {
      toggleBtn.textContent = dead ? 'Restart' : (running ? 'Pause' : (score > 0 ? 'Resume' : 'Start'));
    }

    function gameOver() {
      dead = true;
      setRunning(false);
      draw();
    }

    function step() {
      dir = nextDir;
      var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID ||
          snake.some(function (s) { return s.x === head.x && s.y === head.y; })) {
        gameOver();
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        if (score > best) {
          best = score;
          bestEl.textContent = best;
          try { localStorage.setItem('snake-best', String(best)); } catch (e) {}
        }
        if (score % 4 === 0 && interval > MIN_MS) {
          interval -= 8;
          clearInterval(timer);
          timer = setInterval(step, interval);
        }
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function draw() {
      var bgCell = cssVar('--bg') || '#ffffff';
      var boardBg = cssVar('--bg-secondary') || '#f8fafc';
      var bodyColor = cssVar('--accent') || '#667eea';
      var headColor = cssVar('--accent-hover') || '#5a67d8';
      var foodColor = cssVar('--coral') || '#e2603f';
      ctx.fillStyle = boardBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = foodColor;
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      snake.forEach(function (s, i) {
        ctx.fillStyle = i === 0 ? headColor : bodyColor;
        ctx.fillRect(s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3);
      });
      if (dead) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 22px ' + cssVar('--sans-font');
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px ' + cssVar('--sans-font');
        ctx.fillText('Score: ' + score + ' \u2014 press Restart', canvas.width / 2, canvas.height / 2 + 16);
      }
    }

    function trySetDir(d) {
      if (!running) return;
      if (d.x === -dir.x && d.y === -dir.y && snake.length > 1) return;
      nextDir = d;
    }

    var DIRS = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    var KEY_DIR = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right'
    };

    function openGame() {
      gameModal.hidden = false;
      document.body.classList.add('modal-open');
      fab.style.visibility = 'hidden';
      resetGame();
      setRunning(false);
      updateToggleBtn();
    }

    function closeGame() {
      setRunning(false);
      gameModal.hidden = true;
      document.body.classList.remove('modal-open');
      fab.style.visibility = 'visible';
      resetGame();
    }

    fab.addEventListener('click', openGame);
    document.getElementById('game-close').addEventListener('click', closeGame);
    gameModal.addEventListener('click', function (e) {
      if (e.target === gameModal) closeGame();
    });

    toggleBtn.addEventListener('click', function () {
      if (dead) {
        resetGame();
        setRunning(true);
      } else {
        setRunning(!running);
      }
    });

    window.addEventListener('keydown', function (e) {
      if (gameModal.hidden) return;
      if (e.key === 'Escape') {
        closeGame();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (dead) {
          resetGame();
          setRunning(true);
        } else {
          setRunning(!running);
        }
        return;
      }
      var d = KEY_DIR[e.key];
      if (d) {
        e.preventDefault();
        trySetDir(DIRS[d]);
      }
    });

    Array.prototype.forEach.call(gameModal.querySelectorAll('.dpad button'), function (b) {
      b.addEventListener('click', function () {
        trySetDir(DIRS[b.getAttribute('data-dir')]);
      });
    });

    var touchStart = null;
    canvas.addEventListener('touchstart', function (e) {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) {
      if (!touchStart) return;
      var dx = e.changedTouches[0].clientX - touchStart.x;
      var dy = e.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        trySetDir(DIRS[dx > 0 ? 'right' : 'left']);
      } else {
        trySetDir(DIRS[dy > 0 ? 'down' : 'up']);
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && running) setRunning(false);
    });
  }
})();
