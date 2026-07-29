/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 4
   "Dimensiones de núcleo e imagen"
   ------------------------------------------------------------
   Dada M(T) en bases canónicas, encontrar dim(Im(T)) y dim(Nu(T)).
   Dos fases encadenadas: primero la imagen (que es el rango de la
   matriz), después el núcleo — y el feedback las conecta con el
   teorema de la dimensión, que es el punto de la sección 4.5.

   El caso se construye "al revés": se decide el rango r de antemano,
   se arma la matriz con r filas pivote garantizadas y el resto en
   cero, y se mezcla con operaciones elementales de fila, que
   preservan el rango exactamente. Así el rango es un dato, no algo
   que haya que calcular y esperar que salga lindo.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #4.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }

  /* Espacios: mismo sorteo homogéneo que el resto de Unidad 3. */
  var SPACES = {
    R2:  { dim: 2, label: '\\mathbb{R}^2' },
    R3:  { dim: 3, label: '\\mathbb{R}^3' },
    P2:  { dim: 3, label: 'P_2(\\mathbb{R})' },
    M22: { dim: 4, label: 'M_{2\\times2}(\\mathbb{R})' }
  };
  var SPACE_KEYS = ['R2', 'R3', 'P2', 'M22'];

  /* ---------- generador: rango exacto por construcción ---------- */
  function buildWithRank(rows, cols, r) {
    // r filas pivote escalonadas + filas nulas
    var pivotCols = [], last = -1;
    for (var i = 0; i < r; i++) {
      var restantes = cols - last - 1 - (r - i - 1);
      var col = randInt(last + 1, last + restantes);
      pivotCols.push(col); last = col;
    }
    var M = [];
    for (var i2 = 0; i2 < r; i2++) {
      var row = new Array(cols).fill(0);
      row[pivotCols[i2]] = randNonZero(-4, 4);
      for (var c = pivotCols[i2] + 1; c < cols; c++) row[c] = randInt(-3, 3);
      M.push(row);
    }
    for (var z = r; z < rows; z++) M.push(new Array(cols).fill(0));

    // mezcla con operaciones elementales de fila: preservan el rango
    for (var op = 0, ops = randInt(3, 6); op < ops; op++) {
      var kind = rows < 2 ? 'scale' : randChoice(['swap', 'add', 'add', 'scale']);
      if (kind === 'swap') {
        var a = randInt(0, rows - 1), b = randInt(0, rows - 1);
        while (b === a) b = randInt(0, rows - 1);
        var t = M[a]; M[a] = M[b]; M[b] = t;
      } else if (kind === 'add') {
        var i3 = randInt(0, rows - 1), j3 = randInt(0, rows - 1);
        while (j3 === i3) j3 = randInt(0, rows - 1);
        var k = randChoice([-2, -1, 1, 2]);
        M[j3] = M[j3].map(function (v, c2) { return v + k * M[i3][c2]; });
      } else {
        var s = randInt(0, rows - 1);
        // El escalar se elige UNA vez para toda la fila. Si se sortea
        // dentro del map, cada entrada se multiplica por algo distinto
        // y la operación deja de preservar el rango.
        var f = randChoice([-1, 1, -1, 1, 2]);
        M[s] = M[s].map(function (v) { return v * f; });
      }
    }
    return M;
  }

  function generate() {
    var vKey, wKey, n, m, r, A, intentos = 0;
    do {
      vKey = randChoice(SPACE_KEYS);
      wKey = randChoice(SPACE_KEYS);
      n = SPACES[vKey].dim;   // columnas de M(T) = dim V
      m = SPACES[wKey].dim;   // filas de M(T)    = dim W
      r = randInt(1, Math.min(n, m));
      A = buildWithRank(m, n, r);
      intentos++;
    } while (Math.max.apply(null, A.map(function (row) {
      return Math.max.apply(null, row.map(Math.abs));
    })) > 30 && intentos < 40);

    return {
      vKey: vKey, wKey: wKey, n: n, m: m, r: r, A: A,
      dimIm: r,
      dimNu: n - r,
      opcionesIm: opciones(r, 0, Math.min(n, m)),
      opcionesNu: opciones(n - r, 0, n)
    };
  }

  /* Opciones alrededor de la respuesta, ordenadas — más prolijo que
     mezcladas, y no delata nada porque la correcta no queda fija. */
  function opciones(correcta, min, max) {
    var cands = [correcta];
    [-2, -1, 1, 2, 3].forEach(function (d) {
      var v = correcta + d;
      if (cands.length < 4 && v >= min && v <= max && cands.indexOf(v) === -1) cands.push(v);
    });
    var relleno = min;
    while (cands.length < Math.min(4, max - min + 1) && relleno <= max) {
      if (relleno !== correcta && cands.indexOf(relleno) === -1) cands.push(relleno);
      relleno++;
    }
    return cands.slice(0, 4).sort(function (a, b) { return a - b; });
  }

  /* ---------- render ---------- */
  function matrixLatex(M) {
    return '\\begin{pmatrix} ' +
      M.map(function (row) { return row.join(' & '); }).join(' \\\\ ') +
      ' \\end{pmatrix}';
  }

  function renderContent(container, cur) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;">' +
        '<div class="apt-row-head" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-row-mat" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var head = container.querySelector('.apt-row-head');
    var mat = container.querySelector('.apt-row-mat');
    window.katex.render('T: ' + SPACES[cur.vKey].label + ' \\to ' + SPACES[cur.wKey].label, head, { throwOnError: false });
    window.katex.render('M(T) = ' + matrixLatex(cur.A), mat, { throwOnError: false });
    ajustarAncho(head);
    ajustarAncho(mat);
  }

  /* Red de seguridad de ancho, igual que en las otras de Unidad 3.
     Nada de overflow-x:auto sobre KaTeX: arrastra el eje vertical. */
  function ajustarAncho(rowEl) {
    var k = rowEl.querySelector('.katex');
    if (!k) return;
    rowEl.style.fontSize = '';
    var disp = rowEl.clientWidth, ancho = k.getBoundingClientRect().width;
    if (!disp || !ancho || ancho <= disp) return;
    rowEl.style.fontSize = (Math.max(0.68, disp / ancho) * 100).toFixed(1) + '%';
  }

  /* ---------- arranque ---------- */
  function boot() {
    window.AptActivity.init({
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Núcleo e imagen',
      subtitle: 'Mirá la matriz asociada y encontrá las dimensiones de la imagen y del núcleo de $T$.',
      nextLabel: 'Probar con otra transformación →',
      generate: generate,
      renderContent: renderContent,
      phases: [
        {
          mode: 'choices',
          question: '¿Cuál es dim(Im(T))?',
          choicesStacked: false,
          choices: function (cur) {
            return cur.opcionesIm.map(function (v) { return { value: String(v), label: String(v) }; });
          },
          check: function (cur, value) { return Number(value) === cur.dimIm; },
          explain: function (cur, correct) {
            var base = 'La imagen está generada por las columnas de M(T), así que dim(Im(T)) es el rango de la matriz: ' + cur.dimIm + '.';
            return correct ? base : 'No es correcto. ' + base;
          }
        },
        {
          mode: 'choices',
          question: '¿Y cuál es dim(Nu(T))?',
          choicesStacked: false,
          choices: function (cur) {
            return cur.opcionesNu.map(function (v) { return { value: String(v), label: String(v) }; });
          },
          check: function (cur, value) { return Number(value) === cur.dimNu; },
          explain: function (cur, correct) {
            var base = 'Por el teorema de la dimensión, dim(Nu(T)) + dim(Im(T)) = dim(V): ' +
              cur.dimNu + ' + ' + cur.dimIm + ' = ' + cur.n + '. ' +
              'Sabiendo el rango no hace falta calcular el núcleo aparte.';
            return correct ? base : 'No es correcto. ' + base;
          }
        }
      ]
    });
  }

  if (window.AptActivity && typeof window.AptActivity.init === 'function') { boot(); }
  else {
    var intentos2 = 0;
    var esperar = setInterval(function () {
      intentos2++;
      if (window.AptActivity && typeof window.AptActivity.init === 'function') { clearInterval(esperar); boot(); }
      else if (intentos2 > 200) { clearInterval(esperar); }
    }, 25);
  }
})();
