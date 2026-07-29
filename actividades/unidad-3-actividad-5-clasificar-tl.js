/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 5
   "Clasificá la TL"
   ------------------------------------------------------------
   Dada M(T) en bases canónicas, decidir si T es monomorfismo,
   epimorfismo, isomorfismo o ninguno de los tres. Es la sección
   4.7: la clasificación sale SOLO de comparar dimensiones, sin
   calcular el núcleo ni la imagen explícitamente.

     inyectiva    ⟺  dim(Nu) = 0        ⟺  rango = dim V
     sobreyectiva ⟺  dim(Im) = dim W    ⟺  rango = dim W
     isomorfismo  ⟺  las dos            ⟺  rango = dim V = dim W

   Las cuatro categorías son mutuamente excluyentes, así que van
   como opciones simples y no como tildes múltiples.

   La categoría se elige ANTES de generar: se sortea el objetivo,
   se buscan espacios cuyas dimensiones lo permitan y se construye
   la matriz con el rango exacto necesario. Si se dejara al azar,
   "ninguno" saldría la mayoría de las veces.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #5.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }

  var SPACES = {
    R2:  { dim: 2, label: '\\mathbb{R}^2' },
    R3:  { dim: 3, label: '\\mathbb{R}^3' },
    P2:  { dim: 3, label: 'P_2(\\mathbb{R})' },
    M22: { dim: 4, label: 'M_{2\\times2}(\\mathbb{R})' }
  };
  var SPACE_KEYS = ['R2', 'R3', 'P2', 'M22'];

  /* ---------- matriz de rango exacto (misma técnica que la actividad 4) ---------- */
  function buildWithRank(rows, cols, r) {
    var pivotCols = [], last = -1;
    for (var i = 0; i < r; i++) {
      var restantes = cols - last - 1 - (r - i - 1);
      var col = randInt(last + 1, last + restantes);
      pivotCols.push(col); last = col;
    }
    var M = [];
    for (var i2 = 0; i2 < r; i2++) {
      var row = new Array(cols).fill(0);
      row[pivotCols[i2]] = randNonZero(-4, 4);
      for (var c = pivotCols[i2] + 1; c < cols; c++) row[c] = randInt(-3, 3);
      M.push(row);
    }
    for (var z = r; z < rows; z++) M.push(new Array(cols).fill(0));

    for (var op = 0, ops = randInt(3, 6); op < ops; op++) {
      var kind = rows < 2 ? 'scale' : randChoice(['swap', 'add', 'add', 'scale']);
      if (kind === 'swap') {
        var a = randInt(0, rows - 1), b = randInt(0, rows - 1);
        while (b === a) b = randInt(0, rows - 1);
        var t = M[a]; M[a] = M[b]; M[b] = t;
      } else if (kind === 'add') {
        var i3 = randInt(0, rows - 1), j3 = randInt(0, rows - 1);
        while (j3 === i3) j3 = randInt(0, rows - 1);
        var k = randChoice([-2, -1, 1, 2]);
        M[j3] = M[j3].map(function (v, c2) { return v + k * M[i3][c2]; });
      } else {
        var s = randInt(0, rows - 1);
        // El escalar se elige UNA vez para toda la fila: si se sortea
        // dentro del map, la operación deja de preservar el rango.
        var f = randChoice([-1, 1, -1, 1, 2]);
        M[s] = M[s].map(function (v) { return v * f; });
      }
    }
    return M;
  }

  /* ---------- generador con categoría controlada ---------- */
  var CATEGORIAS = ['mono', 'epi', 'iso', 'ninguno'];

  /* Pares de espacios que permiten cada categoría, según sus dimensiones. */
  function paresPara(cat) {
    var out = [];
    SPACE_KEYS.forEach(function (v) {
      SPACE_KEYS.forEach(function (w) {
        var n = SPACES[v].dim, m = SPACES[w].dim;
        var sirve =
          cat === 'iso'     ? (n === m) :
          cat === 'mono'    ? (n < m) :          // inyectiva pero no sobreyectiva
          cat === 'epi'     ? (m < n) :          // sobreyectiva pero no inyectiva
                              (Math.min(n, m) >= 2); // ninguna: hace falta rango < n y < m
        if (sirve) out.push([v, w]);
      });
    });
    return out;
  }

  function generate() {
    var cat = randChoice(CATEGORIAS);
    var par = randChoice(paresPara(cat));
    var vKey = par[0], wKey = par[1];
    var n = SPACES[vKey].dim, m = SPACES[wKey].dim;

    var r;
    if (cat === 'iso') r = n;                          // = n = m
    else if (cat === 'mono') r = n;                    // n < m
    else if (cat === 'epi') r = m;                     // m < n
    else r = randInt(1, Math.min(n, m) - 1);           // < n y < m

    var A, intentos = 0;
    do {
      A = buildWithRank(m, n, r);
      intentos++;
    } while (Math.max.apply(null, A.map(function (row) {
      return Math.max.apply(null, row.map(Math.abs));
    })) > 30 && intentos < 40);

    var inyectiva = (r === n);
    var sobreyectiva = (r === m);
    return {
      vKey: vKey, wKey: wKey, n: n, m: m, r: r, A: A,
      inyectiva: inyectiva, sobreyectiva: sobreyectiva,
      categoria: inyectiva && sobreyectiva ? 'iso'
               : inyectiva ? 'mono'
               : sobreyectiva ? 'epi'
               : 'ninguno'
    };
  }

  /* ---------- render ---------- */
  function matrixLatex(M) {
    return '\\begin{pmatrix} ' +
      M.map(function (row) { return row.join(' & '); }).join(' \\\\ ') +
      ' \\end{pmatrix}';
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
    window.katex.render('T: ' + SPACES[cur.vKey].label + ' \\to ' + SPACES[cur.wKey].label, head, { throwOnError: false });
    window.katex.render('M(T) = ' + matrixLatex(cur.A), mat, { throwOnError: false });
    ajustarAncho(head);
    ajustarAncho(mat);
  }

  /* ---------- feedback: siempre con los números del caso ---------- */
  function porQue(cur) {
    var base = 'El rango de M(T) es ' + cur.r + ', dim(V) = ' + cur.n + ' y dim(W) = ' + cur.m + '. ';
    if (cur.categoria === 'iso') {
      return base + 'Como el rango coincide con las dos dimensiones, T es inyectiva y sobreyectiva a la vez: es un isomorfismo.';
    }
    if (cur.categoria === 'mono') {
      return base + 'El rango llega a dim(V), así que dim(Nu(T)) = 0 y T es inyectiva. Pero no llega a dim(W), ' +
        'así que la imagen no cubre todo W: no es sobreyectiva.';
    }
    if (cur.categoria === 'epi') {
      return base + 'El rango llega a dim(W), así que la imagen es todo W y T es sobreyectiva. Pero como es menor que dim(V), ' +
        'queda dim(Nu(T)) = ' + (cur.n - cur.r) + ' ≠ 0: no es inyectiva.';
    }
    return base + 'El rango no llega ni a dim(V) ni a dim(W): el núcleo no es trivial (dim ' + (cur.n - cur.r) +
      ') y la imagen no cubre todo W. No es ninguno de los tres.';
  }

  var OPCIONES = [
    { value: 'mono',    label: 'Monomorfismo', sub: 'inyectiva, no sobreyectiva' },
    { value: 'epi',     label: 'Epimorfismo',  sub: 'sobreyectiva, no inyectiva' },
    { value: 'iso',     label: 'Isomorfismo',  sub: 'las dos cosas' },
    { value: 'ninguno', label: 'Ninguno',      sub: 'ni una ni la otra' }
  ];

  function boot() {
    window.AptActivity.init({
      mode: 'choices',
      needsKatex: true,
      choicesStacked: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Clasificá la TL',
      subtitle: 'Comparando el rango de $M(T)$ con $\\dim(V)$ y $\\dim(W)$, clasificá la transformación.',
      nextLabel: 'Probar con otra transformación →',
      generate: generate,
      renderContent: renderContent,
      choices: OPCIONES,
      check: function (cur, value) { return value === cur.categoria; },
      explain: function (cur, correct) {
        return correct ? porQue(cur) : 'No es correcto. ' + porQue(cur);
      }
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
