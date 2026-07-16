/* ============================================================
   ÁLGEBRA PARA TODOS · engine.js (v2)
   ------------------------------------------------------------
   Motor compartido por TODAS las actividades. Este es el único
   archivo que se edita para cambiar algo común a las 50 landings
   (paleta, tipografías, layout, sonido, footer, modo compacto...).

   Cada landing de Kajabi solo carga este script y le pasa un
   objeto de configuración con SU lógica particular. El engine
   soporta dos modos de interacción:

     mode: 'choices' — botones de elección (ej: SCD/SCI/SI).
       cfg.choices, cfg.check(current,value), cfg.explain(...)

     mode: 'grid' — grilla de celdas numéricas con signo −/+ y
       botón Comprobar/Reintentar/Ver respuesta (ej: matriz
       ampliada, reducción escalonada).
       cfg.grid {rows, cols, dividerAfterCol}
       cfg.checkGrid(current, studentMatrix, hasEmpty) →
         { correct, cellStatus (opcional, matriz de 'correct'/
           'wrong'/null), feedbackText }
       cfg.getAnswerGrid(current) → matriz de valores (para
         "Ver respuesta"; si no se define, ese botón no aparece)
       cfg.answerTitle / cfg.answerText (opcionales, texto del
         botón "Ver respuesta")

   En ambos modos: cfg.generate(), cfg.renderContent(container,
   current), cfg.needsKatex (bool, opcional).

   El engine se encarga de: inyectar fuentes + CSS + KaTeX (si
   hace falta) + el fix de fondo del body, armar todo el
   esqueleto visual, manejar el ciclo de una ronda, sonido
   sintetizado + confetti/globos + mute persistente compartido.
   ============================================================ */
