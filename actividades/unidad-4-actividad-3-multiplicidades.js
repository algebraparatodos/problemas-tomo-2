/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 3
   "Multiplicidad algebraica y geométrica"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-3-multiplicidades.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a3')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a3';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = randInt(0, i), t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function multiplicar(A, B, n) {
      var M = [], r, c, k;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) { var s = 0; for (k = 0; k < n; k++) s += A[r][k] * B[k][c]; M[r].push(s); }
      }
      return M;
    }

    /* ---------- Las dos formas de tener un autovalor doble ----------

       Éste es el corazón de la unidad, y la única manera de que el alumno
       lo vea es ponerle delante los dos casos con el mismo autovalor
       repetido:

       - Si la matriz viene de una diagonal con λ dos veces, el
         autoespacio tiene dimensión 2 y MG = MA. Es diagonalizable.
       - Si viene de un bloque con un 1 arriba de la diagonal, el
         autoespacio se queda en dimensión 1 y MG < MA. No lo es.

       Las dos matrices tienen exactamente el mismo polinomio
       característico, así que no hay forma de distinguirlas sin calcular
       el núcleo de (A − λI). Que es justamente lo que hay que aprender. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = 3;
        var lambda = randChoice([-2, -1, 1, 2, 3]);
        var otro;
        do { otro = randChoice([-3, -2, -1, 1, 2, 3, 4]); } while (otro === lambda);

        var completa = Math.random() < 0.5;

        // La base: diagonal con λ dos veces, o el bloque con el 1.
        var D = [
          [lambda, completa ? 0 : 1, 0],
          [0, lambda, 0],
          [0, 0, otro]
        ];

        var P = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], k, i, j, f, c;
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
        for (i = 0; i < n; i++) for (c = 0; c < n; c++) if (Math.abs(A[i][c]) > 14) grande = true;
        if (grande) continue;

        // La geométrica se calcula de verdad sobre la matriz que se
        // muestra, no se da por supuesta del generador.
        var mg = n - rango(restar(A, lambda, n), n);
        var esperada = completa ? 2 : 1;
        if (mg !== esperada) continue;

        // Y la algebraica tiene que ser 2: si el otro autovalor hubiera
        // coincidido, sería 3.
        if (otro === lambda) continue;

        var pares = [
          { ma: 2, mg: 2 }, { ma: 2, mg: 1 }, { ma: 1, mg: 1 }, { ma: 3, mg: 2 }
        ];
        var opciones = shuffle(pares).map(function (p) {
          return {
            value: p.ma + ',' + p.mg,
            label: 'MA(λ) = ' + p.ma + '   y   MG(λ) = ' + p.mg
          };
        });

        return {
          n: n, A: A, lambda: lambda, otro: otro,
          ma: 2, mg: mg,
          diagonalizable: mg === 2,
          opciones: opciones
        };
      }
      return null;
    }

    function restar(A, lambda, n) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(A[r][c] - (r === c ? lambda : 0)); }
      return M;
    }

    /** Rango por eliminación con fracciones, para no arrastrar redondeos. */
    function rango(M, n) {
      var A = [], r, c;
      for (r = 0; r < n; r++) { A.push([]); for (c = 0; c < n; c++) A[r].push(M[r][c]); }
      var fila = 0;
      for (var col = 0; col < n && fila < n; col++) {
        var pivote = -1;
        for (r = fila; r < n; r++) if (A[r][col] !== 0) { pivote = r; break; }
        if (pivote === -1) continue;
        var t = A[pivote]; A[pivote] = A[fila]; A[fila] = t;
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
      var d = determinante(A, n);
      if (d !== 1 && d !== -1) return null;
      var M = [], r, c;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) M[r].push(((r + c) % 2 ? -1 : 1) * determinante(menor(A, c, r), n - 1) / d);
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
    function determinante(A, n) {
      if (n === 1) return A[0][0];
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      var s = 0;
      for (var c = 0; c < n; c++) s += (c % 2 ? -1 : 1) * A[0][c] * determinante(menor(A, 0, c), n - 1);
      return s;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a3',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Multiplicidad algebraica y geométrica',
      subtitle: 'El polinomio característico de esta matriz tiene a λ como raíz doble. La pregunta es qué dimensión tiene su autoespacio.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choicesStacked: true,
      choices: function (current) { return current.opciones; },
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          matrixLatex(current.A) + '\\qquad \\lambda = ' + current.lambda,
          container, { throwOnError: false }
        );
      },
      check: function (current, value) {
        return value === current.ma + ',' + current.mg;
      },
      explain: function (current, correcto) {
        var base = (correcto ? '¡Correcto! ' : 'No es correcto. ') +
          'MA(λ)=2 porque λ=' + current.lambda + ' es raíz doble del polinomio característico ' +
          '(el otro autovalor es ' + current.otro + '). Y MG(λ)=' + current.mg +
          ' porque el autoespacio E_λ = Nuc(A − λI) tiene dimensión ' + current.mg + '. ';

        return base + (current.diagonalizable
          ? 'Como MG = MA para los dos autovalores, esta matriz sí es diagonalizable.'
          : 'Como MG < MA, esta matriz no es diagonalizable: le falta un autovector para llegar a los tres que hacen falta. ' +
            'Fijate que el polinomio característico no alcanza para saberlo — hay matrices con este mismo polinomio que sí son diagonalizables.');
      }
    });
  })();

})();
