/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 21
   "Desarrollo por cofactores"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-21-desarrollo-cofactores.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a21')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a21';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = randInt(0, i), t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

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

    /* ---------- Qué línea conviene ----------

       El punto de esta actividad no es calcular un determinante de 4×4 a
       fuerza bruta —eso son 24 productos— sino elegir bien por dónde
       desarrollarlo. Cada cero de la línea elegida borra un menor entero
       del cálculo, así que la línea con más ceros es la que menos trabajo
       deja. */
    function cerosDeLinea(M, tipo, i) {
      var n = M.length, k = 0, j;
      for (j = 0; j < n; j++) {
        if (tipo === 'fila' ? M[i][j] === 0 : M[j][i] === 0) k++;
      }
      return k;
    }

    function lineas(M) {
      var n = M.length, todas = [], i;
      for (i = 0; i < n; i++) todas.push({ tipo: 'fila', i: i, ceros: cerosDeLinea(M, 'fila', i) });
      for (i = 0; i < n; i++) todas.push({ tipo: 'columna', i: i, ceros: cerosDeLinea(M, 'columna', i) });
      return todas;
    }

    function nombreLinea(linea) {
      return (linea.tipo === 'fila' ? 'Fila ' : 'Columna ') + (linea.i + 1);
    }

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = 4;
        var M = [], r, c;
        for (r = 0; r < n; r++) {
          M.push([]);
          for (c = 0; c < n; c++) M[r].push(randInt(-3, 4));
        }

        // Se elige una línea y se la vacía casi entera, para que haya una
        // opción claramente mejor que las demás.
        var esFila = Math.random() < 0.5;
        var elegida = randInt(0, n - 1);
        var dejarEn = randInt(0, n - 1);
        for (var k = 0; k < n; k++) {
          if (k === dejarEn) continue;
          if (esFila) M[elegida][k] = 0; else M[k][elegida] = 0;
        }
        if (esFila) M[elegida][dejarEn] = randNonZero(-3, 4);
        else M[dejarEn][elegida] = randNonZero(-3, 4);

        var todas = lineas(M);
        var maximo = Math.max.apply(null, todas.map(function (l) { return l.ceros; }));
        var mejores = todas.filter(function (l) { return l.ceros === maximo; });

        // Si media matriz quedó vacía hay demasiadas líneas igual de
        // buenas y la primera pregunta deja de tener una respuesta clara.
        if (mejores.length > 3) continue;
        if (maximo < 3) continue;

        var valor = det(M);
        if (Math.abs(valor) > 300) continue;
        if (valor === 0) continue;

        // Las opciones de la primera pregunta: las mejores y algunas que
        // no lo son, para que haya que mirar de verdad.
        var peores = todas.filter(function (l) { return l.ceros <= 1; });
        if (peores.length < 3) continue;

        var opcionesLinea = shuffle(
          [randChoice(mejores)].concat(shuffle(peores).slice(0, 3))
        ).map(function (l) {
          return { value: l.tipo + l.i, label: nombreLinea(l), ceros: l.ceros };
        });

        // Y las de la segunda: el determinante y tres errores de signo,
        // que es donde se falla al desarrollar por cofactores.
        var conSignoCambiado = -valor;
        var errores = [conSignoCambiado, valor + randChoice([-2, 2]) * randInt(1, 4), valor * 2];
        var usados = [valor], opcionesDet = [];
        for (k = 0; k < errores.length; k++) {
          if (usados.indexOf(errores[k]) !== -1) continue;
          usados.push(errores[k]);
          opcionesDet.push(errores[k]);
        }
        if (opcionesDet.length < 3) continue;

        return {
          M: M,
          det: valor,
          maximo: maximo,
          mejores: mejores.map(nombreLinea),
          opcionesLinea: opcionesLinea,
          opcionesDet: shuffle(opcionesDet.concat([valor])).map(function (v) {
            return { value: String(v), label: String(v) };
          })
        };
      }
      return null;
    }

    function matrixLatex(M) {
      return '\\left|\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right|';
    }

    window.AptActivity.init({
      mount: '#apt-u1a21',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Desarrollo por cofactores',
      subtitle: 'Desarrollar un determinante de 4×4 por cofactores son cuatro determinantes de 3×3 — salvo que elijas bien por dónde hacerlo.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'phases',
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.M), container, { throwOnError: false });
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Por qué fila o columna conviene desarrollar?',
          choices: function (current) { return current.opcionesLinea; },
          check: function (current, value) {
            var elegida = current.opcionesLinea.filter(function (o) { return o.value === value; })[0];
            return !!elegida && elegida.ceros === current.maximo;
          },
          explain: function (current, correcto) {
            var cuantos = current.maximo;
            var cual = current.mejores.length === 1
              ? 'La mejor es ' + current.mejores[0] + ', que tiene ' + cuantos + ' ceros'
              : 'Las mejores son ' + current.mejores.join(' y ') + ', con ' + cuantos + ' ceros cada una';
            return (correcto ? '¡Correcto! ' : 'No es la que menos trabajo deja. ') + cual +
              '. Cada cero de la línea por la que desarrollás borra un menor entero del cálculo: con ' +
              cuantos + ' ceros te queda ' + (4 - cuantos) +
              ' determinante de 3×3 en vez de cuatro.';
          }
        },
        {
          mode: 'choices',
          question: 'Ahora sí: ¿cuánto vale el determinante?',
          choices: function (current) { return current.opcionesDet; },
          check: function (current, value) { return Number(value) === current.det; },
          explain: function (current, correcto) {
            return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
              'El determinante vale ' + current.det +
              '. Acordate del signo del cofactor: el de la posición (i,j) lleva (−1)^(i+j), así que ' +
              'los de las posiciones donde i+j es impar cambian de signo. Ese es el paso donde más se falla.';
          }
        }
      ]
    });
  })();

})();
