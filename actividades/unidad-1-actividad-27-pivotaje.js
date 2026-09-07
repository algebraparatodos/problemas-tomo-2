/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 27
   "Elegí el pivote"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-27-pivotaje.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a27')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a27';
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

    /* ---------- La diferencia entre los dos pivotajes ----------

       Los dos buscan el candidato más grande en valor absoluto, y lo que
       cambia es dónde miran:

       - El **parcial** mira sólo la columna que toca, de la fila del
         pivote hacia abajo, y arregla lo que encuentre intercambiando
         filas. Eso alcanza para no dividir por un número chico.
       - El **maximal** mira **toda** la submatriz que queda por
         escalonar, y para traer ese elemento a la posición del pivote
         necesita intercambiar una fila y también una columna. Por eso su
         factorización es PAQ=LU y no PA=LU: la Q es la que registra el
         cambio de columnas, y ese cambio reordena las incógnitas.

       La actividad los pone uno al lado del otro sobre la misma matriz,
       que es la única manera de que se vea que no siempre eligen lo
       mismo. */

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = randChoice([3, 3, 4]);
        var etapa = n === 3 ? randInt(0, 1) : randInt(0, 2);

        var M = [], r, c;
        for (r = 0; r < n; r++) {
          M.push([]);
          for (c = 0; c < n; c++) M[r].push(randInt(-9, 9));
        }

        // El caso interesante es cuando el elemento que ya está en la
        // posición del pivote no es el que hay que elegir.
        var mejorFila = etapa, mejorEnColumna = Math.abs(M[etapa][etapa]);
        for (r = etapa; r < n; r++) {
          if (Math.abs(M[r][etapa]) > mejorEnColumna) { mejorEnColumna = Math.abs(M[r][etapa]); mejorFila = r; }
        }

        var mejorR = etapa, mejorC = etapa, mejorEnBloque = Math.abs(M[etapa][etapa]);
        for (r = etapa; r < n; r++) {
          for (c = etapa; c < n; c++) {
            if (Math.abs(M[r][c]) > mejorEnBloque) { mejorEnBloque = Math.abs(M[r][c]); mejorR = r; mejorC = c; }
          }
        }

        // Sin un máximo único no habría una sola respuesta correcta.
        var empatesColumna = 0, empatesBloque = 0;
        for (r = etapa; r < n; r++) {
          if (Math.abs(M[r][etapa]) === mejorEnColumna) empatesColumna++;
          for (c = etapa; c < n; c++) if (Math.abs(M[r][c]) === mejorEnBloque) empatesBloque++;
        }
        if (empatesColumna !== 1 || empatesBloque !== 1) continue;

        // Y los dos métodos tienen que elegir cosas distintas, que es
        // justamente lo que la actividad quiere mostrar.
        if (mejorC === etapa && mejorR === mejorFila) continue;

        // Que haya algo que corregir: si el pivote que ya está es el
        // bueno, el ejercicio no enseña nada.
        if (mejorFila === etapa) continue;

        var opcionesFila = [];
        for (r = etapa; r < n; r++) {
          opcionesFila.push({
            value: 'f' + r,
            label: 'Fila ' + (r + 1) + '  (tiene ' + M[r][etapa] + ')',
            esLaBuena: r === mejorFila
          });
        }

        var opcionesBloque = [];
        for (r = etapa; r < n; r++) {
          for (c = etapa; c < n; c++) {
            opcionesBloque.push({
              value: r + ',' + c,
              label: 'El ' + M[r][c] + ', en la posición (' + (r + 1) + ',' + (c + 1) + ')',
              esLaBuena: r === mejorR && c === mejorC
            });
          }
        }
        // Con una submatriz de 4×4 saldrían dieciséis opciones: se
        // ofrecen la buena y tres más, elegidas al azar.
        var buena = opcionesBloque.filter(function (o) { return o.esLaBuena; })[0];
        var otras = shuffle(opcionesBloque.filter(function (o) { return !o.esLaBuena; })).slice(0, 3);

        return {
          n: n, M: M, etapa: etapa,
          mejorFila: mejorFila,
          mejorR: mejorR, mejorC: mejorC,
          valorColumna: M[mejorFila][etapa],
          valorBloque: M[mejorR][mejorC],
          opcionesFila: shuffle(opcionesFila),
          opcionesBloque: shuffle([buena].concat(otras))
        };
      }
      return null;
    }

    function matrixLatex(M, etapa) {
      // Se marca en gris la parte ya escalonada, para que se entienda que
      // el pivote se busca sólo en lo que queda.
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila, r) {
          return fila.map(function (v, c) {
            return (r < etapa || c < etapa) ? '\\color{gray}{' + v + '}' : String(v);
          }).join(' & ');
        }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u1a27',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Elegí el pivote',
      subtitle: 'Estás escalonando y toca elegir el pivote. En gris, lo que ya quedó hecho; el pivote se busca sólo en lo que queda.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'phases',
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.M, current.etapa), container, { throwOnError: false });
      },
      phases: [
        {
          mode: 'choices',
          question: 'Con pivotaje PARCIAL, ¿qué fila llevás a la posición del pivote?',
          choicesStacked: true,
          choices: function (current) { return current.opcionesFila; },
          check: function (current, value) {
            return value === 'f' + current.mejorFila;
          },
          explain: function (current, correcto) {
            return (correcto ? '¡Correcto! ' : 'No es esa. ') +
              'El pivotaje parcial mira sólo la columna ' + (current.etapa + 1) +
              ', de la fila ' + (current.etapa + 1) + ' hacia abajo, y se queda con el mayor en valor absoluto: ' +
              'el ' + current.valorColumna + ' de la fila ' + (current.mejorFila + 1) +
              '. Se lo trae con un intercambio de filas, que es lo que registra la P de PA=LU. ' +
              'El motivo es numérico: dividir por un pivote chico agranda los errores de redondeo.';
          }
        },
        {
          mode: 'choices',
          question: 'Y con pivotaje MAXIMAL, ¿qué elemento elegís?',
          choicesStacked: true,
          choices: function (current) { return current.opcionesBloque; },
          check: function (current, value) {
            return value === current.mejorR + ',' + current.mejorC;
          },
          explain: function (current, correcto) {
            return (correcto ? '¡Correcto! ' : 'No es ese. ') +
              'El maximal mira toda la submatriz que queda, no sólo la columna, y el mayor en valor absoluto es el ' +
              current.valorBloque + ', en la posición (' + (current.mejorR + 1) + ',' + (current.mejorC + 1) + '). ' +
              'Fijate que está en la columna ' + (current.mejorC + 1) + ' y no en la ' + (current.etapa + 1) +
              ': para traerlo hay que intercambiar filas y también columnas. Por eso la factorización es PAQ=LU — ' +
              'la Q guarda el intercambio de columnas, que reordena las incógnitas y hay que deshacerlo al final.';
          }
        }
      ]
    });
  })();

})();
