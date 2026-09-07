/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 19
   "¿Qué operación hace esta elemental?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-19-matrices-elementales.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a19')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a19';
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

    function identidad(n) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(r === c ? 1 : 0); }
      return M;
    }

    /* ---------- Los tres tipos, con la notación del libro ----------

       E(i,j)     intercambia las filas i y j de la identidad
       E(i;a)     multiplica la fila i de la identidad por a ≠ 0
       E(i,j;a)   le suma a la fila i la fila j multiplicada por a

       Los índices se muestran en base 1, como en el libro, aunque las
       matrices se manejen desde cero acá adentro. */

    function intercambio(n, i, j) {
      var M = identidad(n), t = M[i]; M[i] = M[j]; M[j] = t;
      return M;
    }

    function escalar(n, i, a) {
      var M = identidad(n); M[i][i] = a;
      return M;
    }

    function combinacion(n, i, j, a) {
      var M = identidad(n); M[i][j] = a;
      return M;
    }

    function generarCaso() {
      var n = randChoice([3, 3, 4]);
      var tipo = randChoice(['intercambio', 'escalar', 'combinacion']);

      var i = randInt(0, n - 1), j;
      do { j = randInt(0, n - 1); } while (j === i);

      var M, correcta, distractores;

      if (tipo === 'intercambio') {
        M = intercambio(n, i, j);
        correcta = 'E(' + (i + 1) + ',' + (j + 1) + ')';
        // El error típico: confundirla con la que multiplica por 1, o
        // leer mal cuáles son las filas cambiadas.
        var otro;
        do { otro = randInt(0, n - 1); } while (otro === i || otro === j);
        distractores = [
          'E(' + (i + 1) + ',' + (otro + 1) + ')',
          'E(' + (i + 1) + ';' + (j + 1) + ')',
          'E(' + (i + 1) + ',' + (j + 1) + ';1)'
        ];
      } else if (tipo === 'escalar') {
        var a = randChoice([-3, -2, -1, 2, 3, 4, 5]);
        M = escalar(n, i, a);
        correcta = 'E(' + (i + 1) + ';' + a + ')';
        distractores = [
          'E(' + (i + 1) + ';' + (-a) + ')',
          'E(' + (j + 1) + ';' + a + ')',
          'E(' + (i + 1) + ',' + (j + 1) + ';' + a + ')'
        ];
      } else {
        var b = randChoice([-4, -3, -2, 2, 3, 4]);
        M = combinacion(n, i, j, b);
        correcta = 'E(' + (i + 1) + ',' + (j + 1) + ';' + b + ')';
        // El error más común de todos: invertir el papel de las dos
        // filas. En E(i,j;a) la que cambia es la i y la que se suma es
        // la j, y en la matriz el número aparece en la posición (i,j).
        distractores = [
          'E(' + (j + 1) + ',' + (i + 1) + ';' + b + ')',
          'E(' + (i + 1) + ',' + (j + 1) + ';' + (-b) + ')',
          'E(' + (i + 1) + ';' + b + ')'
        ];
      }

      var opciones = shuffle([correcta].concat(distractores)).map(function (t) {
        return { value: t, label: t };
      });

      return {
        n: n, M: M, tipo: tipo, i: i, j: j,
        correcta: correcta,
        opciones: opciones
      };
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    function explicar(current, correcto) {
      var i = current.i + 1, j = current.j + 1;
      var texto;

      if (current.tipo === 'intercambio') {
        texto = 'Es E(' + i + ',' + j + '). Se ve porque las filas ' + i + ' y ' + j +
          ' de la identidad están cambiadas de lugar: el 1 de la fila ' + i +
          ' quedó en la columna ' + j + ', y al revés.';
      } else if (current.tipo === 'escalar') {
        var a = current.M[current.i][current.i];
        texto = 'Es E(' + i + ';' + a + '). La identidad está intacta salvo en la posición (' +
          i + ',' + i + '), donde en vez de un 1 hay un ' + a +
          '. Multiplicar por esta matriz multiplica la fila ' + i + ' por ' + a + '.';
      } else {
        var b = current.M[current.i][current.j];
        texto = 'Es E(' + i + ',' + j + ';' + b + '). El ' + b + ' está en la posición (' +
          i + ',' + j + '), y ese es el orden de los índices: la fila que cambia es la ' + i +
          ' y la que se le suma es la ' + j + '. Si fuera al revés, el ' + b +
          ' estaría en la posición (' + j + ',' + i + ').';
      }

      return (correcto ? '¡Correcto! ' : 'No es correcto. ') + texto;
    }

    window.AptActivity.init({
      mount: '#apt-u1a19',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: '¿Qué operación hace esta elemental?',
      subtitle: 'Esta matriz se obtuvo aplicándole a la identidad una única operación elemental por filas. Identificá cuál, con la notación del libro.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choicesStacked: true,
      choices: function (current) { return current.opciones; },
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.M), container, { throwOnError: false });
      },
      check: function (current, value) { return value === current.correcta; },
      explain: explicar
    });
  })();

})();
