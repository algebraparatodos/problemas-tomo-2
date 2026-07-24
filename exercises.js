/* ============================================================
   ÁLGEBRA PARA TODOS · exercises.js (v1.0)
   ------------------------------------------------------------
   Registro compartido de la lógica PURA de cada ejercicio:
   generar un caso, armar su contenido, chequear una respuesta,
   explicarla. Cero UI, cero DOM más allá de lo que renderContent
   necesita para dibujar el enunciado — nada de footer, sonido,
   botones de siguiente/reintentar, etc. Eso es responsabilidad
   de quien lo use (la landing individual con engine.js, o el
   modo examen con exam.js).

   Cada entrada del registro:
     id        — identificador único, estable (no cambiar una vez
                 publicado: el modo examen podría referenciarlo)
     title     — título tal como aparece en el catálogo
     unit      — "Unidad 1: Matrices y SEL", etc.
     topic     — sub-tema para agrupar en el selector del examen
                 (ej. "Escalonamiento / Método de Gauss")
     needsKatex — bool
     type      — 'choices' | 'grid' (determina qué campos siguen)

     generate() → current
     renderContent(container, current) → dibuja el enunciado

     -- si type es 'choices' --
     choices(current) → [{value, label, sub?}]
     check(current, value) → bool
     explain(current, correct, value) → string

     -- si type es 'grid' --
     grid { rows, cols, dividerAfterCol? }
     checkGrid(current, studentMatrix, hasEmpty) → { correct, cellStatus?, feedbackText }
     getAnswerGrid(current) → matrix (respuesta correcta completa)
   ============================================================ */
