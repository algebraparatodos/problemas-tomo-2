/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 10
   "Rouché-Frobenius con parámetros"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-10-rouche-frobenius-parametro.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a10')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a10';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    /* ---------- representación de cada entrada como [c,k,t] =>
       valor = c + k*K + t*T (afín en cada parámetro; nunca hay
       producto k*t porque las operaciones elementales de fila son
       siempre combinaciones LINEALES de filas ya existentes) ---------- */
    function E(c,k,t){ return [c||0, k||0, t||0]; }
    function eAdd(a,b){ return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
    function eScale(a,s){ return [a[0]*s, a[1]*s, a[2]*s]; }
    function evalE(e,K,T){ return e[0] + e[1]*K + e[2]*T; }

    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function pickDistinctSorted(n,k){
      var idx=new Set();
      while(idx.size<k) idx.add(Math.floor(Math.random()*n));
      return Array.from(idx).sort(function(a,b){return a-b;});
    }

    var SHAPES = [
      {rows:2,cols:2},{rows:2,cols:3},{rows:2,cols:4},
      {rows:3,cols:2},{rows:3,cols:3},{rows:3,cols:4}
    ];

    // ---------- operaciones elementales de fila, generalizadas ----------
    function swapRows(M,i,j){ var M2=M.map(function(r){return r.slice();}); var t=M2[i]; M2[i]=M2[j]; M2[j]=t; return M2; }
    function addMultiple(M,i,j,s){ var M2=M.map(function(r){return r.slice();}); M2[j]=M2[j].map(function(e,c){return eAdd(e, eScale(M2[i][c], s));}); return M2; }
    function scaleRow(M,i,s){ var M2=M.map(function(r){return r.slice();}); M2[i]=M2[i].map(function(e){return eScale(e,s);}); return M2; }
    function maxAbsConst(M){
      var mx=0;
      M.forEach(function(row){ row.forEach(function(e){ mx=Math.max(mx,Math.abs(e[0]),Math.abs(e[1]),Math.abs(e[2])); }); });
      return mx;
    }
    function scramble(M, rows, numOps){
      var out=M;
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
    function constRow(cols, pivotCol){
      var row = new Array(cols+1);
      for(var c=0;c<cols;c++) row[c] = c<pivotCol ? E(0,0,0) : E(c===pivotCol?randNonZero(-4,4):randInt(-4,4),0,0);
      row[cols] = E(randInt(-4,4),0,0);
      return row;
    }

    var CLASSES = ['SCD','SCI','SI'];
    function thirdOf(a,b){ return CLASSES.filter(function(x){ return x!==a && x!==b; })[0]; }

    // ---------- 1 parámetro, ubicación 'A' o 'ambos' ----------
    function build1Param(location, shape){
      var rows=shape.rows, cols=shape.cols;
      var maxOrderA=Math.min(rows,cols);
      var canSCD = rows>=cols;
      var c = randInt(-3,3);
      var pivots = pickDistinctSorted(cols, maxOrderA);
      var pIdx = randInt(0, maxOrderA-1);
      var compatAtCritical = canSCD ? Math.random()<0.5 : false;

      var seed=[];
      for(var i=0;i<maxOrderA;i++){
        var pivotCol=pivots[i];
        if(i!==pIdx){ seed.push(constRow(cols,pivotCol)); continue; }
        var fixedVec=[];
        for(var c2=0;c2<cols;c2++) fixedVec.push(c2<pivotCol?0:(c2===pivotCol?randNonZero(-4,4):randInt(-4,4)));
        var row=new Array(cols+1);
        for(c2=0;c2<cols;c2++) row[c2]=E(-fixedVec[c2]*c, fixedVec[c2], 0);
        if(location==='ambos'){
          var target = compatAtCritical?0:randNonZero(-4,4);
          row[cols]=E(target-c, 1, 0); // b(k) = target + (k-c)
        } else {
          row[cols]=E(compatAtCritical?0:randNonZero(-4,4), 0, 0);
        }
        seed.push(row);
      }
      for(var e=0;e<rows-maxOrderA;e++){
        var erow=[]; for(c2=0;c2<cols;c2++) erow.push(E(0,0,0)); erow.push(E(0,0,0)); seed.push(erow);
      }

      var genericCls = canSCD?'SCD':'SCI';
      var criticalCls = compatAtCritical?'SCI':'SI';
      var thirdCls = thirdOf(genericCls, criticalCls);
      var descriptors={};
      descriptors[genericCls]={type:'except', value:c};
      descriptors[criticalCls]={type:'value', value:c};
      descriptors[thirdCls]={type:'none'};

      return { rows:rows, cols:cols, seed:seed, numParams:1, location:location, descriptors:descriptors };
    }

    // ---------- 1 parámetro, ubicación 'B' ----------
    function build1ParamB(shape){
      var rows=shape.rows, cols=shape.cols;
      var canSCDAtCritical = rows>cols;
      var wantSCD = canSCDAtCritical ? Math.random()<0.5 : false;
      var r0 = wantSCD ? cols : randInt(1, Math.min(rows-1, cols-1));
      var c = randInt(-3,3);
      var pivots = pickDistinctSorted(cols, r0);

      var seed=[];
      for(var i=0;i<r0;i++) seed.push(constRow(cols, pivots[i]));
      var extraCount = rows-r0;
      var designated = randInt(0, extraCount-1);
      for(var e=0;e<extraCount;e++){
        var erow=[]; for(var c2=0;c2<cols;c2++) erow.push(E(0,0,0));
        erow.push(e===designated ? E(-c,1,0) : E(0,0,0));
        seed.push(erow);
      }

      var genericCls='SI';
      var criticalCls = wantSCD?'SCD':'SCI';
      var thirdCls = thirdOf(genericCls, criticalCls);
      var descriptors={};
      descriptors[genericCls]={type:'except', value:c};
      descriptors[criticalCls]={type:'value', value:c};
      descriptors[thirdCls]={type:'none'};

      return { rows:rows, cols:cols, seed:seed, numParams:1, location:'B', descriptors:descriptors };
    }

    // ---------- 2 parámetros, ubicación 'ambos' (k solo en A, t solo en B) ----------
    // Restringido a formas con rows>=cols: si no, "SCI" sería genérico Y
    // también posible en el punto crítico según t, dando una condición
    // compuesta imposible de expresar en una sola opción de multiple choice.
    function build2ParamAmbos(shape){
      var rows=shape.rows, cols=shape.cols;
      var maxOrderA=cols;
      var c1=randInt(-3,3), c2v=randInt(-3,3);
      var pivots = pickDistinctSorted(cols, maxOrderA);
      var pIdx = randInt(0, maxOrderA-1);

      var seed=[];
      for(var i=0;i<maxOrderA;i++){
        var pivotCol=pivots[i];
        if(i!==pIdx){ seed.push(constRow(cols,pivotCol)); continue; }
        var fixedVec=[];
        for(var c3=0;c3<cols;c3++) fixedVec.push(c3<pivotCol?0:(c3===pivotCol?randNonZero(-4,4):randInt(-4,4)));
        var row=new Array(cols+1);
        for(c3=0;c3<cols;c3++) row[c3]=E(-fixedVec[c3]*c1, fixedVec[c3], 0);
        row[cols]=E(-c2v,0,1); // b = (t - c2)
        seed.push(row);
      }
      for(var e=0;e<rows-maxOrderA;e++){
        var erow=[]; for(c3=0;c3<cols;c3++) erow.push(E(0,0,0)); erow.push(E(0,0,0)); seed.push(erow);
      }

      var descriptors = {
        SCD: {type:'except-k', k:c1},
        SCI: {type:'pair', k:c1, t:c2v},
        SI: {type:'partial', k:c1, tNot:c2v}
      };
      return { rows:rows, cols:cols, seed:seed, numParams:2, location:'ambos', descriptors:descriptors };
    }

    // ---------- 2 parámetros, ubicación 'A' (relación k - t = D controla rango(A)) ----------
    function build2ParamA(shape){
      var rows=shape.rows, cols=shape.cols;
      var maxOrderA=Math.min(rows,cols);
      var canSCD = rows>=cols;
      var D = randInt(-3,3);
      var pivots = pickDistinctSorted(cols, maxOrderA);
      var pIdx = randInt(0, maxOrderA-1);
      var compatOnRelation = canSCD ? Math.random()<0.5 : false;

      var seed=[];
      for(var i=0;i<maxOrderA;i++){
        var pivotCol=pivots[i];
        if(i!==pIdx){ seed.push(constRow(cols,pivotCol)); continue; }
        var fixedVec=[];
        for(var c2=0;c2<cols;c2++) fixedVec.push(c2<pivotCol?0:(c2===pivotCol?randNonZero(-4,4):randInt(-4,4)));
        var row=new Array(cols+1);
        for(c2=0;c2<cols;c2++) row[c2]=E(-fixedVec[c2]*D, fixedVec[c2], -fixedVec[c2]); // fixedVec*(k-t-D)
        row[cols]=E(compatOnRelation?0:randNonZero(-4,4), 0, 0);
        seed.push(row);
      }
      for(var e=0;e<rows-maxOrderA;e++){
        var erow=[]; for(c2=0;c2<cols;c2++) erow.push(E(0,0,0)); erow.push(E(0,0,0)); seed.push(erow);
      }

      var genericCls = canSCD?'SCD':'SCI';
      var criticalCls = compatOnRelation?'SCI':'SI';
      var thirdCls = thirdOf(genericCls, criticalCls);
      var descriptors={};
      descriptors[genericCls]={type:'except-relation', D:D};
      descriptors[criticalCls]={type:'relation', D:D};
      descriptors[thirdCls]={type:'none'};

      return { rows:rows, cols:cols, seed:seed, numParams:2, location:'A', descriptors:descriptors };
    }

    // ---------- 2 parámetros, ubicación 'B' (relación k - t = D en la columna b) ----------
    function build2ParamB(shape){
      var rows=shape.rows, cols=shape.cols;
      var canSCDAtRelation = rows>cols;
      var wantSCD = canSCDAtRelation ? Math.random()<0.5 : false;
      var r0 = wantSCD ? cols : randInt(1, Math.min(rows-1, cols-1));
      var D = randInt(-3,3);
      var pivots = pickDistinctSorted(cols, r0);

      var seed=[];
      for(var i=0;i<r0;i++) seed.push(constRow(cols, pivots[i]));
      var extraCount = rows-r0;
      var designated = randInt(0, extraCount-1);
      for(var e=0;e<extraCount;e++){
        var erow=[]; for(var c2=0;c2<cols;c2++) erow.push(E(0,0,0));
        erow.push(e===designated ? E(-D,1,-1) : E(0,0,0)); // b = k - t - D
        seed.push(erow);
      }

      var genericCls='SI';
      var criticalCls = wantSCD?'SCD':'SCI';
      var thirdCls = thirdOf(genericCls, criticalCls);
      var descriptors={};
      descriptors[genericCls]={type:'except-relation', D:D};
      descriptors[criticalCls]={type:'relation', D:D};
      descriptors[thirdCls]={type:'none'};

      return { rows:rows, cols:cols, seed:seed, numParams:2, location:'B', descriptors:descriptors };
    }

    // ---------- punto de entrada del generador ----------
    function generateSystem(selections){
      var numParams = selections.numParams, location = selections.location;
      var shapePool = SHAPES;
      if(numParams===2 && location==='ambos') shapePool = SHAPES.filter(function(s){ return s.rows>=s.cols; });
      var shape = randChoice(shapePool);

      var built, tries=0;
      do{
        if(numParams===1) built = (location==='B') ? build1ParamB(shape) : build1Param(location, shape);
        else built = (location==='ambos') ? build2ParamAmbos(shape) : (location==='A') ? build2ParamA(shape) : build2ParamB(shape);
        built.matrix = scramble(built.seed, built.rows, randInt(3,5));
        tries++;
      } while(maxAbsConst(built.matrix) > 30 && tries < 50);

      built.paramNames = numParams===1 ? ['k'] : ['k','t'];
      built.options = {};
      CLASSES.forEach(function(cls){ built.options[cls] = buildOptions(built.descriptors[cls]); });
      return built;
    }

    // ---------- render de descriptores / distractores / opciones ---------
    function renderDescriptor(d){
      switch(d.type){
        case 'except': return 'k ≠ ' + d.value;
        case 'value': return 'k = ' + d.value;
        case 'none': return 'Ningún valor';
        case 'pair': return 'k = ' + d.k + ',  t = ' + d.t;
        case 'partial': return 'k = ' + d.k + ',  t ≠ ' + d.tNot;
        case 'except-k': return 'k ≠ ' + d.k + ' (cualquier t)';
        case 'relation': return 'k = t' + (d.D===0 ? '' : (d.D>0 ? ' + ' + d.D : ' − ' + Math.abs(d.D)));
        case 'except-relation': return 'k ≠ t' + (d.D===0 ? '' : (d.D>0 ? ' + ' + d.D : ' − ' + Math.abs(d.D)));
      }
    }
    function descEq(a,b){
      if(a.type!==b.type) return false;
      switch(a.type){
        case 'except': case 'value': return a.value===b.value;
        case 'none': return true;
        case 'pair': return a.k===b.k && a.t===b.t;
        case 'partial': return a.k===b.k && a.tNot===b.tNot;
        case 'except-k': return a.k===b.k;
        case 'relation': case 'except-relation': return a.D===b.D;
      }
    }
    function buildDistractors(d){
      switch(d.type){
        case 'except': return [{type:'value',value:d.value}, {type:'value',value:d.value+randNonZero(-2,2)}, {type:'none'}];
        case 'value': return [{type:'except',value:d.value}, {type:'value',value:d.value+randNonZero(-2,2)}, {type:'none'}];
        case 'none': return [{type:'value',value:randInt(-3,3)}, {type:'except',value:randInt(-3,3)}];
        case 'pair': return [{type:'partial',k:d.k,tNot:d.t}, {type:'pair',k:d.k+randNonZero(-2,2),t:d.t}, {type:'pair',k:d.k,t:d.t+randNonZero(-2,2)}];
        case 'partial': return [{type:'pair',k:d.k,t:d.tNot}, {type:'partial',k:d.k+randNonZero(-2,2),tNot:d.tNot}, {type:'except-k',k:d.k}];
        case 'except-k': return [{type:'pair',k:d.k,t:randInt(-3,3)}, {type:'none'}, {type:'except-k',k:d.k+randNonZero(-2,2)}];
        case 'relation': return [{type:'except-relation',D:d.D}, {type:'relation',D:d.D+randNonZero(-2,2)}, {type:'none'}];
        case 'except-relation': return [{type:'relation',D:d.D}, {type:'except-relation',D:d.D+randNonZero(-2,2)}, {type:'none'}];
      }
    }
    function buildOptions(correct){
      var pool = buildDistractors(correct);
      var picked = [];
      pool.forEach(function(cand){
        if(descEq(cand, correct)) return;
        if(picked.some(function(p){ return descEq(p, cand); })) return;
        picked.push(cand);
      });
      picked = picked.slice(0,3);
      var all = [{d:correct, value:'correct'}].concat(picked.map(function(d,i){ return {d:d, value:'w'+i}; }));
      for(var i=all.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=all[i]; all[i]=all[j]; all[j]=tmp; }
      return all.map(function(o){ return { value:o.value, label: renderDescriptor(o.d) }; });
    }

    // ---------- render de la matriz [A|B] parametrizada con KaTeX ----------
    function entryToLatex(e, paramNames){
      var parts = [];
      function push(str, isNeg){
        if(parts.length===0) parts.push((isNeg?'-':'')+str);
        else parts.push((isNeg?' - ':' + ')+str);
      }
      if(e[0]!==0) push(String(Math.abs(e[0])), e[0]<0);
      var coefs = [e[1], e[2]];
      for(var i=0;i<paramNames.length;i++){
        var coef = coefs[i];
        if(coef===0) continue;
        var abs = Math.abs(coef);
        push((abs===1?'':String(abs)) + paramNames[i], coef<0);
      }
      return parts.length ? parts.join('') : '0';
    }
    function matrixLatex(current){
      var colsSpec = new Array(current.cols).fill('c').join('') + '|c';
      var rows = current.matrix.map(function(row){
        return row.map(function(e){ return entryToLatex(e, current.paramNames); }).join(' & ');
      });
      return '[A \\mid B] = \\left(\\begin{array}{' + colsSpec + '} ' + rows.join(' \\\\ ') + ' \\end{array}\\right)';
    }
    function renderContent(container, current){
      window.katex.render(matrixLatex(current), container, { throwOnError:false });
    }

    // ---------- config del engine ----------
    window.AptActivity.init({
      mount: '#apt-u1a10',
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 1 · Sistemas lineales',
      title: 'Rouché-Frobenius con parámetros',
      subtitle: 'Elegí cuántos parámetros y dónde van. Después vas a tener que hallar, para cada clasificación, los valores que la producen.',

      generate: generateSystem,
      renderContent: renderContent,

      phases: [
        {
          mode: 'setup',
          fields: [
            { key:'numParams', label:'¿Cuántos parámetros?', options:[
              { value:1, label:'1 parámetro' },
              { value:2, label:'2 parámetros' }
            ]},
            { key:'location', label:'¿Dónde van?', options:[
              { value:'A', label:'Solo en A' },
              { value:'B', label:'Solo en B' },
              { value:'ambos', label:'En ambos' }
            ]}
          ],
          buttonLabel: 'Generar sistema'
        },
        {
          mode: 'choices',
          question: '¿Para qué valores hace que el sistema sea SCD (compatible determinado)?',
          choices: function(current){ return current.options.SCD; },
          check: function(current, value){ return value === 'correct'; },
          explain: function(current, correct, value){
            var msg = 'La condición correcta es: ' + renderDescriptor(current.descriptors.SCD) + '. Orlando, ahí rango(A) llega al número de incógnitas y coincide con rango([A|B]).';
            if(current.descriptors.SCD.type === 'none') msg = 'Con esta forma, rango(A) nunca puede llegar al número de incógnitas — SCD es imposible acá, para cualquier valor de los parámetros.';
            return (correct ? '' : 'No es correcto. ') + msg;
          }
        },
        {
          mode: 'choices',
          question: '¿Y para SCI (compatible indeterminado)?',
          choices: function(current){ return current.options.SCI; },
          check: function(current, value){ return value === 'correct'; },
          explain: function(current, correct, value){
            var msg = 'La condición correcta es: ' + renderDescriptor(current.descriptors.SCI) + '. Ahí rango(A) = rango([A|B]), pero por debajo del número de incógnitas.';
            if(current.descriptors.SCI.type === 'none') msg = 'Con este sistema, SCI no ocurre para ningún valor de los parámetros.';
            return (correct ? '' : 'No es correcto. ') + msg;
          }
        },
        {
          mode: 'choices',
          question: '¿Y para SI (incompatible)?',
          choices: function(current){ return current.options.SI; },
          check: function(current, value){ return value === 'correct'; },
          explain: function(current, correct, value){
            var msg = 'La condición correcta es: ' + renderDescriptor(current.descriptors.SI) + '. Ahí, orlando con la columna B aparece un menor no nulo que no estaba en A: rango([A|B]) > rango(A).';
            if(current.descriptors.SI.type === 'none') msg = 'Con este sistema, SI no ocurre para ningún valor de los parámetros.';
            return (correct ? '' : 'No es correcto. ') + msg;
          }
        }
      ]
    });
  })();

})();
