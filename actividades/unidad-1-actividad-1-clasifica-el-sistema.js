/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 1
   "Clasificá el sistema"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-1-clasifica-el-sistema.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a1')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a1';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    var RANGE = 5, SIZE = 300;
    var SLOPES = [-2,-1,-0.5,0,0.5,1,2];
    var LINE_COLORS = ['#97A1D8', '#E8B85C', '#7FD1C5'];

    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function shuffle(arr){
      var a = arr.slice();
      for(var i=a.length-1;i>0;i--){
        var j = Math.floor(Math.random()*(i+1));
        var t=a[i]; a[i]=a[j]; a[j]=t;
      }
      return a;
    }

    /* Todo cruce que importa para clasificar tiene que verse: dentro de
       la ventana [-RANGE, RANGE] y con margen al borde. */
    var VISIBLE = RANGE - 1;
    /* En el caso «triángulo», los tres cruces tienen que estar bien
       separados entre sí, para que no parezca que las rectas pasan por
       un mismo punto (1 unidad = 30 px). */
    var MIN_SEP = 1.5;

    function cross(l1, l2){
      var x = (l2.b - l1.b)/(l1.m - l2.m);
      return [x, l1.m*x + l1.b];
    }
    function visible(p){ return Math.abs(p[0]) <= VISIBLE && Math.abs(p[1]) <= VISIBLE; }
    function dist(p, q){ return Math.sqrt((p[0]-q[0])*(p[0]-q[0]) + (p[1]-q[1])*(p[1]-q[1])); }

    function generateCase(numLines){
      var category = randChoice(['SCD','SCI','SI']);
      var lines = [], kind = null;
      if(numLines === 2){
        if(category === 'SCD'){
          var m1 = randChoice(SLOPES);
          var m2 = randChoice(SLOPES.filter(function(s){return s!==m1;}));
          do {
            lines = [{m:m1,b:randInt(-3,3)},{m:m2,b:randInt(-3,3)}];
          } while(!visible(cross(lines[0], lines[1])));
        } else if(category === 'SCI'){
          var m = randChoice(SLOPES), b = randInt(-3,3);
          lines = [{m:m,b:b},{m:m,b:b}];
        } else {
          var m3 = randChoice(SLOPES);
          var b1 = randInt(-3,3), b2 = randInt(-3,3);
          while(b2===b1) b2 = randInt(-3,3);
          lines = [{m:m3,b:b1},{m:m3,b:b2}];
        }
      } else {
        if(category === 'SCD'){
          var x0 = randInt(-2,2), y0 = randInt(-2,2);
          var slopes = shuffle(SLOPES).slice(0,3);
          lines = slopes.map(function(m){ return {m:m, b:y0-m*x0}; });
        } else if(category === 'SCI'){
          var m4 = randChoice(SLOPES), b4 = randInt(-3,3);
          lines = [{m:m4,b:b4},{m:m4,b:b4},{m:m4,b:b4}];
        } else if(Math.random() < 0.5){
          /* Dos paralelas y una tercera que corta a las dos, como en la
             Fig. 5 del libro: se ven dos cruces, pero ninguno está en las
             tres rectas. */
          kind = 'paralelas';
          var m5 = randChoice(SLOPES);
          var m6 = randChoice(SLOPES.filter(function(s){return s!==m5;}));
          var b5, b6, b7;
          do {
            b5 = randInt(-3,3); b6 = randInt(-3,3); b7 = randInt(-3,3);
          } while(b6===b5 || !visible(cross({m:m5,b:b5},{m:m6,b:b7})) || !visible(cross({m:m5,b:b6},{m:m6,b:b7})));
          lines = shuffle([{m:m5,b:b5},{m:m5,b:b6},{m:m6,b:b7}]);
        } else {
          /* Tres rectas sin paralelas que se cortan de a dos en tres
             puntos distintos (un triángulo): tampoco hay un punto común
             a las tres. */
          kind = 'triangulo';
          var ms, ok;
          do {
            ms = shuffle(SLOPES).slice(0,3);
            lines = ms.map(function(m){ return {m:m, b:randInt(-3,3)}; });
            var p01 = cross(lines[0],lines[1]), p02 = cross(lines[0],lines[2]), p12 = cross(lines[1],lines[2]);
            ok = visible(p01) && visible(p02) && visible(p12) &&
                 dist(p01,p02) >= MIN_SEP && dist(p01,p12) >= MIN_SEP && dist(p02,p12) >= MIN_SEP;
          } while(!ok);
        }
      }
      return { category: category, lines: lines, kind: kind };
    }

    /* Los cruces de a dos entre rectas no paralelas (sin repetir). */
    function pairCrossings(lines){
      var pts = [];
      for(var i=0;i<lines.length;i++){
        for(var j=i+1;j<lines.length;j++){
          if(lines[i].m !== lines[j].m) pts.push(cross(lines[i], lines[j]));
        }
      }
      return pts;
    }

    function toX(x){ return (x+RANGE)/(2*RANGE)*SIZE; }
    function toY(y){ return SIZE - (y+RANGE)/(2*RANGE)*SIZE; }

    function lineSegment(m,b){
      var pts = [];
      function push(x,y){ if(x>=-RANGE-1e-9 && x<=RANGE+1e-9 && y>=-RANGE-1e-9 && y<=RANGE+1e-9) pts.push([x,y]); }
      push(-RANGE, m*-RANGE+b);
      push(RANGE, m*RANGE+b);
      if(m !== 0){
        push((-RANGE-b)/m, -RANGE);
        push((RANGE-b)/m, RANGE);
      }
      var uniq = [];
      pts.forEach(function(p){
        if(!uniq.some(function(u){ return Math.abs(u[0]-p[0])<1e-6 && Math.abs(u[1]-p[1])<1e-6; })) uniq.push(p);
      });
      if(uniq.length < 2) return null;
      return [uniq[0], uniq[uniq.length-1]];
    }

    /* highlightPoint: la solución (SCD). missPoints: cruces de a dos que
       NO son solución (SI con tres rectas), marcados en otro color. */
    function buildGraphSVG(lines, highlightPoint, missPoints){
      var svg = '<svg viewBox="0 0 '+SIZE+' '+SIZE+'" xmlns="http://www.w3.org/2000/svg">';
      for(var i=-RANGE;i<=RANGE;i++){
        var isAxis = i===0;
        var stroke = isAxis ? 'rgba(151,161,216,0.55)' : 'rgba(151,161,216,0.16)';
        var w = isAxis ? 1.5 : 1;
        svg += '<line x1="'+toX(i)+'" y1="0" x2="'+toX(i)+'" y2="'+SIZE+'" stroke="'+stroke+'" stroke-width="'+w+'"/>';
        svg += '<line x1="0" y1="'+toY(i)+'" x2="'+SIZE+'" y2="'+toY(i)+'" stroke="'+stroke+'" stroke-width="'+w+'"/>';
      }
      var groups = [];
      lines.forEach(function(line,i){
        var g = groups.filter(function(g){ return Math.abs(g.m-line.m)<1e-9 && Math.abs(g.b-line.b)<1e-9; })[0];
        if(g) g.indices.push(i); else groups.push({ m:line.m, b:line.b, indices:[i] });
      });
      groups.forEach(function(g){
        var seg = lineSegment(g.m, g.b);
        if(!seg) return;
        var x1=seg[0][0], y1=seg[0][1], x2=seg[1][0], y2=seg[1][1];
        var X1=toX(x1), Y1=toY(y1), X2=toX(x2), Y2=toY(y2);
        var colors = g.indices.map(function(i){ return LINE_COLORS[i % LINE_COLORS.length]; });
        if(colors.length === 1){
          svg += '<line x1="'+X1+'" y1="'+Y1+'" x2="'+X2+'" y2="'+Y2+'" stroke="'+colors[0]+'" stroke-width="3.2" stroke-linecap="round" opacity="0.95"/>';
        } else {
          var unit = 9, n = colors.length;
          colors.forEach(function(color,k){
            svg += '<line x1="'+X1+'" y1="'+Y1+'" x2="'+X2+'" y2="'+Y2+'" stroke="'+color+'" stroke-width="3.8" stroke-linecap="butt" stroke-dasharray="'+unit+' '+((n-1)*unit)+'" stroke-dashoffset="'+(-k*unit)+'" opacity="0.95"/>';
          });
        }
      });
      (missPoints || []).forEach(function(p){
        svg += '<circle cx="'+toX(p[0])+'" cy="'+toY(p[1])+'" r="5.5" fill="#0A0A0D" stroke="#E5737A" stroke-width="2.5"/>';
      });
      if(highlightPoint){
        svg += '<circle cx="'+toX(highlightPoint[0])+'" cy="'+toY(highlightPoint[1])+'" r="6.5" fill="#0A0A0D" stroke="#5BCD9A" stroke-width="3"/>';
      }
      svg += '</svg>';
      return svg;
    }

    function findCommonPoint(lines){
      for(var i=0;i<lines.length;i++){
        for(var j=i+1;j<lines.length;j++){
          if(lines[i].m !== lines[j].m){
            var x = (lines[j].b - lines[i].b)/(lines[i].m - lines[j].m);
            var y = lines[i].m*x + lines[i].b;
            return [x,y];
          }
        }
      }
      return null;
    }

    function explain(current){
      var category = current.category, n = current.lines.length;
      if(category === 'SCD') return 'Las rectas se cruzan en un único punto: el sistema tiene exactamente una solución (SCD).';
      if(category === 'SCI') return 'Las '+n+' rectas coinciden exactamente — por eso se ven como un trazo punteado que alterna colores en vez de rectas separadas — así que el sistema tiene infinitas soluciones (SCI).';
      if(n === 2) return 'Las dos rectas son paralelas (misma pendiente): nunca se cruzan, por eso el sistema no tiene solución (SI).';
      if(current.kind === 'triangulo') return 'Ninguna recta es paralela a otra: se cortan de a dos en tres puntos distintos (los marcados), pero no hay un punto que esté en las tres a la vez. Cada cruce verifica sólo dos de las ecuaciones, así que el sistema no tiene solución (SI).';
      return 'Dos de las tres rectas son paralelas (misma pendiente): nunca se cruzan entre sí. La tercera corta a cada una en un punto distinto (los marcados), como en la Figura #5, pero ninguno de esos puntos está en las tres rectas a la vez. Por eso el sistema no tiene solución (SI).';
    }

    window.AptActivity.init({
      mount: '#apt-u1a1',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Clasificá el sistema',
      subtitle: 'SCD: se cruzan en un punto · SCI: son la misma recta · SI: no comparten ningún punto.',
      nextLabel: 'Probar con otras rectas →',
      mode: 'choices',
      choices: [
        { value:'SCD', label:'SCD', sub:'Compatible determinado' },
        { value:'SCI', label:'SCI', sub:'Compatible indeterminado' },
        { value:'SI',  label:'SI',  sub:'Incompatible' }
      ],
      generate: function(){
        var numLines = Math.random() < 0.5 ? 2 : 3;
        return generateCase(numLines);
      },
      renderContent: function(container, current){
        container.innerHTML = buildGraphSVG(current.lines, null);
      },
      check: function(current, value){
        return value === current.category;
      },
      explain: function(current, correct){
        return explain(current);
      },
      onAnswered: function(container, current, correct){
        if(current.category === 'SCD'){
          container.innerHTML = buildGraphSVG(current.lines, findCommonPoint(current.lines));
        } else if(current.category === 'SI' && current.lines.length === 3){
          container.innerHTML = buildGraphSVG(current.lines, null, pairCrossings(current.lines));
        }
      }
    });
  })();

})();
