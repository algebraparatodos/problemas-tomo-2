/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 2
   "Hallá los autovectores"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-2-autovectores.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a2')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a2';
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

    function porVector(A, v, n) {
      var w = [], r, k;
      for (r = 0; r < n; r++) {
        var s = 0;
        for (k = 0; k < n; k++) s += A[r][k] * v[k];
        w.push(s);
      }
      return w;
    }

    /* ---------- Por qué se pregunta cuál y no se pide escribirlo ----------

       Un autovector no es único: cualquier múltiplo suyo también lo es.
       Pedirle al alumno que escriba uno obligaría a aceptar infinitas
       respuestas, y la que él eligiera casi nunca coincidiría con la
       "nuestra". Presentar cuatro candidatos y preguntar cuál cumple
       A·v = λ·v evita ese problema y, de paso, pone el foco donde tiene
       que estar: en verificar la condición, que es lo que define a un
       autovector. */

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = Math.random() < 0.5 ? 2 : 3;

        // Se construye la matriz desde su diagonalización, para que los
        // autovalores sean enteros y los autovectores también.
        var valores = [];
        for (var k = 0; k < n; k++) valores.push(randChoice([-3, -2, -1, 1, 2, 3, 4]));
        // Los autovalores tienen que ser distintos: si se repitieran, el
        // autoespacio podría tener dimensión 2 y habría más de una
        // respuesta correcta entre las opciones.
        var repetido = false;
        for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) if (valores[a] === valores[b]) repetido = true;
        if (repetido) continue;

        // P entera con determinante ±1, para que su inversa también lo sea.
        var P = [], r, c;
        for (r = 0; r < n; r++) { P.push([]); for (c = 0; c < n; c++) P[r].push(r === c ? 1 : 0); }
        for (k = 0; k < (n === 2 ? 3 : 4); k++) {
          var i = randInt(0, n - 1), j;
          do { j = randInt(0, n - 1); } while (j === i);
          var f = randChoice([-2, -1, 1, 2]);
          for (c = 0; c < n; c++) P[i][c] += f * P[j][c];
        }

        var Pinv = inversaEntera(P, n);
        if (!Pinv) continue;

        var D = [];
        for (r = 0; r < n; r++) { D.push([]); for (c = 0; c < n; c++) D[r].push(r === c ? valores[r] : 0); }
        var A = multiplicar(multiplicar(P, D, n), Pinv, n);

        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(A[r][c]) > 12) grande = true;
        if (grande) continue;

        // Las columnas de P son los autovectores, cada una con su
        // autovalor en la misma posición.
        var cual = randInt(0, n - 1);
        var lambda = valores[cual];
        var correcto = [];
        for (r = 0; r < n; r++) correcto.push(P[r][cual]);

        // Se normaliza el signo para que no haya dos opciones que sean el
        // mismo vector cambiado de signo.
        correcto = normalizar(correcto, n);
        if (!correcto) continue;

        var candidatos = [];
        // El error más frecuente: dar el autovector de otro autovalor.
        for (k = 0; k < n; k++) {
          if (k === cual) continue;
          var otro = [];
          for (r = 0; r < n; r++) otro.push(P[r][k]);
          otro = normalizar(otro, n);
          if (otro) candidatos.push(otro);
        }
        // Y vectores que sencillamente no son autovectores.
        for (k = 0; k < 6 && candidatos.length < 3; k++) {
          var suelto = [];
          for (r = 0; r < n; r++) suelto.push(randInt(-3, 3));
          suelto = normalizar(suelto, n);
          if (suelto && !esAutovector(A, suelto, n)) candidatos.push(suelto);
        }

        var textos = [comoTexto(correcto)], opciones = [];
        for (k = 0; k < candidatos.length && opciones.length < 3; k++) {
          var t = comoTexto(candidatos[k]);
          if (textos.indexOf(t) !== -1) continue;
          textos.push(t);
          opciones.push(t);
        }
        if (opciones.length < 3) continue;

        return {
          n: n, A: A, lambda: lambda,
          correcto: correcto,
          imagen: porVector(A, correcto, n),
          opciones: shuffle(opciones.concat([comoTexto(correcto)])).map(function (t) {
            return { value: t, label: '(' + t + ')' };
          })
        };
      }
      return null;
    }

    function comoTexto(v) { return v.join(', '); }

    /** Deja el vector con su primera componente no nula positiva, para que
        v y −v no puedan aparecer como dos opciones distintas. */
    function normalizar(v, n) {
      for (var k = 0; k < n; k++) {
        if (v[k] === 0) continue;
        return v[k] < 0 ? v.map(function (x) { return -x; }) : v.slice();
      }
      return null;
    }

    function esAutovector(A, v, n) {
      var w = porVector(A, v, n), razonNum = null, razonDen = null, k;
      for (k = 0; k < n; k++) {
        if (v[k] === 0) { if (w[k] !== 0) return false; continue; }
        if (razonNum === null) { razonNum = w[k]; razonDen = v[k]; continue; }
        if (w[k] * razonDen !== v[k] * razonNum) return false;
      }
      return razonNum !== null;
    }

    function multiplicar(A, B, n) {
      var M = [], r, c, k;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) { var s = 0; for (k = 0; k < n; k++) s += A[r][k] * B[k][c]; M[r].push(s); }
      }
      return M;
    }

    function inversaEntera(A, n) {
      var d = determinante(A, n);
      if (d !== 1 && d !== -1) return null;
      var M = [], r, c;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) M[r].push(((r + c) % 2 ? -1 : 1) * determinante(menor(A, c, r), n - 1) / d);
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
    function determinante(A, n) {
      if (n === 1) return A[0][0];
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      var s = 0;
      for (var c = 0; c < n; c++) s += (c % 2 ? -1 : 1) * A[0][c] * determinante(menor(A, 0, c), n - 1);
      return s;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a2',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Hallá los autovectores',
      subtitle: 'Un autovector asociado a λ es el que cumple A·v = λ·v. Los múltiplos de un autovector también lo son, así que acá alcanza con reconocer la dirección.',
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
        window.katex.render(
          matrixLatex(current.A) + '\\qquad \\lambda = ' + current.lambda,
          container, { throwOnError: false }
        );
      },
      check: function (current, value) { return value === comoTexto(current.correcto); },
      explain: function (current, correcto) {
        var v = comoTexto(current.correcto);
        var Av = comoTexto(current.imagen);
        return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
          'El autovector asociado a λ=' + current.lambda + ' es (' + v + '), y se comprueba multiplicando: ' +
          'A·(' + v + ') = (' + Av + '), que es exactamente ' + current.lambda + ' veces (' + v + '). ' +
          'Otra forma de encontrarlo es resolver el sistema homogéneo (A − λI)·v = 0, que es el núcleo de esa matriz.';
      }
    });
  })();

})();
