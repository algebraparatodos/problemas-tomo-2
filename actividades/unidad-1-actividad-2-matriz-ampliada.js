/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 2
   "Matriz ampliada"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-2-matriz-ampliada.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a2')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a2';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    var VARS = ['x','y','z'];

    function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

    function coeff(){
      if(Math.random() < 0.22) return 0;
      var v = randInt(-9,9);
      while(v === 0) v = randInt(-9,9);
      return v;
    }

    function generateSystem(){
      var A;
      do {
        A = [];
        for(var r=0;r<3;r++) A.push([coeff(), coeff(), coeff()]);
      } while(A.some(function(row){ return row.every(function(v){ return v===0; }); }));
      var b = [randInt(-9,9), randInt(-9,9), randInt(-9,9)];
      return { A: A, b: b };
    }

    function termsToLatex(rowCoeffs){
      var parts = [];
      rowCoeffs.forEach(function(c,i){
        if(c === 0) return;
        var v = VARS[i];
        var abs = Math.abs(c);
        var coefStr = abs === 1 ? '' : String(abs);
        if(parts.length === 0){
          parts.push((c<0 ? '-' : '') + coefStr + v);
        } else {
          parts.push((c<0 ? ' - ' : ' + ') + coefStr + v);
        }
      });
      return parts.length ? parts.join('') : '0';
    }

    function systemLines(A,b){
      return A.map(function(row,i){ return termsToLatex(row) + ' = ' + b[i]; });
    }

    function explainResults(results){
      var wrong = results.filter(function(r){ return !r.ok; });
      if(wrong.length === 0){
        return 'Correcto: cada fila son los coeficientes de x, y, z (en ese orden) y, después de la barra, el término independiente.';
      }
      var first = wrong[0];
      var colName = first.col < 3 ? ('el coeficiente de ' + VARS[first.col]) : 'el término independiente';
      var shown = (first.val === null || first.val === undefined) ? '(vacío)' : first.val;
      var msg = 'En la fila ' + (first.row+1) + ', ' + colName + ' no es correcto: pusiste ' + shown + '.';
      if(wrong.length > 1){
        msg += ' Hay ' + (wrong.length-1) + ' celda' + (wrong.length-1>1?'s':'') + ' más marcada' + (wrong.length-1>1?'s':'') + ' en rojo — si una variable no aparece en la ecuación, su coeficiente es 0.';
      }
      return msg;
    }

    window.AptActivity.init({
      mount: '#apt-u1a2',
      eyebrow: 'Unidad 1 · Sistemas lineales',
      title: 'Matriz ampliada',
      subtitle: 'Mirá el sistema y completá su matriz ampliada.',
      nextLabel: 'Probar con otro sistema →',
      needsKatex: true,
      mode: 'grid',
      grid: { rows: 3, cols: 4, dividerAfterCol: 3 },
      generate: function(){
        return generateSystem();
      },
      renderContent: function(container, current){
        window.AptActivity.renderSystemOfEquations(container, systemLines(current.A, current.b));
      },
      cellAriaLabel: function(current, r, c){
        return 'Fila ' + (r+1) + (c<3 ? ', valor absoluto del coeficiente de ' + VARS[c] : ', valor absoluto del término independiente');
      },
      checkGrid: function(current, M, hasEmpty){
        var results = [];
        var cellStatus = [[],[],[]];
        for(var r=0;r<3;r++){
          for(var c=0;c<4;c++){
            var correctVal = c<3 ? current.A[r][c] : current.b[r];
            var val = M[r][c];
            var ok = val === correctVal;
            cellStatus[r][c] = ok ? 'correct' : 'wrong';
            results.push({ row:r, col:c, ok:ok, val:val, correct:correctVal });
          }
        }
        var allOk = results.every(function(r){ return r.ok; });
        return { correct: allOk, cellStatus: cellStatus, feedbackText: explainResults(results) };
      },
      getAnswerGrid: function(current){
        return [
          [current.A[0][0], current.A[0][1], current.A[0][2], current.b[0]],
          [current.A[1][0], current.A[1][1], current.A[1][2], current.b[1]],
          [current.A[2][0], current.A[2][1], current.A[2][2], current.b[2]]
        ];
      },
      answerTitle: 'La respuesta correcta',
      answerText: 'Cada fila son los coeficientes de x, y, z (en ese orden) y, después de la barra, el término independiente.'
    });
  })();

})();
