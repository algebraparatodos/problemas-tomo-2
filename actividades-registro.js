/* ============================================================
   ÁLGEBRA PARA TODOS · actividades-registro.js (v2.0)
   ------------------------------------------------------------
   Le da al modo examen los ejercicios LEYENDO los archivos de
   actividades/, en vez de tener una segunda copia de su lógica.

   POR QUÉ EXISTE
   Antes el examen usaba exercises.js, que repetía los generadores
   completos de cada actividad. Con 48 actividades eso significaba
   escribir cada una dos veces, y arreglar cada bug dos veces — de
   hecho las correcciones de notación que se hicieron en las landings
   tuvieron que rehacerse aparte en el examen, semanas después.

   CÓMO FUNCIONA
   Cada actividad termina llamando a AptActivity.init(cfg). Acá se
   intercepta esa llamada: se guarda el cfg y NO se construye nada de
   la interfaz de actividad. De ese cfg salen generate, renderContent,
   check, explain — todo lo que el examen necesita.

   Los scripts se cargan dentro de un contenedor oculto. Eso importa:
   cada actividad inserta su propio div de montaje mirando
   document.currentScript, así que el div termina dentro de esa jaula
   y no ensucia la página.

   La carga es SECUENCIAL y no en paralelo, a propósito: si dos
   scripts se ejecutaran intercalados no habría forma de saber a cuál
   actividad corresponde el cfg que acaba de llegar.

   Solo se descargan las actividades de los temas que el alumno elige.
   Las 48 juntas pesan más de medio mega; una sesión típica baja tres
   o cuatro archivos.

   Este archivo se GENERA. No editar la lista a mano: sale del CATALOG
   de engine.js cruzado con los archivos reales de actividades/.
   ============================================================ */
