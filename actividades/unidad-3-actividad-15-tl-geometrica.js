/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 15
   "Identificá la TL geométrica"
   ------------------------------------------------------------
   Sección 4.8. Dada la matriz en bases canónicas, reconocer de qué
   transformación geométrica se trata. Los criterios son los del
   libro, y todos salen de mirar la matriz:

     proyección     →  det = 0 (colapsa una dimensión)
     reflexión      →  det = -1
     rotación       →  det = 1 y columnas ortonormales
     escalado       →  diagonal con factores positivos
     cizallamiento  →  det = 1, unos en la diagonal, una sola entrada fuera

   CUIDADO CON LA AMBIGÜEDAD, que es el riesgo real de esta actividad:
     · -I es a la vez una rotación de 180° y un escalado por -1
     · I es la identidad, o sea rotación de 0° y escalado por 1
     · diag(1,-1) es una reflexión, pero se podría leer como un
       escalado con un factor negativo
   Para que cada matriz tenga UNA sola respuesta válida:
     · las rotaciones son de 90° o 270°, nunca de 0° ni de 180°
     · los escalados llevan siempre factores positivos y ≥ 2
     · las reflexiones tienen det = -1, así que nunca se solapan con
       un escalado
   La validación comprueba, caso por caso, que la firma de ningún otro
   tipo coincida con la matriz generada.

   Incluye casos de R² y de R³, con las familias limpias del libro.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #15.
   ============================================================ */
