/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 11
   "Base de la imagen y del núcleo"
   ------------------------------------------------------------
   Sección 4.5. Dada M(T), escribir una base de Im(T) o de Nu(T).
   Cada ronda pide una de las dos.

   RESPUESTA NO ÚNICA: cualquier base del mismo subespacio vale. Se
   usa el sub-modo 'space-basis' del engine, que compara por
   equivalencia de subespacios generados (checkSpanEquivalence) y no
   contra una respuesta fija. Es la misma maquinaria que usan "Base
   de un SEV" y "Complemento ortogonal" en Unidad 2, ya probada.

   Por eso mismo los vectores se escriben con el widget del engine,
   que dibuja los de Rⁿ en COLUMNA — igual que en Unidad 2, y a
   diferencia de las otras actividades de Unidad 3, que los muestran
   como tuplas en fila. La ventaja es que ese widget sabe pedir
   elementos de P₂ y de M₂ₓ₂ correctamente, cosa que una grilla de
   números sueltos no haría.

   NO HACE FALTA EL GRID DECIMAL: la base de la imagen son columnas
   de M(T), que ya son enteras; y la del núcleo sale de la RREF y se
   escala a enteros con fracRowToIntRow.

   Fase 1 pregunta CUÁNTOS vectores tiene la base, para que la
   cantidad de casillas de la fase 2 no regale la dimensión.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #11.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }

  /* ---------- matriz de rango exacto ---------- */
  function escalonadaConRango(rows, cols, r) {
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
    return M;
  }
  /* Solo operaciones de FILA: preservan el rango y el núcleo. */
  function mezclarFilas(M, rows) {
    var out = M.map(function (r) { return r.slice(); });
    for (var op = 0, ops = randInt(3, 6); op < ops; op++) {
      var kind = rows < 2 ? 'scale' : randChoice(['swap', 'add', 'add', 'scale']);
      if (kind === 'swap') {
        var a = randInt(0, rows - 1), b = randInt(0, rows - 1);
        while (b === a) b = randInt(0, rows - 1);
        var t = out[a]; out[a] = out[b]; out[b] = t;
      } else if (kind === 'add') {
        var i = randInt(0, rows - 1), j = randInt(0, rows - 1);
        while (j === i) j = randInt(0, rows - 1);
        var k = randChoice([-2, -1, 1, 2]);
        out[j] = out[j].map(function (v, c) { return v + k * out[i][c]; });
      } else {
        var s = randInt(0, rows - 1);
        var f = randChoice([-1, 1, -1, 1, 2]);
        out[s] = out[s].map(function (v) { return v * f; });
      }
    }
    return out;
  }
  function maxAbs(M) { return Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); })); }

  /* ---------- bases, con las herramientas exactas del engine ---------- */
  function columnasPivote(A) {
    var F = window.AptActivity.Frac;
    var n = A[0].length;
    var R = F.rref(F.intMatrixToFrac(A));
    var cols = [];
    R.forEach(function (row) {
      for (var c = 0; c < n; c++) { if (!F.fIsZero(row[c])) { cols.push(c); break; } }
    });
    return cols;
  }
  /* Base de la imagen: las columnas de la matriz ORIGINAL que
     corresponden a las columnas pivote. Son enteras. */
  function baseDeLaImagen(A) {
    return columnasPivote(A).map(function (c) {
      return A.map(function (row) { return row[c]; });
    });
  }
  /* Base del núcleo: variables libres sobre la RREF, escalada a enteros. */
  function baseDelNucleo(A) {
    var F = window.AptActivity.Frac;
    var n = A[0].length;
    var R = F.rref(F.intMatrixToFrac(A));
    var pivotDeFila = [], esPivote = {};
    R.forEach(function (row) {
      for (var c = 0; c < n; c++) {
        if (!F.fIsZero(row[c])) { pivotDeFila.push(c); esPivote[c] = true; break; }
      }
    });
    var libres = [];
    for (var c2 = 0; c2 < n; c2++) if (!esPivote[c2]) libres.push(c2);
    return libres.map(function (libre) {
      var vec = new Array(n).fill(0).map(function () { return F.Frac(0); });
      vec[libre] = F.Frac(1);
      for (var ri = 0; ri < pivotDeFila.length; ri++) {
        vec[pivotDeFila[ri]] = F.fSub(F.Frac(0), R[ri][libre]);
      }
      return F.fracRowToIntRow(vec);
    });
  }

  /* ---------- generador ---------- */
  function espaciosDelEngine() {
    var S = window.AptActivity.SPACES;
    return [S.R2, S.R3, S.P2, S.M2x2].filter(Boolean);
  }

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

  function generate() {
    var pool = espaciosDelEngine();
    var espV, espW, n, m, r, A, pide, base, intentos = 0;

    do {
      intentos++;
      espV = randChoice(pool);
      espW = randChoice(pool);
      n = espV.dim; m = espW.dim;
      pide = randChoice(['imagen', 'nucleo']);

      // tope de 3 vectores por UX en celular
      if (pide === 'imagen') r = randInt(1, Math.min(3, n, m));
      else r = randInt(Math.max(1, n - 3), n - 1);   // dim Nu = n - r, entre 1 y 3
      if (r < 1 || r > Math.min(n, m)) continue;
      if (pide === 'nucleo' && (n - r < 1 || n - r > 3)) continue;

      A = mezclarFilas(escalonadaConRango(m, n, r), m);
      if (maxAbs(A) > 20) continue;

      // el rango real tiene que coincidir con el pedido
      if (window.AptActivity.Frac.rankOf(window.AptActivity.Frac.intMatrixToFrac(A)) !== r) continue;

      base = pide === 'imagen' ? baseDeLaImagen(A) : baseDelNucleo(A);
      if (base.length !== (pide === 'imagen' ? r : n - r)) continue;
      if (base.some(function (v) { return Math.max.apply(null, v.map(Math.abs)) > 20; })) continue;
      break;
    } while (intentos < 300);

    var espacioBase = pide === 'imagen' ? espW : espV;
    return {
      espV: espV, espW: espW, n: n, m: m, r: r, A: A,
      pide: pide,
      espacioBase: espacioBase,
      k: base.length,
      baseCoords: base,
      baseNativa: base.map(function (v) { return espacioBase.fromCoords(v); }),
      opcionesK: opciones(base.length, 1, espacioBase.dim)
    };
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
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">' +
        '<div class="apt-r1" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r2" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r3" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r1 = container.querySelector('.apt-r1');
    var r2 = container.querySelector('.apt-r2');
    var r3 = container.querySelector('.apt-r3');
    window.katex.render('T: ' + cur.espV.labelTex + ' \\to ' + cur.espW.labelTex, r1, { throwOnError: false });
    window.katex.render('M(T) = ' + matrixLatex(cur.A), r2, { throwOnError: false });
    // Qué subespacio se pide va ACÁ y no en phase.question: el engine
    // exige que question sea un string, no una función.
    window.katex.render('\\text{Buscamos una base de } ' + (cur.pide === 'imagen' ? 'Im(T)' : 'Nu(T)'),
      r3, { throwOnError: false });
    [r1, r2, r3].forEach(ajustarAncho);
  }

  function nombreConjunto(cur) { return cur.pide === 'imagen' ? 'Im(T)' : 'Nu(T)'; }

  function boot() {
    window.AptActivity.init({
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Base de la imagen y del núcleo',
      subtitle: 'Mirá la matriz asociada y encontrá una base del subespacio que se te pide. Cualquier base válida sirve.',
      nextLabel: 'Probar con otro caso →',
      generate: generate,
      renderContent: renderContent,
      phases: [
        {
          mode: 'choices',
          question: '¿Cuántos vectores tiene esa base?',
          choicesStacked: false,
          choices: function (cur) {
            return cur.opcionesK.map(function (v) { return { value: String(v), label: String(v) }; });
          },
          check: function (cur, value) { return Number(value) === cur.k; },
          explain: function (cur, correct) {
            var base = cur.pide === 'imagen'
              ? 'dim(Im(T)) es el rango de M(T), que es ' + cur.r + '.'
              : 'dim(Nu(T)) = dim(V) − rango = ' + cur.n + ' − ' + cur.r + ' = ' + cur.k + '.';
            return correct ? base : 'No es correcto. ' + base;
          }
        },
        {
          mode: 'space-basis',
          question: 'Escribí una base de ese subespacio (no hace falta que coincida con una en particular).',
          count: function (cur) { return cur.k; },
          space: function (cur) { return cur.espacioBase; },
          getExpectedBasis: function (cur) { return cur.baseNativa; },
          explain: function (cur, correct) {
            var comoSale = cur.pide === 'imagen'
              ? 'La imagen está generada por las columnas de M(T): alcanza con quedarse con las columnas independientes.'
              : 'El núcleo son las soluciones de M(T)·v = 0: se resuelve el sistema homogéneo y cada variable libre da un vector de la base.';
            return correct ? comoSale : 'No es correcto. ' + comoSale;
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
