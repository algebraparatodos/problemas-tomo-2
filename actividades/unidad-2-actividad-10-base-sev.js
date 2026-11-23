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

  /* 2.13 "Base de un SEV". Como en el libro, S viene dado por sus
     ecuaciones implícitas y la base sale del vector genérico:
       - Dim(S) = Dim(𝕍) − #ecuaciones LI (a veces hay una ecuación de
         más, LD, como en 2.13.2, y hay que mirar el rango);
       - se aíslan variables, se arma el vector genérico y se separa en
         un vector por cada variable libre (2.13.1, 2.13.3 a 2.13.5).
     Espacios: ℝ³, M₂ₓ₂(ℝ) y P₂(ℝ), los del apartado (ℝ⁴ recién
     aparece en 2.16). La base que se escribe se corrige por el
     subespacio que genera, así que vale cualquier base de S, también
     una con los vectores multiplicados para sacar fracciones. */

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=a%b; a=b; b=t; } return a; }

  /* Los polinomios, de menor a mayor grado, como los escribe el libro
     (2 + x, −1 + x²). El engine los escribe al revés; acá se cambia sólo
     cómo se muestran, no las coordenadas. */
  function polyAsc(sp){
    var o = {}; for (var key in sp) o[key] = sp[key];
    o.toKatex = function (v) {
      var parts = [];
      for (var k = 0; k < v.length; k++) {
        var c = v[k]; if (c === 0) continue;
        var abs = Math.abs(c);
        var term = k === 0 ? String(abs) : (abs === 1 ? '' : String(abs)) + (k === 1 ? 'x' : 'x^{' + k + '}');
        parts.push(parts.length === 0 ? (c < 0 ? '-' : '') + term : (c < 0 ? ' - ' : ' + ') + term);
      }
      return parts.length ? parts.join('') : '0';
    };
    return o;
  }

  var SP = AptActivity.SPACES;
  var R3 = SP.R3, M22 = SP.M2x2, P2 = polyAsc(SP.P2);
  // ℝ³ la mitad de las veces: es el caso que el libro desarrolla más.
  var POOL = [R3, R3, M22, P2];

  /* Nombres de las variables y elemento genérico con la notación del
     libro: (x, y, z), la matriz (a b; c d) y a₀ + a₁x + a₂x². */
  function varNames(space){ return space.varsTex.slice(); }
  function genericTex(space){ return space.symbolicKatex(varNames(space)); }

  function eqTex(row, names){
    var parts = [];
    row.forEach(function(c,i){
      if (c === 0) return;
      var abs = Math.abs(c);
      var term = (abs === 1 ? '' : String(abs)) + names[i];
      parts.push(parts.length === 0 ? (c < 0 ? '-' : '') + term : (c < 0 ? ' - ' : ' + ') + term);
    });
    return (parts.length ? parts.join('') : '0') + ' = 0';
  }

  function pickPivotCols(n, r){
    var all = []; for (var i=0;i<n;i++) all.push(i);
    for (var j=all.length-1;j>0;j--){ var q=randInt(0,j); var t=all[j]; all[j]=all[q]; all[q]=t; }
    return all.slice(0, r).sort(function(a,b){ return a-b; });
  }

  // Fila sin factor común y con el primer coeficiente positivo (2x − y = 0).
  function tidy(row){
    var g = row.reduce(function(acc,v){ return gcd(acc,v); }, 0);
    if (g > 1) row = row.map(function(v){ return v / g; });
    var first = 0; while (first < row.length && row[first] === 0) first++;
    if (first < row.length && row[first] < 0) row = row.map(function(v){ return -v; });
    return row;
  }
  function isZero(row){ return row.every(function(v){ return v === 0; }); }
  function proportional(a, b){
    for (var i=0;i<a.length;i++) for (var j=0;j<a.length;j++) if (a[i]*b[j] !== a[j]*b[i]) return false;
    return true;
  }
  function rank(rows){ return AptActivity.Frac.rankOf(AptActivity.Frac.intMatrixToFrac(rows)); }

  var MAX_COEF = 6;

  function generateCase() {
    for (var tries = 0; tries < 5000; tries++) {
      var space = pick(POOL);
      var n = space.dim;
      var r = randInt(Math.max(1, n-3), n-1);      // Dim(S) = n − r, entre 1 y 3
      var pivots = pickPivotCols(n, r);
      var isPivot = {}; pivots.forEach(function(p){ isPivot[p] = true; });

      // Forma escalonada reducida: de acá sale la base que se muestra
      // como ejemplo (variables pivote aisladas en función de las libres).
      var R = pivots.map(function(p){
        var row = new Array(n).fill(0);
        row[p] = 1;
        for (var c=p+1;c<n;c++) if (!isPivot[c]) row[c] = randInt(-3,3);
        return row;
      });
      var free = [];
      for (var c2=0;c2<n;c2++) if (!isPivot[c2]) free.push(c2);
      var basis = free.map(function(f){
        var v = new Array(n).fill(0);
        v[f] = 1;
        pivots.forEach(function(p,i){ v[p] = -R[i][f]; });
        return v;
      });

      // Ecuaciones equivalentes, mezcladas para que haya que trabajarlas.
      var E = R.map(function(row){ return row.slice(); });
      var ops = r === 1 ? 1 : randInt(2,4);
      for (var o=0;o<ops;o++){
        var kind = r === 1 ? 2 : randInt(0,2);
        var a = randInt(0,r-1), b = randInt(0,r-1);
        if (kind === 0 && a !== b) { var s = pick([-2,-1,1,2]); E[b] = E[b].map(function(v,cc){ return v + s*E[a][cc]; }); }
        else if (kind === 1 && a !== b) { var t2 = E[a]; E[a] = E[b]; E[b] = t2; }
        else { var s2 = pick([-1,2,3]); E[a] = E[a].map(function(v){ return v*s2; }); }
      }
      if (E.some(isZero)) continue;
      E = E.map(tidy);

      // A veces, una ecuación de más que es combinación de las otras (LD),
      // como en 2.13.2 y en el ejemplo de T en 2.13.1.
      var hasLD = r + 1 <= 3 && Math.random() < 0.3;
      if (hasLD) {
        var extra;
        if (r === 1) extra = E[0].map(function(v){ return v * pick([2,3,-2]); });
        else {
          var i1 = randInt(0,r-1), i2 = (i1 + randInt(1,r-1)) % r;
          var k1 = pick([1,1,2]), k2 = pick([-1,1,2]);
          extra = tidy(E[i1].map(function(v,cc){ return k1*v + k2*E[i2][cc]; }));
          if (isZero(extra)) continue;
          if (E.some(function(row){ return proportional(row, extra); })) continue;
        }
        E.push(extra);
      }

      if (E.some(function(row){ return row.some(function(v){ return Math.abs(v) > MAX_COEF; }); })) continue;
      // Como en los ejemplos del libro, cada ecuación relaciona al menos
      // dos variables (nada de «d = 0» suelto, que deja la base a la vista).
      if (E.some(function(row){ return row.filter(function(v){ return v !== 0; }).length < 2; })) continue;
      if (rank(E) !== r) continue;
      for (var j3=E.length-1;j3>0;j3--){ var q3=randInt(0,j3); var t3=E[j3]; E[j3]=E[q3]; E[q3]=t3; }

      return {
        space: space, n: n, r: r, k: n - r,
        equations: E, hasLD: hasLD,
        pivots: pivots, free: free,
        basisCoords: basis,
        basisNative: basis.map(function(v){ return space.fromCoords(v); }),
        kOptions: choicesForK(n - r, n)
      };
    }
    return null;
  }

  function choicesForK(k, dim) {
    var candidates = [k];
    var deltas = [-1,1,-2,2,3];
    for (var di=0; di<deltas.length && candidates.length<4; di++){
      var v = k + deltas[di];
      if (v >= 1 && v <= dim && candidates.indexOf(v)===-1) candidates.push(v);
    }
    candidates.sort(function (a, b) { return a - b; }); // orden ascendente, más prolijo que mezclado
    return candidates;
  }

  function nameList(idx, names){
    var ns = idx.map(function(i){ return '$' + names[i] + '$'; });
    if (ns.length === 1) return ns[0];
    return ns.slice(0,-1).join(', ') + ' y ' + ns[ns.length-1];
  }
  function exampleBasisHtml(current){
    var parts = current.basisNative.map(function(v){ return current.space.toKatex(v); });
    return window.katex.renderToString('B(S) = \\left\\{ ' + parts.join(',\\ ') + ' \\right\\}', { throwOnError:false });
  }
  function dimText(current){
    var nEq = current.equations.length;
    var s = 'S está definido por ' + nEq + (nEq === 1 ? ' ecuación implícita' : ' ecuaciones implícitas');
    if (current.hasLD) {
      s += ', pero no son LI: una es combinación de ' + (current.r === 1 ? 'la otra' : 'las otras') +
        ' y el rango de la matriz de coeficientes es ' + current.r + '. Hay ' + current.r +
        (current.r === 1 ? ' ecuación LI' : ' ecuaciones LI');
    } else if (nEq > 1) {
      s += ' LI';
    }
    return s + ', así que $\\operatorname{Dim}(S) = \\operatorname{Dim}(' + current.space.labelTex + ') - ' + current.r +
      ' = ' + current.n + ' - ' + current.r + ' = ' + current.k + '$.';
  }


    AptActivity.init({
      mount: '#apt-base-sev-mount',
      mode: 'phases',
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Base de un SEV',
      subtitle: 'Te damos S con sus ecuaciones implícitas. Encontrá su dimensión y una base: aislá variables, armá el vector genérico y sacá factor común.',
      needsKatex: true,
      generate: function () {
        var caso = generateCase();
        while (!caso) caso = generateCase();
        return caso;
      },
      renderContent: function (el, current) {
        var space = current.space;
        var names = varNames(space);
        el.className = 'apt-act__content apt-act__content--sev';
        el.innerHTML = '<div class="apt-act__content-ambient"></div><div class="apt-u2a10-set apt-act__sev-basis"></div>';
        window.katex.render(AptActivity.renderSevAmbient(space, 'S'), el.querySelector('.apt-act__content-ambient'), { throwOnError:false });

        /* S = { genérico ∈ 𝕍 / ec₁ ∧ ec₂ }, en piezas que bajan de línea
           si no entran en el ancho del teléfono. */
        var big = space.family === 'matrix' ? '\\bigg' : '';
        var host = el.querySelector('.apt-u2a10-set');
        var pieces = ['S = ' + big + '\\{\\, ' + genericTex(space) + ' \\in ' + space.labelTex + ' \\ /'];
        current.equations.forEach(function(row, i){
          var last = i === current.equations.length - 1;
          pieces.push(eqTex(row, names) + (last ? ' \\,' + big + '\\}' : ' \\ \\wedge'));
        });
        pieces.forEach(function(tex){
          var span = document.createElement('span');
          span.className = 'apt-act__sev-item';
          window.katex.render(tex, span, { throwOnError:false });
          host.appendChild(span);
        });
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Cuál es la dimensión de S?',
          choices: function (current) {
            return current.kOptions.map(function (n) { return { value: String(n), label: String(n) }; });
          },
          choicesStacked: false,
          check: function (current, value) { return Number(value) === current.k; },
          explain: function (current, correct) {
            return AptActivity.renderTextWithMath((correct ? 'Correcto: ' : 'La dimensión de S es ' + current.k + '. ') + dimText(current));
          }
        },
        {
          mode: 'space-basis',
          question: 'Escribí una base de S. Si te quedan fracciones, multiplicá el vector para sacarlas, como en el libro.',
          count: function (current) { return current.k; },
          space: function (current) { return current.space; },
          getExpectedBasis: function (current) { return current.basisNative; },
          explain: function (current, correct, res) {
            if (correct) return '¡Correcto! Es una base válida de S (no hacía falta que coincidiera con una en particular).';
            var reason = res && res.reason;
            var why = reason === 'not-independent'
              ? 'Los vectores que pusiste no son LI entre sí, así que no forman una base.'
              : reason === 'not-in-span'
                ? 'Alguno de los vectores que pusiste no cumple las ecuaciones de S.'
                : 'No es una base de S.';
            var names = varNames(current.space);
            return why + ' ' + AptActivity.renderTextWithMath(
              'Aislando ' + nameList(current.pivots, names) + ' en función de ' + nameList(current.free, names) +
              ' y separando el vector genérico en un vector por cada variable libre, sale por ejemplo ') +
              exampleBasisHtml(current) + '.';
          }
        }
      ]
    });
  })();

})();
