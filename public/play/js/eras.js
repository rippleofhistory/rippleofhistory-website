(() => {
  "use strict";
  const R = (window.ROH = window.ROH || {});

  R.ERA_LABEL = ["", "ERA I  ·  GAUGAMELA", "ERA II  ·  ROME", "ERA III  ·  THE BLACK KEEP", "ERA IV  ·  SMOKE OF EMPIRE", "ERA V  ·  THE IRON CENTURY", "ERA VI  ·  THE FRACTURED PRESENT"];

  R.WEAPONS = {
    light: {
      1: [
        { wu: 4, act: 8, rec: 10, dmg: 8, kb: 2.6, range: 30, lift: 0 },
        { wu: 3, act: 8, rec: 12, dmg: 11, kb: 3.2, range: 34, lift: 0 },
        { wu: 6, act: 10, rec: 18, dmg: 16, kb: 5.0, range: 38, lift: -2.4 },
      ],
      2: [
        { wu: 3, act: 6, rec: 8, dmg: 7, kb: 2.0, range: 24, lift: 0 },
        { wu: 2, act: 6, rec: 9, dmg: 9, kb: 2.4, range: 26, lift: 0 },
        { wu: 4, act: 8, rec: 14, dmg: 14, kb: 4.2, range: 28, lift: -2.0 },
      ],
      3: [
        { wu: 4, act: 8, rec: 10, dmg: 9, kb: 2.8, range: 36, lift: 0 },
        { wu: 4, act: 8, rec: 12, dmg: 12, kb: 3.4, range: 40, lift: 0 },
        { wu: 6, act: 10, rec: 16, dmg: 17, kb: 5.2, range: 44, lift: -2.2 },
      ],
      4: [
        { wu: 3, act: 7, rec: 9, dmg: 8, kb: 2.4, range: 28, lift: 0 },
        { wu: 3, act: 7, rec: 10, dmg: 11, kb: 2.8, range: 30, lift: 0 },
        { wu: 5, act: 9, rec: 14, dmg: 15, kb: 4.4, range: 34, lift: -1.8 },
      ],
      5: [
        { wu: 4, act: 8, rec: 10, dmg: 10, kb: 2.8, range: 34, lift: 0 },
        { wu: 4, act: 8, rec: 11, dmg: 13, kb: 3.2, range: 36, lift: 0 },
        { wu: 6, act: 10, rec: 16, dmg: 17, kb: 4.8, range: 40, lift: -1.6 },
      ],
      6: [
        { wu: 3, act: 6, rec: 8, dmg: 8, kb: 2.0, range: 40, lift: 0, burst: true },
        { wu: 3, act: 6, rec: 8, dmg: 10, kb: 2.2, range: 40, lift: 0, burst: true },
        { wu: 5, act: 8, rec: 14, dmg: 16, kb: 4.2, range: 26, lift: -1.4 },
      ],
    },
    heavy: {
      1: { wu: 9, act: 10, rec: 18, dmg: 22, kb: 5.6, range: 52, lift: 0, cd: 78 },
      2: { wu: 6, act: 8, rec: 14, dmg: 16, kb: 4.8, range: 36, lift: 0, cd: 64, stun: 90 },
      3: { wu: 8, act: 12, rec: 18, dmg: 24, kb: 6.2, range: 62, lift: -1.2, cd: 84, tall: 36 },
      4: { wu: 5, act: 6, rec: 14, dmg: 20, kb: 3.0, range: 86, lift: 0, cd: 72, shot: true },
      5: { wu: 12, act: 8, rec: 16, dmg: 26, kb: 4.0, range: 200, lift: 0, cd: 80, shot: true, telegraph: true },
      6: { wu: 8, act: 6, rec: 14, dmg: 32, kb: 3.0, range: 140, lift: 0, cd: 96, shot: true, mark: true },
    },
  };

  R.AQUA = { x: 1480, w: 700, y: 148 };
  R.AQUA_STEPS = [{ x: 1410, w: 72, y: 188 }];
  R.GATE_X = 1680;
  R.HALL = { left: 4280, right: 5080 };
  R.CART_X = 1960;
  R.COURT = { left: 4280, right: 5080 };
  R.NEST_X = 1680;
  R.JEEP_X = 1980;
  R.TANK_X = 1980;
  R.NEST_RUBBLE = [
    { x: 1490, w: 90, y: 192 },
    { x: 1570, w: 240, y: 170 },
  ];

  R.lightMoves = function (era) {
    return R.WEAPONS.light[era] || R.WEAPONS.light[1];
  };
  R.heavyMove = function (era) {
    return R.WEAPONS.heavy[era] || R.WEAPONS.heavy[1];
  };

  function spawn(W, list) {
    list.forEach(([x, type], i) => W.spawns.push({ x, type, i, done: false }));
  }

  function ledge(W, p) {
    const L = { x: p.x, w: p.w, y: p.y, kind: p.kind || "stone" };
    if (p.fragile) { L.fragile = true; L.shakeT = 0; L.fall = 0; L.gone = false; }
    if (p.moveAmp) { L.ox = p.x; L.moveAmp = p.moveAmp; L.moveSpd = p.moveSpd || 0.025; L.lastX = p.x; }
    W.ledges.push(L);
  }

  function crossing(W, pitX, pitW, platforms) {
    W.pits.push({ x: pitX, w: pitW });
    platforms.forEach((p) => ledge(W, p));
  }

  function hops(W, x, n, pitW, land) {
    for (let i = 0; i < n; i++) W.pits.push({ x: x + i * (pitW + land), w: pitW });
  }

  R.applyEra = function (n, W) {
    const G = W.GROUND;
    if (n === 2) {
      W.banner = { text: "ERA II  THE ROAD TO ROME", t: 160 };
      W.villaX = 2860;
      R.AQUA_STEPS.forEach((s) => W.ledges.push({ x: s.x, w: s.w, y: s.y }));
      W.ledges.push({ x: R.AQUA.x, w: R.AQUA.w, y: R.AQUA.y });
      W.flags.push({ x: 380, y: G, on: false });
      W.flags.push({ x: W.villaX + 40, y: G, on: false });
      W.pickups.push({ type: "plus", x: 920, y: G - 18, taken: false });
      W.pickups.push({ type: "plus", x: R.AQUA.x + 220, y: R.AQUA.y - 18, taken: false });
      W.pickups.push({ type: "hourglass", x: 3320, y: G - 20, taken: false });
      W.pickups.push({ type: "plus", x: 3880, y: G - 18, taken: false });
      W.horse = { x: 240, y: G, hp: 80, maxHp: 80, facing: 1, mounted: false, alive: true, shrineX: 240, kind: 2 };
      hops(W, 2208, 1, 64, 0);
      crossing(W, 2680, 160, [
        { x: 2692, w: 48, y: 192, kind: "brick" },
        { x: 2754, w: 44, y: 168, kind: "brick", moveAmp: 16, moveSpd: 0.028 },
        { x: 2818, w: 46, y: 192, kind: "brick" },
      ]);
      crossing(W, 3520, 170, [
        { x: 3532, w: 46, y: 192, kind: "brick" },
        { x: 3592, w: 40, y: 166, kind: "brick", fragile: true },
        { x: 3654, w: 48, y: 188, kind: "brick" },
      ]);
      hops(W, 4240, 2, 56, 40);
      ledge(W, { x: 980, w: 64, y: 186, kind: "brick" });
      ledge(W, { x: 1056, w: 56, y: 164, kind: "brick" });
      spawn(W, [
        [560, "legionary"], [680, "legionary"], [840, "legionary"],
        [1080, "legionary"], [1220, "legionary"],
        [1620, "archer"], [1980, "archer"],
        [2320, "legionary"], [2480, "legionary"], [2640, "legionary"],
        [3100, "legionary"], [3260, "legionary"], [3440, "legionary"],
        [3720, "legionary"], [3920, "legionary"], [4120, "legionary"],
        [4560, "centurion"],
      ]);
      return;
    }
    if (n === 3) {
      W.banner = { text: "ERA III  THE BLACK KEEP", t: 160 };
      W.flags.push({ x: 360, y: G, on: false }, { x: 2920, y: G, on: false });
      W.pickups.push({ type: "plus", x: 880, y: G - 18, taken: false });
      W.pickups.push({ type: "plus", x: 2140, y: G - 18, taken: false });
      W.pickups.push({ type: "hourglass", x: 3380, y: G - 20, taken: false });
      W.pickups.push({ type: "plus", x: 3920, y: G - 18, taken: false });
      hops(W, 2040, 1, 56, 0);
      crossing(W, 1360, 260, [
        { x: 1372, w: 50, y: 192, kind: "wood" },
        { x: 1440, w: 40, y: 164, kind: "wood", fragile: true },
        { x: 1508, w: 48, y: 178, kind: "wood" },
        { x: 1578, w: 50, y: 192, kind: "wood" },
      ]);
      crossing(W, 2976, 128, [
        { x: 2988, w: 44, y: 188, kind: "wood" },
        { x: 3048, w: 42, y: 164, kind: "wood", moveAmp: 14, moveSpd: 0.032 },
      ]);
      crossing(W, 4230, 200, [
        { x: 4242, w: 46, y: 192, kind: "wood" },
        { x: 4304, w: 40, y: 168, kind: "wood", fragile: true },
        { x: 4364, w: 44, y: 176, kind: "wood", moveAmp: 18, moveSpd: 0.024 },
        { x: 4430, w: 48, y: 192, kind: "wood" },
      ]);
      ledge(W, { x: 2360, w: 70, y: 180, kind: "wood" });
      spawn(W, [
        [520, "manatarms"], [640, "manatarms"], [780, "crossbow"],
        [980, "manatarms"], [1120, "crossbow"], [1280, "manatarms"],
        [R.GATE_X, "gate"],
        [2140, "manatarms"], [2280, "manatarms"], [2440, "crossbow"],
        [2680, "manatarms"], [2860, "crossbow"],
        [3120, "knight"],
        [3480, "manatarms"], [3620, "crossbow"], [3780, "manatarms"],
        [4020, "manatarms"], [4160, "crossbow"],
        [4560, "baron"],
      ]);
      return;
    }
    if (n === 4) {
      W.banner = { text: "ERA IV  SMOKE OF EMPIRE", t: 160 };
      W.flags.push({ x: 360, y: G, on: false }, { x: 2860, y: G, on: false });
      W.pickups.push({ type: "plus", x: 840, y: G - 18, taken: false });
      W.pickups.push({ type: "plus", x: 2280, y: G - 18, taken: false });
      W.pickups.push({ type: "hourglass", x: 3340, y: G - 20, taken: false });
      W.pickups.push({ type: "plus", x: 3880, y: G - 18, taken: false });
      W.cannons.push({ x: 980, facing: -1, t: 20 }, { x: 1480, facing: 1, t: 70 }, { x: 2480, facing: -1, t: 40 }, { x: 3480, facing: 1, t: 10 });
      W.horse = { x: R.CART_X, y: G, hp: 120, maxHp: 120, facing: 1, mounted: false, alive: true, shrineX: R.CART_X, kind: 4 };
      hops(W, 1336, 1, 60, 0);
      crossing(W, 2050, 140, [
        { x: 2062, w: 44, y: 190, kind: "ice" },
        { x: 2120, w: 40, y: 166, kind: "ice", moveAmp: 16, moveSpd: 0.03 },
        { x: 2182, w: 44, y: 190, kind: "ice" },
      ]);
      crossing(W, 2640, 180, [
        { x: 2652, w: 48, y: 192, kind: "ice" },
        { x: 2718, w: 42, y: 166, kind: "ice", moveAmp: 18, moveSpd: 0.022 },
        { x: 2788, w: 44, y: 192, kind: "ice", fragile: true },
      ]);
      hops(W, 4256, 1, 80, 0);
      ledge(W, { x: 2388, w: 58, y: 178, kind: "ice" });
      spawn(W, [
        [520, "lineinf"], [640, "lineinf"], [780, "lancer"],
        [1100, "lineinf"], [1240, "lineinf"],
        [1680, "lancer"], [1840, "lineinf"],
        [2200, "lineinf"], [2360, "lancer"], [2580, "lineinf"],
        [3000, "lineinf"], [3180, "lancer"], [3360, "lineinf"],
        [3720, "lineinf"], [3920, "lancer"], [4120, "lineinf"],
        [4560, "powder"],
      ]);
      return;
    }
    if (n === 5) {
      W.banner = { text: "ERA V  THE IRON CENTURY", t: 160 };
      R.NEST_RUBBLE.forEach((s) => W.ledges.push({ x: s.x, w: s.w, y: s.y }));
      W.flags.push({ x: 360, y: G, on: false }, { x: 2920, y: G, on: false });
      W.pickups.push({ type: "plus", x: 860, y: G - 18, taken: false });
      W.pickups.push({ type: "plus", x: R.NEST_X + 280, y: G - 18, taken: false });
      W.pickups.push({ type: "hourglass", x: 3380, y: G - 20, taken: false });
      W.pickups.push({ type: "plus", x: 3920, y: G - 18, taken: false });
      W.searchlights.push({ x: 720, a: 0.2, da: 0.008, w: 46 }, { x: 1180, a: 1.1, da: -0.007, w: 50 }, { x: 2460, a: 0.6, da: 0.009, w: 44 }, { x: 3640, a: 1.4, da: -0.008, w: 48 });
      hops(W, 1288, 1, 58, 0);
      crossing(W, 2070, 160, [
        { x: 2082, w: 46, y: 190, kind: "rubble" },
        { x: 2144, w: 40, y: 164, kind: "rubble", fragile: true },
        { x: 2204, w: 48, y: 186, kind: "rubble" },
      ]);
      crossing(W, 2680, 180, [
        { x: 2692, w: 50, y: 190, kind: "rubble" },
        { x: 2760, w: 44, y: 164, kind: "rubble", fragile: true },
        { x: 2828, w: 50, y: 188, kind: "rubble" },
      ]);
      crossing(W, 4230, 190, [
        { x: 4242, w: 46, y: 192, kind: "rubble" },
        { x: 4304, w: 42, y: 168, kind: "rubble", moveAmp: 16, moveSpd: 0.026 },
        { x: 4370, w: 48, y: 188, kind: "rubble" },
      ]);
      spawn(W, [
        [520, "rifleinf"], [660, "rifleinf"], [820, "rifleinf"],
        [1040, "rifleinf"], [1220, "rifleinf"],
        [R.NEST_X, "mgnest"],
        [2280, "rifleinf"], [2440, "rifleinf"], [2620, "rifleinf"],
        [3120, "armorcar"],
        [3480, "rifleinf"], [3660, "rifleinf"], [3840, "rifleinf"],
        [4100, "rifleinf"],
        [4560, "colonel"],
      ]);
      return;
    }
    if (n === 6) {
      W.banner = { text: "ERA VI  THE FRACTURED PRESENT", t: 160 };
      W.flags.push({ x: 360, y: G, on: false }, { x: 2860, y: G, on: false });
      W.pickups.push({ type: "plus", x: 880, y: G - 18, taken: false });
      W.pickups.push({ type: "plus", x: 2280, y: G - 18, taken: false });
      W.pickups.push({ type: "hourglass", x: 3340, y: G - 20, taken: false });
      W.pickups.push({ type: "plus", x: 3920, y: G - 18, taken: false });
      [640, 980, 1320, 2360, 2680, 3480, 3820].forEach((x) => W.wrecks.push({ x, alive: true }));
      W.horse = { x: R.TANK_X, y: G, hp: 200, maxHp: 200, facing: 1, mounted: false, alive: true, shrineX: R.TANK_X, kind: 6 };
      W.droneT = 720;
      hops(W, 2088, 1, 64, 0);
      crossing(W, 1560, 200, [
        { x: 1572, w: 48, y: 192, kind: "concrete" },
        { x: 1638, w: 42, y: 166, kind: "concrete", moveAmp: 20, moveSpd: 0.03 },
        { x: 1710, w: 46, y: 188, kind: "concrete", fragile: true },
      ]);
      crossing(W, 2888, 180, [
        { x: 2900, w: 46, y: 190, kind: "concrete" },
        { x: 2962, w: 40, y: 164, kind: "concrete", fragile: true },
        { x: 3024, w: 46, y: 186, kind: "concrete", moveAmp: 14, moveSpd: 0.028 },
      ]);
      hops(W, 4270, 1, 86, 0);
      ledge(W, { x: 2380, w: 64, y: 176, kind: "concrete" });
      spawn(W, [
        [520, "modinf"], [720, "modinf"], [900, "modinf"],
        [1140, "modinf"], [1480, "modinf"],
        [2200, "modinf"], [2480, "modinf"], [2720, "modinf"],
        [3120, "ifv"],
        [3520, "modinf"], [3760, "modinf"], [4040, "modinf"],
        [4560, "fracture"],
      ]);
      return;
    }
    W.banner = { text: "DUST OF GAUGAMELA", t: 160 };
    W.flags.push({ x: 360, y: G, on: false }, { x: 2920, y: G, on: false });
    W.pickups.push({ type: "plus", x: 880, y: G - 18, taken: false });
    W.pickups.push({ type: "plus", x: 1680, y: G - 18, taken: false });
    W.pickups.push({ type: "hourglass", x: 3180, y: G - 20, taken: false });
    W.pickups.push({ type: "plus", x: 3720, y: G - 18, taken: false });
    hops(W, 1270, 2, 52, 44);
    hops(W, 1724, 2, 44, 40);
    crossing(W, 2180, 230, [
      { x: 2194, w: 50, y: 192, kind: "sand" },
      { x: 2260, w: 46, y: 168, kind: "sand", moveAmp: 18, moveSpd: 0.026 },
      { x: 2334, w: 50, y: 192, kind: "sand" },
      { x: 2396, w: 36, y: 176, kind: "sand", fragile: true },
    ]);
    W.pickups.push({ type: "plus", x: 2283, y: 150, taken: false });
    crossing(W, 2620, 220, [
      { x: 2632, w: 48, y: 192, kind: "sand" },
      { x: 2694, w: 42, y: 168, kind: "sand" },
      { x: 2752, w: 40, y: 160, kind: "sand", fragile: true },
      { x: 2810, w: 48, y: 176, kind: "sand" },
    ]);
    hops(W, 4240, 1, 90, 0);
    ledge(W, { x: 1000, w: 62, y: 186, kind: "sand" });
    ledge(W, { x: 1074, w: 54, y: 164, kind: "sand" });
    W.pickups.push({ type: "plus", x: 1100, y: 146, taken: false });
    spawn(W, [
      [520, "spear"], [620, "spear"], [760, "slinger"],
      [980, "spear"], [1080, "spear"], [1220, "slinger"],
      [1420, "spear"], [1540, "slinger"], [1680, "spear"],
      [1860, "spear"], [1960, "spear"], [2100, "slinger"],
      [2480, "elephant"],
      [3040, "spear"], [3140, "spear"], [3280, "slinger"],
      [3440, "spear"], [3580, "slinger"], [3720, "spear"],
      [3900, "spear"], [4020, "slinger"], [4140, "spear"],
      [4560, "boss"],
    ]);
  };
})();
