/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 23
   "Calculá la matriz adjunta"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-23-matriz-adjunta.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a23')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a23';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function menor(M, fila, col) {
      var R = [], r, c;
      for (r = 0; r < M.length; r++) {
        if (r === fila) continue;
        var f = [];
        for (c = 0; c < M.length; c++) if (c !== col) f.push(M[r][c]);
        R.push(f);
      }
      return R;
    }

    function det(M) {
      var n = M.length;
      if (n === 1) return M[0][0];
      if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
      var suma = 0;
      for (var c = 0; c < n; c++) {
        if (M[0][c] === 0) continue;
        suma += (c % 2 ? -1 : 1) * M[0][c] * det(menor(M, 0, c));
      }
      return suma;
    }

    function cofactor(M, i, j) {
      return ((i + j) % 2 ? -1 : 1) * det(menor(M, i, j));
    }

    /* ---------- Por qué la adjunta y no directamente la inversa ----------

       La inversa por la adjunta es A⁻¹ = adj(A)/det(A), y ese cociente
       casi nunca da números enteros: pedirla en una grilla convertiría el
       ejercicio en escribir fracciones.

       La adjunta, en cambio, siempre es entera cuando A lo es, porque
       cada entrada es un determinante de una submatriz. Y es exactamente
       el paso donde se falla: hay que calcular nueve determinantes de
       2×2, ponerle a cada uno el signo de (−1)^(i+j), y **trasponer** al
       final. Ese trasponer es lo que más se olvida, así que la actividad
       se planta justo ahí. La división por el determinante viene después
       y es lo fácil. */
    function adjunta(M) {
      var n = M.length, A = [], r, c;
      for (r = 0; r < n; r++) {
        A.push([]);
        // adj(A) es la traspuesta de la matriz de cofactores: la entrada
        // (r,c) de la adjunta es el cofactor de la posición (c,r).
        for (c = 0; c < n; c++) A[r].push(cofactor(M, c, r));
      }
      return A;
    }

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 300) {
        var n = 3;
        var M = [], r, c;
        for (r = 0; r < n; r++) {
          M.push([]);
          for (c = 0; c < n; c++) M[r].push(randInt(-3, 4));
        }

        var d = det(M);
        // Con determinante cero la matriz no es invertible y la adjunta
        // pierde el sentido que le da la sección.
        if (d === 0) continue;
        if (Math.abs(d) > 60) continue;

        var ceros = 0;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (M[r][c] === 0) ceros++;
        if (ceros > 3) continue;

        var A = adjunta(M);
        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(A[r][c]) > 40) grande = true;
        if (grande) continue;

        return { n: n, M: M, det: d, respuesta: A };
      }
      return null;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u1a23',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Calculá la matriz adjunta',
      subtitle: 'Calculá Cof(A), la matriz de cofactores, y trasponela: eso es adj(A). Todas las entradas son enteras.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'grid',
      grid: { rows: 3, cols: 3, noDivider: true },
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.M), container, { throwOnError: false });
      },
      checkGrid: function (current, G, hayVacias) {
        var n = current.n, r, c;
        var estado = [], todoBien = !hayVacias;
        var traspuestaDeLoSuyo = true;

        for (r = 0; r < n; r++) {
          var fila = [];
          for (c = 0; c < n; c++) {
            var ok = G[r][c] === current.respuesta[r][c];
            if (!ok) todoBien = false;
            // ¿Habrá calculado bien los cofactores pero sin trasponer?
            if (G[r][c] !== current.respuesta[c][r]) traspuestaDeLoSuyo = false;
            fila.push(ok ? 'correct' : 'wrong');
          }
          estado.push(fila);
        }

        if (hayVacias) {
          return {
            correct: false, cellStatus: estado,
            feedbackText: 'Te quedaron celdas vacías. Completalas todas antes de comprobar.'
          };
        }

        if (todoBien) {
          return {
            correct: true, cellStatus: estado,
            feedbackText: '¡Correcto! Y con esto ya tenés la inversa: A⁻¹ = adj(A)/det(A), y acá det(A) = ' +
              current.det + '.'
          };
        }

        // El error clásico tiene nombre propio y conviene decírselo.
        if (traspuestaDeLoSuyo) {
          return {
            correct: false, cellStatus: estado,
            feedbackText: 'Calculaste bien los nueve cofactores pero te olvidaste de trasponer: lo que escribiste es Cof(A), y la adjunta es su traspuesta.'
          };
        }

        return {
          correct: false, cellStatus: estado,
          feedbackText: 'Revisá los cofactores marcados en rojo. Acordate del signo: el de la posición (i,j) lleva (−1)^(i+j), así que se alternan como un tablero de ajedrez empezando por + arriba a la izquierda. Y al final hay que trasponer.'
        };
      },
      getAnswerGrid: function (current) { return current.respuesta; },
      answerTitle: 'La adjunta correcta',
      answerText: 'De acá sale la inversa dividiendo cada entrada por el determinante.'
    });
  })();

})();
