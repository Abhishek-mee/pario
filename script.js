/* ------------------------------------------------------------------
   FEATHER FURY
   A browser slingshot game built with a tiny helping hand from Matter.js.

   ART SWAP GUIDE
   --------------
   Every character/background path lives in ASSET_MANIFEST below.
   Replace a file in /assets (or point the path at your own PNG/SVG) and the
   game will use it automatically. Character sprites should be square with a
   transparent background; 512 × 512 or larger works beautifully.
------------------------------------------------------------------ */

(() => {
  "use strict";

  if (!window.Matter) {
    const root = document.getElementById("gameRoot");
    if (root) {
      root.innerHTML =
        '<div style="position:fixed;inset:0;display:grid;place-items:center;padding:32px;background:#162216;color:#fff4dc;font:700 18px/1.5 Nunito,sans-serif;text-align:center;">Matter.js did not load. Check that <code>vendor/matter.min.js</code> is present, then refresh.</div>';
    }
    return;
  }

  const { Engine, Bodies, Body, Composite, Events, Vector } = window.Matter;

  /* ================================================================
     CONFIG
  ================================================================ */

  const WORLD = { width: 1600, height: 900, groundY: 770 };
  const FIXED_STEP = 1000 / 60;
  const GRAVITY_Y = 1.15;
  const GRAVITY_ACCEL = GRAVITY_Y * 0.001 * (FIXED_STEP * FIXED_STEP);

  const SLING = {
    x: 264,
    baseY: 770,
    joint: { x: 264, y: 625 },
    leftTip: { x: 224, y: 556 },
    rightTip: { x: 304, y: 538 },
    anchor: { x: 267, y: 547 },
    maxPull: 152,
    power: 0.132,
  };

  const ASSET_MANIFEST = {
    background: "assets/backgrounds/medow.png",
    // Fraction of the background image's height where the painted grass line
    // sits. drawBackdrop() aligns that line with the physics ground.
    backgroundGround: 0.753,
    birds: {
      red: "assets/characters/trollface.png",
      yellow: "assets/characters/doge.png",
      black: "assets/characters/cat.png",
    },
    pigs: {
      green: "assets/pigs/pig-bow.png",
      helmet: "assets/pigs/pig-sheep.png",
      king: "assets/pigs/pig-grumpy.png",
    },
  };

  const BIRD_TYPES = {
    red: {
      name: "Trollface",
      shortName: "Troll",
      asset: "red",
      radius: 28,
      density: 0.0033,
      damage: 9.2,
      ability: null,
      color: "#ed4c2f",
      hint: "Trollface has no tricks. Pull back and enjoy the chaos.",
    },
    yellow: {
      name: "Doge",
      shortName: "Doge",
      asset: "yellow",
      radius: 27,
      density: 0.003,
      damage: 8.2,
      ability: "boost",
      color: "#ffd23c",
      hint: "Doge is up. Tap SPACE mid-flight for a speed boost.",
    },
    black: {
      name: "Grumpy Cat",
      shortName: "Cat",
      asset: "black",
      radius: 30,
      density: 0.0039,
      damage: 10,
      ability: "bomb",
      color: "#353b3c",
      hint: "Grumpy Cat is up. Tap SPACE mid-flight to detonate.",
    },
  };

  const MATERIALS = {
    wood: {
      hp: 108,
      density: 0.00135,
      friction: 0.68,
      restitution: 0.015,
      score: 500,
      name: "Wood",
    },
    ice: {
      hp: 66,
      density: 0.00086,
      friction: 0.36,
      restitution: 0.03,
      score: 450,
      name: "Ice",
    },
    stone: {
      hp: 210,
      density: 0.00185,
      friction: 0.82,
      restitution: 0.01,
      score: 750,
      name: "Stone",
    },
    tnt: {
      hp: 34,
      density: 0.0011,
      friction: 0.72,
      restitution: 0.02,
      score: 1000,
      name: "TNT",
    },
  };

  const PIG_TYPES = {
    green: { radius: 32, hp: 72, asset: "green", spriteScale: 2.95, name: "Bow Cat" },
    helmet: { radius: 33, hp: 105, asset: "helmet", spriteScale: 3.35, name: "Sheep" },
    king: { radius: 39, hp: 135, asset: "king", spriteScale: 3.05, name: "Grumpy Cat" },
  };

  const LEVELS = [
    {
      name: "Sunny Side Up",
      chapter: "Meadow Mayhem",
      birds: ["red", "yellow", "black"],
      star2: 20000,
      star3: 30000,
      build() {
        // Main timber hut
        addBlock(1015, 685, 30, 170, "wood");
        addBlock(1145, 685, 30, 170, "wood");
        addPig(1080, 736, "green", 33);
        addBlock(1080, 586, 170, 28, "wood");
        addPig(1080, 540, "green", 31);

        // Ice lookout
        addBlock(1248, 700, 28, 140, "ice");
        addBlock(1392, 700, 28, 140, "ice");
        addPig(1320, 737, "green", 32);
        addBlock(1320, 618, 196, 24, "wood");
        addPig(1320, 574, "green", 32);

        // A very tempting crate of trouble
        addBlock(1472, 735, 62, 70, "tnt");

        // Bonus stack by the fence
        addBlock(930, 739, 58, 62, "wood");
        addBlock(930, 678, 58, 60, "ice");
      },
    },
    {
      name: "Stone Cold Bacon",
      chapter: "Old Mill Meadow",
      birds: ["red", "yellow", "black", "red"],
      star2: 30000,
      star3: 44000,
      build() {
        // Stone gazebo
        addBlock(956, 690, 36, 160, "stone");
        addBlock(1064, 690, 36, 160, "stone");
        addPig(1010, 736, "green", 33);
        addBlock(1010, 594, 180, 32, "stone");
        addBlock(1010, 548, 62, 60, "ice");

        // Two-storey timber mill
        addBlock(1168, 700, 28, 140, "wood");
        addBlock(1268, 700, 28, 140, "wood");
        addBlock(1218, 618, 150, 24, "wood");
        addBlock(1218, 735, 64, 70, "tnt");
        addBlock(1174, 548, 26, 116, "ice");
        addBlock(1262, 548, 26, 116, "ice");
        addPig(1218, 576, "green", 29);
        addBlock(1218, 477, 172, 26, "wood");
        addBlock(1218, 434, 60, 60, "ice");

        // Ice house on the right
        addBlock(1394, 710, 30, 120, "ice");
        addBlock(1498, 710, 30, 120, "ice");
        addPig(1446, 737, "green", 32);
        addBlock(1446, 638, 140, 24, "ice");
        addPig(1446, 592, "helmet", 33);
      },
    },
    {
      name: "Royal Rumble",
      chapter: "The King's Picnic",
      birds: ["red", "yellow", "black", "red", "black"],
      star2: 35000,
      star3: 52000,
      build() {
        // Royal keep
        addBlock(1085, 675, 36, 190, "stone");
        addBlock(1255, 675, 36, 190, "stone");
        addPig(1170, 736, "green", 35);
        addBlock(1170, 564, 210, 32, "stone");
        addBlock(1122, 488, 28, 120, "wood");
        addBlock(1218, 488, 28, 120, "wood");
        addPig(1170, 517, "green", 31);
        addBlock(1170, 416, 164, 24, "wood");
        addPig(1170, 364, "king", 39);

        // Right-hand guard tower
        addBlock(1394, 710, 28, 120, "ice");
        addBlock(1494, 710, 28, 120, "ice");
        addPig(1444, 737, "green", 32);
        addBlock(1444, 638, 142, 24, "stone");
        addPig(1444, 592, "helmet", 33);

        // Powder keg between the two
        addBlock(1332, 735, 68, 70, "tnt");

        // A little cover on the left
        addBlock(998, 739, 60, 60, "wood");
        addBlock(998, 678, 60, 60, "stone");
      },
    },
  ];

  const ICONS = {
    boost: '<svg viewBox="0 0 24 24" fill="none"><path d="M13.5 2 5 13.2h5.2L9.4 22 19 10.4h-5.4z" fill="currentColor" stroke="#3c2518" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    bomb: '<svg viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="14" r="6.4" fill="currentColor" stroke="#342319" stroke-width="1.3"/><path d="M14.8 8.5c1-1.6 2.1-2 3.2-1.2m-1.1-2.7.7-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18.3 3.2c.3-1 1.2-1.2 1.6-.4.5-.4 1.1 0 .8.7-.4.8-1.4.9-2.4-.3z" fill="#ffd255"/></svg>',
  };

  const STAR_THRESHOLDS = LEVELS.map((level) => [level.star2, level.star3]);
  const CONFETTI_COLORS = ["#ffd255", "#ef5a2f", "#86c44a", "#fff4dc", "#f3a745", "#4b8a56"];

  /* ================================================================
     DOM + SAVE
  ================================================================ */

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const els = {
    root: $("#gameRoot"),
    canvas: $("#gameCanvas"),
    hud: $("#hud"),
    hudLevelNumber: $("#hudLevelNumber"),
    hudLevelName: $("#hudLevelName"),
    hudChapter: $("#hudChapter"),
    scoreValue: $("#scoreValue"),
    scoreChip: $(".score-chip"),
    birdQueue: $("#birdQueue"),
    flockTray: $("#flockTray"),
    flockCount: $("#flockCount"),
    tipPill: $("#tipPill"),
    tipText: $("#tipText"),
    abilityPanel: $("#abilityPanel"),
    abilityBtn: $("#abilityBtn"),
    abilityTitle: $("#abilityTitle"),
    abilityGlyph: $("#abilityGlyph"),
    levelIntro: $("#levelIntro"),
    introNumber: $("#introNumber"),
    introChapter: $("#introChapter"),
    introName: $("#introName"),
    toast: $("#toast"),
    startScreen: $("#startScreen"),
    howScreen: $("#howScreen"),
    pauseScreen: $("#pauseScreen"),
    resultScreen: $("#resultScreen"),
    levelChoices: $("#levelChoices"),
    playLevelNumber: $("#playLevelNumber"),
    resultCard: $("#resultCard"),
    resultRibbon: $("#resultRibbon"),
    resultEyebrow: $("#resultEyebrow"),
    resultTitle: $("#resultTitle"),
    resultLine: $("#resultLine"),
    resultStars: $("#resultStars"),
    resultScore: $("#resultScore"),
    bestBadge: $("#bestBadge"),
    resultPigs: $("#resultPigs"),
    resultBlocks: $("#resultBlocks"),
    resultBirds: $("#resultBirds"),
    resultNextBtn: $("#resultNextBtn"),
    resultReplayBtn: $('[data-action="replay"]', $("#resultScreen")),
    confetti: $("#confetti"),
    rotateGate: $(".rotate-gate"),
  };

  const STORAGE_KEY = "feather-fury-save-v1";

  function loadSave() {
    const fallback = { unlocked: 1, best: {}, sound: true, lastLevel: 0 };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return {
        unlocked: Math.min(LEVELS.length, Math.max(1, Number(parsed.unlocked) || 1)),
        best: parsed.best && typeof parsed.best === "object" ? parsed.best : {},
        sound: parsed.sound !== false,
        lastLevel: Math.min(LEVELS.length - 1, Math.max(0, Number(parsed.lastLevel) || 0)),
      };
    } catch {
      return fallback;
    }
  }

  let save = loadSave();

  function persistSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      /* Storage can be unavailable in private or local-file contexts. */
    }
  }

  let selectedLevel = Math.min(save.unlocked - 1, save.lastLevel, LEVELS.length - 1);
  if (!Number.isFinite(selectedLevel)) selectedLevel = 0;

  /* ================================================================
     ART LOADING
  ================================================================ */

  function loadArt(src) {
    const entry = { src, img: new Image(), ready: false, failed: false };
    entry.img.decoding = "async";
    entry.img.onload = () => {
      entry.ready = true;
    };
    entry.img.onerror = () => {
      entry.failed = true;
    };
    entry.img.src = src;
    return entry;
  }

  const art = {
    background: loadArt(ASSET_MANIFEST.background),
    birds: {
      red: loadArt(ASSET_MANIFEST.birds.red),
      yellow: loadArt(ASSET_MANIFEST.birds.yellow),
      black: loadArt(ASSET_MANIFEST.birds.black),
    },
    pigs: {
      green: loadArt(ASSET_MANIFEST.pigs.green),
      helmet: loadArt(ASSET_MANIFEST.pigs.helmet),
      king: loadArt(ASSET_MANIFEST.pigs.king),
    },
  };

  function drawSprite(entry, x, y, width, height, rotation = 0, alpha = 1, filter = "none") {
    if (!entry || !entry.ready) return false;
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    if (filter !== "none") ctx.filter = filter;
    ctx.drawImage(entry.img, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
  }

  /* ================================================================
     SOUND — synthesized effects plus decoded sample hits
  ================================================================ */

  const Sound = (() => {
    let audio = null;
    let master = null;
    let noiseBuffer = null;
    let lastThud = 0;
    let lastPunch = 0;
    let lastTnt = 0;
    let lastDeath = 0;
    let winVoice = null;
    let loseVoice = null;

    const makeSample = (url) => ({
      url,
      buffer: null,
      loading: false,
      failed: false,
      element: null,
      elementVolume: 0,
      elementTimer: 0,
      primeToken: 0,
      primed: false,
    });

    const samples = {
      punch: makeSample("assets/audio/punch.mp3"),
      throw: makeSample("assets/audio/oiia-cat.mp3"),
      tnt: makeSample("assets/audio/tnt-explode.mp3"),
      win: makeSample("assets/audio/win.mp3"),
      lose: makeSample("assets/audio/lose.mp3"),
      death: makeSample("assets/audio/death.mp3"),
    };

    function ensure() {
      const fileMode = window.location.protocol === "file:";
      if (!audio) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audio = new AudioCtx();
          master = audio.createGain();
          master.gain.value = save.sound ? 0.32 : 0;
          master.connect(audio.destination);
          noiseBuffer = makeNoiseBuffer();
        }
        // `fetch()` is blocked for file:// pages, so those open the MP3s
        // through media elements instead. The same fallback kicks in if a
        // sample fails to decode when served over HTTP.
        for (const key of Object.keys(samples)) {
          if (fileMode || !AudioCtx) prepareElementSample(key);
          else loadSample(key);
        }
      }
      for (const key of Object.keys(samples)) {
        const entry = samples[key];
        if (entry.failed && !entry.element) prepareElementSample(key);
        else if (entry.element && !entry.primed) primeElement(entry);
      }
      if (audio && audio.state === "suspended") audio.resume().catch(() => {});
      return true;
    }

    function loadSample(key) {
      const entry = samples[key];
      if (!audio || !entry || entry.buffer || entry.loading || entry.failed) return;
      entry.loading = true;
      fetch(entry.url)
        .then((response) => {
          if (!response.ok) throw new Error(`${entry.url}: ${response.status}`);
          return response.arrayBuffer();
        })
        .then(
          (data) =>
            new Promise((resolve, reject) => {
              audio.decodeAudioData(data, resolve, reject);
            })
        )
        .then((buffer) => {
          entry.buffer = buffer;
        })
        .catch(() => {
          entry.failed = true;
        })
        .finally(() => {
          entry.loading = false;
        });
    }

    function prepareElementSample(key) {
      const entry = samples[key];
      if (!entry || entry.element) return;
      const el = new Audio(entry.url);
      el.preload = "auto";
      entry.element = el;
      primeElement(entry);
    }

    // A silent play on the first gesture unlocks each media element, so the
    // win track can still start later when a pig pops.
    function primeElement(entry) {
      const el = entry.element;
      if (!el || entry.primed) return;
      entry.primed = true;
      const token = ++entry.primeToken;
      const previousVolume = el.volume;
      el.volume = 0;
      const attempt = el.play();
      if (!attempt || typeof attempt.then !== "function") return;
      attempt
        .then(() => {
          if (entry.primeToken !== token) return;
          el.pause();
          try {
            el.currentTime = 0;
          } catch {
            /* Metadata may not be ready. */
          }
          el.volume = previousVolume;
        })
        .catch(() => {
          if (entry.primeToken === token) entry.primed = false;
          el.volume = previousVolume;
        });
    }

    function startElementSample(entry, volume, options) {
      const el = entry.element;
      if (!el) return null;
      const { delay = 0, offset = 0, duration = 0 } = options;
      entry.primeToken += 1;
      clearTimeout(entry.elementTimer);
      entry.elementTimer = 0;
      const play = () => {
        try {
          el.currentTime = offset;
        } catch {
          /* Metadata may not be ready; playback starts at zero. */
        }
        entry.elementVolume = Math.min(1, volume * 0.32);
        el.volume = save.sound ? entry.elementVolume : 0;
        const attempt = el.play();
        if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
        if (duration > 0) {
          entry.elementTimer = window.setTimeout(() => {
            el.pause();
            entry.elementTimer = 0;
          }, duration * 1000);
        }
      };
      if (delay > 0) window.setTimeout(play, delay * 1000);
      else play();
      return { element: el, elementVolume: entry.elementVolume };
    }

    function startSample(key, volume, options = {}) {
      const entry = samples[key];
      if (!save.sound || !entry) return null;
      if (audio && entry.buffer) {
        const { delay = 0, offset = 0, duration = 0 } = options;
        const src = audio.createBufferSource();
        const gain = audio.createGain();
        src.buffer = entry.buffer;
        gain.gain.value = volume;
        src.connect(gain);
        gain.connect(master);
        const when = audio.currentTime + delay;
        const length = duration > 0 ? duration : Math.max(0, entry.buffer.duration - offset);
        if (duration > 0) src.start(when, offset, duration);
        else src.start(when, offset);
        return { source: src, gain, endTime: when + length };
      }
      return startElementSample(entry, volume, options);
    }

    function playSample(key, volume, options = {}) {
      return Boolean(startSample(key, volume, options));
    }

    function stopVoice(voice, fade = 0.18) {
      if (!voice) return;
      if (voice.fadeTimer) {
        clearInterval(voice.fadeTimer);
        voice.fadeTimer = 0;
      }
      if (voice.element) {
        const el = voice.element;
        if (fade <= 0) {
          el.pause();
          try {
            el.currentTime = 0;
          } catch {
            /* Ignore unloaded metadata. */
          }
          return;
        }
        const startVolume = el.volume;
        const started = performance.now();
        voice.fadeTimer = window.setInterval(() => {
          const t = Math.min(1, (performance.now() - started) / (fade * 1000));
          el.volume = Math.max(0, startVolume * (1 - t));
          if (t >= 1) {
            clearInterval(voice.fadeTimer);
            voice.fadeTimer = 0;
            el.pause();
            try {
              el.currentTime = 0;
            } catch {
              /* Ignore unloaded metadata. */
            }
            el.volume = save.sound ? voice.elementVolume || 0 : 0;
          }
        }, 30);
        return;
      }
      if (!audio) return;
      const t = audio.currentTime;
      try {
        if (fade > 0) {
          voice.gain.gain.cancelScheduledValues(t);
          voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), t);
          voice.gain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
          voice.source.stop(t + fade + 0.03);
        } else {
          voice.source.stop(t);
        }
      } catch {
        /* The source may already have ended. */
      }
    }

    function stopWin(fade = 0.18) {
      const voice = winVoice;
      winVoice = null;
      stopVoice(voice, fade);
    }

    function stopLose(fade = 0.18) {
      const voice = loseVoice;
      loseVoice = null;
      stopVoice(voice, fade);
    }

    function makeNoiseBuffer() {
      const length = Math.floor(audio.sampleRate * 1.1);
      const buffer = audio.createBuffer(1, length, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    function syncVolume() {
      for (const entry of Object.values(samples)) {
        if (entry.element) entry.element.volume = save.sound ? entry.elementVolume : 0;
      }
      if (!audio || !master) return;
      master.gain.setTargetAtTime(save.sound ? 0.32 : 0, audio.currentTime, 0.02);
    }

    function tone(freq, options = {}) {
      if (!audio || !save.sound) return;
      const { type = "sine", duration = 0.1, volume = 0.08, endFreq = freq, delay = 0 } = options;
      const t = audio.currentTime + delay;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
      }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + duration + 0.03);
    }

    function noise(options = {}) {
      if (!audio || !save.sound) return;
      const {
        duration = 0.18,
        volume = 0.12,
        filter = "lowpass",
        frequency = 1200,
        endFrequency = frequency,
        delay = 0,
      } = options;
      const t = audio.currentTime + delay;
      const src = audio.createBufferSource();
      src.buffer = noiseBuffer;
      const biquad = audio.createBiquadFilter();
      biquad.type = filter;
      biquad.frequency.setValueAtTime(frequency, t);
      if (endFrequency !== frequency) {
        biquad.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), t + duration);
      }
      const gain = audio.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      src.connect(biquad);
      biquad.connect(gain);
      gain.connect(master);
      src.start(t);
      src.stop(t + duration + 0.03);
    }

    return {
      ensure,
      syncVolume,
      stopWin,
      stopLose,
      click() {
        tone(460, { type: "sine", duration: 0.055, volume: 0.045, endFreq: 590 });
      },
      launch(power) {
        const strength = Math.max(0.35, Math.min(1, power));
        playSample("throw", 0.9, { offset: 1.2, duration: 2 });
        noise({ duration: 0.17, volume: 0.1 * strength, filter: "bandpass", frequency: 950, endFrequency: 300 });
        tone(170, { type: "triangle", duration: 0.12, volume: 0.07 * strength, endFreq: 330 });
      },
      thud(strength) {
        if (!audio) return;
        if (audio.currentTime - lastThud < 0.045) return;
        lastThud = audio.currentTime;
        const v = Math.min(0.16, 0.035 + strength * 0.008);
        tone(95, { type: "sine", duration: 0.075, volume: v, endFreq: 48 });
        noise({ duration: 0.04, volume: v * 0.65, filter: "lowpass", frequency: 620 });
      },
      hitPig() {
        if (!save.sound) return;
        const now = audio ? audio.currentTime : performance.now() / 1000;
        if (now - lastPunch < 0.055) return;
        lastPunch = now;
        if (playSample("punch", 0.55)) return;
        // Synthesized fallback if the sample has not decoded yet.
        tone(310, { type: "square", duration: 0.07, volume: 0.045, endFreq: 210 });
        tone(430, { type: "square", duration: 0.09, volume: 0.038, endFreq: 150, delay: 0.05 });
      },
      breakMaterial(material) {
        if (material === "ice") {
          noise({ duration: 0.2, volume: 0.1, filter: "highpass", frequency: 1900, endFrequency: 3100 });
          tone(1500, { type: "sine", duration: 0.1, volume: 0.03, endFreq: 2400 });
          tone(2100, { type: "sine", duration: 0.08, volume: 0.022, endFreq: 2900, delay: 0.035 });
        } else if (material === "stone") {
          noise({ duration: 0.22, volume: 0.14, filter: "lowpass", frequency: 700, endFrequency: 210 });
          tone(72, { type: "triangle", duration: 0.16, volume: 0.08, endFreq: 38 });
        } else {
          noise({ duration: 0.17, volume: 0.1, filter: "bandpass", frequency: 800, endFrequency: 250 });
          tone(135, { type: "triangle", duration: 0.09, volume: 0.05, endFreq: 60 });
        }
      },
      pigPop() {
        if (!save.sound) return;
        // One death cry per blast cluster: several pigs can die in the same
        // frame, and stacking the same voice would spike the mix.
        const now = audio ? audio.currentTime : performance.now() / 1000;
        if (now - lastDeath < 0.18) return;
        lastDeath = now;
        if (playSample("death", 0.7)) return;
        tone(620, { type: "square", duration: 0.085, volume: 0.055, endFreq: 240 });
        noise({ duration: 0.12, volume: 0.055, filter: "bandpass", frequency: 1100, endFrequency: 300 });
        tone(980, { type: "sine", duration: 0.07, volume: 0.025, endFreq: 500, delay: 0.06 });
      },
      boost() {
        noise({ duration: 0.26, volume: 0.12, filter: "bandpass", frequency: 500, endFrequency: 3500 });
        tone(260, { type: "sawtooth", duration: 0.23, volume: 0.05, endFreq: 930 });
      },
      explosion() {
        noise({ duration: 0.6, volume: 0.23, filter: "lowpass", frequency: 1400, endFrequency: 120 });
        tone(78, { type: "sine", duration: 0.52, volume: 0.17, endFreq: 25 });
        tone(130, { type: "square", duration: 0.2, volume: 0.04, endFreq: 45 });
      },
      tntExplosion() {
        if (!save.sound) return false;
        // One boom per blast cluster; chained crates shouldn't stack samples.
        const now = audio ? audio.currentTime : performance.now() / 1000;
        if (now - lastTnt < 0.18) return true;
        lastTnt = now;
        return playSample("tnt", 0.62);
      },
      win() {
        stopWin(0);
        const voice = startSample("win", 0.55);
        if (voice) {
          winVoice = voice;
          const ended = () => {
            if (winVoice === voice) winVoice = null;
          };
          if (voice.element) voice.element.onended = ended;
          else voice.source.addEventListener("ended", ended, { once: true });
          return;
        }
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          tone(freq, { type: "triangle", duration: 0.24, volume: 0.07, delay: i * 0.1 });
          tone(freq * 2, { type: "sine", duration: 0.18, volume: 0.018, delay: i * 0.1 });
        });
        tone(1318.5, { type: "sine", duration: 0.4, volume: 0.03, delay: 0.44 });
      },
      lose() {
        stopLose(0);
        const voice = startSample("lose", 0.9);
        if (voice) {
          loseVoice = voice;
          const ended = () => {
            if (loseVoice === voice) loseVoice = null;
          };
          if (voice.element) voice.element.onended = ended;
          else voice.source.addEventListener("ended", ended, { once: true });
          return;
        }
        [392, 329.6, 261.6].forEach((freq, i) => {
          tone(freq, { type: "triangle", duration: 0.26, volume: 0.055, endFreq: freq * 0.92, delay: i * 0.16 });
        });
      },
      star() {
        [880, 1174.7, 1568].forEach((freq, i) => {
          tone(freq, { type: "sine", duration: 0.2, volume: 0.03, delay: i * 0.08 });
        });
      },
    };
  })();

  /* ================================================================
     STATE
  ================================================================ */

  const state = {
    mode: "menu",
    levelIndex: selectedLevel,
    score: 0,
    displayScore: 0,
    birds: [],
    loadedBird: null,
    activeBird: null,
    pigs: [],
    blocks: [],
    particles: [],
    shockwaves: [],
    floaters: [],
    motes: [],
    drag: null,
    damageEnabled: false,
    roundOver: false,
    resultDelay: 0,
    resultWin: false,
    resultShown: false,
    nextBirdTimer: 0,
    turnActive: false,
    settleTimer: 0,
    lossTimer: 0,
    outTimer: null,
    shake: 0,
    elapsed: 0,
    stats: { pigs: 0, blocks: 0, birdsSaved: 0, shots: 0 },
    flockSignature: "",
    shownAbility: false,
    abilityKind: "",
    tipTimeout: 0,
    introTimeout: 0,
    toastTimeout: 0,
    lastUnlockedThisLevel: false,
    currentBirds: 0,
    trailTimer: 0,
    scoreBumpCooldown: 0,
    scoreBumpQueued: false,
    resultDisplayScore: 0,
    idleTimer: 0,
    hintIndex: 0,
    preview: false,
    explosions: [],
    toRemove: [],
    lastResultWin: false,
    trajectory: [],
  };

  let engine = null;
  let ground = null;
  let view = { width: 0, height: 0, scale: 1, ox: 0, oy: 0, dpr: 1 };
  let ctx = null;
  let accumulator = 0;
  let lastFrame = performance.now();
  let totalTime = 0;
  let pendingPreviewFrame = false;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================================================================
     SMALL HELPERS
  ================================================================ */

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const pad2 = (n) => String(n).padStart(2, "0");
  const formatNumber = (n) => Math.round(n).toLocaleString("en-US");
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function seeded(n) {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  }

  function roundRectPath(context, x, y, width, height, radius) {
    const r = Math.min(Math.abs(radius), Math.abs(width) / 2, Math.abs(height) / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function materialColors(material) {
    switch (material) {
      case "ice":
        return ["#e3f8fc", "#b7e4ee", "#87c5d4", "#ffffff"];
      case "stone":
        return ["#cbc5b7", "#a29c8e", "#7f7a6d", "#5f5b51"];
      case "tnt":
        return ["#ffe08a", "#ff9d5c", "#d9482e", "#fff0bc"];
      case "pig":
        return ["#ffb3c1", "#ffd6df", "#fff4dc", "#e89aa6"];
      case "ground":
        return ["#f0e1bb", "#d9c590", "#bca46d", "#fff4dc"];
      default:
        return ["#dca96e", "#bd8148", "#946033", "#efca98"];
    }
  }

  /* ================================================================
     WORLD BUILDING
  ================================================================ */

  function addBlock(x, y, width, height, material) {
    if (!engine) return null;
    const mat = MATERIALS[material] || MATERIALS.wood;
    const body = Bodies.rectangle(x, y, width, height, {
      label: "block",
      density: mat.density,
      friction: mat.friction,
      frictionStatic: 0.74,
      frictionAir: 0.006,
      restitution: mat.restitution,
      chamfer: { radius: Math.min(6, width * 0.18, height * 0.18) },
    });
    body.game = {
      kind: "block",
      material,
      width,
      height,
      hp: mat.hp,
      maxHp: mat.hp,
      dead: false,
      removed: false,
      hitFlash: 0,
      seed: Math.random() * 1000,
    };
    Composite.add(engine.world, body);
    state.blocks.push(body);
    return body;
  }

  function addPig(x, y, type, radius) {
    if (!engine) return null;
    const def = PIG_TYPES[type] || PIG_TYPES.green;
    const r = radius || def.radius;
    const body = Bodies.circle(x, y, r, {
      label: "pig",
      density: 0.00125,
      friction: 0.52,
      frictionStatic: 0.72,
      frictionAir: 0.011,
      restitution: 0.05,
    });
    body.game = {
      kind: "pig",
      type,
      radius: r,
      hp: def.hp,
      maxHp: def.hp,
      dead: false,
      removed: false,
      hitFlash: 0,
      seed: Math.random() * 1000,
    };
    Composite.add(engine.world, body);
    state.pigs.push(body);
    return body;
  }

  function makeBird(type) {
    const def = BIRD_TYPES[type] || BIRD_TYPES.red;
    const body = Bodies.circle(SLING.anchor.x, SLING.anchor.y, def.radius, {
      label: "bird",
      density: def.density,
      friction: 0.42,
      frictionStatic: 0.5,
      frictionAir: 0.009,
      restitution: 0.24,
    });
    // Must be created dynamic and frozen afterwards: creating with `isStatic`
    // skips Matter's mass backup, which turns the body's mass into Infinity
    // and makes the launch integration produce NaN positions.
    Body.setStatic(body, true);
    body.game = {
      kind: "bird",
      type,
      def,
      launched: false,
      abilityUsed: false,
      dead: false,
      removed: false,
    };
    Composite.add(engine.world, body);
    return body;
  }

  function makeMotes() {
    const motes = [];
    for (let i = 0; i < 28; i += 1) {
      motes.push({
        x: rand(0, WORLD.width),
        y: rand(95, 690),
        r: rand(1.1, 3.3),
        speed: rand(4, 16),
        phase: rand(0, Math.PI * 2),
        drift: rand(6, 20),
        alpha: rand(0.12, 0.34),
      });
    }
    return motes;
  }

  /* ================================================================
     UI STATE
  ================================================================ */

  function setMode(mode) {
    state.mode = mode;
    els.root.dataset.mode = mode;
    els.startScreen.setAttribute("aria-hidden", mode === "menu" ? "false" : "true");
    els.howScreen.setAttribute("aria-hidden", mode === "how" ? "false" : "true");
    els.pauseScreen.setAttribute("aria-hidden", mode === "paused" ? "false" : "true");
    els.resultScreen.setAttribute("aria-hidden", mode === "result" ? "false" : "true");
    els.resultScreen.classList.toggle("is-shown", mode === "result");
    if (mode !== "playing") els.canvas.classList.remove("is-dragging");
  }

  function syncSoundUI() {
    els.root.dataset.muted = String(!save.sound);
    $$('[data-action="toggle-sound"]').forEach((button) => {
      button.setAttribute("aria-label", save.sound ? "Mute sound" : "Unmute sound");
      button.setAttribute("aria-pressed", String(!save.sound));
      button.title = save.sound ? "Mute sound (M)" : "Unmute sound (M)";
    });
    $$(".menu-sound-label").forEach((label) => {
      label.textContent = save.sound ? "SOUND ON" : "SOUND OFF";
    });
  }

  function toggleSound() {
    Sound.ensure();
    save.sound = !save.sound;
    persistSave();
    Sound.syncVolume();
    syncSoundUI();
    if (save.sound) Sound.click();
  }

  function updateHud() {
    const level = LEVELS[state.levelIndex];
    if (!level) return;
    els.hudLevelNumber.textContent = pad2(state.levelIndex + 1);
    els.hudLevelName.textContent = level.name;
    els.hudChapter.textContent = level.chapter;
    els.playLevelNumber.textContent = pad2(selectedLevel + 1);
    refreshScore(true);
  }

  function refreshScore(force = false) {
    const value = formatNumber(state.displayScore);
    if (force || els.scoreValue.textContent !== value) els.scoreValue.textContent = value;
  }

  function refreshLevelCards() {
    clearElement(els.levelChoices);
    LEVELS.forEach((level, index) => {
      const unlocked = index < save.unlocked;
      const best = save.best[index] || {};
      const stars = clamp(Number(best.stars) || 0, 0, 3);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "level-card";
      card.dataset.level = String(index);
      card.classList.toggle("is-selected", index === selectedLevel);
      card.classList.toggle("is-locked", !unlocked);
      card.disabled = !unlocked;
      card.setAttribute(
        "aria-label",
        unlocked
          ? `Round ${index + 1}: ${level.name}${stars ? `, ${stars} star${stars > 1 ? "s" : ""}` : ""}`
          : `Round ${index + 1} locked`
      );

      const top = document.createElement("span");
      top.className = "level-card-top";
      const number = document.createElement("span");
      number.className = "level-card-number";
      number.textContent = pad2(index + 1);
      top.append(number);

      if (unlocked) {
        const mini = document.createElement("span");
        mini.className = "mini-stars";
        mini.setAttribute("aria-hidden", "true");
        for (let s = 0; s < 3; s += 1) {
          const star = document.createElement("span");
          star.textContent = "★";
          if (s < stars) star.className = "is-lit";
          mini.append(star);
        }
        top.append(mini);
      } else {
        const lock = document.createElement("span");
        lock.className = "level-card-lock";
        lock.textContent = "LOCKED";
        top.append(lock);
      }

      const name = document.createElement("span");
      name.className = "level-card-name";
      name.textContent = unlocked ? level.name : "Locked";
      const chapter = document.createElement("span");
      chapter.className = "level-card-chapter";
      chapter.textContent = unlocked ? level.chapter : "Clear previous round";
      card.append(top, name, chapter);
      els.levelChoices.append(card);
    });
    els.playLevelNumber.textContent = pad2(selectedLevel + 1);
  }

  function selectLevel(index) {
    if (index < 0 || index >= LEVELS.length || index >= save.unlocked) return;
    selectedLevel = index;
    save.lastLevel = index;
    persistSave();
    Sound.click();
    startLevel(index, { preview: true });
    setMode("menu");
    refreshLevelCards();
  }

  function showLevelIntro() {
    const level = LEVELS[state.levelIndex];
    els.introNumber.textContent = `ROUND ${pad2(state.levelIndex + 1)}`;
    els.introChapter.textContent = level.chapter.toUpperCase();
    els.introName.textContent = level.name;
    els.levelIntro.classList.add("is-visible");
    els.levelIntro.setAttribute("aria-hidden", "false");
    clearTimeout(state.introTimeout);
    state.introTimeout = setTimeout(() => {
      els.levelIntro.classList.remove("is-visible");
      els.levelIntro.setAttribute("aria-hidden", "true");
    }, 1850);
  }

  function showTip(text, duration = 5000) {
    els.tipText.textContent = text;
    els.tipPill.classList.add("is-visible");
    clearTimeout(state.tipTimeout);
    if (duration > 0) state.tipTimeout = setTimeout(hideTip, duration);
  }

  function hideTip() {
    clearTimeout(state.tipTimeout);
    els.tipPill.classList.remove("is-visible");
  }

  function showToast(text, duration = 1900) {
    els.toast.textContent = text;
    els.toast.classList.add("is-visible");
    clearTimeout(state.toastTimeout);
    state.toastTimeout = setTimeout(() => els.toast.classList.remove("is-visible"), duration);
  }

  function hideToast() {
    clearTimeout(state.toastTimeout);
    els.toast.classList.remove("is-visible");
  }

  function updateFlock() {
    const queue = [];
    if (state.loadedBird && !state.loadedBird.game.removed) queue.push(state.loadedBird.game.type);
    state.birds.forEach((type) => queue.push(type));
    const signature = queue.join("|");
    const total = queue.length;

    if (signature !== state.flockSignature) {
      state.flockSignature = signature;
      clearElement(els.birdQueue);
      queue.forEach((type, index) => {
        const def = BIRD_TYPES[type];
        const img = document.createElement("img");
        img.src = ASSET_MANIFEST.birds[def.asset];
        img.alt = def.name;
        img.draggable = false;
        img.style.animationDelay = `${index * 45}ms`;
        img.style.zIndex = String(queue.length - index);
        els.birdQueue.append(img);
      });
      if (state.mode === "playing" && !state.preview && total > 0) {
        els.flockTray.classList.remove("is-bumping");
        void els.flockTray.offsetWidth;
        els.flockTray.classList.add("is-bumping");
      }
    }

    els.flockCount.textContent = `${total} LEFT`;
    els.flockTray.classList.toggle("is-empty", total === 0);
  }

  function updateAbilityPanel() {
    const bird = state.activeBird;
    const g = bird && bird.game;
    const canUse =
      state.mode === "playing" &&
      !state.roundOver &&
      !state.preview &&
      g &&
      !g.removed &&
      g.launched &&
      !g.abilityUsed &&
      Boolean(g.def.ability);

    if (!canUse) {
      els.abilityPanel.classList.remove("is-visible");
      els.abilityPanel.setAttribute("aria-hidden", "true");
      state.shownAbility = false;
      return;
    }

    const kind = g.def.ability;
    if (!state.shownAbility || state.abilityKind !== kind) {
      els.abilityBtn.dataset.kind = kind;
      els.abilityGlyph.innerHTML = ICONS[kind] || "";
      els.abilityTitle.textContent = kind === "bomb" ? "DETONATE" : "BOOST";
      state.abilityKind = kind;
    }
    els.abilityPanel.classList.add("is-visible");
    els.abilityPanel.setAttribute("aria-hidden", "false");
    state.shownAbility = true;
  }

  function clearUiTimers() {
    clearTimeout(state.introTimeout);
    clearTimeout(state.tipTimeout);
    clearTimeout(state.toastTimeout);
    hideTip();
    hideToast();
    els.levelIntro.classList.remove("is-visible");
    els.levelIntro.setAttribute("aria-hidden", "true");
    els.abilityPanel.classList.remove("is-visible");
    els.abilityPanel.setAttribute("aria-hidden", "true");
    state.shownAbility = false;
  }

  /* ================================================================
     ROUND LIFECYCLE
  ================================================================ */

  function startLevel(index, options = {}) {
    const preview = Boolean(options.preview);
    const nextIndex = clamp(index, 0, LEVELS.length - 1);
    Sound.stopWin();
    Sound.stopLose();
    cancelDrag();
    clearUiTimers();

    state.levelIndex = nextIndex;
    if (!preview) {
      save.lastLevel = nextIndex;
      persistSave();
    }

    selectedLevel = nextIndex;
    state.preview = preview;
    state.score = 0;
    state.displayScore = 0;
    state.particles = [];
    state.shockwaves = [];
    state.floaters = [];
    state.explosions = [];
    state.toRemove = [];
    state.trajectory = [];
    state.pigs = [];
    state.blocks = [];
    state.birds = LEVELS[nextIndex].birds.slice();
    state.loadedBird = null;
    state.activeBird = null;
    state.drag = null;
    state.damageEnabled = false;
    state.roundOver = false;
    state.resultDelay = 0;
    state.resultWin = false;
    state.resultShown = false;
    state.nextBirdTimer = 0;
    state.turnActive = false;
    state.settleTimer = 0;
    state.lossTimer = 0;
    state.outTimer = null;
    state.shake = 0;
    state.elapsed = 0;
    state.stats = { pigs: 0, blocks: 0, birdsSaved: 0, shots: 0 };
    state.flockSignature = "";
    state.trailTimer = 0;
    state.scoreBumpCooldown = 0;
    state.scoreBumpQueued = false;
    state.resultDisplayScore = 0;
    state.idleTimer = 0;
    state.currentBirds = LEVELS[nextIndex].birds.length;
    state.motes = makeMotes();

    engine = Engine.create();
    engine.gravity.x = 0;
    engine.gravity.y = GRAVITY_Y;
    engine.gravity.scale = 0.001;
    ground = Bodies.rectangle(
      WORLD.width / 2,
      WORLD.groundY + 95,
      WORLD.width + 600,
      190,
      { isStatic: true, label: "ground", friction: 0.96 }
    );
    ground.game = { kind: "ground" };
    Composite.add(engine.world, ground);
    accumulator = 0;
    attachCollisions();
    LEVELS[nextIndex].build();

    els.resultScreen.classList.remove("is-loss");
    els.resultScreen.classList.remove("is-shown");
    clearElement(els.confetti);
    updateHud();
    refreshScore(true);
    loadNextBird();
    updateFlock();

    if (preview) {
      setMode("menu");
      refreshLevelCards();
    } else {
      setMode("playing");
      showLevelIntro();
      showTip("Grab the bird, pull back, and let go.", 5200);
      refreshLevelCards();
    }
    updateAbilityPanel();
  }

  function loadNextBird() {
    if (!engine || state.roundOver || state.loadedBird) return;
    if (!state.birds.length) {
      updateFlock();
      return;
    }
    const type = state.birds.shift();
    const bird = makeBird(type);
    state.loadedBird = bird;
    state.drag = null;
    state.trajectory = [];
    els.canvas.classList.remove("is-dragging");
    updateFlock();
    updateAbilityPanel();
    if (state.mode === "playing" && !state.preview) {
      showTip(bird.game.def.hint || "Pull back and let go.", 4800);
    }
  }

  function addScore(amount, x, y, color = "#ffd255", text = null) {
    if (!amount) return;
    state.score += amount;
    state.scoreBumpQueued = true;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      addFloater(x, y, text || `+${formatNumber(amount)}`, color);
    }
  }

  /* ================================================================
     PARTICLES + SCORE FEEDBACK
  ================================================================ */

  function addParticle(options) {
    if (state.particles.length > 430) state.particles.shift();
    const life = options.life || 0.7;
    state.particles.push({
      x: options.x,
      y: options.y,
      vx: options.vx || 0,
      vy: options.vy || 0,
      gravity: options.gravity ?? 900,
      drag: options.drag ?? 0.99,
      size: options.size || 4,
      color: options.color || "#fff4dc",
      shape: options.shape || "circle",
      rotation: options.rotation || 0,
      spin: options.spin || 0,
      life,
      maxLife: life,
      fade: options.fade ?? 1,
    });
  }

  function addFloater(x, y, text, color = "#ffd255") {
    if (state.floaters.length > 24) state.floaters.shift();
    state.floaters.push({ x, y, text, color, life: 1.25, maxLife: 1.25, vy: -56 });
  }

  function addShockwave(x, y, maxRadius, duration = 0.5, color = "#fff4dc", width = 6) {
    state.shockwaves.push({ x, y, radius: 8, maxRadius, life: duration, maxLife: duration, color, width });
  }

  function spawnImpactParticles(x, y, amount, material) {
    const count = clamp(Math.round(amount), 0, 16);
    const colors = materialColors(material);
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 240);
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed + rand(-30, 30),
        vy: Math.sin(angle) * speed - rand(30, 140),
        gravity: 880,
        drag: 0.98,
        size: rand(2, 5),
        color: pick(colors),
        shape: Math.random() < 0.5 ? "spark" : "circle",
        rotation: angle,
        spin: rand(-10, 10),
        life: rand(0.26, 0.56),
      });
    }
  }

  function spawnDebris(body, material) {
    const g = body.game;
    const colors = materialColors(material);
    const count = material === "ice" ? 18 : 15;
    for (let i = 0; i < count; i += 1) {
      addParticle({
        x: body.position.x + rand(-g.width * 0.4, g.width * 0.4),
        y: body.position.y + rand(-g.height * 0.4, g.height * 0.4),
        vx: rand(-240, 240),
        vy: rand(-330, 100),
        gravity: 1100,
        drag: 0.985,
        size: rand(3, 9),
        color: pick(colors),
        shape: "rect",
        rotation: rand(0, Math.PI * 2),
        spin: rand(-9, 9),
        life: rand(0.5, 1.15),
      });
    }
    for (let i = 0; i < 5; i += 1) {
      addParticle({
        x: body.position.x + rand(-g.width * 0.4, g.width * 0.4),
        y: body.position.y + rand(-g.height * 0.4, g.height * 0.4),
        vx: rand(-50, 50),
        vy: rand(-80, -20),
        gravity: 60,
        drag: 0.98,
        size: rand(14, 30),
        color: colors[0],
        shape: "puff",
        life: rand(0.45, 0.9),
      });
    }
  }

  function spawnPigPop(body) {
    const g = body.game;
    const x = body.position.x;
    const y = body.position.y;
    for (let i = 0; i < 18; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 270);
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        gravity: 620,
        drag: 0.98,
        size: rand(3, 8),
        color: pick(materialColors("pig")),
        shape: Math.random() < 0.38 ? "spark" : "circle",
        rotation: angle,
        spin: rand(-8, 8),
        life: rand(0.35, 0.82),
      });
    }
    for (let i = 0; i < 6; i += 1) {
      addParticle({
        x: x + rand(-14, 14),
        y: y + rand(-14, 14),
        vx: rand(-26, 26),
        vy: rand(-80, -24),
        gravity: -40,
        drag: 0.98,
        size: rand(16, 30),
        color: "#fff0f4",
        shape: "puff",
        life: rand(0.5, 0.95),
      });
    }
    addShockwave(x, y, g.radius * 2.3, 0.38, "#ffe3ec", 5);
  }

  function spawnFeathers(x, y, color, count = 8) {
    const colors = [color, "#fff4dc", "#efd7a8"];
    for (let i = 0; i < count; i += 1) {
      addParticle({
        x: x + rand(-10, 10),
        y: y + rand(-10, 10),
        vx: rand(-100, 100),
        vy: rand(-130, 10),
        gravity: 360,
        drag: 0.98,
        size: rand(3, 6),
        color: pick(colors),
        shape: "circle",
        life: rand(0.45, 0.95),
      });
    }
  }

  function spawnLaunchDust(x, y) {
    for (let i = 0; i < 8; i += 1) {
      addParticle({
        x: x + rand(-12, 12),
        y: y + rand(-8, 8),
        vx: rand(-70, 20),
        vy: rand(-30, 45),
        gravity: 120,
        drag: 0.97,
        size: rand(6, 15),
        color: "#f4e6c6",
        shape: "puff",
        life: rand(0.35, 0.72),
      });
    }
  }

  function spawnBoostBurst(x, y, color) {
    const colors = [color, "#ffd255", "#fff4dc", "#ff9d43"];
    for (let i = 0; i < 20; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(80, 320);
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed - 150,
        vy: Math.sin(angle) * speed,
        gravity: 120,
        drag: 0.96,
        size: rand(3, 7),
        color: pick(colors),
        shape: "spark",
        rotation: angle,
        spin: rand(-8, 8),
        life: rand(0.3, 0.72),
      });
    }
  }

  function spawnExplosion(x, y, radius) {
    addShockwave(x, y, radius * 1.5, 0.58, "#ffe6a1", 10);
    addShockwave(x, y, radius * 1.05, 0.34, "#ffffff", 5);
    const fire = ["#fff6c9", "#ffe07a", "#ffb54a", "#f47a38", "#d9422b"];
    for (let i = 0; i < 36; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(80, 550);
      addParticle({
        x: x + rand(-10, 10),
        y: y + rand(-10, 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 220,
        drag: 0.965,
        size: rand(4, 15),
        color: pick(fire),
        shape: Math.random() < 0.35 ? "spark" : "circle",
        rotation: angle,
        spin: rand(-10, 10),
        life: rand(0.3, 0.85),
      });
    }
    for (let i = 0; i < 15; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(30, 190);
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        gravity: -90,
        drag: 0.985,
        size: rand(18, 46),
        color: pick(["#6d6258", "#8c8074", "#4d4540", "#b3a696"]),
        shape: "puff",
        life: rand(0.7, 1.6),
      });
    }
    for (let i = 0; i < 16; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(220, 700);
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 520,
        drag: 0.985,
        size: rand(1.5, 3.6),
        color: pick(["#ffe9a8", "#ffd15c", "#fff4dc"]),
        shape: "spark",
        rotation: angle,
        spin: rand(-12, 12),
        life: rand(0.35, 0.8),
      });
    }
  }

  /* ================================================================
     DAMAGE + COLLISIONS
  ================================================================ */

  function damageBody(body, amount, source = "impact") {
    const g = body && body.game;
    if (!g || g.dead || g.removed || g.kind === "ground") return;
    if (!state.damageEnabled || state.preview || amount <= 0) return;
    g.hp -= amount;
    g.hitFlash = Math.max(g.hitFlash, 0.14);
    if (g.kind === "pig") {
      if (amount > 7) Sound.hitPig();
      if (amount > 12) spawnImpactParticles(body.position.x, body.position.y - g.radius * 0.35, Math.min(12, amount * 0.18), "pig");
    }
    if (g.hp <= 0) destroyBody(body);
    else if (source === "explosion") state.shake = Math.max(state.shake, 6);
  }

  function destroyBody(body) {
    const g = body.game;
    if (!g || g.dead) return;
    g.dead = true;
    state.toRemove.push(body);

    if (g.kind === "pig") {
      state.stats.pigs += 1;
      addScore(5000, body.position.x, body.position.y - g.radius - 12, "#ffd255");
      spawnPigPop(body);
      Sound.pigPop();
      state.shake = Math.max(state.shake, 4);
      if (!state.pigs.some((pig) => !pig.game.dead)) winRound();
    } else if (g.kind === "block") {
      const mat = MATERIALS[g.material] || MATERIALS.wood;
      state.stats.blocks += 1;
      addScore(mat.score, body.position.x, body.position.y - 18, "#fff4dc");
      spawnDebris(body, g.material);
      Sound.breakMaterial(g.material);
      state.shake = Math.max(state.shake, g.material === "stone" ? 5 : 3.2);
      if (g.material === "tnt") queueExplosion(body.position.x, body.position.y, 198, 0.03);
    } else if (g.kind === "bird") {
      spawnFeathers(body.position.x, body.position.y, g.def.color, 8);
    }
  }

  function queueExplosion(x, y, radius = 195, delay = 0.05, source = "tnt") {
    state.explosions.push({ x, y, radius, delay, time: delay, source });
  }

  function explodeAt(x, y, radius = 195, source = "bomb") {
    if (source !== "tnt" || !Sound.tntExplosion()) Sound.explosion();
    state.shake = Math.max(state.shake, 21);
    spawnExplosion(x, y, radius);
    const bodies = Composite.allBodies(engine.world).slice();
    for (const body of bodies) {
      const g = body.game;
      if (!g || g.removed || g.dead || g.kind === "ground") continue;
      const dx = body.position.x - x;
      const dy = body.position.y - y;
      const d = Math.hypot(dx, dy);
      if (d > radius) continue;
      const falloff = 1 - clamp(d / radius, 0, 1);
      if (g.kind === "pig") {
        damageBody(body, 230 * (0.32 + falloff), "explosion");
      } else if (g.kind === "block") {
        damageBody(body, 280 * (0.28 + falloff), "explosion");
      }
      const nx = d > 0.001 ? dx / d : 0;
      const ny = d > 0.001 ? dy / d : -1;
      const force = (body.mass || 1) * (0.014 + 0.024 * falloff);
      Body.applyForce(body, body.position, { x: nx * force, y: ny * force - force * 0.35 });
    }
  }

  function updateExplosions(dt) {
    if (!state.explosions.length) return;
    const pending = [];
    for (const explosion of state.explosions) {
      explosion.time -= dt;
      if (explosion.time <= 0) explodeAt(explosion.x, explosion.y, explosion.radius, explosion.source);
      else pending.push(explosion);
    }
    state.explosions = pending;
  }

  function processRemovals() {
    if (!state.toRemove.length) return;
    const batch = state.toRemove.splice(0);
    for (const body of batch) {
      const g = body.game;
      if (!g || g.removed) continue;
      g.removed = true;
      Composite.remove(engine.world, body);
    }
  }

  function removeBodyNow(body) {
    if (!body) return;
    if (body.game) body.game.removed = true;
    Composite.remove(engine.world, body);
  }

  function attachCollisions() {
    Events.on(engine, "collisionStart", (event) => {
      if (!state.damageEnabled || state.preview) return;
      for (const pair of event.pairs) handlePair(pair);
    });
  }

  function pairContact(pair, a, b) {
    const supports = pair.collision && pair.collision.supports;
    if (supports && supports.length) return supports[0];
    return { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 };
  }

  function handlePair(pair) {
    const a = pair.bodyA;
    const b = pair.bodyB;
    const ga = a.game;
    const gb = b.game;
    if (!ga || !gb) return;

    const speed = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
    if (speed < 2.35) return;
    const contact = pairContact(pair, a, b);

    let bird = null;
    let other = null;
    if (ga.kind === "bird" && ga.launched) {
      bird = a;
      other = b;
    } else if (gb.kind === "bird" && gb.launched) {
      bird = b;
      other = a;
    }

    if (bird) {
      const og = other.game;
      if (og.kind === "ground") {
        if (speed > 4.5) {
          Sound.thud(speed);
          spawnImpactParticles(contact.x, contact.y, Math.min(12, speed * 0.5), "ground");
          state.shake = Math.max(state.shake, Math.min(6, speed * 0.22));
        }
        return;
      }

      const def = bird.game.def;
      const base = speed * (3.6 + def.damage * 0.16);
      if (og.kind === "pig") {
        damageBody(other, base * 1.05, "bird");
      } else if (og.kind === "block") {
        const mult =
          og.material === "ice" ? 1.3 : og.material === "stone" ? 0.8 : og.material === "tnt" ? 1.5 : 1.08;
        damageBody(other, base * mult, "bird");
        spawnImpactParticles(contact.x, contact.y, Math.min(14, speed * 0.55), og.material);
        Sound.thud(speed);
      }
      state.shake = Math.max(state.shake, Math.min(12, speed * 0.4));
      return;
    }

    if (ga.kind === "ground" || gb.kind === "ground") {
      const prop = ga.kind === "ground" ? b : a;
      const pg = prop.game;
      if (pg.kind === "pig" && speed > 6.5) {
        damageBody(prop, (speed - 6.5) * 10.5, "ground");
        spawnImpactParticles(contact.x, contact.y, 8, "pig");
      } else if (pg.kind === "block" && speed > 7.2) {
        damageBody(prop, (speed - 7.2) * 6.5, "ground");
      }
      if (speed > 5.5) Sound.thud(speed);
      if (speed > 9) state.shake = Math.max(state.shake, Math.min(5, speed * 0.18));
      return;
    }

    const massFactor = clamp(Math.sqrt(Math.max(a.mass || 1, b.mass || 1)) / 1.25, 0.55, 2.1);
    const base = Math.max(0, speed - 3.1) * 5.2 * massFactor;
    if (ga.kind === "pig") damageBody(a, base * 1.2, "impact");
    if (gb.kind === "pig") damageBody(b, base * 1.2, "impact");
    if (ga.kind === "block") damageBody(a, base, "impact");
    if (gb.kind === "block") damageBody(b, base, "impact");
    if (speed > 6) {
      Sound.thud(speed);
      const material = ga.kind === "block" ? ga.material : gb.kind === "block" ? gb.material : "ground";
      spawnImpactParticles(contact.x, contact.y, Math.min(8, speed * 0.35), material);
    }
    if (speed > 10) state.shake = Math.max(state.shake, Math.min(5, speed * 0.16));
  }

  /* ================================================================
     SLINGSHOT + ABILITIES
  ================================================================ */

  function screenToWorld(clientX, clientY) {
    const rect = els.canvas.getBoundingClientRect();
    const scale = view.scale || 1;
    return {
      x: (clientX - rect.left - view.ox) / scale,
      y: (clientY - rect.top - view.oy) / scale,
    };
  }

  function updateDraggedBird(point) {
    const bird = state.loadedBird;
    if (!bird) return;
    let dx = point.x - SLING.anchor.x;
    let dy = point.y - SLING.anchor.y;
    const length = Math.hypot(dx, dy);
    if (length > SLING.maxPull) {
      const factor = SLING.maxPull / length;
      dx *= factor;
      dy *= factor;
    }
    state.drag.pull = { x: dx, y: dy };
    Body.setPosition(bird, { x: SLING.anchor.x + dx, y: SLING.anchor.y + dy });
    Body.setVelocity(bird, { x: 0, y: 0 });
    Body.setAngularVelocity(bird, 0);
    Body.setAngle(bird, 0);
    updateTrajectory();
  }

  // Predict the launch arc with the exact same per-step Verlet integration
  // Matter uses (air friction applied to the previous displacement, then
  // gravity). A plain `x += vx` arc ignores frictionAir and was overshooting
  // the real landing spot by hundreds of pixels.
  function updateTrajectory() {
    const bird = state.loadedBird;
    const drag = state.drag;
    if (!bird || !drag) {
      state.trajectory = [];
      return;
    }
    const airDrag = 1 - bird.frictionAir;
    const landingY = WORLD.groundY - bird.game.def.radius;
    let vx = -drag.pull.x * SLING.power;
    let vy = -drag.pull.y * SLING.power;
    let x = bird.position.x;
    let y = bird.position.y;
    const points = [];
    for (let step = 1; step <= 180; step += 1) {
      const prevX = x;
      const prevY = y;
      vx *= airDrag;
      vy = vy * airDrag + GRAVITY_ACCEL;
      x += vx;
      y += vy;
      if (y >= landingY && prevY < landingY) {
        // Finish exactly at ground contact so the last dot marks the landing
        // spot instead of disappearing into the grass.
        const t = (landingY - prevY) / (y - prevY);
        points.push({ x: prevX + (x - prevX) * t, y: landingY });
        break;
      }
      if (step % 3 === 0) points.push({ x, y });
      if (x < -160 || x > WORLD.width + 160) break;
    }
    state.trajectory = points;
  }

  function resetLoadedBird() {
    const bird = state.loadedBird;
    els.canvas.classList.remove("is-dragging");
    state.trajectory = [];
    if (!bird) return;
    Body.setPosition(bird, { x: SLING.anchor.x, y: SLING.anchor.y });
    Body.setVelocity(bird, { x: 0, y: 0 });
    Body.setAngle(bird, 0);
  }

  function cancelDrag() {
    const drag = state.drag;
    state.drag = null;
    els.canvas.classList.remove("is-dragging");
    els.canvas.classList.remove("is-grabbable");
    if (drag && els.canvas.hasPointerCapture && els.canvas.hasPointerCapture(drag.pointerId)) {
      try {
        els.canvas.releasePointerCapture(drag.pointerId);
      } catch {
        /* The pointer may already be gone. */
      }
    }
    resetLoadedBird();
  }

  function launchBird(pull) {
    const bird = state.loadedBird;
    if (!bird || !engine) return;
    const def = bird.game.def;
    const length = clamp(Math.hypot(pull.x, pull.y), 0, SLING.maxPull);
    if (length < 6) return;

    Body.setStatic(bird, false);
    Body.setPosition(bird, { x: SLING.anchor.x + pull.x, y: SLING.anchor.y + pull.y });
    Body.setVelocity(bird, { x: -pull.x * SLING.power, y: -pull.y * SLING.power });
    Body.setAngularVelocity(bird, clamp(-pull.x * SLING.power * 0.012, -0.22, 0.22));
    bird.game.launched = true;

    state.loadedBird = null;
    state.activeBird = bird;
    state.trajectory = [];
    state.damageEnabled = true;
    state.turnActive = true;
    state.settleTimer = 0;
    state.lossTimer = 0;
    state.nextBirdTimer = 0;
    state.idleTimer = 0;
    state.trailTimer = 0;
    state.stats.shots += 1;

    Sound.launch(length / SLING.maxPull);
    spawnLaunchDust(bird.position.x, bird.position.y);
    updateFlock();
    updateAbilityPanel();
    showTip(def.ability ? def.hint : "Nice pull. Watch the dominoes fall.", def.ability ? 4800 : 3600);
    state.shake = Math.max(state.shake, 2);
  }

  function useAbility() {
    const bird = state.activeBird;
    if (!bird || state.mode !== "playing" || state.roundOver || state.preview) return;
    const g = bird.game;
    if (!g || g.removed || g.abilityUsed || !g.def.ability) return;
    g.abilityUsed = true;
    Sound.ensure();

    if (g.def.ability === "boost") {
      const speed = Math.max(Math.hypot(bird.velocity.x, bird.velocity.y), 12);
      let nx = bird.velocity.x;
      let ny = bird.velocity.y;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      const target = clamp(speed * 1.75, 26, 40);
      Body.setVelocity(bird, { x: nx * target, y: ny * target - 1.4 });
      Sound.boost();
      state.shake = Math.max(state.shake, 4);
      addFloater(bird.position.x, bird.position.y - 44, "ZOOM!", "#ffd255");
      spawnBoostBurst(bird.position.x, bird.position.y, g.def.color);
    } else if (g.def.ability === "bomb") {
      explodeAt(bird.position.x, bird.position.y, 190);
      spawnFeathers(bird.position.x, bird.position.y, g.def.color, 8);
      removeBodyNow(bird);
      state.shake = Math.max(state.shake, 22);
      showToast("GRUMPY CAT SAID NO.", 1600);
    }

    updateAbilityPanel();
  }

  /* ================================================================
     TURN FLOW + RESULTS
  ================================================================ */

  function endTurn() {
    if (!state.turnActive) return;
    state.turnActive = false;
    state.settleTimer = 0;
    const bird = state.activeBird;
    state.activeBird = null;
    if (bird && !bird.game.removed) {
      spawnFeathers(bird.position.x, bird.position.y, bird.game.def.color, 5);
      removeBodyNow(bird);
    }
    updateAbilityPanel();
    if (state.roundOver) return;

    const pigsLeft = state.pigs.some((pig) => !pig.game.dead);
    if (!pigsLeft) {
      winRound();
      return;
    }

    if (state.birds.length > 0 || state.loadedBird) {
      state.nextBirdTimer = 0.6;
    } else {
      state.lossTimer = 1.7;
      showTip("That was the last bird. Hold your breath…", 3200);
    }
    updateFlock();
  }

  function winRound() {
    if (state.preview) return;
    if (state.roundOver && (state.resultWin || state.resultShown)) return;
    state.roundOver = true;
    state.resultWin = true;
    state.resultDelay = 1.25;
    state.turnActive = false;
    state.nextBirdTimer = 0;
    state.lossTimer = 0;
    state.stats.birdsSaved = state.birds.length + (state.loadedBird ? 1 : 0);
    if (state.stats.birdsSaved > 0) {
      const bonus = state.stats.birdsSaved * 10000;
      state.score += bonus;
      addFloater(SLING.x + 90, 585, `+${formatNumber(bonus)} SAVED`, "#fff4dc");
    }
    showToast("ALL PIGS POPPED!", 1600);
    state.shake = Math.max(state.shake, 6);
  }

  function loseRound() {
    if (state.roundOver) return;
    state.roundOver = true;
    state.resultWin = false;
    state.resultDelay = 1.1;
    state.stats.birdsSaved = 0;
    showToast("THE PIGS SURVIVED!", 1600);
  }

  function buildConfetti(win) {
    clearElement(els.confetti);
    if (!win || prefersReducedMotion) return;
    for (let i = 0; i < 44; i += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${rand(3, 97).toFixed(1)}%`;
      piece.style.background = pick(CONFETTI_COLORS);
      piece.style.animationDuration = `${rand(2.5, 4.6).toFixed(2)}s`;
      piece.style.animationDelay = `${rand(0, 0.7).toFixed(2)}s`;
      piece.style.setProperty("--drift", `${rand(-120, 120).toFixed(0)}px`);
      piece.style.setProperty("--spin", `${rand(360, 900).toFixed(0)}deg`);
      piece.style.width = `${rand(6, 12).toFixed(1)}px`;
      piece.style.height = `${rand(10, 18).toFixed(1)}px`;
      els.confetti.append(piece);
    }
  }

  function showResults(win) {
    if (state.resultShown) return;
    state.resultShown = true;
    state.lastResultWin = win;
    const level = LEVELS[state.levelIndex];
    const previous = save.best[state.levelIndex] || { score: 0, stars: 0 };
    const previousScore = Number(previous.score) || 0;
    const previousStars = Number(previous.stars) || 0;
    const stars = win ? (state.score >= level.star3 ? 3 : state.score >= level.star2 ? 2 : 1) : 0;
    const isNewBest = win && state.score > previousScore;

    save.best[state.levelIndex] = {
      score: Math.max(previousScore, state.score),
      stars: Math.max(previousStars, stars),
    };
    if (win) {
      save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, state.levelIndex + 2));
      save.lastLevel = state.levelIndex + 1 < LEVELS.length ? state.levelIndex + 1 : state.levelIndex;
    } else {
      save.lastLevel = state.levelIndex;
    }
    selectedLevel = save.lastLevel;
    persistSave();
    refreshLevelCards();

    els.resultScreen.classList.toggle("is-loss", !win);
    els.resultRibbon.textContent = win
      ? `ROUND ${pad2(state.levelIndex + 1)} CLEARED`
      : `ROUND ${pad2(state.levelIndex + 1)} OUT OF BIRDS`;
    els.resultEyebrow.textContent = win ? "THE BARN IS SAFE" : "THE PIGS SURVIVED";
    els.resultTitle.textContent = win ? "Pigs popped!" : "Not this time";
    els.resultLine.textContent = win
      ? stars === 3
        ? "A masterpiece of barnyard demolition. The picnic is safe — and stylish."
        : stars === 2
          ? "A solid bit of slingshot chaos. The pigs never stood a chance."
          : "The picnic is safe. Mostly. There is always room for a cleaner run."
      : "The picnic is still missing. Try a different angle — or a much bigger explosion.";

    $$(".result-star", els.resultStars).forEach((star, index) => {
      star.classList.toggle("is-filled", index < stars);
    });
    els.resultScore.textContent = "0";
    state.resultDisplayScore = 0;
    els.bestBadge.classList.toggle("is-visible", isNewBest);
    els.resultPigs.textContent = formatNumber(state.stats.pigs);
    els.resultBlocks.textContent = formatNumber(state.stats.blocks);
    els.resultBirds.textContent = formatNumber(state.stats.birdsSaved);
    els.resultNextBtn.style.display = win ? "" : "none";
    if (win) {
      els.resultNextBtn.textContent = state.levelIndex + 1 < LEVELS.length ? "Next round" : "Back to rounds";
    }
    buildConfetti(win);
    state.scoreBumpQueued = false;
    setMode("result");
    if (win) Sound.win();
    else Sound.lose();
  }

  function pauseGame() {
    if (state.mode !== "playing" || state.roundOver) return;
    cancelDrag();
    setMode("paused");
  }

  function resumeGame() {
    if (state.mode !== "paused") return;
    setMode("playing");
    lastFrame = performance.now();
    accumulator = 0;
  }

  function returnToMenu() {
    cancelDrag();
    startLevel(selectedLevel, { preview: true });
    refreshLevelCards();
    setMode("menu");
  }

  function handleAction(action) {
    switch (action) {
      case "play":
        Sound.ensure();
        Sound.click();
        startLevel(selectedLevel);
        break;
      case "how":
        Sound.ensure();
        Sound.click();
        setMode("how");
        break;
      case "close-how":
        Sound.click();
        setMode("menu");
        break;
      case "toggle-sound":
        toggleSound();
        break;
      case "pause":
        Sound.click();
        pauseGame();
        break;
      case "resume":
        Sound.click();
        resumeGame();
        break;
      case "restart":
        Sound.ensure();
        Sound.click();
        startLevel(state.levelIndex);
        break;
      case "levels":
        Sound.click();
        returnToMenu();
        break;
      case "replay":
        Sound.ensure();
        Sound.click();
        startLevel(state.levelIndex);
        break;
      case "next":
        Sound.click();
        if (state.lastResultWin && state.levelIndex + 1 < LEVELS.length) startLevel(state.levelIndex + 1);
        else returnToMenu();
        break;
      default:
        break;
    }
  }

  /* ================================================================
     RENDERER
  ================================================================ */

  function resizeCanvas() {
    if (!els.canvas) return;
    const rect = els.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || window.innerWidth));
    const height = Math.max(240, Math.round(rect.height || window.innerHeight));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (els.canvas.width !== pixelWidth) els.canvas.width = pixelWidth;
    if (els.canvas.height !== pixelHeight) els.canvas.height = pixelHeight;
    const scale = Math.min(width / WORLD.width, height / WORLD.height);
    view = {
      width,
      height,
      dpr,
      scale,
      ox: (width - WORLD.width * scale) / 2,
      oy: height - WORLD.height * scale,
    };
  }

  function drawBackdrop(width, height) {
    if (art.background.ready) {
      // Scale the art to the full viewport width, then slide it vertically so
      // the painted grass line rests exactly on the physics ground. The image
      // is wider than it is tall, so the area above it is filled with a
      // mirrored continuation of its sky while the extra dirt is cropped
      // below the screen.
      const img = art.background.img;
      const artWidth = img.naturalWidth || img.width;
      const artHeight = img.naturalHeight || img.height;
      const ground = ASSET_MANIFEST.backgroundGround;
      const ratio = typeof ground === "number" ? ground : 0.753;
      const scale = width / artWidth;
      const w = width;
      const h = artHeight * scale;
      const x = 0;
      const groundScreen = view.oy + WORLD.groundY * view.scale;
      const y = groundScreen - ratio * h;
      ctx.drawImage(img, x, y, w, h);
      if (y > 0.5) {
        // Stretch the image's top row upward; this image's top edge is solid
        // sky, so the band is seamless and avoids repeating the gradient.
        ctx.drawImage(img, 0, 0, artWidth, 1, x, 0, w, y);
      }
      return;
    }
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#65c4d1");
    sky.addColorStop(0.38, "#a5e0d7");
    sky.addColorStop(0.68, "#e9e9c4");
    sky.addColorStop(0.88, "#f6d9a6");
    sky.addColorStop(1, "#f3cc92");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    const groundScreen = view.oy + WORLD.groundY * view.scale;
    ctx.fillStyle = "#8bb75e";
    ctx.fillRect(0, groundScreen, width, height - groundScreen);
  }

  function drawMotes() {
    for (const mote of state.motes) {
      const y = mote.y + Math.sin(mote.phase + state.elapsed * 0.7) * mote.drift;
      const alpha = mote.alpha * (0.65 + 0.35 * Math.sin(state.elapsed * 1.6 + mote.phase));
      if (alpha <= 0.01) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fff7cf";
      ctx.beginPath();
      ctx.arc(mote.x, y, mote.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSlingShadow() {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#2c2015";
    ctx.beginPath();
    ctx.ellipse(SLING.x, SLING.baseY + 4, 58, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBand(from, to, front) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const sag = front ? 1.5 : 2.8;
    const midX = (from.x + to.x) / 2 + nx * sag;
    const midY = (from.y + to.y) / 2 + ny * sag + 3;

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#3d2414";
    ctx.lineWidth = front ? 12 : 13;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, midY, to.x, to.y);
    ctx.stroke();
    ctx.strokeStyle = front ? "#7e4f2d" : "#6c4126";
    ctx.lineWidth = front ? 7 : 8;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, midY, to.x, to.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,224,185,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x - 1, from.y - 1);
    ctx.quadraticCurveTo(midX - 1, midY - 1, to.x - 1, to.y - 1);
    ctx.stroke();
    ctx.restore();
  }

  function drawPouch(position) {
    const dx = SLING.anchor.x - position.x;
    const dy = SLING.anchor.y - position.y;
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);
    ctx.fillStyle = "#4a2c1a";
    roundRectPath(ctx, -10, -15, 20, 30, 6);
    ctx.fill();
    ctx.fillStyle = "#6e452a";
    roundRectPath(ctx, -7, -12, 14, 24, 5);
    ctx.fill();
    ctx.restore();
  }

  function drawSlingStructure() {
    const { x, baseY, joint, leftTip, rightTip } = SLING;
    ctx.save();
    ctx.lineCap = "round";

    ctx.fillStyle = "#4a2b17";
    ctx.beginPath();
    ctx.ellipse(x, baseY - 4, 36, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a5833";
    ctx.beginPath();
    ctx.ellipse(x, baseY - 8, 31, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,224,185,0.16)";
    ctx.beginPath();
    ctx.ellipse(x - 6, baseY - 11, 18, 5, -0.12, 0, Math.PI * 2);
    ctx.fill();

    const stroke = (width, color, x1, y1, x2, y2) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    stroke(28, "#3b2212", x, baseY, joint.x, joint.y);
    stroke(19, "#8a5833", x, baseY, joint.x, joint.y);
    stroke(5, "rgba(255,218,165,0.24)", x - 4, baseY - 8, joint.x - 4, joint.y + 8);

    for (const tip of [leftTip, rightTip]) {
      stroke(25, "#3b2212", joint.x, joint.y, tip.x, tip.y);
      stroke(17, "#9c6538", joint.x, joint.y, tip.x, tip.y);
      stroke(4, "rgba(255,218,165,0.24)", joint.x - 3, joint.y - 4, tip.x - 3, tip.y + 3);
      ctx.fillStyle = "#4f2e1a";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b07a4c";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#5a351d";
    ctx.lineWidth = 22;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(x - 10, 690);
    ctx.lineTo(x + 10, 704);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,224,185,0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 7, 692);
    ctx.lineTo(x + 7, 702);
    ctx.stroke();
    ctx.restore();
  }

  function drawCracks(g, width, height) {
    const damage = 1 - clamp(g.hp / g.maxHp, 0, 1);
    if (damage < 0.16) return;
    const lines = damage > 0.62 ? 4 : 2;
    ctx.strokeStyle = "rgba(47,29,15,0.55)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    for (let i = 0; i < lines; i += 1) {
      const px = (seeded(g.seed + i * 3) - 0.5) * width * 0.55;
      const py = (seeded(g.seed + i * 7 + 1) - 0.5) * height * 0.55;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(
        px + (seeded(g.seed + i * 13 + 2) - 0.5) * width * 0.26,
        py + (seeded(g.seed + i * 17 + 3) - 0.5) * height * 0.26
      );
      ctx.lineTo(
        px + (seeded(g.seed + i * 19 + 4) - 0.5) * width * 0.34,
        py + (seeded(g.seed + i * 23 + 5) - 0.4) * height * 0.34
      );
      ctx.stroke();
    }
  }

  function drawBlock(body) {
    const g = body.game;
    const width = g.width;
    const height = g.height;
    let topColor;
    let bottomColor;
    let edgeColor;

    switch (g.material) {
      case "ice":
        topColor = "rgba(223,247,251,0.94)";
        bottomColor = "rgba(139,203,219,0.9)";
        edgeColor = "#6c9fae";
        break;
      case "stone":
        topColor = "#bab4a6";
        bottomColor = "#817c6f";
        edgeColor = "#524e45";
        break;
      case "tnt":
        topColor = "#cc583b";
        bottomColor = "#a33625";
        edgeColor = "#5b2416";
        break;
      default:
        topColor = "#cb9158";
        bottomColor = "#9c6235";
        edgeColor = "#56351e";
        break;
    }

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    const radius = Math.min(8, width * 0.16, height * 0.16);
    const gradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);

    ctx.shadowColor = "rgba(47,30,17,0.18)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = gradient;
    roundRectPath(ctx, -width / 2, -height / 2, width, height, radius);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    ctx.save();
    roundRectPath(ctx, -width / 2 + 2, -height / 2 + 2, width - 4, height - 4, Math.max(2, radius - 2));
    ctx.clip();

    ctx.strokeStyle = "rgba(255,244,220,0.15)";
    ctx.lineWidth = 2;
    roundRectPath(ctx, -width / 2 + 6, -height / 2 + 6, width - 12, height - 12, Math.max(1, radius - 3));
    ctx.stroke();

    if (g.material === "wood") {
      ctx.strokeStyle = "rgba(92,54,26,0.27)";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i += 1) {
        const yy = -height / 2 + height * (0.24 + i * 0.26);
        ctx.beginPath();
        ctx.moveTo(-width / 2 + 4, yy);
        ctx.bezierCurveTo(
          -width * 0.18,
          yy + Math.sin(g.seed + i) * 3,
          width * 0.18,
          yy - Math.cos(g.seed + i) * 3,
          width / 2 - 4,
          yy + 1
        );
        ctx.stroke();
      }
      for (let i = 0; i < 2; i += 1) {
        const kx = (seeded(g.seed + i * 5 + 8) - 0.5) * width * 0.5;
        const ky = (seeded(g.seed + i * 9 + 11) - 0.5) * height * 0.5;
        ctx.strokeStyle = "rgba(88,49,23,0.3)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(kx, ky, 4.5, 2.4, 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (g.material === "ice") {
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 2; i += 1) {
        const xx = -width * 0.18 + i * width * 0.28;
        ctx.beginPath();
        ctx.moveTo(xx, -height * 0.34);
        ctx.lineTo(xx + width * 0.08, -height * 0.12);
        ctx.lineTo(xx - width * 0.02, height * 0.14);
        ctx.stroke();
      }
      for (let i = 0; i < 4; i += 1) {
        const bx = (seeded(g.seed + i * 4) - 0.5) * width * 0.7;
        const by = (seeded(g.seed + i * 6 + 2) - 0.5) * height * 0.7;
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.beginPath();
        ctx.arc(bx, by, 1.4 + seeded(g.seed + i) * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (g.material === "stone") {
      for (let i = 0; i < 11; i += 1) {
        const sx = (seeded(g.seed + i * 3 + 2) - 0.5) * width * 0.8;
        const sy = (seeded(g.seed + i * 5 + 7) - 0.5) * height * 0.8;
        ctx.fillStyle = i % 3 === 0 ? "rgba(238,233,220,0.3)" : "rgba(62,58,50,0.24)";
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + seeded(g.seed + i * 7) * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (g.material === "tnt") {
      const bandY = -height * 0.15;
      ctx.fillStyle = "#f3c949";
      ctx.fillRect(-width / 2 + 3, bandY, width - 6, height * 0.3);
      ctx.fillStyle = "rgba(91,36,22,0.3)";
      ctx.fillRect(-width / 2 + 3, bandY + height * 0.27, width - 6, 2);
      ctx.fillStyle = "#5b2416";
      ctx.font = `900 ${Math.round(Math.min(height * 0.22, width * 0.26))}px "Lilita One", "Nunito", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TNT", 0, bandY + height * 0.15);
    }

    drawCracks(g, width, height);

    if (g.hitFlash > 0) {
      ctx.globalAlpha = Math.min(0.5, g.hitFlash * 3.2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-width / 2, -height / 2, width, height);
    }
    ctx.restore();
    ctx.restore();
  }

  function drawSoftShadow(x, y, radius, alpha = 0.14) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#332516";
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPig(body) {
    const g = body.game;
    const type = PIG_TYPES[g.type] || PIG_TYPES.green;
    const size = g.radius * (type.spriteScale || 2.95);
    const entry = art.pigs[type.asset];
    drawSoftShadow(body.position.x, body.position.y + g.radius * 0.95, g.radius * 1.08, 0.15);

    const filter = g.hitFlash > 0 ? "brightness(1.7) saturate(1.15)" : "none";
    if (!drawSprite(entry, body.position.x, body.position.y, size, size, body.angle, 1, filter)) {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.fillStyle = "#8ec35a";
      ctx.strokeStyle = "#3a2416";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2f2116";
      ctx.beginPath();
      ctx.arc(-g.radius * 0.28, -g.radius * 0.15, g.radius * 0.14, 0, Math.PI * 2);
      ctx.arc(g.radius * 0.28, -g.radius * 0.15, g.radius * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (g.hp < g.maxHp && g.hp > 0) {
      const pct = clamp(g.hp / g.maxHp, 0, 1);
      const barWidth = g.radius * 1.7;
      const barHeight = 5;
      const x = body.position.x - barWidth / 2;
      const y = body.position.y - g.radius * 1.78;
      ctx.save();
      ctx.fillStyle = "rgba(35,24,15,0.55)";
      roundRectPath(ctx, x, y, barWidth, barHeight, barHeight / 2);
      ctx.fill();
      ctx.fillStyle = pct > 0.55 ? "#8fce55" : pct > 0.28 ? "#ffcf57" : "#ef5a3a";
      roundRectPath(ctx, x + 1, y + 1, (barWidth - 2) * pct, barHeight - 2, (barHeight - 2) / 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBird(body) {
    const g = body.game;
    const def = g.def;
    drawSoftShadow(body.position.x, body.position.y + def.radius * 1.02, def.radius * 0.95, g.launched ? 0.12 : 0.16);
    const size = def.radius * 2.95;
    const filter = g.hitFlash > 0 ? "brightness(1.6)" : "none";
    if (!drawSprite(art.birds[def.asset], body.position.x, body.position.y, size, size, body.angle, 1, filter)) {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.fillStyle = def.color;
      ctx.strokeStyle = "#3a2416";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, def.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff8e8";
      ctx.beginPath();
      ctx.arc(-def.radius * 0.3, -def.radius * 0.12, def.radius * 0.19, 0, Math.PI * 2);
      ctx.arc(def.radius * 0.3, -def.radius * 0.12, def.radius * 0.19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2f2116";
      ctx.beginPath();
      ctx.arc(-def.radius * 0.26, -def.radius * 0.12, def.radius * 0.08, 0, Math.PI * 2);
      ctx.arc(def.radius * 0.34, -def.radius * 0.12, def.radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (g.launched && !g.abilityUsed && def.ability && !state.roundOver) {
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.2 * Math.sin(state.elapsed * 8);
      ctx.strokeStyle = def.ability === "bomb" ? "#ff8a5c" : "#ffe066";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, def.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTrajectory() {
    if (!state.drag || !state.loadedBird || state.trajectory.length < 2) return;
    const points = state.trajectory;
    ctx.save();
    ctx.fillStyle = "#fff4dc";
    ctx.strokeStyle = "rgba(64,42,24,0.62)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const t = i / (points.length - 1);
      const radius = lerp(4.4, 2.2, t);
      ctx.globalAlpha = lerp(0.9, 0.34, t);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // A clear landing marker, so the last dot reads as "here" rather than
    // just fading out somewhere above the grass.
    const last = points[points.length - 1];
    const groundContact = WORLD.groundY - state.loadedBird.game.def.radius;
    if (Math.abs(last.y - groundContact) < 0.75) {
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = "rgba(255,244,220,0.45)";
      ctx.strokeStyle = "rgba(64,42,24,0.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(last.x, last.y, 14, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShockwaves() {
    for (const wave of state.shockwaves) {
      const t = 1 - wave.life / wave.maxLife;
      const radius = lerp(6, wave.maxRadius, Math.sqrt(t));
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = Math.max(1, wave.width * (1 - t));
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const t = clamp(particle.life / particle.maxLife, 0, 1);
      const alpha = Math.pow(t, 0.7) * particle.fade;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      if (particle.shape === "rect") {
        const size = particle.size * (0.6 + t * 0.6);
        ctx.fillRect(-size / 2, -size / 3, size, size * 0.66);
      } else if (particle.shape === "puff") {
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * (1.2 - t * 0.3), 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.shape === "spark") {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = Math.max(1.2, particle.size * 0.35);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-particle.size * 1.6, 0);
        ctx.lineTo(particle.size * 1.6, 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * (0.5 + t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFloaters() {
    for (const floater of state.floaters) {
      const t = 1 - floater.life / floater.maxLife;
      const alpha = t < 0.12 ? t / 0.12 : 1 - Math.max(0, (t - 0.62) / 0.38);
      const scale = 0.75 + Math.min(1, t * 7) * 0.25;
      ctx.save();
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.translate(floater.x, floater.y);
      ctx.scale(scale, scale);
      ctx.font = '900 26px "Lilita One", "Nunito", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(58,35,18,0.8)";
      ctx.lineWidth = 6;
      ctx.strokeText(floater.text, 0, 0);
      ctx.fillStyle = floater.color;
      ctx.fillText(floater.text, 0, 0);
      ctx.restore();
    }
  }

  function render() {
    if (!ctx) return;
    const width = view.width;
    const height = view.height;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawBackdrop(width, height);
    if (!engine) return;

    ctx.save();
    const shake = state.shake;
    const shakeX = shake ? rand(-shake, shake) : 0;
    const shakeY = shake ? rand(-shake, shake) : 0;
    ctx.translate(view.ox + shakeX, view.oy + shakeY);
    ctx.scale(view.scale, view.scale);

    drawMotes();

    const target = state.loadedBird
      ? { x: state.loadedBird.position.x, y: state.loadedBird.position.y }
      : { x: SLING.anchor.x, y: SLING.anchor.y + 8 };

    drawSlingShadow();
    if (!state.loadedBird) {
      drawBand(SLING.rightTip, target, false);
      drawBand(SLING.leftTip, target, false);
    } else {
      drawBand(SLING.rightTip, target, false);
    }
    drawSlingStructure();
    if (state.loadedBird) drawPouch(target);

    const entities = [];
    for (const block of state.blocks) {
      if (block.game.dead || block.game.removed) continue;
      entities.push({ body: block, kind: "block", base: block.position.y + block.game.height / 2 });
    }
    for (const pig of state.pigs) {
      if (pig.game.dead || pig.game.removed) continue;
      entities.push({ body: pig, kind: "pig", base: pig.position.y + pig.game.radius });
    }
    if (state.loadedBird && !state.loadedBird.game.removed) {
      entities.push({
        body: state.loadedBird,
        kind: "bird",
        base: state.loadedBird.position.y + state.loadedBird.game.def.radius,
      });
    }
    if (state.activeBird && !state.activeBird.game.removed && !state.activeBird.game.dead) {
      entities.push({
        body: state.activeBird,
        kind: "bird",
        base: state.activeBird.position.y + state.activeBird.game.def.radius,
      });
    }
    entities.sort((a, b) => a.base - b.base);
    for (const entity of entities) {
      if (entity.kind === "block") drawBlock(entity.body);
      else if (entity.kind === "pig") drawPig(entity.body);
      else drawBird(entity.body);
    }

    if (state.loadedBird) drawBand(SLING.leftTip, target, true);
    drawTrajectory();
    drawShockwaves();
    drawParticles();
    drawFloaters();
    ctx.restore();
  }

  /* ================================================================
     UPDATE LOOP
  ================================================================ */

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      particle.vy += particle.gravity * dt;
      const drag = Math.pow(particle.drag, dt * 60);
      particle.vx *= drag;
      particle.vy *= drag;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rotation += particle.spin * dt;
    }
  }

  function updateShockwaves(dt) {
    for (let i = state.shockwaves.length - 1; i >= 0; i -= 1) {
      const wave = state.shockwaves[i];
      wave.life -= dt;
      if (wave.life <= 0) state.shockwaves.splice(i, 1);
    }
  }

  function updateFloaters(dt) {
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const floater = state.floaters[i];
      floater.life -= dt;
      floater.y += floater.vy * dt;
      floater.vy *= 0.985;
      if (floater.life <= 0) state.floaters.splice(i, 1);
    }
  }

  function updateVisuals(dt) {
    const live = state.mode !== "paused" && state.mode !== "result";
    state.elapsed += dt;

    const scoreDiff = state.score - state.displayScore;
    if (Math.abs(scoreDiff) < 0.6) state.displayScore = state.score;
    else state.displayScore += scoreDiff * Math.min(1, dt * 9);
    refreshScore();

    if (state.scoreBumpQueued && state.scoreBumpCooldown <= 0) {
      state.scoreBumpQueued = false;
      state.scoreBumpCooldown = 0.22;
      els.scoreChip.classList.remove("is-bumping");
      void els.scoreChip.offsetWidth;
      els.scoreChip.classList.add("is-bumping");
    }
    if (state.scoreBumpCooldown > 0) state.scoreBumpCooldown -= dt;

    if (state.mode === "result") {
      const resultDiff = state.score - state.resultDisplayScore;
      if (Math.abs(resultDiff) < 1) state.resultDisplayScore = state.score;
      else state.resultDisplayScore += resultDiff * Math.min(1, dt * 9);
      els.resultScore.textContent = formatNumber(state.resultDisplayScore);
    }

    if (!live) return;
    state.shake *= Math.pow(0.0025, dt);
    if (state.shake < 0.18) state.shake = 0;

    for (const body of state.blocks) {
      if (body.game.hitFlash > 0) body.game.hitFlash = Math.max(0, body.game.hitFlash - dt);
    }
    for (const body of state.pigs) {
      if (body.game.hitFlash > 0) body.game.hitFlash = Math.max(0, body.game.hitFlash - dt);
    }
    for (const mote of state.motes) {
      mote.x += mote.speed * dt;
      if (mote.x > WORLD.width + 24) mote.x = -24;
    }

    updateParticles(dt);
    updateShockwaves(dt);
    updateFloaters(dt);

    const bird = state.activeBird;
    if (bird && !bird.game.removed && bird.game.launched) {
      const speed = Math.hypot(bird.velocity.x, bird.velocity.y);
      if (speed > 7) {
        state.trailTimer -= dt;
        if (state.trailTimer <= 0) {
          state.trailTimer = 0.055;
          addParticle({
            x: bird.position.x + rand(-6, 6),
            y: bird.position.y + rand(-6, 6),
            vx: -bird.velocity.x * 8 + rand(-20, 20),
            vy: -bird.velocity.y * 8 + rand(-20, 20),
            gravity: 120,
            drag: 0.97,
            size: rand(2, 5),
            color:
              bird.game.def.ability === "boost"
                ? pick(["#ffd255", "#ffae43", "#fff4dc"])
                : "#fff4dc",
            shape: "circle",
            life: rand(0.25, 0.5),
          });
        }
      }
    }
  }

  function updateTurnLogic(dt) {
    if (state.mode !== "playing" || state.preview) return;

    for (const pig of state.pigs) {
      const g = pig.game;
      if (g.dead || g.removed) continue;
      if (
        pig.position.y > WORLD.height + 120 ||
        pig.position.x < -450 ||
        pig.position.x > WORLD.width + 450
      ) {
        destroyBody(pig);
      }
    }
    for (const block of state.blocks) {
      const g = block.game;
      if (g.dead || g.removed) continue;
      if (
        block.position.y > WORLD.height + 420 ||
        block.position.x < -620 ||
        block.position.x > WORLD.width + 620
      ) {
        removeBodyNow(block);
      }
    }

    if (state.turnActive && !state.roundOver) {
      const bird = state.activeBird;
      let finished = false;
      if (!bird || bird.game.removed) {
        finished = true;
      } else {
        if (!Number.isFinite(bird.position.x) || !Number.isFinite(bird.position.y)) {
          finished = true;
        } else {
          const speed = Math.hypot(bird.velocity.x, bird.velocity.y);
          if (speed < 0.65) state.settleTimer += dt;
          else state.settleTimer = 0;
          if (state.settleTimer > 1.05) finished = true;
          if (
            bird.position.x < -280 ||
            bird.position.x > WORLD.width + 280 ||
            bird.position.y > WORLD.height + 140
          ) {
            finished = true;
          }
        }
      }
      if (finished) endTurn();
    }

    if (state.nextBirdTimer > 0 && !state.roundOver) {
      state.nextBirdTimer -= dt;
      if (state.nextBirdTimer <= 0) {
        state.nextBirdTimer = 0;
        loadNextBird();
      }
    }

    if (state.lossTimer > 0 && !state.roundOver) {
      state.lossTimer -= dt;
      if (state.lossTimer <= 0) {
        state.lossTimer = 0;
        if (!state.pigs.some((pig) => !pig.game.dead)) winRound();
        else loseRound();
      }
    }

    if (state.roundOver && state.resultDelay > 0) {
      state.resultDelay -= dt;
      if (state.resultDelay <= 0) {
        state.resultDelay = 0;
        showResults(state.resultWin);
      }
    }

    if (!state.roundOver && !state.turnActive && state.loadedBird && !state.drag) {
      state.idleTimer += dt;
      if (state.idleTimer > 14) {
        state.idleTimer = 0;
        showTip(state.loadedBird.game.def.hint || "Pull the bird back and let go.", 4000);
      }
    } else {
      state.idleTimer = 0;
    }
  }

  function stepPhysics() {
    if (!engine) return;
    Engine.update(engine, FIXED_STEP);
    processRemovals();
    updateExplosions(FIXED_STEP / 1000);
    processRemovals();
  }

  function frame(now) {
    const raw = clamp(now - lastFrame, 0, 60);
    lastFrame = now;
    const dt = raw / 1000;
    // Menu previews are deliberately frozen so an idle menu cannot slowly
    // topple the scene it is showcasing. Motes and UI effects still animate.
    const physicsLive = engine && state.mode === "playing";

    if (physicsLive) {
      accumulator += raw;
      let steps = 0;
      while (accumulator >= FIXED_STEP && steps < 5) {
        stepPhysics();
        accumulator -= FIXED_STEP;
        steps += 1;
      }
      if (steps === 5) accumulator = 0;
    } else {
      accumulator = 0;
    }

    updateVisuals(dt);
    updateTurnLogic(dt);
    render();
    requestAnimationFrame(frame);
  }

  /* ================================================================
     INPUT + EVENTS
  ================================================================ */

  function onPointerDown(event) {
    if (state.mode !== "playing" || state.roundOver || event.button > 0) return;
    Sound.ensure();

    const active = state.activeBird;
    if (
      active &&
      !active.game.removed &&
      active.game.def.ability &&
      !active.game.abilityUsed
    ) {
      event.preventDefault();
      useAbility();
      return;
    }

    if (!state.loadedBird) return;
    const point = screenToWorld(event.clientX, event.clientY);
    const bird = state.loadedBird;
    const grabRadius = Math.max(84, bird.game.def.radius * 3.1);
    if (distance(point, bird.position) > grabRadius) return;

    event.preventDefault();
    state.drag = { pointerId: event.pointerId, pull: { x: 0, y: 0 } };
    state.idleTimer = 0;
    els.canvas.classList.add("is-dragging");
    els.canvas.classList.remove("is-grabbable");
    if (els.canvas.setPointerCapture) {
      try {
        els.canvas.setPointerCapture(event.pointerId);
      } catch {
        /* Older browsers can miss this. */
      }
    }
    updateDraggedBird(point);
    hideTip();
    els.canvas.focus({ preventScroll: true });
  }

  function onPointerMove(event) {
    if (state.drag) {
      if (event.pointerId !== state.drag.pointerId) return;
      event.preventDefault();
      updateDraggedBird(screenToWorld(event.clientX, event.clientY));
      return;
    }
    if (state.mode !== "playing" || state.roundOver || !state.loadedBird) {
      els.canvas.classList.remove("is-grabbable");
      return;
    }
    const point = screenToWorld(event.clientX, event.clientY);
    const grabRadius = Math.max(84, state.loadedBird.game.def.radius * 3.1);
    els.canvas.classList.toggle("is-grabbable", distance(point, state.loadedBird.position) <= grabRadius);
  }

  function onPointerUp(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    event.preventDefault();
    const pull = { x: state.drag.pull.x, y: state.drag.pull.y };
    const pointerId = state.drag.pointerId;
    state.drag = null;
    els.canvas.classList.remove("is-dragging");
    if (els.canvas.hasPointerCapture && els.canvas.hasPointerCapture(pointerId)) {
      try {
        els.canvas.releasePointerCapture(pointerId);
      } catch {
        /* Ignore a pointer that vanished. */
      }
    }
    if (Math.hypot(pull.x, pull.y) < 22) {
      resetLoadedBird();
      return;
    }
    launchBird(pull);
  }

  function onPointerCancel() {
    cancelDrag();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
      if (!target) return;
      event.preventDefault();
      handleAction(target.dataset.action);
    });

    els.levelChoices.addEventListener("click", (event) => {
      const card = event.target instanceof Element ? event.target.closest(".level-card") : null;
      if (!card || card.disabled) return;
      selectLevel(Number(card.dataset.level));
    });

    els.abilityBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      useAbility();
    });

    els.canvas.addEventListener("pointerdown", onPointerDown);
    els.canvas.addEventListener("pointermove", onPointerMove);
    els.canvas.addEventListener("pointerup", onPointerUp);
    els.canvas.addEventListener("pointercancel", onPointerCancel);
    els.canvas.addEventListener("pointerleave", () => {
      if (!state.drag) els.canvas.classList.remove("is-grabbable");
    });

    window.addEventListener("keydown", (event) => {
      if (event.repeat) return;
      const tag = event.target && event.target.tagName;
      if (tag && /INPUT|TEXTAREA|SELECT/.test(tag)) return;

      if (event.code === "Space") {
        if (state.mode === "playing") {
          event.preventDefault();
          if (
            state.activeBird &&
            state.activeBird.game.def.ability &&
            !state.activeBird.game.abilityUsed
          ) {
            useAbility();
          }
        } else if (state.mode === "menu") {
          event.preventDefault();
          handleAction("play");
        }
        return;
      }

      if (event.key === "p" || event.key === "P" || event.key === "Escape") {
        if (state.mode === "playing") {
          event.preventDefault();
          pauseGame();
        } else if (state.mode === "paused") {
          event.preventDefault();
          resumeGame();
        } else if (state.mode === "how") {
          event.preventDefault();
          setMode("menu");
        }
        return;
      }

      if (event.key === "r" || event.key === "R") {
        if (["playing", "paused", "result"].includes(state.mode)) {
          event.preventDefault();
          handleAction("restart");
        }
        return;
      }

      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        toggleSound();
      }
    });

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 120));

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(resizeCanvas);
      observer.observe(els.root);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.mode === "playing") pauseGame();
      lastFrame = performance.now();
    });
  }

  function boot() {
    ctx = els.canvas.getContext("2d");
    if (!ctx) {
      els.root.innerHTML =
        '<div style="position:fixed;inset:0;display:grid;place-items:center;padding:32px;background:#162216;color:#fff4dc;font:700 18px/1.5 Nunito,sans-serif;text-align:center;">This browser could not open a 2D canvas. Please try a newer browser.</div>';
      return;
    }
    resizeCanvas();
    bindEvents();
    syncSoundUI();
    refreshLevelCards();
    startLevel(selectedLevel, { preview: true });
    setMode("menu");
    refreshLevelCards();
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  }

  boot();
})();
