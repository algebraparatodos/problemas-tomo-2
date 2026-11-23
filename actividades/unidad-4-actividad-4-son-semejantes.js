/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 4
   "¿Son semejantes?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-4-son-semejantes.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a4')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a4';
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
    /** Coeficientes de p(λ) = det(A − λI), de mayor a menor grado. */
    function polinomioCaracteristico(A, n) {
      var tr = traza(A, n), d = determinante(A);
      if (n === 2) return [1, -tr, d];
      var m = 0;
      for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) m += A[i][i] * A[j][j] - A[i][j] * A[j][i];
      return [-1, tr, -m, d];
    }
    function menosLambda(M, l, n) {
      return M.map(function (fila, r) { return fila.map(function (x, c) { return r === c ? x - l : x; }); });
    }
    function iguales(A, B, n) {
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (A[r][c] !== B[r][c]) return false;
      return true;
    }
    function maximo(M) {
      var m = 0;
      M.forEach(function (fila) { fila.forEach(function (x) { m = Math.max(m, Math.abs(x)); }); });
      return m;
    }
    function esTriangular(M, n) {
      var sup = true, inf = true;
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
        if (r > c && M[r][c] !== 0) sup = false;
        if (r < c && M[r][c] !== 0) inf = false;
      }
      return sup || inf;
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
    /** S·T·S⁻¹ con S entera de determinante ±1 (o null si no sale). */
    function disfrazar(T, n) {
      var S = unimodular(n), Sinv = inversaEntera(S, n);
      if (!Sinv) return null;
      return multiplicar(multiplicar(S, T, n), Sinv, n);
    }

    /* Ternas de autovalores con la misma suma y el mismo producto pero
       distinto polinomio característico: dan matrices de 3×3 con la misma
       traza y el mismo determinante que no son semejantes. */
    var TERNAS_GEMELAS = (function () {
      var ternas = [], a, b, c;
      for (a = -3; a <= 4; a++) for (b = a; b <= 4; b++) for (c = b; c <= 4; c++) ternas.push([a, b, c]);
      var pares = [];
      for (var i = 0; i < ternas.length; i++) {
        for (var j = i + 1; j < ternas.length; j++) {
          var t = ternas[i], u = ternas[j];
          var e2t = t[0] * t[1] + t[0] * t[2] + t[1] * t[2], e2u = u[0] * u[1] + u[0] * u[2] + u[1] * u[2];
          if (t[0] + t[1] + t[2] === u[0] + u[1] + u[2] && t[0] * t[1] * t[2] === u[0] * u[1] * u[2] && e2t !== e2u) {
            pares.push([t, u]);
          }
        }
      }
      return pares;
    })();

    /* ---------- Qué casos se generan, y con qué se decide cada uno ----------

       El QR está antes de 4.2.2, así que la alumna tiene dos herramientas,
       las de 4.2.1: la definición (existe una P invertible con
       B = P⁻¹·A·P) y los invariantes (traza, determinante, rango,
       polinomio característico, autovalores con su MA y su MG).

       Los invariantes sólo sirven para descartar. Para decir que sí hace
       falta una P, y por eso la actividad muestra SIEMPRE una P al lado
       de A y B. Cuando son semejantes, esa P es la que las conecta, y se
       comprueba con un producto (A·P = P·B es lo mismo que B = P⁻¹·A·P,
       multiplicando por P a la izquierda). Cuando no lo son, la P es una
       cualquiera; que no sirva no prueba nada, y la explicación lo dice:
       lo que prueba el «no» es el invariante que no coincide.

       Los «no» no se quedan en la traza y el determinante. Si sólo
       fallaran esos dos, se acertaría con la regla «si coinciden traza y
       determinante, digo que sí», que es falsa. Por eso hay también
       pares con la misma traza y el mismo determinante que difieren en
       el polinomio característico (sólo en 3×3: en 2×2 la traza y el
       determinante ya lo fijan), y pares con el mismo polinomio que
       difieren en la multiplicidad geométrica de un autovalor, que 4.2.1
       también da como invariante.

       Reparto: 40 % sí; 15 % traza; 15 % determinante; 15 % polinomio;
       15 % multiplicidad geométrica. */
    function generarCaso() {
      // El tipo se sortea una sola vez y se insiste con él: si se volviera a
      // sortear en cada intento fallido, los tipos más difíciles de armar
      // (polinomio y MG) saldrían menos de lo que dice el reparto.
      var u = Math.random();
      var tipo = u < 0.40 ? 'si' : u < 0.55 ? 'traza' : u < 0.70 ? 'determinante' : u < 0.85 ? 'polinomio' : 'mg';
      var intentos = 0;
      while (intentos++ < 2000) {
        var n = tipo === 'polinomio' ? 3 : (tipo === 'mg' ? (Math.random() < 0.3 ? 2 : 3) : (Math.random() < 0.5 ? 2 : 3));
        var caso = null;

        if (tipo === 'si') caso = casoSemejantes(n);
        else if (tipo === 'traza' || tipo === 'determinante') caso = casoInvarianteSimple(n, tipo);
        else if (tipo === 'polinomio') caso = casoPolinomio();
        else caso = casoMultiplicidad(n);
        if (!caso) continue;

        caso.n = n;
        caso.tipo = tipo;
        caso.semejantes = tipo === 'si';
        caso.trazaA = traza(caso.A, n); caso.trazaB = traza(caso.B, n);
        caso.detA = determinante(caso.A); caso.detB = determinante(caso.B);
        caso.polA = polinomioCaracteristico(caso.A, n);
        caso.polB = polinomioCaracteristico(caso.B, n);
        if (iguales(caso.A, caso.B, n)) continue;
        if (maximo(caso.P) > 4) continue;
        // Las operaciones de fila pueden deshacerse entre sí y dejar P = I.
        if (iguales(caso.P, multiplicar(caso.P, caso.P, n), n)) continue;

        caso.AP = multiplicar(caso.A, caso.P, n);
        caso.PB = multiplicar(caso.P, caso.B, n);
        // La P tiene que servir exactamente cuando son semejantes.
        if (iguales(caso.AP, caso.PB, n) !== caso.semejantes) continue;
        return caso;
      }
      return null;
    }

    function casoSemejantes(n) {
      var A = [], r, c;
      for (r = 0; r < n; r++) { A.push([]); for (c = 0; c < n; c++) A[r].push(randInt(-4, 5)); }
      var P = unimodular(n), Pinv = inversaEntera(P, n);
      if (!Pinv) return null;
      var B = multiplicar(multiplicar(Pinv, A, n), P, n);
      if (maximo(B) > 25) return null;
      return { A: A, B: B, P: P };
    }

    function casoInvarianteSimple(n, tipo) {
      var A = [], B = [], r, c;
      for (r = 0; r < n; r++) { A.push([]); B.push([]); for (c = 0; c < n; c++) { A[r].push(randInt(-4, 5)); B[r].push(randInt(-4, 5)); } }
      var tA = traza(A, n), tB = traza(B, n);
      if (tipo === 'traza') {
        if (tA === tB) return null;
      } else {
        // Se fuerza que las trazas coincidan, para que el determinante
        // sea lo único que las delata: es el caso que obliga a mirar
        // los dos invariantes y no quedarse con el primero.
        B[n - 1][n - 1] += tA - tB;
        if (determinante(A) === determinante(B)) return null;
        if (maximo(B) > 12) return null;
      }
      return { A: A, B: B, P: unimodular(n) };
    }

    function triangularCon(diag) {
      return [
        [diag[0], randInt(-1, 1), randInt(-1, 1)],
        [0, diag[1], randInt(-1, 1)],
        [0, 0, diag[2]]
      ];
    }

    function casoPolinomio() {
      var par = randChoice(TERNAS_GEMELAS);
      var t1 = par[0].slice(), t2 = par[1].slice();
      if (Math.random() < 0.5) { var tmp = t1; t1 = t2; t2 = tmp; }
      var A = disfrazar(triangularCon(t1), 3), B = disfrazar(triangularCon(t2), 3);
      if (!A || !B) return null;
      if (maximo(A) > 12 || maximo(B) > 12) return null;
      if (esTriangular(A, 3) || esTriangular(B, 3)) return null;
      return { A: A, B: B, P: unimodular(3), autovaloresA: t1, autovaloresB: t2 };
    }

    /* Mismo polinomio, distinta MG: una viene de una diagonal con λ
       repetido y la otra de un bloque con un 1 arriba de la diagonal. */
    function casoMultiplicidad(n) {
      var l = randInt(-3, 4), m = randInt(-3, 4);
      if (n === 3 && m === l) return null;
      var Dg, J;
      if (n === 2) {
        Dg = [[l, 0], [0, l]];
        J = [[l, 1], [0, l]];
      } else {
        Dg = [[l, 0, 0], [0, l, 0], [0, 0, m]];
        J = [[l, 1, 0], [0, l, 0], [0, 0, m]];
      }
      var diagonalizable = disfrazar(Dg, n), bloque = disfrazar(J, n);
      if (!diagonalizable || !bloque) return null;
      if (maximo(diagonalizable) > 12 || maximo(bloque) > 12) return null;
      // En 3×3 que ninguna se pueda leer a simple vista.
      if (n === 3 && (esTriangular(diagonalizable, 3) || esTriangular(bloque, 3))) return null;
      var primeraDiagonalizable = n === 2 ? true : Math.random() < 0.5;
      var A = primeraDiagonalizable ? diagonalizable : bloque;
      var B = primeraDiagonalizable ? bloque : diagonalizable;
      var rA = rango(menosLambda(A, l, n), n), rB = rango(menosLambda(B, l, n), n);
      if (rA === rB) return null;
      return { A: A, B: B, P: unimodular(n), lambda: l, rangoA: rA, rangoB: rB };
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

    /** p(λ) en texto, con los signos ya resueltos: «−λ³ + 2λ² − λ + 3». */
    function polinomioTexto(coefs) {
      var grado = coefs.length - 1, s = '';
      var POT = ['', 'λ', 'λ²', 'λ³'];
      coefs.forEach(function (a, i) {
        var g = grado - i;
        if (a === 0) return;
        var abs = Math.abs(a);
        var cuerpo = g === 0 ? String(abs) : (abs === 1 ? '' : abs) + POT[g];
        if (s === '') s = (a < 0 ? '−' : '') + cuerpo;
        else s += (a < 0 ? ' − ' : ' + ') + cuerpo;
      });
      return s || '0';
    }

    /** «Rango(A − 2I)», «Rango(A + 3I)» o, con λ = 0, «Rango(A)». */
    function rangoTexto(nombre, l) {
      if (l === 0) return 'Rango(' + nombre + ')';
      return 'Rango(' + nombre + (l > 0 ? ' − ' : ' + ') + (Math.abs(l) === 1 ? '' : Math.abs(l)) + 'I)';
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    var NOTA_P = ' La P que te dimos no cumple A·P = P·B, pero eso solo no alcanzaría para decir que no: ' +
      'podría haber otra P que sí. Lo que lo asegura es el invariante.';

    window.AptActivity.init({
      mount: '#apt-u4a4',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: '¿Son semejantes?',
      subtitle: 'Primero mirá los invariantes de 4.2.1: si alguno no coincide, no pueden ser semejantes. Si coinciden todos, fijate si la P cumple B = P⁻¹·A·P (alcanza con ver que A·P = P·B).',
      nextLabel: 'Probar con otro par →',
      needsKatex: true,
      mode: 'choices',
      choices: [
        { value: 'si', label: 'Sí, son semejantes' },
        { value: 'no', label: 'No, no pueden serlo' }
      ],
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          'A = ' + matrixLatex(current.A) + '\\qquad B = ' + matrixLatex(current.B) +
          '\\\\[8pt] P = ' + matrixLatex(current.P),
          container, { throwOnError: false, displayMode: true }
        );
      },
      check: function (current, value) {
        return (value === 'si') === current.semejantes;
      },
      explain: function (current, correcto) {
        var cabeza = correcto ? '¡Correcto! ' : 'No es correcto. ';
        var n = current.n;

        if (current.tipo === 'traza') {
          return cabeza + 'No pueden ser semejantes: la traza de A vale ' + conSigno(current.trazaA) +
            ' y la de B, ' + conSigno(current.trazaB) + '. Como la traza es un invariante de semejanza, ' +
            'si no coincide ya está todo dicho.' + NOTA_P;
        }
        if (current.tipo === 'determinante') {
          return cabeza + 'No pueden ser semejantes. Ojo que acá las trazas sí coinciden, las dos valen ' +
            conSigno(current.trazaA) + ', así que ese invariante no las descarta. El que las delata es el determinante: ' +
            'el de A vale ' + conSigno(current.detA) + ' y el de B, ' + conSigno(current.detB) + '.' + NOTA_P;
        }
        if (current.tipo === 'polinomio') {
          return cabeza + 'No pueden ser semejantes, aunque coincidan la traza (' + conSigno(current.trazaA) +
            ') y el determinante (' + conSigno(current.detA) + '). En 3×3 eso no alcanza: hay que mirar el polinomio ' +
            'característico entero. El de A es p(λ) = ' + polinomioTexto(current.polA) + ' y el de B, p(λ) = ' +
            polinomioTexto(current.polB) + ': difieren en el término en λ. Como el polinomio característico es un ' +
            'invariante de semejanza, no hay P que las conecte.' + NOTA_P;
        }
        if (current.tipo === 'mg') {
          var l = current.lambda;
          var mgA = n - current.rangoA, mgB = n - current.rangoB;
          var txt = cabeza + 'No pueden ser semejantes. Coinciden la traza, el determinante y hasta el polinomio ' +
            'característico, p(λ) = ' + polinomioTexto(current.polA) + ', así que tienen los mismos autovalores con la misma MA. ' +
            'Lo que las separa es la multiplicidad geométrica de λ = ' + conSigno(l) + ': ' + rangoTexto('A', l) +
            ' = ' + current.rangoA + ', así que MG = ' + n + ' − ' + current.rangoA +
            ' = ' + mgA + ', y ' + rangoTexto('B', l) + ' = ' + current.rangoB +
            ', así que MG = ' + mgB + '. Y la MG también es un invariante de semejanza.';
          if (l === 0) txt += ' Como acá λ = 0, es lo mismo que decir que A y B tienen distinto rango.';
          return txt + NOTA_P;
        }

        var APtex = window.katex.renderToString(matrixLatex(current.AP), { throwOnError: false });
        return cabeza + 'Sí lo son, y la P lo prueba: A·P y P·B dan lo mismo, ' + APtex +
          ', y P es invertible (su determinante vale ' + conSigno(determinante(current.P)) + '), así que B = P⁻¹·A·P. ' +
          'Como tenía que pasar, coinciden los invariantes: la traza vale ' + conSigno(current.trazaA) +
          ' en las dos y el determinante ' + conSigno(current.detA) + '. Pero fijate que con eso solo no alcanzaba: ' +
          'los invariantes sirven para descartar, y para confirmar hace falta la P.';
      }
    });
  })();

})();
