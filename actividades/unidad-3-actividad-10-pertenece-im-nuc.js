/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 10
   "¿Pertenece a la imagen o al núcleo?"
   ------------------------------------------------------------
   Sección 4.5. Dada M(T) y un vector, decidir si pertenece al
   núcleo o a la imagen. Alterna entre las dos preguntas:

     v ∈ Nu(T)  ⟺  M(T)·v = 0
     w ∈ Im(T)  ⟺  w es combinación lineal de las columnas de M(T)

   Los cuatro casos —núcleo sí, núcleo no, imagen sí, imagen no— se
   sortean parejos y el caso se construye para que dé ese resultado.
   Si se dejara al azar, "no pertenece" saldría casi siempre.

   Para el núcleo se aprovecha que las operaciones elementales de
   FILA no cambian el núcleo: se calcula sobre la matriz escalonada
   de partida y sigue valiendo para la matriz ya mezclada.

   El feedback es concreto en los cuatro casos. En particular, cuando
   el vector SÍ está en la imagen, muestra la combinación lineal de
   columnas que lo produce — no dice solo "sí pertenece".

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #10.
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

  /* ---------- matriz de rango exacto ---------- */
  function escalonadaConRango(rows, cols, r) {
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
    return M;
  }
  /* Solo operaciones de FILA: preservan el rango Y el núcleo. */
  function mezclarFilas(M, rows) {
    var out = M.map(function (r) { return r.slice(); });
    for (var op = 0, ops = randInt(3, 6); op < ops; op++) {
      var kind = rows < 2 ? 'scale' : randChoice(['swap', 'add', 'add', 'scale']);
      if (kind === 'swap') {
        var a = randInt(0, rows - 1), b = randInt(0, rows - 1);
        while (b === a) b = randInt(0, rows - 1);
        var t = out[a]; out[a] = out[b]; out[b] = t;
      } else if (kind === 'add') {
        var i = randInt(0, rows - 1), j = randInt(0, rows - 1);
        while (j === i) j = randInt(0, rows - 1);
        var k = randChoice([-2, -1, 1, 2]);
        out[j] = out[j].map(function (v, c) { return v + k * out[i][c]; });
      } else {
        var s = randInt(0, rows - 1);
        var f = randChoice([-1, 1, -1, 1, 2]);
        out[s] = out[s].map(function (v) { return v * f; });
      }
    }
    return out;
  }

  function porVector(A, v) {
    return A.map(function (row) {
      var s = 0;
      for (var c = 0; c < v.length; c++) s += row[c] * v[c];
      return s;
    });
  }
  function esNulo(v) { return v.every(function (x) { return x === 0; }); }
  function maxAbs(M) { return Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); })); }

  /* Base entera del núcleo, vía RREF con fracciones exactas del engine. */
  function baseDelNucleo(A) {
    var F = window.AptActivity.Frac;
    var n = A[0].length;
    var R = F.rref(F.intMatrixToFrac(A));
    var pivotDeFila = [], colsPivote = {};
    R.forEach(function (row) {
      var p = -1;
      for (var c = 0; c < n; c++) { if (!F.fIsZero(row[c])) { p = c; break; } }
      if (p !== -1) { pivotDeFila.push(p); colsPivote[p] = true; }
    });
    var libres = [];
    for (var c2 = 0; c2 < n; c2++) if (!colsPivote[c2]) libres.push(c2);
    return libres.map(function (libre) {
      var vec = new Array(n).fill(0).map(function () { return F.Frac(0); });
      vec[libre] = F.Frac(1);
      for (var ri = 0; ri < pivotDeFila.length; ri++) {
        vec[pivotDeFila[ri]] = F.fSub(F.Frac(0), R[ri][libre]);
      }
      return F.fracRowToIntRow(vec);
    });
  }

  /* ---------- generador ---------- */
  var CASOS = ['nucleo-si', 'nucleo-no', 'imagen-si', 'imagen-no'];

  function generate() {
    var caso = randChoice(CASOS);
    var vKey, wKey, n, m, r, A, vec, coefs = null, intentos = 0;

    do {
      intentos++;
      vKey = randChoice(SPACE_KEYS);
      wKey = randChoice(SPACE_KEYS);
      n = SPACES[vKey].dim; m = SPACES[wKey].dim;

      // el rango se elige según lo que el caso necesite
      if (caso === 'nucleo-si') r = randInt(1, Math.min(n, m) - 1 < 1 ? 1 : Math.min(n - 1, m));
      else if (caso === 'imagen-no') r = randInt(1, Math.min(n, m - 1) < 1 ? 1 : Math.min(n, m - 1));
      else r = randInt(1, Math.min(n, m));
      if (caso === 'nucleo-si' && r >= n) continue;   // hace falta núcleo no trivial
      if (caso === 'imagen-no' && r >= m) continue;   // hace falta que la imagen no sea todo W

      A = mezclarFilas(escalonadaConRango(m, n, r), m);
      if (maxAbs(A) > 24) continue;

      if (caso === 'nucleo-si') {
        var base = baseDelNucleo(A);
        if (!base.length) continue;
        var b = randChoice(base);
        var t = randChoice([-2, -1, 1, 1, 2]);
        vec = b.map(function (x) { return t * x; });
        if (esNulo(vec) || Math.max.apply(null, vec.map(Math.abs)) > 20) continue;

      } else if (caso === 'nucleo-no') {
        vec = [];
        for (var i = 0; i < n; i++) vec.push(randInt(-3, 3));
        if (esNulo(vec) || esNulo(porVector(A, vec))) continue;

      } else if (caso === 'imagen-si') {
        var x = [];
        for (var i2 = 0; i2 < n; i2++) x.push(randInt(-2, 2));
        if (esNulo(x)) continue;
        vec = porVector(A, x);
        if (esNulo(vec) || Math.max.apply(null, vec.map(Math.abs)) > 30) continue;
        coefs = x;

      } else { // imagen-no
        var F = window.AptActivity.Frac;
        var rangoA = F.rankOf(F.intMatrixToFrac(A));
        var hallado = false;
        for (var intento = 0; intento < 40 && !hallado; intento++) {
          var cand = [];
          for (var i3 = 0; i3 < m; i3++) cand.push(randInt(-4, 4));
          if (esNulo(cand)) continue;
          var ampliada = A.map(function (row, ri) { return row.concat([cand[ri]]); });
          if (F.rankOf(F.intMatrixToFrac(ampliada)) === rangoA + 1) { vec = cand; hallado = true; }
        }
        if (!hallado) continue;
      }
      break;
    } while (intentos < 300);

    var esNucleo = caso.indexOf('nucleo') === 0;
    return {
      caso: caso, vKey: vKey, wKey: wKey, n: n, m: m, r: r, A: A,
      vec: vec, coefs: coefs,
      pregunta: esNucleo ? 'nucleo' : 'imagen',
      // el vector vive en V si la pregunta es del núcleo, y en W si es de la imagen
      espacioVec: esNucleo ? vKey : wKey,
      pertenece: caso.slice(-2) === 'si',
      Av: esNucleo ? porVector(A, vec) : null
    };
  }

  /* ---------- render ---------- */
  function matrixLatex(M) {
    return '\\begin{pmatrix} ' + M.map(function (r) { return r.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
  }
  function polyLatex(c) {
    var partes = [], et = ['', 'x', 'x^2'];
    for (var i = 2; i >= 0; i--) {
      if (!c[i]) continue;
      var abs = Math.abs(c[i]);
      var s = (i === 0 ? String(abs) : (abs === 1 ? '' : String(abs))) + et[i];
      partes.push(partes.length === 0 ? (c[i] < 0 ? '-' : '') + s : (c[i] < 0 ? ' - ' : ' + ') + s);
    }
    return partes.length ? partes.join('') : '0';
  }
  function vecLatex(spaceKey, v) {
    if (spaceKey === 'M22') return '\\begin{pmatrix} ' + v[0] + ' & ' + v[1] + ' \\\\ ' + v[2] + ' & ' + v[3] + ' \\end{pmatrix}';
    if (spaceKey === 'P2') return polyLatex(v);
    return '\\left(' + v.join(',\\ ') + '\\right)';
  }
  function vecPlano(spaceKey, v) {
    if (spaceKey === 'M22') return '[' + v[0] + ' ' + v[1] + ' ; ' + v[2] + ' ' + v[3] + ']';
    if (spaceKey === 'P2') return polyLatex(v).replace(/\^2/g, '²');
    return '(' + v.join(', ') + ')';
  }

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
        '<div class="apt-r3" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r4" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r1 = container.querySelector('.apt-r1');
    var r2 = container.querySelector('.apt-r2');
    var r3 = container.querySelector('.apt-r3');
    var r4 = container.querySelector('.apt-r4');
    window.katex.render('T: ' + SPACES[cur.vKey].label + ' \\to ' + SPACES[cur.wKey].label, r1, { throwOnError: false });
    window.katex.render('M(T) = ' + matrixLatex(cur.A), r2, { throwOnError: false });
    var nombre = cur.pregunta === 'nucleo' ? 'v' : 'w';
    window.katex.render(nombre + ' = ' + vecLatex(cur.espacioVec, cur.vec), r3, { throwOnError: false });
    // La pregunta va acá dentro y no en cfg.question: el engine solo
    // usa ese campo en las fases, no en el modo 'choices' a secas.
    window.katex.render(
      cur.pregunta === 'nucleo' ? '\\text{¿} v \\in Nu(T) \\text{?}' : '\\text{¿} w \\in Im(T) \\text{?}',
      r4, { throwOnError: false });
    [r1, r2, r3, r4].forEach(ajustarAncho);
  }

  /* ---------- feedback concreto en los cuatro casos ---------- */
  function combinacionTexto(cur) {
    var partes = [];
    cur.coefs.forEach(function (c, i) {
      if (c === 0) return;
      var abs = Math.abs(c);
      var pieza = (abs === 1 ? '' : abs + '·') + 'c' + (i + 1);
      partes.push((partes.length === 0 ? (c < 0 ? '−' : '') : (c < 0 ? ' − ' : ' + ')) + pieza);
    });
    return partes.join('');
  }

  function porQue(cur) {
    if (cur.caso === 'nucleo-si') {
      return 'M(T)·v da el vector nulo, así que v sí está en el núcleo: T lo manda al 0.';
    }
    if (cur.caso === 'nucleo-no') {
      return 'M(T)·v = ' + vecPlano(cur.wKey, cur.Av) + ', que no es el vector nulo. ' +
        'Para estar en el núcleo, la imagen tiene que ser exactamente 0.';
    }
    if (cur.caso === 'imagen-si') {
      return 'w sí está en la imagen: es combinación lineal de las columnas de M(T). Llamando c₁, c₂, … a esas columnas, ' +
        'w = ' + combinacionTexto(cur) + '. La imagen es justamente el espacio generado por las columnas.';
    }
    return 'w no está en la imagen. El rango de M(T) es ' + cur.r +
      ', pero si agregás w como una columna más el rango sube a ' + (cur.r + 1) +
      ': eso significa que w no se puede escribir como combinación de las columnas.';
  }

  function boot() {
    window.AptActivity.init({
      mode: 'choices',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: '¿Pertenece?',
      subtitle: 'Mirá la matriz asociada y el vector, y decidí si pertenece al conjunto que se te pregunta.',
      nextLabel: 'Probar con otro caso →',
      generate: generate,
      renderContent: renderContent,
      choices: function (cur) {
        var n = cur.pregunta === 'nucleo' ? 'Nu(T)' : 'Im(T)';
        return [
          { value: 'si', label: 'Sí, pertenece a ' + n },
          { value: 'no', label: 'No pertenece a ' + n }
        ];
      },
      check: function (cur, value) { return (value === 'si') === cur.pertenece; },
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
