/* ============================================================
   ÁLGEBRA PARA TODOS · engine.js
   ------------------------------------------------------------
   Motor compartido por TODAS las actividades. Este es el único
   archivo que se edita para cambiar algo común a las 50 landings
   (paleta, tipografías, layout, sonido, footer, modo compacto...).

   Cada landing de Kajabi solo carga este script y le pasa un
   objeto de configuración con SU lógica particular (generate /
   renderContent / check / explain). El engine se encarga de:
     - inyectar fuentes + CSS + el fix de fondo del body
     - armar todo el esqueleto visual (topbar, tarjeta, feedback,
       footer, botón de mute, contador de racha)
     - manejar el ciclo de una ronda (generar caso → responder →
       feedback → siguiente)
     - sonido sintetizado (Web Audio) + confetti/globos + mute
       persistente compartido entre todas las actividades

   Cero dependencias externas más allá de Google Fonts.
   ============================================================ */
(function (global) {
  'use strict';

  var FONT_LINK_ID = 'apt-engine-fonts';
  var STYLE_ID = 'apt-engine-style';
  var BODY_BG_ID = 'apt-engine-body-bg';
  var MUTE_KEY = 'apt_sound_muted'; // clave COMPARTIDA entre todas las actividades del sitio

  /* ------------------------------------------------------------
     CSS — escopado bajo .apt-act. Cada landing tiene UNA sola
     actividad en la página, así que una clase genérica alcanza
     (no hace falta un nombre distinto por ejercicio como antes).
     Cero selectores globales salvo el fix de body{background}.
     ------------------------------------------------------------ */
  var CSS = [
    '.apt-act{',
    '  --bg:#0A0A0D; --bg-card:#16161C; --grid-line:rgba(151,161,216,0.14);',
    '  --ink:#F5F5F7; --ink-soft:#A7ACC0;',
    '  --chalk:#48507D; --chalk-hover:#5A639A; --chalk-light:#97A1D8;',
    '  --correct:#5BCD9A; --correct-bg:rgba(91,205,154,0.12);',
    '  --wrong:#D65252; --wrong-bg:rgba(214,82,82,0.12);',
    '  --font-mono:"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;',
    '  --font-serif:"Lora", Georgia, "Times New Roman", serif;',
    '  --radius:14px; --max-w:460px;',
    '  min-height:100vh; width:100%; box-sizing:border-box;',
    '  background:',
    '    linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0/100% 28px,',
    '    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0/28px 100%,',
    '    var(--bg);',
    '  background-color:var(--bg); color:var(--ink); font-family:var(--font-mono);',
    '  padding:max(24px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom));',
    '  display:flex; align-items:center; justify-content:center;',
    '}',
    '.apt-act *{ box-sizing:border-box; }',
    '.apt-act__app{ width:100%; max-width:var(--max-w); display:flex; flex-direction:column; gap:clamp(10px,2.6vh,18px); }',
    '.apt-act__topbar{ text-align:center; padding-top:4px; }',
    '.apt-act__eyebrow{ font-family:var(--font-serif); font-weight:700; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--chalk-light); margin:0 0 8px; }',
    '.apt-act__title{ font-family:var(--font-mono); font-weight:700; font-size:clamp(22px,6.5vw,28px); margin:0; color:var(--ink); line-height:1.25; }',
    '.apt-act__subtitle{ font-family:var(--font-mono); font-size:13.5px; color:var(--ink-soft); margin:8px 0 0; line-height:1.5; }',
    '.apt-act__card{ background:var(--bg-card); border:1px solid rgba(151,161,216,0.18); border-radius:var(--radius); box-shadow:0 1px 3px rgba(0,0,0,.4), 0 10px 24px rgba(0,0,0,.35); padding:14px; display:flex; justify-content:center; }',
    '.apt-act__content{ width:100%; display:flex; justify-content:center; }',
    '.apt-act__content svg{ width:100%; max-width:300px; aspect-ratio:1/1; display:block; }',
    '.apt-act__content .katex{ color:var(--ink); }',
    '.apt-act__choices{ display:flex; gap:8px; }',
    '.apt-act__choices--stacked{ flex-direction:column; }',
    '.apt-act__choice-btn{ flex:1 1 0; font-family:var(--font-serif); font-weight:700; padding:12px 4px; border-radius:12px; border:2px solid var(--chalk-light); background:transparent; color:var(--chalk-light); cursor:pointer; min-height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; transition:transform .08s ease, background .15s ease, color .15s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__choices--stacked .apt-act__choice-btn{ flex-direction:row; padding:16px 18px; font-size:16px; }',
    '.apt-act__choice-main{ font-size:16px; }',
    '.apt-act__choice-sub{ font-family:var(--font-mono); font-weight:400; font-size:9.5px; opacity:.8; text-align:center; line-height:1.2; }',
    '.apt-act__choice-btn:active{ transform:scale(.97); }',
    '.apt-act__choice-btn.is-selected{ background:var(--chalk); border-color:var(--chalk); color:#fff; }',
    '.apt-act__choice-btn:disabled{ opacity:.5; cursor:default; }',
    '.apt-act__choice-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__feedback{ border-radius:var(--radius); padding:18px 16px; display:flex; gap:12px; align-items:flex-start; border:1px solid transparent; }',
    '.apt-act__feedback--correct{ background:var(--correct-bg); border-color:rgba(91,205,154,0.35); }',
    '.apt-act__feedback--wrong{ background:var(--wrong-bg); border-color:rgba(214,82,82,0.35); }',
    '.apt-act__feedback--hidden{ display:none; }',
    '.apt-act__mark{ flex:0 0 auto; width:34px; height:34px; }',
    '.apt-act__mark path{ fill:none; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; }',
    '.apt-act__feedback--correct .apt-act__mark path{ stroke:var(--correct); }',
    '.apt-act__feedback--wrong .apt-act__mark path{ stroke:var(--wrong); }',
    '.apt-act__feedback-text{ font-family:var(--font-mono); font-size:14.5px; line-height:1.6; }',
    '.apt-act__feedback-text strong{ display:block; font-family:var(--font-serif); font-weight:700; font-size:16px; margin-bottom:5px; }',
    '.apt-act__feedback--correct .apt-act__feedback-text strong{ color:var(--correct); }',
    '.apt-act__feedback--wrong .apt-act__feedback-text strong{ color:var(--wrong); }',
    '.apt-act__feedback--correct .apt-act__feedback-text{ color:#CFEEDF; }',
    '.apt-act__feedback--wrong .apt-act__feedback-text{ color:#F3D2D2; }',
    '.apt-act__next-btn{ font-family:var(--font-serif); font-weight:700; font-size:15px; color:#fff; background:var(--chalk); border:none; border-radius:12px; padding:15px; min-height:50px; cursor:pointer; transition:background .15s ease; }',
    '.apt-act__next-btn:hover{ background:var(--chalk-hover); }',
    '.apt-act__next-btn--hidden{ display:none; }',
    '.apt-act__next-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__retry-btn{ font-family:var(--font-serif); font-weight:700; font-size:14.5px; color:var(--chalk-light); background:transparent; border:2px solid var(--chalk-light); border-radius:12px; padding:13px 10px; min-height:50px; cursor:pointer; transition:background .15s ease, color .15s ease, transform .08s ease; -webkit-tap-highlight-color:transparent; flex:1 1 0; }',
    '.apt-act__retry-btn:active{ transform:scale(.98); }',
    '.apt-act__retry-btn--hidden{ display:none; }',
    '.apt-act__actions-row{ display:flex; gap:8px; }',
    '.apt-act__footer{ display:flex; justify-content:space-between; align-items:center; padding-top:6px; font-family:var(--font-serif); font-weight:700; font-size:12px; color:var(--chalk-light); }',
    '.apt-act__brand-link{ color:var(--chalk-light); text-decoration:none; }',
    '.apt-act__brand-link:hover{ text-decoration:underline; }',
    '.apt-act__brand-link:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:3px; border-radius:2px; }',
    '.apt-act__footer-right{ display:flex; align-items:center; gap:10px; }',
    '.apt-act__streak{ display:flex; gap:6px; align-items:center; color:var(--ink-soft); font-family:var(--font-mono); font-weight:400; }',
    '.apt-act__streak b{ color:var(--chalk-light); font-family:var(--font-serif); font-size:13px; }',
    '.apt-act__mute-btn{ width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:50%; border:1px solid rgba(151,161,216,0.3); background:transparent; font-size:14px; line-height:1; cursor:pointer; padding:0; transition:background .15s ease, border-color .15s ease, transform .08s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__mute-btn:active{ transform:scale(.92); }',
    '.apt-act__mute-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; }',
    /* -- modo compacto: se activa al responder -- */
    '.apt-act.is-answered .apt-act__subtitle{ display:none; }',
    '.apt-act.is-answered .apt-act__topbar{ padding-top:0; }',
    '.apt-act.is-answered .apt-act__app{ gap:clamp(6px,1.4vh,10px); }',
    '.apt-act.is-answered .apt-act__card{ padding:8px; }',
    '.apt-act.is-answered .apt-act__content svg{ max-width:220px; }',
    '.apt-act.is-answered .apt-act__choice-btn{ min-height:44px; padding:8px 4px; }',
    '.apt-act.is-answered .apt-act__choices--stacked .apt-act__choice-btn{ padding:10px 16px; font-size:14.5px; }',
    '.apt-act.is-answered .apt-act__feedback{ padding:12px 14px; gap:10px; }',
    '.apt-act.is-answered .apt-act__mark{ width:26px; height:26px; }',
    '.apt-act.is-answered .apt-act__feedback-text{ font-size:13px; line-height:1.45; }',
    '.apt-act.is-answered .apt-act__feedback-text strong{ font-size:14px; margin-bottom:3px; }',
    '.apt-act.is-answered .apt-act__next-btn{ padding:11px; min-height:42px; font-size:14px; }',
    '.apt-act.is-answered .apt-act__retry-btn{ padding:11px; min-height:42px; font-size:13px; }'
  ].join('\n');

  var CHECK_SVG = '<svg class="apt-act__mark" viewBox="0 0 34 34"><path d="M6 18 L14 26 L28 8"/></svg>';
  var CROSS_SVG = '<svg class="apt-act__mark" viewBox="0 0 34 34"><path d="M8 8 L26 26 M26 8 L8 26"/></svg>';

  /* ------------------------------------------------------------
     Inyección de assets (una sola vez por página, aunque nunca
     debería haber más de una actividad por landing)
     ------------------------------------------------------------ */
  function ensureAssets() {
    if (!document.getElementById(FONT_LINK_ID)) {
      var pre = document.createElement('link');
      pre.rel = 'preconnect';
      pre.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pre);

      var fonts = document.createElement('link');
      fonts.id = FONT_LINK_ID;
      fonts.rel = 'stylesheet';
      fonts.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Lora:wght@600;700&display=swap';
      document.head.appendChild(fonts);
    }
    if (!document.getElementById(STYLE_ID)) {
      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    if (!document.getElementById(BODY_BG_ID)) {
      var bg = document.createElement('style');
      bg.id = BODY_BG_ID;
      bg.textContent = 'body{background-color:#0A0A0D;}';
      document.head.appendChild(bg);
    }
  }

  /* ------------------------------------------------------------
     Sonido sintetizado + confetti/globos + mute persistente
     ------------------------------------------------------------ */
  var muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* sin persistencia si está bloqueado */ }
  var audioCtx = null;

  function getCtx() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone(ctx, freq, startTime, dur, type, peak) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.03);
  }

  function playCorrectSound() {
    if (muted) return;
    var ctx = getCtx();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      tone(ctx, f, t0 + i * 0.075, 0.22, 'triangle', 0.16);
    });
  }

  function playWrongSound() {
    if (muted) return;
    var ctx = getCtx();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    [196, 174.61].forEach(function (f, i) {
      tone(ctx, f, t0 + i * 0.15, 0.26, 'sawtooth', 0.14);
    });
  }

  function celebrate() {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647;';
    document.body.appendChild(canvas);
    var c2d = canvas.getContext('2d');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    var colors = ['#5BCD9A', '#97A1D8', '#E8B85C', '#D65252', '#7FD1C5'];
    var pieces = [];
    var total = 70;
    for (var i = 0; i < total; i++) {
      var isBalloon = Math.random() < 0.15;
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        w: isBalloon ? 10 + Math.random() * 6 : 6 + Math.random() * 5,
        h: 10 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: (isBalloon ? 1.4 : 2.2) + Math.random() * 2,
        vx: (Math.random() - 0.5) * 2.2,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        isBalloon: isBalloon
      });
    }

    var frames = 0;
    var maxFrames = 165;
    function draw() {
      c2d.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        c2d.save();
        c2d.translate(p.x, p.y);
        c2d.rotate(p.rot * Math.PI / 180);
        c2d.fillStyle = p.color;
        if (p.isBalloon) {
          c2d.beginPath();
          c2d.ellipse(0, 0, p.w, p.w * 1.3, 0, 0, Math.PI * 2);
          c2d.fill();
          c2d.strokeStyle = p.color;
          c2d.lineWidth = 1.5;
          c2d.beginPath();
          c2d.moveTo(0, p.w * 1.3);
          c2d.lineTo(0, p.w * 1.3 + 14);
          c2d.stroke();
        } else {
          c2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        c2d.restore();
      });
      frames++;
      if (frames < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        canvas.remove();
      }
    }
    draw();
  }

  /* ------------------------------------------------------------
     Esqueleto de la actividad
     ------------------------------------------------------------ */
  function buildSkeleton(root, cfg) {
    root.classList.add('apt-act');
    root.innerHTML =
      '<div class="apt-act__app">' +
        '<div class="apt-act__topbar">' +
          '<p class="apt-act__eyebrow">' + (cfg.eyebrow || '') + '</p>' +
          '<h1 class="apt-act__title">' + (cfg.title || '') + '</h1>' +
          '<p class="apt-act__subtitle">' + (cfg.subtitle || '') + '</p>' +
        '</div>' +
        '<div class="apt-act__card"><div class="apt-act__content"></div></div>' +
        '<div class="apt-act__choices"></div>' +
        '<div class="apt-act__feedback apt-act__feedback--hidden"></div>' +
        '<button type="button" class="apt-act__next-btn apt-act__next-btn--hidden">' + (cfg.nextLabel || 'Probar con otro caso →') + '</button>' +
        '<div class="apt-act__footer">' +
          '<a class="apt-act__brand-link" href="https://www.instagram.com/soyjuanisilva/" target="_blank" rel="noopener">Álgebra Para Todos</a>' +
          '<span class="apt-act__footer-right">' +
            '<button type="button" class="apt-act__mute-btn" aria-pressed="false" aria-label="Silenciar sonidos">🔊</button>' +
            '<span class="apt-act__streak">Racha: <b>0</b></span>' +
          '</span>' +
        '</div>' +
      '</div>';
    return {
      content: root.querySelector('.apt-act__content'),
      choicesWrap: root.querySelector('.apt-act__choices'),
      feedback: root.querySelector('.apt-act__feedback'),
      nextBtn: root.querySelector('.apt-act__next-btn'),
      muteBtn: root.querySelector('.apt-act__mute-btn'),
      streakEl: root.querySelector('.apt-act__streak b')
    };
  }

  /* ------------------------------------------------------------
     init(config) — API pública que usa cada landing
     ------------------------------------------------------------ */
  function init(cfg) {
    ensureAssets();

    var mountEl = cfg.mount ? document.querySelector(cfg.mount) : null;
    var root = mountEl || document.createElement('div');
    if (!mountEl) {
      var script = document.currentScript;
      if (script && script.parentNode) {
        script.parentNode.insertBefore(root, script);
      } else {
        document.body.appendChild(root);
      }
    }

    var refs = buildSkeleton(root, cfg);

    if (cfg.mode === 'choices') {
      refs.choicesWrap.classList.toggle('apt-act__choices--stacked', cfg.choices.length <= 2);
      cfg.choices.forEach(function (choice) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'apt-act__choice-btn';
        btn.dataset.value = choice.value;
        btn.innerHTML = '<span class="apt-act__choice-main">' + choice.label + '</span>' +
          (choice.sub ? '<span class="apt-act__choice-sub">' + choice.sub + '</span>' : '');
        btn.addEventListener('click', function () { answer(choice.value, btn); });
        refs.choicesWrap.appendChild(btn);
      });
    }

    var current = null;
    var answered = false;
    var streak = 0;

    function newRound() {
      current = cfg.generate();
      cfg.renderContent(refs.content, current);
      root.classList.remove('is-answered');
      refs.feedback.className = 'apt-act__feedback apt-act__feedback--hidden';
      refs.nextBtn.classList.add('apt-act__next-btn--hidden');
      refs.choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) {
        b.disabled = false;
        b.classList.remove('is-selected');
      });
      answered = false;
    }

    function answer(value, btnEl) {
      if (answered) return;
      if (btnEl) btnEl.classList.add('is-selected');
      root.classList.add('is-answered');

      var correct = cfg.check(current, value);
      var text = cfg.explain(current, correct, value);

      refs.feedback.className = 'apt-act__feedback ' + (correct ? 'apt-act__feedback--correct' : 'apt-act__feedback--wrong');
      refs.feedback.innerHTML = (correct ? CHECK_SVG : CROSS_SVG) +
        '<div class="apt-act__feedback-text"><strong>' + (correct ? '¡Correcto!' : 'No es correcto') + '</strong>' + text + '</div>';

      if (cfg.onAnswered) cfg.onAnswered(refs.content, current, correct, value);

      if (correct) { playCorrectSound(); celebrate(); } else { playWrongSound(); }

      streak = correct ? streak + 1 : 0;
      refs.streakEl.textContent = String(streak);

      refs.choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) { b.disabled = true; });
      refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
      answered = true;
    }

    refs.nextBtn.addEventListener('click', newRound);

    function updateMuteBtn() {
      refs.muteBtn.textContent = muted ? '🔇' : '🔊';
      refs.muteBtn.setAttribute('aria-pressed', String(muted));
    }
    refs.muteBtn.addEventListener('click', function () {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* sin persistencia si está bloqueado */ }
      updateMuteBtn();
    });
    updateMuteBtn();

    newRound();

    return { newRound: newRound };
  }

  global.AptActivity = { init: init };
})(window);
