/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 2
   "¿Existe? ¿Es única?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-3-actividad-2-existe-es-unica.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u3-a2')) return;
    var d = document.createElement('div');
    d.id = 'apt-u3-a2';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function () {
    'use strict';

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }

    /* ---------- fracciones exactas (para el rango, sin floats) ---------- */
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
    function F(n, d) {
      if (d === undefined) d = 1;
      if (d < 0) { n = -n; d = -d; }
      var g = gcd(n, d);
      return { n: g ? n / g : 0, d: g ? d / g : 1 };
    }
    function fSub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
    function fMul(a, b) { return F(a.n * b.n, a.d * b.d); }
    function fDiv(a, b) { return F(a.n * b.d, a.d * b.n); }
    function fZero(a) { return a.n === 0; }

    function rank(Mint) {
      if (!Mint.length || !Mint[0].length) return 0;
      var M = Mint.map(function (r) { return r.map(function (x) { return F(x, 1); }); });
      var rows = M.length, cols = M[0].length, r = 0;
      for (var c = 0; c < cols && r < rows; c++) {
        var piv = -1;
        for (var i = r; i < rows; i++) { if (!fZero(M[i][c])) { piv = i; break; } }
        if (piv === -1) continue;
        var tmp = M[r]; M[r] = M[piv]; M[piv] = tmp;
        for (var i2 = r + 1; i2 < rows; i2++) {
          if (!fZero(M[i2][c])) {
            var f = fDiv(M[i2][c], M[r][c]);
            for (var k = 0; k < cols; k++) M[i2][k] = fSub(M[i2][k], fMul(f, M[r][k]));
          }
        }
        r++;
      }
      return r;
    }
    function transpose(M) {
      if (!M.length) return [];
      return M[0].map(function (_, c) { return M.map(function (row) { return row[c]; }); });
    }

    /* ---------- espacios ---------- */
    var SPACES = {
      R2:  { dim: 2, label: '\\mathbb{R}^2' },
      R3:  { dim: 3, label: '\\mathbb{R}^3' },
      P2:  { dim: 3, label: 'P_2(\\mathbb{R})' },
      M22: { dim: 4, label: 'M_{2\\times2}(\\mathbb{R})' }
    };
    var SPACE_KEYS = ['R2', 'R3', 'P2', 'M22'];

    function polyToLatex(c) {
      var terms = [], labels = ['', 'x', 'x^2'];
      for (var i = 2; i >= 0; i--) {
        if (c[i] === 0) continue;
        var abs = Math.abs(c[i]);
        var coefStr = (i === 0) ? String(abs) : (abs === 1 ? '' : String(abs));
        var term = coefStr + labels[i];
        if (terms.length === 0) terms.push((c[i] < 0 ? '-' : '') + term);
        else terms.push((c[i] < 0 ? ' - ' : ' + ') + term);
      }
      return terms.length ? terms.join('') : '0';
    }
    function vecToLatex(spaceKey, v) {
      if (spaceKey === 'R2') return '(' + v[0] + ',\\ ' + v[1] + ')';
      if (spaceKey === 'R3') return '(' + v[0] + ',\\ ' + v[1] + ',\\ ' + v[2] + ')';
      if (spaceKey === 'M22') return '\\begin{pmatrix}' + v[0] + ' & ' + v[1] + '\\\\ ' + v[2] + ' & ' + v[3] + '\\end{pmatrix}';
      return polyToLatex(v);
    }
    /* versión Unicode, para el feedback (nunca LaTeX crudo ahí) */
    function vecToPlain(spaceKey, v) {
      if (spaceKey === 'R2') return '(' + v[0] + ', ' + v[1] + ')';
      if (spaceKey === 'R3') return '(' + v[0] + ', ' + v[1] + ', ' + v[2] + ')';
      if (spaceKey === 'M22') return '[' + v[0] + ' ' + v[1] + ' ; ' + v[2] + ' ' + v[3] + ']';
      var terms = [], labels = ['', 'x', 'x²'];
      for (var i = 2; i >= 0; i--) {
        if (v[i] === 0) continue;
        var abs = Math.abs(v[i]);
        var coefStr = (i === 0) ? String(abs) : (abs === 1 ? '' : String(abs));
        var term = coefStr + labels[i];
        if (terms.length === 0) terms.push((v[i] < 0 ? '-' : '') + term);
        else terms.push((v[i] < 0 ? ' - ' : ' + ') + term);
      }
      return terms.length ? terms.join('') : '0';
    }
    var SUB = ['₁', '₂', '₃', '₄', '₅'];

    /* ---------- generador ---------- */
    function generate() {
      var vKey = randChoice(SPACE_KEYS), wKey = randChoice(SPACE_KEYS);
      var n = SPACES[vKey].dim, m = SPACES[wKey].dim;
      var kind = randChoice(['unica', 'infinitas', 'noexiste']);
      var vecs = [], imgs = [], dep = null;

      function randVec(d, lo, hi) { var v = []; for (var i = 0; i < d; i++) v.push(randInt(lo, hi)); return v; }
      function buildIndep(count) {
        var out, tries = 0;
        do {
          out = [];
          for (var i = 0; i < count; i++) out.push(randVec(n, -2, 3));
          tries++;
        } while (rank(out) !== count && tries < 200);
        return out;
      }

      if (kind === 'unica') {
        vecs = buildIndep(n);
        imgs = vecs.map(function () { return randVec(m, -3, 3); });
      } else if (kind === 'infinitas') {
        var k = Math.max(1, randInt(1, n - 1));
        vecs = buildIndep(k);
        imgs = vecs.map(function () { return randVec(m, -3, 3); });
      } else {
        var base = buildIndep(Math.max(2, Math.min(n, randInt(2, n))));
        var coefs = base.map(function () { return randInt(-2, 2); });
        if (coefs.every(function (c) { return c === 0; })) coefs[0] = 1;
        var combo = new Array(n).fill(0);
        base.forEach(function (v, i) { for (var j = 0; j < n; j++) combo[j] += coefs[i] * v[j]; });
        var baseImgs = base.map(function () { return randVec(m, -3, 3); });
        var goodImg = new Array(m).fill(0);
        baseImgs.forEach(function (w, i) { for (var j = 0; j < m; j++) goodImg[j] += coefs[i] * w[j]; });
        var badImg = goodImg.slice();
        badImg[randInt(0, m - 1)] += randNonZero(1, 3);
        vecs = base.concat([combo]);
        imgs = baseImgs.concat([badImg]);
        dep = { coefs: coefs, goodImg: goodImg, badImg: badImg };
      }
      return { vKey: vKey, wKey: wKey, n: n, m: m, vecs: vecs, imgs: imgs, kind: kind, dep: dep };
    }

    /* Clasificación independiente: rangos exactos, sin mirar cur.kind */
    function classify(cur) {
      var V = transpose(cur.vecs);
      var stacked = V.concat(transpose(cur.imgs));
      var rV = rank(V), rS = rank(stacked);
      if (rS > rV) return 'noexiste';
      return rV === cur.n ? 'unica' : 'infinitas';
    }

    /* Red de seguridad de ancho: si la expresión igual no entra (KaTeX
       mide distinto según la fuente que cargue), se achica la tipografía
       hasta que entre. NO se usa overflow-x:auto acá a propósito: sobre
       un contenedor de KaTeX termina forzando también el scroll vertical. */
    function fitToWidth(rowEl) {
      var k = rowEl.querySelector('.katex');
      if (!k) return;
      rowEl.style.fontSize = '';
      var avail = rowEl.clientWidth;
      var w = k.getBoundingClientRect().width;
      if (!avail || !w || w <= avail) return;
      var scale = Math.max(0.68, avail / w);
      rowEl.style.fontSize = (scale * 100).toFixed(1) + '%';
    }

    function renderContent(container, cur) {
      var head = 'T: ' + SPACES[cur.vKey].label + ' \\to ' + SPACES[cur.wKey].label;
      var rows = cur.vecs.map(function (v, i) {
        return 'T\\left(' + vecToLatex(cur.vKey, v) + '\\right) = ' + vecToLatex(cur.wKey, cur.imgs[i]);
      });
      container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">' +
        '<div class="apt-row-head" style="width:100%;text-align:center;"></div>' +
        rows.map(function () { return '<div class="apt-row-d" style="width:100%;text-align:center;"></div>'; }).join('') +
        '</div>';
      var headEl = container.querySelector('.apt-row-head');
      window.katex.render(head, headEl, { throwOnError: false });
      fitToWidth(headEl);
      var dEls = container.querySelectorAll('.apt-row-d');
      rows.forEach(function (r, i) {
        window.katex.render(r, dEls[i], { throwOnError: false });
        fitToWidth(dEls[i]);
      });
    }

    /* Combinación lineal en texto plano: "v₃ = 2·v₁ − v₂" */
    function depText(cur) {
      var last = cur.vecs.length;
      var parts = [];
      cur.dep.coefs.forEach(function (c, i) {
        if (c === 0) return;
        var abs = Math.abs(c);
        var piece = (abs === 1 ? '' : abs + '·') + 'v' + SUB[i];
        parts.push({ neg: c < 0, piece: piece });
      });
      var s = '';
      parts.forEach(function (p, i) {
        if (i === 0) s += (p.neg ? '−' : '') + p.piece;
        else s += (p.neg ? ' − ' : ' + ') + p.piece;
      });
      return 'v' + SUB[last - 1] + ' = ' + s;
    }

    AptActivity.init({
      mount: '#apt-u3-a2',
      mode: 'choices',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: '¿Existe? ¿Es única?',
      subtitle: 'Te doy las imágenes de algunos vectores. ¿Alcanzan para definir una única TL?',
      nextLabel: 'Probar con otros datos →',
      generate: generate,
      renderContent: renderContent,
      choices: [
        { value: 'unica',     label: 'Única',     sub: 'Existe una sola TL' },
        { value: 'infinitas', label: 'Infinitas', sub: 'Existe más de una' },
        { value: 'noexiste',  label: 'No existe', sub: 'Los datos se contradicen' }
      ],
      check: function (cur, value) { return value === classify(cur); },
      explain: function (cur, correct) {
        var real = classify(cur);
        if (correct) {
          var rOk = rank(transpose(cur.vecs));
          if (real === 'unica') {
            return 'Los vectores dados son LI y generan V, o sea que forman una base: conocer la imagen de una base determina la TL por completo.';
          }
          if (real === 'infinitas') {
            return 'El rango de los vectores dados es ' + rOk + ' y dim(V) = ' + cur.n +
              ', así que queda información sin fijar y hay más de una TL posible.';
          }
          return 'Los vectores dados son LD y las imágenes no respetan esa misma relación, y una TL conserva las combinaciones lineales.';
        }
        var k = cur.vecs.length;
        var r = rank(transpose(cur.vecs));
        if (real === 'unica') {
          return 'No es correcto: la TL existe y es única. Los ' + k + ' vectores son LI y generan V ' +
            '(su rango es ' + r + ' y dim(V) = ' + cur.n + '), así que forman una base: conocer la imagen de una base ' +
            'determina la TL por completo.';
        }
        if (real === 'infinitas') {
          return 'No es correcto: existen infinitas. El rango de los vectores dados es ' + r + ' y dim(V) = ' + cur.n +
            ', así que quedan ' + (cur.n - r) + ' dirección(es) de V sin información — cada forma de elegir esas imágenes da una TL distinta.';
        }
        return 'No es correcto: no existe ninguna TL con esos datos. Fijate que ' + depText(cur) +
          ', y una TL conserva las combinaciones lineales, así que su imagen debería ser ' +
          vecToPlain(cur.wKey, cur.dep.goodImg) + '. Pero el dato dice ' + vecToPlain(cur.wKey, cur.dep.badImg) + '.';
      }
    });
  })();

})();
