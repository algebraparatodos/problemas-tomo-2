/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 24
   "¿Es invertible?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-24-es-invertible.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a24')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a24';
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

    function det(M) {
      var n = M.length;
      if (n === 1) return M[0][0];
      if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
      var suma = 0;
      for (var c = 0; c < n; c++) {
        if (M[0][c] === 0) continue;
        var men = [];
        for (var r = 1; r < n; r++) {
          var f = [];
          for (var k = 0; k < n; k++) if (k !== c) f.push(M[r][k]);
          men.push(f);
        }
        suma += (c % 2 ? -1 : 1) * M[0][c] * det(men);
      }
      return suma;
    }

    function tx(tex) { return window.katex.renderToString(tex, { throwOnError: false }); }
    function linea(esFila, i) { return tx((esFila ? 'F_' : 'C_') + i); }

    function matrizAlAzar(n, min, max) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(randInt(min, max)); }
      return M;
    }

    /* ---------- Las cuatro formas de que salga singular ----------

       Son las que el alumno tiene que aprender a ver sin calcular el
       determinante, porque son las que aparecen en la práctica. Cada una
       viene con el texto que explica dónde mirar: eso es lo que convierte
       la actividad en algo más que adivinar un sí o un no. */

    function conFilaDeCeros(n) {
      var M = matrizAlAzar(n, -3, 4);
      var esFila = Math.random() < 0.5, i = randInt(0, n - 1), k;
      for (k = 0; k < n; k++) { if (esFila) M[i][k] = 0; else M[k][i] = 0; }
      return {
        M: M,
        porque: (esFila ? 'la fila ' : 'la columna ') + linea(esFila, i + 1) + ' es toda ceros, así que por P3 el determinante es cero'
      };
    }

    function conLineaProporcional(n) {
      var M = matrizAlAzar(n, -3, 4);
      var i = randInt(0, n - 1), j;
      do { j = randInt(0, n - 1); } while (j === i);
      var factor = randChoice([-3, -2, 2, 3]);
      for (var k = 0; k < n; k++) M[j][k] = factor * M[i][k];
      return {
        M: M,
        porque: 'la fila ' + linea(true, j + 1) + ' es múltiplo de la fila ' + linea(true, i + 1) + ' (' +
          tx('F_' + (j + 1) + ' = ' + factor + 'F_' + (i + 1)) + '), así que por P6 el determinante es cero'
      };
    }

    function conFilaCombinacion(n) {
      var M = matrizAlAzar(n, -3, 4);
      var a = randChoice([-2, -1, 1, 2]), b = randChoice([-2, -1, 1, 2]);
      var destino = randInt(2, n - 1);
      for (var k = 0; k < n; k++) M[destino][k] = a * M[0][k] + b * M[1][k];
      function termino(coef, fila, primero) {
        var abs = Math.abs(coef), txt = (abs === 1 ? '' : abs) + 'F_' + fila;
        if (primero) return (coef < 0 ? '-' : '') + txt;
        return (coef < 0 ? ' - ' : ' + ') + txt;
      }
      var igualdad = 'F_' + (destino + 1) + ' = ' + termino(a, 1, true) + termino(b, 2, false);
      var resta = 'F_' + (destino + 1) + termino(-a, 1, false) + termino(-b, 2, false);
      return {
        M: M,
        porque: 'la fila ' + linea(true, destino + 1) + ' sale de combinar las dos primeras (' + tx(igualdad) +
          '). Si le hacés ' + tx(resta) + ', que por P7 no cambia el determinante, queda una fila de ceros, y por P3 el determinante es cero'
      };
    }

    function invertible(n) {
      var M = matrizAlAzar(n, -3, 4);
      return { M: M, porque: null };
    }

    var SINGULARES = [conFilaDeCeros, conLineaProporcional, conFilaCombinacion];
    var vistos = [0, 0, 0];

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = randChoice([3, 3, 4]);
        // Mitad y mitad, para que no se pueda acertar por costumbre.
        var buscarInvertible = Math.random() < 0.5;

        if (buscarInvertible) {
          var caso = invertible(n);
          var d = det(caso.M);
          if (d === 0) continue;
          if (Math.abs(d) > 200) continue;
          return { n: n, M: caso.M, invertible: true, det: d, porque: null };
        }

        var minimo = Math.min.apply(null, vistos), candidatos = [];
        for (var k = 0; k < SINGULARES.length; k++) if (vistos[k] === minimo) candidatos.push(k);
        var cual = randChoice(candidatos);
        var singular = SINGULARES[cual](n);

        // Se comprueba de verdad: un generador puede fallar, y decirle al
        // alumno que una matriz no es invertible cuando sí lo es sería el
        // peor error posible en esta actividad.
        if (det(singular.M) !== 0) continue;

        vistos[cual]++;
        return { n: n, M: singular.M, invertible: false, det: 0, porque: singular.porque };
      }
      return null;
    }

    function matrixLatex(M) {
      // Paréntesis, como en el libro (ver la nota de notación de engine.js).
      return '\\left(\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right)';
    }

    window.AptActivity.init({
      mount: '#apt-u1a24',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: '¿Es invertible?',
      subtitle: 'Antes de calcular el determinante, mirá la matriz: muchas veces se ve de entrada, con las propiedades de los determinantes, que da cero.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choices: [
        { value: 'si', label: 'Sí, es invertible' },
        { value: 'no', label: 'No, es singular' }
      ],
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.M), container, { throwOnError: false });
      },
      check: function (current, value) {
        return (value === 'si') === current.invertible;
      },
      explain: function (current, correcto) {
        // Sólo lo que la U1 ya vio: el libro avisa (p. 127) que la
        // independencia lineal es de la Unidad 2.
        if (current.invertible) {
          return 'Es invertible: ' + tx('|A| = ' + current.det + ' \\neq 0') +
            '. Y por el criterio de invertibilidad (1.2.6.7) eso arrastra todo lo demás: ' +
            tx('\\mathrm{rg}(A) = ' + current.n) + ', su forma escalonada reducida es ' + tx('I_' + current.n) +
            ' y el SEL ' + tx('Ax = b') + ' tiene solución única para todo ' + tx('b') + ' (SCD).';
        }

        return 'Es singular, y se ve sin desarrollar el determinante: ' + current.porque +
          '. Como todas las condiciones del criterio son equivalentes, con que falle una fallan todas: ' +
          tx('|A| = 0') + ', no hay inversa, ' + tx('\\mathrm{rg}(A) < ' + current.n) + ' y el SEL ' + tx('Ax = b') + ' no es SCD.';
      }
    });
  })();

})();
