/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 12
   "Índice de nilpotencia"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-12-indice-nilpotencia.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a12')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a12';
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
    function esNula(M, n) {
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (M[r][c] !== 0) return false;
      return true;
    }

    /** El menor k con Aᵏ = O, o null si la matriz no es nilpotente. */
    function indice(A, n) {
      var P = A;
      for (var k = 1; k <= n; k++) {
        if (esNula(P, n)) return k;
        P = multiplicar(P, A, n);
      }
      return esNula(P, n) ? n : null;
    }

    /* ---------- Qué se genera ----------

       Las nilpotentes salen de conjugar un bloque con unos por encima de
       la diagonal: eso fija el índice de antemano y, al conjugar, la
       matriz deja de ser triangular, así que ya no se puede responder de
       un vistazo.

       Entre los casos va también alguna matriz que **no** es nilpotente.
       Sin ella, la respuesta se podría acertar sin comprobar nada:
       bastaría con elegir entre 2 y 3. Con ella, hay que calcular las
       potencias de verdad, que es lo que la sección enseña — y la cota de
       4.3.1 dice justamente hasta dónde hay que calcular: si Aⁿ no da la
       matriz nula, ninguna potencia posterior lo va a hacer. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = randChoice([3, 3, 4]);
        var esNilpotente = Math.random() < 0.7;

        var base = [], r, c;
        if (esNilpotente) {
          var indiceBuscado = randInt(2, n);
          for (r = 0; r < n; r++) {
            base.push([]);
            for (c = 0; c < n; c++) {
              // Unos sobre la superdiagonal, hasta formar un bloque del
              // tamaño que da el índice buscado.
              base[r].push(c === r + 1 && r < indiceBuscado - 1 ? 1 : 0);
            }
          }
        } else {
          for (r = 0; r < n; r++) {
            base.push([]);
            for (c = 0; c < n; c++) base[r].push(c > r ? randInt(-2, 2) : 0);
          }
          // Un valor no nulo en la diagonal la vuelve no nilpotente.
          base[randInt(0, n - 1)][randInt(0, n - 1)] = randChoice([-2, -1, 1, 2]);
        }

        var P = [], k, i, j, f;
        for (r = 0; r < n; r++) { P.push([]); for (c = 0; c < n; c++) P[r].push(r === c ? 1 : 0); }
        for (k = 0; k < 4; k++) {
          i = randInt(0, n - 1);
          do { j = randInt(0, n - 1); } while (j === i);
          f = randChoice([-2, -1, 1, 2]);
          for (c = 0; c < n; c++) P[i][c] += f * P[j][c];
        }
        var Pinv = inversaEntera(P, n);
        if (!Pinv) continue;

        var A = multiplicar(multiplicar(P, base, n), Pinv, n);

        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(A[r][c]) > 12) grande = true;
        if (grande) continue;

        // Triangular o nula se resolverían sin calcular.
        if (esNula(A, n)) continue;
        var superior = true, inferior = true;
        for (r = 0; r < n; r++) {
          for (c = 0; c < n; c++) {
            if (r > c && A[r][c] !== 0) superior = false;
            if (r < c && A[r][c] !== 0) inferior = false;
          }
        }
        if (superior || inferior) continue;

        // El índice se mide sobre la matriz que se muestra, no se da por
        // supuesto del generador.
        var k2 = indice(A, n);
        if (esNilpotente && k2 === null) continue;
        if (!esNilpotente && k2 !== null) continue;

        var opciones = [];
        for (var v = 1; v <= n; v++) opciones.push({ value: String(v), label: 'Su índice es ' + v });
        opciones.push({ value: 'no', label: 'No es nilpotente' });

        return {
          n: n, A: A,
          nilpotente: k2 !== null,
          indice: k2,
          opciones: opciones
        };
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
      mount: '#apt-u4a12',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Índice de nilpotencia',
      subtitle: 'Calculá las potencias hasta que alguna dé la matriz nula. Por la cota de 4.3.1 sabés hasta dónde hay que llegar.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choices: function (current) { return current.opciones; },
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.A), container, { throwOnError: false });
      },
      check: function (current, value) {
        return current.nilpotente ? value === String(current.indice) : value === 'no';
      },
      explain: function (current, correcto) {
        var cabeza = correcto ? '¡Correcto! ' : 'No es correcto. ';

        if (!current.nilpotente) {
          return cabeza + 'Esta matriz no es nilpotente. Y no hacía falta calcular potencias para siempre: ' +
            'por el teorema de 4.3.1, si una matriz de ' + current.n + '×' + current.n + ' fuera nilpotente, ' +
            'su potencia ' + current.n + '-ésima ya tendría que dar la matriz nula. Como no da, ninguna posterior lo va a hacer. ' +
            'Otra forma de verlo: los autovalores de una nilpotente son todos cero, y ésta tiene alguno distinto.';
        }

        return cabeza + 'Su índice es ' + current.indice + ': la potencia ' + current.indice +
          '-ésima da la matriz nula y la anterior todavía no. ' +
          'Fijate que ' + current.indice + ' es menor o igual que ' + current.n +
          ', como asegura el teorema de 4.3.1 — la cota dice «como máximo n», no «exactamente n».';
      }
    });
  })();

})();
