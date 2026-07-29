/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 3
   "¿Es una LCE?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-3-es-lce.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u2a3')) return;
    var d = document.createElement('div');
    d.id = 'apt-u2a3';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
  var CASES = [
    // ---------- Válidas con K=R (20) ----------
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ \\lambda z)', isLCE:true },
    { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda A', isLCE:true },
    { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\lambda p', isLCE:true },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda^2 x,\\ \\lambda^2 y)', isLCE:true },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(|\\lambda| x,\\ |\\lambda| y)', isLCE:true },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ 0)', isLCE:true },
    { k:'\\mathbb{R}', v:'\\{A\\in M_{2\\times2}(\\mathbb{R}) : A^T=A\\}\\ \\text{(matrices simétricas)}', f:'\\lambda A', isLCE:true },
    { k:'\\mathbb{R}', v:'\\{A\\in M_{2\\times2}(\\mathbb{R}) : \\text{triangular superior}\\}', f:'\\lambda A', isLCE:true },
    { k:'\\mathbb{R}', v:'\\{p\\in P_2(\\mathbb{R}) : a_0=0\\}', f:'\\lambda p', isLCE:true },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ y)', isLCE:true },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ z)', isLCE:true },
    { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda^2 A', isLCE:true },
    { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\lambda^3 p', isLCE:true },
    { k:'\\mathbb{R}', v:'\\{(x,y)\\in\\mathbb{R}^2 : xy\\ge0\\}', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(0,\\ 0,\\ 0)', isLCE:true },
    { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda A^T', isLCE:true },
    { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'p(\\lambda x)', isLCE:true },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda y,\\ \\lambda x)', isLCE:true },
    { k:'\\mathbb{R}', v:'\\{(x,y,z)\\in\\mathbb{R}^3 : x+y+z=0\\}', f:'(\\lambda x,\\ \\lambda y,\\ \\lambda z)', isLCE:true },

    // ---------- No válidas, K=R: V restringido y la fórmula no lo respeta (10) ----------
    { k:'\\mathbb{R}', v:'\\{(x,y)\\in\\mathbb{R}^2 : x\\ge0\\}', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'Con λ=-1 y v=(1,0): el resultado es (-1,0), y -1<0.' },
    { k:'\\mathbb{R}', v:'\\{v\\in\\mathbb{R}^2 : \\|v\\|=1\\}\\ \\text{(vectores unitarios)}', f:'\\lambda v', isLCE:false, cx:'La norma del resultado es |λ|. Con λ=2: la norma pasa a ser 2, no 1.' },
    { k:'\\mathbb{R}', v:'GL_2(\\mathbb{R})\\ \\text{(matrices invertibles)}', f:'\\lambda A', isLCE:false, cx:'Con λ=0: el resultado es la matriz nula, que no es invertible.' },
    { k:'\\mathbb{R}', v:'\\{p\\in P_2(\\mathbb{R}) : a_2\\ne0\\}\\ \\text{(grado exactamente 2)}', f:'\\lambda p', isLCE:false, cx:'Con λ=0: el resultado es el polinomio nulo, que no tiene grado 2.' },
    { k:'\\mathbb{R}', v:'\\{(x,y,z)\\in\\mathbb{R}^3 : x+y+z=1\\}', f:'\\lambda v', isLCE:false, cx:'Con λ=2 y v=(1,0,0) (que cumple x+y+z=1): el resultado (2,0,0) da x+y+z=2≠1.' },
    { k:'\\mathbb{R}', v:'\\mathbb{Z}^2\\ \\text{(coordenadas enteras)}', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'Con λ=1/2 y v=(1,0): el resultado es (0,5, 0), que no tiene coordenadas enteras.' },
    { k:'\\mathbb{R}', v:'\\{(x,y)\\in\\mathbb{R}^2 : x>0\\}', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'Con λ=0: el resultado es (0,y), y 0 no es >0.' },
    { k:'\\mathbb{R}', v:'\\{A\\in M_{2\\times2}(\\mathbb{R}) : A^T=A\\}\\ \\text{(matrices simétricas)}', f:'A + \\begin{pmatrix}0 & \\lambda\\\\ 0 & 0\\end{pmatrix}', isLCE:false, cx:'Con λ=1: solo se suma en la entrada (1,2), rompiendo la simetría.' },
    { k:'\\mathbb{R}', v:'\\{v\\in\\mathbb{R}^3 : \\|v\\|=1\\}\\ \\text{(vectores unitarios)}', f:'v + \\lambda(1,0,0)', isLCE:false, cx:'Con λ=1: la norma del resultado cambia y deja de ser 1.' },
    { k:'\\mathbb{R}', v:'\\{(x,y,z)\\in\\mathbb{R}^3 : z=0\\}', f:'(\\lambda x,\\ \\lambda y,\\ \\lambda z+1)', isLCE:false, cx:'Como z=0 en todo vector de V, la tercera coordenada del resultado es siempre 1, nunca 0.' },

    // ---------- No válidas, K=R: fórmula no bien definida (10) ----------
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ y/\\lambda)', isLCE:false, cx:'No está definida en λ=0 (se dividiría por 0).' },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(x/\\lambda,\\ \\lambda y)', isLCE:false, cx:'No está definida en λ=0.' },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ x/z)', isLCE:false, cx:'No está definida cuando z=0.' },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\sqrt{\\lambda}\\,x,\\ \\sqrt{\\lambda}\\,y)', isLCE:false, cx:'No da un número real cuando λ<0 (ej. λ=-1).' },
    { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\dfrac{1}{\\lambda}A', isLCE:false, cx:'No está definida en λ=0.' },
    { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\dfrac{a_0}{\\lambda}+a_1x+a_2x^2', isLCE:false, cx:'No está definida en λ=0.' },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(x,\\ \\lambda y/x)', isLCE:false, cx:'No está definida cuando x=0.' },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y,\\ \\sqrt{z})', isLCE:false, cx:'No da un número real cuando z<0.' },
    { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda A^{-1}', isLCE:false, cx:'No está definida cuando A no es invertible (y M2×2(ℝ) incluye matrices no invertibles).' },
    { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\lambda\\, p / p(0)', isLCE:false, cx:'No está definida cuando p(0)=0.' },

    // ---------- No válidas, K=R: tipo de resultado incorrecto (6) ----------
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'\\lambda\\|(x,y)\\|', isLCE:false, cx:'El resultado es un número real (la norma escalada), no un vector de ℝ².' },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^3', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'El resultado tiene 2 componentes, no 3: no es un elemento de ℝ³.' },
    { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda \\det(A)', isLCE:false, cx:'El resultado es un número real (el determinante escalado), no una matriz.' },
    { k:'\\mathbb{R}', v:'P_2(\\mathbb{R})', f:'\\lambda\\, p(1)', isLCE:false, cx:'El resultado es un número real (el polinomio evaluado en 1), no un polinomio.' },
    { k:'\\mathbb{R}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ \\lambda y,\\ 0)', isLCE:false, cx:'El resultado tiene 3 componentes, no 2: no es un elemento de ℝ².' },
    { k:'\\mathbb{R}', v:'M_{2\\times2}(\\mathbb{R})', f:'\\lambda\\,\\text{tr}(A)', isLCE:false, cx:'El resultado es un número real (la traza escalada), no una matriz.' },

    // ---------- Nuevos: variando K (10) ----------
    { k:'\\mathbb{Z}', v:'\\mathbb{R}^2', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
    { k:'\\mathbb{Z}', v:'\\mathbb{Z}^2\\ \\text{(coordenadas enteras)}', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
    { k:'\\mathbb{Q}', v:'\\mathbb{Q}^2', f:'(\\lambda x,\\ \\lambda y)', isLCE:true },
    { k:'\\mathbb{Q}', v:'\\mathbb{Z}^2\\ \\text{(coordenadas enteras)}', f:'(\\lambda x,\\ \\lambda y)', isLCE:false, cx:'Con λ=1/2 y v=(1,0): el resultado (0,5, 0) no tiene coordenadas enteras.' },
    { k:'\\mathbb{Z}', v:'\\{A\\in M_{2\\times2} : \\text{entradas enteras}\\}', f:'\\lambda A', isLCE:true },
    { k:'\\mathbb{Q}', v:'\\{A\\in M_{2\\times2} : \\text{entradas enteras}\\}', f:'\\lambda A', isLCE:false, cx:'Con λ=1/2 se puede romper la integridad de las entradas (ej. entrada 1 pasa a 0,5).' },
    { k:'\\mathbb{Z}', v:'\\{p\\in P_2(\\mathbb{R}) : \\text{coeficientes enteros}\\}', f:'\\lambda p', isLCE:true },
    { k:'\\mathbb{Q}', v:'\\{p\\in P_2(\\mathbb{R}) : \\text{coeficientes enteros}\\}', f:'\\lambda p', isLCE:false, cx:'Con λ=1/3 se puede romper la integridad de los coeficientes.' },
    { k:'\\mathbb{N}', v:'\\mathbb{R}', f:'\\lambda x', isLCE:true },
    { k:'\\mathbb{Z}', v:'\\mathbb{R}^+\\ \\text{(reales positivos)}', f:'\\lambda x', isLCE:false, cx:'Con λ=-1 (entero) y x=2: el resultado es -2, que no es positivo.' }
  ];
    var showCount = CASES.map(function(){ return 0; });
    function pickLeastUsedIdx(){
      var minCount = Math.min.apply(null, showCount);
      var candidates = [];
      for(var i=0;i<CASES.length;i++) if(showCount[i]===minCount) candidates.push(i);
      var picked = candidates[Math.floor(Math.random()*candidates.length)];
      showCount[picked]++;
      return picked;
    }
    function generateCase(){ return CASES[pickLeastUsedIdx()]; }

    function renderContent(container, current){
      var latex = 'K = ' + current.k + ' \\quad\\quad V = ' + current.v +
                  ' \\\\[10pt] \\ast : K \\times V \\to V \\quad\\quad \\lambda \\ast v = ' + current.f;
      window.katex.render(latex, container, { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u2a3',
      mode: 'choices',
      needsKatex: true,
      eyebrow: 'Unidad 2 \u00b7 Subespacios vectoriales',
      title: '\u00bfEs una LCE?',
      subtitle: 'Mir\u00e1 el conjunto K de escalares, el conjunto V, y la f\u00f3rmula. \u00bfEs una ley de composici\u00f3n externa de K sobre V?',

      generate: generateCase,
      renderContent: renderContent,
      choices: [
        { value:'si', label:'S\u00ed, es una LCE' },
        { value:'no', label:'No, no es una LCE' }
      ],
      check: function(current, value){ return (value==='si') === current.isLCE; },
      explain: function(current, correct){
        if(correct) return '';
        if(current.isLCE) return 'No es correcto: esta f\u00f3rmula s\u00ed es una LCE (el resultado siempre queda bien definido y dentro de V).';
        return 'No es correcto. Un contraejemplo: ' + current.cx;
      }
    });
  })();

})();
