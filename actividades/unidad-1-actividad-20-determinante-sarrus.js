/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 20
   "Calculá el determinante"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-20-determinante-sarrus.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a20')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a20';
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

    function det2(M) {
      return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    }

    /* Los seis productos de Sarrus, en el orden en que los arma el libro:
       primero las tres diagonales que bajan hacia la derecha, que suman, y
       después las tres que bajan hacia la izquierda, que restan. */
    function productosSarrus(M) {
      return {
        suman: [
          M[0][0] * M[1][1] * M[2][2],
          M[0][1] * M[1][2] * M[2][0],
          M[0][2] * M[1][0] * M[2][1]
        ],
        restan: [
          M[0][2] * M[1][1] * M[2][0],
          M[0][0] * M[1][2] * M[2][1],
          M[0][1] * M[1][0] * M[2][2]
        ]
      };
    }

    function det3(M) {
      var p = productosSarrus(M);
      return p.suman[0] + p.suman[1] + p.suman[2] - p.restan[0] - p.restan[1] - p.restan[2];
    }

    /* ---------- Los distractores ----------

       No son números al azar alrededor de la respuesta: cada uno es el
       resultado de un error concreto que los estudiantes cometen. Si el
       alumno se equivoca, lo más probable es que su número esté entre las
       opciones, y entonces la explicación puede decirle exactamente qué
       hizo mal en vez de limitarse a corregirlo. */
    function erroresTipicos(M, n) {
      if (n === 2) {
        var a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
        return [
          { valor: a * d + b * c, motivo: 'sumaste los dos productos en vez de restarlos' },
          { valor: b * c - a * d, motivo: 'restaste al revés: es el producto de la diagonal principal menos el de la secundaria, no al revés' },
          { valor: a * b - c * d, motivo: 'multiplicaste por filas en vez de por diagonales' }
        ];
      }
      var p = productosSarrus(M);
      var todos = p.suman.concat(p.restan);
      return [
        { valor: todos.reduce(function (s, v) { return s + v; }, 0),
          motivo: 'sumaste los seis productos: los tres de las diagonales que bajan hacia la izquierda van restando' },
        { valor: -det3(M),
          motivo: 'te quedó el signo cambiado: fijate cuáles diagonales suman y cuáles restan' },
        { valor: p.suman[0] - p.restan[0],
          motivo: 'usaste sólo la diagonal principal y la secundaria; Sarrus tiene tres diagonales de cada lado' }
      ];
    }

    /** Si una fila o una columna es toda ceros, el determinante es cero
        de un vistazo y el ejercicio no enseña nada. */
    function tieneLineaNula(M, n) {
      var r, c, k;
      for (r = 0; r < n; r++) {
        for (c = 0, k = 0; c < n; c++) if (M[r][c] === 0) k++;
        if (k === n) return true;
      }
      for (c = 0; c < n; c++) {
        for (r = 0, k = 0; r < n; r++) if (M[r][c] === 0) k++;
        if (k === n) return true;
      }
      return false;
    }

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = Math.random() < 0.4 ? 2 : 3;
        var M = [], r, c;
        for (r = 0; r < n; r++) {
          M.push([]);
          for (c = 0; c < n; c++) M[r].push(randInt(-4, 5));
        }

        var det = n === 2 ? det2(M) : det3(M);

        // Un determinante enorme no enseña nada y se vuelve incómodo de
        // comprobar mentalmente.
        if (Math.abs(det) > 120) continue;

        // Con demasiados ceros el ejercicio se resuelve de un vistazo.
        var ceros = 0;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (M[r][c] === 0) ceros++;
        if (ceros > n) continue;
        if (tieneLineaNula(M, n)) continue;

        /* Los tres distractores tienen que ser tres errores distintos y
           ninguno puede valer lo que la respuesta. Cuando eso no se
           cumple —pasa sobre todo con determinantes cero, donde varios
           errores dan cero también— se descarta la matriz y se prueba
           con otra, en vez de rellenar con números inventados. Un
           distractor sin motivo no le dice nada al que se equivoca. */
        var errores = erroresTipicos(M, n);
        var valores = errores.map(function (e) { return e.valor; });

        var repetido = false, k;
        for (k = 0; k < valores.length; k++) {
          if (valores[k] === det) { repetido = true; break; }
          if (valores.indexOf(valores[k]) !== k) { repetido = true; break; }
        }
        if (repetido) continue;

        var todas = shuffle(errores.concat([{ valor: det, motivo: null }]));

        return {
          n: n, M: M, det: det,
          errores: errores,
          opciones: todas.map(function (o) {
            return { value: String(o.valor), label: String(o.valor) };
          })
        };
      }
      var I2 = [[1, 0], [0, 1]];
      return {
        n: 2, M: I2, det: 1, errores: [],
        opciones: [
          { value: '1', label: '1' }, { value: '0', label: '0' },
          { value: '-1', label: '-1' }, { value: '2', label: '2' }
        ]
      };
    }

    function matrixLatex(M) {
      return '\\left|\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right|';
    }

    function explicar(current, correcto, elegido) {
      var n = current.n;
      var cuenta;

      if (n === 2) {
        var a = current.M[0][0], b = current.M[0][1], c = current.M[1][0], d = current.M[1][1];
        cuenta = 'El determinante de una matriz de 2×2 es el producto de la diagonal principal menos el de la secundaria: (' +
          a + ')·(' + d + ') − (' + b + ')·(' + c + ') = ' + (a * d) + ' − ' + (b * c) + ' = ' + current.det + '.';
      } else {
        var p = productosSarrus(current.M);
        cuenta = 'Con la Regla de Sarrus, las tres diagonales que bajan hacia la derecha suman ' +
          p.suman.join(' + ') + ' = ' + (p.suman[0] + p.suman[1] + p.suman[2]) +
          ', y las tres que bajan hacia la izquierda restan ' +
          p.restan.join(' + ') + ' = ' + (p.restan[0] + p.restan[1] + p.restan[2]) +
          '. El determinante es la diferencia: ' + current.det + '.';
      }

      if (correcto) return '¡Correcto! ' + cuenta;

      // Si el número que eligió corresponde a un error conocido, se lo
      // nombramos: es más útil que repetirle la cuenta buena.
      var suErro = null;
      for (var k = 0; k < current.errores.length; k++) {
        if (String(current.errores[k].valor) === String(elegido)) { suErro = current.errores[k]; break; }
      }

      if (suErro && suErro.motivo) {
        return 'No es correcto: ' + suErro.motivo + '. ' + cuenta;
      }
      return 'No es correcto. ' + cuenta;
    }

    window.AptActivity.init({
      mount: '#apt-u1a20',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Calculá el determinante',
      subtitle: 'Para las de 2×2, la diagonal principal menos la secundaria. Para las de 3×3, la Regla de Sarrus.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choices: function (current) { return current.opciones; },
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.M), container, { throwOnError: false });
      },
      check: function (current, value) { return Number(value) === current.det; },
      explain: function (current, correcto, elegido) {
        return explicar(current, correcto, elegido);
      }
    });
  })();

})();
