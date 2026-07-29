/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 10
   "Base de un SEV"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-10-base-de-un-sev.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-base-sev-mount')) return;
    var d = document.createElement('div');
    d.id = 'apt-base-sev-mount';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){

  // Lógica de generación de 2.13, para incrustar después en el HTML final.
  // Usa AptActivity.SPACES / randomSpace / Frac ya expuestos por engine v1.9.

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
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
  function choicesForK(k, dim) {
    var candidates = [k];
    var deltas = [-2,-1,1,2,3];
    for (var di=0; di<deltas.length && candidates.length<4; di++){
      var v = k + deltas[di];
      if (v >= 1 && v <= dim && candidates.indexOf(v)===-1) candidates.push(v);
    }
    var filler = 1;
    while (candidates.length < Math.min(4, dim) && filler <= dim + 5) {
      if (filler !== k && candidates.indexOf(filler)===-1 && filler<=dim) candidates.push(filler);
      filler++;
    }
    var arr = candidates.slice(0,4);
    arr.sort(function (a, b) { return a - b; }); // orden ascendente, más prolijo que mezclado
    return arr;
  }

  function generateCase() {
    var space = AptActivity.randomSpace();
    var dim = space.dim;
    var k = randInt(1, Math.min(3, dim-1)); // tope 3 por UX mobile
    var officialBaseCoords = scramble(buildLiCoords(dim, k), k);

    var extra = randInt(1,2);
    var generatorCoords = officialBaseCoords.map(function(v){ return v.slice(); });
    for (var e=0;e<extra;e++){
      var coeffs = officialBaseCoords.map(function(){ return randInt(-2,2); });
      if (coeffs.every(function(c){return c===0;})) coeffs[0]=1;
      var combo = new Array(dim).fill(0);
      officialBaseCoords.forEach(function(v,i){ v.forEach(function(val,c){ combo[c]+=coeffs[i]*val; }); });
      generatorCoords.push(combo);
    }
    for (var i2=generatorCoords.length-1;i2>0;i2--){ var j2=randInt(0,i2); var tmp2=generatorCoords[i2]; generatorCoords[i2]=generatorCoords[j2]; generatorCoords[j2]=tmp2; }

    var officialBaseNative = officialBaseCoords.map(function(c){ return space.fromCoords(c); });
    var generatorNative = generatorCoords.map(function(c){ return space.fromCoords(c); });

    return {
      space: space, dim: dim, k: k,
      officialBaseNative: officialBaseNative,
      generatorNative: generatorNative,
      kOptions: choicesForK(k, dim)
    };
  }


    AptActivity.init({
      mount: '#apt-base-sev-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Base de un SEV',
      subtitle: 'Te damos un conjunto generador de S (puede tener vectores de más). Encontrá una base.',
      needsKatex: true,
      generate: generateCase,
      renderContent: function (el, current) {
        var ambientLatex = AptActivity.renderSevAmbient(current.space, 'S');
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML = '<div class="apt-act__content-ambient"></div><div class="apt-sev-basis-wrap"></div>';
        window.katex.render(ambientLatex, el.querySelector('.apt-act__content-ambient'), { throwOnError:false });
        AptActivity.renderSevAsBasisWrapped(el.querySelector('.apt-sev-basis-wrap'), current.space, current.generatorNative, 'S');
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Cuántos vectores tiene una base de S?',
          choices: function (current) {
            return current.kOptions.map(function (n) { return { value: String(n), label: String(n) }; });
          },
          choicesStacked: false,
          check: function (current, value) { return Number(value) === current.k; },
          explain: function (current, correct) {
            return correct
              ? 'Correcto: la dimensión de S es ' + current.k + '.'
              : 'La dimensión real de S es ' + current.k + ' (algunos de los vectores que te dimos eran combinación de los demás).';
          }
        },
        {
          mode: 'space-basis',
          question: 'Escribí una base de S (no hace falta que coincida con una en particular).',
          count: function (current) { return current.k; },
          space: function (current) { return current.space; },
          getExpectedBasis: function (current) { return current.officialBaseNative; }
        }
      ]
    });
  })();

})();
