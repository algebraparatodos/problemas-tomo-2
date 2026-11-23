/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 19
   "¿Qué operación hace esta elemental?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-19-matrices-elementales.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a19')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a19';
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

    function identidad(n) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(r === c ? 1 : 0); }
      return M;
    }

    /* ---------- Los tres tipos, con la notación del libro ----------

       E(i,j)     intercambia las filas i y j de la identidad
       E(i;a)     multiplica la fila i de la identidad por a ≠ 0
       E(i,j;a)   le suma a la fila i la fila j multiplicada por a

       Los índices se muestran en base 1, como en el libro, aunque las
       matrices se manejen desde cero acá adentro. */

    function intercambio(n, i, j) {
      var M = identidad(n), t = M[i]; M[i] = M[j]; M[j] = t;
      return M;
    }

    function escalar(n, i, a) {
      var M = identidad(n); M[i][i] = a;
      return M;
    }

    function combinacion(n, i, j, a) {
      var M = identidad(n); M[i][j] = a;
      return M;
    }

    /* ---------- Matrices de permutación (1.2.5.8) ----------

       Notación de una línea, como en el libro: σ = (σ(1), ..., σ(n))
       dice qué fila de la identidad terminó en el lugar i (permutación
       de filas, matriz P); τ, lo mismo con las columnas (matriz Q).
       Así, la fila i de P tiene su 1 en la columna σ(i), y la columna i
       de Q tiene su 1 en la fila τ(i). La misma matriz leída como P y
       como Q da permutaciones inversas (el ejemplo del libro: P y Q
       iguales, con σ = (2,3,1) y τ = (3,1,2)), y esa es la confusión
       que usamos como distractor principal.

       Se eligen permutaciones que NO son su propia inversa (ciclos de
       3 o de 4): así σ y τ nunca coinciden, y tampoco sale un simple
       intercambio E(i,j), que ya tiene su propio caso. */

    function inversa(p) {
      var q = []; p.forEach(function (v, k) { q[v] = k; });
      return q;
    }
    function mismaPerm(p, q) { return p.join() === q.join(); }
    function permAleatoria(n) {
      var base = [], k, p;
      for (k = 0; k < n; k++) base.push(k);
      do { p = shuffle(base); } while (mismaPerm(p, inversa(p)));
      return p;
    }

    /* P con σ = p (base 0): la fila k de P es la fila p[k] de la identidad. */
    function matrizDeFilas(p) {
      var I = identidad(p.length);
      return p.map(function (v) { return I[v].slice(); });
    }

    function unaLinea(p) {
      return '(' + p.map(function (v) { return v + 1; }).join(',') + ')';
    }

    function tex(t) { return window.katex.renderToString(t, { throwOnError: false }); }

    function generarPermutacion(n) {
      var sub = randChoice(['sigma', 'tau', 'izquierda', 'derecha']);
      // La matriz se arma desde una permutación de filas p; leída como
      // Q, su τ es la inversa de p.
      var sigma = permAleatoria(n), tau = inversa(sigma);
      var M = matrizDeFilas(sigma);
      var porFilas = (sub === 'sigma' || sub === 'izquierda');
      var buena = porFilas ? sigma : tau, confusion = porFilas ? tau : sigma;

      // Dos distractores más, distintos entre sí y de los dos anteriores.
      var usadas = [buena, confusion];
      while (usadas.length < 4) {
        var r = shuffle(buena);
        if (!usadas.some(function (u) { return mismaPerm(u, r); })) usadas.push(r);
      }

      function rotulo(q) {
        if (sub === 'sigma') return { v: 'sigma=' + unaLinea(q), l: tex('\\sigma = ' + unaLinea(q)) };
        if (sub === 'tau') return { v: 'tau=' + unaLinea(q), l: tex('\\tau = ' + unaLinea(q)) };
        var letra = sub === 'izquierda' ? 'F' : 'C';
        var lista = q.map(function (v) { return letra + '_{' + (v + 1) + '}'; }).join(',\\ ');
        return { v: letra + unaLinea(q), l: tex('(' + lista + ')') };
      }

      return {
        n: n, M: M, tipo: 'permutacion', sub: sub,
        sigma: sigma, tau: tau,
        correcta: rotulo(buena).v,
        opciones: shuffle(usadas).map(function (q) {
          var r = rotulo(q);
          return { value: r.v, label: r.l };
        })
      };
    }

    function generarCaso() {
      var n = randChoice([3, 3, 4]);
      // Reparto: 60 % elementales (20 % de cada tipo), 40 % permutaciones
      // (10 % de cada pregunta: σ, τ, P·A y A·Q).
      if (Math.random() < 0.4) return generarPermutacion(n);
      var tipo = randChoice(['intercambio', 'escalar', 'combinacion']);

      var i = randInt(0, n - 1), j;
      do { j = randInt(0, n - 1); } while (j === i);

      var M, correcta, distractores;

      if (tipo === 'intercambio') {
        M = intercambio(n, i, j);
        correcta = 'E(' + (i + 1) + ',' + (j + 1) + ')';
        // El error típico: confundirla con la que multiplica por 1, o
        // leer mal cuáles son las filas cambiadas.
        var otro;
        do { otro = randInt(0, n - 1); } while (otro === i || otro === j);
        distractores = [
          'E(' + (i + 1) + ',' + (otro + 1) + ')',
          'E(' + (i + 1) + ';' + (j + 1) + ')',
          'E(' + (i + 1) + ',' + (j + 1) + ';1)'
        ];
      } else if (tipo === 'escalar') {
        var a = randChoice([-3, -2, -1, 2, 3, 4, 5]);
        M = escalar(n, i, a);
        correcta = 'E(' + (i + 1) + ';' + a + ')';
        distractores = [
          'E(' + (i + 1) + ';' + (-a) + ')',
          'E(' + (j + 1) + ';' + a + ')',
          'E(' + (i + 1) + ',' + (j + 1) + ';' + a + ')'
        ];
      } else {
        var b = randChoice([-4, -3, -2, 2, 3, 4]);
        M = combinacion(n, i, j, b);
        correcta = 'E(' + (i + 1) + ',' + (j + 1) + ';' + b + ')';
        // El error más común de todos: invertir el papel de las dos
        // filas. En E(i,j;a) la que cambia es la i y la que se suma es
        // la j, y en la matriz el número aparece en la posición (i,j).
        distractores = [
          'E(' + (j + 1) + ',' + (i + 1) + ';' + b + ')',
          'E(' + (i + 1) + ',' + (j + 1) + ';' + (-b) + ')',
          'E(' + (i + 1) + ';' + b + ')'
        ];
      }

      var opciones = shuffle([correcta].concat(distractores)).map(function (t) {
        return { value: t, label: t };
      });

      return {
        n: n, M: M, tipo: tipo, i: i, j: j,
        correcta: correcta,
        opciones: opciones
      };
    }

    function matrixLatex(M) {
      return '\\left(\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right)';
    }

    var PREGUNTAS = {
      sigma: 'Leída como matriz de permutación de filas $P$, ¿qué $\\sigma$ le corresponde?',
      tau: 'Leída como matriz de permutación de columnas $Q$, ¿qué $\\tau$ le corresponde?',
      izquierda: 'Es una matriz de permutación de filas $P$. Al calcular $P \\cdot A$, ¿qué filas de $A$ quedan, de arriba hacia abajo?',
      derecha: 'Es una matriz de permutación de columnas $Q$. Al calcular $A \\cdot Q$, ¿qué columnas de $A$ quedan, de izquierda a derecha?'
    };

    function pregunta(current) {
      var t = current.tipo === 'permutacion' ? PREGUNTAS[current.sub] :
        'Se obtuvo aplicándole a la identidad una única operación elemental por filas. ¿Qué matriz elemental es?';
      return t.split(/(\$[^$]+\$)/g).map(function (parte) {
        return parte.charAt(0) === '$' ? tex(parte.slice(1, -1)) : parte;
      }).join('');
    }

    function enLista(arr) { return arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1]; }

    function explicarPermutacion(current) {
      var sigma = current.sigma, tau = current.tau, texto;
      var s = tex('\\sigma = ' + unaLinea(sigma)), t = tex('\\tau = ' + unaLinea(tau));

      if (current.sub === 'sigma' || current.sub === 'izquierda') {
        texto = 'Mirá fila por fila dónde está el 1: ' + enLista(sigma.map(function (v, k) {
          return 'la fila ' + (k + 1) + ' lo tiene en la columna ' + (v + 1);
        })) + '. Eso dice qué fila de la identidad terminó en cada lugar, así que como permutación de filas es ' + s + '.';
        if (current.sub === 'izquierda') {
          texto += ' Al multiplicar por izquierda, ' + tex('P \\cdot A') + ' reordena igual las filas de ' + tex('A') +
            ': en el lugar ' + tex('i') + ' queda la fila ' + tex('\\sigma(i)') + ' de ' + tex('A') +
            '. De arriba hacia abajo: ' +
            tex('(' + sigma.map(function (v) { return 'F_{' + (v + 1) + '}'; }).join(',\\ ') + ')') + '.';
        } else {
          texto += ' Ojo con leerla por columnas: eso da ' + t + ', que es la lectura como permutación de columnas.';
        }
        return texto;
      }
      texto = 'Mirá columna por columna dónde está el 1: ' + enLista(tau.map(function (v, k) {
        return 'la columna ' + (k + 1) + ' lo tiene en la fila ' + (v + 1);
      })) + '. Eso dice qué columna de la identidad terminó en cada lugar, así que como permutación de columnas es ' + t + '.';
      if (current.sub === 'derecha') {
        texto += ' Al multiplicar por derecha, ' + tex('A \\cdot Q') + ' reordena igual las columnas de ' + tex('A') +
          ': en el lugar ' + tex('i') + ' queda la columna ' + tex('\\tau(i)') + ' de ' + tex('A') +
          '. De izquierda a derecha: ' +
          tex('(' + tau.map(function (v) { return 'C_{' + (v + 1) + '}'; }).join(',\\ ') + ')') + '.';
      } else {
        texto += ' Ojo con leerla por filas: eso da ' + s + ', que es la lectura como permutación de filas.';
      }
      return texto;
    }

    function explicar(current, correcto) {
      if (current.tipo === 'permutacion') return explicarPermutacion(current);
      var i = current.i + 1, j = current.j + 1;
      var texto;

      if (current.tipo === 'intercambio') {
        texto = 'Es E(' + i + ',' + j + '). Se ve porque las filas ' + i + ' y ' + j +
          ' de la identidad están cambiadas de lugar: el 1 de la fila ' + i +
          ' quedó en la columna ' + j + ', y al revés.';
      } else if (current.tipo === 'escalar') {
        var a = current.M[current.i][current.i];
        texto = 'Es E(' + i + ';' + a + '). La identidad está intacta salvo en la posición (' +
          i + ',' + i + '), donde en vez de un 1 hay un ' + a +
          '. Multiplicar por esta matriz multiplica la fila ' + i + ' por ' + a + '.';
      } else {
        var b = current.M[current.i][current.j];
        texto = 'Es E(' + i + ',' + j + ';' + b + '). El ' + b + ' está en la posición (' +
          i + ',' + j + '), y ese es el orden de los índices: la fila que cambia es la ' + i +
          ' y la que se le suma es la ' + j + '. Si fuera al revés, el ' + b +
          ' estaría en la posición (' + j + ',' + i + ').';
      }

      return texto;
    }

    window.AptActivity.init({
      mount: '#apt-u1a19',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: '¿Qué operación hace esta elemental?',
      subtitle: 'Cada matriz sale de la identidad, con una operación elemental o reordenando sus filas o columnas. Identificá qué hace, con la notación del libro.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choicesStacked: true,
      choices: function (current) { return current.opciones; },
      generate: generarCaso,
      renderContent: function (container, current) {
        container.innerHTML = '<p class="apt-act__question">' + pregunta(current) + '</p>' +
          '<div>' + tex(matrixLatex(current.M)) + '</div>';
      },
      check: function (current, value) { return value === current.correcta; },
      explain: explicar
    });
  })();

})();
