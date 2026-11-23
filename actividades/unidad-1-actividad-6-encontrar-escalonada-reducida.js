/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 6
   "Encontrá la forma escalonada reducida"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-6-encontrar-escalonada-reducida.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a6')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a6';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    var ROWS = 3, COLS = 4;

    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }


    function pivotOf(row){
      for(var c=0;c<row.length;c++) if(row[c]!==0) return c;
      return null;
    }

    // ---------- Construcción de la RREF "semilla" (la respuesta correcta y única) ----------
    // Reparto de tipos: 60 % SCD, 30 % SCI y 10 % SI. Hasta acá (p. 31-34)
    // el libro hizo Gauss-Jordan con un SCD (la solución se lee a simple
    // vista) y con una matriz a la que le queda una variable libre; un SI
    // en forma matricial todavía no apareció, aunque el tipo ya se vio en
    // 1.1.2.1. Por eso el SCD es mayoría y el SI sale de vez en cuando.
    // La columna 3 es la de los términos independientes: un pivote ahí es
    // la fila (0 0 0 | 1) del SI.
    var TYPES = [
      { tipo:'SCD', weight:6, pivotSets:[[0,1,2]] },
      { tipo:'SCI', weight:3, pivotSets:[[0,1],[0,1],[0,2]] },
      { tipo:'SI',  weight:1, pivotSets:[[0,1,3],[0,2,3]] }
    ];
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
    // Pivotes en 1, ceros arriba y abajo de cada pivote y el resto enteros
    // chicos: así la reducida es entera, como en los ejemplos del libro
    // (además, la grilla sólo admite enteros).
    function buildRREFSeed(pivots){
      var rows = [];
      for(var r=0;r<ROWS;r++){
        var row = new Array(COLS).fill(0);
        if(r < pivots.length){
          var p = pivots[r];
          row[p] = 1;
          for(var c=p+1;c<COLS;c++){
            if(pivots.indexOf(c) === -1) row[c] = randInt(-5,5);
          }
        }
        rows.push(row);
      }
      return rows;
    }

    // ---------- Desordenar con operaciones de fila válidas ----------
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
      // Barajamos el orden de las filas siempre, para que no queden ya
      // "ordenadas" como en la respuesta (si no, se nota demasiado la
      // estructura y la actividad queda trivial).
      var order = [0,1,2];
      for(var oi=order.length-1;oi>0;oi--){
        var oj = randInt(0,oi);
        var ot=order[oi]; order[oi]=order[oj]; order[oj]=ot;
      }
      M = order.map(function(idx){ return M[idx]; });

      for(var op=0; op<numOps; op++){
        // Más peso a "add": es la única operación que rellena ceros con
        // valores no triviales. "scale" sola no cambia qué es cero.
        var kind = randChoice(['add','add','add','scale']);
        if(kind==='add'){
          var i2=randInt(0,ROWS-1), j2=randInt(0,ROWS-1);
          while(j2===i2) j2=randInt(0,ROWS-1);
          var k = randChoice([-2,-1,1,2]);
          M = addMultiple(M,i2,j2,k);
        } else {
          var i3=randInt(0,ROWS-1);
          var k2 = randChoice([-2,-1,1,2]);
          M = scaleRow(M,i3,k2);
        }
      }
      return M;
    }
    // Una matriz para practicar: sin filas nulas (la del SCI tiene que
    // aparecer al reducir, no venir dada), que no esté ya escalonada y con
    // números chicos, como los del libro.
    function isEchelonShape(M){
      var lastPivot = -1, sawZero = false;
      for(var r=0;r<M.length;r++){
        var p = pivotOf(M[r]);
        if(p === null){ sawZero = true; continue; }
        if(sawZero || p <= lastPivot) return false;
        lastPivot = p;
      }
      return true;
    }
    function goodShown(M){
      if(maxAbs(M) > 30) return false;
      if(M.some(function(row){ return pivotOf(row) === null; })) return false;
      for(var c=0;c<COLS-1;c++){ // ninguna incógnita puede faltar en todas las ecuaciones
        if(M.every(function(row){ return row[c]===0; })) return false;
      }
      var zeros = 0;
      M.forEach(function(row){ row.forEach(function(v){ if(v===0) zeros++; }); });
      if(zeros > 3) return false; // que no venga casi escalonada
      var keys = M.map(function(row){ return row.join(','); });
      if(keys[0]===keys[1] || keys[0]===keys[2] || keys[1]===keys[2]) return false; // ni filas repetidas
      return !isEchelonShape(M);
    }
    function generateShown(){
      var type = pickType();
      var seed, shown, tries=0;
      do{
        seed = buildRREFSeed(randChoice(type.pivotSets));
        shown = scramble(seed, randInt(5,8));
        tries++;
      } while(!goodShown(shown) && tries < 300);
      return { seed: seed, shown: shown, tipo: type.tipo };
    }

    // ---------- Checker estructural (echelon + pivote=1 + columna limpia) ----------
    function isReducedEchelon(matrix){
      var lastPivot = -1, sawZero = false, pivots = [];
      for(var r=0;r<matrix.length;r++){
        var p = pivotOf(matrix[r]);
        if(p === null){ sawZero = true; continue; }
        if(sawZero) return { ok:false, reason:'zero-not-last', badRow:r };
        if(p <= lastPivot) return { ok:false, reason:'pivot-not-increasing', badRow:r, refRow:r-1 };
        lastPivot = p;
        pivots.push({ row:r, col:p });
      }
      for(var i=0;i<pivots.length;i++){
        var pr = pivots[i].row, pc = pivots[i].col;
        if(matrix[pr][pc] !== 1){
          return { ok:false, reason:'pivot-not-one', badRow:pr, badCol:pc, value:matrix[pr][pc] };
        }
      }
      for(var i2=0;i2<pivots.length;i2++){
        var pr2 = pivots[i2].row, pc2 = pivots[i2].col;
        for(var r2=0;r2<matrix.length;r2++){
          if(r2!==pr2 && matrix[r2][pc2] !== 0){
            return { ok:false, reason:'not-reduced', badRow:r2, refRow:pr2, badCol:pc2 };
          }
        }
      }
      return { ok:true };
    }

    function matricesEqual(A,B){
      for(var r=0;r<A.length;r++) for(var c=0;c<A[0].length;c++) if(A[r][c]!==B[r][c]) return false;
      return true;
    }

    function matrixLatex(M){
      var body = M.map(function(row){ return row.join(' & '); }).join(' \\\\ ');
      return '\\left(\\begin{array}{ccc|c} ' + body + ' \\end{array}\\right)';
    }

    function explainStructural(v){
      if(v.reason === 'zero-not-last') return 'No está en forma escalonada: la fila ' + (v.badRow+1) + ' es no nula pero aparece después de una fila nula.';
      if(v.reason === 'pivot-not-increasing') return 'No está en forma escalonada: el primer elemento no nulo de la fila ' + (v.badRow+1) + ' no está estrictamente a la derecha del de la fila ' + (v.refRow+1) + '.';
      if(v.reason === 'pivot-not-one') return 'Es escalonada, pero no reducida: el pivote de la fila ' + (v.badRow+1) + ' vale ' + v.value + ' — en la forma reducida, todo pivote debe valer exactamente 1.';
      return 'Es escalonada, pero no reducida: la columna del pivote de la fila ' + (v.refRow+1) + ' tiene otro valor no nulo en la fila ' + (v.badRow+1) + ' — el pivote debe ser el único elemento no nulo de su columna.';
    }

    // Qué se lee en la reducida, como hace el libro al final de 1.1.3.2.
    var VARS = ['x','y','z'];
    function tex(s){ return window.katex.renderToString(s, { throwOnError:false }); }
    function readingSentence(R){
      var pivots = R.map(pivotOf);
      if(pivots.indexOf(COLS-1) !== -1){
        return ' La última fila dice ' + tex('0 = 1') + ', algo imposible: el SEL no tiene solución (SI).';
      }
      if(pivots.filter(function(p){ return p !== null; }).length === COLS-1){
        return ' Ahora la solución se lee a simple vista: ' +
          VARS.map(function(v,i){ return tex(v + ' = ' + R[i][COLS-1]); }).join(', ') + '.';
      }
      var free = VARS.filter(function(v,c){ return pivots.indexOf(c) === -1; });
      return ' Quedó una fila nula y la columna de ' + tex(free[0]) + ' sin pivote: ' + tex(free[0]) +
        ' es una variable libre, así que el SEL tiene infinitas soluciones (SCI).';
    }

    window.AptActivity.init({
      mount: '#apt-u1a6',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Encontrá la forma escalonada reducida',
      subtitle: 'A diferencia de la escalonada, esta forma es única: hay una sola respuesta correcta.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'grid',
      grid: { rows: 3, cols: 4, dividerAfterCol: 3 },
      generate: function(){
        var g = generateShown();
        return { matrix: g.shown, answer: g.seed, tipo: g.tipo };
      },
      renderContent: function(container, current){
        window.katex.render(matrixLatex(current.matrix), container, { throwOnError:false });
      },
      checkGrid: function(current, M, hasEmpty){
        if(hasEmpty){
          var nullRows = [[null,null,null,null],[null,null,null,null],[null,null,null,null]];
          return { correct:false, cellStatus:nullRows, feedbackText:'Dejaste alguna celda vacía (se tomó como 0 para revisar) — completá todas antes de comprobar la próxima vez.' };
        }
        // El motor ya filtra las celdas a enteros de hasta 2 cifras (con
        // signo); esto es sólo por si algún día llega otra cosa.
        var notInteger = M.some(function(row){ return row.some(function(v){
          return typeof v !== 'number' || !isFinite(v) || Math.floor(v) !== v;
        }); });
        if(notInteger){
          return { correct:false, cellStatus:[[null,null,null,null],[null,null,null,null],[null,null,null,null]], feedbackText:'Escribí un número entero en cada celda.' };
        }
        var structCheck = isReducedEchelon(M);
        if(!structCheck.ok){
          var cellStatus = [[null,null,null,null],[null,null,null,null],[null,null,null,null]];
          cellStatus[structCheck.badRow] = ['wrong','wrong','wrong','wrong'];
          return { correct:false, cellStatus:cellStatus, feedbackText: explainStructural(structCheck) };
        }
        var isTheAnswer = matricesEqual(M, current.answer);
        if(isTheAnswer){
          return {
            correct:true,
            cellStatus: [['correct','correct','correct','correct'],['correct','correct','correct','correct'],['correct','correct','correct','correct']],
            feedbackText: 'Como la forma escalonada reducida es única, esta es exactamente la respuesta.' + readingSentence(current.answer)
          };
        }
        return {
          correct:false,
          cellStatus: [[null,null,null,null],[null,null,null,null],[null,null,null,null]],
          feedbackText: 'Tu matriz sí está en forma escalonada reducida, pero no es la de esta matriz: no sale de la original con operaciones elementales por fila. Revisá las operaciones de fila que aplicaste.'
        };
      },
      getAnswerGrid: function(current){
        return current.answer;
      },
      answerTitle: 'La respuesta correcta',
      answerText: 'A diferencia de la forma escalonada común, la forma reducida es única: esta es la única respuesta válida para esta matriz.'
    });
  })();

})();
