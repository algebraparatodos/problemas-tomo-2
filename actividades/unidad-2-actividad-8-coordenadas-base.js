/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 8
   "Coordenadas de un vector en una base"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-8-coordenadas-en-una-base.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u2a8')) return;
    var d = document.createElement('div');
    d.id = 'apt-u2a8';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }

    var DIM = { R2:2, R3:3, M22:4, P2:3 };

    function buildBasis(d){
      var pivotCols = [];
      var last = -1;
      for(var i=0;i<d;i++){
        var col = randInt(last+1, d-(d-i));
        pivotCols.push(col);
        last = col;
      }
      var rows = [];
      for(var i2=0;i2<d;i2++){
        var row = new Array(d).fill(0);
        row[pivotCols[i2]] = randNonZero(-4,4);
        for(var c=pivotCols[i2]+1;c<d;c++) row[c] = randInt(-3,3);
        rows.push(row);
      }
      var M = rows;
      for(var i3=M.length-1;i3>0;i3--){ var j=randInt(0,i3); var t=M[i3]; M[i3]=M[j]; M[j]=t; }
      var numOps = randInt(3,6);
      for(var op=0; op<numOps; op++){
        var kind = randChoice(['add','add','scale']);
        if(kind==='add'){
          var ai=randInt(0,d-1), aj=randInt(0,d-1);
          while(aj===ai) aj=randInt(0,d-1);
          var kk=randChoice([-2,-1,1,2]);
          M[aj] = M[aj].map(function(v,c2){ return v + kk*M[ai][c2]; });
        } else {
          var si=randInt(0,d-1);
          var sk=randChoice([-1,1,-1,1,2]);
          M[si] = M[si].map(function(v){ return v*sk; });
        }
      }
      return M;
    }

    function combine(basis, coefs){
      var d = basis[0].length;
      var v = new Array(d).fill(0);
      basis.forEach(function(b,i){ for(var c=0;c<d;c++) v[c] += coefs[i]*b[c]; });
      return v;
    }

    function generateCase(){
      var space = randChoice(['R2','R3','M22','P2']);
      var d = DIM[space];
      var basis = buildBasis(d);
      var coefs = [];
      for(var i=0;i<d;i++) coefs.push(randInt(-5,5));
      var v = combine(basis, coefs);
      return { space:space, d:d, basis:basis, v:v, coefs:coefs };
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
      var basisLatexList = current.basis.map(function(b){ return vectorToLatex(current.space, b); });
      var vLatex = vectorToLatex(current.space, current.v);
      container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;"><div class="row-v"></div><div class="row-b"></div><div class="row-vec"></div><div class="row-q"></div></div>';
      window.katex.render(SPACE_LABEL[current.space], container.querySelector('.row-v'), { throwOnError:false });
      container.querySelector('.row-b').innerHTML =
        '<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;">' +
          window.katex.renderToString('B=', { throwOnError:false }) +
          setHTML(basisLatexList, current.space==='M22') +
        '</span>' +
        '<div style="font-family:var(--font-mono,monospace);font-size:11px;color:var(--ink-soft,#A7ACC0);margin-top:6px;">(B es base de V)</div>';
      window.katex.render('v = ' + vLatex, container.querySelector('.row-vec'), { throwOnError:false });
      window.katex.render('\\text{Encontrá las coordenadas de } v \\text{ en la base } B.', container.querySelector('.row-q'), { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u2a8',
      mode: 'grid',
      needsKatex: true,
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Coordenadas de un vector en una base',
      subtitle: 'Dados $v$ y una base $B$ de $V$, encontrá las coordenadas $[v]_B$ — los coeficientes que arman $v$ como combinación lineal de $B$.',
      grid: { rows: function(current){ return current.d; }, cols: 1, noDivider: true, label: '[v]_B =' },

      generate: generateCase,
      renderContent: renderContent,
      checkGrid: function(current, M, hasEmpty){
        if(hasEmpty) return { correct:false, feedbackText:'Dejaste alguna celda vacía.' };
        var reconstructed = combine(current.basis, M.map(function(row){ return row[0]; }));
        var ok = true;
        for(var i=0;i<current.d;i++) if(reconstructed[i] !== current.v[i]) ok = false;
        if(ok) return { correct:true, feedbackText:'' };
        return { correct:false, feedbackText:'No es correcto: esos coeficientes no reconstruyen v. Planteá v = c₁b₁+...+c' + current.d + 'b' + current.d + ' y resolvé el sistema.' };
      },
      getAnswerGrid: function(current){ return current.coefs.map(function(c){ return [c]; }); }
    });
  })();

})();
