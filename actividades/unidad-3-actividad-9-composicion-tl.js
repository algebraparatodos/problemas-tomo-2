/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 9
   "Composición de TL"
   ------------------------------------------------------------
   Sección 3.6. Dadas T y S, decidir qué composiciones están
   definidas y, si alguna lo está, elegir su matriz asociada.

     S∘T está definida  ⟺  el espacio de llegada de T es el de
                            partida de S
     T∘S está definida  ⟺  el de llegada de S es el de partida de T

   Y la matriz de la composición es el PRODUCTO de las matrices, en
   el mismo orden en que se escribe la composición:

     M(S∘T) = M(S) · M(T)

   ...siempre que las bases del espacio intermedio coincidan. Una parte
   de las rondas (las de «solo S∘T» o «solo T∘S», 6 de cada 10) usa
   el caso del Ejemplo #2 del libro, el que precede al QR: el espacio
   intermedio es R² pero T llega en una base y S parte de otra, y hay
   que meter P_{B₁→B₂} entre las dos matrices (ver generateBases). En
   esas rondas las matrices se muestran como M_{E₁B₁}(T), con el
   subíndice en la M, igual que en el libro.

   UN PUNTO A PROPÓSITO: entre los espacios que se sortean hay dos de
   la misma dimensión pero distintos, R³ y P₂(R). Que las dimensiones
   coincidan NO alcanza para poder componer: tienen que ser el mismo
   espacio. Así el alumno no puede resolverlo mirando solo tamaños.

   La segunda fase es tipo test, como se decidió: los cuatro
   candidatos tienen el MISMO tamaño (son perturbaciones del producto
   correcto), así que tampoco se puede descartar por forma — hay que
   hacer la cuenta.

   Si ninguna composición está definida, la segunda fase no aparece.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #9.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randNonZero(min, max) { var v; do { v = randInt(min, max); } while (v === 0); return v; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* Dimensiones chicas a propósito: el producto se muestra como cuatro
     opciones y con 4x4 no entra en un celular. R3 y P2 comparten
     dimensión pero son espacios distintos. */
  var SPACES = {
    R2: { dim: 2, label: '\\mathbb{R}^2' },
    R3: { dim: 3, label: '\\mathbb{R}^3' },
    P2: { dim: 3, label: 'P_2(\\mathbb{R})' }
  };
  var SPACE_KEYS = ['R2', 'R3', 'P2'];

  function matriz(rows, cols, lo, hi) {
    var M = [];
    for (var i = 0; i < rows; i++) {
      var row = [];
      for (var j = 0; j < cols; j++) row.push(randInt(lo, hi));
      M.push(row);
    }
    return M;
  }
  function producto(A, B) {
    var out = [];
    for (var i = 0; i < A.length; i++) {
      var row = [];
      for (var j = 0; j < B[0].length; j++) {
        var s = 0;
        for (var k = 0; k < B.length; k++) s += A[i][k] * B[k][j];
        row.push(s);
      }
      out.push(row);
    }
    return out;
  }
  function iguales(A, B) { return JSON.stringify(A) === JSON.stringify(B); }
  function maxAbs(M) { return Math.max.apply(null, M.map(function (r) { return Math.max.apply(null, r.map(Math.abs)); })); }

  /* ---------- generador ---------- */
  var CASOS = ['solo-ST', 'solo-TS', 'ambas', 'ninguna'];

  /* ---------- modo «bases distintas en el medio» ----------
     Es el Ejemplo #2 de 3.6, el que precede al QR: los espacios
     coinciden pero las bases del espacio intermedio no, así que
     antes de multiplicar hay que meter un cambio de base:

       M_{E₁E₃}(S∘T) = M_{B₂E₃}(S) · P_{B₁→B₂} · M_{E₁B₁}(T)

     El espacio intermedio es siempre R² y las bases tienen
     determinante ±1, para que P_{B₁→B₂} = (B₂ en columnas)⁻¹·(B₁ en
     columnas) salga entera y la cuenta sea de 2×2. Una de las dos
     bases puede ser la canónica E₂ (entonces P es directamente B₁ en
     columnas o la inversa de B₂ en columnas, como en 3.4.1).

     Entre los distractores va SIEMPRE el producto directo M(S)·M(T)
     sin cambio de base, que es justo el error que el libro advierte,
     y el producto con la P al revés (P_{B₂→B₁}). */
  var UNIMOD = (function () {
    var out = [];
    for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++)
      for (var c = -2; c <= 2; c++) for (var d = -2; d <= 2; d++) {
        var det = a * d - b * c;
        if (det !== 1 && det !== -1) continue;
        if (a === 1 && b === 0 && c === 0 && d === 1) continue;   // la canónica va aparte
        // nada de columnas con un solo número no nulo en las dos: que sea una base "de verdad"
        if ((b === 0 && c === 0)) continue;
        out.push([[a, b], [c, d]]);
      }
    return out;
  })();
  var I2 = [[1, 0], [0, 1]];
  function inversa2(M) {
    // det = ±1, así que la inversa es entera
    var det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    return [[M[1][1] * det, -M[0][1] * det], [-M[1][0] * det, M[0][0] * det]];
  }

  function generateBases(caso) {
    // F actúa primero y llega a R²; G parte de R² y actúa después.
    var otros = ['R3', 'P2', 'R2'];
    var A, C, intentos = 0, res = null;
    do {
      intentos++;
      A = randChoice(otros); C = randChoice(otros);
      if (A === C) continue;          // si no, la otra composición también existiría
      var tipo = randChoice(['dos', 'dos', 'fE', 'gE']);
      var Bf = tipo === 'fE' ? I2 : randChoice(UNIMOD);
      var Bg = tipo === 'gE' ? I2 : randChoice(UNIMOD);
      if (iguales(Bf, Bg)) continue;
      var P = producto(inversa2(Bg), Bf);        // P_{Bf→Bg}
      var Pinv = producto(inversa2(Bf), Bg);     // P_{Bg→Bf}, el sentido equivocado
      var MF = matriz(2, SPACES[A].dim, -3, 3);
      var MG = matriz(SPACES[C].dim, 2, -3, 3);
      var bien = producto(producto(MG, P), MF);
      var directo = producto(MG, MF);
      var alReves = producto(producto(MG, Pinv), MF);
      if (maxAbs(bien) === 0 || maxAbs(bien) > 30 || maxAbs(directo) > 30 || maxAbs(alReves) > 30) continue;
      if (maxAbs(P) > 4) continue;
      if (iguales(bien, directo) || iguales(bien, alReves) || iguales(directo, alReves)) continue;
      res = { A: A, C: C, Bf: Bf, Bg: Bg, tipo: tipo, P: P, MF: MF, MG: MG, bien: bien, directo: directo, alReves: alReves };
    } while (!res && intentos < 500);

    // nombres de las bases del espacio intermedio
    var nF = res.tipo === 'fE' ? 'E_2' : (res.tipo === 'gE' ? 'B' : 'B_1');
    var nG = res.tipo === 'gE' ? 'E_2' : (res.tipo === 'fE' ? 'B' : 'B_2');

    var cur;
    if (caso === 'solo-ST') {
      // T: A → R², S: R² → C
      cur = { V: res.A, W: 'R2', Wp: 'R2', Z: res.C, MT: res.MF, MS: res.MG, cual: 'ST',
              baseT: ['E_1', nF], baseS: [nG, 'E_3'] };
    } else {
      // S: A → R², T: R² → C
      cur = { V: 'R2', W: res.C, Wp: res.A, Z: 'R2', MT: res.MG, MS: res.MF, cual: 'TS',
              baseS: ['E_1', nF], baseT: [nG, 'E_3'] };
    }
    cur.caso = caso;
    cur.modo = 'bases';
    cur.defST = cur.Wp === cur.W;
    cur.defTS = cur.Z === cur.V;
    cur.respuestaFase1 = cur.defST && cur.defTS ? 'ambas' : cur.defST ? 'ST' : cur.defTS ? 'TS' : 'ninguna';
    cur.prod = res.bien;
    cur.P = res.P; cur.nF = nF; cur.nG = nG;
    cur.basesR2 = [];
    if (res.tipo !== 'fE') cur.basesR2.push({ nombre: nF, M: res.Bf });
    if (res.tipo !== 'gE') cur.basesR2.push({ nombre: nG, M: res.Bg });
    cur.opciones = armarOpciones(res.bien, [res.directo, res.alReves]);
    return cur;
  }

  function generate() {
    var caso = randChoice(CASOS);
    if ((caso === 'solo-ST' || caso === 'solo-TS') && Math.random() < 0.6) return generateBases(caso);
    var V, W, Wp, Z, intentos = 0;

    do {
      intentos++;
      V = randChoice(SPACE_KEYS);
      W = randChoice(SPACE_KEYS);
      Wp = randChoice(SPACE_KEYS);
      Z = randChoice(SPACE_KEYS);

      if (caso === 'solo-ST')      { Wp = W;  if (Z === V) continue; }
      else if (caso === 'solo-TS') { Z = V;   if (Wp === W) continue; }
      else if (caso === 'ambas')   { Wp = W;  Z = V; }
      else                         { if (Wp === W || Z === V) continue; }
      break;
    } while (intentos < 200);

    var defST = (Wp === W);
    var defTS = (Z === V);

    // M(T): dim W x dim V   ·   M(S): dim Z x dim Wp
    var MT, MS, prod = null, cual = null, intentos2 = 0;
    do {
      intentos2++;
      MT = matriz(SPACES[W].dim, SPACES[V].dim, -3, 3);
      MS = matriz(SPACES[Z].dim, SPACES[Wp].dim, -3, 3);
      if (defST) { cual = 'ST'; prod = producto(MS, MT); }
      else if (defTS) { cual = 'TS'; prod = producto(MT, MS); }
      else { cual = null; prod = null; break; }
      // que no quede todo en cero, y que los números no se vayan
      if (maxAbs(prod) === 0 || maxAbs(prod) > 40) { prod = null; continue; }
      break;
    } while (intentos2 < 120);

    var opciones = null;
    if (prod) opciones = armarOpciones(prod);

    return {
      caso: caso, V: V, W: W, Wp: Wp, Z: Z,
      MT: MT, MS: MS,
      defST: defST, defTS: defTS,
      respuestaFase1: defST && defTS ? 'ambas' : defST ? 'ST' : defTS ? 'TS' : 'ninguna',
      cual: cual, prod: prod, opciones: opciones,
      modo: 'canonicas'
    };
  }

  /* Cuatro candidatos del MISMO tamaño: el correcto y tres errores
     típicos de cálculo. Mismo tamaño = no se puede descartar por forma.
     `fijos` (opcional): distractores que van sí o sí antes que los de
     cálculo (en el modo de bases, el producto sin cambio de base y el
     producto con la P al revés). */
  function armarOpciones(P, fijos) {
    var filas = P.length, cols = P[0].length;
    function perturbar(fn) {
      var cand, intentos = 0;
      do { cand = fn(); intentos++; } while (iguales(cand, P) && intentos < 30);
      return cand;
    }
    var d1 = perturbar(function () {
      var c = P.map(function (r) { return r.slice(); });
      c[randInt(0, filas - 1)][randInt(0, cols - 1)] += randNonZero(-3, 3);
      return c;
    });
    var d2 = perturbar(function () {
      var c = P.map(function (r) { return r.slice(); });
      var i = randInt(0, filas - 1), j = randInt(0, cols - 1);
      c[i][j] = -c[i][j];
      if (c[i][j] === 0) c[i][j] = randNonZero(-3, 3);
      return c;
    });
    var d3 = perturbar(function () {
      var c = P.map(function (r) { return r.slice(); });
      // dos entradas de una misma fila intercambiadas
      if (cols >= 2) {
        var i = randInt(0, filas - 1);
        var a = randInt(0, cols - 1), b = randInt(0, cols - 1);
        while (b === a) b = randInt(0, cols - 1);
        var t = c[i][a]; c[i][a] = c[i][b]; c[i][b] = t;
      } else {
        c[randInt(0, filas - 1)][0] += randNonZero(-3, 3);
      }
      return c;
    });

    var todas = [{ M: P, correcta: true }]
      .concat((fijos || []).map(function (F) { return { M: F }; }))
      .concat([{ M: d1 }, { M: d2 }, { M: d3 }])
      .slice(0, 4);
    // que las cuatro sean distintas entre sí
    for (var i = 1; i < todas.length; i++) {
      var choque = 0;
      while (todas.slice(0, i).some(function (o) { return iguales(o.M, todas[i].M); }) && choque < 30) {
        var c = todas[i].M.map(function (r) { return r.slice(); });
        c[randInt(0, filas - 1)][randInt(0, cols - 1)] += randNonZero(-3, 3);
        todas[i].M = c;
        choque++;
      }
    }
    var idx = 0;
    return shuffle(todas.map(function (o) {
      return { value: o.correcta ? 'ok' : ('w' + (idx++)), M: o.M, correcta: !!o.correcta };
    }));
  }

  /* ---------- render ---------- */
  function matrixLatex(M) {
    return '\\begin{pmatrix} ' + M.map(function (r) { return r.join(' & '); }).join(' \\\\ ') + ' \\end{pmatrix}';
  }
  var PISO = 0.68;
  function ajustarAncho(rowEl) {
    var k = rowEl.querySelector('.katex');
    if (!k) return;
    rowEl.style.fontSize = '';
    var disp = rowEl.clientWidth;
    if (!disp) return;
    var meta = disp - 2;
    var ancho = k.getBoundingClientRect().width;
    if (!ancho || ancho <= meta) return;
    var escala = Math.max(PISO, meta / ancho);
    rowEl.style.fontSize = (escala * 100).toFixed(1) + '%';
    var ancho2 = k.getBoundingClientRect().width;
    if (ancho2 > meta && escala > PISO) {
      rowEl.style.fontSize = (Math.max(PISO, escala * (meta / ancho2)) * 100).toFixed(1) + '%';
    }
  }

  /* Nombre de la matriz asociada como en el libro: M(T) en canónicas
     (Ejemplo #1 de 3.6) y M_{XY}(T), con el subíndice en la M, cuando
     hay bases (Ejemplo #2). */
  function nombreM(cur, quien) {
    var b = quien === 'T' ? cur.baseT : cur.baseS;
    return cur.modo === 'bases' ? 'M_{' + b[0] + b[1] + '}(' + quien + ')' : 'M(' + quien + ')';
  }
  function nombreComp(cur) {
    var c = cur.cual === 'ST' ? 'S \\circ T' : 'T \\circ S';
    return cur.modo === 'bases' ? 'M_{E_1E_3}(' + c + ')' : 'M(' + c + ')';
  }
  function vecLatex(M, j) { return '(' + M[0][j] + ',\\ ' + M[1][j] + ')'; }

  function renderContent(container, cur) {
    var filas = [
      'T: ' + SPACES[cur.V].label + ' \\to ' + SPACES[cur.W].label,
      nombreM(cur, 'T') + ' = ' + matrixLatex(cur.MT),
      'S: ' + SPACES[cur.Wp].label + ' \\to ' + SPACES[cur.Z].label,
      nombreM(cur, 'S') + ' = ' + matrixLatex(cur.MS)
    ];
    if (cur.modo === 'bases') {
      cur.basesR2.forEach(function (b) {
        filas.push(b.nombre + ' = \\{' + vecLatex(b.M, 0) + ',\\ ' + vecLatex(b.M, 1) + '\\}');
      });
    }
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:9px;width:100%;">' +
        filas.map(function () { return '<div class="apt-rf" style="width:100%;text-align:center;"></div>'; }).join('') +
      '</div>';
    var r = container.querySelectorAll('.apt-rf');
    filas.forEach(function (tex, i) { window.katex.render(tex, r[i], { throwOnError: false }); ajustarAncho(r[i]); });
  }

  /* ---------- feedback en texto plano ---------- */
  function nombreEsp(k) { return { R2: 'R²', R3: 'R³', P2: 'P₂(R)' }[k]; }
  function plano(n) {
    // E_1 → E₁, B_2 → B₂ (los nombres de base, para el texto plano)
    return n.replace('_1', '₁').replace('_2', '₂').replace('_3', '₃');
  }

  function porQueFase1(cur) {
    var partes = [];
    partes.push(cur.defST
      ? 'S∘T sí está definida: T llega a ' + nombreEsp(cur.W) + ' y S parte de ' + nombreEsp(cur.Wp) + ', que es el mismo espacio.'
      : 'S∘T no está definida: T llega a ' + nombreEsp(cur.W) + ' pero S parte de ' + nombreEsp(cur.Wp) + '.' +
        (SPACES[cur.W].dim === SPACES[cur.Wp].dim ? ' Tienen la misma dimensión, pero no son el mismo espacio.' : ''));
    partes.push(cur.defTS
      ? 'T∘S sí está definida: S llega a ' + nombreEsp(cur.Z) + ' y T parte de ' + nombreEsp(cur.V) + '.'
      : 'T∘S no está definida: S llega a ' + nombreEsp(cur.Z) + ' pero T parte de ' + nombreEsp(cur.V) + '.' +
        (SPACES[cur.Z].dim === SPACES[cur.V].dim ? ' Tienen la misma dimensión, pero no son el mismo espacio.' : ''));
    if (cur.modo === 'bases') {
      partes.push('Ojo: en R² los espacios coinciden, pero las bases no (' + plano(cur.nF) + ' y ' + plano(cur.nG) +
        '). La composición existe igual; lo que cambia es que, antes de multiplicar las matrices, hay que hacer un cambio de base.');
    }
    return partes.join(' ');
  }
  function porQueFase2(cur) {
    var primera = cur.cual === 'ST' ? 'T' : 'S', segunda = cur.cual === 'ST' ? 'S' : 'T';
    var comp = segunda + '∘' + primera;
    if (cur.modo === 'bases') {
      // La matemática va renderizada con KaTeX (el feedback es HTML),
      // con la notación del libro: M_{B₂E₃}(S), P_{B₁→B₂}.
      var k = function (tex) { return window.katex.renderToString(tex, { throwOnError: false }); };
      var P = 'P_{' + cur.nF + ' \\to ' + cur.nG + '}';
      var comoP = cur.nF === 'E_2'
        ? 'la inversa de la matriz con los vectores de ' + plano(cur.nG) + ' en columna'
        : cur.nG === 'E_2'
          ? 'la matriz con los vectores de ' + plano(cur.nF) + ' en columna'
          : 'la inversa de la matriz de ' + plano(cur.nG) + ' en columnas por la de ' + plano(cur.nF) + ' en columnas';
      return 'Primero actúa ' + primera + ', que deja el resultado en coordenadas de ' + plano(cur.nF) + ', pero ' + segunda +
        ' lo toma en ' + plano(cur.nG) + '. Por eso en el medio va un cambio de base: ' +
        k(nombreComp(cur) + ' = ' + nombreM(cur, segunda) + ' \\cdot ' + P + ' \\cdot ' + nombreM(cur, primera)) + ', donde ' +
        k(P) + ' es ' + comoP + ': ' + k(P + ' = ' + matrixLatex(cur.P)) + '. ' +
        'Si multiplicás ' + k(nombreM(cur, segunda) + ' \\cdot ' + nombreM(cur, primera)) + ' directo, sin el cambio de base, sale otra matriz.';
    }
    return cur.cual === 'ST'
      ? 'Las dos están en bases canónicas, así que se multiplica directo, en el mismo orden en que se escribe: M(S∘T) = M(S)·M(T). ' +
        'Primero actúa T y después S, y eso corresponde a multiplicar M(S) por la izquierda.'
      : 'Las dos están en bases canónicas, así que se multiplica directo, en el mismo orden en que se escribe: M(T∘S) = M(T)·M(S). ' +
        'Primero actúa S y después T, y eso corresponde a multiplicar M(T) por la izquierda.';
  }

  function boot() {
    window.AptActivity.init({
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Composición de TL',
      subtitle: 'Fijate en los espacios de partida y llegada de cada una para decidir qué composiciones existen.',
      nextLabel: 'Probar con otro caso →',
      generate: generate,
      renderContent: renderContent,
      // Si no hay ninguna composición definida, no hay matriz que pedir.
      activePhaseCount: function (cur) { return cur.prod ? 2 : 1; },
      phases: [
        {
          mode: 'choices',
          question: '¿Qué composiciones están definidas?',
          choicesStacked: true,
          choices: [
            { value: 'ST',      label: 'Solo S∘T' },
            { value: 'TS',      label: 'Solo T∘S' },
            { value: 'ambas',   label: 'Las dos' },
            { value: 'ninguna', label: 'Ninguna' }
          ],
          check: function (cur, value) { return value === cur.respuestaFase1; },
          explain: function (cur, correct) {
            return correct ? porQueFase1(cur) : 'No es correcto. ' + porQueFase1(cur);
          }
        },
        {
          mode: 'choices',
          question: '¿Cuál es la matriz asociada de esa composición?',
          choicesGrid: true,
          choicesGridSingleColumn: true,
          choices: function (cur) {
            return (cur.opciones || []).map(function (o) {
              return { value: o.value, label: window.katex.renderToString(nombreComp(cur) + ' = ' + matrixLatex(o.M), { throwOnError: false }) };
            });
          },
          check: function (cur, value) { return value === 'ok'; },
          explain: function (cur, correct) {
            return correct ? porQueFase2(cur) : 'No es correcto. ' + porQueFase2(cur);
          }
        }
      ]
    });
  }

  if (window.AptActivity && typeof window.AptActivity.init === 'function') { boot(); }
  else {
    var intentos = 0;
    var esperar = setInterval(function () {
      intentos++;
      if (window.AptActivity && typeof window.AptActivity.init === 'function') { clearInterval(esperar); boot(); }
      else if (intentos > 200) { clearInterval(esperar); }
    }, 25);
  }
})();
