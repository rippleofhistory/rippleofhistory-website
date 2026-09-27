(() => {
  "use strict";
  const R = (window.ROH = window.ROH || {});

  R.BOSS_TYPES = ["boss", "centurion", "baron", "powder", "colonel", "fracture"];
  R.SPECIAL_TYPES = ["elephant", "boss", "centurion", "baron", "gate", "powder", "mgnest", "armorcar", "colonel", "ifv", "fracture"];

  R.ENEMY_STATS = {
    spear: { hp: 34, w: 18, h: 38, dw: 50, dh: 52 },
    slinger: { hp: 24, w: 16, h: 36, dw: 48, dh: 52 },
    legionary: { hp: 42, w: 20, h: 40, dw: 56, dh: 56 },
    archer: { hp: 22, w: 16, h: 36, dw: 50, dh: 52, ledge: true },
    elephant: { hp: 3, w: 70, h: 56, dw: 118, dh: 78, hits: 0 },
    boss: { hp: 180, w: 54, h: 62, dw: 110, dh: 88, intro: 90 },
    centurion: { hp: 200, w: 52, h: 64, dw: 108, dh: 90, intro: 90, guarded: true },
    manatarms: { hp: 40, w: 20, h: 40, dw: 54, dh: 56 },
    crossbow: { hp: 26, w: 18, h: 38, dw: 52, dh: 54 },
    knight: { hp: 90, w: 26, h: 48, dw: 70, dh: 68, guarded: true },
    gate: { hp: 80, w: 48, h: 92, dw: 110, dh: 110 },
    baron: { hp: 220, w: 56, h: 66, dw: 112, dh: 92, intro: 90, guarded: true },
    lineinf: { hp: 36, w: 18, h: 40, dw: 50, dh: 54 },
    lancer: { hp: 48, w: 36, h: 52, dw: 90, dh: 70 },
    powder: { hp: 240, w: 54, h: 64, dw: 110, dh: 90, intro: 90 },
    rifleinf: { hp: 34, w: 18, h: 40, dw: 50, dh: 54 },
    mgnest: { hp: 90, w: 52, h: 48, dw: 96, dh: 70, facing: 1 },
    armorcar: { hp: 110, w: 58, h: 42, dw: 100, dh: 56, guarded: true },
    colonel: { hp: 230, w: 50, h: 62, dw: 108, dh: 88, intro: 90, guarded: true },
    modinf: { hp: 38, w: 18, h: 40, dw: 52, dh: 54 },
    ifv: { hp: 140, w: 64, h: 44, dw: 110, dh: 58, guarded: true },
    fracture: { hp: 300, w: 46, h: 66, dw: 100, dh: 92, intro: 90 },
  };

  R.fillEnemy = function (e, type, groundY, aquaY) {
    const st = R.ENEMY_STATS[type];
    if (!st) return e;
    e.hp = e.maxHp = st.hp;
    e.w = st.w;
    e.h = st.h;
    e.dw = st.dw;
    e.dh = st.dh;
    if (st.hits != null) e.hits = st.hits;
    if (st.intro) e.intro = st.intro;
    if (st.guarded) e.guarded = true;
    if (st.facing != null) e.facing = st.facing;
    if (st.ledge) {
      e.y = aquaY;
      e.ledge = true;
    }
    return e;
  };

  R.isBoss = function (type) {
    return R.BOSS_TYPES.indexOf(type) >= 0;
  };
  R.isSpecial = function (type) {
    return R.SPECIAL_TYPES.indexOf(type) >= 0;
  };
})();