(function () {
  'use strict';

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- familias, todas sin ambigüedad ---------- */
  function familias() {
    var f = [];

    // ---- R² ----
    // rotación de 90° y 270° (nunca 0° ni 180°, que se confunden con escalados)
    f.push({ tipo: 'rotacion', dim: 2, M: [[0, -1], [1, 0]], detalle: 'una rotación de 90° en sentido antihorario' });
    f.push({ tipo: 'rotacion', dim: 2, M: [[0, 1], [-1, 0]], detalle: 'una rotación de 90° en sentido horario' });

    // reflexiones respecto de los ejes y de las rectas y = ±x
    f.push({ tipo: 'reflexion', dim: 2, M: [[1, 0], [0, -1]], detalle: 'una reflexión respecto del eje x' });
    f.push({ tipo: 'reflexion', dim: 2, M: [[-1, 0], [0, 1]], detalle: 'una reflexión respecto del eje y' });
    f.push({ tipo: 'reflexion', dim: 2, M: [[0, 1], [1, 0]], detalle: 'una reflexión respecto de la recta y = x' });
    f.push({ tipo: 'reflexion', dim: 2, M: [[0, -1], [-1, 0]], detalle: 'una reflexión respecto de la recta y = -x' });

    // proyecciones ortogonales
    f.push({ tipo: 'proyeccion', dim: 2, M: [[1, 0], [0, 0]], detalle: 'una proyección ortogonal sobre el eje x' });
    f.push({ tipo: 'proyeccion', dim: 2, M: [[0, 0], [0, 1]], detalle: 'una proyección ortogonal sobre el eje y' });
    f.push({ tipo: 'proyeccion', dim: 2, M: [[1, 1], [1, 1]], den: 2, detalle: 'una proyección ortogonal sobre la recta y = x' });

    // escalados: factores positivos y >= 2, para no confundirlos con nada
    var k = randInt(2, 4);
    f.push({ tipo: 'escalado', dim: 2, M: [[k, 0], [0, k]], detalle: 'un escalado uniforme de factor ' + k });
    var a = randInt(2, 4), b = randInt(2, 5);
    if (b === a) b = a + 1;
    f.push({ tipo: 'escalado', dim: 2, M: [[a, 0], [0, b]], detalle: 'un escalado de factor ' + a + ' en x y ' + b + ' en y' });

    // cizallamientos
    var c1 = randInt(1, 3) * randChoice([1, -1]);
    f.push({ tipo: 'cizallamiento', dim: 2, M: [[1, c1], [0, 1]], detalle: 'un cizallamiento horizontal de factor ' + c1 });
    var c2 = randInt(1, 3) * randChoice([1, -1]);
    f.push({ tipo: 'cizallamiento', dim: 2, M: [[1, 0], [c2, 1]], detalle: 'un cizallamiento vertical de factor ' + c2 });

    // ---- R³ ----
    f.push({ tipo: 'rotacion', dim: 3, M: [[0, -1, 0], [1, 0, 0], [0, 0, 1]], detalle: 'una rotación de 90° alrededor del eje z' });
    f.push({ tipo: 'rotacion', dim: 3, M: [[1, 0, 0], [0, 0, -1], [0, 1, 0]], detalle: 'una rotación de 90° alrededor del eje x' });
    f.push({ tipo: 'reflexion', dim: 3, M: [[1, 0, 0], [0, 1, 0], [0, 0, -1]], detalle: 'una reflexión respecto del plano z = 0' });
    f.push({ tipo: 'reflexion', dim: 3, M: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], detalle: 'una reflexión respecto del plano y = 0' });
    f.push({ tipo: 'proyeccion', dim: 3, M: [[1, 0, 0], [0, 1, 0], [0, 0, 0]], detalle: 'una proyección ortogonal sobre el plano z = 0' });
    f.push({ tipo: 'proyeccion', dim: 3, M: [[1, 0, 0], [0, 0, 0], [0, 0, 0]], detalle: 'una proyección ortogonal sobre el eje x' });
    var k3 = randInt(2, 3);
    f.push({ tipo: 'escalado', dim: 3, M: [[k3, 0, 0], [0, k3, 0], [0, 0, k3]], detalle: 'un escalado uniforme de factor ' + k3 });
    var c3 = randInt(1, 3) * randChoice([1, -1]);
    f.push({ tipo: 'cizallamiento', dim: 3, M: [[1, 0, c3], [0, 1, 0], [0, 0, 1]], detalle: 'un cizallamiento de factor ' + c3 });

    return f;
  }

  /* Densidad pareja entre TIPOS, no entre casos: si se sorteara al azar
     entre los casos, las reflexiones y proyecciones saldrían más seguido
     solo porque hay más variantes de esas. */
  var TIPOS = ['rotacion', 'reflexion', 'proyeccion', 'escalado', 'cizallamiento'];
  var vistas = {}; TIPOS.forEach(function (t) { vistas[t] = 0; });

  function generate() {
    var banco = familias();
    var minimo = Math.min.apply(null, TIPOS.map(function (t) { return vistas[t]; }));
    var candidatos = TIPOS.filter(function (t) { return vistas[t] === minimo; });
    var tipo = randChoice(candidatos);
    vistas[tipo]++;
    var caso = randChoice(banco.filter(function (f) { return f.tipo === tipo; }));
    return {
      tipo: caso.tipo, dim: caso.dim, M: caso.M, den: caso.den || 1,
      detalle: caso.detalle
    };
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
  function renderContent(container, cur) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;">' +
        '<div class="apt-r1" style="width:100%;text-align:center;"></div>' +
        '<div class="apt-r2" style="width:100%;text-align:center;"></div>' +
      '</div>';
    var r1 = container.querySelector('.apt-r1');
    var r2 = container.querySelector('.apt-r2');
    var esp = cur.dim === 2 ? '\\mathbb{R}^2' : '\\mathbb{R}^3';
    window.katex.render('T: ' + esp + ' \\to ' + esp, r1, { throwOnError: false });
    var factor = cur.den === 1 ? '' : '\\dfrac{1}{' + cur.den + '}\\,';
    window.katex.render('M(T) = ' + factor + matrixLatex(cur.M), r2, { throwOnError: false });
    [r1, r2].forEach(ajustarAncho);
  }

  /* ---------- feedback: el criterio, no solo el nombre ---------- */
  function det(M) {
    var n = M.length;
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    var s = 0;
    for (var c = 0; c < n; c++) {
      var menor = M.slice(1).map(function (row) { return row.filter(function (_, j) { return j !== c; }); });
      s += (c % 2 ? -1 : 1) * M[0][c] * det(menor);
    }
    return s;
  }
  function detTexto(cur) {
    var d = det(cur.M);
    if (cur.den === 1) return String(d);
    var p = Math.pow(cur.den, cur.M.length);
    return d === 0 ? '0' : (d + '/' + p);
  }

  function porQue(cur) {
    var d = 'El determinante vale ' + detTexto(cur) + '. ';
    if (cur.tipo === 'proyeccion') {
      return d + 'Un determinante nulo significa que la transformación colapsa una dimensión, y eso solo lo hace una proyección. ' +
        'Es ' + cur.detalle + '.';
    }
    if (cur.tipo === 'reflexion') {
      return d + 'Vale -1: conserva el tamaño pero invierte la orientación, que es exactamente lo que hace una reflexión. ' +
        'Es ' + cur.detalle + '.';
    }
    if (cur.tipo === 'rotacion') {
      return d + 'Vale 1 y las columnas son perpendiculares entre sí y de norma 1, así que conserva distancias y orientación: es una rotación. ' +
        'En concreto, ' + cur.detalle + '.';
    }
    if (cur.tipo === 'escalado') {
      return 'La matriz es diagonal con factores positivos: cada eje se estira por su propio factor, sin mezclarse con los otros. ' +
        'Es ' + cur.detalle + '.';
    }
    return d + 'Vale 1, pero las columnas no son perpendiculares, así que no es una rotación. Tiene unos en la diagonal y ' +
      'una sola entrada fuera de ella: eso desplaza los puntos de forma proporcional a su distancia al eje. Es ' + cur.detalle + '.';
  }

  function boot() {
    window.AptActivity.init({
      mode: 'choices',
      needsKatex: true,
      choicesStacked: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Identificá la TL geométrica',
      subtitle: 'Mirá la matriz y reconocé qué transformación geométrica es. El determinante te da la primera pista.',
      nextLabel: 'Probar con otra matriz →',
      generate: generate,
      renderContent: renderContent,
      choices: [
        { value: 'rotacion',      label: 'Rotación' },
        { value: 'reflexion',     label: 'Reflexión' },
        { value: 'proyeccion',    label: 'Proyección ortogonal' },
        { value: 'escalado',      label: 'Escalado' },
        { value: 'cizallamiento', label: 'Cizallamiento' }
      ],
      check: function (cur, value) { return value === cur.tipo; },
      explain: function (cur, correct) {
        return correct ? porQue(cur) : 'No es correcto. ' + porQue(cur);
      }
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
