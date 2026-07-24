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

  global.AptExercises = EXERCISES;
})(window);
