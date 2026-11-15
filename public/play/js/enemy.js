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
      sniper: 18,
      heavy: 28,
      miniboss: 60,
      boss: 180,
    },
    difficulty: { easy: 0.45, medium: 1, hard: 1.6, insane: 2.8 },
    eraLevel: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 },
    tierBonus: { infantry: 0, sniper: 0, heavy: 1, miniboss: 1, boss: 2 },
    maxLevel: 8,
    insane: {
      earlyEra: 3,
      solidMin: 10,
      gateLevel: 50,
      surviveCushion: 24,
    },
    types: {
      spear: "infantry",
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
      cannon: "heavy",
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

  // Era I grunt = 1 … Era VII grunt = 7. Heavies/bosses add a little, cap 8.
  function enemyLevel(e, era) {
    const type = e && typeof e === "object" ? e.type : e;
    const n = clamp((era | 0) || 1, 1, 7);
    const base = ENEMY.eraLevel[n] != null ? ENEMY.eraLevel[n] : n;
    const bonus = ENEMY.tierBonus[xpTier(type)] || 0;
    return clamp(base + bonus, 1, ENEMY.maxLevel);
  }

  function stampEnemy(e, era) {
    if (!e) return e;
    e.xpTier = xpTier(e.type);
    e.baseXP = xpForKill(e.type);
    e.effectiveLevel = enemyLevel(e, era);
    return e;
  }

  // Call from killEnemy / breakCannon. addXP applies ENEMY.difficulty itself.
  function onEnemyDeath(progress, e, difficulty, era) {
    if (!progress || !e) return 0;
    const base = e.baseXP != null ? e.baseXP : xpForKill(e.type);
    const lv = e.effectiveLevel != null ? e.effectiveLevel : enemyLevel(e, era);
    return progress.addXP(base, difficulty, lv);
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
  R.insaneSolidDamage = insaneSolidDamage;
})();
