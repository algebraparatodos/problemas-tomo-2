/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 17
   "Método de Gram-Schmidt"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-17-gram-schmidt.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-gram-schmidt-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-gram-schmidt-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.18 "Gram-Schmidt", con la notación del
     libro: de la base C = {a₁, a₂, a₃} se pasa a la base ortogonal
     G = {g₁, g₂, g₃} y de ahí a la ortonormal U, con Uᵢ = gᵢ/‖gᵢ‖.
     Fases (hasta 3): g₁, g₂, g₃ en orden -- si el alumno se equivoca en
     un paso, el siguiente sigue trabajando con el valor correcto. g₁ = a₁
     se pide exacto; g₂ y g₃ aceptan cualquier múltiplo no nulo, porque el
     libro cambia la norma de gᵢ para sacar fracciones (2.18.1).

     Espacios: ℝ³, ℝ⁴, M₂ₓ₂(ℝ), P₂(ℝ) y P₃(ℝ), los que usa el libro. */

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  /* Los polinomios, de menor a mayor grado, como los escribe el libro
     (1 − x, 1 + x − 2x³). Se cambia sólo cómo se muestran. */
  function polyAsc(sp){
    var o = {}; for (var key in sp) o[key] = sp[key];
    o.toKatex = function (v) {
      var parts = [];
      for (var k = 0; k < v.length; k++) {
        var c = v[k]; if (c === 0) continue;
        var abs = Math.abs(c);
        var term = k === 0 ? String(abs) : (abs === 1 ? '' : String(abs)) + (k === 1 ? 'x' : 'x^{' + k + '}');
        parts.push(parts.length === 0 ? (c < 0 ? '-' : '') + term : (c < 0 ? ' - ' : ' + ') + term);
      }
      return parts.length ? parts.join('') : '0';
    };
    return o;
  }
  var POOL = [AptActivity.SPACES.R3, AptActivity.SPACES.R4, AptActivity.SPACES.M2x2,
              polyAsc(AptActivity.SPACES.P2), polyAsc(AptActivity.SPACES.P3)];

  function pickPivotCols(dim,k){
    var chosen = []; var last = -1;
    for (var i=0;i<k;i++){
      var remaining = dim - last - 1 - (k - i - 1);
      var next = randInt(last+1, last+remaining);
      chosen.push(next); last = next;
    }
    return chosen;
  }
  function buildLiCoords(dim, k) {
    var cols = pickPivotCols(dim, k);
    var rows = [];
    for (var i=0;i<k;i++){
      var row = new Array(dim).fill(0);
      var p = cols[i];
      var pivotVal = randInt(-4,4); while(pivotVal===0) pivotVal = randInt(-4,4);
      row[p] = pivotVal;
      for (var c=p+1;c<dim;c++) row[c] = randInt(-3,3);
      rows.push(row);
    }
    return rows;
  }
  function scramble(rows, k) {
    var M = rows.map(function(r){ return r.slice(); });
    var ops = randInt(2,4);
    for (var o=0;o<ops;o++){
      if (k<2) break;
      var kind = randInt(0,2);
      var a=randInt(0,k-1), b=randInt(0,k-1);
      if (kind===0 && a!==b){ var t=M[a]; M[a]=M[b]; M[b]=t; }
      else if (kind===1 && a!==b){ var s=randInt(-2,2)||1; M[b]=M[b].map(function(v,c){ return v+s*M[a][c]; }); }
      else { var s2=[-1,1,2][randInt(0,2)]; M[a]=M[a].map(function(v){ return v*s2; }); }
    }
    return M;
  }

  function gramSchmidt(vectors) {
    var F = AptActivity.Frac;
    var n = vectors[0].length;
    var us = [];
    vectors.forEach(function(v){
      var u = v.map(function(x){ return F.Frac(x); });
      us.forEach(function(prevU){
        var dotUV = F.Frac(0), dotUU = F.Frac(0);
        for (var c=0;c<n;c++){
          dotUV = F.fAdd(dotUV, F.fMul(prevU[c], F.Frac(v[c])));
          dotUU = F.fAdd(dotUU, F.fMul(prevU[c], prevU[c]));
        }
        var coef = F.fDiv(dotUV, dotUU);
        u = u.map(function(x,c){ return F.fSub(x, F.fMul(coef, prevU[c])); });
      });
      us.push(u);
    });
    return us;
  }
  function isSafeFrac(f) { return Number.isSafeInteger(f.n) && Number.isSafeInteger(f.d); }

  /* ---------- La fase final: normalizar ----------

     La base ortogonal sale con coordenadas enteras, pero al dividir cada
     gᵢ por su norma aparecen raíces: ‖gᵢ‖ = √(suma de los cuadrados).
     (En el código, Uc/Ucoords/Unative son los gᵢ ortogonales.)
     Las celdas de la grilla no aceptan raíces, así que el último paso es
     de opción múltiple, como en «Hallá M(T⁻¹)» de la U3.

     Cada vector de una opción se guarda como (1/√m)·w, con m entero y w
     de coordenadas enteras. Así dos opciones que se escriben distinto
     pero valen lo mismo se reconocen por su clave y nunca quedan dos
     iguales en pantalla. Los distractores son los errores típicos:
       - dividir por ‖gᵢ‖² en vez de por ‖gᵢ‖           (m = ‖gᵢ‖⁴)
       - normalizar los vectores de C, que no son ortogonales
       - «olvidarse» de los cuadrados: √(Σ|xᵢ|) como norma
       - normalizar sólo g₁ y dejar los demás como estaban
       - dividir cada gᵢ por la norma de otro */
  function sqNorm(c) { return c.reduce(function (s, x) { return s + x * x; }, 0); }
  function absSum(c) { return c.reduce(function (s, x) { return s + Math.abs(x); }, 0); }

  // √m = a·√b con b libre de cuadrados.
  function simplifySqrt(m) {
    var a = 1, b = m;
    for (var p = 2; p * p <= b; p++) {
      while (b % (p * p) === 0) { b /= p * p; a *= p; }
    }
    return { a: a, b: b };
  }
  function sqrtTex(m) {
    var s = simplifySqrt(m);
    if (s.b === 1) return String(s.a);
    return (s.a === 1 ? '' : s.a) + '\\sqrt{' + s.b + '}';
  }
  // El factor 1/√m en LaTeX ('' si m = 1).
  function factorTex(m) {
    if (m === 1) return '';
    return '\\dfrac{1}{' + sqrtTex(m) + '}';
  }
  // ‖u‖ en texto plano: «√50 = 5√2», «√6», «3».
  function normText(m) {
    var s = simplifySqrt(m);
    if (s.b === 1) return (s.a === 1 && m === 1) ? '1' : ('√' + m + ' = ' + s.a);
    return '√' + m + (s.a === 1 ? '' : ' = ' + s.a + '√' + s.b);
  }

  function scaledTex(space, m, coords) {
    var f = factorTex(m);
    var body = space.toKatex(space.fromCoords(coords));
    if (!f) return body;
    // Un polinomio multiplicado por el factor va siempre entre paréntesis:
    // sin ellos «½ 2x²» se lee mal.
    if (space.family === 'poly') body = '\\left(' + body + '\\right)';
    return f + '\\,' + body;
  }

  function optionKey(vecs) {
    return vecs.map(function (v) { return v.m + ':' + v.c.join(','); }).join('|');
  }

  function buildNormOptions(Vc, Uc) {
    var k = Uc.length;
    var sq = Uc.map(sqNorm);
    var correct = Uc.map(function (u, i) { return { m: sq[i], c: u }; });

    var candidatos = [
      { tipo: 'cuadrado', vecs: Uc.map(function (u, i) { return { m: sq[i] * sq[i], c: u }; }) },
      { tipo: 'base-original', vecs: Vc.map(function (v) { return { m: sqNorm(v), c: v }; }) },
      { tipo: 'sin-cuadrados', vecs: Uc.map(function (u) { return { m: absSum(u), c: u }; }) },
      { tipo: 'solo-el-primero', vecs: Uc.map(function (u, i) { return { m: i === 0 ? sq[0] : 1, c: u }; }) },
      { tipo: 'norma-de-otro', vecs: Uc.map(function (u, i) { return { m: sq[(i + 1) % k], c: u }; }) }
    ];

    var vistos = [optionKey(correct)];
    var elegidos = [{ tipo: 'ok', vecs: correct }];
    shuffle(candidatos).forEach(function (c) {
      if (elegidos.length >= 4) return;
      var key = optionKey(c.vecs);
      if (vistos.indexOf(key) !== -1) return;
      vistos.push(key);
      elegidos.push(c);
    });
    return elegidos.length >= 4 ? shuffle(elegidos) : null;
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = randInt(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* El generador sortea hasta dar con un caso que cierre: base ortogonal
     entera (las fases de g₂ y g₃ piden enteros), números chicos y cuatro
     opciones distintas para la normalización. Nunca devuelve un caso que
     no cumpla todo eso (el generador anterior, si a los 80 intentos no
     daba con una base entera, seguía con la última; en 20.000 rondas
     simuladas no pasó nunca, pero ahora tampoco puede pasar). */
  var MAX_ENTRADA = 12, MAX_NORMA2 = 150;
  function generateCase() {
    for (var tries = 0; tries < 20000; tries++) {
      var space = pick(POOL);
      var n = space.dim;
      var k = randInt(2, Math.min(3, n));
      var V = scramble(buildLiCoords(n, k), k);
      var U = gramSchmidt(V);
      if (!U.every(function(u){ return u.every(function(f){ return f.d === 1 && isSafeFrac(f); }); })) continue;

      var Uint = U.map(function(u){ return u.map(function(f){ return f.n; }); });
      if (Uint.some(function (u) { return u.every(function (x) { return x === 0; }); })) continue;
      if (Uint.some(function (u) { return u.some(function (x) { return Math.abs(x) > MAX_ENTRADA; }) || sqNorm(u) > MAX_NORMA2; })) continue;
      // Si los gᵢ ya tienen norma 1 no hay nada que normalizar.
      if (Uint.every(function (u) { return sqNorm(u) === 1; })) continue;

      var opciones = buildNormOptions(V, Uint);
      if (!opciones) continue;

      var Vnative = V.map(function(c){ return space.fromCoords(c); });
      var Unative = Uint.map(function(c){ return space.fromCoords(c); });

      return { space: space, n: n, k: k, Vnative: Vnative, Unative: Unative, Ucoords: Uint, normOptions: opciones };
    }
    return null;
  }


    var SUBSCRIPTS = ['₀','₁','₂','₃'];

    function revealU(current, idx, contentEl) {
      var host = contentEl.querySelector('.apt-gs-found');
      var line = document.createElement('div');
      line.className = 'apt-gs-u-line';
      var label = document.createElement('span');
      label.textContent = 'g' + SUBSCRIPTS[idx + 1] + ' = ';
      var katexSpan = document.createElement('span');
      line.appendChild(label);
      line.appendChild(katexSpan);
      host.appendChild(line);
      window.katex.render(current.space.toKatex(current.Unative[idx]), katexSpan, { throwOnError: false });
    }

    // La fórmula del libro para gᵢ, con los gⱼ anteriores.
    function formulaTex(idx) {
      var i = idx + 1;
      var tex = 'g_{' + i + '} = a_{' + i + '}';
      for (var j = 1; j < i; j++) {
        tex += ' - \\dfrac{a_{' + i + '} \\cdot g_{' + j + '}}{g_{' + j + '} \\cdot g_{' + j + '}}\\, g_{' + j + '}';
      }
      return tex;
    }

    function makePhase(idx) {
      var gi = 'g' + SUBSCRIPTS[idx + 1];
      return {
        mode: 'space-basis',
        question: idx === 0
          ? 'Encontrá el primer vector de la base ortogonal, $g_1$. Como en el libro, el primero se conserva: $g_1 = a_1$, el primer vector de C.'
          : 'Encontrá $' + formulaTex(idx) + '$. Si te quedan fracciones, podés multiplicarlo para sacarlas, como en el libro.',
        count: function () { return 1; },
        space: function (current) { return current.space; },
        exactMatch: idx === 0,
        answerLabel: gi,
        // La fase de g₃ sólo va cuando hay tres vectores (engine v5.1).
        skip: function (current) { return idx >= current.k; },
        getExpectedBasis: function (current) { return [current.Unative[idx]]; },
        explain: function (current, correct) {
          if (idx === 0) return correct ? '¡Correcto!' : 'No es correcto: g₁ es el primer vector de C, tal cual.';
          if (correct) return '¡Correcto! (Si pusiste un múltiplo de ' + gi + ', también vale: sólo importa que sea ortogonal a los anteriores. Se sigue con el ' + gi + ' que aparece arriba.)';
          return 'No es correcto: ese vector no es ' + gi + ' (ni un múltiplo suyo). Revisá los productos escalares de la fórmula.';
        },
        onAnswered: function (current, correct, value, contentEl) {
          if (correct) revealU(current, idx, contentEl);
        }
      };
    }

    /* Cada opción es la base entera: un renglón por vector, que baja de
       línea si no entra en el ancho del teléfono. */
    /* Como el libro: U = { ... }, con cada vector ya dividido por su norma. */
    function normOptionHtml(current, opt) {
      var n = opt.vecs.length;
      var items = opt.vecs.map(function (v, i) {
        // Cada vector va en su propio KaTeX (para que bajen de línea), así
        // que la llave se abre con \left\{ ... \right. y se cierra con
        // \left. ... \right\}: queda del alto del vector que acompaña.
        var body = scaledTex(current.space, v.m, v.c);
        var tex = i === 0 ? 'U = \\left\\{\\, ' + body + ' \\right.' : (i === n - 1 ? '\\left. ' + body + ' \\,\\right\\}' : body);
        if (i < n - 1) tex += ',';
        return '<span style="white-space:nowrap;">' + window.katex.renderToString(tex, { throwOnError: false }) + '</span>';
      });
      return '<span style="display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;column-gap:10px;row-gap:8px;">' +
        items.join('') + '</span>';
    }

    function normasTexto(current) {
      return current.Ucoords.map(function (u, i) {
        return '‖g' + SUBSCRIPTS[i + 1] + '‖ = ' + normText(sqNorm(u));
      }).join(', ');
    }

    var POR_QUE_NO = {
      'cuadrado': 'Esa opción divide por el cuadrado de la norma y no por la norma: así los vectores no quedan de norma 1.',
      'base-original': 'Esa opción normaliza los vectores de la base C que te dimos, y esos no son ortogonales entre sí: hay que normalizar la base ortogonal G que encontraste.',
      'sin-cuadrados': 'En esa opción la norma está mal calculada: es la raíz de la suma de los cuadrados de las coordenadas, no de sus valores absolutos.',
      'solo-el-primero': 'Esa opción normaliza sólo a g₁: hay que dividir a cada vector por su propia norma.',
      'norma-de-otro': 'En esa opción cada vector está dividido por la norma de otro: cada uno va dividido por su propia norma.'
    };

    var normPhase = {
      mode: 'choices',
      question: 'Último paso: dividí cada vector de G por su norma, $U_i = \\dfrac{g_i}{\\lVert g_i \\rVert}$. ¿Cuál es la base ortonormal U?',
      choicesGrid: true,
      choicesGridSingleColumn: true,
      choices: function (current) {
        return current.normOptions.map(function (o, i) {
          return { value: o.tipo === 'ok' ? 'ok' : o.tipo, label: normOptionHtml(current, o) };
        });
      },
      check: function (current, value) { return value === 'ok'; },
      explain: function (current, correct, value) {
        var base = 'Cada vector de la base ortogonal G se divide por su norma, que es la raíz de la suma de los cuadrados de sus coordenadas: ' +
          normasTexto(current) + '. Así los vectores, además de ortogonales, quedan de norma 1.';
        if (correct) return '¡Correcto! ' + base;
        return 'No es correcto. ' + (POR_QUE_NO[value] ? POR_QUE_NO[value] + ' ' : '') + base;
      }
    };

    AptActivity.init({
      mount: '#apt-gram-schmidt-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Método de Gram-Schmidt',
      subtitle: 'Te damos una base C = {a₁, a₂, …} de S. Aplicá Gram-Schmidt para encontrar, paso a paso, la base ortogonal G = {g₁, g₂, …}, y al final normalizala para llegar a la base ortonormal U.',
      needsKatex: true,
      generate: function () {
        var caso = generateCase();
        while (!caso) caso = generateCase();
        return caso;
      },
      renderContent: function (el, current) {
        var ambientLatex = '\\mathbb{V} = ' + current.space.labelTex;
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML =
          '<div class="apt-act__content-ambient"></div>' +
          '<div class="apt-sev-basis-wrap" style="margin-bottom:8px;"></div>' +
          '<div class="apt-gs-found"></div>';
        window.katex.render(ambientLatex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.Vnative, 'C');
      },
      phases: [ makePhase(0), makePhase(1), makePhase(2), normPhase ]
    });
  })();

})();
