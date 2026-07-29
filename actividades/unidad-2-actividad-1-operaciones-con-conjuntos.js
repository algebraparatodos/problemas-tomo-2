/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 2 · Actividad 1
   "Operaciones con conjuntos"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-2-actividad-1-operaciones-con-conjuntos.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u2a1')) return;
    var d = document.createElement('div');
    d.id = 'apt-u2a1';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randBool(){ return Math.random() < 0.5; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function shuffleArr(arr){
      var a = arr.slice();
      for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
      return a;
    }

    function inInterval(x, iv){
      if(x < iv.lo || x > iv.hi) return false;
      if(x === iv.lo) return iv.loClosed;
      if(x === iv.hi) return iv.hiClosed;
      return true;
    }
    function memberOf(x, A, B, op){
      var a = inInterval(x,A), b = inInterval(x,B);
      if(op==='union') return a || b;
      if(op==='intersection') return a && b;
      if(op==='difference') return a && !b;
      if(op==='symdiff') return a !== b;
    }
    function computeResult(A, B, op){
      var ptsSet = {};
      [A.lo,A.hi,B.lo,B.hi].forEach(function(p){ ptsSet[p]=true; });
      var pts = Object.keys(ptsSet).map(Number).sort(function(a,b){ return a-b; });
      var segments = [];
      for(var i=0;i<pts.length;i++){
        segments.push({ type:'point', x:pts[i], in: memberOf(pts[i],A,B,op) });
        if(i<pts.length-1){
          var mid = (pts[i]+pts[i+1])/2;
          segments.push({ type:'open', lo:pts[i], hi:pts[i+1], in: memberOf(mid,A,B,op) });
        }
      }
      var results = [];
      var idx = 0;
      while(idx < segments.length){
        if(!segments[idx].in){ idx++; continue; }
        var j = idx;
        while(j<segments.length && segments[j].in) j++;
        var first = segments[idx], last = segments[j-1];
        var lo, loClosed, hi, hiClosed;
        if(first.type==='point'){ lo=first.x; loClosed=true; } else { lo=first.lo; loClosed=false; }
        if(last.type==='point'){ hi=last.x; hiClosed=true; } else { hi=last.hi; hiClosed=false; }
        if(lo<hi || (lo===hi && loClosed && hiClosed)){
          results.push({ lo:lo, hi:hi, loClosed:loClosed, hiClosed:hiClosed });
        }
        idx = j;
      }
      return results;
    }
    function intervalsEqual(a,b){ return a.lo===b.lo && a.hi===b.hi && a.loClosed===b.loClosed && a.hiClosed===b.hiClosed; }
    function resultsEqual(R1,R2){
      if(R1.length!==R2.length) return false;
      for(var i=0;i<R1.length;i++) if(!intervalsEqual(R1[i],R2[i])) return false;
      return true;
    }

    var OPERATIONS = ['union','intersection','difference','symdiff','cartesian'];
    var opShowCount = {}; OPERATIONS.forEach(function(o){ opShowCount[o]=0; });
    function peekLeastUsedOp(){
      var minCount = Math.min.apply(null, OPERATIONS.map(function(o){ return opShowCount[o]; }));
      var candidates = OPERATIONS.filter(function(o){ return opShowCount[o]===minCount; });
      return randChoice(candidates);
    }

    var OP_NAME = {
      union:'la unión (A∪B)', intersection:'la intersección (A∩B)', difference:'la diferencia (A\\B)',
      symdiff:'la diferencia simétrica (A△B)', cartesian:'el producto cartesiano (A×B)'
    };

    function setUnion(A,B){ var s={}; A.concat(B).forEach(function(x){ s[x]=true; }); return Object.keys(s).map(Number).sort(function(a,b){return a-b;}); }
    function setIntersection(A,B){ return A.filter(function(x){ return B.indexOf(x)!==-1; }); }
    function setDifference(A,B){ return A.filter(function(x){ return B.indexOf(x)===-1; }); }
    function setSymDiff(A,B){ return setUnion(setDifference(A,B), setDifference(B,A)); }
    function setCartesian(A,B){ var pairs=[]; A.forEach(function(a){ B.forEach(function(b){ pairs.push([a,b]); }); }); return pairs; }
    function numArraysEqual(a,b){ if(a.length!==b.length) return false; for(var i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; }
    function pairArraysEqual(a,b){ if(a.length!==b.length) return false; for(var i=0;i<a.length;i++) if(a[i][0]!==b[i][0]||a[i][1]!==b[i][1]) return false; return true; }

    function buildFiniteAB(){
      var universe = [1,2,3,4,5,6,7,8,9];
      var shuffled = shuffleArr(universe);
      var sharedCount = randInt(1,2), aOnlyCount = randInt(1,3), bOnlyCount = randInt(1,3);
      var idx = 0;
      var shared = shuffled.slice(idx, idx+=sharedCount);
      var aOnly = shuffled.slice(idx, idx+=aOnlyCount);
      var bOnly = shuffled.slice(idx, idx+=bOnlyCount);
      var A = shared.concat(aOnly).sort(function(a,b){return a-b;});
      var B = shared.concat(bOnly).sort(function(a,b){return a-b;});
      return { A:A, B:B };
    }

    // Para producto cartesiano: conjuntos más chicos (máx 6 pares, nunca 3x3=9)
    function buildFiniteABForCartesian(){
      var universe = [1,2,3,4,5,6,7,8,9];
      var shuffled = shuffleArr(universe);
      var sizeA = randInt(2,3);
      var sizeB = sizeA === 3 ? 2 : randChoice([2,3]);
      var sharedCount = Math.min(randInt(1,2), sizeA, sizeB);
      var aOnlyCount = sizeA - sharedCount;
      var bOnlyCount = sizeB - sharedCount;
      var idx = 0;
      var shared = shuffled.slice(idx, idx+=sharedCount);
      var aOnly = shuffled.slice(idx, idx+=aOnlyCount);
      var bOnly = shuffled.slice(idx, idx+=bOnlyCount);
      var A = shared.concat(aOnly).sort(function(a,b){return a-b;});
      var B = shared.concat(bOnly).sort(function(a,b){return a-b;});
      return { A:A, B:B };
    }

    function tweakWithDetail(base, universe){
      var pool = universe.filter(function(x){ return base.indexOf(x)===-1; });
      var canAdd = pool.length > 0, canRemove = base.length > 0;
      var doRemove = canRemove && (Math.random() < 0.5 || !canAdd);
      if(doRemove){
        var i = randInt(0, base.length-1);
        var removed = base[i];
        var newSet = base.filter(function(_,idx2){ return idx2!==i; });
        return { value:newSet, detail:'A esa opción le falta el elemento ' + removed + '.' };
      }
      var add = randChoice(pool);
      var newSet2 = base.concat([add]).sort(function(a,b){return a-b;});
      return { value:newSet2, detail:'Esa opción tiene de más el elemento ' + add + ', que no corresponde.' };
    }

    function finiteSetOptions(A,B,op){
      if(op==='cartesian'){
        var correct = setCartesian(A,B);
        var swapped = setCartesian(B,A);
        var missingIdx = correct.length>1 ? randInt(0, correct.length-1) : 0;
        var missingPair = correct[missingIdx];
        var missing = correct.length>1 ? correct.filter(function(_,i){ return i!==missingIdx; }) : correct;
        var extraPair = [A[0], B[0]+100];
        var extra = correct.concat([extraPair]);
        return {
          correct: correct,
          opts: [
            { kind:'order-swap', value:swapped, detail:'Esa opción invirtió el orden: es B×A, no A×B.' },
            { kind:'missing-pair', value:missing, detail:'A esa opción le falta el par (' + missingPair[0] + ', ' + missingPair[1] + ').' },
            { kind:'extra-pair', value:extra, detail:'Esa opción tiene de más el par (' + extraPair[0] + ', ' + extraPair[1] + '), que no corresponde.' }
          ],
          equalFn: pairArraysEqual
        };
      }
      var union = setUnion(A,B), intersection = setIntersection(A,B);
      var diffAB = setDifference(A,B), diffBA = setDifference(B,A);
      var symdiff = setSymDiff(A,B);

      var correct, confuseValue, confuseDetail;
      if(op==='union'){ correct=union; confuseValue=intersection; confuseDetail='Esa opción es ' + OP_NAME.intersection + ', no ' + OP_NAME.union + '.'; }
      else if(op==='intersection'){ correct=intersection; confuseValue=union; confuseDetail='Esa opción es ' + OP_NAME.union + ', no ' + OP_NAME.intersection + '.'; }
      else if(op==='difference'){ correct=diffAB; confuseValue=diffBA; confuseDetail='Esa opción invirtió el orden: calculó B\\A en vez de A\\B.'; }
      else { correct=symdiff; confuseValue=union; confuseDetail='Esa opción es ' + OP_NAME.union + ' — a la diferencia simétrica hay que sacarle los elementos compartidos.'; }

      var universeAll = [];
      [1,2,3,4,5,6,7,8,9].concat(A).concat(B).forEach(function(x){ if(universeAll.indexOf(x)===-1) universeAll.push(x); });
      var t1 = tweakWithDetail(correct, universeAll);
      var t2 = tweakWithDetail(correct, universeAll);

      return {
        correct: correct,
        opts: [
          { kind:'confused-op', value:confuseValue, detail:confuseDetail },
          { kind:'tweak', value:t1.value, detail:t1.detail },
          { kind:'tweak', value:t2.value, detail:t2.detail }
        ],
        equalFn: numArraysEqual
      };
    }

    function buildIntervalAB(){
      var lo1 = randInt(-5,3), width1 = randInt(2,5), hi1 = lo1+width1;
      var A = { lo:lo1, hi:hi1, loClosed:randBool(), hiClosed:randBool() };
      var lo2 = randInt(lo1-3, hi1+1), width2 = randInt(2,5), hi2 = lo2+width2;
      var B = { lo:lo2, hi:hi2, loClosed:randBool(), hiClosed:randBool() };
      return { A:A, B:B };
    }
    function cloneInterval(iv){ return { lo:iv.lo, hi:iv.hi, loClosed:iv.loClosed, hiClosed:iv.hiClosed }; }
    function pieceText(iv){
      var l = iv.loClosed ? '[' : '(';
      var r = iv.hiClosed ? ']' : ')';
      return l + iv.lo + ', ' + iv.hi + r;
    }

    function flipOneBoundaryWithDetail(pieces){
      var out = pieces.map(cloneInterval);
      var pi = randInt(0, out.length-1);
      var side, wasClosedWord, nowClosedWord;
      if(randBool()){
        out[pi].loClosed = !out[pi].loClosed;
        side = 'izquierdo (' + out[pi].lo + ')';
        wasClosedWord = pieces[pi].loClosed ? 'cerrado' : 'abierto';
        nowClosedWord = out[pi].loClosed ? 'cerrado' : 'abierto';
      } else {
        out[pi].hiClosed = !out[pi].hiClosed;
        side = 'derecho (' + out[pi].hi + ')';
        wasClosedWord = pieces[pi].hiClosed ? 'cerrado' : 'abierto';
        nowClosedWord = out[pi].hiClosed ? 'cerrado' : 'abierto';
      }
      var detail = 'Esa opción tiene el extremo ' + side + ' ' + nowClosedWord + ', pero en la respuesta correcta es ' + wasClosedWord + '.';
      return { value: out, detail: detail };
    }
    function shiftOneEndpointWithDetail(pieces){
      var out = pieces.map(cloneInterval);
      var pi = randInt(0, out.length-1);
      var delta = randChoice([-1,1]);
      var side, correctVal, wrongVal;
      if(randBool()){
        correctVal = out[pi].lo; out[pi].lo += delta; wrongVal = out[pi].lo;
        if(out[pi].lo >= out[pi].hi) return { value: pieces, detail: 'Tiene mal uno de los extremos del intervalo.' };
        side = 'izquierdo';
      } else {
        correctVal = out[pi].hi; out[pi].hi += delta; wrongVal = out[pi].hi;
        if(out[pi].lo >= out[pi].hi) return { value: pieces, detail: 'Tiene mal uno de los extremos del intervalo.' };
        side = 'derecho';
      }
      return { value: out, detail: 'El extremo ' + side + ' debería ser ' + correctVal + ', no ' + wrongVal + '.' };
    }

    function intervalOptions(A,B,op){
      var union = computeResult(A,B,'union');
      var intersection = computeResult(A,B,'intersection');
      var diffAB = computeResult(A,B,'difference');
      var diffBA = computeResult(B,A,'difference');
      var symdiff = computeResult(A,B,'symdiff');

      var correct, confuseValue, confuseDetail;
      if(op==='union'){ correct=union; confuseValue=intersection; confuseDetail='Esa opción es ' + OP_NAME.intersection + ', no ' + OP_NAME.union + '.'; }
      else if(op==='intersection'){ correct=intersection; confuseValue=union; confuseDetail='Esa opción es ' + OP_NAME.union + ', no ' + OP_NAME.intersection + '.'; }
      else if(op==='difference'){ correct=diffAB; confuseValue=diffBA; confuseDetail='Esa opción invirtió el orden: calculó B\\A en vez de A\\B.'; }
      else { correct=symdiff; confuseValue=union; confuseDetail='Esa opción es ' + OP_NAME.union + ' — a la diferencia simétrica hay que sacarle la intersección.'; }

      var opts = [{ kind:'confused-op', value:confuseValue, detail:confuseDetail }];

      if(correct.length===2){
        var missIdx = randInt(0,1);
        var missingPiece = correct[missIdx];
        var onePieceMissing = [correct[1-missIdx]];
        opts.push({ kind:'missing-piece', value:onePieceMissing, detail:'A esa opción le falta el tramo ' + pieceText(missingPiece) + '.' });
        var r2 = flipOneBoundaryWithDetail(correct);
        opts.push({ kind:'flip-boundary', value:r2.value, detail:r2.detail });
      } else if(correct.length===1){
        var rFlip = flipOneBoundaryWithDetail(correct);
        opts.push({ kind:'flip-boundary', value:rFlip.value, detail:rFlip.detail });
        var rShift = shiftOneEndpointWithDetail(correct);
        opts.push({ kind:'shift-endpoint', value:rShift.value, detail:rShift.detail });
      } else {
        opts.push({ kind:'not-empty', value:[A], detail:'El resultado correcto es el conjunto vacío (∅) — no debería quedar ningún intervalo.' });
        opts.push({ kind:'not-empty', value:[B], detail:'El resultado correcto es el conjunto vacío (∅) — no debería quedar ningún intervalo.' });
      }

      return { correct:correct, opts:opts, equalFn:resultsEqual };
    }

    function generateCase(){
      var attempt = 0, result;
      do{
        attempt++;
        var op = peekLeastUsedOp();
        var flavor = op === 'cartesian' ? 'finite' : (randBool() ? 'finite' : 'interval');
        var A, B, built;
        if(flavor==='finite'){
          var ab = op === 'cartesian' ? buildFiniteABForCartesian() : buildFiniteAB();
          A=ab.A; B=ab.B;
          built = finiteSetOptions(A,B,op);
        } else {
          var ab2 = buildIntervalAB(); A=ab2.A; B=ab2.B;
          built = intervalOptions(A,B,op);
        }
        var allValues = [built.correct].concat(built.opts.map(function(o){ return o.value; }));
        var allDistinct = true;
        for(var i=0;i<allValues.length && allDistinct;i++){
          for(var j=i+1;j<allValues.length;j++){
            if(built.equalFn(allValues[i], allValues[j])){ allDistinct=false; break; }
          }
        }
        if(allDistinct){
          result = { flavor:flavor, A:A, B:B, op:op, correct:built.correct, distractors:built.opts, equalFn:built.equalFn };
          opShowCount[op]++;
        }
      } while(!result && attempt<25);
      return result;
    }

    function finiteSetLatex(arr){
      if(arr.length===0) return '\\varnothing';
      return '\\{' + arr.join(', ') + '\\}';
    }
    // Los pares del producto cartesiano se arman como una fila de piezas
    // individuales en flex-wrap (no un solo bloque de KaTeX) para que
    // puedan saltar de línea si no entran en una sola.
    function pairsHTML(pairs){
      if(pairs.length===0) return '<span>' + window.katex.renderToString('\\varnothing', { throwOnError:false }) + '</span>';
      var brace = '<span style="margin:0 2px;">' + window.katex.renderToString('\\{', { throwOnError:false }) + '</span>';
      var closeBrace = '<span style="margin:0 2px;">' + window.katex.renderToString('\\}', { throwOnError:false }) + '</span>';
      var inner = pairs.map(function(p, idx){
        var comma = idx < pairs.length - 1 ? '<span style="margin-right:4px;">,</span>' : '';
        return '<span style="white-space:nowrap;">' + window.katex.renderToString('(' + p[0] + ',\\ ' + p[1] + ')', { throwOnError:false }) + comma + '</span>';
      }).join('');
      return '<span style="display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;row-gap:4px;">' + brace + inner + closeBrace + '</span>';
    }
    function intervalLatex(iv){
      var l = iv.loClosed ? '[' : '(';
      var r = iv.hiClosed ? ']' : ')';
      return '\\left' + l + iv.lo + ',\\ ' + iv.hi + '\\right' + r;
    }
    function intervalResultLatex(pieces){
      if(pieces.length===0) return '\\varnothing';
      return pieces.map(intervalLatex).join(' \\cup ');
    }
    function optionLabel(current, value){
      if(current.op==='cartesian') return pairsHTML(value);
      var latex = current.flavor==='finite' ? finiteSetLatex(value) : intervalResultLatex(value);
      return window.katex.renderToString(latex, { throwOnError:false });
    }

    var OP_SYMBOL = { union:'\\cup', intersection:'\\cap', difference:'\\setminus', symdiff:'\\triangle', cartesian:'\\times' };

    function renderContent(container, current){
      var aLatex = current.flavor==='finite' ? finiteSetLatex(current.A) : intervalLatex(current.A);
      var bLatex = current.flavor==='finite' ? finiteSetLatex(current.B) : intervalLatex(current.B);
      container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;"><div class="apt-row-a"></div><div class="apt-row-b"></div><div class="apt-row-q"></div></div>';
      window.katex.render('A = ' + aLatex, container.querySelector('.apt-row-a'), { throwOnError:false });
      window.katex.render('B = ' + bLatex, container.querySelector('.apt-row-b'), { throwOnError:false });
      window.katex.render('A \\ ' + OP_SYMBOL[current.op] + ' \\ B \\ = \\ ?', container.querySelector('.apt-row-q'), { throwOnError:false });
    }

    window.AptActivity.init({
      mount: '#apt-u2a1',
      mode: 'choices',
      needsKatex: true,
      choicesGrid: true,
      eyebrow: 'Unidad 2 · Subespacios vectoriales',
      title: 'Operaciones con conjuntos',
      subtitle: 'Mirá los conjuntos A y B (a veces son finitos, a veces intervalos) y elegí el resultado de la operación pedida.',

      generate: generateCase,
      renderContent: renderContent,
      choices: function(current){
        var allOpts = [{ kind:'correct', value:current.correct, correct:true, detail:null }].concat(
          current.distractors.map(function(d){ return { kind:d.kind, value:d.value, correct:false, detail:d.detail }; })
        );
        var wrongIdx = 0;
        var choicesData = allOpts.map(function(o){
          var value = o.correct ? 'correct' : ('w'+(wrongIdx++));
          return { value:value, kind:o.kind, raw:o.value, detail:o.detail };
        });
        current._choicesData = shuffleArr(choicesData);
        return current._choicesData.map(function(o){
          return { value:o.value, label: optionLabel(current, o.raw) };
        });
      },
      check: function(current, value){ return value === 'correct'; },
      explain: function(current, correct, value){
        if(correct) return 'Correcto: eso es ' + OP_NAME[current.op] + '.';
        var clicked = current._choicesData.filter(function(o){ return o.value===value; })[0];
        return 'No es correcto. ' + (clicked.detail || 'Revisá el cálculo.');
      }
    });
  })();

})();
