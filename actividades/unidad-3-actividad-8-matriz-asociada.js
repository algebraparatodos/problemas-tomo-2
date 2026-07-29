/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 8
   "Matriz asociada en bases cualesquiera"
   ------------------------------------------------------------
   Sección 4.4. Dada la expresión analítica de T y dos bases B₁ de V
   y B₂ de W, escribir M(T) en esas bases.

   El procedimiento es el del libro: la columna j de M(T) son las
   coordenadas de T(b_j) en la base B₂. O sea, aplicar T a cada
   vector de B₁ y después resolver un sistema para escribir el
   resultado en B₂.

   POR QUÉ LA RESPUESTA SALE ENTERA
   Con bases cualesquiera, M(T) = C⁻¹·A·B suele tener fracciones, y
   eso obligaría a un grid decimal. Acá se evita construyendo el caso
   al revés: la base de llegada B₂ se arma UNIMODULAR (determinante
   ±1, partiendo de la identidad y aplicando operaciones elementales
   con enteros). Una matriz entera unimodular tiene inversa entera,
   así que C⁻¹·A·B queda entero por construcción — sin restringir
   nada de lo que el alumno tiene que hacer.

   Se usan espacios de dimensión 2 y 3 (R², R³, P₂). Con M₂ₓ₂ habría
   que mostrar dos bases de cuatro matrices cada una, y el enunciado
   se vuelve ilegible en un celular.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #8.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }

  var SPACES = {
    R2: { dim: 2, label: '\\mathbb{R}^2', vars: ['x', 'y'] },
    R3: { dim: 3, label: '\\mathbb{R}^3', vars: ['x', 'y', 'z'] },
    P2: { dim: 3, label: 'P_2(\\mathbb{R})', vars: ['a_0', 'a_1', 'a_2'] }
  };
  var SPACE_KEYS = ['R2', 'R3', 'P2'];

  /* ---------- álgebra entera exacta ---------- */
  function matMul(A, B) {
    var out = [];
    for (var i = 0; i < A.length; i++) {
      var row = [];
      for (var j = 0; j < B[0].length; j++) {
        var s = 0;
        for (var k = 0; k < B.length; k++) s += A[i][k] * B[k][j];
        row.push(s);
      }
      out.push(row);
    }
    return out;
  }
  function det(M) {
    var n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    var s = 0;
    for (var c = 0; c < n; c++) {
      var menor = M.slice(1).map(function (row) {
        return row.filter(function (_, j) { return j !== c; });
      });
      s += (c % 2 ? -1 : 1) * M[0][c] * det(menor);
    }
    return s;
  }
  /* Inversa entera vía adjunta. Solo se usa con matrices de
     determinante ±1, así que el resultado siempre es entero. */
  function inversaEntera(M) {
    var n = M.length, d = det(M);
    if (d !== 1 && d !== -1) return null;
    var adj = [];
    for (var i = 0; i < n; i++) {
      var row = [];
      for (var j = 0; j < n; j++) {
        var menor = M.filter(function (_, r) { return r !== j; })
                     .map(function (r) { return r.filter(function (_, c) { return c !== i; }); });
        var cof = ((i + j) % 2 ? -1 : 1) * (n === 1 ? 1 : det(menor));
        row.push(cof / d);
      }
      adj.push(row);
    }
    return adj;
  }

  /* Matriz entera con determinante ±1: se parte de la identidad y se
     aplican operaciones elementales que no cambian el determinante
     (sumar un múltiplo entero de una fila o columna a otra). */
  function unimodular(n) {
    var M = [];
    for (var i = 0; i < n; i++) {
      var row = [];
      for (var j = 0; j < n; j++) row.push(i === j ? 1 : 0);
      M.push(row);
    }
    for (var op = 0, ops = randInt(3, 5); op < ops; op++) {
      var a = randInt(0, n - 1), b = randInt(0, n - 1);
      while (b === a) b = randInt(0, n - 1);
      var k = randNonZero(-2, 2);
      if (Math.random() < 0.5) {
        for (var c = 0; c < n; c++) M[b][c] += k * M[a][c];   // fila b += k·fila a
      } else {
        for (var r = 0; r < n; r++) M[r][b] += k * M[r][a];   // columna b += k·columna a
      }
    }
    return M;
  }

  function maxAbs(M) { return Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); })); }

  /* ---------- generador ---------- */
  function generate() {
    var vKey, wKey, n, m, A, Bmat, Cmat, Cinv, M, intentos = 0;
    do {
      intentos++;
      vKey = randChoice(SPACE_KEYS);
      wKey = randChoice(SPACE_KEYS);
      n = SPACES[vKey].dim;
      m = SPACES[wKey].dim;

      // A: matriz de T en bases canónicas (la expresión analítica)
      A = [];
      for (var i = 0; i < m; i++) {
        var row = [];
        for (var j = 0; j < n; j++) row.push(randInt(-3, 3));
        A.push(row);
      }
      // B₁: base de V, columnas = coordenadas de b_j. Cualquiera invertible.
      Bmat = unimodular(n);
      // B₂: base de W, unimodular para que su inversa sea entera.
      Cmat = unimodular(m);
      Cinv = inversaEntera(Cmat);
      if (!Cinv) continue;

      // M(T) en las bases dadas = C⁻¹ · A · B
      M = matMul(matMul(Cinv, A), Bmat);
    } while ((maxAbs(A) > 9 || maxAbs(Bmat) > 6 || maxAbs(Cmat) > 6 || maxAbs(M) > 25 ||
              A.every(function (r) { return r.every(function (x) { return x === 0; }); })) && intentos < 200);

    return {
      vKey: vKey, wKey: wKey, n: n, m: m,
      A: A, B: Bmat, C: Cmat, M: M,
      // los vectores de cada base son las COLUMNAS de B y C
      baseV: columnas(Bmat),
      baseW: columnas(Cmat)
    };
  }
  function columnas(M) {
    var out = [];
    for (var c = 0; c < M[0].length; c++) {
      var col = [];
      for (var r = 0; r < M.length; r++) col.push(M[r][c]);
      out.push(col);
    }
    return out;
  }

  /* ---------- render ---------- */
  function polyLatex(coefs) {
    var partes = [], etiquetas = ['', 'x', 'x^2'];
    for (var i = 2; i >= 0; i--) {
      if (!coefs[i]) continue;
      var abs = Math.abs(coefs[i]);
      var c = (i === 0) ? String(abs) : (abs === 1 ? '' : String(abs));
      var term = c + etiquetas[i];
      partes.push(partes.length === 0 ? (coefs[i] < 0 ? '-' : '') + term
                                      : (coefs[i] < 0 ? ' - ' : ' + ') + term);
    }
    return partes.length ? partes.join('') : '0';
  }
  function vecLatex(spaceKey, v) {
    if (spaceKey === 'P2') return polyLatex(v);
    return '(' + v.join(',\\ ') + ')';
  }
  function formaLatex(coefs, vars) {
    var partes = [];
    coefs.forEach(function (c, i) {
      if (!c) return;
      var abs = Math.abs(c);
      var s = (abs === 1 ? '' : String(abs)) + vars[i];
      partes.push(partes.length === 0 ? (c < 0 ? '-' : '') + s : (c < 0 ? ' - ' : ' + ') + s);
    });
    return partes.length ? partes.join('') : '0';
  }
  function elementoLatex(spaceKey, partes) {
    if (spaceKey === 'P2') {
      var w = partes.map(function (p) { return /[+\-]\s/.test(p) ? '\\left(' + p + '\\right)' : p; });
      return w[0] + ' + ' + w[1] + 'x + ' + w[2] + 'x^2';
    }
    return '\\left(' + partes.join(',\\ ') + '\\right)';
  }
  function genericoLatex(spaceKey) {
    var v = SPACES[spaceKey].vars;
    if (spaceKey === 'P2') return v[0] + ' + ' + v[1] + 'x + ' + v[2] + 'x^2';
    return '\\left(' + v.join(',\\ ') + '\\right)';
  }
  function baseLatex(spaceKey, vecs, nombre) {
    return nombre + ' = \\{' + vecs.map(function (v) { return vecLatex(spaceKey, v); }).join(',\\ ') + '\\}';
  }

  var PISO = 0.62;
  function ajustarAncho(rowEl) {
    var k = rowEl.querySelector('.katex');
    if (!k) return;
    rowEl.style.fontSize = '';
    var disp = rowEl.clientWidth;
    if (!disp) return;
    // Margen de 2px: achicar la tipografía no reduce el ancho de forma
    // exactamente proporcional, y sin margen queda 1-2px de desborde.
    var meta = disp - 2;
    var ancho = k.getBoundingClientRect().width;
    if (!ancho || ancho <= meta) return;
    var escala = Math.max(PISO, meta / ancho);
    rowEl.style.fontSize = (escala * 100).toFixed(1) + '%';
    // Segunda pasada: se re-mide con la tipografía ya aplicada y se
    // corrige si todavía sobra.
    var ancho2 = k.getBoundingClientRect().width;
    if (ancho2 > meta && escala > PISO) {
      rowEl.style.fontSize = (Math.max(PISO, escala * (meta / ancho2)) * 100).toFixed(1) + '%';
    }
  }

  function renderContent(container, cur) {
    var vars = SPACES[cur.vKey].vars;
    var partes = cur.A.map(function (row) { return formaLatex(row, vars); });
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:9px;width:100%;">' +
        '<div class="apt-r1" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r2" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r3" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r4" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r1 = container.querySelector('.apt-r1'), r2 = container.querySelector('.apt-r2');
    var r3 = container.querySelector('.apt-r3'), r4 = container.querySelector('.apt-r4');
    window.katex.render('T: ' + SPACES[cur.vKey].label + ' \\to ' + SPACES[cur.wKey].label, r1, { throwOnError: false });
    window.katex.render('T\\left(' + genericoLatex(cur.vKey) + '\\right) = ' + elementoLatex(cur.wKey, partes), r2, { throwOnError: false });
    window.katex.render(baseLatex(cur.vKey, cur.baseV, 'B_1'), r3, { throwOnError: false });
    window.katex.render(baseLatex(cur.wKey, cur.baseW, 'B_2'), r4, { throwOnError: false });
    [r1, r2, r3, r4].forEach(ajustarAncho);
  }

  /* ---------- validación de la respuesta ---------- */
  function checkGrid(cur, S, hasEmpty) {
    if (hasEmpty) {
      return { correct: false, feedbackText: 'Dejaste alguna celda vacía. Si una coordenada es 0, hay que escribirla.' };
    }
    var status = [], mal = [];
    for (var r = 0; r < cur.m; r++) {
      status.push([]);
      for (var c = 0; c < cur.n; c++) {
        var ok = S[r][c] === cur.M[r][c];
        status[r].push(ok ? 'correct' : 'wrong');
        if (!ok) mal.push({ r: r, c: c, puesto: S[r][c] });
      }
    }
    if (mal.length === 0) {
      return {
        correct: true, cellStatus: status,
        feedbackText: 'Cada columna son las coordenadas en B₂ de la imagen del vector correspondiente de B₁.'
      };
    }
    var f = mal[0];
    var texto = 'La columna ' + (f.c + 1) + ' son las coordenadas en B₂ de T aplicada al vector ' + (f.c + 1) +
      ' de B₁. En la fila ' + (f.r + 1) + ' de esa columna va ' + cur.M[f.r][f.c] + ', y pusiste ' + f.puesto + '.';
    if (mal.length > 1) {
      texto += ' Hay ' + (mal.length - 1) + ' celda' + (mal.length - 1 > 1 ? 's' : '') +
        ' más marcada' + (mal.length - 1 > 1 ? 's' : '') + ' en rojo.';
    }
    return { correct: false, cellStatus: status, feedbackText: 'No es correcto. ' + texto };
  }

  function boot() {
    window.AptActivity.init({
      mode: 'grid',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Matriz asociada en otras bases',
      subtitle: 'Ahora las bases no son las canónicas. Escribí $M(T)$ en las bases $B_1$ y $B_2$ que te damos.',
      nextLabel: 'Probar con otro caso →',
      generate: generate,
      renderContent: renderContent,
      grid: {
        rows: function (cur) { return cur.m; },
        cols: function (cur) { return cur.n; },
        noDivider: true
        // Sin rótulo a la izquierda: con 3 columnas de celdas, el
        // "M(T) =" empuja la grilla fuera de pantalla a 320px. El
        // título y la pregunta ya dicen qué se está pidiendo.
      },
      cellAriaLabel: function (cur, r, c) { return 'Fila ' + (r + 1) + ', columna ' + (c + 1); },
      checkGrid: checkGrid,
      getAnswerGrid: function (cur) { return cur.M; },
      answerTitle: 'La respuesta correcta',
      answerText: 'La columna j son las coordenadas, en la base B₂, de la imagen del j-ésimo vector de B₁.'
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
