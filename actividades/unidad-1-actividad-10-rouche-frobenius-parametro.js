/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 10
   "Rouché-Frobenius con parámetros"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing de Kajabi va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-10-rouche-frobenius-parametro.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a10')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a10';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();


  (function(){
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global.

       Qué practica (libro, 1.1, ejemplos #4, #5 y #6): SEL de 3×3
       con uno o dos parámetros, clasificados con Rouché-Frobenius
       calculando rangos por determinantes. Siempre 3 ecuaciones y 3
       incógnitas, como en el libro:
         · 'A'   — k sólo en A (ej. #4): |A| es un polinomio en k; se
                   anula en uno o dos valores y en cada uno se mira el
                   rango de A y el de (A|B).
         · 'AB'  — k en A y en B (ej. #5).
         · 'B'   — k sólo en B: |A| = 0 siempre (rg(A) = 2) y lo que
                   decide es el menor de orden 3 que se forma orlando
                   con la columna B.
         · 'dos' — dos parámetros, t en A y k en B (ej. #6): SCD si
                   t ≠ t0 (cualquier k); en t = t0 decide k.
       Las condiciones son siempre de la forma del libro: «k ≠ 1 y
       k ≠ 2», «k = 1», «t = 2 y k = 1»... Nunca relaciones entre
       parámetros.

       La clasificación NO sale de cómo se armó el sistema: se calcula
       después (|A| como polinomio, raíces enteras, rangos exactos en
       cada valor crítico). La construcción sólo apunta a que salgan
       números chicos y casos variados. */

    /* ---------- cada entrada es [c,k,t] => valor = c + k*K + t*T ---------- */
    function E(c,k,t){ return [c||0, k||0, t||0]; }
    function evalE(e,K,T){ return e[0] + e[1]*K + e[2]*T; }

    function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function randNonZero(min,max){ var v; do{ v=randInt(min,max); }while(v===0); return v; }
    function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function shuffle(arr){
      for(var i=arr.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=arr[i]; arr[i]=arr[j]; arr[j]=tmp; }
      return arr;
    }

    // ---------- polinomios en una variable: [a0, a1, a2, ...] ----------
    function pTrim(p){ p=p.slice(); while(p.length>1 && p[p.length-1]===0) p.pop(); return p; }
    function pAdd(a,b){ var r=[]; for(var i=0;i<Math.max(a.length,b.length);i++) r.push((a[i]||0)+(b[i]||0)); return pTrim(r); }
    function pScale(a,s){ return pTrim(a.map(function(x){ return x*s; })); }
    function pMul(a,b){ var r=new Array(a.length+b.length-1).fill(0); a.forEach(function(x,i){ b.forEach(function(y,j){ r[i+j]+=x*y; }); }); return pTrim(r); }
    function pIsZero(p){ return pTrim(p).every(function(x){ return x===0; }); }
    // entrada → polinomio en la variable v ('k' o 't')
    function pDe(e, v){ return pTrim(v==='k' ? [e[0], e[1]] : [e[0], e[2]]); }
    // determinante 3×3 de polinomios (desarrollo por la primera fila)
    function det3P(M){
      function m2(a,b,c,d){ return pAdd(pMul(a,d), pScale(pMul(b,c),-1)); }
      var t0 = pMul(M[0][0], m2(M[1][1],M[1][2],M[2][1],M[2][2]));
      var t1 = pMul(M[0][1], m2(M[1][0],M[1][2],M[2][0],M[2][2]));
      var t2 = pMul(M[0][2], m2(M[1][0],M[1][1],M[2][0],M[2][1]));
      return pAdd(pAdd(t0, pScale(t1,-1)), t2);
    }
    // raíces enteras distintas de un polinomio de grado 1 o 2 (null si no
    // son todas enteras y distintas, o si no hay raíces reales)
    function raicesEnteras(p){
      p = pTrim(p);
      if(p.length===2){ var r=-p[0]/p[1]; return Number.isInteger(r) ? [r===0?0:r] : null; }
      if(p.length===3){
        var a=p[2], b=p[1], c=p[0], D=b*b-4*a*c;
        if(D<=0) return null;
        var s=Math.round(Math.sqrt(D)); if(s*s!==D) return null;
        var r1=(-b-s)/(2*a), r2=(-b+s)/(2*a);
        if(!Number.isInteger(r1) || !Number.isInteger(r2)) return null;
        return [r1,r2].map(function(x){ return x===0?0:x; }).sort(function(x,y){ return x-y; });
      }
      return null;
    }

    // ---------- rango exacto de una matriz de enteros ----------
    // Eliminación sin divisiones (multiplicando en cruz): con 3 filas y
    // números chicos, todo queda entero y exacto.
    function rango(M){
      M = M.map(function(r){ return r.slice(); });
      var rows=M.length, cols=M[0].length, r=0;
      for(var c=0;c<cols && r<rows;c++){
        var p=-1; for(var i=r;i<rows;i++) if(M[i][c]!==0){ p=i; break; }
        if(p<0) continue;
        var tmp=M[r]; M[r]=M[p]; M[p]=tmp;
        for(i=r+1;i<rows;i++){
          if(M[i][c]===0) continue;
          var a=M[r][c], b=M[i][c];
          for(var j=0;j<cols;j++) M[i][j] = a*M[i][j] - b*M[r][j];
        }
        r++;
      }
      return r;
    }
    function evalMat(M,K,T){ return M.map(function(row){ return row.map(function(e){ return evalE(e,K,T); }); }); }
    function soloA(M){ return M.map(function(row){ return row.slice(0,3); }); }
    function multAx(A, x){ return A.map(function(row){ return row[0]*x[0]+row[1]*x[1]+row[2]*x[2]; }); }
    function vecNoNulo(min,max){ var x; do{ x=[randInt(min,max),randInt(min,max),randInt(min,max)]; }while(x[0]===0&&x[1]===0&&x[2]===0); return x; }

    /* Clasificación por Rouché-Frobenius para valores concretos. */
    function clasificar(M,K,T){
      var N=evalMat(M,K,T), rA=rango(soloA(N)), rAB=rango(N);
      return { rgA:rA, rgAB:rAB, cls: rA!==rAB ? 'SI' : (rA===3 ? 'SCD' : 'SCI') };
    }

    function maxAbs(M){ var mx=0; M.forEach(function(r){ r.forEach(function(e){ mx=Math.max(mx,Math.abs(e[0]),Math.abs(e[1]),Math.abs(e[2])); }); }); return mx; }
    function maxConst(M){ var mx=0; M.forEach(function(r){ r.forEach(function(e){ mx=Math.max(mx,Math.abs(e[0])); }); }); return mx; }

    // Una A de 3×3 con enteros chicos, como las del libro (no demasiados ceros).
    function baseA(){
      var A, ceros;
      do{
        A=[]; ceros=0;
        for(var i=0;i<3;i++){ var row=[]; for(var j=0;j<3;j++){ var v=randInt(-3,3); if(v===0) ceros++; row.push(v); } A.push(row); }
      }while(ceros>2);
      return A;
    }
    // Entrada con el parámetro: casi siempre la letra sola, como en el libro.
    function entradaParam(){
      var u=Math.random();
      if(u<0.7) return [0,1];
      if(u<0.85) return [randNonZero(-2,2),1];
      return [0,-1];
    }

    // ---------- 'A' y 'AB': k en A (y en B) ----------
    // dosRaices: k en dos entradas de filas y columnas distintas, y |A|
    // de grado 2 con dos raíces enteras (como el ejemplo #4).
    function construirA(tipo, dosRaices){
      var A=baseA();
      var pos;
      if(dosRaices){
        var f=shuffle([0,1,2]), c=shuffle([0,1,2]);
        pos=[f[0]*3+c[0], f[1]*3+c[1]];
      } else {
        pos=shuffle([0,1,2,3,4,5,6,7,8]).slice(0, Math.random()<0.75?1:2);
      }
      var M=A.map(function(row){ return row.map(function(v){ return E(v,0,0); }); });
      pos.forEach(function(p){ var ep=entradaParam(); M[Math.floor(p/3)][p%3]=E(ep[0],ep[1],0); });
      var P=det3P(soloA(M).map(function(r){ return r.map(function(e){ return pDe(e,'k'); }); }));
      var R=raicesEnteras(P);
      if(!R || R.some(function(r){ return Math.abs(r)>5; })) return null;
      if(dosRaices && R.length!==2) return null;
      // en cada raíz, rg(A) = 2 (como en los ejemplos del libro)
      if(R.some(function(r){ return rango(soloA(evalMat(M,r,0)))!==2; })) return null;

      var B;
      if(tipo==='A'){
        if(Math.random()<0.6){
          var r=randChoice(R), x0=vecNoNulo(-2,2);
          B=multAx(soloA(evalMat(M,r,0)), x0).map(function(v){ return E(v,0,0); }); // compatible en k = r
        } else {
          B=[0,1,2].map(function(){ return E(randInt(-5,5),0,0); });
        }
      } else {
        var j=randInt(0,2), s=randChoice([1,1,1,-1,2]);
        if(Math.random()<0.5){
          var r2=randChoice(R), x1=vecNoNulo(-2,2);
          var B0=multAx(soloA(evalMat(M,r2,0)), x1);
          B=B0.map(function(v,i){ return i===j ? E(v-s*r2, s, 0) : E(v,0,0); }); // B(r2) = A(r2)·x1
        } else {
          B=[0,1,2].map(function(i){ return i===j ? E(randInt(-4,4), s, 0) : E(randInt(-5,5),0,0); });
        }
      }
      M.forEach(function(row,i){ row.push(B[i]); });
      return M;
    }

    // ---------- 'B': A fija con rango 2, k sólo en B ----------
    function construirB(){
      var r1=[randInt(-3,3),randInt(-3,3),randInt(-3,3)], r2=[randInt(-3,3),randInt(-3,3),randInt(-3,3)];
      var a=randChoice([-2,-1,1,1,2]), b=randChoice([-2,-1,0,1,1,2]);
      var r3=r1.map(function(v,i){ return a*v+b*r2[i]; });
      var A=shuffle([r1,r2,r3]);
      if(rango(A)!==2 || A.some(function(row){ return row.every(function(v){ return v===0; }); })) return null;
      var x0=vecNoNulo(-2,2), B0=multAx(A,x0), j=randInt(0,2), s=randChoice([1,1,1,-1,2]), r=randInt(-4,4);
      var M=A.map(function(row,i){
        var out=row.map(function(v){ return E(v,0,0); });
        out.push(i===j ? E(B0[i]-s*r, s, 0) : E(B0[i],0,0)); // B(r) = A·x0
        return out;
      });
      return M;
    }

    // ---------- 'dos': t en A, k en B (como el ejemplo #6) ----------
    function construirDos(){
      var A=baseA();
      var p=randInt(0,8), ep=entradaParam();
      var M=A.map(function(row){ return row.map(function(v){ return E(v,0,0); }); });
      M[Math.floor(p/3)][p%3]=E(ep[0],0,ep[1]);
      var P=det3P(soloA(M).map(function(r){ return r.map(function(e){ return pDe(e,'t'); }); }));
      var R=raicesEnteras(P);
      if(!R || R.length!==1 || Math.abs(R[0])>5) return null;
      var t0=R[0], A0=soloA(evalMat(M,0,t0));
      if(rango(A0)!==2) return null;

      var u=Math.random(), B;
      if(u<0.7){
        // SCI sólo en (t0, k0): B(k) = A(t0)·x0 + (k − k0)·v
        var x0=vecNoNulo(-2,2), B0=multAx(A0,x0), k0=randInt(-3,3);
        var v=[0,0,0]; shuffle([0,1,2]).slice(0, Math.random()<0.6?1:2).forEach(function(i){ v[i]=randChoice([1,1,-1,2]); });
        B=B0.map(function(b,i){ return E(b-k0*v[i], v[i], 0); });
      } else {
        // la parte con k está en las columnas de A(t0): en t0 la k no decide
        var y=vecNoNulo(-1,1), w=multAx(A0,y);
        var base = u<0.85 ? [randInt(-4,4),randInt(-4,4),randInt(-4,4)] // casi siempre fuera → SI para todo k
                           : multAx(A0, vecNoNulo(-2,2));               // dentro → SCI para todo k
        B=base.map(function(b,i){ return E(b, w[i], 0); });
      }
      M.forEach(function(row,i){ row.push(B[i]); });
      return M;
    }

    // Dos columnas independientes de A (para orlar con la columna B).
    function columnasIndep(A){
      var pares=[[0,1],[0,2],[1,2]];
      for(var i=0;i<pares.length;i++){
        var c=pares[i], sub=A.map(function(row){ return [row[c[0]], row[c[1]]]; });
        if(rango(sub)===2) return c;
      }
      return null;
    }
    // Menor de orden 3 formado por esas dos columnas de A0 y la columna B,
    // como polinomio en k (A0 numérica).
    function menorConB(A0, M, cols){
      var MP=[0,1,2].map(function(i){
        return [[A0[i][cols[0]]], [A0[i][cols[1]]], pDe(M[i][3],'k')];
      });
      return det3P(MP);
    }

    /* ---------- análisis: de acá salen las condiciones correctas ---------- */
    function analizar(M, tipo){
      var an={ tipo:tipo };
      if(tipo==='A' || tipo==='AB'){
        var P=det3P(soloA(M).map(function(r){ return r.map(function(e){ return pDe(e,'k'); }); }));
        var R=raicesEnteras(P);
        if(!R) return null;
        an.det=P; an.raices=R;
        an.porRaiz=R.map(function(r){ var c=clasificar(M,r,0); c.v=r; return c; });
        if(an.porRaiz.some(function(c){ return c.cls==='SCD'; })) return null;
        var sci=an.porRaiz.filter(function(c){ return c.cls==='SCI'; }).map(function(c){ return c.v; });
        var si=an.porRaiz.filter(function(c){ return c.cls==='SI'; }).map(function(c){ return c.v; });
        an.desc={
          SCD:{type:'neq', vals:R},
          SCI: sci.length ? {type:'eq', vals:sci} : {type:'none'},
          SI: si.length ? {type:'eq', vals:si} : {type:'none'}
        };
      } else if(tipo==='B'){
        var A0=soloA(evalMat(M,0,0));
        if(rango(A0)!==2) return null;
        var cols=columnasIndep(A0), m=menorConB(A0,M,cols), Rm=raicesEnteras(m);
        if(!Rm || Rm.length!==1) return null;
        an.menor=m; an.r=Rm[0];
        an.desc={ SCD:{type:'none'}, SCI:{type:'eq', vals:[an.r]}, SI:{type:'neq', vals:[an.r]} };
      } else {
        var Pt=det3P(soloA(M).map(function(r){ return r.map(function(e){ return pDe(e,'t'); }); }));
        var Rt=raicesEnteras(Pt);
        if(!Rt || Rt.length!==1) return null;
        var t0=Rt[0], A1=soloA(evalMat(M,0,t0));
        if(rango(A1)!==2) return null;
        var cols2=columnasIndep(A1), m2=menorConB(A1,M,cols2);
        an.det=Pt; an.t0=t0; an.menor=m2;
        if(pIsZero(m2)){ an.caso='siempreSCI'; an.desc={ SCD:{type:'tneq',t:t0}, SCI:{type:'teq',t:t0}, SI:{type:'none'} }; }
        else if(pTrim(m2).length===1){ an.caso='siempreSI'; an.desc={ SCD:{type:'tneq',t:t0}, SCI:{type:'none'}, SI:{type:'teq',t:t0} }; }
        else {
          var Rk=raicesEnteras(m2);
          if(!Rk) return null;
          an.caso='k0'; an.k0=Rk[0];
          an.desc={ SCD:{type:'tneq',t:t0}, SCI:{type:'pair',t:t0,k:an.k0}, SI:{type:'tkneq',t:t0,k:an.k0} };
        }
      }
      return an;
    }

    // ---------- punto de entrada del generador ----------
    function generateSystem(selections){
      var tipo = (selections && selections.tipo) || 'A';
      // con k sólo en A, la mitad de las veces |A| tiene dos raíces (ej. #4)
      var dosRaices = tipo==='A' ? Math.random()<0.5 : tipo==='AB' ? Math.random()<0.25 : false;
      for(var intento=0; intento<20000; intento++){
        var M = tipo==='B' ? construirB() : tipo==='dos' ? construirDos() : construirA(tipo, dosRaices && intento<15000);
        if(!M || maxConst(M)>9 || maxAbs(M)>9) continue;
        // el parámetro tiene que aparecer donde se pidió
        var kEnA=false, kEnB=false, tEnA=false;
        M.forEach(function(row){ row.forEach(function(e,j){ if(e[1]!==0){ if(j<3) kEnA=true; else kEnB=true; } if(e[2]!==0 && j<3) tEnA=true; }); });
        if(tipo==='A' && !(kEnA && !kEnB)) continue;
        if(tipo==='AB' && !(kEnA && kEnB)) continue;
        if(tipo==='B' && !(!kEnA && kEnB)) continue;
        if(tipo==='dos' && !(tEnA && kEnB && !kEnA)) continue;
        var an=analizar(M,tipo);
        if(!an) continue;
        var cur={ tipo:tipo, matrix:M, rows:3, cols:3, paramNames:['k','t'], an:an, descriptors:an.desc };
        cur.options={};
        ['SCD','SCI','SI'].forEach(function(cls){ cur.options[cls]=buildOptions(cur, an.desc[cls]); });
        return cur;
      }
      throw new Error('No se pudo generar un sistema');
    }

    // ---------- condiciones: LaTeX, comparación y distractores ----------
    function valTex(v,x){ return v + ' = ' + x; }
    function descTex(d){
      switch(d.type){
        case 'none': return null;
        case 'neq': return d.vals.map(function(x){ return 'k \\neq ' + x; }).join(' \\text{ y } ');
        case 'eq': return d.vals.map(function(x){ return valTex('k',x); }).join(' \\text{ o } ');
        case 'tneq': return 't \\neq ' + d.t + ' \\text{ (cualquier } k\\text{)}';
        case 'teq': return 't = ' + d.t + ' \\text{ (cualquier } k\\text{)}';
        case 'pair': return 't = ' + d.t + ' \\text{ y } k = ' + d.k;
        case 'tkneq': return 't = ' + d.t + ' \\text{ y } k \\neq ' + d.k;
        case 'bothneq': return 't \\neq ' + d.t + ' \\text{ y } k \\neq ' + d.k;
      }
    }
    function descLabel(d){
      var tex=descTex(d);
      return tex===null ? 'Ningún valor' : window.katex.renderToString(tex, { throwOnError:false });
    }
    function descKey(d){ return descTex(d) || 'none'; }
    function ordenar(vals){ return vals.slice().sort(function(a,b){ return a-b; }); }
    function corrido(x){ return x + randNonZero(-2,2); }

    function buildDistractors(cur, d){
      var an=cur.an, out=[];
      if(cur.tipo==='dos'){
        var t0=an.t0, kk = an.k0!==undefined ? an.k0 : randInt(-3,3);
        switch(d.type){
          case 'tneq': out=[{type:'bothneq',t:t0,k:kk}, {type:'teq',t:t0}, {type:'pair',t:t0,k:kk}, {type:'tneq',t:corrido(t0)}, {type:'none'}]; break;
          case 'pair': out=[{type:'tkneq',t:t0,k:d.k}, {type:'pair',t:d.k,k:t0}, {type:'teq',t:t0}, {type:'pair',t:t0,k:corrido(d.k)}, {type:'none'}]; break;
          case 'tkneq': out=[{type:'pair',t:t0,k:d.k}, {type:'teq',t:t0}, {type:'tneq',t:t0}, {type:'tkneq',t:t0,k:corrido(d.k)}]; break;
          case 'teq': out=[{type:'tkneq',t:t0,k:kk}, {type:'pair',t:t0,k:kk}, {type:'tneq',t:t0}, {type:'none'}]; break;
          case 'none': out=[{type:'pair',t:t0,k:kk}, {type:'teq',t:t0}, {type:'tkneq',t:t0,k:kk}, {type:'tneq',t:t0}]; break;
        }
        return out;
      }
      var R = cur.tipo==='B' ? [an.r] : an.raices;
      switch(d.type){
        case 'neq':
          out=[{type:'eq',vals:d.vals}];
          if(d.vals.length===2) out.push({type:'neq',vals:[d.vals[0]]}, {type:'neq',vals:[d.vals[1]]});
          else out.push({type:'neq',vals:ordenar([d.vals[0], corrido(d.vals[0])])}, {type:'neq',vals:[corrido(d.vals[0])]});
          out.push({type:'none'});
          break;
        case 'eq':
          out=[{type:'neq',vals:d.vals}];
          var otras=R.filter(function(x){ return d.vals.indexOf(x)<0; });
          if(otras.length) out.push({type:'eq',vals:otras}, {type:'eq',vals:R});
          if(d.vals.length===2) out.push({type:'eq',vals:[d.vals[0]]}, {type:'eq',vals:[d.vals[1]]});
          out.push({type:'eq',vals:[corrido(d.vals[0])]}, {type:'none'});
          break;
        case 'none':
          out=[{type:'eq',vals:R}, {type:'eq',vals:[R[0]]}, {type:'neq',vals:R}, {type:'eq',vals:[corrido(R[0])]}];
          if(R.length===2) out.push({type:'eq',vals:[R[1]]});
          break;
      }
      return out;
    }
    function buildOptions(cur, correct){
      var picked=[], keys=[descKey(correct)];
      buildDistractors(cur, correct).forEach(function(cand){
        if(cand.vals){
          cand.vals=ordenar(cand.vals);
          if(cand.vals.some(function(x,i){ return i>0 && x===cand.vals[i-1]; })) return;
        }
        var key=descKey(cand);
        if(keys.indexOf(key)>=0) return;
        keys.push(key); picked.push(cand);
      });
      picked=picked.slice(0,3);
      var all=[{d:correct, value:'correct'}].concat(picked.map(function(d,i){ return {d:d, value:'w'+i}; }));
      shuffle(all);
      return all.map(function(o){ return { value:o.value, label:descLabel(o.d) }; });
    }

    // ---------- textos con KaTeX ----------
    function conMate(texto){
      return texto.split(/(\$[^$]+\$)/g).map(function(parte){
        if(parte.length>1 && parte.charAt(0)==='$' && parte.charAt(parte.length-1)==='$')
          return window.katex.renderToString(parte.slice(1,-1), { throwOnError:false });
        return parte;
      }).join('');
    }
    function polyTex(p, v){
      p=pTrim(p);
      var out='';
      for(var i=p.length-1;i>=0;i--){
        var c=p[i]; if(c===0) continue;
        var abs=Math.abs(c), mon = i===0 ? '' : (i===1 ? v : v+'^{2}');
        var cuerpo = (abs===1 && i>0) ? mon : abs+mon;
        out += out==='' ? (c<0?'-':'')+cuerpo : (c<0?' - ':' + ')+cuerpo;
      }
      return out || '0';
    }
    // a·(v − r1)(v − r2), con las raíces enteras
    function factTex(p, R, v){
      var a=pTrim(p)[pTrim(p).length-1];
      var facs=ordenar(R).map(function(r){ return r===0 ? v : '(' + v + (r>0?' - '+r:' + '+(-r)) + ')'; });
      facs.sort(function(x,y){ return (x===v?0:1)-(y===v?0:1); }); // la «k» sola, adelante
      var cuerpo=facs.join('');
      if(facs.length===1 && facs[0].charAt(0)==='(') cuerpo=facs[0].slice(1,-1);
      if(a===1) return cuerpo;
      if(a===-1) return '-' + (facs.length===1 && cuerpo.charAt(0)!==v ? '('+cuerpo+')' : cuerpo);
      return a + (facs.length===1 && cuerpo!==v ? '('+cuerpo+')' : cuerpo);
    }
    function detTex(an, v){
      var e=polyTex(an.det,v), f=factTex(an.det, an.raices || [an.t0], v);
      return e===f ? e : e + ' = ' + f;
    }
    function listaVals(v, vals, conector){
      return vals.map(function(x){ return '$' + v + ' = ' + x + '$'; }).join(' ' + conector + ' ');
    }
    var RG_A='\\operatorname{rg}(A)', RG_AB='\\operatorname{rg}(A|B)';

    function explicarSCD(cur){
      var an=cur.an;
      if(cur.tipo==='B')
        return conMate('El parámetro no está en $A$ y $|A| = 0$, así que $' + RG_A + ' = 2$ para cualquier valor de $k$. Como el rango de $A$ nunca llega al número de incógnitas (3), el sistema no es SCD para ningún valor.');
      var v = cur.tipo==='dos' ? 't' : 'k';
      var R = cur.tipo==='dos' ? [an.t0] : an.raices;
      var txt='$|A| = ' + detTex(an, v) + '$, que se anula sólo en ' + listaVals(v, R, 'y') + '. ';
      txt += 'Para cualquier otro valor de $' + v + '$, $' + RG_A + ' = 3$ y, como $3 = ' + RG_A + ' \\le ' + RG_AB + ' \\le 3$, también $' + RG_AB + ' = 3$, que es el número de incógnitas: SCD';
      txt += cur.tipo==='dos' ? ', sea cual sea $k$.' : '.';
      return conMate(txt);
    }
    function explicarResto(cur, cls){
      var an=cur.an, txt='';
      var nombre = cls==='SCI' ? 'SCI' : 'SI';
      if(cur.tipo==='A' || cur.tipo==='AB'){
        txt = 'Hay que mirar los valores que anulan $|A|$. ';
        an.porRaiz.forEach(function(c){
          txt += 'Para $k = ' + c.v + '$: $' + RG_A + ' = ' + c.rgA + '$ y $' + RG_AB + ' = ' + c.rgAB + '$, ';
          txt += c.cls==='SI' ? 'distintos: SI. ' : 'iguales y menores que 3: SCI. ';
        });
        var d=an.desc[cls];
        txt += d.type==='none' ? 'Así que ' + nombre + ' no ocurre para ningún valor de $k$.'
                               : 'Así que es ' + nombre + ' si ' + listaVals('k', d.vals, 'o') + '.';
      } else if(cur.tipo==='B'){
        txt = 'Como $' + RG_A + ' = 2$, orlamos un menor de orden 2 de $A$ con la columna $B$: ese menor de orden 3 vale $' + polyTex(an.menor,'k') + '$, que se anula sólo en $k = ' + an.r + '$. ';
        txt += 'Con $k = ' + an.r + '$, $' + RG_AB + ' = 2 = ' + RG_A + ' < 3$: SCI. Con $k \\neq ' + an.r + '$, $' + RG_AB + ' = 3 \\neq ' + RG_A + '$: SI.';
      } else {
        txt = 'Para $t = ' + an.t0 + '$, $' + RG_A + ' = 2$. Orlando un menor de orden 2 de $A$ con la columna $B$, el menor de orden 3 vale $' + polyTex(an.menor,'k') + '$';
        if(an.caso==='k0'){
          txt += ', que se anula sólo en $k = ' + an.k0 + '$. Con $t = ' + an.t0 + '$ y $k = ' + an.k0 + '$, $' + RG_AB + ' = 2 = ' + RG_A + ' < 3$: SCI. ';
          txt += 'Con $t = ' + an.t0 + '$ y $k \\neq ' + an.k0 + '$, $' + RG_AB + ' = 3 \\neq ' + RG_A + '$: SI.';
        } else if(an.caso==='siempreSCI'){
          txt += ' para cualquier $k$: con $t = ' + an.t0 + '$, $' + RG_AB + ' = 2 = ' + RG_A + ' < 3$ sea cual sea $k$, así que es SCI y nunca SI.';
        } else {
          txt += ', que no se anula para ningún $k$: con $t = ' + an.t0 + '$, $' + RG_AB + ' = 3 \\neq ' + RG_A + '$ sea cual sea $k$, así que es SI y nunca SCI.';
        }
      }
      return conMate(txt);
    }

    // ---------- render de la matriz (A|B) parametrizada con KaTeX ----------
    function entryToLatex(e, paramNames){
      var parts = [];
      function push(str, isNeg){
        if(parts.length===0) parts.push((isNeg?'-':'')+str);
        else parts.push((isNeg?' - ':' + ')+str);
      }
      // la letra primero y después la constante, como en el libro (k + 1)
      var coefs = [e[1], e[2]];
      for(var i=0;i<paramNames.length;i++){
        var coef = coefs[i];
        if(coef===0) continue;
        var abs = Math.abs(coef);
        push((abs===1?'':String(abs)) + paramNames[i], coef<0);
      }
      if(e[0]!==0) push(String(Math.abs(e[0])), e[0]<0);
      return parts.length ? parts.join('') : '0';
    }
    function matrixLatex(current){
      var rows = current.matrix.map(function(row){
        return row.map(function(e){ return entryToLatex(e, current.paramNames); }).join(' & ');
      });
      return '(A \\mid B) = \\left(\\begin{array}{ccc|c} ' + rows.join(' \\\\ ') + ' \\end{array}\\right)';
    }
    function renderContent(container, current){
      window.katex.render(matrixLatex(current), container, { throwOnError:false });
    }

    // ---------- config del engine ----------
    window.AptActivity.init({
      mount: '#apt-u1a10',
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Rouché-Frobenius con parámetros',
      subtitle: 'Elegí dónde va el parámetro. Después vas a tener que hallar, para cada clasificación, los valores que la producen, calculando rangos por determinantes.',

      generate: generateSystem,
      renderContent: renderContent,

      phases: [
        {
          mode: 'setup',
          fields: [
            { key:'tipo', label:'¿Qué sistema querés?', options:[
              { value:'A', label:'1 parámetro, sólo en A', sub:'como el ejemplo #4' },
              { value:'AB', label:'1 parámetro, en A y en B', sub:'como el ejemplo #5' },
              { value:'B', label:'1 parámetro, sólo en B' },
              { value:'dos', label:'2 parámetros: t en A y k en B', sub:'como el ejemplo #6' }
            ]}
          ],
          buttonLabel: 'Generar sistema'
        },
        {
          mode: 'choices',
          question: '¿Para qué valores el sistema es SCD (compatible determinado)?',
          choices: function(current){ return current.options.SCD; },
          check: function(current, value){ return value === 'correct'; },
          explain: function(current){ return explicarSCD(current); }
        },
        {
          mode: 'choices',
          question: '¿Y para qué valores es SCI (compatible indeterminado)?',
          choices: function(current){ return current.options.SCI; },
          check: function(current, value){ return value === 'correct'; },
          explain: function(current){ return explicarResto(current, 'SCI'); }
        },
        {
          mode: 'choices',
          question: '¿Y para qué valores es SI (incompatible)?',
          choices: function(current){ return current.options.SI; },
          check: function(current, value){ return value === 'correct'; },
          explain: function(current){ return explicarResto(current, 'SI'); }
        }
      ]
    });
  })();

})();
