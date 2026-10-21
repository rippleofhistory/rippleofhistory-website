/**
 * Wings of WW2 — tunables for the five-sortie campaign.
 * Scroll speed, fire rate, drop rate, and the difficulty curve live here
 * so the feel can be locked before a stage is lifted into another game.
 *
 * Sprite files are nose-up. Enemy drawing rotates them onto their heading.
 */
(function (WOW) {
  WOW.W = 480;
  WOW.H = 720;
  WOW.SCALE = 2;

  WOW.PLAYER = {
    speed: 280,
    focus: 118,
    hitR: 8,
    lives: 3,
    bombs: 2,
    drawW: 96,
    /* Top of the play lane. Keeps the fighter out of the spawn row. */
    minY: 250,
  };

  /* Permanent ladder. A crate past rockets arms the timed heavy cannon. */
  WOW.WEAPONS = [
    { name: 'MACHINE GUNS', rate: 0.115, kind: 'single' },
    { name: 'TWIN GUNS', rate: 0.105, kind: 'dual' },
    { name: 'SPREAD SHOT', rate: 0.12, kind: 'spread' },
    { name: 'WING PODS', rate: 0.10, kind: 'pods' },
    { name: 'ROCKETS', rate: 0.30, kind: 'rockets' },
  ];

  /* White Cliffs: chalk lip, and the sea lane the fighter may not cross. */
  WOW.CLIFF_LIP = 112;
  WOW.CLIFF_LANE = 164;

  WOW.LASER_TIME = 7.5;
  WOW.LASER_DPS = 26;
  WOW.SHOT_SPEED = 660;

  WOW.SCROLL = {
    foam: 34,
    island: 48,
    cloud: 76,
  };

  WOW.SCORE = {
    fighter: 100,
    sweeper: 150,
    diver: 150,
    elite: 400,
    bomber: 700,
    boss: 3000,
    crate: 50,
    graze: 10,
    tank: 280,
  };

  /* Seconds to fill the escort bar, and how long the fighters stay. */
  WOW.ESCORT_FILL = 13;
  WOW.ESCORT_TIME = 8;

  /* Per-sortie aircraft. The Spitfire opens the campaign. */
  WOW.CRAFT = {
    spitfire: { id: 'spitfire', sprite: 'player', speed: 280, focus: 118, hitR: 8, drawW: 96, minY: 250, edge: 20 },
    fortress: { id: 'fortress', sprite: 'b17', speed: 164, focus: 86, hitR: 14, drawW: 210, minY: 292, edge: 36 },
    thunderbolt: { id: 'thunderbolt', sprite: 'p47', speed: 248, focus: 108, hitR: 10, drawW: 108, minY: 250, edge: 24 },
  };

  /* Enemy bodies. drop is the random crate chance. forceDrop on a spawn ignores this. */
  WOW.ENEMIES = {
    fighter: { sprite: 'fw190', w: 78, hp: 1, r: 14, score: 100, drop: 0.2, vy: 112, shoot: 0, pattern: 'straight' },
    sweeper: { sprite: 'fw190', w: 78, hp: 2, r: 14, score: 150, drop: 0.24, vy: 40, shoot: 1.65, pattern: 'sweep', shot: 'down' },
    diver: { sprite: 'bf109', w: 76, hp: 1, r: 13, score: 150, drop: 0.16, vy: 48, shoot: 0, pattern: 'dive' },
    elite: { sprite: 'bf109', w: 92, hp: 20, r: 16, score: 400, drop: 0.72, vy: 70, shoot: 0.9, pattern: 'weave', shot: 'aimed' },
    bomber: { sprite: 'bomber', w: 176, hp: 52, r: 32, score: 700, drop: 0.8, vy: 46, shoot: 1.2, pattern: 'cruise', shot: 'fan' },
    gun: { sprite: '', w: 28, hp: 12, r: 13, score: 220, drop: 0.45, vy: 42, shoot: 1.35, pattern: 'gun', shot: 'across', name: 'FLAK' },
    boss: { sprite: 'bomber', w: 228, hp: 460, r: 50, score: 3000, drop: 1, vy: 36, shoot: 0, pattern: 'boss', shot: 'boss', name: 'JU 88' },
    boss2: { sprite: 'bomber', w: 240, hp: 520, r: 52, score: 3500, drop: 1, vy: 36, shoot: 0, pattern: 'boss2', shot: 'boss', name: 'HE 111' },
    ace: { sprite: 'fw190', w: 112, hp: 280, r: 18, score: 2500, drop: 1, vy: 50, shoot: 0, pattern: 'ace', name: 'FW 190' },
  };

  /**
   * Five sorties, in order: Dunkirk 1940, the White Cliffs 1940,
   * Schweinfurt 1943, the Bulge 1944, Germany 1945. A clear carries
   * score, lives, weapon tier, and bombs. WOW.LEVEL is the sortie
   * currently being flown.
   */
  WOW.LEVELS = [
    {
      id: 'channel-patrol',
      name: 'DUNKIRK',
      short: 'DUNKIRK',
      clear: 'BEACH HELD',
      nextHint: 'ENTER  THE WHITE CLIFFS',
      scenery: 'dunkirk',
      bossBanner: 'JU 88 INBOUND',
      bossType: 'boss',
      events: [
        { t: 1.1, kind: 'vform', drop: 'lead' },
        { t: 7.2, kind: 'line', n: 4 },
        { t: 12.4, kind: 'side', side: 'left', n: 3 },
        { t: 14.6, kind: 'side', side: 'right', n: 3 },
        { t: 19.2, kind: 'divers', n: 4 },
        { t: 25.0, kind: 'bomber', drop: true },
        { t: 30.0, kind: 'vform' },
        { t: 35.5, kind: 'elite', drop: true },
        { t: 39.0, kind: 'side', side: 'left', n: 3 },
        { t: 41.2, kind: 'divers', n: 3 },
        { t: 46.0, kind: 'dense' },
        { t: 58.0, kind: 'boss' },
      ],
    },
    {
      id: 'white-cliffs',
      name: 'THE WHITE CLIFFS',
      short: 'CLIFFS',
      clear: 'COAST CLEAR',
      nextHint: 'ENTER  SCHWEINFURT',
      scenery: 'cliffs',
      bossBanner: 'HE 111 INBOUND',
      bossType: 'boss2',
      events: [
        { t: 1.2, kind: 'divers', n: 3 },
        { t: 6.4, kind: 'flak', drop: true },
        { t: 12.0, kind: 'line', n: 4 },
        { t: 17.2, kind: 'pincer' },
        { t: 23.0, kind: 'vform', drop: 'lead' },
        { t: 29.5, kind: 'bomber', drop: true },
        { t: 36.0, kind: 'flak' },
        { t: 41.0, kind: 'elite', drop: true },
        { t: 46.5, kind: 'side', side: 'left', n: 3 },
        { t: 48.6, kind: 'side', side: 'right', n: 3 },
        { t: 55.0, kind: 'dense' },
        { t: 68.0, kind: 'boss' },
      ],
    },
    {
      id: 'schweinfurt',
      name: 'SCHWEINFURT',
      short: 'FORTRESS',
      clear: 'TARGET HIT',
      nextHint: 'ENTER  THE BULGE',
      scenery: 'reich',
      craft: 'fortress',
      escort: true,
      flakEvery: 0.95,
      cap: 14,
      bossBanner: 'FIGHTERS INBOUND',
      bossType: 'ace',
      bossHp: 320,
      events: [
        { t: 1.0, kind: 'line', n: 5 },
        { t: 4.0, kind: 'flak' },
        { t: 6.2, kind: 'divers', n: 5 },
        { t: 10.0, kind: 'pincer' },
        { t: 13.5, kind: 'side', side: 'left', n: 4 },
        { t: 15.6, kind: 'side', side: 'right', n: 4 },
        { t: 19.5, kind: 'vform', drop: 'lead' },
        { t: 24.0, kind: 'flak' },
        { t: 26.5, kind: 'elite', drop: true },
        { t: 31.5, kind: 'dense' },
        { t: 37.0, kind: 'divers', n: 4 },
        { t: 41.0, kind: 'side', side: 'left', n: 4 },
        { t: 43.0, kind: 'side', side: 'right', n: 4 },
        { t: 48.0, kind: 'bomber', drop: true },
        { t: 54.0, kind: 'dense' },
        { t: 60.0, kind: 'elite' },
        { t: 68.0, kind: 'boss' },
      ],
    },
    {
      id: 'bulge',
      name: 'BATTLE OF THE BULGE',
      short: 'BULGE',
      clear: 'ARDENNES CLEAR',
      nextHint: 'ENTER  GERMANY',
      scenery: 'forest',
      craft: 'thunderbolt',
      armor: true,
      flakEvery: 1.7,
      cap: 12,
      bossBanner: 'ARMOR AND FIGHTERS',
      bossType: 'ace',
      bossHp: 340,
      events: [
        { t: 1.2, kind: 'armor', n: 3 },
        { t: 3.2, kind: 'line', n: 4 },
        { t: 8.0, kind: 'armor', n: 2 },
        { t: 10.5, kind: 'divers', n: 4 },
        { t: 15.0, kind: 'flak' },
        { t: 18.5, kind: 'pincer' },
        { t: 23.5, kind: 'armor', n: 4 },
        { t: 28.0, kind: 'elite', drop: true },
        { t: 33.5, kind: 'side', side: 'left', n: 3 },
        { t: 35.6, kind: 'side', side: 'right', n: 3 },
        { t: 41.0, kind: 'armor', n: 3 },
        { t: 46.0, kind: 'dense' },
        { t: 53.0, kind: 'vform' },
        { t: 59.0, kind: 'armor', n: 4 },
        { t: 67.0, kind: 'boss' },
      ],
    },
    {
      id: 'germany',
      name: 'GERMANY',
      short: 'GERMANY',
      clear: 'REICH CLEAR',
      nextHint: 'ENTER TO FLY AGAIN',
      scenery: 'forest',
      craft: 'thunderbolt',
      armor: true,
      flakEvery: 1.2,
      cap: 14,
      bossBanner: 'LAST STAFFEL',
      bossType: 'ace',
      bossHp: 420,
      events: [
        { t: 1.0, kind: 'armor', n: 4 },
        { t: 2.8, kind: 'divers', n: 4 },
        { t: 6.5, kind: 'line', n: 5 },
        { t: 11.0, kind: 'armor', n: 3 },
        { t: 14.5, kind: 'pincer' },
        { t: 18.0, kind: 'flak' },
        { t: 22.0, kind: 'elite', drop: true },
        { t: 27.0, kind: 'armor', n: 4 },
        { t: 32.0, kind: 'dense' },
        { t: 38.0, kind: 'side', side: 'left', n: 4 },
        { t: 40.2, kind: 'side', side: 'right', n: 4 },
        { t: 45.5, kind: 'bomber', drop: true },
        { t: 51.0, kind: 'armor', n: 5 },
        { t: 57.0, kind: 'vform' },
        { t: 63.0, kind: 'dense' },
        { t: 72.0, kind: 'boss' },
      ],
    },
  ];
  WOW.LEVEL = WOW.LEVELS[0];

  WOW.clamp = function (v, a, b) {
    return Math.max(a, Math.min(b, v));
  };

  WOW.len = function (x, y) {
    return Math.hypot(x, y) || 1;
  };

  WOW.hit = function (ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const r = ar + br;
    return dx * dx + dy * dy < r * r;
  };
})(window.WOW = window.WOW || {});
