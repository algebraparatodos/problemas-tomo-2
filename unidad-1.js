/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Matrices y SEL — índice y ruteo
   ------------------------------------------------------------
   UNA sola landing de Kajabi para TODAS las actividades de la
   unidad. El número de actividad viaja en el fragmento de la URL:

     .../qrt2u1#7   → abre directamente la actividad 7
     .../qrt2u1     → muestra la grilla "Elegí el QR"

   Se usa el fragmento (#) y no un parámetro (?) a propósito: lo
   que va después del # nunca se envía al servidor, así que ninguna
   plataforma puede reescribirlo ni redirigirlo. Además queda en el
   historial, así que el botón "atrás" del celular vuelve al índice
   sin que haya que programar nada.

   En la landing de Kajabi va únicamente esto:

     <div id="apt-unidad"></div>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/unidad-1.js"><\/script>

   Para agregar una actividad nueva: subir su archivo a actividades/
   y sumar una línea a la lista de abajo. Nada más — Kajabi no se toca.
   ============================================================ */
(function () {
  'use strict';

  var BASE = 'https://algebraparatodos.github.io/problemas-tomo-2/actividades/';

  /* Los títulos están duplicados del CATALOG de engine.js porque el
     engine todavía no lo expone públicamente. Si en algún momento se
     expone, esta lista se puede derivar de ahí y dejan de poder
     desincronizarse. */
  var ACTIVIDADES = [
    { n: 1,  titulo: 'Clasificá el sistema',                      archivo: 'unidad-1-actividad-1-clasifica-el-sistema.js' },
    { n: 2,  titulo: 'Matriz ampliada',                           archivo: 'unidad-1-actividad-2-matriz-ampliada.js' },
    { n: 3,  titulo: '¿Es escalonada?',                           archivo: 'unidad-1-actividad-3-escalonada.js' },
    { n: 4,  titulo: 'Aplicá el método de eliminación de Gauss',  archivo: 'unidad-1-actividad-4-metodo-de-gauss.js' },
    { n: 5,  titulo: '¿Es escalonada reducida?',                  archivo: 'unidad-1-actividad-5-escalonada-reducida.js' },
    { n: 6,  titulo: 'Encontrá la forma escalonada reducida',     archivo: 'unidad-1-actividad-6-encontrar-escalonada-reducida.js' },
    { n: 7,  titulo: 'Solución paramétrica',                      archivo: 'unidad-1-actividad-7-solucion-parametrica.js' },
    { n: 8,  titulo: 'Rango por orlado',                          archivo: 'unidad-1-actividad-8-rango-orlado.js' },
    { n: 9,  titulo: 'Clasificá con Rouché-Frobenius',            archivo: 'unidad-1-actividad-9-rouche-frobenius.js' },
    { n: 10, titulo: 'Rouché-Frobenius con parámetros',           archivo: 'unidad-1-actividad-10-rouche-frobenius-parametro.js' },
    { n: 11, titulo: 'Tipos de matrices',                         archivo: 'unidad-1-actividad-11-tipos-de-matrices.js' },
    { n: 12, titulo: 'Suma de matrices',                          archivo: 'unidad-1-actividad-12-suma-de-matrices.js' },
    { n: 13, titulo: 'Producto de una matriz por un escalar',     archivo: 'unidad-1-actividad-13-producto-por-escalar.js' },
    { n: 14, titulo: 'Trasposición de matrices',                  archivo: 'unidad-1-actividad-14-trasposicion.js' },
    { n: 15, titulo: 'Producto de matrices',                      archivo: 'unidad-1-actividad-15-producto-de-matrices.js' }
  ];

  var UNIDAD_TITULO = 'Unidad 1 · Matrices y SEL';

  /* ---------- punto de montaje ----------
     Igual que en las actividades: se captura la posición del <script>
     mientras document.currentScript todavía es válido. */
  var MOUNT_ID = 'apt-indice-u1';
  (function placeMount() {
    if (document.getElementById(MOUNT_ID)) return;
    var d = document.createElement('div');
    d.id = MOUNT_ID;
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  /* ---------- CSS del índice ----------
     El contenedor lleva la clase .apt-act para heredar las variables
     de color, la tipografía y el fondo cuadriculado del engine, así
     el índice se ve como parte de la misma cosa y no como un anexo. */
  var STYLE_ID = 'apt-indice-style';
  var CSS = [
    '.apt-idx{ width:100%; max-width:var(--max-w); display:flex; flex-direction:column; gap:18px; }',
    '.apt-idx__topbar{ text-align:center; }',
    '.apt-idx__eyebrow{ font-family:var(--font-serif); font-weight:700; font-size:12px; letter-spacing:.1em;' +
      ' text-transform:uppercase; color:var(--chalk-light); margin:0 0 8px; }',
    '.apt-idx__title{ text-wrap:balance; font-family:var(--font-mono); font-weight:700; font-size:clamp(22px,6.5vw,28px);' +
      ' margin:0; color:var(--ink); line-height:1.25; }',
    '.apt-idx__subtitle{ text-wrap:pretty; font-family:var(--font-mono); font-size:13.5px; color:var(--ink-soft);' +
      ' margin:8px 0 0; line-height:1.5; }',
    /* text-wrap:balance iguala el largo de las lineas en titulos de
       dos lineas; text-wrap:pretty evita que un parrafo termine con una
       sola palabra colgada. Si el navegador no los soporta, los ignora. */
    /* Columnas fijas con media query, NO auto-fit/minmax: con títulos de
       largo muy distinto, auto-fit da columnas desparejas. */
    '.apt-idx__grid{ display:grid; grid-template-columns:1fr; gap:8px; }',
    '@media (min-width:420px){ .apt-idx__grid{ grid-template-columns:1fr 1fr; } }',
    '.apt-idx__item{ display:flex; align-items:center; gap:10px; text-align:left; width:100%;' +
      ' background:var(--bg-card); border:2px solid rgba(151,161,216,0.25); border-radius:12px;' +
      ' padding:12px 14px; min-height:56px; cursor:pointer; color:var(--ink);' +
      ' font-family:var(--font-mono); font-size:13.5px; line-height:1.35;' +
      ' transition:border-color .15s ease, background .15s ease, transform .08s ease;' +
      ' -webkit-tap-highlight-color:transparent; }',
    '.apt-idx__item:hover{ border-color:var(--chalk-light); background:rgba(151,161,216,0.10); }',
    '.apt-idx__item:active{ transform:scale(.985); }',
    '.apt-idx__item:focus-visible{ outline:3px solid var(--chalk-light); outline-offset:2px; }',
    '.apt-idx__num{ flex:0 0 30px; height:30px; display:flex; align-items:center; justify-content:center;' +
      ' border-radius:8px; background:var(--chalk); color:#fff;' +
      ' font-family:var(--font-serif); font-weight:700; font-size:14px; }',
    '.apt-idx__vacio{ text-wrap:pretty; text-align:center; font-family:var(--font-mono); font-size:13.5px;' +
      ' color:var(--ink-soft); line-height:1.6; padding:18px 8px; }'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- ruteo por fragmento ---------- */
  function numeroDelHash() {
    var h = (window.location.hash || '').replace(/^#/, '').trim();
    if (!/^\d+$/.test(h)) return null;
    var n = parseInt(h, 10);
    return ACTIVIDADES.some(function (a) { return a.n === n; }) ? n : null;
  }

  var root = document.getElementById(MOUNT_ID);
  var cargada = null; // número de actividad ya cargada en esta página

  function limpiar() {
    root.innerHTML = '';
    root.className = '';
  }

  function mostrarIndice() {
    limpiar();
    root.className = 'apt-act';
    var wrap = document.createElement('div');
    wrap.className = 'apt-idx';
    var hayActividades = ACTIVIDADES.length > 0;
    wrap.innerHTML =
      '<div class="apt-idx__topbar">' +
        '<p class="apt-idx__eyebrow">' + UNIDAD_TITULO + '</p>' +
        '<h1 class="apt-idx__title">' + (hayActividades ? 'Elegí el QR' : 'Próximamente') + '</h1>' +
        '<p class="apt-idx__subtitle">' +
          (hayActividades
            ? 'Tocá el número que aparece junto al QR en el libro.'
            : 'Todavía no hay ejercicios interactivos para esta unidad.') +
        '</p>' +
      '</div>' +
      (hayActividades ? '<div class="apt-idx__grid"></div>' : '');
    if (hayActividades) {
      var grid = wrap.querySelector('.apt-idx__grid');
      ACTIVIDADES.forEach(function (a) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'apt-idx__item';
        btn.innerHTML = '<span class="apt-idx__num">' + a.n + '</span><span>' + a.titulo + '</span>';
        btn.addEventListener('click', function () { window.location.hash = String(a.n); });
        grid.appendChild(btn);
      });
    }
    root.appendChild(wrap);
    if (window.AptActivity && typeof window.AptActivity.mountFooter === 'function') {
      var pie = document.createElement('div');
      wrap.appendChild(pie);
      try { window.AptActivity.mountFooter(pie); } catch (e) { /* footer opcional */ }
    }
  }

  function mostrarActividad(n) {
    var act = ACTIVIDADES.filter(function (a) { return a.n === n; })[0];
    if (!act) { mostrarIndice(); return; }
    limpiar();

    // Sin barra de "volver": el botón "Todos los ejercicios" del footer
    // del engine ya cumple esa función, y tenerla dos veces sobra.

    // La actividad se inserta DENTRO de este contenedor: así su propio
    // document.currentScript apunta acá y se dibuja en el lugar correcto.
    var host = document.createElement('div');
    root.appendChild(host);
    var sc = document.createElement('script');
    sc.src = BASE + act.archivo;
    sc.onerror = function () {
      host.innerHTML = '<p style="text-align:center;padding:24px;font-family:var(--font-mono);' +
        'font-size:13px;color:var(--ink-soft);">No se pudo cargar la actividad. ' +
        'Probá de nuevo en un momento.</p>';
    };
    host.appendChild(sc);
    cargada = n;
  }

  function rutear() {
    var n = numeroDelHash();
    if (n === null) { cargada = null; mostrarIndice(); return; }
    // Si ya está cargada esa actividad, no se recarga (evita duplicarla).
    if (cargada === n) return;
    if (cargada !== null) { window.location.reload(); return; }
    mostrarActividad(n);
  }

  function arrancar() {
    injectCSS();
    if (window.AptActivity && typeof window.AptActivity.ensureAssets === 'function') {
      try { window.AptActivity.ensureAssets(); } catch (e) { /* sigue igual */ }
    }
    rutear();
    window.addEventListener('hashchange', rutear);
  }

  /* Los <script> normales corren en orden, así que engine.js ya cargó.
     El poll es una red de seguridad por si alguna vez se carga con defer. */
  if (window.AptActivity) { arrancar(); }
  else {
    var intentos = 0;
    var esperar = setInterval(function () {
      intentos++;
      if (window.AptActivity) { clearInterval(esperar); arrancar(); }
      else if (intentos > 200) { clearInterval(esperar); arrancar(); }
    }, 25);
  }
})();
