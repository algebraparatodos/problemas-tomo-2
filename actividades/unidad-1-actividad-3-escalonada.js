/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 3
   "¿Es escalonada?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-3-escalonada.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a3')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a3';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    var ROWS = 3, COLS = 4;

    function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

    function pivotOf(row){
      for(var c=0;c<COLS;c++) if(row[c] !== 0) return c;
      return null;
    }

    function buildValidEchelon(){
      var rows = [];
      var lastPivot = -1;
      for(var r=0;r<ROWS;r++){
        if(lastPivot >= COLS-1 || Math.random() < 0.15){
          rows.push(new Array(COLS).fill(0));
          continue;
        }
        var pivotCol = randInt(lastPivot+1, COLS-1);
        var row = new Array(COLS).fill(0);
        for(var c=pivotCol;c<COLS;c++){
          row[c] = c===pivotCol ? randInt(1,9)*(Math.random()<0.5?-1:1) : randInt(-9,9);
        }
        rows.push(row);
        lastPivot = pivotCol;
      }
      return rows;
    }

    function breakEchelon(rows){
      var kind = Math.random() < 0.5 ? 'zero-not-last' : 'pivot-not-increasing';
      var r = rows.map(function(row){ return row.slice(); });
      if(kind === 'zero-not-last'){
        var zeroIdx = randInt(0, ROWS-2);
        r[zeroIdx] = new Array(COLS).fill(0);
        if(r[zeroIdx+1].every(function(v){ return v===0; })){
          r[zeroIdx+1][randInt(0,COLS-1)] = randInt(1,9);
        }
        return r;
      } else {
        var idx = randInt(1, ROWS-1);
        var prevPivot = pivotOf(r[idx-1]);
        var col = (prevPivot===null) ? 0 : randInt(0, prevPivot);
        r[idx] = new Array(COLS).fill(0);
        for(var c=col;c<COLS;c++) r[idx][c] = c===col ? randInt(1,9) : randInt(-9,9);
        return r;
      }
    }

    function checkEchelon(rows){
      var lastPivot = -1, sawZero = false;
      for(var i=0;i<rows.length;i++){
        var p = pivotOf(rows[i]);
        if(p === null){ sawZero = true; continue; }
        if(sawZero) return { ok:false, reason:'zero-not-last', badRow:i };
        if(p <= lastPivot) return { ok:false, reason:'pivot-not-increasing', badRow:i, refRow:i-1 };
        lastPivot = p;
      }
      return { ok:true };
    }

    function generate(){
      var rows = Math.random() < 0.45 ? buildValidEchelon() : breakEchelon(buildValidEchelon());
      return { matrix: rows, verdict: checkEchelon(rows) };
    }

    function plainLatex(rows){
      return '\\begin{pmatrix} ' + rows.map(function(r){ return r.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
    }

    function highlightLatex(rows, v){
      var body = rows.map(function(row,ri){
        if(!v.ok && ri===v.badRow) return row.map(function(x){ return '\\textcolor{#D65252}{'+x+'}'; }).join(' & ');
        if(v.ok){
          var p = pivotOf(row);
          return row.map(function(x,c){ return c===p ? '\\textcolor{#5BCD9A}{'+x+'}' : x; }).join(' & ');
        }
        return row.join(' & ');
      }).join(' \\\\ ');
      return '\\begin{pmatrix} ' + body + ' \\end{pmatrix}';
    }

    function explain(v){
      if(v.ok) return 'Es escalonada: cada fila no nula empieza más a la derecha que la anterior, y las filas nulas están al final.';
      if(v.reason === 'zero-not-last') return 'No es escalonada: la fila ' + (v.badRow+1) + ' es no nula pero aparece después de una fila nula.';
      return 'No es escalonada: el primer elemento no nulo de la fila ' + (v.badRow+1) + ' no está estrictamente a la derecha del de la fila ' + (v.refRow+1) + '.';
    }

    window.AptActivity.init({
      mount: '#apt-u1a3',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: '¿Es escalonada?',
      subtitle: 'Mirá la matriz y decidí si está en forma escalonada por filas.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'choices',
      choices: [
        { value:'si', label:'Sí, es escalonada' },
        { value:'no', label:'No, no es escalonada' }
      ],
      generate: function(){
        return generate();
      },
      renderContent: function(container, current){
        window.katex.render(plainLatex(current.matrix), container, { throwOnError:false });
      },
      check: function(current, value){
        return (value === 'si') === current.verdict.ok;
      },
      explain: function(current, correct){
        return explain(current.verdict);
      },
      onAnswered: function(container, current, correct){
        window.katex.render(highlightLatex(current.matrix, current.verdict), container, { throwOnError:false });
      }
    });
  })();

})();
