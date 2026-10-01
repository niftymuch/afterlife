(() => {
  'use strict';

  const D = window.AFTERLIFE_DATA;
  const KEY = 'afterlife.state.v1';

  /* ---------- helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const setText = (sel, msg) => { $(sel).textContent = msg; };

  /* ---------- state ---------- */
  const defaults = () => ({
    death: null,
    lastWords: '',
    first: '',
    last: '',
    cause: '',
    angel: '',
    verified: false,
    answers: { littered: '', goodmorning: '', yelled: '', charity: '' },
    number: null,
    formDone: false,
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

  /* ---------- views ---------- */
  const VIEWS = ['home', 'verify', 'form', 'pick', 'arrived'];

  function showView(name, focus = true) {
    VIEWS.forEach((v) => { $('#view-' + v).hidden = v !== name; });
    $('#gate-msg').classList.remove('show');
    clearTimeout(gateTimer);
    window.scrollTo(0, 0);
    if (focus) {
      const h = $('#view-' + name + ' [tabindex="-1"]');
      if (h) h.focus({ preventScroll: true });
    }
  }

  function showSub(view, id) {
    $$('#view-' + view + ' .sub').forEach((p) => { p.hidden = p.id !== id; });
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

  /* ---------- home gating ---------- */
  let gateTimer = null;
  function gate(text) {
    const m = $('#gate-msg');
    m.classList.remove('show');
    m.textContent = '';
    clearTimeout(gateTimer);
    // set text after a tick so screen readers announce repeats
    setTimeout(() => {
      m.textContent = text;
      m.classList.add('show');
      gateTimer = setTimeout(() => m.classList.remove('show'), 7000);
    }, 30);
  }

  $$('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'verify') return openVerify();
      if (action === 'form') {
        if (!state.verified) return gate('you have to verify identity first');
        return openForm();
      }
      if (action === 'pick') {
        if (!state.formDone) return gate('you have to fill out form first');
        return openPick();
      }
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
    goHome();
  });

  /* ---------- verify identity ---------- */
  function ensureDeath() {
    const d = state.death;
    if (!d || typeof d.by !== 'string' || typeof d.story !== 'string') {
      state.death = { by: pick(D.deaths), story: pick(D.stories) };
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

  // cause options
  (() => {
    const wrap = $('#cause-options');
    D.causes.forEach((c, i) => {
      const label = document.createElement('label');
      label.className = 'choice';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'cause';
      input.value = c;
      input.id = 'cause-' + i;
      const span = document.createElement('span');
      span.textContent = c;
      label.append(input, span);
      wrap.append(label);
    });
  })();

  // guide buttons
  $('#v-lastwords').addEventListener('click', () => {
    $('#lw-text').value = state.lastWords || '';
    setText('#lw-error', '');
    showSub('verify', 'v-last');
  });
  $('#v-next').addEventListener('click', () => {
    $('#first').value = state.first;
    $('#last').value = state.last;
    setText('#name-error', '');
    showSub('verify', 'v-name');
  });

  // last words
  $('#lw-back').addEventListener('click', () => { renderGuide(); showSub('verify', 'v-guide'); });
  $('#last-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#lw-text').value.trim();
    if (!text) return setText('#lw-error', 'Write something first. Time is short, but not that short.');
    state.lastWords = text;
    save();
    setText('#lw-error', '');
    renderGuide();
    setText('#guide-note', 'Your last words were sent.');
    showSub('verify', 'v-guide');
  });

  // name
  $('#name-back').addEventListener('click', () => { renderGuide(); showSub('verify', 'v-guide'); });
  $('#name-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = $('#first').value.trim();
    const l = $('#last').value.trim();
    if (!f || !l) return setText('#name-error', 'Please enter both a first and a last name.');
    state.first = f;
    state.last = l;
    save();
    setText('#name-error', '');
    setText('#cause-error', '');
    $$('input[name="cause"]').forEach((r) => { r.checked = r.value === state.cause; });
    showSub('verify', 'v-cause');
  });

  // cause
  $('#cause-back').addEventListener('click', () => showSub('verify', 'v-name'));
  $('#cause-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const chosen = $('input[name="cause"]:checked');
    if (!chosen) return setText('#cause-error', 'Please choose one.');
    state.cause = chosen.value;
    if (!/^\d{4}$/.test(state.angel)) state.angel = String(1000 + Math.floor(Math.random() * 9000));
    save();
    setText('#cause-error', '');
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
    setText('#q-error', '');
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
    if (qi > 0) { qi -= 1; renderQuestion(); $('#q-input').focus({ preventScroll: true }); }
  });
  $('#q-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#q-input').value.trim();
    if (!/^\d{1,6}$/.test(v)) {
      return setText('#q-error', 'Please enter a whole number from 0 to 999999 (digits only).');
    }
    state.answers[QUESTIONS[qi].key] = String(Number(v));
    save();
    if (qi < QUESTIONS.length - 1) {
      qi += 1;
      renderQuestion();
      $('#q-input').focus({ preventScroll: true });
    } else {
      $('#calc-input').value = '';
      setText('#calc-error', '');
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
    const v = $('#calc-input').value.trim();
    if (!/^[+-]?\d+$/.test(v)) return setText('#calc-error', 'Please enter a whole number (a minus sign is allowed).');
    if (Number(v) !== computeNumber()) return setText('#calc-error', 'That is not your number. Check your math.');
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
    if (filterValue === null) {
      setText('#grid-count', 'showing all ' + EXPERIENCES.length + ' experiences');
    } else if (list.length === 0) {
      setText('#grid-count', 'nothing is open to ' + filterValue + '. How unusual.');
    } else {
      setText('#grid-count', 'showing ' + list.length + ' of ' + EXPERIENCES.length + ' experiences open to ' + filterValue);
    }
  }

  function openPick() {
    filterValue = null;
    $('#filter-input').value = '';
    setText('#filter-error', '');
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
    if (open) $('#filter-input').focus({ preventScroll: true });
  });
  $('#filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#filter-input').value.trim();
    if (!/^[+-]?\d+$/.test(v)) return setText('#filter-error', 'Enter a whole number to filter (a minus sign is allowed).');
    filterValue = Number(v);
    setText('#filter-error', '');
    renderGrid();
  });
  $('#filter-clear').addEventListener('click', () => {
    filterValue = null;
    $('#filter-input').value = '';
    setText('#filter-error', '');
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
    stars.textContent = '\u2605'.repeat(exp.stars) + '\u2606'.repeat(5 - exp.stars);
    stars.setAttribute('aria-label', exp.stars + ' out of 5 stars');
    setText('#m-range', rangeText(exp));
    setText('#m-msg', '');
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
    if (restoreFocus && modalTrigger && document.contains(modalTrigger)) modalTrigger.focus({ preventScroll: true });
    modalExp = null;
  }

  $('#m-close').addEventListener('click', () => closeModal());
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  $('#m-choose').addEventListener('click', () => {
    if (!modalExp) return;
    if (!inRange(modalExp, state.number)) {
      setText('#m-msg', 'Your number (' + state.number + ') is not within this range. This one is not for you.');
      return;
    }
    setText('#m-msg', '');
    $('#m-actions').hidden = true;
    $('#m-angel-form').hidden = false;
    $('#m-angel-input').focus();
  });
  $('#m-angel-cancel').addEventListener('click', () => {
    setText('#m-msg', '');
    $('#m-angel-form').hidden = true;
    $('#m-angel-input').value = '';
    $('#m-actions').hidden = false;
    $('#m-choose').focus();
  });
  $('#m-angel-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#m-angel-input').value.trim() !== state.angel) {
      return setText('#m-msg', 'That is not your angel number.');
    }
    state.chosen = modalExp.name;
    save();
    setText('#arrived-name', modalExp.name);
    setText('#arrived-desc', modalExp.desc);
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
  renderHome();
  showView('home', false);
})();
