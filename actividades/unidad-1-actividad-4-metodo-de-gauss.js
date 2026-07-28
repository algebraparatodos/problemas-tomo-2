/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 4
   "Aplicá el método de eliminación de Gauss"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-4-metodo-de-gauss.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a4')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a4';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    var ROWS = 3, COLS = 4;
    var PIVOT_SETS = [[0,1,2],[0,1,3],[0,2,3],[1,2,3]];

    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

    // ---------- Fracciones exactas (sin floats) ----------
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
    function fEquals(a,b){ return a.n===b.n && a.d===b.d; }
    function fromInt(x){ return Frac(x,1); }

    function intMatrixToFrac(M){ return M.map(function(row){ return row.map(fromInt); }); }

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

    function rrefEqual(A,B){
      for(var r=0;r<A.length;r++) for(var c=0;c<A[0].length;c++) if(!fEquals(A[r][c],B[r][c])) return false;
      return true;
    }

    function rankOf(fracMatrix){
      var R = rref(fracMatrix);
      return R.filter(function(row){ return row.some(function(v){ return !fIsZero(v); }); }).length;
    }

    // Calcula UNA forma escalonada entera válida de la matriz (no es la
    // única posible, pero sirve para mostrarla como "una respuesta correcta").
    function referenceEchelon(intMatrix){
      var M = intMatrixToFrac(intMatrix);
      var rows = M.length, cols = M[0].length;
      var r = 0;
      for(var c=0; c<cols && r<rows; c++){
        var piv = -1;
        for(var i=r;i<rows;i++){ if(!fIsZero(M[i][c])){ piv=i; break; } }
        if(piv===-1) continue;
        var tmp=M[r]; M[r]=M[piv]; M[piv]=tmp;
        for(var i2=r+1;i2<rows;i2++){
          if(!fIsZero(M[i2][c])){
            var factor = fDiv(M[i2][c], M[r][c]);
            M[i2] = M[i2].map(function(v,k){ return fSub(v, fMul(factor, M[r][k])); });
          }
        }
        r++;
      }
      function gcdInt(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=b; b=a%b; a=t; } return a||1; }
      function lcmInt(a,b){ return Math.abs(a*b)/gcdInt(a,b); }
      return M.map(function(row){
        var denomLcm = 1;
        row.forEach(function(v){ denomLcm = lcmInt(denomLcm, v.d); });
        var intRow = row.map(function(v){ return Math.round(v.n * (denomLcm / v.d)); });
        var nz = intRow.filter(function(x){ return x!==0; }).map(Math.abs);
        if(nz.length){
          var g = nz[0];
          nz.forEach(function(x){ g = gcdInt(g,x); });
          intRow = intRow.map(function(x){ return x / g; });
        }
        return intRow;
      });
    }

    // ¿La fila candidata es combinación lineal de las filas originales?
    function rowIsValidCombination(originalIntMatrix, candidateRow){
      var baseRank = rankOf(intMatrixToFrac(originalIntMatrix));
      var augmented = originalIntMatrix.map(function(r){ return r.slice(); });
      augmented.push(candidateRow);
      var augRank = rankOf(intMatrixToFrac(augmented));
      return augRank === baseRank;
    }

    // ---------- Chequeo estructural de "forma escalonada" ----------
    function pivotOf(row){
      for(var c=0;c<row.length;c++) if(row[c]!==0) return c;
      return null;
    }
    function isEchelonForm(intMatrix){
      var lastPivot = -1, sawZero = false;
      for(var r=0;r<intMatrix.length;r++){
        var p = pivotOf(intMatrix[r]);
        if(p===null){ sawZero = true; continue; }
        if(sawZero) return { ok:false, reason:'zero-not-last', row:r };
        if(p<=lastPivot) return { ok:false, reason:'pivot-not-increasing', row:r };
        lastPivot = p;
      }
      return { ok:true };
    }

    function checkAnswer(originalIntMatrix, studentIntMatrix){
      var struct = isEchelonForm(studentIntMatrix);
      if(!struct.ok) return { ok:false, reason:'not-echelon', struct:struct };
      var rrefOriginal = rref(intMatrixToFrac(originalIntMatrix));
      var rrefStudent = rref(intMatrixToFrac(studentIntMatrix));
      var equivalent = rrefEqual(rrefOriginal, rrefStudent);
      return { ok: equivalent, reason: equivalent ? 'ok' : 'not-equivalent' };
    }

    // ---------- Generador ----------
    function buildSeed(){
      var pivots = randChoice(PIVOT_SETS);
      var M = [];
      for(var r=0;r<ROWS;r++){
        var row = new Array(COLS).fill(0);
        var p = pivots[r];
        var pivotVal = randInt(-4,4); while(pivotVal===0) pivotVal = randInt(-4,4);
        row[p] = pivotVal;
        for(var c=p+1;c<COLS;c++) row[c] = randInt(-4,4);
        M.push(row);
      }
      return M;
    }
    function swapRows(M,i,j){ var M2=M.map(function(r){return r.slice();}); var t=M2[i]; M2[i]=M2[j]; M2[j]=t; return M2; }
    function addMultiple(M,i,j,k){ var M2=M.map(function(r){return r.slice();}); M2[j]=M2[j].map(function(v,c){ return v + k*M2[i][c]; }); return M2; }
    function scaleRow(M,i,k){ var M2=M.map(function(r){return r.slice();}); M2[i]=M2[i].map(function(v){ return v*k; }); return M2; }
    function maxAbs(M){
      var max = 0;
      M.forEach(function(row){ row.forEach(function(v){ var a=Math.abs(v); if(a>max) max=a; }); });
      return max;
    }

    function scramble(seed, numOps){
      var M = seed;
      for(var op=0; op<numOps; op++){
        var kind = randChoice(['swap','add','scale']);
        if(kind==='swap'){
          var i=randInt(0,ROWS-1), j=randInt(0,ROWS-1);
          while(j===i) j=randInt(0,ROWS-1);
          M = swapRows(M,i,j);
        } else if(kind==='add'){
          var i2=randInt(0,ROWS-1), j2=randInt(0,ROWS-1);
          while(j2===i2) j2=randInt(0,ROWS-1);
          var k = randChoice([-2,-1,1,2]);
          M = addMultiple(M,i2,j2,k);
        } else {
          var i3=randInt(0,ROWS-1);
          var k2 = randChoice([-1,1,-1,1,2]);
          M = scaleRow(M,i3,k2);
        }
      }
      return M;
    }

    function generateMatrix(){
      var M, tries=0;
      do{
        var seed = buildSeed();
        M = scramble(seed, randInt(2,3));
        tries++;
      } while(maxAbs(M) > 25 && tries < 50);
      return M;
    }

    function matrixLatex(M){
      var body = M.map(function(row){ return row.join(' & '); }).join(' \\\\ ');
      return '\\left(\\begin{array}{ccc|c} ' + body + ' \\end{array}\\right)';
    }

    function explainText(result, hasEmpty, rowDiagnosis, collectiveRankIssue){
      if(hasEmpty){
        return 'Dejaste alguna celda vacía (se tomó como 0 para revisar) — completá todas antes de comprobar la próxima vez.';
      }
      if(result.reason === 'not-echelon'){
        return 'No está en forma escalonada.';
      }
      if(result.reason === 'not-equivalent'){
        return 'Es una matriz escalonada, pero no tiene el mismo conjunto solución que la original. Por lo tanto, no es un SEL equivalente.';
      }
      return '¡Correcto! Es una forma escalonada válida de esta matriz. No hacía falta que coincidiera con una única respuesta: alcanza con que respete la estructura escalonada y sea equivalente por filas a la original.';
    }

    window.AptActivity.init({
      mount: '#apt-u1a4',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Aplicá el método de eliminación de Gauss',
      subtitle: 'Llevá esta matriz a una forma escalonada válida. No hace falta que sea LA única respuesta posible.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'grid',
      grid: { rows: 3, cols: 4, dividerAfterCol: 3 },
      generate: function(){
        return { matrix: generateMatrix() };
      },
      renderContent: function(container, current){
        window.katex.render(matrixLatex(current.matrix), container, { throwOnError:false });
      },
      checkGrid: function(current, M, hasEmpty){
        var result = checkAnswer(current.matrix, M);
        var correct = result.ok && !hasEmpty;

        var rowDiagnosis = null;
        var collectiveRankIssue = false;
        if(!hasEmpty && result.reason === 'not-equivalent'){
          rowDiagnosis = M.map(function(row){ return rowIsValidCombination(current.matrix, row); });
          if(rowDiagnosis.every(function(v){ return v; })){
            collectiveRankIssue = true;
          }
        }

        var cellStatus = [];
        for(var r=0;r<ROWS;r++){
          var cls = null;
          if(correct){
            cls = 'correct';
          } else if(result.reason === 'not-echelon'){
            cls = null;
          } else if(rowDiagnosis && !collectiveRankIssue){
            cls = rowDiagnosis[r] ? 'correct' : 'wrong';
          } else if(hasEmpty || collectiveRankIssue){
            cls = null;
          } else {
            cls = 'wrong';
          }
          cellStatus.push([cls, cls, cls, cls]);
        }

        return {
          correct: correct,
          cellStatus: cellStatus,
          feedbackText: explainText(result, hasEmpty, rowDiagnosis, collectiveRankIssue)
        };
      },
      getAnswerGrid: function(current){
        return referenceEchelon(current.matrix);
      },
      answerTitle: 'Una respuesta posible',
      answerText: 'Esta es una forma escalonada válida — no la única. Cualquier otra que respete la estructura y el mismo conjunto solución también vale.'
    });
  })();

})();
