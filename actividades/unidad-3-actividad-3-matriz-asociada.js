/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 3
   "Armá la matriz asociada"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-3-actividad-3-matriz-asociada.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u3-a3')) return;
    var d = document.createElement('div');
    d.id = 'apt-u3-a3';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function () {
    'use strict';

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }

    var SPACES = {
      R2:  { dim: 2, tex: ['x', 'y'],            uni: ['x', 'y'],        label: '\\mathbb{R}^2' },
      R3:  { dim: 3, tex: ['x', 'y', 'z'],       uni: ['x', 'y', 'z'],   label: '\\mathbb{R}^3' },
      P2:  { dim: 3, tex: ['a_0', 'a_1', 'a_2'], uni: ['a₀', 'a₁', 'a₂'], label: 'P_2(\\mathbb{R})' },
      M22: { dim: 4, tex: ['a', 'b', 'c', 'd'],  uni: ['a', 'b', 'c', 'd'], label: 'M_{2\\times2}(\\mathbb{R})' }
    };
    var SPACE_KEYS = ['R2', 'R3', 'P2', 'M22'];

    /* Nombre del j-ésimo vector de la base canónica, en texto plano */
    function canonName(spaceKey, j) {
      if (spaceKey === 'R2') return ['(1, 0)', '(0, 1)'][j];
      if (spaceKey === 'R3') return ['(1, 0, 0)', '(0, 1, 0)', '(0, 0, 1)'][j];
      if (spaceKey === 'P2') return ['1', 'x', 'x²'][j];
      return ['E₁₁', 'E₁₂', 'E₂₁', 'E₂₂'][j];
    }

    /* ---------- generador ---------- */
    function buildLinearForms(n, m) {
      var comps = [];
      for (var i = 0; i < m; i++) {
        var howMany = randInt(1, Math.min(2, n));
        var pool = [];
        for (var k = 0; k < n; k++) pool.push(k);
        var idxs = shuffle(pool).slice(0, howMany);
        var terms = idxs.map(function (v) { return { coef: randNonZero(-3, 3), v: v }; });
        terms.sort(function (p, q) { return p.v - q.v; });
        comps.push({ terms: terms, konst: 0 });
      }
      return comps;
    }

    /* Solo pares cuyo producto de dimensiones no pase de 12 celdas
       (mismo orden de magnitud que "Matriz ampliada", 3x4). */
    var PAIRS = [];
    SPACE_KEYS.forEach(function (v) {
      SPACE_KEYS.forEach(function (w) {
        if (SPACES[v].dim * SPACES[w].dim <= 12) PAIRS.push([v, w]);
      });
    });

    function generate() {
      var pair = randChoice(PAIRS);
      var vKey = pair[0], wKey = pair[1];
      var n = SPACES[vKey].dim, m = SPACES[wKey].dim;
      var comps = buildLinearForms(n, m);
      var A = [];
      for (var i = 0; i < m; i++) {
        var row = new Array(n).fill(0);
        comps[i].terms.forEach(function (t) { row[t.v] = t.coef; });
        A.push(row);
      }
      return { vKey: vKey, wKey: wKey, n: n, m: m, comps: comps, A: A };
    }

    /* ---------- render ---------- */
    function compToLatex(comp, vars) {
      var out = '';
      comp.terms.forEach(function (t, i) {
        var abs = Math.abs(t.coef);
        var coefStr = abs === 1 ? '' : String(abs);
        if (i === 0) out += (t.coef < 0 ? '-' : '') + coefStr + vars[t.v];
        else out += (t.coef < 0 ? ' - ' : ' + ') + coefStr + vars[t.v];
      });
      return out || '0';
    }
    function elementToLatex(spaceKey, parts) {
      if (spaceKey === 'R2' || spaceKey === 'R3') return '\\left(' + parts.join(',\\ ') + '\\right)';
      if (spaceKey === 'M22') return '\\begin{pmatrix}' + parts[0] + ' & ' + parts[1] + '\\\\ ' + parts[2] + ' & ' + parts[3] + '\\end{pmatrix}';
      var w = parts.map(function (p) { return /[+\-]\s/.test(p) ? '\\left(' + p + '\\right)' : p; });
      return w[0] + ' + ' + w[1] + 'x + ' + w[2] + 'x^2';
    }
    function domainElementLatex(vKey) {
      var v = SPACES[vKey].tex;
      if (vKey === 'R2' || vKey === 'R3') return '\\left(' + v.join(',\\ ') + '\\right)';
      if (vKey === 'M22') return '\\begin{pmatrix}' + v[0] + ' & ' + v[1] + '\\\\ ' + v[2] + ' & ' + v[3] + '\\end{pmatrix}';
      return v[0] + ' + ' + v[1] + 'x + ' + v[2] + 'x^2';
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
      var vars = SPACES[cur.vKey].tex;
      var head = 'T: ' + SPACES[cur.vKey].label + ' \\to ' + SPACES[cur.wKey].label;
      var parts = cur.comps.map(function (c) { return compToLatex(c, vars); });
      var body = 'T\\left(' + domainElementLatex(cur.vKey) + '\\right) = ' + elementToLatex(cur.wKey, parts);
      container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;">' +
        '<div class="apt-row-head" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-row-body" style="width:100%;text-align:center;"></div></div>';
      var headEl = container.querySelector('.apt-row-head');
      var bodyEl = container.querySelector('.apt-row-body');
      window.katex.render(head, headEl, { throwOnError: false });
      window.katex.render(body, bodyEl, { throwOnError: false });
      fitToWidth(headEl);
      fitToWidth(bodyEl);
    }

    AptActivity.init({
      mount: '#apt-u3-a3',
      mode: 'grid',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Armá la matriz asociada',
      subtitle: 'Completá $M(T)$ en bases canónicas. En polinomios el orden es $1,\\ x,\\ x^2$; en matrices, $E_{11},\\ E_{12},\\ E_{21},\\ E_{22}$.',
      nextLabel: 'Probar con otra transformación →',
      generate: generate,
      renderContent: renderContent,
      grid: {
        rows: function (cur) { return cur.m; },
        cols: function (cur) { return cur.n; },
        noDivider: true
      },
      cellAriaLabel: function (cur, r, c) {
        return 'Fila ' + (r + 1) + ', columna ' + (c + 1);
      },
      checkGrid: function (cur, M, hasEmpty) {
        var status = [], wrong = [];
        for (var r = 0; r < cur.m; r++) {
          status.push([]);
          for (var c = 0; c < cur.n; c++) {
            var ok = M[r][c] === cur.A[r][c];
            status[r].push(ok ? 'correct' : 'wrong');
            if (!ok) wrong.push({ r: r, c: c, val: M[r][c] });
          }
        }
        var correct = wrong.length === 0;
        var text = '';
        if (correct) {
          text = 'Cada columna de M(T) son las coordenadas, en la base canónica de W, de la imagen del vector correspondiente de la base canónica de V.';
        }
        if (!correct) {
          var f = wrong[0];
          var puesto = (f.val === null) ? 'la dejaste vacía' : 'pusiste ' + f.val;
          text = 'La columna ' + (f.c + 1) + ' de M(T) son las coordenadas de T(' + canonName(cur.vKey, f.c) + '). ' +
            'En la fila ' + (f.r + 1) + ' de esa columna va ' + cur.A[f.r][f.c] + ', y ' + puesto + '.';
          if (wrong.length > 1) {
            text += ' Hay ' + (wrong.length - 1) + ' celda' + (wrong.length - 1 > 1 ? 's' : '') +
              ' más marcada' + (wrong.length - 1 > 1 ? 's' : '') + ' en rojo.';
          }
          if (hasEmpty) text += ' Ojo: si una variable no aparece, su coeficiente es 0 — hay que escribirlo.';
        }
        return { correct: correct, cellStatus: status, feedbackText: text };
      },
      getAnswerGrid: function (cur) { return cur.A; },
      answerTitle: 'La respuesta correcta',
      answerText: 'Cada columna j de M(T) son las coordenadas, en la base canónica de W, de la imagen del j-ésimo vector de la base canónica de V.'
    });
  })();

})();
