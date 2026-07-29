/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 2
   "¿Es una LCI?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-2-es-lci.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u2a2')) return;
    var d = document.createElement('div');
    d.id = 'apt-u2a2';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    var CASES = [
      { setL:'\\mathbb{N}', op:'+', isLCI:true },
      { setL:'\\mathbb{N}', op:'-', isLCI:false, cx:'2 - 5 = -3, que no es un número natural.' },
      { setL:'\\mathbb{N}', op:'\\times', isLCI:true },
      { setL:'\\mathbb{N}', op:'\\div', isLCI:false, cx:'1 ÷ 2 = 0,5, que no es un número natural (y además a ÷ 0 no está definido).' },

      { setL:'\\mathbb{Z}', op:'+', isLCI:true },
      { setL:'\\mathbb{Z}', op:'-', isLCI:true },
      { setL:'\\mathbb{Z}', op:'\\times', isLCI:true },
      { setL:'\\mathbb{Z}', op:'\\div', isLCI:false, cx:'1 ÷ 2 = 0,5, que no es un número entero.' },

      { setL:'\\mathbb{Z}^*', op:'+', isLCI:false, cx:'2 + (-2) = 0, que no pertenece a ℤ* (excluye al 0).' },
      { setL:'\\mathbb{Z}^*', op:'-', isLCI:false, cx:'2 - 2 = 0, que no pertenece a ℤ*.' },
      { setL:'\\mathbb{Z}^*', op:'\\times', isLCI:true },
      { setL:'\\mathbb{Z}^*', op:'\\div', isLCI:false, cx:'1 ÷ 2 = 0,5, que no es un número entero.' },

      { setL:'\\mathbb{Q}', op:'+', isLCI:true },
      { setL:'\\mathbb{Q}', op:'-', isLCI:true },
      { setL:'\\mathbb{Q}', op:'\\times', isLCI:true },
      { setL:'\\mathbb{Q}', op:'\\div', isLCI:false, cx:'1 ÷ 0 no está definido (ℚ incluye al 0).' },

      { setL:'\\mathbb{Q}^*', op:'+', isLCI:false, cx:'2 + (-2) = 0, que no pertenece a ℚ*.' },
      { setL:'\\mathbb{Q}^*', op:'-', isLCI:false, cx:'2 - 2 = 0, que no pertenece a ℚ*.' },
      { setL:'\\mathbb{Q}^*', op:'\\times', isLCI:true },
      { setL:'\\mathbb{Q}^*', op:'\\div', isLCI:true },

      { setL:'\\mathbb{R}', op:'+', isLCI:true },
      { setL:'\\mathbb{R}', op:'-', isLCI:true },
      { setL:'\\mathbb{R}', op:'\\times', isLCI:true },
      { setL:'\\mathbb{R}', op:'\\div', isLCI:false, cx:'1 ÷ 0 no está definido.' },

      { setL:'\\mathbb{R}^*', op:'+', isLCI:false, cx:'2 + (-2) = 0, que no pertenece a ℝ*.' },
      { setL:'\\mathbb{R}^*', op:'-', isLCI:false, cx:'2 - 2 = 0, que no pertenece a ℝ*.' },
      { setL:'\\mathbb{R}^*', op:'\\times', isLCI:true },
      { setL:'\\mathbb{R}^*', op:'\\div', isLCI:true },

      { setL:'\\mathbb{R}^+', op:'+', isLCI:true },
      { setL:'\\mathbb{R}^+', op:'-', isLCI:false, cx:'2 - 5 = -3, que no pertenece a ℝ⁺ (no es positivo).' },
      { setL:'\\mathbb{R}^+', op:'\\times', isLCI:true },
      { setL:'\\mathbb{R}^+', op:'\\div', isLCI:true }
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

    function generateCase(){
      var idx = pickLeastUsedIdx();
      return CASES[idx];
    }

    function renderContent(container, current){
      var latex = '\\ast : ' + current.setL + ' \\times ' + current.setL + ' \\to ' + current.setL +
                  ' \\quad\\quad (a,b) \\to a \\ ' + current.op + ' \\ b';
      window.katex.render(latex, container, { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u2a2',
      mode: 'choices',
      needsKatex: true,
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: '¿Es una LCI?',
      subtitle: 'Mirá el conjunto y la operación. ¿Es una ley de composición interna?',

      generate: generateCase,
      renderContent: renderContent,
      choices: [
        { value:'si', label:'Sí, es una LCI' },
        { value:'no', label:'No, no es una LCI' }
      ],
      check: function(current, value){ return (value==='si') === current.isLCI; },
      explain: function(current, correct){
        if(correct) return '';
        if(current.isLCI) return 'No es correcto: esta operación sí es una LCI en este conjunto (el resultado siempre queda dentro del conjunto).';
        return 'No es correcto. Un contraejemplo: ' + current.cx;
      }
    });
  })();

})();
