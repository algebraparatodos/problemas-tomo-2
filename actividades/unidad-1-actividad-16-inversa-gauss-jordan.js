/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 16
   "Calculá la inversa por Gauss-Jordan"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-16-inversa-gauss-jordan.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a16')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a16';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }

    function identidad(n) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(r === c ? 1 : 0); }
      return M;
    }

    /* ---------- El generador ----------

       El problema de pedir una inversa a mano es que casi cualquier
       matriz entera tiene inversa con fracciones, y entonces el ejercicio
       deja de ser sobre Gauss-Jordan y pasa a ser sobre operar con
       fracciones feas en una grilla.

       La salida es construir la matriz desde la identidad aplicándole
       operaciones del tipo Fᵢ ← Fᵢ + c·Fⱼ. Esas operaciones no cambian el
       determinante, así que la matriz que sale tiene determinante 1 —y
       por lo tanto su inversa también es entera—, pero no se parece en
       nada a la identidad de la que salió. El alumno tiene que escalonar
       igual; lo único que le ahorramos son las fracciones.

       Se mezcla además algún cambio de signo de fila, que lleva el
       determinante a −1 y sigue dejando todo entero. */
    function generarInvertible(n) {
      var intentos = 0;
      while (intentos++ < 200) {
        var A = identidad(n);
        var pasos = n === 2 ? 3 : 5;
        for (var k = 0; k < pasos; k++) {
          var i = randInt(0, n - 1), j;
          do { j = randInt(0, n - 1); } while (j === i);
          var c = randNonZero(-2, 2);
          for (var col = 0; col < n; col++) A[i][col] += c * A[j][col];
        }
        if (Math.random() < 0.4) {
          var f = randInt(0, n - 1);
          for (var q = 0; q < n; q++) A[f][q] = -A[f][q];
        }

        // Ni demasiado grande (incómodo de escalonar a mano) ni
        // demasiado parecido a la identidad (se resolvería de un vistazo).
        var maxAbs = 0, distintosDeI = 0;
        for (var r2 = 0; r2 < n; r2++) {
          for (var c2 = 0; c2 < n; c2++) {
            maxAbs = Math.max(maxAbs, Math.abs(A[r2][c2]));
            if (A[r2][c2] !== (r2 === c2 ? 1 : 0)) distintosDeI++;
          }
        }
        if (maxAbs > 9 || distintosDeI < n) continue;
        return A;
      }
      return identidad(n);
    }

    function determinante(A) {
      var n = A.length;
      if (n === 1) return A[0][0];
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      var suma = 0;
      for (var c = 0; c < n; c++) suma += (c % 2 ? -1 : 1) * A[0][c] * determinante(menor(A, 0, c));
      return suma;
    }

    function menor(A, fila, col) {
      var M = [];
      for (var r = 0; r < A.length; r++) {
        if (r === fila) continue;
        var f = [];
        for (var c = 0; c < A.length; c++) { if (c !== col) f.push(A[r][c]); }
        M.push(f);
      }
      return M;
    }

    /* La inversa por la adjunta. Sale exacta porque el generador
       garantiza determinante ±1; con cualquier otra matriz esto habría
       que hacerlo con fracciones. */
    function inversa(A) {
      var n = A.length, det = determinante(A), M = [], r, c;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) {
          var cof = ((r + c) % 2 ? -1 : 1) * determinante(menor(A, c, r));
          M[r].push(cof / det);
        }
      }
      return M;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    function generarCaso() {
      var n = Math.random() < 0.45 ? 2 : 3;
      var A = generarInvertible(n);
      return { n: n, A: A, respuesta: inversa(A) };
    }

    function explicar(current, correcto) {
      var det = determinante(current.A);
      var base = correcto
        ? '¡Correcto! '
        : 'No es correcto. ';
      return base +
        'El determinante de esta matriz vale ' + det + ', así que es invertible y ' +
        'su inversa tiene todas las entradas enteras. Para comprobar el resultado ' +
        'alcanza con multiplicar: A · A⁻¹ tiene que dar la identidad.';
    }

    window.AptActivity.init({
      mount: '#apt-u1a16',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Calculá la inversa por Gauss-Jordan',
      subtitle: 'Escribí la matriz ampliada (A | I), escalonala hasta llegar a (I | A⁻¹), y completá acá la inversa que te quedó. Todas las entradas son números enteros.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'grid',
      grid: {
        rows: function (current) { return current.n; },
        cols: function (current) { return current.n; },
        noDivider: true
      },
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.A), container, { throwOnError: false });
      },
      checkGrid: function (current, M, hasEmpty) {
        var n = current.n, r, c;
        var estado = [], todoBien = !hasEmpty;

        for (r = 0; r < n; r++) {
          var fila = [];
          for (c = 0; c < n; c++) {
            var ok = M[r][c] === current.respuesta[r][c];
            if (!ok) todoBien = false;
            fila.push(ok ? 'correct' : 'wrong');
          }
          estado.push(fila);
        }

        if (hasEmpty) {
          return {
            correct: false,
            cellStatus: estado,
            feedbackText: 'Te quedaron celdas vacías. Completalas todas antes de comprobar.'
          };
        }

        return {
          correct: todoBien,
          cellStatus: estado,
          feedbackText: explicar(current, todoBien)
        };
      },
      getAnswerGrid: function (current) { return current.respuesta; },
      answerTitle: 'La inversa correcta',
      answerText: 'La inversa de una matriz es única, así que esta es la única respuesta posible.'
    });
  })();

})();