(function (global) {
  'use strict';

  var EXERCISES = [];

  /* ============================================================
     1) Clasificá el sistema (rectas) — mode:'choices', sin KaTeX
     ============================================================ */
  (function () {
    var RANGE = 5, SIZE = 300;
    var SLOPES = [-2, -1, -0.5, 0, 0.5, 1, 2];
    var LINE_COLORS = ['#97A1D8', '#E8B85C', '#7FD1C5'];

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

    function generateCase(numLines) {
      var category = randChoice(['SCD', 'SCI', 'SI']);
      var lines = [];
      if (numLines === 2) {
        if (category === 'SCD') {
          var m1 = randChoice(SLOPES);
          var m2 = randChoice(SLOPES.filter(function (s) { return s !== m1; }));
          lines = [{ m: m1, b: randInt(-3, 3) }, { m: m2, b: randInt(-3, 3) }];
        } else if (category === 'SCI') {
          var m = randChoice(SLOPES), b = randInt(-3, 3);
          lines = [{ m: m, b: b }, { m: m, b: b }];
        } else {
          var m3 = randChoice(SLOPES);
          var b1 = randInt(-3, 3), b2 = randInt(-3, 3);
          while (b2 === b1) b2 = randInt(-3, 3);
          lines = [{ m: m3, b: b1 }, { m: m3, b: b2 }];
        }
      } else {
        if (category === 'SCD') {
          var x0 = randInt(-2, 2), y0 = randInt(-2, 2);
          var slopes = shuffle(SLOPES).slice(0, 3);
          lines = slopes.map(function (mm) { return { m: mm, b: y0 - mm * x0 }; });
        } else if (category === 'SCI') {
          var m4 = randChoice(SLOPES), b4 = randInt(-3, 3);
          lines = [{ m: m4, b: b4 }, { m: m4, b: b4 }, { m: m4, b: b4 }];
        } else {
          var m5 = randChoice(SLOPES);
          var c1 = randInt(-3, 3), c2 = randInt(-3, 3);
          while (c2 === c1) c2 = randInt(-3, 3);
          var m6 = randChoice(SLOPES.filter(function (s) { return s !== m5; }));
          var c3 = randInt(-3, 3);
          lines = shuffle([{ m: m5, b: c1 }, { m: m5, b: c2 }, { m: m6, b: c3 }]);
        }
      }
      return { category: category, lines: lines };
    }

    function toX(x) { return (x + RANGE) / (2 * RANGE) * SIZE; }
    function toY(y) { return SIZE - (y + RANGE) / (2 * RANGE) * SIZE; }

    function lineSegment(m, b) {
      var pts = [];
      function push(x, y) { if (x >= -RANGE - 1e-9 && x <= RANGE + 1e-9 && y >= -RANGE - 1e-9 && y <= RANGE + 1e-9) pts.push([x, y]); }
      push(-RANGE, m * -RANGE + b);
      push(RANGE, m * RANGE + b);
      if (m !== 0) {
        push((-RANGE - b) / m, -RANGE);
        push((RANGE - b) / m, RANGE);
      }
      var uniq = [];
      pts.forEach(function (p) {
        if (!uniq.some(function (u) { return Math.abs(u[0] - p[0]) < 1e-6 && Math.abs(u[1] - p[1]) < 1e-6; })) uniq.push(p);
      });
      if (uniq.length < 2) return null;
      return [uniq[0], uniq[uniq.length - 1]];
    }

    function buildGraphSVG(lines, highlightPoint) {
      var svg = '<svg viewBox="0 0 ' + SIZE + ' ' + SIZE + '" xmlns="http://www.w3.org/2000/svg">';
      for (var i = -RANGE; i <= RANGE; i++) {
        var isAxis = i === 0;
        var stroke = isAxis ? 'rgba(151,161,216,0.55)' : 'rgba(151,161,216,0.16)';
        var w = isAxis ? 1.5 : 1;
        svg += '<line x1="' + toX(i) + '" y1="0" x2="' + toX(i) + '" y2="' + SIZE + '" stroke="' + stroke + '" stroke-width="' + w + '"/>';
        svg += '<line x1="0" y1="' + toY(i) + '" x2="' + SIZE + '" y2="' + toY(i) + '" stroke="' + stroke + '" stroke-width="' + w + '"/>';
      }
      var groups = [];
      lines.forEach(function (line, idx) {
        var g = groups.filter(function (gg) { return Math.abs(gg.m - line.m) < 1e-9 && Math.abs(gg.b - line.b) < 1e-9; })[0];
        if (g) g.indices.push(idx); else groups.push({ m: line.m, b: line.b, indices: [idx] });
      });
      groups.forEach(function (g) {
        var seg = lineSegment(g.m, g.b);
        if (!seg) return;
        var x1 = toX(seg[0][0]), y1 = toY(seg[0][1]), x2 = toX(seg[1][0]), y2 = toY(seg[1][1]);
        var colors = g.indices.map(function (idx) { return LINE_COLORS[idx % LINE_COLORS.length]; });
        if (colors.length === 1) {
          svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + colors[0] + '" stroke-width="3.2" stroke-linecap="round" opacity="0.95"/>';
        } else {
          var unit = 9, n = colors.length;
          colors.forEach(function (color, k) {
            svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="3.8" stroke-linecap="butt" stroke-dasharray="' + unit + ' ' + ((n - 1) * unit) + '" stroke-dashoffset="' + (-k * unit) + '" opacity="0.95"/>';
          });
        }
      });
      if (highlightPoint) {
        svg += '<circle cx="' + toX(highlightPoint[0]) + '" cy="' + toY(highlightPoint[1]) + '" r="6.5" fill="#0A0A0D" stroke="#5BCD9A" stroke-width="3"/>';
      }
      svg += '</svg>';
      return svg;
    }

    function findCommonPoint(lines) {
      for (var i = 0; i < lines.length; i++) {
        for (var j = i + 1; j < lines.length; j++) {
          if (lines[i].m !== lines[j].m) {
            var x = (lines[j].b - lines[i].b) / (lines[i].m - lines[j].m);
            var y = lines[i].m * x + lines[i].b;
            return [x, y];
          }
        }
      }
      return null;
    }

    EXERCISES.push({
      id: 'clasifica-sistema',
      title: 'Clasificá el sistema',
      unit: 'Unidad 1: Matrices y SEL',
      topic: 'Clasificación de sistemas',
      needsKatex: false,
      type: 'choices',
      prompt: '¿Cómo se clasifica este sistema de rectas?',

      generate: function () {
        var numLines = Math.random() < 0.5 ? 2 : 3;
        return generateCase(numLines);
      },
      renderContent: function (container, current) {
        container.innerHTML = '<div style="width:100%;max-width:280px;aspect-ratio:1/1;margin:0 auto;">' + buildGraphSVG(current.lines, null) + '</div>';
      },
      choices: function () {
        return [
          { value: 'SCD', label: 'SCD', sub: 'Compatible determinado' },
          { value: 'SCI', label: 'SCI', sub: 'Compatible indeterminado' },
          { value: 'SI', label: 'SI', sub: 'Incompatible' }
        ];
      },
      check: function (current, value) { return value === current.category; },
      explain: function (current, correct) {
        var category = current.category, n = current.lines.length, msg;
        if (category === 'SCD') msg = 'Las rectas se cruzan en un único punto: el sistema tiene exactamente una solución (SCD).';
        else if (category === 'SCI') msg = 'Las ' + n + ' rectas coinciden exactamente, así que el sistema tiene infinitas soluciones (SCI).';
        else if (n === 2) msg = 'Las dos rectas son paralelas (misma pendiente): nunca se cruzan, por eso el sistema no tiene solución (SI).';
        else msg = 'Dos de las tres rectas son paralelas (misma pendiente): nunca se cruzan, por eso el sistema no tiene solución (SI), sin importar dónde esté la tercera.';
        return (correct ? '' : 'No es correcto. ') + msg;
      }
    });
  })();

  /* ============================================================
     2) ¿Es escalonada? — mode:'choices', con KaTeX
     ============================================================ */
  (function () {
    var ROWS = 3, COLS = 4;

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function pivotOf(row) {
      for (var c = 0; c < COLS; c++) if (row[c] !== 0) return c;
      return null;
    }

    function buildValidEchelon() {
      var rows = [];
      var lastPivot = -1;
      for (var r = 0; r < ROWS; r++) {
        if (lastPivot >= COLS - 1 || Math.random() < 0.15) {
          rows.push(new Array(COLS).fill(0));
          continue;
        }
        var pivotCol = randInt(lastPivot + 1, COLS - 1);
        var row = new Array(COLS).fill(0);
        for (var c = pivotCol; c < COLS; c++) {
          row[c] = c === pivotCol ? randInt(1, 9) * (Math.random() < 0.5 ? -1 : 1) : randInt(-9, 9);
        }
        rows.push(row);
        lastPivot = pivotCol;
      }
      return rows;
    }

    function breakEchelon(rows) {
      var kind = Math.random() < 0.5 ? 'zero-not-last' : 'pivot-not-increasing';
      var r = rows.map(function (row) { return row.slice(); });
      if (kind === 'zero-not-last') {
        var zeroIdx = randInt(0, ROWS - 2);
        r[zeroIdx] = new Array(COLS).fill(0);
        if (r[zeroIdx + 1].every(function (v) { return v === 0; })) {
          r[zeroIdx + 1][randInt(0, COLS - 1)] = randInt(1, 9);
        }
        return r;
      }
      var idx = randInt(1, ROWS - 1);
      var prevPivot = pivotOf(r[idx - 1]);
      var col = (prevPivot === null) ? 0 : randInt(0, prevPivot);
      r[idx] = new Array(COLS).fill(0);
      for (var c = col; c < COLS; c++) r[idx][c] = c === col ? randInt(1, 9) : randInt(-9, 9);
      return r;
    }

    function checkEchelon(rows) {
      var lastPivot = -1, sawZero = false;
      for (var i = 0; i < rows.length; i++) {
        var p = pivotOf(rows[i]);
        if (p === null) { sawZero = true; continue; }
        if (sawZero) return { ok: false, reason: 'zero-not-last', badRow: i };
        if (p <= lastPivot) return { ok: false, reason: 'pivot-not-increasing', badRow: i, refRow: i - 1 };
        lastPivot = p;
      }
      return { ok: true };
    }

    function plainLatex(rows) {
      return '\\begin{bmatrix} ' + rows.map(function (r) { return r.join(' & '); }).join(' \\\\ ') + ' \\end{bmatrix}';
    }

    function explainVerdict(v) {
      if (v.ok) return 'Es escalonada: cada fila no nula empieza más a la derecha que la anterior, y las filas nulas están al final.';
      if (v.reason === 'zero-not-last') return 'No es escalonada: la fila ' + (v.badRow + 1) + ' es no nula pero aparece después de una fila nula.';
      return 'No es escalonada: el primer elemento no nulo de la fila ' + (v.badRow + 1) + ' no está estrictamente a la derecha del de la fila ' + (v.refRow + 1) + '.';
    }

    EXERCISES.push({
      id: 'es-escalonada',
      title: '¿Es escalonada?',
      unit: 'Unidad 1: Matrices y SEL',
      topic: 'Escalonamiento / Método de Gauss',
      needsKatex: true,
      type: 'choices',
      prompt: '¿Está la matriz en forma escalonada por filas?',

      generate: function () {
        var rows = Math.random() < 0.45 ? buildValidEchelon() : breakEchelon(buildValidEchelon());
        return { matrix: rows, verdict: checkEchelon(rows) };
      },
      renderContent: function (container, current) {
        global.katex.render(plainLatex(current.matrix), container, { throwOnError: false });
      },
      choices: function () {
        return [
          { value: 'si', label: 'Sí, es escalonada' },
          { value: 'no', label: 'No, no es escalonada' }
        ];
      },
      check: function (current, value) { return (value === 'si') === current.verdict.ok; },
      explain: function (current, correct) {
        return (correct ? '' : 'No es correcto. ') + explainVerdict(current.verdict);
      }
    });
  })();

  /* ============================================================
     3) Matriz ampliada — mode:'grid', con KaTeX
     ============================================================ */
  (function () {
    var ROWS = 3;
    var VARS = ['x', 'y', 'z'];

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function coeff() {
      if (Math.random() < 0.22) return 0;
      var v = randInt(-9, 9);
      while (v === 0) v = randInt(-9, 9);
      return v;
    }

    function generateSystem() {
      var A;
      do {
        A = [];
        for (var r = 0; r < ROWS; r++) A.push([coeff(), coeff(), coeff()]);
      } while (A.some(function (row) { return row.every(function (v) { return v === 0; }); }));
      var b = [randInt(-9, 9), randInt(-9, 9), randInt(-9, 9)];
      return { A: A, b: b };
    }

    function termsToLatex(rowCoeffs) {
      var parts = [];
      rowCoeffs.forEach(function (c, i) {
        if (c === 0) return;
        var v = VARS[i], abs = Math.abs(c), coefStr = abs === 1 ? '' : String(abs);
        if (parts.length === 0) parts.push((c < 0 ? '-' : '') + coefStr + v);
        else parts.push((c < 0 ? ' - ' : ' + ') + coefStr + v);
      });
      return parts.length ? parts.join('') : '0';
    }

    function systemLatex(A, b) {
      var rows = A.map(function (row, i) { return termsToLatex(row) + ' = ' + b[i]; });
      return '\\begin{cases} ' + rows.join(' \\\\ ') + ' \\end{cases}';
    }

    EXERCISES.push({
      id: 'matriz-ampliada',
      title: 'Matriz ampliada',
      unit: 'Unidad 1: Matrices y SEL',
      topic: 'Matrices y sistemas',
      needsKatex: true,
      type: 'grid',
      prompt: 'Completá la matriz ampliada de este sistema.',
      grid: { rows: 3, cols: 4, dividerAfterCol: 3 },

      generate: function () { return generateSystem(); },
      renderContent: function (container, current) {
        global.katex.render(systemLatex(current.A, current.b), container, { throwOnError: false });
      },
      checkGrid: function (current, M, hasEmpty) {
        var cellStatus = [[], [], []];
        var allOk = !hasEmpty;
        for (var r = 0; r < ROWS; r++) {
          for (var c = 0; c < 4; c++) {
            var correctVal = c < 3 ? current.A[r][c] : current.b[r];
            var ok = M[r][c] === correctVal;
            if (!ok) allOk = false;
            cellStatus[r][c] = ok ? 'correct' : 'wrong';
          }
        }
        var feedbackText = allOk
          ? 'Correcto: cada fila son los coeficientes de x, y, z (en ese orden) y, después de la barra, el término independiente.'
          : (hasEmpty ? 'Dejaste alguna celda vacía.' : 'Alguna celda no coincide con los coeficientes o el término independiente del sistema.');
        return { correct: allOk, cellStatus: cellStatus, feedbackText: feedbackText };
      },
      getAnswerGrid: function (current) {
        return current.A.map(function (row, r) { return row.concat([current.b[r]]); });
      }
    });
  })();

  /* ============================================================
     4) Aplicá el método de eliminación de Gauss — mode:'grid', con
     KaTeX. Respuesta NO única: cualquier forma escalonada
     equivalente por filas a la original es válida.
     ============================================================ */
  (function () {
    var ROWS = 3, COLS = 4;
    var PIVOT_SETS = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
    function Frac(n, d) {
      if (d === undefined) d = 1;
      if (d < 0) { n = -n; d = -d; }
      var g = gcd(n, d);
      return { n: g ? n / g : 0, d: g ? d / g : 1 };
    }
    function fAdd(a, b) { return Frac(a.n * b.d + b.n * a.d, a.d * b.d); }
    function fSub(a, b) { return Frac(a.n * b.d - b.n * a.d, a.d * b.d); }
    function fMul(a, b) { return Frac(a.n * b.n, a.d * b.d); }
    function fDiv(a, b) { return Frac(a.n * b.d, a.d * b.n); }
    function fIsZero(a) { return a.n === 0; }
    function fromInt(x) { return Frac(x, 1); }
    function intMatrixToFrac(M) { return M.map(function (row) { return row.map(fromInt); }); }

    function rref(matrixOfFrac) {
      var M = matrixOfFrac.map(function (r) { return r.slice(); });
      var rows = M.length, cols = M[0].length, lead = 0;
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
            if (!fIsZero(factor)) M[i2] = M[i2].map(function (v, c) { return fSub(v, fMul(factor, M[r][c])); });
          }
        }
        lead++;
      }
      return M;
    }
    function rrefEqual(A, B) {
      for (var r = 0; r < A.length; r++) for (var c = 0; c < A[0].length; c++) if (A[r][c].n !== B[r][c].n || A[r][c].d !== B[r][c].d) return false;
      return true;
    }
    function rankOf(fracMatrix) {
      var R = rref(fracMatrix);
      return R.filter(function (row) { return row.some(function (v) { return !fIsZero(v); }); }).length;
    }

    function referenceEchelon(intMatrix) {
      var M = intMatrixToFrac(intMatrix);
      var rows = M.length, cols = M[0].length, r = 0;
      for (var c = 0; c < cols && r < rows; c++) {
        var piv = -1;
        for (var i = r; i < rows; i++) { if (!fIsZero(M[i][c])) { piv = i; break; } }
        if (piv === -1) continue;
        var tmp = M[r]; M[r] = M[piv]; M[piv] = tmp;
        for (var i2 = r + 1; i2 < rows; i2++) {
          if (!fIsZero(M[i2][c])) {
            var factor = fDiv(M[i2][c], M[r][c]);
            M[i2] = M[i2].map(function (v, k) { return fSub(v, fMul(factor, M[r][k])); });
          }
        }
        r++;
      }
      function gcdInt(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
      function lcmInt(a, b) { return Math.abs(a * b) / gcdInt(a, b); }
      return M.map(function (row) {
        var denomLcm = 1;
        row.forEach(function (v) { denomLcm = lcmInt(denomLcm, v.d); });
        var intRow = row.map(function (v) { return Math.round(v.n * (denomLcm / v.d)); });
        var nz = intRow.filter(function (x) { return x !== 0; }).map(Math.abs);
        if (nz.length) {
          var g = nz[0];
          nz.forEach(function (x) { g = gcdInt(g, x); });
          intRow = intRow.map(function (x) { return x / g; });
        }
        return intRow;
      });
    }

    function rowIsValidCombination(originalIntMatrix, candidateRow) {
      var baseRank = rankOf(intMatrixToFrac(originalIntMatrix));
      var augmented = originalIntMatrix.map(function (r) { return r.slice(); });
      augmented.push(candidateRow);
      var augRank = rankOf(intMatrixToFrac(augmented));
      return augRank === baseRank;
    }

    function pivotOf(row) {
      for (var c = 0; c < row.length; c++) if (row[c] !== 0) return c;
      return null;
    }
    function isEchelonForm(intMatrix) {
      var lastPivot = -1, sawZero = false;
      for (var r = 0; r < intMatrix.length; r++) {
        var p = pivotOf(intMatrix[r]);
        if (p === null) { sawZero = true; continue; }
        if (sawZero) return { ok: false, reason: 'zero-not-last', row: r };
        if (p <= lastPivot) return { ok: false, reason: 'pivot-not-increasing', row: r };
        lastPivot = p;
      }
      return { ok: true };
    }
    function checkAnswer(originalIntMatrix, studentIntMatrix) {
      var struct = isEchelonForm(studentIntMatrix);
      if (!struct.ok) return { ok: false, reason: 'not-echelon', struct: struct };
      var rrefOriginal = rref(intMatrixToFrac(originalIntMatrix));
      var rrefStudent = rref(intMatrixToFrac(studentIntMatrix));
      var equivalent = rrefEqual(rrefOriginal, rrefStudent);
      return { ok: equivalent, reason: equivalent ? 'ok' : 'not-equivalent' };
    }

    function buildSeed() {
      var pivots = randChoice(PIVOT_SETS);
      var M = [];
      for (var r = 0; r < ROWS; r++) {
        var row = new Array(COLS).fill(0);
        var p = pivots[r];
        var pivotVal = randInt(-4, 4); while (pivotVal === 0) pivotVal = randInt(-4, 4);
        row[p] = pivotVal;
        for (var c = p + 1; c < COLS; c++) row[c] = randInt(-4, 4);
        M.push(row);
      }
      return M;
    }
    function swapRows(M, i, j) { var M2 = M.map(function (r) { return r.slice(); }); var t = M2[i]; M2[i] = M2[j]; M2[j] = t; return M2; }
    function addMultiple(M, i, j, k) { var M2 = M.map(function (r) { return r.slice(); }); M2[j] = M2[j].map(function (v, c) { return v + k * M2[i][c]; }); return M2; }
    function scaleRow(M, i, k) { var M2 = M.map(function (r) { return r.slice(); }); M2[i] = M2[i].map(function (v) { return v * k; }); return M2; }
    function maxAbs(M) { return Math.max.apply(null, M.flat().map(Math.abs)); }

    function scramble(seed, numOps) {
      var M = seed;
      for (var op = 0; op < numOps; op++) {
        var kind = randChoice(['swap', 'add', 'scale']);
        if (kind === 'swap') {
          var i = randInt(0, ROWS - 1), j = randInt(0, ROWS - 1);
          while (j === i) j = randInt(0, ROWS - 1);
          M = swapRows(M, i, j);
        } else if (kind === 'add') {
          var i2 = randInt(0, ROWS - 1), j2 = randInt(0, ROWS - 1);
          while (j2 === i2) j2 = randInt(0, ROWS - 1);
          var k = randChoice([-2, -1, 1, 2]);
          M = addMultiple(M, i2, j2, k);
        } else {
          var i3 = randInt(0, ROWS - 1);
          var k2 = randChoice([-1, 1, -1, 1, 2]);
          M = scaleRow(M, i3, k2);
        }
      }
      return M;
    }
    function generateMatrix() {
      var M, tries = 0;
      do {
        var seed = buildSeed();
        M = scramble(seed, randInt(2, 3));
        tries++;
      } while (maxAbs(M) > 25 && tries < 50);
      return M;
    }
    function matrixLatex(M) {
      var body = M.map(function (row) { return row.join(' & '); }).join(' \\\\ ');
      return '\\left[\\begin{array}{ccc|c} ' + body + ' \\end{array}\\right]';
    }

    EXERCISES.push({
      id: 'gauss-reduccion',
      title: 'Aplicá el método de eliminación de Gauss',
      unit: 'Unidad 1: Matrices y SEL',
      topic: 'Escalonamiento / Método de Gauss',
      needsKatex: true,
      type: 'grid',
      prompt: 'Llevá esta matriz a una forma escalonada válida. No hace falta que sea LA única respuesta posible.',
      grid: { rows: 3, cols: 4, dividerAfterCol: 3 },

      generate: function () { return { matrix: generateMatrix() }; },
      renderContent: function (container, current) {
        global.katex.render(matrixLatex(current.matrix), container, { throwOnError: false });
      },
      checkGrid: function (current, M, hasEmpty) {
        var result = checkAnswer(current.matrix, M);
        var correct = result.ok && !hasEmpty;
        var text;
        if (hasEmpty) text = 'Dejaste alguna celda vacía.';
        else if (result.reason === 'not-echelon') text = 'No está en forma escalonada.';
        else if (result.reason === 'not-equivalent') text = 'Es una matriz escalonada, pero no tiene el mismo conjunto solución que la original.';
        else text = '¡Correcto! Es una forma escalonada válida — no hacía falta que fuera LA única respuesta.';
        return { correct: correct, feedbackText: text };
      },
      getAnswerGrid: function (current) { return referenceEchelon(current.matrix); }
    });
  })();

  /* ============================================================
     5) Tipos de matrices — mode:'multiselect', sin KaTeX
     ============================================================ */
  (function () {
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffleArr(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }

    var KEYS = ['fila', 'columna', 'cuadrada', 'nula', 'diagonal', 'escalar', 'triangular_superior', 'triangular_inferior'];
    var LABELS = {
      fila: 'Matriz fila', columna: 'Matriz columna', cuadrada: 'Matriz cuadrada', nula: 'Matriz nula',
      diagonal: 'Matriz diagonal', escalar: 'Matriz escalar',
      triangular_superior: 'Triangular superior', triangular_inferior: 'Triangular inferior'
    };
    var ARCHETYPES = ['fila', 'columna', 'cuadrada_generica', 'nula', 'diagonal', 'escalar', 'triangular_superior', 'triangular_inferior'];

    var categoryShowCount = {}; KEYS.forEach(function (k) { categoryShowCount[k] = 0; });
    var archetypeShowCount = {}; ARCHETYPES.forEach(function (a) { archetypeShowCount[a] = 0; });

    function pickLeastUsed(keys, countMap) {
      var minCount = Math.min.apply(null, keys.map(function (k) { return countMap[k] || 0; }));
      var candidates = keys.filter(function (k) { return (countMap[k] || 0) === minCount; });
      return randChoice(candidates);
    }
    function pickWeighted(keys, count, countMap) {
      var pool = keys.slice(); var result = [];
      for (var i = 0; i < count && pool.length > 0; i++) {
        var picked = pickLeastUsed(pool, countMap);
        result.push(picked);
        pool.splice(pool.indexOf(picked), 1);
      }
      return result;
    }

    function buildRandNonZero(rows, cols) {
      var M = [];
      for (var r = 0; r < rows; r++) { var row = []; for (var c = 0; c < cols; c++) row.push(randNonZero(-9, 9)); M.push(row); }
      return M;
    }
    function buildZero(rows, cols) {
      var M = []; for (var r = 0; r < rows; r++) M.push(new Array(cols).fill(0)); return M;
    }

    function buildMatrix(archetype) {
      var rows, cols, M;
      if (archetype === 'fila') { rows = 1; cols = randInt(2, 4); M = buildRandNonZero(rows, cols); }
      else if (archetype === 'columna') { rows = randInt(2, 4); cols = 1; M = buildRandNonZero(rows, cols); }
      else if (archetype === 'cuadrada_generica') { rows = cols = randInt(2, 4); M = buildRandNonZero(rows, cols); }
      else if (archetype === 'nula') {
        var shapeKind = randChoice(['fila', 'columna', 'cuadrada', 'rectangular']);
        if (shapeKind === 'fila') { rows = 1; cols = randInt(2, 4); }
        else if (shapeKind === 'columna') { rows = randInt(2, 4); cols = 1; }
        else if (shapeKind === 'cuadrada') { rows = cols = randInt(2, 4); }
        else { rows = randInt(2, 4); cols = randInt(2, 4); while (cols === rows) cols = randInt(2, 4); }
        M = buildZero(rows, cols);
      }
      else if (archetype === 'diagonal') {
        rows = cols = randInt(2, 4); M = buildZero(rows, cols);
        for (var i = 0; i < rows; i++) M[i][i] = randNonZero(-9, 9);
      }
      else if (archetype === 'escalar') {
        rows = cols = randInt(2, 4); M = buildZero(rows, cols);
        var cst = randNonZero(-9, 9);
        for (var i2 = 0; i2 < rows; i2++) M[i2][i2] = cst;
      }
      else if (archetype === 'triangular_superior') {
        rows = cols = randInt(2, 4); M = buildZero(rows, cols);
        for (var r2 = 0; r2 < rows; r2++) for (var c2 = r2; c2 < cols; c2++) M[r2][c2] = randNonZero(-9, 9);
      }
      else {
        rows = cols = randInt(2, 4); M = buildZero(rows, cols);
        for (var r3 = 0; r3 < rows; r3++) for (var c3 = 0; c3 <= r3; c3++) M[r3][c3] = randNonZero(-9, 9);
      }
      return { rows: rows, cols: cols, matrix: M };
    }

    function classify(M, rows, cols) {
      var isFila = rows === 1, isColumna = cols === 1, isCuadrada = rows === cols;
      var isNula = M.every(function (row) { return row.every(function (v) { return v === 0; }); });
      var isDiagonal = false, isEscalar = false, isTriSup = false, isTriInf = false;
      if (isCuadrada) {
        isDiagonal = true;
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) if (r !== c && M[r][c] !== 0) isDiagonal = false;
        isTriSup = true;
        for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) if (r > c && M[r][c] !== 0) isTriSup = false;
        isTriInf = true;
        for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) if (r < c && M[r][c] !== 0) isTriInf = false;
        if (isDiagonal) {
          isEscalar = true;
          var d0 = M[0][0];
          for (r = 1; r < rows; r++) if (M[r][r] !== d0) isEscalar = false;
        }
      }
      return { fila: isFila, columna: isColumna, cuadrada: isCuadrada, nula: isNula, diagonal: isDiagonal, escalar: isEscalar, triangular_superior: isTriSup, triangular_inferior: isTriInf };
    }

    function pickOptions(trueKeys, falseKeys) {
      var targetTrue = trueKeys.length === 0 ? 0 : Math.min(trueKeys.length, randInt(1, 3));
      var chosenTrue = pickWeighted(trueKeys, targetTrue, categoryShowCount);
      var remaining = 4 - chosenTrue.length;
      var chosenFalse = pickWeighted(falseKeys, Math.min(remaining, falseKeys.length), categoryShowCount);
      var chosen = chosenTrue.concat(chosenFalse);
      if (chosen.length < 4) {
        var used = {}; chosen.forEach(function (k) { used[k] = true; });
        var leftoverTrue = trueKeys.filter(function (k) { return !used[k]; });
        chosen = chosen.concat(pickWeighted(leftoverTrue, 4 - chosen.length, categoryShowCount));
      }
      chosen.forEach(function (k) { categoryShowCount[k] = (categoryShowCount[k] || 0) + 1; });
      return shuffleArr(chosen);
    }

    function matrixLatexPlain(M) {
      var colsSpec = new Array(M[0].length).fill('c').join('');
      var rows = M.map(function (row) { return row.join(' & '); });
      return '\\left[\\begin{array}{' + colsSpec + '} ' + rows.join(' \\\\ ') + ' \\end{array}\\right]';
    }

    EXERCISES.push({
      id: 'tipos-matrices',
      title: 'Tipos de matrices',
      unit: 'Unidad 1: Matrices y SEL',
      topic: 'Tipos y operaciones con matrices',
      needsKatex: true,
      type: 'multiselect',
      prompt: 'Marcá todas las categorías que le correspondan a esta matriz. Puede ser una o varias a la vez.',

      generate: function () {
        var archetype = pickLeastUsed(ARCHETYPES, archetypeShowCount);
        archetypeShowCount[archetype] = (archetypeShowCount[archetype] || 0) + 1;
        var built = buildMatrix(archetype);
        var classification = classify(built.matrix, built.rows, built.cols);
        var trueKeys = KEYS.filter(function (k) { return classification[k]; });
        var falseKeys = KEYS.filter(function (k) { return !classification[k]; });
        var optionKeys = pickOptions(trueKeys, falseKeys);
        return { rows: built.rows, cols: built.cols, matrix: built.matrix, classification: classification, optionKeys: optionKeys };
      },
      renderContent: function (container, current) {
        global.katex.render(matrixLatexPlain(current.matrix), container, { throwOnError: false });
      },
      options: function (current) {
        return current.optionKeys.map(function (k) {
          return { value: k, label: LABELS[k], correct: current.classification[k] };
        });
      },
      explain: function (current, correct) {
        var trueShown = current.optionKeys.filter(function (k) { return current.classification[k]; }).map(function (k) { return LABELS[k]; });
        var msg = trueShown.length === 0 ? 'De estas opciones, ninguna corresponde a esta matriz.' : 'Corresponden: ' + trueShown.join(', ') + '.';
        var cls = current.classification;
        if (cls.nula) msg += ' Por ser nula, también es escalar, diagonal, triangular superior y triangular inferior a la vez.';
        else if (cls.escalar) msg += ' Por ser escalar, también es diagonal, triangular superior y triangular inferior a la vez.';
        else if (cls.diagonal) msg += ' Por ser diagonal, también es triangular superior y triangular inferior a la vez.';
        return (correct ? '' : 'No es correcto. ') + msg;
      }
    });
  })();

  /* ============================================================
     6) Suma de matrices — mode:'choices', cada opción es una
     matriz renderizada con KaTeX (vía renderToString)
     ============================================================ */
  (function () {
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffleArr(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }

    var TARGET_WEIGHTS = { compatible: 3, incompatible: 1 };
    var caseCount = { compatible: 0, incompatible: 0 };
    function pickCaseType() {
      var rc = caseCount.compatible / TARGET_WEIGHTS.compatible;
      var ri = caseCount.incompatible / TARGET_WEIGHTS.incompatible;
      var type = rc <= ri ? 'compatible' : 'incompatible';
      caseCount[type]++;
      return type;
    }

    function randShape() { return { rows: randInt(1, 3), cols: randInt(1, 3) }; }
    function shapesEqual(a, b) { return a.rows === b.rows && a.cols === b.cols; }
    function buildMatrix(rows, cols) {
      var M = [];
      for (var r = 0; r < rows; r++) { var row = []; for (var c = 0; c < cols; c++) row.push(randNonZero(-9, 9)); M.push(row); }
      return M;
    }
    function randCell(rows, cols) { return [randInt(0, rows - 1), randInt(0, cols - 1)]; }
    function addMatrices(A, B) { return A.map(function (row, i) { return row.map(function (v, j) { return v + B[i][j]; }); }); }
    function resizeAnchored(M, rows, cols, anchorBR) {
      var offR = anchorBR ? (rows - M.length) : 0;
      var offC = anchorBR ? (cols - M[0].length) : 0;
      var out = [];
      for (var i = 0; i < rows; i++) {
        var row = [];
        for (var j = 0; j < cols; j++) {
          var si = i - offR, sj = j - offC;
          row.push((si >= 0 && si < M.length && sj >= 0 && sj < M[0].length) ? M[si][sj] : 0);
        }
        out.push(row);
      }
      return out;
    }

    function generateCompatibleOptions(A, B) {
      var correctSum = addMatrices(A, B);
      var rows = correctSum.length, cols = correctSum[0].length;
      var subCell = randCell(rows, cols);
      var d1 = correctSum.map(function (r) { return r.slice(); });
      d1[subCell[0]][subCell[1]] = A[subCell[0]][subCell[1]] - B[subCell[0]][subCell[1]];

      var tweakCell;
      if (rows * cols > 1) {
        do { tweakCell = randCell(rows, cols); } while (tweakCell[0] === subCell[0] && tweakCell[1] === subCell[1]);
      } else { tweakCell = subCell; }
      var avoidVals = [correctSum[tweakCell[0]][tweakCell[1]], d1[tweakCell[0]][tweakCell[1]]];
      var val, tries = 0;
      do { val = correctSum[tweakCell[0]][tweakCell[1]] + randNonZero(-3, 3); tries++; }
      while (avoidVals.indexOf(val) !== -1 && tries < 20);
      var d2 = correctSum.map(function (r) { return r.slice(); });
      d2[tweakCell[0]][tweakCell[1]] = val;

      return [
        { kind: 'sum', matrix: correctSum, correct: true },
        { kind: 'sub-error', matrix: d1, correct: false },
        { kind: 'tweak-error', matrix: d2, correct: false }
      ];
    }
    function generateIncompatibleOptions(A, shapeA, B, shapeB) {
      var maxR = Math.max(shapeA.rows, shapeB.rows), maxC = Math.max(shapeA.cols, shapeB.cols);
      var minR = Math.min(shapeA.rows, shapeB.rows), minC = Math.min(shapeA.cols, shapeB.cols);
      var padTL = addMatrices(resizeAnchored(A, maxR, maxC, false), resizeAnchored(B, maxR, maxC, false));
      var padBR = addMatrices(resizeAnchored(A, maxR, maxC, true), resizeAnchored(B, maxR, maxC, true));
      var trunc = addMatrices(resizeAnchored(A, minR, minC, false), resizeAnchored(B, minR, minC, false));
      return [
        { kind: 'pad-topleft', matrix: padTL, correct: false },
        { kind: 'pad-bottomright', matrix: padBR, correct: false },
        { kind: 'trunc-overlap', matrix: trunc, correct: false }
      ];
    }

    function matrixLatex(M) {
      return '\\begin{bmatrix} ' + M.map(function (row) { return row.join(' & '); }).join(' \\\\ ') + ' \\end{bmatrix}';
    }
    function shapeTxt(s) { return s.rows + '×' + s.cols; }

    EXERCISES.push({
      id: 'suma-matrices',
      title: 'Suma de matrices',
      unit: 'Unidad 1: Matrices y SEL',
      topic: 'Tipos y operaciones con matrices',
      needsKatex: true,
      type: 'choices',
      prompt: 'Elegí cuál es el resultado de la operación A+B. Si no se pueden sumar, elegí esa opción.',

      generate: function () {
        var type = pickCaseType();
        var shapeA = randShape(), shapeB;
        if (type === 'compatible') shapeB = shapeA;
        else { do { shapeB = randShape(); } while (shapesEqual(shapeA, shapeB)); }
        var A = buildMatrix(shapeA.rows, shapeA.cols);
        var B = buildMatrix(shapeB.rows, shapeB.cols);
        var matrixOptions = type === 'compatible' ? generateCompatibleOptions(A, B) : generateIncompatibleOptions(A, shapeA, B, shapeB);
        var allOpts = matrixOptions.concat([{ kind: 'none', correct: type === 'incompatible' }]);
        var wrongIdx = 0;
        var choicesData = allOpts.map(function (o) {
          var value = o.correct ? 'correct' : ('w' + (wrongIdx++));
          return { value: value, kind: o.kind, matrix: o.matrix, correct: o.correct };
        });
        choicesData = shuffleArr(choicesData);
        return { shapeA: shapeA, shapeB: shapeB, A: A, B: B, type: type, choicesData: choicesData };
      },
      renderContent: function (container, current) {
        container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;"><div class="apt-suma-row"></div><div class="apt-suma-row"></div></div>';
        var rows = container.querySelectorAll('.apt-suma-row');
        global.katex.render('A = ' + matrixLatex(current.A), rows[0], { throwOnError: false });
        global.katex.render('B = ' + matrixLatex(current.B), rows[1], { throwOnError: false });
      },
      choices: function (current) {
        return current.choicesData.map(function (o) {
          return { value: o.value, label: o.kind === 'none' ? 'No es posible sumar' : global.katex.renderToString(matrixLatex(o.matrix), { throwOnError: false }) };
        });
      },
      check: function (current, value) { return value === 'correct'; },
      explain: function (current, correct, value) {
        var clicked = current.choicesData.filter(function (o) { return o.value === value; })[0];
        if (current.type === 'compatible') {
          if (clicked.kind === 'none') return (correct ? '' : 'No es correcto. ') + 'Sí se puede sumar: A y B tienen el mismo tamaño (' + shapeTxt(current.shapeA) + ').';
          var msg = 'La suma correcta es A + B, sumando entrada por entrada.';
          if (clicked.kind === 'sub-error') msg = 'Esa opción resta en una celda en vez de sumar.';
          if (clicked.kind === 'tweak-error') msg = 'Esa opción tiene un error de cálculo en una celda.';
          return (correct ? '' : 'No es correcto. ') + msg;
        }
        if (clicked.kind === 'none') return 'Correcto: A es ' + shapeTxt(current.shapeA) + ' y B es ' + shapeTxt(current.shapeB) + ' — no comparten tamaño, así que A + B no está definida.';
        return 'No es correcto. A (' + shapeTxt(current.shapeA) + ') y B (' + shapeTxt(current.shapeB) + ') no tienen el mismo tamaño: no se pueden sumar.';
      }
    });
  })();

  /* ============================================================
     7) ¿Es escalonada reducida? — mode:'choices', con KaTeX
     ============================================================ */
  (function () {
    var ROWS = 3, COLS = 4;

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
    function randPivotValNotOne() { var v; do { v = randNonZero(-9, 9); } while (v === 1); return v; }

    function pivotOf(row) {
      for (var c = 0; c < row.length; c++) if (row[c] !== 0) return c;
      return null;
    }

    function isReducedEchelon(matrix) {
      var lastPivot = -1, sawZero = false, pivots = [];
      for (var r = 0; r < matrix.length; r++) {
        var p = pivotOf(matrix[r]);
        if (p === null) { sawZero = true; continue; }
        if (sawZero) return { ok: false, reason: 'zero-not-last', badRow: r };
        if (p <= lastPivot) return { ok: false, reason: 'pivot-not-increasing', badRow: r, refRow: r - 1 };
        lastPivot = p;
        pivots.push({ row: r, col: p });
      }
      for (var i = 0; i < pivots.length; i++) {
        var pr = pivots[i].row, pc = pivots[i].col;
        if (matrix[pr][pc] !== 1) return { ok: false, reason: 'pivot-not-one', badRow: pr, badCol: pc, value: matrix[pr][pc] };
      }
      for (var i2 = 0; i2 < pivots.length; i2++) {
        var pr2 = pivots[i2].row, pc2 = pivots[i2].col;
        for (var r2 = 0; r2 < matrix.length; r2++) {
          if (r2 !== pr2 && matrix[r2][pc2] !== 0) return { ok: false, reason: 'not-reduced', badRow: r2, refRow: pr2, badCol: pc2 };
        }
      }
      return { ok: true };
    }

    function buildRow(pivotCol, pivotVal) {
      var row = new Array(COLS).fill(0);
      row[pivotCol] = pivotVal;
      for (var c = pivotCol + 1; c < COLS; c++) row[c] = randInt(-9, 9);
      return row;
    }
    function buildSkeleton(pivotValFn) {
      var rows = [], lastPivot = -1;
      for (var r = 0; r < ROWS; r++) {
        if (lastPivot >= COLS - 1 || Math.random() < 0.15) { rows.push(new Array(COLS).fill(0)); continue; }
        var pivotCol = randInt(lastPivot + 1, COLS - 1);
        rows.push(buildRow(pivotCol, pivotValFn()));
        lastPivot = pivotCol;
      }
      return rows;
    }
    function cleanPivotColumns(rows) {
      var r2 = rows.map(function (row) { return row.slice(); });
      for (var r = 0; r < r2.length; r++) {
        var p = pivotOf(r2[r]);
        if (p === null) continue;
        for (var i = 0; i < r2.length; i++) { if (i !== r) r2[i][p] = 0; }
      }
      return r2;
    }
    function breakEchelon(rows) {
      var kind = Math.random() < 0.5 ? 'zero-not-last' : 'pivot-not-increasing';
      var r = rows.map(function (row) { return row.slice(); });
      if (kind === 'zero-not-last') {
        var zeroIdx = randInt(0, ROWS - 2);
        r[zeroIdx] = new Array(COLS).fill(0);
        if (r[zeroIdx + 1].every(function (v) { return v === 0; })) r[zeroIdx + 1][randInt(0, COLS - 1)] = randNonZero(1, 9);
        return r;
      }
      var idx = randInt(1, ROWS - 1);
      var prevPivot = pivotOf(r[idx - 1]);
      var col = (prevPivot === null) ? 0 : randInt(0, prevPivot);
      r[idx] = new Array(COLS).fill(0);
      for (var c = col; c < COLS; c++) r[idx][c] = c === col ? randNonZero(1, 9) : randInt(-9, 9);
      return r;
    }
    function generateMatrix() {
      var recipe = randChoice(['clean-rref', 'break-structure', 'pivot-value', 'not-reduced']);
      var rows;
      if (recipe === 'clean-rref') rows = cleanPivotColumns(buildSkeleton(function () { return 1; }));
      else if (recipe === 'break-structure') rows = breakEchelon(buildSkeleton(function () { return 1; }));
      else if (recipe === 'pivot-value') rows = cleanPivotColumns(buildSkeleton(randPivotValNotOne));
      else rows = buildSkeleton(function () { return 1; });
      if (rows.every(function (row) { return row.every(function (v) { return v === 0; }); })) return generateMatrix();
      return rows;
    }
    function plainLatex(rows) {
      return '\\begin{bmatrix} ' + rows.map(function (r) { return r.join(' & '); }).join(' \\\\ ') + ' \\end{bmatrix}';
    }
    function explain(v) {
      if (v.ok) return 'Está en forma escalonada reducida: la matriz es escalonada, cada pivote vale 1, y es el único elemento no nulo de su columna.';
      if (v.reason === 'zero-not-last') return 'No es escalonada (y por lo tanto tampoco reducida): la fila ' + (v.badRow + 1) + ' es no nula pero aparece después de una fila nula.';
      if (v.reason === 'pivot-not-increasing') return 'No es escalonada (y por lo tanto tampoco reducida): el primer elemento no nulo de la fila ' + (v.badRow + 1) + ' no está estrictamente a la derecha del de la fila ' + (v.refRow + 1) + '.';
      if (v.reason === 'pivot-not-one') return 'Es escalonada, pero no reducida: el pivote de la fila ' + (v.badRow + 1) + ' vale ' + v.value + ' — en la forma reducida, todo pivote debe valer exactamente 1.';
      return 'Es escalonada, pero no reducida: la columna del pivote de la fila ' + (v.refRow + 1) + ' tiene otro valor no nulo en la fila ' + (v.badRow + 1) + ' — en la forma reducida, el pivote debe ser el único elemento no nulo de su columna.';
    }

    EXERCISES.push({
      id: 'es-escalonada-reducida',
      title: '¿Es escalonada reducida?',
      unit: 'Unidad 1: Matrices y SEL',
      topic: 'Escalonamiento / Método de Gauss',
      needsKatex: true,
      type: 'choices',
      prompt: 'Mirá la matriz y decidí si está en su forma escalonada reducida por filas.',

      generate: function () {
        var matrix = generateMatrix();
        return { matrix: matrix, verdict: isReducedEchelon(matrix) };
      },
      renderContent: function (container, current) {
        global.katex.render(plainLatex(current.matrix), container, { throwOnError: false });
      },
      choices: function () {
        return [{ value: 'si', label: 'Sí, es reducida' }, { value: 'no', label: 'No, no es reducida' }];
      },
      check: function (current, value) { return (value === 'si') === current.verdict.ok; },
      explain: function (current) { return explain(current.verdict); }
    });
  })();

  /* ============================================================
     8) Encontrá la forma escalonada reducida — mode:'grid', con
     KaTeX. Respuesta ÚNICA (a diferencia de "Aplicá Gauss").
     ============================================================ */
  (function () {
    var ROWS = 3, COLS = 4;

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }

    function pivotOf(row) {
      for (var c = 0; c < row.length; c++) if (row[c] !== 0) return c;
      return null;
    }
    function buildRow(pivotCol, pivotVal) {
      var row = new Array(COLS).fill(0);
      row[pivotCol] = pivotVal;
      for (var c = pivotCol + 1; c < COLS; c++) row[c] = randNonZero(-9, 9);
      return row;
    }
    function buildSkeleton() {
      var rank = randChoice([3, 3, 3, 2, 2]);
      var rows = [], lastPivot = -1;
      for (var r = 0; r < ROWS; r++) {
        if (r >= rank) { rows.push(new Array(COLS).fill(0)); continue; }
        var maxStart = COLS - (rank - r);
        var pivotCol = randInt(lastPivot + 1, maxStart);
        rows.push(buildRow(pivotCol, 1));
        lastPivot = pivotCol;
      }
      return rows;
    }
    function cleanPivotColumns(rows) {
      var r2 = rows.map(function (row) { return row.slice(); });
      for (var r = 0; r < r2.length; r++) {
        var p = pivotOf(r2[r]);
        if (p === null) continue;
        for (var i = 0; i < r2.length; i++) { if (i !== r) r2[i][p] = 0; }
      }
      return r2;
    }
    function buildRREFSeed() {
      var rows = cleanPivotColumns(buildSkeleton());
      if (rows.every(function (row) { return row.every(function (v) { return v === 0; }); })) return buildRREFSeed();
      return rows;
    }

    function swapRows(M, i, j) { var M2 = M.map(function (r) { return r.slice(); }); var t = M2[i]; M2[i] = M2[j]; M2[j] = t; return M2; }
    function addMultiple(M, i, j, k) { var M2 = M.map(function (r) { return r.slice(); }); M2[j] = M2[j].map(function (v, c) { return v + k * M2[i][c]; }); return M2; }
    function scaleRow(M, i, k) { var M2 = M.map(function (r) { return r.slice(); }); M2[i] = M2[i].map(function (v) { return v * k; }); return M2; }
    function maxAbs(M) {
      var max = 0;
      M.forEach(function (row) { row.forEach(function (v) { var a = Math.abs(v); if (a > max) max = a; }); });
      return max;
    }
    function scramble(seed, numOps) {
      var M = seed;
      var order = [0, 1, 2];
      for (var oi = order.length - 1; oi > 0; oi--) {
        var oj = randInt(0, oi);
        var ot = order[oi]; order[oi] = order[oj]; order[oj] = ot;
      }
      M = order.map(function (idx) { return M[idx]; });
      for (var op = 0; op < numOps; op++) {
        var kind = randChoice(['add', 'add', 'add', 'scale']);
        if (kind === 'add') {
          var i2 = randInt(0, ROWS - 1), j2 = randInt(0, ROWS - 1);
          while (j2 === i2) j2 = randInt(0, ROWS - 1);
          var k = randChoice([-2, -1, 1, 2]);
          M = addMultiple(M, i2, j2, k);
        } else {
          var i3 = randInt(0, ROWS - 1);
          var k2 = randChoice([-2, -1, 1, 2]);
          M = scaleRow(M, i3, k2);
        }
      }
      return M;
    }
    function generateShown() {
      var seed, shown, tries = 0;
      do {
        seed = buildRREFSeed();
        shown = scramble(seed, randInt(8, 11));
        tries++;
      } while (maxAbs(shown) > 45 && tries < 100);
      return { seed: seed, shown: shown };
    }

    function isReducedEchelon(matrix) {
      var lastPivot = -1, sawZero = false, pivots = [];
      for (var r = 0; r < matrix.length; r++) {
        var p = pivotOf(matrix[r]);
        if (p === null) { sawZero = true; continue; }
        if (sawZero) return { ok: false, reason: 'zero-not-last', badRow: r };
        if (p <= lastPivot) return { ok: false, reason: 'pivot-not-increasing', badRow: r, refRow: r - 1 };
        lastPivot = p;
        pivots.push({ row: r, col: p });
      }
      for (var i = 0; i < pivots.length; i++) {
        var pr = pivots[i].row, pc = pivots[i].col;
        if (matrix[pr][pc] !== 1) return { ok: false, reason: 'pivot-not-one', badRow: pr, badCol: pc, value: matrix[pr][pc] };
      }
      for (var i2 = 0; i2 < pivots.length; i2++) {
        var pr2 = pivots[i2].row, pc2 = pivots[i2].col;
        for (var r2 = 0; r2 < matrix.length; r2++) {
          if (r2 !== pr2 && matrix[r2][pc2] !== 0) return { ok: false, reason: 'not-reduced', badRow: r2, refRow: pr2, badCol: pc2 };
        }
      }
      return { ok: true };
    }
    function matricesEqual(A, B) {
      for (var r = 0; r < A.length; r++) for (var c = 0; c < A[0].length; c++) if (A[r][c] !== B[r][c]) return false;
      return true;
    }
    function matrixLatex(M) {
      var body = M.map(function (row) { return row.join(' & '); }).join(' \\\\ ');
      return '\\left[\\begin{array}{ccc|c} ' + body + ' \\end{array}\\right]';
    }
    function explainStructural(v) {
      if (v.reason === 'zero-not-last') return 'No está en forma escalonada: la fila ' + (v.badRow + 1) + ' es no nula pero aparece después de una fila nula.';
      if (v.reason === 'pivot-not-increasing') return 'No está en forma escalonada: el primer elemento no nulo de la fila ' + (v.badRow + 1) + ' no está estrictamente a la derecha del de la fila ' + (v.refRow + 1) + '.';
      if (v.reason === 'pivot-not-one') return 'Es escalonada, pero no reducida: el pivote de la fila ' + (v.badRow + 1) + ' vale ' + v.value + ' — en la forma reducida, todo pivote debe valer exactamente 1.';
      return 'Es escalonada, pero no reducida: la columna del pivote de la fila ' + (v.refRow + 1) + ' tiene otro valor no nulo en la fila ' + (v.badRow + 1) + ' — el pivote debe ser el único elemento no nulo de su columna.';
    }

    EXERCISES.push({
      id: 'encontrar-rref',
      title: 'Encontrá la forma escalonada reducida',
      unit: 'Unidad 1: Matrices y SEL',
      topic: 'Escalonamiento / Método de Gauss',
      needsKatex: true,
      type: 'grid',
      prompt: 'A diferencia de la escalonada, esta forma es única: hay una sola respuesta correcta.',
      grid: { rows: 3, cols: 4, dividerAfterCol: 3 },

      generate: function () {
        var g = generateShown();
        return { matrix: g.shown, answer: g.seed };
      },
      renderContent: function (container, current) {
        global.katex.render(matrixLatex(current.matrix), container, { throwOnError: false });
      },
      checkGrid: function (current, M, hasEmpty) {
        if (hasEmpty) return { correct: false, feedbackText: 'Dejaste alguna celda vacía.' };
        var structCheck = isReducedEchelon(M);
        if (!structCheck.ok) return { correct: false, feedbackText: explainStructural(structCheck) };
        var isTheAnswer = matricesEqual(M, current.answer);
        if (isTheAnswer) return { correct: true, feedbackText: '¡Correcto! Como la forma escalonada reducida es única, esta es exactamente la respuesta.' };
        return { correct: false, feedbackText: 'Tu matriz sí está en forma escalonada reducida, pero no representa el mismo sistema que la original.' };
      },
      getAnswerGrid: function (current) { return current.answer; }
    });
  })();


  (function () {

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function randBool(){ return Math.random() < 0.5; }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function shuffleArr(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }

  function inInterval(x, iv){
    if(x < iv.lo || x > iv.hi) return false;
    if(x === iv.lo) return iv.loClosed;
    if(x === iv.hi) return iv.hiClosed;
    return true;
  }
  function memberOf(x, A, B, op){
    var a = inInterval(x,A), b = inInterval(x,B);
    if(op==='union') return a || b;
    if(op==='intersection') return a && b;
    if(op==='difference') return a && !b;
    if(op==='symdiff') return a !== b;
  }
  function computeResult(A, B, op){
    var ptsSet = {};
    [A.lo,A.hi,B.lo,B.hi].forEach(function(p){ ptsSet[p]=true; });
    var pts = Object.keys(ptsSet).map(Number).sort(function(a,b){ return a-b; });
    var segments = [];
    for(var i=0;i<pts.length;i++){
      segments.push({ type:'point', x:pts[i], in: memberOf(pts[i],A,B,op) });
      if(i<pts.length-1){
        var mid = (pts[i]+pts[i+1])/2;
        segments.push({ type:'open', lo:pts[i], hi:pts[i+1], in: memberOf(mid,A,B,op) });
      }
    }
    var results = [];
    var idx = 0;
    while(idx < segments.length){
      if(!segments[idx].in){ idx++; continue; }
      var j = idx;
      while(j<segments.length && segments[j].in) j++;
      var first = segments[idx], last = segments[j-1];
      var lo, loClosed, hi, hiClosed;
      if(first.type==='point'){ lo=first.x; loClosed=true; } else { lo=first.lo; loClosed=false; }
      if(last.type==='point'){ hi=last.x; hiClosed=true; } else { hi=last.hi; hiClosed=false; }
      if(lo<hi || (lo===hi && loClosed && hiClosed)){
        results.push({ lo:lo, hi:hi, loClosed:loClosed, hiClosed:hiClosed });
      }
      idx = j;
    }
    return results;
  }
  function intervalsEqual(a,b){ return a.lo===b.lo && a.hi===b.hi && a.loClosed===b.loClosed && a.hiClosed===b.hiClosed; }
  function resultsEqual(R1,R2){
    if(R1.length!==R2.length) return false;
    for(var i=0;i<R1.length;i++) if(!intervalsEqual(R1[i],R2[i])) return false;
    return true;
  }

  var OPERATIONS = ['union','intersection','difference','symdiff','cartesian'];
  var opShowCount = {}; OPERATIONS.forEach(function(o){ opShowCount[o]=0; });
  function peekLeastUsedOp(){
    var minCount = Math.min.apply(null, OPERATIONS.map(function(o){ return opShowCount[o]; }));
    var candidates = OPERATIONS.filter(function(o){ return opShowCount[o]===minCount; });
    return randChoice(candidates);
  }

  var OP_NAME = {
    union:'la unión (A∪B)', intersection:'la intersección (A∩B)', difference:'la diferencia (A\\B)',
    symdiff:'la diferencia simétrica (A△B)', cartesian:'el producto cartesiano (A×B)'
  };

  function setUnion(A,B){ var s={}; A.concat(B).forEach(function(x){ s[x]=true; }); return Object.keys(s).map(Number).sort(function(a,b){return a-b;}); }
  function setIntersection(A,B){ return A.filter(function(x){ return B.indexOf(x)!==-1; }); }
  function setDifference(A,B){ return A.filter(function(x){ return B.indexOf(x)===-1; }); }
  function setSymDiff(A,B){ return setUnion(setDifference(A,B), setDifference(B,A)); }
  function setCartesian(A,B){ var pairs=[]; A.forEach(function(a){ B.forEach(function(b){ pairs.push([a,b]); }); }); return pairs; }
  function numArraysEqual(a,b){ if(a.length!==b.length) return false; for(var i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; }
  function pairArraysEqual(a,b){ if(a.length!==b.length) return false; for(var i=0;i<a.length;i++) if(a[i][0]!==b[i][0]||a[i][1]!==b[i][1]) return false; return true; }

  function buildFiniteAB(){
    var universe = [1,2,3,4,5,6,7,8,9];
    var shuffled = shuffleArr(universe);
    var sharedCount = randInt(1,2), aOnlyCount = randInt(1,3), bOnlyCount = randInt(1,3);
    var idx = 0;
    var shared = shuffled.slice(idx, idx+=sharedCount);
    var aOnly = shuffled.slice(idx, idx+=aOnlyCount);
    var bOnly = shuffled.slice(idx, idx+=bOnlyCount);
    var A = shared.concat(aOnly).sort(function(a,b){return a-b;});
    var B = shared.concat(bOnly).sort(function(a,b){return a-b;});
    return { A:A, B:B };
  }

  // Para producto cartesiano: conjuntos más chicos (máx 6 pares, nunca 3x3=9)
  function buildFiniteABForCartesian(){
    var universe = [1,2,3,4,5,6,7,8,9];
    var shuffled = shuffleArr(universe);
    var sizeA = randInt(2,3);
    var sizeB = sizeA === 3 ? 2 : randChoice([2,3]);
    var sharedCount = Math.min(randInt(1,2), sizeA, sizeB);
    var aOnlyCount = sizeA - sharedCount;
    var bOnlyCount = sizeB - sharedCount;
    var idx = 0;
    var shared = shuffled.slice(idx, idx+=sharedCount);
    var aOnly = shuffled.slice(idx, idx+=aOnlyCount);
    var bOnly = shuffled.slice(idx, idx+=bOnlyCount);
    var A = shared.concat(aOnly).sort(function(a,b){return a-b;});
    var B = shared.concat(bOnly).sort(function(a,b){return a-b;});
    return { A:A, B:B };
  }

  function tweakWithDetail(base, universe){
    var pool = universe.filter(function(x){ return base.indexOf(x)===-1; });
    var canAdd = pool.length > 0, canRemove = base.length > 0;
    var doRemove = canRemove && (Math.random() < 0.5 || !canAdd);
    if(doRemove){
      var i = randInt(0, base.length-1);
      var removed = base[i];
      var newSet = base.filter(function(_,idx2){ return idx2!==i; });
      return { value:newSet, detail:'A esa opción le falta el elemento ' + removed + '.' };
    }
    var add = randChoice(pool);
    var newSet2 = base.concat([add]).sort(function(a,b){return a-b;});
    return { value:newSet2, detail:'Esa opción tiene de más el elemento ' + add + ', que no corresponde.' };
  }

  function finiteSetOptions(A,B,op){
    if(op==='cartesian'){
      var correct = setCartesian(A,B);
      var swapped = setCartesian(B,A);
      var missingIdx = correct.length>1 ? randInt(0, correct.length-1) : 0;
      var missingPair = correct[missingIdx];
      var missing = correct.length>1 ? correct.filter(function(_,i){ return i!==missingIdx; }) : correct;
      var extraPair = [A[0], B[0]+100];
      var extra = correct.concat([extraPair]);
      return {
        correct: correct,
        opts: [
          { kind:'order-swap', value:swapped, detail:'Esa opción invirtió el orden: es B×A, no A×B.' },
          { kind:'missing-pair', value:missing, detail:'A esa opción le falta el par (' + missingPair[0] + ', ' + missingPair[1] + ').' },
          { kind:'extra-pair', value:extra, detail:'Esa opción tiene de más el par (' + extraPair[0] + ', ' + extraPair[1] + '), que no corresponde.' }
        ],
        equalFn: pairArraysEqual
      };
    }
    var union = setUnion(A,B), intersection = setIntersection(A,B);
    var diffAB = setDifference(A,B), diffBA = setDifference(B,A);
    var symdiff = setSymDiff(A,B);

    var correct, confuseValue, confuseDetail;
    if(op==='union'){ correct=union; confuseValue=intersection; confuseDetail='Esa opción es ' + OP_NAME.intersection + ', no ' + OP_NAME.union + '.'; }
    else if(op==='intersection'){ correct=intersection; confuseValue=union; confuseDetail='Esa opción es ' + OP_NAME.union + ', no ' + OP_NAME.intersection + '.'; }
    else if(op==='difference'){ correct=diffAB; confuseValue=diffBA; confuseDetail='Esa opción invirtió el orden: calculó B\\A en vez de A\\B.'; }
    else { correct=symdiff; confuseValue=union; confuseDetail='Esa opción es ' + OP_NAME.union + ' — a la diferencia simétrica hay que sacarle los elementos compartidos.'; }

    var universeAll = [];
    [1,2,3,4,5,6,7,8,9].concat(A).concat(B).forEach(function(x){ if(universeAll.indexOf(x)===-1) universeAll.push(x); });
    var t1 = tweakWithDetail(correct, universeAll);
    var t2 = tweakWithDetail(correct, universeAll);

    return {
      correct: correct,
      opts: [
        { kind:'confused-op', value:confuseValue, detail:confuseDetail },
        { kind:'tweak', value:t1.value, detail:t1.detail },
        { kind:'tweak', value:t2.value, detail:t2.detail }
      ],
      equalFn: numArraysEqual
    };
  }

  function buildIntervalAB(){
    var lo1 = randInt(-5,3), width1 = randInt(2,5), hi1 = lo1+width1;
    var A = { lo:lo1, hi:hi1, loClosed:randBool(), hiClosed:randBool() };
    var lo2 = randInt(lo1-3, hi1+1), width2 = randInt(2,5), hi2 = lo2+width2;
    var B = { lo:lo2, hi:hi2, loClosed:randBool(), hiClosed:randBool() };
    return { A:A, B:B };
  }
  function cloneInterval(iv){ return { lo:iv.lo, hi:iv.hi, loClosed:iv.loClosed, hiClosed:iv.hiClosed }; }
  function pieceText(iv){
    var l = iv.loClosed ? '[' : '(';
    var r = iv.hiClosed ? ']' : ')';
    return l + iv.lo + ', ' + iv.hi + r;
  }

  function flipOneBoundaryWithDetail(pieces){
    var out = pieces.map(cloneInterval);
    var pi = randInt(0, out.length-1);
    var side, wasClosedWord, nowClosedWord;
    if(randBool()){
      out[pi].loClosed = !out[pi].loClosed;
      side = 'izquierdo (' + out[pi].lo + ')';
      wasClosedWord = pieces[pi].loClosed ? 'cerrado' : 'abierto';
      nowClosedWord = out[pi].loClosed ? 'cerrado' : 'abierto';
    } else {
      out[pi].hiClosed = !out[pi].hiClosed;
      side = 'derecho (' + out[pi].hi + ')';
      wasClosedWord = pieces[pi].hiClosed ? 'cerrado' : 'abierto';
      nowClosedWord = out[pi].hiClosed ? 'cerrado' : 'abierto';
    }
    var detail = 'Esa opción tiene el extremo ' + side + ' ' + nowClosedWord + ', pero en la respuesta correcta es ' + wasClosedWord + '.';
    return { value: out, detail: detail };
  }
  function shiftOneEndpointWithDetail(pieces){
    var out = pieces.map(cloneInterval);
    var pi = randInt(0, out.length-1);
    var delta = randChoice([-1,1]);
    var side, correctVal, wrongVal;
    if(randBool()){
      correctVal = out[pi].lo; out[pi].lo += delta; wrongVal = out[pi].lo;
      if(out[pi].lo >= out[pi].hi) return { value: pieces, detail: 'Tiene mal uno de los extremos del intervalo.' };
      side = 'izquierdo';
    } else {
      correctVal = out[pi].hi; out[pi].hi += delta; wrongVal = out[pi].hi;
      if(out[pi].lo >= out[pi].hi) return { value: pieces, detail: 'Tiene mal uno de los extremos del intervalo.' };
      side = 'derecho';
    }
    return { value: out, detail: 'El extremo ' + side + ' debería ser ' + correctVal + ', no ' + wrongVal + '.' };
  }

  function intervalOptions(A,B,op){
    var union = computeResult(A,B,'union');
    var intersection = computeResult(A,B,'intersection');
    var diffAB = computeResult(A,B,'difference');
    var diffBA = computeResult(B,A,'difference');
    var symdiff = computeResult(A,B,'symdiff');

    var correct, confuseValue, confuseDetail;
    if(op==='union'){ correct=union; confuseValue=intersection; confuseDetail='Esa opción es ' + OP_NAME.intersection + ', no ' + OP_NAME.union + '.'; }
    else if(op==='intersection'){ correct=intersection; confuseValue=union; confuseDetail='Esa opción es ' + OP_NAME.union + ', no ' + OP_NAME.intersection + '.'; }
    else if(op==='difference'){ correct=diffAB; confuseValue=diffBA; confuseDetail='Esa opción invirtió el orden: calculó B\\A en vez de A\\B.'; }
    else { correct=symdiff; confuseValue=union; confuseDetail='Esa opción es ' + OP_NAME.union + ' — a la diferencia simétrica hay que sacarle la intersección.'; }

    var opts = [{ kind:'confused-op', value:confuseValue, detail:confuseDetail }];

    if(correct.length===2){
      var missIdx = randInt(0,1);
      var missingPiece = correct[missIdx];
      var onePieceMissing = [correct[1-missIdx]];
      opts.push({ kind:'missing-piece', value:onePieceMissing, detail:'A esa opción le falta el tramo ' + pieceText(missingPiece) + '.' });
      var r2 = flipOneBoundaryWithDetail(correct);
      opts.push({ kind:'flip-boundary', value:r2.value, detail:r2.detail });
    } else if(correct.length===1){
      var rFlip = flipOneBoundaryWithDetail(correct);
      opts.push({ kind:'flip-boundary', value:rFlip.value, detail:rFlip.detail });
      var rShift = shiftOneEndpointWithDetail(correct);
      opts.push({ kind:'shift-endpoint', value:rShift.value, detail:rShift.detail });
    } else {
      opts.push({ kind:'not-empty', value:[A], detail:'El resultado correcto es el conjunto vacío (∅) — no debería quedar ningún intervalo.' });
      opts.push({ kind:'not-empty', value:[B], detail:'El resultado correcto es el conjunto vacío (∅) — no debería quedar ningún intervalo.' });
    }

    return { correct:correct, opts:opts, equalFn:resultsEqual };
  }

  function generateCase(){
    var attempt = 0, result;
    do{
      attempt++;
      var op = peekLeastUsedOp();
      var flavor = op === 'cartesian' ? 'finite' : (randBool() ? 'finite' : 'interval');
      var A, B, built;
      if(flavor==='finite'){
        var ab = op === 'cartesian' ? buildFiniteABForCartesian() : buildFiniteAB();
        A=ab.A; B=ab.B;
        built = finiteSetOptions(A,B,op);
      } else {
        var ab2 = buildIntervalAB(); A=ab2.A; B=ab2.B;
        built = intervalOptions(A,B,op);
      }
      var allValues = [built.correct].concat(built.opts.map(function(o){ return o.value; }));
      var allDistinct = true;
      for(var i=0;i<allValues.length && allDistinct;i++){
        for(var j=i+1;j<allValues.length;j++){
          if(built.equalFn(allValues[i], allValues[j])){ allDistinct=false; break; }
        }
      }
      if(allDistinct){
        result = { flavor:flavor, A:A, B:B, op:op, correct:built.correct, distractors:built.opts, equalFn:built.equalFn };
        opShowCount[op]++;
      }
    } while(!result && attempt<25);
    return result;
  }

  function finiteSetLatex(arr){
    if(arr.length===0) return '\\varnothing';
    return '\\{' + arr.join(', ') + '\\}';
  }
  // Los pares del producto cartesiano se arman como una fila de piezas
  // individuales en flex-wrap (no un solo bloque de KaTeX) para que
  // puedan saltar de línea si no entran en una sola.
  function pairsHTML(pairs){
    if(pairs.length===0) return '<span>' + window.katex.renderToString('\\varnothing', { throwOnError:false }) + '</span>';
    var brace = '<span style="margin:0 2px;">' + window.katex.renderToString('\\{', { throwOnError:false }) + '</span>';
    var closeBrace = '<span style="margin:0 2px;">' + window.katex.renderToString('\\}', { throwOnError:false }) + '</span>';
    var inner = pairs.map(function(p, idx){
      var comma = idx < pairs.length - 1 ? '<span style="margin-right:4px;">,</span>' : '';
      return '<span style="white-space:nowrap;">' + window.katex.renderToString('(' + p[0] + ',\\ ' + p[1] + ')', { throwOnError:false }) + comma + '</span>';
    }).join('');
    return '<span style="display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;row-gap:4px;">' + brace + inner + closeBrace + '</span>';
  }
  function intervalLatex(iv){
    var l = iv.loClosed ? '[' : '(';
    var r = iv.hiClosed ? ']' : ')';
    return '\\left' + l + iv.lo + ',\\ ' + iv.hi + '\\right' + r;
  }
  function intervalResultLatex(pieces){
    if(pieces.length===0) return '\\varnothing';
    return pieces.map(intervalLatex).join(' \\cup ');
  }
  function optionLabel(current, value){
    if(current.op==='cartesian') return pairsHTML(value);
    var latex = current.flavor==='finite' ? finiteSetLatex(value) : intervalResultLatex(value);
    return window.katex.renderToString(latex, { throwOnError:false });
  }

  var OP_SYMBOL = { union:'\\cup', intersection:'\\cap', difference:'\\setminus', symdiff:'\\triangle', cartesian:'\\times' };

  function renderContent(container, current){
    var aLatex = current.flavor==='finite' ? finiteSetLatex(current.A) : intervalLatex(current.A);
    var bLatex = current.flavor==='finite' ? finiteSetLatex(current.B) : intervalLatex(current.B);
    container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;"><div class="apt-row-a"></div><div class="apt-row-b"></div><div class="apt-row-q"></div></div>';
    window.katex.render('A = ' + aLatex, container.querySelector('.apt-row-a'), { throwOnError:false });
    window.katex.render('B = ' + bLatex, container.querySelector('.apt-row-b'), { throwOnError:false });
    window.katex.render('A \\ ' + OP_SYMBOL[current.op] + ' \\ B \\ = \\ ?', container.querySelector('.apt-row-q'), { throwOnError:false });
  }

  
    EXERCISES.push({
      id: 'operaciones-conjuntos',
      title: 'Operaciones con conjuntos',
      unit: 'Unidad 2: Subespacios vectoriales',
      topic: 'Conjuntos',
      needsKatex: true,
      type: 'choices',
      prompt: 'Elegí el resultado de la operación pedida (a veces con conjuntos finitos, a veces con intervalos).',
      generate: generateCase,
      renderContent: renderContent,
      choices: function (current) {
        var allOpts = [{ kind: 'correct', value: current.correct, correct: true, detail: null }].concat(
          current.distractors.map(function (d) { return { kind: d.kind, value: d.value, correct: false, detail: d.detail }; })
        );
        var wrongIdx = 0;
        var choicesData = allOpts.map(function (o) {
          var value = o.correct ? 'correct' : ('w' + (wrongIdx++));
          return { value: value, kind: o.kind, raw: o.value, detail: o.detail };
        });
        current._choicesData = shuffleArr(choicesData);
        return current._choicesData.map(function (o) {
          return { value: o.value, label: optionLabel(current, o.raw) };
        });
      },
      check: function (current, value) { return value === 'correct'; },
      explain: function (current, correct, value) {
        if (correct) return 'Correcto: eso es ' + OP_NAME[current.op] + '.';
        var clicked = current._choicesData.filter(function (o) { return o.value === value; })[0];
        return 'No es correcto. ' + (clicked.detail || 'Revisá el cálculo.');
      }
    });
  })();

  (function () {

  var CASES = [
    { setL:'\\mathbb{N}', op:'+', isLCI:true },
    { setL:'\\mathbb{N}', op:'-', isLCI:false, cx:'2 - 5 = -3, que no es un número natural.' },
    { setL:'\\mathbb{N}', op:'\\times', isLCI:true },
    { setL:'\\mathbb{N}', op:'\\div', isLCI:false, cx:'1 ÷ 2 = 0,5, que no es un número natural (y además a ÷ 0 no está definido).' },

    { setL:'\\mathbb{Z}', op:'+', isLCI:true },
    { setL:'\\mathbb{Z}', op:'-', isLCI:true },
    { setL:'\\mathbb{Z}', op:'\\times', isLCI:true },
    { setL:'\\mathbb{Z}', op:'\\div', isLCI:false, cx:'1 ÷ 2 = 0,5, que no es un número entero.' },

    { setL:'\\mathbb{Z}^*', op:'+', isLCI:false, cx:'2 + (-2) = 0, que no pertenece a ℤ* (excluye al 0).' },
    { setL:'\\mathbb{Z}^*', op:'-', isLCI:false, cx:'2 - 2 = 0, que no pertenece a ℤ*.' },
    { setL:'\\mathbb{Z}^*', op:'\\times', isLCI:true },
    { setL:'\\mathbb{Z}^*', op:'\\div', isLCI:false, cx:'1 ÷ 2 = 0,5, que no es un número entero.' },

    { setL:'\\mathbb{Q}', op:'+', isLCI:true },
    { setL:'\\mathbb{Q}', op:'-', isLCI:true },
    { setL:'\\mathbb{Q}', op:'\\times', isLCI:true },
    { setL:'\\mathbb{Q}', op:'\\div', isLCI:false, cx:'1 ÷ 0 no está definido (ℚ incluye al 0).' },

    { setL:'\\mathbb{Q}^*', op:'+', isLCI:false, cx:'2 + (-2) = 0, que no pertenece a ℚ*.' },
    { setL:'\\mathbb{Q}^*', op:'-', isLCI:false, cx:'2 - 2 = 0, que no pertenece a ℚ*.' },
    { setL:'\\mathbb{Q}^*', op:'\\times', isLCI:true },
    { setL:'\\mathbb{Q}^*', op:'\\div', isLCI:true },

    { setL:'\\mathbb{R}', op:'+', isLCI:true },
    { setL:'\\mathbb{R}', op:'-', isLCI:true },
    { setL:'\\mathbb{R}', op:'\\times', isLCI:true },
    { setL:'\\mathbb{R}', op:'\\div', isLCI:false, cx:'1 ÷ 0 no está definido.' },

    { setL:'\\mathbb{R}^*', op:'+', isLCI:false, cx:'2 + (-2) = 0, que no pertenece a ℝ*.' },
    { setL:'\\mathbb{R}^*', op:'-', isLCI:false, cx:'2 - 2 = 0, que no pertenece a ℝ*.' },
    { setL:'\\mathbb{R}^*', op:'\\times', isLCI:true },
    { setL:'\\mathbb{R}^*', op:'\\div', isLCI:true },

    { setL:'\\mathbb{R}^+', op:'+', isLCI:true },
    { setL:'\\mathbb{R}^+', op:'-', isLCI:false, cx:'2 - 5 = -3, que no pertenece a ℝ⁺ (no es positivo).' },
    { setL:'\\mathbb{R}^+', op:'\\times', isLCI:true },
    { setL:'\\mathbb{R}^+', op:'\\div', isLCI:true }
  ];

  var showCount = CASES.map(function(){ return 0; });
  function pickLeastUsedIdx(){
    var minCount = Math.min.apply(null, showCount);
    var candidates = [];
    for(var i=0;i<CASES.length;i++) if(showCount[i]===minCount) candidates.push(i);
    var picked = candidates[Math.floor(Math.random()*candidates.length)];
    showCount[picked]++;
    return picked;
  }

  function generateCase(){
    var idx = pickLeastUsedIdx();
    return CASES[idx];
  }

  function renderContent(container, current){
    var latex = '\\ast : ' + current.setL + ' \\times ' + current.setL + ' \\to ' + current.setL +
                ' \\quad\\quad (a,b) \\to a \\ ' + current.op + ' \\ b';
    window.katex.render(latex, container, { throwOnError:false });
  }

  
    EXERCISES.push({
      id: 'es-lci',
      title: '¿Es una LCI?',
      unit: 'Unidad 2: Subespacios vectoriales',
      topic: 'Estructuras algebraicas',
      needsKatex: true,
      type: 'choices',
      prompt: 'Mirá el conjunto y la operación. ¿Es una ley de composición interna?',
      generate: generateCase,
      renderContent: renderContent,
      choices: function () {
        return [
          { value: 'si', label: 'Sí, es una LCI' },
          { value: 'no', label: 'No, no es una LCI' }
        ];
      },
      check: function (current, value) { return (value === 'si') === current.isLCI; },
      explain: function (current, correct) {
        if (correct) return '';
        if (current.isLCI) return 'No es correcto: esta operación sí es una LCI en este conjunto (el resultado siempre queda dentro del conjunto).';
        return 'No es correcto. Un contraejemplo: ' + current.cx;
      }
    });
  })();

  (function () {

var CASES = [
  // ---------- Válidas con K=R (20) ----------
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ \\lambda z)', isLCE:true },
  { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda A', isLCE:true },
  { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\lambda p', isLCE:true },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda^2 x,\\ \\lambda^2 y)', isLCE:true },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(|\\lambda| x,\\ |\\lambda| y)', isLCE:true },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ 0)', isLCE:true },
  { k:'\\mathbb{R}', v:'\\{A\\in M_{2\\times2}(\\mathbb{R}) : A^T=A\\}\\ \\text{(matrices simétricas)}', f:'\\lambda A', isLCE:true },
  { k:'\\mathbb{R}', v:'\\{A\\in M_{2\\times2}(\\mathbb{R}) : \\text{triangular superior}\\}', f:'\\lambda A', isLCE:true },
  { k:'\\mathbb{R}', v:'\\{p\\in P_2(\\mathbb{R}) : a_0=0\\}', f:'\\lambda p', isLCE:true },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ y)', isLCE:true },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ z)', isLCE:true },
  { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda^2 A', isLCE:true },
  { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\lambda^3 p', isLCE:true },
  { k:'\\mathbb{R}', v:'\\{(x,y)\\in\\mathbb{R}^2 : xy\\ge0\\}', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(0,\\ 0,\\ 0)', isLCE:true },
  { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda A^T', isLCE:true },
  { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'p(\\lambda x)', isLCE:true },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda y,\\ \\lambda x)', isLCE:true },
  { k:'\\mathbb{R}', v:'\\{(x,y,z)\\in\\mathbb{R}^3 : x+y+z=0\\}', f:'(\\lambda x,\\ \\lambda y,\\ \\lambda z)', isLCE:true },

  // ---------- No válidas, K=R: V restringido y la fórmula no lo respeta (10) ----------
  { k:'\\mathbb{R}', v:'\\{(x,y)\\in\\mathbb{R}^2 : x\\ge0\\}', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'Con λ=-1 y v=(1,0): el resultado es (-1,0), y -1<0.' },
  { k:'\\mathbb{R}', v:'\\{v\\in\\mathbb{R}^2 : \\|v\\|=1\\}\\ \\text{(vectores unitarios)}', f:'\\lambda v', isLCE:false, cx:'La norma del resultado es |λ|. Con λ=2: la norma pasa a ser 2, no 1.' },
  { k:'\\mathbb{R}', v:'GL_2(\\mathbb{R})\\ \\text{(matrices invertibles)}', f:'\\lambda A', isLCE:false, cx:'Con λ=0: el resultado es la matriz nula, que no es invertible.' },
  { k:'\\mathbb{R}', v:'\\{p\\in P_2(\\mathbb{R}) : a_2\\ne0\\}\\ \\text{(grado exactamente 2)}', f:'\\lambda p', isLCE:false, cx:'Con λ=0: el resultado es el polinomio nulo, que no tiene grado 2.' },
  { k:'\\mathbb{R}', v:'\\{(x,y,z)\\in\\mathbb{R}^3 : x+y+z=1\\}', f:'\\lambda v', isLCE:false, cx:'Con λ=2 y v=(1,0,0) (que cumple x+y+z=1): el resultado (2,0,0) da x+y+z=2≠1.' },
  { k:'\\mathbb{R}', v:'\\mathbb{Z}^2\\ \\text{(coordenadas enteras)}', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'Con λ=1/2 y v=(1,0): el resultado es (0,5, 0), que no tiene coordenadas enteras.' },
  { k:'\\mathbb{R}', v:'\\{(x,y)\\in\\mathbb{R}^2 : x>0\\}', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'Con λ=0: el resultado es (0,y), y 0 no es >0.' },
  { k:'\\mathbb{R}', v:'\\{A\\in M_{2\\times2}(\\mathbb{R}) : A^T=A\\}\\ \\text{(matrices simétricas)}', f:'A + \\begin{bmatrix}0 & \\lambda\\\\ 0 & 0\\end{bmatrix}', isLCE:false, cx:'Con λ=1: solo se suma en la entrada (1,2), rompiendo la simetría.' },
  { k:'\\mathbb{R}', v:'\\{v\\in\\mathbb{R}^3 : \\|v\\|=1\\}\\ \\text{(vectores unitarios)}', f:'v + \\lambda(1,0,0)', isLCE:false, cx:'Con λ=1: la norma del resultado cambia y deja de ser 1.' },
  { k:'\\mathbb{R}', v:'\\{(x,y,z)\\in\\mathbb{R}^3 : z=0\\}', f:'(\\lambda x,\\ \\lambda y,\\ \\lambda z+1)', isLCE:false, cx:'Como z=0 en todo vector de V, la tercera coordenada del resultado es siempre 1, nunca 0.' },

  // ---------- No válidas, K=R: fórmula no bien definida (10) ----------
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ y/\\lambda)', isLCE:false, cx:'No está definida en λ=0 (se dividiría por 0).' },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(x/\\lambda,\\ \\lambda y)', isLCE:false, cx:'No está definida en λ=0.' },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ x/z)', isLCE:false, cx:'No está definida cuando z=0.' },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\sqrt{\\lambda}\\,x,\\ \\sqrt{\\lambda}\\,y)', isLCE:false, cx:'No da un número real cuando λ<0 (ej. λ=-1).' },
  { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\dfrac{1}{\\lambda}A', isLCE:false, cx:'No está definida en λ=0.' },
  { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\dfrac{a_0}{\\lambda}+a_1x+a_2x^2', isLCE:false, cx:'No está definida en λ=0.' },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(x,\\ \\lambda y/x)', isLCE:false, cx:'No está definida cuando x=0.' },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ \\sqrt{z})', isLCE:false, cx:'No da un número real cuando z<0.' },
  { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda A^{-1}', isLCE:false, cx:'No está definida cuando A no es invertible (y M2×2(ℝ) incluye matrices no invertibles).' },
  { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\lambda\\, p / p(0)', isLCE:false, cx:'No está definida cuando p(0)=0.' },

  // ---------- No válidas, K=R: tipo de resultado incorrecto (6) ----------
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'\\lambda\\|(x,y)\\|', isLCE:false, cx:'El resultado es un número real (la norma escalada), no un vector de ℝ².' },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'El resultado tiene 2 componentes, no 3: no es un elemento de ℝ³.' },
  { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda \\det(A)', isLCE:false, cx:'El resultado es un número real (el determinante escalado), no una matriz.' },
  { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\lambda\\, p(1)', isLCE:false, cx:'El resultado es un número real (el polinomio evaluado en 1), no un polinomio.' },
  { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ \\lambda y,\\ 0)', isLCE:false, cx:'El resultado tiene 3 componentes, no 2: no es un elemento de ℝ².' },
  { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda\\,\\text{tr}(A)', isLCE:false, cx:'El resultado es un número real (la traza escalada), no una matriz.' },

  // ---------- Nuevos: variando K (10) ----------
  { k:'\\mathbb{Z}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
  { k:'\\mathbb{Z}', v:'\\mathbb{Z}^2\\ \\text{(coordenadas enteras)}', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
  { k:'\\mathbb{Q}', v:'\\mathbb{Q}^2', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
  { k:'\\mathbb{Q}', v:'\\mathbb{Z}^2\\ \\text{(coordenadas enteras)}', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'Con λ=1/2 y v=(1,0): el resultado (0,5, 0) no tiene coordenadas enteras.' },
  { k:'\\mathbb{Z}', v:'\\{A\\in M_{2\\times2} : \\text{entradas enteras}\\}', f:'\\lambda A', isLCE:true },
  { k:'\\mathbb{Q}', v:'\\{A\\in M_{2\\times2} : \\text{entradas enteras}\\}', f:'\\lambda A', isLCE:false, cx:'Con λ=1/2 se puede romper la integridad de las entradas (ej. entrada 1 pasa a 0,5).' },
  { k:'\\mathbb{Z}', v:'\\{p\\in P_2(\\mathbb{R}) : \\text{coeficientes enteros}\\}', f:'\\lambda p', isLCE:true },
  { k:'\\mathbb{Q}', v:'\\{p\\in P_2(\\mathbb{R}) : \\text{coeficientes enteros}\\}', f:'\\lambda p', isLCE:false, cx:'Con λ=1/3 se puede romper la integridad de los coeficientes.' },
  { k:'\\mathbb{N}', v:'\\mathbb{R}', f:'\\lambda x', isLCE:true },
  { k:'\\mathbb{Z}', v:'\\mathbb{R}^+\\ \\text{(reales positivos)}', f:'\\lambda x', isLCE:false, cx:'Con λ=-1 (entero) y x=2: el resultado es -2, que no es positivo.' }
];
  var showCount = CASES.map(function(){ return 0; });
  function pickLeastUsedIdx(){
    var minCount = Math.min.apply(null, showCount);
    var candidates = [];
    for(var i=0;i<CASES.length;i++) if(showCount[i]===minCount) candidates.push(i);
    var picked = candidates[Math.floor(Math.random()*candidates.length)];
    showCount[picked]++;
    return picked;
  }
  function generateCase(){ return CASES[pickLeastUsedIdx()]; }

  function renderContent(container, current){
    var latex = 'K = ' + current.k + ' \\quad\\quad V = ' + current.v +
                ' \\\\[10pt] \\ast : K \\times V \\to V \\quad\\quad \\lambda \\ast v = ' + current.f;
    window.katex.render(latex, container, { throwOnError:false });
  }

  
    EXERCISES.push({
      id: 'es-lce',
      title: '¿Es una LCE?',
      unit: 'Unidad 2: Subespacios vectoriales',
      topic: 'Estructuras algebraicas',
      needsKatex: true,
      type: 'choices',
      prompt: 'Mirá el conjunto K de escalares, el conjunto V, y la fórmula. ¿Es una ley de composición externa de K sobre V?',
      generate: generateCase,
      renderContent: renderContent,
      choices: function () {
        return [
          { value: 'si', label: 'Sí, es una LCE' },
          { value: 'no', label: 'No, no es una LCE' }
        ];
      },
      check: function (current, value) { return (value === 'si') === current.isLCE; },
      explain: function (current, correct) {
        if (correct) return '';
        if (current.isLCE) return 'No es correcto: esta fórmula sí es una LCE (el resultado siempre queda bien definido y dentro de V).';
        return 'No es correcto. Un contraejemplo: ' + current.cx;
      }
    });
  })();

  (function () {

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

  function generateCase(){
    var k = randInt(-9,9);
    var questionType = Math.random() < 0.5 ? 'neutro' : 'simetrico';
    var current = { k:k, questionType:questionType };
    if(questionType==='neutro'){
      current.answer = -k;
    } else {
      var a0 = randInt(-9,9);
      current.a0 = a0;
      current.answer = -2*k - a0;
    }
    return current;
  }

  function formatOffset(k){
    if(k===0) return '';
    return k>0 ? (' + ' + k) : (' - ' + Math.abs(k));
  }

  function renderContent(container, current){
    var formula = 'a \\oplus b = a + b' + formatOffset(current.k);
    var latex;
    if(current.questionType==='neutro'){
      latex = formula + ' \\\\[10pt] \\text{Encontrá el elemento neutro } e \\text{ de } \\oplus';
    } else {
      latex = formula + ' \\\\[10pt] \\text{Encontrá el simétrico de } a = ' + current.a0;
    }
    window.katex.render(latex, container, { throwOnError:false });
  }

  
    EXERCISES.push({
      id: 'neutro-simetrico',
      title: 'Neutro y simétrico de una operación "rara"',
      unit: 'Unidad 2: Subespacios vectoriales',
      topic: 'Estructuras algebraicas',
      needsKatex: true,
      type: 'grid',
      prompt: 'Dada una operación como a⊕b = a+b+k, encontrá su elemento neutro o el simétrico de un valor dado.',
      grid: { rows: 1, cols: 1, noDivider: true, hideBrackets: true },
      generate: generateCase,
      renderContent: renderContent,
      checkGrid: function (current, M, hasEmpty) {
        if (hasEmpty) return { correct: false, feedbackText: 'Dejaste la celda vacía.' };
        var correct = M[0][0] === current.answer;
        if (correct) return { correct: true, feedbackText: '' };
        var text;
        if (current.questionType === 'neutro') {
          text = 'No es correcto. Planteando a⊕e=a: a+e' + formatOffset(current.k) + ' = a, así que e = ' + current.answer + '.';
        } else {
          text = 'No es correcto. Planteando a⊕s=e (con e=' + (-current.k) + '): ' + current.a0 + '+s' + formatOffset(current.k) + ' = ' + (-current.k) + ', así que s = ' + current.answer + '.';
        }
        return { correct: false, feedbackText: text };
      },
      getAnswerGrid: function (current) { return [[current.answer]]; }
    });
  })();

  (function () {

var CASES = [
  // ============ R² (14) ============
  { space:'R2', cond:'y = 3x', isSEV:true },
  { space:'R2', cond:'x = 0', isSEV:true },
  { space:'R2', cond:'x + 2y = 0', isSEV:true },
  { space:'R2', cond:'x - y = 0', isSEV:true },
  { space:'R2', cond:'3x - 5y = 0', isSEV:true },
  { space:'R2', cond:'\\text{cualquier } (x,y) \\in \\mathbb{R}^2', isSEV:true },

  { space:'R2', cond:'y = 3x + 2', isSEV:false, cx:'El (0,0) no cumple la condición: 0 ≠ 3·0+2 = 2. Todo SEV tiene que contener al vector nulo.' },
  { space:'R2', cond:'x + y = 5', isSEV:false, cx:'El (0,0) no cumple: 0+0 = 0 ≠ 5.' },
  { space:'R2', cond:'x = 4', isSEV:false, cx:'El (0,0) no cumple: 0 ≠ 4.' },
  { space:'R2', cond:'2x - y = -3', isSEV:false, cx:'El (0,0) no cumple: 2·0 - 0 = 0 ≠ -3.' },

  { space:'R2', cond:'x \\cdot y = 0', isSEV:false, cx:'(1,0) y (0,1) cumplen la condición (el producto da 0 en ambos), pero (1,0)+(0,1) = (1,1), y 1·1 = 1 ≠ 0. No cierra bajo la suma.' },
  { space:'R2', cond:'x^2 = y^2', isSEV:false, cx:'(1,1) y (1,-1) cumplen la condición, pero (1,1)+(1,-1) = (2,0), y 2² = 4 ≠ 0² = 0. No cierra bajo la suma.' },

  { space:'R2', cond:'x \\ge 0', isSEV:false, cx:'(1,0) cumple, pero (-1)·(1,0) = (-1,0), y -1 no es ≥ 0. No cierra bajo producto por escalar.' },
  { space:'R2', cond:'x^2 + y^2 \\le 4', isSEV:false, cx:'(2,0) cumple (2²+0²=4≤4), pero 3·(2,0) = (6,0), y 6²=36 > 4. No cierra bajo producto por escalar.' },

  // ============ R³ (14) ============
  { space:'R3', cond:'x + y + z = 0', isSEV:true },
  { space:'R3', cond:'x = 0', isSEV:true },
  { space:'R3', cond:'x = y = z', isSEV:true },
  { space:'R3', cond:'2x - y + 3z = 0', isSEV:true },
  { space:'R3', cond:'x - 2y = 0', isSEV:true },
  { space:'R3', cond:'\\text{cualquier } (x,y,z) \\in \\mathbb{R}^3', isSEV:true },

  { space:'R3', cond:'x + y + z = 1', isSEV:false, cx:'El (0,0,0) no cumple: 0+0+0 = 0 ≠ 1.' },
  { space:'R3', cond:'x = 2', isSEV:false, cx:'El (0,0,0) no cumple: 0 ≠ 2.' },
  { space:'R3', cond:'x - y + z = 3', isSEV:false, cx:'El (0,0,0) no cumple: 0-0+0 = 0 ≠ 3.' },
  { space:'R3', cond:'2x + y = 4', isSEV:false, cx:'El (0,0,0) no cumple: 2·0+0 = 0 ≠ 4.' },

  { space:'R3', cond:'x \\cdot y \\cdot z = 0', isSEV:false, cx:'(1,0,1) y (0,1,1) cumplen (alguna coordenada es 0), pero (1,0,1)+(0,1,1) = (1,1,2), y 1·1·2 = 2 ≠ 0. No cierra bajo la suma.' },
  { space:'R3', cond:'x^2 = y^2 + z^2', isSEV:false, cx:'(1,1,0) y (1,0,1) cumplen la condición, pero (1,1,0)+(1,0,1) = (2,1,1), y 2² = 4, mientras que 1²+1² = 2. No cierra bajo la suma.' },

  { space:'R3', cond:'x \\ge 0', isSEV:false, cx:'(1,0,0) cumple, pero (-1)·(1,0,0) = (-1,0,0), y -1 no es ≥ 0. No cierra bajo producto por escalar.' },
  { space:'R3', cond:'x^2 + y^2 + z^2 \\le 9', isSEV:false, cx:'(3,0,0) cumple (9≤9), pero 2·(3,0,0) = (6,0,0), y 6² = 36 > 9. No cierra bajo producto por escalar.' },

  // ============ M2×2(R) (14) ============
  { space:'M22', cond:'A = A^T \\ \\text{(simétrica)}', isSEV:true },
  { space:'M22', cond:'\\text{tr}(A) = 0', isSEV:true },
  { space:'M22', cond:'\\text{triangular superior}', isSEV:true },
  { space:'M22', cond:'\\text{diagonal}', isSEV:true },
  { space:'M22', cond:'A = -A^T \\ \\text{(antisimétrica)}', isSEV:true },
  { space:'M22', cond:'\\text{cualquier } A \\in M_{2\\times2}(\\mathbb{R})', isSEV:true },

  { space:'M22', cond:'\\text{tr}(A) = 1', isSEV:false, cx:'La matriz nula tiene traza 0 ≠ 1, así que no pertenece al conjunto. Todo SEV tiene que contener a la matriz nula.' },
  { space:'M22', cond:'a_{11} = 1', isSEV:false, cx:'La matriz nula tiene a₁₁ = 0 ≠ 1, así que no pertenece.' },
  { space:'M22', cond:'\\det(A) = 1', isSEV:false, cx:'La matriz nula tiene determinante 0 ≠ 1, así que no pertenece.' },
  { space:'M22', cond:'a_{11} + a_{22} = 3', isSEV:false, cx:'La matriz nula tiene a₁₁+a₂₂ = 0 ≠ 3, así que no pertenece.' },

  { space:'M22', cond:'\\det(A) = 0', isSEV:false, cx:'A=[[1,0],[0,0]] y B=[[0,0],[0,1]] tienen determinante 0, pero A+B = [[1,0],[0,1]] (la identidad), que tiene determinante 1 ≠ 0. No cierra bajo la suma.' },
  { space:'M22', cond:'\\text{alguna entrada de } A \\text{ es } 0', isSEV:false, cx:'A=[[0,1],[1,1]] y B=[[1,1],[1,0]] tienen alguna entrada en 0, pero A+B = [[1,2],[2,1]], que no tiene ninguna entrada en 0. No cierra bajo la suma.' },

  { space:'M22', cond:'\\det(A) \\ne 0 \\ \\text{(invertible)}', isSEV:false, cx:'La identidad I es invertible, pero 0·I es la matriz nula, que no es invertible. No cierra bajo producto por escalar.' },
  { space:'M22', cond:'\\text{todas las entradas} \\ge 0', isSEV:false, cx:'A=[[1,0],[0,1]] cumple, pero (-1)·A = [[-1,0],[0,-1]], con entradas negativas. No cierra bajo producto por escalar.' },

  // ============ P2(R) (14) ============
  { space:'P2', cond:'a_0 = 0', isSEV:true },
  { space:'P2', cond:'a_2 = 0', isSEV:true },
  { space:'P2', cond:'p(1) = 0', isSEV:true },
  { space:'P2', cond:'a_1 = 0', isSEV:true },
  { space:'P2', cond:'a_0 = a_2', isSEV:true },
  { space:'P2', cond:'\\text{cualquier } p \\in P_2(\\mathbb{R})', isSEV:true },

  { space:'P2', cond:'p(1) = 1', isSEV:false, cx:'El polinomio nulo cumple q(1)=0 ≠ 1, así que no pertenece. Todo SEV tiene que contener al polinomio nulo.' },
  { space:'P2', cond:'a_0 = 2', isSEV:false, cx:'El polinomio nulo tiene a₀ = 0 ≠ 2, así que no pertenece.' },
  { space:'P2', cond:'p(0) = 3', isSEV:false, cx:'El polinomio nulo tiene p(0) = 0 ≠ 3, así que no pertenece.' },
  { space:'P2', cond:'a_2 = 1', isSEV:false, cx:'El polinomio nulo tiene a₂ = 0 ≠ 1, así que no pertenece.' },

  { space:'P2', cond:'a_2 \\ne 0 \\ \\text{(grado exactamente 2)}', isSEV:false, cx:'p=x² y q=-x²+x tienen a₂≠0, pero p+q = x, que tiene a₂=0 (no es grado 2). No cierra bajo la suma.' },
  { space:'P2', cond:'p(0) \\cdot p(1) = 0', isSEV:false, cx:'p=x cumple p(0)=0, y q=x-1 cumple q(1)=0. Pero (p+q)(0)=-1 y (p+q)(1)=1, y (-1)·1 = -1 ≠ 0. No cierra bajo la suma.' },

  { space:'P2', cond:'\\text{todos los coeficientes} \\ge 0', isSEV:false, cx:'p=x cumple, pero (-1)·p = -x tiene coeficiente negativo. No cierra bajo producto por escalar.' },
  { space:'P2', cond:'p(2) \\le 5', isSEV:false, cx:'p=5 (constante) cumple p(2)=5≤5, pero 2p tiene 2p(2)=10 > 5. No cierra bajo producto por escalar.' }
];
  var SPACE_LABEL = {
    R2: 'V = \\mathbb{R}^2',
    R3: 'V = \\mathbb{R}^3',
    M22: 'V = M_{2\\times2}(\\mathbb{R})',
    P2: 'V = P_2(\\mathbb{R})'
  };
  var SPACE_ELEMENT = {
    R2: '(x,y)',
    R3: '(x,y,z)',
    M22: 'A',
    P2: 'p(x) = a_0+a_1x+a_2x^2'
  };

  var showCount = CASES.map(function(){ return 0; });
  function pickLeastUsedIdx(){
    var minCount = Math.min.apply(null, showCount);
    var candidates = [];
    for(var i=0;i<CASES.length;i++) if(showCount[i]===minCount) candidates.push(i);
    var picked = candidates[Math.floor(Math.random()*candidates.length)];
    showCount[picked]++;
    return picked;
  }
  function generateCase(){ return CASES[pickLeastUsedIdx()]; }

  function renderContent(container, current){
    var latex = SPACE_LABEL[current.space] +
                ' \\\\[8pt] S = \\{\\ ' + SPACE_ELEMENT[current.space] + ' \\in V \\ : \\ ' + current.cond + '\\ \\}';
    window.katex.render(latex, container, { throwOnError:false });
  }

  
    EXERCISES.push({
      id: 'es-sev',
      title: '¿Es un subespacio vectorial?',
      unit: 'Unidad 2: Subespacios vectoriales',
      topic: 'Subespacios vectoriales',
      needsKatex: true,
      type: 'choices',
      prompt: 'Mirá el espacio V y el subconjunto S. ¿S es un subespacio vectorial de V?',
      generate: generateCase,
      renderContent: renderContent,
      choices: function () {
        return [
          { value: 'si', label: 'Sí, es un SEV' },
          { value: 'no', label: 'No, no es un SEV' }
        ];
      },
      check: function (current, value) { return (value === 'si') === current.isSEV; },
      explain: function (current, correct) {
        if (correct) return '';
        if (current.isSEV) return 'No es correcto: S sí es un subespacio vectorial (contiene al 0 y cierra bajo suma y producto por escalar).';
        return 'No es correcto. Un contraejemplo: ' + current.cx;
      }
    });
  })();

  (function () {

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }

  var DIM = { R2:2, R3:3, M22:4, P2:3 };

  function buildVectorsWithRank(d, n, r){
    var pivotCols = [];
    var last = -1;
    for(var i=0;i<r;i++){
      var col = randInt(last+1, d-(r-i));
      pivotCols.push(col);
      last = col;
    }
    var pivots = [];
    for(var i2=0;i2<r;i2++){
      var row = new Array(d).fill(0);
      row[pivotCols[i2]] = randNonZero(-4,4);
      for(var c=pivotCols[i2]+1;c<d;c++) row[c] = randInt(-4,4);
      pivots.push(row);
    }
    var combos = [];
    for(var k=0;k<n-r;k++){
      var coefs = pivots.map(function(){ return randChoice([-2,-1,-1,1,1,2]); });
      var row2 = new Array(d).fill(0);
      pivots.forEach(function(p,i3){ for(var c2=0;c2<d;c2++) row2[c2]+=coefs[i3]*p[c2]; });
      combos.push(row2);
    }
    var M = pivots.concat(combos);
    for(var i4=M.length-1;i4>0;i4--){ var j=randInt(0,i4); var t=M[i4]; M[i4]=M[j]; M[j]=t; }

    var numOps = randInt(3,6);
    for(var op=0; op<numOps; op++){
      var kind = randChoice(['add','add','scale']);
      if(kind==='add'){
        var ai=randInt(0,n-1), aj=randInt(0,n-1);
        while(aj===ai) aj=randInt(0,n-1);
        var kk=randChoice([-2,-1,1,2]);
        M[aj] = M[aj].map(function(v,c3){ return v + kk*M[ai][c3]; });
      } else {
        var si=randInt(0,n-1);
        var sk=randChoice([-1,1,-1,1,2]);
        M[si] = M[si].map(function(v){ return v*sk; });
      }
    }
    return M;
  }

  function generateCase(){
    var space = randChoice(['R2','R3','M22','P2']);
    var d = DIM[space];
    var wantLI = Math.random() < 0.5;
    var n, r;
    if(wantLI){ n = randInt(2, d); r = n; }
    else { n = randInt(2, d+1); r = randInt(1, Math.min(n-1, d)); }
    var vectors = buildVectorsWithRank(d, n, r);
    var isLI = (r === n);
    return { space:space, d:d, n:n, r:r, vectors:vectors, isLI:isLI };
  }

  var SPACE_LABEL = { R2:'V = \\mathbb{R}^2', R3:'V = \\mathbb{R}^3', M22:'V = M_{2\\times2}(\\mathbb{R})', P2:'V = P_2(\\mathbb{R})' };

  function polyToLatex(coefs){
    var terms = [];
    var labels = ['','x','x^2'];
    for(var i=2;i>=0;i--){
      var c = coefs[i];
      if(c===0) continue;
      var abs = Math.abs(c);
      var coefStr = (i===0) ? String(abs) : (abs===1 ? '' : String(abs));
      var term = coefStr + labels[i];
      if(terms.length===0) terms.push((c<0?'-':'') + term);
      else terms.push((c<0?' - ':' + ') + term);
    }
    return terms.length ? terms.join('') : '0';
  }
  function vectorToLatex(space, v){
    if(space==='R2') return '(' + v[0] + ',\\ ' + v[1] + ')';
    if(space==='R3') return '(' + v[0] + ',\\ ' + v[1] + ',\\ ' + v[2] + ')';
    if(space==='M22') return '\\begin{pmatrix}' + v[0] + ' & ' + v[1] + '\\\\ ' + v[2] + ' & ' + v[3] + '\\end{pmatrix}';
    return polyToLatex(v);
  }

  function setHTML(items, bigBraces){
    var braceCmd = bigBraces ? '\\bigg' : '';
    var brace = '<span style="margin:0 4px;">' + window.katex.renderToString(braceCmd + '\\{', { throwOnError:false }) + '</span>';
    var closeBrace = '<span style="margin:0 4px;">' + window.katex.renderToString(braceCmd + '\\}', { throwOnError:false }) + '</span>';
    var inner = items.map(function(latex, idx){
      var comma = idx < items.length-1 ? '<span style="margin-right:8px;">,</span>' : '';
      return '<span style="white-space:nowrap;">' + window.katex.renderToString(latex, { throwOnError:false }) + comma + '</span>';
    }).join('');
    return '<span style="display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;row-gap:8px;column-gap:4px;">' + brace + inner + closeBrace + '</span>';
  }

  function renderContent(container, current){
    var vectorLatexList = current.vectors.map(function(v){ return vectorToLatex(current.space, v); });
    container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;"><div class="row-v"></div><div class="row-g"></div><div class="row-q"></div></div>';
    window.katex.render(SPACE_LABEL[current.space], container.querySelector('.row-v'), { throwOnError:false });
    container.querySelector('.row-g').innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;">' +
        window.katex.renderToString('G=', { throwOnError:false }) +
        setHTML(vectorLatexList, current.space==='M22') +
      '</span>';
    window.katex.render('\\text{¿G es LI o LD?}', container.querySelector('.row-q'), { throwOnError:false });
  }

  
    EXERCISES.push({
      id: 'li-ld',
      title: '¿Es LI o LD?',
      unit: 'Unidad 2: Subespacios vectoriales',
      topic: 'Base y dimensión',
      needsKatex: true,
      type: 'choices',
      prompt: 'Mirá el conjunto de vectores G. Comparando |G| contra Rg(G), ¿es linealmente independiente o dependiente?',
      generate: generateCase,
      renderContent: renderContent,
      choices: function () {
        return [
          { value: 'li', label: 'LI' },
          { value: 'ld', label: 'LD' }
        ];
      },
      check: function (current, value) { return (value === 'li') === current.isLI; },
      explain: function (current, correct) {
        var base = '|G| = ' + current.n + ', Rg(G) = ' + current.r + '.';
        if (correct) {
          return current.isLI
            ? base + ' Como Rg(G) coincide con |G|, G es LI.'
            : base + ' Como Rg(G) es menor que |G|, G es LD.';
        }
        return current.isLI
          ? 'No es correcto: G sí es LI. ' + base + ' Como Rg(G) coincide con |G|, son independientes.'
          : 'No es correcto: G es LD. ' + base + ' Como Rg(G) es menor que |G|, hay dependencia lineal.';
      }
    });
  })();

  (function () {

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }

  var DIM = { R2:2, R3:3, M22:4, P2:3 };

  function buildVectorsWithRank(d, n, r){
    var pivotCols = [];
    var last = -1;
    for(var i=0;i<r;i++){
      var col = randInt(last+1, d-(r-i));
      pivotCols.push(col);
      last = col;
    }
    var pivots = [];
    for(var i2=0;i2<r;i2++){
      var row = new Array(d).fill(0);
      row[pivotCols[i2]] = randNonZero(-4,4);
      for(var c=pivotCols[i2]+1;c<d;c++) row[c] = randInt(-4,4);
      pivots.push(row);
    }
    var combos = [];
    for(var k=0;k<n-r;k++){
      var coefs = pivots.map(function(){ return randChoice([-2,-1,-1,1,1,2]); });
      var row2 = new Array(d).fill(0);
      pivots.forEach(function(p,i3){ for(var c2=0;c2<d;c2++) row2[c2]+=coefs[i3]*p[c2]; });
      combos.push(row2);
    }
    var M = pivots.concat(combos);
    for(var i4=M.length-1;i4>0;i4--){ var j=randInt(0,i4); var t=M[i4]; M[i4]=M[j]; M[j]=t; }

    var numOps = randInt(3,6);
    for(var op=0; op<numOps; op++){
      // "add" necesita 2 índices DISTINTOS — si n=1 no hay otro para elegir,
      // así que en ese caso solo se permite "scale" (si no, loop infinito).
      var kind = n >= 2 ? randChoice(['add','add','scale']) : 'scale';
      if(kind==='add'){
        var ai=randInt(0,n-1), aj=randInt(0,n-1);
        while(aj===ai) aj=randInt(0,n-1);
        var kk=randChoice([-2,-1,1,2]);
        M[aj] = M[aj].map(function(v,c3){ return v + kk*M[ai][c3]; });
      } else {
        var si=randInt(0,n-1);
        var sk=randChoice([-1,1,-1,1,2]);
        M[si] = M[si].map(function(v){ return v*sk; });
      }
    }
    return M;
  }

  function generateCase(){
    var space = randChoice(['R2','R3','M22','P2']);
    var d = DIM[space];
    var questionType = Math.random() < 0.5 ? 'genera' : 'base';
    var n, r, targetYes;

    if(questionType === 'base'){
      targetYes = Math.random() < 0.5;
      if(targetYes){
        n = d; r = d;
      } else {
        var subType = randChoice(['deficient','toomany','toofew']);
        if(subType==='deficient'){ n = d; r = randInt(1, d-1); }
        else if(subType==='toomany'){ n = randInt(d+1, d+2); r = d; }
        else { n = Math.max(1, d-1); r = n; }
      }
    } else {
      targetYes = Math.random() < 0.5;
      if(targetYes){ r = d; n = randInt(d, d+2); }
      else { n = randInt(Math.max(1,d-1), d+2); r = randInt(1, Math.min(n, d-1)); }
    }

    var generates = (r === d);
    var isBasis = (r === d && n === d);
    var vectors = buildVectorsWithRank(d, n, r);
    return { space:space, d:d, n:n, r:r, vectors:vectors, generates:generates, isBasis:isBasis, questionType:questionType };
  }

  var SPACE_LABEL = { R2:'V = \\mathbb{R}^2', R3:'V = \\mathbb{R}^3', M22:'V = M_{2\\times2}(\\mathbb{R})', P2:'V = P_2(\\mathbb{R})' };

  function polyToLatex(coefs){
    var terms = [];
    var labels = ['','x','x^2'];
    for(var i=2;i>=0;i--){
      var c = coefs[i];
      if(c===0) continue;
      var abs = Math.abs(c);
      var coefStr = (i===0) ? String(abs) : (abs===1 ? '' : String(abs));
      var term = coefStr + labels[i];
      if(terms.length===0) terms.push((c<0?'-':'') + term);
      else terms.push((c<0?' - ':' + ') + term);
    }
    return terms.length ? terms.join('') : '0';
  }
  function vectorToLatex(space, v){
    if(space==='R2') return '(' + v[0] + ',\\ ' + v[1] + ')';
    if(space==='R3') return '(' + v[0] + ',\\ ' + v[1] + ',\\ ' + v[2] + ')';
    if(space==='M22') return '\\begin{pmatrix}' + v[0] + ' & ' + v[1] + '\\\\ ' + v[2] + ' & ' + v[3] + '\\end{pmatrix}';
    return polyToLatex(v);
  }

  function setHTML(items, bigBraces){
    var braceCmd = bigBraces ? '\\bigg' : '';
    var brace = '<span style="margin:0 4px;">' + window.katex.renderToString(braceCmd + '\\{', { throwOnError:false }) + '</span>';
    var closeBrace = '<span style="margin:0 4px;">' + window.katex.renderToString(braceCmd + '\\}', { throwOnError:false }) + '</span>';
    var inner = items.map(function(latex, idx){
      var comma = idx < items.length-1 ? '<span style="margin-right:8px;">,</span>' : '';
      return '<span style="white-space:nowrap;">' + window.katex.renderToString(latex, { throwOnError:false }) + comma + '</span>';
    }).join('');
    return '<span style="display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;row-gap:8px;column-gap:4px;">' + brace + inner + closeBrace + '</span>';
  }

  function renderContent(container, current){
    var vectorLatexList = current.vectors.map(function(v){ return vectorToLatex(current.space, v); });
    var question = current.questionType==='genera' ? '\\text{¿G genera V?}' : '\\text{¿G es base de V?}';
    container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;"><div class="row-v"></div><div class="row-g"></div><div class="row-q"></div></div>';
    window.katex.render(SPACE_LABEL[current.space], container.querySelector('.row-v'), { throwOnError:false });
    container.querySelector('.row-g').innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;">' +
        window.katex.renderToString('G=', { throwOnError:false }) +
        setHTML(vectorLatexList, current.space==='M22') +
      '</span>';
    window.katex.render(question, container.querySelector('.row-q'), { throwOnError:false });
  }

  
    EXERCISES.push({
      id: 'genera-base',
      title: '¿Genera V? ¿Es base?',
      unit: 'Unidad 2: Subespacios vectoriales',
      topic: 'Base y dimensión',
      needsKatex: true,
      type: 'choices',
      prompt: 'Mirá el conjunto G y el espacio V. Comparando Rg(G) contra dim(V) — y |G| si la pregunta es sobre bases — respondé.',
      generate: generateCase,
      renderContent: renderContent,
      choices: function () {
        return [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' }
        ];
      },
      check: function (current, value) {
        var target = current.questionType === 'genera' ? current.generates : current.isBasis;
        return (value === 'si') === target;
      },
      explain: function (current, correct) {
        if (current.questionType === 'genera') {
          var genBase = 'Rg(G) = ' + current.r + ', dim(V) = ' + current.d + '.';
          var genText = current.generates
            ? genBase + ' Como Rg(G) = dim(V), G genera V.'
            : genBase + ' Como Rg(G) < dim(V), G no llega a generar V.';
          return correct ? genText : 'No es correcto. ' + genText;
        }
        var baseWithCard = 'Rg(G) = ' + current.r + ', dim(V) = ' + current.d + ', |G| = ' + current.n + '.';
        var baseText = current.isBasis
          ? baseWithCard + ' Como Rg(G) = |G| = dim(V), G es base de V.'
          : baseWithCard + ' ' + (current.generates ? 'G genera V, pero |G| ≠ dim(V), así que no es base.' : 'Como Rg(G) < dim(V), G ni siquiera genera V, así que no puede ser base.');
        return correct ? baseText : 'No es correcto. ' + baseText;
      }
    });
  })();

  (function () {

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }

  var DIM = { R2:2, R3:3, M22:4, P2:3 };

  function buildBasis(d){
    var pivotCols = [];
    var last = -1;
    for(var i=0;i<d;i++){
      var col = randInt(last+1, d-(d-i));
      pivotCols.push(col);
      last = col;
    }
    var rows = [];
    for(var i2=0;i2<d;i2++){
      var row = new Array(d).fill(0);
      row[pivotCols[i2]] = randNonZero(-4,4);
      for(var c=pivotCols[i2]+1;c<d;c++) row[c] = randInt(-3,3);
      rows.push(row);
    }
    var M = rows;
    for(var i3=M.length-1;i3>0;i3--){ var j=randInt(0,i3); var t=M[i3]; M[i3]=M[j]; M[j]=t; }
    var numOps = randInt(3,6);
    for(var op=0; op<numOps; op++){
      var kind = randChoice(['add','add','scale']);
      if(kind==='add'){
        var ai=randInt(0,d-1), aj=randInt(0,d-1);
        while(aj===ai) aj=randInt(0,d-1);
        var kk=randChoice([-2,-1,1,2]);
        M[aj] = M[aj].map(function(v,c2){ return v + kk*M[ai][c2]; });
      } else {
        var si=randInt(0,d-1);
        var sk=randChoice([-1,1,-1,1,2]);
        M[si] = M[si].map(function(v){ return v*sk; });
      }
    }
    return M;
  }

  function combine(basis, coefs){
    var d = basis[0].length;
    var v = new Array(d).fill(0);
    basis.forEach(function(b,i){ for(var c=0;c<d;c++) v[c] += coefs[i]*b[c]; });
    return v;
  }

  function generateCase(){
    var space = randChoice(['R2','R3','M22','P2']);
    var d = DIM[space];
    var basis = buildBasis(d);
    var coefs = [];
    for(var i=0;i<d;i++) coefs.push(randInt(-5,5));
    var v = combine(basis, coefs);
    return { space:space, d:d, basis:basis, v:v, coefs:coefs };
  }

  var SPACE_LABEL = { R2:'V = \\mathbb{R}^2', R3:'V = \\mathbb{R}^3', M22:'V = M_{2\\times2}(\\mathbb{R})', P2:'V = P_2(\\mathbb{R})' };

  function polyToLatex(coefs){
    var terms = [];
    var labels = ['','x','x^2'];
    for(var i=2;i>=0;i--){
      var c = coefs[i];
      if(c===0) continue;
      var abs = Math.abs(c);
      var coefStr = (i===0) ? String(abs) : (abs===1 ? '' : String(abs));
      var term = coefStr + labels[i];
      if(terms.length===0) terms.push((c<0?'-':'') + term);
      else terms.push((c<0?' - ':' + ') + term);
    }
    return terms.length ? terms.join('') : '0';
  }
  function vectorToLatex(space, v){
    if(space==='R2') return '(' + v[0] + ',\\ ' + v[1] + ')';
    if(space==='R3') return '(' + v[0] + ',\\ ' + v[1] + ',\\ ' + v[2] + ')';
    if(space==='M22') return '\\begin{pmatrix}' + v[0] + ' & ' + v[1] + '\\\\ ' + v[2] + ' & ' + v[3] + '\\end{pmatrix}';
    return polyToLatex(v);
  }

  function setHTML(items, bigBraces){
    var braceCmd = bigBraces ? '\\bigg' : '';
    var brace = '<span style="margin:0 4px;">' + window.katex.renderToString(braceCmd + '\\{', { throwOnError:false }) + '</span>';
    var closeBrace = '<span style="margin:0 4px;">' + window.katex.renderToString(braceCmd + '\\}', { throwOnError:false }) + '</span>';
    var inner = items.map(function(latex, idx){
      var comma = idx < items.length-1 ? '<span style="margin-right:8px;">,</span>' : '';
      return '<span style="white-space:nowrap;">' + window.katex.renderToString(latex, { throwOnError:false }) + comma + '</span>';
    }).join('');
    return '<span style="display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;row-gap:8px;column-gap:4px;">' + brace + inner + closeBrace + '</span>';
  }

  function renderContent(container, current){
    var basisLatexList = current.basis.map(function(b){ return vectorToLatex(current.space, b); });
    var vLatex = vectorToLatex(current.space, current.v);
    container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;"><div class="row-v"></div><div class="row-b"></div><div class="row-vec"></div><div class="row-q"></div></div>';
    window.katex.render(SPACE_LABEL[current.space], container.querySelector('.row-v'), { throwOnError:false });
    container.querySelector('.row-b').innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;">' +
        window.katex.renderToString('B=', { throwOnError:false }) +
        setHTML(basisLatexList, current.space==='M22') +
      '</span>' +
      '<div style="font-family:var(--font-mono,monospace);font-size:11px;color:var(--ink-soft,#A7ACC0);margin-top:6px;">(B es base de V)</div>';
    window.katex.render('v = ' + vLatex, container.querySelector('.row-vec'), { throwOnError:false });
    window.katex.render('\\text{Encontrá } [v]_B', container.querySelector('.row-q'), { throwOnError:false });
  }

  
    EXERCISES.push({
      id: 'coordenadas-base',
      title: 'Coordenadas de un vector en una base',
      unit: 'Unidad 2: Subespacios vectoriales',
      topic: 'Base y dimensión',
      needsKatex: true,
      type: 'grid',
      prompt: 'Dados v y una base B de V, encontrá las coordenadas [v]_B — los coeficientes que arman v como combinación lineal de B.',
      grid: { rows: function (current) { return current.d; }, cols: 1, noDivider: true },
      generate: generateCase,
      renderContent: renderContent,
      checkGrid: function (current, M, hasEmpty) {
        if (hasEmpty) return { correct: false, feedbackText: 'Dejaste alguna celda vacía.' };
        var reconstructed = combine(current.basis, M.map(function (row) { return row[0]; }));
        var ok = true;
        for (var i = 0; i < current.d; i++) if (reconstructed[i] !== current.v[i]) ok = false;
        if (ok) return { correct: true, feedbackText: '' };
        return { correct: false, feedbackText: 'No es correcto: esos coeficientes no reconstruyen v. Planteá v = c₁b₁+...+c' + current.d + 'b' + current.d + ' y resolvé el sistema.' };
      },
      getAnswerGrid: function (current) { return current.coefs.map(function (c) { return [c]; }); }
    });
  })();

  global.AptExercises = EXERCISES;
})(window);
