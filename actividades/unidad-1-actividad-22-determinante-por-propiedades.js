/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 1 · Actividad 22
   "Calculá el determinante usando propiedades"
   ------------------------------------------------------------
   Toda la infraestructura común (CSS, sonido, mute, footer, modal
   de reporte, catálogo, KaTeX y fuentes) viene de engine.js.
   Acá vive SOLO la lógica matemática de esta actividad.

   En la landing va únicamente esto, en este orden:

     <script src="https://algebraparatodos.github.io/problemas-tomo-2/engine.js"><\/script>
     <script src="https://algebraparatodos.github.io/problemas-tomo-2/actividades/unidad-1-actividad-22-determinante-por-propiedades.js"><\/script>
   ============================================================ */
(function () {
  /* El div de montaje se inserta ACÁ, en el lugar del <script>,
     aprovechando que document.currentScript todavía es válido. */
  (function placeMount() {
    if (document.getElementById('apt-u1a22')) return;
    var d = document.createElement('div');
    d.id = 'apt-u1a22';
    var s = document.currentScript;
    if (s && s.parentNode) s.parentNode.insertBefore(d, s);
    else document.body.appendChild(d);
  })();

  (function () {
    /* Todo en un closure propio — ninguna variable ni función se
       filtra al window global. */

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
    function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = randInt(0, i), t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }

    function det(M) {
      var n = M.length;
      if (n === 1) return M[0][0];
      if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
      var suma = 0;
      for (var c = 0; c < n; c++) {
        if (M[0][c] === 0) continue;
        suma += (c % 2 ? -1 : 1) * M[0][c] * det(menor(M, 0, c));
      }
      return suma;
    }

    function menor(M, fila, col) {
      var men = [];
      for (var r = 0; r < M.length; r++) {
        if (r === fila) continue;
        var f = [];
        for (var k = 0; k < M.length; k++) if (k !== col) f.push(M[r][k]);
        men.push(f);
      }
      return men;
    }

    function matrizAlAzar(n, min, max) {
      var M = [], r, c;
      for (r = 0; r < n; r++) { M.push([]); for (c = 0; c < n; c++) M[r].push(randInt(min, max)); }
      return M;
    }

    /* ---------- Qué practica ----------

       Lo de 1.2.6.5 «Cálculo de determinantes usando propiedades», con la
       numeración de 1.2.6.4 (P1-P10). Hay cuatro tipos de ronda, y en todas
       primero se elige qué igualdad vale (con la propiedad que la
       justifica) y después cuánto da el determinante pedido:

       - ceros:   el ejemplo del libro. Se hacen ceros en la columna 1 con
                  F_i - kF_1 (P7: no cambia nada) o con aF_i - bF_1 (P5 y
                  P7: hay que compensar con 1/a afuera), y después se
                  desarrolla por esa columna.
       - cambio:  un intercambio de filas deja una triangular (P4 y P8).
       - factor:  se saca factor común de una fila o columna (P5), sin
                  confundirlo con det(kA) = k^n det(A).
       - formula: el «ejercicio clásico» del libro, |D| con D = kAB^{-1}C^t
                  y parecidos (P2, P5, P9, P10).

       Los tipos salen de un mazo, para que el reparto sea parejo. */
    var MAZO_BASE = ['ceros7', 'ceros57', 'ceros57', 'cambio', 'factor', 'formula', 'formula', 'ceros7'];
    var mazo = [];

    /* ---------- LaTeX ---------- */
    function tex(s) { return window.katex.renderToString(s, { throwOnError: false }); }
    function par(v) { return v < 0 ? '(' + v + ')' : String(v); }
    function detLatex(M) {
      return '\\left|\\begin{array}{' + M[0].map(function () { return 'r'; }).join('') + '}' +
        M.map(function (fila) { return fila.join(' & '); }).join(' \\\\ ') +
        '\\end{array}\\right|';
    }
    function opsLatex(ops) {
      // Las operaciones a la derecha de cada fila, como en el libro.
      return '\\;\\begin{array}{l}' + ops.map(function (o) { return o || '\\phantom{F}'; }).join(' \\\\ ') + '\\end{array}';
    }
    function fila(i) { return 'F_{' + (i + 1) + '}'; }
    function coefFila(k, i) { return (k === 1 ? '' : k) + fila(i); }
    // «2F_2 - 3F_1», «F_3 + F_1»...
    function operacion(mult, i, coef) {
      return coefFila(mult, i) + (coef > 0 ? ' - ' : ' + ') + coefFila(Math.abs(coef), 0);
    }
    function fraccion(m) { return m === 1 ? '' : (m < 0 ? '-' : '') + '\\frac{1}{' + Math.abs(m) + '}\\,'; }
    function potencia(k, n) { return (k < 0 ? '(' + k + ')' : k) + '^{' + n + '}'; }

    /* ---------- Opciones numéricas: la buena y tres errores típicos ---------- */
    function opcionesNumericas(valor, errores) {
      var usados = [valor], lista = [], k;
      for (k = 0; k < errores.length; k++) {
        var e = errores[k];
        if (typeof e !== 'number' || !isFinite(e) || Math.round(e) !== e) continue;
        if (usados.indexOf(e) !== -1) continue;
        usados.push(e); lista.push(e);
        if (lista.length === 3) break;
      }
      var paso = 1;
      while (lista.length < 3) {
        var cand = valor + (paso % 2 ? 1 : -1) * Math.ceil(paso / 2) * 2;
        if (usados.indexOf(cand) === -1) { usados.push(cand); lista.push(cand); }
        paso++;
      }
      return shuffle(lista.concat([valor])).map(function (v) { return { value: String(v), label: String(v) }; });
    }

    /* ---------- ceros: hacer ceros en la columna 1 y desarrollar ---------- */
    function casoCeros(conP5) {
      var n = randChoice([3, 4]);
      var A = matrizAlAzar(n, -4, 5);
      var p = conP5 ? randChoice([2, 3, -2, -3]) : randChoice([1, -1]);
      A[0][0] = p;
      var B = A.map(function (f) { return f.slice(); });
      var ops = [''], mults = [], escaladas = 0;
      for (var i = 1; i < n; i++) {
        var a = A[i][0];
        if (a === 0) { ops.push(''); continue; }
        var g = gcd(p, a);
        var mult = Math.abs(p) / g;             // por cuánto se multiplica F_i (P5)
        var coef = (p > 0 ? 1 : -1) * a / g;    // cuántas F_1 se le restan (P7)
        for (var c = 0; c < n; c++) B[i][c] = mult * A[i][c] - coef * A[0][c];
        ops.push(operacion(mult, i, coef));
        if (mult !== 1) { mults.push(mult); escaladas++; }
      }
      if (ops.filter(function (o) { return o; }).length < (n === 4 ? 2 : 1)) return null;
      if (conP5 && !escaladas) return null;

      var tope = n === 3 ? 20 : 15;
      for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (Math.abs(B[r][k]) > tope) return null;
      var valor = det(A);
      var menorB = det(menor(B, 0, 0));
      if (Math.abs(valor) > 250 || valor === 0) return null;
      var m = mults.reduce(function (x, y) { return x * y; }, 1);

      // Para el distractor de P5 se usa un número que aparezca en alguna
      // operación, que es el que el alumno tiende a sacar afuera.
      var q = Math.max(2, Math.abs(A[1][0]), Math.abs(A[n - 1][0]));
      var opciones;
      if (m === 1) {
        opciones = [
          { value: 'igual', label: tex('|A| = |B|') + ', por P7' },
          { value: 'menos', label: tex('|A| = -|B|') + ', por P4' },
          { value: 'por', label: tex('|A| = ' + q + '\\,|B|') + ', por P5' },
          { value: 'cero', label: tex('|A| = 0') + ', por P3' }
        ];
      } else {
        opciones = [
          { value: 'inversa', label: tex('|A| = ' + fraccion(m) + '|B|') + ', por P5 y P7' },
          { value: 'por', label: tex('|A| = ' + m + '\\,|B|') + ', por P5 y P7' },
          { value: 'igual', label: tex('|A| = |B|') + ', por P7' },
          { value: 'menos', label: tex('|A| = -|B|') + ', por P4' }
        ];
      }
      return {
        tipo: 'ceros', n: n, A: A, B: B, ops: ops, p: p, mults: mults, m: m,
        menorB: menorB, detB: p * menorB, det: valor,
        correcta: m === 1 ? 'igual' : 'inversa',
        opcionesIgualdad: shuffle(opciones),
        opcionesDet: opcionesNumericas(valor, [p * menorB, -valor, menorB, valor * m])
      };
    }

    /* ---------- cambio: un intercambio de filas deja una triangular ---------- */
    function casoCambio() {
      var n = randChoice([3, 4]);
      var B = matrizAlAzar(n, -4, 5), r, c;
      var superior = Math.random() < 0.5;
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) if (superior ? r > c : r < c) B[r][c] = 0;
        B[r][r] = randNonZero(-4, 4);
      }
      var i = randInt(0, n - 2), j = randInt(i + 1, n - 1);
      var A = B.map(function (f) { return f.slice(); });
      A[i] = B[j].slice(); A[j] = B[i].slice();
      var ops = []; for (r = 0; r < n; r++) ops.push(r === i ? fila(i) + ' \\leftrightarrow ' + fila(j) : '');
      var detB = 1; for (r = 0; r < n; r++) detB *= B[r][r];
      if (Math.abs(detB) > 250) return null;
      return {
        tipo: 'cambio', n: n, A: A, B: B, ops: ops, i: i, j: j, superior: superior,
        detB: detB, det: -detB, correcta: 'menos',
        opcionesIgualdad: shuffle([
          { value: 'menos', label: tex('|A| = -|B|') + ', por P4' },
          { value: 'igual', label: tex('|A| = |B|') + ', por P7' },
          { value: 'igual2', label: tex('|A| = |B|') + ', por P2' },
          { value: 'cero', label: tex('|A| = 0') + ', por P6' }
        ]),
        opcionesDet: opcionesNumericas(-detB, [detB, 0, -2 * detB])
      };
    }

    /* ---------- factor: sacar factor común de una fila o columna ---------- */
    function casoFactor() {
      var n = 3;
      var B = matrizAlAzar(n, -4, 5);
      var detB = det(B);
      if (detB === 0 || Math.abs(detB) > 60) return null;
      var k = randChoice([2, 3, 4, 5, -2, -3]);
      var esFila = Math.random() < 0.5, i = randInt(0, n - 1), r;
      var A = B.map(function (f) { return f.slice(); });
      for (r = 0; r < n; r++) { if (esFila) A[i][r] = k * B[i][r]; else A[r][i] = k * B[r][i]; }
      // Que la línea elegida no sea toda de ceros: no habría factor común que sacar.
      var linea = []; for (r = 0; r < n; r++) linea.push(esFila ? B[i][r] : B[r][i]);
      if (linea.every(function (v) { return v === 0; })) return null;
      return {
        tipo: 'factor', n: n, A: A, B: B, k: k, esFila: esFila, i: i,
        detB: detB, det: k * detB, correcta: 'k',
        opcionesIgualdad: shuffle([
          { value: 'k', label: tex('|A| = ' + k + '\\,|B|') + ', por P5' },
          { value: 'inversa', label: tex('|A| = ' + fraccion(k) + '|B|') + ', por P5' },
          { value: 'kn', label: tex('|A| = ' + potencia(k, n) + '\\,|B|') + ', por P5' },
          { value: 'igual', label: tex('|A| = |B|') + ', por P7' }
        ]),
        opcionesDet: opcionesNumericas(k * detB, [Math.pow(k, n) * detB, detB, -k * detB])
      };
    }

    /* ---------- formula: |D| con D = kAB^{-1}C^t y parecidos ---------- */
    var OPS_LETRA = ['', 't', '-1', '2'];
    function casoFormula() {
      var n = randChoice([2, 3]);
      var k = randChoice([2, 3, -2, -3]);
      var letras = shuffle(['A', 'B', 'C']).slice(0, randChoice([2, 3, 3]));
      var factores = letras.map(function (L) { return { L: L, op: randChoice(OPS_LETRA) }; });
      // Siempre una inversa (P10) y algo más que la sola letra.
      if (!factores.some(function (f) { return f.op === '-1'; })) factores[randInt(0, factores.length - 1)].op = '-1';
      if (!factores.some(function (f) { return f.op === 't' || f.op === '2'; })) {
        var libres = factores.filter(function (f) { return f.op === ''; });
        if (libres.length) randChoice(libres).op = randChoice(['t', '2']);
      }
      factores.sort(function (x, y) { return x.L < y.L ? -1 : 1; });
      var valores = {};
      factores.forEach(function (f) { valores[f.L] = randChoice([1, 2, 3, 4, -1, -2, -3, -4]); });

      // El valor exacto, como fracción num/den, para no aceptar resultados no enteros.
      function evaluar(potK, errorInversa, errorCuadrado) {
        var num = potK, den = 1;
        factores.forEach(function (f) {
          var v = valores[f.L];
          if (f.op === '-1' && !errorInversa) den *= v;
          else if (f.op === '2') num *= errorCuadrado ? 2 * v : v * v;
          else num *= v;
        });
        return num % den === 0 ? num / den : NaN;
      }
      var kn = Math.pow(k, n);
      var valor = evaluar(kn, false, false);
      if (!isFinite(valor) || Math.abs(valor) > 400) return null;

      function termino(f, errorInversa, errorCuadrado) {
        var X = '|' + f.L + '|';
        if (f.op === '-1') return errorInversa ? X : '\\frac{1}{' + X + '}';
        if (f.op === '2') return errorCuadrado ? '2\\,' + X : X + '^{2}';
        return X;
      }
      function formula(escalar, errorInversa, errorCuadrado) {
        return tex('|D| = ' + escalar + ' \\cdot ' + factores.map(function (f) { return termino(f, errorInversa, errorCuadrado); }).join(' \\cdot '));
      }
      var hayCuadrado = factores.some(function (f) { return f.op === '2'; });
      var opciones = [
        { value: 'bien', label: formula(potencia(k, n), false, false) },
        { value: 'sinPot', label: formula(par(k), false, false) },
        { value: 'sinInv', label: formula(potencia(k, n), true, false) },
        hayCuadrado
          ? { value: 'cuad', label: formula(potencia(k, n), false, true) }
          : { value: 'ambos', label: formula(par(k), true, false) }
      ];
      var D = 'D = ' + k + '\\,' + factores.map(function (f) {
        return f.L + (f.op ? '^{' + f.op + '}' : '');
      }).join('\\,');
      return {
        tipo: 'formula', n: n, k: k, kn: kn, factores: factores, valores: valores, D: D,
        det: valor, correcta: 'bien',
        opcionesIgualdad: shuffle(opciones),
        opcionesDet: opcionesNumericas(valor, [evaluar(k, false, false), evaluar(kn, true, false), -valor, evaluar(kn, false, true)])
      };
    }

    function generarCaso() {
      var intentos = 0;
      if (!mazo.length) mazo = shuffle(MAZO_BASE);
      var tipo = mazo.pop();
      while (intentos++ < 500) {
        var caso = tipo === 'ceros7' ? casoCeros(false)
          : tipo === 'ceros57' ? casoCeros(true)
          : tipo === 'cambio' ? casoCambio()
          : tipo === 'factor' ? casoFactor()
          : casoFormula();
        if (caso) return caso;
      }
      return null;
    }

    /* ---------- Textos ---------- */
    function enunciado(current) {
      if (current.tipo === 'formula') {
        var datos = current.factores.map(function (f) { return '|' + f.L + '| = ' + current.valores[f.L]; }).join(',\\; ');
        var nombres = current.factores.map(function (f) { return f.L; });
        var lista = nombres.length === 2 ? nombres[0] + ' y ' + nombres[1] : nombres[0] + ', ' + nombres[1] + ' y ' + nombres[2];
        return {
          texto: 'Las matrices ' + lista + ' son de orden ' + current.n + ' y ' + tex(datos) + '. Se pide ' + tex('|D|') + ':',
          formulas: [current.D]
        };
      }
      var texto = 'Se pide ' + tex('|A|') + '. ';
      if (current.tipo === 'ceros') texto += 'Para hacer ceros en la columna 1, se hizo este paso:';
      else if (current.tipo === 'cambio') texto += 'Se intercambiaron dos filas y quedó esto:';
      else texto += 'Se sacó factor común ' + tex(String(current.k)) + ' de la ' + (current.esFila ? 'fila ' : 'columna ') + (current.i + 1) + ':';
      return {
        texto: texto,
        formulas: [
          '|A| = ' + detLatex(current.A) + (current.ops ? opsLatex(current.ops) : ''),
          '|B| = ' + detLatex(current.B)
        ]
      };
    }

    function explicarIgualdad(current) {
      if (current.tipo === 'ceros') {
        if (current.m === 1) {
          return 'A cada fila que se tocó sólo se le sumó un múltiplo de ' + tex('F_1') + ', y por P7 eso no cambia el determinante: ' +
            tex('|A| = |B|') + '.';
        }
        var producto = current.mults.join('\\cdot ');
        return 'En una operación como ' + tex(current.ops.filter(function (o) { return /^\d/.test(o); })[0]) +
          ' la fila primero se multiplica por un número (P5) y después se le suma un múltiplo de ' + tex('F_1') + ' (P7). ' +
          'Las filas multiplicadas hacen que ' + tex('|B| = ' + producto + '\\cdot |A|') + ', así que para que la igualdad se mantenga ' +
          'se compensa afuera: ' + tex('|A| = \\frac{1}{' + producto + '}\\,|B|' + (current.mults.length > 1 ? ' = ' + fraccion(current.m) + '|B|' : '')) + '.';
      }
      if (current.tipo === 'cambio') {
        return 'Se intercambiaron ' + tex(fila(current.i)) + ' y ' + tex(fila(current.j)) +
          ', y por P4 el determinante cambia de signo: ' + tex('|A| = -|B|') + '.';
      }
      if (current.tipo === 'factor') {
        return 'Por P5, si una sola ' + (current.esFila ? 'fila' : 'columna') + ' está multiplicada por ' + tex(String(current.k)) +
          ', el determinante queda multiplicado por ' + tex(String(current.k)) + ': ' + tex('|A| = ' + current.k + '\\,|B|') + '. ' +
          'El ' + tex(potencia(current.k, current.n)) + ' aparece sólo cuando se multiplica toda la matriz: ' +
          tex('\\det(kA) = k^{n}\\det(A)') + '.';
      }
      var partes = ['Por P5, ' + tex('|kM| = k^{' + current.n + '}\\,|M|') + ' (la matriz es de orden ' + current.n + ')',
        'por P9, el determinante de un producto es el producto de los determinantes'];
      current.factores.forEach(function (f) {
        if (f.op === '-1') partes.push('por P10, ' + tex('|' + f.L + '^{-1}| = \\frac{1}{|' + f.L + '|}'));
        if (f.op === 't') partes.push('por P2, ' + tex('|' + f.L + '^{t}| = |' + f.L + '|'));
        if (f.op === '2') partes.push('por P9 otra vez, ' + tex('|' + f.L + '^{2}| = |' + f.L + '|^{2}'));
      });
      return partes.slice(0, -1).join('; ') + ' y ' + partes[partes.length - 1] + '.';
    }

    function explicarValor(current) {
      if (current.tipo === 'ceros') {
        var paso = 'Desarrollando ' + tex('|B|') + ' por la columna 1, donde sólo queda el ' + tex(String(current.p)) + ': ' +
          tex('|B| = ' + current.p + ' \\cdot ' + detLatex(menor(current.B, 0, 0)) + ' = ' + current.p + ' \\cdot ' + par(current.menorB) + ' = ' + current.detB) + '. ';
        if (current.m === 1) return paso + 'Como ' + tex('|A| = |B|') + ', ' + tex('|A| = ' + current.det) + '.';
        return paso + 'Entonces ' + tex('|A| = ' + fraccion(current.m) + '\\cdot ' + par(current.detB) + ' = ' + current.det) + '.';
      }
      if (current.tipo === 'cambio') {
        var diag = current.B.map(function (f, r) { return par(f[r]); }).join(' \\cdot ');
        return tex('|B|') + ' es triangular ' + (current.superior ? 'superior' : 'inferior') + ', así que por P8 es el producto de su diagonal: ' +
          tex('|B| = ' + diag + ' = ' + current.detB) + '. Entonces ' + tex('|A| = -|B| = ' + current.det) + '.';
      }
      if (current.tipo === 'factor') {
        return 'Con Sarrus o desarrollando, ' + tex('|B| = ' + current.detB) + ', que tiene números más chicos que ' + tex('|A|') + '. ' +
          'Entonces ' + tex('|A| = ' + current.k + ' \\cdot ' + par(current.detB) + ' = ' + current.det) + '.';
      }
      var cuenta = current.factores.map(function (f) {
        var v = par(current.valores[f.L]);
        if (f.op === '-1') return '\\frac{1}{' + v + '}';
        if (f.op === '2') return v + '^{2}';
        return v;
      }).join(' \\cdot ');
      return tex('|D| = ' + potencia(current.k, current.n) + ' \\cdot ' + cuenta + ' = ' + current.kn + ' \\cdot ' + cuenta + ' = ' + current.det) + '.';
    }

    window.AptActivity.init({
      mount: '#apt-u1a22',
      eyebrow: 'Unidad 1 · Matrices y SEL',
      title: 'Calculá el determinante usando propiedades',
      subtitle: 'Con las propiedades P1-P10 se hacen ceros, se compensa lo que cambió y se llega al resultado con muchas menos cuentas.',
      nextLabel: 'Probar con otro →',
      needsKatex: true,
      mode: 'phases',
      generate: generarCaso,
      renderContent: function (container, current) {
        var e = enunciado(current);
        container.innerHTML =
          '<div style="text-align:center;max-width:36em;">' + e.texto + '</div>' +
          e.formulas.map(function (f) {
            return '<div style="max-width:100%;overflow-x:auto;text-align:center;">' +
              window.katex.renderToString(f, { throwOnError: false, displayMode: true }) + '</div>';
          }).join('');
      },
      phases: [
        {
          mode: 'choices',
          question: '¿Qué igualdad es la correcta?',
          choicesStacked: true,
          choices: function (current) { return current.opcionesIgualdad; },
          check: function (current, value) { return value === current.correcta; },
          explain: function (current) { return explicarIgualdad(current); }
        },
        {
          mode: 'choices',
          question: '¿Cuánto vale entonces el determinante que se pide?',
          choices: function (current) { return current.opcionesDet; },
          check: function (current, value) { return Number(value) === current.det; },
          explain: function (current) { return explicarValor(current); }
        }
      ]
    });
  })();

})();
