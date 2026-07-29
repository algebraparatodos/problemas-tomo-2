/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 14
   "Suma de subespacios / suma directa"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-14-suma-de-subespacios.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-suma-sev-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-suma-sev-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.16.4 "Suma de SEV / suma directa". Dos fases
     de elección múltiple: dim(S+T), y si la suma es directa. Sin
     necesidad de tocar el engine. */

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function pickPivotCols(dim,k){
    var chosen = []; var last = -1;
    for (var i=0;i<k;i++){
      var remaining = dim - last - 1 - (k - i - 1);
      var next = randInt(last+1, last+remaining);
      chosen.push(next); last = next;
    }
    return chosen;
  }
  function buildLiCoords(dim, k) {
    var cols = pickPivotCols(dim, k);
    var rows = [];
    for (var i=0;i<k;i++){
      var row = new Array(dim).fill(0);
      var p = cols[i];
      var pivotVal = randInt(-4,4); while(pivotVal===0) pivotVal = randInt(-4,4);
      row[p] = pivotVal;
      for (var c=p+1;c<dim;c++) row[c] = randInt(-3,3);
      rows.push(row);
    }
    return rows;
  }
  function scramble(rows, k) {
    var M = rows.map(function(r){ return r.slice(); });
    var ops = randInt(2,4);
    for (var o=0;o<ops;o++){
      if (k<2) break;
      var kind = randInt(0,2);
      var a=randInt(0,k-1), b=randInt(0,k-1);
      if (kind===0 && a!==b){ var t=M[a]; M[a]=M[b]; M[b]=t; }
      else if (kind===1 && a!==b){ var s=randInt(-2,2)||1; M[b]=M[b].map(function(v,c){ return v+s*M[a][c]; }); }
      else { var s2=[-1,1,2][randInt(0,2)]; M[a]=M[a].map(function(v){ return v*s2; }); }
    }
    return M;
  }

  function choicesFor(correct, min, max) {
    var candidates = [correct];
    var deltas = [-2,-1,1,2,3];
    for (var di=0; di<deltas.length && candidates.length<4; di++){
      var v = correct + deltas[di];
      if (v >= min && v <= max && candidates.indexOf(v)===-1) candidates.push(v);
    }
    var filler = min;
    while (candidates.length < Math.min(4, max-min+1) && filler <= max) {
      if (filler !== correct && candidates.indexOf(filler)===-1) candidates.push(filler);
      filler++;
    }
    var arr = candidates.slice(0,4);
    arr.sort(function(a,b){ return a-b; });
    return arr;
  }

  // Construye S, T de dim kS, kT. wantDirect controla si se fuerza
  // intersección trivial (suma directa) o se comparte un núcleo (no directa).
  function buildSumCase(n, kS, kT, wantDirect) {
    for (var attempt=0; attempt<30; attempt++){
      var S, T;
      if (wantDirect) {
        // S y T completamente independientes entre sí (generados aparte)
        S = scramble(buildLiCoords(n, kS), kS);
        T = scramble(buildLiCoords(n, kT), kT);
      } else {
        var m = randInt(1, Math.min(kS, kT)); // dim del núcleo compartido forzado
        var C = scramble(buildLiCoords(n, m), m);
        function extend(base, extraCount) {
          var full = base.map(function(r){ return r.slice(); });
          var tries = 0;
          while (full.length < base.length + extraCount && tries < 50) {
            tries++;
            var cand = new Array(n).fill(0).map(function(){ return randInt(-3,3); });
            var test = full.concat([cand]);
            if (AptActivity.Frac.rankOf(AptActivity.Frac.intMatrixToFrac(test)) === test.length) full = test;
          }
          return full;
        }
        S = extend(C, kS - m);
        T = extend(C, kT - m);
        if (S.length !== kS || T.length !== kT) continue;
      }

      var combined = S.concat(T);
      var dimSum = AptActivity.Frac.rankOf(AptActivity.Frac.intMatrixToFrac(combined));
      var isDirect = dimSum === kS + kT;

      if (isDirect === wantDirect) return { S: S, T: T, dimSum: dimSum, isDirect: isDirect };
    }
    return null;
  }

  function generateCase() {
    var pool = [AptActivity.SPACES.R3, AptActivity.SPACES.R4, AptActivity.SPACES.M2x2, AptActivity.SPACES.M2x3, AptActivity.SPACES.M3x2, AptActivity.SPACES.P2, AptActivity.SPACES.P3];
    var space, n, kS, kT, wantDirect, result;
    var attempts = 0;
    do {
      space = pick(pool);
      n = space.dim;
      kS = randInt(1, Math.min(3, n-1));
      kT = randInt(1, Math.min(3, n-1));
      wantDirect = Math.random() < 0.5;
      // si se quiere NO directa, hace falta n suficiente para alojar kS+kT-m <= n con m>=1
      if (!wantDirect && kS + kT - 1 > n) { attempts++; continue; }
      // si se quiere directa, hace falta que kS+kT <= n (si no, es imposible que sea directa)
      if (wantDirect && kS + kT > n) { attempts++; continue; }
      result = buildSumCase(n, kS, kT, wantDirect);
      attempts++;
    } while (!result && attempts < 30);

    var Snative = result.S.map(function(c){ return space.fromCoords(c); });
    var Tnative = result.T.map(function(c){ return space.fromCoords(c); });

    return {
      space: space, n: n, kS: kS, kT: kT,
      Snative: Snative, Tnative: Tnative,
      dimSum: result.dimSum, isDirect: result.isDirect,
      dimSumOptions: choicesFor(result.dimSum, 1, n)
    };
  }


    AptActivity.init({
      mount: '#apt-suma-sev-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Suma de subespacios',
      subtitle: 'Te damos dos subespacios S y T. Encontrá dim(S + T) y si la suma es directa.',
      needsKatex: true,
      generate: generateCase,
      renderContent: function (el, current) {
        var ambientLatex = AptActivity.renderSevAmbient(current.space, 'S + T \\subseteq');
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML =
          '<div class="apt-act__content-ambient"></div>' +
          '<div class="apt-sev-basis-wrap" style="margin-bottom:6px;"></div>' +
          '<div class="apt-sev-basis-wrap-2"></div>';
        window.katex.render('V = ' + current.space.labelTex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderSevAsBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.Snative, 'S');
        AptActivity.renderSevAsBasisWrapped(el.querySelector('.apt-sev-basis-wrap-2'), current.space, current.Tnative, 'T');
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Cuál es dim(S + T)?',
          choices: function (current) {
            return current.dimSumOptions.map(function (n) { return { value: String(n), label: String(n) }; });
          },
          choicesStacked: false,
          check: function (current, value) { return Number(value) === current.dimSum; },
          explain: function (current, correct) {
            return correct
              ? 'Correcto: dim(S + T) = ' + current.dimSum + '.'
              : 'dim(S + T) es en realidad ' + current.dimSum + '.';
          }
        },
        {
          mode: 'choices',
          question: '¿La suma S + T es directa?',
          choices: [
            { value: 'si', label: 'Sí' },
            { value: 'no', label: 'No' }
          ],
          check: function (current, value) { return (value === 'si') === current.isDirect; },
          explain: function (current, correct) {
            var reallyIs = current.isDirect ? 'sí es' : 'no es';
            return correct
              ? '¡Correcto! Es' + (current.isDirect ? '' : ' que no es') + ' directa: dim(S) + dim(T) ' + (current.isDirect ? '=' : '≠') + ' dim(S+T).'
              : 'En realidad ' + reallyIs + ' directa: dim(S) + dim(T) ' + (current.isDirect ? '=' : '≠') + ' dim(S+T) (' + current.kS + ' + ' + current.kT + ' ' + (current.isDirect ? '=' : '≠') + ' ' + current.dimSum + ').';
          }
        }
      ]
    });
  })();

})();
