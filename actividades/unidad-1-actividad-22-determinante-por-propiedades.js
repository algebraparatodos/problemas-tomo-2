/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 22
   "Calculá el determinante usando propiedades"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-22-determinante-por-propiedades.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a22')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a22';
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

    function det(M) {
      var n = M.length;
      if (n === 1) return M[0][0];
      if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
      var suma = 0;
      for (var c = 0; c < n; c++) {
        if (M[0][c] === 0) continue;
        var men = [];
        for (var r = 1; r < n; r++) {
          var f = [];
          for (var k = 0; k < n; k++) if (k !== c) f.push(M[r][k]);
          men.push(f);
        }
        suma += (c % 2 ? -1 : 1) * M[0][c] * det(men);
      }
      return suma;
    }

    function matrizAlAzar(n, min, max) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(randInt(min, max)); }
      return M;
    }

    /* ---------- Los tres casos ----------

       Cada uno se resuelve con una propiedad de 1.2.6.4 y sin desarrollar
       nada. Ese es justamente el punto de la sección: mirar la matriz
       antes de largarse a calcular.

       Las etiquetas nombran la propiedad por su número, como en el libro,
       para que el alumno pueda ir a buscarla. */
    var PROPIEDADES = {
      P3: 'P3: tiene una fila o una columna de ceros',
      P6: 'P6: dos filas o dos columnas son iguales o una es múltiplo de la otra',
      P8: 'P8: es triangular, así que el determinante es el producto de su diagonal',
      ninguna: 'Ninguna: hay que desarrollarlo'
    };

    function conFilaDeCeros(n) {
      var M = matrizAlAzar(n, -4, 5);
      var esFila = Math.random() < 0.5, i = randInt(0, n - 1), k;
      for (k = 0; k < n; k++) { if (esFila) M[i][k] = 0; else M[k][i] = 0; }
      return { M: M, propiedad: 'P3', det: 0, donde: (esFila ? 'la fila ' : 'la columna ') + (i + 1) };
    }

    function conFilasProporcionales(n) {
      var M = matrizAlAzar(n, -4, 5);
      var esFila = Math.random() < 0.5;
      var i = randInt(0, n - 1), j;
      do { j = randInt(0, n - 1); } while (j === i);
      var factor = randChoice([-3, -2, -1, 1, 2, 3]);
      for (var k = 0; k < n; k++) {
        if (esFila) M[j][k] = factor * M[i][k];
        else M[k][j] = factor * M[k][i];
      }
      var linea = esFila ? 'las filas ' : 'las columnas ';
      return {
        M: M, propiedad: 'P6', det: 0,
        donde: linea + (i + 1) + ' y ' + (j + 1) +
          (factor === 1 ? ' son iguales' : ', porque la segunda es ' + factor + ' veces la primera')
      };
    }

    function triangular(n) {
      var M = matrizAlAzar(n, -3, 4);
      var superior = Math.random() < 0.5, r, c;
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          if (superior ? r > c : r < c) M[r][c] = 0;
        }
      }
      var producto = 1;
      for (r = 0; r < n; r++) {
        if (M[r][r] === 0) M[r][r] = randNonZero(-3, 4);
        producto *= M[r][r];
      }
      return {
        M: M, propiedad: 'P8', det: producto,
        donde: 'es triangular ' + (superior ? 'superior' : 'inferior') +
          ', y el producto de su diagonal es ' + producto
      };
    }

    var CASOS = [conFilaDeCeros, conFilasProporcionales, triangular];
    var vistos = [0, 0, 0];

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 300) {
        var minimo = Math.min.apply(null, vistos);
        var candidatos = [];
        for (var k = 0; k < CASOS.length; k++) if (vistos[k] === minimo) candidatos.push(k);
        var cual = randChoice(candidatos);

        var n = randChoice([3, 4, 4]);
        var caso = CASOS[cual](n);

        if (Math.abs(caso.det) > 200) continue;

        // La matriz no puede cumplir dos de las tres propiedades a la vez,
        // o la primera pregunta tendría más de una respuesta correcta.
        var cumple = 0;
        if (tieneLineaDeCeros(caso.M, n)) cumple++;
        if (tieneLineasProporcionales(caso.M, n)) cumple++;
        if (esTriangular(caso.M, n)) cumple++;
        if (cumple !== 1) continue;

        vistos[cual]++;

        var opciones = shuffle(['P3', 'P6', 'P8', 'ninguna']).map(function (clave) {
          return { value: clave, label: PROPIEDADES[clave] };
        });

        var valores = [caso.det];
        var distractores = [];
        var candidatosValor = caso.propiedad === 'P8'
          ? [0, -caso.det, caso.det + randNonZero(-5, 5)]
          : [1, -1, productoDeDiagonal(caso.M, n)];
        for (k = 0; k < candidatosValor.length; k++) {
          if (valores.indexOf(candidatosValor[k]) !== -1) continue;
          valores.push(candidatosValor[k]);
          distractores.push(candidatosValor[k]);
        }
        var relleno = 2;
        while (distractores.length < 3) {
          if (valores.indexOf(relleno) === -1) { valores.push(relleno); distractores.push(relleno); }
          relleno++;
          if (relleno > 40) break;
        }
        if (distractores.length < 3) continue;

        return {
          M: caso.M,
          det: caso.det,
          propiedad: caso.propiedad,
          donde: caso.donde,
          opcionesPropiedad: opciones,
          opcionesDet: shuffle(distractores.concat([caso.det])).map(function (v) {
            return { value: String(v), label: String(v) };
          })
        };
      }
      return null;
    }

    function tieneLineaDeCeros(M, n) {
      var r, c, k;
      for (r = 0; r < n; r++) { for (c = 0, k = 0; c < n; c++) if (M[r][c] === 0) k++; if (k === n) return true; }
      for (c = 0; c < n; c++) { for (r = 0, k = 0; r < n; r++) if (M[r][c] === 0) k++; if (k === n) return true; }
      return false;
    }

    function proporcionales(u, v, n) {
      // Dos vectores son proporcionales si uno es múltiplo del otro. El
      // vector nulo lo es de cualquiera, pero ese caso ya lo cubre P3.
      var razonNum = null, razonDen = null, k;
      for (k = 0; k < n; k++) {
        if (u[k] === 0 && v[k] === 0) continue;
        if (u[k] === 0 || v[k] === 0) return false;
        if (razonNum === null) { razonNum = v[k]; razonDen = u[k]; continue; }
        if (v[k] * razonDen !== u[k] * razonNum) return false;
      }
      return razonNum !== null;
    }

    function tieneLineasProporcionales(M, n) {
      var i, j, k;
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          if (proporcionales(M[i], M[j], n)) return true;
          var ci = [], cj = [];
          for (k = 0; k < n; k++) { ci.push(M[k][i]); cj.push(M[k][j]); }
          if (proporcionales(ci, cj, n)) return true;
        }
      }
      return false;
    }

    function esTriangular(M, n) {
      var superior = true, inferior = true, r, c;
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          if (r > c && M[r][c] !== 0) superior = false;
          if (r < c && M[r][c] !== 0) inferior = false;
        }
      }
      return superior || inferior;
    }

    function productoDeDiagonal(M, n) {
      var p = 1;
      for (var r = 0; r < n; r++) p *= M[r][r];
      return p;
    }

    function matrixLatex(M) {
      return '\\left|\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right|';
    }

    window.AptActivity.init({
      mount: '#apt-u1a22',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Calculá el determinante usando propiedades',
      subtitle: 'Estos determinantes salen sin desarrollar nada. Lo único que hay que hacer es mirar la matriz antes de empezar a calcular.',
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
          question: '¿Qué propiedad te lo resuelve sin desarrollar?',
          choicesStacked: true,
          choices: function (current) { return current.opcionesPropiedad; },
          check: function (current, value) { return value === current.propiedad; },
          explain: function (current, correcto) {
            return (correcto ? '¡Correcto! ' : 'No es esa. ') +
              'Se aplica ' + PROPIEDADES[current.propiedad].split(':')[0] +
              ', porque ' + current.donde + '.';
          }
        },
        {
          mode: 'choices',
          question: '¿Cuánto vale entonces el determinante?',
          choices: function (current) { return current.opcionesDet; },
          check: function (current, value) { return Number(value) === current.det; },
          explain: function (current, correcto) {
            var extra = current.propiedad === 'P8'
              ? 'En una triangular el determinante es el producto de la diagonal, sin importar lo que haya del otro lado de ella.'
              : 'Cuando se cumple esa propiedad el determinante es cero, sin necesidad de calcular nada.';
            return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
              'Vale ' + current.det + '. ' + extra;
          }
        }
      ]
    });
  })();

})();
