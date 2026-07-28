<!-- ============================================================
     ÁLGEBRA PARA TODOS · Actividad "Rango por orlado"
     ------------------------------------------------------------
     Usa engine.js para TODO lo compartido (skeleton de mode:'phases',
     footer, sonido, racha, mute, reportar). Este archivo solo tiene
     el generador de matrices, el algoritmo de orlado y el render
     de la matriz de solo lectura (con resaltado por fase).
     Pegar tal cual en un bloque de Código/HTML/Embed de Kajabi.
     ============================================================ -->

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Lora:wght@600;700&display=swap" rel="stylesheet">
<script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"></script>

<style>
/* Propio de esta actividad — nada de esto vive en el engine porque
   es la única landing que necesita una matriz de SOLO LECTURA con
   celdas resaltables por fase (el engine no tiene ese layout). Usa
   las variables --chalk/--ink/etc. que define .apt-act (heredan
   porque este contenido vive adentro de .apt-act__content).

   OJO: los delimitadores (paréntesis) y su contenedor NO se definen
   acá. Se usan las clases del engine, .apt-act__matrixwrap y
   .apt-act__bracket, para que cualquier cambio futuro de notación
   se aplique también en esta actividad sin tener que re-pegarla. */
.apt-orl__wrap{ display:flex; flex-direction:column; align-items:center; gap:14px; width:100%; }
.apt-orl__label{ align-self:center; font-family:var(--font-mono); font-weight:700; font-size:clamp(15px,4.2vw,18px); color:var(--ink); margin-right:2px; }
.apt-orl__grid{ display:grid; gap:8px 6px; padding:4px; }
.apt-orl__cell{
  display:flex; align-items:center; justify-content:center;
  font-family:var(--font-mono); font-weight:500; font-size:clamp(15px,4.2vw,18px);
  color:var(--ink); background:rgba(151,161,216,0.07);
  border:2px solid rgba(151,161,216,0.3); border-radius:8px;
  min-height:40px; min-width:40px;
  transition:background .25s ease, border-color .25s ease, color .25s ease;
}
.apt-orl__cell.is-start{ border-color:var(--chalk-light); background:rgba(151,161,216,0.22); color:var(--chalk-light); font-weight:700; }
.apt-orl__cell.is-order2,
.apt-orl__cell.is-order3{ border-color:var(--correct); background:var(--correct-bg); color:var(--correct); font-weight:700; }
.apt-orl__caption{ font-family:var(--font-mono); font-size:12.5px; color:var(--ink-soft); text-align:center; margin:0; line-height:1.5; min-height:1.4em; }
</style>

