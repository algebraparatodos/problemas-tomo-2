/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 15
   "Complemento ortogonal"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-15-complemento-ortogonal.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-complemento-ortogonal-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-complemento-ortogonal-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.16.5 "Complemento ortogonal". S^perp = núcleo
     de la matriz generadora de S (producto escalar estándar sobre
     coordenadas canónicas). Respuesta abierta (space-basis), con fase
     previa de "cuántos vectores" para no delatar la respuesta. */

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

  function choicesForCount(k, dim) {
    var candidates = [k];
    var deltas = [-2,-1,1,2,3];
    for (var di=0; di<deltas.length && candidates.length<4; di++){
      var v = k + deltas[di];
      if (v >= 1 && v <= dim && candidates.indexOf(v)===-1) candidates.push(v);
    }
    var filler = 1;
    while (candidates.length < Math.min(4, dim) && filler <= dim + 5) {
      if (filler !== k && candidates.indexOf(filler)===-1 && filler<=dim) candidates.push(filler);
      filler++;
    }
    var arr = candidates.slice(0,4);
    arr.sort(function(a,b){ return a-b; });
    return arr;
  }

  function generateCase() {
    var pool = [AptActivity.SPACES.R3, AptActivity.SPACES.R4, AptActivity.SPACES.M2x2, AptActivity.SPACES.M2x3, AptActivity.SPACES.M3x2, AptActivity.SPACES.P2, AptActivity.SPACES.P3];
    var space = pick(pool);
    var n = space.dim;
    var kMin = Math.max(1, n-3);
    var kMax = Math.min(3, n-1);
    var k = randInt(kMin, kMax);

    var Scoords = scramble(buildLiCoords(n, k), k);
    var Snative = Scoords.map(function(c){ return space.fromCoords(c); });

    var orthComplementCoords = nullSpaceBasis(Scoords);
    var orthComplementNative = orthComplementCoords.map(function(c){ return space.fromCoords(c); });
    var m = orthComplementCoords.length; // dim(S^perp) = n - k

    return {
      space: space, n: n, k: k, m: m,
      Snative: Snative,
      orthComplementNative: orthComplementNative,
      countOptions: choicesForCount(m, n)
    };
  }


    AptActivity.init({
      mount: '#apt-complemento-ortogonal-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Complemento ortogonal',
      subtitle: 'Te damos un conjunto generador de S. Encontrá una base de S⊥ (el complemento ortogonal de S).',
      needsKatex: true,
      generate: generateCase,
      renderContent: function (el, current) {
        var ambientLatex = AptActivity.renderSevAmbient(current.space, 'S');
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML = '<div class="apt-act__content-ambient"></div><div class="apt-sev-basis-wrap"></div>';
        window.katex.render(ambientLatex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderSevAsBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.Snative, 'S');
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Cuántos vectores tiene una base de S⊥?',
          choices: function (current) {
            return current.countOptions.map(function (n) { return { value: String(n), label: String(n) }; });
          },
          choicesStacked: false,
          check: function (current, value) { return Number(value) === current.m; },
          explain: function (current, correct) {
            return correct
              ? 'Correcto: la dimensión de S⊥ es ' + current.m + ' (dim V − dim S = ' + current.n + ' − ' + current.k + ').'
              : 'La dimensión real de S⊥ es ' + current.m + ' (dim V − dim S = ' + current.n + ' − ' + current.k + ').';
          }
        },
        {
          mode: 'space-basis',
          question: 'Escribí una base de S⊥ (no hace falta que coincida con una en particular).',
          count: function (current) { return current.m; },
          space: function (current) { return current.space; },
          getExpectedBasis: function (current) { return current.orthComplementNative; }
        }
      ]
    });
  })();

})();
