(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  state
   * ------------------------------------------------------------------ */
  var KEY = 'afterlife.v1';

  function blank() {
    return {
      verified: false,
      formDone: false,
      first: '',
      last: '',
      cause: '',
      angel: null,
      lastWords: '',
      ans: { littered: '', good: '', yelled: '', charity: '' },
      number: null,
      chosen: null
    };
  }

  function load() {
    try {
      var j = JSON.parse(localStorage.getItem(KEY));
      if (j) return Object.assign(blank(), j);
    } catch (e) {}
    return blank();
  }

  var S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  /* ------------------------------------------------------------------ *
   *  helpers
   * ------------------------------------------------------------------ */
  var app = document.getElementById('app');
  var msgEl = document.getElementById('msg');
  var msgTimer = null;

  function h(tag, props) {
    var e = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      if (k === 'class') e.className = props[k];
      else if (k === 'style') e.style.cssText = props[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), props[k]);
      else e.setAttribute(k, props[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (Array.isArray(c)) c.forEach(function (x) { if (x != null) e.append(x); });
      else if (c != null) e.append(c);
    }
    return e;
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function hash(s) {
    var x = 2166136261;
    for (var i = 0; i < s.length; i++) {
      x ^= s.charCodeAt(i);
      x = Math.imul(x, 16777619);
    }
    return x >>> 0;
  }

  // The visible label is NOT the click target: a 9px invisible button sits somewhere inside it.
  function tiny(label, fn, x, y) {
    var b = h('button', {
      type: 'button',
      class: 'hot',
      'aria-label': label,
      style: 'left:' + (x == null ? 55 + Math.random() * 30 : x) + '%;top:' + (y == null ? 30 + Math.random() * 40 : y) + '%'
    });
    b.addEventListener('click', fn);
    return h('span', { class: 'tb' }, h('span', { class: 'tl' }, label), b);
  }

  // Messages appear on the opposite side of the screen from the click.
  function say(text, ev) {
    var W = window.innerWidth, H = window.innerHeight;
    var cx = ev && ev.clientX != null ? ev.clientX : W / 2;
    var cy = ev && ev.clientY != null ? ev.clientY : H / 2;
    msgEl.textContent = text;
    msgEl.style.left = msgEl.style.right = msgEl.style.top = msgEl.style.bottom = 'auto';
    if (cx > W / 2) msgEl.style.left = '10px'; else msgEl.style.right = '10px';
    if (cy > H / 2) msgEl.style.top = '10px'; else msgEl.style.bottom = '10px';
    msgEl.style.textAlign = cx > W / 2 ? 'left' : 'right';
    msgEl.classList.add('show');
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { msgEl.classList.remove('show'); }, 3200);
  }

  function show() {
    var kids = Array.prototype.slice.call(arguments);
    app.replaceChildren.apply(app, kids);
    window.scrollTo(0, 0);
  }

  function homeLink() { return tiny('~', home, 40, 60); }

  /* ------------------------------------------------------------------ *
   *  home
   * ------------------------------------------------------------------ */
  function home() {
    show(h('div', { class: 'home' },
      h('p', { class: 'title' }, 'You have died. Please enter your information to get your options and select your afterlife experience.'),
      h('div', { class: 'corner c-tr' }, tiny('fill out form', function (e) {
        if (!S.verified) return say('you have to verify identity first', e);
        formStep(0);
      }, 72, 70)),
      h('div', { class: 'corner c-bl' }, tiny('verify identity', verifyIntro, 12, 40)),
      h('div', { class: 'corner c-br' }, tiny('pick experience', function (e) {
        if (!S.formDone) return say('you have to fill out form first', e);
        gallery();
      }, 88, 25))
    ));
  }

  /* ------------------------------------------------------------------ *
   *  verify identity
   * ------------------------------------------------------------------ */
  var DEATHS = [
    'a seedless grape (the audacity)',
    'a piano that was not even yours',
    'an overly confident pigeon',
    'falling asleep on a very comfortable lawn mower',
    'a rogue shopping cart on a slight incline',
    'sitting on a bench that said wet paint, which was accurate',
    'a decorative sword that was apparently not decorative',
    'a ceiling fan that had been making that noise for weeks',
    'reaching for the last slice of pizza',
    'a trampoline and a dare',
    'an elevator that was between floors in a spiritual sense',
    'misreading a map, then a cliff',
    'a very large and very friendly goose',
    'a self-checkout machine (unexpected item in bagging area)'
  ];

  var STORIES = [
    'you were minding your business and then a series of small events lined up like dominoes and the last domino was, regrettably, you, and nobody really saw it coming except maybe a squirrel',
    'there was a noise, then a second noise that was worse, then a short silence, and then honestly it was kind of peaceful, which nobody tells you about',
    'you said the words that famously go before these things, which were hold my drink, except there was no drink, it was a sandwich, and the sandwich is fine',
    'it was a tuesday, and you had just finished saying that this week was going great, which in hindsight is a thing you should not say out loud near a ceiling',
    'you tried to carry everything in one trip, all of it, the groceries and the laundry and a lamp, and the lamp had opinions about the stairs',
    'a series of unfortunate coincidences involving a ladder, a jar of pickles, and a neighbor who waved at exactly the wrong time',
    'you leaned back in a chair that had been telling you for years that it was done, and you chose not to listen, which is a very human thing to do',
    'it began as a normal day, you had a nice breakfast, you looked at the sky and thought huh, and then the sky did a thing'
  ];

  var CAUSES = [
    'slipped',
    'a piano',
    'old age, allegedly',
    'pigeon',
    'paperwork',
    'i would rather not say',
    'other',
    'see attached'
  ];

  function verifyIntro() {
    show(h('div', null, homeLink()),
      h('div', { class: 'box' },
        h('p', null,
          'Hi you died by ' + pick(DEATHS) + ' what had happened was ' + pick(STORIES) +
          ' from here on out you just have to do a few thing a ma bops and we will send you on your way. ' +
          'first you want to give a recount of your life and experiences and go over a bunch of stuff well not too many ' +
          'and after that you will have some options of places to go from there lucky you get a pick but there may be some tricks ' +
          'so pick wisely there may be some other stuff but you dont have to do it so yeah its fine im sure youll find your way!'),
        h('div', { class: 'row' },
          tiny('next', identity, 30, 80),
          tiny('last words', lastWords, 85, 20)
        )
      ));
  }

  function lastWords() {
    var ta = h('textarea', { 'aria-label': 'last words' });
    ta.value = S.lastWords;
    show(h('div', null, homeLink()),
      h('div', { class: 'box' },
        h('p', null, 'last words:'),
        ta,
        h('div', { class: 'row end' },
          tiny('...', function (e) {
            S.lastWords = ta.value;
            save();
            say('received. probably.', e);
            verifyIntro();
          }, 20, 70)
        )
      ));
  }

  function identity() {
    if (S.angel == null) {
      S.angel = Math.floor(1000 + Math.random() * 9000);
      save();
    }
    var first = h('input', { type: 'text', 'aria-label': 'first' });
    var last = h('input', { type: 'text', 'aria-label': 'last' });
    first.value = S.first;
    last.value = S.last;
    var chosen = S.cause;
    var opts = [];

    function paint() {
      opts.forEach(function (o) { o.el.classList.toggle('on', o.val === chosen); });
    }
    var list = CAUSES.map(function (c) {
      var b = h('button', { type: 'button', class: 'hot', 'aria-label': c });
      var el = h('div', { class: 'opt' }, c, b);
      b.addEventListener('click', function () { chosen = c; paint(); });
      opts.push({ el: el, val: c });
      return el;
    });
    paint();

    show(h('div', null, homeLink()),
      h('div', { class: 'box' },
        h('p', null, 'first and last name'),
        first, last,
        h('p', null, 'how did you die'),
        h('div', null, list),
        h('p', { class: 'angel' }, String(S.angel)),
        h('p', { class: 'note' }, 'this is your angel number. remember this.'),
        h('div', { class: 'row end' },
          tiny('anyway', function (e) {
            if (!first.value.trim() || !last.value.trim() || !chosen) {
              return say('something is missing', e);
            }
            S.first = first.value.trim();
            S.last = last.value.trim();
            S.cause = chosen;
            S.verified = true;
            save();
            home();
          }, 70, 50)
        )
      ));
  }

  /* ------------------------------------------------------------------ *
   *  fill out form
   * ------------------------------------------------------------------ */
  var QUESTIONS = [
    ['littered', 'how many times have you littered? (best estimate)'],
    ['good', 'how many times have you said goodmorning to strangers?'],
    ['yelled', 'how many times have you yelled?'],
    ['charity', 'how many times have you donated to charity?']
  ];

  function toInt(v) {
    if (!/^-?\d+$/.test(String(v).trim())) return null;
    return parseInt(v, 10);
  }

  function formStep(i) {
    if (i >= QUESTIONS.length) return formFinal();
    var q = QUESTIONS[i];
    var inp = h('input', { type: 'number', 'aria-label': q[0], step: '1' });
    inp.value = S.ans[q[0]];
    show(h('div', null, homeLink()),
      h('div', { class: 'box' },
        h('p', null, q[1]),
        inp,
        h('div', { class: 'row end' },
          tiny('then', function (e) {
            var n = toInt(inp.value);
            if (n === null || n < 0) return say('a whole number please', e);
            S.ans[q[0]] = String(n);
            save();
            formStep(i + 1);
          }, 25 + Math.random() * 50, 55)
        )
      ));
  }

  function formFinal() {
    var inp = h('input', { type: 'number', 'aria-label': 'number', step: '1' });
    if (S.number != null) inp.value = S.number;
    show(h('div', null, homeLink()),
      h('div', { class: 'box' },
        h('p', null, 'Your number is charity + goodmorning - littered + yelled'),
        h('p', { class: 'note' }, 'please enter your number'),
        inp,
        h('div', { class: 'row end' },
          tiny('ok', function (e) {
            var n = toInt(inp.value);
            var a = S.ans;
            var want = parseInt(a.charity, 10) + parseInt(a.good, 10) - parseInt(a.littered, 10) + parseInt(a.yelled, 10);
            if (n === null || n !== want) return say('that is not it', e);
            S.number = n;
            S.formDone = true;
            save();
            home();
          }, 60, 30)
        )
      ));
  }

  /* ------------------------------------------------------------------ *
   *  pick experience
   * ------------------------------------------------------------------ */
  var RAW = [
    'mountain|Cold clear air and a view that asks nothing of you.',
    'grocery store|Perfect produce, soft lighting, nobody ever blocks the aisle.',
    'childhood bedroom|The glow stars still work. The door is open a crack.',
    'star in a galaxy|Burn quietly for several billion years. Wave at comets.',
    'empty swimming pool at night|Echoes, chlorine, and a very good ceiling of stars.',
    'dmv (no line)|Number called immediately. Forms are already filled out. Eerie.',
    'grandmother\'s kitchen|Something is always in the oven and you are always allowed one more.',
    'lighthouse|A spiral staircase, a big lamp, and the ocean doing its thing.',
    'back seat on a long drive|Streetlights sweep past. Someone else is driving. You are not asked anything.',
    'a cloud|Drift. Rain occasionally. Fully committed to being a cloud.',
    'library after closing|Every book is yours. The radiator ticks.',
    'deep sea vent|Warm, dark, strange neighbors. Bring no expectations.',
    'laundromat at 2am|Warm dryers, hum of machines, one friendly stranger folding sheets.',
    'sunday afternoon (indefinitely)|It is always about 3pm. Nothing is due.',
    'treehouse|Rope ladder, secret password, a snack stash that regenerates.',
    'airport gate, flight delayed|Boarding soon. Boarding soon. Boarding soon.',
    'hot spring|Steam, snow on the rocks, water at exactly the right temperature.',
    'snowed-in cabin|Fireplace, a stack of books, nowhere to be for a long while.',
    'roller rink|Disco ball, warm carpet walls, you can skate backwards now.',
    'the moon|Quiet. Dusty. The earth hangs there like a big blue lamp.',
    'backyard barbecue|Everyone you ever liked is here. Somebody is always about to say grace.',
    'bus stop in light rain|The bus is coming. You are not in a hurry. It is lovely.',
    'inside your favorite song|You live in the bridge. The chorus keeps coming back.',
    'desert at dawn|Cool sand, long shadows, a lizard doing push-ups.',
    'community pool, summer 1998|Cannonballs, chlorine, a boombox somewhere, a whistle that never blows.',
    'corn maze|Stalks rustle. You will find the exit eventually. Maybe.',
    'night market|Skewers, lanterns, music from three directions at once.',
    'attic of old trunks|Dust, sun slats, and boxes of other people\'s good memories.',
    'the inside of a bell|One gigantic hum. You are the hum.',
    'quiet bookstore with a cat|The cat chooses your next book.',
    'waiting room|A clipboard, a ficus, a magazine from 2009. Someone will be with you shortly.',
    'beach, low tide|Shells, tide pools, and gulls that mind their own business.',
    'bowling alley|Shoes provided. Every roll is a strike. Nachos come with a tiny cup of cheese.',
    'drive-in movie|The movie is the one you always meant to watch. Windshield fog included.',
    'hammock|Two trees, a breeze, and a book you will not read.',
    'meadow of bees|Warm, humming, and they are all very polite.',
    'elevator music|Smooth jazz, forever. The doors never open. The music is good, though.',
    'orbit|Spin around the planet, see sixteen sunrises a day.',
    'the last day of school|Windows open, desks empty, the whole summer ahead.',
    'forest, mushrooms, fog|Soft moss, glowing caps, a path that seems to know you.',
    'diner booth, 3am|Bottomless coffee, a jukebox, a waitress who calls you hon.',
    'treadmill|Gentle incline. You are going nowhere, and the speed keeps increasing.',
    'sled hill|Fresh snow, a perfect slope, hot chocolate at the bottom.',
    'train sleeper car|Rocking, clacking, and a window full of passing towns.',
    'farmers market|Peaches, honey, free samples. Everything smells like Saturday.',
    'carnival, closing time|Lights flicker, the operator lets you ride one more time.',
    'tiny island|One palm, one hammock, one very relaxed crab.',
    'echo chamber|You say something. It comes back. Slightly nicer.',
    'old arcade|Quarters in your pocket never run out. The high score is yours.',
    'wheat field|Gold in every direction and a wind that sounds like applause.',
    'museum, alone|Every painting, no crowds, a bench at exactly the right spot.',
    'sauna|Cedar, heat, and a bucket of cool water just when you want it.',
    'lake dock|Feet in the water, dragonflies, a distant radio.',
    'rooftop|City lights, a lawn chair, the faint sound of everyone else\'s evening.',
    'ice rink|Fresh ice, nobody else, the gentle hiss of blades.',
    'sandcastle (before the tide)|You build it. It is perfect. The tide takes it. You build another.',
    'observatory|A big telescope, a quiet dome, a sky that has nothing to hide.',
    'tent in the rain|Patter on nylon. Warm sleeping bag. A flashlight and a good story.',
    'hotel lobby|Soft carpet, a fern, a bell that rings by itself in a friendly way.',
    'basement rec room|Wood paneling, beanbags, a TV with a dial.',
    'canyon|Red walls, a thin river, a hawk riding the heat.',
    'swing set|Pump your legs. Touch the sky. Jump off at the top.',
    'bridge over a river|Fog under your feet, someone fishing, someone humming.',
    'parking garage, level 3|Fluorescent hum. You cannot remember where you parked.',
    'ant colony (as the colony)|Many tunnels, one purpose. You are all of them.',
    'a very comfortable couch|The cushions remember you. The remote is exactly where you left it.',
    'empty theater stage|A single light. The whole house is yours.',
    'pier at sunset|Salt air, creaking boards, ice cream that does not melt.',
    'greenhouse|Warm, damp, and every plant is quietly doing great.',
    'tide pool|A starfish, an anemone, an opinionated hermit crab.',
    'bakery, 5am|Flour on your hands, the first loaf out, a warm window.',
    'snow globe|Gentle flakes. A tiny town. Occasionally someone shakes you.',
    'mailbox|Mostly flyers. Occasionally a letter from someone you love.',
    'cornfield road|Gravel, dust, a pickup truck that waves.',
    'jungle canopy|Parrots, vines, mist, and a very good view.',
    'foghorn|One long note, over and over, across a gray harbor.',
    'candlelit cellar|Stone walls, old bottles, and a table set for one.',
    'skate park|Smooth concrete, perfect rails, no one yells at you.',
    'salt flat|Flat, white, and infinite. Sky below, sky above.',
    'ferris wheel, at the top|It stops. You stay. The city sparkles.',
    'jury duty|Please wait. Please continue to wait. Thank you for waiting.',
    'kite|A string, a breeze, a child far below who is delighted.',
    'bonfire|Marshmallows, guitars, sparks that go up forever.',
    'waterfall|A rainbow, cold spray, and the unceasing roar.',
    'tollbooth|You are a tollbooth. Cars wave. Occasionally someone gives you a quarter.',
    'conference call (muted)|Everyone is talking. You cannot be heard. The call never ends.',
    'canoe|Slow water, bird calls, a paddle that makes no sound.',
    'vineyard|Rows of vines, warm stone, a long table under a tree.',
    'abandoned mall|Fountains still run. Muzak still plays. A single store is open.',
    'hot air balloon|The burner roars, then silence. Fields like quilts below.',
    'old farmhouse porch|A creaky swing, lemonade, a dog who has nothing to prove.',
    'submarine|Round windows, blue light, the slow ballet of jellyfish.',
    'monastery|Stone, silence, a bell in the distance, vegetable soup.',
    'thunderstorm, from inside|Cozy window seat. Rain, thunder, tea.',
    'bread|You are a warm loaf of bread. People are happy to see you.',
    'a stranger\'s dream|Mostly pleasant, occasionally in a school, unprepared.',
    'comet|Long tail, long orbit, you come back every few thousand years.',
    'field of tulips|Rows of color to the horizon and a windmill that never stops.',
    'the other side of the pillow|Always cool. Always the right temperature.'
  ];

  var OVERRIDE = {
    'waiting room': [-99999, 99999],
    'jury duty': [-99999, 0],
    'sunday afternoon (indefinitely)': [100, 99999]
  };

  var EXPS = RAW.map(function (r) {
    var p = r.split('|');
    var name = p[0];
    var lo = (hash(name) % 300) - 80;
    var hi = lo + 30 + (hash(name + 'w') % 100);
    if (OVERRIDE[name]) { lo = OVERRIDE[name][0]; hi = OVERRIDE[name][1]; }
    return { name: name, desc: p[1], lo: lo, hi: hi, stars: 1 + (hash(name + 's') % 5) };
  });

  var filterOpen = false;
  var filterVal = '';

  function starStr(n) {
    var s = '';
    for (var i = 0; i < 5; i++) s += i < n ? '\u2605' : '\u2606';
    return s;
  }

  function rangeStr(e) {
    var lo = e.lo <= -99999 ? 'anything' : String(e.lo);
    var hi = e.hi >= 99999 ? 'anything' : String(e.hi);
    return lo + ' to ' + hi;
  }

  function gallery() {
    var grid = h('div', { class: 'grid' });
    var filterBox = h('div', { class: 'filter' });
    var inp = h('input', { type: 'number', 'aria-label': 'number', step: '1' });
    inp.value = filterVal;
    filterBox.append(inp);
    filterBox.style.display = filterOpen ? 'block' : 'none';

    function fill() {
      var n = toInt(inp.value);
      filterVal = inp.value;
      var items = EXPS.filter(function (e) {
        return n === null || (n >= e.lo && n <= e.hi);
      });
      grid.replaceChildren.apply(grid, items.map(function (e) {
        var b = h('button', {
          type: 'button',
          class: 'hot',
          'aria-label': e.name,
          style: 'left:' + (20 + (hash(e.name + 'x') % 60)) + '%;top:' + (20 + (hash(e.name + 'y') % 50)) + '%'
        });
        b.addEventListener('click', function () { detail(e); });
        return h('div', { class: 'exp' }, h('span', null, e.name), b);
      }));
    }
    inp.addEventListener('input', fill);

    var lines = h('div', { class: 'lines' }, h('i'), h('i'), h('i'));
    var lb = h('button', { type: 'button', class: 'hot', 'aria-label': 'lines' });
    lb.addEventListener('click', function () {
      filterOpen = !filterOpen;
      filterBox.style.display = filterOpen ? 'block' : 'none';
    });
    lines.append(lb);

    show(h('div', { class: 'top' }, homeLink(), lines, filterBox), grid);
    fill();
  }

  function detail(e) {
    show(
      h('div', null, tiny('\u2014', gallery, 30, 55)),
      h('h2', null, e.name),
      h('p', null, e.desc),
      h('p', { class: 'stars' }, starStr(e.stars)),
      h('p', { class: 'note' }, 'numbers that can select this: ' + rangeStr(e)),
      h('div', { class: 'row end' },
        tiny('so', function (ev) {
          if (S.number == null || S.number < e.lo || S.number > e.hi) {
            return say('your number does not reach this one', ev);
          }
          confirmAngel(e);
        }, 45, 65))
    );
  }

  function confirmAngel(e) {
    var inp = h('input', { type: 'number', 'aria-label': 'angel number', step: '1' });
    show(h('div', null, tiny('\u2014', function () { detail(e); }, 30, 55)),
      h('div', { class: 'box' },
        h('p', null, 'please enter your angel number'),
        inp,
        h('div', { class: 'row end' },
          tiny('hm', function (ev) {
            if (toInt(inp.value) !== S.angel) return say('that is not your angel number', ev);
            S.chosen = e.name;
            save();
            arrived(e);
          }, 50, 40)
        )
      ));
  }

  function arrived(e) {
    show(h('div', null, homeLink()),
      h('div', { class: 'box' },
        h('p', null, 'you are now in: ' + e.name + '.'),
        h('p', { class: 'note' }, e.desc),
        h('p', { class: 'note' }, 'there is no further paperwork. probably.')
      ));
  }

  /* ------------------------------------------------------------------ */
  home();
})();
