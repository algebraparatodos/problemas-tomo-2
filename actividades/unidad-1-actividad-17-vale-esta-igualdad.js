/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 17
   "¿Vale esta igualdad?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-17-vale-esta-igualdad.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a17')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a17';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    /* ---------- El catálogo ----------

       Las verdaderas son las propiedades de 1.2.4 tal como están
       enunciadas en el libro (suma, producto por escalar, producto,
       traspuesta, traza e inversa). Las falsas no son inventadas: cada
       una es un error que los estudiantes cometen de verdad, casi
       siempre por arrastrar a las matrices una costumbre de los números
       reales.

       Notación del libro: el producto se escribe AB (sin punto), la
       traspuesta A^{t} y la inversa A^{-1}. No hay potencias de
       matrices: A² se define recién en 1.2.5 (con las idempotentes),
       así que el cuadrado de una suma se escribe (A+B)(A+B). Tampoco
       hay nada de determinantes, que se ven en 1.2.6.

       «cond» es la hipótesis que se muestra debajo de la igualdad
       cuando hace falta además de la general del enunciado, como en el
       libro: la traza pide cuadradas del mismo orden; la inversa,
       invertibles (y λ no nulo).

       En «por», lo que va entre $...$ se renderiza con KaTeX. */
    var COND_TRAZA = 'A,\\ B \\text{ cuadradas del mismo orden}';
    var COND_INV_A = 'A \\text{ invertible}';
    var COND_INV_AB = 'A,\\ B \\text{ invertibles del mismo orden}';
    var COND_INV_ESC = 'A \\text{ invertible},\\ \\lambda \\neq 0';
    var COND_INV_SUMA = 'A,\\ B \\text{ y } A+B \\text{ invertibles}';

    var VERDADERAS = [
      { latex: 'A+B = B+A',
        por: 'La suma de matrices se hace entrada por entrada, y la suma de números reales es conmutativa.' },
      { latex: '(A+B)+C = A+(B+C)',
        por: 'La suma es asociativa por el mismo motivo: entrada por entrada, hereda lo que vale en los reales.' },
      { latex: 'A + (-A) = O',
        por: 'Cada entrada de $A$ se cancela con la de $-A$ que está en el mismo lugar: $-A$ es el opuesto de $A$.' },
      { latex: '\\lambda\\,(A+B) = \\lambda A + \\lambda B',
        por: 'El producto por escalar actúa entrada por entrada, así que distribuye sobre la suma de matrices.' },
      { latex: '(\\lambda+\\mu)\\,A = \\lambda A + \\mu A',
        por: 'Es la otra distributiva del producto por escalar, ahora respecto de la suma de escalares.' },
      { latex: '\\lambda\\,(\\mu A) = (\\lambda\\mu)\\,A',
        por: 'La asociativa mixta: multiplicar dos veces por sendos escalares es multiplicar una vez por su producto.' },
      { latex: 'A(BC) = (AB)C',
        por: 'El producto de matrices es asociativo, aunque no sea conmutativo. Son dos cosas distintas.' },
      { latex: 'A(B+C) = AB + AC',
        por: 'El producto distribuye sobre la suma, respetando de qué lado se multiplica: $A$ queda a la izquierda en los dos términos.' },
      { latex: '(A+B)\\,C = AC + BC',
        por: 'Es la distributiva por la derecha: $C$ queda a la derecha en los dos términos.' },
      { latex: '\\lambda\\,(AB) = (\\lambda A)\\,B = A\\,(\\lambda B)',
        por: 'Un escalar se puede correr libremente dentro de un producto de matrices. Una matriz no.' },
      { latex: '(A^{t})^{t} = A',
        por: 'Trasponer dos veces devuelve cada entrada a su lugar de origen.' },
      { latex: '(A+B)^{t} = A^{t} + B^{t}',
        por: 'Trasponer sólo cambia de lugar las entradas, y lo hace igual en $A$, en $B$ y en $A+B$: distribuye con la suma.' },
      { latex: '(\\lambda A)^{t} = \\lambda\\,A^{t}',
        por: 'El escalar multiplica cada entrada, y trasponer sólo las reubica.' },
      { latex: '(AB)^{t} = B^{t}A^{t}',
        por: 'Al trasponer un producto el orden se invierte. Mirá los tamaños: si $A$ es de $m \\times n$ y $B$ de $n \\times p$, $(AB)^{t}$ es de $p \\times m$, y el producto de traspuestas que da ese tamaño es $B^{t}A^{t}$ (de $p \\times n$ por $n \\times m$).' },
      { latex: '\\operatorname{Tr}(A+B) = \\operatorname{Tr}(A) + \\operatorname{Tr}(B)',
        cond: COND_TRAZA,
        por: 'La traza es una suma de entradas de la diagonal, y la diagonal de $A+B$ es la suma de las diagonales: hereda la linealidad de la suma.' },
      { latex: '\\operatorname{Tr}(\\lambda A) = \\lambda\\,\\operatorname{Tr}(A)',
        cond: COND_TRAZA,
        por: 'Cada entrada de la diagonal queda multiplicada por $\\lambda$, y sacar factor común de esa suma es sacarlo de la traza.' },
      { latex: '\\operatorname{Tr}(A^{t}) = \\operatorname{Tr}(A)',
        cond: COND_TRAZA,
        por: 'Trasponer intercambia las entradas de fuera de la diagonal, pero no mueve ninguna de las de la diagonal principal.' },
      { latex: '\\operatorname{Tr}(AB) = \\operatorname{Tr}(BA)',
        cond: COND_TRAZA,
        por: 'Como $A$ y $B$ son del mismo orden, $AB$ y $BA$ existen siempre, aunque en general son distintas y también lo son sus diagonales. Lo que coincide es la suma de cada diagonal, es decir, la traza.' },
      { latex: '(A^{-1})^{-1} = A',
        cond: COND_INV_A,
        por: 'Que $A^{-1}$ sea la inversa de $A$ dice $AA^{-1} = A^{-1}A = I$. Leída al revés, esa igualdad dice que $A$ es la inversa de $A^{-1}$, y la inversa es única.' },
      { latex: '(AB)^{-1} = B^{-1}A^{-1}',
        cond: COND_INV_AB,
        por: 'Al invertir un producto el orden se invierte, igual que al trasponer: $(AB)(B^{-1}A^{-1}) = A\\,I\\,A^{-1} = I$, y lo mismo del otro lado.' },
      { latex: '(A^{t})^{-1} = (A^{-1})^{t}',
        cond: COND_INV_A,
        por: 'Usando $(AB)^{t} = B^{t}A^{t}$: $A^{t}(A^{-1})^{t} = (A^{-1}A)^{t} = I^{t} = I$, y lo mismo del otro lado. Trasponer e invertir se pueden hacer en cualquier orden.' },
      { latex: '(\\lambda A)^{-1} = \\tfrac{1}{\\lambda}\\,A^{-1}',
        cond: COND_INV_ESC,
        por: 'Como $\\lambda \\neq 0$, existe $\\tfrac{1}{\\lambda}$, y $(\\lambda A)(\\tfrac{1}{\\lambda}A^{-1}) = \\lambda\\cdot\\tfrac{1}{\\lambda}\\,AA^{-1} = I$, y lo mismo del otro lado.' }
    ];

    var FALSAS = [
      { latex: 'AB = BA',
        por: 'El producto de matrices, en general, no es conmutativo. Hasta puede pasar que $AB$ esté definido y $BA$ no. Cuando sí vale $AB = BA$, se dice que $A$ y $B$ son conmutables.' },
      { latex: '(AB)^{t} = A^{t}B^{t}',
        por: 'Al trasponer un producto el orden se invierte: lo correcto es $(AB)^{t} = B^{t}A^{t}$. Si $A$ es de $m \\times n$ y $B$ de $n \\times p$, $A^{t}B^{t}$ en general ni siquiera está definido, y aun cuando lo está (por ejemplo, con cuadradas del mismo orden) no tiene por qué coincidir.' },
      { latex: '(A+B)(A+B) = AA + 2\\,AB + BB',
        cond: COND_TRAZA,
        por: 'Al desarrollar sale $AA + AB + BA + BB$, y como el producto no conmuta, $AB$ y $BA$ no se pueden juntar en $2\\,AB$. Sólo vale si $A$ y $B$ son conmutables.' },
      { latex: 'AB = O \\;\\Longrightarrow\\; A = O \\;\\text{o}\\; B = O',
        por: 'En las matrices no vale: se pueden multiplicar dos matrices no nulas y obtener la matriz nula. Por ejemplo, $\\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix}\\begin{pmatrix} 1 & 1 \\\\ -1 & -1 \\end{pmatrix} = O$.' },
      { latex: 'AB = AC \\;\\Longrightarrow\\; B = C',
        cond: 'A \\neq O',
        por: 'No se puede «cancelar» $A$ de los dos lados como con los números reales. Con $A = \\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix}$, $B = I$ y $C = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$, da $AB = AC$ aunque $B \\neq C$.' },
      { latex: '\\lambda\\,(AB) = (\\lambda A)(\\lambda B)',
        por: 'A la derecha el escalar aparece dos veces: $(\\lambda A)(\\lambda B) = (\\lambda\\lambda)\\,AB$. El escalar se puede correr dentro del producto, pero va una sola vez.' },
      { latex: '\\operatorname{Tr}(AB) = \\operatorname{Tr}(A)\\cdot\\operatorname{Tr}(B)',
        cond: COND_TRAZA,
        por: 'La traza se lleva bien con la suma, no con el producto. Probá con $A = B = I$ de orden 2: $\\operatorname{Tr}(II) = 2$, pero $\\operatorname{Tr}(I)\\cdot\\operatorname{Tr}(I) = 4$.' },
      { latex: '(AB)^{-1} = A^{-1}B^{-1}',
        cond: COND_INV_AB,
        por: 'Al invertir un producto el orden se invierte: lo correcto es $(AB)^{-1} = B^{-1}A^{-1}$. Multiplicá $AB$ por cada una y vas a ver que sólo $B^{-1}A^{-1}$ deja siempre la identidad.' },
      { latex: '(A+B)^{-1} = A^{-1} + B^{-1}',
        cond: COND_INV_SUMA,
        por: 'La inversa no distribuye sobre la suma. Ni siquiera hace falta ir a matrices: con números, $\\tfrac{1}{2+3}$ no es $\\tfrac{1}{2} + \\tfrac{1}{3}$.' },
      { latex: '(\\lambda A)^{-1} = \\lambda\\,A^{-1}',
        cond: COND_INV_ESC,
        por: 'El escalar también se invierte: lo correcto es $(\\lambda A)^{-1} = \\tfrac{1}{\\lambda}\\,A^{-1}$. Con $A = I$ y $\\lambda = 2$: $(2I)^{-1} = \\tfrac{1}{2}\\,I$, no $2I$.' },
      { latex: '(A^{t})^{-1} = A^{-1}',
        cond: COND_INV_A,
        por: 'Falta trasponer: lo correcto es $(A^{t})^{-1} = (A^{-1})^{t}$, y $(A^{-1})^{t}$ coincide con $A^{-1}$ sólo cuando $A^{-1}$ es igual a su traspuesta, cosa que no pasa siempre.' }
    ];

    /* Lo que va entre $...$ en un texto se renderiza con KaTeX. */
    function conMate(texto) {
      return texto.split(/(\$[^$]+\$)/g).map(function (parte) {
        if (parte.length > 1 && parte.charAt(0) === '$' && parte.charAt(parte.length - 1) === '$') {
          return window.katex.renderToString(parte.slice(1, -1), { throwOnError: false });
        }
        return parte;
      }).join('');
    }

    // Contadores de exposición: persisten mientras dure la sesión, para
    // que las igualdades se vayan repartiendo en vez de repetirse por
    // puro azar.
    var vistas = {};

    function menosVista(lista, prefijo) {
      var minimo = Infinity, candidatas = [];
      lista.forEach(function (item, i) {
        var veces = vistas[prefijo + i] || 0;
        if (veces < minimo) { minimo = veces; candidatas = [i]; }
        else if (veces === minimo) candidatas.push(i);
      });
      var elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
      vistas[prefijo + elegida] = (vistas[prefijo + elegida] || 0) + 1;
      return lista[elegida];
    }

    function generarCaso() {
      // Mitad y mitad, para que no se pueda acertar por costumbre.
      var esVerdadera = Math.random() < 0.5;
      var item = esVerdadera
        ? menosVista(VERDADERAS, 'v')
        : menosVista(FALSAS, 'f');
      return { latex: item.latex, cond: item.cond || '', verdadera: esVerdadera, por: item.por };
    }

    window.AptActivity.init({
      mount: '#apt-u1a17',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: '¿Vale esta igualdad?',
      subtitle: 'Suponé que A, B y C son matrices de los tamaños que hagan falta para que todo esté definido, y que λ y μ son números reales. Si hace falta algo más (cuadradas, invertibles), va debajo de la igualdad. Decidí si la igualdad vale siempre.',
      nextLabel: 'Probar con otra igualdad →',
      needsKatex: true,
      mode: 'choices',
      choices: [
        { value: 'si', label: 'Sí, vale siempre' },
        { value: 'no', label: 'No, no siempre vale' }
      ],
      generate: generarCaso,
      renderContent: function (container, current) {
        // La hipótesis extra, si la hay, va debajo y más chica.
        var tex = current.cond
          ? '\\begin{gathered} ' + current.latex + ' \\\\[6pt] \\small\\text{con } ' + current.cond + ' \\end{gathered}'
          : current.latex;
        window.katex.render(tex, container, { throwOnError: false });
      },
      check: function (current, value) {
        return (value === 'si') === current.verdadera;
      },
      explain: function (current, correcto) {
        // El título «¡Correcto!» / «No es correcto» ya lo pone el motor.
        var veredicto = current.verdadera
          ? 'La igualdad vale siempre. '
          : 'La igualdad no vale en general. ';
        return veredicto + conMate(current.por);
      }
    });
  })();

})();