(function (global) {
  'use strict';

  var FONT_LINK_ID = 'apt-engine-fonts';
  var STYLE_ID = 'apt-engine-style';
  var BODY_BG_ID = 'apt-engine-body-bg';
  var KATEX_CSS_ID = 'apt-engine-katex-css';
  var KATEX_JS_ID = 'apt-engine-katex-js';
  var MUTE_KEY = 'apt_sound_muted'; // clave COMPARTIDA entre todas las actividades del sitio

  /* ------------------------------------------------------------
     CSS — escopado bajo .apt-act. Cada landing tiene UNA sola
     actividad en la página, así que una clase genérica alcanza.
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
    '.apt-act__content{ width:100%; display:flex; justify-content:center; font-size:clamp(15px,4.4vw,19px); }',
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
    '.apt-act__matrixwrap{ display:flex; align-items:stretch; justify-content:center; gap:6px; }',
    '.apt-act__bracket{ width:9px; border-top:3px solid var(--ink-soft); border-bottom:3px solid var(--ink-soft); }',
    '.apt-act__bracket--left{ border-left:3px solid var(--ink-soft); border-radius:5px 0 0 5px; }',
    '.apt-act__bracket--right{ border-right:3px solid var(--ink-soft); border-radius:0 5px 5px 0; }',
    '.apt-act__grid{ display:grid; gap:8px 6px; padding:4px 4px; }',
    '.apt-act__divider{ width:2px; background:var(--chalk-light); opacity:.45; justify-self:center; }',
    '.apt-act__cellwrap{ display:flex; align-items:stretch; gap:3px; }',
    '.apt-act__signseg{ flex:0 0 34px; width:34px; display:flex; border:2px solid rgba(151,161,216,0.3); border-radius:7px; overflow:hidden; }',
    '.apt-act__signseg-btn{ flex:1 1 50%; min-width:0; border:none; background:transparent; color:var(--ink-soft); font-family:var(--font-mono); font-weight:700; font-size:13px; cursor:pointer; padding:0; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__signseg-btn + .apt-act__signseg-btn{ border-left:1px solid rgba(151,161,216,0.3); }',
    '.apt-act__signseg-btn.is-active{ background:var(--chalk); color:#fff; }',
    '.apt-act__signseg-btn:disabled{ opacity:1; cursor:default; }',
    '.apt-act__signseg-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:-2px; }',
    '.apt-act__cell{ flex:1 1 auto; min-width:0; text-align:center; font-family:var(--font-mono); font-weight:500; font-size:clamp(15px,4.2vw,18px); color:var(--ink); background:rgba(151,161,216,0.07); border:2px solid rgba(151,161,216,0.3); border-radius:8px; padding:8px 2px; -webkit-appearance:none; }',
    '.apt-act__cell:focus{ outline:none; border-color:var(--chalk-light); background:rgba(151,161,216,0.14); }',
    '.apt-act__cellwrap.is-correct .apt-act__cell, .apt-act__cellwrap.is-correct .apt-act__signseg{ border-color:var(--correct); background:var(--correct-bg); color:var(--correct); }',
    '.apt-act__cellwrap.is-correct .apt-act__signseg-btn.is-active{ background:var(--correct); color:#0A0A0D; }',
    '.apt-act__cellwrap.is-wrong .apt-act__cell, .apt-act__cellwrap.is-wrong .apt-act__signseg{ border-color:var(--wrong); background:var(--wrong-bg); color:var(--wrong); }',
    '.apt-act__cellwrap.is-wrong .apt-act__signseg-btn.is-active{ background:var(--wrong); color:#0A0A0D; }',
    '.apt-act__cell:disabled{ opacity:1; }',
    '.apt-act__hint{ text-align:center; font-family:var(--font-mono); font-size:12px; color:var(--ink-soft); opacity:.8; margin:-6px 0 0; }',
    '.apt-act__check-btn{ font-family:var(--font-serif); font-weight:700; font-size:16px; padding:16px 18px; border-radius:12px; border:2px solid var(--chalk-light); background:transparent; color:var(--chalk-light); cursor:pointer; min-height:52px; transition:transform .08s ease, background .15s ease, color .15s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__check-btn:active{ transform:scale(.98); }',
    '.apt-act__check-btn:disabled{ opacity:.5; cursor:default; }',
    '.apt-act__check-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__skip-btn{ background:none; border:none; color:var(--ink-soft); font-family:var(--font-mono); font-size:12.5px; text-decoration:underline; text-underline-offset:3px; cursor:pointer; padding:4px 0; align-self:center; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__skip-btn:hover{ color:var(--chalk-light); }',
    '.apt-act__skip-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; border-radius:2px; }',
    '.apt-act.is-answered .apt-act__skip-btn{ display:none; }',
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
    '.apt-act__actions{ display:flex; flex-direction:column; gap:8px; }',
    '.apt-act__actions-row{ display:flex; gap:8px; }',
    '.apt-act__retry-btn{ font-family:var(--font-serif); font-weight:700; font-size:14.5px; color:var(--chalk-light); background:transparent; border:2px solid var(--chalk-light); border-radius:12px; padding:13px 10px; min-height:50px; cursor:pointer; transition:background .15s ease, color .15s ease, transform .08s ease; -webkit-tap-highlight-color:transparent; flex:1 1 0; }',
    '.apt-act__retry-btn:active{ transform:scale(.98); }',
    '.apt-act__retry-btn--hidden{ display:none; }',
    '.apt-act__retry-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__next-btn{ font-family:var(--font-serif); font-weight:700; font-size:15px; color:#fff; background:var(--chalk); border:none; border-radius:12px; padding:15px; min-height:50px; cursor:pointer; transition:background .15s ease; }',
    '.apt-act__next-btn:hover{ background:var(--chalk-hover); }',
    '.apt-act__next-btn--hidden{ display:none; }',
    '.apt-act__next-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
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
    '.apt-act.is-answered .apt-act__content{ font-size:clamp(13px,3.8vw,16px); }',
    '.apt-act.is-answered .apt-act__content svg{ max-width:220px; }',
    '.apt-act.is-answered .apt-act__choice-btn{ min-height:44px; padding:8px 4px; }',
    '.apt-act.is-answered .apt-act__choices--stacked .apt-act__choice-btn{ padding:10px 16px; font-size:14.5px; }',
    '.apt-act.is-answered .apt-act__hint{ display:none; }',
    '.apt-act.is-answered .apt-act__cell{ padding:5px 2px; font-size:clamp(13px,3.6vw,16px); }',
    '.apt-act.is-answered .apt-act__signseg{ flex-basis:28px; width:28px; }',
    '.apt-act.is-answered .apt-act__signseg-btn{ font-size:11px; }',
    '.apt-act.is-answered .apt-act__check-btn{ padding:10px 16px; min-height:40px; font-size:14.5px; }',
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
     Inyección de assets (una sola vez por página)
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

  function ensureKatex(callback) {
    if (window.katex) { callback(); return; }
    if (!document.getElementById(KATEX_CSS_ID)) {
      var link = document.createElement('link');
      link.id = KATEX_CSS_ID;
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById(KATEX_JS_ID)) {
      var script = document.createElement('script');
      script.id = KATEX_JS_ID;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
      document.head.appendChild(script);
    }
    var poll = setInterval(function () {
      if (window.katex) { clearInterval(poll); callback(); }
    }, 50);
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

    var colors = ['#75AADB', '#FFFFFF', '#FCBF49', '#A9CCE8', '#4A90D9'];
    var pieces = [];
    var total = 100;
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
     Helpers de la grilla con control de signo −/+
     ------------------------------------------------------------ */
  function buildSignSeg() {
    var seg = document.createElement('div');
    seg.className = 'apt-act__signseg';
    seg.dataset.sign = '+';
    ['-', '+'].forEach(function (s) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'apt-act__signseg-btn' + (s === '+' ? ' is-active' : '');
      btn.textContent = s;
      btn.dataset.sign = s;
      btn.setAttribute('aria-label', s === '-' ? 'Negativo' : 'Positivo');
      btn.addEventListener('click', function () {
        seg.dataset.sign = s;
        seg.querySelectorAll('.apt-act__signseg-btn').forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.sign === s);
        });
      });
      seg.appendChild(btn);
    });
    return seg;
  }
  function getSign(wrap) { return wrap.querySelector('.apt-act__signseg').dataset.sign; }
  function setSign(wrap, sign) {
    var seg = wrap.querySelector('.apt-act__signseg');
    seg.dataset.sign = sign;
    seg.querySelectorAll('.apt-act__signseg-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.sign === sign);
    });
  }
  function setSignDisabled(wrap, disabled) {
    wrap.querySelectorAll('.apt-act__signseg-btn').forEach(function (b) { b.disabled = disabled; });
  }

  function buildGrid(gridEl, gridCfg, cfg, current) {
    gridEl.innerHTML = '';
    var rows = gridCfg.rows, cols = gridCfg.cols;
    var divAfter = gridCfg.dividerAfterCol != null ? gridCfg.dividerAfterCol : cols - 1;
    gridEl.style.gridTemplateColumns =
      'repeat(' + divAfter + ', minmax(62px,74px)) 10px repeat(' + (cols - divAfter) + ', minmax(62px,74px))';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var wrap = document.createElement('div');
        wrap.className = 'apt-act__cellwrap';
        wrap.dataset.row = r;
        wrap.dataset.col = c;
        wrap.style.gridRow = String(r + 1);
        wrap.style.gridColumn = String(c < divAfter ? c + 1 : c + 2);

        var signSeg = buildSignSeg();
        var input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        input.className = 'apt-act__cell';
        input.setAttribute('aria-label', cfg.cellAriaLabel ? cfg.cellAriaLabel(current, r, c) : ('Fila ' + (r + 1) + ', columna ' + (c + 1)));
        input.addEventListener('input', function () {
          this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2);
        });

        wrap.appendChild(signSeg);
        wrap.appendChild(input);
        gridEl.appendChild(wrap);
      }
    }
    var divider = document.createElement('div');
    divider.className = 'apt-act__divider';
    divider.style.gridColumn = String(divAfter + 1);
    divider.style.gridRow = '1 / ' + (rows + 1);
    gridEl.appendChild(divider);
  }

  function readStudentMatrix(gridEl, gridCfg) {
    var rows = gridCfg.rows, cols = gridCfg.cols;
    var M = [];
    for (var r = 0; r < rows; r++) { M.push(new Array(cols).fill(null)); }
    var hasEmpty = false;
    gridEl.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
      var r2 = +wrap.dataset.row, c2 = +wrap.dataset.col;
      var input = wrap.querySelector('.apt-act__cell');
      var raw = input.value.trim();
      if (raw === '') { hasEmpty = true; M[r2][c2] = null; return; }
      var n = parseInt(raw, 10);
      var sign = getSign(wrap);
      M[r2][c2] = sign === '-' ? -n : n;
    });
    return { matrix: M, hasEmpty: hasEmpty };
  }

  /* ------------------------------------------------------------
     Esqueleto de la actividad
     ------------------------------------------------------------ */
  function buildSkeleton(root, cfg) {
    root.classList.add('apt-act');
    var interactionHTML = '';
    if (cfg.mode === 'grid') {
      interactionHTML =
        '<div class="apt-act__matrixwrap">' +
          '<span class="apt-act__bracket apt-act__bracket--left"></span>' +
          '<div class="apt-act__grid"></div>' +
          '<span class="apt-act__bracket apt-act__bracket--right"></span>' +
        '</div>' +
        '<p class="apt-act__hint">Tocá − o + para cambiar el signo de cada número.</p>' +
        '<button type="button" class="apt-act__check-btn">Comprobar</button>';
    } else {
      interactionHTML = '<div class="apt-act__choices"></div>';
    }
    var actionsHTML = cfg.mode === 'grid'
      ? '<div class="apt-act__actions-row">' +
          '<button type="button" class="apt-act__retry-btn apt-act__retry-btn--hidden">Reintentar</button>' +
          (cfg.getAnswerGrid ? '<button type="button" class="apt-act__retry-btn apt-act__retry-btn--hidden apt-act__showanswer-btn">Ver respuesta</button>' : '') +
        '</div>'
      : '';

    root.innerHTML =
      '<div class="apt-act__app">' +
        '<div class="apt-act__topbar">' +
          '<p class="apt-act__eyebrow">' + (cfg.eyebrow || '') + '</p>' +
          '<h1 class="apt-act__title">' + (cfg.title || '') + '</h1>' +
          '<p class="apt-act__subtitle">' + (cfg.subtitle || '') + '</p>' +
        '</div>' +
        '<div class="apt-act__card"><div class="apt-act__content" aria-live="polite"></div></div>' +
        interactionHTML +
        '<button type="button" class="apt-act__skip-btn">Prefiero otro caso →</button>' +
        '<div class="apt-act__feedback apt-act__feedback--hidden"></div>' +
        '<div class="apt-act__actions">' +
          actionsHTML +
          '<button type="button" class="apt-act__next-btn apt-act__next-btn--hidden">' + (cfg.nextLabel || 'Probar con otro caso →') + '</button>' +
        '</div>' +
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
      grid: root.querySelector('.apt-act__grid'),
      checkBtn: root.querySelector('.apt-act__check-btn'),
      skipBtn: root.querySelector('.apt-act__skip-btn'),
      retryBtn: root.querySelector('.apt-act__retry-btn'),
      showAnswerBtn: root.querySelector('.apt-act__showanswer-btn'),
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

    function start() {
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
          btn.addEventListener('click', function () { answerChoice(choice.value, btn); });
          refs.choicesWrap.appendChild(btn);
        });
      }

      var current = null;
      var answered = false;
      var streak = 0;

      function resetCommonUI() {
        root.classList.remove('is-answered');
        refs.feedback.className = 'apt-act__feedback apt-act__feedback--hidden';
        refs.nextBtn.classList.add('apt-act__next-btn--hidden');
        if (refs.retryBtn) refs.retryBtn.classList.add('apt-act__retry-btn--hidden');
        if (refs.showAnswerBtn) refs.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
        answered = false;
      }

      function newRound() {
        current = cfg.generate();
        cfg.renderContent(refs.content, current);
        if (cfg.mode === 'grid') {
          buildGrid(refs.grid, cfg.grid, cfg, current);
          refs.checkBtn.disabled = false;
        }
        if (cfg.mode === 'choices') {
          refs.choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) {
            b.disabled = false;
            b.classList.remove('is-selected');
          });
        }
        resetCommonUI();
      }

      function showFeedback(correct, bodyHTML) {
        refs.feedback.className = 'apt-act__feedback ' + (correct ? 'apt-act__feedback--correct' : 'apt-act__feedback--wrong');
        refs.feedback.innerHTML = (correct ? CHECK_SVG : CROSS_SVG) +
          '<div class="apt-act__feedback-text"><strong>' + (correct ? '¡Correcto!' : 'No es correcto') + '</strong>' + bodyHTML + '</div>';
      }

      function registerResult(correct) {
        if (correct) { playCorrectSound(); celebrate(); } else { playWrongSound(); }
        streak = correct ? streak + 1 : 0;
        refs.streakEl.textContent = String(streak);
      }

      function answerChoice(value, btnEl) {
        if (answered) return;
        if (btnEl) btnEl.classList.add('is-selected');
        root.classList.add('is-answered');

        var correct = cfg.check(current, value);
        showFeedback(correct, cfg.explain(current, correct, value));
        if (cfg.onAnswered) cfg.onAnswered(refs.content, current, correct, value);
        registerResult(correct);

        refs.choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) { b.disabled = true; });
        refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
        answered = true;
      }

      function checkGridAnswer() {
        if (answered) return;
        root.classList.add('is-answered');

        var read = readStudentMatrix(refs.grid, cfg.grid);
        var result = cfg.checkGrid(current, read.matrix, read.hasEmpty);
        var correct = !!result.correct;

        refs.grid.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
          var r = +wrap.dataset.row, c = +wrap.dataset.col;
          wrap.classList.remove('is-correct', 'is-wrong');
          var st = result.cellStatus && result.cellStatus[r] && result.cellStatus[r][c];
          if (st === 'correct') wrap.classList.add('is-correct');
          else if (st === 'wrong') wrap.classList.add('is-wrong');
          wrap.querySelector('.apt-act__cell').disabled = true;
          setSignDisabled(wrap, true);
        });

        showFeedback(correct, result.feedbackText);
        registerResult(correct);

        refs.checkBtn.disabled = true;
        refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
        if (!correct) {
          if (refs.retryBtn) refs.retryBtn.classList.remove('apt-act__retry-btn--hidden');
          if (refs.showAnswerBtn) refs.showAnswerBtn.classList.remove('apt-act__retry-btn--hidden');
        }
        answered = true;
      }

      function retryGrid() {
        root.classList.remove('is-answered');
        refs.grid.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
          wrap.classList.remove('is-correct', 'is-wrong');
          wrap.querySelector('.apt-act__cell').disabled = false;
          setSignDisabled(wrap, false);
        });
        refs.feedback.className = 'apt-act__feedback apt-act__feedback--hidden';
        refs.nextBtn.classList.add('apt-act__next-btn--hidden');
        refs.retryBtn.classList.add('apt-act__retry-btn--hidden');
        if (refs.showAnswerBtn) refs.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
        refs.checkBtn.disabled = false;
        answered = false;
      }

      function showAnswerGrid() {
        var answerMatrix = cfg.getAnswerGrid(current);
        refs.grid.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
          var r = +wrap.dataset.row, c = +wrap.dataset.col;
          var val = answerMatrix[r][c];
          var input = wrap.querySelector('.apt-act__cell');
          setSign(wrap, val < 0 ? '-' : '+');
          input.value = String(Math.abs(val));
          wrap.classList.remove('is-wrong');
          wrap.classList.add('is-correct');
          setSignDisabled(wrap, true);
          input.disabled = true;
        });
        refs.retryBtn.classList.add('apt-act__retry-btn--hidden');
        refs.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
        refs.feedback.className = 'apt-act__feedback apt-act__feedback--correct';
        refs.feedback.innerHTML = CHECK_SVG +
          '<div class="apt-act__feedback-text"><strong>' + (cfg.answerTitle || 'La respuesta correcta') + '</strong>' + (cfg.answerText || '') + '</div>';
      }

      if (cfg.mode === 'grid') {
        refs.checkBtn.addEventListener('click', checkGridAnswer);
        if (refs.retryBtn) refs.retryBtn.addEventListener('click', retryGrid);
        if (refs.showAnswerBtn) refs.showAnswerBtn.addEventListener('click', showAnswerGrid);
      }

      refs.nextBtn.addEventListener('click', newRound);
      refs.skipBtn.addEventListener('click', newRound);

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
    }

    if (cfg.needsKatex) { ensureKatex(start); } else { start(); }
  }

  global.AptActivity = { init: init };
})(window);
