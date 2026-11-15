(() => {
  "use strict";
  const R = (window.ROH = window.ROH || {});

  /**
   * Kill XP, effectiveLevel, and Insane early-era hits.
   * Tune this object only — game.js calls onEnemyDeath / insaneSolidDamage.
   *
   * Insane first blow (eras I–III): lethal below gateLevel, survivable at 50+
   * after takeDamage damageReduction. Tune gateLevel / surviveCushion.
   */
  const ENEMY = {
    xp: {
      infantry: 12,
      spear: 14,
      sniper: 18,
      cannon: 28,
      heavy: 35,
      miniboss: 70,
      boss: 200,
    },
    difficulty: { easy: 0.4, medium: 1, hard: 1.7, insane: 3 },
    farm: {
      grace: 4,
      perLevel: 0.022,
      cap: 0.92,
      crushMul: 0.6,
      crushRatio: 2.5,
      crushGap: 50,
    },
    eraBand: {
      1: { min: 1, max: 2 },
      2: { min: 2, max: 3 },
      3: { min: 3, max: 4 },
      4: { min: 4, max: 5 },
      5: { min: 5, max: 6 },
      6: { min: 6, max: 8 },
      7: { min: 7, max: 9 },
    },
    bossBonus: 2,
    maxLevel: 9,
    insane: {
      earlyEra: 3,
      solidMin: 10,
      gateLevel: 50,
      surviveCushion: 24,
    },
    types: {
      spear: "spear",
      javelin: "infantry",
      slinger: "infantry",
      legionary: "infantry",
      pilum: "infantry",
      manatarms: "infantry",
      lineinf: "infantry",
      rifleinf: "infantry",
      duneinf: "infantry",
      nva: "infantry",
      vc: "infantry",
      modinf: "infantry",
      raptor: "infantry",
      archer: "sniper",
      crossbow: "sniper",
      arbalist: "sniper",
      voltigeur: "sniper",
      sniper: "sniper",
      marksman: "sniper",
      lancer: "heavy",
      cannon: "cannon",
      elephant: "miniboss",
      knight: "miniboss",
      gate: "miniboss",
      mgnest: "miniboss",
      armorcar: "miniboss",
      hunter: "miniboss",
      ifv: "miniboss",
      boss: "boss",
      centurion: "boss",
      baron: "boss",
      powder: "boss",
      colonel: "boss",
      rex: "boss",
      cadre: "boss",
      fracture: "boss",
    },
  };

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
  }

  function xpTier(type) {
    return ENEMY.types[type] || "infantry";
  }

  function xpForKill(type) {
    return ENEMY.xp[xpTier(type)] || ENEMY.xp.infantry;
  }

  // Era bands: I 1–2, II 2–3, III 3–4, IV 4–5, V 5–6, VI 6–8, VII 7–9. Bosses = era min + 2.
  function enemyLevel(e, era) {
    const type = e && typeof e === "object" ? e.type : e;
    const n = clamp((era | 0) || 1, 1, 7);
    const band = ENEMY.eraBand[n] || { min: n, max: n + 1 };
    const tier = xpTier(type);
    let lv = band.min;
    if (tier === "boss") lv = band.min + (ENEMY.bossBonus || 2);
    else if (tier === "miniboss") lv = band.max;
    else if (tier === "sniper" || tier === "heavy" || tier === "cannon") {
      lv = Math.min(band.max, band.min + 1);
    }
    return clamp(lv, 1, ENEMY.maxLevel);
  }

  function stampEnemy(e, era) {
    if (!e) return e;
    e.xpTier = xpTier(e.type);
    e.baseXP = xpForKill(e.type);
    e.effectiveLevel = enemyLevel(e, era);
    return e;
  }

  // killEnemy / breakCannon: addXP(type, difficulty, effectiveLevel) → { gained, leveledUp, level }
  function onEnemyDeath(progress, e, difficulty, era) {
    if (!progress) return { gained: 0, leveledUp: false, level: 1 };
    if (!e) return { gained: 0, leveledUp: false, level: progress.level };
    const type = e.type || e.xpTier || "infantry";
    const lv = e.effectiveLevel != null ? e.effectiveLevel : enemyLevel(e, era);
    return progress.addXP(type, difficulty, lv);
  }

  /**
   * applied = already * dmgIn. raw = the hurtPlayer first argument.
   * Unblocked Kael hits only — skip for mounts, chip, and parries.
   * Pre-DR amount: below gateLevel this is lethal after takeDamage;
   * at 50+ it leaves surviveCushion HP.
   */
  function insaneSolidDamage(applied, raw, diffId, era, playerLevel) {
    const cfg = ENEMY.insane;
    if (diffId !== "insane") return applied;
    if ((era | 0) > cfg.earlyEra) return applied;
    if ((raw || 0) < cfg.solidMin) return applied;
    const lv = playerLevel | 0 || 1;
    const hp = R.maxHealthAt ? R.maxHealthAt(lv) : 100;
    const dr = R.damageReductionAt ? R.damageReductionAt(lv) : 0;
    const resist = Math.max(0.05, 1 - dr);
    const gate = cfg.gateLevel || 50;
    function preForTaken(taken) {
      const need = Math.max(1, taken | 0);
      let pre = Math.max(1, Math.round(need / resist));
      while (Math.round(pre * resist) < need) pre++;
      while (pre > 1 && Math.round((pre - 1) * resist) >= need) pre--;
      return pre;
    }
    if (lv < gate) return preForTaken(hp);
    const cushion = cfg.surviveCushion != null ? cfg.surviveCushion : 24;
    return preForTaken(hp - cushion);
  }

  R.ENEMY = ENEMY;
  R.xpTier = xpTier;
  R.xpForKill = xpForKill;
  R.enemyLevel = enemyLevel;
  R.stampEnemy = stampEnemy;
  R.onEnemyDeath = onEnemyDeath;
  R.onEnemyKilled = onEnemyDeath;
  R.insaneSolidDamage = insaneSolidDamage;
})();
