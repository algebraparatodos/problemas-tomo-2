/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 15
   "Producto de matrices"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-15-producto-de-matrices.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a15')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a15';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }
    function shuffleArr(arr){
      var a = arr.slice();
      for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
      return a;
    }
    function buildMatrix(rows,cols){
      var M=[];
      for(var r=0;r<rows;r++){ var row=[]; for(var c=0;c<cols;c++) row.push(randNonZero(-9,9)); M.push(row); }
      return M;
    }
    function matricesEqual(A,B){
      if(A.length!==B.length) return false;
      for(var r=0;r<A.length;r++){
        if(A[r].length!==B[r].length) return false;
        for(var c=0;c<A[r].length;c++) if(A[r][c]!==B[r][c]) return false;
      }
      return true;
    }
    function buildDistinctVariant(correctMatrix, existing, generatorFn){
      var candidate, tries=0;
      do{ candidate = generatorFn(); tries++; }
      while((matricesEqual(candidate,correctMatrix) || existing.some(function(m){ return matricesEqual(candidate,m); })) && tries<40);
      return candidate;
    }
    function matMul(A,B){
      var m=A.length, n=A[0].length, q=B[0].length, C=[];
      for(var i=0;i<m;i++){
        var row=[];
        for(var j=0;j<q;j++){
          var sum=0;
          for(var k=0;k<n;k++) sum += A[i][k]*B[k][j];
          row.push(sum);
        }
        C.push(row);
      }
      return C;
    }

    var TARGET_WEIGHTS = { compatible:3, incompatible:1 };
    var caseCount = { compatible:0, incompatible:0 };
    function pickCaseType(){
      var rc = caseCount.compatible / TARGET_WEIGHTS.compatible;
      var ri = caseCount.incompatible / TARGET_WEIGHTS.incompatible;
      var type = rc <= ri ? 'compatible' : 'incompatible';
      caseCount[type]++;
      return type;
    }

    function generateCase(){
      var type = pickCaseType();
      var m = randInt(1,3), n = randInt(1,3), q = randInt(1,3);
      var p;
      if(type==='compatible') p = n;
      else { do{ p = randInt(1,3); }while(p===n); }

      var A = buildMatrix(m,n);
      var B = buildMatrix(p,q);
      var choicesData;

      if(type==='compatible'){
        var correct = matMul(A,B);
        var outRows = m, outCols = q;

        var d1 = buildDistinctVariant(correct, [], function(){
          var c = correct.map(function(r){ return r.slice(); });
          var r = randInt(0,outRows-1), col = randInt(0,outCols-1);
          c[r][col] = c[r][col] + randNonZero(-4,4);
          return c;
        });
        var d2 = buildDistinctVariant(correct, [d1], function(){
          var c = correct.map(function(r){ return r.slice(); });
          var r = randInt(0,outRows-1), col = randInt(0,outCols-1);
          var flipTerm = randInt(0,n-1);
          var sum=0;
          for(var k=0;k<n;k++){ var term=A[r][k]*B[k][col]; sum += (k===flipTerm) ? -term : term; }
          c[r][col] = sum;
          return c;
        });
        var d3 = buildDistinctVariant(correct, [d1,d2], function(){
          var c = correct.map(function(r){ return r.slice(); });
          var r = randInt(0,outRows-1), col = randInt(0,outCols-1);
          if(n>=2){
            var skipTerm = randInt(0,n-1);
            var sum=0;
            for(var k=0;k<n;k++){ if(k!==skipTerm) sum += A[r][k]*B[k][col]; }
            c[r][col] = sum;
          } else {
            c[r][col] = c[r][col] + randNonZero(-4,4);
          }
          return c;
        });

        var allOpts = [
          { kind:'product', matrix:correct, correct:true },
          { kind:'tweak-cell', matrix:d1, correct:false },
          { kind:'sign-term', matrix:d2, correct:false },
          { kind:'missing-term', matrix:d3, correct:false }
        ];
        var wrongIdx = 0;
        choicesData = allOpts.map(function(o){
          var value = o.correct ? 'correct' : ('w'+(wrongIdx++));
          return { value:value, kind:o.kind, matrix:o.matrix, correct:o.correct };
        });
      } else {
        // sin producto real posible: 3 matrices-señuelo con formas plausibles
        var shapes = shuffleArr([[m,q],[p,n],[m,n]]);
        var decoys = [];
        shapes.forEach(function(shape){
          var cand = buildDistinctVariant([], decoys, function(){ return buildMatrix(shape[0], shape[1]); });
          decoys.push(cand);
        });
        var allOptsInc = [
          { kind:'none', correct:true },
          { kind:'decoy', matrix:decoys[0], correct:false },
          { kind:'decoy', matrix:decoys[1], correct:false },
          { kind:'decoy', matrix:decoys[2], correct:false }
        ];
        var wrongIdx2 = 0;
        choicesData = allOptsInc.map(function(o){
          var value = o.correct ? 'correct' : ('w'+(wrongIdx2++));
          return { value:value, kind:o.kind, matrix:o.matrix, correct:o.correct };
        });
      }

      choicesData = shuffleArr(choicesData);
      return { type:type, m:m, n:n, p:p, q:q, A:A, B:B, choicesData:choicesData };
    }

    function matrixLatex(M){
      return '\\begin{pmatrix} ' + M.map(function(row){ return row.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
    }
    function shapeTxt(rows, cols){ return rows + '×' + cols; }
    function renderContent(container, current){
      container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;"><div class="apt-row apt-row-a"></div><div class="apt-row apt-row-b"></div></div>';
      var rows = container.querySelectorAll('.apt-row');
      window.katex.render('A = ' + matrixLatex(current.A), rows[0], { throwOnError:false });
      window.katex.render('B = ' + matrixLatex(current.B), rows[1], { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u1a15',
      mode: 'choices',
      needsKatex: true,
      choicesGrid: true,
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Producto de matrices',
      subtitle: 'Elegí cuál es el resultado de A · B. Si no se pueden multiplicar, elegí esa opción.',

      generate: generateCase,
      renderContent: renderContent,
      choices: function(current){
        return current.choicesData.map(function(o){
          return {
            value: o.value,
            label: o.kind === 'none' ? 'No es posible multiplicar' : window.katex.renderToString(matrixLatex(o.matrix), { throwOnError:false })
          };
        });
      },
      check: function(current, value){ return value === 'correct'; },
      explain: function(current, correct, value){
        var clicked = current.choicesData.filter(function(o){ return o.value===value; })[0];
        if(current.type === 'compatible'){
          if(clicked.kind === 'none') return (correct?'':'No es correcto. ') + 'Sí se puede multiplicar: las columnas de A (' + current.n + ') coinciden con las filas de B (' + current.p + ').';
          var msg = 'El producto se calcula fila de A por columna de B, sumando los productos.';
          if(clicked.kind === 'tweak-cell') msg = 'Esa opción tiene un error de cálculo en una celda.';
          if(clicked.kind === 'sign-term') msg = 'Esa opción invirtió el signo de uno de los términos de la suma en una celda.';
          if(clicked.kind === 'missing-term') msg = 'Esa opción se olvidó de sumar uno de los términos en una celda.';
          return (correct?'':'No es correcto. ') + msg;
        }
        if(clicked.kind === 'none') return 'Correcto: A es ' + shapeTxt(current.m,current.n) + ' y B es ' + shapeTxt(current.p,current.q) + ' — las columnas de A (' + current.n + ') no coinciden con las filas de B (' + current.p + '), así que A · B no está definido.';
        return 'No es correcto. Las columnas de A (' + current.n + ') no coinciden con las filas de B (' + current.p + '): no se pueden multiplicar.';
      }
    });
  })();

})();
