/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 5
   "Cambio de base de M(T)"
   ------------------------------------------------------------
   Sección 3.4.1. Se da la matriz asociada en unas bases, las bases
   y en cuáles se la quiere. Dos fases, en el orden del libro:

     1) armar el camino del diagrama "tengo-quiero": elegir, entre
        cuatro, el producto correcto;
     2) hacer la cuenta y escribir la matriz que se busca.

   La notación es la del libro: M_{B₁B₂}(T), con el subíndice en la M,
   y P_{X→Y} para el cambio de base. La regla que sale del diagrama:
   si se tiene M_{XY}(T) y se la quiere en (X', Y'), entonces

     M_{X'Y'}(T) = P_{Y→Y'} · M_{XY}(T) · P_{X'→X}

   El producto se lee de DERECHA a IZQUIERDA: primero el cambio de
   base en V (que lleva de X' a X, para poder usar la matriz que se
   tiene), después la TL, y al final el cambio de base en W.

   LAS CUATRO OPCIONES de la fase 1 son las cuatro combinaciones de
   sentido de las dos flechas. Todas son válidas dimensionalmente, así
   que no se pueden descartar por el tamaño de las matrices: hay que
   leer el diagrama. Solo una es correcta.

   LA CUENTA de la fase 2 se mantiene chica a propósito, para que
   entre en un celular: V y W son R² o P₁(R) (matrices de 2×2) y las
   bases tienen determinante ±1, así que cada P —los vectores de la
   base en columna, o su inversa, como en el Ejemplo #1— sale entera y
   el resultado también. Como en el libro, la inversa aparece cuando la
   base de llegada del cambio no es la canónica.

   Los dos cambios de base son siempre reales (nunca X = X'), para
   que las cuatro opciones queden bien distintas. El caso en que una
   de las bases coincide y aparece la identidad —el Ejemplo #1 del
   libro— queda afuera por eso.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #5.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- álgebra de 2×2 ---------- */
  function producto(A, B) {
    return A.map(function (fila) {
      return B[0].map(function (_, j) {
        return fila.reduce(function (s, x, k) { return s + x * B[k][j]; }, 0);
      });
    });
  }
  function det2(M) { return M[0][0] * M[1][1] - M[0][1] * M[1][0]; }
  function inversa2(M) {
    // det = ±1, así que la inversa es entera
    var d = det2(M);
    return [[M[1][1] * d, -M[0][1] * d], [-M[1][0] * d, M[0][0] * d]];
  }
  function maxAbs(M) { return Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); })); }
  function iguales(A, B) { return JSON.stringify(A) === JSON.stringify(B); }

  /* Bases de 2 vectores con determinante ±1, que no sean la canónica
     ni una simple permutación o cambio de signo de ella. */
  var BASES = (function () {
    var out = [];
    for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++)
      for (var c = -2; c <= 2; c++) for (var d = -2; d <= 2; d++) {
        var det = a * d - b * c;
        if (det !== 1 && det !== -1) continue;
        var ceros = [a, b, c, d].filter(function (x) { return x === 0; }).length;
        if (ceros >= 2) continue;
        out.push([[a, b], [c, d]]);   // columnas = vectores de la base
      }
    return out;
  })();

  var ESPACIOS = {
    R2: { label: '\\mathbb{R}^2' },
    P1: { label: 'P_1(\\mathbb{R})' }
  };

  function generate() {
    var vKey = randChoice(['R2', 'P1']), wKey = randChoice(['R2', 'P1']);

    // Bases de V: E_1 (canónica) y B_1. Bases de W: E_2 y B_2.
    // Se sortea en cuáles está la matriz que se tiene.
    var tengoV = randChoice(['E_1', 'B_1']);
    var quieroV = tengoV === 'E_1' ? 'B_1' : 'E_1';
    var tengoW = randChoice(['E_2', 'B_2']);
    var quieroW = tengoW === 'E_2' ? 'B_2' : 'E_2';

    var B1, B2, M, Pv, Pw, R, intentos = 0;
    do {
      intentos++;
      B1 = randChoice(BASES);
      B2 = randChoice(BASES);
      M = [[randInt(-3, 3), randInt(-3, 3)], [randInt(-3, 3), randInt(-3, 3)]];
      // P_{quieroV → tengoV}: B₁→E₁ es B₁ en columnas; E₁→B₁, su inversa.
      Pv = quieroV === 'B_1' ? B1 : inversa2(B1);
      // P_{tengoW → quieroW}: B₂→E₂ es B₂ en columnas; E₂→B₂, su inversa.
      Pw = tengoW === 'B_2' ? B2 : inversa2(B2);
      R = producto(producto(Pw, M), Pv);
    } while ((maxAbs(M) === 0 || det2(M) === 0 && Math.random() < 0.7 ||
              maxAbs(R) === 0 || maxAbs(R) > 20 || iguales(R, M)) && intentos < 400);

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
      vKey: vKey, wKey: wKey,
      tengoV: tengoV, quieroV: quieroV, tengoW: tengoW, quieroW: quieroW,
      B1: B1, B2: B2, M: M, Pv: Pv, Pw: Pw, R: R,
      opciones: opciones,
      correcta: opciones.filter(function (o) { return o.correcta; })[0].value
    };
  }

  /* ---------- render ---------- */
  function flecha(par) { return 'P_{' + par[0] + ' \\to ' + par[1] + '}'; }
  function nombreM(v, w) { return 'M_{' + v + w + '}(T)'; }
  function productoLatex(cur, o) {
    return flecha(o.izq) + ' \\cdot ' + nombreM(cur.tengoV, cur.tengoW) + ' \\cdot ' + flecha(o.der);
  }
  function matrixLatex(M) {
    return '\\begin{pmatrix} ' + M.map(function (r) { return r.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
  }
  /* El j-ésimo vector de la base (columna j) como elemento del espacio. */
  function vectorLatex(key, B, j) {
    var a = B[0][j], b = B[1][j];
    if (key === 'R2') return '(' + a + ',\\ ' + b + ')';
    if (b === 0) return String(a);
    var xs = (Math.abs(b) === 1 ? '' : String(Math.abs(b))) + 'x';
    if (a === 0) return (b < 0 ? '-' : '') + xs;
    return a + (b < 0 ? ' - ' : ' + ') + xs;
  }
  function baseLatex(key, B, nombre) {
    return nombre + ' = \\{' + vectorLatex(key, B, 0) + ',\\ ' + vectorLatex(key, B, 1) + '\\}';
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
    var filas = [
      'T: ' + ESPACIOS[cur.vKey].label + ' \\to ' + ESPACIOS[cur.wKey].label,
      '\\text{tengo } \\ ' + nombreM(cur.tengoV, cur.tengoW) + ' = ' + matrixLatex(cur.M),
      baseLatex(cur.vKey, cur.B1, 'B_1'),
      baseLatex(cur.wKey, cur.B2, 'B_2'),
      '\\text{quiero } \\ ' + nombreM(cur.quieroV, cur.quieroW)
    ];
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">' +
        filas.map(function () { return '<div class="apt-rf" style="width:100%;text-align:center;"></div>'; }).join('') +
      '</div>';
    var r = container.querySelectorAll('.apt-rf');
    filas.forEach(function (tex, i) { window.katex.render(tex, r[i], { throwOnError: false }); ajustarAncho(r[i]); });
  }

  /* ---------- feedback, en texto plano ---------- */
  function sub(nombre) {
    // E_1 → E₁, B_2 → B₂, para el texto del feedback
    return nombre.replace('_1', '₁').replace('_2', '₂');
  }
  /* La matemática del feedback va renderizada con KaTeX (el feedback
     es HTML), para que se lea como en el libro: M_{E₁B₂}(T) con el
     subíndice en la M y las matrices con paréntesis. */
  function k(tex) { return window.katex.renderToString(tex, { throwOnError: false }); }
  function mK(v, w) { return k(nombreM(v, w)); }
  function pK(par) { return k(flecha(par)); }

  function porQue(cur) {
    return 'El producto se lee de derecha a izquierda. Primero hay que llevar las coordenadas de ' +
      sub(cur.quieroV) + ' a ' + sub(cur.tengoV) + ', que es la base en la que sirve la matriz que tenés: ' +
      'esa es la flecha ' + pK([cur.quieroV, cur.tengoV]) + ' y va a la derecha. ' +
      'Después se aplica ' + mK(cur.tengoV, cur.tengoW) + '. Y al final se pasa el resultado de ' +
      sub(cur.tengoW) + ' a ' + sub(cur.quieroW) +
      ', que es la flecha ' + pK([cur.tengoW, cur.quieroW]) + ' y va a la izquierda.';
  }

  function comoSeArma(origen, base) {
    // P hacia la canónica: la base en columnas. Desde la canónica: su inversa.
    return origen.charAt(0) === 'B'
      ? 'la matriz con los vectores de ' + sub(base) + ' en columna'
      : 'la inversa de la matriz con los vectores de ' + sub(base) + ' en columna';
  }
  function cuenta(cur) {
    var pW = flecha([cur.tengoW, cur.quieroW]);
    var pV = flecha([cur.quieroV, cur.tengoV]);
    return k(pV) + ' es ' + comoSeArma(cur.quieroV, 'B_1') + ': ' + k(pV + ' = ' + matrixLatex(cur.Pv)) + '. ' +
      k(pW) + ' es ' + comoSeArma(cur.tengoW, 'B_2') + ': ' + k(pW + ' = ' + matrixLatex(cur.Pw)) + '. Entonces ' +
      k(nombreM(cur.quieroV, cur.quieroW) + ' = ' + pW + ' \\cdot ' + nombreM(cur.tengoV, cur.tengoW) + ' \\cdot ' + pV) + ', o sea ' +
      k(matrixLatex(cur.Pw) + matrixLatex(cur.M) + matrixLatex(cur.Pv) + ' = ' + matrixLatex(cur.R)) + '.';
  }

  function checkCuenta(cur, S, hasEmpty) {
    if (hasEmpty) {
      return { correct: false, feedbackText: 'Dejaste alguna celda vacía. Si una entrada es 0, hay que escribirla.' };
    }
    var status = [], mal = 0;
    for (var r = 0; r < 2; r++) {
      status.push([]);
      for (var c = 0; c < 2; c++) {
        var ok = S[r][c] === cur.R[r][c];
        status[r].push(ok ? 'correct' : 'wrong');
        if (!ok) mal++;
      }
    }
    return {
      correct: mal === 0,
      cellStatus: status,
      feedbackText: (mal === 0 ? '' : 'Hay ' + mal + ' entrada' + (mal > 1 ? 's' : '') + ' en rojo. ') + cuenta(cur)
    };
  }

  function boot() {
    window.AptActivity.init({
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Cambio de base de M(T)',
      subtitle: 'Tenés la matriz asociada en unas bases y la querés en otras. Armá el camino y hacé la cuenta.',
      nextLabel: 'Probar con otro caso →',
      generate: generate,
      renderContent: renderContent,
      phases: [
        {
          mode: 'choices',
          question: '¿Cuál de estos productos da la matriz que querés?',
          choicesStacked: true,
          choices: function (cur) {
            return cur.opciones.map(function (o) {
              return { value: o.value, label: window.katex.renderToString(productoLatex(cur, o), { throwOnError: false }) };
            });
          },
          check: function (cur, value) { return value === cur.correcta; },
          explain: function (cur, correct) {
            return correct ? porQue(cur) : 'No es correcto. ' + porQue(cur);
          }
        },
        {
          mode: 'grid',
          question: 'Ahora hacé la cuenta: escribí la matriz que querés.',
          grid: { rows: 2, cols: 2, noDivider: true },
          checkGrid: checkCuenta,
          getAnswerGrid: function (cur) { return cur.R; },
          answerTitle: 'La respuesta correcta',
          answerText: 'Se arma cada P (la base en columnas si va hacia la canónica, su inversa si sale de la canónica) y se multiplica en el orden del diagrama.'
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
