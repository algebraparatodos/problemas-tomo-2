/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 5
   "¿Qué se conserva al cambiar de base?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-5-invariantes.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a5')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a5';
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

    function multiplicar(A, B, n) {
      var M = [], r, c, k;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) { var s = 0; for (k = 0; k < n; k++) s += A[r][k] * B[k][c]; M[r].push(s); }
      }
      return M;
    }
    function aplicar(M, v) {
      return M.map(function (fila) { var s = 0; for (var k = 0; k < v.length; k++) s += fila[k] * v[k]; return s; });
    }
    function igualesV(u, v) { for (var k = 0; k < u.length; k++) if (u[k] !== v[k]) return false; return true; }
    function traza(M, n) { var s = 0; for (var r = 0; r < n; r++) s += M[r][r]; return s; }
    function determinante(A) {
      var n = A.length;
      if (n === 1) return A[0][0];
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      var s = 0;
      for (var c = 0; c < n; c++) {
        var men = [];
        for (var r = 1; r < n; r++) {
          var f = [];
          for (var k = 0; k < n; k++) if (k !== c) f.push(A[r][k]);
          men.push(f);
        }
        s += (c % 2 ? -1 : 1) * A[0][c] * determinante(men);
      }
      return s;
    }
    function rango(M, n) {
      var A = [], r, c;
      for (r = 0; r < n; r++) { A.push([]); for (c = 0; c < n; c++) A[r].push(M[r][c]); }
      var fila = 0;
      for (var col = 0; col < n && fila < n; col++) {
        var p = -1;
        for (r = fila; r < n; r++) if (A[r][col] !== 0) { p = r; break; }
        if (p === -1) continue;
        var t = A[p]; A[p] = A[fila]; A[fila] = t;
        for (r = fila + 1; r < n; r++) {
          if (A[r][col] === 0) continue;
          var num = A[r][col], den = A[fila][col];
          for (c = col; c < n; c++) A[r][c] = A[r][c] * den - A[fila][c] * num;
        }
        fila++;
      }
      return fila;
    }

    /** Una matriz entera con determinante ±1, armada con operaciones de
        fila sobre la identidad: su inversa también es entera. */
    function unimodular(n) {
      var P = [], r, c, k, i, j, f;
      for (r = 0; r < n; r++) { P.push([]); for (c = 0; c < n; c++) P[r].push(r === c ? 1 : 0); }
      for (k = 0; k < (n === 2 ? 2 : 3); k++) {
        i = randInt(0, n - 1);
        do { j = randInt(0, n - 1); } while (j === i);
        f = randChoice([-2, -1, 1, 2]);
        for (c = 0; c < n; c++) P[i][c] += f * P[j][c];
      }
      return P;
    }

    var ORDINAL = ['primera', 'segunda', 'tercera'];

    /* ---------- Cómo se arma cada ronda ----------

       A se construye como S·D·S⁻¹, con D diagonal y entera, para conocer
       sus autovalores, sus multiplicidades y sus autovectores (las
       columnas de S). Después B = P⁻¹·A·P, con otra P entera de
       determinante ±1.

       Las opciones salen de dos listas: las cinco cosas que 4.2.1 muestra
       que se conservan (traza, determinante, rango, polinomio
       característico y multiplicidad geométrica) y cuatro que no (una
       entrada, una fila, una columna y las coordenadas de los
       autovectores, que el libro trata en «Qué no se conserva»). Cada
       ronda toma entre 2 y 5 de la primera lista, completa hasta 6 con la
       segunda y las baraja. Así la respuesta cambia de una ronda a otra y
       no se puede acertar de memoria por la posición de las opciones (el
       motor no baraja el modo multiselect; se baraja acá, en generate,
       para que el orden quede fijo durante la ronda y en el examen).

       Lo que no se conserva tiene que diferir de verdad en el caso
       concreto. Si la entrada elegida fuera la misma en A y en B, marcarla
       sería correcto y el alumno aprendería lo contrario de lo que la
       actividad quiere enseñar; por eso se eligen sólo entradas, filas,
       columnas y autovectores que cambian. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = Math.random() < 0.5 ? 2 : 3;
        var r, c, k;

        // Autovalores: distintos, o en 3×3 a veces uno doble. Con un 0
        // entre ellos el rango baja, y eso también se ve en la opción.
        var valores;
        if (n === 2) {
          valores = [randInt(-3, 4), randInt(-3, 4)];
          if (valores[0] === valores[1]) continue;
        } else {
          var doble = Math.random() < 0.35;
          var x = randInt(-3, 4), y = randInt(-3, 4), z = randInt(-3, 4);
          if (doble && x === y) continue;
          if (!doble && (x === y || x === z || y === z)) continue;
          valores = doble ? [x, x, y] : [x, y, z];
        }

        var S = unimodular(n), Sinv = inversaEntera(S, n);
        if (!Sinv) continue;
        var D = [];
        for (r = 0; r < n; r++) { D.push([]); for (c = 0; c < n; c++) D[r].push(r === c ? valores[r] : 0); }
        var A = multiplicar(multiplicar(S, D, n), Sinv, n);

        var P = unimodular(n), Pinv = inversaEntera(P, n);
        if (!Pinv) continue;
        var B = multiplicar(multiplicar(Pinv, A, n), P, n);

        var grande = false, diagonal = true;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
          if (Math.abs(A[r][c]) > 9) grande = true;
          if (Math.abs(B[r][c]) > 25) grande = true;
          if (r !== c && A[r][c] !== 0) diagonal = false;
        }
        if (grande) continue;
        // Con A diagonal los autovalores se leerían a simple vista.
        if (diagonal) continue;

        // Lo que NO se conserva: sólo lo que de verdad cambia en este caso.
        var posiciones = [], filas = [], columnas = [];
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (A[r][c] !== B[r][c]) posiciones.push([r, c]);
        for (r = 0; r < n; r++) {
          var filaCambia = false, colCambia = false;
          for (c = 0; c < n; c++) {
            if (A[r][c] !== B[r][c]) filaCambia = true;
            if (A[c][r] !== B[c][r]) colCambia = true;
          }
          if (filaCambia) filas.push(r);
          if (colCambia) columnas.push(r);
        }
        // Un autovector de A (una columna de S) que no lo sea de B.
        var testigo = null;
        for (k = 0; k < n && !testigo; k++) {
          var v = S.map(function (fila) { return fila[k]; });
          var lam = valores[k];
          var Bv = aplicar(B, v);
          if (!igualesV(Bv, v.map(function (t) { return lam * t; }))) {
            testigo = { v: v, lambda: lam, Bv: Bv, vB: aplicar(Pinv, v) };
          }
        }
        if (!posiciones.length || !filas.length || !columnas.length || !testigo) continue;

        var pos = randChoice(posiciones), fila = randChoice(filas), columna = randChoice(columnas);

        // Autovalores distintos, de menor a mayor, con su multiplicidad.
        var distintos = [];
        valores.forEach(function (l) { if (distintos.indexOf(l) === -1) distintos.push(l); });
        distintos.sort(function (a, b) { return a - b; });
        var mult = distintos.map(function (l) {
          return valores.filter(function (t) { return t === l; }).length;
        });

        var conservadas = [
          { value: 'traza', label: 'La traza', correct: true },
          { value: 'determinante', label: 'El determinante', correct: true },
          { value: 'rango', label: 'El rango', correct: true },
          { value: 'polinomio', label: 'El polinomio característico (y con él los autovalores)', correct: true },
          { value: 'mg', label: 'La multiplicidad geométrica de cada autovalor', correct: true }
        ];
        var noConservadas = [
          { value: 'entrada', label: 'La entrada de la posición (' + (pos[0] + 1) + ',' + (pos[1] + 1) + ')', correct: false },
          { value: 'fila', label: 'La ' + ORDINAL[fila] + ' fila', correct: false },
          { value: 'columna', label: 'La ' + ORDINAL[columna] + ' columna', correct: false },
          { value: 'autovectores', label: 'Las coordenadas de los autovectores', correct: false }
        ];
        var cuantasSi = randInt(2, 5);
        var opciones = shuffle(
          shuffle(conservadas).slice(0, cuantasSi).concat(shuffle(noConservadas).slice(0, 6 - cuantasSi))
        );

        return {
          n: n, A: A, B: B,
          traza: traza(A, n),
          determinante: determinante(A),
          rango: rango(A, n),
          autovalores: distintos, multiplicidades: mult,
          pos: pos, entradaA: A[pos[0]][pos[1]], entradaB: B[pos[0]][pos[1]],
          fila: fila, columna: columna,
          testigo: testigo,
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

    /** Un entero con el signo menos tipográfico: −3 en vez de -3. */
    function conSigno(x) { return x < 0 ? '−' + Math.abs(x) : String(x); }
    function vectorTexto(v) { return '(' + v.map(conSigno).join(', ') + ')'; }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a5',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: '¿Qué se conserva al cambiar de base?',
      subtitle: 'B se obtuvo de A con un cambio de base, o sea B = P⁻¹·A·P. Marcá todo lo que sea igual en las dos.',
      nextLabel: 'Probar con otro par →',
      needsKatex: true,
      mode: 'multiselect',
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          'A = ' + matrixLatex(current.A) + '\\qquad B = ' + matrixLatex(current.B),
          container, { throwOnError: false }
        );
      },
      options: function (current) { return current.opciones; },
      explain: function (current, correcto) {
        var mostradas = {};
        current.opciones.forEach(function (o) { mostradas[o.value] = true; });

        var autovalores = current.autovalores.map(function (l) { return 'λ = ' + conSigno(l); });
        var mgs = current.autovalores.map(function (l, i) {
          return 'MG(λ = ' + conSigno(l) + ') = ' + current.multiplicidades[i];
        });
        var texto = (correcto ? '¡Correcto! ' : 'No es correcto. ') +
          'Se conservan la traza (vale ' + conSigno(current.traza) + ' en las dos), el determinante (' +
          conSigno(current.determinante) + '), el rango (' + current.rango + ') y el polinomio característico, ' +
          'y con él los autovalores (' + autovalores.join(' y ') + ') con su multiplicidad algebraica. ' +
          'También se conserva la multiplicidad geométrica de cada uno: acá ' + mgs.join(' y ') + ', en A y en B. ';

        var no = [];
        if (mostradas.entrada) {
          no.push('la entrada de la posición (' + (current.pos[0] + 1) + ',' + (current.pos[1] + 1) + ') pasó de ' +
            conSigno(current.entradaA) + ' a ' + conSigno(current.entradaB));
        }
        if (mostradas.fila) no.push('la ' + ORDINAL[current.fila] + ' fila cambió');
        if (mostradas.columna) no.push('la ' + ORDINAL[current.columna] + ' columna cambió');
        if (no.length) texto += 'No se conserva ninguna entrada suelta: ' + no.join(', ') + '. ';

        if (mostradas.autovectores) {
          var t = current.testigo;
          texto += 'Y tampoco las coordenadas de los autovectores: ' + vectorTexto(t.v) +
            ' es autovector de A asociado a λ = ' + conSigno(t.lambda) + ', pero no de B, porque B·' +
            vectorTexto(t.v) + ' = ' + vectorTexto(t.Bv) + '. ' +
            'El autovector de B que le corresponde es P⁻¹·' + vectorTexto(t.v) + ' = ' + vectorTexto(t.vB) +
            ': el mismo vector, escrito en la otra base. ';
        }
        return texto + 'Esa es la idea de fondo: la matriz cambia por completo, porque depende de la base; ' +
          'lo que no cambia es lo que la matriz dice de la transformación.';
      }
    });
  })();

})();
