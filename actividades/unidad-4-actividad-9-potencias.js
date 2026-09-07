/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 9
   "Calculá una potencia alta"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-9-potencias.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a9')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a9';
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

    /* ---------- Por qué se dan P y D en vez de sólo A ----------

       El ejercicio es sobre la fórmula Aᵏ = P·Dᵏ·P⁻¹, no sobre volver a
       diagonalizar: eso ya lo practican las actividades 6 y 7. Dándole la
       diagonalización hecha, lo único que queda es lo que esta sección
       enseña — que elevar D a la k es elevar cada número de su diagonal, y
       que las P de los extremos se quedan como están.

       Los autovalores se eligen chicos a propósito. Con un 3 y k=6 el
       resultado tendría cuatro cifras por entrada y la actividad se
       volvería una prueba de paciencia con la calculadora. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = 2;
        var k = randChoice([3, 4, 5, 6]);

        var valores = [randChoice([-1, 0, 1, 2]), randChoice([-1, 0, 1, 2])];
        if (valores[0] === valores[1]) continue;
        // Con un cero y potencia par, Aᵏ se vuelve demasiado simple.
        if (valores.indexOf(0) !== -1 && valores.indexOf(1) !== -1) continue;

        var P = [[1, 0], [0, 1]], i, j, f, c, r;
        for (var t = 0; t < 2; t++) {
          i = randInt(0, 1); j = 1 - i;
          f = randChoice([-2, -1, 1, 2]);
          for (c = 0; c < n; c++) P[i][c] += f * P[j][c];
        }
        var Pinv = inversaEntera(P, n);
        if (!Pinv) continue;

        var D = [[valores[0], 0], [0, valores[1]]];
        var A = multiplicar(multiplicar(P, D, n), Pinv, n);

        var Dk = [[Math.pow(valores[0], k), 0], [0, Math.pow(valores[1], k)]];
        var Ak = multiplicar(multiplicar(P, Dk, n), Pinv, n);

        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
          if (Math.abs(A[r][c]) > 8) grande = true;
          if (Math.abs(Ak[r][c]) > 400) grande = true;
        }
        if (grande) continue;

        // Si A ya es diagonal, no hace falta la fórmula.
        if (A[0][1] === 0 && A[1][0] === 0) continue;

        /* Y hay un caso que hay que descartar sí o sí: cuando elevar cada
           entrada de A por separado da el mismo resultado que la potencia
           de verdad. Pasa con algún autovalor cero, porque A queda con una
           fila o columna nula y las cuentas coinciden por casualidad. Si
           se colara, el alumno que cometió el error clásico acertaría, y
           encima recibiría el mensaje diciéndole que se equivocó. */
        var coincidePorCasualidad = true;
        for (r = 0; r < n; r++) {
          for (c = 0; c < n; c++) {
            if (Math.pow(A[r][c], k) !== Ak[r][c]) coincidePorCasualidad = false;
          }
        }
        if (coincidePorCasualidad) continue;

        return { n: n, k: k, A: A, P: P, D: D, Dk: Dk, respuesta: Ak, valores: valores };
      }
      return null;
    }

    function inversaEntera(A, n) {
      var d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      if (d !== 1 && d !== -1) return null;
      return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a9',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Calculá una potencia alta',
      subtitle: 'La diagonalización ya está hecha. Usá Aᵏ = P·Dᵏ·P⁻¹ y completá el resultado.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'grid',
      grid: { rows: 2, cols: 2, noDivider: true },
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          'A = ' + matrixLatex(current.A) + '\\qquad P = ' + matrixLatex(current.P) +
          '\\qquad D = ' + matrixLatex(current.D) +
          '\\\\[10pt] \\text{Calculá } A^{' + current.k + '}',
          container, { throwOnError: false, displayMode: true }
        );
      },
      checkGrid: function (current, G, hayVacias) {
        var n = current.n, r, c, estado = [], todoBien = !hayVacias;
        for (r = 0; r < n; r++) {
          var fila = [];
          for (c = 0; c < n; c++) {
            var ok = G[r][c] === current.respuesta[r][c];
            if (!ok) todoBien = false;
            fila.push(ok ? 'correct' : 'wrong');
          }
          estado.push(fila);
        }

        if (hayVacias) {
          return { correct: false, cellStatus: estado, feedbackText: 'Te quedaron celdas vacías. Completalas todas antes de comprobar.' };
        }

        if (todoBien) {
          return {
            correct: true, cellStatus: estado,
            feedbackText: '¡Correcto! Dᵏ es la diagonal con ' + current.valores[0] + '^' + current.k +
              ' = ' + current.Dk[0][0] + ' y ' + current.valores[1] + '^' + current.k + ' = ' + current.Dk[1][1] +
              ', y las P de los extremos se quedan como estaban. Sin la diagonalización esto serían ' +
              (current.k - 1) + ' productos de matrices.'
          };
        }

        // El error clásico: elevar a la k toda la matriz A, entrada por
        // entrada, en vez de sólo la diagonal de D.
        var entradaPorEntrada = true;
        for (r = 0; r < n; r++) {
          for (c = 0; c < n; c++) {
            if (G[r][c] !== Math.pow(current.A[r][c], current.k)) entradaPorEntrada = false;
          }
        }
        if (entradaPorEntrada) {
          return {
            correct: false, cellStatus: estado,
            feedbackText: 'Elevaste cada entrada de A a la ' + current.k + ', y eso no es elevar la matriz: ' +
              'sólo vale para las diagonales. Por eso hace falta la fórmula Aᵏ = P·Dᵏ·P⁻¹, ' +
              'donde la que se eleva entrada por entrada es D, no A.'
          };
        }

        return {
          correct: false, cellStatus: estado,
          feedbackText: 'Revisá el orden del producto: primero P, después Dᵏ, y al final P⁻¹, en ese orden. ' +
            'Dᵏ es la diagonal con ' + current.Dk[0][0] + ' y ' + current.Dk[1][1] + '.'
        };
      },
      getAnswerGrid: function (current) { return current.respuesta; },
      answerTitle: 'La potencia correcta',
      answerText: 'Y para calcular A²⁰ en vez de esta, lo único que cambia son los dos números de la diagonal de Dᵏ.'
    });
  })();

})();
