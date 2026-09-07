/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 11
   "Verificá Cayley-Hamilton"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-11-cayley-hamilton.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a11')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a11';
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

    /* ---------- Qué se pregunta y por qué así ----------

       Para una matriz de 2×2 el polinomio característico es

           p(λ) = λ² − tr(A)·λ + det(A)

       y Cayley-Hamilton dice que p(A) = O, o sea que

           A² = tr(A)·A − det(A)·I

       Eso no es una curiosidad: es la forma práctica de calcular A² —y
       cualquier potencia— sin multiplicar matrices, y aparece en cuanto
       uno tiene que trabajar con potencias a mano.

       La actividad presenta cuatro igualdades con los números ya puestos
       y pide reconocer la buena. Los tres distractores son los tres
       errores de signo y de orden que se cometen al escribirla: cambiar
       el signo del término independiente, intercambiar traza y
       determinante, y poner los dos coeficientes con el mismo signo. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 300) {
        var A = [
          [randInt(-4, 5), randInt(-4, 5)],
          [randInt(-4, 5), randInt(-4, 5)]
        ];

        var tr = A[0][0] + A[1][1];
        var det = A[0][0] * A[1][1] - A[0][1] * A[1][0];

        // Si la traza o el determinante son cero, dos de los distractores
        // colapsan sobre la respuesta correcta.
        if (tr === 0 || det === 0) continue;
        if (tr === det) continue;
        if (tr === -det) continue;
        if (Math.abs(tr) > 9 || Math.abs(det) > 20) continue;

        var A2 = [
          [A[0][0] * A[0][0] + A[0][1] * A[1][0], A[0][0] * A[0][1] + A[0][1] * A[1][1]],
          [A[1][0] * A[0][0] + A[1][1] * A[1][0], A[1][0] * A[0][1] + A[1][1] * A[1][1]]
        ];

        var correcta = expresion(tr, -det);
        var candidatas = [
          expresion(tr, det),        // el signo del término independiente
          expresion(det, -tr),       // traza y determinante intercambiados
          expresion(-tr, det)        // los dos signos al revés
        ];

        var textos = [correcta], opciones = [];
        for (var k = 0; k < candidatas.length; k++) {
          if (textos.indexOf(candidatas[k]) !== -1) continue;
          textos.push(candidatas[k]);
          opciones.push(candidatas[k]);
        }
        if (opciones.length < 3) continue;

        return {
          A: A, A2: A2, tr: tr, det: det,
          correcta: correcta,
          opciones: shuffle(opciones.concat([correcta])).map(function (t) {
            return { value: t, label: t };
          })
        };
      }
      return null;
    }

    /** Escribe «A² = c₁·A + c₀·I» con los signos ya resueltos. */
    function expresion(coefA, coefI) {
      var parteA = coefA === 1 ? 'A' : (coefA === -1 ? '−A' : coefA + '·A');
      var signo = coefI < 0 ? ' − ' : ' + ';
      var valor = Math.abs(coefI);
      var parteI = valor === 1 ? 'I' : valor + '·I';
      return 'A² = ' + parteA + signo + parteI;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{rr}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a11',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Verificá Cayley-Hamilton',
      subtitle: 'Toda matriz satisface su propio polinomio característico. Para una de 2×2, eso da una fórmula para A² sin multiplicar nada.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choicesStacked: true,
      choices: function (current) { return current.opciones; },
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          'A = ' + matrixLatex(current.A),
          container, { throwOnError: false }
        );
      },
      check: function (current, value) { return value === current.correcta; },
      explain: function (current, correcto) {
        return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
          'El polinomio característico es p(λ) = λ² − ' + current.tr + '·λ + ' + current.det +
          ', porque el coeficiente del término lineal es la traza cambiada de signo y el independiente es el determinante. ' +
          'Cayley-Hamilton dice que p(A) = O, así que A² − ' + current.tr + '·A + ' + current.det + '·I = O, ' +
          'y despejando queda ' + current.correcta + '. ' +
          'Podés comprobarlo: A² da ' + JSON.stringify(current.A2).replace(/[[\]]/g, '') +
          ', y la cuenta de la derecha da lo mismo. Y fijate lo que significa: ' +
          'te deja calcular A² sin multiplicar matrices, sólo escalando A y sumando un múltiplo de la identidad.';
      }
    });
  })();

})();
