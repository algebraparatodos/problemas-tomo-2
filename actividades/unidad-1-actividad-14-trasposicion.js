/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 14
   "Trasposición de matrices"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-14-trasposicion.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a14')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a14';
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
    function transpose(M){
      var rows=M.length, cols=M[0].length, T=[];
      for(var c=0;c<cols;c++){ var row=[]; for(var r=0;r<rows;r++) row.push(M[r][c]); T.push(row); }
      return T;
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

    function generateCase(){
      var rows, cols;
      do{ rows=randInt(1,3); cols=randInt(1,3); }while(rows===1 && cols===1); // 1x1: A=A^T siempre
      var A = buildMatrix(rows,cols);
      var correct = transpose(A);

      // "no la transpuse" — salvo que A sea simétrica por azar (A=A^T)
      var d1 = !matricesEqual(A,correct) ? A : (function(){
        var m = A.map(function(row){ return row.slice(); });
        var r = randInt(0,rows-1), c = randInt(0,cols-1);
        m[r][c] = m[r][c] + randNonZero(-3,3);
        return m;
      })();

      var d2 = buildDistinctVariant(correct, [d1], function(){
        var m = correct.map(function(row){ return row.slice(); });
        var r = randInt(0,cols-1), c = randInt(0,rows-1);
        m[r][c] = correct[r][c] + randNonZero(-3,3);
        return m;
      });

      // filas de la transpuesta invertidas — salvo que tenga 1 sola fila
      // (A tenía 1 sola columna), donde invierto DENTRO de esa fila; y si
      // encima esa fila es un palíndromo por azar, un respaldo con reintento.
      var reversedCandidate = correct.length>1 ? correct.slice().reverse() : [correct[0].slice().reverse()];
      var d3 = (!matricesEqual(reversedCandidate,correct) && !matricesEqual(reversedCandidate,d1) && !matricesEqual(reversedCandidate,d2))
        ? reversedCandidate
        : buildDistinctVariant(correct, [d1,d2], function(){
            var m = correct.map(function(row){ return row.slice(); });
            var r = randInt(0,cols-1), c = randInt(0,rows-1);
            m[r][c] = m[r][c] + randNonZero(-3,3);
            return m;
          });

      var allOpts = [
        { kind:'transpose', matrix:correct, correct:true },
        { kind:'not-transposed', matrix:d1, correct:false },
        { kind:'tweak-cell', matrix:d2, correct:false },
        { kind:'reversed', matrix:d3, correct:false }
      ];
      var wrongIdx = 0;
      var choicesData = allOpts.map(function(o){
        var value = o.correct ? 'correct' : ('w'+(wrongIdx++));
        return { value:value, kind:o.kind, matrix:o.matrix, correct:o.correct };
      });
      choicesData = shuffleArr(choicesData);

      return { rows:rows, cols:cols, A:A, choicesData:choicesData };
    }

    function matrixLatex(M){
      return '\\begin{pmatrix} ' + M.map(function(row){ return row.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
    }
    function renderContent(container, current){
      window.katex.render('A = ' + matrixLatex(current.A), container, { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u1a14',
      mode: 'choices',
      needsKatex: true,
      choicesGrid: true,
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Trasposición de matrices',
      subtitle: 'Elegí cuál es la matriz traspuesta de $A$ ($A^T$).',

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
        if(correct) return 'Correcto: A^T se arma poniendo como filas las columnas de A (cambia de tamaño ' + current.rows + '×' + current.cols + ' a ' + current.cols + '×' + current.rows + ').';
        var msg = 'Revisá cómo se arma la traspuesta.';
        if(clicked.kind === 'not-transposed') msg = 'Esa opción es A tal cual, sin transponer.';
        if(clicked.kind === 'tweak-cell') msg = 'Esa opción tiene un error de cálculo en una celda.';
        if(clicked.kind === 'reversed') msg = 'Esa opción transpuso, pero además invirtió el orden.';
        return 'No es correcto. ' + msg;
      }
    });
  })();

})();