<script>
(function(){
  /* Todo en un closure propio — ninguna variable ni función se
     filtra al window global. */

  var SHAPES = [{rows:3,cols:3},{rows:3,cols:4},{rows:4,cols:3}];

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function pickDistinctSorted(n,k){
    var idx = new Set();
    while(idx.size < k) idx.add(Math.floor(Math.random()*n));
    return Array.from(idx).sort(function(a,b){ return a-b; });
  }

  // ---------- Generador (rango objetivo garantizado por construcción,
  //             luego mezclado con operaciones elementales que preservan
  //             el rango) ----------
  function buildSeedRows(rows, cols, r){
    var pivots = pickDistinctSorted(cols, r);
    var seed = [];
    for(var i=0;i<r;i++){
      var row = new Array(cols).fill(0);
      var p = pivots[i];
      row[p] = randNonZero(-6,6);
      for(var c=p+1;c<cols;c++) row[c] = randInt(-6,6);
      seed.push(row);
    }
    for(var j=r;j<rows;j++) seed.push(new Array(cols).fill(0));
    return seed;
  }
  function swapRows(M,i,j){ var M2=M.map(function(r){return r.slice();}); var t=M2[i]; M2[i]=M2[j]; M2[j]=t; return M2; }
  function addMultiple(M,i,j,k){ var M2=M.map(function(r){return r.slice();}); M2[j]=M2[j].map(function(v,c){return v+k*M2[i][c];}); return M2; }
  function scaleRow(M,i,k){ var M2=M.map(function(r){return r.slice();}); M2[i]=M2[i].map(function(v){return v*k;}); return M2; }
  function maxAbs(M){ return Math.max.apply(null, M.flat().map(Math.abs)); }

  function scramble(M, rows, numOps){
    var out = M;
    for(var op=0; op<numOps; op++){
      var kind = randChoice(['swap','add','add','scale']);
      if(kind==='swap'){
        var i=randInt(0,rows-1), j=randInt(0,rows-1);
        while(j===i) j=randInt(0,rows-1);
        out = swapRows(out,i,j);
      } else if(kind==='add'){
        var i2=randInt(0,rows-1), j2=randInt(0,rows-1);
        while(j2===i2) j2=randInt(0,rows-1);
        out = addMultiple(out,i2,j2,randChoice([-2,-1,1,2]));
      } else {
        out = scaleRow(out, randInt(0,rows-1), randChoice([-1,1,-1,1,2]));
      }
    }
    return out;
  }

  function generateMatrix(){
    var shape = randChoice(SHAPES);
    var r = randInt(1,3);
    var M, tries=0;
    do{
      var seed = buildSeedRows(shape.rows, shape.cols, r);
      M = scramble(seed, shape.rows, randInt(3,5));
      tries++;
    } while(maxAbs(M) > 20 && tries < 50);

    var nonZero = [];
    for(var i=0;i<shape.rows;i++) for(var j=0;j<shape.cols;j++) if(M[i][j]!==0) nonZero.push([i,j]);
    var start = randChoice(nonZero);

    return { rows: shape.rows, cols: shape.cols, matrix: M, startR: start[0], startC: start[1] };
  }

  // ---------- Algoritmo de orlado (determinantes enteros exactos) ----------
  function det2(a,b,c,d){ return a*d - b*c; }
  function det3(m){
    return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])
         - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])
         + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
  }

  function computeBorderingPath(c){
    var M=c.matrix, rows=c.rows, cols=c.cols;
    var rowsUsed=[c.startR], colsUsed=[c.startC];
    var steps = {};

    var cands2 = [];
    for(var r=0;r<rows;r++){
      if(rowsUsed.indexOf(r)!==-1) continue;
      for(var cc=0;cc<cols;cc++){
        if(colsUsed.indexOf(cc)!==-1) continue;
        var val = det2(M[rowsUsed[0]][colsUsed[0]], M[rowsUsed[0]][cc], M[r][colsUsed[0]], M[r][cc]);
        if(val!==0) cands2.push({r:r,c:cc,val:val});
      }
    }
    if(cands2.length===0){ steps[2] = { exists:false }; return { rank:1, steps:steps }; }
    var pick2 = randChoice(cands2);
    steps[2] = { exists:true, rows:[rowsUsed[0],pick2.r], cols:[colsUsed[0],pick2.c], value:pick2.val };
    rowsUsed = [rowsUsed[0], pick2.r];
    colsUsed = [colsUsed[0], pick2.c];

    var cands3 = [];
    for(var r2=0;r2<rows;r2++){
      if(rowsUsed.indexOf(r2)!==-1) continue;
      for(var c2=0;c2<cols;c2++){
        if(colsUsed.indexOf(c2)!==-1) continue;
        var subRows = rowsUsed.concat([r2]), subCols = colsUsed.concat([c2]);
        var sub = subRows.map(function(ri){ return subCols.map(function(ci){ return M[ri][ci]; }); });
        var val3 = det3(sub);
        if(val3!==0) cands3.push({r:r2,c:c2,val:val3});
      }
    }
    if(cands3.length===0){ steps[3] = { exists:false }; return { rank:2, steps:steps }; }
    var pick3 = randChoice(cands3);
    steps[3] = { exists:true, rows:rowsUsed.concat([pick3.r]), cols:colsUsed.concat([pick3.c]), value:pick3.val };
    return { rank:3, steps:steps };
  }

  // ---------- Render de la matriz (solo lectura, resaltable) ----------
  function renderContent(container, current){
    var rows = current.rows, cols = current.cols, M = current.matrix;
    var cellsHTML = '';
    for(var r=0;r<rows;r++){
      for(var c=0;c<cols;c++){
        var isStart = (r===current.startR && c===current.startC);
        cellsHTML += '<div class="apt-orl__cell' + (isStart ? ' is-start' : '') + '" data-row="'+r+'" data-col="'+c+'">' + M[r][c] + '</div>';
      }
    }
    container.innerHTML =
      '<div class="apt-orl__wrap">' +
        '<div class="apt-act__matrixwrap">' +
          '<span class="apt-orl__label">A =</span>' +
          '<span class="apt-act__bracket apt-act__bracket--left"></span>' +
          '<div class="apt-orl__grid" style="grid-template-columns:repeat(' + cols + ', minmax(40px,52px));">' + cellsHTML + '</div>' +
          '<span class="apt-act__bracket apt-act__bracket--right"></span>' +
        '</div>' +
        '<p class="apt-orl__caption">Partimos de la entrada marcada: un menor de orden 1 no nulo.</p>' +
      '</div>';
  }

  function highlightCells(contentEl, rowsArr, colsArr, cls){
    var grid = contentEl.querySelector('.apt-orl__grid');
    if(!grid) return;
    rowsArr.forEach(function(r){
      colsArr.forEach(function(c){
        var cell = grid.querySelector('.apt-orl__cell[data-row="'+r+'"][data-col="'+c+'"]');
        if(cell) cell.classList.add(cls);
      });
    });
  }
  function setCaption(contentEl, text){
    var cap = contentEl.querySelector('.apt-orl__caption');
    if(cap) cap.textContent = text;
  }
  function ordinalRows(arr){ return arr.map(function(r){ return r+1; }).join(' y '); }
  function ordinalCols(arr){ return arr.map(function(c){ return c+1; }).join(' y '); }

  // ---------- Config del engine ----------
  window.AptActivity.init({
    mode: 'phases',
    eyebrow: 'Unidad 1 · Rango de matrices',
    title: 'Rango por orlado',
    subtitle: 'Partiendo de la entrada marcada, decidí en cada paso si existe un menor de orden mayor —que orle al anterior— que no se anule.',

    generate: function(){
      var current = generateMatrix();
      var path = computeBorderingPath(current);
      current.steps = path.steps;
      current.rank = path.rank;
      return current;
    },
    renderContent: renderContent,

    activePhaseCount: function(current){
      return current.steps[2].exists ? 2 : 1;
    },

    phases: [
      {
        mode: 'choices',
        question: '¿Existe un menor de orden 2 no nulo que se pueda formar orlando la entrada marcada?',
        choices: [
          { value:'si', label:'Sí, existe' },
          { value:'no', label:'No, no existe' }
        ],
        check: function(current, value){
          return (value === 'si') === current.steps[2].exists;
        },
        explain: function(current, correct, value){
          var step = current.steps[2];
          var msg;
          if(step.exists){
            msg = 'Sí existe: tomando la fila ' + ordinalRows(step.rows) + ' y la columna ' + ordinalCols(step.cols) +
                  ' se forma un menor de orden 2 que vale ' + step.value + ' (no nulo). Seguimos orlando.';
          } else {
            msg = 'No existe: cualquier menor de orden 2 que orle la entrada marcada da 0. Por lo tanto, rango(A) = 1.';
          }
          return (correct ? '' : 'No es correcto. ') + msg;
        },
        onAnswered: function(current, correct, value, contentEl){
          if(!correct) return;
          var step = current.steps[2];
          if(step.exists){
            highlightCells(contentEl, step.rows, step.cols, 'is-order2');
            setCaption(contentEl, 'Menor de orden 2 no nulo (vale ' + step.value + '), resaltado en la matriz.');
          } else {
            setCaption(contentEl, 'Ningún menor de orden 2 orla esta entrada sin anularse. Rango(A) = 1.');
          }
        }
      },
      {
        mode: 'choices',
        question: '¿Existe un menor de orden 3 no nulo que se pueda formar orlando el menor anterior?',
        choices: [
          { value:'si', label:'Sí, existe' },
          { value:'no', label:'No, no existe' }
        ],
        check: function(current, value){
          return (value === 'si') === current.steps[3].exists;
        },
        explain: function(current, correct, value){
          var step = current.steps[3];
          var msg;
          if(step.exists){
            msg = 'Sí existe: tomando las filas ' + step.rows.map(function(r){return r+1;}).join(', ') +
                  ' y las columnas ' + step.cols.map(function(c){return c+1;}).join(', ') +
                  ' se forma un menor de orden 3 que vale ' + step.value +
                  ' (no nulo). No quedan más filas ni columnas para seguir orlando, así que rango(A) = 3 (rango completo).';
          } else {
            msg = 'No existe: todos los menores de orden 3 que orlan al anterior dan 0. Por lo tanto, rango(A) = 2.';
          }
          return (correct ? '' : 'No es correcto. ') + msg;
        },
        onAnswered: function(current, correct, value, contentEl){
          if(!correct) return;
          var step = current.steps[3];
          if(step.exists){
            highlightCells(contentEl, step.rows, step.cols, 'is-order3');
            setCaption(contentEl, 'Menor de orden 3 no nulo (vale ' + step.value + '), resaltado en la matriz. Rango(A) = 3.');
          } else {
            setCaption(contentEl, 'Ningún menor de orden 3 orla al anterior sin anularse. Rango(A) = 2.');
          }
        }
      }
    ]
  });
})();
</script>
