/* ============================================================
   ÁLGEBRA PARA TODOS · Unidad 3 · Actividad 16
   "Componé geométricas"
   ------------------------------------------------------------
   Sección 4.8.4. Se dan dos transformaciones geométricas POR SU
   NOMBRE y hay que decir qué resulta de componerlas. A propósito no
   se muestran las matrices: si se mostraran, el ejercicio sería
   multiplicar y clasificar (que ya son las actividades 12 y 15).
   Acá el objetivo es razonar geométricamente, que es de lo que habla
   tu lista de cierre de la unidad:

     rotación ∘ rotación                     →  rotación de la suma de ángulos
     reflexión ∘ reflexión (misma recta)     →  la identidad
     reflexión ∘ reflexión (rectas distintas)→  rotación del doble del ángulo
     reflexión ∘ rotación                    →  una reflexión
     proyección ∘ cualquiera                 →  colapsa (determinante 0)

   AMBIGÜEDAD RESUELTA: la identidad es también una rotación de 0°, así
   que "la identidad" y "una rotación" se solaparían. Por eso la opción
   dice "una rotación DISTINTA de la identidad". Sin eso, habría casos
   con dos respuestas defendibles.

   La clasificación del resultado no se escribe a mano: se multiplica
   la matriz de las dos y se clasifica por sus invariantes. Así el
   objetivo del ejercicio y la respuesta correcta no pueden discrepar.

   En la landing de Kajabi no va nada: esta actividad se carga desde
   unidad-3.js cuando la URL termina en #16.
   ============================================================ */
