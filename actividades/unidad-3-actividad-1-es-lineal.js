/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 1
   "¿Es lineal?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-3-actividad-1-es-lineal.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u3-a1')) return;
    var d = document.createElement('div');
    d.id = 'apt-u3-a1';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function () {
    'use strict';

    /* ---------- helpers ---------- */
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }

    /* ---------- espacios ----------
       Todo se representa como coordenadas en la base canónica.
       TEX = nombres de variable para KaTeX, UNI = para el feedback
       (el feedback nunca lleva LaTeX crudo). */
    var SPACES = {
      R2:  { dim: 2, tex: ['x', 'y'],             uni: ['x', 'y'],             label: '\\mathbb{R}^2' },
      R3:  { dim: 3, tex: ['x', 'y', 'z'],        uni: ['x', 'y', 'z'],        label: '\\mathbb{R}^3' },
      P2:  { dim: 3, tex: ['a_0', 'a_1', 'a_2'],  uni: ['a₀', 'a₁', 'a₂'],     label: 'P_2(\\mathbb{R})' },
      M22: { dim: 4, tex: ['a', 'b', 'c', 'd'],   uni: ['a', 'b', 'c', 'd'],   label: 'M_{2\\times2}(\\mathbb{R})' }
    };
    var SPACE_KEYS = ['R2', 'R3', 'P2', 'M22'];

    var DEFECTS = ['const', 'square', 'product', 'func', 'piecewise'];

    /* ---------- generador ----------
       maxTerms controla el ANCHO del enunciado: con matrices 2×2 en
       juego (dim 4) o con definición por tramos, la expresión se hace
       muy larga para un celular, así que ahí va un solo término por
       componente. Medido en Chromium a 320px. */
    function buildLinearForms(n, m, maxTerms) {
      var comps = [];
      for (var i = 0; i < m; i++) {
        var howMany = randInt(1, Math.min(maxTerms || 2, n));
        var pool = [];
        for (var k = 0; k < n; k++) pool.push(k);
        var idxs = shuffle(pool).slice(0, howMany);
        var terms = idxs.map(function (v) { return { coef: randNonZero(-3, 3), v: v }; });
        terms.sort(function (p, q) { return p.v - q.v; });
        comps.push({ terms: terms, konst: 0 });
      }
      return comps;
    }

    function generate() {
      var vKey = randChoice(SPACE_KEYS), wKey = randChoice(SPACE_KEYS);
      var n = SPACES[vKey].dim, m = SPACES[wKey].dim;
      var isLinear = Math.random() < 0.5;
      var defect = null, defectComp = null, defectVar = null, defectVar2 = null, defectFunc = null, branchB = null;

      if (!isLinear) {
        var pool = DEFECTS.filter(function (d) { return d !== 'product' || n >= 2; });
        defect = randChoice(pool);
      }
      var wide = (n >= 4 || m >= 4 || defect === 'piecewise');
      var comps = buildLinearForms(n, m, wide ? 1 : 2);

      if (!isLinear) {
        defectComp = randInt(0, m - 1);
        var target = comps[defectComp];
        if (defect === 'const') {
          target.konst = randNonZero(-5, 5);
        } else if (defect === 'square') {
          var t = randChoice(target.terms); t.pow = 2; defectVar = t.v;
        } else if (defect === 'product') {
          var t2 = randChoice(target.terms), other;
          do { other = randInt(0, n - 1); } while (other === t2.v);
          t2.mulWith = other; defectVar = t2.v; defectVar2 = other;
        } else if (defect === 'func') {
          var t3 = randChoice(target.terms);
          defectFunc = randChoice(['abs', 'sin', 'ln']);
          t3.fn = defectFunc; defectVar = t3.v;
        } else {
          branchB = buildLinearForms(n, m, 1);
          if (JSON.stringify(branchB) === JSON.stringify(comps)) {
            branchB[0].terms[0].coef = -branchB[0].terms[0].coef;
          }
        }
      }
      return { vKey: vKey, wKey: wKey, n: n, m: m, isLinear: isLinear, comps: comps,
               defect: defect, defectComp: defectComp, defectVar: defectVar,
               defectVar2: defectVar2, defectFunc: defectFunc, branchB: branchB };
    }

    /* ---------- render de la expresión analítica ---------- */
    function termToLatex(t, vars, isFirst) {
      var abs = Math.abs(t.coef);
      var sign = t.coef < 0 ? '-' : '+';
      var body = vars[t.v];
      if (t.fn === 'abs') body = '\\left|' + body + '\\right|';
      else if (t.fn === 'sin') body = '\\operatorname{sen}(' + body + ')';
      else if (t.fn === 'ln') body = '\\ln(' + body + ')';
      if (t.pow === 2) body = (t.fn ? '\\left(' + body + '\\right)' : body) + '^2';
      if (t.mulWith !== undefined) body = body + vars[t.mulWith];
      var coefStr = abs === 1 ? '' : String(abs);
      var head = isFirst ? (t.coef < 0 ? '-' : '') : (' ' + sign + ' ');
      return head + coefStr + body;
    }

    function compToLatex(comp, vars) {
      var out = '';
      comp.terms.forEach(function (t, i) { out += termToLatex(t, vars, i === 0); });
      if (comp.konst) out += (comp.konst < 0 ? ' - ' : ' + ') + Math.abs(comp.konst);
      return out || '0';
    }

    function elementToLatex(spaceKey, parts, needParens) {
      if (spaceKey === 'R2' || spaceKey === 'R3') return '\\left(' + parts.join(',\\ ') + '\\right)';
      if (spaceKey === 'M22') return '\\begin{pmatrix}' + parts[0] + ' & ' + parts[1] + '\\\\ ' + parts[2] + ' & ' + parts[3] + '\\end{pmatrix}';
      // P2 — envuelvo en paréntesis los coeficientes compuestos para que no se lea mal
      var w = parts.map(function (p) { return (needParens && /[+\-]\s/.test(p)) ? '\\left(' + p + '\\right)' : p; });
      return w[0] + ' + ' + w[1] + 'x + ' + w[2] + 'x^2';
    }

    function domainElementLatex(vKey) {
      var v = SPACES[vKey].tex;
      if (vKey === 'R2' || vKey === 'R3') return '\\left(' + v.join(',\\ ') + '\\right)';
      if (vKey === 'M22') return '\\begin{pmatrix}' + v[0] + ' & ' + v[1] + '\\\\ ' + v[2] + ' & ' + v[3] + '\\end{pmatrix}';
      return v[0] + ' + ' + v[1] + 'x + ' + v[2] + 'x^2';
    }

    function imageLatex(cur, comps) {
      var vars = SPACES[cur.vKey].tex;
      var parts = comps.map(function (c) { return compToLatex(c, vars); });
      return elementToLatex(cur.wKey, parts, true);
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
      var body;
      if (cur.defect === 'piecewise') {
        var firstVar = SPACES[cur.vKey].tex[0];
        body = 'T\\left(' + domainElementLatex(cur.vKey) + '\\right) = \\begin{cases}' +
          imageLatex(cur, cur.comps) + ' & \\text{si } ' + firstVar + ' > 0 \\\\[4pt]' +
          imageLatex(cur, cur.branchB) + ' & \\text{si } ' + firstVar + ' \\leq 0' +
          '\\end{cases}';
      } else {
        body = 'T\\left(' + domainElementLatex(cur.vKey) + '\\right) = ' + imageLatex(cur, cur.comps);
      }
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

    /* ---------- nombres en Unicode para el feedback ---------- */
    function componentName(wKey, idx) {
      if (wKey === 'P2') return ['el término independiente', 'el coeficiente de x', 'el coeficiente de x²'][idx];
      if (wKey === 'M22') return 'la entrada ' + ['(1,1)', '(1,2)', '(2,1)', '(2,2)'][idx];
      return ['la 1ª componente', 'la 2ª componente', 'la 3ª componente'][idx];
    }
    function funcName(f) {
      return { abs: 'un valor absoluto', sin: 'un seno', ln: 'un logaritmo' }[f];
    }

    function reasonText(cur) {
      var uni = SPACES[cur.vKey].uni;
      var where = componentName(cur.wKey, cur.defectComp);
      if (cur.defect === 'const') {
        return 'En ' + where + ' hay un término independiente, y eso rompe la linealidad. ' +
          'Se ve rápido con la condición necesaria: T del vector nulo tendría que dar el vector nulo, y acá no da.';
      }
      if (cur.defect === 'square') {
        return 'En ' + where + ' aparece ' + uni[cur.defectVar] + '², y un exponente distinto de 1 rompe la linealidad.';
      }
      if (cur.defect === 'product') {
        return 'En ' + where + ' aparece el producto ' + uni[cur.defectVar] + '·' + uni[cur.defectVar2] +
          ', y un producto entre variables rompe la linealidad.';
      }
      if (cur.defect === 'func') {
        return 'En ' + where + ' aparece ' + funcName(cur.defectFunc) + ' aplicado a ' + uni[cur.defectVar] +
          ', y las funciones no lineales rompen la linealidad.';
      }
      return 'Está definida por tramos, y las dos ramas no son la misma transformación. ' +
        'Al cambiar de rama, la regla deja de conservar las combinaciones lineales.';
    }

    var CAUSAS = [
      { value: 'const',     label: 'Tiene un término independiente' },
      { value: 'square',    label: 'Tiene un exponente distinto de 1' },
      { value: 'product',   label: 'Hay un producto entre variables' },
      { value: 'func',      label: 'Aparece una función no lineal' },
      { value: 'piecewise', label: 'Está definida por tramos' }
    ];

    /* ---------- arranque ---------- */
    AptActivity.init({
      mount: '#apt-u3-a1',
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: '¿Es lineal?',
      subtitle: 'Mirá la expresión analítica y decidí si la transformación es lineal.',
      nextLabel: 'Probar con otra transformación →',
      generate: generate,
      renderContent: renderContent,
      activePhaseCount: function (cur) { return cur.isLinear ? 1 : 2; },
      phases: [
        {
          mode: 'choices',
          question: '¿La transformación es lineal?',
          choices: [
            { value: 'si', label: 'Sí, es lineal' },
            { value: 'no', label: 'No, no es lineal' }
          ],
          check: function (cur, value) { return (value === 'si') === cur.isLinear; },
          explain: function (cur, correct) {
            // Si acertó y NO es lineal, no explico acá: la fase 2 pregunta
            // justamente cuál es el motivo, así que decirlo sería regalarlo.
            if (correct) {
              return cur.isLinear
                ? 'Cada componente es una combinación lineal de las variables: sin términos independientes, sin potencias, sin productos entre variables y sin funciones no lineales.'
                : '';
            }
            if (cur.isLinear) {
              return 'No es correcto: sí es lineal. Cada componente es una combinación lineal de las variables, ' +
                'sin términos independientes, potencias, productos entre variables ni funciones no lineales.';
            }
            return 'No es correcto: no es lineal. ' + reasonText(cur);
          }
        },
        {
          mode: 'choices',
          question: '¿Cuál es el motivo?',
          choicesStacked: true,
          choices: CAUSAS,
          check: function (cur, value) { return value === cur.defect; },
          explain: function (cur, correct) {
            if (correct) return reasonText(cur);
            return 'No es correcto. ' + reasonText(cur);
          }
        }
      ]
    });
  })();

})();
