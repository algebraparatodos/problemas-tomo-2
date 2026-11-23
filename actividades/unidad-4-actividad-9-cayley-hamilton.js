/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 9
   "Verificá Cayley-Hamilton"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-9-cayley-hamilton.js"><\/script>
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
    function escalar(k, M) { return M.map(function (fila) { return fila.map(function (x) { return k * x; }); }); }
    function identidad(n) {
      var I = [], r, c;
      for (r = 0; r < n; r++) { I.push([]); for (c = 0; c < n; c++) I[r].push(r === c ? 1 : 0); }
      return I;
    }
    function determinante(A) {
      var n = A.length;
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
             A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
             A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
    }

    /* ---------- Qué se practica y por qué así ----------

       El QR promete «verificar el teorema de Cayley-Hamilton evaluando el
       polinomio característico en la propia matriz», y eso es lo que hace
       el libro en 4.4, en 2×2 (Ejemplo #1) y en 3×3 (la matriz de los
       Ejemplos #2 de 4.2.3 y #3 de 4.4). Así que la actividad recorre el
       mismo camino, en fases:

         1. p(λ) = det(A − λI), elegido entre cuatro. Con el convenio del
            libro: en 3×3 el término principal es −λ³.
         2. p(A): reemplazar cada λᵏ por Aᵏ y el término independiente c₀
            por c₀·I, que es la definición de 4.4.
         3. A², escrita entrada por entrada.
         4. (Sólo en 3×3) A³ = A·A².

       Al final la explicación junta todo y muestra que la suma da O. No
       se pide escribir O, porque el teorema ya lo dice y no habría nada
       que comprobar: lo que se comprueba son las cuentas.

       Las celdas del motor aceptan hasta dos cifras, así que se descartan
       las matrices cuyas potencias tengan alguna entrada de tres. */
    function generarCaso() {
      var intentos = 0;
      var n = Math.random() < 0.5 ? 2 : 3;
      while (intentos++ < 4000) {
        var A = [], r, c;
        for (r = 0; r < n; r++) {
          A.push([]);
          for (c = 0; c < n; c++) A[r].push(n === 2 ? randInt(-4, 5) : randInt(-2, 3));
        }

        // Triangular no: el polinomio se leería en la diagonal.
        var sup = true, inf = true;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
          if (r > c && A[r][c] !== 0) sup = false;
          if (r < c && A[r][c] !== 0) inf = false;
        }
        if (sup || inf) continue;

        var tr = 0;
        for (r = 0; r < n; r++) tr += A[r][r];
        var det = determinante(A);
        var coefs;   // de p(λ) = det(A − λI), de mayor a menor grado
        if (n === 2) {
          coefs = [1, -tr, det];
        } else {
          var m = 0;
          for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) m += A[i][i] * A[j][j] - A[i][j] * A[j][i];
          coefs = [-1, tr, -m, det];
        }
        // Con algún coeficiente nulo, los distractores de signo colapsan
        // sobre la respuesta correcta.
        if (coefs.some(function (x) { return x === 0; })) continue;
        if (coefs.some(function (x) { return Math.abs(x) > 30; })) continue;

        var A2 = multiplicar(A, A, n);
        var A3 = n === 3 ? multiplicar(A, A2, n) : null;
        var grande = false;
        [A2, A3].forEach(function (M) {
          if (!M) return;
          M.forEach(function (fila) { fila.forEach(function (x) { if (Math.abs(x) > 99) grande = true; }); });
        });
        if (grande) continue;
        // Que elevar cada entrada al cuadrado no dé lo mismo por casualidad.
        var casualidad = true;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (A2[r][c] !== A[r][c] * A[r][c]) casualidad = false;
        if (casualidad) continue;

        var polinomios = opcionesPolinomio(coefs);
        var evaluaciones = opcionesEvaluacion(coefs);
        if (!polinomios || !evaluaciones) continue;

        return { n: n, A: A, A2: A2, A3: A3, coefs: coefs, polinomios: polinomios, evaluaciones: evaluaciones };
      }
      return null;
    }

    /* Los distractores de p(λ) son los errores de signo al desarrollar
       det(A − λI): la traza con el signo cambiado, el término
       independiente (el determinante) con el signo cambiado y, en 3×3, el
       coeficiente de λ con el signo cambiado. */
    function opcionesPolinomio(coefs) {
      var k = coefs.length - 1;
      var errores = [
        { tipo: 'traza', coefs: coefs.map(function (x, i) { return i === 1 ? -x : x; }) },
        { tipo: 'independiente', coefs: coefs.map(function (x, i) { return i === k ? -x : x; }) }
      ];
      if (k === 3) errores.push({ tipo: 'lineal', coefs: coefs.map(function (x, i) { return i === 2 ? -x : x; }) });
      else errores.push({ tipo: 'ambos', coefs: coefs.map(function (x, i) { return i === 0 ? x : -x; }) });

      var vistos = [polinomioTex(coefs, '\\lambda', false)];
      var opciones = [{ value: 'ok', tex: vistos[0] }];
      errores.forEach(function (e) {
        var t = polinomioTex(e.coefs, '\\lambda', false);
        if (vistos.indexOf(t) !== -1) return;
        vistos.push(t);
        opciones.push({ value: e.tipo, tex: t });
      });
      return opciones.length === 4 ? shuffle(opciones) : null;
    }

    /* Los distractores de p(A): el término independiente sin la I (no se
       puede sumar un número a una matriz), el «atajo» de meter A adentro
       del determinante (p(A) es una matriz, no un número) y los
       coeficientes puestos en el orden inverso. */
    function opcionesEvaluacion(coefs) {
      var correcta = polinomioTex(coefs, 'A', true);
      var sinI = polinomioTex(coefs, 'A', false);
      var invertida = polinomioTex(coefs.slice().reverse(), 'A', true);
      var textos = [correcta, sinI, invertida];
      if (textos[2] === textos[0] || textos[2] === textos[1]) return null;
      return shuffle([
        { value: 'ok', tex: correcta },
        { value: 'sinI', tex: sinI },
        { value: 'det', tex: '\\det(A - A\\,I) = \\det(O) = 0' },
        { value: 'invertida', tex: invertida }
      ]);
    }

    /** c₃x³ + c₂x² + c₁x + c₀ en LaTeX con los signos ya resueltos.
        Con conI, el término independiente lleva la identidad: c₀·I. */
    function polinomioTex(coefs, x, conI) {
      var grado = coefs.length - 1, s = '';
      coefs.forEach(function (a, i) {
        var g = grado - i;
        if (a === 0) return;
        var abs = Math.abs(a);
        var cuerpo;
        if (g === 0) cuerpo = conI ? (abs === 1 ? 'I' : abs + 'I') : String(abs);
        else cuerpo = (abs === 1 ? '' : abs) + x + (g === 1 ? '' : '^{' + g + '}');
        if (s === '') s = (a < 0 ? '-' : '') + cuerpo;
        else s += (a < 0 ? ' - ' : ' + ') + cuerpo;
      });
      return s;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }
    function tex(s) { return window.katex.renderToString(s, { throwOnError: false }); }

    /** Cómo se nombra cada término: «−A³», «3A²», «9A», «5I». */
    function nombreTermino(a, g) {
      var abs = Math.abs(a);
      var base = g === 0 ? 'I' : 'A' + (g === 1 ? '' : '^{' + g + '}');
      return (a < 0 ? '-' : '') + (abs === 1 ? '' : abs) + base;
    }

    /* La verificación entera, término por término, para el final. */
    function verificacion(current) {
      var n = current.n, grado = current.coefs.length - 1;
      var potencias = [identidad(n), current.A, current.A2, current.A3];
      var partes = current.coefs.map(function (a, i) {
        var g = grado - i;
        return tex(nombreTermino(a, g) + ' = ' + matrixLatex(escalar(a, potencias[g])));
      });
      return 'Ahora juntá todo: p(A) = ' + tex(polinomioTex(current.coefs, 'A', true)) + ', con ' +
        partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1] + '. ' +
        'Sumalas entrada por entrada: da la matriz nula, ' + tex('p(A) = O') + ', como dice el teorema.';
    }

    function checkPotencia(current, G, hayVacias, cual) {
      var n = current.n, r, c, estado = [], todoBien = !hayVacias;
      var esperada = cual === 2 ? current.A2 : current.A3;
      for (r = 0; r < n; r++) {
        var fila = [];
        for (c = 0; c < n; c++) {
          var ok = G[r][c] === esperada[r][c];
          if (!ok) todoBien = false;
          fila.push(ok ? 'correct' : 'wrong');
        }
        estado.push(fila);
      }
      if (hayVacias) {
        return { correct: false, cellStatus: estado, feedbackText: 'Te quedaron celdas vacías. Completalas todas antes de comprobar.' };
      }
      if (todoBien) {
        var ultima = cual === 3 || n === 2;
        return {
          correct: true, cellStatus: estado,
          feedbackText: '¡Correcto! ' + (ultima ? verificacion(current) : 'Para el término de grado 3 falta A³.')
        };
      }
      // El error clásico: elevar cada entrada por separado.
      var entradaPorEntrada = true;
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
        if (G[r][c] !== Math.pow(current.A[r][c], cual)) entradaPorEntrada = false;
      }
      if (entradaPorEntrada) {
        return {
          correct: false, cellStatus: estado,
          feedbackText: 'Elevaste cada entrada de A por separado, y eso no es la potencia de la matriz: A' +
            (cual === 2 ? '² = A·A' : '³ = A·A²') + ' es un producto de matrices, fila por columna.'
        };
      }
      return {
        correct: false, cellStatus: estado,
        feedbackText: 'Revisá las entradas marcadas en rojo. La entrada (i,j) de ' + (cual === 2 ? 'A·A' : 'A·A²') +
          ' es la fila i de A por la columna j de ' + (cual === 2 ? 'A' : 'A²') + '.'
      };
    }

    var POR_QUE_NO_POLINOMIO = {
      traza: 'Revisá el signo del término en {g}. En la diagonal de A − λI cada elemento es (aᵢᵢ − λ), y al multiplicarlos el signo de cada λ cuenta.',
      independiente: 'Revisá el término independiente: es p(0) = det(A − 0I) = det(A), con su signo.',
      lineal: 'Revisá el coeficiente de λ: al desarrollar det(A − λI), juntá con cuidado todos los términos que quedan con una sola λ, cada uno con su signo.',
      ambos: 'Revisá los signos: desarrollá (a₁₁ − λ)(a₂₂ − λ) − a₁₂·a₂₁ y ordená por potencias de λ.'
    };
    var POR_QUE_NO_EVALUACION = {
      sinI: 'El término independiente tiene que ir multiplicado por I: a una matriz no se le puede sumar un número.',
      det: 'Ese es un atajo tentador, pero está mal: p(A) es una matriz, no un número. No se reemplaza λ adentro del determinante, sino en el polinomio ya desarrollado.',
      invertida: 'Cada coeficiente va con su potencia: el de λᵏ con Aᵏ. Ahí quedaron en el orden inverso.'
    };

    window.AptActivity.init({
      mount: '#apt-u4a9',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Verificá Cayley-Hamilton',
      subtitle: 'Toda matriz satisface su propio polinomio característico: p(A) = O. Comprobalo con esta matriz, como en los ejemplos de 4.4.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'phases',
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render('A = ' + matrixLatex(current.A), container, { throwOnError: false });
      },
      phases: [
        {
          mode: 'choices',
          question: 'Paso 1. Calculá el polinomio característico, $p(\\lambda) = \\det(A - \\lambda I)$.',
          choicesStacked: true,
          choices: function (current) {
            return current.polinomios.map(function (o) {
              return { value: o.value, label: tex('p(\\lambda) = ' + o.tex) };
            });
          },
          check: function (current, value) { return value === 'ok'; },
          explain: function (current, correcto, value) {
            var base = 'p(λ) = ' + tex(polinomioTex(current.coefs, '\\lambda', false)) + '.' +
              (current.n === 3 ? ' En 3×3 el término principal es −λ³, porque det(A − λI) tiene −λ en cada lugar de la diagonal.' : '');
            if (correcto) return '¡Correcto! ' + base;
            var motivo = (POR_QUE_NO_POLINOMIO[value] || '').replace('{g}', current.n === 3 ? 'λ²' : 'λ');
            return 'No es correcto. ' + motivo + ' Queda ' + base;
          }
        },
        {
          mode: 'choices',
          question: 'Paso 2. Reemplazá $\\lambda$ por $A$. ¿Cuál es $p(A)$?',
          choicesStacked: true,
          choices: function (current) {
            return current.evaluaciones.map(function (o) {
              return { value: o.value, label: tex('p(A) = ' + o.tex) };
            });
          },
          check: function (current, value) { return value === 'ok'; },
          explain: function (current, correcto, value) {
            var base = 'Cada λᵏ pasa a ser Aᵏ y el término independiente se multiplica por la identidad: p(A) = ' +
              tex(polinomioTex(current.coefs, 'A', true)) + '. El teorema dice que esa matriz es la nula; para comprobarlo hace falta ' +
              (current.n === 3 ? 'A² y A³.' : 'A².');
            if (correcto) return '¡Correcto! ' + base;
            return 'No es correcto. ' + (POR_QUE_NO_EVALUACION[value] || '') + ' ' + base;
          }
        },
        {
          mode: 'grid',
          question: 'Paso 3. Calculá $A^2 = A \\cdot A$.',
          grid: { rows: function (c) { return c.n; }, cols: function (c) { return c.n; }, noDivider: true, label: 'A^2 =' },
          checkGrid: function (current, G, hayVacias) { return checkPotencia(current, G, hayVacias, 2); },
          getAnswerGrid: function (current) { return current.A2; },
          answerTitle: 'A² es esta',
          answerText: 'Cada entrada es una fila de A por una columna de A.'
        },
        {
          mode: 'grid',
          question: 'Paso 4. Calculá $A^3 = A \\cdot A^2$.',
          skip: function (current) { return current.n !== 3; },
          grid: { rows: 3, cols: 3, noDivider: true, label: 'A^3 =' },
          checkGrid: function (current, G, hayVacias) { return checkPotencia(current, G, hayVacias, 3); },
          getAnswerGrid: function (current) { return current.A3; },
          answerTitle: 'A³ es esta',
          answerText: 'Con A² y A³ ya podés sumar los términos de p(A) y ver que da la matriz nula.'
        }
      ]
    });
  })();

})();
