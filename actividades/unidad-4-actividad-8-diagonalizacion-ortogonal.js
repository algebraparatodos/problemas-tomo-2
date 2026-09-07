/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 8
   "Diagonalización ortogonal"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-8-diagonalizacion-ortogonal.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a8')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a8';
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

    function punto(u, v) { var s = 0; for (var k = 0; k < u.length; k++) s += u[k] * v[k]; return s; }

    /* ---------- Dónde está la dificultad, y por eso dónde se pregunta ----------

       Diagonalizar ortogonalmente una simétrica tiene un solo paso que se
       olvida: si un autovalor está repetido, la base que sale del
       autoespacio **no** tiene por qué ser ortogonal, y hay que
       ortogonalizarla con Gram-Schmidt. Entre autoespacios distintos no
       hace falta hacer nada, porque la ortogonalidad ya está garantizada
       por ser A simétrica.

       Así que la actividad va derecho ahí: da el autoespacio doble con
       dos generadores que no son ortogonales, y pregunta qué sale de
       aplicarles Gram-Schmidt.

       Las matrices se construyen como A = a·I + b·(v·vᵗ), que es
       simétrica y entera si v y los escalares lo son. Tiene a v como
       autovector con autovalor a + b·|v|², y todo el plano perpendicular
       a v como autoespacio del autovalor a, que queda doble. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var v = [randChoice([1, 1, 2]), randChoice([-2, -1, 1, 2]), randChoice([-2, -1, 1, 2])];
        var norma2 = punto(v, v);
        if (norma2 < 3 || norma2 > 9) continue;

        var a = randChoice([-2, -1, 1, 2, 3]);
        var b = randChoice([-2, -1, 1, 2]);

        var A = [], r, c;
        for (r = 0; r < 3; r++) {
          A.push([]);
          for (c = 0; c < 3; c++) A[r].push((r === c ? a : 0) + b * v[r] * v[c]);
        }

        var lambdaDoble = a;
        var lambdaSimple = a + b * norma2;
        if (lambdaDoble === lambdaSimple) continue;

        var grande = false;
        for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) if (Math.abs(A[r][c]) > 12) grande = true;
        if (grande) continue;

        // Dos generadores del autoespacio doble: el plano perpendicular a
        // v. Se toman dos vectores enteros de ese plano.
        var base = generadoresDelPlano(v);
        if (!base) continue;

        var u1 = base[0], w = base[1];
        // Que no sean ortogonales es justamente el punto del ejercicio.
        if (punto(u1, w) === 0) continue;

        // Gram-Schmidt: se le quita a w su componente en la dirección de
        // u1. Se multiplica por |u1|² para que el resultado quede entero.
        var n1 = punto(u1, u1), proy = punto(w, u1);
        var u2 = [];
        for (r = 0; r < 3; r++) u2.push(w[r] * n1 - u1[r] * proy);
        u2 = simplificar(u2);
        if (!u2) continue;
        if (punto(u1, u2) !== 0) continue;
        if (punto(u2, v) !== 0) continue;

        var opciones = armarOpciones(u1, w, u2, v);
        if (!opciones) continue;

        return {
          A: A, v: v,
          lambdaDoble: lambdaDoble, lambdaSimple: lambdaSimple,
          u1: u1, w: w, correcto: u2,
          opciones: opciones
        };
      }
      return null;
    }

    /** Dos vectores enteros independientes perpendiculares a v. */
    function generadoresDelPlano(v) {
      var candidatos = [];
      // Con v = (a,b,c), estos dos son perpendiculares por construcción.
      if (v[0] !== 0 || v[1] !== 0) candidatos.push([-v[1], v[0], 0]);
      if (v[1] !== 0 || v[2] !== 0) candidatos.push([0, -v[2], v[1]]);
      if (v[0] !== 0 || v[2] !== 0) candidatos.push([-v[2], 0, v[0]]);
      if (candidatos.length < 2) return null;

      var elegidos = shuffle(candidatos).slice(0, 2);
      var u1 = simplificar(elegidos[0]), w = simplificar(elegidos[1]);
      if (!u1 || !w) return null;

      // Que no sean múltiplos entre sí.
      var cruz = [
        u1[1] * w[2] - u1[2] * w[1],
        u1[2] * w[0] - u1[0] * w[2],
        u1[0] * w[1] - u1[1] * w[0]
      ];
      if (cruz[0] === 0 && cruz[1] === 0 && cruz[2] === 0) return null;
      return [u1, w];
    }

    function mcd(a, b) { return b ? mcd(b, a % b) : Math.abs(a); }

    function simplificar(u) {
      var g = 0, k;
      for (k = 0; k < u.length; k++) g = mcd(g, u[k]);
      if (!g) return null;
      var s = u.map(function (x) { return x / g; });
      // Primera componente no nula positiva, para que u y −u no sean dos
      // respuestas distintas.
      for (k = 0; k < s.length; k++) {
        if (s[k] === 0) continue;
        return s[k] < 0 ? s.map(function (x) { return -x; }) : s;
      }
      return null;
    }

    function comoTexto(u) { return u.join(', '); }

    function armarOpciones(u1, w, correcto, v) {
      var candidatos = [];
      // El error de no ortogonalizar: dejar w tal como estaba.
      candidatos.push(simplificar(w));
      // El de restar sin escalar por la norma.
      var mal = [];
      for (var k = 0; k < 3; k++) mal.push(w[k] - u1[k]);
      candidatos.push(simplificar(mal));
      // Y un vector que ni siquiera está en el autoespacio.
      candidatos.push(simplificar(v.slice()));

      var textos = [comoTexto(correcto)], opciones = [];
      for (k = 0; k < candidatos.length; k++) {
        if (!candidatos[k]) continue;
        var t = comoTexto(candidatos[k]);
        if (textos.indexOf(t) !== -1) continue;
        textos.push(t);
        opciones.push(t);
      }
      if (opciones.length < 3) return null;
      return shuffle(opciones.slice(0, 3).concat([comoTexto(correcto)])).map(function (t) {
        return { value: t, label: '(' + t + ')' };
      });
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a8',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Diagonalización ortogonal',
      subtitle: 'A es simétrica, así que por el teorema espectral se puede diagonalizar ortogonalmente. Falta el paso que más se olvida.',
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
          'A = ' + matrixLatex(current.A) +
          '\\qquad \\lambda = ' + current.lambdaDoble + '\\ \\text{(doble)}' +
          '\\\\[8pt] E_\\lambda = \\text{gen}\\{(' + comoTexto(current.u1) + '), (' + comoTexto(current.w) + ')\\}',
          container, { throwOnError: false, displayMode: true }
        );
      },
      check: function (current, value) { return value === comoTexto(current.correcto); },
      explain: function (current, correcto) {
        return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
          'Los dos generadores del autoespacio no son ortogonales entre sí — su producto escalar da ' +
          punto(current.u1, current.w) + ' —, así que hay que aplicarles Gram-Schmidt. ' +
          'Dejando (' + comoTexto(current.u1) + ') como está y quitándole al otro su componente en esa dirección, ' +
          'queda (' + comoTexto(current.correcto) + '). ' +
          'Comprobalo: es perpendicular al primero y sigue estando en el autoespacio. ' +
          'Con el autovector de λ=' + current.lambdaSimple + ' no hay que hacer nada: por ser A simétrica, ' +
          'los autovectores de autovalores distintos ya son ortogonales entre sí.';
      }
    });
  })();

})();
