/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 9
   "Cambio de base de M(T)"
   ------------------------------------------------------------
   Sección 4.4.1. Se dice en qué bases está la matriz que se tiene y
   en cuáles se la quiere, y hay que elegir el producto correcto.

   Es tipo test a propósito: la cuenta completa —dos productos y una
   inversa— es demasiado para un celular, y además no es ahí donde
   se traba el alumno. Se traba en el ORDEN y en el SENTIDO de las
   flechas, que es justo lo que esto ejercita.

   La regla general que sale del diagrama "tengo-quiero": si se tiene
   M(T) en las bases (X, Y) y se la quiere en (X', Y'), entonces

     M(T)_{X'Y'} = P_{Y→Y'} · M(T)_{XY} · P_{X'→X}

   El producto se lee de DERECHA a IZQUIERDA: primero el cambio de
   base en V (que lleva de X' a X, para poder usar la matriz que se
   tiene), después la TL, y al final el cambio de base en W.

   LAS CUATRO OPCIONES son las cuatro combinaciones de sentido de las
   dos flechas. Todas son válidas dimensionalmente, así que no se
   pueden descartar por el tamaño de las matrices: hay que leer el
   diagrama. Solo una es correcta.

   Los dos cambios de base son siempre reales (nunca X = X'), para
   que las cuatro opciones queden bien distintas. El caso en que una
   de las bases coincide y aparece la identidad —el Ejemplo #1 del
   libro— queda afuera por eso.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #9.
   ============================================================ */
(function () {
  'use strict';

  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var ESPACIOS = [
    { v: '\\mathbb{R}^2', w: '\\mathbb{R}^3' },
    { v: '\\mathbb{R}^3', w: '\\mathbb{R}^2' },
    { v: '\\mathbb{R}^3', w: '\\mathbb{R}^3' },
    { v: 'P_2(\\mathbb{R})', w: '\\mathbb{R}^3' },
    { v: '\\mathbb{R}^2', w: 'M_{2\\times2}(\\mathbb{R})' },
    { v: 'P_2(\\mathbb{R})', w: '\\mathbb{R}^2' }
  ];

  function generate() {
    var esp = randChoice(ESPACIOS);

    // Bases de V: E_1 (canónica) y B_1. Bases de W: E_2 y B_2.
    // Se sortea en cuáles está la matriz que se tiene.
    var tengoV = randChoice(['E_1', 'B_1']);
    var quieroV = tengoV === 'E_1' ? 'B_1' : 'E_1';
    var tengoW = randChoice(['E_2', 'B_2']);
    var quieroW = tengoW === 'E_2' ? 'B_2' : 'E_2';

    // Correcta: P_{tengoW → quieroW} · M · P_{quieroV → tengoV}
    // Las otras tres: las demás combinaciones de sentido de las flechas.
    var combos = [
      { izq: [tengoW, quieroW],  der: [quieroV, tengoV],  correcta: true },
      { izq: [quieroW, tengoW],  der: [tengoV, quieroV],  correcta: false },
      { izq: [quieroW, tengoW],  der: [quieroV, tengoV],  correcta: false },
      { izq: [tengoW, quieroW],  der: [tengoV, quieroV],  correcta: false }
    ];

    var opciones = shuffle(combos).map(function (c, i) {
      return { value: 'o' + i, izq: c.izq, der: c.der, correcta: c.correcta };
    });

    return {
      esp: esp,
      tengoV: tengoV, quieroV: quieroV, tengoW: tengoW, quieroW: quieroW,
      opciones: opciones,
      correcta: opciones.filter(function (o) { return o.correcta; })[0].value
    };
  }

  /* ---------- render ---------- */
  function flecha(par) { return 'P_{' + par[0] + ' \\to ' + par[1] + '}'; }
  function productoLatex(o) {
    return flecha(o.izq) + ' \\cdot M \\cdot ' + flecha(o.der);
  }

  function ajustarAncho(rowEl) {
    var k = rowEl.querySelector('.katex');
    if (!k) return;
    rowEl.style.fontSize = '';
    var disp = rowEl.clientWidth;
    if (!disp) return;
    var meta = disp - 2;
    var ancho = k.getBoundingClientRect().width;
    if (!ancho || ancho <= meta) return;
    var escala = Math.max(0.68, meta / ancho);
    rowEl.style.fontSize = (escala * 100).toFixed(1) + '%';
    var ancho2 = k.getBoundingClientRect().width;
    if (ancho2 > meta && escala > 0.68) {
      rowEl.style.fontSize = (Math.max(0.68, escala * (meta / ancho2)) * 100).toFixed(1) + '%';
    }
  }

  function renderContent(container, cur) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">' +
        '<div class="apt-r1" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r2" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r3" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r1 = container.querySelector('.apt-r1');
    var r2 = container.querySelector('.apt-r2');
    var r3 = container.querySelector('.apt-r3');
    window.katex.render('T: ' + cur.esp.v + ' \\to ' + cur.esp.w, r1, { throwOnError: false });
    window.katex.render('\\text{tengo } \\ M = M(T)_{' + cur.tengoV + cur.tengoW + '}', r2, { throwOnError: false });
    window.katex.render('\\text{quiero } \\ M(T)_{' + cur.quieroV + cur.quieroW + '}', r3, { throwOnError: false });
    [r1, r2, r3].forEach(ajustarAncho);
  }

  /* ---------- feedback, en texto plano ---------- */
  function sub(nombre) {
    // E_1 → E₁, B_2 → B₂, para el texto del feedback
    return nombre.replace('_1', '₁').replace('_2', '₂');
  }
  function porQue(cur) {
    return 'El producto se lee de derecha a izquierda. Primero hay que llevar las coordenadas de ' +
      sub(cur.quieroV) + ' a ' + sub(cur.tengoV) + ', que es la base en la que sirve la matriz que tenés: ' +
      'esa es la flecha ' + sub(cur.quieroV) + ' → ' + sub(cur.tengoV) + ' y va a la derecha. ' +
      'Después se aplica M. Y al final se pasa el resultado de ' + sub(cur.tengoW) + ' a ' + sub(cur.quieroW) +
      ', que es la flecha ' + sub(cur.tengoW) + ' → ' + sub(cur.quieroW) + ' y va a la izquierda.';
  }

  function boot() {
    window.AptActivity.init({
      mode: 'choices',
      needsKatex: true,
      choicesStacked: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Cambio de base de M(T)',
      subtitle: 'Llamemos $M$ a la matriz que tenés. ¿Cuál de estos productos da la matriz que buscás?',
      nextLabel: 'Probar con otro caso →',
      generate: generate,
      renderContent: renderContent,
      choices: function (cur) {
        return cur.opciones.map(function (o) {
          return { value: o.value, label: window.katex.renderToString(productoLatex(o), { throwOnError: false }) };
        });
      },
      check: function (cur, value) { return value === cur.correcta; },
      explain: function (cur, correct) {
        return correct ? porQue(cur) : 'No es correcto. ' + porQue(cur);
      }
    });
  }

  if (window.AptActivity && typeof window.AptActivity.init === 'function') { boot(); }
  else {
    var intentos = 0;
    var esperar = setInterval(function () {
      intentos++;
      if (window.AptActivity && typeof window.AptActivity.init === 'function') { clearInterval(esperar); boot(); }
      else if (intentos > 200) { clearInterval(esperar); }
    }, 25);
  }
})();
