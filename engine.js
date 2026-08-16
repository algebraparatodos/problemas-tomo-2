/* ============================================================
   ÁLGEBRA PARA TODOS · engine.js (v4.15)
   ------------------------------------------------------------
   Motor compartido por TODAS las actividades. Este es el único
   archivo que se edita para cambiar algo común a las 50 landings
   (paleta, tipografías, layout, sonido, footer, modo compacto...).

   Cada landing de Kajabi solo carga este script y le pasa un
   objeto de configuración con SU lógica particular.

   ESQUEMA DE URLs: hay UNA landing por unidad (/qrt2u1, /qrt2u2, ...)
   y el número de actividad viaja en el fragmento: /qrt2u1#7. La landing
   carga engine.js y unidad-N.js, y ese último resuelve qué actividad
   mostrar. Las URLs del CATALOG de abajo siguen ese esquema; si se
   cambia una, hay que cambiarla también en el QR impreso.

   NOTA DE NOTACIÓN: las matrices van con PARÉNTESIS, para coincidir
   con el libro impreso. Si una landing necesita dibujar delimitadores,
   tiene que usar las clases de acá (.apt-act__matrixwrap y
   .apt-act__bracket) en vez de definir las suyas — así un cambio de
   notación se aplica solo, sin re-pegar la landing una por una.

   El engine soporta tres modos de interacción:

     mode: 'choices' — botones de elección (ej: SCD/SCI/SI).
       cfg.choices, cfg.check(current,value), cfg.explain(...)
       cfg.choicesStacked (bool, opcional) — fuerza una sola
         columna (una opción por fila) sin importar la cantidad.
         Por defecto es automático: ≤2 opciones apila, >2 las pone
         en fila — pero conviene forzar `true` cuando cada opción
         es algo ancho (ej: una matriz renderizada con KaTeX en
         vez de un texto corto).
       cfg.choicesGrid (bool, opcional) — grid 2x2 con tarjetas
         tipo .apt-act__content (fondo oscuro, checkbox ☐/☑) en
         vez de botones. Pensado para opciones bien anchas, como
         una matriz completa por opción — evita el desborde que
         da el botón normal con contenido grande. Si se define,
         choicesStacked se ignora.

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
   totalmente anónimo — sin nombre ni email). openReportModal()
   acepta un contextLabel opcional (desde v4.14) para cuando la URL
   sola no identifica dónde surgió el reporte — lo usa exam.js,
   donde todas las preguntas comparten una misma landing.
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
  /* Versión del engine — texto sutil al lado de "Álgebra Para Todos"
     en el footer, para poder confirmar a simple vista si una landing
     ya recibió la última versión (útil por los problemas de caché
     del CDN de GitHub Pages). Notación tipo semver: número menor
     (1.0→1.1) en cambios chicos, mayor (1.0→2.0) en cambios grandes.
     Actualizar en CADA edición de engine.js, por chica que sea. */
  var ENGINE_VERSION = '4.15';

  var REPORT_ENTRY_URL = 'entry.833697682';

  /* ------------------------------------------------------------
     Bloqueo de scroll del body mientras hay un modal abierto —
     sin esto, en mobile el gesto de scroll dentro del modal a
     veces termina moviendo la página de atrás en vez del modal.
     Contador por si en algún momento hay más de un modal (poco
     probable, pero evita que uno se desbloquee de más si el otro
     sigue abierto).
     ------------------------------------------------------------ */
  var bodyScrollLockCount = 0;
  function lockBodyScroll() {
    bodyScrollLockCount++;
    if (bodyScrollLockCount === 1) {
      document.body.setAttribute('data-apt-prev-overflow', document.body.style.overflow || '');
      document.body.style.overflow = 'hidden';
    }
  }
  function unlockBodyScroll() {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
    if (bodyScrollLockCount === 0) {
      document.body.style.overflow = document.body.getAttribute('data-apt-prev-overflow') || '';
      document.body.removeAttribute('data-apt-prev-overflow');
    }
  }
  var REPORT_MODAL_ID = 'apt-report-modal';

  var CATALOG_MODAL_ID = 'apt-catalog-modal';

  var REGISTRO_MODAL_ID = 'apt-registro-modal';

  /* URL del checkout gratuito que da acceso al modo examen (Offer
     aMFTW3eK). Vive acá, en una sola constante, para no tener que
     buscarla en dos lugares el día que cambie. */
  var EXAMEN_CHECKOUT_URL = 'https://www.algebraparatodos.com/offers/aMFTW3eK/checkout';

  /* Destino directo para quien ya tiene cuenta (evita repetir el
     checkout de una Offer que ya compró — Kajabi ahí muestra su
     propia pantalla de "ya compraste esto", no nuestro flujo). */
  var EXAMEN_URL = 'https://www.algebraparatodos.com/examen-algebra';

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
        { title: 'Clasificá el sistema', url: 'https://www.algebraparatodos.com/qrt2u1#1' },
        { title: 'Matriz ampliada', url: 'https://www.algebraparatodos.com/qrt2u1#2' },
        { title: '¿Es escalonada?', url: 'https://www.algebraparatodos.com/qrt2u1#3' },
        { title: 'Aplicá el método de eliminación de Gauss', url: 'https://www.algebraparatodos.com/qrt2u1#4' },
        { title: '¿Es escalonada reducida?', url: 'https://www.algebraparatodos.com/qrt2u1#5' },
        { title: 'Encontrá la forma escalonada reducida', url: 'https://www.algebraparatodos.com/qrt2u1#6' },
        { title: 'Solución paramétrica', url: 'https://www.algebraparatodos.com/qrt2u1#7' },
        { title: 'Rango por orlado', url: 'https://www.algebraparatodos.com/qrt2u1#8' },
        { title: 'Clasificá con Rouché-Frobenius', url: 'https://www.algebraparatodos.com/qrt2u1#9' },
        { title: 'Rouché-Frobenius con parámetros', url: 'https://www.algebraparatodos.com/qrt2u1#10' },
        { title: 'Tipos de matrices', url: 'https://www.algebraparatodos.com/qrt2u1#11' },
        { title: 'Suma de matrices', url: 'https://www.algebraparatodos.com/qrt2u1#12' },
        { title: 'Producto de una matriz por un escalar', url: 'https://www.algebraparatodos.com/qrt2u1#13' },
        { title: 'Trasposición de matrices', url: 'https://www.algebraparatodos.com/qrt2u1#14' },
        { title: 'Producto de matrices', url: 'https://www.algebraparatodos.com/qrt2u1#15' }
      ]
    },
    { title: 'Unidad 2: Subespacios vectoriales', activities: [
        { title: 'Operaciones con conjuntos', url: 'https://www.algebraparatodos.com/qrt2u2#1' },
        { title: '¿Es una LCI?', url: 'https://www.algebraparatodos.com/qrt2u2#2' },
        { title: '¿Es una LCE?', url: 'https://www.algebraparatodos.com/qrt2u2#3' },
        { title: 'Neutro y simétrico de una operación "rara"', url: 'https://www.algebraparatodos.com/qrt2u2#4' },
        { title: '¿Es un subespacio vectorial?', url: 'https://www.algebraparatodos.com/qrt2u2#5' },
        { title: '¿Es LI o LD?', url: 'https://www.algebraparatodos.com/qrt2u2#6' },
        { title: '¿Genera V? ¿Es base?', url: 'https://www.algebraparatodos.com/qrt2u2#7' },
        { title: 'Coordenadas de un vector en una base', url: 'https://www.algebraparatodos.com/qrt2u2#8' },
        { title: 'Matriz de cambio de base', url: 'https://www.algebraparatodos.com/qrt2u2#9' },
        { title: 'Base de un SEV', url: 'https://www.algebraparatodos.com/qrt2u2#10' },
        { title: 'Ecuaciones implícitas desde un conjunto generador', url: 'https://www.algebraparatodos.com/qrt2u2#11' },
        { title: 'Cambio de base en un SEV', url: 'https://www.algebraparatodos.com/qrt2u2#12' },
        { title: 'Intersección de subespacios', url: 'https://www.algebraparatodos.com/qrt2u2#13' },
        { title: 'Suma de subespacios / suma directa', url: 'https://www.algebraparatodos.com/qrt2u2#14' },
        { title: 'Complemento ortogonal', url: 'https://www.algebraparatodos.com/qrt2u2#15' },
        { title: 'Proyección ortogonal', url: 'https://www.algebraparatodos.com/qrt2u2#16' },
        { title: 'Método de Gram-Schmidt', url: 'https://www.algebraparatodos.com/qrt2u2#17' }
      ] },
    { title: 'Unidad 3: Transformaciones Lineales', activities: [
        { title: '¿Es lineal?', url: 'https://www.algebraparatodos.com/qrt2u3#1' },
        { title: '¿Existe? ¿Es única?', url: 'https://www.algebraparatodos.com/qrt2u3#2' },
        { title: 'Armá la matriz asociada', url: 'https://www.algebraparatodos.com/qrt2u3#3' },
        { title: 'Núcleo e imagen', url: 'https://www.algebraparatodos.com/qrt2u3#4' },
        { title: 'Clasificá la TL', url: 'https://www.algebraparatodos.com/qrt2u3#5' },
        { title: 'Determinante y área', url: 'https://www.algebraparatodos.com/qrt2u3#6' },
        { title: 'Armá la base natural', url: 'https://www.algebraparatodos.com/qrt2u3#7' },
        { title: 'Matriz asociada en otras bases', url: 'https://www.algebraparatodos.com/qrt2u3#8' },
        { title: 'Cambio de base de M(T)', url: 'https://www.algebraparatodos.com/qrt2u3#9' },
        { title: '¿Pertenece a la imagen o al núcleo?', url: 'https://www.algebraparatodos.com/qrt2u3#10' },
        { title: 'Base de la imagen y del núcleo', url: 'https://www.algebraparatodos.com/qrt2u3#11' },
        { title: 'Composición de TL', url: 'https://www.algebraparatodos.com/qrt2u3#12' },
        { title: '¿Qué es posible?', url: 'https://www.algebraparatodos.com/qrt2u3#13' },
        { title: 'Hallá M(T⁻¹)', url: 'https://www.algebraparatodos.com/qrt2u3#14' },
        { title: 'Identificá la TL geométrica', url: 'https://www.algebraparatodos.com/qrt2u3#15' },
        { title: 'Componé geométricas', url: 'https://www.algebraparatodos.com/qrt2u3#16' }
      ] },
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
    '.apt-act__card{ background:var(--bg-card); border:1px solid rgba(151,161,216,0.18); border-radius:var(--radius); box-shadow:0 1px 3px rgba(0,0,0,.4), 0 10px 24px rgba(0,0,0,.35); padding:14px; display:flex; justify-content:center; overflow-x:auto; overflow-y:hidden; }',
    '.apt-act__content{ width:100%; display:flex; flex-direction:column; align-items:center; gap:6px; font-size:clamp(15px,4.4vw,19px); }',
    '.apt-act__content--sev{ font-size:clamp(12px,3.4vw,16px); }',
    '.apt-act__sev-basis{ display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:6px 10px; }',
    '.apt-act__sev-bracket{ line-height:1; color:var(--ink-soft); }',
    '.apt-act__sev-item{ display:inline-flex; align-items:center; gap:6px; flex-wrap:nowrap; }',
    '.apt-act__content-ambient{ font-size:clamp(11px,3vw,13px); color:var(--ink-soft); }',
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
    /* -- variante para opciones "anchas" (ej: una matriz renderizada
       con KaTeX) — tarjetas tipo .apt-act__content en vez de botón,
       en grid 2x2, con checkbox. min-width:0 + overflow-x:auto evita
       que el contenido se desborde de la tarjeta. -- */
    '.apt-act__choices--grid{ display:grid; grid-template-columns:1fr; gap:10px; }',
    '@media (min-width:420px){ .apt-act__choices--grid{ grid-template-columns:1fr 1fr; } }',
    '.apt-act__choices--grid-1col{ grid-template-columns:1fr !important; }',
    '.apt-act__choices--grid .apt-act__choice-btn{ flex-direction:row; align-items:flex-start; justify-content:flex-start; gap:6px; background:var(--bg-card); border:1px solid rgba(151,161,216,0.25); border-radius:14px; box-shadow:0 1px 3px rgba(0,0,0,.4); padding:12px 8px; min-height:90px; min-width:0; }',
    '.apt-act__choices--grid .apt-act__choice-btn::before{ content:"☐"; flex:0 0 auto; font-size:14px; }',
    '.apt-act__choices--grid .apt-act__choice-btn.is-selected::before{ content:"☑"; }',
    '.apt-act__choices--grid .apt-act__choice-btn.is-selected{ background:rgba(151,161,216,0.12); border-color:var(--chalk-light); color:var(--ink); }',
    '.apt-act__choices--grid .apt-act__choice-btn.is-correct{ border-color:var(--correct); background:var(--correct-bg); color:var(--correct); }',
    '.apt-act__choices--grid .apt-act__choice-btn.is-wrong{ border-color:var(--wrong); background:var(--wrong-bg); color:var(--wrong); }',
    '.apt-act__choices--grid .apt-act__choice-main{ flex:1 1 auto; min-width:0; font-size:clamp(10px,3vw,13px); text-align:center; overflow-x:auto; overflow-y:hidden; }',
    '.apt-act__choice-btn:disabled{ opacity:.5; cursor:default; }',
    '.apt-act__choice-btn:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__matrixwrap{ display:flex; align-items:stretch; justify-content:center; gap:3px; }',
    '.apt-act__grid-row{ display:flex; align-items:stretch; justify-content:center; gap:8px; }',
    '.apt-act__grid-label{ display:flex; align-items:center; font-size:1.1em; color:var(--ink); }',
    /* Delimitadores de la grilla de inputs: PARÉNTESIS, para coincidir
       con la notación del libro impreso. El arco se logra con un radio
       elíptico grande sobre un único borde lateral — sin bordes arriba
       y abajo, que son los que daban el corchete. v2.0 */
    /* 11px + gap 3px ocupa lo MISMO que el corchete viejo (9px + gap 6px).
       Con 14px la grilla de 3x4 se pasaba 5px de la pantalla a 320px. v3.2 */
    '.apt-act__bracket{ width:11px; flex:0 0 11px; }',
    '.apt-act__bracket--left{ border-left:3px solid var(--ink-soft); border-radius:60px 0 0 60px / 50% 0 0 50%; }',
    '.apt-act__bracket--right{ border-right:3px solid var(--ink-soft); border-radius:0 60px 60px 0 / 0 50% 50% 0; }',
    '.apt-act__grid{ display:grid; gap:8px 6px; padding:4px 4px; }',
    '.apt-act__divider{ width:2px; background:var(--chalk-light); opacity:.45; justify-self:center; }',
    '.apt-act__solution{ display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:6px 8px; margin-bottom:4px; }',
    '.apt-act__space-answer{ display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:center; gap:14px 18px; margin-bottom:4px; }',
    '.apt-act__space-answer--rows{ flex-direction:column; align-items:center; gap:14px; }',
    '.apt-act__space-row{ display:flex; align-items:center; gap:8px; }',
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

    /* ---- Widget de espacio (Unidad 2: Rn / matrices / polinomios) ----
       Solo layout del contenedor + etiquetas de potencia de x. Los
       inputs, signos y colores correcto/incorrecto ya vienen gratis
       de .apt-act__cellwrap/.apt-act__cell/.apt-act__signseg de arriba. */
    '.apt-act__space{ display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:6px; }',
    '.apt-act__space--column{ flex-direction:column; gap:5px; padding:4px 2px; }',
    '.apt-act__space .apt-act__cellwrap{ gap:2px; }',
    '.apt-act__space .apt-act__signseg{ flex-basis:26px; width:26px; }',
    '.apt-act__space .apt-act__cell{ width:42px; flex:0 0 auto; }',
    '.apt-act__space--matrix{ gap:8px 6px; }',
    '.apt-act__space__polyterm{ display:flex; align-items:center; gap:4px; }',
    '.apt-act__space__polylabel{ font-family:var(--font-serif); font-weight:700; font-size:15px; color:var(--ink); white-space:nowrap; }',
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
    '.apt-act__hint:empty{ display:none; margin:0; }',
    '.apt-act__system{ display:flex; align-items:stretch; gap:8px; justify-content:center; }',
    '.apt-act__system-prefix{ display:flex; align-items:center; }',
    '.apt-act__system-suffix{ display:flex; align-items:center; }',
    '.apt-act__system-brace{ flex:0 0 0.85em; width:0.85em; color:var(--ink); }',
    '.apt-act__system-brace svg{ width:100%; height:100%; display:block; }',
    '.apt-act__system-lines{ display:flex; flex-direction:column; justify-content:center; gap:8px; }',
    '.apt-act__system-line--split{ display:flex; flex-wrap:wrap; align-items:baseline; justify-content:center; column-gap:8px; row-gap:2px; }',
    '.apt-act__system-line--split > span:first-child{ white-space:nowrap; }',
    '.apt-act__system-cond{ font-size:0.82em; opacity:.85; white-space:nowrap; }',
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
    '.apt-act__exam-btn{ align-self:center; display:flex; align-items:center; gap:6px; font-family:var(--font-serif); font-weight:700; font-size:11.5px; color:var(--chalk-light); text-decoration:none; background:transparent; border:1px solid rgba(151,161,216,0.3); border-radius:999px; padding:6px 14px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .15s ease, border-color .15s ease; }',
    '.apt-act__exam-btn:hover{ background:rgba(151,161,216,0.1); }',
    '.apt-act__exam-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__catalog-btn:hover{ background:rgba(151,161,216,0.1); }',
    '.apt-act__catalog-btn:active{ transform:scale(.97); }',
    '.apt-act__catalog-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__nav-row{ display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; }',
    '.apt-act__nav-btn{ font-family:var(--font-serif); font-weight:700; font-size:11px; color:var(--chalk-light); text-decoration:none; background:transparent; border:1px solid rgba(151,161,216,0.3); border-radius:999px; padding:6px 12px; white-space:nowrap; -webkit-tap-highlight-color:transparent; transition:background .15s ease, border-color .15s ease; }',
    '.apt-act__nav-btn:hover{ background:rgba(151,161,216,0.1); }',
    '.apt-act__nav-btn:focus-visible{ outline:2px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-act__footer-row{ display:flex; justify-content:space-between; align-items:center; }',
    '.apt-act__brand-group{ display:flex; align-items:baseline; gap:6px; }',
    '.apt-act__brand-link{ color:var(--chalk-light); text-decoration:none; }',
    '.apt-act__version{ font-family:var(--font-mono); font-weight:400; font-size:10px; color:var(--ink-soft); opacity:.6; }',
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
    '.apt-report-modal{ position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; padding:16px; z-index:2147483000; font-family:"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace; touch-action:none; overscroll-behavior:none; }',
    '.apt-report-modal--hidden{ display:none; }',
    '.apt-report-modal__card{ width:100%; max-width:360px; background:#16161C; border:1px solid rgba(151,161,216,0.18); border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,.5); padding:22px 20px; display:flex; flex-direction:column; gap:12px; box-sizing:border-box; }',
    '.apt-report-modal__title{ font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:18px; color:#F5F5F7; margin:0; }',
    '.apt-report-modal__desc{ font-size:12.5px; color:#A7ACC0; line-height:1.5; margin:0; }',
    /* Solo aparece cuando openReportModal recibe un contextLabel (hoy,
       el modo examen) — ver comentario junto a openReportModal(). */
    '.apt-report-modal__context{ font-size:11px; color:#97A1D8; opacity:.85; line-height:1.4; margin:-2px 0 0; }',
    '.apt-report-modal__context--hidden{ display:none; }',
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
    '.apt-catalog-modal{ position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; padding:16px; z-index:2147483000; font-family:"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace; touch-action:none; overscroll-behavior:none; }',
    '.apt-catalog-modal--hidden{ display:none; }',
    '.apt-catalog-modal__card{ width:100%; max-width:380px; max-height:80vh; background:#16161C; border:1px solid rgba(151,161,216,0.18); border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,.5); padding:20px 18px; display:flex; flex-direction:column; gap:12px; box-sizing:border-box; overflow:hidden; }',
    '.apt-catalog-modal__head{ display:flex; align-items:center; justify-content:space-between; gap:8px; }',
    '.apt-catalog-modal__title{ font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:18px; color:#F5F5F7; margin:0; }',
    '.apt-catalog-modal__close-x{ width:28px; height:28px; flex:0 0 auto; border-radius:50%; border:1px solid rgba(151,161,216,0.3); background:transparent; color:#97A1D8; font-size:14px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; -webkit-tap-highlight-color:transparent; }',
    '.apt-catalog-modal__close-x:hover{ background:rgba(151,161,216,0.12); }',
    '.apt-catalog-modal__close-x:focus-visible{ outline:2px solid #97A1D8; outline-offset:2px; }',
    '.apt-catalog-modal__list{ overflow-y:auto; overscroll-behavior:contain; touch-action:pan-y; -webkit-overflow-scrolling:touch; max-height:min(55vh, 420px); display:flex; flex-direction:column; gap:8px; padding-right:2px; }',
    '.apt-catalog-modal__unit{ border:1px solid rgba(151,161,216,0.18); border-radius:10px; overflow:hidden; flex-shrink:0; }',
    '.apt-catalog-modal__unit-btn{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px; font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:13.5px; color:#F5F5F7; background:rgba(151,161,216,0.06); border:none; padding:12px 14px; cursor:pointer; text-align:left; -webkit-tap-highlight-color:transparent; }',
    '.apt-catalog-modal__unit-btn:disabled{ cursor:default; opacity:.6; }',
    '.apt-catalog-modal__unit-btn:focus-visible{ outline:2px solid #97A1D8; outline-offset:-2px; }',
    '.apt-catalog-modal__unit-chevron{ color:#F5F5F7; font-size:19px; flex:0 0 auto; transition:transform .15s ease; }',
    '.apt-catalog-modal__unit.is-open .apt-catalog-modal__unit-chevron{ transform:rotate(90deg); }',
    '.apt-catalog-modal__unit-empty{ font-family:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace; font-weight:400; font-size:11px; color:#A7ACC0; flex:0 0 auto; }',
    '.apt-catalog-modal__acts{ display:none; flex-direction:column; }',
    '.apt-catalog-modal__unit.is-open .apt-catalog-modal__acts{ display:flex; }',
    '.apt-catalog-modal__act-link{ display:block; font-family:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace; font-size:12.5px; color:#CFD3E8; text-decoration:none; padding:10px 14px 10px 26px; border-top:1px solid rgba(151,161,216,0.12); transition:background .15s ease, color .15s ease; }',
    '.apt-catalog-modal__act-link:hover{ background:rgba(151,161,216,0.08); color:#F5F5F7; }',
    '.apt-catalog-modal__act-link:focus-visible{ outline:2px solid #97A1D8; outline-offset:-2px; }',
    /* -- Modal de "hace falta estar registrado" para el modo examen —
       mismo patrón que el catalog-modal (vive fuera de .apt-act). -- */
    '.apt-registro-modal{ position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; padding:16px; z-index:2147483000; font-family:"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace; touch-action:none; overscroll-behavior:none; }',
    '.apt-registro-modal--hidden{ display:none; }',
    '.apt-registro-modal__card{ width:100%; max-width:340px; background:#16161C; border:1px solid rgba(151,161,216,0.18); border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,.5); padding:26px 22px 22px; display:flex; flex-direction:column; align-items:center; gap:14px; box-sizing:border-box; text-align:center; }',
    '.apt-registro-modal__close-x{ position:absolute; top:12px; right:12px; width:28px; height:28px; border-radius:50%; border:1px solid rgba(151,161,216,0.3); background:transparent; color:#97A1D8; font-size:14px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; -webkit-tap-highlight-color:transparent; }',
    '.apt-registro-modal__close-x:hover{ background:rgba(151,161,216,0.12); }',
    '.apt-registro-modal__close-x:focus-visible{ outline:2px solid #97A1D8; outline-offset:2px; }',
    '.apt-registro-modal__card{ position:relative; }',
    '.apt-registro-modal__icon{ font-size:32px; line-height:1; }',
    '.apt-registro-modal__title{ font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:17px; color:#F5F5F7; margin:0; line-height:1.4; }',
    '.apt-registro-modal__text{ font-size:13px; color:#A7ACC0; margin:0; line-height:1.5; }',
    '.apt-registro-modal__cta{ font-family:"Lora",Georgia,"Times New Roman",serif; font-weight:700; font-size:14.5px; color:#fff; background:#48507D; border:none; border-radius:12px; padding:13px 22px; cursor:pointer; text-decoration:none; -webkit-tap-highlight-color:transparent; margin-top:4px; }',
    '.apt-registro-modal__cta:hover{ color:#A7ACC0; }',
    '.apt-registro-modal__secondary{ background:none; border:none; color:var(--ink-soft, #A7ACC0); font-family:"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace; font-size:12px; text-decoration:underline; text-underline-offset:3px; cursor:pointer; padding:2px 0; -webkit-tap-highlight-color:transparent; }',
    '.apt-registro-modal__secondary:hover{ color:#97A1D8; }',
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

  // Soporta LaTeX inline en textos como el subtítulo (ej. "encontrá $[v]_B$")
  // usando $...$ como delimitador. El resto del texto queda tal cual.
  // Si KaTeX todavía no está disponible, devuelve el texto sin tocar.
  function renderTextWithMath(text) {
    if (!text) return '';
    if (!window.katex) return text;
    return text.split(/(\$[^$]+\$)/g).map(function (part) {
      if (part.length > 1 && part.charAt(0) === '$' && part.charAt(part.length - 1) === '$') {
        try { return window.katex.renderToString(part.slice(1, -1), { throwOnError: false }); }
        catch (e) { return part; }
      }
      return part;
    }).join('');
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
    schedulePatchKatex();
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
     Normalización de delimitadores de matriz (v2.0)
     ------------------------------------------------------------
     Notación del proyecto: las matrices van con PARÉNTESIS, para
     coincidir con el libro impreso. Este archivo ya está todo en
     pmatrix, pero las landings publicadas tienen su propio LaTeX
     escrito con corchetes y viven en Kajabi, no en este repo — así
     que en vez de editarlas una por una, se normaliza acá, que es
     el único punto por el que pasa TODO el LaTeX de TODAS las
     actividades.

     El reemplazo es DELIBERADAMENTE quirúrgico. Solo toca:
       \begin{bmatrix} ... \end{bmatrix}              (siempre es matriz)
       \left[\begin{array} ... \end{array}\right]     (matriz ampliada)
     y NO toca los corchetes sueltos, porque ahí el corchete significa
     otra cosa: [0,1] es un intervalo CERRADO (pasarlo a paréntesis lo
     volvería abierto, o sea un error matemático) y [v]_B son las
     coordenadas de un vector en una base, que van con corchetes.
     ------------------------------------------------------------ */
  function normalizeMatrixDelims(tex) {
    if (typeof tex !== 'string') return tex;
    if (tex.indexOf('bmatrix') === -1 && tex.indexOf('[') === -1) return tex;
    return tex
      .replace(/\\begin\{bmatrix\}/g, '\\begin{pmatrix}')
      .replace(/\\end\{bmatrix\}/g, '\\end{pmatrix}')
      .replace(/\\left\[\s*\\begin\{array\}/g, '\\left(\\begin{array}')
      .replace(/\\end\{array\}\s*\\right\]/g, '\\end{array}\\right)');
  }

  var _katexPatched = false;
  function patchKatexDelims() {
    if (_katexPatched || !window.katex) return;
    var k = window.katex;
    if (typeof k.render === 'function') {
      var origRender = k.render;
      k.render = function (tex, el, opts) { return origRender.call(k, normalizeMatrixDelims(tex), el, opts); };
    }
    if (typeof k.renderToString === 'function') {
      var origRTS = k.renderToString;
      k.renderToString = function (tex, opts) { return origRTS.call(k, normalizeMatrixDelims(tex), opts); };
    }
    _katexPatched = true;
  }

  /* El normalizador tiene que quedar instalado ANTES de que cualquier
     actividad dibuje su primera fórmula, y por CUALQUIER camino:
       - actividades con needsKatex, que pasan por ensureKatex
       - actividades que cargan KaTeX por su cuenta con su propio <script>
       - el modo examen
     Colgarlo solo de ensureKatex dejaba afuera a las dos últimas (se
     medían ~3 de cada 10 fórmulas saliendo con corchetes). Por eso se
     arranca además desde ensureAssets(), que es lo primero que corre
     en todos los casos, con un poll acotado por si KaTeX todavía no
     terminó de cargar. v3.2 */
  var _katexPatchPoll = null;
  function schedulePatchKatex() {
    patchKatexDelims();
    if (_katexPatched || _katexPatchPoll) return;
    var tries = 0;
    _katexPatchPoll = setInterval(function () {
      tries++;
      patchKatexDelims();
      if (_katexPatched || tries > 400) { clearInterval(_katexPatchPoll); _katexPatchPoll = null; }
    }, 25);
  }

  var _katexCssLoaded = false;
  var _katexFontsReady = false;

  /* Las 12 familias que usa katex.min.css (fijas para la v0.16.9, no
     cambian salvo que se actualice la versión de KaTeX). Que el <link>
     del CSS termine de cargar (onload) confirma que las REGLAS ya están
     en el CSSOM, pero NO que los archivos .woff2 de cada fuente ya se
     descargaron — eso el navegador lo hace recién, en background, la
     primera vez que hace falta pintar un glifo con ella. Un delimitador
     grande como \begin{cases} se arma apilando varias piezas de una
     fuente con precisión de píxel; si la pieza llega un instante tarde,
     no se reacomoda sola después — queda mal armado aunque el resto del
     texto (que sí alcanzó a cargar a tiempo) se vea perfecto. Por eso
     hace falta forzar la descarga real de la fuente ANTES de renderizar,
     no alcanza con esperar el CSS. */
  var KATEX_FONT_FAMILIES = [
    'KaTeX_AMS', 'KaTeX_Caligraphic', 'KaTeX_Fraktur', 'KaTeX_Main',
    'KaTeX_Math', 'KaTeX_SansSerif', 'KaTeX_Script', 'KaTeX_Size1',
    'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4', 'KaTeX_Typewriter'
  ];

  function forzarCargaDeFuentes(onDone) {
    /* Feature-detection: la Font Loading API (document.fonts) es
       estándar desde hace años, pero si por lo que sea no está
       disponible, se sigue sin bloquear — mejor un render con el riesgo
       viejo que uno que nunca llega. */
    if (!document.fonts || typeof document.fonts.load !== 'function') { onDone(); return; }
    var promesas = KATEX_FONT_FAMILIES.map(function (fam) {
      // "1em" alcanza: lo que importa es que el archivo se descargue,
      // no el tamaño con el que se pida.
      return document.fonts.load('1em "' + fam + '"').catch(function () { /* si una fuente puntual falla, no bloquear el resto */ });
    });
    Promise.all(promesas).then(onDone).catch(onDone);
  }

  function ensureKatex(callback) {
    if (window.katex && _katexCssLoaded && _katexFontsReady) { patchKatexDelims(); callback(); return; }
    if (!document.getElementById(KATEX_CSS_ID)) {
      var link = document.createElement('link');
      link.id = KATEX_CSS_ID;
      link.rel = 'stylesheet';
      /* Auto-hospedado en el mismo GitHub Pages que engine.js — antes
         dependía de cdnjs.cloudflare.com para ~15 archivos de fuentes;
         si UNO solo fallaba en una red de celular (típico en el público
         de este proyecto), esa fuente puntual quedaba con un fallback
         cuyas métricas no calzan, y delimitadores grandes tipo
         \begin{cases} salían deformes/duplicados aunque el resto del
         texto se viera bien. Un solo origen confiable resuelve eso. */
      link.href = 'https://algebraparatodos.github.io/problemas-tomo-2/katex/katex.min.css';
      link.onload = function () {
        _katexCssLoaded = true;
        forzarCargaDeFuentes(function () { _katexFontsReady = true; });
      };
      /* onerror también libera los dos flags: mejor un render sin
         estilos/fuentes que uno que nunca llega. */
      link.onerror = function () { _katexCssLoaded = true; _katexFontsReady = true; };
      document.head.appendChild(link);
    }
    if (!document.getElementById(KATEX_JS_ID)) {
      var script = document.createElement('script');
      script.id = KATEX_JS_ID;
      script.src = 'https://algebraparatodos.github.io/problemas-tomo-2/katex/katex.min.js';
      document.head.appendChild(script);
    }
    var poll = setInterval(function () {
      if (window.katex && _katexCssLoaded && _katexFontsReady) { clearInterval(poll); patchKatexDelims(); callback(); }
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
          '<p class="apt-report-modal__context apt-report-modal__context--hidden"></p>' +
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

    function closeModal() { modal.classList.add('apt-report-modal--hidden'); unlockBodyScroll(); }

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
      /* En landings normales window.location.href YA identifica el
         ejercicio (una URL por actividad). En modo examen todas las
         preguntas comparten la misma URL ("modo examen" en general),
         así que ahí hace falta el contexto extra: qué unidad/tema/
         pregunta estaba viendo el alumno. modal._reportContext lo
         pone quien haya llamado a openReportModal(contextLabel); si
         no se pasó nada (caso normal de una landing de actividad),
         queda tal cual estaba antes. */
      var urlValue = window.location.href;
      if (modal._reportContext) urlValue += '  \u2014 ' + modal._reportContext;
      params.set(REPORT_ENTRY_URL, urlValue);

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

    modal._openReport = function (contextLabel) {
      resetModal();
      modal._reportContext = contextLabel || null;
      var contextEl = modal.querySelector('.apt-report-modal__context');
      if (contextEl) {
        if (contextLabel) {
          contextEl.textContent = 'Se va a adjuntar: ' + contextLabel;
          contextEl.classList.remove('apt-report-modal__context--hidden');
        } else {
          contextEl.classList.add('apt-report-modal__context--hidden');
        }
      }
      modal.classList.remove('apt-report-modal--hidden');
      lockBodyScroll();
      textarea.focus();
    };
    return modal;
  }

  /* contextLabel (opcional): texto extra para identificar DÓNDE surgió
     el reporte cuando la URL sola no alcanza — hoy lo usa el modo
     examen (ver exam.js), donde todas las preguntas comparten la
     misma landing. Las landings de actividades pueden seguir llamando
     a openReportModal() sin argumentos, como siempre. */
  function openReportModal(contextLabel) {
    ensureReportModal()._openReport(contextLabel);
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
        ? unit.activities.map(function (act, i) {
            return '<a class="apt-catalog-modal__act-link" href="' + act.url + '">' + (i + 1) + '. ' + act.title + '</a>';
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

    function closeModal() { modal.classList.add('apt-catalog-modal--hidden'); unlockBodyScroll(); }

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

    modal._openCatalog = function () { modal.classList.remove('apt-catalog-modal--hidden'); lockBodyScroll(); };
    return modal;
  }

  function openCatalogModal() {
    ensureCatalogModal()._openCatalog();
  }

  /* ------------------------------------------------------------
     Modal de "hace falta estar registrado" — se muestra al tocar
     el botón de Modo examen. El CTA manda al checkout gratuito
     (Offer aMFTW3eK); Kajabi se encarga de registrar y del
     redirect posterior al examen. Mismo patrón que los otros dos
     modales (ensureX / _openX / cerrar por X, backdrop o Escape).

     Desde v4.15 también se usa desde la landing TRIAL del examen
     (exam.js, cfg.trial): antes, tocar un tema bloqueado o el banner
     mandaba directo a este mismo checkout SIN pasar por el modal —
     lo cual forzaba a cualquiera que ya estuviera registrado a
     re-registrarse. Con el modal de por medio, esa persona puede
     tocar "¿Ya tenés cuenta? Ir directo →" y saltar el checkout.
     ------------------------------------------------------------ */
  function ensureRegistroModal() {
    var existing = document.getElementById(REGISTRO_MODAL_ID);
    if (existing) return existing;

    var modal = document.createElement('div');
    modal.id = REGISTRO_MODAL_ID;
    modal.className = 'apt-registro-modal apt-registro-modal--hidden';
    modal.innerHTML =
      '<div class="apt-registro-modal__card" role="dialog" aria-modal="true" aria-label="Registro requerido">' +
        '<button type="button" class="apt-registro-modal__close-x" aria-label="Cerrar">✕</button>' +
        '<span class="apt-registro-modal__icon">📝</span>' +
        '<h2 class="apt-registro-modal__title">Para usar el modo examen tenés que estar registrado</h2>' +
        '<p class="apt-registro-modal__text">Es gratis.</p>' +
        '<a class="apt-registro-modal__cta" href="' + EXAMEN_CHECKOUT_URL + '">Registrarme gratis →</a>' +
        '<button type="button" class="apt-registro-modal__secondary">¿Ya tenés cuenta? Ir directo →</button>' +
      '</div>';
    document.body.appendChild(modal);

    var card = modal.querySelector('.apt-registro-modal__card');
    var closeBtn = modal.querySelector('.apt-registro-modal__close-x');
    var secondaryBtn = modal.querySelector('.apt-registro-modal__secondary');

    function closeModal() { modal.classList.add('apt-registro-modal--hidden'); unlockBodyScroll(); }

    closeBtn.addEventListener('click', closeModal);
    secondaryBtn.addEventListener('click', function () { window.location.href = EXAMEN_URL; });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    card.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('apt-registro-modal--hidden')) closeModal();
    });

    modal._openRegistro = function () { modal.classList.remove('apt-registro-modal--hidden'); lockBodyScroll(); };
    return modal;
  }

  function openRegistroModal() {
    ensureRegistroModal()._openRegistro();
  }

  /* ------------------------------------------------------------
     Footer compartido (marca + 🚩 reportar + 🔇/🔊 mute + racha).
     ÚNICA implementación: la usa tanto el modo genérico (buildSkeleton,
     abajo) como cualquier actividad custom vía AptActivity.mountFooter().
     Nunca duplicar este HTML/CSS en el archivo de una actividad.
     ------------------------------------------------------------ */
  function flattenCatalogActivities() {
    var list = [];
    CATALOG.forEach(function (unit) {
      (unit.activities || []).forEach(function (act) { list.push(act); });
    });
    return list;
  }
  function findCurrentCatalogIndex(list) {
    var here = window.location.href.replace(/\/+$/, '').toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.replace(/\/+$/, '').toLowerCase() === here) return i;
    }
    return -1;
  }

  function mountFooter(container) {
    ensureAssets();
    container.className = 'apt-act__footer';

    var flatList = flattenCatalogActivities();
    var curIdx = findCurrentCatalogIndex(flatList);
    var prevEntry = curIdx > 0 ? flatList[curIdx - 1] : null;
    var nextEntry = (curIdx !== -1 && curIdx < flatList.length - 1) ? flatList[curIdx + 1] : null;

    container.innerHTML =
      '<div class="apt-act__nav-row">' +
        (prevEntry ? '<a class="apt-act__nav-btn apt-act__nav-btn--prev" href="' + prevEntry.url + '">← Anterior</a>' : '') +
        '<button type="button" class="apt-act__catalog-btn">📚 Todos los ejercicios</button>' +
        (nextEntry ? '<a class="apt-act__nav-btn apt-act__nav-btn--next" href="' + nextEntry.url + '">Siguiente →</a>' : '') +
      '</div>' +
      '<button type="button" class="apt-act__exam-btn">📝 Modo examen</button>' +
      '<div class="apt-act__footer-row">' +
        '<span class="apt-act__brand-group">' +
          '<a class="apt-act__brand-link" href="https://www.instagram.com/soyjuanisilva/" target="_blank" rel="noopener">Álgebra Para Todos</a>' +
          '<span class="apt-act__version">v' + ENGINE_VERSION + '</span>' +
        '</span>' +
        '<span class="apt-act__footer-right">' +
          '<button type="button" class="apt-act__report-btn" aria-label="Reportar un problema">🚩</button>' +
          '<button type="button" class="apt-act__mute-btn" aria-pressed="false" aria-label="Silenciar sonidos">🔊</button>' +
          '<span class="apt-act__streak">Racha: <b>0</b></span>' +
        '</span>' +
      '</div>';

    var catalogBtn = container.querySelector('.apt-act__catalog-btn');
    var examBtn = container.querySelector('.apt-act__exam-btn');
    var reportBtn = container.querySelector('.apt-act__report-btn');
    var muteBtn = container.querySelector('.apt-act__mute-btn');
    var streakB = container.querySelector('.apt-act__streak b');

    catalogBtn.addEventListener('click', openCatalogModal);
    examBtn.addEventListener('click', openRegistroModal);
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
  /* Escritorio de verdad (mouse/trackpad de precisión) vs táctil: se usa
     esto, y no un ancho de pantalla, porque lo que importa es si hay
     forma cómoda de escribir '-' con el teclado — no cuán ancha está la
     ventana. Una notebook con la ventana angosta sigue siendo desktop;
     una tablet grande sin mouse sigue sin tecla de menos accesible. */
  function isDesktopPointer() {
    try { return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches); }
    catch (e) { return false; }
  }

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

  /* Punto único donde se arma una celda con signo, para los 3 lugares que
     la usan (grid, vectors, space). En desktop NO se crea el signSeg: el
     input mismo acepta un '-' opcional al principio, como cualquier campo
     numérico con teclado. En táctil, queda exactamente como antes. */
  function buildSignedCellInto(wrap, ariaLabel) {
    var input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.className = 'apt-act__cell';
    if (ariaLabel) input.setAttribute('aria-label', ariaLabel);

    if (isDesktopPointer()) {
      wrap.classList.add('apt-act__cellwrap--nosign');
      input.inputMode = 'text';
      input.addEventListener('input', function () {
        var neg = this.value.charAt(0) === '-';
        var digits = this.value.replace(/[^0-9]/g, '').slice(0, 2);
        this.value = (neg ? '-' : '') + digits;
      });
      wrap.appendChild(input);
    } else {
      var signSeg = buildSignSeg();
      input.inputMode = 'numeric';
      input.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2);
      });
      wrap.appendChild(signSeg);
      wrap.appendChild(input);
    }
    return input;
  }

  /* Lee el valor con signo de una celda ya armada, sin importar si es la
     versión con signSeg (táctil) o la de tipeo directo (desktop). */
  function readSignedCell(wrap) {
    var input = wrap.querySelector('.apt-act__cell');
    var raw = input.value.trim();
    if (raw === '' || raw === '-') return { value: 0, hasEmpty: true };
    var seg = wrap.querySelector('.apt-act__signseg');
    if (seg) {
      var n = parseInt(raw, 10);
      return { value: seg.dataset.sign === '-' ? -n : n, hasEmpty: false };
    }
    return { value: parseInt(raw, 10), hasEmpty: false };
  }

  /* Contraparte de readSignedCell para los flujos de "ver respuesta" /
     completar con un valor conocido — funciona igual en los dos modos. */
  function fillSignedCell(wrap, val) {
    var input = wrap.querySelector('.apt-act__cell');
    var seg = wrap.querySelector('.apt-act__signseg');
    if (seg) {
      setSign(wrap, val < 0 ? '-' : '+');
      input.value = String(Math.abs(val));
    } else {
      input.value = (val < 0 ? '-' : '') + Math.abs(val);
    }
  }

  /* Texto de ayuda debajo de la grilla/vectores/base — cambia según haya
     o no botón +/- (ver isDesktopPointer más arriba). */
  function signHintText(suffix) {
    if (isDesktopPointer()) return ''; // obvio con teclado, no hace falta explicarlo
    return 'Tocá − o + para cambiar el signo' + (suffix || '.');
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
    // repeat(0, ...) es CSS inválido y tira abajo TODO el valor de
    // grid-template-columns (la celda queda sin límite de ancho) —
    // por eso cada segmento se arma solo si su conteo es > 0.
    var beforeCount = noDivider ? cols : divAfter;
    var afterCount = noDivider ? 0 : (cols - divAfter);
    var segments = [];
    if (beforeCount > 0) segments.push('repeat(' + beforeCount + ', minmax(62px,74px))');
    if (!noDivider) segments.push('10px');
    if (afterCount > 0) segments.push('repeat(' + afterCount + ', minmax(62px,74px))');
    gridEl.style.gridTemplateColumns = segments.join(' ');
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

        buildSignedCellInto(wrap, cfg.cellAriaLabel ? cfg.cellAriaLabel(current, r, c) : ('Fila ' + (r + 1) + ', columna ' + (c + 1)));
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
      var read = readSignedCell(wrap);
      if (read.hasEmpty) { hasEmpty = true; M[r3][c3] = null; return; }
      M[r3][c3] = read.value;
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
      buildSignedCellInto(wrap, 'Componente ' + (r + 1));
      col.appendChild(wrap);
    }
    vec.appendChild(left);
    vec.appendChild(col);
    vec.appendChild(right);
    return vec;
  }

  function buildVectorsUI(container, vecCfg, current) {
    container.innerHTML = '';
    var rows = resolveNum(vecCfg.rows, current);
    var count = resolveNum(vecCfg.count, current);
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
      label.textContent = '· ' + (vecCfg.paramLabel ? vecCfg.paramLabel(current, i) : ('t' + (i + 1)));
      container.appendChild(label);
    }
  }

  function readVectorBlock(container, key, rows) {
    var vals = [];
    var hasEmpty = false;
    for (var r = 0; r < rows; r++) {
      var wrap = container.querySelector('.apt-act__cellwrap[data-key="' + key + '"][data-row="' + r + '"]');
      var read = readSignedCell(wrap);
      if (read.hasEmpty) hasEmpty = true;
      vals.push(read.value);
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
      fillSignedCell(wrap, val);
      wrap.classList.remove('is-wrong');
      wrap.classList.add('is-correct');
      setSignDisabled(wrap, true);
      wrap.querySelector('.apt-act__cell').disabled = true;
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
      var hideBrackets = !!(cfg.grid && cfg.grid.hideBrackets);
      var gridLabel = cfg.grid && cfg.grid.label;
      interactionHTML =
        '<div class="apt-act__grid-row">' +
          (gridLabel ? '<span class="apt-act__eq apt-act__grid-label"></span>' : '') +
          '<div class="apt-act__matrixwrap">' +
            (hideBrackets ? '' : '<span class="apt-act__bracket apt-act__bracket--left"></span>') +
            '<div class="apt-act__grid"></div>' +
            (hideBrackets ? '' : '<span class="apt-act__bracket apt-act__bracket--right"></span>') +
          '</div>' +
        '</div>' +
        '<p class="apt-act__hint">' + signHintText(hideBrackets ? '.' : ' de cada número.') + '</p>' +
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
          '<p class="apt-act__subtitle">' + renderTextWithMath(cfg.subtitle || '') + '</p>' +
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

    if (cfg.mode === 'grid' && cfg.grid && cfg.grid.label && window.katex) {
      var gridLabelEl = root.querySelector('.apt-act__grid-label');
      if (gridLabelEl) window.katex.render(cfg.grid.label, gridLabelEl, { throwOnError: false });
    }

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
        var phaseHideBrackets = !!(phase.grid && phase.grid.hideBrackets);
        var phaseGridLabel = phase.grid && phase.grid.label;
        interactionHTML =
          '<div class="apt-act__grid-row">' +
            (phaseGridLabel ? '<span class="apt-act__eq apt-act__grid-label"></span>' : '') +
            '<div class="apt-act__matrixwrap">' +
              (phaseHideBrackets ? '' : '<span class="apt-act__bracket apt-act__bracket--left"></span>') +
              '<div class="apt-act__grid"></div>' +
              (phaseHideBrackets ? '' : '<span class="apt-act__bracket apt-act__bracket--right"></span>') +
            '</div>' +
          '</div>' +
          '<p class="apt-act__hint">' + (phase.hint || signHintText(' de cada número.')) + '</p>' +
          '<button type="button" class="apt-act__check-btn">Comprobar</button>';
      } else if (phase.mode === 'vectors') {
        interactionHTML =
          '<div class="apt-act__solution"></div>' +
          '<p class="apt-act__hint">' + (phase.hint || signHintText(' de cada número.')) + '</p>' +
          '<button type="button" class="apt-act__check-btn">Comprobar</button>';
      } else if (phase.mode === 'space-basis') {
        interactionHTML =
          '<div class="apt-act__space-answer"></div>' +
          '<p class="apt-act__hint">' + (phase.hint || signHintText(' de cada número.')) + '</p>' +
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
      var hasAnswer = !!(phase.getAnswerGrid || phase.getAnswerVectors || phase.getExpectedBasis);
      var actionsHTML =
        '<div class="apt-act__actions-row">' +
          '<button type="button" class="apt-act__retry-btn apt-act__retry-btn--hidden">Reintentar</button>' +
          (hasAnswer ? '<button type="button" class="apt-act__retry-btn apt-act__retry-btn--hidden apt-act__showanswer-btn">Ver respuesta</button>' : '') +
        '</div>';

      return '<div class="apt-act__phase' + (idx > 0 ? ' apt-act__phase--hidden' : '') + '" data-phase="' + idx + '">' +
        '<p class="apt-act__question">' + renderTextWithMath(phase.question || '') + '</p>' +
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
          '<p class="apt-act__subtitle">' + renderTextWithMath(cfg.subtitle || '') + '</p>' +
        '</div>' +
        '<div class="apt-act__card"><div class="apt-act__content" aria-live="polite"></div></div>' +
        phasesHTML +
        '<button type="button" class="apt-act__next-btn apt-act__next-btn--hidden">' + (cfg.nextLabel || 'Probar con otro caso →') + '</button>' +
        '<button type="button" class="apt-act__skip-btn">' + (cfg.skipLabel || 'Prefiero otro caso →') + '</button>' +
        '<div class="apt-act__footer-slot"></div>' +
      '</div>';

    var footerCtl = mountFooter(root.querySelector('.apt-act__footer-slot'));

    var phaseRefs = [];
    root.querySelectorAll('.apt-act__phase').forEach(function (el, phaseIdx) {
      phaseRefs.push({
        el: el,
        choicesWrap: el.querySelector('.apt-act__choices'),
        grid: el.querySelector('.apt-act__grid'),
        solution: el.querySelector('.apt-act__solution'),
        spaceAnswer: el.querySelector('.apt-act__space-answer'),
        checkBtn: el.querySelector('.apt-act__check-btn'),
        setupBtn: el.querySelector('.apt-act__setup-btn'),
        feedback: el.querySelector('.apt-act__feedback'),
        retryBtn: el.querySelector('.apt-act__retry-btn'),
        showAnswerBtn: el.querySelector('.apt-act__showanswer-btn')
      });
      var phaseCfgForLabel = cfg.phases[phaseIdx];
      if (phaseCfgForLabel && phaseCfgForLabel.mode === 'grid' && phaseCfgForLabel.grid && phaseCfgForLabel.grid.label && window.katex) {
        var phaseGridLabelEl = el.querySelector('.apt-act__grid-label');
        if (phaseGridLabelEl) window.katex.render(phaseCfgForLabel.grid.label, phaseGridLabelEl, { throwOnError: false });
      }
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
        if (phaseCfg.choicesGrid) {
          p.choicesWrap.classList.add('apt-act__choices--grid');
          p.choicesWrap.classList.toggle('apt-act__choices--grid-1col', !!phaseCfg.choicesGridSingleColumn);
        } else {
          p.choicesWrap.classList.toggle('apt-act__choices--stacked', phaseCfg.choicesStacked !== undefined ? phaseCfg.choicesStacked : choiceList.length <= 2);
        }
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
      } else if (phaseCfg.mode === 'space-basis') {
        var sbCount = resolveNum(phaseCfg.count, current);
        var sbSpace = typeof phaseCfg.space === 'function' ? phaseCfg.space(current) : (phaseCfg.space || current.space);
        p.spaceAnswer.innerHTML = '';
        p.spaceAnswer.dataset.count = sbCount;
        p.spaceAnswer.classList.add('apt-act__space-answer--rows');

        var sbLabel = (phaseCfg.answerLabel || 'v');
        for (var sbi = 0; sbi < sbCount; sbi++) {
          var sbRow = document.createElement('div');
          sbRow.className = 'apt-act__space-row';
          var sbRowLabel = document.createElement('span');
          sbRowLabel.className = 'apt-act__eq';
          sbRowLabel.textContent = sbLabel + (sbCount > 1 ? (_SUBS[sbi + 1] || ('_' + (sbi + 1))) : '') + ' =';
          sbRow.appendChild(sbRowLabel);
          p.spaceAnswer.appendChild(sbRow);
          buildSpaceInputWidget(sbRow, sbSpace, 'v' + sbi);
        }

        p.checkBtn.disabled = false;
        p.checkBtn.onclick = function () { checkSpaceBasisPhase(idx); };
        if (p.retryBtn) p.retryBtn.onclick = function () { retrySpaceBasisPhase(idx); };
        if (p.showAnswerBtn) p.showAnswerBtn.onclick = function () { showAnswerSpaceBasisPhase(idx); };
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
        fillSignedCell(wrap, val);
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

      var rows = resolveNum(phaseCfg.vectors.rows, current);
      var count = resolveNum(phaseCfg.vectors.count, current);
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

    // ---------- space-basis ----------
    function checkSpaceBasisPhase(idx) {
      if (phaseAnswered[idx]) return;
      phaseAnswered[idx] = true;
      var phaseCfg = cfg.phases[idx];
      var p = refs.phaseRefs[idx];
      root.classList.add('is-answered');

      var sbCount = +p.spaceAnswer.dataset.count;
      var sbSpace = typeof phaseCfg.space === 'function' ? phaseCfg.space(current) : (phaseCfg.space || current.space);

      var reads = [];
      var hasEmpty = false;
      for (var i = 0; i < sbCount; i++) {
        var r = readSpaceInputWidget(p.spaceAnswer, sbSpace, 'v' + i);
        reads.push(r.coords);
        if (r.hasEmpty) hasEmpty = true;
      }

      var expectedVectors = phaseCfg.getExpectedBasis(current);
      var expectedCoords = expectedVectors.map(function (v) { return sbSpace.toCoords(v); });

      var correct, spanResult, exactMatches;
      if (phaseCfg.exactMatch) {
        // Coincidencia EXACTA componente a componente (no "cualquier base
        // equivalente") -- para respuestas con un único valor correcto,
        // como una proyección ortogonal o un paso de Gram-Schmidt.
        exactMatches = reads.map(function (r, i) {
          var exp = expectedCoords[i];
          return !exp ? false : r.every(function (v, c) { return v === exp[c]; });
        });
        correct = !hasEmpty && exactMatches.every(Boolean) && reads.length === expectedCoords.length;
      } else {
        spanResult = hasEmpty ? null : checkSpanEquivalence(reads, expectedCoords);
        correct = !hasEmpty && spanResult.ok;
      }

      var feedbackText;
      if (hasEmpty) {
        feedbackText = 'Dejaste alguna celda vacía (se tomó como 0 al revisar) — completá todas antes de comprobar la próxima vez.';
      } else if (phaseCfg.explain) {
        feedbackText = phaseCfg.explain(current, correct, phaseCfg.exactMatch ? exactMatches : spanResult);
      } else if (correct) {
        feedbackText = phaseCfg.exactMatch
          ? '¡Correcto!'
          : '¡Correcto! Es una base válida de ese subespacio (no hacía falta que coincidiera con una única respuesta).';
      } else if (phaseCfg.exactMatch) {
        feedbackText = 'No es correcto: revisá el resultado marcado en rojo.';
      } else if (spanResult.reason === 'not-independent') {
        feedbackText = 'Los vectores que pusiste no son linealmente independientes entre sí, así que no forman una base.';
      } else if (spanResult.reason === 'not-in-span') {
        feedbackText = 'Alguno de los vectores que pusiste no pertenece al subespacio pedido.';
      } else {
        feedbackText = 'La cantidad de vectores no corresponde a la dimensión del subespacio.';
      }

      for (var ci = 0; ci < sbCount; ci++) {
        var cls = null;
        if (correct) cls = 'is-correct';
        else if (phaseCfg.exactMatch && !hasEmpty) {
          cls = exactMatches[ci] ? 'is-correct' : 'is-wrong';
        } else if (!hasEmpty && spanResult.reason === 'not-in-span') {
          cls = spanResult.perVectorInSpan[ci] ? 'is-correct' : 'is-wrong';
        }
        colorSpaceInputWidget(p.spaceAnswer, 'v' + ci, sbSpace.dim, cls);
      }

      showPhaseFeedback(idx, correct, feedbackText);
      p.checkBtn.disabled = true;
      if (phaseCfg.onAnswered) phaseCfg.onAnswered(current, correct, reads, refs.content);

      var isLast = idx === activePhaseCount() - 1;
      if (correct) {
        if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
        advanceOrFinish(idx);
      } else {
        if (p.retryBtn) p.retryBtn.classList.remove('apt-act__retry-btn--hidden');
        if (p.showAnswerBtn) p.showAnswerBtn.classList.remove('apt-act__retry-btn--hidden');
        refs.nextBtn.classList.remove('apt-act__next-btn--hidden');
        if (isLast) registerRoundResult(false);
      }
    }

    function retrySpaceBasisPhase(idx) {
      if (!phaseAnswered[idx]) return;
      var p = refs.phaseRefs[idx];
      root.classList.remove('is-answered');
      p.spaceAnswer.querySelectorAll('.apt-act__cellwrap').forEach(function (wrap) {
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

    function showAnswerSpaceBasisPhase(idx) {
      var phaseCfg = cfg.phases[idx];
      var p = refs.phaseRefs[idx];
      var sbSpace = typeof phaseCfg.space === 'function' ? phaseCfg.space(current) : (phaseCfg.space || current.space);
      var answer = phaseCfg.getExpectedBasis(current);
      answer.forEach(function (v, i) { fillSpaceInputWidget(p.spaceAnswer, sbSpace, 'v' + i, v); });

      if (p.retryBtn) p.retryBtn.classList.add('apt-act__retry-btn--hidden');
      if (p.showAnswerBtn) p.showAnswerBtn.classList.add('apt-act__retry-btn--hidden');
      renderFeedback(p.feedback, true, phaseCfg.answerTitle || 'Una respuesta posible',
        phaseCfg.answerText || 'Esta es una base válida — no la única. Cualquier otra que respete la estructura y genere el mismo subespacio también vale.');

      var isLast = idx === activePhaseCount() - 1;
      if (isLast) { refs.nextBtn.classList.remove('apt-act__next-btn--hidden'); }
      else { revealPhase(idx + 1); root.classList.remove('is-answered'); }
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
          if (cfg.choicesGrid) {
            refs.choicesWrap.classList.add('apt-act__choices--grid');
            refs.choicesWrap.classList.toggle('apt-act__choices--grid-1col', !!cfg.choicesGridSingleColumn);
          } else {
            refs.choicesWrap.classList.toggle('apt-act__choices--stacked', cfg.choicesStacked !== undefined ? cfg.choicesStacked : choiceList.length <= 2);
          }
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

        var allBtns = refs.choicesWrap.querySelectorAll('.apt-act__choice-btn');
        allBtns.forEach(function (b) { b.disabled = true; });
        if (btnEl) btnEl.classList.add(correct ? 'is-correct' : 'is-wrong');
        if (!correct) {
          allBtns.forEach(function (b) {
            if (b !== btnEl && cfg.check(current, b.dataset.value)) b.classList.add('is-correct');
          });
        }
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
          fillSignedCell(wrap, val);
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


  /* ============================================================
     MÓDULO DE ESPACIOS (Unidad 2) — v1.8
     ------------------------------------------------------------
     Agregado para las actividades de subespacios vectoriales que
     necesitan trabajar en Rn, matrices o polinomios de forma
     genérica: fracciones exactas, checkSpanEquivalence (bases
     equivalentes), catálogo de espacios, widget de input genérico,
     y renderizado de un SEV dado (como base o como ecuaciones).
     ============================================================ */

  /* ---------- Fracciones exactas + RREF/rango genérico ---------- */
  function _gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function _lcm(a, b) { return Math.abs(a * b) / _gcd(a, b); }
  function Frac(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = _gcd(n, d);
    return { n: g ? n / g : 0, d: g ? d / g : 1 };
  }
  function fAdd(a, b) { return Frac(a.n * b.d + b.n * a.d, a.d * b.d); }
  function fSub(a, b) { return Frac(a.n * b.d - b.n * a.d, a.d * b.d); }
  function fMul(a, b) { return Frac(a.n * b.n, a.d * b.d); }
  function fDiv(a, b) { return Frac(a.n * b.d, a.d * b.n); }
  function fIsZero(a) { return a.n === 0; }
  function fEquals(a, b) { return a.n === b.n && a.d === b.d; }
  function fromInt(x) { return Frac(x, 1); }
  function intMatrixToFrac(M) { return M.map(function (row) { return row.map(fromInt); }); }

  function rref(matrixOfFrac) {
    var M = matrixOfFrac.map(function (r) { return r.slice(); });
    var rows = M.length, cols = M[0].length;
    var lead = 0;
    for (var r = 0; r < rows; r++) {
      if (lead >= cols) break;
      var i = r;
      while (fIsZero(M[i][lead])) {
        i++;
        if (i === rows) { i = r; lead++; if (lead === cols) return M; }
      }
      var tmp = M[i]; M[i] = M[r]; M[r] = tmp;
      var pivot = M[r][lead];
      M[r] = M[r].map(function (v) { return fDiv(v, pivot); });
      for (var i2 = 0; i2 < rows; i2++) {
        if (i2 !== r) {
          var factor = M[i2][lead];
          if (!fIsZero(factor)) {
            M[i2] = M[i2].map(function (v, c) { return fSub(v, fMul(factor, M[r][c])); });
          }
        }
      }
      lead++;
    }
    return M;
  }
  function rankOf(fracMatrix) {
    if (fracMatrix.length === 0) return 0;
    var R = rref(fracMatrix);
    return R.filter(function (row) { return row.some(function (v) { return !fIsZero(v); }); }).length;
  }
  function rrefEqual(A, B) {
    if (A.length !== B.length) return false;
    if (A.length === 0) return true;
    if (A[0].length !== B[0].length) return false;
    for (var r = 0; r < A.length; r++) for (var c = 0; c < A[0].length; c++) if (!fEquals(A[r][c], B[r][c])) return false;
    return true;
  }
  function fracRowToIntRow(row) {
    var denomLcm = 1;
    row.forEach(function (v) { denomLcm = _lcm(denomLcm, v.d); });
    var intRow = row.map(function (v) { return Math.round(v.n * (denomLcm / v.d)); });
    var nz = intRow.filter(function (x) { return x !== 0; }).map(Math.abs);
    if (nz.length) { var g = nz[0]; nz.forEach(function (x) { g = _gcd(g, x); }); intRow = intRow.map(function (x) { return x / g; }); }
    return intRow;
  }

  /* ---------- checkSpanEquivalence (Decisión #1) ---------- */
  function checkSpanEquivalence(studentVectors, expectedVectors) {
    if (studentVectors.length === 0 || expectedVectors.length === 0) {
      return { ok: false, reason: 'wrong-dimension', perVectorInSpan: [] };
    }
    var dim = expectedVectors[0].length;
    if (studentVectors.some(function (v) { return v.length !== dim; })) {
      return { ok: false, reason: 'wrong-dimension', perVectorInSpan: [] };
    }
    var expectedRank = rankOf(intMatrixToFrac(expectedVectors));
    if (studentVectors.length !== expectedVectors.length) {
      return { ok: false, reason: 'wrong-dimension', perVectorInSpan: [] };
    }
    var studentRank = rankOf(intMatrixToFrac(studentVectors));
    if (studentRank !== studentVectors.length) {
      return { ok: false, reason: 'not-independent', perVectorInSpan: [] };
    }
    var perVectorInSpan = studentVectors.map(function (v) {
      var augmented = expectedVectors.concat([v]);
      return rankOf(intMatrixToFrac(augmented)) === expectedRank;
    });
    if (!perVectorInSpan.every(Boolean)) {
      return { ok: false, reason: 'not-in-span', perVectorInSpan: perVectorInSpan };
    }
    return { ok: true, reason: 'ok', perVectorInSpan: perVectorInSpan };
  }

  /* ---------- Catálogo de espacios (Decisión C) ---------- */
  /* Nombres de variable para enunciados SIMBÓLICOS (Unidad 3 en
     adelante): el libro escribe un polinomio genérico como
     a_0 + a_1x + a_2x^2 y una matriz 2x2 genérica como [a b; c d].
     Agregado en v1.9 — campos nuevos, no reemplazan nada. */
  var _ABC = 'abcdefghijklmnop'.split('');
  function _matrixVarNames(rows, cols, plain) {
    var out = [], total = rows * cols;
    if (total <= _ABC.length) {
      for (var i = 0; i < total; i++) out.push(_ABC[i]);
      return out;
    }
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      out.push(plain ? ('a' + (r + 1) + (c + 1)) : ('a_{' + (r + 1) + (c + 1) + '}'));
    }
    return out;
  }
  var _SUBS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆'];
  function _polyVarNames(degree, plain) {
    var out = [];
    for (var k = 0; k <= degree; k++) out.push(plain ? ('a' + _SUBS[k]) : ('a_' + k));
    return out;
  }

  function _makeRn(n) {
    var vt = ['x', 'y', 'z', 'w', 'v'].slice(0, n);
    if (n > 5) { vt = []; for (var q = 1; q <= n; q++) vt.push('x_{' + q + '}'); }
    return {
      id: 'R' + n, family: 'rn', label: 'R' + n, dim: n,
      // labelTex: el label listo para KaTeX. `label` se deja intacto
      // porque las actividades de Unidad 2 ya dependen de su valor.
      labelTex: '\\mathbb{R}^' + n,
      shape: { kind: 'column', rows: n },
      varsTex: vt.slice(),
      varsPlain: ['x', 'y', 'z', 'w', 'v'].slice(0, n),
      toCoords: function (v) { return v.slice(); },
      fromCoords: function (c) { return c.slice(); },
      toKatex: function (v) { return '\\begin{pmatrix} ' + v.join(' \\\\ ') + ' \\end{pmatrix}'; },
      // Tupla en fila: (x, y, z). Es la notación que usa el libro para
      // Rⁿ en Unidad 3 (T(1,0,1) = (2,1)). NO reemplaza a toKatex.
      toKatexRow: function (v) { return '\\left(' + v.join(',\\ ') + '\\right)'; },
      // Igual que toKatex/toKatexRow pero recibiendo EXPRESIONES (strings)
      // en vez de números — para enunciados simbólicos tipo T(x,y)=(2x-y, x).
      symbolicKatex: function (parts, opts) {
        return (opts && opts.column)
          ? '\\begin{pmatrix} ' + parts.join(' \\\\ ') + ' \\end{pmatrix}'
          : '\\left(' + parts.join(',\\ ') + '\\right)';
      }
    };
  }
  function _makeMatrix(rows, cols) {
    var dim = rows * cols;
    return {
      id: 'M' + rows + 'x' + cols, family: 'matrix', label: 'M_{' + rows + '\\times ' + cols + '}(\\mathbb{R})', dim: dim,
      labelTex: 'M_{' + rows + '\\times ' + cols + '}(\\mathbb{R})',
      shape: { kind: 'matrix', rows: rows, cols: cols },
      varsTex: _matrixVarNames(rows, cols, false),
      varsPlain: _matrixVarNames(rows, cols, true),
      symbolicKatex: function (parts) {
        var body = [];
        for (var r2 = 0; r2 < rows; r2++) body.push(parts.slice(r2 * cols, (r2 + 1) * cols).join(' & '));
        return '\\begin{pmatrix} ' + body.join(' \\\\ ') + ' \\end{pmatrix}';
      },
      toCoords: function (v) {
        var out = [];
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) out.push(v[r][c]);
        return out;
      },
      fromCoords: function (coords) {
        var out = [];
        for (var r = 0; r < rows; r++) { var row = []; for (var c = 0; c < cols; c++) row.push(coords[r * cols + c]); out.push(row); }
        return out;
      },
      toKatex: function (v) {
        var body = v.map(function (row) { return row.join(' & '); }).join(' \\\\ ');
        return '\\begin{pmatrix} ' + body + ' \\end{pmatrix}';
      }
    };
  }
  function _makePoly(degree) {
    var dim = degree + 1;
    return {
      id: 'P' + degree, family: 'poly', label: 'P_' + degree + '(\\mathbb{R})', dim: dim,
      labelTex: 'P_' + degree + '(\\mathbb{R})',
      shape: { kind: 'poly', degree: degree },
      varsTex: _polyVarNames(degree, false),
      varsPlain: _polyVarNames(degree, true),
      symbolicKatex: function (parts) {
        // Los coeficientes compuestos van entre paréntesis para que
        // "a_0 - a_1" multiplicado por x no se lea mal.
        var out = [];
        for (var k2 = 0; k2 <= degree; k2++) {
          var piece = parts[k2];
          if (/[+\-]\s/.test(piece)) piece = '\\left(' + piece + '\\right)';
          out.push(piece + (k2 === 0 ? '' : (k2 === 1 ? 'x' : 'x^{' + k2 + '}')));
        }
        return out.join(' + ');
      },
      toCoords: function (v) { return v.slice(); },
      fromCoords: function (c) { return c.slice(); },
      toKatex: function (v) {
        var parts = [];
        for (var k = degree; k >= 0; k--) {
          var c = v[k];
          if (c === 0) continue;
          var abs = Math.abs(c);
          var term;
          if (k === 0) term = String(abs);
          else if (k === 1) term = (abs === 1 ? '' : String(abs)) + 'x';
          else term = (abs === 1 ? '' : String(abs)) + 'x^{' + k + '}';
          if (parts.length === 0) parts.push((c < 0 ? '-' : '') + term);
          else parts.push((c < 0 ? ' - ' : ' + ') + term);
        }
        return parts.length ? parts.join('') : '0';
      }
    };
  }
  var SPACES = {
    // R2 agregado en v1.9 para Unidad 3 (TL geométricas en el plano).
    // OJO: randomSpace() NO lo incluye a propósito, para no cambiar el
    // sorteo de las actividades de Unidad 2 que ya están publicadas.
    R2: _makeRn(2),
    R3: _makeRn(3), R4: _makeRn(4),
    M2x2: _makeMatrix(2, 2), M2x3: _makeMatrix(2, 3), M3x2: _makeMatrix(3, 2),
    P2: _makePoly(2), P3: _makePoly(3)
  };
  function _pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randomSpace() {
    var family = _pickOne(['rn', 'matrix', 'poly']);
    if (family === 'rn') return _pickOne([SPACES.R3, SPACES.R4]);
    if (family === 'matrix') return _pickOne([SPACES.M2x2, SPACES.M2x3, SPACES.M3x2]);
    return _pickOne([SPACES.P2, SPACES.P3]);
  }

  /* ---------- Widget de input genérico según space.shape.kind ----------
     Reusa buildSignSeg/getSign/setSign/setSignDisabled ya definidos arriba
     en este mismo archivo — NO se duplican. */
  function _buildSpaceCellWrap(key, index) {
    // Reusa las clases COMPARTIDAS apt-act__cellwrap/apt-act__cell (mismas
    // que usa buildVecBlock para 'vectors') en vez de inventar clases
    // nuevas — así hereda todo el CSS de inputs/signos sin duplicar nada.
    var wrap = document.createElement('div');
    wrap.className = 'apt-act__cellwrap';
    wrap.dataset.key = key;
    wrap.dataset.index = index;
    buildSignedCellInto(wrap);
    return wrap;
  }
  function buildSpaceInputWidget(container, space, key) {
    var wrap = document.createElement('div');
    wrap.className = 'apt-act__space apt-act__space--' + space.shape.kind;
    wrap.dataset.spaceKey = key;

    if (space.shape.kind === 'column') {
      for (var r = 0; r < space.shape.rows; r++) wrap.appendChild(_buildSpaceCellWrap(key, r));
    } else if (space.shape.kind === 'matrix') {
      wrap.style.display = 'grid';
      wrap.style.gridTemplateColumns = 'repeat(' + space.shape.cols + ', auto)';
      for (var rr = 0; rr < space.shape.rows; rr++) {
        for (var cc = 0; cc < space.shape.cols; cc++) {
          var idx = rr * space.shape.cols + cc;
          var cellWrap = _buildSpaceCellWrap(key, idx);
          cellWrap.style.gridRow = String(rr + 1);
          cellWrap.style.gridColumn = String(cc + 1);
          wrap.appendChild(cellWrap);
        }
      }
    } else if (space.shape.kind === 'poly') {
      for (var k = 0; k <= space.shape.degree; k++) {
        var group = document.createElement('div');
        group.className = 'apt-act__space__polyterm';
        var cw = _buildSpaceCellWrap(key, k);
        var label = document.createElement('span');
        label.className = 'apt-act__space__polylabel';
        label.textContent = k === 0 ? '' : (k === 1 ? '\u00b7 x' : '\u00b7 x^' + k);
        group.appendChild(cw);
        group.appendChild(label);
        wrap.appendChild(group);
      }
    }

    // Regla del proyecto: nunca corchetes, siempre paréntesis. Para
    // columna/matriz envolvemos con el mismo paréntesis curvo (border-radius
    // elíptico) que ya usa 'vectors' — un polinomio NO va entre paréntesis
    // (no es la notación del libro), así que 'poly' queda sin envolver.
    if (space.shape.kind === 'column' || space.shape.kind === 'matrix') {
      var bracketed = document.createElement('div');
      bracketed.className = 'apt-act__vec';
      var bLeft = document.createElement('span');
      bLeft.className = 'apt-act__vec-bracket apt-act__vec-bracket--left';
      var bRight = document.createElement('span');
      bRight.className = 'apt-act__vec-bracket apt-act__vec-bracket--right';
      bracketed.appendChild(bLeft);
      bracketed.appendChild(wrap);
      bracketed.appendChild(bRight);
      container.appendChild(bracketed);
    } else {
      container.appendChild(wrap);
    }
    return wrap;
  }
  function readSpaceInputWidget(container, space, key) {
    var coords = [];
    var hasEmpty = false;
    for (var i = 0; i < space.dim; i++) {
      var wrap = container.querySelector('.apt-act__cellwrap[data-key="' + key + '"][data-index="' + i + '"]');
      var read = readSignedCell(wrap);
      if (read.hasEmpty) hasEmpty = true;
      coords.push(read.value);
    }
    return { coords: coords, hasEmpty: hasEmpty };
  }
  function colorSpaceInputWidget(container, key, dim, cls) {
    for (var i = 0; i < dim; i++) {
      var wrap = container.querySelector('.apt-act__cellwrap[data-key="' + key + '"][data-index="' + i + '"]');
      wrap.classList.remove('is-correct', 'is-wrong');
      if (cls) wrap.classList.add(cls);
      wrap.querySelector('.apt-act__cell').disabled = true;
      setSignDisabled(wrap, true);
    }
  }
  function fillSpaceInputWidget(container, space, key, nativeVal) {
    var coords = space.toCoords(nativeVal);
    coords.forEach(function (val, i) {
      var wrap = container.querySelector('.apt-act__cellwrap[data-key="' + key + '"][data-index="' + i + '"]');
      fillSignedCell(wrap, val);
      wrap.classList.remove('is-wrong');
      wrap.classList.add('is-correct');
      setSignDisabled(wrap, true);
      wrap.querySelector('.apt-act__cell').disabled = true;
    });
  }

  /* ---------- renderSevAsBasis / renderSevAsEquations (Decisión 5b) ---------- */
  function renderSevAmbient(space, sevName) {
    // Aclara en qué espacio ambiente vive S — ej. "S \\subseteq M_{2x2}(R)".
    // Usa labelTex si existe (agregado para Unidad 3), si no cae a label.
    var name = sevName || 'S';
    var label = space.labelTex || space.label;
    return name + ' \\subseteq ' + label;
  }
  function renderSevAsBasis(space, vectors, sevName) {
    var name = sevName || 'S';
    var parts = vectors.map(function (v) { return space.toKatex(v); });
    return name + ' = \\left\\langle ' + parts.join(',\\ ') + ' \\right\\rangle';
  }
  // Versión que arma el DOM directamente (en vez de devolver un string
  // para un único katex.render): cada vector se renderiza en su propio
  // <span>, separados por comas, dentro de un contenedor flex-wrap.
  // Así el navegador puede partir la lista en varias líneas cuando no
  // entra en el ancho disponible — nunca hace falta scroll horizontal,
  // a diferencia de renderSevAsBasis (un solo bloque indivisible de KaTeX).
  function _renderWrappedList(container, vectors, space, name, openSym, closeSym) {
    container.innerHTML = '';
    container.classList.add('apt-act__sev-basis');

    var eq = document.createElement('span');
    eq.className = 'apt-act__eq';
    eq.textContent = name + ' =';
    container.appendChild(eq);

    var open = document.createElement('span');
    open.className = 'apt-act__sev-bracket';
    container.appendChild(open);
    window.katex.render('\\bigg' + openSym, open, { throwOnError: false });

    // Cada vector se agrupa con lo que le sigue (coma, o la llave de cierre
    // si es el último) en un único item flex -- así nunca quedan separados
    // al hacer wrap (evita que la llave de cierre "salte" sola a otra línea).
    vectors.forEach(function (v, i) {
      var isLast = i === vectors.length - 1;
      var itemWrap = document.createElement('span');
      itemWrap.className = 'apt-act__sev-item';

      var span = document.createElement('span');
      itemWrap.appendChild(span);
      window.katex.render(space.toKatex(v), span, { throwOnError: false });

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'apt-act__op';
        comma.textContent = ',';
        itemWrap.appendChild(comma);
      } else {
        var close = document.createElement('span');
        close.className = 'apt-act__sev-bracket';
        itemWrap.appendChild(close);
        window.katex.render('\\bigg' + closeSym, close, { throwOnError: false });
      }

      container.appendChild(itemWrap);
    });
  }
  // Conjunto GENERADOR de un SEV: S = <v1, v2, ...> (ángulos = "generado por")
  function renderSevAsBasisWrapped(container, space, vectors, sevName) {
    _renderWrappedList(container, vectors, space, sevName || 'S', '\\langle', '\\rangle');
  }
  // BASE ordenada (de V o de un SEV): B = {v1, v2, ...} (llaves = conjunto,
  // NO ángulos -- una base no es "lo que genera", es el conjunto en sí).
  function renderBasisWrapped(container, space, vectors, basisName) {
    _renderWrappedList(container, vectors, space, basisName || 'B', '\\{', '\\}');
  }
  var SYSTEM_BRACE_SVG = '<svg viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M9,1 C4,1 5,1 5,9 L5,44 C5,49 3,50 0.5,50 C3,50 5,51 5,56 L5,91 C5,99 4,99 9,99" ' +
    'fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

  /* Gemela de renderSystemOfEquations que devuelve un STRING de HTML ya
     renderizado en vez de pintar en un contenedor — hace falta para los
     casos donde el sistema va como texto de una opción de choices (el
     engine arma esos botones con label:HTML, no con un contenedor vivo
     para pintar adentro). Mismas clases CSS, mismo look. */
  function renderSystemOfEquationsToString(latexLines, prefixLatex, suffixLatex) {
    if (!latexLines || latexLines.length === 0) return '';
    if (latexLines.length === 1 && !prefixLatex && !suffixLatex) {
      return window.katex.renderToString(latexLines[0], { throwOnError: false });
    }
    var linesHtml = latexLines.map(function (tex) {
      if (tex && typeof tex === 'object') {
        var exprHtml = window.katex.renderToString(tex.expr, { throwOnError: false });
        var condHtml = window.katex.renderToString(tex.cond, { throwOnError: false });
        return '<div class="apt-act__system-line apt-act__system-line--split"><span>' + exprHtml + '</span><span class="apt-act__system-cond">' + condHtml + '</span></div>';
      }
      return '<div class="apt-act__system-line">' + window.katex.renderToString(tex, { throwOnError: false }) + '</div>';
    }).join('');
    var prefixHtml = prefixLatex ? '<div class="apt-act__system-prefix">' + window.katex.renderToString(prefixLatex, { throwOnError: false }) + '</div>' : '';
    var suffixHtml = suffixLatex ? '<div class="apt-act__system-suffix">' + window.katex.renderToString(suffixLatex, { throwOnError: false }) + '</div>' : '';
    return '<div class="apt-act__system">' + prefixHtml +
      '<div class="apt-act__system-brace">' + SYSTEM_BRACE_SVG + '</div>' +
      '<div class="apt-act__system-lines">' + linesHtml + '</div>' +
      suffixHtml + '</div>';
  }

  function renderSevAsEquations(space, equations, sevName, varNames) {
    var name = sevName || 'S';
    var n = space.dim;
    var names = varNames || Array.from({ length: n }, function (_, i) { return 'x_{' + (i + 1) + '}'; });
    function rowToLatex(row) {
      var parts = [];
      row.forEach(function (c, i) {
        if (c === 0) return;
        var abs = Math.abs(c);
        var coefStr = abs === 1 ? '' : String(abs);
        var term = coefStr + names[i];
        if (parts.length === 0) parts.push((c < 0 ? '-' : '') + term);
        else parts.push((c < 0 ? ' - ' : ' + ') + term);
      });
      return (parts.length ? parts.join('') : '0') + ' = 0';
    }
    var rows = equations.map(rowToLatex);
    var prefix = (sevName === '' ? '' : name + ' = ') + '\\{ (' + names.join(',') + ') : ';
    var suffix = ' \\}';
    if (rows.length <= 1) {
      return window.katex.renderToString(prefix + (rows[0] || '0=0') + suffix, { throwOnError: false });
    }
    return renderSystemOfEquationsToString(rows, prefix, suffix);
  }

  // Nombres de variable POR FAMILIA de espacio: x_1..x_n para Rn, a_{fc}
  // (fila,columna) para matrices SIEMPRE (nunca letras sueltas, aunque la
  // matriz sea chica), a_0..a_k para polinomios (índice = grado).
  function spaceVarNames(space) {
    if (space.family === 'rn') {
      return Array.from({ length: space.dim }, function (_, i) { return 'x_{' + (i + 1) + '}'; });
    }
    if (space.family === 'matrix') {
      var names = [];
      for (var r = 0; r < space.shape.rows; r++) {
        for (var c = 0; c < space.shape.cols; c++) names.push('a_{' + (r + 1) + '' + (c + 1) + '}');
      }
      return names;
    }
    var namesP = [];
    for (var k = 0; k <= space.shape.degree; k++) namesP.push('a_{' + k + '}');
    return namesP;
  }

  // Versión compacta para mostrar como OPCIÓN de elección múltiple (2.14 y
  // similares): nombra el elemento genérico como "vector x" (siempre, sin
  // importar el espacio — así no hay que decidir "matriz A" vs "polinomio p"
  // caso por caso), agrupa ecuaciones de una sola variable en una única
  // línea x_1=x_2=...=0 en vez de repetirlas, y usa spaceVarNames (nunca
  // letras sueltas para matrices, siempre a_{fc}).
  function renderSevAsEquationsGrouped(space, equations, sevName, elementSymbol) {
    var name = sevName || 'S';
    var sym = elementSymbol || '\\vec{x}';
    var names = spaceVarNames(space);
    function rowToLatex(row) {
      var parts = [];
      row.forEach(function (c, i) {
        if (c === 0) return;
        var abs = Math.abs(c);
        var coefStr = abs === 1 ? '' : String(abs);
        var term = coefStr + names[i];
        if (parts.length === 0) parts.push((c < 0 ? '-' : '') + term);
        else parts.push((c < 0 ? ' - ' : ' + ') + term);
      });
      return (parts.length ? parts.join('') : '0') + ' = 0';
    }
    var singleVarIdx = [];
    var otherLines = [];
    equations.forEach(function (row) {
      var nz = [];
      row.forEach(function (v, i) { if (v !== 0) nz.push(i); });
      if (nz.length === 1) singleVarIdx.push(nz[0]);
      else otherLines.push(rowToLatex(row));
    });
    var lines = [];
    if (singleVarIdx.length) lines.push(singleVarIdx.map(function (i) { return names[i]; }).join('=') + '=0');
    lines = lines.concat(otherLines);
    var prefix = (sevName === '' ? '' : name + ' = ') + '\\{ \\, ' + sym + ' \\in ' + space.labelTex + ' \\ / \\ ';
    var suffix = ' \\, \\}';
    if (lines.length <= 1) {
      return window.katex.renderToString(prefix + (lines[0] || '0=0') + suffix, { throwOnError: false });
    }
    return renderSystemOfEquationsToString(lines, prefix, suffix);
  }

  function isMuted() { return muted; }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* sin persistencia si está bloqueado */ }
    return muted;
  }

  /* ------------------------------------------------------------
     Sistema de ecuaciones con llave — reemplaza a \begin{cases} de
     KaTeX. Esa construcción arma la llave apilando varias piezas de
     una fuente (KaTeX_Size4) con precisión de píxel; en ciertos
     navegadores/pantallas eso deja un artefacto de color permanente en
     los bordes (no es un problema de carga — pasa siempre, en
     cualquier dispositivo con esa combinación de renderizado). La
     solución es la misma que ya se usa para los paréntesis de las
     matrices: dibujar la llave nosotros mismos con un SVG que se
     estira por CSS, así no depende de ninguna fuente para el trazo.
     Cada ecuación se renderiza por separado con KaTeX (sin cases). */
  function renderSystemOfEquations(container, latexLines, prefixLatex) {
    container.innerHTML = '';
    if (!latexLines || latexLines.length === 0) return;
    if (latexLines.length === 1 && !prefixLatex) {
      window.katex.render(latexLines[0], container, { throwOnError: false });
      return;
    }
    var wrap = document.createElement('div');
    wrap.className = 'apt-act__system';
    if (prefixLatex) {
      var prefixEl = document.createElement('div');
      prefixEl.className = 'apt-act__system-prefix';
      window.katex.render(prefixLatex, prefixEl, { throwOnError: false });
      wrap.appendChild(prefixEl);
    }
    var brace = document.createElement('div');
    brace.className = 'apt-act__system-brace';
    brace.innerHTML = SYSTEM_BRACE_SVG;
    var lines = document.createElement('div');
    lines.className = 'apt-act__system-lines';
    latexLines.forEach(function (tex) {
      var lineEl = document.createElement('div');
      lineEl.className = 'apt-act__system-line';
      if (tex && typeof tex === 'object') {
        /* Línea de dos partes (expresión + condición, ej. 'si x > 0').
           Van en spans separados dentro de un flex-wrap: si no entran
           en el ancho disponible, la condición pasa a su propia línea
           en vez de depender de achicar la letra hasta un límite que
           puede no alcanzar. */
        lineEl.classList.add('apt-act__system-line--split');
        var exprEl = document.createElement('span');
        window.katex.render(tex.expr, exprEl, { throwOnError: false });
        var condEl = document.createElement('span');
        condEl.className = 'apt-act__system-cond';
        window.katex.render(tex.cond, condEl, { throwOnError: false });
        lineEl.appendChild(exprEl);
        lineEl.appendChild(condEl);
      } else {
        window.katex.render(tex, lineEl, { throwOnError: false });
      }
      lines.appendChild(lineEl);
    });
    wrap.appendChild(brace);
    wrap.appendChild(lines);
    container.appendChild(wrap);
  }

  global.AptActivity = {
    init: init,
    mountFooter: mountFooter,
    ensureAssets: ensureAssets,
    openReportModal: openReportModal,
    openCatalogModal: openCatalogModal,
    /* Modal "para usar el modo examen tenés que estar registrado" —
       expuesto desde v4.15 para que exam.js lo reuse en la landing
       trial (ver comentario junto a ensureRegistroModal). */
    openRegistroModal: openRegistroModal,
    playCorrectSound: playCorrectSound,
    playWrongSound: playWrongSound,
    celebrate: celebrate,
    isMuted: isMuted,
    toggleMute: toggleMute,
    // -- Módulo de espacios (Unidad 2), agregado en v1.8 --
    Frac: { Frac: Frac, fAdd: fAdd, fSub: fSub, fMul: fMul, fDiv: fDiv, fIsZero: fIsZero, fEquals: fEquals, fromInt: fromInt, intMatrixToFrac: intMatrixToFrac, rref: rref, rankOf: rankOf, rrefEqual: rrefEqual, fracRowToIntRow: fracRowToIntRow },
    checkSpanEquivalence: checkSpanEquivalence,
    normalizeMatrixDelims: normalizeMatrixDelims,
    /* Lo usa el modo examen para pintar enunciados con $...$ sin tener
       que reimplementar el parseo. */
    renderTextWithMath: renderTextWithMath,
    /* Sistema de ecuaciones con llave dibujada en SVG (no font-stacking
       de KaTeX) — ver el comentario largo junto a la función. */
    renderSystemOfEquations: renderSystemOfEquations,
    /* La version, para que el modo examen pueda mostrarla junto a la suya.
       Una version en un comentario no se puede verificar desde el
       navegador, y confirmar que un archivo propago es justo lo que mas
       falta cuando algo no anda. */
    version: ENGINE_VERSION,
    SPACES: SPACES,
    randomSpace: randomSpace,
    buildSpaceInputWidget: buildSpaceInputWidget,
    readSpaceInputWidget: readSpaceInputWidget,
    colorSpaceInputWidget: colorSpaceInputWidget,
    renderSevAmbient: renderSevAmbient,
    renderSevAsBasis: renderSevAsBasis,
    renderSevAsBasisWrapped: renderSevAsBasisWrapped,
    renderBasisWrapped: renderBasisWrapped,
    renderSevAsEquations: renderSevAsEquations,
    renderSevAsEquationsGrouped: renderSevAsEquationsGrouped,
    spaceVarNames: spaceVarNames
  };
})(window);
