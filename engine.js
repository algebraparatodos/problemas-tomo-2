/* ============================================================
   ÁLGEBRA PARA TODOS · engine.js (v2)
   ------------------------------------------------------------
   Motor compartido por TODAS las actividades. Este es el único
   archivo que se edita para cambiar algo común a las 50 landings
   (paleta, tipografías, layout, sonido, footer, modo compacto...).

   Cada landing de Kajabi solo carga este script y le pasa un
   objeto de configuración con SU lógica particular. El engine
   soporta tres modos de interacción:

     mode: 'choices' — botones de elección (ej: SCD/SCI/SI).
       cfg.choices, cfg.check(current,value), cfg.explain(...)
       cfg.choicesStacked (bool, opcional) — fuerza una sola
         columna (una opción por fila) sin importar la cantidad.
         Por defecto es automático: ≤2 opciones apila, >2 las pone
         en fila — pero conviene forzar `true` cuando cada opción
         es algo ancho (ej: una matriz renderizada con KaTeX en
         vez de un texto corto).

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

     mode: 'multiselect' — igual layout que 'choices' pero con
       botón Comprobar y Reintentar: se puede tildar 0, 1 o varias
       opciones antes de responder (a diferencia de 'choices', que
       responde apenas se toca un botón). Pensado para "marcá todas
       las que correspondan" (ej: a cuáles de estos tipos pertenece
       esta matriz — puede ser ninguna, una, o varias a la vez).
       cfg.options(current) → array de { value, label, correct }.
         El motor arma el multiple choice solo (no hace falta
         cfg.check): compara qué tildó el alumno contra el flag
         correct de cada opción. Después de comprobar, SOLO se
         colorea lo que el alumno tildó (verde si correspondía,
         rojo si no) — lo que dejó sin tildar queda neutro, para
         no "pintar todo de verde" cuando responde bien. Layout
         en grid de 2 columnas con checkbox ☐/☑, visualmente
         distinto del botón "Comprobar".
       cfg.explain(current, correct) — sin "value", porque puede
         haber más de una opción tildada.

   En los tres modos: cfg.generate(), cfg.renderContent(container,
   current), cfg.needsKatex (bool, opcional).

   El engine se encarga de: inyectar fuentes + CSS + KaTeX (si
   hace falta) + el fix de fondo del body, armar todo el
   esqueleto visual, manejar el ciclo de una ronda, sonido
   sintetizado + confetti/globos + mute persistente compartido +
   botón "Reportar un problema" en el footer (abre un modal,
   manda mensaje + URL de la landing a un Google Form compartido,
   totalmente anónimo — sin nombre ni email).
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
     "Reportar un problema" — Google Form compartido por TODAS
     las actividades. Un solo lugar centralizado: cambiar el form
     acá alcanza para las 50 landings.
     ------------------------------------------------------------ */
  var REPORT_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLScr7mmwJ1QPpj8Bh4sYf0N3uNG77xbSVNc9AfZ64_erQM5NZg/formResponse';
  var REPORT_ENTRY_MESSAGE = 'entry.1465382734';
  var REPORT_ENTRY_URL = 'entry.833697682';
  var REPORT_MODAL_ID = 'apt-report-modal';

  var CATALOG_MODAL_ID = 'apt-catalog-modal';

  /* ------------------------------------------------------------
     Catálogo de ejercicios — única fuente de verdad para el botón
     "Todos los ejercicios" del footer. Cada vez que una actividad
     nueva queda publicada en Kajabi, se agrega acá (título + URL
     real) dentro de su unidad. Una unidad sin actividades todavía
     se muestra como "(próximamente)", sin expandir.
     ------------------------------------------------------------ */
  var CATALOG = [
    {
      title: 'Unidad 1: Matrices y SEL',
      activities: [
        { title: 'Clasificá el sistema', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-1' },
        { title: 'Matriz ampliada', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-2' },
        { title: '¿Es escalonada?', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-3' },
        { title: 'Aplicá el método de eliminación de Gauss', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-4' },
        { title: '¿Es escalonada reducida?', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-5' },
        { title: 'Encontrá la forma escalonada reducida', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-6' },
        { title: 'Solución paramétrica', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-7' },
        { title: 'Rango por orlado', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-8' },
        { title: 'Clasificá con Rouché-Frobenius', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-9' },
        { title: 'Rouché-Frobenius con parámetros', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-10' },
        { title: 'Tipos de matrices', url: 'https://www.algebraparatodos.com/QR-Tomo-II-Unidad-1-actividad-11' }
      ]
    },
    { title: 'Unidad 2: Subespacios vectoriales', activities: [] },
    { title: 'Unidad 3: Transformaciones Lineales', activities: [] },
    { title: 'Unidad 4: Diagonalización', activities: [] }
  ];

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
    '.apt-act__phase--hidden{ display:none; }',
    '.apt-act__setup-field{ display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }',
    '.apt-act__setup-field-label{ font-family:var(--font-mono); font-size:13px; color:var(--ink-soft); margin:0; }',
    '.apt-act__setup-btn{ width:100%; font-family:var(--font-serif); font-weight:700; font-size:15px; color:#fff; background:var(--chalk); border:none; border-radius:12px; padding:15px; min-height:50px; cursor:pointer; transition:background .15s ease, opacity .15s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__setup-btn:hover{ background:var(--chalk-hover); }',
    '.apt-act__setup-btn:disabled{ opacity:.5; cursor:default; }',
    '.apt-act__setup-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__choice-btn{ flex:1 1 0; font-family:var(--font-serif); font-weight:700; padding:12px 4px; border-radius:12px; border:2px solid var(--chalk-light); background:transparent; color:var(--chalk-light); cursor:pointer; min-height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; transition:transform .08s ease, background .15s ease, color .15s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__choices--stacked .apt-act__choice-btn{ flex-direction:row; padding:16px 18px; font-size:16px; }',
    '.apt-act__choice-main{ font-size:16px; }',
    '.apt-act__choice-sub{ font-family:var(--font-mono); font-weight:400; font-size:9.5px; opacity:.8; text-align:center; line-height:1.2; }',
    '.apt-act__choice-btn:active{ transform:scale(.97); }',
    '.apt-act__choice-btn.is-selected{ background:var(--chalk); border-color:var(--chalk); color:#fff; }',
    '.apt-act__choice-btn.is-correct{ border-color:var(--correct); background:var(--correct-bg); color:var(--correct); }',
    '.apt-act__choice-btn.is-wrong{ border-color:var(--wrong); background:var(--wrong-bg); color:var(--wrong); }',
    '.apt-act__choice-btn.is-correct:disabled, .apt-act__choice-btn.is-wrong:disabled{ opacity:1; }',
    '.apt-act__choices--multiselect{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }',
    '.apt-act__choices--multiselect .apt-act__choice-btn{ flex-direction:row; justify-content:flex-start; padding:10px 12px; font-family:var(--font-mono); font-weight:500; font-size:12.5px; min-height:44px; border-width:1.5px; border-radius:9px; }',
    '.apt-act__choices--multiselect .apt-act__choice-btn::before{ content:"☐"; margin-right:7px; font-size:14px; flex:0 0 auto; }',
    '.apt-act__choices--multiselect .apt-act__choice-btn.is-selected::before{ content:"☑"; }',
    '.apt-act__choices--multiselect .apt-act__choice-main{ font-size:12.5px; text-align:left; }',
    '.apt-act__choice-btn:disabled{ opacity:.5; cursor:default; }',
    '.apt-act__choice-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__matrixwrap{ display:flex; align-items:stretch; justify-content:center; gap:6px; }',
    '.apt-act__bracket{ width:9px; border-top:3px solid var(--ink-soft); border-bottom:3px solid var(--ink-soft); }',
    '.apt-act__bracket--left{ border-left:3px solid var(--ink-soft); border-radius:5px 0 0 5px; }',
    '.apt-act__bracket--right{ border-right:3px solid var(--ink-soft); border-radius:0 5px 5px 0; }',
    '.apt-act__grid{ display:grid; gap:8px 6px; padding:4px 4px; }',
    '.apt-act__divider{ width:2px; background:var(--chalk-light); opacity:.45; justify-self:center; }',
    '.apt-act__solution{ display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:6px 8px; margin-bottom:4px; }',
    '.apt-act__eq{ font-family:var(--font-serif); font-weight:700; font-size:18px; color:var(--ink); }',
    '.apt-act__op{ font-family:var(--font-serif); font-weight:700; font-size:18px; color:var(--ink-soft); }',
    '.apt-act__paramlabel{ font-family:var(--font-serif); font-weight:700; font-size:17px; color:var(--ink); }',
    '.apt-act__vec{ display:flex; align-items:stretch; gap:3px; }',
    '.apt-act__vec-bracket{ width:6px; border-top:2.5px solid var(--ink-soft); border-bottom:2.5px solid var(--ink-soft); flex:0 0 auto; }',
    '.apt-act__vec-bracket--left{ border-left:2.5px solid var(--ink-soft); border-radius:4px 0 0 4px; }',
    '.apt-act__vec-bracket--right{ border-right:2.5px solid var(--ink-soft); border-radius:0 4px 4px 0; }',
    '.apt-act__vec-col{ display:flex; flex-direction:column; gap:5px; padding:4px 2px; }',
    '.apt-act__vec .apt-act__cellwrap{ gap:2px; }',
    '.apt-act__vec .apt-act__signseg{ flex-basis:26px; width:26px; }',
    '.apt-act__vec .apt-act__cell{ width:40px; flex:0 0 auto; }',
    '.apt-act__cellwrap{ display:flex; align-items:stretch; gap:3px; }',
    '.apt-act__lockcell{ display:flex; align-items:center; justify-content:center; min-height:40px; font-family:var(--font-mono); font-weight:500; font-size:clamp(15px,4.2vw,18px); color:var(--ink-soft); background:rgba(151,161,216,0.04); border:2px dashed rgba(151,161,216,0.28); border-radius:8px; }',
    '.apt-act__question{ text-align:center; font-family:var(--font-mono); font-size:14.5px; color:var(--ink-soft); margin:0 0 12px; }',
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
    '.apt-act__feedback{ border-radius:var(--radius); padding:14px 14px; display:flex; gap:10px; align-items:flex-start; border:1px solid transparent; transition:padding .15s ease; }',
    '.apt-act__feedback--correct{ background:var(--correct-bg); border-color:rgba(91,205,154,0.35); }',
    '.apt-act__feedback--wrong{ background:var(--wrong-bg); border-color:rgba(214,82,82,0.35); }',
    '.apt-act__feedback--hidden{ display:none; }',
    '.apt-act__mark{ flex:0 0 auto; width:26px; height:26px; transition:width .15s ease, height .15s ease; }',
    '.apt-act__mark path{ fill:none; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; }',
    '.apt-act__feedback--correct .apt-act__mark path{ stroke:var(--correct); }',
    '.apt-act__feedback--wrong .apt-act__mark path{ stroke:var(--wrong); }',
    '.apt-act__feedback-text{ font-family:var(--font-mono); font-size:14.5px; line-height:1.6; flex:1 1 auto; min-width:0; }',
    '.apt-act__feedback-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:5px; }',
    '.apt-act__feedback-text strong{ font-family:var(--font-serif); font-weight:700; font-size:16px; }',
    '.apt-act__feedback--correct .apt-act__feedback-text strong{ color:var(--correct); }',
    '.apt-act__feedback--wrong .apt-act__feedback-text strong{ color:var(--wrong); }',
    '.apt-act__feedback--correct .apt-act__feedback-text{ color:#CFEEDF; }',
    '.apt-act__feedback--wrong .apt-act__feedback-text{ color:#F3D2D2; }',
    '.apt-act__feedback-toggle{ flex:0 0 auto; width:22px; height:22px; padding:0; border-radius:50%; border:1px solid currentColor; background:transparent; color:inherit; font-size:14px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:.65; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__feedback-toggle:hover{ opacity:1; }',
    '.apt-act__feedback-toggle:focus-visible{ outline:2px solid currentColor; outline-offset:2px; }',
    '.apt-act__feedback--collapsed{ padding:8px 12px; gap:8px; }',
    '.apt-act__feedback--collapsed .apt-act__feedback-head{ margin-bottom:0; }',
    '.apt-act__feedback--collapsed .apt-act__feedback-body{ display:none; }',
    '.apt-act__feedback--collapsed .apt-act__mark{ width:18px; height:18px; }',
    '.apt-act__feedback--collapsed .apt-act__feedback-text strong{ font-size:13px; }',
    '.apt-act__feedback--collapsed .apt-act__feedback-toggle{ width:18px; height:18px; font-size:12px; }',
    '.apt-act__actions{ display:flex; flex-direction:column; gap:8px; }',
    '.apt-act__actions-row{ display:flex; gap:8px; }',
    '.apt-act__retry-btn{ font-family:var(--font-serif); font-weight:700; font-size:14.5px; color:var(--chalk-light); background:transparent; border:2px solid var(--chalk-light); border-radius:12px; padding:13px 10px; min-height:50px; cursor:pointer; transition:background .15s ease, color .15s ease, transform .08s ease; -webkit-tap-highlight-color:transparent; flex:1 1 0; }',
    '.apt-act__retry-btn:active{ transform:scale(.98); }',
    '.apt-act__retry-btn--hidden{ display:none; }',
    '.apt-act__retry-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__next-btn{ font-family:var(--font-serif); font-weight:700; font-size:15px; color:#fff; background:var(--chalk); border:none; border-radius:12px; padding:15px; min-height:50px; cursor:pointer; transition:background .15s ease; }',
    '.apt-act__next-btn:hover{ background:var(--chalk-hover); }',
    '.apt-act__next-btn--hidden{ display:none; }',
    '.apt-act__next-btn:not(.apt-act__next-btn--hidden) ~ .apt-act__skip-btn{ display:none; }',
    '.apt-act__next-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__footer{ display:flex; flex-direction:column; gap:8px; padding-top:6px; font-family:var(--font-serif); font-weight:700; font-size:12px; color:var(--chalk-light); }',
    '.apt-act__catalog-btn{ align-self:center; display:flex; align-items:center; gap:6px; font-family:var(--font-serif); font-weight:700; font-size:11.5px; color:var(--chalk-light); background:transparent; border:1px solid rgba(151,161,216,0.3); border-radius:999px; padding:6px 14px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .15s ease, border-color .15s ease; }',
    '.apt-act__catalog-btn:hover{ background:rgba(151,161,216,0.1); }',
    '.apt-act__catalog-btn:active{ transform:scale(.97); }',
    '.apt-act__catalog-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__footer-row{ display:flex; justify-content:space-between; align-items:center; }',
    '.apt-act__brand-link{ color:var(--chalk-light); text-decoration:none; }',
    '.apt-act__brand-link:hover{ text-decoration:underline; }',
    '.apt-act__brand-link:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:3px; border-radius:2px; }',
    '.apt-act__footer-right{ display:flex; align-items:center; gap:10px; }',
    '.apt-act__streak{ display:flex; gap:6px; align-items:center; color:var(--ink-soft); font-family:var(--font-mono); font-weight:400; }',
    '.apt-act__streak b{ color:var(--chalk-light); font-family:var(--font-serif); font-size:13px; }',
    '.apt-act__mute-btn{ width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:50%; border:1px solid rgba(151,161,216,0.3); background:transparent; font-size:14px; line-height:1; cursor:pointer; padding:0; transition:background .15s ease, border-color .15s ease, transform .08s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__mute-btn:active{ transform:scale(.92); }',
    '.apt-act__mute-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__report-btn{ width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:50%; border:1px solid rgba(151,161,216,0.3); background:transparent; font-size:13px; line-height:1; cursor:pointer; padding:0; transition:background .15s ease, border-color .15s ease, transform .08s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-act__report-btn:active{ transform:scale(.92); }',
    '.apt-act__report-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; }',
    /* -- Modal de "Reportar un problema" — vive fuera de .apt-act (se
       agrega directo a document.body), así que NO puede depender de
       las variables --chalk/--ink/etc. (no las hereda). Colores a
       mano, mismos valores exactos que la paleta pizarrón. -- */
    '.apt-report-modal{ position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; padding:16px; z-index:2147483000; font-family:"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace; }',
    '.apt-report-modal--hidden{ display:none; }',
    '.apt-report-modal__card{ width:100%; max-width:360px; background:#16161C; border:1px solid rgba(151,161,216,0.18); border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,.5); padding:22px 20px; display:flex; flex-direction:column; gap:12px; box-sizing:border-box; }',
    '.apt-report-modal__title{ font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:18px; color:#F5F5F7; margin:0; }',
    '.apt-report-modal__desc{ font-size:12.5px; color:#A7ACC0; line-height:1.5; margin:0; }',
    '.apt-report-modal__form{ display:flex; flex-direction:column; gap:10px; }',
    '.apt-report-modal__form--hidden{ display:none; }',
    '.apt-report-modal__textarea{ width:100%; min-height:100px; resize:vertical; font-family:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace; font-size:14px; color:#F5F5F7; background:rgba(151,161,216,0.07); border:2px solid rgba(151,161,216,0.3); border-radius:10px; padding:10px; box-sizing:border-box; }',
    '.apt-report-modal__textarea:focus{ outline:none; border-color:#97A1D8; background:rgba(151,161,216,0.14); }',
    '.apt-report-modal__error{ font-size:12.5px; color:#D65252; margin:0; }',
    '.apt-report-modal__error--hidden{ display:none; }',
    '.apt-report-modal__actions{ display:flex; gap:8px; }',
    '.apt-report-modal__cancel-btn{ flex:1 1 0; font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:14px; color:#97A1D8; background:transparent; border:2px solid #97A1D8; border-radius:12px; padding:12px; cursor:pointer; -webkit-tap-highlight-color:transparent; }',
    '.apt-report-modal__send-btn{ flex:1 1 0; font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:14px; color:#fff; background:#48507D; border:none; border-radius:12px; padding:12px; cursor:pointer; -webkit-tap-highlight-color:transparent; }',
    '.apt-report-modal__send-btn:hover{ background:#5A639A; }',
    '.apt-report-modal__send-btn:disabled{ opacity:.6; cursor:default; }',
    '.apt-report-modal__success{ display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; padding:6px 0; }',
    '.apt-report-modal__success--hidden{ display:none; }',
    '.apt-report-modal__success p{ font-size:14px; color:#CFEEDF; margin:0; }',
    '.apt-report-modal__success svg{ width:34px; height:34px; }',
    '.apt-report-modal__success svg path{ fill:none; stroke:#5BCD9A; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; }',
    '.apt-report-modal__close-btn{ font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:14px; color:#fff; background:#48507D; border:none; border-radius:12px; padding:10px 20px; cursor:pointer; -webkit-tap-highlight-color:transparent; }',
    '.apt-report-modal__close-btn:hover{ background:#5A639A; }',
    /* -- Modal de "Todos los ejercicios" — mismo patrón que el de
       reporte (vive fuera de .apt-act, colores a mano). -- */
    '.apt-catalog-modal{ position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; padding:16px; z-index:2147483000; font-family:"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace; }',
    '.apt-catalog-modal--hidden{ display:none; }',
    '.apt-catalog-modal__card{ width:100%; max-width:380px; max-height:80vh; background:#16161C; border:1px solid rgba(151,161,216,0.18); border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,.5); padding:20px 18px; display:flex; flex-direction:column; gap:12px; box-sizing:border-box; overflow:hidden; }',
    '.apt-catalog-modal__head{ display:flex; align-items:center; justify-content:space-between; gap:8px; }',
    '.apt-catalog-modal__title{ font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:18px; color:#F5F5F7; margin:0; }',
    '.apt-catalog-modal__close-x{ width:28px; height:28px; flex:0 0 auto; border-radius:50%; border:1px solid rgba(151,161,216,0.3); background:transparent; color:#97A1D8; font-size:14px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; -webkit-tap-highlight-color:transparent; }',
    '.apt-catalog-modal__close-x:hover{ background:rgba(151,161,216,0.12); }',
    '.apt-catalog-modal__close-x:focus-visible{ outline:2px solid #97A1D8; outline-offset:2px; }',
    '.apt-catalog-modal__list{ overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-right:2px; }',
    '.apt-catalog-modal__unit{ border:1px solid rgba(151,161,216,0.18); border-radius:10px; overflow:hidden; }',
    '.apt-catalog-modal__unit-btn{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px; font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:13.5px; color:#F5F5F7; background:rgba(151,161,216,0.06); border:none; padding:12px 14px; cursor:pointer; text-align:left; -webkit-tap-highlight-color:transparent; }',
    '.apt-catalog-modal__unit-btn:disabled{ cursor:default; opacity:.6; }',
    '.apt-catalog-modal__unit-btn:focus-visible{ outline:2px solid #97A1D8; outline-offset:-2px; }',
    '.apt-catalog-modal__unit-chevron{ color:#97A1D8; font-size:11px; flex:0 0 auto; transition:transform .15s ease; }',
    '.apt-catalog-modal__unit.is-open .apt-catalog-modal__unit-chevron{ transform:rotate(90deg); }',
    '.apt-catalog-modal__unit-empty{ font-family:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace; font-weight:400; font-size:11px; color:#A7ACC0; flex:0 0 auto; }',
    '.apt-catalog-modal__acts{ display:none; flex-direction:column; }',
    '.apt-catalog-modal__unit.is-open .apt-catalog-modal__acts{ display:flex; }',
    '.apt-catalog-modal__act-link{ display:block; font-family:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace; font-size:12.5px; color:#CFD3E8; text-decoration:none; padding:10px 14px 10px 26px; border-top:1px solid rgba(151,161,216,0.12); transition:background .15s ease, color .15s ease; }',
    '.apt-catalog-modal__act-link:hover{ background:rgba(151,161,216,0.08); color:#F5F5F7; }',
    '.apt-catalog-modal__act-link:focus-visible{ outline:2px solid #97A1D8; outline-offset:-2px; }',
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
    '.apt-act.is-answered .apt-act__feedback{ padding:10px 12px; gap:8px; }',
    '.apt-act.is-answered .apt-act__mark{ width:22px; height:22px; }',
    '.apt-act.is-answered .apt-act__feedback-text{ font-size:13px; line-height:1.45; }',
    '.apt-act.is-answered .apt-act__feedback-text strong{ font-size:14px; }',
    '.apt-act.is-answered .apt-act__feedback-head{ margin-bottom:3px; }',
    '.apt-act.is-answered .apt-act__next-btn{ padding:11px; min-height:42px; font-size:14px; }',
    '.apt-act.is-answered .apt-act__retry-btn{ padding:11px; min-height:42px; font-size:13px; }'
  ].join('\n');

  var CHECK_SVG = '<svg class="apt-act__mark" viewBox="0 0 34 34"><path d="M6 18 L14 26 L28 8"/></svg>';
  var CROSS_SVG = '<svg class="apt-act__mark" viewBox="0 0 34 34"><path d="M8 8 L26 26 M26 8 L8 26"/></svg>';
  var FEEDBACK_COLLAPSE_MS = 4000;

  // cfg.choices (o phase.choices) puede ser un array fijo, o una función
  // (current) => array, para preguntas de opción múltiple cuyo texto
  // depende del caso generado (ej: "2×2" / "3×3" según el orden de la matriz).
  function resolveChoices(choicesSpec, current) {
    return typeof choicesSpec === 'function' ? choicesSpec(current) : choicesSpec;
  }
  // Igual que resolveChoices, pero para valores numéricos como
  // grid.rows/grid.cols, que también pueden depender de current
  // (ej: el orden de la matriz varía por ronda en factorización LU).
  function resolveNum(spec, current) {
    return typeof spec === 'function' ? spec(current) : spec;
  }

  /* ------------------------------------------------------------
     Feedback compartido — ÚNICA implementación para las 4 fases,
     el modo genérico y "ver respuesta". El título (¡Correcto! /
     No es correcto) queda siempre visible con su color; el cuerpo
     con la explicación se auto-contrae a los 4s para no ocupar
     tanta pantalla, y el usuario puede expandir/contraer a mano
     tocando el +/− de la esquina en cualquier momento.
     ------------------------------------------------------------ */
  function renderFeedback(el, correct, title, bodyHTML) {
    if (el._collapseTimer) { clearTimeout(el._collapseTimer); el._collapseTimer = null; }
    el.className = 'apt-act__feedback ' + (correct ? 'apt-act__feedback--correct' : 'apt-act__feedback--wrong');
    el.innerHTML = (correct ? CHECK_SVG : CROSS_SVG) +
      '<div class="apt-act__feedback-text">' +
        '<div class="apt-act__feedback-head">' +
          '<strong>' + title + '</strong>' +
          '<button type="button" class="apt-act__feedback-toggle" aria-label="Contraer explicación">−</button>' +
        '</div>' +
        '<div class="apt-act__feedback-body">' + bodyHTML + '</div>' +
      '</div>';

    var toggleBtn = el.querySelector('.apt-act__feedback-toggle');
    function setCollapsed(collapsed) {
      el.classList.toggle('apt-act__feedback--collapsed', collapsed);
      toggleBtn.textContent = collapsed ? '+' : '−';
      toggleBtn.setAttribute('aria-label', collapsed ? 'Expandir explicación' : 'Contraer explicación');
    }
    toggleBtn.addEventListener('click', function () {
      if (el._collapseTimer) { clearTimeout(el._collapseTimer); el._collapseTimer = null; }
      setCollapsed(!el.classList.contains('apt-act__feedback--collapsed'));
    });
    el._collapseTimer = setTimeout(function () { setCollapsed(true); }, FEEDBACK_COLLAPSE_MS);
  }

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
     "Reportar un problema" — construcción y control del modal
     ------------------------------------------------------------ */
  function ensureReportModal() {
    var existing = document.getElementById(REPORT_MODAL_ID);
    if (existing) return existing;

    var modal = document.createElement('div');
    modal.id = REPORT_MODAL_ID;
    modal.className = 'apt-report-modal apt-report-modal--hidden';
    modal.innerHTML =
      '<div class="apt-report-modal__card" role="dialog" aria-modal="true" aria-label="Reportar un problema">' +
        '<h2 class="apt-report-modal__title">Reportar un problema</h2>' +
        '<div class="apt-report-modal__form">' +
          '<p class="apt-report-modal__desc">Contanos qué encontraste raro en este ejercicio: un enunciado que no cierra, un botón que no responde, algo que se ve mal. Es anónimo — guardamos automáticamente en qué ejercicio estás para poder revisarlo.</p>' +
          '<textarea class="apt-report-modal__textarea" maxlength="500" placeholder="Escribí acá tu mensaje..."></textarea>' +
          '<p class="apt-report-modal__error apt-report-modal__error--hidden">No se pudo enviar. Revisá tu conexión e intentá de nuevo.</p>' +
          '<div class="apt-report-modal__actions">' +
            '<button type="button" class="apt-report-modal__cancel-btn">Cancelar</button>' +
            '<button type="button" class="apt-report-modal__send-btn">Enviar</button>' +
          '</div>' +
        '</div>' +
        '<div class="apt-report-modal__success apt-report-modal__success--hidden">' +
          '<svg viewBox="0 0 34 34"><path d="M6 18 L14 26 L28 8"/></svg>' +
          '<p>¡Gracias! Lo vamos a revisar.</p>' +
          '<button type="button" class="apt-report-modal__close-btn">Cerrar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var card = modal.querySelector('.apt-report-modal__card');
    var formBlock = modal.querySelector('.apt-report-modal__form');
    var textarea = modal.querySelector('.apt-report-modal__textarea');
    var errorEl = modal.querySelector('.apt-report-modal__error');
    var sendBtn = modal.querySelector('.apt-report-modal__send-btn');
    var cancelBtn = modal.querySelector('.apt-report-modal__cancel-btn');
    var successBlock = modal.querySelector('.apt-report-modal__success');
    var closeBtn = modal.querySelector('.apt-report-modal__close-btn');

    function closeModal() { modal.classList.add('apt-report-modal--hidden'); }

    function resetModal() {
      textarea.value = '';
      errorEl.classList.add('apt-report-modal__error--hidden');
      formBlock.classList.remove('apt-report-modal__form--hidden');
      successBlock.classList.add('apt-report-modal__success--hidden');
      sendBtn.disabled = false;
      sendBtn.textContent = 'Enviar';
    }

    function sendReport() {
      var msg = textarea.value.trim();
      if (!msg) { textarea.focus(); return; }
      sendBtn.disabled = true;
      sendBtn.textContent = 'Enviando...';
      errorEl.classList.add('apt-report-modal__error--hidden');

      var params = new URLSearchParams();
      params.set(REPORT_ENTRY_MESSAGE, msg);
      params.set(REPORT_ENTRY_URL, window.location.href);

      fetch(REPORT_FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }).then(function () {
        formBlock.classList.add('apt-report-modal__form--hidden');
        successBlock.classList.remove('apt-report-modal__success--hidden');
      }).catch(function () {
        errorEl.classList.remove('apt-report-modal__error--hidden');
        sendBtn.disabled = false;
        sendBtn.textContent = 'Enviar';
      });
    }

    sendBtn.addEventListener('click', sendReport);
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    card.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('apt-report-modal--hidden')) closeModal();
    });

    modal._openReport = function () {
      resetModal();
      modal.classList.remove('apt-report-modal--hidden');
      textarea.focus();
    };
    return modal;
  }

  function openReportModal() {
    ensureReportModal()._openReport();
  }

  /* ------------------------------------------------------------
     "Todos los ejercicios" — construcción y control del modal
     de catálogo (acordeón por unidad, links directos a cada landing)
     ------------------------------------------------------------ */
  function ensureCatalogModal() {
    var existing = document.getElementById(CATALOG_MODAL_ID);
    if (existing) return existing;

    var unitsHTML = CATALOG.map(function (unit) {
      var hasActs = unit.activities && unit.activities.length > 0;
      var actsHTML = hasActs
        ? unit.activities.map(function (act) {
            return '<a class="apt-catalog-modal__act-link" href="' + act.url + '">' + act.title + '</a>';
          }).join('')
        : '';
      return '<div class="apt-catalog-modal__unit">' +
        '<button type="button" class="apt-catalog-modal__unit-btn"' + (hasActs ? '' : ' disabled') + '>' +
          '<span>' + unit.title + '</span>' +
          (hasActs ? '<span class="apt-catalog-modal__unit-chevron">▸</span>' : '<span class="apt-catalog-modal__unit-empty">Próximamente</span>') +
        '</button>' +
        (hasActs ? '<div class="apt-catalog-modal__acts">' + actsHTML + '</div>' : '') +
      '</div>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = CATALOG_MODAL_ID;
    modal.className = 'apt-catalog-modal apt-catalog-modal--hidden';
    modal.innerHTML =
      '<div class="apt-catalog-modal__card" role="dialog" aria-modal="true" aria-label="Todos los ejercicios">' +
        '<div class="apt-catalog-modal__head">' +
          '<h2 class="apt-catalog-modal__title">Todos los ejercicios</h2>' +
          '<button type="button" class="apt-catalog-modal__close-x" aria-label="Cerrar">✕</button>' +
        '</div>' +
        '<div class="apt-catalog-modal__list">' + unitsHTML + '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var card = modal.querySelector('.apt-catalog-modal__card');
    var closeBtn = modal.querySelector('.apt-catalog-modal__close-x');

    function closeModal() { modal.classList.add('apt-catalog-modal--hidden'); }

    modal.querySelectorAll('.apt-catalog-modal__unit-btn').forEach(function (btn) {
      if (btn.disabled) return;
      btn.addEventListener('click', function () {
        btn.closest('.apt-catalog-modal__unit').classList.toggle('is-open');
      });
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    card.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('apt-catalog-modal--hidden')) closeModal();
    });

    modal._openCatalog = function () { modal.classList.remove('apt-catalog-modal--hidden'); };
    return modal;
  }

  function openCatalogModal() {
    ensureCatalogModal()._openCatalog();
  }

  /* ------------------------------------------------------------
     Footer compartido (marca + 🚩 reportar + 🔇/🔊 mute + racha).
     ÚNICA implementación: la usa tanto el modo genérico (buildSkeleton,
     abajo) como cualquier actividad custom vía AptActivity.mountFooter().
     Nunca duplicar este HTML/CSS en el archivo de una actividad.
     ------------------------------------------------------------ */
  function mountFooter(container) {
    ensureAssets();
    container.className = 'apt-act__footer';
    container.innerHTML =
      '<button type="button" class="apt-act__catalog-btn">📚 Todos los ejercicios</button>' +
      '<div class="apt-act__footer-row">' +
        '<a class="apt-act__brand-link" href="https://www.instagram.com/soyjuanisilva/" target="_blank" rel="noopener">Álgebra Para Todos</a>' +
        '<span class="apt-act__footer-right">' +
          '<button type="button" class="apt-act__report-btn" aria-label="Reportar un problema">🚩</button>' +
          '<button type="button" class="apt-act__mute-btn" aria-pressed="false" aria-label="Silenciar sonidos">🔊</button>' +
          '<span class="apt-act__streak">Racha: <b>0</b></span>' +
        '</span>' +
      '</div>';

    var catalogBtn = container.querySelector('.apt-act__catalog-btn');
    var reportBtn = container.querySelector('.apt-act__report-btn');
    var muteBtn = container.querySelector('.apt-act__mute-btn');
    var streakB = container.querySelector('.apt-act__streak b');

    catalogBtn.addEventListener('click', openCatalogModal);
    reportBtn.addEventListener('click', openReportModal);

    function updateMuteBtn() {
      muteBtn.textContent = muted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-pressed', String(muted));
    }
    muteBtn.addEventListener('click', function () {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* sin persistencia si está bloqueado */ }
      updateMuteBtn();
    });
    updateMuteBtn();

    return {
      setStreak: function (n) { streakB.textContent = String(n); }
    };
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
    var rows = resolveNum(gridCfg.rows, current), cols = resolveNum(gridCfg.cols, current);
    var noDivider = !!gridCfg.noDivider;
    var divAfter = noDivider ? cols : (gridCfg.dividerAfterCol != null ? gridCfg.dividerAfterCol : cols - 1);
    gridEl.style.gridTemplateColumns = noDivider
      ? 'repeat(' + cols + ', minmax(62px,74px))'
      : 'repeat(' + divAfter + ', minmax(62px,74px)) 10px repeat(' + (cols - divAfter) + ', minmax(62px,74px))';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var lockedVal = gridCfg.lockedValue ? gridCfg.lockedValue(current, r, c) : null;
        var gridCol = (noDivider || c < divAfter) ? c + 1 : c + 2;

        if (lockedVal !== null && lockedVal !== undefined) {
          var lock = document.createElement('div');
          lock.className = 'apt-act__lockcell';
          lock.textContent = String(lockedVal);
          lock.style.gridRow = String(r + 1);
          lock.style.gridColumn = String(gridCol);
          gridEl.appendChild(lock);
          continue;
        }

        var wrap = document.createElement('div');
        wrap.className = 'apt-act__cellwrap';
        wrap.dataset.row = r;
        wrap.dataset.col = c;
        wrap.style.gridRow = String(r + 1);
        wrap.style.gridColumn = String(gridCol);

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
    if (!noDivider) {
      var divider = document.createElement('div');
      divider.className = 'apt-act__divider';
      divider.style.gridColumn = String(divAfter + 1);
      divider.style.gridRow = '1 / ' + (rows + 1);
      gridEl.appendChild(divider);
    }
  }

  function readStudentMatrix(gridEl, gridCfg, current) {
    var rows = resolveNum(gridCfg.rows, current), cols = resolveNum(gridCfg.cols, current);
    var M = [];
    for (var r = 0; r < rows; r++) { M.push(new Array(cols).fill(null)); }
    var hasEmpty = false;
    for (var r2 = 0; r2 < rows; r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        var lockedVal = gridCfg.lockedValue ? gridCfg.lockedValue(current, r2, c2) : null;
        if (lockedVal !== null && lockedVal !== undefined) M[r2][c2] = lockedVal;
      }
    }
    gridEl.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
      var r3 = +wrap.dataset.row, c3 = +wrap.dataset.col;
      var input = wrap.querySelector('.apt-act__cell');
      var raw = input.value.trim();
      if (raw === '') { hasEmpty = true; M[r3][c3] = null; return; }
      var n = parseInt(raw, 10);
      var sign = getSign(wrap);
      M[r3][c3] = sign === '-' ? -n : n;
    });
    return { matrix: M, hasEmpty: hasEmpty };
  }

  /* ------------------------------------------------------------
     Helpers del modo 'vectors' (solución tipo S = p + v1·t1 + ...)
     ------------------------------------------------------------ */
  function buildVecBlock(key, rows) {
    var vec = document.createElement('div');
    vec.className = 'apt-act__vec';
    var left = document.createElement('span');
    left.className = 'apt-act__vec-bracket apt-act__vec-bracket--left';
    var right = document.createElement('span');
    right.className = 'apt-act__vec-bracket apt-act__vec-bracket--right';
    var col = document.createElement('div');
    col.className = 'apt-act__vec-col';
    for (var r = 0; r < rows; r++) {
      var wrap = document.createElement('div');
      wrap.className = 'apt-act__cellwrap';
      wrap.dataset.key = key;
      wrap.dataset.row = r;
      var signSeg = buildSignSeg();
      var input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.className = 'apt-act__cell';
      input.setAttribute('aria-label', 'Componente ' + (r + 1));
      input.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2);
      });
      wrap.appendChild(signSeg);
      wrap.appendChild(input);
      col.appendChild(wrap);
    }
    vec.appendChild(left);
    vec.appendChild(col);
    vec.appendChild(right);
    return vec;
  }

  function buildVectorsUI(container, vecCfg, current) {
    container.innerHTML = '';
    var rows = vecCfg.rows(current);
    var count = vecCfg.count(current);
    var hasParticular = vecCfg.hasParticular !== false;

    if (hasParticular) {
      var eq = document.createElement('span');
      eq.className = 'apt-act__eq';
      eq.textContent = 'S =';
      container.appendChild(eq);
      container.appendChild(buildVecBlock('p', rows));
    }

    for (var i = 0; i < count; i++) {
      if (hasParticular || i > 0) {
        var plus = document.createElement('span');
        plus.className = 'apt-act__op';
        plus.textContent = '+';
        container.appendChild(plus);
      }
      container.appendChild(buildVecBlock('d' + i, rows));
      var label = document.createElement('span');
      label.className = 'apt-act__paramlabel';
      label.textContent = '· ' + vecCfg.paramLabel(current, i);
      container.appendChild(label);
    }
  }

  function readVectorBlock(container, key, rows) {
    var vals = [];
    var hasEmpty = false;
    for (var r = 0; r < rows; r++) {
      var wrap = container.querySelector('.apt-act__cellwrap[data-key="' + key + '"][data-row="' + r + '"]');
      var input = wrap.querySelector('.apt-act__cell');
      var raw = input.value.trim();
      var v;
      if (raw === '') { hasEmpty = true; v = 0; } else v = parseInt(raw, 10);
      var sign = getSign(wrap);
      vals.push(sign === '-' ? -v : v);
    }
    return { vals: vals, hasEmpty: hasEmpty };
  }

  function colorVectorBlock(container, key, rows, cls) {
    for (var r = 0; r < rows; r++) {
      var wrap = container.querySelector('.apt-act__cellwrap[data-key="' + key + '"][data-row="' + r + '"]');
      wrap.classList.remove('is-correct', 'is-wrong');
      if (cls) wrap.classList.add(cls);
      wrap.querySelector('.apt-act__cell').disabled = true;
      setSignDisabled(wrap, true);
    }
  }

  function fillVectorBlock(container, key, vals) {
    vals.forEach(function (val, r) {
      var wrap = container.querySelector('.apt-act__cellwrap[data-key="' + key + '"][data-row="' + r + '"]');
      setSign(wrap, val < 0 ? '-' : '+');
      var input = wrap.querySelector('.apt-act__cell');
      input.value = String(Math.abs(val));
      wrap.classList.remove('is-wrong');
      wrap.classList.add('is-correct');
      setSignDisabled(wrap, true);
      input.disabled = true;
    });
  }

  function retryVectorsUI(container) {
    container.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
      wrap.classList.remove('is-correct', 'is-wrong');
      wrap.querySelector('.apt-act__cell').disabled = false;
      setSignDisabled(wrap, false);
    });
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
    } else if (cfg.mode === 'multiselect') {
      // Varias opciones tildables a la vez (0, 1 o más pueden ser correctas)
      // + un botón Comprobar, a diferencia de mode:'choices' que responde
      // al toque. Reutiliza el mismo .apt-act__choice-btn/is-selected de
      // siempre, solo que acá el click alterna en vez de responder.
      interactionHTML =
        '<div class="apt-act__choices"></div>' +
        '<button type="button" class="apt-act__check-btn">Comprobar</button>';
    } else {
      interactionHTML = '<div class="apt-act__choices"></div>';
    }
    var actionsHTML = (cfg.mode === 'grid' || cfg.mode === 'multiselect')
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
        '<div class="apt-act__feedback apt-act__feedback--hidden"></div>' +
        '<div class="apt-act__actions">' +
          actionsHTML +
          '<button type="button" class="apt-act__next-btn apt-act__next-btn--hidden">' + (cfg.nextLabel || 'Probar con otro caso →') + '</button>' +
          '<button type="button" class="apt-act__skip-btn">Prefiero otro caso →</button>' +
        '</div>' +
        '<div class="apt-act__footer-slot"></div>' +
      '</div>';

    var footerCtl = mountFooter(root.querySelector('.apt-act__footer-slot'));

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
      footerCtl: footerCtl
    };
  }

  /* ------------------------------------------------------------
     Esqueleto + ciclo del modo 'phases' (varias fases encadenadas,
     cada una choices/grid/vectors). Reutiliza los mismos helpers
     que el modo genérico (buildGrid, buildVectorsUI, mountFooter,
     sonido) — cero lógica duplicada.

     cfg.phases es siempre el array COMPLETO (el máximo de fases
     que una ronda podría llegar a necesitar) — el DOM se arma una
     sola vez al cargar la página con ese tamaño fijo.

     Dos campos opcionales, para actividades donde la cantidad de
     fases que realmente se usan varía según el caso generado
     (ej: orlado, donde se pregunta hasta el orden que el rango
     real de la matriz permita):

       cfg.activePhaseCount(current) → cuántas de las fases del
         array se usan en ESTA ronda. Si no se define, se sigue
         usando cfg.phases.length (comportamiento de siempre, sin
         cambios para actividades existentes).

       phase.onAnswered(current, correct, value, contentEl) →
         se llama después de cada respuesta (junto al feedback de
         la fase), con el contenedor de cfg.renderContent. Sirve
         para actualizar contenido compartido (ej: resaltar en la
         matriz el menor que se acaba de encontrar) sin tocar el
         ciclo de vida de la fase. Opcional, no rompe nada si no
         se define.

     Un tercer caso especial: fases con mode:'setup'. Sirven para
     actividades donde el ALUMNO elige algo (ej: cuántos parámetros,
     dónde van) ANTES de que se genere el caso — a diferencia de
     todo lo demás, donde cfg.generate() corre solo al arrancar la
     ronda. Con mode:'setup', cfg.generate ya NO se llama
     automáticamente: se llama recién cuando el alumno completa el
     paso (cfg.generate(selections), recibiendo un objeto con la
     elección de cada campo). Después de generar, el paso de setup
     se vuelve a ocultar (a diferencia del resto de las fases, que
     quedan visibles como historial) para liberar espacio.

       phase.fields → array de { key, label, options:[{value,label,sub?}] }.
         Cada campo se muestra como un grupo de botones (mismo estilo
         que mode:'choices'); hace falta elegir uno de cada grupo
         para habilitar el botón.
       phase.buttonLabel → texto del botón que dispara cfg.generate(selections).

     Solo tiene sentido como PRIMERA fase (idx 0) de un cfg.phases;
     el resto de las fases (SCD/SCI/SI, grid, lo que sea) siguen
     funcionando exactamente igual una vez que current existe.
     ------------------------------------------------------------ */
  function buildPhasesSkeleton(root, cfg) {
    root.classList.add('apt-act');

    var phasesHTML = cfg.phases.map(function (phase, idx) {
      var interactionHTML;
      if (phase.mode === 'grid') {
        interactionHTML =
          '<div class="apt-act__matrixwrap">' +
            '<span class="apt-act__bracket apt-act__bracket--left"></span>' +
            '<div class="apt-act__grid"></div>' +
            '<span class="apt-act__bracket apt-act__bracket--right"></span>' +
          '</div>' +
          '<p class="apt-act__hint">' + (phase.hint || 'Tocá − o + para cambiar el signo de cada número.') + '</p>' +
          '<button type="button" class="apt-act__check-btn">Comprobar</button>';
      } else if (phase.mode === 'vectors') {
        interactionHTML =
          '<div class="apt-act__solution"></div>' +
          '<p class="apt-act__hint">' + (phase.hint || 'Tocá − o + para cambiar el signo de cada número.') + '</p>' +
          '<button type="button" class="apt-act__check-btn">Comprobar</button>';
      } else if (phase.mode === 'setup') {
        // Paso de configuración PREVIO a generar el caso: uno o más
        // grupos de botones (cfg.phases[0].fields) + un botón que
        // recién ahí llama a cfg.generate(selections). Después de
        // generar, este phase se vuelve a ocultar (a diferencia del
        // resto, que quedan visibles como historial) para liberar
        // espacio en pantalla.
        interactionHTML = phase.fields.map(function (field, fIdx) {
          return '<div class="apt-act__setup-field" data-field="' + fIdx + '">' +
            '<p class="apt-act__setup-field-label">' + field.label + '</p>' +
            '<div class="apt-act__choices apt-act__setup-field-choices"></div>' +
          '</div>';
        }).join('') +
        '<button type="button" class="apt-act__setup-btn" disabled>' + (phase.buttonLabel || 'Generar') + '</button>';
      } else {
        interactionHTML = '<div class="apt-act__choices"></div>';
      }
      var hasAnswer = !!(phase.getAnswerGrid || phase.getAnswerVectors);
      var actionsHTML =
        '<div class="apt-act__actions-row">' +
          '<button type="button" class="apt-act__retry-btn apt-act__retry-btn--hidden">Reintentar</button>' +
          (hasAnswer ? '<button type="button" class="apt-act__retry-btn apt-act__retry-btn--hidden apt-act__showanswer-btn">Ver respuesta</button>' : '') +
        '</div>';

      return '<div class="apt-act__phase' + (idx > 0 ? ' apt-act__phase--hidden' : '') + '" data-phase="' + idx + '">' +
        '<p class="apt-act__question">' + (phase.question || '') + '</p>' +
        interactionHTML +
        '<div class="apt-act__feedback apt-act__feedback--hidden"></div>' +
        actionsHTML +
      '</div>';
    }).join('');

    root.innerHTML =
      '<div class="apt-act__app">' +
        '<div class="apt-act__topbar">' +
          '<p class="apt-act__eyebrow">' + (cfg.eyebrow || '') + '</p>' +
          '<h1 class="apt-act__title">' + (cfg.title || '') + '</h1>' +
          '<p class="apt-act__subtitle">' + (cfg.subtitle || '') + '</p>' +
        '</div>' +
        '<div class="apt-act__card"><div class="apt-act__content" aria-live="polite"></div></div>' +
        phasesHTML +
        '<button type="button" class="apt-act__next-btn apt-act__next-btn--hidden">' + (cfg.nextLabel || 'Probar con otro caso →') + '</button>' +
        '<button type="button" class="apt-act__skip-btn">' + (cfg.skipLabel || 'Prefiero otro caso →') + '</button>' +
        '<div class="apt-act__footer-slot"></div>' +
      '</div>';

    var footerCtl = mountFooter(root.querySelector('.apt-act__footer-slot'));

    var phaseRefs = [];
    root.querySelectorAll('.apt-act__phase').forEach(function (el) {
      phaseRefs.push({
        el: el,
        choicesWrap: el.querySelector('.apt-act__choices'),
        grid: el.querySelector('.apt-act__grid'),
        solution: el.querySelector('.apt-act__solution'),
        checkBtn: el.querySelector('.apt-act__check-btn'),
        setupBtn: el.querySelector('.apt-act__setup-btn'),
        feedback: el.querySelector('.apt-act__feedback'),
        retryBtn: el.querySelector('.apt-act__retry-btn'),
        showAnswerBtn: el.querySelector('.apt-act__showanswer-btn')
      });
    });

    return {
      content: root.querySelector('.apt-act__content'),
      phaseRefs: phaseRefs,
      skipBtn: root.querySelector('.apt-act__skip-btn'),
      nextBtn: root.querySelector('.apt-act__next-btn'),
      footerCtl: footerCtl
    };
  }

  function startPhases(root, cfg) {
    var refs = buildPhasesSkeleton(root, cfg);
    var current = null;
    var streak = 0;
    var phaseAnswered = [];

    function registerRoundResult(correct) {
      if (correct) { playCorrectSound(); celebrate(); } else { playWrongSound(); }
      streak = correct ? streak + 1 : 0;
      refs.footerCtl.setStreak(streak);
    }

    function showPhaseFeedback(idx, correct, bodyHTML) {
      var p = refs.phaseRefs[idx];
      renderFeedback(p.feedback, correct, correct ? '¡Correcto!' : 'No es correcto', bodyHTML);
    }

    function resetPhaseUI(idx) {
      var p = refs.phaseRefs[idx];
      p.feedback.className = 'apt-act__feedback apt-act__feedback--hidden';
      if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
      if (p.showAnswerBtn) p.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
      phaseAnswered[idx] = false;
    }

    function activePhaseCount() {
      return cfg.activePhaseCount ? cfg.activePhaseCount(current) : cfg.phases.length;
    }

    function advanceOrFinish(idx) {
      var isLast = idx === activePhaseCount() - 1;
      if (isLast) {
        registerRoundResult(true);
        refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
      } else {
        revealPhase(idx + 1);
        root.classList.remove('is-answered');
      }
    }

    function revealPhase(idx) {
      var phaseCfg = cfg.phases[idx];
      var p = refs.phaseRefs[idx];
      p.el.classList.remove('apt-act__phase--hidden');

      if (phaseCfg.mode === 'choices') {
        var choiceList = resolveChoices(phaseCfg.choices, current);
        p.choicesWrap.innerHTML = '';
        p.choicesWrap.classList.toggle('apt-act__choices--stacked', phaseCfg.choicesStacked !== undefined ? phaseCfg.choicesStacked : choiceList.length <= 2);
        choiceList.forEach(function (choice) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'apt-act__choice-btn';
          btn.dataset.value = choice.value;
          btn.innerHTML = '<span class="apt-act__choice-main">' + choice.label + '</span>' +
            (choice.sub ? '<span class="apt-act__choice-sub">' + choice.sub + '</span>' : '');
          btn.addEventListener('click', function () { answerChoicePhase(idx, choice.value, btn); });
          p.choicesWrap.appendChild(btn);
        });
        if (p.retryBtn) p.retryBtn.onclick = function () { retryChoicePhase(idx); };
      } else if (phaseCfg.mode === 'grid') {
        buildGrid(p.grid, phaseCfg.grid, phaseCfg, current);
        p.checkBtn.disabled = false;
        p.checkBtn.onclick = function () { checkGridPhase(idx); };
        if (p.retryBtn) p.retryBtn.onclick = function () { retryGridPhase(idx); };
        if (p.showAnswerBtn) p.showAnswerBtn.onclick = function () { showAnswerGridPhase(idx); };
      } else if (phaseCfg.mode === 'vectors') {
        buildVectorsUI(p.solution, phaseCfg.vectors, current);
        p.checkBtn.disabled = false;
        p.checkBtn.onclick = function () { checkVectorsPhase(idx); };
        if (p.retryBtn) p.retryBtn.onclick = function () { retryVectorsPhase(idx); };
        if (p.showAnswerBtn) p.showAnswerBtn.onclick = function () { showAnswerVectorsPhase(idx); };
      } else if (phaseCfg.mode === 'setup') {
        var selections = {};
        var fieldEls = p.el.querySelectorAll('.apt-act__setup-field');
        function updateSetupBtn() {
          p.setupBtn.disabled = phaseCfg.fields.some(function (f) { return selections[f.key] === undefined; });
        }
        fieldEls.forEach(function (fieldEl, fIdx) {
          var field = phaseCfg.fields[fIdx];
          var choicesWrap = fieldEl.querySelector('.apt-act__setup-field-choices');
          choicesWrap.innerHTML = '';
          choicesWrap.classList.toggle('apt-act__choices--stacked', field.options.length <= 2);
          field.options.forEach(function (opt) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'apt-act__choice-btn';
            btn.dataset.value = opt.value;
            btn.innerHTML = '<span class="apt-act__choice-main">' + opt.label + '</span>' +
              (opt.sub ? '<span class="apt-act__choice-sub">' + opt.sub + '</span>' : '');
            btn.addEventListener('click', function () {
              choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) { b.classList.remove('is-selected'); });
              btn.classList.add('is-selected');
              selections[field.key] = opt.value;
              updateSetupBtn();
            });
            choicesWrap.appendChild(btn);
          });
        });
        p.setupBtn.disabled = true;
        p.setupBtn.onclick = function () { completeSetup(idx, selections); };
      }
    }

    // ---------- setup (paso de configuración previo a generar) ----------
    function completeSetup(idx, selections) {
      current = cfg.generate(selections);
      cfg.renderContent(refs.content, current);
      refs.phaseRefs[idx].el.classList.add('apt-act__phase--hidden');
      revealPhase(idx + 1);
    }

    // ---------- choices ----------
    function answerChoicePhase(idx, value, btnEl) {
      if (phaseAnswered[idx]) return;
      phaseAnswered[idx] = true;
      var phaseCfg = cfg.phases[idx];
      var p = refs.phaseRefs[idx];
      p.choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) { b.disabled = true; });
      btnEl.classList.add('is-selected');
      root.classList.add('is-answered');

      var correct = phaseCfg.check(current, value);
      showPhaseFeedback(idx, correct, phaseCfg.explain(current, correct, value));
      if (phaseCfg.onAnswered) phaseCfg.onAnswered(current, correct, value, refs.content);

      var isLast = idx === activePhaseCount() - 1;
      if (correct) {
        advanceOrFinish(idx);
      } else {
        if (p.retryBtn) p.retryBtn.classList.remove('apt-act__retry-btn--hidden');
        refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
        if (isLast) registerRoundResult(false);
      }
    }

    function retryChoicePhase(idx) {
      if (!phaseAnswered[idx]) return;
      var p = refs.phaseRefs[idx];
      root.classList.remove('is-answered');
      p.feedback.className = 'apt-act__feedback apt-act__feedback--hidden';
      if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
      refs.nextBtn.classList.add('apt-act__next-btn--hidden');
      p.choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) {
        b.disabled = false;
        b.classList.remove('is-selected');
      });
      phaseAnswered[idx] = false;
    }

    // ---------- grid ----------
    function checkGridPhase(idx) {
      if (phaseAnswered[idx]) return;
      phaseAnswered[idx] = true;
      var phaseCfg = cfg.phases[idx];
      var p = refs.phaseRefs[idx];
      root.classList.add('is-answered');

      var read = readStudentMatrix(p.grid, phaseCfg.grid, current);
      var result = phaseCfg.checkGrid(current, read.matrix, read.hasEmpty);
      var correct = !!result.correct;

      p.grid.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
        var r = +wrap.dataset.row, c = +wrap.dataset.col;
        wrap.classList.remove('is-correct', 'is-wrong');
        var st = result.cellStatus && result.cellStatus[r] && result.cellStatus[r][c];
        if (st === 'correct') wrap.classList.add('is-correct');
        else if (st === 'wrong') wrap.classList.add('is-wrong');
        wrap.querySelector('.apt-act__cell').disabled = true;
        setSignDisabled(wrap, true);
      });

      showPhaseFeedback(idx, correct, result.feedbackText);
      p.checkBtn.disabled = true;
      if (phaseCfg.onAnswered) phaseCfg.onAnswered(current, correct, read.matrix, refs.content);

      var isLast = idx === activePhaseCount() - 1;
      if (correct) {
        if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
        if (p.showAnswerBtn) p.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
        advanceOrFinish(idx);
      } else {
        if (p.retryBtn) p.retryBtn.classList.remove('apt-act__retry-btn--hidden');
        if (p.showAnswerBtn) p.showAnswerBtn.classList.remove('apt-act__retry-btn--hidden');
        refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
        if (isLast) registerRoundResult(false);
      }
    }

    function retryGridPhase(idx) {
      if (!phaseAnswered[idx]) return;
      var p = refs.phaseRefs[idx];
      root.classList.remove('is-answered');
      p.grid.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
        wrap.classList.remove('is-correct', 'is-wrong');
        wrap.querySelector('.apt-act__cell').disabled = false;
        setSignDisabled(wrap, false);
      });
      p.feedback.className = 'apt-act__feedback apt-act__feedback--hidden';
      if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
      if (p.showAnswerBtn) p.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
      refs.nextBtn.classList.add('apt-act__next-btn--hidden');
      p.checkBtn.disabled = false;
      phaseAnswered[idx] = false;
    }

    function showAnswerGridPhase(idx) {
      var phaseCfg = cfg.phases[idx];
      var p = refs.phaseRefs[idx];
      var answerMatrix = phaseCfg.getAnswerGrid(current);
      p.grid.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
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
      if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
      p.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
      renderFeedback(p.feedback, true, phaseCfg.answerTitle || 'La respuesta correcta', phaseCfg.answerText || '');

      var isLast = idx === activePhaseCount() - 1;
      if (isLast) { refs.nextBtn.classList.remove('apt-act__next-btn--hidden'); }
      else { revealPhase(idx + 1); root.classList.remove('is-answered'); }
    }

    // ---------- vectors ----------
    function checkVectorsPhase(idx) {
      if (phaseAnswered[idx]) return;
      phaseAnswered[idx] = true;
      var phaseCfg = cfg.phases[idx];
      var p = refs.phaseRefs[idx];
      root.classList.add('is-answered');

      var rows = phaseCfg.vectors.rows(current);
      var count = phaseCfg.vectors.count(current);
      var hasParticular = phaseCfg.vectors.hasParticular !== false;

      var particularRead = hasParticular ? readVectorBlock(p.solution, 'p', rows) : null;
      var vectorReads = [];
      for (var i = 0; i < count; i++) vectorReads.push(readVectorBlock(p.solution, 'd' + i, rows));
      var hasEmpty = (particularRead && particularRead.hasEmpty) || vectorReads.some(function (v) { return v.hasEmpty; });

      var result = phaseCfg.checkVectors(
        current,
        particularRead ? particularRead.vals : null,
        vectorReads.map(function (v) { return v.vals; }),
        hasEmpty
      );
      var correct = !!result.correct;

      function statusToClass(st) {
        if (st === 'correct') return 'is-correct';
        if (st === 'wrong') return 'is-wrong';
        return null;
      }
      if (hasParticular) colorVectorBlock(p.solution, 'p', rows, statusToClass(result.particularStatus));
      vectorReads.forEach(function (_, i) {
        var st = result.vectorStatuses && result.vectorStatuses[i];
        colorVectorBlock(p.solution, 'd' + i, rows, statusToClass(st));
      });

      showPhaseFeedback(idx, correct, result.feedbackText);
      p.checkBtn.disabled = true;
      if (phaseCfg.onAnswered) phaseCfg.onAnswered(current, correct, vectorReads, refs.content);

      var isLast = idx === activePhaseCount() - 1;
      if (correct) {
        if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
        if (p.showAnswerBtn) p.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
        advanceOrFinish(idx);
      } else {
        if (p.retryBtn) p.retryBtn.classList.remove('apt-act__retry-btn--hidden');
        if (p.showAnswerBtn) p.showAnswerBtn.classList.remove('apt-act__retry-btn--hidden');
        refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
        if (isLast) registerRoundResult(false);
      }
    }

    function retryVectorsPhase(idx) {
      if (!phaseAnswered[idx]) return;
      var p = refs.phaseRefs[idx];
      root.classList.remove('is-answered');
      retryVectorsUI(p.solution);
      p.feedback.className = 'apt-act__feedback apt-act__feedback--hidden';
      if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
      if (p.showAnswerBtn) p.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
      refs.nextBtn.classList.add('apt-act__next-btn--hidden');
      p.checkBtn.disabled = false;
      phaseAnswered[idx] = false;
    }

    function showAnswerVectorsPhase(idx) {
      var phaseCfg = cfg.phases[idx];
      var p = refs.phaseRefs[idx];
      var answer = phaseCfg.getAnswerVectors(current);
      if (answer.particular) fillVectorBlock(p.solution, 'p', answer.particular);
      (answer.vectors || []).forEach(function (v, i) { fillVectorBlock(p.solution, 'd' + i, v); });

      if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
      p.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
      renderFeedback(p.feedback, true, phaseCfg.answerTitle || 'Una respuesta posible', phaseCfg.answerText || '');

      var isLast = idx === activePhaseCount() - 1;
      if (isLast) { refs.nextBtn.classList.remove('apt-act__next-btn--hidden'); }
      else { revealPhase(idx + 1); root.classList.remove('is-answered'); }
    }

    // ---------- ronda nueva ----------
    function newRound() {
      root.classList.remove('is-answered');
      refs.nextBtn.classList.add('apt-act__next-btn--hidden');

      cfg.phases.forEach(function (phaseCfg, idx) {
        var p = refs.phaseRefs[idx];
        if (idx === 0) p.el.classList.remove('apt-act__phase--hidden');
        else p.el.classList.add('apt-act__phase--hidden');
        resetPhaseUI(idx);
      });

      if (cfg.phases[0] && cfg.phases[0].mode === 'setup') {
        current = null;
        refs.content.innerHTML = '';
        revealPhase(0);
      } else {
        current = cfg.generate();
        cfg.renderContent(refs.content, current);
        revealPhase(0);
      }
    }

    refs.nextBtn.addEventListener('click', newRound);
    refs.skipBtn.addEventListener('click', newRound);
    newRound();
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

    if (cfg.mode === 'phases') {
      if (cfg.needsKatex) { ensureKatex(function () { startPhases(root, cfg); }); }
      else { startPhases(root, cfg); }
      return;
    }

    function start() {
      var refs = buildSkeleton(root, cfg);

      var current = null;
      var answered = false;
      var streak = 0;
      var currentOptionsByValue = {};

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
          var choiceList = resolveChoices(cfg.choices, current);
          refs.choicesWrap.innerHTML = '';
          refs.choicesWrap.classList.toggle('apt-act__choices--stacked', cfg.choicesStacked !== undefined ? cfg.choicesStacked : choiceList.length <= 2);
          choiceList.forEach(function (choice) {
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
        if (cfg.mode === 'multiselect') {
          var optionList = resolveChoices(cfg.options, current);
          currentOptionsByValue = {};
          refs.choicesWrap.innerHTML = '';
          refs.choicesWrap.classList.add('apt-act__choices--multiselect');
          optionList.forEach(function (opt) {
            currentOptionsByValue[opt.value] = opt;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'apt-act__choice-btn';
            btn.dataset.value = opt.value;
            btn.innerHTML = '<span class="apt-act__choice-main">' + opt.label + '</span>';
            btn.addEventListener('click', function () {
              if (answered) return;
              btn.classList.toggle('is-selected');
            });
            refs.choicesWrap.appendChild(btn);
          });
          refs.checkBtn.disabled = false;
        }
        resetCommonUI();
      }

      function showFeedback(correct, bodyHTML) {
        renderFeedback(refs.feedback, correct, correct ? '¡Correcto!' : 'No es correcto', bodyHTML);
      }

      function registerResult(correct) {
        if (correct) { playCorrectSound(); celebrate(); } else { playWrongSound(); }
        streak = correct ? streak + 1 : 0;
        refs.footerCtl.setStreak(streak);
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

        var read = readStudentMatrix(refs.grid, cfg.grid, current);
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
        renderFeedback(refs.feedback, true, cfg.answerTitle || 'La respuesta correcta', cfg.answerText || '');
      }

      function checkMultiselectAnswer() {
        if (answered) return;
        root.classList.add('is-answered');

        var allMatch = true;
        refs.choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) {
          var opt = currentOptionsByValue[b.dataset.value];
          var selected = b.classList.contains('is-selected');
          var isCorrectOpt = !!(opt && opt.correct);
          var matches = selected === isCorrectOpt;
          if (!matches) allMatch = false;
          b.classList.remove('is-correct', 'is-wrong');
          // Solo se colorea lo que el alumno tildó: verde si correspondía,
          // rojo si no. Lo que dejó sin tildar queda neutro (atenuado por
          // el :disabled), tildó bien o mal, para no "pintar todo verde".
          if (selected) b.classList.add(isCorrectOpt ? 'is-correct' : 'is-wrong');
          b.disabled = true;
        });

        showFeedback(allMatch, cfg.explain(current, allMatch));
        if (cfg.onAnswered) cfg.onAnswered(refs.content, current, allMatch);
        registerResult(allMatch);

        refs.checkBtn.disabled = true;
        refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
        if (!allMatch && refs.retryBtn) refs.retryBtn.classList.remove('apt-act__retry-btn--hidden');
        answered = true;
      }

      function retryMultiselect() {
        root.classList.remove('is-answered');
        refs.choicesWrap.querySelectorAll('.apt-act__choice-btn').forEach(function (b) {
          b.classList.remove('is-correct', 'is-wrong');
          b.disabled = false;
        });
        refs.feedback.className = 'apt-act__feedback apt-act__feedback--hidden';
        refs.nextBtn.classList.add('apt-act__next-btn--hidden');
        if (refs.retryBtn) refs.retryBtn.classList.add('apt-act__retry-btn--hidden');
        refs.checkBtn.disabled = false;
        answered = false;
      }

      if (cfg.mode === 'grid') {
        refs.checkBtn.addEventListener('click', checkGridAnswer);
        if (refs.retryBtn) refs.retryBtn.addEventListener('click', retryGrid);
        if (refs.showAnswerBtn) refs.showAnswerBtn.addEventListener('click', showAnswerGrid);
      }
      if (cfg.mode === 'multiselect') {
        refs.checkBtn.addEventListener('click', checkMultiselectAnswer);
        if (refs.retryBtn) refs.retryBtn.addEventListener('click', retryMultiselect);
      }

      refs.nextBtn.addEventListener('click', newRound);
      refs.skipBtn.addEventListener('click', newRound);

      newRound();
    }

    if (cfg.needsKatex) { ensureKatex(start); } else { start(); }
  }

  function isMuted() { return muted; }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* sin persistencia si está bloqueado */ }
    return muted;
  }

  global.AptActivity = {
    init: init,
    mountFooter: mountFooter,
    ensureAssets: ensureAssets,
    openReportModal: openReportModal,
    openCatalogModal: openCatalogModal,
    playCorrectSound: playCorrectSound,
    playWrongSound: playWrongSound,
    celebrate: celebrate,
    isMuted: isMuted,
    toggleMute: toggleMute
  };
})(window);
