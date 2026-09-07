/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 18
   "Clasificá la matriz especial"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-18-matrices-especiales.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a18')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a18';
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

    function ceros(n) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(0); }
      return M;
    }
    function identidad(n) {
      var M = ceros(n);
      for (var i = 0; i < n; i++) M[i][i] = 1;
      return M;
    }
    function trasponer(A) {
      var n = A.length, M = ceros(n), r, c;
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) M[c][r] = A[r][c];
      return M;
    }
    function multiplicar(A, B) {
      var n = A.length, M = ceros(n), r, c, k;
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          var s = 0;
          for (k = 0; k < n; k++) s += A[r][k] * B[k][c];
          M[r][c] = s;
        }
      }
      return M;
    }
    function iguales(A, B) {
      for (var r = 0; r < A.length; r++)
        for (var c = 0; c < A.length; c++)
          if (A[r][c] !== B[r][c]) return false;
      return true;
    }
    function negada(A) {
      return A.map(function (fila) { return fila.map(function (v) { return -v; }); });
    }
    function esNula(A) {
      return A.every(function (fila) { return fila.every(function (v) { return v === 0; }); });
    }

    /* ---------- La clasificación ----------

       Se comprueba siempre contra la definición, nunca contra el
       arquetipo del que salió la matriz. Es a propósito: los arquetipos
       se solapan de formas que uno no anticipa —la identidad es a la vez
       simétrica, ortogonal, idempotente e involutiva, y la matriz nula es
       simétrica, antisimétrica, idempotente y nilpotente—, y si la
       respuesta correcta saliera del generador en vez de la definición,
       la actividad daría por mala una respuesta que está bien. */
    function clasificar(A) {
      var n = A.length, At = trasponer(A), A2 = multiplicar(A, A);

      // Nilpotente: alguna potencia da la matriz nula, y por la cota de
      // 4.3.1 alcanza con probar hasta la n-ésima.
      var nilpotente = false, P = A;
      for (var k = 1; k <= n; k++) {
        if (esNula(P)) { nilpotente = true; break; }
        P = multiplicar(P, A);
      }
      if (esNula(P)) nilpotente = true;

      return {
        simetrica: iguales(A, At),
        antisimetrica: iguales(A, negada(At)),
        ortogonal: iguales(multiplicar(At, A), identidad(n)),
        idempotente: iguales(A2, A),
        involutiva: iguales(A2, identidad(n)),
        nilpotente: nilpotente
      };
    }

    /* ---------- Los arquetipos ----------

       Cada uno apunta a una categoría, pero el que salga con más de una
       es bienvenido: son justamente los casos que enseñan algo. */
    function simetrica(n) {
      var M = ceros(n), r, c;
      for (r = 0; r < n; r++)
        for (c = r; c < n; c++) { M[r][c] = randInt(-4, 4); M[c][r] = M[r][c]; }
      return M;
    }

    function antisimetrica(n) {
      var M = ceros(n), r, c;
      for (r = 0; r < n; r++)
        for (c = r + 1; c < n; c++) { M[r][c] = randNonZero(-4, 4); M[c][r] = -M[r][c]; }
      return M;
    }

    /* Las únicas matrices ortogonales con entradas enteras son las de
       permutación con signos: una sola entrada ±1 por fila y por columna. */
    function ortogonal(n) {
      var orden = [], i;
      for (i = 0; i < n; i++) orden.push(i);
      for (i = orden.length - 1; i > 0; i--) {
        var j = randInt(0, i), t = orden[i]; orden[i] = orden[j]; orden[j] = t;
      }
      var M = ceros(n);
      for (i = 0; i < n; i++) M[i][orden[i]] = randChoice([1, -1]);
      return M;
    }

    /* Idempotente de 2×2 distinta de O y de I: traza 1 y determinante 0. */
    function idempotente(n) {
      if (n === 2) {
        var a = randInt(-3, 4), b = randNonZero(-4, 4);
        // det = a(1−a) − b·c = 0  ⇒  c = a(1−a)/b, y sólo sirve si es entero.
        var producto = a * (1 - a);
        if (producto % b !== 0) return null;
        return [[a, b], [producto / b, 1 - a]];
      }
      // En 3×3, una proyección sobre los ejes que se eligen.
      var M = ceros(3), unos = 0;
      for (var i = 0; i < 3; i++) { M[i][i] = randChoice([0, 1]); if (M[i][i]) unos++; }
      if (unos === 0 || unos === 3) return null;
      return M;
    }

    /* Involutiva de 2×2 distinta de ±I: traza 0 y determinante −1. */
    function involutiva(n) {
      if (n === 2) {
        var a = randInt(-3, 3), b = randNonZero(-4, 4);
        // A = [[a,b],[c,−a]] cumple A² = (a²+bc)·I, así que hace falta a²+bc = 1.
        var falta = 1 - a * a;
        if (falta % b !== 0) return null;
        return [[a, b], [falta / b, -a]];
      }
      var M = identidad(3);
      for (var i = 0; i < 3; i++) if (Math.random() < 0.5) M[i][i] = -1;
      return M;
    }

    function nilpotente(n) {
      var M = ceros(n), r, c, algo = false;
      for (r = 0; r < n; r++)
        for (c = r + 1; c < n; c++) {
          M[r][c] = randInt(-3, 3);
          if (M[r][c]) algo = true;
        }
      return algo ? M : null;
    }

    function generica(n) {
      var M = ceros(n), r, c;
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) M[r][c] = randInt(-4, 4);
      return M;
    }

    var ARQUETIPOS = [
      { nombre: 'simetrica', hacer: simetrica },
      { nombre: 'antisimetrica', hacer: antisimetrica },
      { nombre: 'ortogonal', hacer: ortogonal },
      { nombre: 'idempotente', hacer: idempotente },
      { nombre: 'involutiva', hacer: involutiva },
      { nombre: 'nilpotente', hacer: nilpotente },
      { nombre: 'identidad', hacer: identidad },
      { nombre: 'nula', hacer: ceros },
      { nombre: 'generica', hacer: generica }
    ];

    // Contadores de exposición: persisten mientras dure la sesión, para
    // que los arquetipos se repartan parejo en vez de por puro azar.
    var vistos = {};
    ARQUETIPOS.forEach(function (a) { vistos[a.nombre] = 0; });

    function menosVisto() {
      var minimo = Math.min.apply(null, ARQUETIPOS.map(function (a) { return vistos[a.nombre]; }));
      var candidatos = ARQUETIPOS.filter(function (a) { return vistos[a.nombre] === minimo; });
      return randChoice(candidatos);
    }

    var ETIQUETAS = {
      simetrica: 'Simétrica',
      antisimetrica: 'Antisimétrica',
      ortogonal: 'Ortogonal',
      idempotente: 'Idempotente',
      involutiva: 'Involutiva',
      nilpotente: 'Nilpotente'
    };
    var CLAVES = ['simetrica', 'antisimetrica', 'ortogonal', 'idempotente', 'involutiva', 'nilpotente'];

    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 300) {
        var n = Math.random() < 0.5 ? 2 : 3;
        var arquetipo = menosVisto();
        var A = arquetipo.hacer(n);
        if (!A) continue;

        var clases = clasificar(A);

        // Una matriz que no es de ninguna categoría sólo tiene sentido de
        // vez en cuando: si salieran muchas, la actividad se volvería
        // "marcar nada" la mitad de las veces.
        var cuantas = CLAVES.filter(function (k) { return clases[k]; }).length;
        if (cuantas === 0 && arquetipo.nombre !== 'generica') continue;
        if (cuantas === 0 && Math.random() < 0.5) continue;

        vistos[arquetipo.nombre]++;
        return {
          n: n,
          A: A,
          clases: clases,
          opciones: CLAVES.map(function (k) {
            return { value: k, label: ETIQUETAS[k], correct: clases[k] };
          })
        };
      }
      var I = identidad(2);
      return {
        n: 2, A: I, clases: clasificar(I),
        opciones: CLAVES.map(function (k) {
          return { value: k, label: ETIQUETAS[k], correct: clasificar(I)[k] };
        })
      };
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    function explicar(current, correcto) {
      var clases = current.clases;
      var suyas = CLAVES.filter(function (k) { return clases[k]; }).map(function (k) { return ETIQUETAS[k]; });

      var msg = suyas.length === 0
        ? 'Esta matriz no entra en ninguna de las seis categorías.'
        : 'Es ' + suyas.join(', ') + '.';

      // Los solapamientos son lo que más cuesta ver, así que se nombran.
      if (esNula(current.A)) {
        msg += ' La matriz nula cumple varias a la vez: es igual a su traspuesta y a la opuesta de su traspuesta, su cuadrado es ella misma, y su primera potencia ya es nula.';
      } else if (clases.ortogonal && clases.involutiva && clases.simetrica) {
        msg += ' Es un caso donde se juntan tres: al ser simétrica, A^t = A, así que la condición de ortogonal A^t·A = I pasa a ser A² = I, que es la de involutiva.';
      } else if (clases.involutiva && clases.ortogonal) {
        msg += ' Toda involutiva que además sea simétrica resulta ortogonal, por el mismo motivo.';
      } else if (clases.antisimetrica && clases.nilpotente) {
        msg += ' Ojo con esta: es antisimétrica y además nilpotente, que son cosas independientes entre sí.';
      } else if (clases.idempotente && clases.simetrica) {
        msg += ' Las idempotentes simétricas son las matrices de proyección, que vas a volver a encontrar en la Unidad 2.';
      }

      return (correcto ? '' : 'No es correcto. ') + msg;
    }

    window.AptActivity.init({
      mount: '#apt-u1a18',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Clasificá la matriz especial',
      subtitle: 'Marcá todas las categorías que le correspondan. Puede ser ninguna, una, o varias a la vez.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'multiselect',
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(matrixLatex(current.A), container, { throwOnError: false });
      },
      options: function (current) { return current.opciones; },
      explain: explicar
    });
  })();

})();
