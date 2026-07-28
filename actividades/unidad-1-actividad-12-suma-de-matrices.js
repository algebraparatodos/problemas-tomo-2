/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 12
   "Suma de matrices"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-12-suma-de-matrices.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a12')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a12';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  /* CSS propio de esta actividad (el engine no cubre este layout).
     Los delimitadores NO se definen acá: se usan las clases del
     engine, para que un cambio de notación llegue solo. */
  (function injectCSS() {
    var ID = 'apt-u1a12-style';
    if (document.getElementById(ID)) return;
    var st = document.createElement('style');
    st.id = ID;
    st.textContent = "/* Propio de esta actividad — separación entre las filas \"A =\" y\n   \"B =\" del contenido. Vive dentro de .apt-act__content, así que\n   hereda las variables de color del engine sin problema. */\n.apt-sum__stack{ display:flex; flex-direction:column; align-items:center; width:100%; }\n.apt-sum__row{ margin: 6px 0; max-width:100%; font-size:clamp(12px,4vw,17px); }\n.apt-sum__row:first-child{ margin-top: 0; }\n.apt-sum__row:last-child{ margin-bottom: 0; }";
    document.head.appendChild(st);
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

    // ---------- densidad compatible:incompatible en 3:1 ----------
    var TARGET_WEIGHTS = { compatible: 3, incompatible: 1 };
    var caseCount = { compatible: 0, incompatible: 0 };
    function pickCaseType(){
      var rc = caseCount.compatible / TARGET_WEIGHTS.compatible;
      var ri = caseCount.incompatible / TARGET_WEIGHTS.incompatible;
      var type = rc <= ri ? 'compatible' : 'incompatible';
      caseCount[type]++;
      return type;
    }

    // ---------- generación de matrices ----------
    function randShape(){ return { rows: randInt(1,3), cols: randInt(1,3) }; }
    function shapesEqual(a,b){ return a.rows===b.rows && a.cols===b.cols; }
    function buildMatrix(rows,cols){
      var M=[];
      for(var r=0;r<rows;r++){ var row=[]; for(var c=0;c<cols;c++) row.push(randNonZero(-9,9)); M.push(row); }
      return M;
    }
    function randCell(rows,cols){ return [randInt(0,rows-1), randInt(0,cols-1)]; }
    function addMatrices(A,B){ return A.map(function(row,i){ return row.map(function(v,j){ return v+B[i][j]; }); }); }
    // Redimensiona M a rows×cols con ceros donde falte, anclando el
    // contenido original en la esquina indicada (arriba-izq. por
    // defecto, o abajo-der. si anchorBR es true).
    function resizeAnchored(M, rows, cols, anchorBR){
      var offR = anchorBR ? (rows - M.length) : 0;
      var offC = anchorBR ? (cols - M[0].length) : 0;
      var out=[];
      for(var i=0;i<rows;i++){
        var row=[];
        for(var j=0;j<cols;j++){
          var si=i-offR, sj=j-offC;
          row.push((si>=0 && si<M.length && sj>=0 && sj<M[0].length) ? M[si][sj] : 0);
        }
        out.push(row);
      }
      return out;
    }

    // ---------- opciones cuando A y B SÍ tienen el mismo tamaño ----------
    // Correcta: A+B entrada por entrada. Dos distractores "muy parecidos":
    // uno resta en una celda en vez de sumar, el otro tiene un error de
    // cálculo (un número distinto) en OTRA celda.
    function generateCompatibleOptions(A,B){
      var correctSum = addMatrices(A,B);
      var rows=correctSum.length, cols=correctSum[0].length;

      var subCell = randCell(rows,cols);
      var d1 = correctSum.map(function(r){ return r.slice(); });
      d1[subCell[0]][subCell[1]] = A[subCell[0]][subCell[1]] - B[subCell[0]][subCell[1]];

      var tweakCell;
      if(rows*cols > 1){
        do{ tweakCell = randCell(rows,cols); } while(tweakCell[0]===subCell[0] && tweakCell[1]===subCell[1]);
      } else {
        tweakCell = subCell;
      }
      var avoidVals = [ correctSum[tweakCell[0]][tweakCell[1]], d1[tweakCell[0]][tweakCell[1]] ];
      var val, tries=0;
      do{ val = correctSum[tweakCell[0]][tweakCell[1]] + randNonZero(-3,3); tries++; }
      while(avoidVals.indexOf(val)!==-1 && tries<20);
      var d2 = correctSum.map(function(r){ return r.slice(); });
      d2[tweakCell[0]][tweakCell[1]] = val;

      return [
        { kind:'sum', matrix:correctSum, correct:true },
        { kind:'sub-error', matrix:d1, correct:false },
        { kind:'tweak-error', matrix:d2, correct:false }
      ];
    }

    // ---------- opciones cuando A y B NO tienen el mismo tamaño ----------
    // Tres formas típicas de "forzar" una suma que en realidad no existe:
    // rellenar con ceros hasta el tamaño más grande anclando arriba-izq.,
    // la misma idea pero anclando abajo-der. (siempre da algo distinto —
    // alguna de las dos matrices no llena el lienzo completo, así que
    // cambia de posición según la esquina), y recortar al solape (la
    // zona donde ambas coinciden). Las tres formas quedan garantizadas
    // distintas entre sí por construcción, sin importar las formas de
    // A y B.
    function generateIncompatibleOptions(A,shapeA,B,shapeB){
      var maxR=Math.max(shapeA.rows,shapeB.rows), maxC=Math.max(shapeA.cols,shapeB.cols);
      var minR=Math.min(shapeA.rows,shapeB.rows), minC=Math.min(shapeA.cols,shapeB.cols);
      var padTL = addMatrices(resizeAnchored(A,maxR,maxC,false), resizeAnchored(B,maxR,maxC,false));
      var padBR = addMatrices(resizeAnchored(A,maxR,maxC,true), resizeAnchored(B,maxR,maxC,true));
      var trunc = addMatrices(resizeAnchored(A,minR,minC,false), resizeAnchored(B,minR,minC,false));

      return [
        { kind:'pad-topleft', matrix:padTL, correct:false },
        { kind:'pad-bottomright', matrix:padBR, correct:false },
        { kind:'trunc-overlap', matrix:trunc, correct:false }
      ];
    }

    function generateCase(){
      var type = pickCaseType();
      var shapeA = randShape();
      var shapeB;
      if(type === 'compatible'){
        shapeB = shapeA;
      } else {
        do{ shapeB = randShape(); } while(shapesEqual(shapeA, shapeB));
      }
      var A = buildMatrix(shapeA.rows, shapeA.cols);
      var B = buildMatrix(shapeB.rows, shapeB.cols);

      var matrixOptions = type === 'compatible'
        ? generateCompatibleOptions(A,B)
        : generateIncompatibleOptions(A,shapeA,B,shapeB);

      var allOpts = matrixOptions.concat([{ kind:'none', correct: type==='incompatible' }]);
      var wrongIdx = 0;
      var choicesData = allOpts.map(function(o){
        var value = o.correct ? 'correct' : ('w' + (wrongIdx++));
        return { value:value, kind:o.kind, matrix:o.matrix, correct:o.correct };
      });
      choicesData = shuffleArr(choicesData);

      return { shapeA:shapeA, shapeB:shapeB, A:A, B:B, type:type, choicesData:choicesData };
    }

    // ---------- render ----------
    function matrixLatex(M){
      var rows = M.map(function(row){ return row.join(' & '); });
      return '\\begin{pmatrix} ' + rows.join(' \\\\ ') + ' \\end{pmatrix}';
    }
    function renderContent(container, current){
      container.innerHTML =
        '<div class="apt-sum__stack">' +
          '<div class="apt-sum__row apt-sum__row--a"></div>' +
          '<div class="apt-sum__row apt-sum__row--b"></div>' +
        '</div>';
      window.katex.render('A = ' + matrixLatex(current.A), container.querySelector('.apt-sum__row--a'), { throwOnError:false });
      window.katex.render('B = ' + matrixLatex(current.B), container.querySelector('.apt-sum__row--b'), { throwOnError:false });
    }

    function shapeTxt(s){ return s.rows + '×' + s.cols; }

    function explain(current, correct, value){
      var clicked = current.choicesData.filter(function(o){ return o.value===value; })[0];
      if(current.type === 'compatible'){
        if(clicked.kind === 'none'){
          return (correct?'':'No es correcto. ') + 'Sí se puede sumar: A y B tienen el mismo tamaño (' + shapeTxt(current.shapeA) + '), así que A + B existe.';
        }
        var msg = 'La suma correcta es A + B, sumando entrada por entrada.';
        if(clicked.kind === 'sub-error') msg = 'Esa opción resta en una celda en vez de sumar.';
        if(clicked.kind === 'tweak-error') msg = 'Esa opción tiene un error de cálculo en una celda.';
        return (correct?'':'No es correcto. ') + msg;
      }
      if(clicked.kind === 'none'){
        return 'Correcto: A es ' + shapeTxt(current.shapeA) + ' y B es ' + shapeTxt(current.shapeB) + ' — al no compartir el mismo tamaño, A + B no está definida.';
      }
      return 'No es correcto. A (' + shapeTxt(current.shapeA) + ') y B (' + shapeTxt(current.shapeB) + ') no tienen el mismo tamaño: no se pueden sumar, así que ninguna de las matrices mostradas es una suma válida.';
    }

    // ---------- config del engine ----------
    window.AptActivity.init({
      mount: '#apt-u1a12',
      mode: 'choices',
      needsKatex: true,
      choicesGrid: true,
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Suma de matrices',
      subtitle: 'Elegí cuál es el resultado de la operación A+B. Si no se pueden sumar, elegí esa opción.',

      generate: generateCase,
      renderContent: renderContent,

      choices: function(current){
        return current.choicesData.map(function(o){
          return {
            value: o.value,
            label: o.kind === 'none' ? 'No es posible sumar' : window.katex.renderToString(matrixLatex(o.matrix), { throwOnError:false })
          };
        });
      },
      check: function(current, value){ return value === 'correct'; },
      explain: explain
    });
  })();

})();
