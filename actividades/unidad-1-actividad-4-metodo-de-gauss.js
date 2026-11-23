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
    // Reparto de tipos de SEL: 40 % SCD (el ejemplo del libro, p. 27-28),
    // 30 % SCI y 30 % SI (los tres tipos ya se vieron en 1.1.2.1, y el
    // libro avisa en la p. 28 que al escalonar pueden quedar incógnitas
    // sin pivote). Cada tipo se arma con sus columnas de pivote en la
    // escalonada semilla: la columna 3 es la de los términos independientes.
    var TYPES = [
      { tipo:'SCD', weight:4, pivotSets:[[0,1,2]] },
      { tipo:'SCI', weight:3, pivotSets:[[0,1],[0,1],[0,2]] },
      { tipo:'SI',  weight:3, pivotSets:[[0,1,3],[0,1,3],[0,2,3]] }
    ];

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

    // Tipo de SEL a partir de su escalonada reducida: SI si aparece una
    // fila (0 0 0 | k) con k ≠ 0; si no, SCD con 3 pivotes y SCI con menos.
    function solutionType(intMatrix){
      var R = rref(intMatrixToFrac(intMatrix));
      var rank = 0, incompatible = false;
      R.forEach(function(row){
        var p = -1;
        for(var c=0;c<COLS;c++) if(!fIsZero(row[c])){ p = c; break; }
        if(p === -1) return;
        rank++;
        if(p === COLS-1) incompatible = true;
      });
      if(incompatible) return 'SI';
      return rank === COLS-1 ? 'SCD' : 'SCI';
    }

    // «Escalonada equivalente» = la que sale de la original con operaciones
    // elementales por fila, que es lo que hace Gauss. Dos matrices 3×4 son
    // equivalentes por filas si y sólo si tienen la misma escalonada
    // reducida. Para SEL compatibles eso es lo mismo que tener el mismo
    // conjunto solución; entre dos SI no: los dos tienen conjunto solución
    // vacío aunque una no salga de la otra. Por eso ese caso se avisa aparte.
    function checkAnswer(originalIntMatrix, studentIntMatrix){
      var struct = isEchelonForm(studentIntMatrix);
      if(!struct.ok) return { ok:false, reason:'not-echelon', struct:struct };
      var rrefOriginal = rref(intMatrixToFrac(originalIntMatrix));
      var rrefStudent = rref(intMatrixToFrac(studentIntMatrix));
      var equivalent = rrefEqual(rrefOriginal, rrefStudent);
      if(equivalent) return { ok:true, reason:'ok' };
      if(solutionType(originalIntMatrix) === 'SI' && solutionType(studentIntMatrix) === 'SI'){
        return { ok:false, reason:'both-si' };
      }
      return { ok:false, reason:'not-equivalent' };
    }

    // ---------- Generador ----------
    function pickType(){
      var total = 0;
      TYPES.forEach(function(t){ total += t.weight; });
      var x = Math.random()*total;
      for(var i=0;i<TYPES.length;i++){
        x -= TYPES[i].weight;
        if(x < 0) return TYPES[i];
      }
      return TYPES[0];
    }
    function buildSeed(pivots){
      var M = [];
      for(var r=0;r<ROWS;r++){
        var row = new Array(COLS).fill(0);
        if(r < pivots.length){
          var p = pivots[r];
          var pivotVal = randInt(-3,3); while(pivotVal===0) pivotVal = randInt(-3,3);
          row[p] = pivotVal;
          for(var c=p+1;c<COLS;c++) row[c] = randInt(-4,4);
        }
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
        // Más peso a "add": es la que esconde la estructura escalonada.
        var kind = randChoice(['swap','add','add','scale']);
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

    // Una matriz para practicar: sin filas nulas (la del SCI tiene que
    // aparecer al escalonar, no venir dada), que no esté ya escalonada y
    // con números chicos, como los del libro.
    function goodShown(M){
      if(maxAbs(M) > 20) return false;
      if(M.some(function(row){ return row.every(function(v){ return v===0; }); })) return false;
      for(var c=0;c<COLS-1;c++){ // ninguna incógnita puede faltar en todas las ecuaciones
        if(M.every(function(row){ return row[c]===0; })) return false;
      }
      var zeros = 0;
      M.forEach(function(row){ row.forEach(function(v){ if(v===0) zeros++; }); });
      if(zeros > 3) return false; // que no venga casi escalonada
      var keys = M.map(function(row){ return row.join(','); });
      if(keys[0]===keys[1] || keys[0]===keys[2] || keys[1]===keys[2]) return false; // ni filas repetidas
      if(isEchelonForm(M).ok) return false;
      return maxAbs(referenceEchelon(M)) <= 99; // la grilla admite hasta 2 cifras
    }
    function generateMatrix(){
      var type = pickType();
      var M, tries=0;
      do{
        var seed = buildSeed(randChoice(type.pivotSets));
        M = scramble(seed, randInt(3,5));
        tries++;
      } while(!goodShown(M) && tries < 300);
      return { matrix: M, tipo: type.tipo };
    }

    function matrixLatex(M){
      var body = M.map(function(row){ return row.join(' & '); }).join(' \\\\ ');
      return '\\left(\\begin{array}{ccc|c} ' + body + ' \\end{array}\\right)';
    }

    function tex(s){ return window.katex.renderToString(s, { throwOnError:false }); }

    // Frase final del acierto: qué tipo de SEL quedó a la vista en la escalonada.
    function typeSentence(student){
      var tipo = solutionType(student);
      if(tipo === 'SCD'){
        return ' Además, hay un pivote en cada columna de incógnitas: el SEL es un SCD y lo podés resolver por sustitución hacia atrás.';
      }
      if(tipo === 'SCI'){
        return ' Además, quedó una fila nula y una columna de incógnitas sin pivote: esa incógnita es una variable libre y el SEL es un SCI (tiene infinitas soluciones).';
      }
      var k = 0;
      student.forEach(function(row){ if(pivotOf(row) === COLS-1) k = row[COLS-1]; });
      return ' Además, fijate en la fila que tiene ceros a la izquierda de la barra y ' + tex(String(k)) +
        ' a la derecha: esa ecuación dice ' + tex('0 = ' + k) + ', algo imposible, así que el SEL es un SI (no tiene solución).';
    }

    function explainText(result, hasEmpty, rowDiagnosis, collectiveRankIssue, student){
      if(hasEmpty){
        return 'Dejaste alguna celda vacía (se tomó como 0 para revisar) — completá todas antes de comprobar la próxima vez.';
      }
      if(result.reason === 'not-integer'){
        return 'Escribí un número entero en cada celda.';
      }
      if(result.reason === 'not-echelon'){
        var s = result.struct;
        if(s.reason === 'zero-not-last'){
          return 'No está en forma escalonada: la fila ' + (s.row+1) + ' no es nula, pero está debajo de una fila nula. Las filas nulas van abajo de todo.';
        }
        return 'No está en forma escalonada: el pivote de la fila ' + (s.row+1) + ' no está estrictamente a la derecha del pivote de la fila ' + s.row + '.';
      }
      if(result.reason === 'both-si'){
        return 'Tu matriz es escalonada y, como la original, corresponde a un SI: ninguno de los dos SEL tiene solución. Pero no sale de la original con operaciones elementales por fila, que es lo que hace el método de Gauss. Revisá las cuentas: lo que cambia son los coeficientes, no el tipo de sistema.';
      }
      if(result.reason === 'not-equivalent'){
        if(collectiveRankIssue){
          return 'Cada fila que escribiste sale de combinar filas de la original, pero entre las tres quedaron menos ecuaciones independientes de las que había (por ejemplo, una fila nula de más). Por eso tu SEL no tiene el mismo conjunto solución que el original: no es un SEL equivalente.';
        }
        return 'Es una matriz escalonada, pero no tiene el mismo conjunto solución que la original. Por lo tanto, no es un SEL equivalente. Las filas marcadas en rojo no salen de combinar filas de la original.';
      }
      return 'Es una forma escalonada válida de esta matriz. No hacía falta que coincidiera con una única respuesta: alcanza con que respete la estructura escalonada y sea equivalente por filas a la original.' + typeSentence(student);
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
        return generateMatrix();
      },
      renderContent: function(container, current){
        window.katex.render(matrixLatex(current.matrix), container, { throwOnError:false });
      },
      checkGrid: function(current, M, hasEmpty){
        // El motor ya filtra las celdas a enteros de hasta 2 cifras (con
        // signo) y deja null en las vacías. Acá las vacías pasan a 0, como
        // dice el aviso, y cualquier cosa que no sea un entero se rechaza.
        var notInteger = false;
        M = M.map(function(row){ return row.map(function(v){
          if(v === null || v === undefined) return 0;
          if(typeof v !== 'number' || !isFinite(v) || Math.floor(v) !== v){ notInteger = true; return 0; }
          return v;
        }); });
        var result = notInteger ? { ok:false, reason:'not-integer' } : checkAnswer(current.matrix, M);
        var correct = result.ok && !hasEmpty;

        var rowDiagnosis = null;
        var collectiveRankIssue = false;
        if(!hasEmpty && (result.reason === 'not-equivalent' || result.reason === 'both-si')){
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
          feedbackText: explainText(result, hasEmpty, rowDiagnosis, collectiveRankIssue, M)
        };
      },
      getAnswerGrid: function(current){
        return referenceEchelon(current.matrix);
      },
      answerTitle: 'Una respuesta posible',
      answerText: 'Esta es una forma escalonada válida — no la única. Cualquier otra escalonada que salga de la original con operaciones elementales por fila también vale.'
    });
  })();

})();
