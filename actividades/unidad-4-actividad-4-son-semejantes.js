/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 4 · Actividad 4
   "¿Son semejantes?"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-4-actividad-4-son-semejantes.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u4a4')) return;
    var d = document.createElement('div');
    d.id = 'apt-u4a4';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function multiplicar(A, B, n) {
      var M = [], r, c, k;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) { var s = 0; for (k = 0; k < n; k++) s += A[r][k] * B[k][c]; M[r].push(s); }
      }
      return M;
    }
    function traza(M, n) { var s = 0; for (var r = 0; r < n; r++) s += M[r][r]; return s; }
    function determinante(A) {
      var n = A.length;
      if (n === 1) return A[0][0];
      if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
      var s = 0;
      for (var c = 0; c < n; c++) {
        var men = [];
        for (var r = 1; r < n; r++) {
          var f = [];
          for (var k = 0; k < n; k++) if (k !== c) f.push(A[r][k]);
          men.push(f);
        }
        s += (c % 2 ? -1 : 1) * A[0][c] * determinante(men);
      }
      return s;
    }

    /* ---------- Qué casos se generan y cuál se deja fuera ----------

       Los invariantes de 4.2.1 sirven para descartar: si la traza o el
       determinante no coinciden, las matrices no pueden ser semejantes, y
       eso se ve sin calcular casi nada. Por eso las "no semejantes" de
       esta actividad siempre difieren en uno de los dos.

       Lo que **no** se genera es el caso sutil —mismo polinomio
       característico pero distinta multiplicidad geométrica—, porque
       decidirlo exige calcular núcleos y no sería justo pedirlo acá. Pero
       sí se lo advierte en la explicación cada vez que la respuesta es
       que sí: que los invariantes coincidan no alcanza para asegurar la
       semejanza, sólo para descartarla. */
    function generarCaso() {
      var intentos = 0;
      while (intentos++ < 400) {
        var n = Math.random() < 0.5 ? 2 : 3;

        var A = [], r, c;
        for (r = 0; r < n; r++) { A.push([]); for (c = 0; c < n; c++) A[r].push(randInt(-4, 5)); }

        var sonSemejantes = Math.random() < 0.5;

        if (sonSemejantes) {
          var P = [], k, i, j, f;
          for (r = 0; r < n; r++) { P.push([]); for (c = 0; c < n; c++) P[r].push(r === c ? 1 : 0); }
          for (k = 0; k < (n === 2 ? 2 : 3); k++) {
            i = randInt(0, n - 1);
            do { j = randInt(0, n - 1); } while (j === i);
            f = randChoice([-2, -1, 1, 2]);
            for (c = 0; c < n; c++) P[i][c] += f * P[j][c];
          }
          var Pinv = inversaEntera(P, n);
          if (!Pinv) continue;
          var B = multiplicar(multiplicar(Pinv, A, n), P, n);

          var grande = false;
          for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(B[r][c]) > 25) grande = true;
          if (grande) continue;

          // Si B salió igual a A, la pregunta no tiene gracia.
          var iguales = true;
          for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (A[r][c] !== B[r][c]) iguales = false;
          if (iguales) continue;

          return {
            n: n, A: A, B: B, semejantes: true,
            trazaA: traza(A, n), trazaB: traza(B, n),
            detA: determinante(A), detB: determinante(B),
            motivo: null
          };
        }

        // No semejantes: se rompe uno de los dos invariantes a propósito.
        var B2 = [], porTraza = Math.random() < 0.5;
        for (r = 0; r < n; r++) { B2.push([]); for (c = 0; c < n; c++) B2[r].push(randInt(-4, 5)); }

        var tA = traza(A, n), tB = traza(B2, n);
        var dA = determinante(A), dB = determinante(B2);

        if (porTraza) {
          if (tA === tB) continue;
        } else {
          // Se fuerza que las trazas coincidan, para que el determinante
          // sea lo único que las delata: es el caso que obliga a mirar
          // los dos invariantes y no quedarse con el primero.
          B2[n - 1][n - 1] += tA - tB;
          tB = traza(B2, n);
          dB = determinante(B2);
          if (dA === dB) continue;
          var muyGrande = false;
          for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (Math.abs(B2[r][c]) > 12) muyGrande = true;
          if (muyGrande) continue;
        }

        return {
          n: n, A: A, B: B2, semejantes: false,
          trazaA: tA, trazaB: tB, detA: dA, detB: dB,
          motivo: tA !== tB ? 'traza' : 'determinante'
        };
      }
      return null;
    }

    function inversaEntera(A, n) {
      var d = determinante(A);
      if (d !== 1 && d !== -1) return null;
      var M = [], r, c;
      for (r = 0; r < n; r++) {
        M.push([]);
        for (c = 0; c < n; c++) M[r].push(((r + c) % 2 ? -1 : 1) * determinante(menor(A, c, r)) / d);
      }
      return M;
    }
    function menor(A, fila, col) {
      var M = [], r, c;
      for (r = 0; r < A.length; r++) {
        if (r === fila) continue;
        var f = [];
        for (c = 0; c < A.length; c++) if (c !== col) f.push(A[r][c]);
        M.push(f);
      }
      return M;
    }

    function matrixLatex(M) {
      return '\\left[\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right]';
    }

    window.AptActivity.init({
      mount: '#apt-u4a4',
      eyebrow: 'Unidad 4 · Diagonalización',
      title: '¿Son semejantes?',
      subtitle: 'No hace falta buscar la P. Con los invariantes de 4.2.1 alcanza para descartar en la mayoría de los casos.',
      nextLabel: 'Probar con otro par →',
      needsKatex: true,
      mode: 'choices',
      choices: [
        { value: 'si', label: 'Sí, son semejantes' },
        { value: 'no', label: 'No, no pueden serlo' }
      ],
      generate: function () {
        var caso = generarCaso();
        while (!caso) caso = generarCaso();
        return caso;
      },
      renderContent: function (container, current) {
        window.katex.render(
          'A = ' + matrixLatex(current.A) + '\\qquad B = ' + matrixLatex(current.B),
          container, { throwOnError: false }
        );
      },
      check: function (current, value) {
        return (value === 'si') === current.semejantes;
      },
      explain: function (current, correcto) {
        var cabeza = correcto ? '¡Correcto! ' : 'No es correcto. ';

        if (!current.semejantes) {
          if (current.motivo === 'traza') {
            return cabeza + 'No pueden ser semejantes: la traza de A vale ' + current.trazaA +
              ' y la de B, ' + current.trazaB + '. Como la traza es un invariante de semejanza, ' +
              'si no coincide ya está todo dicho y no hace falta calcular nada más.';
          }
          return cabeza + 'No pueden ser semejantes. Ojo que acá las trazas sí coinciden, las dos valen ' +
            current.trazaA + ', así que ese invariante no las descarta. El que las delata es el determinante: ' +
            'el de A vale ' + current.detA + ' y el de B, ' + current.detB + '.';
        }

        return cabeza + 'Sí lo son: B se obtuvo de A con un cambio de base. Podés verificar que los invariantes ' +
          'coinciden — la traza vale ' + current.trazaA + ' en las dos y el determinante ' + current.detA + ' —, ' +
          'aunque conviene que sepas que eso solo no alcanzaría para asegurarlo: hay matrices con los mismos ' +
          'invariantes que no son semejantes. Los invariantes sirven para descartar con certeza, no para confirmar.';
      }
    });
  })();

})();
