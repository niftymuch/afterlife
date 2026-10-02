(() => {
  'use strict';

  const D = window.AFTERLIFE_DATA;
  const KEY = 'afterlife.state.v1';

  /* ---------- helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const setText = (sel, msg) => { $(sel).textContent = msg; };
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- error bar (every error message lives here) ---------- */
  let errTimer = null;
  function showError(msg) {
    const bar = $('#error-bar');
    clearTimeout(errTimer);
    bar.textContent = msg;
    bar.classList.add('show');
    errTimer = setTimeout(clearError, 8000);
  }
  function clearError() {
    clearTimeout(errTimer);
    $('#error-bar').classList.remove('show');
  }
  // start fixing the problem -> the message goes away
  document.addEventListener('input', clearError);

  /* ---------- state ---------- */
  const defaults = () => ({
    death: null,
    causeOptions: null,
    lastWords: '',
    first: '',
    last: '',
    cause: '',
    angel: '',
    verified: false,
    answers: { littered: '', goodmorning: '', yelled: '', charity: '' },
    number: null,
    formDone: false,
    nextName: '',
    chosen: ''
  });

  function load() {
    const base = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return base;
      const answers = Object.assign(base.answers, parsed.answers || {});
      return Object.assign(base, parsed, { answers });
    } catch (e) {
      return base;
    }
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- creepy clock ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const clock = { start: Date.now(), stoppedAt: null, timer: null };

  (() => {
    const ticks = $('#clock-ticks');
    for (let i = 0; i < 12; i += 1) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', '50');
      line.setAttribute('x2', '50');
      line.setAttribute('y1', i % 3 === 0 ? '6' : '8');
      line.setAttribute('y2', i % 3 === 0 ? '16' : '13');
      line.setAttribute('transform', 'rotate(' + i * 30 + ' 50 50)');
      line.setAttribute('class', 'tick');
      ticks.append(line);
    }
  })();

  const pad = (n) => String(n).padStart(2, '0');
  function formatElapsed(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return pad(h) + ':' + pad(m) + ':' + pad(sec % 60);
  }
  function elapsedSeconds() {
    const end = clock.stoppedAt === null ? Date.now() : clock.stoppedAt;
    return Math.max(0, Math.floor((end - clock.start) / 1000));
  }
  function tickClock() {
    const s = elapsedSeconds();
    setText('#clock-time', formatElapsed(s));
    $('#hand-s').setAttribute('transform', 'rotate(' + (s % 60) * 6 + ' 50 50)');
    $('#hand-m').setAttribute('transform', 'rotate(' + ((s / 60) % 60) * 6 + ' 50 50)');
    $('#hand-h').setAttribute('transform', 'rotate(' + ((s / 3600) % 12) * 30 + ' 50 50)');
  }
  function startClock() {
    clearInterval(clock.timer);
    clock.start = Date.now();
    clock.stoppedAt = null;
    $('#clock').classList.remove('stopped');
    setText('#clock-label', 'you have been dead for');
    tickClock();
    clock.timer = setInterval(tickClock, 250);
  }
  function stopClock() {
    if (clock.stoppedAt !== null) return;
    clock.stoppedAt = Date.now();
    clearInterval(clock.timer);
    tickClock();
    $('#clock').classList.add('stopped');
    setText('#clock-label', 'it took you');
  }

  /* ---------- views ---------- */
  const VIEWS = ['home', 'verify', 'form', 'pick', 'next', 'arrived'];

  function showView(name, focus = true) {
    VIEWS.forEach((v) => { $('#view-' + v).hidden = v !== name; });
    clearError();
    window.scrollTo(0, 0);
    if (focus) {
      const h = $('#view-' + name + ' [tabindex="-1"]');
      if (h) h.focus({ preventScroll: true });
    }
  }

  function showSub(view, id) {
    $$('#view-' + view + ' .sub').forEach((p) => { p.hidden = p.id !== id; });
    clearError();
    const field = $('#' + id + ' .field');
    if (field) field.focus({ preventScroll: true });
  }

  function goHome() {
    renderHome();
    showView('home');
  }

  function renderHome() {
    const bound = $('#bound');
    if (state.chosen) {
      bound.hidden = false;
      bound.textContent = 'You are bound for: ' + state.chosen + '.';
    } else {
      bound.hidden = true;
      bound.textContent = '';
    }
  }

  /* ---------- home ---------- */
  $$('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'verify') return openVerify();
      if (action === 'form') {
        if (!state.verified) return showError('you have to verify identity first');
        return openForm();
      }
      if (action === 'pick') {
        if (!state.formDone) return showError('you have to fill out form first');
        return openPick();
      }
      if (action === 'next') return openNext();
      if (action === 'goodrun') return showError('you really did.');
    });
  });

  $$('[data-home]').forEach((b) => b.addEventListener('click', () => {
    closeFilter();
    goHome();
  }));

  $('#reset').addEventListener('click', () => {
    if (!window.confirm('Be reborn and erase everything you entered?')) return;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    state = defaults();
    startClock();
    goHome();
  });

  /* ---------- pick who's next ---------- */
  function openNext() {
    showView('next');
    $('#next-name').value = state.nextName;
    setText('#next-note', state.nextName ? state.nextName + ' is next. Do not tell them.' : '');
    $('#next-name').focus({ preventScroll: true });
  }
  $('#next-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#next-name').value.trim();
    if (!name) return showError('Write a name first. Someone is always next.');
    state.nextName = name;
    save();
    clearError();
    setText('#next-note', name + ' is next. Do not tell them.');
  });

  /* ---------- verify identity ---------- */
  function ensureDeath() {
    const d = state.death;
    if (!d || typeof d.by !== 'string' || typeof d.story !== 'string') {
      state.death = { by: pick(D.deaths), story: pick(D.stories) };
      state.causeOptions = null;
      save();
    }
  }

  function renderGuide() {
    ensureDeath();
    setText('#guide-text',
      'Hi you died by ' + state.death.by + ' what had happened was ' + state.death.story +
      ' from here on out you just have to do a few thing a ma bops and we will send you on your way. ' +
      'first you want to give a recount of your life and experiences and go over a bunch of stuff well not too many ' +
      'and after that you will have some options of places to go from there lucky you get a pick but there may be some tricks so pick wisely ' +
      'there may be some other stuff but you dont have to do it so yeah its fine im sure youll find your way!');
  }

  function openVerify() {
    showView('verify');
    if (state.verified) {
      renderIdentity();
      showSub('verify', 'v-summary');
    } else {
      renderGuide();
      setText('#guide-note', '');
      showSub('verify', 'v-guide');
    }
  }

  function dlRow(dl, term, value) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.append(dt, dd);
  }

  function renderIdentity() {
    const dl = $('#identity-list');
    dl.textContent = '';
    dlRow(dl, 'name', (state.first + ' ' + state.last).trim());
    dlRow(dl, 'how you died', state.cause);
    dlRow(dl, 'angel number', state.angel);
    dlRow(dl, 'last words', state.lastWords || '(you did not send any)');
  }

  // "How did you die?" options: the real cause plus four wrong ones, kept stable
  function renderCauseOptions() {
    ensureDeath();
    const correct = state.death.by;
    let opts = state.causeOptions;
    if (!Array.isArray(opts) || opts.length !== 5 || !opts.includes(correct) || new Set(opts).size !== 5) {
      const wrong = shuffle(D.deaths.filter((x) => x !== correct)).slice(0, 4);
      opts = shuffle([correct].concat(wrong));
      state.causeOptions = opts;
      save();
    }
    const wrap = $('#cause-options');
    wrap.textContent = '';
    opts.forEach((c, i) => {
      const label = document.createElement('label');
      label.className = 'choice';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'cause';
      input.value = c;
      input.id = 'cause-' + i;
      input.checked = state.cause === c;
      const span = document.createElement('span');
      span.textContent = c;
      label.append(input, span);
      wrap.append(label);
    });
  }

  // guide buttons
  $('#v-lastwords').addEventListener('click', () => {
    $('#lw-text').value = state.lastWords || '';
    showSub('verify', 'v-last');
  });
  $('#v-next').addEventListener('click', () => {
    $('#first').value = state.first;
    $('#last').value = state.last;
    showSub('verify', 'v-name');
  });

  // last words
  $('#lw-back').addEventListener('click', () => { renderGuide(); showSub('verify', 'v-guide'); });
  $('#last-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#lw-text').value.trim();
    if (!text) return showError('Write something first. Time is short, but not that short.');
    state.lastWords = text;
    save();
    renderGuide();
    showSub('verify', 'v-guide');
    setText('#guide-note', 'Your last words were sent.');
  });

  // name
  $('#name-back').addEventListener('click', () => { renderGuide(); showSub('verify', 'v-guide'); });
  $('#name-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = $('#first').value.trim();
    const l = $('#last').value.trim();
    if (!f || !l) return showError('Please enter both a first and a last name.');
    state.first = f;
    state.last = l;
    save();
    renderCauseOptions();
    showSub('verify', 'v-cause');
  });

  // cause (must match what the guide said)
  $('#cause-back').addEventListener('click', () => showSub('verify', 'v-name'));
  $('#cause-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const chosen = $('input[name="cause"]:checked');
    if (!chosen) return showError('Please choose one.');
    if (chosen.value !== state.death.by) {
      return showError('That is not how you died. Go back and read what happened.');
    }
    state.cause = chosen.value;
    if (!/^\d{4}$/.test(state.angel)) state.angel = String(1000 + Math.floor(Math.random() * 9000));
    save();
    setText('#angel-number', state.angel);
    showSub('verify', 'v-angel');
  });

  // angel number
  $('#angel-back').addEventListener('click', () => showSub('verify', 'v-cause'));
  $('#angel-submit').addEventListener('click', () => {
    state.verified = true;
    save();
    goHome();
  });

  /* ---------- fill out form ---------- */
  const QUESTIONS = [
    { key: 'littered', text: 'How many times have you littered? (best estimate)' },
    { key: 'goodmorning', text: 'How many times have you said good morning to strangers? (best estimate)' },
    { key: 'yelled', text: 'How many times have you yelled? (best estimate)' },
    { key: 'charity', text: 'How many times have you donated to charity? (best estimate)' }
  ];
  let qi = 0;

  // Tolerate spaces, thousands commas and typographic minus signs.
  function normalizeInt(s) {
    return String(s).replace(/[\s,]/g, '').replace(/[−‒–—]/g, '-');
  }

  function computeNumber() {
    const a = state.answers;
    return Number(a.charity) + Number(a.goodmorning) - Number(a.littered) + Number(a.yelled);
  }

  function openForm() {
    showView('form');
    if (state.formDone) {
      renderFormSummary();
      showSub('form', 'f-summary');
    } else {
      qi = 0;
      renderQuestion();
      showSub('form', 'f-question');
    }
  }

  function renderQuestion() {
    const q = QUESTIONS[qi];
    setText('#q-progress', 'question ' + (qi + 1) + ' of ' + QUESTIONS.length);
    setText('#q-label', q.text);
    $('#q-input').value = state.answers[q.key];
    $('#q-prev').hidden = qi === 0;
  }

  function renderFormSummary() {
    const dl = $('#form-list');
    dl.textContent = '';
    dlRow(dl, 'times you littered', state.answers.littered);
    dlRow(dl, 'times you said good morning to strangers', state.answers.goodmorning);
    dlRow(dl, 'times you yelled', state.answers.yelled);
    dlRow(dl, 'times you donated to charity', state.answers.charity);
    dlRow(dl, 'your number', String(state.number));
  }

  $('#q-prev').addEventListener('click', () => {
    if (qi > 0) { qi -= 1; renderQuestion(); clearError(); $('#q-input').focus({ preventScroll: true }); }
  });
  $('#q-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#q-input').value.trim();
    if (!/^\d{1,6}$/.test(v)) {
      return showError('Please enter a whole number from 0 to 999999 (digits only).');
    }
    state.answers[QUESTIONS[qi].key] = String(Number(v));
    save();
    if (qi < QUESTIONS.length - 1) {
      qi += 1;
      renderQuestion();
      clearError();
      $('#q-input').focus({ preventScroll: true });
    } else {
      $('#calc-input').value = '';
      const a = state.answers;
      setText('#calc-recap', 'your answers: charity = ' + a.charity + ', goodmorning = ' + a.goodmorning +
        ', littered = ' + a.littered + ', yelled = ' + a.yelled);
      showSub('form', 'f-calc');
    }
  });

  $('#calc-prev').addEventListener('click', () => {
    qi = QUESTIONS.length - 1;
    renderQuestion();
    showSub('form', 'f-question');
  });
  $('#calc-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = normalizeInt($('#calc-input').value);
    if (!/^[+-]?\d+$/.test(v)) return showError('Please enter a whole number (a minus sign is allowed).');
    if (Number(v) !== computeNumber()) return showError('That is not your number. Check your math.');
    state.number = computeNumber();
    state.formDone = true;
    save();
    goHome();
  });

  /* ---------- experiences ---------- */
  const BANDS = [
    [null, -1], [0, 9], [10, 24], [25, 49], [50, 99], [100, 199], [200, null],
    [-50, 15], [5, 60], [20, 120], [null, 30], [40, null], [0, 100], [-10, 10]
  ];
  // BANDS[0..6] partition all integers, and the index step below visits every band,
  // so every possible number always has at least one experience open to it.

  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  const EXPERIENCES = D.experiences.trim().split('\n').map((line, i) => {
    const cut = line.indexOf('|');
    const name = line.slice(0, cut).trim();
    const desc = line.slice(cut + 1).trim();
    const band = BANDS[(i * 5 + 3) % BANDS.length];
    return { id: i, name, desc, stars: 1 + (hash(name) % 5), min: band[0], max: band[1] };
  });

  const inRange = (exp, n) => (exp.min === null || n >= exp.min) && (exp.max === null || n <= exp.max);

  function rangeText(exp) {
    if (exp.min === null) return 'Number range: ' + exp.max + ' and below';
    if (exp.max === null) return 'Number range: ' + exp.min + ' and above';
    return 'Number range: ' + exp.min + ' to ' + exp.max;
  }

  let filterValue = null;

  function renderGrid() {
    const grid = $('#grid');
    grid.textContent = '';
    const list = EXPERIENCES.filter((e) => filterValue === null || inRange(e, filterValue));
    if (list.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'nothing here is open to that number';
      grid.append(li);
      return;
    }
    list.forEach((e) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'exp';
      b.dataset.id = String(e.id);
      b.textContent = e.name;
      li.append(b);
      grid.append(li);
    });
  }

  function openPick() {
    filterValue = null;
    $('#filter-input').value = '';
    closeFilter();
    renderGrid();
    showView('pick');
  }

  /* hamburger filter */
  function closeFilter() {
    $('#filter-panel').hidden = true;
    $('#menu-btn').setAttribute('aria-expanded', 'false');
  }
  $('#menu-btn').addEventListener('click', () => {
    const panel = $('#filter-panel');
    const open = panel.hidden;
    panel.hidden = !open;
    $('#menu-btn').setAttribute('aria-expanded', String(open));
    clearError();
    if (open) $('#filter-input').focus({ preventScroll: true });
  });
  $('#filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = normalizeInt($('#filter-input').value);
    if (!/^[+-]?\d+$/.test(v)) return showError('Enter a whole number to filter (a minus sign is allowed).');
    filterValue = Number(v);
    clearError();
    renderGrid();
  });
  $('#filter-clear').addEventListener('click', () => {
    filterValue = null;
    $('#filter-input').value = '';
    clearError();
    renderGrid();
  });

  /* ---------- experience modal ---------- */
  let modalExp = null;
  let modalTrigger = null;

  $('#grid').addEventListener('click', (e) => {
    const b = e.target.closest('.exp');
    if (!b) return;
    openModal(EXPERIENCES[Number(b.dataset.id)], b);
  });

  function openModal(exp, trigger) {
    modalExp = exp;
    modalTrigger = trigger;
    setText('#m-title', exp.name);
    setText('#m-desc', exp.desc);
    const stars = $('#m-stars');
    stars.textContent = '★'.repeat(exp.stars) + '☆'.repeat(5 - exp.stars);
    stars.setAttribute('aria-label', exp.stars + ' out of 5 stars');
    setText('#m-range', rangeText(exp));
    clearError();
    $('#m-angel-form').hidden = true;
    $('#m-angel-input').value = '';
    $('#m-actions').hidden = false;
    $('#modal').hidden = false;
    $('#modal .modal').scrollTop = 0;
    document.body.classList.add('lock');
    $('#m-close').focus();
  }

  function closeModal(restoreFocus = true) {
    $('#modal').hidden = true;
    document.body.classList.remove('lock');
    clearError();
    if (restoreFocus && modalTrigger && document.contains(modalTrigger)) modalTrigger.focus({ preventScroll: true });
    modalExp = null;
  }

  $('#m-close').addEventListener('click', () => closeModal());
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  $('#m-choose').addEventListener('click', () => {
    if (!modalExp) return;
    if (!inRange(modalExp, state.number)) {
      return showError('Your number is not within this range. This one is not for you.');
    }
    clearError();
    $('#m-actions').hidden = true;
    $('#m-angel-form').hidden = false;
    $('#m-angel-input').focus();
  });
  $('#m-angel-cancel').addEventListener('click', () => {
    clearError();
    $('#m-angel-form').hidden = true;
    $('#m-angel-input').value = '';
    $('#m-actions').hidden = false;
    $('#m-choose').focus();
  });
  $('#m-angel-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#m-angel-input').value.trim() !== state.angel) {
      return showError('That is not your angel number.');
    }
    state.chosen = modalExp.name;
    save();
    stopClock();
    setText('#arrived-name', modalExp.name);
    setText('#arrived-desc', modalExp.desc);
    setText('#arrived-time', 'Time it took you to die: ' + formatElapsed(elapsedSeconds()));
    closeModal(false);
    closeFilter();
    renderHome();
    showView('arrived');
  });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', (e) => {
    const modal = $('#modal');
    if (e.key === 'Escape') {
      if (!modal.hidden) { closeModal(); return; }
      if (!$('#filter-panel').hidden) { closeFilter(); $('#menu-btn').focus(); }
      return;
    }
    if (e.key === 'Tab' && !modal.hidden) {
      const items = $$('button, input, textarea', $('#modal .modal')).filter((el) => !el.closest('[hidden]') && !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- start ---------- */
  startClock();
  renderHome();
  showView('home', false);
})();
