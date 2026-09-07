/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 1
   "Polinomio característico y autovalores"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-1-polinomio-caracteristico.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a1')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a1';
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

    /* ---------- El generador ----------

       Las matrices no se sortean: se construyen a partir de los
       autovalores que uno quiere que tengan. Si se sortearan, casi todas
       tendrían raíces irracionales y el ejercicio dejaría de ser sobre
       autovalores para pasar a ser sobre la fórmula de la cuadrática.

       El procedimiento es armar la diagonal con los autovalores elegidos
       y después aplicarle un cambio de base entero con determinante 1.
       Eso conserva el polinomio característico —lo vimos en 4.2.1— y
       deja una matriz que no se parece en nada a una diagonal, así que
       hay que calcular de verdad. */
    function conjugarConEnteros(D, n) {
      var P = [], r, c;
      for (r = 0; r < n; r++) { P.push([]); for (c = 0; c < n; c++) P[r].push(r === c ? 1 : 0); }

      // P se construye con operaciones que no cambian el determinante, y
      // su inversa se va armando en paralelo deshaciendo cada una.
      var Pinv = [];
      for (r = 0; r < n; r++) { Pinv.push([]); for (c = 0; c < n; c++) Pinv[r].push(r === c ? 1 : 0); }

      for (var k = 0; k < (n === 2 ? 3 : 5); k++) {
        var i = randInt(0, n - 1), j;
        do { j = randInt(0, n - 1); } while (j === i);
        var a = randChoice([-2, -1, 1, 2]);
        // P ← E·P, con E la elemental que suma a la fila i la j por a.
        for (c = 0; c < n; c++) P[i][c] += a * P[j][c];
        // La inversa de esa elemental resta lo mismo, y va por el otro lado.
        for (r = 0; r < n; r++) Pinv[r][j] -= a * Pinv[r][i];
      }
      return { P: P, Pinv: Pinv };
    }

    function multiplicar(A, B, n) {
      var M = [], r, c, k;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) {
          var s = 0;
          for (k = 0; k < n; k++) s += A[r][k] * B[k][c];
          M[r].push(s);
        }
      }
      return M;
    }

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 300) {
        var n = Math.random() < 0.55 ? 2 : 3;

        // Autovalores chicos y con alguna repetición de vez en cuando,
        // que es lo que después hace interesante la diagonalización.
        var valores = [];
        for (var k = 0; k < n; k++) valores.push(randChoice([-3, -2, -1, 1, 2, 3, 4, 5]));
        if (Math.random() < 0.3) valores[1] = valores[0];

        var D = [], r, c;
        for (r = 0; r < n; r++) { D.push([]); for (c = 0; c < n; c++) D[r].push(r === c ? valores[r] : 0); }

        var cambio = conjugarConEnteros(D, n);
        var A = multiplicar(multiplicar(cambio.P, D, n), cambio.Pinv, n);

        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(A[r][c]) > 12) grande = true;
        if (grande) continue;

        /* Si quedó triangular —y la diagonal es el caso extremo de eso—,
           los autovalores están escritos en la diagonal y el ejercicio se
           resuelve sin calcular nada. Pasa más de lo que uno esperaría:
           basta con que todas las operaciones del cambio de base hayan
           ido en el mismo sentido. */
        var superior = true, inferior = true;
        for (r = 0; r < n; r++) {
          for (c = 0; c < n; c++) {
            if (r > c && A[r][c] !== 0) superior = false;
            if (r < c && A[r][c] !== 0) inferior = false;
          }
        }
        if (superior || inferior) continue;

        var ordenados = valores.slice().sort(function (x, y) { return x - y; });
        var traza = 0, k2;
        for (k2 = 0; k2 < n; k2++) traza += A[k2][k2];

        // Dos comprobaciones que tienen que dar sí o sí: la traza es la
        // suma de los autovalores y el determinante su producto.
        var suma = 0, producto = 1;
        for (k2 = 0; k2 < n; k2++) { suma += valores[k2]; producto *= valores[k2]; }
        if (traza !== suma) continue;

        return {
          n: n, A: A,
          autovalores: ordenados,
          traza: suma,
          determinante: producto,
          opciones: armarOpciones(ordenados, n)
        };
      }
      return null;
    }

    function comoTexto(lista) {
      return lista.join(', ');
    }

    /* Los distractores son listas de autovalores plausibles: la correcta
       con un signo cambiado —el error de olvidar que el polinomio es
       det(A−λI) y no det(λI−A)—, la de la diagonal de A sin calcular
       nada, y una con un valor corrido. */
    function armarOpciones(correctos, n) {
      var candidatos = [];
      candidatos.push(correctos.map(function (v) { return -v; }).sort(function (a, b) { return a - b; }));
      var corrido = correctos.slice();
      corrido[0] = corrido[0] + randChoice([-1, 1, 2]);
      candidatos.push(corrido.slice().sort(function (a, b) { return a - b; }));
      var otro = correctos.slice();
      otro[n - 1] = otro[n - 1] + randChoice([1, -1, 2]);
      candidatos.push(otro.slice().sort(function (a, b) { return a - b; }));

      var vistos = [comoTexto(correctos)], opciones = [];
      for (var k = 0; k < candidatos.length; k++) {
        var texto = comoTexto(candidatos[k]);
        if (vistos.indexOf(texto) !== -1) continue;
        vistos.push(texto);
        opciones.push(texto);
      }
      if (opciones.length < 3) return null;
      return shuffle(opciones.slice(0, 3).concat([comoTexto(correctos)])).map(function (t) {
        return { value: t, label: 'λ = ' + t };
      });
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a1',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Polinomio característico y autovalores',
      subtitle: 'Armá p(λ) = det(A − λI) y buscale las raíces. Todos los autovalores de estas matrices son números enteros.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choices: function (current) { return current.opciones; },
      generate: function () {
        var caso = generarCaso();
        // armarOpciones puede no encontrar tres distractores distintos;
        // en ese caso se descarta el caso y se genera otro.
        while (!caso || !caso.opciones) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.A), container, { throwOnError: false });
      },
      check: function (current, value) {
        return value === comoTexto(current.autovalores);
      },
      explain: function (current, correcto) {
        return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
          'Los autovalores son ' + comoTexto(current.autovalores) + '. ' +
          'Dos comprobaciones que podés hacer siempre, sin resolver el polinomio: ' +
          'la suma de los autovalores tiene que dar la traza de A, que acá vale ' + current.traza +
          ', y su producto tiene que dar el determinante, que vale ' + current.determinante + '. ' +
          'Si alguna de las dos no cierra, hay un error en el camino.';
      }
    });
  })();

})();
