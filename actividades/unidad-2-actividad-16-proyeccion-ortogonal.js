/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 16
   "Proyección ortogonal"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-16-proyeccion-ortogonal.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-proyeccion-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-proyeccion-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.17 "Proyección ortogonal". Respuesta única
     y exacta (space-basis con exactMatch:true, count=1). k<=3 tanto por
     UX como por seguridad numérica (fracciones exactas pueden crecer
     mucho con k grande). Reintenta hasta encontrar x tal que la
     proyección dé coordenadas enteras. */

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
  function fracMatMul(A, B) {
    var F = AptActivity.Frac;
    var n = A.length, m = B[0].length, k = B.length;
    var out = [];
    for (var i=0;i<n;i++){
      var row = [];
      for (var j=0;j<m;j++){
        var s = F.Frac(0);
        for (var t=0;t<k;t++) s = F.fAdd(s, F.fMul(toFrac(A[i][t]), toFrac(B[t][j])));
        row.push(s);
      }
      out.push(row);
    }
    return out;
  }
  function transpose(M){ var n=M.length, m=M[0].length; var out=[]; for (var r=0;r<m;r++){ var row=[]; for (var c=0;c<n;c++) row.push(M[c][r]); out.push(row); } return out; }

  function orthogonalProjection(basisRows, x) {
    var n = basisRows[0].length, k = basisRows.length;
    var A = [];
    for (var r=0;r<n;r++){ var row=[]; for (var c=0;c<k;c++) row.push(basisRows[c][r]); A.push(row); }
    var At = transpose(A);
    var AtA = fracMatMul(At, A);
    var AtA_inv = fracMatrixInverse(AtA);
    var xCol = x.map(function(v){ return [AptActivity.Frac.Frac(v)]; });
    var Atx = fracMatMul(At, xCol);
    var coefs = fracMatMul(AtA_inv, Atx);
    var proj = fracMatMul(A, coefs);
    return proj.map(function(row){ return row[0]; });
  }
  function isSafeFrac(f) { return Number.isSafeInteger(f.n) && Number.isSafeInteger(f.d); }

  function generateCase() {
    var pool = [AptActivity.SPACES.R3, AptActivity.SPACES.R4, AptActivity.SPACES.M2x2, AptActivity.SPACES.M2x3, AptActivity.SPACES.M3x2, AptActivity.SPACES.P2, AptActivity.SPACES.P3];
    var space, n, k, S, x, proj, tries = 0;
    do {
      space = pick(pool);
      n = space.dim;
      k = randInt(1, Math.min(3, n-1));
      S = scramble(buildLiCoords(n, k), k);
      x = Array.from({length:n}, function(){ return randInt(-5,5); });
      proj = orthogonalProjection(S, x);
      tries++;
    } while ((!proj.every(function(f){ return f.d === 1; }) || !proj.every(isSafeFrac)) && tries < 40);

    var projInt = proj.map(function(f){ return f.n; }); // d===1 garantizado acá

    var Snative = S.map(function(c){ return space.fromCoords(c); });
    var xNative = space.fromCoords(x);
    var projNative = space.fromCoords(projInt);

    return { space: space, n: n, k: k, Snative: Snative, xNative: xNative, projNative: projNative };
  }


    AptActivity.init({
      mount: '#apt-proyeccion-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Proyección ortogonal',
      subtitle: 'Te damos un conjunto generador de S y un vector x. Encontrá la proyección ortogonal de x sobre S.',
      needsKatex: true,
      generate: generateCase,
      renderContent: function (el, current) {
        var ambientLatex = AptActivity.renderSevAmbient(current.space, 'S');
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML =
          '<div class="apt-act__content-ambient"></div>' +
          '<div class="apt-sev-basis-wrap" style="margin-bottom:8px;"></div>' +
          '<div class="apt-proy-x"></div>';
        window.katex.render(ambientLatex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderSevAsBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.Snative, 'S');
        window.katex.render('x = ' + current.space.toKatex(current.xNative), el.querySelector('.apt-proy-x'), { throwOnError:false });
      },
      phases: [
        {
          mode: 'space-basis',
          question: 'Encontrá la proyección ortogonal de x sobre S.',
          count: function () { return 1; },
          space: function (current) { return current.space; },
          exactMatch: true,
          answerLabel: 'projₛ',
          getExpectedBasis: function (current) { return [current.projNative]; },
          explain: function (current, correct) {
            return correct ? '¡Correcto!' : 'No es correcto: esa no es la proyección ortogonal de x sobre S.';
          }
        }
      ]
    });
  })();

})();
