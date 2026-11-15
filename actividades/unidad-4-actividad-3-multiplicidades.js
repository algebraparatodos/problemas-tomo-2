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

       La matriz es de 3×3 con dos autovalores: uno doble y uno simple. Y
       el doble aparece de las dos maneras posibles:

       - Si la matriz viene de una diagonal con λ dos veces, el
         autoespacio tiene dimensión 2 y MG = MA.
       - Si viene de un bloque con un 1 arriba de la diagonal, el
         autoespacio se queda en dimensión 1 y MG < MA.

       Las dos matrices tienen exactamente el mismo polinomio
       característico, así que no hay forma de distinguirlas sin calcular
       el núcleo de (A − λI). Que es justamente lo que hay que aprender.

       Se pide el par (MA, MG) de CADA autovalor, como dice el QR del
       libro, en una fase por autovalor. Los dos se muestran ordenados de
       menor a mayor, así que el doble puede ser λ₁ o λ₂: para saber cuál
       es hay que mirar el polinomio característico. */
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

        // Las geométricas se calculan de verdad sobre la matriz que se
        // muestra, no se dan por supuestas del generador.
        var rgDoble = rango(restar(A, lambda, n), n);
        var rgSimple = rango(restar(A, otro, n), n);
        var mg = n - rgDoble;
        var esperada = completa ? 2 : 1;
        if (mg !== esperada) continue;
        if (n - rgSimple !== 1) continue;

        var doble = { valor: lambda, ma: 2, mg: mg, rango: rgDoble };
        var simple = { valor: otro, ma: 1, mg: 1, rango: rgSimple };
        var autovalores = lambda < otro ? [doble, simple] : [simple, doble];

        autovalores.forEach(function (av, idx) {
          av.indice = idx + 1;
          av.opciones = shuffle(PARES).map(function (p) {
            return {
              value: p.ma + ',' + p.mg,
              label: 'MA(λ' + SUB[idx + 1] + ') = ' + p.ma + '   y   MG(λ' + SUB[idx + 1] + ') = ' + p.mg
            };
          });
        });

        return {
          n: n, A: A,
          autovalores: autovalores,
          diagonalizable: mg === 2
        };
      }
      return null;
    }

    var SUB = ['₀', '₁', '₂', '₃'];

    /* Los mismos cuatro pares para los dos autovalores. Con dos
       autovalores distintos en una matriz de 3×3, MA vale 1 o 2. El par
       (1, 2) es la trampa de quien calcula bien el autoespacio pero no
       mira el polinomio: la geométrica nunca puede superar a la
       algebraica. */
    var PARES = [{ ma: 1, mg: 1 }, { ma: 2, mg: 1 }, { ma: 2, mg: 2 }, { ma: 1, mg: 2 }];

    function restar(A, lambda, n) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(A[r][c] - (r === c ? lambda : 0)); }
      return M;
    }

    /** Rango por eliminación sin divisiones (todo queda entero). */
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

    /* ---------- Textos de la explicación, con los números del caso ---------- */
    function num(x) { return x < 0 ? '−' + Math.abs(x) : String(x); }
    // «A − 2I», «A + I», «A − I»
    function aMenosLambdaI(x) {
      var ax = Math.abs(x);
      return 'A ' + (x < 0 ? '+' : '−') + ' ' + (ax === 1 ? '' : ax) + 'I';
    }
    // p(λ) = det(A − λI) factorizado, como en el libro: (2 − λ)²(−1 − λ)
    function polinomioFactorizado(cur) {
      var d = cur.autovalores.filter(function (av) { return av.ma === 2; })[0];
      var s = cur.autovalores.filter(function (av) { return av.ma === 1; })[0];
      return '(' + num(d.valor) + ' − λ)²(' + num(s.valor) + ' − λ)';
    }

    function porQue(cur, av) {
      var nombre = 'λ' + SUB[av.indice];
      var raiz = 'MA(' + nombre + ') = ' + av.ma + ' porque ' + nombre + ' = ' + num(av.valor) + ' es raíz ' +
        (av.ma === 2 ? 'doble' : 'simple') + ' del polinomio característico, p(λ) = ' + polinomioFactorizado(cur) + '. ';
      var auto = 'Y MG(' + nombre + ') = ' + av.mg + ' porque su autoespacio, Nu(' + aMenosLambdaI(av.valor) +
        '), tiene dimensión 3 − Rango(' + aMenosLambdaI(av.valor) + ') = 3 − ' + av.rango + ' = ' + av.mg + '.';
      return raiz + auto;
    }

    function cierre(cur) {
      if (cur.diagonalizable) {
        return ' Como MG = MA para los dos autovalores, en 4.2.2 vas a ver que esta matriz es diagonalizable.';
      }
      return ' Como MG < MA en el autovalor doble, en 4.2.2 vas a ver que esta matriz no es diagonalizable: le falta un autovector para llegar a los tres que hacen falta. ' +
        'Fijate que el polinomio característico no alcanza para saberlo — hay matrices con este mismo polinomio que sí son diagonalizables.';
    }

    function fase(idx) {
      var nombreTex = '\\lambda_' + (idx + 1);
      return {
        mode: 'choices',
        question: 'Multiplicidad algebraica y geométrica de $' + nombreTex + '$:',
        choicesStacked: true,
        choices: function (current) { return current.autovalores[idx].opciones; },
        check: function (current, value) {
          var av = current.autovalores[idx];
          return value === av.ma + ',' + av.mg;
        },
        explain: function (current, correcto) {
          var texto = (correcto ? '¡Correcto! ' : 'No es correcto. ') + porQue(current, current.autovalores[idx]);
          // La conclusión va en la última fase, cuando ya están los dos.
          if (idx === 1) texto += cierre(current);
          return texto;
        }
      };
    }

    window.AptActivity.init({
      mount: '#apt-u4a3',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Multiplicidad algebraica y geométrica',
      subtitle: 'Te doy la matriz y sus dos autovalores. Para cada uno, encontrá la multiplicidad algebraica (cuántas veces es raíz del polinomio característico) y la geométrica (la dimensión de su autoespacio).',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'phases',
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          'A = ' + matrixLatex(current.A) + '\\qquad \\lambda_1 = ' + current.autovalores[0].valor +
            ',\\ \\ \\lambda_2 = ' + current.autovalores[1].valor,
          container, { throwOnError: false }
        );
      },
      phases: [fase(0), fase(1)]
    });
  })();

})();
