/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 25
   "Resolvé la ecuación matricial"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-25-ecuaciones-matriciales.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a25')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a25';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = randInt(0, i), t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function identidad(n) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(r === c ? 1 : 0); }
      return M;
    }
    function multiplicar(A, B) {
      var n = A.length, M = [], r, c, k;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) {
          var s = 0;
          for (k = 0; k < n; k++) s += A[r][k] * B[k][c];
          M[r].push(s);
        }
      }
      return M;
    }

    /* A se construye desde la identidad con operaciones que no cambian el
       determinante, igual que en la actividad 16: así A es invertible, su
       inversa es entera, y X también lo es. Sin eso, resolver AX=B a mano
       terminaría en una grilla llena de fracciones. */
    function generarInvertible(n) {
      var intentos = 0;
      while (intentos++ < 200) {
        var A = identidad(n);
        for (var k = 0; k < (n === 2 ? 3 : 4); k++) {
          var i = randInt(0, n - 1), j;
          do { j = randInt(0, n - 1); } while (j === i);
          var c = randNonZero(-2, 2);
          for (var col = 0; col < n; col++) A[i][col] += c * A[j][col];
        }
        var maxAbs = 0, distintos = 0;
        for (var r = 0; r < n; r++) {
          for (var q = 0; q < n; q++) {
            maxAbs = Math.max(maxAbs, Math.abs(A[r][q]));
            if (A[r][q] !== (r === q ? 1 : 0)) distintos++;
          }
        }
        if (maxAbs > 6 || distintos < n) continue;
        return A;
      }
      return identidad(n);
    }

    /* ---------- Los dos lados ----------

       En A·X = B hay que multiplicar por A⁻¹ **por la izquierda**, porque
       es del lado por el que A toca a X. En X·A = B, por la derecha. El
       producto de matrices no conmuta, así que elegir el lado equivocado
       da otra matriz, y ese es el error que esta actividad va a buscar:
       la primera pregunta es justamente por el despeje. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 300) {
        var n = Math.random() < 0.5 ? 2 : 3;
        var A = generarInvertible(n);

        var X = [], r, c;
        for (r = 0; r < n; r++) { X.push([]); for (c = 0; c < n; c++) X[r].push(randInt(-3, 4)); }

        var porIzquierda = Math.random() < 0.5;
        var B = porIzquierda ? multiplicar(A, X) : multiplicar(X, A);

        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(B[r][c]) > 40) grande = true;
        if (grande) continue;

        // El despeje del otro lado tiene que dar algo distinto, o la
        // primera pregunta no distinguiría nada.
        var alReves = porIzquierda ? multiplicar(B, inversa(A, n)) : multiplicar(inversa(A, n), B);
        var iguales = true;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (alReves[r][c] !== X[r][c]) iguales = false;
        if (iguales) continue;

        var correcto = porIzquierda ? 'izquierda' : 'derecha';
        var opciones = shuffle([
          { value: 'izquierda', label: 'X = A⁻¹·B  (multiplicando por A⁻¹ a la izquierda)' },
          { value: 'derecha', label: 'X = B·A⁻¹  (multiplicando por A⁻¹ a la derecha)' }
        ]);

        return {
          n: n, A: A, B: B, X: X,
          porIzquierda: porIzquierda,
          ecuacion: porIzquierda ? 'A\\cdot X = B' : 'X\\cdot A = B',
          correcto: correcto,
          opciones: opciones
        };
      }
      return null;
    }

    /* La inversa por la adjunta. Sale exacta porque A se construyó con
       determinante 1. */
    function inversa(A, n) {
      var d = determinante(A), M = [], r, c;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) {
          M[r].push(((r + c) % 2 ? -1 : 1) * determinante(menor(A, c, r)) / d);
        }
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
      mount: '#apt-u1a25',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Resolvé la ecuación matricial',
      subtitle: 'A es invertible y X es la incógnita. Ojo con el lado: el producto de matrices no conmuta.',
      nextLabel: 'Probar con otra ecuación →',
      needsKatex: true,
      mode: 'phases',
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(
          current.ecuacion + '\\qquad A = ' + matrixLatex(current.A) +
          '\\qquad B = ' + matrixLatex(current.B),
          container, { throwOnError: false }
        );
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Cómo se despeja X?',
          choicesStacked: true,
          choices: function (current) { return current.opciones; },
          check: function (current, value) { return value === current.correcto; },
          explain: function (current, correcto) {
            var lado = current.porIzquierda ? 'izquierda' : 'derecha';
            var otro = current.porIzquierda ? 'derecha' : 'izquierda';
            return (correcto ? '¡Correcto! ' : 'No es ese lado. ') +
              'En ' + (current.porIzquierda ? 'A·X = B' : 'X·A = B') +
              ', la A toca a X por la ' + lado + ', así que hay que multiplicar por A⁻¹ por la ' + lado +
              ' en los dos miembros: así A⁻¹·A se cancela y queda X sola. ' +
              'Si multiplicás por la ' + otro + ', la A y la A⁻¹ no quedan juntas y no se cancelan.';
          }
        },
        {
          mode: 'grid',
          question: 'Ahora calculá X:',
          grid: {
            rows: function (current) { return current.n; },
            cols: function (current) { return current.n; },
            noDivider: true
          },
          checkGrid: function (current, G, hayVacias) {
            var n = current.n, r, c, estado = [], todoBien = !hayVacias;
            for (r = 0; r < n; r++) {
              var fila = [];
              for (c = 0; c < n; c++) {
                var ok = G[r][c] === current.X[r][c];
                if (!ok) todoBien = false;
                fila.push(ok ? 'correct' : 'wrong');
              }
              estado.push(fila);
            }
            if (hayVacias) {
              return { correct: false, cellStatus: estado, feedbackText: 'Te quedaron celdas vacías. Completalas todas antes de comprobar.' };
            }
            return {
              correct: todoBien,
              cellStatus: estado,
              feedbackText: todoBien
                ? '¡Correcto! Podés comprobarlo multiplicando: ' + (current.porIzquierda ? 'A·X' : 'X·A') + ' tiene que dar B.'
                : 'No es correcto. Revisá el orden del producto: ' + (current.porIzquierda ? 'A⁻¹·B' : 'B·A⁻¹') + ', en ese orden y no al revés.'
            };
          },
          getAnswerGrid: function (current) { return current.X; },
          answerTitle: 'La X correcta',
          answerText: 'Como A es invertible, esta ecuación tiene una única solución.'
        }
      ]
    });
  })();

})();
