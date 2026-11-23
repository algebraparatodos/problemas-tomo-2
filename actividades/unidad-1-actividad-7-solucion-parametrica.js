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
    // Como en los ejemplos del libro (p. 35-37): 4 incógnitas x, y, z, t
    // y 1 o 2 variables libres.
    var VARS = ['x','y','z','t'];
    var NUM_VARS = 4;

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
    /* Columnas libres: la primera columna (x) siempre lleva pivote, como en
       el libro; las libres se eligen entre y, z, t. Los pivotes son las
       columnas restantes, en orden creciente (fila r → pivote r-ésimo). */
    function chooseFreeCols(numVars, dof){
      var idx = Array.from({length:numVars-1}, function(_,i){ return i+1; });
      for(var i=idx.length-1;i>0;i--){
        var j = randInt(0,i);
        var t = idx[i]; idx[i]=idx[j]; idx[j]=t;
      }
      return idx.slice(0,dof).sort(function(a,b){ return a-b; });
    }

    /* Matriz escalonada reducida de verdad:
       - cada fila tiene su pivote (un 1) más a la derecha que la anterior;
       - en la columna de cada pivote, todo lo demás es 0;
       - una columna libre sólo puede tener números en las filas cuyo pivote
         está a su izquierda (en las filas de abajo, que empiezan después,
         tiene que haber 0).
       Además cada columna libre tiene algún número distinto de 0, para que
       la variable libre aparezca en la solución. */
    function generateSystem(){
      var numVars = NUM_VARS;
      var dof = randChoice([1,2]);
      var rank = numVars - dof;
      var freeCols, M, pivotCols;
      do {
        freeCols = chooseFreeCols(numVars, dof);
        pivotCols = Array.from({length:numVars}, function(_,i){ return i; }).filter(function(c){ return freeCols.indexOf(c) === -1; });
        M = [];
        for(var r=0;r<rank;r++){
          var row = new Array(numVars+1).fill(0);
          row[pivotCols[r]] = 1;
          freeCols.forEach(function(fc){ if(fc > pivotCols[r]) row[fc] = randInt(-4,4); });
          row[numVars] = randInt(-6,6);
          M.push(row);
        }
      } while(!freeCols.every(function(fc){ return M.some(function(row){ return row[fc] !== 0; }); }));

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
    /* Como en el libro, arriba de cada columna va su incógnita. Para que la
       cabecera quede alineada con la matriz, todas las celdas (cabecera y
       matriz) tienen el mismo ancho fijo; las dos filas van centradas, y los
       paréntesis son simétricos, así que las columnas coinciden. */
    function cell(tex){ return '\\hphantom{-}\\mathclap{' + tex + '}\\hphantom{-}'; }
    function systemLatex(current){
      var n = current.numVars;
      var header = VARS.slice(0,n).map(cell).join(' & ') + ' & ' + cell('');
      var rows = current.M.map(function(row){
        return row.map(function(v){ return cell(String(v)); }).join(' & ');
      }).join(' \\\\ ');
      var spec = new Array(n+1).join('c');
      return '\\begin{array}{c}' +
        '\\begin{array}{' + spec + 'c}' + header + '\\end{array} \\\\[-2pt]' +
        '\\left(\\begin{array}{' + spec + '|c}' + rows + '\\end{array}\\right)' +
        '\\end{array}';
    }
    function m(tex){ return window.katex.renderToString(tex, { throwOnError:false }); }
    function listNames(cols){
      var names = cols.map(function(c){ return m(VARS[c]); });
      if(names.length === 1) return names[0];
      return names.slice(0,-1).join(', ') + ' y ' + names[names.length-1];
    }

    // ---------- Textos ----------
    function explainGdl(current, correct){
      var d = current.dof, pl = d > 1;
      var principales = 'Los pivotes están en las columnas de ' + listNames(current.pivotCols) +
        ': esas son las variables principales. ';
      var libres = (pl ? 'Las columnas de ' : 'La columna de ') + listNames(current.freeCols) +
        (pl ? ' no tienen pivote: son las variables libres. ' : ' no tiene pivote: es la variable libre. ');
      var cierre = 'Como hay ' + d + ' variable' + (pl?'s':'') + ' libre' + (pl?'s':'') + ', el sistema tiene ' + d + ' grado' + (pl?'s':'') + ' de libertad.';
      return principales + libres + cierre;
    }

    function explainSolution(current, pOk, homOks, collectiveIssue, hasEmpty){
      if(hasEmpty) return 'Dejaste alguna celda vacía (se tomó como 0 para revisar) — completá todas antes de comprobar la próxima vez.';
      var allHom = homOks.every(Boolean);
      if(pOk && allHom && !collectiveIssue) return 'Tu solución particular verifica el sistema, y cada vector dirección resuelve el sistema homogéneo. Juntos describen todas las soluciones posibles.';
      var parts = [];
      if(!pOk) parts.push('la solución particular no verifica el sistema (revisá que, al multiplicarla por cada fila de la matriz, dé el término independiente)');
      var badIdx = homOks.map(function(ok,i){ return ok ? null : i; }).filter(function(i){ return i!==null; });
      if(badIdx.length){
        var labels = listNames(badIdx.map(function(i){ return current.freeCols[i]; }));
        parts.push(badIdx.length > 1
          ? 'los vectores que acompañan a ' + labels + ' no son correctos (cada uno tiene que resolver el sistema homogéneo)'
          : 'el vector que acompaña a ' + labels + ' no es correcto (tiene que resolver el sistema homogéneo)');
      }
      if(collectiveIssue) parts.push('tus vectores sí resuelven el sistema homogéneo, pero entre todos no llegan a cubrir todos los grados de libertad — revisá que no hayas puesto el mismo vector (o un múltiplo de él) para más de un parámetro');
      var txt = parts.join('; ') + '.';
      return txt.charAt(0).toUpperCase() + txt.slice(1);
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
            { value:2, label:'2', sub:'grados de libertad' }
          ],
          check: function(current, value){ return value === current.dof; },
          explain: function(current, correct){ return explainGdl(current, correct); }
        },
        {
          mode: 'vectors',
          question: 'Completá la solución general (cada vector, de arriba hacia abajo: $x$, $y$, $z$, $t$):<br><small style="font-size:12px;font-style:italic;opacity:.85;">La solución no es única: puede haber otra solución particular distinta a la tuya, y tus vectores pueden ser distintos a los de otra persona y aun así estar bien, siempre que verifiquen el sistema.</small>',
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
