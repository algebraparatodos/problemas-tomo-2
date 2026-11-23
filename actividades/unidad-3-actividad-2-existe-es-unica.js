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

    /* ---------- generador ----------
       Los tres casos del libro (3.3), con sus variantes, para que
       ninguna regla de atajo alcance:

         única      · base: n vectores LI (3.3.1, caso 1)
                    · generador: una base y uno o dos vectores de más,
                      LD con los anteriores, cuyas imágenes respetan
                      la misma combinación (3.3.1, caso 2)
         infinitas  · LI: menos de n vectores LI
                    · LD coherente: menos de n vectores LI y alguno de
                      más que respeta la linealidad (el ejemplo de 3.3.2:
                      al escalonar quedan filas de ceros)
         no existe  · un vector LD cuya imagen NO respeta la combinación
                      (3.3.3), generen o no 𝕍 los demás

       Así hay conjuntos LD en los tres casos: la regla falsa «si son
       LD, no existe» falla, y también «si son más de n, no existe».
       Cada caso sale 1/3 de las veces; en única e infinitas, cada
       variante sale la mitad de esas veces. La respuesta no se toma de
       acá: classify() la recalcula con rangos exactos. */
    function generate() {
      var vKey = randChoice(SPACE_KEYS), wKey = randChoice(SPACE_KEYS);
      var n = SPACES[vKey].dim, m = SPACES[wKey].dim;
      var kind = randChoice(['unica', 'infinitas', 'noexiste']);
      var variante = kind === 'noexiste' ? 'incoherente' : randChoice(['li', 'ld']);
      var vecs = [], imgs = [], dep = null, extras = [];

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
      function igual(u, v) { return u.every(function (x, i) { return x === v[i]; }); }
      /* Combinación lineal de los vectores de la base (y la misma de sus
         imágenes) con coeficientes chicos. Con dos o más vectores se usan
         al menos dos, para que el de más no sea un simple múltiplo y haya
         que mirarlo de verdad; con uno solo, un múltiplo distinto de 0 y 1. */
      function combinar(base, baseImgs, previos) {
        var coefs, combo, tries = 0;
        do {
          coefs = base.map(function () { return 0; });
          if (base.length === 1) coefs[0] = randChoice([-2, -1, 2, 3]);
          else {
            var idx = base.map(function (_, i) { return i; });
            for (var s = idx.length - 1; s > 0; s--) { var j = randInt(0, s); var t = idx[s]; idx[s] = idx[j]; idx[j] = t; }
            var usar = randInt(2, Math.min(3, base.length));
            for (var u = 0; u < usar; u++) coefs[idx[u]] = randChoice([-2, -1, 1, 1, 2]);
          }
          combo = new Array(n).fill(0);
          base.forEach(function (v, i) { for (var j2 = 0; j2 < n; j2++) combo[j2] += coefs[i] * v[j2]; });
          tries++;
        } while ((combo.every(function (x) { return x === 0; }) ||
                  previos.some(function (p) { return igual(p, combo); })) && tries < 100);
        var img = new Array(m).fill(0);
        baseImgs.forEach(function (w, i) { for (var j3 = 0; j3 < m; j3++) img[j3] += coefs[i] * w[j3]; });
        return { coefs: coefs, vec: combo, img: img };
      }

      if (kind === 'noexiste') {
        var base = buildIndep(Math.max(2, Math.min(n, randInt(2, n))));
        var baseImgs = base.map(function () { return randVec(m, -3, 3); });
        var c = combinar(base, baseImgs, base);
        var badImg = c.img.slice();
        badImg[randInt(0, m - 1)] += randNonZero(-3, 3);
        vecs = base.concat([c.vec]);
        imgs = baseImgs.concat([badImg]);
        dep = { coefs: c.coefs, goodImg: c.img, badImg: badImg };
      } else {
        // única: base de 𝕍 (k = n); infinitas: k < n vectores LI
        var k = kind === 'unica' ? n : randInt(1, n - 1);
        var base2 = buildIndep(k);
        var baseImgs2 = base2.map(function () { return randVec(m, -3, 3); });
        vecs = base2.slice();
        imgs = baseImgs2.slice();
        if (variante === 'ld') {
          // Uno o dos de más, sin pasar de 5 renglones en total.
          var cuantos = Math.min(randChoice([1, 1, 2]), 5 - k);
          for (var e = 0; e < cuantos; e++) {
            var c2 = combinar(base2, baseImgs2, vecs);
            vecs.push(c2.vec);
            imgs.push(c2.img);
            extras.push({ idx: vecs.length - 1, coefs: c2.coefs, img: c2.img });
          }
        }
      }
      return { vKey: vKey, wKey: wKey, n: n, m: m, vecs: vecs, imgs: imgs, kind: kind,
               variante: variante, dep: dep, extras: extras };
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
    function comboText(idx, coefs, nombre) {
      var parts = [];
      coefs.forEach(function (c, i) {
        if (c === 0) return;
        var abs = Math.abs(c);
        var piece = (abs === 1 ? '' : abs + '·') + nombre(i);
        parts.push({ neg: c < 0, piece: piece });
      });
      var s = '';
      parts.forEach(function (p, i) {
        if (i === 0) s += (p.neg ? '−' : '') + p.piece;
        else s += (p.neg ? ' − ' : ' + ') + p.piece;
      });
      return nombre(idx) + ' = ' + s;
    }
    function vName(i) { return 'v' + SUB[i]; }
    function tName(i) { return 'T(v' + SUB[i] + ')'; }
    function depText(cur) { return comboText(cur.vecs.length - 1, cur.dep.coefs, vName); }

    /* Vectores de más que SÍ respetan la linealidad:
       "v₄ = v₁ + 2·v₂, y el dato cumple T(v₄) = T(v₁) + 2·T(v₂) = (3, 1)" */
    function extrasText(cur) {
      return cur.extras.map(function (x) {
        return comboText(x.idx, x.coefs, vName) + ', y el dato cumple ' +
          comboText(x.idx, x.coefs, tName) + ' = ' + vecToPlain(cur.wKey, x.img);
      }).join('; ');
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
        var k = cur.vecs.length;
        var r = rank(transpose(cur.vecs));
        var conExtras = cur.extras && cur.extras.length > 0;
        var pre = correct ? '' : (real === 'unica' ? 'No es correcto: la TL existe y es única. '
          : real === 'infinitas' ? 'No es correcto: existen infinitas. '
          : 'No es correcto: no existe ninguna TL con esos datos. ');
        if (real === 'unica') {
          if (conExtras) {
            return pre + 'Los ' + k + ' vectores son LD, pero eso solo no dice que no exista: hay que ver si se respeta la linealidad. ' +
              'Fijate que ' + extrasText(cur) + ', así que al escalonar ' +
              (cur.extras.length === 1 ? 'queda una fila' : 'quedan filas') + ' de ceros. ' +
              'Los otros ' + cur.n + ' son LI (rango ' + r + ' = Dim(𝕍)), así que forman una base, y conocer la imagen de una base determina la TL por completo.';
          }
          return pre + 'Los ' + k + ' vectores son LI y generan 𝕍 (su rango es ' + r + ' y Dim(𝕍) = ' + cur.n +
            '), así que forman una base: conocer la imagen de una base determina la TL por completo.';
        }
        if (real === 'infinitas') {
          var falta = 'El rango de los vectores dados es ' + r + ' y Dim(𝕍) = ' + cur.n + ', así que ' +
            (cur.n - r === 1
              ? 'falta la imagen de un vector para completar una base de 𝕍, y esa imagen se puede elegir libremente'
              : 'faltan las imágenes de ' + (cur.n - r) + ' vectores para completar una base de 𝕍, y esas imágenes se pueden elegir libremente') +
            ': cada elección da una TL distinta.';
          if (conExtras) {
            return pre + 'Los ' + k + ' vectores son LD, pero las imágenes respetan esa dependencia: ' + extrasText(cur) +
              '. Al escalonar, eso da ' + (cur.extras.length === 1 ? 'una fila' : 'filas') + ' de ceros, así que la TL existe. ' + falta;
          }
          return pre + falta;
        }
        return pre + 'Fijate que ' + depText(cur) +
          ', y una TL conserva las combinaciones lineales, así que su imagen debería ser ' +
          vecToPlain(cur.wKey, cur.dep.goodImg) + '. Pero el dato dice ' + vecToPlain(cur.wKey, cur.dep.badImg) +
          ': al escalonar quedaría algo como T(0) ≠ 0, y eso no puede pasar en una TL.';
      }
    });
  })();

})();