(function () {
  'use strict';

  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- las transformaciones base de R², con nombre ---------- */
  var BASE = [
    { id: 'rot90',  nombre: 'una rotación de 90° antihoraria',        M: [[0, -1], [1, 0]],  familia: 'rotacion', angulo: 90 },
    { id: 'rot180', nombre: 'una rotación de 180°',                   M: [[-1, 0], [0, -1]], familia: 'rotacion', angulo: 180 },
    { id: 'rot270', nombre: 'una rotación de 270° antihoraria',       M: [[0, 1], [-1, 0]],  familia: 'rotacion', angulo: 270 },
    { id: 'refX',   nombre: 'la reflexión respecto del eje x',        M: [[1, 0], [0, -1]],  familia: 'reflexion', recta: 'el eje x',        anguloRecta: 0 },
    { id: 'refY',   nombre: 'la reflexión respecto del eje y',        M: [[-1, 0], [0, 1]],  familia: 'reflexion', recta: 'el eje y',        anguloRecta: 90 },
    { id: 'refYX',  nombre: 'la reflexión respecto de la recta y = x',  M: [[0, 1], [1, 0]],   familia: 'reflexion', recta: 'la recta y = x',  anguloRecta: 45 },
    { id: 'refYnX', nombre: 'la reflexión respecto de la recta y = -x', M: [[0, -1], [-1, 0]], familia: 'reflexion', recta: 'la recta y = -x', anguloRecta: 135 },
    { id: 'proyX',  nombre: 'la proyección ortogonal sobre el eje x', M: [[1, 0], [0, 0]],   familia: 'proyeccion' },
    { id: 'proyY',  nombre: 'la proyección ortogonal sobre el eje y', M: [[0, 0], [0, 1]],   familia: 'proyeccion' }
  ];

  /* ---------- álgebra mínima ---------- */
  function mul(A, B) {
    var o = [];
    for (var i = 0; i < A.length; i++) {
      var r = [];
      for (var j = 0; j < B[0].length; j++) {
        var s = 0;
        for (var k = 0; k < B.length; k++) s += A[i][k] * B[k][j];
        r.push(s);
      }
      o.push(r);
    }
    return o;
  }
  function det2(M) { return M[0][0] * M[1][1] - M[0][1] * M[1][0]; }
  function esIdentidad(M) { return M[0][0] === 1 && M[0][1] === 0 && M[1][0] === 0 && M[1][1] === 1; }

  /* El tipo del resultado NO se escribe a mano: se deduce de la matriz
     producto. Así la respuesta correcta siempre coincide con la
     transformación que de verdad quedó. */
  function clasificar(P) {
    var d = det2(P);
    if (d === 0) return 'colapsa';
    if (esIdentidad(P)) return 'identidad';
    return d === 1 ? 'rotacion' : 'reflexion';
  }
  function anguloDeRotacion(P) {
    // P = ((cos, -sen), (sen, cos))
    var g = Math.round(Math.atan2(P[1][0], P[0][0]) * 180 / Math.PI);
    return ((g % 360) + 360) % 360;
  }

  /* ---------- generador con densidad pareja por resultado ---------- */
  var TIPOS = ['identidad', 'rotacion', 'reflexion', 'colapsa'];
  var vistos = {}; TIPOS.forEach(function (t) { vistos[t] = 0; });

  /* Todos los pares posibles, agrupados por el resultado que dan. */
  function pares() {
    var out = {};
    TIPOS.forEach(function (t) { out[t] = []; });
    BASE.forEach(function (S) {
      BASE.forEach(function (T) {
        var P = mul(S.M, T.M);
        out[clasificar(P)].push({ S: S, T: T, P: P });
      });
    });
    return out;
  }
  var PARES = pares();

  function generate() {
    var minimo = Math.min.apply(null, TIPOS.map(function (t) { return vistos[t]; }));
    var candidatos = TIPOS.filter(function (t) { return vistos[t] === minimo && PARES[t].length; });
    var tipo = randChoice(candidatos.length ? candidatos : TIPOS.filter(function (t) { return PARES[t].length; }));
    vistos[tipo]++;
    var caso = randChoice(PARES[tipo]);
    return { S: caso.S, T: caso.T, P: caso.P, tipo: tipo };
  }

  /* ---------- render ---------- */
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
      '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;' +
        'font-family:var(--font-mono);font-size:13.5px;color:var(--ink);line-height:1.5;text-align:center;">' +
        '<div><b>T</b> es ' + cur.T.nombre + '</div>' +
        '<div><b>S</b> es ' + cur.S.nombre + '</div>' +
        '<div class="apt-q" style="width:100%;margin-top:4px;"></div>' +
      '</div>';
    var q = container.querySelector('.apt-q');
    window.katex.render('\\text{¿Qué es } S \\circ T \\text{?}', q, { throwOnError: false });
    ajustarAncho(q);
  }

  /* ---------- feedback: el argumento geométrico del libro ---------- */
  function porQue(cur) {
    var S = cur.S, T = cur.T, tipo = cur.tipo;

    if (tipo === 'colapsa') {
      var cual = S.familia === 'proyeccion' ? 'S' : 'T';
      return 'Una de las dos es una proyección, y una proyección aplasta una dimensión. ' +
        'Eso no se puede recuperar con ninguna otra transformación, así que la composición tiene determinante 0 ' +
        'y colapsa igual. Por eso ' + cual + ' arruina la reversibilidad de todo el conjunto.';
    }

    if (S.familia === 'reflexion' && T.familia === 'reflexion') {
      if (S.id === T.id) {
        return 'Son la misma reflexión dos veces. Espejar y volver a espejar respecto de la misma recta ' +
          'devuelve cada punto a su lugar: el resultado es la identidad.';
      }
      var entre = Math.abs(S.anguloRecta - T.anguloRecta);
      if (entre > 90) entre = 180 - entre;
      return 'Dos reflexiones respecto de rectas distintas dan una rotación, de ángulo el doble del ángulo entre las rectas. ' +
        'Acá las rectas son ' + T.recta + ' y ' + S.recta + ', que forman ' + entre + '°, ' +
        'así que la composición es una rotación de ' + (2 * entre) + '°' +
        (tipo === 'identidad' ? ', que es una vuelta completa: la identidad.' : '.');
    }

    if (S.familia === 'rotacion' && T.familia === 'rotacion') {
      var suma = (S.angulo + T.angulo) % 360;
      return 'Dos rotaciones se suman: ' + T.angulo + '° + ' + S.angulo + '° = ' + (S.angulo + T.angulo) + '°' +
        (suma === 0 ? ', que es una vuelta completa. El resultado es la identidad.'
                    : ', o sea una rotación de ' + suma + '°.');
    }

    // reflexión con rotación, en cualquier orden
    return 'Una reflexión invierte la orientación y una rotación la conserva, así que al componerlas ' +
      'el determinante queda en -1: la orientación se invierte. Y como las dos conservan distancias, ' +
      'el resultado también. Una transformación de R² que conserva distancias e invierte la orientación es una reflexión.';
  }

  function boot() {
    window.AptActivity.init({
      mode: 'choices',
      needsKatex: true,
      choicesStacked: true,
      eyebrow: 'Unidad 3 · Transformaciones lineales',
      title: 'Componé geométricas',
      subtitle: 'Pensalo geométricamente, sin escribir las matrices: ¿qué queda al aplicar primero $T$ y después $S$?',
      nextLabel: 'Probar con otra composición →',
      generate: generate,
      renderContent: renderContent,
      choices: [
        { value: 'identidad', label: 'La identidad',   sub: 'cada punto vuelve a su lugar' },
        // "distinta de la identidad" no es un detalle: la identidad es
        // también una rotación de 0°, y sin esa aclaración habría casos
        // con dos respuestas defendibles.
        { value: 'rotacion',  label: 'Una rotación',   sub: 'distinta de la identidad' },
        { value: 'reflexion', label: 'Una reflexión',  sub: 'invierte la orientación' },
        { value: 'colapsa',   label: 'Algo que colapsa', sub: 'determinante 0' }
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
