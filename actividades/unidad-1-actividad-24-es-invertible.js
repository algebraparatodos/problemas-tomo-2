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
        porque: (esFila ? 'la fila ' : 'la columna ') + (i + 1) + ' es toda ceros, así que por P3 el determinante es cero'
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
        porque: 'la fila ' + (j + 1) + ' es ' + factor + ' veces la fila ' + (i + 1) +
          ', así que las filas no son linealmente independientes y el rango no llega a ' + n
      };
    }

    function conFilaCombinacion(n) {
      var M = matrizAlAzar(n, -3, 4);
      var a = randChoice([-2, -1, 1, 2]), b = randChoice([-2, -1, 1, 2]);
      var destino = randInt(2, n - 1);
      for (var k = 0; k < n; k++) M[destino][k] = a * M[0][k] + b * M[1][k];
      var signo = b < 0 ? ' − ' + Math.abs(b) : ' + ' + b;
      return {
        M: M,
        porque: 'la fila ' + (destino + 1) + ' es ' + a + ' veces la fila 1' + signo +
          ' veces la fila 2, así que las filas son linealmente dependientes y el rango no llega a ' + n
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
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u1a24',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: '¿Es invertible?',
      subtitle: 'Antes de calcular el determinante, mirá la matriz: muchas veces se ve de entrada que las filas no son independientes.',
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
        var cabeza = correcto ? '¡Correcto! ' : 'No es correcto. ';

        if (current.invertible) {
          return cabeza + 'Es invertible: su determinante vale ' + current.det +
            ', distinto de cero. Y por el criterio de 1.2.6.7 eso arrastra todo lo demás — ' +
            'su rango es ' + current.n + ', sus filas son linealmente independientes, ' +
            'su forma escalonada reducida es la identidad, y el sistema Ax=b tiene solución única para cualquier b.';
        }

        return cabeza + 'Es singular, y se ve sin calcular nada: ' + current.porque +
          '. Como todas las condiciones del criterio son equivalentes, con que falle una fallan todas: ' +
          'el determinante es cero, no hay inversa, y el sistema Ax=b no tiene solución única.';
      }
    });
  })();

})();
