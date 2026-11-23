/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 23
   "Calculá la inversa por la adjunta"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-23-matriz-adjunta.js"><\/script>

   El nombre del archivo quedó de cuando la actividad pedía sólo la
   adjunta: es parte de la URL que cargan las landings, así que no se
   cambia aunque ahora la actividad llegue hasta la inversa.
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
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = randInt(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }

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

    /* ---------- El camino del libro, en tres pasos ----------

       A⁻¹ = adj(A)/det(A), y el ejemplo del libro lo hace así: primero
       el determinante (si es 0 no hay inversa), después los nueve
       cofactores, Cof(A), y su traspuesta, que es adj(A), y al final la
       división.

       Los dos primeros pasos se escriben en la grilla, porque dan enteros:
       el determinante lo es, y cada entrada de la adjunta también, porque
       es un determinante de 2×2 con signo. Ahí está además el error que
       más se comete, olvidarse de trasponer, y la grilla lo detecta.

       El último paso casi nunca da enteros (el libro termina con tercios),
       y la grilla sólo acepta enteros, así que se elige entre cuatro
       candidatas escritas con fracciones. Los distractores son los
       errores típicos de ese paso: dividir Cof(A) en vez de adj(A),
       cambiarle el signo al determinante, multiplicar en vez de dividir
       y quedarse con la adjunta sin dividir. Por eso |det(A)| va de 2 a
       12: con ±1 la división no cambia nada y tres distractores se
       confundirían con la respuesta. */
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
    function traspuesta(M) { return M[0].map(function (_, c) { return M.map(function (f) { return f[c]; }); }); }

    /* Una matriz de fracciones se guarda como numeradores enteros sobre
       un denominador común (den > 0); cada entrada se simplifica recién
       al escribirla. */
    function fracMatrix(num, den) {
      if (den < 0) { num = num.map(function (f) { return f.map(function (x) { return -x; }); }); den = -den; }
      return { num: num, den: den };
    }
    function claveFrac(F) {
      return F.num.map(function (f) {
        return f.map(function (x) { var g = gcd(x, F.den); return (x / g) + '/' + (F.den / g); }).join(',');
      }).join(';');
    }
    function entradaTex(x, den) {
      if (x === 0) return '0';
      var g = gcd(x, den), p = x / g, q = den / g;
      if (q === 1) return String(p);
      return (p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(p) + '}{' + q + '}';
    }
    function fracMatrixTex(F) {
      var hayFracciones = F.num.some(function (f) { return f.some(function (x) { return x % F.den !== 0; }); });
      return '\\begin{pmatrix} ' + F.num.map(function (f) {
        return f.map(function (x) { return entradaTex(x, F.den); }).join(' & ');
      }).join(hayFracciones ? ' \\\\[4pt] ' : ' \\\\ ') + ' \\end{pmatrix}';
    }

    function armarOpciones(adj, d) {
      var correcta = fracMatrix(adj, d);
      var escalar = function (M, k) { return M.map(function (f) { return f.map(function (x) { return k * x; }); }); };
      var candidatos = [
        { tipo: 'sin-trasponer', F: fracMatrix(traspuesta(adj), d) },
        { tipo: 'signo', F: fracMatrix(adj, -d) },
        { tipo: 'multiplicar', F: fracMatrix(escalar(adj, d), 1) },
        { tipo: 'sin-dividir', F: fracMatrix(adj, 1) }
      ];
      var vistos = [claveFrac(correcta)];
      var elegidas = [{ tipo: 'ok', F: correcta }];
      shuffle(candidatos).forEach(function (c) {
        if (elegidas.length >= 4) return;
        var k = claveFrac(c.F);
        if (vistos.indexOf(k) !== -1) return;
        vistos.push(k); elegidas.push(c);
      });
      // Si la adjunta es simétrica, «sin trasponer» coincide con la
      // correcta: se completa con un error de cuentas en una entrada.
      var guarda = 0;
      while (elegidas.length < 4 && guarda++ < 50) {
        var num = adj.map(function (f) { return f.slice(); });
        var i = randInt(0, 2), j = randInt(0, 2);
        num[i][j] = -num[i][j] + (num[i][j] === 0 ? randInt(1, 3) : 0);
        var F = fracMatrix(num, d), kk = claveFrac(F);
        if (vistos.indexOf(kk) !== -1) continue;
        vistos.push(kk); elegidas.push({ tipo: 'cuentas', F: F });
      }
      return elegidas.length === 4 ? shuffle(elegidas) : null;
    }

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 500) {
        var n = 3;
        var M = [], r, c;
        for (r = 0; r < n; r++) {
          M.push([]);
          for (c = 0; c < n; c++) M[r].push(randInt(-3, 4));
        }

        var d = det(M);
        // Con determinante 0 no hay inversa; con ±1 la división no se ve.
        if (Math.abs(d) < 2 || Math.abs(d) > 12) continue;

        var ceros = 0;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (M[r][c] === 0) ceros++;
        if (ceros > 3) continue;

        var A = adjunta(M);
        var grande = false;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(A[r][c]) > 30) grande = true;
        if (grande) continue;

        var opciones = armarOpciones(A, d);
        if (!opciones) continue;

        return { n: n, M: M, det: d, respuesta: A, opciones: opciones };
      }
      return null;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    function conSigno(n) { return n < 0 ? '−' + Math.abs(n) : String(n); }

    var POR_QUE_NO = {
      'sin-trasponer': 'Esa opción divide Cof(A) por el determinante, sin trasponer: es la traspuesta de A⁻¹.',
      'signo': 'Esa opción tiene el signo cambiado: hay que dividir por det(A) con su signo.',
      'multiplicar': 'Esa opción multiplica la adjunta por det(A) en vez de dividirla.',
      'sin-dividir': 'Esa opción es la adjunta tal cual: falta dividirla por det(A).',
      'cuentas': 'Esa opción tiene un error de cuentas en una entrada.'
    };

    window.AptActivity.init({
      mount: '#apt-u1a23',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Calculá la inversa por la adjunta',
      subtitle: 'Como en el libro, en tres pasos: el determinante, la adjunta (la matriz de cofactores, traspuesta) y al final $A^{-1} = \\frac{\\operatorname{adj}(A)}{\\det(A)}$.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'phases',
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render('A = ' + matrixLatex(current.M), container, { throwOnError: false });
      },
      phases: [
        {
          mode: 'grid',
          question: 'Primero, el determinante: ¿cuánto vale $\\det(A)$?',
          grid: { rows: 1, cols: 1, noDivider: true, hideBrackets: true, label: '\\det(A) =' },
          checkGrid: function (current, G, hayVacias) {
            var ok = !hayVacias && G[0][0] === current.det;
            return {
              correct: ok,
              cellStatus: [[hayVacias ? null : (ok ? 'correct' : 'wrong')]],
              feedbackText: hayVacias
                ? 'Te quedó la celda vacía. Completala antes de comprobar.'
                : ok
                  ? 'Como det(A) = ' + conSigno(current.det) + ' ≠ 0, A es invertible.'
                  : 'Revisá la cuenta: podés usar Sarrus o desarrollar por cofactores por la fila o la columna que tenga más ceros.'
            };
          },
          getAnswerGrid: function (current) { return [[current.det]]; },
          answerTitle: 'El determinante correcto',
          answerText: 'Es distinto de cero, así que A es invertible.'
        },
        {
          mode: 'grid',
          question: 'Ahora la adjunta: calculá los nueve cofactores, armá $\\operatorname{Cof}(A)$ y trasponela.',
          grid: { rows: 3, cols: 3, noDivider: true, label: '\\operatorname{adj}(A) =' },
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
                feedbackText: 'Ya tenés adj(A). Queda el último paso: dividirla por det(A) = ' + conSigno(current.det) + '.'
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
          answerText: 'Para llegar a la inversa falta dividirla por el determinante.'
        },
        {
          mode: 'choices',
          question: 'Último paso: dividí la adjunta por el determinante. ¿Cuál es $A^{-1}$?',
          choicesGrid: true,
          choicesGridSingleColumn: true,
          choices: function (current) {
            return current.opciones.map(function (o) {
              return {
                value: o.tipo,
                label: window.katex.renderToString('A^{-1} = ' + fracMatrixTex(o.F), { throwOnError: false })
              };
            });
          },
          check: function (current, value) { return value === 'ok'; },
          explain: function (current, correcto, value) {
            var base = 'A⁻¹ = adj(A)/det(A): cada entrada de la adjunta dividida por det(A) = ' + conSigno(current.det) +
              ', y simplificada. Si querés comprobarlo, A·A⁻¹ tiene que dar la identidad.';
            if (correcto) return base;
            return (POR_QUE_NO[value] ? POR_QUE_NO[value] + ' ' : '') + base;
          }
        }
      ]
    });
  })();

})();
