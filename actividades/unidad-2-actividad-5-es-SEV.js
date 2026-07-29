/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 5
   "¿Es un subespacio vectorial?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-5-es-sev.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u2a5')) return;
    var d = document.createElement('div');
    d.id = 'apt-u2a5';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
  var CASES = [
    // ============ R² (14) ============
    { space:'R2', cond:'y = 3x', isSEV:true },
    { space:'R2', cond:'x = 0', isSEV:true },
    { space:'R2', cond:'x + 2y = 0', isSEV:true },
    { space:'R2', cond:'x - y = 0', isSEV:true },
    { space:'R2', cond:'3x - 5y = 0', isSEV:true },
    { space:'R2', cond:'\\text{cualquier } (x,y) \\in \\mathbb{R}^2', isSEV:true },

    { space:'R2', cond:'y = 3x + 2', isSEV:false, cx:'El (0,0) no cumple la condición: 0 ≠ 3·0+2 = 2. Todo SEV tiene que contener al vector nulo.' },
    { space:'R2', cond:'x + y = 5', isSEV:false, cx:'El (0,0) no cumple: 0+0 = 0 ≠ 5.' },
    { space:'R2', cond:'x = 4', isSEV:false, cx:'El (0,0) no cumple: 0 ≠ 4.' },
    { space:'R2', cond:'2x - y = -3', isSEV:false, cx:'El (0,0) no cumple: 2·0 - 0 = 0 ≠ -3.' },

    { space:'R2', cond:'x \\cdot y = 0', isSEV:false, cx:'(1,0) y (0,1) cumplen la condición (el producto da 0 en ambos), pero (1,0)+(0,1) = (1,1), y 1·1 = 1 ≠ 0. No cierra bajo la suma.' },
    { space:'R2', cond:'x^2 = y^2', isSEV:false, cx:'(1,1) y (1,-1) cumplen la condición, pero (1,1)+(1,-1) = (2,0), y 2² = 4 ≠ 0² = 0. No cierra bajo la suma.' },

    { space:'R2', cond:'x \\ge 0', isSEV:false, cx:'(1,0) cumple, pero (-1)·(1,0) = (-1,0), y -1 no es ≥ 0. No cierra bajo producto por escalar.' },
    { space:'R2', cond:'x^2 + y^2 \\le 4', isSEV:false, cx:'(2,0) cumple (2²+0²=4≤4), pero 3·(2,0) = (6,0), y 6²=36 > 4. No cierra bajo producto por escalar.' },

    // ============ R³ (14) ============
    { space:'R3', cond:'x + y + z = 0', isSEV:true },
    { space:'R3', cond:'x = 0', isSEV:true },
    { space:'R3', cond:'x = y = z', isSEV:true },
    { space:'R3', cond:'2x - y + 3z = 0', isSEV:true },
    { space:'R3', cond:'x - 2y = 0', isSEV:true },
    { space:'R3', cond:'\\text{cualquier } (x,y,z) \\in \\mathbb{R}^3', isSEV:true },

    { space:'R3', cond:'x + y + z = 1', isSEV:false, cx:'El (0,0,0) no cumple: 0+0+0 = 0 ≠ 1.' },
    { space:'R3', cond:'x = 2', isSEV:false, cx:'El (0,0,0) no cumple: 0 ≠ 2.' },
    { space:'R3', cond:'x - y + z = 3', isSEV:false, cx:'El (0,0,0) no cumple: 0-0+0 = 0 ≠ 3.' },
    { space:'R3', cond:'2x + y = 4', isSEV:false, cx:'El (0,0,0) no cumple: 2·0+0 = 0 ≠ 4.' },

    { space:'R3', cond:'x \\cdot y \\cdot z = 0', isSEV:false, cx:'(1,0,1) y (0,1,1) cumplen (alguna coordenada es 0), pero (1,0,1)+(0,1,1) = (1,1,2), y 1·1·2 = 2 ≠ 0. No cierra bajo la suma.' },
    { space:'R3', cond:'x^2 = y^2 + z^2', isSEV:false, cx:'(1,1,0) y (1,0,1) cumplen la condición, pero (1,1,0)+(1,0,1) = (2,1,1), y 2² = 4, mientras que 1²+1² = 2. No cierra bajo la suma.' },

    { space:'R3', cond:'x \\ge 0', isSEV:false, cx:'(1,0,0) cumple, pero (-1)·(1,0,0) = (-1,0,0), y -1 no es ≥ 0. No cierra bajo producto por escalar.' },
    { space:'R3', cond:'x^2 + y^2 + z^2 \\le 9', isSEV:false, cx:'(3,0,0) cumple (9≤9), pero 2·(3,0,0) = (6,0,0), y 6² = 36 > 9. No cierra bajo producto por escalar.' },

    // ============ M2×2(R) (14) ============
    { space:'M22', cond:'A = A^T \\ \\text{(simétrica)}', isSEV:true },
    { space:'M22', cond:'\\text{tr}(A) = 0', isSEV:true },
    { space:'M22', cond:'\\text{triangular superior}', isSEV:true },
    { space:'M22', cond:'\\text{diagonal}', isSEV:true },
    { space:'M22', cond:'A = -A^T \\ \\text{(antisimétrica)}', isSEV:true },
    { space:'M22', cond:'\\text{cualquier } A \\in M_{2\\times2}(\\mathbb{R})', isSEV:true },

    { space:'M22', cond:'\\text{tr}(A) = 1', isSEV:false, cx:'La matriz nula tiene traza 0 ≠ 1, así que no pertenece al conjunto. Todo SEV tiene que contener a la matriz nula.' },
    { space:'M22', cond:'a_{11} = 1', isSEV:false, cx:'La matriz nula tiene a₁₁ = 0 ≠ 1, así que no pertenece.' },
    { space:'M22', cond:'\\det(A) = 1', isSEV:false, cx:'La matriz nula tiene determinante 0 ≠ 1, así que no pertenece.' },
    { space:'M22', cond:'a_{11} + a_{22} = 3', isSEV:false, cx:'La matriz nula tiene a₁₁+a₂₂ = 0 ≠ 3, así que no pertenece.' },

    { space:'M22', cond:'\\det(A) = 0', isSEV:false, cx:'A=[[1,0],[0,0]] y B=[[0,0],[0,1]] tienen determinante 0, pero A+B = [[1,0],[0,1]] (la identidad), que tiene determinante 1 ≠ 0. No cierra bajo la suma.' },
    { space:'M22', cond:'\\text{alguna entrada de } A \\text{ es } 0', isSEV:false, cx:'A=[[0,1],[1,1]] y B=[[1,1],[1,0]] tienen alguna entrada en 0, pero A+B = [[1,2],[2,1]], que no tiene ninguna entrada en 0. No cierra bajo la suma.' },

    { space:'M22', cond:'\\det(A) \\ne 0 \\ \\text{(invertible)}', isSEV:false, cx:'La identidad I es invertible, pero 0·I es la matriz nula, que no es invertible. No cierra bajo producto por escalar.' },
    { space:'M22', cond:'\\text{todas las entradas} \\ge 0', isSEV:false, cx:'A=[[1,0],[0,1]] cumple, pero (-1)·A = [[-1,0],[0,-1]], con entradas negativas. No cierra bajo producto por escalar.' },

    // ============ P2(R) (14) ============
    { space:'P2', cond:'a_0 = 0', isSEV:true },
    { space:'P2', cond:'a_2 = 0', isSEV:true },
    { space:'P2', cond:'p(1) = 0', isSEV:true },
    { space:'P2', cond:'a_1 = 0', isSEV:true },
    { space:'P2', cond:'a_0 = a_2', isSEV:true },
    { space:'P2', cond:'\\text{cualquier } p \\in P_2(\\mathbb{R})', isSEV:true },

    { space:'P2', cond:'p(1) = 1', isSEV:false, cx:'El polinomio nulo cumple q(1)=0 ≠ 1, así que no pertenece. Todo SEV tiene que contener al polinomio nulo.' },
    { space:'P2', cond:'a_0 = 2', isSEV:false, cx:'El polinomio nulo tiene a₀ = 0 ≠ 2, así que no pertenece.' },
    { space:'P2', cond:'p(0) = 3', isSEV:false, cx:'El polinomio nulo tiene p(0) = 0 ≠ 3, así que no pertenece.' },
    { space:'P2', cond:'a_2 = 1', isSEV:false, cx:'El polinomio nulo tiene a₂ = 0 ≠ 1, así que no pertenece.' },

    { space:'P2', cond:'a_2 \\ne 0 \\ \\text{(grado exactamente 2)}', isSEV:false, cx:'p=x² y q=-x²+x tienen a₂≠0, pero p+q = x, que tiene a₂=0 (no es grado 2). No cierra bajo la suma.' },
    { space:'P2', cond:'p(0) \\cdot p(1) = 0', isSEV:false, cx:'p=x cumple p(0)=0, y q=x-1 cumple q(1)=0. Pero (p+q)(0)=-1 y (p+q)(1)=1, y (-1)·1 = -1 ≠ 0. No cierra bajo la suma.' },

    { space:'P2', cond:'\\text{todos los coeficientes} \\ge 0', isSEV:false, cx:'p=x cumple, pero (-1)·p = -x tiene coeficiente negativo. No cierra bajo producto por escalar.' },
    { space:'P2', cond:'p(2) \\le 5', isSEV:false, cx:'p=5 (constante) cumple p(2)=5≤5, pero 2p tiene 2p(2)=10 > 5. No cierra bajo producto por escalar.' }
  ];
    var SPACE_LABEL = {
      R2: 'V = \\mathbb{R}^2',
      R3: 'V = \\mathbb{R}^3',
      M22: 'V = M_{2\\times2}(\\mathbb{R})',
      P2: 'V = P_2(\\mathbb{R})'
    };
    var SPACE_ELEMENT = {
      R2: '(x,y)',
      R3: '(x,y,z)',
      M22: 'A',
      P2: 'p(x) = a_0+a_1x+a_2x^2'
    };

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
      var latex = SPACE_LABEL[current.space] +
                  ' \\\\[8pt] S = \\{\\ ' + SPACE_ELEMENT[current.space] + ' \\in V \\ : \\ ' + current.cond + '\\ \\}';
      window.katex.render(latex, container, { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u2a5',
      mode: 'choices',
      needsKatex: true,
      eyebrow: 'Unidad 2 \u00b7 Subespacios vectoriales',
      title: '\u00bfEs un subespacio vectorial?',
      subtitle: 'Mir\u00e1 el espacio V y el subconjunto S. \u00bfS es un subespacio vectorial de V?',

      generate: generateCase,
      renderContent: renderContent,
      choices: [
        { value:'si', label:'S\u00ed, es un SEV' },
        { value:'no', label:'No, no es un SEV' }
      ],
      check: function(current, value){ return (value==='si') === current.isSEV; },
      explain: function(current, correct){
        if(correct) return '';
        if(current.isSEV) return 'No es correcto: S s\u00ed es un subespacio vectorial (contiene al 0 y cierra bajo suma y producto por escalar).';
        return 'No es correcto. Un contraejemplo: ' + current.cx;
      }
    });
  })();

})();
