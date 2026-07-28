/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 11
   "Tipos de matrices"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-11-tipos-de-matrices.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a11')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a11';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function shuffleArr(arr){
      var a = arr.slice();
      for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
      return a;
    }

    var KEYS = ['fila','columna','cuadrada','nula','diagonal','escalar','triangular_superior','triangular_inferior'];
    var LABELS = {
      fila:'Matriz fila', columna:'Matriz columna', cuadrada:'Matriz cuadrada', nula:'Matriz nula',
      diagonal:'Matriz diagonal', escalar:'Matriz escalar',
      triangular_superior:'Triangular superior', triangular_inferior:'Triangular inferior'
    };
    var ARCHETYPES = ['fila','columna','cuadrada_generica','nula','diagonal','escalar','triangular_superior','triangular_inferior'];

    // Contadores de exposición — persisten mientras dure la sesión (no
    // se resetean entre rondas), para que la elección de arquetipo y de
    // categorías mostradas tienda a repartirse pareja en vez de puro azar.
    var categoryShowCount = {};
    KEYS.forEach(function(k){ categoryShowCount[k] = 0; });
    var archetypeShowCount = {};
    ARCHETYPES.forEach(function(a){ archetypeShowCount[a] = 0; });

    function pickLeastUsed(keys, countMap){
      var minCount = Math.min.apply(null, keys.map(function(k){ return countMap[k]||0; }));
      var candidates = keys.filter(function(k){ return (countMap[k]||0) === minCount; });
      return randChoice(candidates);
    }
    // Elige `count` claves DISTINTAS de `keys`, priorizando en cada paso
    // la(s) menos usada(s) hasta ahora (desempate al azar entre empatadas).
    function pickWeighted(keys, count, countMap){
      var pool = keys.slice();
      var result = [];
      for(var i=0;i<count && pool.length>0;i++){
        var picked = pickLeastUsed(pool, countMap);
        result.push(picked);
        pool.splice(pool.indexOf(picked),1);
      }
      return result;
    }

    function buildRandNonZero(rows, cols){
      var M=[];
      for(var r=0;r<rows;r++){ var row=[]; for(var c=0;c<cols;c++) row.push(randNonZero(-9,9)); M.push(row); }
      return M;
    }
    function buildZero(rows, cols){
      var M=[]; for(var r=0;r<rows;r++) M.push(new Array(cols).fill(0)); return M;
    }

    function buildMatrix(archetype){
      var rows, cols, M;
      if(archetype==='fila'){ rows=1; cols=randInt(2,4); M=buildRandNonZero(rows,cols); }
      else if(archetype==='columna'){ rows=randInt(2,4); cols=1; M=buildRandNonZero(rows,cols); }
      else if(archetype==='cuadrada_generica'){ rows=cols=randInt(2,4); M=buildRandNonZero(rows,cols); }
      else if(archetype==='nula'){
        var shapeKind = randChoice(['fila','columna','cuadrada','rectangular']);
        if(shapeKind==='fila'){ rows=1; cols=randInt(2,4); }
        else if(shapeKind==='columna'){ rows=randInt(2,4); cols=1; }
        else if(shapeKind==='cuadrada'){ rows=cols=randInt(2,4); }
        else { rows=randInt(2,4); cols=randInt(2,4); while(cols===rows) cols=randInt(2,4); }
        M=buildZero(rows,cols);
      }
      else if(archetype==='diagonal'){
        rows=cols=randInt(2,4); M=buildZero(rows,cols);
        for(var i=0;i<rows;i++) M[i][i]=randNonZero(-9,9);
      }
      else if(archetype==='escalar'){
        rows=cols=randInt(2,4); M=buildZero(rows,cols);
        var cst=randNonZero(-9,9);
        for(var i2=0;i2<rows;i2++) M[i2][i2]=cst;
      }
      else if(archetype==='triangular_superior'){
        rows=cols=randInt(2,4); M=buildZero(rows,cols);
        for(var r2=0;r2<rows;r2++) for(var c2=r2;c2<cols;c2++) M[r2][c2]=randNonZero(-9,9);
      }
      else if(archetype==='triangular_inferior'){
        rows=cols=randInt(2,4); M=buildZero(rows,cols);
        for(var r3=0;r3<rows;r3++) for(var c3=0;c3<=r3;c3++) M[r3][c3]=randNonZero(-9,9);
      }
      else { // rectangular_generica
        rows=randInt(2,4); cols=randInt(2,4); while(cols===rows) cols=randInt(2,4);
        M=buildRandNonZero(rows,cols);
      }
      return { rows:rows, cols:cols, matrix:M };
    }

    // clasificación real: se calcula sobre el resultado, no depende de
    // con qué intención se generó — así las relaciones de inclusión
    // (nula ⊂ escalar ⊂ diagonal ⊂ triangular sup ∩ inf) se cumplen solas.
    function classify(M, rows, cols){
      var isFila = rows===1;
      var isColumna = cols===1;
      var isCuadrada = rows===cols;
      var isNula = M.every(function(row){ return row.every(function(v){ return v===0; }); });
      var isDiagonal=false, isEscalar=false, isTriSup=false, isTriInf=false;
      if(isCuadrada){
        isDiagonal = true;
        for(var r=0;r<rows;r++) for(var c=0;c<cols;c++) if(r!==c && M[r][c]!==0) isDiagonal=false;
        isTriSup = true;
        for(r=0;r<rows;r++) for(c=0;c<cols;c++) if(r>c && M[r][c]!==0) isTriSup=false;
        isTriInf = true;
        for(r=0;r<rows;r++) for(c=0;c<cols;c++) if(r<c && M[r][c]!==0) isTriInf=false;
        if(isDiagonal){
          isEscalar = true;
          var d0 = M[0][0];
          for(r=1;r<rows;r++) if(M[r][r]!==d0) isEscalar=false;
        }
      }
      return { fila:isFila, columna:isColumna, cuadrada:isCuadrada, nula:isNula, diagonal:isDiagonal, escalar:isEscalar, triangular_superior:isTriSup, triangular_inferior:isTriInf };
    }

    function pickOptions(trueKeys, falseKeys){
      var targetTrue = trueKeys.length===0 ? 0 : Math.min(trueKeys.length, randInt(1,3));
      var chosenTrue = pickWeighted(trueKeys, targetTrue, categoryShowCount);
      var remaining = 4 - chosenTrue.length;
      var chosenFalse = pickWeighted(falseKeys, Math.min(remaining, falseKeys.length), categoryShowCount);
      var chosen = chosenTrue.concat(chosenFalse);
      if(chosen.length < 4){
        var used = {}; chosen.forEach(function(k){ used[k]=true; });
        var leftoverTrue = trueKeys.filter(function(k){ return !used[k]; });
        chosen = chosen.concat(pickWeighted(leftoverTrue, 4-chosen.length, categoryShowCount));
      }
      chosen.forEach(function(k){ categoryShowCount[k] = (categoryShowCount[k]||0) + 1; });
      return shuffleArr(chosen);
    }

    function generateCase(){
      var archetype = pickLeastUsed(ARCHETYPES, archetypeShowCount);
      archetypeShowCount[archetype] = (archetypeShowCount[archetype]||0) + 1;
      var built = buildMatrix(archetype);
      var classification = classify(built.matrix, built.rows, built.cols);
      var trueKeys = KEYS.filter(function(k){ return classification[k]; });
      var falseKeys = KEYS.filter(function(k){ return !classification[k]; });
      var options = pickOptions(trueKeys, falseKeys).map(function(k){
        return { value:k, label:LABELS[k], correct:classification[k] };
      });
      return { rows:built.rows, cols:built.cols, matrix:built.matrix, classification:classification, options:options };
    }

    function matrixLatex(current){
      var colsSpec = new Array(current.cols).fill('c').join('');
      var rows = current.matrix.map(function(row){ return row.join(' & '); });
      return '\\left(\\begin{array}{' + colsSpec + '} ' + rows.join(' \\\\ ') + ' \\end{array}\\right)';
    }
    function renderContent(container, current){
      window.katex.render(matrixLatex(current), container, { throwOnError:false });
    }

    function explain(current, correct){
      var shown = current.options;
      var trueShown = shown.filter(function(o){ return o.correct; }).map(function(o){ return o.label; });
      var msg = trueShown.length===0
        ? 'De estas 4, ninguna corresponde a esta matriz.'
        : 'Corresponden: ' + trueShown.join(', ') + '.';

      var cls = current.classification;
      if(cls.nula) msg += ' Por ser nula, también es escalar, diagonal, triangular superior y triangular inferior a la vez.';
      else if(cls.escalar) msg += ' Por ser escalar, también es diagonal, triangular superior y triangular inferior a la vez.';
      else if(cls.diagonal) msg += ' Por ser diagonal, también es triangular superior y triangular inferior a la vez.';

      return (correct ? '' : 'No es correcto. ') + msg;
    }

    window.AptActivity.init({
      mount: '#apt-u1a11',
      mode: 'multiselect',
      needsKatex: true,
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Tipos de matrices',
      subtitle: 'Marcá todas las categorías que le correspondan a esta matriz. Puede ser una o varias a la vez.',

      generate: generateCase,
      renderContent: renderContent,
      options: function(current){ return current.options; },
      explain: explain
    });
  })();

})();
