/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 12
   "Cambio de base en un SEV"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-12-cambio-de-base-en-un-sev.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-cambio-base-sev-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-cambio-base-sev-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.15 "Cambio de base en un SEV", listo para
     incrustar en la landing. Respuesta tipo test. */

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

  function toFrac(v){ var F=AptActivity.Frac; return (v && typeof v === 'object' && 'n' in v) ? v : F.Frac(v); }
  function matEqual(A,B){
    var F = AptActivity.Frac;
    var n = A.length;
    for (var r=0;r<n;r++) for (var c=0;c<n;c++) if (!F.fEquals(toFrac(A[r][c]), toFrac(B[r][c]))) return false;
    return true;
  }
  function transpose(M){ var n=M.length; var out=[]; for (var r=0;r<n;r++){ var row=[]; for (var c=0;c<n;c++) row.push(M[c][r]); out.push(row); } return out; }
  function fracMatrixInverse(M) {
    var F = AptActivity.Frac;
    var n = M.length;
    var A = M.map(function(row){ return row.map(function(v){ return toFrac(v); }); });
    var I = [];
    for (var i=0;i<n;i++){ var row=[]; for (var j=0;j<n;j++) row.push(F.Frac(i===j?1:0)); I.push(row); }
    for (var col=0; col<n; col++){
      var piv = -1;
      for (var r=col; r<n; r++){ if (!F.fIsZero(A[r][col])) { piv=r; break; } }
      if (piv===-1) return null;
      var tmpA=A[col]; A[col]=A[piv]; A[piv]=tmpA;
      var tmpI=I[col]; I[col]=I[piv]; I[piv]=tmpI;
      var pivotVal = A[col][col];
      A[col] = A[col].map(function(v){ return F.fDiv(v, pivotVal); });
      I[col] = I[col].map(function(v){ return F.fDiv(v, pivotVal); });
      for (var r2=0;r2<n;r2++){
        if (r2===col) continue;
        var factor = A[r2][col];
        if (F.fIsZero(factor)) continue;
        A[r2] = A[r2].map(function(v,c){ return F.fSub(v, F.fMul(factor, A[col][c])); });
        I[r2] = I[r2].map(function(v,c){ return F.fSub(v, F.fMul(factor, I[col][c])); });
      }
    }
    return I;
  }
  function fracMatrixToKatex(M) {
    var rows = M.map(function(row){
      return row.map(function(v){
        var vv = toFrac(v);
        if (vv.d === 1) return String(vv.n);
        var sign = vv.n < 0 ? '-' : '';
        return sign + '\\frac{' + Math.abs(vv.n) + '}{' + vv.d + '}';
      }).join(' & ');
    }).join(' \\\\ ');
    return '\\begin{pmatrix} ' + rows + ' \\end{pmatrix}';
  }

  // Resuelve x (k valores) tal que x1*b1+...+xk*bk = v (v garantizado en el span de basisRows)
  function solveInBasis(basisRows, v) {
    var F = AptActivity.Frac;
    var k = basisRows.length;
    var n = basisRows[0].length;
    var augmented = [];
    for (var i=0;i<n;i++){
      var row = basisRows.map(function(b){ return F.Frac(b[i]); });
      row.push(F.Frac(v[i]));
      augmented.push(row);
    }
    var R = F.rref(augmented);
    var x = [];
    for (var j=0;j<k;j++) x.push(R[j][k]);
    return x;
  }

  // P (k x k): columna i = coords de B[i] en B'
  function changeOfBasisInSubspace(B, Bp) {
    var k = B.length;
    var cols = B.map(function(b){ return solveInBasis(Bp, b); });
    var P = [];
    for (var r=0;r<k;r++){ var row=[]; for (var c=0;c<k;c++) row.push(cols[c][r]); P.push(row); }
    return P;
  }

  function makeDistractor(kind, P, reversedP) {
    var F = AptActivity.Frac;
    var n = P.length;
    if (kind === 'inverse') return fracMatrixInverse(P);
    if (kind === 'transpose') return transpose(P);
    if (kind === 'reversed-order') return reversedP;
    var cand = P.map(function(row){ return row.map(function(v){ var f=toFrac(v); return { n: f.n, d: f.d }; }); });
    var r = randInt(0, n-1), c = randInt(0, n-1);
    cand[r][c] = F.fAdd(toFrac(cand[r][c]), F.Frac(pick([-2,-1,1,2])));
    return cand;
  }

  function generateCase() {
    var pool = [AptActivity.SPACES.R3, AptActivity.SPACES.R4, AptActivity.SPACES.M2x2, AptActivity.SPACES.M2x3, AptActivity.SPACES.M3x2, AptActivity.SPACES.P2, AptActivity.SPACES.P3];
    var space = pick(pool);
    var n = space.dim;
    var k = randInt(1, Math.min(3, n-1)); // subespacio propio, tope 3 por UX

    var officialBase = scramble(buildLiCoords(n, k), k);

    function randomBasisOfS() {
      var attempt, tries=0;
      do {
        var coeffMatrix = [];
        for (var i=0;i<k;i++){ var row=[]; for (var j=0;j<k;j++) row.push(randInt(-3,3)); coeffMatrix.push(row); }
        attempt = coeffMatrix.map(function(coefRow){
          var v = new Array(n).fill(0);
          officialBase.forEach(function(b,idx){ b.forEach(function(val,c){ v[c] += coefRow[idx]*val; }); });
          return v;
        });
        tries++;
      } while (AptActivity.Frac.rankOf(AptActivity.Frac.intMatrixToFrac(attempt)) !== k && tries < 30);
      return attempt;
    }

    var Bcoords = randomBasisOfS();
    var Bpcoords = randomBasisOfS();
    var basisB = Bcoords.map(function(c){ return space.fromCoords(c); });
    var basisBp = Bpcoords.map(function(c){ return space.fromCoords(c); });

    var P = changeOfBasisInSubspace(Bcoords, Bpcoords);
    var reversedP = changeOfBasisInSubspace(Bpcoords, Bcoords);

    var kinds = ['inverse','transpose','reversed-order'];
    var distractors = [];
    for (var d=0; d<3; d++){
      var cand, tries2=0, bad;
      do {
        cand = makeDistractor(tries2 < 5 ? kinds[d] : 'perturb', P, reversedP);
        tries2++;
        bad = matEqual(cand, P) || distractors.some(function(prev){ return matEqual(prev, cand); });
      } while (bad && tries2 < 25);
      distractors.push(cand);
    }

    var options = [P].concat(distractors);
    for (var i=options.length-1;i>0;i--){ var j=randInt(0,i); var t=options[i]; options[i]=options[j]; options[j]=t; }
    var correctIndex = options.indexOf(P);

    return { space: space, n: n, k: k, basisB: basisB, basisBp: basisBp, options: options, correctIndex: correctIndex };
  }


    AptActivity.init({
      mount: '#apt-cambio-base-sev-mount',
      mode: 'choices',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Cambio de base en un SEV',
      subtitle: 'B y B\' son dos bases de un mismo subespacio S. Elegí la matriz de cambio de base de B a B\'.',
      needsKatex: true,
      choicesGrid: true,
      choicesGridSingleColumn: true,
      generate: generateCase,
      renderContent: function (el, current) {
        var ambientLatex = AptActivity.renderSevAmbient(current.space, 'S');
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML =
          '<div class="apt-act__content-ambient"></div>' +
          '<div class="apt-sev-basis-wrap" style="margin-bottom:6px;"></div>' +
          '<div class="apt-sev-basis-wrap-2"></div>';
        window.katex.render(ambientLatex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.basisB, 'B');
        AptActivity.renderBasisWrapped(el.querySelector('.apt-sev-basis-wrap-2'), current.space, current.basisBp, "B'");
      },
      choices: function (current) {
        return current.options.map(function (P, idx) {
          var latex = 'P_{B \\to B\'} = ' + fracMatrixToKatex(P);
          var html = window.katex.renderToString(latex, { throwOnError: false });
          return { value: String(idx), label: html };
        });
      },
      check: function (current, value) { return Number(value) === current.correctIndex; },
      explain: function (current, correct) {
        return correct
          ? 'Correcto: esa matriz convierte coordenadas en B a coordenadas en B\', dentro de S.'
          : 'No es correcto: esa matriz no convierte correctamente las coordenadas de B a B\'.';
      }
    });
  })();

})();
