/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 14
   "Suma de subespacios / suma directa"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-14-suma-de-subespacios.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-suma-sev-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-suma-sev-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.16.4 "Suma de SEV usando bases". Como en el
     libro, calcular la suma es dar una base de S + T: se juntan B(S) y
     B(T) y se escalona. Tres fases: Dim(S + T), una base de S + T
     (cualquier base vale) y si la suma es directa (Grassmann).

     Espacios: ℝ³, ℝ⁴ (el del ejemplo del libro), M₂ₓ₂(ℝ) y P₂(ℝ), los
     que usa el libro. Dim(S + T) queda en 3 como mucho, para que la base
     se pueda escribir cómoda en un teléfono. */

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  /* Los polinomios, de menor a mayor grado, como los escribe el libro.
     Se cambia sólo cómo se muestran, no las coordenadas. */
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
  var POOL = [AptActivity.SPACES.R3, AptActivity.SPACES.R4, AptActivity.SPACES.M2x2, polyAsc(AptActivity.SPACES.P2)];
  var MAX_DIM_SUMA = 3;

  function rankOf(rows){ return AptActivity.Frac.rankOf(AptActivity.Frac.intMatrixToFrac(rows)); }
  // Base de S + T sacada de B(S) ∪ B(T): se queda con cada vector que
  // sube el rango (los demás son combinación de los anteriores).
  function sumBasis(rows){
    var out = [];
    rows.forEach(function(v){ if (rankOf(out.concat([v])) === out.length + 1) out.push(v); });
    return out;
  }

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

  function choicesFor(correct, min, max) {
    var candidates = [correct];
    var deltas = [-2,-1,1,2,3];
    for (var di=0; di<deltas.length && candidates.length<4; di++){
      var v = correct + deltas[di];
      if (v >= min && v <= max && candidates.indexOf(v)===-1) candidates.push(v);
    }
    var filler = min;
    while (candidates.length < Math.min(4, max-min+1) && filler <= max) {
      if (filler !== correct && candidates.indexOf(filler)===-1) candidates.push(filler);
      filler++;
    }
    var arr = candidates.slice(0,4);
    arr.sort(function(a,b){ return a-b; });
    return arr;
  }

  // Otra base del mismo subespacio: combinaciones de las filas (o un
  // múltiplo, si es un solo vector).
  function mezclar(rows) {
    if (rows.length >= 2) return scramble(rows, rows.length);
    var s = pick([-1, 2, -2]);
    return rows.map(function (r) { return r.map(function (x) { return s * x; }); });
  }

  // Construye S, T de dim kS, kT. wantDirect controla si se fuerza
  // intersección trivial (suma directa) o se comparte un núcleo (no directa).
  function buildSumCase(n, kS, kT, wantDirect) {
    for (var attempt=0; attempt<30; attempt++){
      var S, T;
      if (wantDirect) {
        // S y T completamente independientes entre sí (generados aparte)
        S = scramble(buildLiCoords(n, kS), kS);
        T = scramble(buildLiCoords(n, kT), kT);
      } else {
        var m = randInt(1, Math.min(kS, kT)); // dim del núcleo compartido forzado
        var C = scramble(buildLiCoords(n, m), m);
        function extend(base, extraCount) {
          var full = base.map(function(r){ return r.slice(); });
          var tries = 0;
          while (full.length < base.length + extraCount && tries < 50) {
            tries++;
            var cand = new Array(n).fill(0).map(function(){ return randInt(-3,3); });
            var test = full.concat([cand]);
            if (AptActivity.Frac.rankOf(AptActivity.Frac.intMatrixToFrac(test)) === test.length) full = test;
          }
          return full;
        }
        S = extend(C, kS - m);
        T = extend(C, kT - m);
        if (S.length !== kS || T.length !== kT) continue;
        // Que el vector compartido no aparezca idéntico en las dos bases
        // (la intersección no tiene que quedar a la vista).
        S = mezclar(S); T = mezclar(T);
        var repetido = S.some(function (s) { return T.some(function (t) { return s.join() === t.join(); }); });
        if (repetido) continue;
      }

      var combined = S.concat(T);
      var dimSum = AptActivity.Frac.rankOf(AptActivity.Frac.intMatrixToFrac(combined));
      var isDirect = dimSum === kS + kT;

      if (isDirect === wantDirect) return { S: S, T: T, dimSum: dimSum, isDirect: isDirect };
    }
    return null;
  }

  function generateCase() {
    var space, n, kS, kT, wantDirect, result;
    for (var attempts = 0; attempts < 1000; attempts++) {
      result = null;
      space = pick(POOL);
      n = space.dim;
      kS = randInt(1, Math.min(3, n-1));
      kT = randInt(1, Math.min(3, n-1));
      wantDirect = Math.random() < 0.5;
      // si se quiere NO directa, hace falta n suficiente para alojar kS+kT-m <= n con m>=1
      if (!wantDirect && kS + kT - 1 > n) continue;
      // si se quiere directa, hace falta que kS+kT <= n (si no, es imposible que sea directa)
      if (wantDirect && kS + kT > n) continue;
      result = buildSumCase(n, kS, kT, wantDirect);
      if (result && result.dimSum <= MAX_DIM_SUMA) break;
    }
    if (!result || result.dimSum > MAX_DIM_SUMA) return null;

    var Snative = result.S.map(function(c){ return space.fromCoords(c); });
    var Tnative = result.T.map(function(c){ return space.fromCoords(c); });
    var sumCoords = sumBasis(result.S.concat(result.T));

    return {
      space: space, n: n, kS: kS, kT: kT,
      Snative: Snative, Tnative: Tnative,
      dimSum: result.dimSum, isDirect: result.isDirect,
      dimInter: kS + kT - result.dimSum,
      sumBasisNative: sumCoords.map(function(c){ return space.fromCoords(c); }),
      dimSumOptions: choicesFor(result.dimSum, 1, n)
    };
  }

  function grassmannTex(current){
    return '\\operatorname{Dim}(S \\cap T) = \\operatorname{Dim}(S) + \\operatorname{Dim}(T) - \\operatorname{Dim}(S + T) = ' +
      current.kS + ' + ' + current.kT + ' - ' + current.dimSum + ' = ' + current.dimInter;
  }


    AptActivity.init({
      mount: '#apt-suma-sev-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Suma de subespacios',
      subtitle: 'Te damos una base de S y una de T. Calculá la suma S + T (su dimensión y una base) y decidí si la suma es directa.',
      needsKatex: true,
      generate: function () {
        var caso = generateCase();
        while (!caso) caso = generateCase();
        return caso;
      },
      renderContent: function (el, current) {
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML =
          '<div class="apt-act__content-ambient"></div>' +
          '<div class="apt-sev-basis-wrap" style="margin-bottom:6px;"></div>' +
          '<div class="apt-sev-basis-wrap-2"></div>';
        window.katex.render('\\mathbb{V} = ' + current.space.labelTex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.Snative, 'B(S)');
        AptActivity.renderBasisWrapped(el.querySelector('.apt-sev-basis-wrap-2'), current.space, current.Tnative, 'B(T)');
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Cuál es Dim(S + T)?',
          choices: function (current) {
            return current.dimSumOptions.map(function (n) { return { value: String(n), label: String(n) }; });
          },
          choicesStacked: false,
          check: function (current, value) { return Number(value) === current.dimSum; },
          explain: function (current, correct) {
            var porque = 'La matriz con los ' + (current.kS + current.kT) + ' vectores de B(S) y B(T) en filas tiene rango ' +
              current.dimSum + ', así que Dim(S + T) = ' + current.dimSum + '.';
            return correct ? 'Correcto. ' + porque : 'No es correcto. ' + porque;
          }
        },
        {
          mode: 'space-basis',
          question: 'Escribí una base de S + T (no hace falta que coincida con una en particular).',
          count: function (current) { return current.dimSum; },
          space: function (current) { return current.space; },
          getExpectedBasis: function (current) { return current.sumBasisNative; },
          explain: function (current, correct, res) {
            if (correct) return '¡Correcto! Es una base válida de S + T (no hacía falta que coincidiera con una en particular).';
            var reason = res && res.reason;
            var why = reason === 'not-independent'
              ? 'Los vectores que pusiste no son LI entre sí, así que no forman una base.'
              : reason === 'not-in-span'
                ? 'Alguno de los vectores que pusiste no pertenece a S + T.'
                : 'No es una base de S + T.';
            var parts = current.sumBasisNative.map(function (v) { return current.space.toKatex(v); });
            return why + ' Por ejemplo, quedándote con los vectores de B(S) ∪ B(T) que no son combinación de los anteriores: ' +
              window.katex.renderToString('B(S + T) = \\left\\{ ' + parts.join(',\\ ') + ' \\right\\}', { throwOnError: false }) +
              '. También valen las filas no nulas de la matriz escalonada.';
          }
        },
        {
          mode: 'choices',
          question: '¿La suma S + T es directa?',
          choices: [
            { value: 'si', label: 'Sí' },
            { value: 'no', label: 'No' }
          ],
          check: function (current, value) { return (value === 'si') === current.isDirect; },
          explain: function (current, correct) {
            var conclusion = current.isDirect
              ? 'Como Dim(S ∩ T) = 0, la suma es directa: S ⊕ T.'
              : 'Como Dim(S ∩ T) ≠ 0, la suma no es directa.';
            return (correct ? '¡Correcto! ' : 'No es correcto. ') + 'Por la fórmula de Grassmann, ' +
              window.katex.renderToString(grassmannTex(current), { throwOnError: false }) + '. ' + conclusion;
          }
        }
      ]
    });
  })();

})();
