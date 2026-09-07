/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 10
   "Cadenas de Markov: el estado a largo plazo"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-10-markov.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a10')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a10';
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
    function mcd(a, b) { return b ? mcd(b, a % b) : Math.abs(a); }

    /* ---------- Cómo se arma el problema ----------

       La matriz de transición de dos estados queda determinada por dos
       números: la proporción a que se va del primer estado al segundo y
       la proporción b que hace el camino inverso.

           M = [ 1−a   b  ]
               [  a   1−b ]

       Sus columnas suman 1, como tienen que sumar. Su autovalor 1 —que
       toda matriz de transición tiene— lleva el autovector (b, a), y
       normalizado para que sus componentes sumen 1 da el reparto de
       equilibrio: exactamente lo que la sección calcula con la matriz de
       las dos ciudades.

       Los porcentajes se eligen en décimas y con a+b divisor cómodo, para
       que el reparto salga en fracciones que se puedan decir en voz
       alta. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 300) {
        var a = randInt(1, 5);
        var b = randInt(1, 5);
        if (a === b) continue;

        var suma = a + b;
        var g = mcd(b, suma);
        var num1 = b / g, den1 = suma / g;
        var num2 = a / mcd(a, suma), den2 = suma / mcd(a, suma);

        // Fracciones con denominador feo son difíciles de reconocer entre
        // cuatro opciones.
        if (den1 > 9 || den2 > 9) continue;

        var correcto = fraccion(b, suma) + '  y  ' + fraccion(a, suma);
        var candidatos = [
          fraccion(a, suma) + '  y  ' + fraccion(b, suma),
          '1/2  y  1/2',
          fraccion(1, 2) === fraccion(b, suma) ? null : fraccion(b, suma + 1) + '  y  ' + fraccion(a + 1, suma + 1)
        ];

        var textos = [correcto], opciones = [];
        for (var k = 0; k < candidatos.length; k++) {
          if (!candidatos[k]) continue;
          if (textos.indexOf(candidatos[k]) !== -1) continue;
          textos.push(candidatos[k]);
          opciones.push(candidatos[k]);
        }
        if (opciones.length < 3) continue;

        return {
          a: a, b: b, suma: suma,
          M: [[(10 - a) / 10, b / 10], [a / 10, (10 - b) / 10]],
          correcto: correcto,
          reparto: [fraccion(b, suma), fraccion(a, suma)],
          opciones: shuffle(opciones.slice(0, 3).concat([correcto])).map(function (t) {
            return { value: t, label: t };
          })
        };
      }
      return null;
    }

    function fraccion(num, den) {
      var g = mcd(num, den) || 1;
      var n = num / g, d = den / g;
      return d === 1 ? String(n) : n + '/' + d;
    }

    function conDecimal(x) {
      var t = x.toFixed(1);
      return t.replace('.', '{,}');
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{rr}' +
        M.map(function (fila) {
          return fila.map(conDecimal).join(' & ');
        }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a10',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Cadenas de Markov: el estado a largo plazo',
      subtitle: 'Cada año, una parte de los habitantes de cada ciudad se muda a la otra. Esta es la matriz de transición. ¿Cómo queda el reparto a la larga?',
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
          'M = ' + matrixLatex(current.M),
          container, { throwOnError: false }
        );
      },
      check: function (current, value) { return value === current.correcto; },
      explain: function (current, correcto) {
        return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
          'A la larga el reparto se estabiliza en ' + current.reparto[0] + ' y ' + current.reparto[1] +
          ', y no depende de cómo estuvieran repartidos al principio. ' +
          'La cuenta corta es esta: toda matriz de transición tiene al 1 como autovalor —porque sus columnas suman 1—, ' +
          'y el estado de equilibrio es su autovector, normalizado para que las componentes sumen 1. ' +
          'Acá ese autovector es (' + current.b + ', ' + current.a + '), y dividiéndolo por ' + current.suma +
          ' queda el reparto. Fijate que las proporciones aparecen cruzadas: cuanto más se va de una ciudad, ' +
          'menos gente termina en ella.';
      }
    });
  })();

})();
