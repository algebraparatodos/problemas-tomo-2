/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 14
   "Hallá M(T⁻¹)"
   ------------------------------------------------------------
   Sección 4.7.1. Dos fases, en el mismo orden que el libro:

     1) ¿T es un isomorfismo?  →  se decide con el determinante
     2) si lo es, ¿cuál es M(T⁻¹)?  →  tipo test

   La propiedad que se usa es la del libro: [M(T)]⁻¹ = M(T⁻¹). Si el
   determinante es 0 la segunda fase no aparece, porque no hay inversa
   que buscar.

   SOBRE LOS NÚMEROS: la inversa de una matriz entera casi nunca es
   entera. Para que las opciones se puedan leer en un celular, el
   determinante se controla y queda en ±1, ±2 o ±3, y cuando no es ±1
   la inversa se muestra con el factor 1/|det| adelante — la misma
   forma en que el libro escribe estas matrices.

   Que aparezcan casos con |det| distinto de 1 no es un detalle
   estético: habilita el distractor más común de todos, que es dar la
   matriz adjunta sin dividir por el determinante.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #14.
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

  var ESPACIOS = [
    { n: 2, label: '\\mathbb{R}^2' },
    { n: 2, label: 'P_1(\\mathbb{R})' },
    { n: 3, label: '\\mathbb{R}^3' },
    { n: 3, label: 'P_2(\\mathbb{R})' }
  ];

  /* ---------- determinante, adjunta y trasposición, con enteros ---------- */
  function det(M) {
    var n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    var s = 0;
    for (var c = 0; c < n; c++) {
      var menor = M.slice(1).map(function (row) { return row.filter(function (_, j) { return j !== c; }); });
      s += (c % 2 ? -1 : 1) * M[0][c] * det(menor);
    }
    return s;
  }
  /* adj(A): la transpuesta de la matriz de cofactores. Cumple A·adj(A) = det(A)·I */
  function adjunta(M) {
    var n = M.length, out = [];
    for (var i = 0; i < n; i++) {
      var row = [];
      for (var j = 0; j < n; j++) {
        var menor = M.filter(function (_, r) { return r !== j; })
                     .map(function (r) { return r.filter(function (_, c) { return c !== i; }); });
        row.push(((i + j) % 2 ? -1 : 1) * (n === 1 ? 1 : det(menor)));
      }
      out.push(row);
    }
    return out;
  }
  function transpuesta(M) {
    return M[0].map(function (_, c) { return M.map(function (row) { return row[c]; }); });
  }
  function escalar(M, k) { return M.map(function (r) { return r.map(function (x) { return k * x; }); }); }
  function iguales(A, B) { return JSON.stringify(A) === JSON.stringify(B); }
  function maxAbs(M) { return Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); })); }

  /* Matriz entera con determinante EXACTO d: se parte de una diagonal
     con ese determinante y se mezcla con operaciones que no lo cambian
     (sumar un múltiplo de una fila o columna a otra). */
  function conDeterminante(n, d) {
    var M = [];
    for (var i = 0; i < n; i++) {
      var row = [];
      for (var j = 0; j < n; j++) row.push(i === j ? (i === 0 ? d : 1) : 0);
      M.push(row);
    }
    for (var op = 0, ops = randInt(3, 6); op < ops; op++) {
      var a = randInt(0, n - 1), b = randInt(0, n - 1);
      while (b === a) b = randInt(0, n - 1);
      var k = randNonZero(-2, 2);
      if (Math.random() < 0.5) {
        for (var c = 0; c < n; c++) M[b][c] += k * M[a][c];
      } else {
        for (var r = 0; r < n; r++) M[r][b] += k * M[r][a];
      }
    }
    return M;
  }
  /* Matriz singular: una fila combinación de las otras. */
  function singular(n) {
    var M = [];
    for (var i = 0; i < n - 1; i++) {
      var row = [];
      for (var j = 0; j < n; j++) row.push(randInt(-4, 4));
      M.push(row);
    }
    var ultima = new Array(n).fill(0);
    M.forEach(function (row) {
      var k = randInt(-2, 2);
      for (var c = 0; c < n; c++) ultima[c] += k * row[c];
    });
    M.push(ultima);
    for (var op = 0, ops = randInt(2, 4); op < ops; op++) {
      var a = randInt(0, n - 1), b = randInt(0, n - 1);
      while (b === a) b = randInt(0, n - 1);
      var kk = randNonZero(-2, 2);
      for (var c2 = 0; c2 < n; c2++) M[b][c2] += kk * M[a][c2];
    }
    return M;
  }

  /* ---------- generador ---------- */
  function generate() {
    var esp = randChoice(ESPACIOS);
    var n = esp.n;
    // 60% invertibles: la fase interesante es la segunda, pero decidir
    // si hay inversa también es parte del ejercicio.
    var invertible = Math.random() < 0.6;

    var A, d, inv = null, den = 1, intentos = 0;
    do {
      intentos++;
      if (!invertible) {
        A = singular(n);
        d = det(A);
        if (d !== 0 || maxAbs(A) > 22) continue;
        break;
      }
      var objetivo = randChoice([1, -1, 1, -1, 2, -2, 3, -3]);
      A = conDeterminante(n, objetivo);
      d = det(A);
      if (d !== objetivo || maxAbs(A) > 14) continue;

      // A⁻¹ = adj(A)/det(A). Se lleva el signo a la matriz para que el
      // denominador quede positivo.
      var B = adjunta(A);
      den = d;
      if (den < 0) { B = escalar(B, -1); den = -den; }
      inv = B;
      if (maxAbs(inv) > 30) continue;
      break;
    } while (intentos < 200);

    return {
      esp: esp, n: n, A: A, det: d,
      invertible: d !== 0,
      inv: inv, den: den,
      opciones: d !== 0 ? armarOpciones(A, inv, den, d) : null
    };
  }

  /* Cuatro candidatos, todos del mismo tamaño y con el mismo factor. */
  function armarOpciones(A, inv, den, d) {
    var candidatos = [{ M: inv, correcta: true, tipo: 'inversa' }];

    // la adjunta sin dividir: el error clásico. Solo sirve si el
    // factor no es 1, porque si no coincide con la inversa.
    if (den !== 1) candidatos.push({ M: escalar(inv, den), tipo: 'sin-dividir' });
    // la transpuesta de la inversa
    candidatos.push({ M: transpuesta(inv), tipo: 'transpuesta' });
    // la matriz original, sin invertir
    candidatos.push({ M: A, tipo: 'original' });
    // un signo cambiado
    candidatos.push({ M: (function () {
      var c = inv.map(function (r) { return r.slice(); });
      var i = randInt(0, c.length - 1), j = randInt(0, c.length - 1);
      c[i][j] = -c[i][j];
      if (c[i][j] === 0) c[i][j] = randNonZero(-3, 3);
      return c;
    })(), tipo: 'signo' });

    // se descartan los que coincidan con la correcta o entre sí
    var elegidos = [candidatos[0]];
    shuffle(candidatos.slice(1)).forEach(function (c) {
      if (elegidos.length >= 4) return;
      if (elegidos.some(function (e) { return iguales(e.M, c.M); })) return;
      elegidos.push(c);
    });
    // si faltan, se completan perturbando
    var guarda = 0;
    while (elegidos.length < 4 && guarda < 40) {
      guarda++;
      var c2 = inv.map(function (r) { return r.slice(); });
      c2[randInt(0, c2.length - 1)][randInt(0, c2.length - 1)] += randNonZero(-3, 3);
      if (!elegidos.some(function (e) { return iguales(e.M, c2); })) elegidos.push({ M: c2, tipo: 'perturbada' });
    }

    var idx = 0;
    return shuffle(elegidos.map(function (o) {
      return { value: o.correcta ? 'ok' : ('w' + (idx++)), M: o.M, tipo: o.tipo, correcta: !!o.correcta };
    }));
  }

  /* ---------- render ---------- */
  function matrixLatex(M) {
    return '\\begin{pmatrix} ' + M.map(function (r) { return r.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
  }
  function conFactor(M, den) {
    return (den === 1 ? '' : '\\dfrac{1}{' + den + '}\\,') + matrixLatex(M);
  }
  var PISO = 0.66;
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
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">' +
        '<div class="apt-r1" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r2" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r1 = container.querySelector('.apt-r1');
    var r2 = container.querySelector('.apt-r2');
    window.katex.render('T: ' + cur.esp.label + ' \\to ' + cur.esp.label, r1, { throwOnError: false });
    window.katex.render('M(T) = ' + matrixLatex(cur.A), r2, { throwOnError: false });
    [r1, r2].forEach(ajustarAncho);
  }

  /* ---------- feedback en texto plano ---------- */
  function porQueFase1(cur) {
    return cur.invertible
      ? 'El determinante de M(T) es ' + cur.det + ', distinto de 0, así que la matriz es invertible y T es un isomorfismo.'
      : 'El determinante de M(T) es 0, así que la matriz no es invertible: T no es un isomorfismo y no tiene inversa. ' +
        'Su núcleo no es trivial.';
  }
  function porQueFase2(cur) {
    var base = 'Por la propiedad del libro, la matriz de la TL inversa es la inversa de la matriz: [M(T)]⁻¹ = M(T⁻¹). ' +
      'Se calcula como la adjunta dividida por el determinante, que acá vale ' + cur.det + '.';
    if (cur.den !== 1) {
      base += ' Ojo con ese paso: si te quedás con la adjunta y no dividís, el resultado queda multiplicado por ' + cur.det + '.';
    }
    return base;
  }

  function boot() {
    window.AptActivity.init({
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Hallá M(T⁻¹)',
      subtitle: 'Primero fijate si T tiene inversa. Si la tiene, elegí la matriz asociada de $T^{-1}$.',
      nextLabel: 'Probar con otra transformación →',
      generate: generate,
      renderContent: renderContent,
      // Si no es isomorfismo, no hay inversa que buscar.
      activePhaseCount: function (cur) { return cur.invertible ? 2 : 1; },
      phases: [
        {
          mode: 'choices',
          question: '¿T es un isomorfismo?',
          choicesStacked: false,
          choices: [
            { value: 'si', label: 'Sí' },
            { value: 'no', label: 'No' }
          ],
          check: function (cur, value) { return (value === 'si') === cur.invertible; },
          explain: function (cur, correct) {
            return correct ? porQueFase1(cur) : 'No es correcto. ' + porQueFase1(cur);
          }
        },
        {
          mode: 'choices',
          question: '¿Cuál es M(T⁻¹)?',
          choicesGrid: true,
          choicesGridSingleColumn: true,
          choices: function (cur) {
            return (cur.opciones || []).map(function (o) {
              return {
                value: o.value,
                label: window.katex.renderToString('M(T^{-1}) = ' + conFactor(o.M, cur.den), { throwOnError: false })
              };
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
