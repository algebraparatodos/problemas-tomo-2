/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 8
   "Diagonalización ortogonal"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-8-diagonalizacion-ortogonal.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a8')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a8';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = randInt(0, i), t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function punto(u, v) { var s = 0; for (var k = 0; k < u.length; k++) s += u[k] * v[k]; return s; }
    function cruz(u, w) {
      return [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    }

    /* ---------- Qué se practica ----------

       El libro (4.3, «Cómo se diagonaliza ortogonalmente») da cinco pasos.
       Los dos primeros son los de 4.2.3 y ya los practican las
       actividades 1, 2 y 3, así que acá vienen hechos, como en el
       Ejemplo #1 de 4.3 («los pasos 1 y 2 ya los hicimos»): se dan A, los
       autovalores con su MA y una base de cada autoespacio. Lo que se
       practica es lo nuevo de 4.3:

         Paso 3. Decidir si hace falta Gram-Schmidt. El QR dice «con
                 Gram-Schmidt cuando haga falta», así que hay rondas en
                 las que la base del autoespacio doble ya viene ortogonal
                 (alrededor del 30 %) y no hay nada que hacer. Y entre
                 autoespacios distintos nunca hace falta.
         Paso 3 (bis). Si hace falta, aplicarlo. Esta fase se saltea
                 cuando la base ya era ortogonal.
         Pasos 4 y 5. Normalizar y armar P con las columnas en el orden de
                 D. Los distractores son los errores del armado: no
                 normalizar, no ortogonalizar, poner las columnas en otro
                 orden que D y escribir los vectores como filas.

       Las matrices se construyen como A = a·I + b·(v·vᵗ), que es
       simétrica y entera si v y los escalares lo son. Tiene a v como
       autovector con autovalor a + b·|v|², y todo el plano perpendicular
       a v como autoespacio del autovalor a, que queda doble.

       El autoespacio se escribe ⟨…⟩, como en el libro. */
    function generarCaso() {
      var haceFaltaGS = Math.random() < 0.7;
      var intentos = 0;
      while (intentos++ < 2000) {
        var v = [randChoice([1, 1, 2]), randChoice([-2, -1, 1, 2]), randChoice([-2, -1, 1, 2])];
        var norma2 = punto(v, v);
        if (norma2 < 3 || norma2 > 9) continue;

        var a = randChoice([-2, -1, 1, 2, 3]);
        var b = randChoice([-2, -1, 1, 2]);

        var A = [], r, c;
        for (r = 0; r < 3; r++) {
          A.push([]);
          for (c = 0; c < 3; c++) A[r].push((r === c ? a : 0) + b * v[r] * v[c]);
        }

        var lambdaDoble = a;
        var lambdaSimple = a + b * norma2;
        if (lambdaDoble === lambdaSimple) continue;

        var grande = false;
        for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) if (Math.abs(A[r][c]) > 12) grande = true;
        if (grande) continue;

        // Dos generadores enteros del autoespacio doble (el plano
        // perpendicular a v): no ortogonales si hace falta Gram-Schmidt,
        // ortogonales si no.
        var base = generadoresDelPlano(v);
        if (!base) continue;
        var u1 = base[0], w = haceFaltaGS ? base[1] : simplificar(cruz(v, base[0]));
        if (!w || Math.max.apply(null, w.map(Math.abs)) > 5) continue;
        if ((punto(u1, w) !== 0) !== haceFaltaGS) continue;

        // Gram-Schmidt: se le quita a w su componente en la dirección de
        // u1. Se multiplica por |u1|² para que el resultado quede entero
        // (el libro hace lo mismo: (1/2, 1/2, −1) pasa a (1, 1, −2)).
        var u2 = w, opcionesGS = null;
        if (haceFaltaGS) {
          var n1 = punto(u1, u1), proy = punto(w, u1);
          u2 = [];
          for (r = 0; r < 3; r++) u2.push(w[r] * n1 - u1[r] * proy);
          u2 = simplificar(u2);
          if (!u2) continue;
          if (punto(u1, u2) !== 0 || punto(u2, v) !== 0) continue;
          opcionesGS = armarOpcionesGS(u1, w, u2, v);
          if (!opcionesGS) continue;
        }

        var caso = {
          A: A, v: v,
          lambdaDoble: lambdaDoble, lambdaSimple: lambdaSimple,
          u1: u1, w: w, u2: u2,
          haceFaltaGS: haceFaltaGS,
          opcionesGS: opcionesGS
        };
        caso.opcionesP = armarOpcionesP(caso);
        if (!caso.opcionesP) continue;
        return caso;
      }
      return null;
    }

    /** Dos vectores enteros independientes perpendiculares a v. */
    function generadoresDelPlano(v) {
      var candidatos = [];
      // Con v = (a,b,c), estos dos son perpendiculares por construcción.
      if (v[0] !== 0 || v[1] !== 0) candidatos.push([-v[1], v[0], 0]);
      if (v[1] !== 0 || v[2] !== 0) candidatos.push([0, -v[2], v[1]]);
      if (v[0] !== 0 || v[2] !== 0) candidatos.push([-v[2], 0, v[0]]);
      if (candidatos.length < 2) return null;

      var elegidos = shuffle(candidatos).slice(0, 2);
      var u1 = simplificar(elegidos[0]), w = simplificar(elegidos[1]);
      if (!u1 || !w) return null;

      // Que no sean múltiplos entre sí.
      var x = cruz(u1, w);
      if (x[0] === 0 && x[1] === 0 && x[2] === 0) return null;
      return [u1, w];
    }

    function mcd(a, b) { return b ? mcd(b, a % b) : Math.abs(a); }

    function simplificar(u) {
      var g = 0, k;
      for (k = 0; k < u.length; k++) g = mcd(g, u[k]);
      if (!g) return null;
      var s = u.map(function (x) { return x / g; });
      // Primera componente no nula positiva, para que u y −u no sean dos
      // respuestas distintas.
      for (k = 0; k < s.length; k++) {
        if (s[k] === 0) continue;
        return s[k] < 0 ? s.map(function (x) { return -x; }) : s;
      }
      return null;
    }

    /** Un entero con el signo menos tipográfico: −3 en vez de -3. */
    function conSigno(x) { return x < 0 ? '−' + Math.abs(x) : String(x); }
    function comoTexto(u) { return u.map(conSigno).join(', '); }

    function armarOpcionesGS(u1, w, correcto, v) {
      var candidatos = [];
      // El error de no ortogonalizar: dejar w tal como estaba.
      candidatos.push(simplificar(w));
      // El de restar sin escalar por la norma.
      var mal = [];
      for (var k = 0; k < 3; k++) mal.push(w[k] - u1[k]);
      candidatos.push(simplificar(mal));
      // Y un vector que ni siquiera está en el autoespacio.
      candidatos.push(simplificar(v.slice()));

      var textos = [comoTexto(correcto)], opciones = [];
      for (k = 0; k < candidatos.length; k++) {
        if (!candidatos[k]) continue;
        var t = comoTexto(candidatos[k]);
        if (textos.indexOf(t) !== -1) continue;
        textos.push(t);
        opciones.push(t);
      }
      if (opciones.length < 3) return null;
      return shuffle(opciones.slice(0, 3).concat([comoTexto(correcto)])).map(function (t) {
        return { value: t, label: '(' + t + ')' };
      });
    }

    /* ---------- Las P candidatas ----------

       Cada P se guarda como tres columnas enteras más el número por cuya
       raíz se divide cada una (1 si no se normalizó), así se puede
       escribir exacto, con raíces, como en el libro. La correcta tiene
       las columnas v, u₁, u₂ normalizadas, en ese orden, porque D lleva
       λ₁ (el simple) primero y λ₂ (el doble) dos veces después.

       Cada candidata se comprueba con números: la correcta tiene que
       cumplir PᵗP = I y PᵗAP = D, y ninguna de las otras puede cumplir
       las dos (si no, sería otra respuesta correcta). */
    function armarOpcionesP(caso) {
      function col(u, normalizar) { return { u: u, n: normalizar ? punto(u, u) : 1 }; }
      var cand = [
        { value: 'ok', cols: [col(caso.v, true), col(caso.u1, true), col(caso.u2, true)] },
        { value: 'sinNormalizar', cols: [col(caso.v, false), col(caso.u1, false), col(caso.u2, false)] }
      ];
      if (caso.haceFaltaGS) cand.push({ value: 'sinGS', cols: [col(caso.v, true), col(caso.u1, true), col(caso.w, true)] });
      cand.push({ value: 'orden', cols: [col(caso.u1, true), col(caso.v, true), col(caso.u2, true)] });
      cand.push({ value: 'filas', cols: [col(caso.v, true), col(caso.u1, true), col(caso.u2, true)], traspuesta: true });

      var D = [caso.lambdaSimple, caso.lambdaDoble, caso.lambdaDoble];
      var vistos = [], opciones = [];
      for (var i = 0; i < cand.length && opciones.length < 4; i++) {
        var o = cand[i];
        o.tex = matrizConRaices(o.cols, o.traspuesta);
        if (vistos.indexOf(o.tex) !== -1) continue;
        var sirve = diagonalizaOrtogonalmente(caso.A, numerica(o.cols, o.traspuesta), D);
        if (sirve !== (o.value === 'ok')) return null;
        vistos.push(o.tex);
        opciones.push(o);
      }
      return opciones.length === 4 ? shuffle(opciones) : null;
    }

    function numerica(cols, traspuesta) {
      var P = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      cols.forEach(function (cl, j) {
        for (var i = 0; i < 3; i++) {
          var x = cl.u[i] / Math.sqrt(cl.n);
          if (traspuesta) P[j][i] = x; else P[i][j] = x;
        }
      });
      return P;
    }

    function diagonalizaOrtogonalmente(A, P, D) {
      var i, j, k, l;
      for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) {
        var s = 0, t = 0;
        for (k = 0; k < 3; k++) {
          s += P[k][i] * P[k][j];
          for (l = 0; l < 3; l++) t += P[k][i] * A[k][l] * P[l][j];
        }
        if (Math.abs(s - (i === j ? 1 : 0)) > 1e-9) return false;
        if (Math.abs(t - (i === j ? D[i] : 0)) > 1e-9) return false;
      }
      return true;
    }

    /** x/√n escrito como en el libro: 1/√3, −2/√6, 2/3. Saca de la raíz
        los cuadrados (√8 = 2√2) y simplifica lo que se pueda. */
    function entradaTex(x, n) {
      if (x === 0) return '0';
      var s = 1, m = n, f;
      for (f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; s *= f; }
      var g = mcd(Math.abs(x), s);
      var num = Math.abs(x) / g, den = s / g;
      var signo = x < 0 ? '-' : '';
      var abajo = (den === 1 ? '' : den) + (m === 1 ? '' : '\\sqrt{' + m + '}');
      if (abajo === '') return signo + num;
      return signo + '\\dfrac{' + num + '}{' + abajo + '}';
    }

    /** √n en texto, sacando los cuadrados: 3, √5, 3√5. */
    function raizTexto(n) {
      var s = 1, m = n, f;
      for (f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; s *= f; }
      if (m === 1) return String(s);
      return (s === 1 ? '' : s) + '√' + m;
    }

    function matrizConRaices(cols, traspuesta) {
      var filas = [0, 1, 2].map(function (i) {
        return [0, 1, 2].map(function (j) {
          var cl = traspuesta ? cols[i] : cols[j];
          return entradaTex(traspuesta ? cl.u[j] : cl.u[i], cl.n);
        }).join(' & ');
      });
      return '{\\def\\arraystretch{2.3}\\left[\\begin{array}{rrr}' + filas.join(' \\\\ ') + '\\end{array}\\right]}';
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }
    function vecTex(u) { return '(' + u.join(', ') + ')'; }
    function tex(s) { return window.katex.renderToString(s, { throwOnError: false }); }

    var POR_QUE_NO_P = {
      sinNormalizar: 'Faltó el paso 4: las columnas tienen que tener norma 1. Sin normalizar, PᵗP no da la identidad y P no es ortogonal.',
      sinGS: 'Esa P usa el segundo generador tal como venía, sin Gram-Schmidt, y no es ortogonal con el primero: PᵗP no da la identidad.',
      orden: 'Las columnas no están en el orden de D. La primera columna tiene que ser el autovector de λ₁ (el simple), porque D lo lleva primero.',
      filas: 'Ahí los vectores quedaron como filas. En P van como columnas.'
    };

    window.AptActivity.init({
      mount: '#apt-u4a8',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: 'Diagonalización ortogonal',
      subtitle: 'A es simétrica, así que por el teorema espectral se puede diagonalizar ortogonalmente. Los pasos 1 y 2 ya están hechos: seguí con los pasos 3, 4 y 5 de 4.3.',
      nextLabel: 'Probar con otra matriz →',
      needsKatex: true,
      mode: 'phases',
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        var s = current.lambdaSimple, d = current.lambdaDoble;
        window.katex.render(
          'A = ' + matrixLatex(current.A) +
          '\\\\[8pt] \\lambda_1 = ' + s + ',\\ \\text{MA} = 1 \\qquad \\lambda_2 = ' + d + ',\\ \\text{MA} = 2' +
          '\\\\[6pt] E_{\\lambda = ' + s + '} = \\left\\langle ' + vecTex(current.v) + ' \\right\\rangle' +
          '\\\\[6pt] E_{\\lambda = ' + d + '} = \\left\\langle ' + vecTex(current.u1) + ', ' + vecTex(current.w) + ' \\right\\rangle',
          container, { throwOnError: false, displayMode: true }
        );
      },
      phases: [
        {
          mode: 'choices',
          question: 'Paso 3. ¿Hay que aplicar Gram-Schmidt?',
          choicesStacked: true,
          choices: [
            { value: 'doble', label: 'Sí, a la base del autoespacio de dimensión 2' },
            { value: 'nada', label: 'No: esa base ya es ortogonal, alcanza con normalizar' },
            { value: 'todos', label: 'Sí, a los tres vectores juntos, para que los de autoespacios distintos queden ortogonales' }
          ],
          check: function (current, value) { return value === (current.haceFaltaGS ? 'doble' : 'nada'); },
          explain: function (current, correcto, value) {
            var pp = punto(current.u1, current.w);
            var txt = correcto ? '¡Correcto! ' : 'No es correcto. ';
            if (value === 'todos') {
              txt += 'Entre autoespacios distintos no hace falta nada: como A es simétrica, los autovectores de autovalores distintos ya son ortogonales. ';
            }
            txt += 'Dentro del autoespacio de λ₂ = ' + conSigno(current.lambdaDoble) + ', el producto escalar de los generadores da (' +
              comoTexto(current.u1) + ')·(' + comoTexto(current.w) + ') = ' + conSigno(pp) + '. ';
            txt += current.haceFaltaGS
              ? 'Como no es cero, no son ortogonales y hay que aplicarles Gram-Schmidt.'
              : 'Ya son ortogonales, así que en el paso 3 no hay nada que hacer.';
            return txt + ' Y (' + comoTexto(current.v) + '), el de λ₁, es ortogonal a los dos sin hacer nada.';
          }
        },
        {
          mode: 'choices',
          question: 'Gram-Schmidt: dejá el primer generador como está y quitale al segundo su componente en esa dirección. ¿Qué vector queda? (Sin fracciones, como en el libro.)',
          skip: function (current) { return !current.haceFaltaGS; },
          choices: function (current) { return current.opcionesGS; },
          check: function (current, value) { return value === comoTexto(current.u2); },
          explain: function (current, correcto) {
            return (correcto ? '¡Correcto! ' : 'No es correcto. ') +
              'Dejando (' + comoTexto(current.u1) + ') como está y quitándole a (' + comoTexto(current.w) +
              ') su componente en esa dirección, queda un múltiplo de (' + comoTexto(current.u2) + '). ' +
              'Comprobalo: es perpendicular a (' + comoTexto(current.u1) + ') y sigue estando en el autoespacio, ' +
              'o sea que también es perpendicular a (' + comoTexto(current.v) + ').';
          }
        },
        {
          mode: 'choices',
          question: 'Pasos 4 y 5. Normalizá los tres vectores y armá $P$ para que $D$ tenga en la diagonal $\\lambda_1, \\lambda_2, \\lambda_2$, en ese orden. ¿Cuál es $P$?',
          choicesGrid: true,
          choicesGridSingleColumn: true,
          choices: function (current) {
            return current.opcionesP.map(function (o) {
              return { value: o.value, label: tex('P = ' + o.tex) };
            });
          },
          check: function (current, value) { return value === 'ok'; },
          explain: function (current, correcto, value) {
            var normas = [current.v, current.u1, current.u2].map(function (u) {
              return '‖(' + comoTexto(u) + ')‖ = ' + raizTexto(punto(u, u));
            });
            var Dtex = tex('D = ' + matrixLatex([
              [current.lambdaSimple, 0, 0], [0, current.lambdaDoble, 0], [0, 0, current.lambdaDoble]
            ]));
            var base = 'Cada vector se divide por su norma (' + normas.join(', ') + ') y va como columna, ' +
              'en el mismo orden que los autovalores en ' + Dtex + '. Esa P es ortogonal, así que P⁻¹ = Pᵗ y ' +
              'la diagonalización queda D = PᵗAP. Si querés comprobarlo, PᵗP tiene que dar la identidad.';
            if (correcto) return '¡Correcto! ' + base;
            return 'No es correcto. ' + (POR_QUE_NO_P[value] || '') + ' ' + base;
          }
        }
      ]
    });
  })();

})();
