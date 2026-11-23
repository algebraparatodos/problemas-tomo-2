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
       cambia es dónde miran (1.2.8.2 y 1.2.8.3 del libro):

       - El **parcial** mira sólo la columna que toca, de la fila del
         pivote hacia abajo, y arregla lo que encuentre intercambiando
         filas. Si el mejor ya está en la fila del pivote, no hace falta
         permutar.
       - El **maximal** mira **toda** la submatriz que queda por
         escalonar. Según dónde esté el elemento elegido, hace falta
         permutar sólo filas, sólo columnas, filas y columnas, o nada.
         Si el mayor valor absoluto se repite, el libro toma el primero
         leyendo por filas (a_{1,2} antes que a_{3,1}; a_{3,4} antes que
         a_{4,2}). La factorización es PAQ=LU: la Q registra los cambios
         de columnas, que reordenan las incógnitas.

       La actividad los pone uno al lado del otro sobre la misma matriz y
       reparte los cuatro casos del maximal (ninguno, sólo filas, sólo
       columnas, filas y columnas), para que se vea que no siempre hace
       falta lo mismo. */

    var CASOS = ['ambas', 'ambas', 'ambas', 'columnas', 'columnas', 'columnas', 'filas', 'filas', 'ninguna', 'ninguna'];
    var mazo = [];

    function generarCaso() {
      if (!mazo.length) mazo = shuffle(CASOS);
      var objetivo = mazo.pop();
      var intentos = 0;
      while (intentos++ < 400) {
        var n = randChoice([3, 3, 4]);
        var etapa = n === 3 ? randInt(0, 1) : randInt(0, 2);
        var M = [], r, c;

        // Lo ya hecho (en gris): las filas de los pivotes anteriores, con
        // ceros debajo de su diagonal, y ceros en las columnas ya
        // eliminadas de las filas que quedan, como en una eliminación real.
        for (r = 0; r < n; r++) {
          M.push([]);
          for (c = 0; c < n; c++) {
            if (c < etapa && r > c) M[r].push(0);
            else if (r < etapa && c === r) M[r].push(randChoice([-1, 1]) * randInt(1, 9));
            else if (r < etapa) M[r].push(randInt(-9, 9));
            else M[r].push(0);
          }
        }

        // La submatriz que queda: se planta el elemento de mayor valor
        // absoluto donde pide el caso, y el resto, más chico.
        var R = (objetivo === 'filas' || objetivo === 'ambas') ? randInt(etapa + 1, n - 1) : etapa;
        var C = (objetivo === 'columnas' || objetivo === 'ambas') ? randInt(etapa + 1, n - 1) : etapa;
        var tope = randInt(6, 9);
        for (r = etapa; r < n; r++) {
          for (c = etapa; c < n; c++) M[r][c] = randInt(-(tope - 1), tope - 1);
        }
        M[R][C] = randChoice([-1, 1]) * tope;

        // A veces el máximo se repite más adelante (leyendo por filas): así
        // se practica el criterio del libro de quedarse con el primero.
        // Nunca en la columna del pivote, donde el parcial quedaría empatado.
        if (Math.random() < 0.3) {
          var despues = [];
          for (r = etapa; r < n; r++) {
            for (c = etapa + 1; c < n; c++) {
              if (r * n + c > R * n + C) despues.push([r, c]);
            }
          }
          if (despues.length) {
            var t = randChoice(despues);
            M[t[0]][t[1]] = randChoice([-1, 1]) * tope;
          }
        }

        var caso = analizar(M, n, etapa);
        if (!caso) continue;                        // empate en la columna del parcial
        if (caso.mejorR !== R || caso.mejorC !== C) continue;
        if (caso.valorPivote === 0) continue;       // que no haya un 0 en la posición del pivote
        // El parcial sin nada que permutar sale siempre en el caso
        // «ninguno»; en los demás se lo deja aparecer sólo de vez en cuando,
        // para que casi siempre haya que mirar la columna de verdad.
        if (caso.mejorFila === etapa && objetivo !== 'ninguna' && Math.random() < 0.8) continue;

        var opcionesFila = [];
        for (r = etapa; r < n; r++) {
          opcionesFila.push({
            value: 'f' + r,
            label: 'Fila ' + (r + 1) + '  (tiene ' + M[r][etapa] + ')'
          });
        }

        var opcionesBloque = [];
        for (r = etapa; r < n; r++) {
          for (c = etapa; c < n; c++) {
            opcionesBloque.push({
              value: r + ',' + c,
              label: 'El ' + M[r][c] + ', en la posición (' + (r + 1) + ',' + (c + 1) + ')',
              esLaBuena: r === caso.mejorR && c === caso.mejorC,
              empata: Math.abs(M[r][c]) === tope
            });
          }
        }
        // Con una submatriz grande saldrían demasiadas opciones: se
        // ofrecen la buena y tres más, primero las que empatan con ella.
        var buena = opcionesBloque.filter(function (o) { return o.esLaBuena; })[0];
        var resto = opcionesBloque.filter(function (o) { return !o.esLaBuena; });
        var otras = shuffle(resto.filter(function (o) { return o.empata; }))
          .concat(shuffle(resto.filter(function (o) { return !o.empata; })))
          .slice(0, 3);

        caso.n = n; caso.M = M; caso.etapa = etapa;
        caso.opcionesFila = shuffle(opcionesFila);
        caso.opcionesBloque = shuffle([buena].concat(otras)).map(function (o) {
          return { value: o.value, label: o.label };
        });
        return caso;
      }
      return null;
    }

    // Lo que eligen los dos pivotajes, calculado sobre la matriz tal como
    // se muestra. Devuelve null si en la columna del parcial hay empate,
    // porque el libro no dice cuál tomar ahí.
    function analizar(M, n, etapa) {
      var r, c;
      var mejorFila = etapa, mejorEnColumna = -1, empatesColumna = 0;
      for (r = etapa; r < n; r++) {
        var a = Math.abs(M[r][etapa]);
        if (a > mejorEnColumna) { mejorEnColumna = a; mejorFila = r; empatesColumna = 1; }
        else if (a === mejorEnColumna) empatesColumna++;
      }
      if (empatesColumna !== 1) return null;

      var mejorR = etapa, mejorC = etapa, mejorEnBloque = -1, empatesBloque = 0;
      for (r = etapa; r < n; r++) {
        for (c = etapa; c < n; c++) {
          var b = Math.abs(M[r][c]);
          // «>» estricto: ante un empate se queda el primero leyendo por filas.
          if (b > mejorEnBloque) { mejorEnBloque = b; mejorR = r; mejorC = c; empatesBloque = 1; }
          else if (b === mejorEnBloque) empatesBloque++;
        }
      }
      var permutaciones = mejorR !== etapa
        ? (mejorC !== etapa ? 'ambas' : 'filas')
        : (mejorC !== etapa ? 'columnas' : 'ninguna');
      return {
        mejorFila: mejorFila,
        valorColumna: M[mejorFila][etapa],
        mejorR: mejorR, mejorC: mejorC,
        valorBloque: M[mejorR][mejorC],
        valorPivote: M[etapa][etapa],
        empatesBloque: empatesBloque,
        permutaciones: permutaciones
      };
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

    function tex(s) { return window.katex.renderToString(s, { throwOnError: false }); }
    function pos(r, c) { return tex('a_{' + (r + 1) + ',' + (c + 1) + '}'); }
    function swapF(i, j) { return tex('F_{' + (i + 1) + '} \\leftrightarrow F_{' + (j + 1) + '}'); }
    function swapC(i, j) { return tex('C_{' + (i + 1) + '} \\leftrightarrow C_{' + (j + 1) + '}'); }

    var OPCIONES_PERMUTACION = [
      { value: 'ninguna', label: 'Ninguno: ya está en la posición del pivote' },
      { value: 'filas', label: 'Sólo un intercambio de filas' },
      { value: 'columnas', label: 'Sólo un intercambio de columnas' },
      { value: 'ambas', label: 'Un intercambio de filas y otro de columnas' }
    ];

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
          explain: function (current) {
            var e = current.etapa, f = current.mejorFila;
            var base = 'El pivotaje parcial mira sólo la columna ' + (e + 1) +
              ', de la fila ' + (e + 1) + ' hacia abajo, y se queda con el mayor en valor absoluto: ' +
              'el ' + current.valorColumna + ' de la fila ' + (f + 1) + '. ';
            if (f === e) {
              return base + 'Ya está en la posición del pivote, así que no hace falta permutar filas.';
            }
            return base + 'Se lo trae con ' + swapF(e, f) + ', un intercambio de filas que queda registrado en la ' +
              tex('P') + ' de ' + tex('PA=LU') + '. ' +
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
          explain: function (current) {
            var texto = 'El maximal mira toda la submatriz que queda, no sólo la columna, y el mayor en valor absoluto es el ' +
              current.valorBloque + ', en la posición ' + pos(current.mejorR, current.mejorC) + '.';
            if (current.empatesBloque > 1) {
              texto += ' Ese valor absoluto se repite, así que se toma el primero leyendo por filas, como en el ejemplo del libro.';
            }
            return texto;
          }
        },
        {
          mode: 'choices',
          question: '¿Qué intercambios hacen falta para llevarlo a la posición del pivote?',
          choicesStacked: true,
          choices: OPCIONES_PERMUTACION,
          check: function (current, value) { return value === current.permutaciones; },
          explain: function (current) {
            var e = current.etapa, R = current.mejorR, C = current.mejorC;
            var destino = 'El pivote va en ' + pos(e, e) + ' y el elegido está en ' + pos(R, C) + '. ';
            var q = ' La ' + tex('Q') + ' de ' + tex('PAQ=LU') + ' guarda ese cambio de columnas, que reordena las incógnitas: al final se deshace con ' + tex('x=Qy') + '.';
            if (current.permutaciones === 'ninguna') {
              return destino + 'Ya está en su lugar: no hace falta permutar nada.';
            }
            if (current.permutaciones === 'filas') {
              return destino + 'Está en la columna del pivote, así que alcanza con ' + swapF(e, R) +
                ', y en este caso el maximal elige lo mismo que el parcial.';
            }
            if (current.permutaciones === 'columnas') {
              return destino + 'Ya está en la fila correcta, así que sólo hace falta una permutación de columnas: ' +
                swapC(e, C) + '.' + q;
            }
            return destino + 'No está ni en la fila ni en la columna del pivote: hay que permutar filas y columnas, ' +
              swapF(e, R) + ' y ' + swapC(e, C) + '.' + q;
          }
        }
      ]
    });
  })();

})();
