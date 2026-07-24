/* ============================================================
   ÁLGEBRA PARA TODOS · exam.js (v1.0)
   ------------------------------------------------------------
   Modo examen: independiente de engine.js a propósito (son dos
   cosas distintas que conviven, no una extensión de la otra).
   Lee la lógica de cada ejercicio desde window.AptExercises
   (exercises.js) — ese archivo tiene que cargarse ANTES que este.

   Uso:
     <script src=".../exercises.js"></script>
     <script src=".../exam.js"></script>
     <script>
       AptExam.init({
         title: 'Ejercicios de Álgebra Lineal',
         questionsPerTopic: 3
       });
     </script>
   ============================================================ */
(function (global) {
  'use strict';

  var FONT_LINK_ID = 'apt-exam-fonts';
  var KATEX_CSS_ID = 'apt-exam-katex-css';
  var KATEX_JS_ID = 'apt-exam-katex-js';
  var STYLE_ID = 'apt-exam-style';

  function ensureAssets() {
    if (!document.getElementById(FONT_LINK_ID)) {
      var pre = document.createElement('link');
      pre.rel = 'preconnect'; pre.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pre);
      var fonts = document.createElement('link');
      fonts.id = FONT_LINK_ID; fonts.rel = 'stylesheet';
      fonts.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Lora:wght@600;700&display=swap';
      document.head.appendChild(fonts);
    }
    if (!document.getElementById(STYLE_ID)) {
      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS.join('\n');
      document.head.appendChild(style);
      var bg = document.createElement('style');
      bg.textContent = 'body{ background-color:#0A0A0D; }';
      document.head.appendChild(bg);
    }
  }

  function ensureKatex(callback) {
    if (global.katex) { callback(); return; }
    if (!document.getElementById(KATEX_CSS_ID)) {
      var css = document.createElement('link');
      css.id = KATEX_CSS_ID; css.rel = 'stylesheet';
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
      document.head.appendChild(css);
    }
    if (!document.getElementById(KATEX_JS_ID)) {
      var js = document.createElement('script');
      js.id = KATEX_JS_ID;
      js.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
      js.onload = callback;
      document.head.appendChild(js);
    } else {
      var check = setInterval(function () { if (global.katex) { clearInterval(check); callback(); } }, 50);
    }
  }

  var CSS = [
    '.apt-exam{ --bg:#0A0A0D; --bg-card:#16161C; --grid-line:rgba(151,161,216,0.14); --ink:#F5F5F7; --ink-soft:#A7ACC0; --chalk:#48507D; --chalk-hover:#5A639A; --chalk-light:#97A1D8; --correct:#5BCD9A; --correct-bg:rgba(91,205,154,0.12); --wrong:#D65252; --wrong-bg:rgba(214,82,82,0.12); --font-mono:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace; --font-serif:"Lora",Georgia,"Times New Roman",serif; --radius:14px; --max-w:520px; min-height:100vh; width:100%; box-sizing:border-box; background:linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0/100% 28px, linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0/28px 100%, var(--bg); color:var(--ink); font-family:var(--font-mono); padding:max(24px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom)); display:flex; align-items:center; justify-content:center; }',
    '.apt-exam *{ box-sizing:border-box; }',
    '.apt-exam__app{ width:100%; max-width:var(--max-w); display:flex; flex-direction:column; gap:clamp(12px,2.6vh,20px); }',
    '.apt-exam__eyebrow{ font-family:var(--font-serif); font-weight:700; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--chalk-light); margin:0 0 8px; text-align:center; }',
    '.apt-exam__title{ font-family:var(--font-mono); font-weight:700; font-size:clamp(22px,6.5vw,28px); margin:0; color:var(--ink); line-height:1.25; text-align:center; }',
    '.apt-exam__subtitle{ font-family:var(--font-mono); font-size:13.5px; color:var(--ink-soft); margin:8px 0 0; line-height:1.5; text-align:center; }',
    '.apt-exam__card{ background:var(--bg-card); border:1px solid rgba(151,161,216,0.18); border-radius:var(--radius); box-shadow:0 1px 3px rgba(0,0,0,.4), 0 10px 24px rgba(0,0,0,.35); padding:18px; }',
    '.apt-exam__unit-block{ margin-bottom:16px; }',
    '.apt-exam__unit-block:last-child{ margin-bottom:0; }',
    '.apt-exam__unit-title{ font-family:var(--font-serif); font-weight:700; font-size:14px; color:var(--ink); margin:0 0 8px; }',
    '.apt-exam__topic-btn{ width:100%; display:flex; align-items:center; gap:10px; text-align:left; font-family:var(--font-mono); font-size:13.5px; color:var(--ink-soft); background:rgba(151,161,216,0.05); border:1.5px solid rgba(151,161,216,0.25); border-radius:10px; padding:12px 14px; margin-bottom:8px; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .15s ease, border-color .15s ease, color .15s ease; }',
    '.apt-exam__topic-btn:last-child{ margin-bottom:0; }',
    '.apt-exam__topic-btn::before{ content:"☐"; flex:0 0 auto; font-size:16px; color:var(--chalk-light); }',
    '.apt-exam__topic-btn.is-selected{ background:rgba(151,161,216,0.14); border-color:var(--chalk-light); color:var(--ink); }',
    '.apt-exam__topic-btn.is-selected::before{ content:"☑"; }',
    '.apt-exam__start-btn{ width:100%; font-family:var(--font-serif); font-weight:700; font-size:16px; color:#fff; background:var(--chalk); border:none; border-radius:12px; padding:16px; min-height:54px; cursor:pointer; transition:background .15s ease, opacity .15s ease; }',
    '.apt-exam__start-btn:hover{ background:var(--chalk-hover); }',
    '.apt-exam__start-btn:disabled{ opacity:.4; cursor:default; }',
    '.apt-exam__progress-row{ display:flex; justify-content:space-between; align-items:center; font-family:var(--font-mono); font-size:12.5px; color:var(--ink-soft); }',
    '.apt-exam__timer{ font-family:var(--font-mono); font-weight:700; color:var(--chalk-light); font-variant-numeric:tabular-nums; }',
    '.apt-exam__progress-bar{ height:4px; border-radius:2px; background:rgba(151,161,216,0.15); overflow:hidden; }',
    '.apt-exam__progress-fill{ height:100%; background:var(--chalk-light); transition:width .25s ease; }',
    '.apt-exam__content{ width:100%; display:flex; justify-content:center; font-size:clamp(16px,4.6vw,21px); min-height:60px; align-items:center; }',
    '.apt-exam__content .katex{ color:var(--ink); }',
    '.apt-exam__choices{ display:flex; flex-direction:column; gap:8px; }',
    '.apt-exam__choice-btn{ font-family:var(--font-serif); font-weight:700; font-size:15px; padding:15px 16px; border-radius:12px; border:2px solid var(--chalk-light); background:transparent; color:var(--chalk-light); cursor:pointer; min-height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; transition:transform .08s ease, background .15s ease, color .15s ease; -webkit-tap-highlight-color:transparent; }',
    '.apt-exam__choice-btn:active{ transform:scale(.98); }',
    '.apt-exam__choice-sub{ font-family:var(--font-mono); font-weight:400; font-size:11px; opacity:.75; }',
    '.apt-exam__matrixwrap{ display:flex; align-items:stretch; justify-content:center; gap:6px; }',
    '.apt-exam__bracket{ width:9px; border-top:3px solid var(--ink-soft); border-bottom:3px solid var(--ink-soft); }',
    '.apt-exam__bracket--left{ border-left:3px solid var(--ink-soft); border-radius:5px 0 0 5px; }',
    '.apt-exam__bracket--right{ border-right:3px solid var(--ink-soft); border-radius:0 5px 5px 0; }',
    '.apt-exam__grid{ display:grid; gap:8px 6px; padding:4px; }',
    '.apt-exam__divider{ width:2px; background:var(--chalk-light); opacity:.45; justify-self:center; }',
    '.apt-exam__cellwrap{ display:flex; align-items:stretch; gap:3px; }',
    '.apt-exam__signseg{ flex:0 0 34px; width:34px; display:flex; border:2px solid rgba(151,161,216,0.3); border-radius:7px; overflow:hidden; }',
    '.apt-exam__signseg-btn{ flex:1 1 50%; min-width:0; border:none; background:transparent; color:var(--ink-soft); font-family:var(--font-mono); font-weight:700; font-size:13px; cursor:pointer; padding:0; -webkit-tap-highlight-color:transparent; }',
    '.apt-exam__signseg-btn + .apt-exam__signseg-btn{ border-left:1px solid rgba(151,161,216,0.3); }',
    '.apt-exam__signseg-btn.is-active{ background:var(--chalk); color:#fff; }',
    '.apt-exam__cell{ flex:1 1 auto; min-width:0; text-align:center; font-family:var(--font-mono); font-weight:500; font-size:clamp(15px,4.2vw,18px); color:var(--ink); background:rgba(151,161,216,0.07); border:2px solid rgba(151,161,216,0.3); border-radius:8px; padding:8px 2px; -webkit-appearance:none; }',
    '.apt-exam__cell:focus{ outline:none; border-color:var(--chalk-light); background:rgba(151,161,216,0.14); }',
    '.apt-exam__check-btn{ width:100%; font-family:var(--font-serif); font-weight:700; font-size:16px; padding:16px; border-radius:12px; border:2px solid var(--chalk-light); background:transparent; color:var(--chalk-light); cursor:pointer; min-height:52px; }',
    '.apt-exam__check-btn:hover{ background:rgba(151,161,216,0.1); }',
    '.apt-exam__hint{ text-align:center; font-family:var(--font-mono); font-size:12px; color:var(--ink-soft); opacity:.8; margin:0; }',
    '.apt-exam__results-summary{ text-align:center; }',
    '.apt-exam__score{ font-family:var(--font-serif); font-weight:700; font-size:32px; color:var(--ink); margin:0; }',
    '.apt-exam__score-sub{ font-family:var(--font-mono); font-size:13px; color:var(--ink-soft); margin:6px 0 0; }',
    '.apt-exam__result-item{ border:1px solid rgba(151,161,216,0.18); border-radius:12px; margin-bottom:8px; overflow:hidden; }',
    '.apt-exam__result-head{ width:100%; display:flex; align-items:center; gap:10px; padding:13px 14px; background:rgba(151,161,216,0.05); border:none; cursor:pointer; text-align:left; font-family:var(--font-mono); font-size:13.5px; color:var(--ink); -webkit-tap-highlight-color:transparent; }',
    '.apt-exam__result-icon{ flex:0 0 auto; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; }',
    '.apt-exam__result-item.is-correct .apt-exam__result-icon{ background:var(--correct-bg); color:var(--correct); }',
    '.apt-exam__result-item.is-wrong .apt-exam__result-icon{ background:var(--wrong-bg); color:var(--wrong); }',
    '.apt-exam__result-title{ flex:1 1 auto; }',
    '.apt-exam__result-time{ flex:0 0 auto; color:var(--ink-soft); font-size:11.5px; }',
    '.apt-exam__result-chevron{ flex:0 0 auto; color:var(--chalk-light); font-size:16px; transition:transform .15s ease; }',
    '.apt-exam__result-item.is-open .apt-exam__result-chevron{ transform:rotate(90deg); }',
    '.apt-exam__result-body{ display:none; padding:14px; border-top:1px solid rgba(151,161,216,0.12); }',
    '.apt-exam__result-item.is-open .apt-exam__result-body{ display:block; }',
    '.apt-exam__result-label{ font-family:var(--font-serif); font-weight:700; font-size:12.5px; color:var(--ink-soft); margin:0 0 4px; }',
    '.apt-exam__result-value{ font-family:var(--font-mono); font-size:13px; color:var(--ink); margin:0 0 12px; line-height:1.5; }',
    '.apt-exam__result-value.is-correct-text{ color:var(--correct); }',
    '.apt-exam__result-value.is-wrong-text{ color:var(--wrong); }',
    '.apt-exam__restart-btn{ width:100%; font-family:var(--font-serif); font-weight:700; font-size:15px; color:#fff; background:var(--chalk); border:none; border-radius:12px; padding:15px; min-height:50px; cursor:pointer; margin-top:8px; }',
    '.apt-exam__restart-btn:hover{ background:var(--chalk-hover); }',
    '.apt-exam__screen--hidden{ display:none; }'
  ];

  /* ---------- utilidades ---------- */
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function formatTime(ms) {
    var s = Math.round(ms / 1000);
    var m = Math.floor(s / 60);
    var rem = s % 60;
    return m + ':' + (rem < 10 ? '0' : '') + rem;
  }

  /* ---------- grilla de entrada (self-contained, no depende de engine.js) ---------- */
  function buildGridInput(container, gridCfg) {
    container.innerHTML = '';
    var rows = gridCfg.rows, cols = gridCfg.cols, dividerAfterCol = gridCfg.dividerAfterCol;
    var wrap = document.createElement('div');
    wrap.className = 'apt-exam__matrixwrap';
    var bracketL = document.createElement('span'); bracketL.className = 'apt-exam__bracket apt-exam__bracket--left';
    var bracketR = document.createElement('span'); bracketR.className = 'apt-exam__bracket apt-exam__bracket--right';
    var grid = document.createElement('div');
    grid.className = 'apt-exam__grid';
    var totalCols = dividerAfterCol ? cols + 1 : cols;
    grid.style.gridTemplateColumns = 'repeat(' + totalCols + ', minmax(46px,60px))';

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cellwrap = document.createElement('div');
        cellwrap.className = 'apt-exam__cellwrap';
        cellwrap.dataset.row = r; cellwrap.dataset.col = c;
        cellwrap.style.gridRow = String(r + 1);
        cellwrap.style.gridColumn = String(dividerAfterCol && c >= dividerAfterCol ? c + 2 : c + 1);

        var signSeg = document.createElement('div');
        signSeg.className = 'apt-exam__signseg';
        signSeg.dataset.sign = '+';
        ['-', '+'].forEach(function (s) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'apt-exam__signseg-btn' + (s === '+' ? ' is-active' : '');
          btn.textContent = s; btn.dataset.sign = s;
          btn.addEventListener('click', function () {
            signSeg.dataset.sign = s;
            signSeg.querySelectorAll('.apt-exam__signseg-btn').forEach(function (b) { b.classList.toggle('is-active', b.dataset.sign === s); });
          });
          signSeg.appendChild(btn);
        });

        var input = document.createElement('input');
        input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off';
        input.className = 'apt-exam__cell';
        input.addEventListener('input', function () { this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2); });

        cellwrap.appendChild(signSeg);
        cellwrap.appendChild(input);
        grid.appendChild(cellwrap);
      }
    }
    if (dividerAfterCol) {
      var divider = document.createElement('div');
      divider.className = 'apt-exam__divider';
      divider.style.gridColumn = String(dividerAfterCol + 1);
      divider.style.gridRow = '1 / ' + (rows + 1);
      grid.appendChild(divider);
    }
    wrap.appendChild(bracketL); wrap.appendChild(grid); wrap.appendChild(bracketR);
    container.appendChild(wrap);

    return function readMatrix() {
      var M = []; var hasEmpty = false;
      for (var r = 0; r < rows; r++) {
        M.push([]);
        for (var c = 0; c < cols; c++) {
          var cw = grid.querySelector('.apt-exam__cellwrap[data-row="' + r + '"][data-col="' + c + '"]');
          var raw = cw.querySelector('.apt-exam__cell').value.trim();
          if (raw === '') { hasEmpty = true; M[r].push(0); continue; }
          var n = parseInt(raw, 10);
          var sign = cw.querySelector('.apt-exam__signseg').dataset.sign;
          M[r].push(sign === '-' ? -n : n);
        }
      }
      return { matrix: M, hasEmpty: hasEmpty };
    };
  }

  function matrixToLatex(M) {
    return '\\begin{bmatrix} ' + M.map(function (row) { return row.join(' & '); }).join(' \\\\ ') + ' \\end{bmatrix}';
  }

  /* ============================================================
     init()
     ============================================================ */
  function init(cfg) {
    ensureAssets();
    var registry = cfg.registry || global.AptExercises || [];
    var questionsPerTopic = cfg.questionsPerTopic || 3;

    var mountEl = cfg.mount ? document.querySelector(cfg.mount) : null;
    var root = mountEl || document.createElement('div');
    root.className = 'apt-exam';
    if (!mountEl) {
      var script = document.currentScript;
      if (script && script.parentNode) script.parentNode.insertBefore(root, script);
      else document.body.appendChild(root);
    }

    root.innerHTML =
      '<div class="apt-exam__app">' +
        '<div class="apt-exam__screen apt-exam__screen--select">' +
          '<p class="apt-exam__eyebrow">' + (cfg.eyebrow || 'Álgebra Para Todos') + '</p>' +
          '<h1 class="apt-exam__title">' + (cfg.title || 'Ejercicios de Álgebra Lineal') + '</h1>' +
          '<p class="apt-exam__subtitle">' + (cfg.subtitle || 'Elegí los temas que querés practicar. Se arma un examen cronometrado, sin volver atrás.') + '</p>' +
          '<div class="apt-exam__card"><div class="apt-exam__topics"></div></div>' +
          '<button type="button" class="apt-exam__start-btn" disabled>Empezar examen</button>' +
        '</div>' +
        '<div class="apt-exam__screen apt-exam__screen--running apt-exam__screen--hidden">' +
          '<div class="apt-exam__progress-row"><span class="apt-exam__progress-label"></span><span class="apt-exam__timer">0:00</span></div>' +
          '<div class="apt-exam__progress-bar"><div class="apt-exam__progress-fill"></div></div>' +
          '<div class="apt-exam__card"><div class="apt-exam__content"></div></div>' +
          '<div class="apt-exam__answer"></div>' +
        '</div>' +
        '<div class="apt-exam__screen apt-exam__screen--results apt-exam__screen--hidden">' +
          '<div class="apt-exam__results-summary">' +
            '<p class="apt-exam__score"></p>' +
            '<p class="apt-exam__score-sub"></p>' +
          '</div>' +
          '<div class="apt-exam__results-list"></div>' +
          '<button type="button" class="apt-exam__restart-btn">Practicar otra vez →</button>' +
        '</div>' +
      '</div>';

    var refs = {
      selectScreen: root.querySelector('.apt-exam__screen--select'),
      runningScreen: root.querySelector('.apt-exam__screen--running'),
      resultsScreen: root.querySelector('.apt-exam__screen--results'),
      topicsWrap: root.querySelector('.apt-exam__topics'),
      startBtn: root.querySelector('.apt-exam__start-btn'),
      progressLabel: root.querySelector('.apt-exam__progress-label'),
      timerEl: root.querySelector('.apt-exam__timer'),
      progressFill: root.querySelector('.apt-exam__progress-fill'),
      content: root.querySelector('.apt-exam__content'),
      answer: root.querySelector('.apt-exam__answer'),
      scoreEl: root.querySelector('.apt-exam__score'),
      scoreSubEl: root.querySelector('.apt-exam__score-sub'),
      resultsList: root.querySelector('.apt-exam__results-list'),
      restartBtn: root.querySelector('.apt-exam__restart-btn')
    };

    /* ---------- pantalla 1: selección de temas ---------- */
    var units = {};
    registry.forEach(function (ex) {
      if (!units[ex.unit]) units[ex.unit] = [];
      if (units[ex.unit].indexOf(ex.topic) === -1) units[ex.unit].push(ex.topic);
    });
    var selectedTopics = {};

    Object.keys(units).forEach(function (unitName) {
      var block = document.createElement('div');
      block.className = 'apt-exam__unit-block';
      var h = document.createElement('p');
      h.className = 'apt-exam__unit-title';
      h.textContent = unitName;
      block.appendChild(h);
      units[unitName].forEach(function (topic) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'apt-exam__topic-btn';
        btn.textContent = topic;
        btn.addEventListener('click', function () {
          selectedTopics[topic] = !selectedTopics[topic];
          btn.classList.toggle('is-selected', !!selectedTopics[topic]);
          refs.startBtn.disabled = !Object.keys(selectedTopics).some(function (t) { return selectedTopics[t]; });
        });
        block.appendChild(btn);
      });
      refs.topicsWrap.appendChild(block);
    });

    var examState = null;

    refs.startBtn.addEventListener('click', function () {
      var topics = Object.keys(selectedTopics).filter(function (t) { return selectedTopics[t]; });
      startExam(topics);
    });

    function startExam(topics) {
      var questions = [];
      topics.forEach(function (topic) {
        var pool = registry.filter(function (e) { return e.topic === topic; });
        for (var i = 0; i < questionsPerTopic; i++) {
          var ex = randChoice(pool);
          questions.push({ exercise: ex, current: ex.generate(), topic: topic });
        }
      });
      questions = shuffle(questions);

      examState = { questions: questions, index: 0, records: [], qStartTime: null, timerInterval: null };

      function boot() {
        refs.selectScreen.classList.add('apt-exam__screen--hidden');
        refs.runningScreen.classList.remove('apt-exam__screen--hidden');
        renderQuestion();
      }
      var anyKatex = questions.some(function (q) { return q.exercise.needsKatex; });
      if (anyKatex) ensureKatex(boot); else boot();
    }

    function renderQuestion() {
      var q = examState.questions[examState.index];
      refs.progressLabel.textContent = 'Pregunta ' + (examState.index + 1) + ' de ' + examState.questions.length;
      refs.progressFill.style.width = (100 * examState.index / examState.questions.length) + '%';

      q.exercise.renderContent(refs.content, q.current);

      refs.answer.innerHTML = '';
      var readMatrix = null;

      if (q.exercise.type === 'choices') {
        var choicesWrap = document.createElement('div');
        choicesWrap.className = 'apt-exam__choices';
        q.exercise.choices(q.current).forEach(function (choice) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'apt-exam__choice-btn';
          btn.innerHTML = '<span>' + choice.label + '</span>' + (choice.sub ? '<span class="apt-exam__choice-sub">' + choice.sub + '</span>' : '');
          btn.addEventListener('click', function () { submitAnswer(choice.value); });
          choicesWrap.appendChild(btn);
        });
        refs.answer.appendChild(choicesWrap);
      } else if (q.exercise.type === 'grid') {
        var gridContainer = document.createElement('div');
        refs.answer.appendChild(gridContainer);
        readMatrix = buildGridInput(gridContainer, q.exercise.grid);
        var hint = document.createElement('p');
        hint.className = 'apt-exam__hint';
        hint.textContent = 'Tocá − o + para cambiar el signo de cada número.';
        refs.answer.appendChild(hint);
        var checkBtn = document.createElement('button');
        checkBtn.type = 'button';
        checkBtn.className = 'apt-exam__check-btn';
        checkBtn.textContent = 'Comprobar';
        checkBtn.addEventListener('click', function () {
          var read = readMatrix();
          submitAnswer(read.matrix, read.hasEmpty);
        });
        refs.answer.appendChild(checkBtn);
      }

      examState.qStartTime = Date.now();
      if (examState.timerInterval) clearInterval(examState.timerInterval);
      refs.timerEl.textContent = '0:00';
      examState.timerInterval = setInterval(function () {
        refs.timerEl.textContent = formatTime(Date.now() - examState.qStartTime);
      }, 250);
    }

    function submitAnswer(value, hasEmpty) {
      var q = examState.questions[examState.index];
      clearInterval(examState.timerInterval);
      var timeMs = Date.now() - examState.qStartTime;

      var correct, studentAnswerDisplay, correctAnswerDisplay;
      if (q.exercise.type === 'choices') {
        correct = q.exercise.check(q.current, value);
        var opts = q.exercise.choices(q.current);
        var chosen = opts.filter(function (o) { return o.value === value; })[0];
        var correctOpt = opts.filter(function (o) { return q.exercise.check(q.current, o.value); })[0];
        studentAnswerDisplay = { type: 'text', value: chosen ? chosen.label : value, rawValue: value };
        correctAnswerDisplay = { type: 'text', value: correctOpt ? correctOpt.label : '' };
      } else {
        var result = q.exercise.checkGrid(q.current, value, !!hasEmpty);
        correct = result.correct && !hasEmpty;
        studentAnswerDisplay = { type: 'matrix', value: value };
        correctAnswerDisplay = { type: 'matrix', value: q.exercise.getAnswerGrid ? q.exercise.getAnswerGrid(q.current) : value };
      }

      examState.records.push({
        exercise: q.exercise, current: q.current, topic: q.topic,
        correct: correct, timeMs: timeMs,
        studentAnswerDisplay: studentAnswerDisplay, correctAnswerDisplay: correctAnswerDisplay
      });

      examState.index++;
      if (examState.index < examState.questions.length) {
        renderQuestion();
      } else {
        showResults();
      }
    }

    /* ---------- pantalla 3: revisión ---------- */
    function showResults() {
      refs.runningScreen.classList.add('apt-exam__screen--hidden');
      refs.resultsScreen.classList.remove('apt-exam__screen--hidden');

      var correctCount = examState.records.filter(function (r) { return r.correct; }).length;
      var totalTime = examState.records.reduce(function (s, r) { return s + r.timeMs; }, 0);
      refs.scoreEl.textContent = correctCount + ' / ' + examState.records.length;
      refs.scoreSubEl.textContent = 'Correctas · tiempo total ' + formatTime(totalTime);

      refs.resultsList.innerHTML = '';
      examState.records.forEach(function (rec, idx) {
        var item = document.createElement('div');
        item.className = 'apt-exam__result-item' + (rec.correct ? ' is-correct' : ' is-wrong');
        item.innerHTML =
          '<button type="button" class="apt-exam__result-head">' +
            '<span class="apt-exam__result-icon">' + (rec.correct ? '✓' : '✕') + '</span>' +
            '<span class="apt-exam__result-title">' + (idx + 1) + '. ' + rec.exercise.title + '</span>' +
            '<span class="apt-exam__result-time">' + formatTime(rec.timeMs) + '</span>' +
            '<span class="apt-exam__result-chevron">▸</span>' +
          '</button>' +
          '<div class="apt-exam__result-body">' +
            '<p class="apt-exam__result-label">Enunciado</p>' +
            '<div class="apt-exam__result-value apt-exam__result-content"></div>' +
            '<p class="apt-exam__result-label">Tu respuesta</p>' +
            '<div class="apt-exam__result-value ' + (rec.correct ? 'is-correct-text' : 'is-wrong-text') + ' apt-exam__result-student"></div>' +
            (rec.correct ? '' :
              '<p class="apt-exam__result-label">Respuesta correcta</p>' +
              '<div class="apt-exam__result-value is-correct-text apt-exam__result-correctval"></div>') +
            '<p class="apt-exam__result-label">Explicación</p>' +
            '<p class="apt-exam__result-value apt-exam__result-explain"></p>' +
          '</div>';
        refs.resultsList.appendChild(item);

        var head = item.querySelector('.apt-exam__result-head');
        var opened = false;
        head.addEventListener('click', function () {
          opened = !opened;
          item.classList.toggle('is-open', opened);
          if (opened && !item.dataset.rendered) {
            item.dataset.rendered = '1';
            var contentEl = item.querySelector('.apt-exam__result-content');
            rec.exercise.renderContent(contentEl, rec.current);

            var studentEl = item.querySelector('.apt-exam__result-student');
            renderAnswerDisplay(studentEl, rec.studentAnswerDisplay);

            if (!rec.correct) {
              var correctEl = item.querySelector('.apt-exam__result-correctval');
              renderAnswerDisplay(correctEl, rec.correctAnswerDisplay);
            }

            var explainEl = item.querySelector('.apt-exam__result-explain');
            var explainText = rec.exercise.type === 'choices'
              ? rec.exercise.explain(rec.current, rec.correct, rec.studentAnswerDisplay && rec.studentAnswerDisplay.rawValue)
              : (rec.exercise.checkGrid ? rec.exercise.checkGrid(rec.current, (rec.studentAnswerDisplay.value), false).feedbackText : '');
            explainEl.textContent = explainText || '';
          }
        });
      });
    }

    function renderAnswerDisplay(container, display) {
      if (!display) { container.textContent = '—'; return; }
      if (display.type === 'text') {
        container.textContent = display.value;
      } else if (display.type === 'matrix') {
        if (global.katex) global.katex.render(matrixToLatex(display.value), container, { throwOnError: false });
        else container.textContent = JSON.stringify(display.value);
      }
    }

    refs.restartBtn.addEventListener('click', function () {
      Object.keys(selectedTopics).forEach(function (k) { selectedTopics[k] = false; });
      root.querySelectorAll('.apt-exam__topic-btn').forEach(function (b) { b.classList.remove('is-selected'); });
      refs.startBtn.disabled = true;
      refs.resultsScreen.classList.add('apt-exam__screen--hidden');
      refs.selectScreen.classList.remove('apt-exam__screen--hidden');
    });
  }

  global.AptExam = { init: init };
})(window);
