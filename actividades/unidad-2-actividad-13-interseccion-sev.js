/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 13
   "Intersección de subespacios"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-13-interseccion-de-subespacios.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-interseccion-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-interseccion-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.16.1-2 "Intersección de SEV". S y T siempre
     se muestran como conjunto generador. Fases fijas: ecuaciones de S,
     ecuaciones de T, base de la intersección. */

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

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

  function nullSpaceBasis(A) {
    var F = AptActivity.Frac;
    var n = A[0].length;
    var R = F.rref(F.intMatrixToFrac(A));
    var pivotOfRow = [], pivotCols = {};
    R.forEach(function(row){
      var p = -1;
      for (var c=0;c<n;c++){ if (!F.fIsZero(row[c])) { p=c; break; } }
      if (p !== -1) { pivotOfRow.push(p); pivotCols[p]=true; }
    });
    var freeCols = [];
    for (var c=0;c<n;c++) if (!pivotCols[c]) freeCols.push(c);
    var basis = [];
    freeCols.forEach(function(freeCol){
      var vec = new Array(n).fill(0).map(function(){ return F.Frac(0); });
      vec[freeCol] = F.Frac(1);
      for (var ri=0; ri<pivotOfRow.length; ri++){
        var pc = pivotOfRow[ri];
        vec[pc] = F.fSub(F.Frac(0), R[ri][freeCol]);
      }
      basis.push(F.fracRowToIntRow(vec));
    });
    return basis;
  }

  function equationsDescribeSameSpace(equations, generatorRows) {
    if (equations.length === 0) return false;
    var back = nullSpaceBasis(equations);
    if (back.length !== generatorRows.length) return false;
    return AptActivity.checkSpanEquivalence(back, generatorRows).ok;
  }
  function eqSetsEqual(a, b) {
    if (a.length !== b.length) return false;
    var sa = a.map(function(r){ return r.join(','); }).sort();
    var sb = b.map(function(r){ return r.join(','); }).sort();
    return sa.every(function(v,i){ return v === sb[i]; });
  }
  function makeEquationDistractor(correctEquations, n) {
    var eqs = correctEquations.map(function(r){ return r.slice(); });
    var rowIdx = randInt(0, eqs.length-1);
    var nonZeroCols = [];
    eqs[rowIdx].forEach(function(v,i){ if (v!==0) nonZeroCols.push(i); });
    var kinds = ['value', 'permute', 'drop-add-row'];
    if (nonZeroCols.length >= 2) kinds.push('sign');
    var kind = pick(kinds);
    if (kind === 'sign') {
      var colIdx = pick(nonZeroCols);
      eqs[rowIdx][colIdx] = -eqs[rowIdx][colIdx];
    } else if (kind === 'value') {
      var colIdx2 = randInt(0, n-1);
      eqs[rowIdx][colIdx2] += pick([-2,-1,1,2]);
    } else if (kind === 'permute' && n >= 2) {
      var a=randInt(0,n-1), b=randInt(0,n-1);
      while (b===a) b=randInt(0,n-1);
      var tmp = eqs[rowIdx][a]; eqs[rowIdx][a]=eqs[rowIdx][b]; eqs[rowIdx][b]=tmp;
    } else {
      if (eqs.length > 1) eqs = eqs.slice(0, eqs.length-1);
      else { var colIdx3 = randInt(0,n-1); eqs[0][colIdx3] += 1; }
    }
    return eqs;
  }
  function buildEquationOptions(officialGeneratorCoords) {
    var correctEquations = nullSpaceBasis(officialGeneratorCoords);
    var distractors = [];
    for (var d=0; d<3; d++){
      var cand, tries=0, isDup;
      do {
        cand = makeEquationDistractor(correctEquations, officialGeneratorCoords[0].length);
        tries++;
        isDup = equationsDescribeSameSpace(cand, officialGeneratorCoords) || distractors.some(function(prev){ return eqSetsEqual(prev, cand); });
      } while (isDup && tries < 25);
      distractors.push(cand);
    }
    var options = [correctEquations].concat(distractors);
    for (var i=options.length-1;i>0;i--){ var j=randInt(0,i); var t=options[i]; options[i]=options[j]; options[j]=t; }
    return { options: options, correctIndex: options.indexOf(correctEquations) };
  }

  // Construye S y T (subespacios de dim n) con intersección EXACTA de dim m
  function buildIntersectionCase(n, m, kS, kT) {
    for (var attempt=0; attempt<30; attempt++){
      var C = m > 0 ? scramble(buildLiCoords(n, m), m) : [];
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
      var S = extend(C, kS - m);
      var T = extend(C, kT - m);
      if (S.length !== kS || T.length !== kT) continue;

      var eqS = nullSpaceBasis(S);
      var eqT = nullSpaceBasis(T);
      var combined = eqS.concat(eqT);
      var intersectionBasis = nullSpaceBasis(combined);

      if (intersectionBasis.length === m) {
        var backCheckOk = m === 0 || AptActivity.checkSpanEquivalence(intersectionBasis, C).ok;
        if (backCheckOk) return { S: S, T: T, C: C, intersectionBasis: intersectionBasis };
      }
    }
    return null;
  }

  function generateCase() {
    var pool = [AptActivity.SPACES.R3, AptActivity.SPACES.R4, AptActivity.SPACES.M2x2, AptActivity.SPACES.M2x3, AptActivity.SPACES.M3x2, AptActivity.SPACES.P2, AptActivity.SPACES.P3];
    var space, n, m, kS, kT, result;
    var attempts = 0;
    do {
      space = pick(pool);
      n = space.dim;
      m = randInt(1, Math.min(2, n-2));
      var maxKS = Math.min(n-1, n+m-(m+1));
      kS = randInt(m+1, maxKS);
      var maxKT = Math.min(n-1, n+m-kS);
      kT = randInt(m+1, maxKT);
      result = buildIntersectionCase(n, m, kS, kT);
      attempts++;
    } while (!result && attempts < 20);

    var Snative = result.S.map(function(c){ return space.fromCoords(c); });
    var Tnative = result.T.map(function(c){ return space.fromCoords(c); });
    var intersectionNative = result.intersectionBasis.map(function(c){ return space.fromCoords(c); });

    var eqOptionsS = buildEquationOptions(result.S);
    var eqOptionsT = buildEquationOptions(result.T);

    return {
      space: space, n: n, m: m, kS: kS, kT: kT,
      Snative: Snative, Tnative: Tnative,
      intersectionNative: intersectionNative,
      eqOptionsS: eqOptionsS, eqOptionsT: eqOptionsT
    };
  }


    function equationChoices(current, eqOptions) {
      return eqOptions.options.map(function (eqs, idx) {
        var latex = AptActivity.renderSevAsEquationsGrouped(current.space, eqs, '');
        // renderSevAsEquationsGrouped devuelve "= { ... }" con nombre vacío;
        // se lo recortamos para no repetir "S =" o "T =" fuera de contexto acá.
        var html = window.katex.renderToString(latex.replace(/^\s*=\s*/, ''), { throwOnError: false });
        return { value: String(idx), label: html };
      });
    }

    AptActivity.init({
      mount: '#apt-interseccion-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Intersección de subespacios',
      subtitle: 'Te damos dos subespacios S y T. Encontrá sus ecuaciones y después una base de S ∩ T.',
      needsKatex: true,
      generate: generateCase,
      renderContent: function (el, current) {
        var ambientLatex = AptActivity.renderSevAmbient(current.space, 'S \\cap T \\subseteq');
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML =
          '<div class="apt-act__content-ambient"></div>' +
          '<div class="apt-sev-basis-wrap" style="margin-bottom:6px;"></div>' +
          '<div class="apt-sev-basis-wrap-2"></div>';
        window.katex.render('V = ' + current.space.labelTex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderSevAsBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.Snative, 'S');
        AptActivity.renderSevAsBasisWrapped(el.querySelector('.apt-sev-basis-wrap-2'), current.space, current.Tnative, 'T');
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Cuáles son las ecuaciones implícitas de S?',
          choicesGrid: true,
          choicesGridSingleColumn: true,
          choices: function (current) { return equationChoices(current, current.eqOptionsS); },
          check: function (current, value) { return Number(value) === current.eqOptionsS.correctIndex; },
          explain: function (current, correct) {
            return correct ? 'Correcto: ese sistema describe exactamente a S.' : 'No es correcto: ese sistema no describe el mismo subespacio que S.';
          }
        },
        {
          mode: 'choices',
          question: '¿Cuáles son las ecuaciones implícitas de T?',
          choicesGrid: true,
          choicesGridSingleColumn: true,
          choices: function (current) { return equationChoices(current, current.eqOptionsT); },
          check: function (current, value) { return Number(value) === current.eqOptionsT.correctIndex; },
          explain: function (current, correct) {
            return correct ? 'Correcto: ese sistema describe exactamente a T.' : 'No es correcto: ese sistema no describe el mismo subespacio que T.';
          }
        },
        {
          mode: 'space-basis',
          question: 'Escribí una base de S ∩ T (no hace falta que coincida con una en particular).',
          count: function (current) { return current.m; },
          space: function (current) { return current.space; },
          getExpectedBasis: function (current) { return current.intersectionNative; }
        }
      ]
    });
  })();

})();
