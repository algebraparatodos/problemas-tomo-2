/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 17
   "Método de Gram-Schmidt"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-17-gram-schmidt.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-gram-schmidt-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-gram-schmidt-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  /* Generador completo de 2.18 "Gram-Schmidt". Fases fijas (hasta 3):
     encontrar u1, u2, u3 en orden, cada una con exactMatch:true (una
     única respuesta correcta, precomputada -- si el alumno se equivoca
     en un paso, el siguiente sigue trabajando con el valor correcto). */

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

  function gramSchmidt(vectors) {
    var F = AptActivity.Frac;
    var n = vectors[0].length;
    var us = [];
    vectors.forEach(function(v){
      var u = v.map(function(x){ return F.Frac(x); });
      us.forEach(function(prevU){
        var dotUV = F.Frac(0), dotUU = F.Frac(0);
        for (var c=0;c<n;c++){
          dotUV = F.fAdd(dotUV, F.fMul(prevU[c], F.Frac(v[c])));
          dotUU = F.fAdd(dotUU, F.fMul(prevU[c], prevU[c]));
        }
        var coef = F.fDiv(dotUV, dotUU);
        u = u.map(function(x,c){ return F.fSub(x, F.fMul(coef, prevU[c])); });
      });
      us.push(u);
    });
    return us;
  }
  function isSafeFrac(f) { return Number.isSafeInteger(f.n) && Number.isSafeInteger(f.d); }

  function generateCase() {
    var pool = [AptActivity.SPACES.R3, AptActivity.SPACES.R4, AptActivity.SPACES.M2x2, AptActivity.SPACES.M2x3, AptActivity.SPACES.M3x2, AptActivity.SPACES.P2, AptActivity.SPACES.P3];
    var space, n, k, V, U, tries = 0;
    do {
      space = pick(pool);
      n = space.dim;
      k = randInt(2, Math.min(3, n));
      V = scramble(buildLiCoords(n, k), k);
      U = gramSchmidt(V);
      tries++;
    } while (!U.every(function(u){ return u.every(function(f){ return f.d === 1 && isSafeFrac(f); }); }) && tries < 80);

    var Uint = U.map(function(u){ return u.map(function(f){ return f.n; }); });

    var Vnative = V.map(function(c){ return space.fromCoords(c); });
    var Unative = Uint.map(function(c){ return space.fromCoords(c); });

    return { space: space, n: n, k: k, Vnative: Vnative, Unative: Unative };
  }


    var SUBSCRIPTS = ['₀','₁','₂','₃'];

    function revealU(current, idx, contentEl) {
      var host = contentEl.querySelector('.apt-gs-found');
      var line = document.createElement('div');
      line.className = 'apt-gs-u-line';
      var label = document.createElement('span');
      label.textContent = 'u' + SUBSCRIPTS[idx + 1] + ' = ';
      var katexSpan = document.createElement('span');
      line.appendChild(label);
      line.appendChild(katexSpan);
      host.appendChild(line);
      window.katex.render(current.space.toKatex(current.Unative[idx]), katexSpan, { throwOnError: false });
    }

    function makePhase(idx) {
      return {
        mode: 'space-basis',
        question: idx === 0
          ? 'Encontrá el primer vector de la base ortogonal, u' + SUBSCRIPTS[1] + '. Recordá que podés tomar cualquier vector de la base original.'
          : 'Encontrá u' + SUBSCRIPTS[idx + 1] + '.',
        count: function () { return 1; },
        space: function (current) { return current.space; },
        exactMatch: true,
        answerLabel: 'u' + SUBSCRIPTS[idx + 1],
        getExpectedBasis: function (current) { return [current.Unative[idx]]; },
        explain: function (current, correct) {
          return correct ? '¡Correcto!' : 'No es correcto: revisá el resultado marcado en rojo.';
        },
        onAnswered: function (current, correct, value, contentEl) {
          if (correct) revealU(current, idx, contentEl);
        }
      };
    }

    AptActivity.init({
      mount: '#apt-gram-schmidt-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Método de Gram-Schmidt',
      subtitle: 'Te damos un conjunto de vectores LI. Aplicá Gram-Schmidt para encontrar una base ortogonal, paso a paso.',
      needsKatex: true,
      generate: generateCase,
      activePhaseCount: function (current) { return current.k; },
      renderContent: function (el, current) {
        var ambientLatex = 'V = ' + current.space.labelTex;
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML =
          '<div class="apt-act__content-ambient"></div>' +
          '<div class="apt-sev-basis-wrap" style="margin-bottom:8px;"></div>' +
          '<div class="apt-gs-found"></div>';
        window.katex.render(ambientLatex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.Vnative, 'B');
      },
      phases: [ makePhase(0), makePhase(1), makePhase(2) ]
    });
  })();

})();
