/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 5
   "¿Qué se conserva al cambiar de base?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-5-invariantes.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a5')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a5';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function multiplicar(A, B, n) {
      var M = [], r, c, k;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) { var s = 0; for (k = 0; k < n; k++) s += A[r][k] * B[k][c]; M[r].push(s); }
      }
      return M;
    }
    function traza(M, n) { var s = 0; for (var r = 0; r < n; r++) s += M[r][r]; return s; }
    function determinante(A) {
      var n = A.length;
      if (n === 1) return A[0][0];
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      var s = 0;
      for (var c = 0; c < n; c++) {
        var men = [];
        for (var r = 1; r < n; r++) {
          var f = [];
          for (var k = 0; k < n; k++) if (k !== c) f.push(A[r][k]);
          men.push(f);
        }
        s += (c % 2 ? -1 : 1) * A[0][c] * determinante(men);
      }
      return s;
    }
    function rango(M, n) {
      var A = [], r, c;
      for (r = 0; r < n; r++) { A.push([]); for (c = 0; c < n; c++) A[r].push(M[r][c]); }
      var fila = 0;
      for (var col = 0; col < n && fila < n; col++) {
        var p = -1;
        for (r = fila; r < n; r++) if (A[r][col] !== 0) { p = r; break; }
        if (p === -1) continue;
        var t = A[p]; A[p] = A[fila]; A[fila] = t;
        for (r = fila + 1; r < n; r++) {
          if (A[r][col] === 0) continue;
          var num = A[r][col], den = A[fila][col];
          for (c = col; c < n; c++) A[r][c] = A[r][c] * den - A[fila][c] * num;
        }
        fila++;
      }
      return fila;
    }

    /* ---------- Por qué las dos últimas opciones ----------

       Las cuatro primeras cantidades son invariantes de semejanza y la
       respuesta correcta siempre las incluye. Las dos últimas —una
       entrada concreta de la matriz y la primera columna— no lo son, y
       están para que quede claro qué **no** se conserva: la matriz
       cambia entera, lo que no cambia es lo que la matriz dice de la
       transformación.

       Como podrían coincidir por casualidad, el generador descarta esos
       casos en vez de darlos por buenos: si la entrada (1,1) fuera la
       misma en A y en B, marcarla sería correcto y el alumno aprendería
       lo contrario de lo que la actividad quiere enseñar. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = Math.random() < 0.5 ? 2 : 3;

        var A = [], r, c;
        for (r = 0; r < n; r++) { A.push([]); for (c = 0; c < n; c++) A[r].push(randInt(-4, 5)); }

        var P = [], k, i, j, f;
        for (r = 0; r < n; r++) { P.push([]); for (c = 0; c < n; c++) P[r].push(r === c ? 1 : 0); }
        for (k = 0; k < (n === 2 ? 2 : 3); k++) {
          i = randInt(0, n - 1);
          do { j = randInt(0, n - 1); } while (j === i);
          f = randChoice([-2, -1, 1, 2]);
          for (c = 0; c < n; c++) P[i][c] += f * P[j][c];
        }
        var Pinv = inversaEntera(P, n);
        if (!Pinv) continue;

        var B = multiplicar(multiplicar(Pinv, A, n), P, n);

        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(B[r][c]) > 25) grande = true;
        if (grande) continue;

        // Las dos cantidades que NO son invariantes tienen que diferir de
        // verdad en este caso concreto.
        if (A[0][0] === B[0][0]) continue;
        var mismaColumna = true;
        for (r = 0; r < n; r++) if (A[r][0] !== B[r][0]) mismaColumna = false;
        if (mismaColumna) continue;

        return {
          n: n, A: A, B: B,
          traza: traza(A, n),
          determinante: determinante(A),
          rango: rango(A, n),
          entradaA: A[0][0], entradaB: B[0][0],
          opciones: [
            { value: 'traza', label: 'La traza', correct: true },
            { value: 'determinante', label: 'El determinante', correct: true },
            { value: 'rango', label: 'El rango', correct: true },
            { value: 'polinomio', label: 'El polinomio característico (y con él los autovalores)', correct: true },
            { value: 'entrada', label: 'La entrada de la posición (1,1)', correct: false },
            { value: 'columna', label: 'La primera columna', correct: false }
          ]
        };
      }
      return null;
    }

    function inversaEntera(A, n) {
      var d = determinante(A);
      if (d !== 1 && d !== -1) return null;
      var M = [], r, c;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) M[r].push(((r + c) % 2 ? -1 : 1) * determinante(menor(A, c, r)) / d);
      }
      return M;
    }
    function menor(A, fila, col) {
      var M = [], r, c;
      for (r = 0; r < A.length; r++) {
        if (r === fila) continue;
        var f = [];
        for (c = 0; c < A.length; c++) if (c !== col) f.push(A[r][c]);
        M.push(f);
      }
      return M;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a5',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: '¿Qué se conserva al cambiar de base?',
      subtitle: 'B se obtuvo de A con un cambio de base, o sea B = P⁻¹·A·P. Marcá todo lo que sea igual en las dos.',
      nextLabel: 'Probar con otro par →',
      needsKatex: true,
      mode: 'multiselect',
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          'A = ' + matrixLatex(current.A) + '\\qquad B = ' + matrixLatex(current.B),
          container, { throwOnError: false }
        );
      },
      options: function (current) { return current.opciones; },
      explain: function (current, correcto) {
        return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
          'Se conservan la traza (vale ' + current.traza + ' en las dos), el determinante (' +
          current.determinante + '), el rango (' + current.rango + ') y el polinomio característico, ' +
          'y por lo tanto también los autovalores con sus multiplicidades. ' +
          'No se conserva ninguna entrada suelta: acá la de la posición (1,1) pasó de ' +
          current.entradaA + ' a ' + current.entradaB + ', y las columnas cambian enteras. ' +
          'Y esa es la idea de fondo: la matriz cambia por completo, porque depende de la base; ' +
          'lo que no cambia es lo que la matriz dice de la transformación.';
      }
    });
  })();

})();
