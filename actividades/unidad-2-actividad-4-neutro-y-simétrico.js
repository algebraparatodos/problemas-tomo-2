/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 4
   "Neutro y simétrico de una operación "rara""
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-4-neutro-y-simetrico.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u2a4')) return;
    var d = document.createElement('div');
    d.id = 'apt-u2a4';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function generateCase(){
      var k = randInt(-9,9);
      var questionType = Math.random() < 0.5 ? 'neutro' : 'simetrico';
      var current = { k:k, questionType:questionType };
      if(questionType==='neutro'){
        current.answer = -k;
      } else {
        var a0 = randInt(-9,9);
        current.a0 = a0;
        current.answer = -2*k - a0;
      }
      return current;
    }
    function formatOffset(k){
      if(k===0) return '';
      return k>0 ? (' + ' + k) : (' - ' + Math.abs(k));
    }
    function renderContent(container, current){
      var formula = 'a \\oplus b = a + b' + formatOffset(current.k);
      var latex;
      if(current.questionType==='neutro'){
        latex = formula + ' \\\\[10pt] \\text{Encontrá el elemento neutro } e \\text{ de } \\oplus';
      } else {
        latex = formula + ' \\\\[10pt] \\text{Encontrá el simétrico de } a = ' + current.a0;
      }
      window.katex.render(latex, container, { throwOnError:false });
    }
    window.AptActivity.init({
      mount: '#apt-u2a4',
      mode: 'grid',
      needsKatex: true,
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Neutro y simétrico de una operación "rara"',
      subtitle: 'Dada una operación como a⊕b = a+b+k, encontrá su elemento neutro o el simétrico de un valor dado.',
      grid: { rows: 1, cols: 1, noDivider: true },
      generate: generateCase,
      renderContent: renderContent,
      checkGrid: function(current, M, hasEmpty){
        if(hasEmpty) return { correct:false, feedbackText:'Dejaste la celda vacía.' };
        var correct = M[0][0] === current.answer;
        if(correct) return { correct:true, feedbackText:'' };
        var text;
        if(current.questionType==='neutro'){
          text = 'No es correcto. Planteando a⊕e=a: a+e' + formatOffset(current.k) + ' = a, así que e = ' + current.answer + '.';
        } else {
          text = 'No es correcto. Planteando a⊕s=e (con e=' + (-current.k) + '): ' + current.a0 + '+s' + formatOffset(current.k) + ' = ' + (-current.k) + ', así que s = ' + current.answer + '.';
        }
        return { correct:false, feedbackText:text };
      },
      getAnswerGrid: function(current){ return [[current.answer]]; }
    });
  })();

})();
