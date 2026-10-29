/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 13
   "¿Qué es posible?"
   ------------------------------------------------------------
   Sección 4.7. Sin ninguna matriz y sin ninguna cuenta: solo con las
   dimensiones de V y W, decidir qué clasificaciones son POSIBLES.

     monomorfismo posible  ⟺  dim(V) ≤ dim(W)
     epimorfismo posible   ⟺  dim(V) ≥ dim(W)
     isomorfismo posible   ⟺  dim(V) = dim(W)

   Es el punto que remarcás en 4.7: hay casos en que la clasificación
   queda descartada de antemano, antes de mirar la transformación.

   Va con tildes múltiples (no una sola opción) para que el alumno
   tenga que pensar los tres criterios en la misma ronda, no uno.

   PARA QUE NO SEA PURO PATRÓN: los espacios no dicen su dimensión de
   entrada. Aparecen P₃(R), M₂ₓ₃(R) y otros, así que primero hay que
   saber cuánto mide cada uno y recién después aplicar la regla. Si
   solo se usaran R² y R³, alcanzaría con memorizar tres patrones.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #13.
   ============================================================ */
(function () {
  'use strict';

  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* Espacios variados a propósito, con dimensiones que hay que saber
     y no se leen del nombre de forma obvia. */
  var ESPACIOS = [
    { label: '\\mathbb{R}^2',                 plano: 'R²',      dim: 2 },
    { label: '\\mathbb{R}^3',                 plano: 'R³',      dim: 3 },
    { label: '\\mathbb{R}^4',                 plano: 'R⁴',      dim: 4 },
    { label: 'P_1(\\mathbb{R})',              plano: 'P₁(R)',   dim: 2 },
    { label: 'P_2(\\mathbb{R})',              plano: 'P₂(R)',   dim: 3 },
    { label: 'P_3(\\mathbb{R})',              plano: 'P₃(R)',   dim: 4 },
    { label: 'M_{2\\times2}(\\mathbb{R})',    plano: 'M₂ₓ₂(R)', dim: 4 },
    { label: 'M_{2\\times3}(\\mathbb{R})',    plano: 'M₂ₓ₃(R)', dim: 6 },
    { label: 'M_{3\\times2}(\\mathbb{R})',    plano: 'M₃ₓ₂(R)', dim: 6 }
  ];

  /* Los tres casos de la relación entre dimensiones, sorteados parejo.
     Si se dejara al azar, "distintas" saldría casi siempre y el caso
     de la igualdad —el único donde el isomorfismo es posible— casi
     nunca aparecería. */
  var RELACIONES = ['menor', 'mayor', 'igual'];

  function generate() {
    var rel = randChoice(RELACIONES);
    var V, W, intentos = 0;
    do {
      intentos++;
      V = randChoice(ESPACIOS);
      W = randChoice(ESPACIOS);
      if (rel === 'menor' && V.dim < W.dim) break;
      if (rel === 'mayor' && V.dim > W.dim) break;
      // en el caso "igual" se busca que sean espacios DISTINTOS con la
      // misma dimensión cuando se pueda, que es el caso más interesante
      if (rel === 'igual' && V.dim === W.dim) break;
    } while (intentos < 400);

    return {
      V: V, W: W,
      mono: V.dim <= W.dim,
      epi: V.dim >= W.dim,
      iso: V.dim === W.dim
    };
  }

  /* ---------- render ---------- */
  var PISO = 0.68;
  function ajustarAncho(rowEl) {
    var k = rowEl.querySelector('.katex');
    if (!k) return;
    rowEl.style.fontSize = '';
    var disp = rowEl.clientWidth;
    if (!disp) return;
    var meta = disp - 2;
    var ancho = k.getBoundingClientRect().width;
    if (!ancho || ancho <= meta) return;
    var escala = Math.max(PISO, meta / ancho);
    rowEl.style.fontSize = (escala * 100).toFixed(1) + '%';
    var ancho2 = k.getBoundingClientRect().width;
    if (ancho2 > meta && escala > PISO) {
      rowEl.style.fontSize = (Math.max(PISO, escala * (meta / ancho2)) * 100).toFixed(1) + '%';
    }
  }

  function renderContent(container, cur) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">' +
        '<div class="apt-r1" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r2" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r1 = container.querySelector('.apt-r1');
    var r2 = container.querySelector('.apt-r2');
    window.katex.render('T: ' + cur.V.label + ' \\to ' + cur.W.label, r1, { throwOnError: false });
    window.katex.render('\\text{¿Qué clasificaciones son posibles?}', r2, { throwOnError: false });
    [r1, r2].forEach(ajustarAncho);
  }

  /* ---------- feedback: siempre con las dimensiones del caso ---------- */
  function porQue(cur) {
    var d = 'dim(' + cur.V.plano + ') = ' + cur.V.dim + ' y dim(' + cur.W.plano + ') = ' + cur.W.dim + '. ';
    if (cur.V.dim < cur.W.dim) {
      return d + 'Solo el monomorfismo es posible: como el espacio de partida es más chico, ' +
        'la imagen nunca puede llenar todo W, así que no puede ser sobreyectiva ni isomorfismo. ' +
        'Pero sí puede tener núcleo trivial.';
    }
    if (cur.V.dim > cur.W.dim) {
      return d + 'Solo el epimorfismo es posible: por el teorema de la dimensión, si dim(V) > dim(W) ' +
        'el núcleo tiene dimensión al menos ' + (cur.V.dim - cur.W.dim) + ', así que nunca es inyectiva. ' +
        'Pero la imagen sí puede cubrir todo W.';
    }
    return d + 'Las tres son posibles: al coincidir las dimensiones, una TL inyectiva es automáticamente ' +
      'sobreyectiva y viceversa. ' +
      (cur.V.plano !== cur.W.plano
        ? 'Fijate que son espacios distintos, pero para esto lo único que importa es la dimensión.'
        : '');
  }

  function boot() {
    window.AptActivity.init({
      mode: 'multiselect',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: '¿Qué es posible?',
      subtitle: 'Sin ver la transformación, solo con las dimensiones: tildá todas las clasificaciones que podrían darse.',
      nextLabel: 'Probar con otros espacios →',
      generate: generate,
      renderContent: renderContent,
      options: function (cur) {
        return [
          { value: 'mono', label: 'Monomorfismo', correct: cur.mono },
          { value: 'epi',  label: 'Epimorfismo',  correct: cur.epi },
          { value: 'iso',  label: 'Isomorfismo',  correct: cur.iso }
        ];
      },
      explain: function (cur, correct) {
        return correct ? porQue(cur) : 'No es correcto. ' + porQue(cur);
      }
    });
  }

  if (window.AptActivity && typeof window.AptActivity.init === 'function') { boot(); }
  else {
    var intentos = 0;
    var esperar = setInterval(function () {
      intentos++;
      if (window.AptActivity && typeof window.AptActivity.init === 'function') { clearInterval(esperar); boot(); }
      else if (intentos > 200) { clearInterval(esperar); }
    }, 25);
  }
})();
