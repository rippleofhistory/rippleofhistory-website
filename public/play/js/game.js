(() => {
  "use strict";

  const VW = 480;
  const VH = 270;
  const GROUND = 226;
  const LEVEL_W = 5400;
  const MAX_ENEMIES = 6;
  const GRAVITY = 0.32;
  const MAX_LIVES = 5;
  const LIVES_FLOOR = 3;
  const SAVE_KEY = "roh.save";
  const BOARD_KEY = "roh.board";

  const ERA_LABEL = ROH.ERA_LABEL;
  const AQUA = ROH.AQUA;
  const AQUA_STEPS = ROH.AQUA_STEPS;
  const GATE_X = ROH.GATE_X;
  const HALL = ROH.HALL;
  const CART_X = ROH.CART_X;
  const COURT = ROH.COURT;
  const NEST_X = ROH.NEST_X;
  const JEEP_X = ROH.JEEP_X;
  const TANK_X = ROH.TANK_X;
  const NEST_RUBBLE = ROH.NEST_RUBBLE;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const screens = {
    title: document.getElementById("title-screen"),
    how: document.getElementById("how-screen"),
    eras: document.getElementById("era-screen"),
    pause: document.getElementById("pause-screen"),
    dead: document.getElementById("dead-screen"),
    win: document.getElementById("win-screen"),
    board: document.getElementById("board-screen"),
    load: document.getElementById("load-screen"),
  };

  const SPR = {};
  const FILES = {
    "kael-idle": "assets/kael-idle.jpg",
    "kael-run": "assets/kael-run.jpg",
    "kael-attack": "assets/kael-attack.jpg",
    "kael-heavy": "assets/kael-heavy.jpg",
    "kael-jump": "assets/kael-jump.jpg",
    "kael-block": "assets/kael-block.jpg",
    "kael-hurt": "assets/kael-hurt.jpg",
    "kael-death": "assets/kael-death.jpg",
    infantry: "assets/infantry.jpg",
    slinger: "assets/slinger.jpg",
    elephant: "assets/elephant.jpg",
    boss: "assets/boss.jpg",
    hourglass: "assets/hourglass.jpg",
    plus: "assets/plus.jpg",
    flag: "assets/flag.jpg",
    door: "assets/door.jpg",
    ground: "assets/ground.jpg",
    "kael2-idle": "assets/kael2-idle.jpg",
    "kael2-run": "assets/kael2-run.jpg",
    "kael2-attack": "assets/kael2-attack.jpg",
    "kael2-heavy": "assets/kael2-heavy.jpg",
    "kael2-jump": "assets/kael2-jump.jpg",
    "kael2-block": "assets/kael2-block.jpg",
    "kael2-hurt": "assets/kael2-hurt.jpg",
    "kael2-death": "assets/kael2-death.jpg",
    legionary: "assets/legionary.jpg",
    archer: "assets/archer.jpg",
    horse: "assets/horse.jpg",
    centurion: "assets/centurion.jpg",
    road: "assets/road.jpg",
    brick: "assets/brick.jpg",
    "kael3-idle": "assets/kael3-idle.jpg",
    "kael3-run": "assets/kael3-run.jpg",
    "kael3-attack": "assets/kael3-attack.jpg",
    "kael3-heavy": "assets/kael3-heavy.jpg",
    "kael3-jump": "assets/kael3-jump.jpg",
    "kael3-block": "assets/kael3-block.jpg",
    "kael3-hurt": "assets/kael3-hurt.jpg",
    "kael3-death": "assets/kael3-death.jpg",
    manatarms: "assets/manatarms.jpg",
    crossbow: "assets/crossbow.jpg",
    knight: "assets/knight.jpg",
    baron: "assets/baron.jpg",
    horse3: "assets/horse3.jpg",
    gate: "assets/gate.jpg",
    mud: "assets/mud.jpg",
    palisade: "assets/palisade.jpg",
    keep: "assets/keep.jpg",
    "kael4-idle": "assets/kael4-idle.jpg",
    "kael4-run": "assets/kael4-run.jpg",
    "kael4-attack": "assets/kael4-attack.jpg",
    "kael4-heavy": "assets/kael4-heavy.jpg",
    "kael4-jump": "assets/kael4-jump.jpg",
    "kael4-block": "assets/kael4-block.jpg",
    "kael4-hurt": "assets/kael4-hurt.jpg",
    "kael4-death": "assets/kael4-death.jpg",
    lineinf: "assets/lineinf.jpg",
    lancer: "assets/lancer.jpg",
    powder: "assets/powder.jpg",
    cart: "assets/cart.jpg",
    cannon: "assets/cannon.jpg",
    snow: "assets/snow.jpg",
    "kael5-idle": "assets/kael5-idle.jpg",
    "kael5-run": "assets/kael5-run.jpg",
    "kael5-attack": "assets/kael5-attack.jpg",
    "kael5-heavy": "assets/kael5-heavy.jpg",
    "kael5-jump": "assets/kael5-jump.jpg",
    "kael5-block": "assets/kael5-block.jpg",
    "kael5-hurt": "assets/kael5-hurt.jpg",
    "kael5-death": "assets/kael5-death.jpg",
    rifleinf: "assets/rifleinf.jpg",
    mgnest: "assets/mgnest.jpg",
    armorcar: "assets/armorcar.jpg",
    jeep: "assets/jeep.jpg",
    colonel: "assets/colonel.jpg",
    cobble: "assets/cobble.jpg",
    staffcar: "assets/staffcar.jpg",
    "kael6-idle": "assets/kael6-idle.jpg",
    "kael6-run": "assets/kael6-run.jpg",
    "kael6-attack": "assets/kael6-attack.jpg",
    "kael6-heavy": "assets/kael6-heavy.jpg",
    "kael6-jump": "assets/kael6-jump.jpg",
    "kael6-block": "assets/kael6-block.jpg",
    "kael6-hurt": "assets/kael6-hurt.jpg",
    "kael6-death": "assets/kael6-death.jpg",
    modinf: "assets/modinf.jpg",
    ifv: "assets/ifv.jpg",
    tank: "assets/tank.jpg",
    wreck: "assets/wreck.jpg",
    fracture: "assets/fracture.jpg",
    concrete: "assets/concrete.jpg",
  };

  const keys = new Set();
  const pad = { left: false, right: false, jump: false, light: false, heavy: false, block: false, mount: false, roll: false };
  const tap = { jump: false, light: false, heavy: false, mount: false, roll: false };

  let mode = "title";
  let era = 1;
  let warpT = 0;
  let warpTo = 2;
  let horse = null;
  let ledges = [];
  let villaX = 0;
  let gateCleared = false;
  let rain = [];
  let muds = [];
  let cannons = [];
  let snows = [];
  let searchlights = [];
  let nestCleared = false;
  let wrecks = [];
  let droneT = 0;
  let ending = false;
  let pits = [];
  let stains = [];
  let hurtFlash = 0;
  let unlocked = 1;
  let maxLives = LIVES_FLOOR;
  let muted = false;
  let lifeDamaged = false;
  let gp = { left: false, right: false, jump: false, light: false, heavy: false, block: false, jumpHeld: false, lightHeld: false, heavyHeld: false, rollHeld: false };
  let camX = 0;
  let shake = 0;
  let shakeDecay = 0.82;
  let hitstop = 0;
  let time = 0;
  let introT = 0;
  let perfLow = false;
  let perfHits = 0;
  let windOn = false;
  let banner = { text: "", t: 0 };
  let checkpoint = 80;
  let doorOpen = false;
  let elephantCleared = false;
  let bossCleared = false;
  let lock = null;
  let spawned = 0;

  const player = {};
  const enemies = [];
  const shots = [];
  const sparks = [];
  const sparkPool = [];
  const floats = [];
  const pickups = [];
  const flags = [];
  const spawns = [];
  let door = { x: 5080, y: GROUND, taken: false };

  let actx = null;
  let master = null;
  let windNode = null;

  function show(el) { el.classList.add("active"); }
  function hide(el) { el.classList.remove("active"); }
  function hideAllPlay() {
    hide(screens.pause);
    hide(screens.dead);
    hide(screens.win);
    hide(screens.how);
    if (screens.eras) hide(screens.eras);
    if (screens.board) hide(screens.board);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function keyGreen(img, isTile) {
    const w = img.width;
    const h = img.height;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    if (isTile) return { canvas: c, w, h };
    const data = x.getImageData(0, 0, w, h);
    const p = data.data;
    let minx = w, miny = h, maxx = 0, maxy = 0;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], g = p[i + 1], b = p[i + 2];
      if (g > 92 && g > r + 28 && g > b + 28 && r < 190 && b < 190) {
        p[i + 3] = 0;
        continue;
      }
      if (g > r + 10 && g > b + 10) p[i + 1] = Math.max(r, b) + 4;
      const px = (i / 4) % w;
      const py = (i / 4 / w) | 0;
      if (px < minx) minx = px;
      if (py < miny) miny = py;
      if (px > maxx) maxx = px;
      if (py > maxy) maxy = py;
    }
    x.putImageData(data, 0, 0);
    if (maxx <= minx) return { canvas: c, w, h, anchor: 0.5 };
    const pad = 2;
    minx = Math.max(0, minx - pad);
    miny = Math.max(0, miny - pad);
    maxx = Math.min(w - 1, maxx + pad);
    maxy = Math.min(h - 1, maxy + pad);
    const cw = maxx - minx + 1;
    const ch = maxy - miny + 1;
    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    const ox = out.getContext("2d");
    ox.drawImage(c, minx, miny, cw, ch, 0, 0, cw, ch);
    const id = ox.getImageData(0, 0, cw, ch).data;
    const y0 = Math.floor(ch * 0.78);
    let sx = 0, n = 0;
    for (let y = y0; y < ch; y++) {
      for (let px = 0; px < cw; px++) {
        if (id[(y * cw + px) * 4 + 3] > 18) { sx += px; n++; }
      }
    }
    return { canvas: out, w: cw, h: ch, anchor: n ? sx / n / cw : 0.5 };
  }

  function downscale(spr, maxH) {
    if (!spr || spr.h <= maxH) return spr;
    const scale = maxH / spr.h;
    const w = Math.max(1, Math.round(spr.w * scale));
    const h = maxH;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = true;
    x.drawImage(spr.canvas, 0, 0, w, h);
    return { canvas: c, w, h, anchor: spr.anchor };
  }

  function outlineSprite(spr, rgb) {
    const w = spr.w, h = spr.h;
    const src = spr.canvas.getContext("2d").getImageData(0, 0, w, h);
    const s = src.data;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    const dst = x.createImageData(w, h);
    const d = dst.data;
    const [or, og, ob] = rgb || [12, 4, 10];
    const opaque = (i) => s[i + 3] > 18;
    for (let y = 0; y < h; y++) {
      for (let px = 0; px < w; px++) {
        const i = (y * w + px) * 4;
        if (opaque(i)) {
          d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = s[i + 3];
          continue;
        }
        let edge = false;
        for (let oy = -1; oy <= 1 && !edge; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const nx = px + ox, ny = y + oy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (opaque((ny * w + nx) * 4)) { edge = true; break; }
          }
        }
        if (edge) {
          d[i] = or; d[i + 1] = og; d[i + 2] = ob; d[i + 3] = 230;
        }
      }
    }
    x.putImageData(dst, 0, 0);
    return { canvas: c, w, h, anchor: spr.anchor };
  }

  function boostKaelScarf(spr) {
    const w = spr.w, h = spr.h;
    const x = spr.canvas.getContext("2d");
    const img = x.getImageData(0, 0, w, h);
    const p = img.data;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 18) continue;
      const r = p[i], g = p[i + 1], b = p[i + 2];
      if (r > 145 && g < 82 && b < 88 && r > g + 75 && r > b + 65) {
        const lift = (r - 145) / 110;
        p[i] = 255;
        p[i + 1] = Math.max(22, Math.min(64, 30 + lift * 32));
        p[i + 2] = Math.max(52, Math.min(92, 62 + lift * 24));
      }
    }
    x.putImageData(img, 0, 0);
    return spr;
  }

  function applyMarbleCrack(spr, seed) {
    const w = spr.w, h = spr.h;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    x.drawImage(spr.canvas, 0, 0);
    const img = x.getImageData(0, 0, w, h);
    const p = img.data;
    for (let i = 0, n = 0; i < p.length; i += 4, n++) {
      if (p[i + 3] < 18) continue;
      const xx = n % w, yy = (n / w) | 0;
      const r = p[i], g = p[i + 1], b = p[i + 2];
      const l = r * 0.32 + g * 0.5 + b * 0.18;
      p[i] = Math.min(255, r * 0.38 + l * 0.62 + 38);
      p[i + 1] = Math.min(255, g * 0.34 + l * 0.58 + 36);
      p[i + 2] = Math.min(255, b * 0.36 + l * 0.64 + 48);
      const veinA = Math.abs((xx * 3 + yy * 7 + seed * 13) % 53) < 2;
      const veinB = Math.abs((xx * 5 - yy * 4 + seed * 9) % 71) < 1;
      const jag = Math.abs(Math.sin(xx * 0.19 + seed) + Math.cos(yy * 0.27 + xx * 0.04));
      if (veinA || veinB || jag < 0.08) {
        p[i] = 232; p[i + 1] = 196; p[i + 2] = 92;
      } else if (jag < 0.16) {
        p[i] = Math.min(255, p[i] + 18);
        p[i + 1] = Math.min(255, p[i + 1] + 8);
        p[i + 2] = Math.max(0, p[i + 2] - 6);
      }
    }
    x.putImageData(img, 0, 0);
    return { canvas: c, w, h, anchor: spr.anchor };
  }

  function makeCrackStamp() {
    const c = document.createElement("canvas");
    c.width = 48;
    c.height = 64;
    const x = c.getContext("2d");
    x.strokeStyle = "rgba(230, 195, 92, 0.85)";
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(22, 4);
    x.lineTo(18, 18);
    x.lineTo(26, 30);
    x.lineTo(16, 44);
    x.lineTo(24, 60);
    x.moveTo(22, 20);
    x.lineTo(32, 28);
    x.moveTo(18, 36);
    x.lineTo(10, 48);
    x.stroke();
    return c;
  }

  async function loadAll() {
    const entries = Object.entries(FILES);
    await Promise.all(entries.map(async ([name, src]) => {
      const img = await loadImage(src);
      const isTile = name === "ground" || name === "road" || name === "brick" || name === "mud" || name === "palisade" || name === "keep" || name === "snow" || name === "cobble" || name === "concrete";
      let spr = keyGreen(img, isTile);
      if (name.indexOf("kael") === 0) {
        spr = outlineSprite(boostKaelScarf(spr), [10, 2, 8]);
        spr = downscale(spr, 128);
      } else if (name === "infantry" || name === "slinger" || name === "legionary" || name === "archer") {
        const seed = name === "slinger" ? 17 : name === "archer" ? 29 : name === "legionary" ? 11 : 4;
        spr = applyMarbleCrack(spr, seed);
        spr = outlineSprite(spr, [28, 24, 36]);
        spr = downscale(spr, 120);
      } else if (name === "manatarms" || name === "crossbow") {
        const seed = name === "crossbow" ? 41 : 37;
        spr = applyMarbleCrack(spr, seed);
        spr = outlineSprite(spr, [18, 16, 22]);
        spr = downscale(spr, 120);
      } else if (name === "knight") {
        spr = outlineSprite(spr, [12, 10, 16]);
        spr = downscale(spr, 140);
      } else if (name === "elephant") {
        spr = downscale(spr, 160);
      } else if (name === "boss" || name === "centurion" || name === "baron" || name === "powder" || name === "colonel" || name === "fracture") {
        spr = downscale(spr, 168);
      } else if (name === "modinf") {
        spr = outlineSprite(spr, [14, 12, 18]);
        spr = downscale(spr, 120);
      } else if (name === "ifv" || name === "tank" || name === "wreck") {
        spr = downscale(spr, name === "tank" ? 160 : 140);
      } else if (name === "rifleinf") {
        spr = outlineSprite(spr, [16, 14, 20]);
        spr = downscale(spr, 120);
      } else if (name === "mgnest") {
        spr = downscale(spr, 140);
      } else if (name === "armorcar" || name === "staffcar") {
        spr = downscale(spr, 150);
      } else if (name === "jeep") {
        spr = outlineSprite(spr, [14, 12, 16]);
        spr = downscale(spr, 130);
      } else if (name === "lineinf") {
        spr = outlineSprite(spr, [16, 14, 20]);
        spr = downscale(spr, 120);
      } else if (name === "lancer") {
        spr = outlineSprite(spr, [16, 14, 20]);
        spr = downscale(spr, 150);
      } else if (name === "horse" || name === "horse3" || name === "cart") {
        spr = outlineSprite(spr, [18, 14, 22]);
        spr = downscale(spr, name === "cart" ? 140 : 110);
      } else if (name === "cannon") {
        spr = downscale(spr, 90);
      } else if (name === "gate") {
        spr = downscale(spr, 180);
      } else if (name === "flag" || name === "door") {
        spr = downscale(spr, 140);
      } else if (name === "hourglass" || name === "plus") {
        spr = downscale(spr, 64);
      } else if (isTile) {
        spr = downscale(spr, 128);
      }
      SPR[name] = spr;
    }));
    SPR.crackStamp = makeCrackStamp();
  }

  function audioInit() {
    if (actx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = muted ? 0 : 0.22;
    master.connect(actx.destination);
    applyMute();
    if (ROH.musicStart) ROH.musicStart(actx, master, mode === "play" ? era : "intro");
  }

  function tone(freq, dur, type, vol, slide) {
    if (!actx) return;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, actx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, actx.currentTime + dur);
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g);
    g.connect(master);
    o.start();
    o.stop(actx.currentTime + dur + 0.02);
  }

  function noiseBurst(dur, vol, hp) {
    if (!actx) return;
    const n = actx.createBuffer(1, actx.sampleRate * dur, actx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource();
    src.buffer = n;
    const f = actx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = hp || 1800;
    f.Q.value = 0.7;
    const g = actx.createGain();
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start();
  }

  function sfx(kind) {
    if (!actx) return;
    if (kind === "swing") {
      const gun = era >= 4 && player.kind === "heavy";
      if (gun) {
        noiseBurst(0.09, 0.34, 2400);
        tone(880, 0.05, "square", 0.05, 220);
      } else {
        noiseBurst(0.1, 0.26, 1100);
        tone(player.kind === "heavy" ? 260 : 480, 0.08, "sawtooth", 0.05, 140);
      }
    } else if (kind === "hit") {
      noiseBurst(0.12, 0.38, 700);
      tone(140, 0.12, "sawtooth", 0.1, 48);
      tone(90, 0.16, "triangle", 0.05, 40);
    } else if (kind === "hurt") {
      tone(160, 0.16, "sawtooth", 0.07, 60);
      noiseBurst(0.12, 0.2, 400);
    } else if (kind === "pickup") {
      tone(660, 0.1, "square", 0.07);
      tone(990, 0.16, "square", 0.05);
    } else if (kind === "life") {
      tone(392, 0.12, "square", 0.07);
      tone(523, 0.14, "square", 0.07);
      tone(784, 0.22, "square", 0.06);
    } else if (kind === "jump") {
      tone(340, 0.08, "square", 0.04, 520);
    } else if (kind === "block") {
      noiseBurst(0.07, 0.16, 900);
      tone(240, 0.06, "triangle", 0.05);
    } else if (kind === "checkpoint") {
      tone(523, 0.12, "triangle", 0.06);
      tone(784, 0.2, "triangle", 0.05);
    } else if (kind === "death") {
      tone(220, 0.4, "sawtooth", 0.08, 40);
    } else if (kind === "win") {
      [392, 494, 587, 784].forEach((f, i) => setTimeout(() => tone(f, 0.28, "triangle", 0.07), i * 90));
    } else if (kind === "intro") {
      noiseBurst(1.1, 0.18, 280);
      tone(920, 0.45, "sawtooth", 0.05, 140);
      tone(480, 0.7, "sawtooth", 0.06, 90);
      tone(220, 1.1, "triangle", 0.05, 52);
    } else if (kind === "land") {
      tone(196, 0.28, "sawtooth", 0.06);
      tone(294, 0.32, "triangle", 0.05);
      noiseBurst(0.18, 0.14, 500);
    }
  }

  function brassSting() {
    if (!actx) return;
    const notes = [196, 247, 311, 392, 494];
    notes.forEach((f, i) => {
      setTimeout(() => {
        tone(f, 0.7, "sawtooth", 0.07);
        tone(f * 2, 0.35, "square", 0.025);
      }, i * 70);
    });
  }

  function startWind() {
    if (!actx || windNode) return;
    const dur = 2;
    const buf = actx.createBuffer(1, actx.sampleRate * dur, actx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = last * 0.97 + (Math.random() * 2 - 1) * 0.03;
      d[i] = last;
    }
    const src = actx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = actx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 420;
    f.Q.value = 0.55;
    const g = actx.createGain();
    g.gain.value = 0.045;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start();
    windNode = src;
    windOn = true;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function lightMoves() { return ROH.lightMoves(era); }
  function heavyMove() { return ROH.heavyMove(era); }

  function loadUnlock() {
    const n = parseInt(localStorage.getItem("roh.unlocked") || "1", 10);
    return n >= 1 && n <= 6 ? n : 1;
  }
  function loadSave() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") || {}; } catch (err) { s = {}; }
    const legacy = loadUnlock();
    unlocked = clamp(s.unlocked != null ? s.unlocked : legacy, 1, 6);
    maxLives = clamp(s.maxLives != null ? s.maxLives : LIVES_FLOOR, LIVES_FLOOR, MAX_LIVES);
    muted = !!s.muted;
    const lv = s.lives != null ? s.lives : maxLives;
    return clamp(lv, 1, maxLives);
  }
  function persistSave() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        unlocked,
        maxLives,
        lives: player.lives > 0 ? clamp(player.lives, 1, maxLives) : maxLives,
        muted,
      }));
      localStorage.setItem("roh.unlocked", String(unlocked));
    } catch (err) { /* ignore quota */ }
  }
  let score = 0;
  let scoreSaved = false;

  function addScore(n, label, x, y) {
    if (!n) return;
    score += n;
    if (label) floatText(x != null ? x : player.x, y != null ? y : player.y - 48, "+" + n, "#ffe27a");
  }

  function boardApi() {
    const host = location.hostname;
    if ((host === "localhost" || host === "127.0.0.1") && location.port === "4173") {
      return "https://www.rippleofhistory.com/api/leaderboard";
    }
    return "/api/leaderboard";
  }

  function loadBoard() {
    try {
      const rows = JSON.parse(localStorage.getItem(BOARD_KEY) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      return [];
    }
  }

  function cacheBoard(rows) {
    try { localStorage.setItem(BOARD_KEY, JSON.stringify(rows.slice(0, 10))); } catch (err) { /* ignore */ }
  }

  function paintBoard(rows, hint) {
    const ol = document.getElementById("board-list");
    const hintEl = document.getElementById("board-hint");
    if (hintEl && hint) hintEl.textContent = hint;
    if (!ol) return;
    ol.innerHTML = "";
    if (!rows.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = hint && hint.indexOf("Fetching") === 0 ? "Fetching live scores…" : "No scores yet. Be the first.";
      ol.appendChild(li);
      return;
    }
    rows.slice(0, 10).forEach((row, i) => {
      const li = document.createElement("li");
      const rank = document.createElement("span");
      rank.textContent = String(i + 1);
      const who = document.createElement("span");
      who.textContent = row.name || "KAEL";
      const pts = document.createElement("span");
      pts.textContent = String(row.score || 0);
      li.append(rank, who, pts);
      ol.appendChild(li);
    });
  }

  function renderBoard() {
    paintBoard(loadBoard(), "Fetching live scores…");
    fetch(boardApi(), { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error("board");
      return res.json();
    }).then((data) => {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      cacheBoard(rows);
      paintBoard(rows, "Best ten runs worldwide.");
    }).catch(() => {
      const local = loadBoard();
      paintBoard(local, local.length ? "Live board unreachable — showing this device." : "Live board unreachable.");
    });
  }

  function submitScore(rawName) {
    if (scoreSaved || score <= 0) return Promise.resolve(false);
    const name = String(rawName || "KAEL").replace(/[^\w \-']/g, "").trim().slice(0, 16).toUpperCase() || "KAEL";
    return fetch(boardApi(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score, era }),
    }).then((res) => {
      if (!res.ok) throw new Error("board");
      return res.json();
    }).then((data) => {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      cacheBoard(rows);
      scoreSaved = true;
      paintBoard(rows, "Best ten runs worldwide.");
      return true;
    }).catch(() => {
      const rows = loadBoard();
      rows.push({ name, score, era, at: Date.now() });
      rows.sort((a, b) => b.score - a.score);
      cacheBoard(rows);
      paintBoard(rows, "Live save failed — kept on this device.");
      return false;
    });
  }

  function fillScoreScreens() {
    const d = document.getElementById("dead-score");
    const w = document.getElementById("win-score");
    if (d) d.textContent = String(score);
    if (w) w.textContent = String(score);
  }

  function layoutStage() {
    const portrait = window.innerHeight > window.innerWidth + 40;
    document.documentElement.classList.toggle("force-land", portrait);
    try {
      if (portrait && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }
    } catch (err) { /* not allowed until fullscreen */ }
  }

  function saveUnlock(n) {
    if (n > unlocked) {
      unlocked = n;
      persistSave();
      refreshEraSelect();
      refreshTitleEra();
    }
  }
  function refreshTitleEra() {
    const el = document.querySelector("#title-screen .era-tag");
    if (el) el.textContent = ERA_LABEL[unlocked] || ERA_LABEL[1];
  }
  function refreshMuteButtons() {
    const label = muted ? "SOUND OFF" : "SOUND ON";
    ["btn-mute", "btn-pause-mute"].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.textContent = label;
      if (muted) btn.classList.add("muted");
      else btn.classList.remove("muted");
    });
  }
  function applyMute() {
    if (master) master.gain.value = muted ? 0 : 0.22;
    if (ROH.musicMute) ROH.musicMute(muted);
    refreshMuteButtons();
  }
  function toggleMute() {
    muted = !muted;
    audioInit();
    applyMute();
    persistSave();
  }
  function refreshEraSelect() {
    for (let i = 1; i <= 6; i++) {
      const btn = document.getElementById("era-btn-" + i);
      if (!btn) continue;
      const open = i <= unlocked;
      btn.disabled = !open;
      btn.textContent = open ? ERA_LABEL[i] : ERA_LABEL[i].replace(/·.*/, "·  LOCKED");
    }
  }

  function resetPlayer(x) {
    player.x = x;
    player.y = GROUND;
    player.vx = 0;
    player.vy = 0;
    player.w = 20;
    player.h = 40;
    player.facing = 1;
    player.hp = 100;
    player.onGround = true;
    player.blocking = false;
    player.anim = "idle";
    player.attacking = false;
    player.kind = null;
    player.combo = 0;
    player.phase = null;
    player.phaseT = 0;
    player.buffer = false;
    player.heavyCd = 0;
    player.hurtT = 0;
    player.invuln = 80;
    player.deadT = 0;
    player.swingId = 0;
    player.runT = 0;
    player.trampling = -1;
    player.rollT = 0;
    player.rollMax = 22;
    player.rollDir = 1;
    player.rollCd = 0;
    player.rolling = false;
    lifeDamaged = false;
  }

  function clearWorld() {
    enemies.length = 0;
    shots.length = 0;
    sparks.length = 0;
    floats.length = 0;
    pickups.length = 0;
    flags.length = 0;
    spawns.length = 0;
    ledges.length = 0;
    spawned = 0;
    doorOpen = false;
    door.taken = false;
    door.x = 5080;
    elephantCleared = false;
    bossCleared = false;
    lock = null;
    checkpoint = 80;
    shake = 0;
    shakeDecay = 0.82;
    hitstop = 0;
    time = 0;
    introT = 0;
    horse = null;
    villaX = 0;
    gateCleared = false;
    rain.length = 0;
    muds.length = 0;
    cannons.length = 0;
    snows.length = 0;
    searchlights.length = 0;
    nestCleared = false;
    wrecks.length = 0;
    droneT = 0;
    ending = false;
    pits.length = 0;
    stains.length = 0;
    hurtFlash = 0;
  }

  function eraBag() {
    return {
      GROUND,
      flags,
      pickups,
      spawns,
      ledges,
      pits,
      cannons,
      searchlights,
      wrecks,
      get horse() { return horse; },
      set horse(v) { horse = v; },
      get banner() { return banner; },
      set banner(v) { banner = v; },
      get villaX() { return villaX; },
      set villaX(v) { villaX = v; },
      get droneT() { return droneT; },
      set droneT(v) { droneT = v; },
    };
  }

  function resetLevel(opts) {
    opts = opts || {};
    const savedLives = clamp(player.lives > 0 ? player.lives : maxLives, 1, maxLives);
    era = opts.era || 1;
    clearWorld();
    ROH.applyEra(era, eraBag());
    resetPlayer(80);
    player.lives = savedLives;
    player.invuln = 0;
    camX = 0;
    lifeDamaged = false;
  }

  function announce(text, t) {
    banner = { text, t: t || 110 };
  }

  function bumpShake(n) {
    if (n >= shake) {
      shake = n;
      shakeDecay = n >= 18 ? 0.91 : n >= 12 ? 0.88 : 0.82;
    }
  }

  function sparkBurst(x, y, n, gold) {
    const cap = perfLow ? 40 : 96;
    const room = cap - sparks.length;
    if (room <= 0) return;
    const blood = gold === "blood";
    n = Math.min(n, perfLow ? 4 : n, room);
    for (let i = 0; i < n; i++) {
      const s = sparkPool.pop() || {};
      s.x = x;
      s.y = y;
      s.vx = blood ? rand(-1.2, 2.8) * (Math.random() < 0.5 ? -1 : 1) : rand(-2.4, 2.4);
      s.vy = blood ? rand(-4.2, -0.4) : rand(-3.2, 0.6);
      s.life = blood ? rand(16, 34) : rand(12, 26);
      s.max = blood ? 34 : 26;
      s.s = blood ? rand(1.4, 3.2) : rand(1, 2.4);
      s.gold = !blood && gold !== false;
      s.blood = blood;
      sparks.push(s);
    }
  }

  function bloodBurst(x, y, dir, n, kill) {
    const count = (n || 10) + (kill ? 10 : 0);
    const cap = perfLow ? 40 : 96;
    const room = cap - sparks.length;
    if (room <= 0) return;
    const take = Math.min(count, perfLow ? 6 : count, room);
    for (let i = 0; i < take; i++) {
      const s = sparkPool.pop() || {};
      s.x = x + rand(-4, 4);
      s.y = y + rand(-6, 4);
      s.vx = (dir || 1) * rand(0.6, 3.6) + rand(-0.8, 0.8);
      s.vy = rand(-4.8, -0.2);
      s.life = rand(18, 36);
      s.max = 36;
      s.s = rand(1.6, 3.6);
      s.gold = false;
      s.blood = true;
      sparks.push(s);
    }
    if (stains.length < 36) {
      stains.push({
        x: x + rand(-10, 10),
        y: GROUND - 1,
        w: kill ? rand(10, 22) : rand(5, 12),
        h: kill ? rand(3, 6) : rand(2, 4),
        a: kill ? 0.62 : 0.42,
        life: kill ? 900 : 520,
      });
    }
  }

  function floatText(x, y, text, color) {
    floats.push({ x, y, text, color: color || "#f3e2a0", life: 50 });
  }

  function aliveEnemies() {
    return enemies.filter((e) => e.hp > 0 && e.deadT === 0).length;
  }

  function makeEnemy(type, x) {
    const e = {
      type, x, y: GROUND, vx: 0, vy: 0, facing: -1,
      hp: 1, maxHp: 1, w: 20, h: 38, dw: 48, dh: 52,
      state: "idle", flashT: 0, atkT: 0, hurtT: 0, deadT: 0,
      think: rand(10, 40), hitBy: -1, cd: 0, hits: 0, phase: 1,
      charge: 0, intro: 0,
    };
    e.stunT = 0;
    e.guarded = false;
    e.openT = 0;
    e.ledge = false;
    e.trampleCd = 0;
    return ROH.fillEnemy(e, type, GROUND, AQUA.y);
  }

  function trySpawns() {
    for (const s of spawns) {
      if (s.done) continue;
      if (player.x + 340 < s.x) continue;
      if (s.x < camX - 80) { s.done = true; continue; }
      const special = ROH.isSpecial(s.type);
      if (!special && aliveEnemies() >= MAX_ENEMIES) continue;
      if (s.type === "elephant" && elephantCleared) { s.done = true; continue; }
      if ((s.type === "boss" || s.type === "centurion") && bossCleared) { s.done = true; continue; }
      const e = makeEnemy(s.type, s.x);
      enemies.push(e);
      s.done = true;
      if (special) {
        for (let i = enemies.length - 1; i >= 0; i--) {
          if (enemies[i] !== e) enemies.splice(i, 1);
        }
        shots.length = 0;
      }
      if (s.type === "boss") {
        brassSting();
        announce("MARBLE HETAIROI", 140);
        lock = { left: Math.floor(player.x - 80), right: Math.floor(player.x + 520) };
      }
      if (s.type === "centurion") {
        brassSting();
        announce("CENTURION OF HOURS", 140);
        lock = { left: Math.floor(player.x - 80), right: Math.floor(player.x + 520) };
      }
      if (s.type === "elephant") {
        announce("THE LINE BREAKS", 120);
        lock = { left: Math.floor(player.x - 80), right: Math.floor(player.x + 480) };
      }
      if (s.type === "gate") {
        announce("THE GATEHOUSE HOLDS", 110);
        lock = { left: Math.floor(e.x - 220), right: Math.floor(e.x + 160) };
      }
      if (s.type === "knight") {
        announce("A PLATED KNIGHT", 110);
      }
      if (s.type === "baron") {
        brassSting();
        announce("CLOCKWORK BARON", 140);
        lock = { left: HALL.left, right: HALL.right };
      }
      if (s.type === "powder") {
        brassSting();
        announce("POWDER GENERAL", 140);
        lock = { left: COURT.left, right: COURT.right };
      }
      if (s.type === "mgnest") {
        announce("MG NEST", 110);
        lock = { left: Math.floor(e.x - 280), right: Math.floor(e.x + 200) };
      }
      if (s.type === "armorcar") {
        announce("ARMOURED CAR", 110);
        lock = { left: Math.floor(player.x - 80), right: Math.floor(player.x + 480) };
      }
      if (s.type === "colonel") {
        brassSting();
        announce("RADIO COLONEL", 140);
        lock = { left: COURT.left, right: COURT.right };
      }
      if (s.type === "ifv") {
        announce("IFV", 110);
        lock = { left: Math.floor(player.x - 80), right: Math.floor(player.x + 500) };
      }
      if (s.type === "fracture") {
        brassSting();
        announce("THE FRACTURE", 150);
        lock = { left: COURT.left, right: COURT.right };
      }
    }
  }

  function bodyBox(e) {
    return { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h };
  }

  function elephantLegs(e) {
    const w = e.dw;
    const h = e.dh;
    if (e.facing >= 0) {
      return { x: e.x - 8, y: e.y - h * 0.52, w: w * 0.58, h: h * 0.52 };
    }
    return { x: e.x - w * 0.5, y: e.y - h * 0.52, w: w * 0.58, h: h * 0.52 };
  }

  function playerHitbox() {
    if (!player.attacking || player.phase !== "active") return null;
    const spec = currentSpec();
    const dir = player.facing;
    const x = dir > 0 ? player.x + 6 : player.x - 6 - spec.range;
    const h = spec.tall || 24;
    const y = player.y - player.h + 8 - (spec.tall ? 10 : 0);
    return { x, y, w: spec.range, h, spec };
  }

  function firePistol() {
    const spec = currentSpec();
    const jeep = !!(horse && horse.mounted && horse.kind === 5);
    const cart = !!(horse && horse.mounted && horse.kind === 4);
    const tank = !!(horse && horse.mounted && horse.kind === 6);
    if (tank) {
      shots.push({
        type: "shell",
        x: player.x + player.facing * 36,
        y: player.y - 28,
        vx: player.facing * 5.4,
        vy: 0,
        dmg: 42,
        life: 70,
        warn: 16,
        facing: player.facing,
      });
      sfx("swing");
      return;
    }
    if (era === 6 && spec && spec.mark) {
      let tx = player.x + player.facing * 96;
      let bestD = 180;
      for (const e of enemies) {
        if (e.hp <= 0 || e.deadT > 0) continue;
        if (Math.sign(e.x - player.x) !== player.facing) continue;
        const d = Math.abs(e.x - player.x);
        if (d < bestD) { bestD = d; tx = e.x; }
      }
      shots.push({ type: "dronestrike", x: tx, y: GROUND, fuse: 60, dmg: 32, r: 38, life: 60 });
      floatText(tx, GROUND - 42, "MARKED", "#e6c35c");
      sfx("checkpoint");
      return;
    }
    if (era === 6 && spec && spec.burst) {
      shots.push({
        type: "burst",
        x: player.x + player.facing * 12,
        y: player.y - 24,
        vx: player.facing * 5.2,
        vy: 0,
        dmg: spec.dmg,
        life: 11,
      });
      sparkBurst(player.x + player.facing * 16, player.y - 24, 6, true);
      sfx("swing");
      return;
    }
    if (jeep) {
      for (let i = 0; i < 4; i++) {
        shots.push({
          type: "mg",
          x: player.x + player.facing * (20 + i * 5),
          y: player.y - 22,
          vx: player.facing * (6.0 + i * 0.2),
          vy: 0,
          dmg: 9,
          life: 26,
        });
      }
      sparkBurst(player.x + player.facing * 24, player.y - 22, 12, true);
      sfx("hit");
      return;
    }
    if (era === 5) {
      shots.push({
        type: "rifle",
        x: player.x + player.facing * 18,
        y: player.y - 26,
        vx: player.facing * 7.2,
        vy: 0,
        dmg: 26,
        life: 36,
      });
      sparkBurst(player.x + player.facing * 22, player.y - 26, 8, true);
      sfx("hit");
      return;
    }
    shots.push({
      type: cart ? "limber" : "pistol",
      x: player.x + player.facing * (cart ? 28 : 14),
      y: player.y - (cart ? 30 : 24),
      vx: player.facing * (cart ? 4.4 : 5.6),
      vy: 0,
      dmg: cart ? 28 : 20,
      life: cart ? 70 : 16,
    });
    sparkBurst(player.x + player.facing * 20, player.y - 24, cart ? 14 : 8, true);
    sfx("hit");
  }

  function markDamaged() {
    lifeDamaged = true;
  }

  function hurtPlayer(dmg, kb, srcX) {
    if (player.invuln > 0 || player.deadT > 0 || player.rolling) return;
    const dir = player.x >= srcX ? 1 : -1;
    markDamaged();
    if (horse && horse.mounted && horse.alive && !player.blocking) {
      horse.hp -= dmg;
      player.hp -= Math.ceil(dmg * 0.25);
      player.vx = dir * kb * 0.45;
      player.invuln = 28;
      sfx("hurt");
      sparkBurst(player.x, player.y - 28, 10, true);
      bumpShake(8);
      if (horse.hp <= 0) dumpHorse();
      if (player.hp <= 0) { player.hp = 0; loseLife(); }
      return;
    }
    if (player.blocking) {
      dmg = Math.ceil(dmg * 0.32);
      kb *= 0.25;
      sfx("block");
      sparkBurst(player.x + dir * 10, player.y - 22, 5, true);
    } else {
      sfx("hurt");
      player.hurtT = 14;
      player.anim = "hurt";
      player.attacking = false;
      player.phase = null;
      sparkBurst(player.x, player.y - 24, 10, true);
      bloodBurst(player.x, player.y - 22, dir, 8, false);
    }
    hurtFlash = Math.max(hurtFlash, player.blocking ? 4 : 10);
    player.hp -= dmg;
    player.vx = dir * kb;
    player.vy = player.blocking ? player.vy : -1.4;
    player.invuln = player.blocking ? 12 : 46;
    bumpShake(player.blocking ? 3 : 7);
    if (player.hp <= 0) {
      player.hp = 0;
      loseLife();
    }
  }

  function loseLife() {
    player.lives -= 1;
    persistSave();
    player.deadT = 70;
    player.anim = "death";
    player.attacking = false;
    sfx("death");
    announce("THE TETHER FRAYS", 70);
    if (player.lives <= 0) {
      persistSave();
      setTimeout(() => {
        if (mode === "play") {
          mode = "dead";
          fillScoreScreens();
          show(screens.dead);
        }
      }, 900);
    }
  }

  function respawn() {
    resetPlayer(checkpoint);
    player.invuln = 100;
    shots.length = 0;
    tryRespawnVehicle(checkpoint + 36);
    announce("REBOUND", 70);
  }

  function tryRespawnVehicle(atX) {
    if (!horse || horse.alive) return;
    if (lock) return;
    horse.alive = true;
    horse.hp = horse.maxHp;
    horse.mounted = false;
    horse.x = atX;
    horse.y = GROUND;
    floatText(atX, GROUND - 88, "THE STEED RETURNS", "#f3e2a0");
  }

  function mountHorse() {
    if (!horse || !horse.alive || horse.mounted) return;
    horse.mounted = true;
    player.blocking = false;
    sfx("checkpoint");
    announce(era === 6 ? "HULL DOWN" : era === 5 ? "JEEP" : era === 4 ? "LIMBER UP" : era === 3 ? "THE IRON ROAD" : "THE WHITE ROAD", 70);
  }

  function dismountHorse() {
    if (!horse || !horse.mounted) return;
    horse.mounted = false;
    horse.x = player.x - player.facing * 22;
    horse.y = GROUND;
    horse.facing = player.facing;
  }

  function dumpHorse() {
    if (!horse) return;
    horse.hp = 0;
    horse.alive = false;
    horse.mounted = false;
    horse.x = player.x;
    sparkBurst(player.x, player.y - 18, 18, true);
    bumpShake(12);
    announce("THE STEED FALLS", 80);
    player.invuln = Math.max(player.invuln, 40);
  }

  function overPit(px) {
    for (const p of pits) {
      if (px > p.x + 4 && px < p.x + p.w - 4) return p;
    }
    return null;
  }

  function standY(px, py, pvy) {
    let y = GROUND;
    let onLedge = false;
    for (const L of ledges) {
      if (L.gone) continue;
      const top = L.y + (L.fall || 0);
      if (px >= L.x && px <= L.x + L.w) {
        if (py <= top + 12 && pvy >= -0.2) {
          y = Math.min(y, top);
          onLedge = true;
        }
      }
    }
    if (!onLedge && overPit(px) && y >= GROUND) return VH + 90;
    return y;
  }

  function updateLedges() {
    for (const L of ledges) {
      if (L.gone) continue;
      if (L.moveAmp) {
        L.lastX = L.x;
        L.x = L.ox + Math.sin(time * L.moveSpd) * L.moveAmp;
        if (player.onGround && player.x >= Math.min(L.lastX, L.x) - 2 && player.x <= Math.max(L.lastX, L.x) + L.w + 2 && Math.abs(player.y - (L.y + (L.fall || 0))) < 4) {
          player.x += L.x - L.lastX;
        }
      }
      if (L.fragile) {
        const on = player.onGround && player.x >= L.x && player.x <= L.x + L.w && Math.abs(player.y - (L.y + (L.fall || 0))) < 5;
        if (on) L.shakeT = (L.shakeT || 0) + 1;
        else if ((L.shakeT || 0) > 0 && !L.fall) L.shakeT = Math.max(0, L.shakeT - 0.4);
        if (L.shakeT > 16 && !L.fall) {
          L.fall = 0.4;
          floatText(L.x + L.w / 2, L.y - 12, "CRACKS", "#d23a3a");
        }
        if (L.fall) {
          L.fall += 0.55;
          if (L.y + L.fall > VH + 20) L.gone = true;
        }
      }
    }
  }

  function faceNearest() {
    let best = null;
    let bestD = 110;
    for (const e of enemies) {
      if (e.hp <= 0 || e.deadT > 0) continue;
      const d = Math.abs(e.x - player.x);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) player.facing = best.x >= player.x ? 1 : -1;
  }

  function startAttack(kind, combo) {
    if (!wantLeft() && !wantRight()) faceNearest();
    player.attacking = true;
    player.kind = kind;
    player.combo = combo;
    player.phase = "wu";
    player.phaseT = 0;
    player.buffer = false;
    player.swingId += 1;
    player.vx *= 0.3;
    sfx("swing");
    if (kind === "heavy") player.heavyCd = heavyMove().cd;
    else player.vx += player.facing * (combo >= 3 ? 1.6 : 0.7);
  }

  function currentSpec() {
    return player.kind === "heavy" ? heavyMove() : lightMoves()[Math.max(0, player.combo - 1)];
  }

  function wantLeft() { return keys.has("ArrowLeft") || keys.has("KeyA") || pad.left || gp.left; }
  function wantRight() { return keys.has("ArrowRight") || keys.has("KeyD") || pad.right || gp.right; }
  function wantJump() { return keys.has("ArrowUp") || keys.has("KeyW") || pad.jump || gp.jump; }
  function wantBlock() { return keys.has("KeyL") || keys.has("KeyC") || pad.block || gp.block; }

  function consumeTap(name) {
    if (tap[name]) { tap[name] = false; return true; }
    return false;
  }

  function trampleEnemies() {
    if (!horse || !horse.mounted || !horse.alive) return;
    const hb = { x: player.x - 28, y: player.y - 28, w: 56, h: 28 };
    for (const e of enemies) {
      if (e.hp <= 0 || e.deadT > 0) continue;
      if (e.type !== "legionary" && e.type !== "archer" && e.type !== "manatarms" && e.type !== "crossbow" && e.type !== "knight" && e.type !== "lineinf" && e.type !== "lancer" && e.type !== "rifleinf" && e.type !== "modinf") continue;
      if (e.trampleCd > 0) { e.trampleCd--; continue; }
      const box = bodyBox(e);
      if (!aabb(hb.x, hb.y, hb.w, hb.h, box.x, box.y, box.w, box.h)) continue;
      if (Math.abs(player.vx) < (era === 3 ? 1.05 : 1.4)) continue;
      e.trampleCd = 20;
      e.hp -= era === 3 && e.type === "knight" ? 18 : 12;
      e.hurtT = 10;
      e.stunT = e.type === "knight" ? 70 : 40;
      e.vx = player.facing * (e.type === "knight" ? 4.6 : 3.2);
      e.vy = -1.6;
      if (e.type === "knight") floatText(e.x, e.y - e.h - 8, "PLATE YIELDS", "#ffe27a");
      sparkBurst(e.x, e.y - 18, 10, true);
      bloodBurst(e.x, e.y - 16, player.facing, 8, e.hp <= 0);
      sfx("hit");
      if (e.hp <= 0) killEnemy(e);
    }
    player.trampling = (player.trampling - 1) | 0;
  }

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (mode === "intro") {
      skipIntro();
      e.preventDefault();
      return;
    }
    if (!keys.has(e.code)) {
      if (e.code === "KeyJ" || e.code === "KeyZ") tap.light = true;
      if (e.code === "KeyK" || e.code === "KeyX") tap.heavy = true;
      if (e.code === "ArrowUp" || e.code === "KeyW") tap.jump = true;
      if (e.code === "ArrowDown" || e.code === "KeyS") tap.roll = true;
      if (e.code === "Space") tap.mount = true;
      if (e.code === "Enter" && mode === "title") begin(true);
      if (e.code === "Escape") togglePause();
      if (e.code === "KeyM") toggleMute();
    }
    keys.add(e.code);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));

  function bindTouch() {
    const root = document.getElementById("touch");
    const held = new Map();
    function setAct(act, on) {
      if (mode === "intro") { if (on) skipIntro(); return; }
      if (act === "pause") { if (on) togglePause(); return; }
      if (act === "left") pad.left = on;
      if (act === "right") pad.right = on;
      if (act === "jump") {
        if (on && !pad.jump) tap.jump = true;
        pad.jump = on;
      }
      if (act === "light") {
        if (on && !pad.light) tap.light = true;
        pad.light = on;
      }
      if (act === "heavy") {
        if (on && !pad.heavy) tap.heavy = true;
        pad.heavy = on;
      }
      if (act === "block") pad.block = on;
      if (act === "roll") {
        if (on && !pad.roll) tap.roll = true;
        pad.roll = on;
      }
      if (act === "mount") {
        if (on && !pad.mount) tap.mount = true;
        pad.mount = on;
      }
    }
    function fromTouch(ev, on) {
      ev.preventDefault();
      for (const t of ev.changedTouches) {
        const el = on ? document.elementFromPoint(t.clientX, t.clientY) : held.get(t.identifier);
        const btn = el && el.closest ? el.closest("[data-act]") : null;
        if (on) {
          if (btn) {
            held.set(t.identifier, btn);
            btn.classList.add("held");
            setAct(btn.dataset.act, true);
          }
        } else {
          if (el) {
            el.classList.remove("held");
            setAct(el.dataset.act, false);
            held.delete(t.identifier);
          }
        }
      }
    }
    root.addEventListener("touchstart", (e) => fromTouch(e, true), { passive: false });
    root.addEventListener("touchend", (e) => fromTouch(e, false), { passive: false });
    root.addEventListener("touchcancel", (e) => fromTouch(e, false), { passive: false });
    root.addEventListener("touchmove", (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const prev = held.get(t.identifier);
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const btn = el && el.closest ? el.closest("#touch [data-act]") : null;
        if (prev === btn) continue;
        if (prev) {
          prev.classList.remove("held");
          setAct(prev.dataset.act, false);
        }
        if (btn) {
          held.set(t.identifier, btn);
          btn.classList.add("held");
          setAct(btn.dataset.act, true);
        } else held.delete(t.identifier);
      }
    }, { passive: false });
    root.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => { e.preventDefault(); setAct(btn.dataset.act, true); btn.classList.add("held"); });
      btn.addEventListener("mouseup", () => { setAct(btn.dataset.act, false); btn.classList.remove("held"); });
      btn.addEventListener("mouseleave", () => { setAct(btn.dataset.act, false); btn.classList.remove("held"); });
    });
  }

  function refreshPlayTouch() {
    const st = document.getElementById("stage");
    if (st) st.classList.toggle("play-touch", mode === "play" || mode === "intro" || mode === "pause");
  }

  function togglePause() {
    if (mode === "intro") { skipIntro(); return; }
    if (mode === "warp") return;
    if (mode === "play") {
      mode = "pause";
      show(screens.pause);
    } else if (mode === "pause") {
      mode = "play";
      hide(screens.pause);
    }
  }

  function landEra() {
    mode = "play";
    introT = 240;
    tap.light = false;
    tap.heavy = false;
    tap.jump = false;
    keys.clear();
    sfx("land");
    announce(ERA_LABEL[era] || "ERA I  ·  ALEXANDER", 160);
    if (ROH.musicStart && actx) ROH.musicStart(actx, master, era);
  }

  function skipIntro() {
    if (mode !== "intro") return;
    landEra();
  }

  function begin(playIntro, startEra) {
    layoutStage();
    try {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    } catch (err) { /* ignore */ }
    audioInit();
    if (actx && actx.state === "suspended") actx.resume();
    applyMute();
    startWind();
    hide(screens.title);
    hide(screens.how);
    hideAllPlay();
    score = 0;
    scoreSaved = false;
    if (!player.lives || player.lives <= 0) player.lives = maxLives;
    const n = startEra || (playIntro ? 1 : (era || 1));
    resetLevel({ era: n });
    if (playIntro && n === 1) {
      mode = "intro";
      introT = 0;
      banner.t = 0;
      sfx("intro");
    } else {
      mode = "play";
      announce(ERA_LABEL[n] || "ERA I  ·  ALEXANDER", 140);
      if (ROH.musicStart && actx) ROH.musicStart(actx, master, n);
    }
  }

  function setWinCopy(n) {
    const h2 = document.querySelector("#win-screen h2");
    const hint = document.querySelector("#win-screen .hint");
    if (!h2 || !hint) return;
    if (n === 6) {
      h2.textContent = "THE LINE HOLDS";
      hint.innerHTML = "The crack is zipped shut.<br />Dawn on the street.";
    } else if (n === 5) {
      h2.textContent = "SEAL V";
      hint.innerHTML = "Era V — World War II — is bound.<br />Walk the gold door to the next era.";
    } else if (n === 4) {
      h2.textContent = "SEAL IV";
      hint.innerHTML = "Era IV — Napoleon — is bound.<br />Walk the gold door to the next era.";
    } else if (n === 3) {
      h2.textContent = "SEAL III";
      hint.innerHTML = "Era III — Knights — is bound.<br />Walk the gold door to the next era.";
    } else if (n === 2) {
      h2.textContent = "SEAL II";
      hint.innerHTML = "Era II — Rome — is bound.<br />Walk the gold door to the next era.";
    } else {
      h2.textContent = "THE RIFT OPENS";
      hint.innerHTML = "Era I — Alexander the Great — is bound.<br />Walk the gold door to the next era.";
    }
  }

  function startWarp(toEra) {
    addScore(1500);
    mode = "warp";
    warpT = 0;
    warpTo = toEra || 2;
    banner = { text: ERA_LABEL[warpTo] || "THE PALETTE TEARS", t: 130 };
    sfx("intro");
  }

  function toTitle() {
    persistSave();
    hideAllPlay();
    show(screens.title);
    mode = "title";
    if (ROH.musicStart && actx) ROH.musicStart(actx, master, "intro");
    enemies.length = 0;
    shots.length = 0;
    refreshTitleEra();
    refreshEraSelect();
  }

  document.getElementById("btn-begin").addEventListener("click", () => begin(true, 1));
  document.getElementById("btn-how").addEventListener("click", () => show(screens.how));
  document.getElementById("btn-how-close").addEventListener("click", () => hide(screens.how));
  document.getElementById("btn-board").addEventListener("click", () => { renderBoard(); show(screens.board); });
  document.getElementById("btn-board-close").addEventListener("click", () => hide(screens.board));
  function bindScoreForm(formId, inputId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      const input = document.getElementById(inputId);
      if (scoreSaved) {
        if (btn) btn.textContent = "SAVED";
        return;
      }
      if (btn) {
        btn.textContent = "SAVING…";
        btn.disabled = true;
      }
      submitScore(input && input.value).then((ok) => {
        if (btn) {
          btn.textContent = ok ? "SAVED" : "TRY AGAIN";
          btn.disabled = false;
        }
      });
    });
  }
  bindScoreForm("dead-form", "dead-name");
  bindScoreForm("win-form", "win-name");
  document.getElementById("btn-eras").addEventListener("click", () => { refreshEraSelect(); show(screens.eras); });
  document.getElementById("btn-era-close").addEventListener("click", () => hide(screens.eras));
  for (let i = 1; i <= 6; i++) {
    const btn = document.getElementById("era-btn-" + i);
    if (!btn) continue;
    btn.addEventListener("click", () => {
      if (i > unlocked) return;
      hide(screens.eras);
      begin(i === 1, i);
    });
  }
  document.getElementById("btn-resume").addEventListener("click", () => { mode = "play"; hide(screens.pause); });
  document.getElementById("btn-pause-title").addEventListener("click", toTitle);
  document.getElementById("btn-mute").addEventListener("click", toggleMute);
  document.getElementById("btn-pause-mute").addEventListener("click", toggleMute);
  document.getElementById("btn-restart").addEventListener("click", () => {
    hide(screens.dead);
    player.lives = maxLives;
    persistSave();
    begin(false);
  });
  document.getElementById("btn-dead-title").addEventListener("click", toTitle);
  document.getElementById("btn-win-title").addEventListener("click", toTitle);

  canvas.addEventListener("pointerdown", () => { if (mode === "intro") skipIntro(); });

  function updatePlayer() {
    if (player.deadT > 0) {
      player.deadT--;
      player.vx *= 0.8;
      player.x += player.vx;
      if (player.deadT === 0 && player.lives > 0) respawn();
      return;
    }

    if (player.heavyCd > 0) player.heavyCd--;
    if (player.invuln > 0) player.invuln--;
    if (player.hurtT > 0) player.hurtT--;

    const canAct = player.hurtT === 0;
    const attackingLocked = player.attacking && player.phase !== "rec";
    const mounted = !!(horse && horse.mounted && horse.alive);
    player.blocking = canAct && !player.attacking && wantBlock() && player.onGround && !mounted;
    if (player.blocking) player.vx = 0;

    if (canAct && era >= 2 && era <= 6 && consumeTap("mount")) {
      if (mounted) dismountHorse();
      else if (horse && horse.alive && Math.abs(player.x - horse.x) < 48 && player.onGround) mountHorse();
    }

    if (player.rollCd > 0) player.rollCd--;
    if (player.rollT > 0) {
      player.rollT--;
      player.rolling = player.rollT > 0;
      player.h = player.rolling ? 20 : 40;
      player.vx = player.rollDir * 4.6;
      if (time % 2 === 0) sparkBurst(player.x - player.rollDir * 8, player.y - 4, 2, false);
      if (!player.rolling) {
        player.h = 40;
        player.rollCd = 12;
        player.vx *= 0.4;
      }
    } else if (canAct && player.onGround && !player.attacking && !player.blocking && !mounted && player.rollCd === 0 && consumeTap("roll")) {
      player.rollMax = 22;
      player.rollT = player.rollMax;
      player.rolling = true;
      player.rollDir = wantLeft() && !wantRight() ? -1 : wantRight() && !wantLeft() ? 1 : player.facing;
      player.facing = player.rollDir;
      player.h = 20;
      player.vx = player.rollDir * 4.6;
      player.anim = "run";
      sfx("jump");
      sparkBurst(player.x, player.y - 6, 8, true);
    }

    if (canAct && !player.blocking && !player.rolling) {
      if (consumeTap("light")) {
        if (player.attacking && player.kind === "light" && player.combo < 3 && player.phase === "rec") {
          player.buffer = true;
        } else if (!player.attacking) {
          startAttack("light", 1);
        }
      }
      if (consumeTap("heavy") && !player.attacking && player.heavyCd === 0) {
        startAttack("heavy", 0);
      }
    } else {
      tap.light = false;
      tap.heavy = false;
    }

    if (player.attacking) {
      const spec = currentSpec();
      const len = player.phase === "wu" ? spec.wu : player.phase === "active" ? spec.act : spec.rec;
      player.phaseT++;
      if (player.phase === "wu" && player.phaseT === 1) {
        player.vx += player.facing * (player.kind === "heavy" ? 1.8 : 0.9);
      }
      if (player.phaseT >= len) {
        player.phaseT = 0;
        if (player.phase === "wu") {
          player.phase = "active";
          if (spec.shot || spec.burst || spec.mark) firePistol();
        } else if (player.phase === "active") player.phase = "rec";
        else {
          if (player.buffer && player.kind === "light" && player.combo < 3) {
            startAttack("light", player.combo + 1);
          } else {
            player.attacking = false;
            player.kind = null;
            player.combo = 0;
            player.phase = null;
          }
        }
      }
    }

    let moving = false;
    if (player.rolling) {
      moving = true;
    } else if (!player.blocking && !attackingLocked && player.hurtT === 0) {
      const spd = mounted
        ? (player.attacking ? 1.05 : (era === 6 ? 1.35 : era === 5 ? 4.15 : era === 4 ? 2.2 : era === 3 ? 2.45 : 3.55))
        : (player.attacking ? 0.7 : 2.15);
      if (wantLeft()) { player.vx = -spd; player.facing = -1; moving = true; }
      else if (wantRight()) { player.vx = spd; player.facing = 1; moving = true; }
      else player.vx *= 0.7;
    } else if (player.blocking) {
      player.vx *= 0.6;
    }

    if (canAct && player.onGround && !player.blocking && !player.attacking && !player.rolling && (consumeTap("jump") || (wantJump() && tap.jump))) {
      player.vy = era === 2 ? -7.2 : (era === 3 || era === 5 || era === 6) ? -6.8 : -6.35;
      player.onGround = false;
      sfx("jump");
    }
    tap.jump = false;

    updateLedges();
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    const floor = standY(player.x, player.y, player.vy);
    if (player.y >= floor) {
      player.y = floor;
      player.vy = 0;
      player.onGround = true;
    } else player.onGround = false;

    if (player.deadT === 0 && player.y > GROUND + 28) {
      announce(era === 6 ? "THE CELLAR TAKES YOU" : era === 5 ? "THE CRATER TAKES YOU" : era === 4 ? "THE ICE TAKES YOU" : era === 3 ? "THE MOAT TAKES YOU" : era === 2 ? "THE CISTERN TAKES YOU" : "THE EARTH TAKES YOU", 80);
      player.hp = 0;
      loseLife();
      player.y = Math.min(player.y, GROUND + 46);
      if (horse && horse.mounted) dumpHorse();
    }

    if (mounted) {
      horse.x = player.x;
      horse.y = player.y;
      horse.facing = player.facing;
      trampleEnemies();
      if (era === 6 && horse.kind === 6) {
        for (const w of wrecks) {
          if (!w.alive) continue;
          if (Math.abs(player.x - w.x) < 42) {
            w.alive = false;
            sparkBurst(w.x, GROUND - 12, 14, true);
            bumpShake(10);
            floatText(w.x, GROUND - 40, "CRUSHED", "#e6c35c");
          }
        }
      }
    } else if (horse && horse.alive && !horse.mounted) {
      horse.y = GROUND;
    }

    const minX = lock ? lock.left + 10 : 40;
    let maxX = lock ? lock.right - 10 : LEVEL_W - 40;
    const gate = enemies.find((n) => n.type === "gate" && n.hp > 0);
    if (gate) maxX = Math.min(maxX, gate.x - 28);
    player.x = clamp(player.x, minX, maxX);

    if (era === 3 && player.onGround && moving && !perfLow && (time % 3 === 0)) {
      muds.push({ x: player.x - player.facing * 8, y: GROUND - 2, vx: -player.facing * rand(0.4, 1.2), vy: -rand(0.6, 1.8), life: 14 });
    }

    if (player.rolling) player.anim = "jump";
    else if (player.hurtT > 0) player.anim = "hurt";
    else if (player.blocking) player.anim = "block";
    else if (player.attacking) player.anim = player.kind === "heavy" ? "heavy" : "attack";
    else if (!player.onGround) player.anim = "jump";
    else if (moving) { player.anim = "run"; player.runT++; }
    else { player.anim = "idle"; player.runT = 0; }
  }

  function hitEnemies() {
    const hb = playerHitbox();
    if (!hb) return;
    if (hb.spec && hb.spec.shot) return;
    for (const e of enemies) {
      if (e.hp <= 0 || e.deadT > 0 || e.hitBy === player.swingId) continue;
      let box = bodyBox(e);
      let valid = true;
      if (e.type === "elephant") {
        const legs = elephantLegs(e);
        if (!aabb(hb.x, hb.y, hb.w, hb.h, legs.x, legs.y, legs.w, legs.h)) {
          if (aabb(hb.x, hb.y, hb.w, hb.h, box.x, box.y, box.w, box.h)) {
            e.hitBy = player.swingId;
            sparkBurst(e.x, e.y - 30, 6, true);
            floatText(e.x, e.y - e.h - 8, "THE HIDE HOLDS", "#e8d48a");
          }
          continue;
        }
        box = legs;
      } else if (!aabb(hb.x, hb.y, hb.w, hb.h, box.x, box.y, box.w, box.h)) continue;

      e.hitBy = player.swingId;
      const spec = hb.spec;
      const dir = player.facing;
      const bash = era === 2 && player.kind === "heavy";
      const cleave = era === 3 && player.kind === "heavy";
      if (e.type === "legionary" && e.stunT <= 0 && !bash) {
        sparkBurst(e.x, e.y - 24, 8, true);
        floatText(e.x, e.y - e.h - 8, "THE SCUTUM HOLDS", "#e8d48a");
        sfx("block");
        e.vx = dir * 0.8;
        continue;
      }
      if (e.type === "mgnest" && player.x < e.x + 8 && player.y > e.y - 24) {
        sparkBurst(e.x - 16, e.y - 24, 8, true);
        floatText(e.x, e.y - e.h - 8, "THE NEST HOLDS", "#e8d48a");
        sfx("block");
        continue;
      }
      if ((e.type === "armorcar" || e.type === "ifv") && player.x < e.x + 8) {
        sparkBurst(e.x - 10, e.y - 20, 8, true);
        floatText(e.x, e.y - e.h - 8, "THE PLATE HOLDS", "#e8d48a");
        sfx("block");
        continue;
      }
      if (e.type === "modinf" && e.guarded && player.x < e.x) {
        sparkBurst(e.x - 12, e.y - 22, 6, true);
        floatText(e.x, e.y - e.h - 8, "COVER", "#e8d48a");
        sfx("block");
        continue;
      }
      if (e.type === "colonel" && e.guarded) {
        sparkBurst(e.x - 20, e.y - 24, 8, true);
        floatText(e.x, e.y - e.h - 8, "THE STAFF CAR HOLDS", "#e8d48a");
        sfx("block");
        continue;
      }
      if (e.type === "knight" && e.guarded && !cleave) {
        sparkBurst(e.x, e.y - 28, 8, true);
        floatText(e.x, e.y - e.h - 8, "THE PLATE HOLDS", "#e8d48a");
        sfx("block");
        e.vx = dir * 0.6;
        continue;
      }
      if (e.type === "centurion" && e.guarded && !bash) {
        sparkBurst(e.x, e.y - 30, 8, true);
        floatText(e.x, e.y - e.h - 8, "THE WALL HOLDS", "#e8d48a");
        sfx("block");
        continue;
      }
      if (e.type === "baron" && e.guarded && !cleave) {
        sparkBurst(e.x, e.y - 32, 8, true);
        floatText(e.x, e.y - e.h - 8, "THE VISOR HOLDS", "#e8d48a");
        sfx("block");
        continue;
      }
      if (bash) {
        e.stunT = spec.stun || 90;
        if (e.type === "centurion") {
          e.guarded = false;
          e.openT = 150;
          floatText(e.x, e.y - e.h - 10, "VISOR OPENS", "#ffe27a");
        } else {
          floatText(e.x, e.y - e.h - 8, "STUNNED", "#ffe27a");
        }
      }
      if (cleave) {
        e.stunT = 70;
        if (e.type === "knight" || e.type === "baron") {
          e.guarded = false;
          e.openT = 160;
          floatText(e.x, e.y - e.h - 10, e.type === "baron" ? "VISOR OPENS" : "CLEAVED", "#ffe27a");
        }
      }
      if (e.type === "elephant") {
        e.hits += 1;
        e.hp = 3 - e.hits;
        floatText(e.x, e.y - e.h, "LEG  " + e.hits + " / 3", "#ffe27a");
        e.hurtT = 16;
        e.vx = dir * 1.4;
        sparkBurst(box.x + box.w / 2, box.y + box.h * 0.3, 16, true);
        bloodBurst(box.x + box.w / 2, box.y + box.h * 0.4, dir, 12, e.hits >= 3);
        sfx("hit");
        hitstop = 7;
        bumpShake(player.kind === "heavy" ? 16 : 10);
        if (e.hits >= 3) killEnemy(e);
      } else {
        e.hp -= spec.dmg;
        e.hurtT = player.kind === "heavy" ? 16 : 12;
        e.flashT = 0;
        e.state = "hurt";
        e.vx = dir * spec.kb;
        e.vy = spec.lift || (player.kind === "heavy" ? -1.4 : player.combo === 3 ? -2.2 : -0.8);
        e.facing = -dir;
        sparkBurst(e.x, e.y - e.h * 0.5, player.kind === "heavy" ? 16 : 10, true);
        bloodBurst(e.x, e.y - e.h * 0.45, dir, player.kind === "heavy" || player.combo === 3 ? 14 : 8, e.hp <= 0);
        floatText(e.x + dir * 6, e.y - e.h - 6, "-" + spec.dmg, "#d23a3a");
        sfx("hit");
        hitstop = player.kind === "heavy" ? 8 : player.combo === 3 ? 7 : 4;
        if (player.kind === "heavy") bumpShake(16);
        else if (player.combo === 3) bumpShake(12);
        else bumpShake(6);
        if (e.hp <= 0) killEnemy(e);
      }
    }
  }

  function killEnemy(e) {
    e.hp = 0;
    e.deadT = ROH.isSpecial(e.type) || e.type === "knight" ? 90 : 40;
    e.state = "dead";
    sparkBurst(e.x, e.y - 20, 22, true);
    bloodBurst(e.x, e.y - 16, player.facing || 1, 16, true);
    bumpShake(Math.max(shake, 10));
    let pts = ROH.isBoss(e.type) ? 1000 : (ROH.isSpecial(e.type) || e.type === "knight" || e.type === "gate") ? 250 : 100;
    if (player.combo === 3) pts += 50;
    addScore(pts, null, e.x, e.y - e.h - 20);
    floatText(e.x, e.y - e.h - 20, "+" + pts, "#ffe27a");
    if (e.type === "elephant") {
      elephantCleared = true;
      lock = null;
      announce("THE BEAST FALLS", 120);
      flags[1].on = true;
      checkpoint = flags[1].x;
      sfx("checkpoint");
      bumpShake(22);
      sparkBurst(e.x, e.y - 28, 28, true);
    }
    if (ROH.isBoss(e.type)) {
      bossCleared = true;
      lock = null;
      doorOpen = true;
      door.x = Math.min(LEVEL_W - 50, Math.max(e.x + 130, player.x + 170));
      announce(e.type === "fracture" ? "THE RIFT STILLS" : e.type === "colonel" ? "SEAL V" : e.type === "powder" ? "SEAL IV" : e.type === "baron" ? "SEAL III" : e.type === "centurion" ? "SEAL II" : "STONE REMEMBERS", 130);
      sfx("win");
      if (!lifeDamaged) {
        if (player.lives >= maxLives && maxLives < MAX_LIVES) maxLives += 1;
        if (player.lives < maxLives) {
          player.lives += 1;
          persistSave();
          floatText(e.x, e.y - e.h - 18, "FLAWLESS TETHER", "#ffe27a");
          announce("FLAWLESS TETHER", 90);
        }
        addScore(500, "FLAWLESS +500", e.x, e.y - e.h - 34);
      }
      if (e.type === "boss") saveUnlock(2);
      if (e.type === "centurion") saveUnlock(3);
      if (e.type === "baron") saveUnlock(4);
      if (e.type === "powder") saveUnlock(5);
      if (e.type === "colonel") saveUnlock(6);
      if (e.type === "fracture") saveUnlock(6);
    }
    if (e.type === "mgnest") {
      nestCleared = true;
      lock = null;
      announce("THE NEST IS SILENT", 110);
      horse = {
        x: JEEP_X, y: GROUND, hp: 48, maxHp: 48, facing: 1,
        mounted: false, alive: true, shrineX: JEEP_X, kind: 5,
      };
      floatText(JEEP_X, GROUND - 70, "JEEP", "#f3e2a0");
    }
    if (e.type === "armorcar" || e.type === "ifv") {
      lock = null;
      announce(e.type === "ifv" ? "THE IFV STOPS" : "THE CAR BURNS OUT", 100);
    }
    if (e.type === "gate") {
      gateCleared = true;
      lock = null;
      announce("THE GATEHOUSE FALLS", 120);
      bumpShake(16);
      horse = {
        x: e.x + 220, y: GROUND, hp: 110, maxHp: 110, facing: 1,
        mounted: false, alive: true, shrineX: e.x + 220, kind: 3,
      };
      floatText(e.x + 220, GROUND - 70, "THE STABLE OPENS", "#f3e2a0");
      sfx("checkpoint");
    }
  }

  function lobStone(e) {
    const dx = player.x - e.x;
    const dist = Math.abs(dx);
    shots.push({
      type: "stone",
      x: e.x + e.facing * 10,
      y: e.y - 28,
      vx: e.facing * clamp(dist / 55, 1.4, 2.8),
      vy: -4.6 - rand(0, 0.4),
      dmg: 10,
      life: 160,
    });
  }

  function rainSpear(px) {
    shots.push({
      type: "spear",
      x: px,
      y: -20,
      vx: 0,
      vy: 0,
      warn: 36,
      dmg: 16,
      life: 200,
    });
  }

  function dropChandelier(px) {
    shots.push({
      type: "chandelier",
      x: px,
      y: 18,
      vx: 0,
      vy: 0,
      warn: 42,
      dmg: 18,
      life: 220,
    });
  }

  function updateEnemy(e) {
    if (e.deadT > 0) {
      e.deadT--;
      e.vx *= 0.85;
      e.x += e.vx;
      return;
    }
    if (e.hp <= 0) return;
    if (e.hurtT > 0) {
      e.hurtT--;
      e.x += e.vx;
      if (e.ledge) {
        e.vy = 0;
        e.y = AQUA.y;
      } else {
        e.vy += GRAVITY;
        e.y += e.vy;
        const floor = standY(e.x, e.y, e.vy);
        if (e.y >= floor) { e.y = floor; e.vy = 0; }
      }
      e.vx *= 0.9;
      if (e.hurtT === 0) e.state = "idle";
      return;
    }

    if (e.intro > 0) { e.intro--; return; }

    const dx = player.x - e.x;
    e.facing = dx >= 0 ? 1 : -1;
    const adx = Math.abs(dx);
    if (e.cd > 0) e.cd--;

    if (e.type === "spear") {
      if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) { e.state = "attack"; e.atkT = 14; }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT === 10) {
          const hx = e.facing > 0 ? e.x + 8 : e.x - 40;
          const pb = bodyBox(player);
          if (aabb(hx, e.y - 30, 32, 24, pb.x, pb.y, pb.w, pb.h)) {
            hurtPlayer(14, 3.2, e.x);
          }
        }
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 40; }
      } else if (adx > 28) {
        e.vx = e.facing * 0.9;
        e.state = "walk";
      } else {
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 22; }
      }
    } else if (e.type === "slinger") {
      if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 12;
          lobStone(e);
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 70; }
      } else if (adx < 90) {
        e.vx = -e.facing * 0.85;
        e.state = "walk";
      } else if (adx > 160) {
        e.vx = e.facing * 0.75;
        e.state = "walk";
      } else {
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 20; }
      }
    } else if (e.type === "elephant") {
      if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 18;
          bumpShake(10);
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT === 12) {
          const hx = e.facing > 0 ? e.x + 10 : e.x - 70;
          const pb = bodyBox(player);
          if (aabb(hx, e.y - 40, 70, 40, pb.x, pb.y, pb.w, pb.h)) hurtPlayer(18, 4.4, e.x);
        }
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 55; }
      } else if (adx > 78) {
        e.vx = e.facing * 0.55;
        e.state = "walk";
      } else {
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 26; }
      }
    } else if (e.type === "boss") {
      if (e.hp <= 90 && e.phase === 1) {
        e.phase = 2;
        announce("FALLING BRONZE", 100);
        brassSting();
      }
      if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "charge";
          e.charge = 48;
          e.vx = e.facing * (e.phase === 2 ? 4.2 : 5.2);
        }
      } else if (e.state === "charge") {
        e.charge--;
        const pb = bodyBox(player);
        const box = bodyBox(e);
        if (aabb(box.x, box.y, box.w, box.h, pb.x, pb.y, pb.w, pb.h)) {
          hurtPlayer(22, 5.0, e.x);
        }
        if (e.charge <= 0) { e.state = "idle"; e.cd = e.phase === 2 ? 50 : 36; e.vx = 0; }
      } else {
        if (e.phase === 2 && e.cd === 18) {
          rainSpear(player.x);
          rainSpear(player.x + 50);
          rainSpear(player.x - 50);
        }
        if (adx > 90) {
          e.vx = e.facing * 1.15;
          e.state = "walk";
        } else e.vx = e.facing * 0.4;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 24; e.vx = 0; }
      }
    } else if (e.type === "legionary") {
      if (e.stunT > 0) {
        e.stunT--;
        e.vx *= 0.85;
      } else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) { e.state = "attack"; e.atkT = 16; }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT === 10) {
          const hx = e.facing > 0 ? e.x + 8 : e.x - 42;
          const pb = bodyBox(player);
          if (aabb(hx, e.y - 32, 36, 26, pb.x, pb.y, pb.w, pb.h)) hurtPlayer(15, 3.0, e.x);
        }
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 36; }
      } else if (adx > 32) {
        e.vx = e.facing * 0.72;
        e.state = "walk";
      } else {
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 20; }
      }
    } else if (e.type === "archer") {
      e.y = AQUA.y;
      e.vy = 0;
      if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 14;
          shots.push({
            type: "arrow",
            x: e.x + e.facing * 12,
            y: e.y - 26,
            vx: e.facing * 2.15,
            vy: 0.35,
            dmg: 12,
            life: 180,
          });
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 78; }
      } else {
        e.vx = 0;
        if (e.cd === 0 && adx < 360) { e.state = "flash"; e.flashT = 22; }
      }
    } else if (e.type === "centurion") {
      if (e.openT > 0) {
        e.openT--;
        if (e.openT === 0) e.guarded = true;
      }
      if (e.stunT > 0) e.stunT--;
      if (e.hp <= 100 && e.phase === 1) {
        e.phase = 2;
        announce("THE HOURS CHARGE", 100);
        brassSting();
      }
      if (e.stunT > 0) {
        e.vx *= 0.8;
      } else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "charge";
          e.charge = e.phase === 2 ? 52 : 36;
          e.vx = e.facing * (e.phase === 2 ? 4.6 : 2.4);
        }
      } else if (e.state === "charge") {
        e.charge--;
        const pb = bodyBox(player);
        const box = bodyBox(e);
        if (aabb(box.x, box.y, box.w, box.h, pb.x, pb.y, pb.w, pb.h)) {
          hurtPlayer(e.phase === 2 ? 22 : 16, 4.6, e.x);
        }
        if (e.charge <= 0) { e.state = "idle"; e.cd = e.phase === 2 ? 42 : 50; e.vx = 0; }
      } else {
        if (adx > 70) {
          e.vx = e.facing * (e.guarded ? 0.55 : 1.05);
          e.state = "walk";
        } else e.vx = e.facing * 0.2;
        if (e.cd === 0) { e.state = "flash"; e.flashT = e.guarded ? 28 : 16; e.vx = 0; }
      }
    } else if (e.type === "manatarms") {
      if (e.stunT > 0) {
        e.stunT--;
        e.vx *= 0.85;
      } else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) { e.state = "attack"; e.atkT = 16; }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT === 10) {
          const hx = e.facing > 0 ? e.x + 8 : e.x - 40;
          const pb = bodyBox(player);
          if (aabb(hx, e.y - 32, 34, 26, pb.x, pb.y, pb.w, pb.h)) hurtPlayer(15, 3.1, e.x);
        }
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 38; }
      } else if (adx > 30) {
        e.vx = e.facing * 0.78;
        e.state = "walk";
      } else {
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 20; }
      }
    } else if (e.type === "crossbow") {
      if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 16;
          shots.push({
            type: "bolt",
            x: e.x + e.facing * 14,
            y: e.y - 24,
            vx: e.facing * 1.35,
            vy: -0.15,
            dmg: 14,
            life: 220,
          });
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 96; }
      } else if (adx < 80) {
        e.vx = -e.facing * 0.7;
        e.state = "walk";
      } else if (adx > 200) {
        e.vx = e.facing * 0.55;
        e.state = "walk";
      } else {
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 28; }
      }
    } else if (e.type === "knight") {
      if (e.openT > 0) {
        e.openT--;
        if (e.openT === 0) e.guarded = true;
      }
      if (e.stunT > 0) {
        e.stunT--;
        e.vx *= 0.82;
      } else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) { e.state = "attack"; e.atkT = 18; }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT === 12) {
          const hx = e.facing > 0 ? e.x + 10 : e.x - 48;
          const pb = bodyBox(player);
          if (aabb(hx, e.y - 36, 42, 32, pb.x, pb.y, pb.w, pb.h)) hurtPlayer(20, 4.2, e.x);
        }
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 44; }
      } else if (adx > 36) {
        e.vx = e.facing * 0.58;
        e.state = "walk";
      } else {
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 24; }
      }
    } else if (e.type === "gate") {
      e.vx = 0;
      e.facing = 1;
    } else if (e.type === "baron") {
      if (e.openT > 0) {
        e.openT--;
        if (e.openT === 0 && e.phase === 1) e.guarded = true;
      }
      if (e.stunT > 0) e.stunT--;
      if (e.hp <= 110 && e.phase === 1) {
        e.phase = 2;
        e.guarded = false;
        e.openT = 240;
        announce("THE VISOR OPENS", 110);
        brassSting();
      }
      if (e.stunT > 0) {
        e.vx *= 0.8;
      } else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "charge";
          e.charge = e.phase === 2 ? 44 : 32;
          e.vx = e.facing * (e.phase === 2 ? 3.6 : 2.2);
        }
      } else if (e.state === "charge") {
        e.charge--;
        const pb = bodyBox(player);
        const box = bodyBox(e);
        if (aabb(box.x, box.y, box.w, box.h, pb.x, pb.y, pb.w, pb.h)) {
          hurtPlayer(e.phase === 2 ? 24 : 18, 4.8, e.x);
        }
        if (e.charge <= 0) { e.state = "idle"; e.cd = e.phase === 2 ? 40 : 48; e.vx = 0; }
      } else {
        if (e.phase === 2 && e.cd === 20) {
          dropChandelier(player.x);
          dropChandelier(player.x + 70);
          dropChandelier(player.x - 70);
        }
        if (adx > 70) {
          e.vx = e.facing * (e.guarded ? 0.5 : 0.95);
          e.state = "walk";
        } else e.vx = e.facing * 0.2;
        if (e.cd === 0) { e.state = "flash"; e.flashT = e.guarded ? 26 : 16; e.vx = 0; }
      }
    } else if (e.type === "lineinf") {
      if (e.stunT > 0) { e.stunT--; e.vx *= 0.85; }
      else if (e.state === "flash") {
        e.flashT--;
        e.vx = 0;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 18;
          shots.push({
            type: "musket",
            x: e.x + e.facing * 14,
            y: e.y - 26,
            vx: e.facing * 2.6,
            vy: 0,
            dmg: 13,
            life: 90,
          });
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 88; }
      } else if (adx > 150) {
        e.vx = e.facing * 0.7;
        e.state = "walk";
      } else if (adx < 70) {
        e.vx = -e.facing * 0.55;
        e.state = "walk";
      } else {
        e.vx = 0;
        e.state = "idle";
        if (e.cd === 0) { e.state = "flash"; e.flashT = 36; }
      }
    } else if (e.type === "lancer") {
      if (e.stunT > 0) { e.stunT--; e.vx *= 0.8; }
      else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "charge";
          e.charge = 40;
          e.vx = e.facing * 3.8;
        }
      } else if (e.state === "charge") {
        e.charge--;
        const pb = bodyBox(player);
        const box = bodyBox(e);
        if (aabb(box.x, box.y, box.w, box.h, pb.x, pb.y, pb.w, pb.h)) hurtPlayer(18, 4.4, e.x);
        if (e.charge <= 0) { e.state = "idle"; e.cd = 50; e.vx = 0; }
      } else if (adx > 50) {
        e.vx = e.facing * 1.15;
        e.state = "walk";
        if (e.cd === 0 && adx < 220) { e.state = "flash"; e.flashT = 18; e.vx = 0; }
      } else {
        e.vx = e.facing * 0.3;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 16; }
      }
    } else if (e.type === "powder") {
      if (e.stunT > 0) e.stunT--;
      if (e.hp <= 120 && e.phase === 1) {
        e.phase = 2;
        announce("POWDER IN THE AIR", 110);
        brassSting();
      }
      if (e.stunT > 0) e.vx *= 0.8;
      else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 20;
          if (e.phase === 1) {
            shots.push({ type: "ball", x: e.x, y: GROUND - 8, vx: e.facing * 2.2, vy: 0, dmg: 18, life: 200 });
          } else {
            shots.push({
              type: "bomb", x: player.x, y: GROUND - 12, vx: 0, vy: 0,
              fuse: 84, dmg: 24, life: 84, r: 40,
            });
          }
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = e.phase === 2 ? 46 : 40; }
      } else {
        if (adx > 80) { e.vx = e.facing * 0.7; e.state = "walk"; }
        else e.vx = e.facing * 0.25;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 22; e.vx = 0; }
      }
    } else if (e.type === "rifleinf") {
      if (e.stunT > 0) { e.stunT--; e.vx *= 0.85; }
      else if (e.state === "flash") {
        e.flashT--;
        e.vx = 0;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 14;
          shots.push({ type: "musket", x: e.x + e.facing * 14, y: e.y - 26, vx: e.facing * 3.4, vy: 0, dmg: 12, life: 80 });
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 70; }
      } else if (adx > 140) {
        e.vx = e.facing * 0.75; e.state = "walk";
      } else {
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 22; }
      }
    } else if (e.type === "mgnest") {
      e.vx = 0;
      e.facing = 1;
      if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 24;
          shots.push({ type: "mg", x: e.x - 28, y: e.y - 28, vx: -4.2, vy: 0, dmg: 8, life: 90 });
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT === 12) shots.push({ type: "mg", x: e.x - 28, y: e.y - 26, vx: -4.2, vy: 0, dmg: 8, life: 90 });
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 36; }
      } else if (e.cd === 0 && player.x < e.x) {
        e.state = "flash"; e.flashT = 10;
      }
    } else if (e.type === "armorcar") {
      if (e.stunT > 0) { e.stunT--; e.vx *= 0.8; }
      else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 16;
          shots.push({ type: "musket", x: e.x + e.facing * 30, y: e.y - 28, vx: e.facing * 4.0, vy: 0, dmg: 16, life: 80 });
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 50; }
      } else {
        if (adx > 80) { e.vx = e.facing * 0.85; e.state = "walk"; }
        else e.vx = e.facing * 0.2;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 18; e.vx = 0; }
      }
    } else if (e.type === "colonel") {
      if (e.stunT > 0) e.stunT--;
      if (e.hp <= 115 && e.phase === 1) {
        e.phase = 2;
        announce("FIRE MISSION", 110);
        brassSting();
      }
      if (e.state === "flash") {
        e.guarded = false;
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 20;
          const gap = e.phase === 2 ? 52 : 64;
          const spots = [player.x - gap - 20, player.x + 8, player.x + gap + 36];
          for (const x of spots) {
            shots.push({ type: "arty", x, y: GROUND, warn: 48, r: 24, dmg: 18, life: 48 });
          }
        }
      } else if (e.state === "attack") {
        e.atkT--;
        e.guarded = false;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = e.phase === 2 ? 42 : 52; e.guarded = true; }
      } else {
        e.guarded = true;
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 16; }
      }
    } else if (e.type === "modinf") {
      const cover = wrecks.find((w) => w.alive && Math.abs(w.x - e.x) < 80);
      if (cover && player.x < cover.x && e.x > cover.x - 30) {
        e.guarded = true;
        e.x += (cover.x + 16 - e.x) * 0.15;
        e.vx = 0;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 22; }
      } else e.guarded = false;
      if (e.stunT > 0) { e.stunT--; e.vx *= 0.85; }
      else if (e.state === "flash") {
        e.flashT--;
        e.vx = 0;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = 12;
          shots.push({ type: "burst", x: e.x + e.facing * 12, y: e.y - 24, vx: e.facing * 4.6, vy: 0, dmg: 11, life: 40 });
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 64; }
      } else if (!e.guarded && adx > 90) {
        e.vx = e.facing * 0.8; e.state = "walk";
      } else if (!e.guarded && e.cd === 0) {
        e.state = "flash"; e.flashT = 18;
      }
    } else if (e.type === "ifv") {
      if (e.stunT > 0) { e.stunT--; e.vx *= 0.8; }
      else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack"; e.atkT = 16;
          shots.push({ type: "burst", x: e.x + e.facing * 32, y: e.y - 26, vx: e.facing * 4.8, vy: 0, dmg: 16, life: 70 });
        }
      } else if (e.state === "attack") {
        e.atkT--;
        if (e.atkT <= 0) { e.state = "idle"; e.cd = 48; }
      } else {
        if (adx > 90) { e.vx = e.facing * 0.7; e.state = "walk"; }
        else e.vx = e.facing * 0.15;
        if (e.cd === 0) { e.state = "flash"; e.flashT = 18; e.vx = 0; }
      }
    } else if (e.type === "fracture") {
      if (e.stunT > 0) e.stunT--;
      if (e.hp <= 200 && e.phase === 1) { e.phase = 2; announce("AFTERIMAGE", 100); brassSting(); }
      if (e.hp <= 100 && e.phase === 2) { e.phase = 3; announce("THE BARREL OPENS", 110); brassSting(); }
      if (e.stunT > 0) e.vx *= 0.8;
      else if (e.state === "flash") {
        e.flashT--;
        if (e.flashT <= 0) {
          e.state = "attack";
          e.atkT = e.phase === 2 ? 36 : 22;
          if (e.phase === 1) {
            e.vx = e.facing * 2.4;
          } else if (e.phase === 2) {
            e.vx = e.facing * 3.6;
            shots.push({ type: "ghosthorse", x: e.x, y: GROUND, vx: e.facing * 3.4, vy: 0, dmg: 14, life: 50, facing: e.facing });
          } else {
            e.vx = 0;
            shots.push({ type: "shell", x: e.x + e.facing * 20, y: e.y - 28, vx: e.facing * 5.2, vy: 0, dmg: 22, life: 70, warn: 14, facing: e.facing });
            shots.push({ type: "divedrone", x: player.x + rand(-50, 50), y: -8, vx: 0, vy: 0, warn: 36, dmg: 14, life: 70 });
          }
        }
      } else if (e.state === "attack") {
        e.atkT--;
        const pb = bodyBox(player);
        const box = bodyBox(e);
        if (e.phase < 3 && aabb(box.x, box.y, box.w, box.h, pb.x, pb.y, pb.w, pb.h)) {
          hurtPlayer(e.phase === 2 ? 18 : 16, 4.0, e.x);
        }
        if (e.atkT <= 0) { e.state = "idle"; e.cd = e.phase === 3 ? 40 : 46; e.vx = 0; }
      } else {
        if (adx > 70) { e.vx = e.facing * (e.phase === 2 ? 1.1 : 0.7); e.state = "walk"; }
        else e.vx = e.facing * 0.2;
        if (e.cd === 0) { e.state = "flash"; e.flashT = e.phase === 1 ? 18 : 14; e.vx = 0; }
      }
    }

    if (e.ledge) {
      e.vy = 0;
      e.y = AQUA.y;
    } else {
      e.vy += GRAVITY;
      e.y += e.vy;
      const floor = standY(e.x, e.y, e.vy);
      if (e.y >= floor) { e.y = floor; e.vy = 0; }
    }
    e.x += e.vx;
    const left = lock ? lock.left + 20 : 40;
    const right = lock ? lock.right - 20 : LEVEL_W - 40;
    e.x = clamp(e.x, left, right);
  }

  function updateShots() {
    const pb = bodyBox(player);
    for (const s of shots) {
      if (s.type === "dronestrike") {
        s.fuse = (s.fuse || s.life) - 1;
        s.life--;
        if (s.fuse <= 0) {
          sparkBurst(s.x, s.y - 10, 22, true);
          bumpShake(14);
          sfx("hit");
          const pb2 = bodyBox(player);
          const dx = player.x - s.x, dy = player.y - s.y;
          if (dx * dx + dy * dy < (s.r || 38) * (s.r || 38)) hurtPlayer(Math.ceil(s.dmg * 0.35), 2.4, s.x);
          for (const e of enemies) {
            if (e.hp <= 0 || e.deadT > 0) continue;
            const ddx = e.x - s.x;
            if (ddx * ddx < (s.r || 38) * (s.r || 38)) {
              e.hp -= s.dmg;
              e.hurtT = 12;
              if (e.hp <= 0) killEnemy(e);
            }
          }
          s.dead = true;
        }
        continue;
      }
      if (s.type === "bomb") {
        s.fuse = (s.fuse || s.life) - 1;
        s.life--;
        const secs = Math.ceil(s.fuse / 60);
        if (s.fuse === 60 || s.fuse === 30) floatText(s.x, s.y - 22, String(Math.max(1, secs)), "#ffe27a");
        if (s.fuse <= 0) {
          sparkBurst(s.x, s.y, 22, true);
          bumpShake(12);
          sfx("hit");
          const dx = player.x - s.x, dy = player.y - s.y;
          if (dx * dx + dy * dy < (s.r || 40) * (s.r || 40)) hurtPlayer(s.dmg, 4.0, s.x);
          s.dead = true;
        }
        continue;
      }
      if (s.life-- <= 0) { s.dead = true; continue; }
      if ((s.type === "spear" || s.type === "chandelier" || s.type === "divedrone") && s.warn > 0) {
        s.warn--;
        if (s.warn === 0) s.vy = s.type === "chandelier" ? 5.4 : s.type === "divedrone" ? 6.2 : 7.2;
        continue;
      }
      if (s.type === "shell" && s.warn > 0) {
        s.warn--;
        if (s.warn === 0) { /* flies next frames */ }
        else continue;
      }
      s.vy += s.type === "stone" ? 0.18 : s.type === "bolt" ? 0.04 : 0;
      s.x += s.vx;
      s.y += s.vy;
      if (s.type !== "ball" && s.type !== "laneshot" && s.y > GROUND - 4) {
        s.dead = true; sparkBurst(s.x, GROUND - 4, 5, true); continue;
      }
      if (s.type === "ball") s.y = GROUND - 8;
      const sw = s.type === "chandelier" ? 22 : s.type === "limber" ? 12 : s.type === "ball" ? 10 : 8;
      const sh = s.type === "chandelier" ? 16 : s.type === "spear" ? 22 : s.type === "ball" ? 10 : 8;
      if (s.type === "arty") {
        s.warn = (s.warn || 0) - 1;
        if (s.warn <= 0) {
          sparkBurst(s.x, s.y - 8, 16, true);
          bumpShake(10);
          const dx = player.x - s.x, dy = player.y - s.y;
          if (dx * dx + dy * dy < (s.r || 24) * (s.r || 24) && player.y > GROUND - 20) hurtPlayer(s.dmg, 3.2, s.x);
          s.dead = true;
        }
        continue;
      }
      if (s.type === "ghosthorse") {
        if (aabb(s.x - 20, s.y - 28, 40, 28, pb.x, pb.y, pb.w, pb.h)) {
          hurtPlayer(s.dmg, 3.2, s.x);
          s.dead = true;
        }
        continue;
      }
      if (s.type === "pistol" || s.type === "limber" || s.type === "rifle" || s.type === "mg" || s.type === "burst" || s.type === "shell") {
        for (const e of enemies) {
          if (e.hp <= 0 || e.deadT > 0) continue;
          if (e.type === "mgnest" && s.x < e.x) continue;
          if (e.type === "modinf" && e.guarded && s.x < e.x) continue;
          const box = bodyBox(e);
          if (!aabb(s.x - 6, s.y - 4, 14, 8, box.x, box.y, box.w, box.h)) continue;
          e.hp -= s.dmg;
          e.hurtT = 12;
          e.vx = (s.vx > 0 ? 1 : -1) * 3.2;
          sparkBurst(s.x, s.y, 10, true);
          bloodBurst(s.x, s.y, s.vx > 0 ? 1 : -1, 10, e.hp <= 0);
          floatText(e.x, e.y - e.h - 4, "-" + s.dmg, "#d23a3a");
          sfx("hit");
          hitstop = Math.max(hitstop, 4);
          s.dead = true;
          if (e.hp <= 0) killEnemy(e);
          break;
        }
        continue;
      }
      if (aabb(s.x - sw / 2, s.y - sh / 2, sw, sh, pb.x, pb.y, pb.w, pb.h)) {
        if (s.type === "laneshot" && (player.y < GROUND - 18 || player.rolling)) continue;
        if (s.type === "ball" && player.y < GROUND - 14) continue;
        hurtPlayer(s.dmg, 2.6, s.x);
        s.dead = true;
        sparkBurst(s.x, s.y, 8, true);
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].dead) shots.splice(i, 1);
  }

  function updatePickups() {
    for (const p of pickups) {
      if (p.taken) continue;
      if (Math.abs(player.x - p.x) < 18 && Math.abs(player.y - p.y) < 30) {
        p.taken = true;
        if (p.type === "plus") {
          player.hp = Math.min(100, player.hp + 25);
          addScore(25);
          floatText(p.x, p.y - 16, "+25", "#ff6b6b");
          sfx("pickup");
        } else {
          if (player.lives >= maxLives && maxLives < MAX_LIVES) maxLives += 1;
          if (player.lives < maxLives) player.lives += 1;
          persistSave();
          addScore(100);
          floatText(p.x, p.y - 16, "+TETHER", "#e6c35c");
          sfx("life");
        }
        sparkBurst(p.x, p.y, 12, true);
      }
    }
    for (const f of flags) {
      if (!f.on && player.x > f.x - 10) {
        f.on = true;
        checkpoint = f.x;
        floatText(f.x, f.y - 70, "TETHER ANCHORED", "#e6c35c");
        sfx("checkpoint");
        tryRespawnVehicle(f.x + 36);
      }
    }
    if (doorOpen && !door.taken && player.x > door.x - 16) {
      door.taken = true;
      if (era === 1) {
        saveUnlock(2);
        startWarp(2);
      } else if (era === 2) {
        saveUnlock(3);
        startWarp(3);
      } else if (era === 3) {
        saveUnlock(4);
        startWarp(4);
      } else if (era === 4) {
        saveUnlock(5);
        startWarp(5);
      } else if (era === 5) {
        saveUnlock(6);
        startWarp(6);
      } else {
        saveUnlock(6);
        addScore(2500);
        ending = true;
        setWinCopy(6);
        mode = "win";
        fillScoreScreens();
        show(screens.win);
        sfx("win");
      }
    }
  }

  function updateFx() {
    for (const s of sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.12;
      s.life--;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      if (sparks[i].life <= 0) sparkPool.push(sparks.splice(i, 1)[0]);
    }
    const sparkCap = perfLow ? 40 : 96;
    while (sparks.length > sparkCap) sparkPool.push(sparks.shift());
    for (const st of stains) st.life--;
    for (let i = stains.length - 1; i >= 0; i--) if (stains[i].life <= 0) stains.splice(i, 1);
    if (hurtFlash > 0) hurtFlash--;
    for (const f of floats) { f.y -= 0.45; f.life--; }
    for (let i = floats.length - 1; i >= 0; i--) if (floats[i].life <= 0) floats.splice(i, 1);
    if (banner.t > 0) banner.t--;
    if (shake > 0.15) shake *= shakeDecay;
    else shake = 0;
    if (era === 4 && mode === "play") {
      const n = perfLow ? 1 : 2;
      for (let i = 0; i < n; i++) {
        snows.push({ x: camX + rand(-10, VW + 10), y: rand(-12, 20), vy: rand(0.6, 1.4), vx: rand(-0.3, 0.2), life: 70 });
      }
      for (const r of snows) { r.y += r.vy; r.x += r.vx; r.life--; }
      for (let i = snows.length - 1; i >= 0; i--) {
        if (snows[i].life <= 0 || snows[i].y > GROUND) snows.splice(i, 1);
      }
      if (snows.length > 80) snows.splice(0, snows.length - 80);
    } else snows.length = 0;
    if (era === 3 && mode === "play") {
      const n = perfLow ? 1 : 3;
      for (let i = 0; i < n; i++) {
        rain.push({ x: camX + rand(-20, VW + 20), y: rand(-20, 40), vy: rand(4.2, 6.4), life: 40 });
      }
      for (const r of rain) { r.y += r.vy; r.x += 0.35; r.life--; }
      for (let i = rain.length - 1; i >= 0; i--) {
        if (rain[i].life <= 0 || rain[i].y > GROUND) rain.splice(i, 1);
      }
      if (rain.length > 90) rain.splice(0, rain.length - 90);
      for (const m of muds) { m.x += m.vx; m.y += m.vy; m.vy += 0.18; m.life--; }
      for (let i = muds.length - 1; i >= 0; i--) if (muds[i].life <= 0) muds.splice(i, 1);
    } else {
      rain.length = 0;
      muds.length = 0;
    }
  }

  function updateCamera() {
    const target = player.x - VW * 0.38;
    let min = 0;
    let max = LEVEL_W - VW;
    if (lock) {
      min = lock.left - 40;
      max = lock.right - VW + 40;
    }
    camX += (clamp(target, min, max) - camX) * 0.12;
    camX = clamp(camX, min, max);
  }

  function cull() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.hp <= 0 && e.deadT <= 0) { enemies.splice(i, 1); continue; }
      if (!ROH.isSpecial(e.type) && e.type !== "knight" && e.x < camX - 260) enemies.splice(i, 1);
    }
  }

  function pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let g = null;
    for (let i = 0; i < pads.length; i++) if (pads[i]) { g = pads[i]; break; }
    if (!g) {
      gp.left = gp.right = gp.jump = gp.light = gp.heavy = gp.block = false;
      gp.jumpHeld = gp.lightHeld = gp.heavyHeld = false;
      gp.rollHeld = false;
      return;
    }
    const ax = g.axes && g.axes[0] != null ? g.axes[0] : 0;
    const pressed = (i) => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));
    const dpadL = pressed(14);
    const dpadR = pressed(15);
    const dpadU = pressed(12);
    const dpadD = pressed(13);
    gp.left = ax < -0.38 || dpadL;
    gp.right = ax > 0.38 || dpadR;
    const a = pressed(0);
    const b = pressed(1);
    const x = pressed(2);
    const y = pressed(3);
    if ((a || dpadU) && !gp.jumpHeld) tap.jump = true;
    gp.jumpHeld = a || dpadU;
    gp.jump = a || dpadU;
    if (dpadD && !gp.rollHeld) tap.roll = true;
    gp.rollHeld = dpadD;
    gp.block = b;
    if (x && !gp.lightHeld) tap.light = true;
    gp.lightHeld = x;
    gp.light = x;
    if (y && !gp.heavyHeld) tap.heavy = true;
    gp.heavyHeld = y;
    gp.heavy = y;
  }

  function update() {
    refreshPlayTouch();
    pollGamepad();
    time++;
    if (mode === "intro") {
      introT++;
      if (introT >= 240) landEra();
      return;
    }
    if (mode === "warp") {
      warpT++;
      if (banner.t > 0) banner.t--;
      if (warpT >= 120) {
        const lives = player.lives;
        const next = warpTo || 2;
        resetLevel({ era: next, keepLives: true });
        player.lives = lives;
        mode = "play";
        announce(ERA_LABEL[next] || "ERA II  ·  ROME", 150);
        sfx("land");
        if (ROH.musicStart && actx) ROH.musicStart(actx, master, next);
      }
      return;
    }
    if (mode !== "play") return;
    if (hitstop > 0) { hitstop--; updateFx(); return; }
    trySpawns();
    updatePlayer();
    hitEnemies();
    for (const e of enemies) updateEnemy(e);
    if (era === 5 && player.deadT === 0 && !player.rolling) {
      for (const L of searchlights) {
        L.a += L.da;
        if (L.a < 0.12 || L.a > 1.55) L.da *= -1;
        const cx = L.x + Math.sin(L.a) * 70;
        if (player.y > GROUND - 22 && Math.abs(player.x - cx) < L.w * 0.5) {
          if (time % 16 === 0) {
            player.hp -= 2;
            markDamaged();
            sparkBurst(player.x, player.y - 20, 3, true);
            if (player.hp <= 0) { player.hp = 0; loseLife(); }
          }
        }
      }
    }
    if (era === 6 && mode === "play") {
      droneT--;
      if (droneT <= 0) {
        droneT = 720;
        shots.push({ type: "divedrone", x: player.x + rand(-36, 36), y: -8, vx: 0, vy: 0, warn: 40, dmg: 16, life: 80 });
      }
    }
    updateShots();
    if (era === 4) {
      for (const c of cannons) {
        c.t++;
        if (c.t % 150 === 96) {
          shots.push({
            type: "laneshot",
            x: c.x + c.facing * 20,
            y: GROUND - 24,
            vx: c.facing * 2.5,
            vy: 0,
            dmg: 16,
            life: 170,
          });
          sparkBurst(c.x + c.facing * 22, GROUND - 24, 8, true);
          sfx("swing");
        }
      }
    }
    updatePickups();
    updateFx();
    updateCamera();
    cull();
  }

  function blit(spr, x, y, facing, dh, flash, bob) {
    if (!spr) return;
    const h = dh;
    const w = (spr.w / spr.h) * h;
    const dx = Math.round(x - camX);
    const dy = Math.round(y + (bob || 0));
    const ax = spr.anchor != null ? spr.anchor : 0.5;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(facing < 0 ? -1 : 1, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(spr.canvas, -w * ax, -h, w, h);
    if (flash) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.55;
      ctx.drawImage(spr.canvas, -w * ax, -h, w, h);
    }
    ctx.restore();
  }

  function blitKael(spr, x, y, facing, dh, bob) {
    if (!spr) return;
    const h = dh;
    const w = (spr.w / spr.h) * h;
    const dx = Math.round(x - camX);
    const dy = Math.round(y + (bob || 0));
    const ax = spr.anchor != null ? spr.anchor : 0.5;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.imageSmoothingEnabled = true;
    if (player.rolling) {
      const p = 1 - player.rollT / Math.max(1, player.rollMax);
      ctx.rotate(facing * p * Math.PI * 2.1);
      ctx.scale(facing < 0 ? -1 : 1, 0.7);
      ctx.shadowColor = "rgba(243, 226, 160, 0.45)";
      ctx.shadowBlur = 8;
      ctx.drawImage(spr.canvas, -w * ax, -h * 0.55, w, h);
    } else {
      const lean = player.attacking
        ? (player.phase === "wu" ? -0.22 : player.phase === "active" ? 0.32 : 0.08)
        : 0;
      ctx.scale(facing < 0 ? -1 : 1, 1);
      if (lean) ctx.rotate(lean);
      ctx.shadowColor = "rgba(8, 0, 6, 0.9)";
      ctx.shadowBlur = perfLow ? 0 : 6;
      ctx.drawImage(spr.canvas, -w * ax, -h, w, h);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
    if (!player.rolling && player.anim !== "death" && player.anim !== "idle") drawScarfTrail(dx, dy, facing, h, bob);
  }

  function drawPits() {
    for (const p of pits) {
      const x = p.x - camX;
      if (x + p.w < -8 || x > VW + 8) continue;
      ctx.fillStyle = era === 4 ? "#8aa0b0" : era === 6 ? "#2a2c30" : era === 5 ? "#0c0c0a" : era === 3 ? "#0a0806" : era === 2 ? "#1a1814" : "#4a3014";
      ctx.fillRect(x, GROUND - 4, p.w, VH - GROUND + 10);
      ctx.fillStyle = "#060402";
      ctx.fillRect(x + 3, GROUND + 6, p.w - 6, 48);
      ctx.fillStyle = era === 1 ? "#3a140c" : "#1a0c08";
      const spikes = Math.max(3, (p.w / 18) | 0);
      for (let i = 0; i < spikes; i++) {
        const sx = x + 10 + i * (p.w - 20) / Math.max(1, spikes - 1);
        ctx.beginPath();
        ctx.moveTo(sx - 5, VH - 6);
        ctx.lineTo(sx, GROUND + 18);
        ctx.lineTo(sx + 5, VH - 6);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(230,195,92,0.22)";
      ctx.fillRect(x, GROUND - 5, p.w, 2);
      ctx.fillStyle = "rgba(210,58,58,0.18)";
      ctx.fillRect(x + 6, GROUND + 10, p.w - 12, 8);
    }
  }

  function drawLedges() {
    for (const L of ledges) {
      if (L.gone || !L.kind) continue;
      const x = L.x - camX + ((L.fragile && L.shakeT > 8) ? Math.sin(time * 1.4) * 1.5 : 0);
      const y = L.y + (L.fall || 0);
      if (x + L.w < -8 || x > VW + 8) continue;
      const top = L.kind === "ice" ? "#d8e4ee" : L.kind === "wood" ? "#6a4422" : L.kind === "brick" ? "#8a5a40" : L.kind === "rubble" ? "#4a443c" : L.kind === "concrete" ? "#6a6e72" : "#d4a85c";
      const side = L.kind === "ice" ? "#9ab0c0" : L.kind === "wood" ? "#3a2410" : L.kind === "brick" ? "#5a3828" : L.kind === "rubble" ? "#2a2620" : L.kind === "concrete" ? "#4a4e52" : "#8a6428";
      const drop = Math.min(22, Math.max(8, GROUND - y - 8));
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(x + 3, y + 4, L.w - 2, drop);
      ctx.fillStyle = side;
      ctx.fillRect(x, y, L.w, drop);
      ctx.fillStyle = top;
      ctx.fillRect(x - 2, y - 6, L.w + 4, 7);
      ctx.fillStyle = "rgba(255,246,200,0.35)";
      ctx.fillRect(x - 1, y - 6, L.w + 2, 2);
      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + drop);
      ctx.lineTo(x + 10, y + drop + 8);
      ctx.lineTo(x + 14, y + drop);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + L.w - 14, y + drop);
      ctx.lineTo(x + L.w - 10, y + drop + 8);
      ctx.lineTo(x + L.w - 6, y + drop);
      ctx.fill();
      if (L.kind === "wood") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(x + 8, y - 4, 1, 5);
        ctx.fillRect(x + L.w * 0.5, y - 4, 1, 5);
      }
      if (L.fragile) {
        ctx.fillStyle = "rgba(80,10,10,0.55)";
        ctx.fillRect(x + 6, y - 3, L.w * 0.3, 2);
        ctx.fillRect(x + L.w * 0.55, y - 2, L.w * 0.28, 2);
      }
    }
  }

  function drawSwing() {
    if (!player.attacking || player.deadT > 0) return;
    const spec = currentSpec();
    if (!spec) return;
    const dir = player.facing;
    const ox = player.x - camX + dir * 8;
    const oy = player.y - 22;
    const gun = !!(spec.shot || spec.burst || spec.mark);
    const t = player.phase === "wu" ? player.phaseT / Math.max(1, spec.wu) : player.phase === "active" ? 1 : 0.35;
    ctx.save();
    if (gun) {
      if (player.phase === "wu" || player.phase === "active") {
        const reach = spec.range || 80;
        ctx.strokeStyle = player.phase === "wu" ? "rgba(243,226,160,0.55)" : "rgba(255,246,200,0.9)";
        ctx.lineWidth = player.phase === "active" ? 2.4 : 1;
        ctx.beginPath();
        ctx.moveTo(ox + dir * 10, oy);
        ctx.lineTo(ox + dir * (player.phase === "wu" ? reach * 0.7 : 22), oy);
        ctx.stroke();
        if (player.phase === "active") {
          const g = ctx.createRadialGradient(ox + dir * 14, oy, 1, ox + dir * 14, oy, 16);
          g.addColorStop(0, "rgba(255,246,200,0.95)");
          g.addColorStop(0.4, "rgba(255,160,60,0.55)");
          g.addColorStop(1, "rgba(210,58,58,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(ox + dir * 14, oy, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }
    const heavy = player.kind === "heavy";
    const reach = spec.range * (heavy ? 1.05 : player.combo >= 3 ? 0.95 : player.combo === 2 ? 0.72 : 0.52);
    const thrust = era === 5 && !heavy;
    const spear = era === 1 && heavy;
    const bash = era === 2 && heavy;
    const cleave = era === 3 && heavy;
    const a = player.phase === "active" ? 0.95 : player.phase === "wu" ? 0.28 + t * 0.25 : 0.18;
    ctx.globalAlpha = a;
    ctx.strokeStyle = heavy ? "#fff6c8" : "#f3e2a0";
    ctx.lineWidth = heavy ? (cleave ? 5 : 3.4) : player.combo >= 3 ? 3 : 1.8;
    ctx.lineCap = "round";
    if (thrust || spear) {
      const len = (player.phase === "active" ? reach : reach * (0.3 + t * 0.5));
      ctx.beginPath();
      ctx.moveTo(ox + dir * 6, oy + (spear ? -8 : 2));
      ctx.lineTo(ox + dir * (6 + len), oy + (spear ? -14 : 2));
      ctx.stroke();
      if (player.phase === "active") {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ox + dir * 8, oy);
        ctx.lineTo(ox + dir * (8 + len * 0.85), oy);
        ctx.stroke();
      }
    } else if (bash && player.phase === "active") {
      ctx.strokeStyle = "rgba(230,195,92,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ox + dir * 10, oy + 4, 16 + t * 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const start = dir > 0 ? (player.combo >= 3 ? -1.6 : -1.15) : Math.PI - (player.combo >= 3 ? 0.1 : 0.4);
      const span = (cleave ? 2.5 : heavy ? 2.05 : player.combo >= 3 ? 1.95 : player.combo === 2 ? 1.45 : 1.05) * dir;
      const r = 10 + reach * (player.phase === "wu" ? 0.4 + t * 0.25 : 0.95);
      const lift = player.combo >= 3 ? -14 : cleave ? -8 : 2;
      if (player.phase === "active") {
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.22 * i;
          ctx.lineWidth = (heavy ? 5 : 2.4) * (i / 3);
          ctx.strokeStyle = i === 1 ? "#fff6c8" : "#e6c35c";
          ctx.beginPath();
          ctx.arc(ox - dir * i * 3, oy + lift + i, r - i * 3, start, start + span, dir < 0);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(ox, oy + lift, r * 0.7, start, start + span * 0.88, dir < 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(ox, oy + lift, r, start, start + span, dir < 0);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawScarfTrail(dx, dy, facing, h, bob) {
    const t = time;
    const back = -facing;
    const rootX = dx - facing * 3;
    const rootY = dy - h * 0.66 + (bob || 0) * 0.2;
    const motion = player.anim === "run" ? 1 : player.anim === "jump" ? 1.15 : 0.7;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const ribbons = [
      { w: 2.2, len: 11 * motion, phase: 0, y: 0 },
      { w: 1.6, len: 8 * motion, phase: 1.6, y: 4 },
    ];
    for (const rb of ribbons) {
      const tipX = rootX + back * rb.len + Math.sin(t * 0.2 + rb.phase) * 2;
      const tipY = rootY + 7 + rb.y + Math.sin(t * 0.24 + rb.phase) * 2.4;
      const midX = rootX + back * (rb.len * 0.45);
      const midY = rootY + 3 + rb.y * 0.4;
      ctx.beginPath();
      ctx.moveTo(rootX, rootY + rb.y);
      ctx.quadraticCurveTo(midX, midY, tipX, tipY);
      ctx.strokeStyle = "#120108";
      ctx.lineWidth = rb.w + 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rootX, rootY + rb.y);
      ctx.quadraticCurveTo(midX, midY, tipX, tipY);
      ctx.strokeStyle = "#ff2a52";
      ctx.lineWidth = rb.w;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawIntro() {
    const t = introT;
    const p = Math.min(1, t / 240);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VW, VH);

    const crackH = Math.min(VH, t * 3.4);
    ctx.save();
    ctx.translate(VW * 0.5, 0);
    ctx.fillStyle = "#e6c35c";
    ctx.shadowColor = "#e6c35c";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    for (let y = 0; y < crackH; y += 8) {
      ctx.lineTo(Math.sin(y * 0.18 + t * 0.08) * 6 + (y % 16 < 8 ? 2 : -3), y);
    }
    ctx.lineTo(1, crackH);
    for (let y = crackH; y >= 0; y -= 8) {
      ctx.lineTo(Math.sin(y * 0.18 + t * 0.08) * 6 + (y % 16 < 8 ? -1 : 2), y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const layers = [
      { name: "OLD KINGDOM", col: "#24160c", acc: "#6a4a20" },
      { name: "TROY", col: "#2e1c12", acc: "#8a5a28" },
      { name: "MARATHON", col: "#3a2416", acc: "#a07038" },
      { name: "ALEXANDER", col: "#c46a38", acc: "#f3e2a0" },
    ];
    for (let i = 0; i < layers.length; i++) {
      const fall = t * 2.35 - i * 58;
      const y = 36 + fall;
      if (y > VH + 40 || y < -80) continue;
      const L = layers[i];
      ctx.fillStyle = L.col;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(0, y, VW, 50);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(230,195,92,0.4)";
      ctx.fillRect(0, y, VW, 2);
      ctx.fillRect(0, y + 48, VW, 2);
      ctx.fillStyle = L.acc;
      ctx.font = "12px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.fillText(L.name, VW / 2, y + 30);
      ctx.fillStyle = "#2a1810";
      for (let s = 0; s < 12; s++) {
        ctx.fillRect(20 + s * 38 + (i % 2) * 8, y + 38, 2, 7);
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, VW, 38);
    ctx.fillStyle = "#f3e2a0";
    ctx.font = "13px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.fillText("FALLING THROUGH TIME", VW / 2, 24);
    ctx.fillStyle = "#8a7340";
    ctx.font = "8px Cinzel, serif";
    ctx.fillText("PRESS ANY KEY  ·  SKIP", VW / 2, VH - 14);

    if (p > 0.78) {
      const a = (p - 0.78) / 0.22;
      ctx.fillStyle = "rgba(224,154,74," + (a * 0.55) + ")";
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    if (ending || (era === 6 && mode === "win")) {
      g.addColorStop(0, "#6a88b0");
      g.addColorStop(0.4, "#c8a070");
      g.addColorStop(0.72, "#e8c090");
      g.addColorStop(1, "#f0d8b0");
    } else if (era === 6) {
      g.addColorStop(0, "#4a5460");
      g.addColorStop(0.4, "#6a7078");
      g.addColorStop(0.75, "#8a8884");
      g.addColorStop(1, "#9a9488");
    } else if (era === 5) {
      g.addColorStop(0, "#05060a");
      g.addColorStop(0.45, "#12151c");
      g.addColorStop(0.78, "#2a2218");
      g.addColorStop(1, "#3a2a1c");
    } else if (era === 4) {
      g.addColorStop(0, "#9aa8b4");
      g.addColorStop(0.4, "#c4ced6");
      g.addColorStop(0.75, "#e2e8ee");
      g.addColorStop(1, "#f0f4f8");
    } else if (era === 3) {
      g.addColorStop(0, "#07080c");
      g.addColorStop(0.4, "#12161c");
      g.addColorStop(0.72, "#1c2228");
      g.addColorStop(1, "#2a2418");
    } else if (era === 2) {
      g.addColorStop(0, "#14182c");
      g.addColorStop(0.38, "#3a3348");
      g.addColorStop(0.7, "#8a6a58");
      g.addColorStop(1, "#c4a078");
    } else {
      g.addColorStop(0, "#1b1630");
      g.addColorStop(0.35, "#5a3a3a");
      g.addColorStop(0.62, "#c46a38");
      g.addColorStop(1, "#e09a4a");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    ctx.save();
    ctx.globalAlpha = ending ? 0.35 : 0.85;
    ctx.strokeStyle = "#e6c35c";
    ctx.lineWidth = ending ? 1 : 1.4;
    ctx.shadowColor = "#e6c35c";
    ctx.shadowBlur = ending || perfLow ? 0 : 8;
    const ox = -((camX * 0.12) % 400);
    if (ending) {
      ctx.beginPath();
      ctx.moveTo(VW * 0.5, 8);
      ctx.lineTo(VW * 0.5, GROUND - 8);
      ctx.stroke();
    } else for (let k = 0; k < 4; k++) {
      const base = ox + k * 160 + 30;
      ctx.beginPath();
      let x = base, y = 6 + (k % 3) * 8;
      ctx.moveTo(x, y);
      for (let i = 0; i < 9; i++) {
        x += 7 + ((k * 13 + i * 9) % 11);
        y += 10 + ((k + i) % 5) - 2;
        ctx.lineTo(x + Math.sin(time * 0.03 + i) * 0.6, y);
      }
      ctx.stroke();
      if (k === 1) {
        ctx.beginPath();
        ctx.moveTo(base + 28, 40);
        ctx.lineTo(base + 18, 62);
        ctx.lineTo(base + 30, 90);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (era === 6 && (ending || mode === "win")) {
      const sun = ctx.createRadialGradient(400, 58, 4, 400, 58, 46);
      sun.addColorStop(0, "#ffd27a");
      sun.addColorStop(1, "rgba(255,140,60,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(350, 20, 100, 80);
    } else if (era === 5) {
      ctx.fillStyle = "rgba(255, 210, 120, 0.12)";
      ctx.fillRect(300, 20, 80, 40);
    } else if (era === 4) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(86, 38, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (era !== 3 && era !== 6) {
      const sun = ctx.createRadialGradient(400, 58, 4, 400, 58, 46);
      sun.addColorStop(0, "#ffd27a");
      sun.addColorStop(1, "rgba(255,140,60,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(350, 20, 100, 80);
    } else if (era === 3) {
      const moon = ctx.createRadialGradient(390, 42, 3, 390, 42, 28);
      moon.addColorStop(0, "#c8d0d8");
      moon.addColorStop(1, "rgba(80,90,110,0)");
      ctx.fillStyle = moon;
      ctx.fillRect(360, 18, 60, 50);
    }
  }

  function drawKeep() {
    const p = camX * 0.18;
    ctx.fillStyle = "#141820";
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.lineTo(VW, 158);
    ctx.lineTo(VW, GROUND);
    ctx.lineTo(0, GROUND);
    ctx.fill();

    const pal = SPR.palisade;
    if (pal) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      const tw = 72;
      const start = -((camX * 0.45) % tw);
      for (let x = start; x < VW + tw; x += tw) {
        ctx.drawImage(pal.canvas, x, 132, tw, GROUND - 132);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#1a1612";
      for (let i = 0; i < 18; i++) {
        const x = ((i * 36 - camX * 0.45) % (VW + 40));
        ctx.fillRect(x, 140, 10, GROUND - 140);
        ctx.fillRect(x - 2, 136, 14, 6);
      }
    }

    const kx = 3900 - camX * 0.32;
    ctx.fillStyle = "#10141a";
    ctx.fillRect(kx, 78, 160, GROUND - 78);
    ctx.fillRect(kx + 40, 42, 36, 40);
    ctx.fillRect(kx + 100, 28, 28, 54);
    ctx.fillStyle = "#0a0c10";
    ctx.beginPath();
    ctx.moveTo(kx - 8, 80);
    ctx.lineTo(kx + 80, 48);
    ctx.lineTo(kx + 168, 80);
    ctx.fill();
    ctx.fillStyle = "#e6c35c";
    ctx.globalAlpha = 0.35;
    ctx.fillRect(kx + 22, 110, 10, 16);
    ctx.fillRect(kx + 70, 118, 10, 16);
    ctx.fillRect(kx + 118, 108, 10, 16);
    ctx.globalAlpha = 1;

    if (lock && enemies.some((n) => n.type === "baron" && n.hp > 0)) {
      ctx.fillStyle = "rgba(8, 6, 10, 0.45)";
      ctx.fillRect(0, 0, VW, GROUND);
      const stone = SPR.keep;
      if (stone) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.drawImage(stone.canvas, 0, 40, VW, GROUND - 48);
        ctx.restore();
      }
      ctx.fillStyle = "#2a2018";
      ctx.fillRect(40, 36, VW - 80, 14);
      ctx.fillStyle = "#c9a227";
      for (let i = 0; i < 5; i++) {
        const cx = 70 + i * 86;
        ctx.beginPath();
        ctx.arc(cx, 58, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6a5420";
        ctx.fillRect(cx - 1, 58, 2, 18);
        ctx.fillStyle = "#c9a227";
      }
    }

    const sx = GATE_X + 220 - camX;
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(sx - 36, GROUND - 52, 72, 52);
    ctx.fillStyle = "#2a2218";
    ctx.beginPath();
    ctx.moveTo(sx - 42, GROUND - 50);
    ctx.lineTo(sx, GROUND - 74);
    ctx.lineTo(sx + 42, GROUND - 50);
    ctx.fill();
    ctx.fillStyle = "rgba(230,195,92,0.22)";
    ctx.fillRect(sx - 10, GROUND - 40, 20, 40);
  }

  function drawEmpire() {
    ctx.fillStyle = "#c5cdd4";
    ctx.beginPath();
    ctx.moveTo(0, 168);
    ctx.lineTo(VW, 176);
    ctx.lineTo(VW, GROUND);
    ctx.lineTo(0, GROUND);
    ctx.fill();

    for (let i = 0; i < 10; i++) {
      const x = ((i * 92 - camX * 0.4) % (VW + 80)) - 20;
      ctx.fillStyle = "#0c0c0e";
      ctx.beginPath();
      ctx.moveTo(x, GROUND - 8);
      ctx.lineTo(x - 9, GROUND - 48 - (i % 3) * 10);
      ctx.lineTo(x, GROUND - 78 - (i % 4) * 8);
      ctx.lineTo(x + 9, GROUND - 48 - (i % 3) * 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x - 1.5, GROUND - 12, 3, 12);
    }

    for (let i = 0; i < 5; i++) {
      const x = ((i * 210 - camX * 0.22) % (VW + 60));
      const h = 40 + (i % 3) * 16 + Math.sin(time * 0.03 + i) * 6;
      ctx.fillStyle = "rgba(40,40,44,0.35)";
      ctx.beginPath();
      ctx.moveTo(x, GROUND - 90);
      ctx.bezierCurveTo(x - 10, GROUND - 90 - h * 0.4, x + 8, GROUND - 90 - h * 0.7, x - 4, GROUND - 90 - h);
      ctx.lineTo(x + 10, GROUND - 90 - h);
      ctx.bezierCurveTo(x + 16, GROUND - 90 - h * 0.5, x + 6, GROUND - 90 - h * 0.2, x + 12, GROUND - 90);
      ctx.fill();
    }

    const mx = 3600 - camX * 0.3;
    ctx.fillStyle = "#6a6460";
    ctx.fillRect(mx, GROUND - 70, 110, 70);
    ctx.fillStyle = "#4a4440";
    ctx.beginPath();
    ctx.moveTo(mx - 8, GROUND - 68);
    ctx.lineTo(mx + 40, GROUND - 98);
    ctx.lineTo(mx + 88, GROUND - 62);
    ctx.lineTo(mx + 118, GROUND - 70);
    ctx.fill();
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(mx + 18, GROUND - 36, 16, 36);
    ctx.fillRect(mx + 70, GROUND - 28, 12, 16);

    if (lock && enemies.some((n) => n.type === "powder" && n.hp > 0)) {
      ctx.fillStyle = "rgba(90, 96, 104, 0.35)";
      ctx.fillRect(0, 40, VW, GROUND - 40);
      ctx.strokeStyle = "#8a9098";
      ctx.strokeRect(30, 48, VW - 60, GROUND - 56);
    }

    const park = CART_X - camX;
    ctx.fillStyle = "#5a5048";
    ctx.fillRect(park - 50, GROUND - 8, 100, 6);
    ctx.fillStyle = "rgba(230,195,92,0.2)";
    ctx.fillRect(park - 16, GROUND - 28, 32, 20);
  }

  function drawNightStreet() {
    ctx.fillStyle = "#141820";
    ctx.fillRect(0, 130, VW, GROUND - 130);
    for (let i = 0; i < 8; i++) {
      const x = ((i * 140 - camX * 0.28) % (VW + 80)) - 20;
      ctx.fillStyle = i % 2 ? "#1c1814" : "#181410";
      ctx.fillRect(x, 70, 48, GROUND - 70);
      ctx.fillStyle = "rgba(255, 140, 60, 0.18)";
      ctx.fillRect(x + 12, 100, 8, 10);
      ctx.fillRect(x + 28, 118, 8, 10);
    }
    for (const L of NEST_RUBBLE) {
      const x = L.x - camX;
      ctx.fillStyle = "#3a342c";
      ctx.fillRect(x, L.y, L.w, GROUND - L.y);
      ctx.fillStyle = "#2a241c";
      ctx.fillRect(x - 2, L.y - 5, L.w + 4, 6);
    }
    for (let i = 0; i < 6; i++) {
      const x = ((i * 190 - camX * 0.18) % (VW + 40));
      const flick = 14 + Math.sin(time * 0.2 + i) * 6;
      ctx.fillStyle = "rgba(255, 120, 40, 0.35)";
      ctx.fillRect(x, GROUND - 40 - flick, 8, flick);
      ctx.fillStyle = "rgba(255, 200, 80, 0.2)";
      ctx.beginPath();
      ctx.arc(x + 4, GROUND - 44 - flick * 0.3, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const L of searchlights) {
      const cx = L.x - camX;
      const tip = cx + Math.sin(L.a) * 70;
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#f3e2a0";
      ctx.beginPath();
      ctx.moveTo(cx, 8);
      ctx.lineTo(tip - L.w / 2, GROUND);
      ctx.lineTo(tip + L.w / 2, GROUND);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    const col = enemies.find((n) => n.type === "colonel" && n.hp > 0);
    if (col && SPR.staffcar) blit(SPR.staffcar, col.x - 56, GROUND, 1, 48, false, 0);
  }

  function drawPresent() {
    ctx.fillStyle = "#5a5e64";
    ctx.fillRect(0, 110, VW, GROUND - 110);
    for (let i = 0; i < 7; i++) {
      const x = ((i * 130 - camX * 0.3) % (VW + 90)) - 30;
      ctx.fillStyle = i % 2 ? "#6a6e74" : "#585c62";
      ctx.fillRect(x, 48, 70, GROUND - 48);
      ctx.fillStyle = "#3a3e44";
      ctx.fillRect(x + 10, 70, 12, 16);
      ctx.fillRect(x + 40, 90, 12, 16);
      ctx.fillRect(x + 22, GROUND - 36, 18, 36);
    }
    for (let i = 0; i < 8; i++) {
      const x = ((i * 88 - camX * 0.42) % (VW + 60)) - 16;
      ctx.fillStyle = "#1c2018";
      ctx.beginPath();
      ctx.moveTo(x, GROUND - 6);
      ctx.lineTo(x - 6, GROUND - 40);
      ctx.lineTo(x, GROUND - 62);
      ctx.lineTo(x + 6, GROUND - 40);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#6a5420";
    for (let i = 0; i < 4; i++) {
      const x = ((i * 210 - camX * 0.5) % (VW + 40));
      ctx.globalAlpha = 0.35;
      ctx.fillRect(x, 80, 18, 4);
      ctx.fillRect(x + 4, 78, 3, 10);
      ctx.globalAlpha = 1;
    }
    const gx = TANK_X - camX;
    ctx.fillStyle = "#4a4e52";
    ctx.fillRect(gx - 70, GROUND - 64, 140, 64);
    ctx.fillStyle = "#3a3e42";
    ctx.fillRect(gx - 74, GROUND - 70, 60, 12);
    ctx.fillRect(gx + 10, GROUND - 58, 70, 10);
    for (const w of wrecks) {
      if (!w.alive || !SPR.wreck) continue;
      blit(SPR.wreck, w.x, GROUND, 1, 36, false, 0);
    }
  }

  function drawDunes() {
    const p = camX * 0.25;
    ctx.fillStyle = "#b86a32";
    ctx.beginPath();
    ctx.moveTo(0, 168);
    for (let x = 0; x <= VW; x += 16) {
      const wx = x + p;
      const y = 150 + Math.sin(wx * 0.01) * 10 + Math.sin(wx * 0.023) * 6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW, GROUND);
    ctx.lineTo(0, GROUND);
    ctx.fill();

    const p2 = camX * 0.4;
    ctx.fillStyle = "#c97a3a";
    ctx.beginPath();
    ctx.moveTo(0, 190);
    for (let x = 0; x <= VW; x += 12) {
      const wx = x + p2;
      const y = 176 + Math.sin(wx * 0.014) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW, GROUND);
    ctx.lineTo(0, GROUND);
    ctx.fill();

    const p3 = camX * 0.38;
    ctx.fillStyle = "#2a1810";
    const armyN = perfLow ? 28 : 70;
    for (let i = 0; i < armyN; i++) {
      const x = ((i * 47 - p3) % (VW + 80)) - 20;
      const y = 168 + (i % 5) * 2 + Math.sin(time * 0.02 + i) * 0.7;
      const h = 3 + (i % 4);
      ctx.fillRect(x, y - h, 1.6, h);
      if (i % 9 === 0) {
        ctx.fillStyle = "#6b1c16";
        ctx.fillRect(x - 1, y - h - 5, 5, 4);
        ctx.fillStyle = "#2a1810";
      }
    }

    if (!perfLow) {
      ctx.fillStyle = "rgba(232, 170, 90, 0.18)";
      for (let y = 148; y < 176; y += 2) {
        const ox = Math.sin(time * 0.05 + y * 0.4) * 1.8;
        ctx.fillRect(ox, y, VW, 1);
      }
    }
  }

  function drawCypress(wx, baseY, h) {
    const x = wx - camX * 0.45;
    ctx.fillStyle = "#1c2418";
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x - 7, baseY - h * 0.35);
    ctx.lineTo(x - 4, baseY - h * 0.7);
    ctx.lineTo(x, baseY - h);
    ctx.lineTo(x + 4, baseY - h * 0.7);
    ctx.lineTo(x + 7, baseY - h * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2a1810";
    ctx.fillRect(x - 1.5, baseY - 6, 3, 8);
  }

  function drawRome() {
    const p = camX * 0.22;
    ctx.fillStyle = "#6a5a4a";
    ctx.beginPath();
    ctx.moveTo(0, 170);
    for (let x = 0; x <= VW; x += 18) {
      const wx = x + p;
      ctx.lineTo(x, 148 + Math.sin(wx * 0.012) * 10);
    }
    ctx.lineTo(VW, GROUND);
    ctx.lineTo(0, GROUND);
    ctx.fill();

    for (let i = 0; i < 9; i++) {
      const wx = i * 220 + 40;
      drawCypress(((wx - camX * 0.45) % (VW + 160)) - 40, 176, 38 + (i % 3) * 8);
    }

    if (horse) {
      const sx = horse.shrineX - camX;
      const pulse = 0.4 + Math.sin(time * 0.16) * 0.25;
      ctx.save();
      const grd = ctx.createRadialGradient(sx, GROUND - 28, 4, sx, GROUND - 20, 36);
      grd.addColorStop(0, "rgba(255,236,160," + pulse + ")");
      grd.addColorStop(1, "rgba(230,195,92,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(sx - 40, GROUND - 70, 80, 70);
      ctx.fillStyle = "#e6c35c";
      ctx.fillRect(sx - 8, GROUND - 18, 16, 18);
      ctx.fillRect(sx - 12, GROUND - 22, 24, 4);
      ctx.restore();
    }

    if (villaX) {
      const vx = villaX - camX;
      ctx.fillStyle = "#3a2a22";
      ctx.fillRect(vx, GROUND - 58, 86, 58);
      ctx.fillStyle = "#5a3020";
      ctx.beginPath();
      ctx.moveTo(vx - 8, GROUND - 56);
      ctx.lineTo(vx + 43, GROUND - 86);
      ctx.lineTo(vx + 94, GROUND - 56);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 120, 40, 0.55)";
      const flick = 10 + Math.sin(time * 0.3) * 6;
      ctx.fillRect(vx + 18, GROUND - 40 - flick * 0.2, 12, flick);
      ctx.fillRect(vx + 48, GROUND - 36 - flick * 0.15, 10, flick * 0.8);
      ctx.fillStyle = "rgba(255, 200, 80, 0.35)";
      ctx.beginPath();
      ctx.arc(vx + 40, GROUND - 70, 22 + Math.sin(time * 0.2) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAqueduct() {
    const x0 = AQUA.x - camX;
    const top = AQUA.y;
    const brick = SPR.brick;
    ctx.save();
    for (const s of AQUA_STEPS) {
      const sx = s.x - camX;
      ctx.fillStyle = "#4a4440";
      ctx.fillRect(sx, s.y, s.w, GROUND - s.y);
      if (brick) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(brick.canvas, sx, s.y, s.w, GROUND - s.y);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "#6a645c";
      ctx.fillRect(sx - 2, s.y - 6, s.w + 4, 7);
    }
    ctx.fillStyle = "#4a4440";
    ctx.fillRect(x0, top, AQUA.w, GROUND - top);
    if (brick) {
      ctx.globalAlpha = 0.55;
      ctx.imageSmoothingEnabled = true;
      for (let x = x0; x < x0 + AQUA.w; x += 64) {
        ctx.drawImage(brick.canvas, x, top, 64, GROUND - top);
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#2a2624";
    for (let i = 0; i < 7; i++) {
      const ax = x0 + 40 + i * 92;
      ctx.beginPath();
      ctx.moveTo(ax, GROUND);
      ctx.quadraticCurveTo(ax + 28, top + 18, ax + 56, GROUND);
      ctx.lineTo(ax + 48, GROUND);
      ctx.quadraticCurveTo(ax + 28, top + 28, ax + 8, GROUND);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#6a645c";
    ctx.fillRect(x0 - 4, top - 8, AQUA.w + 8, 10);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x0, top - 8, AQUA.w, 3);
    ctx.restore();
  }

  function drawWarp() {
    draw();
    const p = Math.min(1, warpT / 120);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.25 + Math.sin(warpT * 0.4) * 0.12;
    ctx.fillStyle = warpT % 16 < 8 ? "#e6c35c" : "#7ad0e6";
    ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 18; i++) {
      const y = ((i * 31 + warpT * 7) % (VH + 20)) - 10;
      ctx.fillStyle = i % 2 ? "#e6c35c" : "#f3e2a0";
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, y, VW, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f3e2a0";
    ctx.font = "13px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.fillText(ERA_LABEL[warpTo] || "ERA II  ·  ROME", VW / 2, VH / 2);
    ctx.fillStyle = "#8a7340";
    ctx.font = "8px Cinzel, serif";
    ctx.fillText("THE PALETTE TEARS", VW / 2, VH / 2 + 16);
    ctx.restore();
    if (p > 0.82) {
      ctx.fillStyle = "rgba(230,195,92," + ((p - 0.82) / 0.18) + ")";
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function drawGround() {
    if (era === 6) {
      ctx.fillStyle = "#6a6864";
      ctx.fillRect(0, GROUND - 4, VW, VH - (GROUND - 4));
      const tile = SPR.concrete || SPR.cobble;
      if (tile) {
        ctx.save();
        ctx.globalAlpha = 0.82;
        const tw = 128;
        const start = -((camX) % tw);
        for (let x = start; x < VW + tw; x += tw) {
          ctx.drawImage(tile.canvas, x, GROUND - 2, tw, VH - GROUND + 4);
        }
        ctx.restore();
      }
      return;
    }
    if (era === 5) {
      ctx.fillStyle = "#1a1814";
      ctx.fillRect(0, GROUND - 4, VW, VH - (GROUND - 4));
      const tile = SPR.cobble || SPR.ground;
      if (tile) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        const tw = 128;
        const start = -((camX) % tw);
        for (let x = start; x < VW + tw; x += tw) {
          ctx.drawImage(tile.canvas, x, GROUND - 2, tw, VH - GROUND + 4);
        }
        ctx.restore();
      }
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, GROUND - 4, VW, 3);
      return;
    }
    if (era === 4) {
      ctx.fillStyle = "#d8e0e8";
      ctx.fillRect(0, GROUND - 4, VW, VH - (GROUND - 4));
      ctx.fillStyle = "#b8c4d0";
      ctx.fillRect(0, GROUND + 16, VW, VH - GROUND - 16);
      const tile = SPR.snow || SPR.ground;
      if (tile) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        const tw = 128;
        const start = -((camX) % tw);
        for (let x = start; x < VW + tw; x += tw) {
          ctx.drawImage(tile.canvas, x, GROUND - 2, tw, VH - GROUND + 4);
        }
        ctx.restore();
      }
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(0, GROUND - 4, VW, 3);
      return;
    }
    if (era === 3) {
      ctx.fillStyle = "#2a2418";
      ctx.fillRect(0, GROUND - 4, VW, VH - (GROUND - 4));
      ctx.fillStyle = "#1a1610";
      ctx.fillRect(0, GROUND + 16, VW, VH - GROUND - 16);
      const tile = SPR.mud || SPR.ground;
      if (tile) {
        ctx.save();
        ctx.globalAlpha = 0.78;
        ctx.imageSmoothingEnabled = true;
        const tw = 128;
        const start = -((camX) % tw);
        for (let x = start; x < VW + tw; x += tw) {
          ctx.drawImage(tile.canvas, x, GROUND - 2, tw, VH - GROUND + 4);
        }
        ctx.restore();
      }
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, GROUND - 4, VW, 3);
      return;
    }
    if (era === 2) {
      ctx.fillStyle = "#5a5348";
      ctx.fillRect(0, GROUND - 4, VW, VH - (GROUND - 4));
      ctx.fillStyle = "#3e3a34";
      ctx.fillRect(0, GROUND + 14, VW, VH - GROUND - 14);
      const tile = SPR.road || SPR.ground;
      if (tile) {
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.imageSmoothingEnabled = true;
        const tw = 128;
        const start = -((camX) % tw);
        for (let x = start; x < VW + tw; x += tw) {
          ctx.drawImage(tile.canvas, x, GROUND - 2, tw, VH - GROUND + 4);
        }
        ctx.restore();
      }
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, GROUND - 4, VW, 3);
      return;
    }
    ctx.fillStyle = "#c48a3c";
    ctx.fillRect(0, GROUND - 4, VW, VH - (GROUND - 4));
    ctx.fillStyle = "#a86c28";
    ctx.fillRect(0, GROUND + 10, VW, VH - GROUND - 10);
    ctx.fillStyle = "#8a541c";
    ctx.fillRect(0, GROUND + 28, VW, 4);

    if (SPR.ground) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.imageSmoothingEnabled = true;
      const tw = 128;
      const start = -((camX) % tw);
      for (let x = start; x < VW + tw; x += tw) {
        ctx.drawImage(SPR.ground.canvas, x, GROUND - 2, tw, VH - GROUND + 4);
      }
      ctx.restore();
    }

    ctx.fillStyle = "#d8a050";
    for (let i = 0; i < 28; i++) {
      const wx = i * 73;
      const x = ((wx - camX) % (VW + 40) + (VW + 40)) % (VW + 40) - 10;
      ctx.fillRect(x, GROUND + 4 + (i % 3) * 6, 2 + (i % 2), 1);
    }
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, GROUND - 4, VW, 3);
  }

  function kaelSprite() {
    const p = era === 6 ? "kael6-" : era === 5 ? "kael5-" : era === 4 ? "kael4-" : era === 3 ? "kael3-" : era === 2 ? "kael2-" : "kael-";
    switch (player.anim) {
      case "run": return SPR[p + "run"] || SPR["kael-run"];
      case "jump": return SPR[p + "jump"] || SPR["kael-jump"];
      case "attack": return SPR[p + "attack"] || SPR["kael-attack"];
      case "heavy": return SPR[p + "heavy"] || SPR["kael-heavy"];
      case "block": return SPR[p + "block"] || SPR["kael-block"];
      case "hurt": return SPR[p + "hurt"] || SPR["kael-hurt"];
      case "death": return SPR[p + "death"] || SPR["kael-death"];
      default: return SPR[p + "idle"] || SPR["kael-idle"];
    }
  }

  function drawHeart(x, y, on) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = on ? "#d23a3a" : "#3a2424";
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-8, -4, -8, 8, 0, 12);
    ctx.bezierCurveTo(8, 8, 8, -4, 0, 4);
    ctx.fill();
    if (on) {
      ctx.fillStyle = "#f2a0a0";
      ctx.fillRect(-2, 1, 2, 2);
    }
    ctx.restore();
  }

  function drawHUD() {
    for (let i = 0; i < player.lives; i++) drawHeart(16 + i * 18, 12, true);
    ctx.fillStyle = "#1a120c";
    ctx.fillRect(8, 24, 104, 8);
    ctx.fillStyle = "#5a2018";
    ctx.fillRect(9, 25, 102, 6);
    ctx.fillStyle = player.hp > 30 ? "#d23a3a" : "#e6c35c";
    ctx.fillRect(9, 25, 102 * (player.hp / 100), 6);
    ctx.strokeStyle = "#e6c35c";
    ctx.lineWidth = 1;
    ctx.strokeRect(8.5, 24.5, 103, 7);

    ctx.fillStyle = "#e6c35c";
    ctx.font = "7px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.fillText(String(score), VW / 2, 16);
    ctx.textAlign = "right";
    ctx.fillText(era === 6 ? "ERA VI  TODAY" : era === 5 ? "ERA V  WW2" : era === 4 ? "ERA IV  NAPOLEON" : era === 3 ? "ERA III  KNIGHTS" : era === 2 ? "ERA II  ROME" : "ERA I  ALEXANDER", VW - 10, 16);

    ctx.textAlign = "left";
    ctx.fillStyle = player.heavyCd > 0 ? "#5a4a28" : "#e6c35c";
    const ready = era === 6 ? "DRONE READY" : era === 5 ? "RIFLE READY" : era === 4 ? "PISTOL READY" : era === 3 ? "CLEAVE READY" : era === 2 ? "BASH READY" : "SPEAR READY";
    const wait = era === 6 ? "DRONE" : era === 5 ? "RIFLE" : era === 4 ? "PISTOL" : era === 3 ? "CLEAVE" : era === 2 ? "BASH" : "SPEAR";
    const showSteed = (era >= 2 && era <= 6) && horse && (horse.alive || horse.hp > 0);
    if (showSteed) {
      ctx.fillStyle = "#8a7340";
      ctx.font = "6px Cinzel, serif";
      ctx.fillText(era === 6 ? "TANK" : era === 5 ? "JEEP" : era === 4 ? "CART" : "STEED", 8, 41);
      ctx.fillStyle = "#1a120c";
      ctx.fillRect(8, 43, 104, 7);
      ctx.fillStyle = "#3a3428";
      ctx.fillRect(9, 44, 102, 5);
      ctx.fillStyle = horse.alive ? "#d8c48a" : "#5a4a28";
      ctx.fillRect(9, 44, 102 * Math.max(0, horse.hp / horse.maxHp), 5);
      ctx.strokeStyle = "#e6c35c";
      ctx.lineWidth = 1;
      ctx.strokeRect(8.5, 43.5, 103, 6);
      ctx.fillStyle = player.heavyCd > 0 ? "#5a4a28" : "#e6c35c";
      ctx.font = "7px Cinzel, serif";
      ctx.fillText(player.heavyCd > 0 ? wait : ready, 8, 60);
    } else {
      ctx.font = "7px Cinzel, serif";
      ctx.fillText(player.heavyCd > 0 ? wait : ready, 8, 42);
    }

    const boss = enemies.find((e) => (e.type === "boss" || e.type === "centurion" || e.type === "baron" || e.type === "powder" || e.type === "colonel" || e.type === "fracture") && (e.hp > 0 || e.deadT > 0));
    if (boss && boss.hp > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(VW / 2 - 80, 22, 160, 12);
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(VW / 2 - 78, 24, 156 * (boss.hp / boss.maxHp), 8);
      ctx.strokeStyle = "#e6c35c";
      ctx.strokeRect(VW / 2 - 80.5, 21.5, 161, 13);
      ctx.fillStyle = "#f3e2a0";
      ctx.font = "7px Cinzel, serif";
      ctx.textAlign = "center";
      const name = boss.type === "fracture" ? "THE FRACTURE" : boss.type === "colonel" ? "RADIO COLONEL" : boss.type === "powder" ? "POWDER GENERAL" : boss.type === "baron" ? "CLOCKWORK BARON" : boss.type === "centurion" ? "CENTURION OF HOURS" : "MARBLE HETAIROI";
      ctx.fillText(name + "  ·  PH " + boss.phase, VW / 2, 20);
    }

    const ele = enemies.find((e) => e.type === "elephant" && e.hp > 0);
    if (ele && ele.x > camX - 40 && ele.x < camX + VW + 40) {
      ctx.fillStyle = "#f3e2a0";
      ctx.font = "7px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.fillText("STRIKE THE GOLDEN LEGS   " + ele.hits + " / 3", VW / 2, VH - 12);
    }

    if ((era >= 2 && era <= 6) && horse && horse.alive && !horse.mounted && Math.abs(player.x - horse.x) < 48) {
      ctx.fillStyle = "#f3e2a0";
      ctx.font = "7px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.fillText(era === 6 ? "SPACE  ·  TANK" : era === 5 ? "SPACE  ·  JEEP" : era === 4 ? "SPACE  ·  LIMBER" : "SPACE  ·  MOUNT", VW / 2, VH - 12);
    }
    const gateHint = enemies.find((e) => e.type === "gate" && e.hp > 0);
    if (gateHint && Math.abs(player.x - gateHint.x) < 90) {
      ctx.fillStyle = "#f3e2a0";
      ctx.font = "7px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.fillText("SMASH THE GATEHOUSE", VW / 2, VH - 12);
    }

    if (banner.t > 0) {
      const a = banner.t > 20 ? 1 : banner.t / 20;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(VW / 2 - 110, 48, 220, 22);
      ctx.fillStyle = "#f3e2a0";
      ctx.font = "11px Cinzel, serif";
      ctx.textAlign = "center";
      ctx.fillText(banner.text, VW / 2, 63);
      ctx.restore();
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sx = shake > 0.4 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0.4 ? (Math.random() - 0.5) * shake : 0;
    ctx.translate(sx, sy);

    drawSky();
    if (era === 6) drawPresent();
    else if (era === 5) drawNightStreet();
    else if (era === 4) drawEmpire();
    else if (era === 3) drawKeep();
    else if (era === 2) drawRome();
    else drawDunes();
    drawGround();
    drawPits();
    if (era === 2) drawAqueduct();
    drawLedges();

    for (const st of stains) {
      ctx.globalAlpha = Math.min(1, Math.max(0, st.a * Math.min(1, st.life / 400)));
      ctx.fillStyle = "#6a1010";
      ctx.beginPath();
      ctx.ellipse(st.x - camX, st.y, st.w * 0.5, st.h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const f of flags) {
      const bob = Math.sin(time * 0.08) * 1.2;
      const gx = f.x - camX;
      const pulse = 0.35 + Math.sin(time * 0.14) * 0.2;
      ctx.save();
      ctx.globalAlpha = f.on ? 0.85 : 0.42;
      const grd = ctx.createRadialGradient(gx, f.y - 42 + bob, 3, gx, f.y - 36, f.on ? 38 : 28);
      grd.addColorStop(0, "rgba(255, 236, 160," + (0.55 + pulse) + ")");
      grd.addColorStop(0.45, "rgba(230, 195, 92, 0.35)");
      grd.addColorStop(1, "rgba(230, 195, 92, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(gx - 40, f.y - 88, 80, 92);
      ctx.restore();
      blit(SPR.flag, f.x, f.y, 1, 64, f.on, bob);
    }

    for (const p of pickups) {
      if (p.taken) continue;
      const bob = Math.sin(time * 0.1 + p.x) * 3;
      blit(p.type === "plus" ? SPR.plus : SPR.hourglass, p.x, p.y + bob, 1, 22, false, 0);
    }

    for (const c of cannons) {
      const warn = (c.t % 150) > 60 && (c.t % 150) < 96;
      blit(SPR.cannon, c.x, GROUND, c.facing, 42, warn && time % 6 < 3, 0);
      if (warn) {
        ctx.save();
        ctx.globalAlpha = 0.35 + (time % 8 < 4 ? 0.2 : 0);
        ctx.fillStyle = "#e6c35c";
        ctx.fillRect(c.x - camX - 40, GROUND - 28, 80, 3);
        ctx.restore();
      }
    }

    if (doorOpen) {
      const glow = 0.6 + Math.sin(time * 0.15) * 0.4;
      ctx.save();
      ctx.globalAlpha = glow;
      ctx.fillStyle = "#e6c35c";
      ctx.shadowColor = "#e6c35c";
      ctx.shadowBlur = 18;
      ctx.fillRect(door.x - camX - 8, GROUND - 96, 16, 96);
      ctx.restore();
      blit(SPR.door, door.x, GROUND, 1, 96, false, 0);
    }

    for (const e of enemies) {
      const telegraph = e.state === "flash" && (time % 6 < 3);
      const bob = e.state === "walk" ? Math.sin(time * 0.25) * 1.4 : 0;
      let spr = SPR.infantry;
      let dh = 52;
      if (e.type === "slinger") { spr = SPR.slinger; dh = 52; }
      if (e.type === "legionary") { spr = SPR.legionary; dh = 56; }
      if (e.type === "archer") { spr = SPR.archer; dh = 52; }
      if (e.type === "elephant") { spr = SPR.elephant; dh = 78; }
      if (e.type === "boss") { spr = SPR.boss; dh = 90; }
      if (e.type === "centurion") { spr = SPR.centurion; dh = 90; }
      if (e.type === "manatarms") { spr = SPR.manatarms; dh = 56; }
      if (e.type === "crossbow") { spr = SPR.crossbow; dh = 54; }
      if (e.type === "knight") { spr = SPR.knight; dh = 68; }
      if (e.type === "gate") { spr = SPR.gate; dh = 110; }
      if (e.type === "baron") { spr = SPR.baron; dh = 92; }
      if (e.type === "lineinf") { spr = SPR.lineinf; dh = 54; }
      if (e.type === "lancer") { spr = SPR.lancer; dh = 70; }
      if (e.type === "powder") { spr = SPR.powder; dh = 90; }
      if (e.type === "rifleinf") { spr = SPR.rifleinf; dh = 54; }
      if (e.type === "mgnest") { spr = SPR.mgnest; dh = 70; }
      if (e.type === "armorcar") { spr = SPR.armorcar; dh = 56; }
      if (e.type === "colonel") { spr = SPR.colonel; dh = 88; }
      if (e.type === "modinf") { spr = SPR.modinf; dh = 54; }
      if (e.type === "ifv") { spr = SPR.ifv; dh = 58; }
      if (e.type === "fracture") { spr = SPR.fracture; dh = 92; }
      const deadSink = e.deadT > 0 ? (40 - Math.min(40, e.deadT)) * 0.4 : 0;
      if (e.hurtT > 0) {
        ctx.save();
        ctx.globalAlpha = 0.75;
      }
      blit(spr, e.x, e.y + deadSink, e.facing, dh, telegraph || e.hurtT > 0, bob);
      if (e.hurtT > 0) {
        ctx.fillStyle = "rgba(180, 20, 20, 0.28)";
        ctx.fillRect(e.x - camX - 16, e.y + deadSink - dh, 32, dh);
        ctx.restore();
      }
      if (e.type === "fracture" && e.deadT === 0) {
        ctx.globalAlpha = 0.38;
        if (e.phase === 1 && SPR.boss) blit(SPR.boss, e.x, e.y, e.facing, 78, false, bob);
        if (e.phase === 3 && SPR.tank) blit(SPR.tank, e.x + e.facing * 6, e.y, e.facing, 34, false, bob);
        ctx.globalAlpha = 1;
      }
      if ((e.type === "spear" || e.type === "slinger") && SPR.crackStamp && e.deadT === 0) {
        const h = dh;
        const w = (spr.w / spr.h) * h;
        const dx = Math.round(e.x - camX);
        const dy = Math.round(e.y + deadSink + bob);
        ctx.save();
        ctx.translate(dx, dy);
        ctx.scale(e.facing < 0 ? -1 : 1, 1);
        ctx.globalAlpha = 0.7;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(SPR.crackStamp, -w * 0.28, -h * 0.92, w * 0.55, h * 0.85);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    if (horse && (horse.alive || horse.mounted)) {
      const hx = horse.mounted ? player.x : horse.x;
      const hy = horse.mounted ? player.y : horse.y;
      const bobH = Math.sin(time * 0.12) * 1.2;
      const hs = (era === 6 || horse.kind === 6) ? (SPR.tank || SPR.horse)
        : (era === 5 || horse.kind === 5) ? (SPR.jeep || SPR.horse)
        : (era === 4 || horse.kind === 4) ? (SPR.cart || SPR.horse)
        : (era === 3 || horse.kind === 3) ? (SPR.horse3 || SPR.horse) : SPR.horse;
      blit(hs, hx, hy + 2, horse.facing || player.facing, (era === 6 || horse.kind === 6) ? 48 : (era === 5 || horse.kind === 5) ? 42 : (era === 4 || horse.kind === 4) ? 64 : 58, false, bobH);
    }

    if (player.rolling || player.invuln === 0 || time % 4 < 2 || player.deadT > 0) {
      const bob = player.rolling ? 0 : player.anim === "idle" ? Math.sin(time * 0.08) * 1.1 : player.anim === "run" ? Math.sin(player.runT * 0.45) * 1.6 : 0;
      const lunge = player.attacking
        ? (player.phase === "wu" ? player.facing * -6 : player.phase === "active" ? player.facing * (player.kind === "heavy" ? 11 : player.combo >= 3 ? 9 : 5) : player.facing * 2)
        : 0;
      const mounted = !!(horse && horse.mounted && horse.alive);
      const dh = player.rolling ? 48 : player.anim === "death" ? 38 : 62;
      if (player.rolling && !perfLow) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        blitKael(kaelSprite(), player.x - player.rollDir * 14, player.y, player.facing, dh, 0);
        ctx.globalAlpha = 0.12;
        blitKael(kaelSprite(), player.x - player.rollDir * 26, player.y, player.facing, dh, 0);
        ctx.restore();
      }
      blitKael(kaelSprite(), player.x + lunge, player.y - (mounted ? (era === 6 ? 10 : era === 5 ? 6 : 16) : 0), player.facing, dh, bob);
      drawSwing();
      if (era === 6 && player.attacking && player.kind === "heavy" && player.phase === "wu") {
        const tankAim = !!(horse && horse.mounted && horse.kind === 6);
        ctx.save();
        ctx.strokeStyle = tankAim ? "rgba(230,195,92,0.8)" : "rgba(243,226,160,0.55)";
        ctx.lineWidth = tankAim ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(player.x - camX + player.facing * 20, player.y - 26);
        ctx.lineTo(player.x - camX + player.facing * (tankAim ? 140 : 110), player.y - 26);
        ctx.stroke();
        ctx.restore();
      }
      if (era === 5 && player.attacking && player.kind === "heavy" && player.phase === "wu" && !(horse && horse.mounted && horse.kind === 5)) {
        ctx.save();
        ctx.strokeStyle = "rgba(243, 226, 160, 0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(player.x - camX + player.facing * 18, player.y - 26);
        ctx.lineTo(player.x - camX + player.facing * 160, player.y - 26);
        ctx.stroke();
        ctx.restore();
      }
    }

    for (const s of shots) {
      if (s.type === "spear" && s.warn > 0) {
        ctx.save();
        ctx.globalAlpha = 0.25 + (time % 8 < 4 ? 0.2 : 0);
        ctx.fillStyle = "#e6c35c";
        ctx.fillRect(s.x - camX - 5, GROUND - 8, 10, 6);
        ctx.fillRect(s.x - camX - 1, 0, 2, GROUND);
        ctx.restore();
      } else if (s.type === "spear") {
        ctx.fillStyle = "#d8c8a0";
        ctx.fillRect(s.x - camX - 2, s.y, 4, 18);
        ctx.fillStyle = "#e6c35c";
        ctx.fillRect(s.x - camX - 3, s.y, 6, 6);
      } else if (s.type === "chandelier") {
        if (s.warn > 0) {
          ctx.save();
          ctx.globalAlpha = 0.28 + (time % 8 < 4 ? 0.2 : 0);
          ctx.strokeStyle = "#e6c35c";
          ctx.beginPath();
          ctx.arc(s.x - camX, GROUND - 8, 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#e6c35c";
          ctx.fillRect(s.x - camX - 1, 8, 2, 28);
          ctx.restore();
        } else {
          ctx.fillStyle = "#c9a227";
          ctx.beginPath();
          ctx.arc(s.x - camX, s.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#6a5420";
          ctx.fillRect(s.x - camX - 8, s.y - 2, 16, 4);
          ctx.fillStyle = "#e6c35c";
          ctx.fillRect(s.x - camX - 1, s.y - 18, 2, 16);
        }
      } else if (s.type === "dronestrike") {
        ctx.save();
        ctx.strokeStyle = "#e6c35c";
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(s.x - camX, GROUND - 4, s.r || 38, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#e6c35c";
        ctx.font = "8px Cinzel, serif";
        ctx.textAlign = "center";
        ctx.globalAlpha = 1;
        ctx.fillText(String(Math.max(1, Math.ceil((s.fuse || 0) / 60))), s.x - camX, GROUND - 48);
        ctx.restore();
      } else if (s.type === "divedrone") {
        if (s.warn > 0) {
          ctx.strokeStyle = "#e6c35c";
          ctx.globalAlpha = 0.4;
          ctx.strokeRect(s.x - camX - 8, GROUND - 16, 16, 8);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = "#2a2e32";
          ctx.fillRect(s.x - camX - 6, s.y, 12, 5);
          ctx.fillStyle = "#e6c35c";
          ctx.fillRect(s.x - camX - 2, s.y + 1, 4, 2);
        }
      } else if (s.type === "ghosthorse") {
        ctx.globalAlpha = 0.45;
        blit(SPR.horse, s.x, s.y, s.facing || 1, 50, true, 0);
        ctx.globalAlpha = 1;
      } else if (s.type === "shell" && s.warn > 0) {
        ctx.strokeStyle = "rgba(230,195,92,0.7)";
        ctx.beginPath();
        ctx.moveTo(s.x - camX, s.y);
        ctx.lineTo(s.x - camX + (s.facing || 1) * 90, s.y);
        ctx.stroke();
      } else if (s.type === "arty") {
        ctx.save();
        ctx.strokeStyle = "#d23a3a";
        ctx.globalAlpha = 0.35 + (time % 8 < 4 ? 0.25 : 0);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x - camX, GROUND - 4, s.r || 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(210, 58, 58, 0.18)";
        ctx.fill();
        ctx.restore();
      } else if (s.type === "bomb") {
        const fuseA = Math.max(0.3, (s.fuse || 0) / 84);
        ctx.fillStyle = "#3a2a18";
        ctx.beginPath();
        ctx.arc(s.x - camX, s.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e6c35c";
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(s.x - camX, s.y, s.r || 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = fuseA > 0.35 ? "#ffe27a" : "#d23a3a";
        ctx.font = "8px Cinzel, serif";
        ctx.textAlign = "center";
        ctx.fillText(String(Math.max(1, Math.ceil((s.fuse || 0) / 60))), s.x - camX, s.y - 14);
        ctx.fillStyle = "#e6c35c";
        ctx.fillRect(s.x - camX - 1, s.y - 12, 2, 6);
      } else if (s.type === "ball" || s.type === "laneshot" || s.type === "pistol" || s.type === "limber" || s.type === "musket" || s.type === "rifle" || s.type === "mg" || s.type === "burst" || s.type === "shell") {
        const gunshot = s.type === "pistol" || s.type === "limber" || s.type === "rifle" || s.type === "mg" || s.type === "burst" || s.type === "shell";
        if (gunshot) {
          ctx.strokeStyle = s.type === "shell" ? "rgba(230,195,92,0.7)" : "rgba(255,220,140,0.55)";
          ctx.lineWidth = s.type === "shell" ? 3 : 1.6;
          ctx.beginPath();
          ctx.moveTo(s.x - camX - (s.vx || 4) * 3, s.y);
          ctx.lineTo(s.x - camX, s.y);
          ctx.stroke();
        }
        ctx.fillStyle = s.type === "pistol" || s.type === "limber" || s.type === "burst" ? "#fff6c8" : "#2a2420";
        const r = s.type === "limber" || s.type === "shell" ? 5 : s.type === "ball" ? 6 : 3;
        ctx.beginPath();
        ctx.arc(s.x - camX, s.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (s.type === "laneshot") {
          ctx.fillStyle = "#5a4a28";
          ctx.fillRect(s.x - camX - 6, s.y - 2, 12, 4);
        }
      } else if (s.type === "arrow" || s.type === "bolt") {
        ctx.save();
        ctx.translate(s.x - camX, s.y);
        ctx.rotate(Math.atan2(s.vy, s.vx));
        ctx.fillStyle = s.type === "bolt" ? "#2a1c12" : "#3a2a18";
        ctx.fillRect(s.type === "bolt" ? -10 : -8, -1.5, s.type === "bolt" ? 18 : 14, s.type === "bolt" ? 3 : 2);
        ctx.fillStyle = "#c9a227";
        ctx.fillRect(s.type === "bolt" ? 6 : 4, -2, 5, 4);
        ctx.restore();
      } else {
        ctx.fillStyle = "#3a3228";
        ctx.beginPath();
        ctx.arc(s.x - camX, s.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const s of sparks) {
      ctx.globalAlpha = Math.max(0, s.life / s.max);
      ctx.fillStyle = s.blood ? (s.life > 14 ? "#d23a3a" : "#6a1010") : s.gold ? (s.life > 10 ? "#fff6c8" : "#e6c35c") : "#fff";
      ctx.fillRect(s.x - camX, s.y, s.s, s.s);
      ctx.globalAlpha = 1;
    }

    ctx.font = "8px Cinzel, serif";
    ctx.textAlign = "center";
    for (const f of floats) {
      ctx.globalAlpha = Math.min(1, f.life / 20);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x - camX, f.y);
      ctx.globalAlpha = 1;
    }

    if (era === 4) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (const r of snows) ctx.fillRect(r.x - camX, r.y, 2, 2);
    }
    if (era === 3) {
      ctx.strokeStyle = "rgba(186, 196, 210, 0.42)";
      ctx.lineWidth = 1;
      for (const r of rain) {
        ctx.beginPath();
        ctx.moveTo(r.x - camX, r.y);
        ctx.lineTo(r.x - camX + 1.4, r.y + 9);
        ctx.stroke();
      }
      for (const m of muds) {
        ctx.globalAlpha = Math.max(0, m.life / 14);
        ctx.fillStyle = "#4a3014";
        ctx.fillRect(m.x - camX, m.y, 3, 2);
        ctx.globalAlpha = 1;
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (hurtFlash > 0) {
      ctx.fillStyle = "rgba(120, 8, 8," + Math.min(0.28, hurtFlash * 0.03) + ")";
      ctx.fillRect(0, 0, VW, VH);
    }
    if (mode === "play" || mode === "pause") drawHUD();
  }

  let acc = 0;
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - last);
    last = now;
    acc += dt;
    while (acc >= 1000 / 60) {
      update();
      acc -= 1000 / 60;
    }
    if (dt > 24) perfHits = Math.min(18, perfHits + 1);
    else if (dt < 18) perfHits = Math.max(0, perfHits - 1);
    perfLow = perfHits > 8;

    if (mode === "intro") drawIntro();
    else if (mode === "warp") drawWarp();
    else if (mode === "play" || mode === "pause" || mode === "dead" || mode === "win") draw();
    else if (mode === "title") {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, VW, VH);
    }
    requestAnimationFrame(loop);
  }

  window.__roh = {
    snap: () => ({
      mode,
      era,
      introT,
      warpT,
      lives: player.lives,
      hp: player.hp,
      x: player.x | 0,
      y: player.y | 0,
      anim: player.anim,
      enemies: enemies.map((e) => ({ type: e.type, x: e.x | 0, hp: e.hp, facing: e.facing, state: e.state, hits: e.hits, guarded: e.guarded })),
      lock,
      doorOpen,
      doorX: door.x | 0,
      checkpoint,
      horse: horse && { x: horse.x | 0, hp: horse.hp, mounted: horse.mounted, alive: horse.alive, kind: horse.kind || 0 },
      unlocked,
      maxLives,
      muted,
      lifeDamaged,
      gateCleared,
      cannons: cannons.length,
      rolling: !!player.rolling,
      score,
      nestCleared,
      pits: pits.length,
    }),
    mute: () => toggleMute(),
    persist: () => persistSave(),
    tp: (x) => { player.x = x; camX = x - VW * 0.38; },
    wipe: () => { player.hp = 0; player.lives = 0; loseLife(); },
    killSpecial: (type) => {
      const e = enemies.find((n) => n.type === type);
      if (e) killEnemy(e);
    },
    skipIntro,
    begin,
    title: () => toTitle(),
    dumpHorse: () => dumpHorse(),
    setLives: (n) => {
      player.lives = clamp(n, 1, MAX_LIVES);
      lifeDamaged = false;
    },
    era2: () => {
      hide(screens.title);
      hideAllPlay();
      resetLevel({ era: 2, keepLives: true });
      mode = "play";
    },
    era3: () => {
      hide(screens.title);
      hideAllPlay();
      resetLevel({ era: 3, keepLives: true });
      mode = "play";
    },
    era4: () => {
      hide(screens.title);
      hideAllPlay();
      resetLevel({ era: 4, keepLives: true });
      mode = "play";
    },
    era5: () => {
      hide(screens.title);
      hideAllPlay();
      resetLevel({ era: 5, keepLives: true });
      mode = "play";
    },
    era6: () => {
      hide(screens.title);
      hideAllPlay();
      resetLevel({ era: 6, keepLives: true });
      mode = "play";
    },
    smashNest: () => {
      const e = enemies.find((n) => n.type === "mgnest");
      if (e) killEnemy(e);
    },
    unlock: (n) => saveUnlock(n),
    smashGate: () => {
      const e = enemies.find((n) => n.type === "gate");
      if (e) killEnemy(e);
    },
    mount: () => mountHorse(),
  };

  loadAll()
    .then(() => {
      player.lives = loadSave();
      refreshEraSelect();
      refreshTitleEra();
      refreshMuteButtons();
      hide(screens.load);
      bindTouch();
      layoutStage();
      window.addEventListener("resize", layoutStage);
      window.addEventListener("orientationchange", layoutStage);
      if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
        document.getElementById("stage").classList.add("show-touch");
      }
      requestAnimationFrame(loop);
    })
    .catch((err) => {
      console.error(err);
      screens.load.querySelector(".load-txt").textContent = "TETHER FAILED — reload";
    });
})();
