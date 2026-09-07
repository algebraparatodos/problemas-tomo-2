/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 7
   "Armá D a partir de P"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-7-arma-p-y-d.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a7')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a7';
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

    /* ---------- Por qué se da P y se pide D, y no al revés ----------

       Armar P es elegir autovectores, y como cada uno se puede multiplicar
       por cualquier escalar, hay infinitas P válidas: pedirla obligaría a
       aceptar infinitas respuestas.

       D, en cambio, queda **completamente determinada por P**: en la
       posición i de su diagonal va el autovalor del autovector que ocupa
       la columna i de P. Y ahí está lo que esta actividad quiere enseñar,
       que es la advertencia de 4.2.2: el orden de D sigue al de P. Por eso
       las columnas de P se presentan barajadas, y una D escrita con los
       autovalores «ordenaditos» de menor a mayor va a estar mal casi
       siempre. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = 3;

        var valores = [];
        while (valores.length < n) {
          var v = randChoice([-3, -2, -1, 1, 2, 3, 4, 5]);
          if (valores.indexOf(v) === -1) valores.push(v);
        }

        // P se arma con columnas enteras e independientes, y su orden se
        // baraja para que la diagonal de D no salga ordenada.
        var P = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], k, i, j, f, c, r;
        for (k = 0; k < 4; k++) {
          i = randInt(0, n - 1);
          do { j = randInt(0, n - 1); } while (j === i);
          f = randChoice([-2, -1, 1, 2]);
          for (c = 0; c < n; c++) P[i][c] += f * P[j][c];
        }

        var Pinv = inversaEntera(P, n);
        if (!Pinv) continue;

        var D = [];
        for (r = 0; r < n; r++) { D.push([]); for (c = 0; c < n; c++) D[r].push(r === c ? valores[r] : 0); }
        var A = multiplicar(multiplicar(P, D, n), Pinv, n);

        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(A[r][c]) > 14) grande = true;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(P[r][c]) > 6) grande = true;
        if (grande) continue;

        // La diagonal de D no puede quedar ordenada de menor a mayor: si
        // quedara, escribirla «ordenadita» sería correcto por casualidad y
        // el ejercicio no enseñaría lo que quiere.
        var ordenada = true;
        for (r = 1; r < n; r++) if (valores[r] < valores[r - 1]) ordenada = false;
        if (ordenada) continue;

        return { n: n, A: A, P: P, D: D, valores: valores };
      }
      return null;
    }

    function inversaEntera(A, n) {
      var d = determinante(A);
      if (d !== 1 && d !== -1) return null;
      var M = [], r, c;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) M[r].push(((r + c) % 2 ? -1 : 1) * determinante(menor(A, c, r)) / d);
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
      mount: '#apt-u4a7',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Armá D a partir de P',
      subtitle: 'Las columnas de P son autovectores de A, en el orden en que están. Completá la diagonal de D para que se cumpla D = P⁻¹·A·P.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'grid',
      grid: {
        rows: 3, cols: 3, noDivider: true,
        // Todo lo de fuera de la diagonal está fijado en cero: lo que se
        // practica acá es el orden de los autovalores, no rellenar ceros.
        lockedValue: function (current, r, c) { return r === c ? null : 0; }
      },
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          'A = ' + matrixLatex(current.A) + '\\qquad P = ' + matrixLatex(current.P),
          container, { throwOnError: false }
        );
      },
      checkGrid: function (current, G, hayVacias) {
        var n = current.n, r, c, estado = [], todoBien = !hayVacias;
        for (r = 0; r < n; r++) {
          var fila = [];
          for (c = 0; c < n; c++) {
            if (r !== c) { fila.push(null); continue; }
            var ok = G[r][c] === current.D[r][c];
            if (!ok) todoBien = false;
            fila.push(ok ? 'correct' : 'wrong');
          }
          estado.push(fila);
        }

        if (hayVacias) {
          return { correct: false, cellStatus: estado, feedbackText: 'Te quedaron celdas vacías en la diagonal. Completalas antes de comprobar.' };
        }

        if (todoBien) {
          return {
            correct: true, cellStatus: estado,
            feedbackText: '¡Correcto! Cada autovalor quedó en la misma posición que su autovector en P. ' +
              'Podés comprobarlo con A·P = P·D, que evita tener que calcular la inversa.'
          };
        }

        // ¿Habrá puesto los autovalores correctos pero ordenados?
        var suyos = [], ordenados = current.valores.slice().sort(function (a, b) { return a - b; });
        for (r = 0; r < n; r++) suyos.push(G[r][r]);
        var puestosEnOrden = true;
        for (r = 0; r < n; r++) if (suyos[r] !== ordenados[r]) puestosEnOrden = false;

        if (puestosEnOrden) {
          return {
            correct: false, cellStatus: estado,
            feedbackText: 'Los tres autovalores están bien, pero los pusiste ordenados de menor a mayor y el orden de D no es libre: ' +
              'tiene que seguir al de P. En la posición i de la diagonal va el autovalor del autovector que ocupa la columna i de P.'
          };
        }

        return {
          correct: false, cellStatus: estado,
          feedbackText: 'Revisá las posiciones marcadas. Para cada columna de P, calculá A por esa columna: ' +
            'el resultado tiene que ser un múltiplo de ella, y el factor es el autovalor que va en esa posición de la diagonal.'
        };
      },
      getAnswerGrid: function (current) { return current.D; },
      answerTitle: 'La D correcta',
      answerText: 'Con esta P, esta es la única D posible: cambiando el orden de las columnas de P cambiaría el de la diagonal.'
    });
  })();

})();
