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
       enunciadas en el libro. Las falsas no son inventadas: cada una es
       un error que los estudiantes cometen de verdad, casi siempre por
       arrastrar a las matrices una costumbre de los números reales.

       Deliberadamente no hay nada de determinantes, que se ven en 1.2.6,
       después de esta sección. */
    var VERDADERAS = [
      { latex: 'A+B = B+A',
        por: 'La suma de matrices se hace entrada por entrada, y la suma de números reales sí es conmutativa.' },
      { latex: '(A+B)+C = A+(B+C)',
        por: 'La suma es asociativa por el mismo motivo: entrada por entrada, hereda lo que valga en los reales.' },
      { latex: '\\lambda\\,(A+B) = \\lambda A + \\lambda B',
        por: 'El producto por escalar también actúa entrada por entrada, así que distribuye sobre la suma.' },
      { latex: '(\\lambda+\\mu)\\,A = \\lambda A + \\mu A',
        por: 'Es la otra distributiva del producto por escalar, ahora respecto de la suma de escalares.' },
      { latex: '\\lambda\\,(\\mu A) = (\\lambda\\mu)\\,A',
        por: 'La asociativa mixta: multiplicar dos veces por sendos escalares es multiplicar una vez por su producto.' },
      { latex: 'A\\,(B\\,C) = (A\\,B)\\,C',
        por: 'El producto de matrices sí es asociativo, aunque no sea conmutativo. Son dos cosas distintas.' },
      { latex: 'A\\,(B+C) = A\\,B + A\\,C',
        por: 'El producto distribuye sobre la suma, siempre que se respete de qué lado se multiplica.' },
      { latex: '\\lambda\\,(A\\,B) = (\\lambda A)\\,B = A\\,(\\lambda B)',
        por: 'Un escalar se puede correr libremente dentro de un producto de matrices. Una matriz no.' },
      { latex: '(A^{t})^{t} = A',
        por: 'Trasponer dos veces devuelve cada entrada a su lugar de origen.' },
      { latex: '(A+B)^{t} = A^{t} + B^{t}',
        por: 'Trasponer no mueve ninguna suma de sitio: distribuye sin sorpresas.' },
      { latex: '(\\lambda A)^{t} = \\lambda\\,A^{t}',
        por: 'El escalar multiplica cada entrada, y trasponer sólo las reubica.' },
      { latex: '(A\\,B)^{t} = B^{t}\\,A^{t}',
        por: 'Al trasponer un producto el orden se invierte. Mirá los tamaños: si A es n×m y B es m×p, la única forma de que el producto de las traspuestas esté definido es B^t·A^t.' },
      { latex: '\\mathrm{tr}(A+B) = \\mathrm{tr}(A) + \\mathrm{tr}(B)',
        por: 'La traza es una suma de entradas de la diagonal, así que hereda la linealidad de la suma.' },
      { latex: '\\mathrm{tr}(\\lambda A) = \\lambda\\,\\mathrm{tr}(A)',
        por: 'Sacar factor común de una suma de entradas es sacarlo de la traza.' },
      { latex: '\\mathrm{tr}(A^{t}) = \\mathrm{tr}(A)',
        por: 'Trasponer intercambia las entradas de fuera de la diagonal, pero no toca ninguna de las de la diagonal.' },
      { latex: '\\mathrm{tr}(A\\,B) = \\mathrm{tr}(B\\,A)',
        por: 'Vale aunque A·B y B·A sean matrices distintas, e incluso de distinto tamaño: las dos trazas coinciden.' }
    ];

    var FALSAS = [
      { latex: 'A\\,B = B\\,A',
        por: 'El producto de matrices no es conmutativo. Puede incluso pasar que A·B esté definido y B·A no lo esté.' },
      { latex: '(A\\,B)^{t} = A^{t}\\,B^{t}',
        por: 'Al trasponer un producto el orden se invierte: lo correcto es (A·B)^t = B^t·A^t. Fijate en los tamaños y vas a ver que así ni siquiera está definido.' },
      { latex: '(A+B)^{2} = A^{2} + 2\\,A\\,B + B^{2}',
        por: 'Al desarrollar sale A² + A·B + B·A + B², y como el producto no conmuta, A·B y B·A no se pueden juntar en 2·A·B. Sólo vale si A y B son conmutables.' },
      { latex: 'A\\,B = O \\;\\Longrightarrow\\; A = O \\;\\text{o}\\; B = O',
        por: 'En las matrices no vale: hay matrices no nulas cuyo producto da la matriz nula.' },
      { latex: '\\mathrm{tr}(A\\,B) = \\mathrm{tr}(A)\\cdot\\mathrm{tr}(B)',
        por: 'La traza es lineal para la suma, no para el producto. Probá con dos identidades de orden 2: la traza del producto da 2 y el producto de las trazas da 4.' },
      { latex: '(A\\,B)^{-1} = A^{-1}B^{-1}',
        por: 'Al invertir un producto el orden también se invierte: lo correcto es (A·B)⁻¹ = B⁻¹·A⁻¹. Comprobalo multiplicando por A·B y vas a ver cuál de las dos deja la identidad.' },
      { latex: '(A+B)^{-1} = A^{-1} + B^{-1}',
        por: 'La inversa no distribuye sobre la suma. Ni siquiera hace falta ir a matrices: con números, 1/(2+3) no es 1/2 + 1/3.' },
      { latex: 'A\\,C = B\\,C \\;\\Longrightarrow\\; A = B',
        por: 'No se puede cancelar una matriz cualquiera. Sólo vale si C es invertible, y entonces se multiplica por C⁻¹ del lado correcto.' }
    ];

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
      return { latex: item.latex, verdadera: esVerdadera, por: item.por };
    }

    window.AptActivity.init({
      mount: '#apt-u1a17',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: '¿Vale esta igualdad?',
      subtitle: 'Suponé que A, B y C son matrices de los tamaños que hagan falta para que todo esté definido, y que λ y μ son números reales. Decidí si la igualdad vale siempre.',
      nextLabel: 'Probar con otra igualdad →',
      needsKatex: true,
      mode: 'choices',
      choices: [
        { value: 'si', label: 'Sí, vale siempre' },
        { value: 'no', label: 'No, no siempre vale' }
      ],
      generate: generarCaso,
      renderContent: function (container, current) {
        window.katex.render(current.latex, container, { throwOnError: false });
      },
      check: function (current, value) {
        return (value === 'si') === current.verdadera;
      },
      explain: function (current, correcto) {
        var cabeza = correcto ? '¡Correcto! ' : 'No es correcto. ';
        var veredicto = current.verdadera
          ? 'La igualdad vale siempre. '
          : 'La igualdad no vale en general. ';
        return cabeza + veredicto + current.por;
      }
    });
  })();

})();
