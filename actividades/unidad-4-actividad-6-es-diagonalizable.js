/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 6
   "¿Es diagonalizable?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-6-es-diagonalizable.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a6')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a6';
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

    /* ---------- Los tres casos que se generan ----------

       Son los tres que el alumno se va a encontrar, y el orden en que se
       deciden es distinto en cada uno:

       - **Autovalores todos distintos.** Es diagonalizable y no hace
         falta calcular ninguna multiplicidad geométrica: lo dice el
         corolario de 4.2.2.
       - **Autovalor doble con MG = 2.** También lo es, pero acá sí hubo
         que calcular el núcleo para saberlo.
       - **Autovalor doble con MG = 1.** No lo es, y es el único caso en
         que la respuesta es que no.

       Los dos últimos comparten el mismo polinomio característico, así
       que la actividad no se puede resolver mirando sólo los autovalores.
       Eso es deliberado. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = 3;
        var tipo = randChoice(['distintos', 'doble-completo', 'doble-deficiente']);

        var D, lambda, otro;
        if (tipo === 'distintos') {
          var vals = [];
          while (vals.length < 3) {
            var v = randChoice([-3, -2, -1, 1, 2, 3, 4]);
            if (vals.indexOf(v) === -1) vals.push(v);
          }
          D = [[vals[0], 0, 0], [0, vals[1], 0], [0, 0, vals[2]]];
        } else {
          lambda = randChoice([-2, -1, 1, 2, 3]);
          do { otro = randChoice([-3, -2, -1, 1, 2, 3, 4]); } while (otro === lambda);
          D = [
            [lambda, tipo === 'doble-completo' ? 0 : 1, 0],
            [0, lambda, 0],
            [0, 0, otro]
          ];
        }

        var P = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], k, i, j, f, c, r;
        for (k = 0; k < 4; k++) {
          i = randInt(0, n - 1);
          do { j = randInt(0, n - 1); } while (j === i);
          f = randChoice([-2, -1, 1, 2]);
          for (c = 0; c < n; c++) P[i][c] += f * P[j][c];
        }
        var Pinv = inversaEntera(P, n);
        if (!Pinv) continue;

        var A = multiplicar(multiplicar(P, D, n), Pinv, n);

        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(A[r][c]) > 14) grande = true;
        if (grande) continue;

        // Ni diagonal ni triangular: se resolvería de un vistazo.
        var superior = true, inferior = true;
        for (r = 0; r < n; r++) {
          for (c = 0; c < n; c++) {
            if (r > c && A[r][c] !== 0) superior = false;
            if (r < c && A[r][c] !== 0) inferior = false;
          }
        }
        if (superior || inferior) continue;

        var diagonalizable, motivo;
        if (tipo === 'distintos') {
          diagonalizable = true;
          motivo = 'distintos';
        } else {
          var mg = n - rango(restar(A, lambda, n), n);
          if (tipo === 'doble-completo' && mg !== 2) continue;
          if (tipo === 'doble-deficiente' && mg !== 1) continue;
          diagonalizable = mg === 2;
          motivo = diagonalizable ? 'doble-completo' : 'doble-deficiente';
        }

        return {
          n: n, A: A, diagonalizable: diagonalizable, motivo: motivo,
          lambda: lambda === undefined ? null : lambda,
          otro: otro === undefined ? null : otro
        };
      }
      return null;
    }

    function restar(A, lambda, n) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(A[r][c] - (r === c ? lambda : 0)); }
      return M;
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
    function determinante(A) {
      var n = A.length;
      if (n === 1) return A[0][0];
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      var s = 0;
      for (var c = 0; c < n; c++) s += (c % 2 ? -1 : 1) * A[0][c] * determinante(menor(A, 0, c));
      return s;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a6',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: '¿Es diagonalizable?',
      subtitle: 'Calculá los autovalores. Si salen todos distintos ya está; si alguno se repite, hay que mirar su autoespacio.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choices: [
        { value: 'si', label: 'Sí, es diagonalizable' },
        { value: 'no', label: 'No, no lo es' }
      ],
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.A), container, { throwOnError: false });
      },
      check: function (current, value) {
        return (value === 'si') === current.diagonalizable;
      },
      explain: function (current, correcto) {
        var cabeza = correcto ? '¡Correcto! ' : 'No es correcto. ';

        if (current.motivo === 'distintos') {
          return cabeza + 'Sus tres autovalores son distintos entre sí, y con eso ya alcanza: ' +
            'por el corolario de 4.2.2, una matriz de n×n con n autovalores distintos es siempre diagonalizable. ' +
            'Ni siquiera hace falta calcular las multiplicidades geométricas.';
        }

        if (current.motivo === 'doble-completo') {
          return cabeza + 'El autovalor λ=' + current.lambda + ' es doble, así que acá el corolario no dice nada ' +
            'y hay que calcular. Su autoespacio tiene dimensión 2, o sea MG=MA, y como el otro autovalor (' +
            current.otro + ') es simple, se cumple la condición para todos: es diagonalizable.';
        }

        return cabeza + 'El autovalor λ=' + current.lambda + ' es doble pero su autoespacio tiene dimensión 1: ' +
          'MG=1 y MA=2. Como falta un autovector, no hay forma de armar tres columnas independientes para P, ' +
          'y la matriz no es diagonalizable. Fijate que el polinomio característico no lo delataba: ' +
          'hay matrices con este mismo polinomio que sí lo son.';
      }
    });
  })();

})();
