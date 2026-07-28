/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 13
   "Producto de una matriz por un escalar"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-13-producto-por-escalar.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a13')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a13';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
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

    function generateCase(){
      var rows, cols;
      do{ rows=randInt(1,3); cols=randInt(1,3); }while(rows===1 && cols===1); // 1x1: dos distractores colapsarían en lo mismo
      var A = buildMatrix(rows,cols);
      var k = randChoice([-6,-5,-4,-3,-2,-1,2,3,4,5,6]); // sin 0 ni 1 (triviales)
      var correct = A.map(function(row){ return row.map(function(v){ return k*v; }); });

      var allCells = [];
      for(var r=0;r<rows;r++) for(var c=0;c<cols;c++) allCells.push([r,c]);
      var pool = shuffleArr(allCells);
      while(pool.length < 3) pool.push(pool[pool.length % allCells.length]);

      var d1 = correct.map(function(row){ return row.slice(); });
      d1[pool[0][0]][pool[0][1]] = A[pool[0][0]][pool[0][1]]; // "me olvidé de multiplicar esta celda"

      var d2 = correct.map(function(row){ return row.slice(); });
      d2[pool[1][0]][pool[1][1]] = -k * A[pool[1][0]][pool[1][1]]; // "invertí el signo en esta celda"

      var d3, delta, tries=0;
      do{
        d3 = correct.map(function(row){ return row.slice(); });
        delta = randNonZero(-4,4);
        d3[pool[2][0]][pool[2][1]] = correct[pool[2][0]][pool[2][1]] + delta;
        tries++;
      } while((matricesEqual(d3,correct) || matricesEqual(d3,d1) || matricesEqual(d3,d2)) && tries<30);

      var allOpts = [
        { kind:'sum', matrix:correct, correct:true },
        { kind:'forgot-cell', matrix:d1, correct:false },
        { kind:'sign-cell', matrix:d2, correct:false },
        { kind:'tweak-cell', matrix:d3, correct:false }
      ];
      var wrongIdx = 0;
      var choicesData = allOpts.map(function(o){
        var value = o.correct ? 'correct' : ('w'+(wrongIdx++));
        return { value:value, kind:o.kind, matrix:o.matrix, correct:o.correct };
      });
      choicesData = shuffleArr(choicesData);

      return { rows:rows, cols:cols, A:A, k:k, choicesData:choicesData };
    }

    function matrixLatex(M){
      return '\\begin{pmatrix} ' + M.map(function(row){ return row.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
    }
    function renderContent(container, current){
      container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;"><div class="apt-row apt-row-k"></div><div class="apt-row apt-row-a"></div></div>';
      var rowK = container.querySelector('.apt-row-k');
      var rowA = container.querySelector('.apt-row-a');
      window.katex.render('k = ' + current.k, rowK, { throwOnError:false });
      window.katex.render('A = ' + matrixLatex(current.A), rowA, { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u1a13',
      mode: 'choices',
      needsKatex: true,
      choicesGrid: true,
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Producto de una matriz por un escalar',
      subtitle: 'Elegí cuál es el resultado de multiplicar k · A.',

      generate: generateCase,
      renderContent: renderContent,
      choices: function(current){
        return current.choicesData.map(function(o){
          return { value:o.value, label: window.katex.renderToString(matrixLatex(o.matrix), { throwOnError:false }) };
        });
      },
      check: function(current, value){ return value === 'correct'; },
      explain: function(current, correct, value){
        var clicked = current.choicesData.filter(function(o){ return o.value===value; })[0];
        if(correct) return 'Correcto: cada entrada de A se multiplica por k.';
        var msg = 'Cada entrada de A se multiplica por k.';
        if(clicked.kind === 'forgot-cell') msg = 'Esa opción se olvidó de multiplicar una de las celdas.';
        if(clicked.kind === 'sign-cell') msg = 'Esa opción invirtió el signo en una de las celdas.';
        if(clicked.kind === 'tweak-cell') msg = 'Esa opción tiene un error de cálculo en una celda.';
        return 'No es correcto. ' + msg;
      }
    });
  })();

})();