(function (global) {
  'use strict';

  /* Subir esto en CADA cambio, aunque sea chico: menor para ajustes,
     mayor para cambios de fondo. Y mantener sincronizado el numero del
     comentario de arriba. */
  var VERSION = '2.0';

  var BASE = 'https://algebraparatodos.github.io/problemas-tomo-2/actividades/';
  var JAULA_ID = 'apt-registro-jaula';

  /* --- generado: unidad, número, título y archivo de cada actividad --- */
  var MANIFIESTO = [
    { id: 'u1a1', unidad: 1, n: 1 , titulo: 'Clasificá el sistema',                                modo: 'choices',      grupo: 'Clasificación de una SEL', archivo: 'unidad-1-actividad-1-clasifica-el-sistema.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a2', unidad: 1, n: 2 , titulo: 'Matriz ampliada',                                     modo: 'grid',         grupo: 'Eliminación Gaussiana y forma escalonada', archivo: 'unidad-1-actividad-2-matriz-ampliada.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a3', unidad: 1, n: 3 , titulo: '¿Es escalonada?',                                     modo: 'choices',      grupo: 'Eliminación Gaussiana y forma escalonada', archivo: 'unidad-1-actividad-3-escalonada.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a4', unidad: 1, n: 4 , titulo: 'Aplicá el método de eliminación de Gauss',            modo: 'grid',         grupo: 'Eliminación Gaussiana y forma escalonada', archivo: 'unidad-1-actividad-4-metodo-de-gauss.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a5', unidad: 1, n: 5 , titulo: '¿Es escalonada reducida?',                            modo: 'choices',      grupo: 'Eliminación Gaussiana y forma escalonada', archivo: 'unidad-1-actividad-5-escalonada-reducida.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a6', unidad: 1, n: 6 , titulo: 'Encontrá la forma escalonada reducida',               modo: 'grid',         grupo: 'Eliminación Gaussiana y forma escalonada', archivo: 'unidad-1-actividad-6-encontrar-escalonada-reducida.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a7', unidad: 1, n: 7 , titulo: 'Solución paramétrica',                                modo: 'phases',       submodos: ['choices','vectors'], archivo: 'unidad-1-actividad-7-solucion-parametrica.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a8', unidad: 1, n: 8 , titulo: 'Rango por orlado',                                    modo: 'phases',       submodos: ['choices'], archivo: 'unidad-1-actividad-8-rango-orlado.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a9', unidad: 1, n: 9 , titulo: 'Clasificá con Rouché-Frobenius',                      modo: 'phases',       grupo: 'Rouché-Frobenius', submodos: ['choices'], archivo: 'unidad-1-actividad-9-rouche-frobenius.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a10', unidad: 1, n: 10, titulo: 'Rouché-Frobenius con parámetros',                     modo: 'phases',       grupo: 'Rouché-Frobenius', submodos: ['setup','choices'], archivo: 'unidad-1-actividad-10-rouche-frobenius-parametro.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a11', unidad: 1, n: 11, titulo: 'Tipos de matrices',                                   modo: 'multiselect',  archivo: 'unidad-1-actividad-11-tipos-de-matrices.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a12', unidad: 1, n: 12, titulo: 'Suma de matrices',                                    modo: 'choices',      grupo: 'Operaciones con matrices', archivo: 'unidad-1-actividad-12-suma-de-matrices.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a13', unidad: 1, n: 13, titulo: 'Producto de una matriz por un escalar',               modo: 'choices',      grupo: 'Operaciones con matrices', archivo: 'unidad-1-actividad-13-producto-por-escalar.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a14', unidad: 1, n: 14, titulo: 'Trasposición de matrices',                            modo: 'choices',      grupo: 'Operaciones con matrices', archivo: 'unidad-1-actividad-14-trasposicion.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u1a15', unidad: 1, n: 15, titulo: 'Producto de matrices',                                modo: 'choices',      grupo: 'Operaciones con matrices', archivo: 'unidad-1-actividad-15-producto-de-matrices.js',
      unidadTitulo: 'Unidad 1: Matrices y SEL' },
    { id: 'u2a1', unidad: 2, n: 1 , titulo: 'Operaciones con conjuntos',                           modo: 'choices',      grupo: 'Topología', archivo: 'unidad-2-actividad-1-operaciones-con-conjuntos.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a2', unidad: 2, n: 2 , titulo: '¿Es una LCI?',                                        modo: 'choices',      grupo: 'Topología', archivo: 'unidad-2-actividad-2-es-lci.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a3', unidad: 2, n: 3 , titulo: '¿Es una LCE?',                                        modo: 'choices',      grupo: 'Topología', archivo: 'unidad-2-actividad-3-es-lce.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a4', unidad: 2, n: 4 , titulo: 'Neutro y simétrico de una operación "rara"',          modo: 'grid',         grupo: 'Topología', archivo: 'unidad-2-actividad-4-neutro-y-simetrico.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a5', unidad: 2, n: 5 , titulo: '¿Es un subespacio vectorial?',                        modo: 'choices',      archivo: 'unidad-2-actividad-5-es-sev.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a6', unidad: 2, n: 6 , titulo: '¿Es LI o LD?',                                        modo: 'choices',      grupo: 'Independencia lineal', archivo: 'unidad-2-actividad-6-son-li.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a7', unidad: 2, n: 7 , titulo: '¿Genera V? ¿Es base?',                                modo: 'choices',      grupo: 'Independencia lineal', archivo: 'unidad-2-actividad-7-genera-s.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a8', unidad: 2, n: 8 , titulo: 'Coordenadas de un vector en una base',                modo: 'grid',         grupo: 'Cambio de base', archivo: 'unidad-2-actividad-8-coordenadas-base.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a9', unidad: 2, n: 9 , titulo: 'Matriz de cambio de base',                            modo: 'choices',      grupo: 'Cambio de base', archivo: 'unidad-2-actividad-9-matriz-cambio-base.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a10', unidad: 2, n: 10, titulo: 'Base de un SEV',                                      modo: 'phases',       grupo: 'Bases y ecuaciones de un SEV', submodos: ['choices','space-basis'], archivo: 'unidad-2-actividad-10-base-sev.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a11', unidad: 2, n: 11, titulo: 'Ecuaciones implícitas desde un conjunto generador',   modo: 'choices',      grupo: 'Bases y ecuaciones de un SEV', archivo: 'unidad-2-actividad-11-ecuaciones-implicitas.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a12', unidad: 2, n: 12, titulo: 'Cambio de base en un SEV',                            modo: 'choices',      grupo: 'Cambio de base', archivo: 'unidad-2-actividad-12-cambio-base.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a13', unidad: 2, n: 13, titulo: 'Intersección de subespacios',                         modo: 'phases',       grupo: 'Operaciones con SEV', submodos: ['choices','space-basis'], archivo: 'unidad-2-actividad-13-interseccion-sev.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a14', unidad: 2, n: 14, titulo: 'Suma de subespacios / suma directa',                  modo: 'phases',       grupo: 'Operaciones con SEV', submodos: ['choices'], archivo: 'unidad-2-actividad-14-suma-sev.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a15', unidad: 2, n: 15, titulo: 'Complemento ortogonal',                               modo: 'phases',       grupo: 'Operaciones con SEV', submodos: ['choices','space-basis'], archivo: 'unidad-2-actividad-15-complemento-ortogonal.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a16', unidad: 2, n: 16, titulo: 'Proyección ortogonal',                                modo: 'phases',       grupo: 'Operaciones con SEV', submodos: ['space-basis'], archivo: 'unidad-2-actividad-16-proyeccion-ortogonal.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u2a17', unidad: 2, n: 17, titulo: 'Método de Gram-Schmidt',                              modo: 'phases',       submodos: ['space-basis'], archivo: 'unidad-2-actividad-17-metodo-de-gram.js',
      unidadTitulo: 'Unidad 2: Subespacios vectoriales' },
    { id: 'u3a1', unidad: 3, n: 1 , titulo: '¿Es lineal?',                                         modo: 'phases',       grupo: 'Existencia de TL', submodos: ['choices'], archivo: 'unidad-3-actividad-1-es-lineal.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a2', unidad: 3, n: 2 , titulo: '¿Existe? ¿Es única?',                                 modo: 'choices',      grupo: 'Existencia de TL', archivo: 'unidad-3-actividad-2-existe-es-unica.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a3', unidad: 3, n: 3 , titulo: 'Armá la matriz asociada',                             modo: 'grid',         grupo: 'Matriz asociada y cambio de base en una TL', archivo: 'unidad-3-actividad-3-matriz-asociada.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a4', unidad: 3, n: 4 , titulo: 'Núcleo e imagen',                                     modo: 'phases',       grupo: 'Núcleo e imagen de una TL', submodos: ['choices'], archivo: 'unidad-3-actividad-4-dim-nucleo-e-imagen.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a5', unidad: 3, n: 5 , titulo: 'Clasificá la TL',                                     modo: 'choices',      grupo: 'Clasificación de una TL', archivo: 'unidad-3-actividad-5-clasificar-tl.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a6', unidad: 3, n: 6 , titulo: 'Determinante y área',                                 modo: 'phases',       grupo: 'Existencia de TL', submodos: ['choices'], archivo: 'unidad-3-actividad-6-determinante-area.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a7', unidad: 3, n: 7 , titulo: 'Armá la base natural',                                modo: 'phases',       grupo: 'Hallar TL', submodos: ['grid'], archivo: 'unidad-3-actividad-7-base-natural.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a8', unidad: 3, n: 8 , titulo: 'Matriz asociada en otras bases',                      modo: 'grid',         grupo: 'Matriz asociada y cambio de base en una TL', archivo: 'unidad-3-actividad-8-matriz-asociada.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a9', unidad: 3, n: 9 , titulo: 'Cambio de base de M(T)',                              modo: 'choices',      grupo: 'Matriz asociada y cambio de base en una TL', archivo: 'unidad-3-actividad-9-cambio-base-matriz-asociada.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a10', unidad: 3, n: 10, titulo: '¿Pertenece a la imagen o al núcleo?',                 modo: 'choices',      grupo: 'Núcleo e imagen de una TL', archivo: 'unidad-3-actividad-10-pertenece-im-nuc.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a11', unidad: 3, n: 11, titulo: 'Base de la imagen y del núcleo',                      modo: 'phases',       grupo: 'Núcleo e imagen de una TL', submodos: ['choices','space-basis'], archivo: 'unidad-3-actividad-11-base-img-nuc.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a12', unidad: 3, n: 12, titulo: 'Composición de TL',                                   modo: 'phases',       grupo: 'Composición e inversa de TL', submodos: ['choices'], archivo: 'unidad-3-actividad-12-composicion-tl.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a13', unidad: 3, n: 13, titulo: '¿Qué es posible?',                                    modo: 'multiselect',  grupo: 'Clasificación de una TL', archivo: 'unidad-3-actividad-13-es-posible-clasificacion.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a14', unidad: 3, n: 14, titulo: 'Hallá M(T⁻¹)',                                        modo: 'phases',       grupo: 'Composición e inversa de TL', submodos: ['choices'], archivo: 'unidad-3-actividad-14-matriz-inversa-tl.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a15', unidad: 3, n: 15, titulo: 'Identificá la TL geométrica',                         modo: 'choices',      archivo: 'unidad-3-actividad-15-tl-geometrica.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' },
    { id: 'u3a16', unidad: 3, n: 16, titulo: 'Componé geométricas',                                 modo: 'choices',      grupo: 'Composición e inversa de TL', archivo: 'unidad-3-actividad-16-composicion-geometricas.js',
      unidadTitulo: 'Unidad 3: Transformaciones Lineales' }
  ];

  /* Modos que el examen ya sabe presentar. Los de tipo 'phases'
     necesitan preguntas compuestas, que todavía no están. */
  /* Modos que el examen sabe presentar. 'phases' se resuelve partiendo la
     actividad en varias preguntas consecutivas, una por fase. Los
     sub-modos que el examen todavia no sabe pintar quedan fuera. */
  var MODOS_SIMPLES = ['choices', 'grid', 'multiselect'];
  var SUBMODOS_OK = ['choices', 'grid', 'multiselect', 'vectors', 'setup', 'space-basis'];

  function fasesSoportadas(cfg) {
    if (!cfg.phases || !cfg.phases.length) return false;
    return cfg.phases.every(function (f) { return SUBMODOS_OK.indexOf(f.mode) !== -1; });
  }

  function jaula() {
    var j = document.getElementById(JAULA_ID);
    if (j) return j;
    j = document.createElement('div');
    j.id = JAULA_ID;
    j.setAttribute('aria-hidden', 'true');
    j.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;left:-9999px;top:0;';
    document.body.appendChild(j);
    return j;
  }

  function lista() {
    return MANIFIESTO.map(function (m) {
      return {
        id: m.id,
        unidad: m.unidad,
        unit: m.unidadTitulo,
        /* El tema seleccionable es el GRUPO si la actividad tiene uno, y
           su titulo si no. Varias actividades pueden compartir grupo: el
           examen sortea entre ellas. */
        topic: m.grupo || m.titulo,
        titulo: m.titulo,
        archivo: m.archivo,
        soportado: MODOS_SIMPLES.indexOf(m.modo) !== -1 ||
                   (m.modo === 'phases' && (m.submodos || []).every(function (x) { return SUBMODOS_OK.indexOf(x) !== -1; })),
        modo: m.modo
      };
    });
  }

  /* Un campo que puede venir como valor fijo o como funcion, siempre
     devuelto como funcion. */
  function comoFuncion(v) {
    return (typeof v === 'function') ? v : function () { return v; };
  }

  /* --- adaptación del cfg de una actividad al formato del examen --- */
  function adaptar(entrada, cfg) {
    var ex = {
      id: entrada.id,
      unit: entrada.unidadTitulo,
      /* El GRUPO, no el titulo. lista() ya devuelve topic = grupo || titulo,
         asi que se respeta lo que venga. Poner el titulo aca rompia los
         grupos: al terminar de cargar, el examen buscaba el tema por el
         nombre del grupo y no lo encontraba, y descartaba la actividad en
         silencio. */
      topic: entrada.topic || entrada.titulo,
      title: cfg.title || entrada.titulo,
      needsKatex: cfg.needsKatex !== false,
      prompt: cfg.subtitle || '',
      generate: cfg.generate,
      renderContent: cfg.renderContent,
      explain: cfg.explain
    };

    if (cfg.mode === 'choices') {
      ex.type = 'choices';
      // En las actividades 'choices' puede ser un ARRAY fijo o una
      // funcion (current) => array. El examen siempre lo llama como
      // funcion, asi que se normaliza aca.
      ex.choices = comoFuncion(cfg.choices);
      ex.check = cfg.check;
    } else if (cfg.mode === 'grid') {
      ex.type = 'grid';
      ex.grid = cfg.grid;
      ex.checkGrid = cfg.checkGrid;
      ex.getAnswerGrid = cfg.getAnswerGrid;
    } else if (cfg.mode === 'multiselect') {
      ex.type = 'multiselect';
      ex.options = comoFuncion(cfg.options);
    } else if (cfg.mode === 'phases' && fasesSoportadas(cfg)) {
      ex.type = 'phases';
      ex.phases = cfg.phases;
      ex.activePhaseCount = cfg.activePhaseCount;

      /* Si la actividad arranca con un paso de configuracion, el alumno
         elegiria ahi cuantos parametros usar y donde. En un examen eso lo
         decide el examen: se sortea una opcion de cada campo y se le pasa
         a generate. Asi el paso de setup desaparece y no hace falta que el
         examen sepa nada de el. */
      var setup = cfg.phases[0] && cfg.phases[0].mode === 'setup' ? cfg.phases[0] : null;
      if (setup) {
        var generarOriginal = cfg.generate;
        ex.generate = function () {
          var sel = {};
          (setup.fields || []).forEach(function (f) {
            var ops = (typeof f.options === 'function') ? f.options() : f.options;
            if (!ops || !ops.length) return;
            var o = ops[Math.floor(Math.random() * ops.length)];
            sel[f.key] = (o && o.value !== undefined) ? o.value : o;
          });
          return generarOriginal(sel);
        };
      }
    } else {
      return null;   // sub-modos que el examen todavia no sabe pintar
    }
    return ex;
  }

  /* Carga una actividad, captura su cfg y lo adapta.
     Se restaura AptActivity.init siempre, incluso si el script falla:
     dejarlo pisado rompería las landings si esta página fuera una. */
  function cargarUna(entrada, listo) {
    var A = global.AptActivity;
    if (!A || typeof A.init !== 'function') { listo(null); return; }

    var capturado = null;
    var original = A.init;
    A.init = function (cfg) { capturado = cfg; };

    function terminar() {
      A.init = original;
      listo(capturado ? adaptar(entrada, capturado) : null);
    }

    var sc = document.createElement('script');
    sc.src = BASE + entrada.archivo;
    sc.onload = terminar;
    sc.onerror = function () { A.init = original; listo(null); };
    jaula().appendChild(sc);
  }

  var cache = {};

  /* cargar(entradas, listo) — secuencial, y guarda en caché para que
     rearmar un examen con los mismos temas no vuelva a descargar. */
  function cargar(entradas, listo) {
    var out = [];
    var i = 0;
    function siguiente() {
      if (i >= entradas.length) { listo(out); return; }
      var ent = entradas[i++];
      if (cache[ent.id]) { out.push(cache[ent.id]); siguiente(); return; }
      cargarUna(ent, function (ex) {
        if (ex) { cache[ent.id] = ex; out.push(ex); }
        siguiente();
      });
    }
    siguiente();
  }

  global.AptRegistro = {
    version: VERSION,
    lista: lista,
    cargar: cargar,
    base: function () { return BASE; }
  };
})(window);
