/* ============================================================
   ÁLGEBRA PARA TODOS · exam.js (v2.12)
   ------------------------------------------------------------
   Modo examen: independiente de engine.js a propósito (son dos
   cosas distintas que conviven, no una extensión de la otra).
   Lee la lógica de cada ejercicio desde window.AptExercises
   (exercises.js) — ese archivo tiene que cargarse ANTES que este.

   Uso:
     <script src=".../exercises.js"></script>
     <script src=".../exam.js"></script>
     <script>
       AptExam.init({
         title: 'Ejercicios de Álgebra Lineal',
         questionsPerTopic: 3
       });
     </script>
   ============================================================ */
(function (global) {
  'use strict';

  /* Subir esto en CADA cambio, aunque sea chico: menor para ajustes,
     mayor para cambios de fondo. Y mantener sincronizado el numero del
     comentario de arriba. La 2.0 es el salto de leer exercises.js a leer
     las actividades del repo, mas las preguntas compuestas. */
  var VERSION = '2.12';

  var FONT_LINK_ID = 'apt-exam-fonts';
  var KATEX_CSS_ID = 'apt-exam-katex-css';
  var KATEX_JS_ID = 'apt-exam-katex-js';
  var STYLE_ID = 'apt-exam-style';

  /* Devuelve el engine si esta cargado. Feature detection a proposito:
     si la landing no lo incluyo, el examen sigue funcionando igual,
     solo sin el normalizador. */
  function engine() {
    var A = global.AptActivity;
    return (A && typeof A.ensureAssets === 'function') ? A : null;
  }

  function ensureAssets() {
    /* Se apoya en el engine para dos cosas:
         - las fuentes, que son EXACTAMENTE las mismas (asi no se cargan
           dos veces)
         - el normalizador de delimitadores de matriz, que el engine
           instala sobre katex.render en cuanto KaTeX aparece. Sin esto
           el examen dibujaba las matrices con CORCHETES mientras las
           landings las muestran con PARENTESIS.
       El CSS propio de .apt-exam NO se toca: define sus propias
       variables y es independiente del de las actividades. */
    var E = engine();
    if (E) {
      try { E.ensureAssets(); } catch (e) { /* si falla, se sigue igual */ }
    }
    if (!E && !document.getElementById(FONT_LINK_ID)) {
      var pre = document.createElement('link');
      pre.rel = 'preconnect'; pre.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pre);
      var fonts = document.createElement('link');
      fonts.id = FONT_LINK_ID; fonts.rel = 'stylesheet';
      fonts.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Lora:wght@600;700&display=swap';
      document.head.appendChild(fonts);
    }
    if (!document.getElementById(STYLE_ID)) {
      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS.join('\n');
      document.head.appendChild(style);
      var bg = document.createElement('style');
      bg.textContent = 'body{ background-color:#0A0A0D; }';
      document.head.appendChild(bg);
    }
  }

  var _katexCssLoadedExam = false;
  var _katexFontsReadyExam = false;
  var KATEX_FONT_FAMILIES = [
    'KaTeX_AMS', 'KaTeX_Caligraphic', 'KaTeX_Fraktur', 'KaTeX_Main',
    'KaTeX_Math', 'KaTeX_SansSerif', 'KaTeX_Script', 'KaTeX_Size1',
    'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4', 'KaTeX_Typewriter'
  ];
  function forzarCargaDeFuentesExam(onDone) {
    if (!document.fonts || typeof document.fonts.load !== 'function') { onDone(); return; }
    var promesas = KATEX_FONT_FAMILIES.map(function (fam) {
      return document.fonts.load('1em "' + fam + '"').catch(function () {});
    });
    Promise.all(promesas).then(onDone).catch(onDone);
  }
  function ensureKatex(callback) {
    if (global.katex && _katexCssLoadedExam && _katexFontsReadyExam) { callback(); return; }
    if (!document.getElementById(KATEX_CSS_ID)) {
      var css = document.createElement('link');
      css.id = KATEX_CSS_ID; css.rel = 'stylesheet';
      /* Auto-hospedado en el mismo GitHub Pages que engine.js — antes
         dependía de cdnjs.cloudflare.com. El onload del CSS confirma
         que las REGLAS ya están en el CSSOM, pero no que los .woff2 de
         cada fuente ya se descargaron — eso lo hace el navegador recién
         cuando hace falta pintar un glifo con ella. Un delimitador
         grande (\begin{cases}, matrices) se arma apilando piezas de una
         fuente con precisión de píxel: si una pieza llega un instante
         tarde, no se reacomoda sola después. Por eso se fuerza la
         descarga real de las 12 familias de KaTeX antes de renderizar,
         no alcanza con esperar el CSS. Mismo fix que en engine.js. */
      css.href = 'https://algebraparatodos.github.io/problemas-tomo-2/katex/katex.min.css';
      css.onload = function () {
        _katexCssLoadedExam = true;
        forzarCargaDeFuentesExam(function () { _katexFontsReadyExam = true; });
      };
      css.onerror = function () { _katexCssLoadedExam = true; _katexFontsReadyExam = true; };
      document.head.appendChild(css);
    }
    if (!document.getElementById(KATEX_JS_ID)) {
      var js = document.createElement('script');
      js.id = KATEX_JS_ID;
      js.src = 'https://algebraparatodos.github.io/problemas-tomo-2/katex/katex.min.js';
      document.head.appendChild(js);
    }
    var check = setInterval(function () {
      if (global.katex && _katexCssLoadedExam && _katexFontsReadyExam) { clearInterval(check); callback(); }
    }, 50);
  }


  var CSS = [
    '.apt-exam{ --bg:#0A0A0D; --bg-card:#16161C; --grid-line:rgba(151,161,216,0.14); --ink:#F5F5F7; --ink-soft:#A7ACC0; --chalk:#48507D; --chalk-hover:#5A639A; --chalk-light:#97A1D8; --correct:#5BCD9A; --correct-bg:rgba(91,205,154,0.12); --wrong:#D65252; --wrong-bg:rgba(214,82,82,0.12); --font-mono:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace; --font-serif:"Lora",Georgia,"Times New Roman",serif; --radius:14px; --max-w:520px; min-height:100vh; width:100%; box-sizing:border-box; background:linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0/100% 28px, linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0/28px 100%, var(--bg); color:var(--ink); font-family:var(--font-mono); padding:max(24px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom)); display:flex; align-items:center; justify-content:center; }',
    '.apt-exam *{ box-sizing:border-box; }',
    '.apt-exam__app{ width:100%; max-width:var(--max-w); display:flex; flex-direction:column; gap:clamp(12px,2.6vh,20px); }',
    '.apt-exam__eyebrow{ font-family:var(--font-serif); font-weight:700; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--chalk-light); margin:0 0 8px; text-align:center; }',
    '.apt-exam__title{ font-family:var(--font-mono); font-weight:700; font-size:clamp(22px,6.5vw,28px); margin:0; color:var(--ink) !important; line-height:1.25; text-align:center; }',
    '.apt-exam__subtitle{ font-family:var(--font-mono); font-size:13.5px; color:var(--ink-soft); margin:8px 0 0; line-height:1.5; text-align:center; }',
    '.apt-exam__card{ background:var(--bg-card); border:1px solid rgba(151,161,216,0.18); border-radius:var(--radius); box-shadow:0 1px 3px rgba(0,0,0,.4), 0 10px 24px rgba(0,0,0,.35); padding:18px; }',
    '.apt-exam__sin-temas{ text-wrap:pretty; text-align:center; font-family:var(--font-mono);'
      + ' font-size:13px; color:var(--ink-soft); line-height:1.6; margin:0; padding:14px 6px; }',
    '.apt-exam__unit-block{ margin-bottom:16px; }',
    '.apt-exam__unit-block:last-child{ margin-bottom:0; }',
    '.apt-exam__result-nota{ font-family:var(--font-mono); font-size:11px; color:var(--ink-soft); opacity:.7; }',
    '.apt-exam__space-answer{ display:flex; flex-direction:column; gap:10px; align-items:center; width:100%; }',
    '.apt-exam__space-row{ display:flex; align-items:center; justify-content:center; gap:8px;'
      + ' flex-wrap:wrap; width:100%; }',
    '.apt-exam__eq{ font-family:var(--font-mono); font-weight:700; font-size:15px; color:var(--ink); }',
    '.apt-exam__abandonar-row{ display:flex; justify-content:center; padding:18px 0 4px; }',
    '.apt-exam__abandonar-btn{ background:none; border:none; cursor:pointer; padding:6px 10px;'
      + ' font-family:var(--font-mono); font-size:12px; color:var(--ink-soft); opacity:.7;'
      + ' text-decoration:underline; -webkit-tap-highlight-color:transparent; }',
    '.apt-exam__abandonar-btn:hover{ opacity:1; }',
    '.apt-exam__abandonar-btn.is-confirmando{ color:#E86B6B; opacity:1; text-decoration:none; }',
    '.apt-exam__abandonar-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; border-radius:4px; }',
    '.apt-exam__versiones{ text-align:center; font-family:var(--font-mono); font-size:10.5px;'
      + ' color:var(--ink-soft); opacity:.55; margin:10px 0 0; letter-spacing:.03em; }',
    '.apt-exam__unit-toggle{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px;'
      + ' background:transparent; border:none; cursor:pointer; padding:8px 2px; margin:0 0 4px;'
      + ' -webkit-tap-highlight-color:transparent; }',
    '.apt-exam__unit-toggle::after{ content:"\\25BE"; flex:0 0 auto; color:var(--ink); font-size:18px;'
      + ' line-height:1; transition:transform .18s ease; }',
    '.apt-exam__unit-toggle.is-open::after{ transform:rotate(180deg); }',
    '.apt-exam__unit-toggle:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; border-radius:6px; }',
    /* flex:1 en el nombre: se queda con el espacio sobrante y empuja la
       cuenta y la flecha contra el borde derecho. Con space-between solo,
       la cuenta quedaba a distinta altura en cada unidad segun el largo
       del nombre. */
    '.apt-exam__unit-name{ flex:1 1 auto; font-family:var(--font-serif); font-weight:700; font-size:14px;'
      + ' color:var(--ink); text-align:left; }',
    '.apt-exam__unit-count{ flex:0 0 auto; text-align:right; font-family:var(--font-mono); font-size:11px;'
      + ' color:var(--ink-soft); opacity:.75; white-space:nowrap; }',
    '.apt-exam__unit-count.is-active{ color:var(--chalk-light); opacity:1; }',
    '.apt-exam__unit-body--closed{ display:none; }',
    '.apt-exam__unit-title{ font-family:var(--font-serif); font-weight:700; font-size:14px; color:var(--ink); margin:0 0 8px; }',
    '.apt-exam__topic-btn{ width:100%; display:flex; align-items:center; gap:10px; text-align:left; font-family:var(--font-mono); font-size:13.5px; color:var(--ink-soft); background:rgba(151,161,216,0.05); border:1.5px solid rgba(151,161,216,0.25); border-radius:10px; padding:12px 14px; margin-bottom:8px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .15s ease, border-color .15s ease, color .15s ease; }',
    '.apt-exam__topic-btn:last-child{ margin-bottom:0; }',
    '.apt-exam__topic-btn::before{ content:"☐"; flex:0 0 auto; font-size:16px; color:var(--chalk-light); }',
    '.apt-exam__topic-btn.is-selected{ background:rgba(151,161,216,0.14); border-color:var(--chalk-light); color:var(--ink); }',
    '.apt-exam__topic-btn.is-selected::before{ content:"☑"; }',
    '.apt-exam__topic-btn.is-locked{ opacity:.5; }',
    '.apt-exam__topic-btn.is-locked::before{ content:"🔒"; font-size:13px; }',
    '.apt-exam__topic-btn.is-locked:hover{ opacity:.7; }',
    '.apt-exam__trial-banner{ display:block; text-align:center; text-decoration:none; font-family:var(--font-mono); font-size:12.5px; line-height:1.5; color:var(--chalk-light); background:rgba(151,161,216,0.08); border:1.5px dashed rgba(151,161,216,0.35); border-radius:12px; padding:12px 16px; margin-top:10px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .15s ease; }',
    '.apt-exam__trial-banner:hover{ background:rgba(151,161,216,0.16); }',
    '.apt-exam__start-btn{ width:100%; font-family:var(--font-serif); font-weight:700; font-size:16px; color:#fff; background:var(--chalk); border:none; border-radius:12px; padding:16px; min-height:54px; cursor:pointer; transition:background .15s ease, opacity .15s ease; margin-top:8px !important; }',
    '.apt-exam__start-btn:hover{ background:var(--chalk-hover); }',
    '.apt-exam__start-btn:disabled{ opacity:.4; cursor:default; }',
    '.apt-exam__progress-row{ display:flex; justify-content:space-between; align-items:center; font-family:var(--font-mono); font-size:12.5px; color:var(--ink-soft); }',
    '.apt-exam__timers{ display:flex; align-items:baseline; gap:10px; }',
    '.apt-exam__timer-total{ font-family:var(--font-mono); font-size:11px; color:var(--ink-soft); opacity:.75; font-variant-numeric:tabular-nums; }',
    '.apt-exam__timer-total::before{ content:"total "; }',
    '.apt-exam__timer{ font-family:var(--font-mono); font-weight:700; color:var(--chalk-light); font-variant-numeric:tabular-nums; }',
    '.apt-exam__prompt{ font-family:var(--font-mono); font-size:13.5px; color:var(--ink-soft); text-align:center; margin:0; line-height:1.5; }',
    '.apt-exam__progress-bar{ height:4px; border-radius:2px; background:rgba(151,161,216,0.15); overflow:hidden; }',
    '.apt-exam__progress-fill{ height:100%; background:var(--chalk-light); transition:width .25s ease; }',
    '.apt-exam__content{ width:100%; display:flex; justify-content:center; font-size:clamp(16px,4.6vw,21px); min-height:60px; align-items:center; }',
    '.apt-exam__content .katex{ color:var(--ink); }',
    '.apt-exam__choices{ display:flex; flex-direction:column; gap:8px; }',
    '.apt-exam__choice-btn{ font-family:var(--font-serif); font-weight:700; font-size:15px; padding:15px 16px; border-radius:12px; border:2px solid var(--chalk-light); background:transparent; color:var(--chalk-light); cursor:pointer; min-height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; transition:transform .08s ease, background .15s ease, color .15s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-exam__choice-btn:active{ transform:scale(.98); }',
    '.apt-exam__choice-sub{ font-family:var(--font-mono); font-weight:400; font-size:11px; opacity:.75; }',
    '.apt-exam__matrixwrap{ display:flex; align-items:stretch; justify-content:center; gap:6px; }',
    '.apt-exam__solution{ display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:6px 8px; margin-bottom:4px; }',
    '.apt-exam__eq{ font-family:var(--font-serif); font-weight:700; font-size:18px; color:var(--ink); }',
    '.apt-exam__op{ font-family:var(--font-serif); font-weight:700; font-size:18px; color:var(--ink-soft); }',
    '.apt-exam__paramlabel{ font-family:var(--font-serif); font-weight:700; font-size:17px; color:var(--ink); }',
    '.apt-exam__vec{ display:flex; align-items:stretch; gap:3px; }',
    '.apt-exam__vec-bracket{ width:6px; border-top:2.5px solid var(--ink-soft); border-bottom:2.5px solid var(--ink-soft); flex:0 0 auto; }',
    '.apt-exam__vec-bracket--left{ border-left:2.5px solid var(--ink-soft); border-radius:4px 0 0 4px; }',
    '.apt-exam__vec-bracket--right{ border-right:2.5px solid var(--ink-soft); border-radius:0 4px 4px 0; }',
    '.apt-exam__vec-col{ display:flex; flex-direction:column; gap:5px; padding:4px 2px; }',
    '.apt-exam__vec .apt-exam__cellwrap{ gap:2px; }',
    '.apt-exam__vec .apt-exam__signseg{ flex-basis:26px; width:26px; }',
    '.apt-exam__vec .apt-exam__cell{ width:40px; flex:0 0 auto; }',
    '.apt-exam__bracket{ width:9px; border-top:3px solid var(--ink-soft); border-bottom:3px solid var(--ink-soft); }',
    '.apt-exam__bracket--left{ border-left:3px solid var(--ink-soft); border-radius:5px 0 0 5px; }',
    '.apt-exam__bracket--right{ border-right:3px solid var(--ink-soft); border-radius:0 5px 5px 0; }',
    '.apt-exam__grid{ display:grid; gap:8px 6px; padding:4px; }',
    '.apt-exam__divider{ width:2px; background:var(--chalk-light); opacity:.45; justify-self:center; }',
    '.apt-exam__cellwrap{ display:flex; align-items:stretch; gap:3px; }',
    '.apt-exam__signseg{ flex:0 0 34px; width:34px; display:flex; border:2px solid rgba(151,161,216,0.3); border-radius:7px; overflow:hidden; }',
    '.apt-exam__signseg-btn{ flex:1 1 50%; min-width:0; border:none; background:transparent; color:var(--ink-soft); font-family:var(--font-mono); font-weight:700; font-size:13px; cursor:pointer; padding:0; -webkit-tap-highlight-color:transparent; }',
    '.apt-exam__signseg-btn + .apt-exam__signseg-btn{ border-left:1px solid rgba(151,161,216,0.3); }',
    '.apt-exam__signseg-btn.is-active{ background:var(--chalk); color:#fff; }',
    '.apt-exam__cell{ flex:1 1 auto; min-width:0; text-align:center; font-family:var(--font-mono); font-weight:500; font-size:clamp(15px,4.2vw,18px); color:var(--ink); background:rgba(151,161,216,0.07); border:2px solid rgba(151,161,216,0.3); border-radius:8px; padding:8px 2px; -webkit-appearance:none; }',
    '.apt-exam__cell:focus{ outline:none; border-color:var(--chalk-light); background:rgba(151,161,216,0.14); }',
    '.apt-exam__check-btn{ width:100%; font-family:var(--font-serif); font-weight:700; font-size:16px; padding:16px; border-radius:12px; border:2px solid var(--chalk-light); background:transparent; color:var(--chalk-light); cursor:pointer; min-height:52px; }',
    '.apt-exam__check-btn:hover{ background:rgba(151,161,216,0.1); }',
    '.apt-exam__hint{ text-align:center; font-family:var(--font-mono); font-size:12px; color:var(--ink-soft); opacity:.8; margin:0; }',
    '.apt-exam__hint:empty{ display:none; margin:0; }',
    '.apt-exam__multiselect{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; }',
    '.apt-exam__ms-btn{ display:flex; align-items:center; gap:8px; text-align:left; font-family:var(--font-mono); font-size:12.5px; color:var(--ink-soft); background:var(--bg-card); border:1.5px solid rgba(151,161,216,0.25); border-radius:10px; padding:12px 10px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .15s ease, border-color .15s ease, color .15s ease; }',
    '.apt-exam__ms-btn::before{ content:"☐"; flex:0 0 auto; }',
    '.apt-exam__ms-btn.is-selected{ background:rgba(151,161,216,0.14); border-color:var(--chalk-light); color:var(--ink); }',
    '.apt-exam__ms-btn.is-selected::before{ content:"☑"; }',
    '.apt-exam__doc-header{ display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid rgba(151,161,216,0.18); margin-bottom:4px; font-family:var(--font-serif); font-weight:700; font-size:12.5px; }',
    '.apt-exam__doc-header a{ color:var(--chalk-light); text-decoration:none; }',
    '.apt-exam__doc-header a:hover{ text-decoration:underline; }',
    '.apt-exam__doc-footer{ display:flex; justify-content:space-between; align-items:center; padding-top:10px; margin-top:4px; border-top:1px solid rgba(151,161,216,0.18); font-family:var(--font-mono); font-size:11.5px; }',
    '.apt-exam__doc-footer a{ color:var(--ink-soft); text-decoration:none; }',
    '.apt-exam__doc-footer a:hover{ text-decoration:underline; }',
    '.apt-exam__results-summary{ text-align:center; }',
    '.apt-exam__score{ font-family:var(--font-serif); font-weight:700; font-size:32px; color:var(--ink); margin:0; }',
    '.apt-exam__score-sub{ font-family:var(--font-mono); font-size:13px; color:var(--ink-soft); margin:6px 0 0; }',
    '.apt-exam__score-topics{ font-family:var(--font-mono); font-size:11.5px; color:var(--ink-soft); opacity:.8; margin:6px 0 0; line-height:1.5; }',
    '.apt-exam__result-item{ border:1px solid rgba(151,161,216,0.18); border-radius:12px; margin-bottom:8px; overflow:hidden; }',
    '.apt-exam__result-head{ width:100%; display:flex; align-items:center; gap:10px; padding:13px 14px; background:rgba(151,161,216,0.05); border:none; cursor:pointer; text-align:left; font-family:var(--font-mono); font-size:13.5px; color:var(--ink); -webkit-tap-highlight-color:transparent; }',
    '.apt-exam__result-icon{ flex:0 0 auto; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; }',
    '.apt-exam__result-item.is-correct .apt-exam__result-icon{ background:var(--correct-bg); color:var(--correct); }',
    '.apt-exam__result-item.is-wrong .apt-exam__result-icon{ background:var(--wrong-bg); color:var(--wrong); }',
    '.apt-exam__result-title{ flex:1 1 auto; }',
    '.apt-exam__result-time{ flex:0 0 auto; color:var(--ink-soft); font-size:11.5px; }',
    '.apt-exam__result-chevron{ flex:0 0 auto; color:var(--chalk-light); font-size:16px; transition:transform .15s ease; }',
    '.apt-exam__result-item.is-open .apt-exam__result-chevron{ transform:rotate(90deg); }',
    '.apt-exam__result-body{ display:none; padding:14px; border-top:1px solid rgba(151,161,216,0.12); }',
    '.apt-exam__result-item.is-open .apt-exam__result-body{ display:block; }',
    '.apt-exam__result-label{ font-family:var(--font-serif); font-weight:700; font-size:12.5px; color:var(--ink-soft); margin:0 0 4px; }',
    '.apt-exam__result-value{ font-family:var(--font-mono); font-size:13px; color:var(--ink); margin:0 0 12px; line-height:1.5; }',
    '.apt-exam__result-value.is-correct-text{ color:var(--correct); }',
    '.apt-exam__result-value.is-wrong-text{ color:var(--wrong); }',
    '.apt-exam__pdf-btn{ width:100%; font-family:var(--font-serif); font-weight:700; font-size:14.5px; color:var(--chalk-light); background:transparent; border:2px solid var(--chalk-light); border-radius:12px; padding:14px; min-height:50px; cursor:pointer; margin-top:8px; transition:background .15s ease; }',
    '.apt-exam__pdf-btn:hover{ background:rgba(151,161,216,0.1); }',
    '.apt-exam__restart-btn{ width:100%; font-family:var(--font-serif); font-weight:700; font-size:15px; color:#fff; background:var(--chalk); border:none; border-radius:12px; padding:15px; min-height:50px; cursor:pointer; margin-top:8px; }',
    '.apt-exam__restart-btn:hover{ background:var(--chalk-hover); }',
    '.apt-exam__screen--hidden{ display:none; }',
    '@media print{',
    '  body *{ visibility:hidden !important; }',
    '  .apt-exam, .apt-exam *{ visibility:visible !important; }',
    '  .apt-exam{ position:absolute !important; left:0; top:0; width:100%; }',
    '  .apt-exam__screen--select, .apt-exam__screen--running{ display:none !important; }',
    '  .apt-exam__pdf-btn, .apt-exam__restart-btn{ display:none !important; }',
    '  .apt-exam__result-body{ display:block !important; }',
    '  .apt-exam__result-chevron{ display:none !important; }',
    '  .apt-exam{ background:#fff !important; color:#111 !important; min-height:0; }',
    '  .apt-exam__card, .apt-exam__result-item, .apt-exam__result-head{ background:#fff !important; border-color:#ccc !important; color:#111 !important; }',
    '  .apt-exam__result-item{ break-inside:avoid; }',
    '  .apt-exam .katex{ color:#111 !important; }',
    '  .apt-exam__doc-header, .apt-exam__doc-footer{ border-color:#ccc !important; }',
    '  .apt-exam__doc-header a, .apt-exam__doc-footer a{ color:#3949AB !important; }',
    '  .apt-exam__score, .apt-exam__score-sub, .apt-exam__score-topics{ color:#111 !important; }',
    '}'
  ];

  /* ---------- utilidades ---------- */
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function formatTime(ms) {
    var s = Math.round(ms / 1000);
    var m = Math.floor(s / 60);
    var rem = s % 60;
    return m + ':' + (rem < 10 ? '0' : '') + rem;
  }

  /* ---------- grilla de entrada (self-contained, no depende de engine.js) ---------- */
  var SUBS = ['\u2080', '\u2081', '\u2082', '\u2083', '\u2084', '\u2085', '\u2086'];

  function resolveNum(spec, current) {
    return typeof spec === 'function' ? spec(current) : spec;
  }

  /* Mismo criterio que engine.js: en desktop (mouse/trackpad de
     precisión) no tiene sentido el botón −/+ — se escribe el signo
     directo con el teclado, como cualquier campo numérico. En táctil
     queda igual que siempre. Ver el comentario largo en engine.js para
     el porqué de matchMedia en vez de un ancho de pantalla fijo. */
  function isDesktopPointerExam() {
    try { return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches); }
    catch (e) { return false; }
  }

  /* Punto único donde se arma una celda con signo para exam.js (grid y
     vectors). Devuelve el <input> ya armado y agregado a wrap. */
  function buildSignedCellIntoExam(wrap) {
    var input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.className = 'apt-exam__cell';

    if (isDesktopPointerExam()) {
      wrap.classList.add('apt-exam__cellwrap--nosign');
      input.inputMode = 'text';
      input.addEventListener('input', function () {
        var neg = this.value.charAt(0) === '-';
        var digits = this.value.replace(/[^0-9]/g, '').slice(0, 2);
        this.value = (neg ? '-' : '') + digits;
      });
      wrap.appendChild(input);
    } else {
      var signSeg = document.createElement('div');
      signSeg.className = 'apt-exam__signseg';
      signSeg.dataset.sign = '+';
      ['-', '+'].forEach(function (s) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'apt-exam__signseg-btn' + (s === '+' ? ' is-active' : '');
        btn.textContent = s; btn.dataset.sign = s;
        btn.addEventListener('click', function () {
          signSeg.dataset.sign = s;
          signSeg.querySelectorAll('.apt-exam__signseg-btn').forEach(function (b) { b.classList.toggle('is-active', b.dataset.sign === s); });
        });
        signSeg.appendChild(btn);
      });
      input.inputMode = 'numeric';
      input.addEventListener('input', function () { this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2); });
      wrap.appendChild(signSeg);
      wrap.appendChild(input);
    }
    return input;
  }

  /* Lee el valor con signo de una celda, sin importar el modo. */
  function readSignedCellExam(wrap) {
    var input = wrap.querySelector('.apt-exam__cell');
    var raw = input.value.trim();
    if (raw === '' || raw === '-') return { value: 0, hasEmpty: true };
    var seg = wrap.querySelector('.apt-exam__signseg');
    if (seg) {
      var n = parseInt(raw, 10);
      return { value: seg.dataset.sign === '-' ? -n : n, hasEmpty: false };
    }
    return { value: parseInt(raw, 10), hasEmpty: false };
  }

  function signHintTextExam() {
    if (isDesktopPointerExam()) return ''; // obvio con teclado, no hace falta explicarlo
    return 'Tocá − o + para cambiar el signo de cada número.';
  }

  function buildGridInput(container, gridCfg, current) {
    container.innerHTML = '';
    var rows = resolveNum(gridCfg.rows, current), cols = resolveNum(gridCfg.cols, current), dividerAfterCol = gridCfg.dividerAfterCol;
    var hideBrackets = !!gridCfg.hideBrackets;
    var wrap = document.createElement('div');
    wrap.className = 'apt-exam__matrixwrap';
    var bracketL = document.createElement('span'); bracketL.className = 'apt-exam__bracket apt-exam__bracket--left';
    var bracketR = document.createElement('span'); bracketR.className = 'apt-exam__bracket apt-exam__bracket--right';
    var grid = document.createElement('div');
    grid.className = 'apt-exam__grid';
    // El divisor es una columna angosta (10px) separada de las columnas de
    // datos — NUNCA otra columna de minmax(62px,74px) completa (eso fue lo
    // que causaba desborde real en mobile con matrices de 4+ columnas).
    // Mismo enfoque que engine.js, con la misma protección: repeat(0,...)
    // es CSS inválido y tira abajo TODO el valor de grid-template-columns.
    var divAfter = dividerAfterCol != null ? dividerAfterCol : cols;
    var beforeCount = divAfter;
    var afterCount = cols - divAfter;
    var segments = [];
    if (beforeCount > 0) segments.push('repeat(' + beforeCount + ', minmax(62px,74px))');
    if (dividerAfterCol != null) segments.push('10px');
    if (afterCount > 0) segments.push('repeat(' + afterCount + ', minmax(62px,74px))');
    grid.style.gridTemplateColumns = segments.join(' ');

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cellwrap = document.createElement('div');
        cellwrap.className = 'apt-exam__cellwrap';
        cellwrap.dataset.row = r; cellwrap.dataset.col = c;
        cellwrap.style.gridRow = String(r + 1);
        cellwrap.style.gridColumn = String(dividerAfterCol && c >= dividerAfterCol ? c + 2 : c + 1);

        buildSignedCellIntoExam(cellwrap);
        grid.appendChild(cellwrap);
      }
    }
    if (dividerAfterCol) {
      var divider = document.createElement('div');
      divider.className = 'apt-exam__divider';
      divider.style.gridColumn = String(dividerAfterCol + 1);
      divider.style.gridRow = '1 / ' + (rows + 1);
      grid.appendChild(divider);
    }
    wrap.appendChild(hideBrackets ? document.createDocumentFragment() : bracketL);
    wrap.appendChild(grid);
    wrap.appendChild(hideBrackets ? document.createDocumentFragment() : bracketR);
    container.appendChild(wrap);

    return function readMatrix() {
      var M = []; var hasEmpty = false;
      for (var r = 0; r < rows; r++) {
        M.push([]);
        for (var c = 0; c < cols; c++) {
          var cw = grid.querySelector('.apt-exam__cellwrap[data-row="' + r + '"][data-col="' + c + '"]');
          var read = readSignedCellExam(cw);
          if (read.hasEmpty) hasEmpty = true;
          M[r].push(read.value);
        }
      }
      return { matrix: M, hasEmpty: hasEmpty };
    };
  }

  // ---------- mode:'vectors' — "S = particular + v1·t1 + v2·t2 + ..." ----------
  function buildSignedCellVec(key, row) {
    var wrap = document.createElement('div');
    wrap.className = 'apt-exam__cellwrap';
    wrap.dataset.key = key; wrap.dataset.row = row;
    buildSignedCellIntoExam(wrap);
    return wrap;
  }

  function buildVecBlockExam(key, rows) {
    var vec = document.createElement('div');
    vec.className = 'apt-exam__vec';
    var left = document.createElement('span'); left.className = 'apt-exam__vec-bracket apt-exam__vec-bracket--left';
    var right = document.createElement('span'); right.className = 'apt-exam__vec-bracket apt-exam__vec-bracket--right';
    var col = document.createElement('div');
    col.className = 'apt-exam__vec-col';
    for (var r = 0; r < rows; r++) col.appendChild(buildSignedCellVec(key, r));
    vec.appendChild(left); vec.appendChild(col); vec.appendChild(right);
    return vec;
  }

  function readVectorBlockExam(container, key, rows) {
    var vals = []; var hasEmpty = false;
    for (var r = 0; r < rows; r++) {
      var wrap = container.querySelector('.apt-exam__cellwrap[data-key="' + key + '"][data-row="' + r + '"]');
      var read = readSignedCellExam(wrap);
      if (read.hasEmpty) hasEmpty = true;
      vals.push(read.value);
    }
    return { vals: vals, hasEmpty: hasEmpty };
  }

  function buildVectorsInput(container, vecCfg, current) {
    container.innerHTML = '';
    container.className = 'apt-exam__solution';
    var rows = resolveNum(vecCfg.rows, current);
    var count = resolveNum(vecCfg.count, current);
    var hasParticular = vecCfg.hasParticular !== false;

    if (hasParticular) {
      var eq = document.createElement('span');
      eq.className = 'apt-exam__eq';
      eq.textContent = 'S =';
      container.appendChild(eq);
      container.appendChild(buildVecBlockExam('p', rows));
    }
    for (var i = 0; i < count; i++) {
      if (hasParticular || i > 0) {
        var plus = document.createElement('span');
        plus.className = 'apt-exam__op';
        plus.textContent = '+';
        container.appendChild(plus);
      }
      container.appendChild(buildVecBlockExam('d' + i, rows));
      var label = document.createElement('span');
      label.className = 'apt-exam__paramlabel';
      label.textContent = '· ' + (vecCfg.paramLabel ? vecCfg.paramLabel(current, i) : ('t' + (i + 1)));
      container.appendChild(label);
    }

    return function readVectors() {
      var particularRead = hasParticular ? readVectorBlockExam(container, 'p', rows) : null;
      var vectorReads = [];
      for (var i2 = 0; i2 < count; i2++) vectorReads.push(readVectorBlockExam(container, 'd' + i2, rows));
      var hasEmpty = (particularRead && particularRead.hasEmpty) || vectorReads.some(function (v) { return v.hasEmpty; });
      return {
        particularVals: particularRead ? particularRead.vals : null,
        vectorVals: vectorReads.map(function (v) { return v.vals; }),
        hasEmpty: hasEmpty
      };
    };
  }

  function vectorsToText(particular, vectors, paramLabels) {
    var parts = [];
    if (particular) parts.push('(' + particular.join(', ') + ')');
    vectors.forEach(function (v, i) {
      var lbl = (paramLabels && paramLabels[i]) || ('t' + (i + 1));
      parts.push('+ (' + v.join(', ') + ')·' + lbl);
    });
    return parts.join(' ');
  }

  /* Red de seguridad de ancho para las formulas.
     El modo examen no la tenia, y algunos enunciados —la matriz
     ampliada de Rouche-Frobenius con parametros, por ejemplo— miden
     mas de 400px y se salian de una pantalla de 320. Se achica la
     tipografia de la formula hasta que entre.

     Se aplica sobre el elemento .katex y no sobre un contenedor,
     porque renderContent arma su propio HTML y no hay una fila fija
     donde apoyarse. NO se usa overflow-x:auto: sobre KaTeX arrastra
     tambien el scroll vertical. */
  var PISO_ESCALA = 0.6;
  function ajustarAnchoFormulas(container) {
    if (!container) return;
    var disp = container.clientWidth;
    if (!disp) return;
    var meta = disp - 2;
    var todas = container.querySelectorAll('.katex');
    for (var i = 0; i < todas.length; i++) {
      var k = todas[i];
      // solo las formulas de nivel superior: una .katex anidada dentro
      // de otra ya queda escalada por su padre
      if (k.parentElement && k.parentElement.closest && k.parentElement.closest('.katex')) continue;
      k.style.fontSize = '';
      var w = k.getBoundingClientRect().width;
      if (!w || w <= meta) continue;
      var esc = Math.max(PISO_ESCALA, meta / w);
      k.style.fontSize = (esc * 100).toFixed(1) + '%';
      // segunda pasada: achicar la tipografia no reduce el ancho de
      // forma exactamente proporcional
      var w2 = k.getBoundingClientRect().width;
      if (w2 > meta && esc > PISO_ESCALA) {
        k.style.fontSize = (Math.max(PISO_ESCALA, esc * (meta / w2)) * 100).toFixed(1) + '%';
      }
    }
  }

  function matrixToLatex(M) {
    return '\\begin{bmatrix} ' + M.map(function (row) { return row.join(' & '); }).join(' \\\\ ') + ' \\end{bmatrix}';
  }

  /* ============================================================
     init()
     ============================================================ */
  function init(cfg) {
    ensureAssets();
    /* De donde salen los ejercicios, por orden de preferencia:
         1. cfg.registry, si la landing pasa uno a mano
         2. AptRegistro — el manifiesto que LEE las actividades del repo.
            Solo trae metadatos; los generadores se descargan cuando el
            alumno elige los temas.
         3. AptExercises — el registro viejo, con la logica duplicada,
            que queda solo como respaldo.
       Del manifiesto se muestran unicamente las actividades cuyo modo el
       examen ya sabe presentar. */
    var registry = cfg.registry ||
      (global.AptRegistro
        ? global.AptRegistro.lista().filter(function (e) { return e.soportado; })
        : null) ||
      global.AptExercises || [];
    var usaRegistro = !cfg.registry && !!global.AptRegistro;
    var questionsPerTopic = cfg.questionsPerTopic || 3;

    var mountEl = cfg.mount ? document.querySelector(cfg.mount) : null;
    var root = mountEl || document.createElement('div');
    root.className = 'apt-exam';
    if (!mountEl) {
      var script = document.currentScript;
      if (script && script.parentNode) script.parentNode.insertBefore(root, script);
      else document.body.appendChild(root);
    }

    root.innerHTML =
      '<div class="apt-exam__app">' +
        '<div class="apt-exam__screen apt-exam__screen--select">' +
          '<p class="apt-exam__eyebrow">' + (cfg.eyebrow || 'Álgebra Para Todos') + '</p>' +
          '<h1 class="apt-exam__title">' + (cfg.title || 'Ejercicios de Álgebra Lineal') + '</h1>' +
          '<p class="apt-exam__subtitle">' + (cfg.subtitle || 'Elegí los temas que querés practicar. Se arma un examen cronometrado, sin volver atrás.') + '</p>' +
          '<div class="apt-exam__card"><div class="apt-exam__topics"></div></div>' +
          '<button type="button" class="apt-exam__start-btn" disabled>Empezar examen</button>' +
          '<p class="apt-exam__versiones"></p>' +
        '</div>' +
        '<div class="apt-exam__screen apt-exam__screen--running apt-exam__screen--hidden">' +
          '<div class="apt-exam__progress-row"><span class="apt-exam__progress-label"></span><span class="apt-exam__timers"><span class="apt-exam__timer-total"></span><span class="apt-exam__timer">0:00</span></span></div>' +
          '<div class="apt-exam__progress-bar"><div class="apt-exam__progress-fill"></div></div>' +
          '<p class="apt-exam__prompt"></p>' +
          '<div class="apt-exam__card"><div class="apt-exam__content"></div></div>' +
          '<div class="apt-exam__answer"></div>' +
          '<div class="apt-exam__abandonar-row">' +
            '<button type="button" class="apt-exam__abandonar-btn">Armar otro examen</button>' +
          '</div>' +
        '</div>' +
        '<div class="apt-exam__screen apt-exam__screen--results apt-exam__screen--hidden">' +
          '<div class="apt-exam__doc-header">' +
            '<a href="https://www.algebraparatodos.com" target="_blank" rel="noopener">Álgebra Para Todos</a>' +
            '<a href="https://www.algebraparatodos.com/mi-libro" target="_blank" rel="noopener">Mi libro</a>' +
          '</div>' +
          '<div class="apt-exam__results-summary">' +
            '<p class="apt-exam__score"></p>' +
            '<p class="apt-exam__score-sub"></p>' +
            '<p class="apt-exam__score-topics"></p>' +
          '</div>' +
          '<div class="apt-exam__results-list"></div>' +
          '<button type="button" class="apt-exam__pdf-btn">Descargar como PDF</button>' +
          '<button type="button" class="apt-exam__restart-btn">Armar un nuevo examen →</button>' +
          '<div class="apt-exam__doc-footer">' +
            '<a href="https://www.instagram.com/soyjuanisilva/" target="_blank" rel="noopener">Creado por Juani Silva</a>' +
            '<a href="https://www.algebraparatodos.com/examen-algebra" target="_blank" rel="noopener">Probá otro examen →</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    var refs = {
      selectScreen: root.querySelector('.apt-exam__screen--select'),
      runningScreen: root.querySelector('.apt-exam__screen--running'),
      resultsScreen: root.querySelector('.apt-exam__screen--results'),
      topicsWrap: root.querySelector('.apt-exam__topics'),
      startBtn: root.querySelector('.apt-exam__start-btn'),
      progressLabel: root.querySelector('.apt-exam__progress-label'),
      timerEl: root.querySelector('.apt-exam__timer'),
      timerTotalEl: root.querySelector('.apt-exam__timer-total'),
      promptEl: root.querySelector('.apt-exam__prompt'),
      progressFill: root.querySelector('.apt-exam__progress-fill'),
      content: root.querySelector('.apt-exam__content'),
      answer: root.querySelector('.apt-exam__answer'),
      scoreEl: root.querySelector('.apt-exam__score'),
      scoreSubEl: root.querySelector('.apt-exam__score-sub'),
      scoreTopicsEl: root.querySelector('.apt-exam__score-topics'),
      resultsList: root.querySelector('.apt-exam__results-list'),
      pdfBtn: root.querySelector('.apt-exam__pdf-btn'),
      restartBtn: root.querySelector('.apt-exam__restart-btn'),
        abandonarBtn: root.querySelector('.apt-exam__abandonar-btn')
    };

    /* ---------- pantalla 1: selección de temas ---------- */
    var units = {};
    registry.forEach(function (ex) {
      if (!units[ex.unit]) units[ex.unit] = [];
      if (units[ex.unit].indexOf(ex.topic) === -1) units[ex.unit].push(ex.topic);
    });
    var selectedTopics = {};

    /* Modo trial: cfg.trial = { ctaUrl, freeRatio? }. Se bloquea por
       UNIDAD (no de corrido sobre el total), para que cada unidad
       muestre una muestra propia en vez de que la primera unidad
       quede toda libre y las últimas todas bloqueadas. freeRatio
       default 0.5 — "la mitad de los temas escogibles". */
    var trialLocked = {};
    if (cfg.trial) {
      var freeRatio = cfg.trial.freeRatio != null ? cfg.trial.freeRatio : 0.5;
      Object.keys(units).forEach(function (u) {
        var topics = units[u];
        var freeCount = Math.max(1, Math.round(topics.length * freeRatio));
        topics.forEach(function (t, i) { if (i >= freeCount) trialLocked[t] = true; });
      });
    }

      /* Un desplegable por unidad. Con 31 temas la lista de corrido era
         larga de recorrer en un celular; asi la pantalla arranca compacta
         y el alumno abre solo la unidad que le interesa.

         Cuando la unidad esta cerrada, la etiqueta de la derecha muestra
         cuantos temas eligio ahi dentro: sirve para no tener que abrirla
         de nuevo solo para ver que marco. */
      Object.keys(units).forEach(function (unitName) {
        var block = document.createElement('div');
        block.className = 'apt-exam__unit-block';

        var cab = document.createElement('button');
        cab.type = 'button';
        cab.className = 'apt-exam__unit-toggle';
        cab.setAttribute('aria-expanded', 'false');

        var nombre = document.createElement('span');
        nombre.className = 'apt-exam__unit-name';
        nombre.textContent = unitName;

        var cuenta = document.createElement('span');
        cuenta.className = 'apt-exam__unit-count';

        cab.appendChild(nombre);
        cab.appendChild(cuenta);
        block.appendChild(cab);

        var cuerpo = document.createElement('div');
        cuerpo.className = 'apt-exam__unit-body apt-exam__unit-body--closed';
        block.appendChild(cuerpo);

        var propios = units[unitName];
        function refrescarCuenta() {
          var n = propios.filter(function (t) { return selectedTopics[t]; }).length;
          cuenta.textContent = n ? (n + ' de ' + propios.length) : (propios.length + ' temas');
          cuenta.classList.toggle('is-active', n > 0);
        }
        refrescarCuenta();

        cab.addEventListener('click', function () {
          var cerrado = cuerpo.classList.toggle('apt-exam__unit-body--closed');
          cab.setAttribute('aria-expanded', cerrado ? 'false' : 'true');
          cab.classList.toggle('is-open', !cerrado);
        });

        propios.forEach(function (topic) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'apt-exam__topic-btn';
          btn.textContent = topic;
          if (trialLocked[topic]) {
            btn.classList.add('is-locked');
            btn.setAttribute('aria-label', topic + ' (bloqueado — registrate para desbloquear)');
            btn.addEventListener('click', function () { window.location.href = cfg.trial.ctaUrl; });
          } else {
            btn.addEventListener('click', function () {
              selectedTopics[topic] = !selectedTopics[topic];
              btn.classList.toggle('is-selected', !!selectedTopics[topic]);
              refrescarCuenta();
              refs.startBtn.disabled = !Object.keys(selectedTopics).some(function (t) { return selectedTopics[t]; });
            });
          }
          cuerpo.appendChild(btn);
        });

        refs.topicsWrap.appendChild(block);
      });

    /* Si no hay ni un tema, la pantalla quedaba con una tarjeta vacía y un
       botón muerto, sin decir nada. Pasa, por ejemplo, si la landing no
       incluye actividades-registro.js: el examen no tiene de dónde sacar
       los ejercicios. Mejor decirlo que dejar al alumno mirando una
       pantalla que no responde. */
    /* Las tres versiones a la vista. Cuando algo no anda, lo primero es
       saber si el navegador esta usando los archivos nuevos o una copia
       cacheada; asi se ve de un vistazo, sin abrir la consola. */
    (function () {
      var E = engine();
      var partes = ['examen v' + VERSION];
      if (global.AptRegistro && global.AptRegistro.version) partes.push('registro v' + global.AptRegistro.version);
      if (E && E.version) partes.push('engine v' + E.version);
      var el = root.querySelector('.apt-exam__versiones');
      if (el) el.textContent = partes.join(' \u00b7 ');
    })();

    /* Modo trial: banner clickeable entero (no solo un botón chico
       adentro) — todo el aviso lleva al checkout de la Offer gratuita. */
    if (cfg.trial) {
      var trialBanner = document.createElement('a');
      trialBanner.className = 'apt-exam__trial-banner';
      trialBanner.href = cfg.trial.ctaUrl;
      trialBanner.textContent = cfg.trial.text ||
        'Esta es una versión limitada. Para la versión full, tenés que registrarte. Es gratis.';
      refs.startBtn.insertAdjacentElement('afterend', trialBanner);
    }

    if (!registry.length) {
      var aviso = document.createElement('p');
      aviso.className = 'apt-exam__sin-temas';
      aviso.textContent = 'No se pudieron cargar los ejercicios. ' +
        'Probá recargar la página en un momento.';
      refs.topicsWrap.appendChild(aviso);
      refs.startBtn.style.display = 'none';
    }

    var examState = null;

    refs.startBtn.addEventListener('click', function () {
      var topics = Object.keys(selectedTopics).filter(function (t) { return selectedTopics[t]; });
      /* Con AptRegistro los generadores todavia no estan en memoria: se
         descargan solo los de los temas elegidos. Las 48 actividades
         juntas pesan mas de medio mega; asi una sesion baja tres o
         cuatro archivos. */
      if (usaRegistro) {
        var faltan = registry.filter(function (e) {
          return topics.indexOf(e.topic) !== -1 && typeof e.generate !== 'function';
        });
        if (faltan.length) {
          var textoBoton = refs.startBtn.textContent;
          refs.startBtn.disabled = true;
          refs.startBtn.textContent = 'Preparando el examen...';
          global.AptRegistro.cargar(faltan, function (cargadas) {
            // cada entrada del manifiesto se reemplaza por la version
            // con generadores, conservando su posicion
            cargadas.forEach(function (ex) {
              for (var i = 0; i < registry.length; i++) {
                if (registry[i].id === ex.id) { registry[i] = ex; break; }
              }
            });
            refs.startBtn.disabled = false;
            refs.startBtn.textContent = textoBoton;
            var listos = topics.filter(function (t) {
              return registry.some(function (e) { return e.topic === t && typeof e.generate === 'function'; });
            });
            if (!listos.length) {
              refs.startBtn.textContent = 'No se pudieron cargar los ejercicios';
              return;
            }
            startExam(listos);
          });
          return;
        }
      }
      startExam(topics);
    });

      /* Convierte una fase en algo con la MISMA forma que un ejercicio
         normal, para que el resto del examen no tenga que saber que esto
         vino de una actividad multi-paso. La fase aporta su pregunta y su
         forma de corregir; el contenido visual y el caso son los de la
         actividad, compartidos por todas sus fases. */
      function ejercicioDeFase(ex, fase, idx, total) {
        var e = {
          id: ex.id + '-f' + idx,
          unit: ex.unit,
          topic: ex.topic,
          title: ex.title,
          needsKatex: true,
          prompt: fase.question || ex.prompt || '',
          renderContent: ex.renderContent,
          explain: fase.explain || ex.explain,
          parte: total > 1 ? (idx + 1) + ' de ' + total : null
        };
        if (fase.mode === 'choices') {
          e.type = 'choices';
          e.choices = (typeof fase.choices === 'function') ? fase.choices : function () { return fase.choices; };
          e.check = fase.check;
        } else if (fase.mode === 'grid') {
          e.type = 'grid';
          e.grid = fase.grid;
          e.checkGrid = fase.checkGrid;
          e.getAnswerGrid = fase.getAnswerGrid;
        } else if (fase.mode === 'multiselect') {
          e.type = 'multiselect';
          e.options = (typeof fase.options === 'function') ? fase.options : function () { return fase.options; };
        } else if (fase.mode === 'space-basis') {
          /* Escribir una base. El widget y su lectura los pone el engine, asi
             que aca solo se guardan los datos para armarlo y corregirlo. */
          e.type = 'space-basis';
          e.sbCount = fase.count;
          e.sbSpace = fase.space;
          e.sbLabel = fase.answerLabel || 'v';
          e.sbExactMatch = !!fase.exactMatch;
          e.getExpectedBasis = fase.getExpectedBasis;
        } else if (fase.mode === 'vectors') {
          e.type = 'vectors';
          e.vectors = fase.vectors;
          e.checkVectors = fase.checkVectors;
          e.getAnswerVectors = fase.getAnswerVectors;
        } else {
          return null;
        }
        return e;
      }

      /* Una actividad de fases da VARIAS preguntas sobre el MISMO caso.
         Se devuelven como grupo para que despues queden juntas y en orden:
         si se mezclaran con el resto, una pregunta pediria la dimension de
         una matriz y otra, veinte preguntas mas tarde, su base — con la
         matriz ya fuera de vista.

         La cantidad de fases activas puede variar por caso (Determinante y
         area hace una sola pregunta si el determinante es 0), asi que se
         respeta activePhaseCount y no se asume un numero fijo. */
      function grupoDeFases(ex, current, topic) {
        var total = ex.activePhaseCount ? ex.activePhaseCount(current) : ex.phases.length;
        if (!(total > 0)) total = ex.phases.length;
        var activas = ex.phases.slice(0, total).filter(function (f) { return f.mode !== 'setup'; });
        var grupo = [];
        activas.forEach(function (fase, i) {
          var e = ejercicioDeFase(ex, fase, i, activas.length);
          if (e) grupo.push({ exercise: e, current: current, topic: topic });
        });
        return grupo;
      }

      function startExam(topics) {
        /* Se arma por GRUPOS y no por preguntas: cada grupo es una consigna
           completa, de una o varias partes. Se mezclan los grupos, no sus
           partes. */
        var grupos = [];
        topics.forEach(function (topic) {
          var pool = registry.filter(function (e) {
            return e.topic === topic && typeof e.generate === 'function';
          });
          if (!pool.length) return;
          for (var i = 0; i < questionsPerTopic; i++) {
            var ex = randChoice(pool);
            var caso = ex.generate();
            if (!caso) continue;
            if (ex.type === 'phases') {
              var g = grupoDeFases(ex, caso, topic);
              if (g.length) grupos.push(g);
            } else {
              grupos.push([{ exercise: ex, current: caso, topic: topic }]);
            }
          }
        });
        var questions = [];
        shuffle(grupos).forEach(function (g) {
          g.forEach(function (q) { questions.push(q); });
        });

      examState = { questions: questions, index: 0, records: [], qStartTime: null, timerInterval: null, examStartTime: Date.now() };

      function boot() {
        refs.selectScreen.classList.add('apt-exam__screen--hidden');
        refs.runningScreen.classList.remove('apt-exam__screen--hidden');
        renderQuestion();
      }
      var anyKatex = questions.some(function (q) { return q.exercise.needsKatex; });
      if (anyKatex) ensureKatex(boot); else boot();
    }

    function renderQuestion() {
      var q = examState.questions[examState.index];
      /* Si la consigna tiene varias partes, se avisa: el alumno tiene que
         saber que las siguientes preguntas son sobre el mismo caso. */
      refs.progressLabel.textContent = 'Pregunta ' + (examState.index + 1) + ' de ' + examState.questions.length + (q.exercise.parte ? ' \u00b7 parte ' + q.exercise.parte : '');
      refs.progressFill.style.width = (100 * examState.index / examState.questions.length) + '%';

      q.exercise.renderContent(refs.content, q.current);
      ajustarAnchoFormulas(refs.content);
      /* Los subtitulos de las actividades pueden traer $...$. Se usa la
         funcion del engine en vez de reimplementar el parseo; si el
         engine no esta, se cae a texto plano. */
      var textoPrompt = (typeof q.exercise.prompt === 'function' ? q.exercise.prompt(q.current) : q.exercise.prompt) || '';
      /* SIEMPRE como HTML, igual que el engine con el subtitulo de una
         actividad. Los enunciados pueden traer <br> o <small> —la
         aclaracion de "la solucion no es unica" de Solucion parametrica, por
         ejemplo— y pintarlos como texto plano mostraba las etiquetas
         literales en pantalla. renderTextWithMath deja intacto lo que no es
         matematica, asi que sirve para los dos casos. */
      var A_eng = engine();
      if (A_eng && typeof A_eng.renderTextWithMath === 'function') {
        refs.promptEl.innerHTML = A_eng.renderTextWithMath(textoPrompt);
      } else {
        refs.promptEl.innerHTML = textoPrompt;
      }

      refs.answer.innerHTML = '';
      var readMatrix = null;

      if (q.exercise.type === 'choices') {
        var choicesWrap = document.createElement('div');
        choicesWrap.className = 'apt-exam__choices';
        q.exercise.choices(q.current).forEach(function (choice) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'apt-exam__choice-btn';
          btn.innerHTML = '<span>' + choice.label + '</span>' + (choice.sub ? '<span class="apt-exam__choice-sub">' + choice.sub + '</span>' : '');
          btn.addEventListener('click', function () { submitAnswer(choice.value); });
          choicesWrap.appendChild(btn);
        });
        refs.answer.appendChild(choicesWrap);
      } else if (q.exercise.type === 'grid') {
        var gridContainer = document.createElement('div');
        refs.answer.appendChild(gridContainer);
        readMatrix = buildGridInput(gridContainer, q.exercise.grid, q.current);
        var hint = document.createElement('p');
        hint.className = 'apt-exam__hint';
        hint.textContent = signHintTextExam();
        refs.answer.appendChild(hint);
        var checkBtn = document.createElement('button');
        checkBtn.type = 'button';
        checkBtn.className = 'apt-exam__check-btn';
        checkBtn.textContent = 'Confirmar respuesta';
        checkBtn.addEventListener('click', function () {
          var read = readMatrix();
          submitAnswer(read.matrix, read.hasEmpty);
        });
        refs.answer.appendChild(checkBtn);
      } else if (q.exercise.type === 'vectors') {
        var vecContainer = document.createElement('div');
        refs.answer.appendChild(vecContainer);
        var readVectors = buildVectorsInput(vecContainer, q.exercise.vectors, q.current);
        var vhint = document.createElement('p');
        vhint.className = 'apt-exam__hint';
        vhint.textContent = signHintTextExam();
        refs.answer.appendChild(vhint);
        var vCheckBtn = document.createElement('button');
        vCheckBtn.type = 'button';
        vCheckBtn.className = 'apt-exam__check-btn';
        vCheckBtn.textContent = 'Confirmar respuesta';
        vCheckBtn.addEventListener('click', function () {
          submitAnswer(readVectors());
        });
        refs.answer.appendChild(vCheckBtn);
      } else if (q.exercise.type === 'space-basis') {
        /* Escribir una base. El widget y su lectura los pone el engine
           (buildSpaceInputWidget / readSpaceInputWidget): aca no se
           reimplementa nada, que es el punto de apoyarse en el engine. */
        var A_sb = engine();
        var sbCount = resolveNum(q.exercise.sbCount, q.current);
        var sbSpace = (typeof q.exercise.sbSpace === 'function')
          ? q.exercise.sbSpace(q.current) : q.exercise.sbSpace;
        var sbWrap = document.createElement('div');
        sbWrap.className = 'apt-exam__space-answer';
        for (var sbi = 0; sbi < sbCount; sbi++) {
          var sbRow = document.createElement('div');
          sbRow.className = 'apt-exam__space-row';
          var sbLab = document.createElement('span');
          sbLab.className = 'apt-exam__eq';
          sbLab.textContent = q.exercise.sbLabel +
            (sbCount > 1 ? (SUBS[sbi + 1] || ('_' + (sbi + 1))) : '') + ' =';
          sbRow.appendChild(sbLab);
          sbWrap.appendChild(sbRow);
          A_sb.buildSpaceInputWidget(sbRow, sbSpace, 'v' + sbi);
        }
        refs.answer.appendChild(sbWrap);
        var sbHint = document.createElement('p');
        sbHint.className = 'apt-exam__hint';
        sbHint.textContent = signHintTextExam();
        refs.answer.appendChild(sbHint);
        var sbBtn = document.createElement('button');
        sbBtn.type = 'button';
        sbBtn.className = 'apt-exam__check-btn';
        sbBtn.textContent = 'Confirmar respuesta';
        sbBtn.addEventListener('click', function () {
          var reads = [], vacio = false;
          for (var i = 0; i < sbCount; i++) {
            var r = A_sb.readSpaceInputWidget(sbWrap, sbSpace, 'v' + i);
            reads.push(r.coords);
            if (r.hasEmpty) vacio = true;
          }
          submitAnswer({ reads: reads, hasEmpty: vacio, space: sbSpace });
        });
        refs.answer.appendChild(sbBtn);
      } else if (q.exercise.type === 'multiselect') {
        var msWrap = document.createElement('div');
        msWrap.className = 'apt-exam__multiselect';
        var selected = {};
        q.exercise.options(q.current).forEach(function (opt) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'apt-exam__ms-btn';
          btn.textContent = opt.label;
          btn.addEventListener('click', function () {
            selected[opt.value] = !selected[opt.value];
            btn.classList.toggle('is-selected', !!selected[opt.value]);
          });
          msWrap.appendChild(btn);
        });
        refs.answer.appendChild(msWrap);
        var msCheckBtn = document.createElement('button');
        msCheckBtn.type = 'button';
        msCheckBtn.className = 'apt-exam__check-btn';
        msCheckBtn.textContent = 'Confirmar respuesta';
        msCheckBtn.addEventListener('click', function () {
          var chosen = Object.keys(selected).filter(function (k) { return selected[k]; });
          submitAnswer(chosen);
        });
        refs.answer.appendChild(msCheckBtn);
      }

      /* Las opciones tambien pueden ser formulas anchas —las de
         "Ecuaciones implicitas" son sistemas completos en KaTeX— asi que
         el ajuste de ancho se aplica igual que al enunciado. */
      ajustarAnchoFormulas(refs.answer);

      examState.qStartTime = Date.now();
      if (examState.timerInterval) clearInterval(examState.timerInterval);
      refs.timerEl.textContent = '0:00';
      refs.timerTotalEl.textContent = formatTime(Date.now() - examState.examStartTime);
      examState.timerInterval = setInterval(function () {
        refs.timerEl.textContent = formatTime(Date.now() - examState.qStartTime);
        refs.timerTotalEl.textContent = formatTime(Date.now() - examState.examStartTime);
      }, 250);
    }

    function submitAnswer(value, hasEmpty) {
      var q = examState.questions[examState.index];
      clearInterval(examState.timerInterval);
      var timeMs = Date.now() - examState.qStartTime;

      var correct, studentAnswerDisplay, correctAnswerDisplay;
      if (q.exercise.type === 'choices') {
        correct = q.exercise.check(q.current, value);
        var opts = q.exercise.choices(q.current);
        var chosen = opts.filter(function (o) { return o.value === value; })[0];
        var correctOpt = opts.filter(function (o) { return q.exercise.check(q.current, o.value); })[0];
        studentAnswerDisplay = { type: 'text', value: chosen ? chosen.label : value, rawValue: value };
        correctAnswerDisplay = { type: 'text', value: correctOpt ? correctOpt.label : '' };
      } else if (q.exercise.type === 'multiselect') {
        var msOpts = q.exercise.options(q.current);
        var selectedSet = value || [];
        correct = msOpts.every(function (o) { return (selectedSet.indexOf(o.value) !== -1) === !!o.correct; });
        var studentLabels = msOpts.filter(function (o) { return selectedSet.indexOf(o.value) !== -1; }).map(function (o) { return o.label; });
        var correctLabels = msOpts.filter(function (o) { return o.correct; }).map(function (o) { return o.label; });
        studentAnswerDisplay = { type: 'list', value: studentLabels.length ? studentLabels : ['(ninguna)'], rawValue: selectedSet };
        correctAnswerDisplay = { type: 'list', value: correctLabels.length ? correctLabels : ['(ninguna)'] };
      } else if (q.exercise.type === 'vectors') {
        var vResult = q.exercise.checkVectors(q.current, value.particularVals, value.vectorVals, value.hasEmpty);
        correct = !!vResult.correct && !value.hasEmpty;
        var paramLabels = [];
        for (var pi = 0; pi < value.vectorVals.length; pi++) {
          paramLabels.push(q.exercise.vectors.paramLabel ? q.exercise.vectors.paramLabel(q.current, pi) : ('t' + (pi + 1)));
        }
        studentAnswerDisplay = { type: 'text', value: vectorsToText(value.particularVals, value.vectorVals, paramLabels), rawValue: value };
        if (q.exercise.getAnswerVectors) {
          var ans = q.exercise.getAnswerVectors(q.current);
          correctAnswerDisplay = { type: 'text', value: vectorsToText(ans.particular, ans.vectors, paramLabels) + ' (una posibilidad — no es la única solución válida)' };
        } else {
          correctAnswerDisplay = { type: 'text', value: '(hay más de una respuesta válida — ver la explicación)' };
        }
      } else if (q.exercise.type === 'space-basis') {
        /* La comparacion la hace el engine. Si la fase pide coincidencia
           exacta se compara componente a componente; si no, se acepta
           CUALQUIER base del mismo subespacio, que es lo matematicamente
           correcto y lo que ya hacen las landings. */
        var A_chk = engine();
        var esperados = q.exercise.getExpectedBasis(q.current);
        var espCoords = esperados.map(function (v) { return value.space.toCoords(v); });
        if (q.exercise.sbExactMatch) {
          correct = !value.hasEmpty && value.reads.length === espCoords.length &&
            value.reads.every(function (r, i) {
              var e2 = espCoords[i];
              return !!e2 && r.every(function (x, c) { return x === e2[c]; });
            });
        } else {
          correct = !value.hasEmpty && A_chk.checkSpanEquivalence(value.reads, espCoords).ok;
        }
        /* Los vectores se muestran COMO SON en su espacio, no como su
           fila de coordenadas: una matriz se ve matriz y un polinomio,
           polinomio. Sin esto, (1, 0, 2) aparecia igual para el vector de
           R3 y para el polinomio 1 + 2x2 de P2. */
        var esp_ = value.space;
        var tupla = function (r) { return '(' + r.join(', ') + ')'; };
        var comoBase = function (vectoresNativos) {
          var piezas = vectoresNativos.map(function (v) { return esp_.toKatex(v); });
          return '\\left\\{\\, ' + piezas.join(',\\ ') + ' \\,\\right\\}';
        };
        if (value.hasEmpty) {
          studentAnswerDisplay = { type: 'text', value: '(incompleta)' };
        } else {
          studentAnswerDisplay = {
            type: 'katex',
            value: comoBase(value.reads.map(function (r) { return esp_.fromCoords(r); })),
            plano: value.reads.map(tupla).join(', ')
          };
        }
        correctAnswerDisplay = {
          type: 'katex',
          value: comoBase(esperados),
          plano: espCoords.map(tupla).join(', '),
          nota: q.exercise.sbExactMatch ? null : '(cualquier base equivalente es v\u00e1lida)'
        };
      } else if (q.exercise.type === 'grid') {
        var result = q.exercise.checkGrid(q.current, value, !!hasEmpty);
        correct = result.correct && !hasEmpty;
        studentAnswerDisplay = { type: 'matrix', value: value };
        correctAnswerDisplay = { type: 'matrix', value: q.exercise.getAnswerGrid ? q.exercise.getAnswerGrid(q.current) : value };
      }

      examState.records.push({
        exercise: q.exercise, current: q.current, topic: q.topic,
        correct: correct, timeMs: timeMs,
        studentAnswerDisplay: studentAnswerDisplay, correctAnswerDisplay: correctAnswerDisplay
      });

      examState.index++;
      if (examState.index < examState.questions.length) {
        renderQuestion();
      } else {
        showResults();
      }
    }

    /* ---------- pantalla 3: revisión ---------- */
    function showResults() {
      refs.runningScreen.classList.add('apt-exam__screen--hidden');
      refs.resultsScreen.classList.remove('apt-exam__screen--hidden');

      var correctCount = examState.records.filter(function (r) { return r.correct; }).length;
      var totalTime = examState.records.reduce(function (s, r) { return s + r.timeMs; }, 0);
      var pct = Math.round(100 * correctCount / examState.records.length);
      refs.scoreEl.textContent = correctCount + ' / ' + examState.records.length;
      refs.scoreSubEl.innerHTML = '<strong>' + pct + '% correctas</strong> · tiempo total ' + formatTime(totalTime);

      var topicsEvaluated = [];
      examState.records.forEach(function (r) { if (topicsEvaluated.indexOf(r.topic) === -1) topicsEvaluated.push(r.topic); });
      refs.scoreTopicsEl.textContent = 'Temas evaluados: ' + topicsEvaluated.join(' · ');

      refs.resultsList.innerHTML = '';
      examState.records.forEach(function (rec, idx) {
        var item = document.createElement('div');
        item.className = 'apt-exam__result-item' + (rec.correct ? ' is-correct' : ' is-wrong');
        item.innerHTML =
          '<button type="button" class="apt-exam__result-head">' +
            '<span class="apt-exam__result-icon">' + (rec.correct ? '✓' : '✕') + '</span>' +
            '<span class="apt-exam__result-title">' + (idx + 1) + '. ' + rec.exercise.title + '</span>' +
            '<span class="apt-exam__result-time">' + formatTime(rec.timeMs) + '</span>' +
            '<span class="apt-exam__result-chevron">▸</span>' +
          '</button>' +
          '<div class="apt-exam__result-body">' +
            '<p class="apt-exam__result-label">Enunciado</p>' +
            '<div class="apt-exam__result-value apt-exam__result-content"></div>' +
            '<p class="apt-exam__result-label">Tu respuesta</p>' +
            '<div class="apt-exam__result-value ' + (rec.correct ? 'is-correct-text' : 'is-wrong-text') + ' apt-exam__result-student"></div>' +
            (rec.correct ? '' :
              '<p class="apt-exam__result-label">Respuesta correcta</p>' +
              '<div class="apt-exam__result-value is-correct-text apt-exam__result-correctval"></div>') +
            '<p class="apt-exam__result-label">Explicación</p>' +
            '<p class="apt-exam__result-value apt-exam__result-explain"></p>' +
          '</div>';
        refs.resultsList.appendChild(item);

        var head = item.querySelector('.apt-exam__result-head');
        var opened = false;
        head.addEventListener('click', function () {
          opened = !opened;
          item.classList.toggle('is-open', opened);
          renderResultBody(item, rec);
        });
      });
    }

    function renderResultBody(item, rec) {
      if (item.dataset.rendered) return;
      item.dataset.rendered = '1';
      var contentEl = item.querySelector('.apt-exam__result-content');
      rec.exercise.renderContent(contentEl, rec.current);
      ajustarAnchoFormulas(contentEl);

      var studentEl = item.querySelector('.apt-exam__result-student');
      renderAnswerDisplay(studentEl, rec.studentAnswerDisplay);

      if (!rec.correct) {
        var correctEl = item.querySelector('.apt-exam__result-correctval');
        renderAnswerDisplay(correctEl, rec.correctAnswerDisplay);
      }

      var explainEl = item.querySelector('.apt-exam__result-explain');
      var explainText;
      if (rec.exercise.type === 'choices') {
        explainText = rec.exercise.explain(rec.current, rec.correct, rec.studentAnswerDisplay && rec.studentAnswerDisplay.rawValue);
      } else if (rec.exercise.type === 'multiselect') {
        explainText = rec.exercise.explain(rec.current, rec.correct);
      } else if (rec.exercise.type === 'vectors') {
        var rv = rec.studentAnswerDisplay.rawValue;
        explainText = rec.exercise.checkVectors(rec.current, rv.particularVals, rv.vectorVals, rv.hasEmpty).feedbackText;
      } else {
        explainText = rec.exercise.checkGrid ? rec.exercise.checkGrid(rec.current, rec.studentAnswerDisplay.value, false).feedbackText : '';
      }
      explainEl.textContent = explainText || '';
    }

    function renderAnswerDisplay(container, display) {
      if (!display) { container.textContent = '—'; return; }
      if (display.type === 'text') {
        container.innerHTML = display.value;
      } else if (display.type === 'list') {
        container.textContent = display.value.join(', ');
      } else if (display.type === 'katex') {
        /* Una formula ya armada en LaTeX. Se usa para las respuestas de
           base: asi un elemento de M2x2 se ve como matriz y uno de P2 como
           polinomio, en vez de como una fila de coordenadas que el alumno
           tiene que decodificar — y que ademas significa cosas distintas
           segun el espacio. */
        container.innerHTML = '';
        var kWrap = document.createElement('span');
        container.appendChild(kWrap);
        if (global.katex) {
          try { global.katex.render(display.value, kWrap, { throwOnError: false }); }
          catch (e) { kWrap.textContent = display.plano || display.value; }
        } else {
          kWrap.textContent = display.plano || display.value;
        }
        if (display.nota) {
          var nEl = document.createElement('span');
          nEl.className = 'apt-exam__result-nota';
          nEl.textContent = ' ' + display.nota;
          container.appendChild(nEl);
        }
        ajustarAnchoFormulas(container);
      } else if (display.type === 'matrix') {
        if (global.katex) global.katex.render(matrixToLatex(display.value), container, { throwOnError: false });
        else container.textContent = JSON.stringify(display.value);
      }
    }

    refs.pdfBtn.addEventListener('click', function () {
      var items = root.querySelectorAll('.apt-exam__result-item');
      items.forEach(function (item, idx) {
        item.classList.add('is-open');
        renderResultBody(item, examState.records[idx]);
      });
      var previousTitle = document.title;
      document.title = 'Simulacro de examen de álgebra lineal APT';
      window.print();
      document.title = previousTitle;
    });

    /* Volver a la pantalla de armado a mitad del examen. Va en DOS toques:
       el primero pide confirmacion y el segundo abandona, para no perder un
       examen empezado por un toque accidental. Si no se confirma en cinco
       segundos, vuelve solo a su estado normal. */
    var confirmandoAbandono = false;
    var relojAbandono = null;
    function resetAbandono() {
      confirmandoAbandono = false;
      if (relojAbandono) { clearTimeout(relojAbandono); relojAbandono = null; }
      refs.abandonarBtn.textContent = 'Armar otro examen';
      refs.abandonarBtn.classList.remove('is-confirmando');
    }
    refs.abandonarBtn.addEventListener('click', function () {
      if (!confirmandoAbandono) {
        confirmandoAbandono = true;
        refs.abandonarBtn.textContent = 'Se pierde este examen — tocá de nuevo';
        refs.abandonarBtn.classList.add('is-confirmando');
        relojAbandono = setTimeout(resetAbandono, 5000);
        return;
      }
      resetAbandono();
      /* El cronometro sigue corriendo si no se lo para: es el unico
         (timerInterval actualiza tanto el de la pregunta como el total). */
      if (examState && examState.timerInterval) clearInterval(examState.timerInterval);
      examState = null;
      /* Se conservan los temas ya elegidos: el caso de uso es justamente
         'me olvide de marcar uno', no 'quiero empezar de cero'. */
      refs.runningScreen.classList.add('apt-exam__screen--hidden');
      refs.resultsScreen.classList.add('apt-exam__screen--hidden');
      refs.selectScreen.classList.remove('apt-exam__screen--hidden');
      if (root.scrollIntoView) root.scrollIntoView({ block: 'start' });
    });
    
    refs.restartBtn.addEventListener('click', function () {
      Object.keys(selectedTopics).forEach(function (k) { selectedTopics[k] = false; });
      root.querySelectorAll('.apt-exam__topic-btn').forEach(function (b) { b.classList.remove('is-selected'); });
      refs.startBtn.disabled = true;
      refs.resultsScreen.classList.add('apt-exam__screen--hidden');
      refs.selectScreen.classList.remove('apt-exam__screen--hidden');
    });
  }

  global.AptExam = { init: init };
})(window);
