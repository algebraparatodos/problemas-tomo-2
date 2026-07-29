/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 6
   "¿Es LI o LD?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-6-es-li-o-ld.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u2a6')) return;
    var d = document.createElement('div');
    d.id = 'apt-u2a6';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }

    var DIM = { R2:2, R3:3, M22:4, P2:3 };

    function buildVectorsWithRank(d, n, r){
      var pivotCols = [];
      var last = -1;
      for(var i=0;i<r;i++){
        var col = randInt(last+1, d-(r-i));
        pivotCols.push(col);
        last = col;
      }
      var pivots = [];
      for(var i2=0;i2<r;i2++){
        var row = new Array(d).fill(0);
        row[pivotCols[i2]] = randNonZero(-4,4);
        for(var c=pivotCols[i2]+1;c<d;c++) row[c] = randInt(-4,4);
        pivots.push(row);
      }
      var combos = [];
      for(var k=0;k<n-r;k++){
        var coefs = pivots.map(function(){ return randChoice([-2,-1,-1,1,1,2]); });
        var row2 = new Array(d).fill(0);
        pivots.forEach(function(p,i3){ for(var c2=0;c2<d;c2++) row2[c2]+=coefs[i3]*p[c2]; });
        combos.push(row2);
      }
      var M = pivots.concat(combos);
      for(var i4=M.length-1;i4>0;i4--){ var j=randInt(0,i4); var t=M[i4]; M[i4]=M[j]; M[j]=t; }

      var numOps = randInt(3,6);
      for(var op=0; op<numOps; op++){
        var kind = randChoice(['add','add','scale']);
        if(kind==='add'){
          var ai=randInt(0,n-1), aj=randInt(0,n-1);
          while(aj===ai) aj=randInt(0,n-1);
          var kk=randChoice([-2,-1,1,2]);
          M[aj] = M[aj].map(function(v,c3){ return v + kk*M[ai][c3]; });
        } else {
          var si=randInt(0,n-1);
          var sk=randChoice([-1,1,-1,1,2]);
          M[si] = M[si].map(function(v){ return v*sk; });
        }
      }
      return M;
    }

    function generateCase(){
      var space = randChoice(['R2','R3','M22','P2']);
      var d = DIM[space];
      var wantLI = Math.random() < 0.5;
      var n, r;
      if(wantLI){ n = randInt(2, d); r = n; }
      else { n = randInt(2, d+1); r = randInt(1, Math.min(n-1, d)); }
      var vectors = buildVectorsWithRank(d, n, r);
      var isLI = (r === n);
      return { space:space, d:d, n:n, r:r, vectors:vectors, isLI:isLI };
    }

    var SPACE_LABEL = { R2:'V = \\mathbb{R}^2', R3:'V = \\mathbb{R}^3', M22:'V = M_{2\\times2}(\\mathbb{R})', P2:'V = P_2(\\mathbb{R})' };

    function polyToLatex(coefs){
      var terms = [];
      var labels = ['','x','x^2'];
      for(var i=2;i>=0;i--){
        var c = coefs[i];
        if(c===0) continue;
        var abs = Math.abs(c);
        var coefStr = (i===0) ? String(abs) : (abs===1 ? '' : String(abs));
        var term = coefStr + labels[i];
        if(terms.length===0) terms.push((c<0?'-':'') + term);
        else terms.push((c<0?' - ':' + ') + term);
      }
      return terms.length ? terms.join('') : '0';
    }
    function vectorToLatex(space, v){
      if(space==='R2') return '(' + v[0] + ',\\ ' + v[1] + ')';
      if(space==='R3') return '(' + v[0] + ',\\ ' + v[1] + ',\\ ' + v[2] + ')';
      if(space==='M22') return '\\begin{pmatrix}' + v[0] + ' & ' + v[1] + '\\\\ ' + v[2] + ' & ' + v[3] + '\\end{pmatrix}';
      return polyToLatex(v);
    }

    function setHTML(items, bigBraces){
      var braceCmd = bigBraces ? '\\bigg' : '';
      var brace = '<span style="margin:0 4px;">' + window.katex.renderToString(braceCmd + '\\{', { throwOnError:false }) + '</span>';
      var closeBrace = '<span style="margin:0 4px;">' + window.katex.renderToString(braceCmd + '\\}', { throwOnError:false }) + '</span>';
      var inner = items.map(function(latex, idx){
        var comma = idx < items.length-1 ? '<span style="margin-right:8px;">,</span>' : '';
        return '<span style="white-space:nowrap;">' + window.katex.renderToString(latex, { throwOnError:false }) + comma + '</span>';
      }).join('');
      return '<span style="display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;row-gap:8px;column-gap:4px;">' + brace + inner + closeBrace + '</span>';
    }

    function renderContent(container, current){
      var vectorLatexList = current.vectors.map(function(v){ return vectorToLatex(current.space, v); });
      container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;"><div class="row-v"></div><div class="row-g"></div><div class="row-q"></div></div>';
      window.katex.render(SPACE_LABEL[current.space], container.querySelector('.row-v'), { throwOnError:false });
      container.querySelector('.row-g').innerHTML =
        '<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;">' +
          window.katex.renderToString('G=', { throwOnError:false }) +
          setHTML(vectorLatexList, current.space==='M22') +
        '</span>';
      window.katex.render('\\text{¿G es LI o LD?}', container.querySelector('.row-q'), { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u2a6',
      mode: 'choices',
      needsKatex: true,
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: '¿Es LI o LD?',
      subtitle: 'Mirá el conjunto de vectores G. Comparando |G| (cuántos son) contra Rg(G) (el rango), ¿es linealmente independiente o dependiente?',

      generate: generateCase,
      renderContent: renderContent,
      choicesStacked: false,
      choices: [
        { value:'li', label:'LI' },
        { value:'ld', label:'LD' }
      ],
      check: function(current, value){ return (value==='li') === current.isLI; },
      explain: function(current, correct){
        var base = '|G| = ' + current.n + ', Rg(G) = ' + current.r + '.';
        if(correct){
          return current.isLI
            ? base + ' Como Rg(G) coincide con |G|, G es LI.'
            : base + ' Como Rg(G) es menor que |G|, G es LD.';
        }
        return current.isLI
          ? 'No es correcto: G sí es LI. ' + base + ' Como Rg(G) coincide con |G|, son independientes.'
          : 'No es correcto: G es LD. ' + base + ' Como Rg(G) es menor que |G|, hay dependencia lineal.';
      }
    });
  })();

})();
