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

  global.AptExercises = EXERCISES;
})(window);
