/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 7
   "Armá la base natural"
   ------------------------------------------------------------
   Sección 4.8.1. Dada una recta r por el origen y una TL geométrica
   (reflexión respecto de r, o proyección ortogonal sobre r), armar
   la base natural y escribir M(T) en esa base.

   Es el corazón del método que declarás al abrir 4.8: elegir la base
   donde la transformación se lee "a ojo", en vez de memorizar una
   fórmula. En esa base:

     reflexión:  T(v₁) = v₁,  T(v₂) = -v₂   →  M(T) = (1  0 ; 0 -1)
     proyección: T(v₁) = v₁,  T(v₂) = 0     →  M(T) = (1  0 ; 0  0)

   La base natural NO se exige unitaria (decisión explícita): para
   reflexión y proyección cualquier múltiplo no nulo sirve y la
   matriz en base B es la misma. Por eso la fase 1 acepta cualquier
   vector paralelo y cualquier perpendicular, incluido el de signo
   opuesto — y la validación lo verifica de verdad, no compara
   contra una respuesta fija.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #7.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function generate() {
    var m = randChoice([-3, -2, -1, 0, 1, 2, 3]);
    var tipo = randChoice(['reflexion', 'proyeccion']);
    return {
      m: m,
      tipo: tipo,
      // M(T) en la base natural: la primera columna es T(v₁), la segunda T(v₂)
      matrizB: tipo === 'reflexion' ? [[1, 0], [0, -1]] : [[1, 0], [0, 0]]
    };
  }

  /* ---------- render ---------- */
  function rectaLatex(m) {
    if (m === 0) return 'y = 0';
    if (m === 1) return 'y = x';
    if (m === -1) return 'y = -x';
    return 'y = ' + m + 'x';
  }
  function rectaTexto(m) {
    if (m === 0) return 'y = 0';
    if (m === 1) return 'y = x';
    if (m === -1) return 'y = -x';
    return 'y = ' + m + 'x';
  }
  function nombreTL(tipo) {
    return tipo === 'reflexion' ? 'la reflexión respecto de r' : 'la proyección ortogonal sobre r';
  }

  function ajustarAncho(rowEl) {
    var k = rowEl.querySelector('.katex');
    if (!k) return;
    rowEl.style.fontSize = '';
    var disp = rowEl.clientWidth, ancho = k.getBoundingClientRect().width;
    if (!disp || !ancho || ancho <= disp) return;
    rowEl.style.fontSize = (Math.max(0.68, disp / ancho) * 100).toFixed(1) + '%';
  }

  function renderContent(container, cur) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">' +
        '<div class="apt-row-r" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-row-t" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r = container.querySelector('.apt-row-r');
    var t = container.querySelector('.apt-row-t');
    window.katex.render('r: \\ ' + rectaLatex(cur.m), r, { throwOnError: false });
    window.katex.render(
      cur.tipo === 'reflexion'
        ? 'T: \\text{reflexión respecto de } r'
        : 'T: \\text{proyección ortogonal sobre } r',
      t, { throwOnError: false });
    ajustarAncho(r);
    ajustarAncho(t);
  }

  /* ---------- fase 1: la base natural ----------
     Se valida la PROPIEDAD, no una respuesta concreta:
       v₁ paralelo a r        ⟺  v₁ = t·(1, m),  t ≠ 0   ⟺  y = m·x
       v₂ perpendicular a r   ⟺  v₂ = s·(-m, 1), s ≠ 0 */
  function esParalelo(v, m) { return !(v[0] === 0 && v[1] === 0) && v[1] === m * v[0]; }
  function esPerpendicular(v, m) { return !(v[0] === 0 && v[1] === 0) && v[0] === -m * v[1]; }

  function vecTexto(v) { return '(' + v[0] + ', ' + v[1] + ')'; }

  function checkBase(cur, M, hasEmpty) {
    if (hasEmpty) {
      return { correct: false, feedbackText: 'Dejaste alguna celda vacía. Si una coordenada es 0, hay que escribirla.' };
    }
    var v1 = M[0], v2 = M[1];
    var ok1 = esParalelo(v1, cur.m);
    var ok2 = esPerpendicular(v2, cur.m);
    var status = [
      [ok1 ? 'correct' : 'wrong', ok1 ? 'correct' : 'wrong'],
      [ok2 ? 'correct' : 'wrong', ok2 ? 'correct' : 'wrong']
    ];
    if (ok1 && ok2) {
      return {
        correct: true, cellStatus: status,
        feedbackText: 'Cualquier múltiplo no nulo sirve: lo único que importa es que el primero esté sobre r y el segundo sea perpendicular.'
      };
    }
    var partes = [];
    if (!ok1) {
      if (v1[0] === 0 && v1[1] === 0) partes.push('el primer vector no puede ser el nulo');
      else partes.push('el primer vector tiene que estar sobre r, o sea cumplir ' + rectaTexto(cur.m) +
        ': ' + vecTexto(v1) + ' no lo cumple');
    }
    if (!ok2) {
      if (v2[0] === 0 && v2[1] === 0) partes.push('el segundo vector no puede ser el nulo');
      else partes.push('el segundo tiene que ser perpendicular a r, o sea que su producto escalar con ' +
        vecTexto([1, cur.m]) + ' dé 0: con ' + vecTexto(v2) + ' da ' + (v2[0] + cur.m * v2[1]));
    }
    return { correct: false, cellStatus: status, feedbackText: 'No es correcto: ' + partes.join('; ') + '.' };
  }

  /* ---------- fase 2: la matriz en esa base ---------- */
  function checkMatriz(cur, M, hasEmpty) {
    if (hasEmpty) return { correct: false, feedbackText: 'Dejaste alguna celda vacía.' };
    var status = [], mal = [];
    for (var r = 0; r < 2; r++) {
      status.push([]);
      for (var c = 0; c < 2; c++) {
        var ok = M[r][c] === cur.matrizB[r][c];
        status[r].push(ok ? 'correct' : 'wrong');
        if (!ok) mal.push([r, c]);
      }
    }
    var texto = cur.tipo === 'reflexion'
      ? 'T deja fijo a v₁, que está sobre r, y da vuelta a v₂, que es perpendicular: T(v₁) = v₁ y T(v₂) = -v₂. ' +
        'Las columnas son las coordenadas de esas imágenes en la base B, o sea (1, 0) y (0, -1).'
      : 'T deja fijo a v₁, que está sobre r, y manda a v₂ al vector nulo, porque es perpendicular a r: ' +
        'T(v₁) = v₁ y T(v₂) = 0. Las columnas son (1, 0) y (0, 0).';
    return {
      correct: mal.length === 0,
      cellStatus: status,
      feedbackText: mal.length === 0 ? texto : 'No es correcto. ' + texto
    };
  }

  function boot() {
    window.AptActivity.init({
      mode: 'phases',
      needsKatex: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Armá la base natural',
      subtitle: 'En la base donde la transformación se lee a ojo, la matriz sale sin cuentas. Encontrá esa base.',
      nextLabel: 'Probar con otra recta →',
      generate: generate,
      renderContent: renderContent,
      phases: [
        {
          mode: 'grid',
          question: 'Escribí la base natural: en la primera fila un vector paralelo a r, en la segunda uno perpendicular a r.',
          grid: { rows: 2, cols: 2, noDivider: true, hideBrackets: true },
          checkGrid: checkBase,
          getAnswerGrid: function (cur) { return [[1, cur.m], [-cur.m, 1]]; }
        },
        {
          mode: 'grid',
          question: 'Ahora escribí M(T) en esa base B = {v₁, v₂}.',
          grid: { rows: 2, cols: 2, noDivider: true, label: 'M(T) =' },
          checkGrid: checkMatriz,
          getAnswerGrid: function (cur) { return cur.matrizB; }
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
