/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 7
   "Solución paramétrica"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-7-solucion-parametrica.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a7')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a7';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    var VARS = ['x','y','z','t','u'];

    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

    // ---------- Fracciones exactas (para chequear independencia lineal) ----------
    function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=b; b=a%b; a=t; } return a||1; }
    function Frac(n,d){
      if(d===undefined) d=1;
      if(d<0){ n=-n; d=-d; }
      var g = gcd(n,d);
      return { n: g? n/g : 0, d: g? d/g : 1 };
    }
    function fSub(a,b){ return Frac(a.n*b.d - b.n*a.d, a.d*b.d); }
    function fMul(a,b){ return Frac(a.n*b.n, a.d*b.d); }
    function fDiv(a,b){ return Frac(a.n*b.d, a.d*b.n); }
    function fIsZero(a){ return a.n === 0; }

    function rref(matrixOfFrac){
      var M = matrixOfFrac.map(function(r){ return r.slice(); });
      var rows = M.length, cols = M[0].length;
      var lead = 0;
      for(var r=0;r<rows;r++){
        if(lead>=cols) break;
        var i=r;
        while(fIsZero(M[i][lead])){
          i++;
          if(i===rows){ i=r; lead++; if(lead===cols) return M; }
        }
        var tmp=M[i]; M[i]=M[r]; M[r]=tmp;
        var pivot = M[r][lead];
        M[r] = M[r].map(function(v){ return fDiv(v,pivot); });
        for(var i2=0;i2<rows;i2++){
          if(i2!==r){
            var factor = M[i2][lead];
            if(!fIsZero(factor)){
              M[i2] = M[i2].map(function(v,c){ return fSub(v, fMul(factor, M[r][c])); });
            }
          }
        }
        lead++;
      }
      return M;
    }
    function rankOfIntRows(rows){
      var fm = rows.map(function(r){ return r.map(function(x){ return Frac(x,1); }); });
      var R = rref(fm);
      return R.filter(function(row){ return row.some(function(v){ return !fIsZero(v); }); }).length;
    }

    // ---------- Generador ----------
    function choosePivotCols(numVars, rank){
      var idx = Array.from({length:numVars}, function(_,i){ return i; });
      for(var i=idx.length-1;i>0;i--){
        var j = randInt(0,i);
        var t = idx[i]; idx[i]=idx[j]; idx[j]=t;
      }
      return idx.slice(0,rank).sort(function(a,b){ return a-b; });
    }

    function generateSystem(){
      var dof = randChoice([1,2,3]);
      var maxRank = 5 - dof;
      var rank = randInt(1, maxRank);
      var numVars = rank + dof;
      var pivotCols = choosePivotCols(numVars, rank);
      var freeCols = Array.from({length:numVars}, function(_,i){ return i; }).filter(function(c){ return pivotCols.indexOf(c) === -1; });

      var M = [];
      for(var r=0;r<rank;r++){
        var row = new Array(numVars+1).fill(0);
        row[pivotCols[r]] = 1;
        freeCols.forEach(function(fc){ row[fc] = randInt(-4,4); });
        row[numVars] = randInt(-6,6);
        M.push(row);
      }

      var p = new Array(numVars).fill(0);
      pivotCols.forEach(function(pc,r){ p[pc] = M[r][numVars]; });

      var dirs = freeCols.map(function(fc){
        var v = new Array(numVars).fill(0);
        v[fc] = 1;
        pivotCols.forEach(function(pc,r){ v[pc] = -M[r][fc]; });
        return v;
      });

      return { numVars:numVars, rank:rank, dof:dof, pivotCols:pivotCols, freeCols:freeCols, M:M, p:p, dirs:dirs };
    }

    // ---------- Chequeo matemático ----------
    function evalRow(rowCoeffs, vec){
      var s = 0;
      for(var c=0;c<vec.length;c++) s += rowCoeffs[c]*vec[c];
      return s;
    }
    function particularOk(sys, p){
      return sys.M.every(function(row){ return evalRow(row.slice(0,sys.numVars), p) === row[sys.numVars]; });
    }
    function homogeneousOk(sys, v){
      return sys.M.every(function(row){ return evalRow(row.slice(0,sys.numVars), v) === 0; });
    }

    // ---------- Render de la matriz (KaTeX, con las variables como cabecera) ----------
    function systemLatex(current){
      var n = current.numVars;
      var rows = current.M.map(function(row){
        return row.slice(0,n).join(' & ') + ' & ' + row[n];
      }).join(' \\\\ ');
      return '\\left(\\begin{array}{' + new Array(n+1).join('c') + '|c}' + rows + '\\end{array}\\right)';
    }

    // ---------- Textos ----------
    function explainGdl(current, correct){
      var freeNames = current.freeCols.map(function(c){ return VARS[c]; }).join(', ');
      if(correct) return 'Las columnas sin pivote (' + freeNames + ') son las variables libres — ese es el grado de libertad del sistema.';
      return 'No es correcto. Las variables libres son ' + freeNames + ': hay ' + current.dof + ' columna' + (current.dof>1?'s':'') + ' sin pivote, así que el sistema tiene ' + current.dof + ' grado' + (current.dof>1?'s':'') + ' de libertad.';
    }

    function explainSolution(current, pOk, homOks, collectiveIssue, hasEmpty){
      if(hasEmpty) return 'Dejaste alguna celda vacía (se tomó como 0 para revisar) — completá todas antes de comprobar la próxima vez.';
      var allHom = homOks.every(Boolean);
      if(pOk && allHom && !collectiveIssue) return '¡Correcto! Tu solución particular verifica el sistema, y cada vector dirección resuelve el sistema homogéneo. Juntos describen todas las soluciones posibles.';
      var parts = [];
      if(!pOk) parts.push('la solución particular no verifica el sistema (revisá que, al multiplicarla por cada fila de la matriz, dé el término independiente)');
      var badIdx = homOks.map(function(ok,i){ return ok ? null : i; }).filter(function(i){ return i!==null; });
      if(badIdx.length){
        var labels = badIdx.map(function(i){ return VARS[current.freeCols[i]]; }).join(', ');
        parts.push('el vector que acompaña a ' + labels + ' no es correcto');
      }
      if(collectiveIssue) parts.push('tus vectores sí resuelven el sistema homogéneo, pero entre todos no llegan a cubrir todos los grados de libertad — revisá que no hayas puesto el mismo vector (o un múltiplo de él) para más de un parámetro');
      return 'No es correcto: ' + parts.join('; ') + '.';
    }

    window.AptActivity.init({
      mount: '#apt-u1a7',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Solución paramétrica',
      subtitle: 'El sistema es compatible indeterminado (SCI). Primero decidí cuántos grados de libertad tiene.',
      nextLabel: 'Probar con otro sistema →',
      needsKatex: true,
      mode: 'phases',
      generate: generateSystem,
      renderContent: function(container, current){
        window.katex.render(systemLatex(current), container, { throwOnError:false });
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Cuántos grados de libertad tiene este sistema?',
          choices: [
            { value:1, label:'1', sub:'grado de libertad' },
            { value:2, label:'2', sub:'grados de libertad' },
            { value:3, label:'3', sub:'grados de libertad' }
          ],
          check: function(current, value){ return value === current.dof; },
          explain: function(current, correct){ return explainGdl(current, correct); }
        },
        {
          mode: 'vectors',
          question: 'Completá la solución general:<br><small style="font-size:12px;font-style:italic;opacity:.85;">La solución no es única: puede haber otra solución particular distinta a la tuya, y tus vectores pueden ser distintos a los de otra persona y aun así estar bien, siempre que verifiquen el sistema.</small>',
          vectors: {
            rows: function(current){ return current.numVars; },
            count: function(current){ return current.dof; },
            hasParticular: true,
            paramLabel: function(current, i){ return VARS[current.freeCols[i]]; }
          },
          checkVectors: function(current, particularVals, vectorVals, hasEmpty){
            var pOk = particularOk(current, particularVals);
            var homOks = vectorVals.map(function(v){ return homogeneousOk(current, v); });
            var allHom = homOks.every(Boolean);
            var dirsOk = false, collectiveIssue = false;
            if(allHom){
              var rk = rankOfIntRows(vectorVals);
              dirsOk = rk === current.dof;
              collectiveIssue = !dirsOk;
            }
            var correct = pOk && dirsOk && !hasEmpty;
            return {
              correct: correct,
              particularStatus: hasEmpty ? null : (pOk ? 'correct' : 'wrong'),
              vectorStatuses: homOks.map(function(ok){
                if(hasEmpty) return null;
                if(!ok) return 'wrong';
                if(collectiveIssue) return null;
                return 'correct';
              }),
              feedbackText: explainSolution(current, pOk, homOks, collectiveIssue, hasEmpty)
            };
          },
          getAnswerVectors: function(current){
            return { particular: current.p, vectors: current.dirs };
          },
          answerTitle: 'Una respuesta posible',
          answerText: 'La solución particular y los vectores no son únicos — esta es una posibilidad válida. Cualquier otra que verifique el sistema, con un vector distinto para cada grado de libertad, también vale.'
        }
      ]
    });
  })();

})();
