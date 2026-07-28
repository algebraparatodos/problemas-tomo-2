/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 9
   "Clasificá con Rouché-Frobenius"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-9-rouche-frobenius.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a9')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a9';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    var SHAPES = [
      { m:2, n:2 }, { m:2, n:3 }, { m:2, n:4 },
      { m:3, n:2 }, { m:3, n:3 }, { m:3, n:4 }
    ];

    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function pickDistinctSorted(n,k){
      var idx = new Set();
      while(idx.size < k) idx.add(Math.floor(Math.random()*n));
      return Array.from(idx).sort(function(a,b){ return a-b; });
    }

    // ---------- Operaciones elementales de fila (rango exacto por construcción) ----------
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

    // ---------- Generador: arma la matriz AMPLIADA [A|b] directamente
    //             con el rango de A y de [A|b] que queremos, mezclando
    //             después con operaciones elementales sobre la fila
    //             completa (A y b juntos) — eso preserva ambos rangos
    //             exactamente, así que no hace falta verificar nada
    //             por determinantes en tiempo de generación. ----------
    function generateSystem(){
      var shape = randChoice(SHAPES);
      var m = shape.m, n = shape.n;
      var maxOrderA = Math.min(m, n);
      var r = randInt(1, maxOrderA);
      var compatible = (r === m) ? true : randChoice([true, false]);

      var aug, tries = 0;
      do {
        var pivots = pickDistinctSorted(n, r);
        var seed = [];
        for(var i=0;i<r;i++){
          var row = new Array(n+1).fill(0);
          var p = pivots[i];
          row[p] = randNonZero(-6,6);
          for(var c=p+1;c<n;c++) row[c] = randInt(-6,6);
          row[n] = randInt(-6,6); // término independiente: libre en las filas pivote
          seed.push(row);
        }
        for(var j=r;j<m;j++){
          var zrow = new Array(n+1).fill(0);
          zrow[n] = compatible ? 0 : randNonZero(-6,6);
          seed.push(zrow);
        }
        aug = scramble(seed, m, randInt(3,5));
        tries++;
      } while(maxAbs(aug) > 20 && tries < 50);

      var A = aug.map(function(row){ return row.slice(0,n); });
      var b = aug.map(function(row){ return row[n]; });
      var rankA = r;
      var rankAB = r + (compatible ? 0 : 1);
      var classification = rankAB > rankA ? 'SI' : (rankA === n ? 'SCD' : 'SCI');

      return { m:m, n:n, A:A, b:b, rankA:rankA, rankAB:rankAB, classification:classification };
    }

    // ---------- Render de la matriz ampliada [A|b] con KaTeX ----------
    function matrixLatex(current){
      var colsSpec = new Array(current.n).fill('c').join('') + '|c';
      var rows = current.A.map(function(row,i){ return row.concat([current.b[i]]).join(' & '); });
      return '[A \\mid B] = \\left(\\begin{array}{' + colsSpec + '} ' + rows.join(' \\\\ ') + ' \\end{array}\\right)';
    }
    function renderContent(container, current){
      window.katex.render(matrixLatex(current), container, { throwOnError:false });
    }

    function numberChoices(maxOrder){
      var arr = [];
      for(var i=1;i<=maxOrder;i++) arr.push({ value:String(i), label:String(i) });
      return arr;
    }

    // ---------- Config del engine ----------
    window.AptActivity.init({
      mount: '#apt-u1a9',
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 1 · Sistemas lineales',
      title: 'Clasificá con Rouché-Frobenius',
      subtitle: 'Calculá el rango por determinantes y clasificá el sistema.',

      generate: generateSystem,
      renderContent: renderContent,

      phases: [
        {
          mode: 'choices',
          question: '¿Cuál es el rango de la matriz de coeficientes A?',
          choices: function(current){ return numberChoices(Math.min(current.m, current.n)); },
          check: function(current, value){ return parseInt(value,10) === current.rankA; },
          explain: function(current, correct, value){
            var maxOrderA = Math.min(current.m, current.n);
            var msg;
            if(current.rankA === maxOrderA){
              msg = 'rango(A) = ' + current.rankA + ': orlando se llega a un menor de orden ' + current.rankA + ' no nulo, y no hay lugar para un menor de mayor orden dentro de A.';
            } else {
              msg = 'rango(A) = ' + current.rankA + ': orlando se llega a un menor de orden ' + current.rankA + ' no nulo, y cualquier menor de orden mayor dentro de A se anula.';
            }
            return (correct ? '' : 'No es correcto. ') + msg;
          }
        },
        {
          mode: 'choices',
          question: '¿Y el rango de la matriz ampliada [A | B]?',
          choices: function(current){ return numberChoices(Math.min(current.m, current.n + 1)); },
          check: function(current, value){ return parseInt(value,10) === current.rankAB; },
          explain: function(current, correct, value){
            var msg;
            if(current.rankAB > current.rankA){
              msg = 'rango([A|B]) = ' + current.rankAB + ': orlando con la columna B aparece un menor de orden ' + current.rankAB + ' no nulo que no se podía formar usando solo columnas de A.';
            } else {
              msg = 'rango([A|B]) = ' + current.rankAB + ' (igual que rango(A)): todo menor que incluya la columna B, de orden mayor a ' + current.rankA + ', se anula.';
            }
            return (correct ? '' : 'No es correcto. ') + msg;
          }
        },
        {
          mode: 'choices',
          question: 'Según Rouché-Frobenius, ¿cómo se clasifica el sistema?',
          choices: [
            { value:'SCD', label:'SCD', sub:'Compatible determinado' },
            { value:'SCI', label:'SCI', sub:'Compatible indeterminado' },
            { value:'SI',  label:'SI',  sub:'Incompatible' }
          ],
          check: function(current, value){ return current.classification === value; },
          explain: function(current, correct, value){
            var msg;
            if(current.classification === 'SI'){
              msg = 'rango([A|B]) = ' + current.rankAB + ' > rango(A) = ' + current.rankA + ', así que el sistema es incompatible (SI): no tiene solución.';
            } else if(current.classification === 'SCD'){
              msg = 'rango(A) = rango([A|B]) = ' + current.rankA + ', igual al número de incógnitas (' + current.n + '), así que el sistema es compatible determinado (SCD): solución única.';
            } else {
              msg = 'rango(A) = rango([A|B]) = ' + current.rankA + ', menor al número de incógnitas (' + current.n + '), así que el sistema es compatible indeterminado (SCI): infinitas soluciones.';
            }
            return (correct ? '' : 'No es correcto. ') + msg;
          }
        }
      ]
    });
  })();

})();
