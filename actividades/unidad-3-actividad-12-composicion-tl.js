/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 12
   "Composición de TL"
   ------------------------------------------------------------
   Sección 4.6. Dadas T y S, decidir qué composiciones están
   definidas y, si alguna lo está, elegir su matriz asociada.

     S∘T está definida  ⟺  el espacio de llegada de T es el de
                            partida de S
     T∘S está definida  ⟺  el de llegada de S es el de partida de T

   Y la matriz de la composición es el PRODUCTO de las matrices, en
   el mismo orden en que se escribe la composición:

     M(S∘T) = M(S) · M(T)

   UN PUNTO A PROPÓSITO: entre los espacios que se sortean hay dos de
   la misma dimensión pero distintos, R³ y P₂(R). Que las dimensiones
   coincidan NO alcanza para poder componer: tienen que ser el mismo
   espacio. Así el alumno no puede resolverlo mirando solo tamaños.

   La segunda fase es tipo test, como se decidió: los cuatro
   candidatos tienen el MISMO tamaño (son perturbaciones del producto
   correcto), así que tampoco se puede descartar por forma — hay que
   hacer la cuenta.

   Si ninguna composición está definida, la segunda fase no aparece.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #12.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* Dimensiones chicas a propósito: el producto se muestra como cuatro
     opciones y con 4x4 no entra en un celular. R3 y P2 comparten
     dimensión pero son espacios distintos. */
  var SPACES = {
    R2: { dim: 2, label: '\\mathbb{R}^2' },
    R3: { dim: 3, label: '\\mathbb{R}^3' },
    P2: { dim: 3, label: 'P_2(\\mathbb{R})' }
  };
  var SPACE_KEYS = ['R2', 'R3', 'P2'];

  function matriz(rows, cols, lo, hi) {
    var M = [];
    for (var i = 0; i < rows; i++) {
      var row = [];
      for (var j = 0; j < cols; j++) row.push(randInt(lo, hi));
      M.push(row);
    }
    return M;
  }
  function producto(A, B) {
    var out = [];
    for (var i = 0; i < A.length; i++) {
      var row = [];
      for (var j = 0; j < B[0].length; j++) {
        var s = 0;
        for (var k = 0; k < B.length; k++) s += A[i][k] * B[k][j];
        row.push(s);
      }
      out.push(row);
    }
    return out;
  }
  function iguales(A, B) { return JSON.stringify(A) === JSON.stringify(B); }
  function maxAbs(M) { return Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); })); }

  /* ---------- generador ---------- */
  var CASOS = ['solo-ST', 'solo-TS', 'ambas', 'ninguna'];

  function generate() {
    var caso = randChoice(CASOS);
    var V, W, Wp, Z, intentos = 0;

    do {
      intentos++;
      V = randChoice(SPACE_KEYS);
      W = randChoice(SPACE_KEYS);
      Wp = randChoice(SPACE_KEYS);
      Z = randChoice(SPACE_KEYS);

      if (caso === 'solo-ST')      { Wp = W;  if (Z === V) continue; }
      else if (caso === 'solo-TS') { Z = V;   if (Wp === W) continue; }
      else if (caso === 'ambas')   { Wp = W;  Z = V; }
      else                         { if (Wp === W || Z === V) continue; }
      break;
    } while (intentos < 200);

    var defST = (Wp === W);
    var defTS = (Z === V);

    // M(T): dim W x dim V   ·   M(S): dim Z x dim Wp
    var MT, MS, prod = null, cual = null, intentos2 = 0;
    do {
      intentos2++;
      MT = matriz(SPACES[W].dim, SPACES[V].dim, -3, 3);
      MS = matriz(SPACES[Z].dim, SPACES[Wp].dim, -3, 3);
      if (defST) { cual = 'ST'; prod = producto(MS, MT); }
      else if (defTS) { cual = 'TS'; prod = producto(MT, MS); }
      else { cual = null; prod = null; break; }
      // que no quede todo en cero, y que los números no se vayan
      if (maxAbs(prod) === 0 || maxAbs(prod) > 40) { prod = null; continue; }
      break;
    } while (intentos2 < 120);

    var opciones = null;
    if (prod) opciones = armarOpciones(prod);

    return {
      caso: caso, V: V, W: W, Wp: Wp, Z: Z,
      MT: MT, MS: MS,
      defST: defST, defTS: defTS,
      respuestaFase1: defST && defTS ? 'ambas' : defST ? 'ST' : defTS ? 'TS' : 'ninguna',
      cual: cual, prod: prod, opciones: opciones
    };
  }

  /* Cuatro candidatos del MISMO tamaño: el correcto y tres errores
     típicos de cálculo. Mismo tamaño = no se puede descartar por forma. */
  function armarOpciones(P) {
    var filas = P.length, cols = P[0].length;
    function perturbar(fn) {
      var cand, intentos = 0;
      do { cand = fn(); intentos++; } while (iguales(cand, P) && intentos < 30);
      return cand;
    }
    var d1 = perturbar(function () {
      var c = P.map(function (r) { return r.slice(); });
      c[randInt(0, filas - 1)][randInt(0, cols - 1)] += randNonZero(-3, 3);
      return c;
    });
    var d2 = perturbar(function () {
      var c = P.map(function (r) { return r.slice(); });
      var i = randInt(0, filas - 1), j = randInt(0, cols - 1);
      c[i][j] = -c[i][j];
      if (c[i][j] === 0) c[i][j] = randNonZero(-3, 3);
      return c;
    });
    var d3 = perturbar(function () {
      var c = P.map(function (r) { return r.slice(); });
      // dos entradas de una misma fila intercambiadas
      if (cols >= 2) {
        var i = randInt(0, filas - 1);
        var a = randInt(0, cols - 1), b = randInt(0, cols - 1);
        while (b === a) b = randInt(0, cols - 1);
        var t = c[i][a]; c[i][a] = c[i][b]; c[i][b] = t;
      } else {
        c[randInt(0, filas - 1)][0] += randNonZero(-3, 3);
      }
      return c;
    });

    var todas = [{ M: P, correcta: true }, { M: d1 }, { M: d2 }, { M: d3 }];
    // que las cuatro sean distintas entre sí
    for (var i = 1; i < todas.length; i++) {
      var choque = 0;
      while (todas.slice(0, i).some(function (o) { return iguales(o.M, todas[i].M); }) && choque < 30) {
        var c = todas[i].M.map(function (r) { return r.slice(); });
        c[randInt(0, filas - 1)][randInt(0, cols - 1)] += randNonZero(-3, 3);
        todas[i].M = c;
        choque++;
      }
    }
    var idx = 0;
    return shuffle(todas.map(function (o) {
      return { value: o.correcta ? 'ok' : ('w' + (idx++)), M: o.M, correcta: !!o.correcta };
    }));
  }

  /* ---------- render ---------- */
  function matrixLatex(M) {
    return '\\begin{pmatrix} ' + M.map(function (r) { return r.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
  }
  var PISO = 0.68;
  function ajustarAncho(rowEl) {
    var k = rowEl.querySelector('.katex');
    if (!k) return;
    rowEl.style.fontSize = '';
    var disp = rowEl.clientWidth;
    if (!disp) return;
    var meta = disp - 2;
    var ancho = k.getBoundingClientRect().width;
    if (!ancho || ancho <= meta) return;
    var escala = Math.max(PISO, meta / ancho);
    rowEl.style.fontSize = (escala * 100).toFixed(1) + '%';
    var ancho2 = k.getBoundingClientRect().width;
    if (ancho2 > meta && escala > PISO) {
      rowEl.style.fontSize = (Math.max(PISO, escala * (meta / ancho2)) * 100).toFixed(1) + '%';
    }
  }

  function renderContent(container, cur) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:9px;width:100%;">' +
        '<div class="apt-r1" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r2" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r3" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r4" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r = ['r1', 'r2', 'r3', 'r4'].map(function (x) { return container.querySelector('.apt-' + x); });
    window.katex.render('T: ' + SPACES[cur.V].label + ' \\to ' + SPACES[cur.W].label, r[0], { throwOnError: false });
    window.katex.render('M(T) = ' + matrixLatex(cur.MT), r[1], { throwOnError: false });
    window.katex.render('S: ' + SPACES[cur.Wp].label + ' \\to ' + SPACES[cur.Z].label, r[2], { throwOnError: false });
    window.katex.render('M(S) = ' + matrixLatex(cur.MS), r[3], { throwOnError: false });
    r.forEach(ajustarAncho);
  }

  /* ---------- feedback en texto plano ---------- */
  function nombreEsp(k) { return { R2: 'R²', R3: 'R³', P2: 'P₂(R)' }[k]; }

  function porQueFase1(cur) {
    var partes = [];
    partes.push(cur.defST
      ? 'S∘T sí está definida: T llega a ' + nombreEsp(cur.W) + ' y S parte de ' + nombreEsp(cur.Wp) + ', que es el mismo espacio.'
      : 'S∘T no está definida: T llega a ' + nombreEsp(cur.W) + ' pero S parte de ' + nombreEsp(cur.Wp) + '.' +
        (SPACES[cur.W].dim === SPACES[cur.Wp].dim ? ' Tienen la misma dimensión, pero no son el mismo espacio.' : ''));
    partes.push(cur.defTS
      ? 'T∘S sí está definida: S llega a ' + nombreEsp(cur.Z) + ' y T parte de ' + nombreEsp(cur.V) + '.'
      : 'T∘S no está definida: S llega a ' + nombreEsp(cur.Z) + ' pero T parte de ' + nombreEsp(cur.V) + '.' +
        (SPACES[cur.Z].dim === SPACES[cur.V].dim ? ' Tienen la misma dimensión, pero no son el mismo espacio.' : ''));
    return partes.join(' ');
  }
  function porQueFase2(cur) {
    return cur.cual === 'ST'
      ? 'La matriz de la composición es el producto en el mismo orden en que se escribe: M(S∘T) = M(S)·M(T). ' +
        'Primero actúa T y después S, y eso corresponde a multiplicar M(S) por la izquierda.'
      : 'La matriz de la composición es el producto en el mismo orden en que se escribe: M(T∘S) = M(T)·M(S). ' +
        'Primero actúa S y después T, y eso corresponde a multiplicar M(T) por la izquierda.';
  }

  function boot() {
    window.AptActivity.init({
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Composición de TL',
      subtitle: 'Fijate en los espacios de partida y llegada de cada una para decidir qué composiciones existen.',
      nextLabel: 'Probar con otro caso →',
      generate: generate,
      renderContent: renderContent,
      // Si no hay ninguna composición definida, no hay matriz que pedir.
      activePhaseCount: function (cur) { return cur.prod ? 2 : 1; },
      phases: [
        {
          mode: 'choices',
          question: '¿Qué composiciones están definidas?',
          choicesStacked: true,
          choices: [
            { value: 'ST',      label: 'Solo S∘T' },
            { value: 'TS',      label: 'Solo T∘S' },
            { value: 'ambas',   label: 'Las dos' },
            { value: 'ninguna', label: 'Ninguna' }
          ],
          check: function (cur, value) { return value === cur.respuestaFase1; },
          explain: function (cur, correct) {
            return correct ? porQueFase1(cur) : 'No es correcto. ' + porQueFase1(cur);
          }
        },
        {
          mode: 'choices',
          question: '¿Cuál es la matriz asociada de esa composición, en bases canónicas?',
          choicesGrid: true,
          choicesGridSingleColumn: true,
          choices: function (cur) {
            return (cur.opciones || []).map(function (o) {
              var nombre = cur.cual === 'ST' ? 'M(S \\circ T)' : 'M(T \\circ S)';
              return { value: o.value, label: window.katex.renderToString(nombre + ' = ' + matrixLatex(o.M), { throwOnError: false }) };
            });
          },
          check: function (cur, value) { return value === 'ok'; },
          explain: function (cur, correct) {
            return correct ? porQueFase2(cur) : 'No es correcto. ' + porQueFase2(cur);
          }
        }
      ]
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
