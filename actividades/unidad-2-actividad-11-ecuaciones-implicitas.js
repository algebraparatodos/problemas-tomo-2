/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 11
   "Ecuaciones implícitas desde un conjunto generador"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-11-ecuaciones-implicitas.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-ec-implicitas-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-ec-implicitas-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.14, listo para incrustar en la landing. */
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

  // núcleo de A (validado con 2000 simulaciones): base entera vía RREF + variables libres
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
        var coefAtFree = R[ri][freeCol];
        vec[pc] = F.fSub(F.Frac(0), coefAtFree);
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

  function makeDistractor(correctEquations, n) {
    var eqs = correctEquations.map(function(r){ return r.slice(); });
    var rowIdx = randInt(0, eqs.length-1);
    var nonZeroCols = [];
    eqs[rowIdx].forEach(function(v,i){ if (v!==0) nonZeroCols.push(i); });

    // 'sign' solo tiene sentido si la fila tiene 2+ entradas no nulas —
    // si tiene una sola, cambiarle el signo equivale a escalar toda la
    // ecuación por -1, que NUNCA cambia el conjunto solución.
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

  function eqSetsEqual(a, b) {
    if (a.length !== b.length) return false;
    var sa = a.map(function(r){ return r.join(','); }).sort();
    var sb = b.map(function(r){ return r.join(','); }).sort();
    return sa.every(function(v,i){ return v === sb[i]; });
  }

  function generateCase() {
    var space = AptActivity.randomSpace();
    var dim = space.dim;
    var k = randInt(1, Math.min(3, dim-1)); // tope 3 por UX mobile
    var generatorCoords = scramble(buildLiCoords(dim, k), k);
    var generatorNative = generatorCoords.map(function(c){ return space.fromCoords(c); });

    var correctEquations = nullSpaceBasis(generatorCoords);

    var distractors = [];
    for (var d=0; d<3; d++){
      var cand, tries=0, isDup;
      do {
        cand = makeDistractor(correctEquations, dim);
        tries++;
        isDup = equationsDescribeSameSpace(cand, generatorCoords) || distractors.some(function(prev){ return eqSetsEqual(prev, cand); });
      } while (isDup && tries < 25);
      distractors.push(cand);
    }

    var options = [correctEquations].concat(distractors);
    // shuffle
    for (var i=options.length-1;i>0;i--){ var j=randInt(0,i); var t=options[i]; options[i]=options[j]; options[j]=t; }
    var correctIndex = options.indexOf(correctEquations);

    return { space: space, dim: dim, k: k, generatorNative: generatorNative, options: options, correctIndex: correctIndex };
  }


    AptActivity.init({
      mount: '#apt-ec-implicitas-mount',
      mode: 'choices',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Ecuaciones implícitas',
      subtitle: 'Te damos un conjunto generador de S. Elegí el sistema de ecuaciones implícitas que lo describe.',
      needsKatex: true,
      choicesGrid: true,
      choicesGridSingleColumn: true,
      generate: generateCase,
      renderContent: function (el, current) {
        var ambientLatex = AptActivity.renderSevAmbient(current.space, 'S');
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML = '<div class="apt-act__content-ambient"></div><div class="apt-sev-basis-wrap"></div>';
        window.katex.render(ambientLatex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderSevAsBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.generatorNative, 'S');
      },
      choices: function (current) {
        return current.options.map(function (eqs, idx) {
          var latex = AptActivity.renderSevAsEquationsGrouped(current.space, eqs, 'S');
          var html = window.katex.renderToString(latex, { throwOnError: false });
          return { value: String(idx), label: html };
        });
      },
      check: function (current, value) { return Number(value) === current.correctIndex; },
      explain: function (current, correct) {
        return correct
          ? 'Correcto: ese sistema tiene exactamente como conjunto solución el subespacio generado por los vectores dados.'
          : 'No es correcto: ese sistema no describe el mismo subespacio (define un conjunto distinto de puntos).';
      }
    });
  })();

})();
