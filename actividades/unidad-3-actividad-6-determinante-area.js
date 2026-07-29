/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 6
   "Determinante y área"
   ------------------------------------------------------------
   Sección 4.7.2. Dado un endomorfismo de R², decidir qué le hace
   al área y qué le hace a la orientación:

     |det| = 1  → conserva el área
     |det| > 1  → la amplía
     |det| < 1  → la reduce
      det  = 0  → la colapsa (y T no es isomorfismo)
      det  > 0  → conserva la orientación
      det  < 0  → la invierte

   Dos decisiones de diseño, las dos para ser fiel al libro:

   1) SOLO endomorfismos de R². El libro aclara que la lectura
      geométrica del determinante vale únicamente cuando el espacio
      de partida y el de llegada coinciden, y habla de "área", que
      es 2D — en dimensión mayor sería volumen.

   2) La matriz se muestra con un factor 1/k adelante cuando hace
      falta. Con entradas enteras |det| es entero, así que el caso
      "reduce el área" (|det| < 1) sería imposible de generar. El
      factor lo destraba, y es la misma forma en que el libro escribe
      las matrices de proyección y reflexión en 4.8.

   La orientación se pregunta solo si det ≠ 0: si colapsa, no hay
   orientación que conservar ni invertir.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #6.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }

  /* ---------- matriz 2x2 entera con determinante EXACTO ----------
     Se arma [[1,0],[0,d]] (determinante d por construcción) y se
     mezcla sumando múltiplos de una fila a la otra y de una columna
     a la otra: esas operaciones no cambian el determinante. */
  function matrizConDet(d) {
    var M = [[1, 0], [0, d]];
    for (var op = 0, ops = randInt(3, 5); op < ops; op++) {
      var k = randNonZero(-2, 2);
      if (Math.random() < 0.5) {
        // fila j += k * fila i
        if (Math.random() < 0.5) { M[1][0] += k * M[0][0]; M[1][1] += k * M[0][1]; }
        else { M[0][0] += k * M[1][0]; M[0][1] += k * M[1][1]; }
      } else {
        // columna j += k * columna i
        if (Math.random() < 0.5) { M[0][1] += k * M[0][0]; M[1][1] += k * M[1][0]; }
        else { M[0][0] += k * M[0][1]; M[1][0] += k * M[1][1]; }
      }
    }
    return M;
  }

  /* Para el caso colapsa: filas proporcionales, determinante 0. */
  function matrizSingular() {
    var a = randNonZero(-4, 4), b = randInt(-4, 4);
    var lam = randNonZero(-3, 3);
    var M = [[a, b], [lam * a, lam * b]];
    for (var op = 0, ops = randInt(2, 4); op < ops; op++) {
      var k = randNonZero(-2, 2);
      if (Math.random() < 0.5) { M[1][0] += k * M[0][0]; M[1][1] += k * M[0][1]; }
      else { M[0][0] += k * M[1][0]; M[0][1] += k * M[1][1]; }
    }
    return M;
  }

  function det2(M) { return M[0][0] * M[1][1] - M[0][1] * M[1][0]; }
  function maxAbs(M) { return Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); })); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }

  var CATEGORIAS = ['conserva', 'amplia', 'reduce', 'colapsa'];

  function generate() {
    var cat = randChoice(CATEGORIAS);
    // k = denominador del factor 1/k. Para "reduce" hace falta k >= 2,
    // porque con k = 1 el determinante es entero y nunca queda entre 0 y 1.
    var k = cat === 'reduce' ? randChoice([2, 2, 3]) : randChoice([1, 1, 1, 2, 3]);
    var k2 = k * k;

    var A, d, intentos = 0;
    do {
      if (cat === 'colapsa') { A = matrizSingular(); d = 0; }
      else {
        if (cat === 'conserva') d = k2;
        else if (cat === 'amplia') d = randInt(k2 + 1, k2 + 8);
        else d = randInt(1, k2 - 1);
        if (Math.random() < 0.5) d = -d;
        A = matrizConDet(d);
      }
      intentos++;
    } while ((maxAbs(A) > 24 || (cat !== 'colapsa' && det2(A) !== d)) && intentos < 60);

    d = det2(A);
    var absDetNum = Math.abs(d), absDetDen = k2;
    var g = gcd(absDetNum, absDetDen);
    return {
      A: A, k: k, det: d,
      // |det(M(T))| = |det(A)| / k², como fracción reducida
      absNum: absDetNum / g, absDen: absDetDen / g,
      categoria: d === 0 ? 'colapsa'
               : absDetNum === k2 ? 'conserva'
               : absDetNum > k2 ? 'amplia'
               : 'reduce',
      orientacion: d > 0 ? 'conserva' : d < 0 ? 'invierte' : null
    };
  }

  /* ---------- render ---------- */
  function matrixLatex(M) {
    return '\\begin{pmatrix} ' + M.map(function (r) { return r.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
  }
  function ajustarAncho(rowEl) {
    var k = rowEl.querySelector('.katex');
    if (!k) return;
    rowEl.style.fontSize = '';
    var disp = rowEl.clientWidth, ancho = k.getBoundingClientRect().width;
    if (!disp || !ancho || ancho <= disp) return;
    rowEl.style.fontSize = (Math.max(0.68, disp / ancho) * 100).toFixed(1) + '%';
  }
  function renderContent(container, cur) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;">' +
        '<div class="apt-row-head" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-row-mat" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var head = container.querySelector('.apt-row-head');
    var mat = container.querySelector('.apt-row-mat');
    window.katex.render('T: \\mathbb{R}^2 \\to \\mathbb{R}^2', head, { throwOnError: false });
    var factor = cur.k === 1 ? '' : '\\dfrac{1}{' + cur.k + '}\\,';
    window.katex.render('M(T) = ' + factor + matrixLatex(cur.A), mat, { throwOnError: false });
    ajustarAncho(head);
    ajustarAncho(mat);
  }

  /* ---------- feedback, siempre en texto plano ---------- */
  function detTexto(cur) {
    if (cur.k === 1) return String(cur.det);
    return cur.det + '/' + (cur.k * cur.k);
  }
  function absTexto(cur) {
    return cur.absDen === 1 ? String(cur.absNum) : (cur.absNum + '/' + cur.absDen);
  }

  function porQueArea(cur) {
    var base = 'det(M(T)) = ' + detTexto(cur) + ', así que |det| = ' + absTexto(cur) + '. ';
    if (cur.categoria === 'colapsa') {
      return base + 'Cuando el determinante es 0, toda figura se aplasta y su área queda en cero. ' +
        'Es además el caso en que T no es isomorfismo: el núcleo no es trivial.';
    }
    if (cur.categoria === 'conserva') return base + 'Como vale exactamente 1, las figuras se deforman pero mantienen su área.';
    if (cur.categoria === 'amplia') return base + 'Como es mayor que 1, las figuras se agrandan: el área queda multiplicada por ' + absTexto(cur) + '.';
    return base + 'Como está entre 0 y 1, las figuras se achican: el área queda multiplicada por ' + absTexto(cur) + '.';
  }
  function porQueOrientacion(cur) {
    return cur.det > 0
      ? 'El determinante es positivo (' + detTexto(cur) + '), así que la transformación conserva la orientación.'
      : 'El determinante es negativo (' + detTexto(cur) + '), así que la transformación invierte la orientación.';
  }

  function boot() {
    window.AptActivity.init({
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Determinante y área',
      subtitle: 'El determinante de un endomorfismo dice cuánto se deforma el área. Miralo y respondé.',
      nextLabel: 'Probar con otra transformación →',
      generate: generate,
      renderContent: renderContent,
      // Si el determinante es 0 no hay orientación que preguntar.
      activePhaseCount: function (cur) { return cur.det === 0 ? 1 : 2; },
      phases: [
        {
          mode: 'choices',
          question: '¿Qué le hace T al área de una figura?',
          choicesStacked: true,
          choices: [
            { value: 'conserva', label: 'La conserva', sub: 'el área no cambia' },
            { value: 'amplia',   label: 'La amplía',   sub: 'las figuras se agrandan' },
            { value: 'reduce',   label: 'La reduce',   sub: 'las figuras se achican' },
            { value: 'colapsa',  label: 'La colapsa',  sub: 'el área queda en cero' }
          ],
          check: function (cur, value) { return value === cur.categoria; },
          explain: function (cur, correct) {
            return correct ? porQueArea(cur) : 'No es correcto. ' + porQueArea(cur);
          }
        },
        {
          mode: 'choices',
          question: '¿Y qué le hace a la orientación?',
          choicesStacked: false,
          choices: [
            { value: 'conserva', label: 'La conserva' },
            { value: 'invierte', label: 'La invierte' }
          ],
          check: function (cur, value) { return value === cur.orientacion; },
          explain: function (cur, correct) {
            return correct ? porQueOrientacion(cur) : 'No es correcto. ' + porQueOrientacion(cur);
          }
        }
      ]
    });
  }

  if (window.AptActivity && typeof window.AptActivity.init === 'function') { boot(); }
  else {
    var intentos2 = 0;
    var esperar = setInterval(function () {
      intentos2++;
      if (window.AptActivity && typeof window.AptActivity.init === 'function') { clearInterval(esperar); boot(); }
      else if (intentos2 > 200) { clearInterval(esperar); }
    }, 25);
  }
})();
