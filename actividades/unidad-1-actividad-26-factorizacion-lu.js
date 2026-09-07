/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 26
   "Factorización LU"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-26-factorizacion-lu.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a26')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a26';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

(function(){
  var SHAPES = [
    { rows:2, cols:2 }, { rows:3, cols:3 }, { rows:4, cols:4 },
    { rows:2, cols:3 }, { rows:3, cols:2 },
    { rows:3, cols:4 }, { rows:4, cols:3 }
  ];

  var RANGES = {
    2: { lSub:[-3,3], uDiag:[1,4], uOff:[-4,4] },
    3: { lSub:[-3,3], uDiag:[1,3], uOff:[-3,3] },
    4: { lSub:[-2,2], uDiag:[1,3], uOff:[-2,2] }
  };

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function shuffleArr(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){
      var j = randInt(0,i);
      var t = a[i]; a[i]=a[j]; a[j]=t;
    }
    return a;
  }

  // ---------- Generador ----------
  // A puede ser cuadrada o rectangular. k = min(filas, columnas).
  // L es filas×k (triangular inferior unitaria en el bloque k×k; si sobran
  // filas, esas filas extra son libres). U es k×columnas (triangular
  // superior en el bloque k×k, diagonal ≠ 0; si sobran columnas, esas
  // columnas extra son libres). A = L·U.
  //
  // Como en el caso cuadrado: la diagonal de U nunca es cero, así que los
  // menores principales del bloque k×k de A son todos no nulos por
  // construcción — A admite LU sin reordenar filas, sea cuadrada o
  // rectangular. Con la diagonal de L fija en 1, la factorización sigue
  // siendo única. Validado con 2.000 simulaciones (cuadrado + las 4
  // combinaciones rectangulares).
  function generateLU(){
    var shape = randChoice(SHAPES);
    var rows = shape.rows, cols = shape.cols;
    var k = Math.min(rows, cols);
    var r = RANGES[k];
    var L = [], U = [];
    var i, j;
    for(i=0;i<rows;i++) L.push(new Array(k).fill(0));
    for(i=0;i<k;i++) U.push(new Array(cols).fill(0));

    for(i=0;i<rows;i++){
      for(j=0;j<k;j++){
        if(j>i) L[i][j] = 0;
        else if(j===i) L[i][j] = 1;
        else L[i][j] = randInt(r.lSub[0], r.lSub[1]);
      }
    }
    for(i=0;i<k;i++){
      for(j=0;j<cols;j++){
        if(j<i) U[i][j] = 0;
        else if(j===i){
          var mag = randInt(r.uDiag[0], r.uDiag[1]);
          U[i][j] = Math.random() < 0.5 ? mag : -mag;
        } else {
          U[i][j] = randInt(r.uOff[0], r.uOff[1]);
        }
      }
    }

    var A = [];
    for(i=0;i<rows;i++){
      A.push(new Array(cols).fill(0));
      for(j=0;j<cols;j++){
        var s = 0;
        for(var t=0;t<k;t++) s += L[i][t]*U[t][j];
        A[i][j] = s;
      }
    }
    return { rows:rows, cols:cols, k:k, L:L, U:U, A:A };
  }

  // ---------- Preguntas de dimensión ----------
  function dimOptionsFor(rows, cols, kind){
    var k = Math.min(rows, cols);
    var correct = kind === 'L' ? (rows + '×' + k) : (k + '×' + cols);
    var candidates = [
      rows + '×' + cols,        // "L/U tiene la misma forma que A"
      cols + '×' + rows,        // forma traspuesta de A
      k + '×' + k,              // "siempre son cuadradas k×k"
      rows + '×' + rows,        // cuadrada usando filas
      cols + '×' + cols,        // cuadrada usando columnas
      (rows-1) + '×' + k, rows + '×' + (k-1),
      (k-1) + '×' + cols, k + '×' + (cols-1)
    ];
    var pool = [];
    candidates.forEach(function(c){
      if(c !== correct && pool.indexOf(c) === -1) pool.push(c);
    });
    var distractors = shuffleArr(pool).slice(0,2);
    return shuffleArr([correct].concat(distractors)).map(function(label){ return { value:label, label:label }; });
  }

  function explainDim(current, kind, correct){
    var rows = current.rows, cols = current.cols, k = current.k;
    if(correct){
      return kind === 'L'
        ? 'L tiene tantas filas como A (' + rows + ') y ' + k + ' columnas — el menor entre filas y columnas de A.'
        : 'U tiene tantas columnas como A (' + cols + ') y ' + k + ' filas — el menor entre filas y columnas de A.';
    }
    return kind === 'L'
      ? 'No es correcto. L es ' + rows + '×' + k + ': tantas filas como A, y ' + k + ' columnas (el menor entre filas y columnas de A).'
      : 'No es correcto. U es ' + k + '×' + cols + ': ' + k + ' filas (el menor entre filas y columnas de A) y tantas columnas como A.';
  }

  function matrixLatex(M){
    var cols = M[0].length;
    return '\\left[\\begin{array}{' + new Array(cols+1).join('c') + '}' +
      M.map(function(row){ return row.join(' & '); }).join(' \\\\ ') +
      '\\end{array}\\right]';
  }

  // ---------- Fases de grilla (L y U) ----------
  function makeGridPhase(kind){
    return {
      mode: 'grid',
      question: 'Completá ' + kind + ':',
      hint: 'Los recuadros punteados ya vienen dados. Tocá − o + para cambiar el signo de los que faltan.',
      grid: {
        rows: function(current){ return kind === 'L' ? current.rows : current.k; },
        cols: function(current){ return kind === 'L' ? current.k : current.cols; },
        noDivider: true,
        lockedValue: function(current, r, c){
          if(kind === 'L'){
            if(c > r) return 0;
            if(c === r) return 1;
            return null;
          }
          if(r > c) return 0;
          return null;
        }
      },
      checkGrid: function(current, M, hasEmpty){
        var trueM = kind === 'L' ? current.L : current.U;
        var rows = kind === 'L' ? current.rows : current.k;
        var cols = kind === 'L' ? current.k : current.cols;
        var correct = !hasEmpty;
        var cellStatus = [];
        for(var r=0;r<rows;r++){
          var rowStatus = [];
          for(var c=0;c<cols;c++){
            var isFree = kind === 'L' ? (c < r) : (r <= c);
            if(!isFree){ rowStatus.push(null); continue; }
            var ok = M[r][c] === trueM[r][c];
            if(!ok) correct = false;
            rowStatus.push(ok ? 'correct' : 'wrong');
          }
          cellStatus.push(rowStatus);
        }
        var feedbackText;
        if(hasEmpty) feedbackText = 'Dejaste alguna celda vacía (se tomó como 0 para revisar) — completá todas antes de comprobar la próxima vez.';
        else if(correct) feedbackText = kind === 'L' ? 'Esos son los multiplicadores correctos de la eliminación de Gauss.' : '¡Completaste la factorización! A = L · U.';
        else feedbackText = 'No es correcto — revisá los números marcados en rojo.';
        return { correct: correct, cellStatus: cellStatus, feedbackText: feedbackText };
      },
      getAnswerGrid: function(current){ return kind === 'L' ? current.L : current.U; },
      answerTitle: 'Estos son los valores correctos',
      answerText: 'Con esta A, esta es la única factorización posible (la diagonal fija de L la hace única).'
    };
  }

  AptActivity.init({
    mount: '#apt-u1a26',
    eyebrow: 'Unidad 1 · Matrices y SEL',
    title: 'Factorización LU',
    subtitle: 'L es triangular inferior con 1 en la diagonal; U es triangular superior. Encontrá ambas tal que A = L · U.',
    nextLabel: 'Probar con otra matriz →',
    needsKatex: true,
    mode: 'phases',
    generate: generateLU,
    renderContent: function(container, current){
      window.katex.render(matrixLatex(current.A), container, { throwOnError:false });
    },
    phases: [
      {
        mode: 'choices',
        question: '¿Qué dimensión tiene la matriz L?',
        choices: function(current){ return dimOptionsFor(current.rows, current.cols, 'L'); },
        check: function(current, value){ return value === current.rows + '×' + current.k; },
        explain: function(current, correct){ return explainDim(current, 'L', correct); }
      },
      makeGridPhase('L'),
      {
        mode: 'choices',
        question: '¿Qué dimensión tiene la matriz U?',
        choices: function(current){ return dimOptionsFor(current.rows, current.cols, 'U'); },
        check: function(current, value){ return value === current.k + '×' + current.cols; },
        explain: function(current, correct){ return explainDim(current, 'U', correct); }
      },
      makeGridPhase('U')
    ]
  });
})();

})();
