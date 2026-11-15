(() => {
  "use strict";
  const R = (window.ROH = window.ROH || {});

  /**
   * Light RPG for Kael. Drop-in: new ROH.PlayerProgress(), then
   *   kill  → progress.addXP(ROH.xpForKill(type), difficulty, ROH.enemyLevel(e, era))
   *   hurt  → progress.takeDamage(dmg); player.hp = progress.currentHealth
   *   hit   → e.hp -= progress.dealDamage(base)
   *   spawn → player.hp = progress.maxHealth
   * Nested in roh.save.progress so persistSave cannot wipe it.
   * Shop methods apply a real Play Billing grant later — no store UI here.
   */
  const MAX_LEVEL = 100;
  const SAVE_KEY = "roh.save";

  // Easy farming of early eras is meant to stall; Medium is the baseline.
  const XP_DIFF = { easy: 0.45, medium: 1, hard: 1.6, insane: 2.8 };

  const XP_KILL = { grunt: 22, elite: 55, boss: 180 };

  // Permanent ranks (0/1). Applied after a real billing grant via ROH.SHOP.
  const SHOP_PACKS = {
    pouch: { id: "pouch", xp: 500 },
    crate: { id: "crate", xp: 2500 },
    chest: { id: "chest", xp: 10000 },
  };
  const SHOP_UPGRADES = {
    taut: { id: "taut", hp: 0.08 },
    edge: { id: "edge", atk: 0.08 },
    lore: { id: "lore", xpGain: 0.15 },
  };

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
  }

  // L1=80, L10=3573, L50≈50423, L100≈159722 — Easy 0.45× cannot keep up.
  function xpToNext(level) {
    return Math.floor(80 * Math.pow(clamp(level, 1, MAX_LEVEL), 1.65));
  }

  // L1=100, L50=158, L100=218. Insane 2.7× of a 40-raw hit is 108; L50 lives, L1 does not.
  function maxHealthAt(level, taut) {
    const base = Math.floor(100 * (1 + 0.012 * (clamp(level, 1, MAX_LEVEL) - 1)));
    return Math.floor(base * (1 + 0.08 * (taut ? 1 : 0)));
  }

  // L1=1.00, L50=1.392, L100=1.792 (~+0.8% attack per level).
  function attackAt(level, edge) {
    return 1 + 0.008 * (clamp(level, 1, MAX_LEVEL) - 1) + 0.08 * (edge ? 1 : 0);
  }

  // Era 1 grunt = 1; era 7 grunt = 73; elites +5; bosses +10. Cap 100.
  function enemyLevel(e, era) {
    const type = e && typeof e === "object" ? e.type : e;
    const n = clamp((era | 0) || 1, 1, 7);
    let lv = 1 + (n - 1) * 12;
    if (R.isBoss && R.isBoss(type)) lv += 10;
    else if ((R.isSpecial && R.isSpecial(type)) || type === "knight") lv += 5;
    return clamp(lv, 1, MAX_LEVEL);
  }

  function xpForKill(type) {
    if (R.isBoss && R.isBoss(type)) return XP_KILL.boss;
    if ((R.isSpecial && R.isSpecial(type)) || type === "knight" || type === "gate") return XP_KILL.elite;
    return XP_KILL.grunt;
  }

  // Full XP within 12 levels of the foe. Past that, 70% cut at +13 scaling to 90% by +32.
  function farmMul(playerLevel, foeLevel) {
    if (foeLevel == null) return 1;
    const over = playerLevel - Math.max(1, foeLevel | 0);
    if (over <= 12) return 1;
    const t = Math.min(1, (over - 12) / 20);
    return 0.3 - t * 0.2;
  }

  function PlayerProgress() {
    this.level = 1;
    this.currentXP = 0;
    this.xpToNextLevel = xpToNext(1);
    this.maxHealth = 100;
    this.currentHealth = 100;
    this.attackPower = 1;
    this.upgrades = { taut: 0, edge: 0, lore: 0 };
    this.onLevelUp = null;
  }

  PlayerProgress.prototype.recalc = function () {
    this.level = clamp(this.level | 0, 1, MAX_LEVEL);
    this.xpToNextLevel = xpToNext(this.level);
    this.maxHealth = maxHealthAt(this.level, this.upgrades.taut);
    this.attackPower = attackAt(this.level, this.upgrades.edge);
    if (this.currentHealth > this.maxHealth) this.currentHealth = this.maxHealth;
    return this;
  };

  PlayerProgress.prototype.fill = function () {
    this.currentHealth = this.maxHealth;
    return this.currentHealth;
  };

  PlayerProgress.prototype.toJSON = function () {
    return {
      level: this.level,
      xp: this.currentXP,
      upgrades: { taut: this.upgrades.taut | 0, edge: this.upgrades.edge | 0, lore: this.upgrades.lore | 0 },
    };
  };

  PlayerProgress.prototype.levelUp = function (silent) {
    if (this.level >= MAX_LEVEL) {
      this.currentXP = 0;
      this.recalc();
      return this.level;
    }
    this.currentXP = Math.max(0, this.currentXP - this.xpToNextLevel);
    this.level += 1;
    const prevMax = this.maxHealth;
    this.recalc();
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + (this.maxHealth - prevMax));
    if (!silent && typeof this.onLevelUp === "function") this.onLevelUp(this.level, this.maxHealth - prevMax);
    return this.level;
  };

  /**
   * amount = kill table (or a shop pack). difficulty scales it; omit for a raw grant.
   * enemyLevel applies the anti-farm cut when the player is more than 12 above the foe.
   */
  PlayerProgress.prototype.addXP = function (amount, difficulty, foeLevel) {
    if (this.level >= MAX_LEVEL) return 0;
    let granted = Math.max(0, Number(amount) || 0);
    if (difficulty) granted *= XP_DIFF[difficulty] != null ? XP_DIFF[difficulty] : 1;
    granted *= farmMul(this.level, foeLevel);
    if (this.upgrades.lore) granted *= 1 + SHOP_UPGRADES.lore.xpGain;
    granted = Math.floor(granted);
    if (granted <= 0) return 0;
    this.currentXP += granted;
    while (this.level < MAX_LEVEL && this.currentXP >= this.xpToNextLevel) this.levelUp();
    if (this.level >= MAX_LEVEL) this.currentXP = 0;
    this.save();
    return granted;
  };

  PlayerProgress.prototype.takeDamage = function (amount) {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    this.currentHealth = Math.max(0, this.currentHealth - n);
    return this.currentHealth;
  };

  PlayerProgress.prototype.dealDamage = function (baseDamage) {
    return Math.max(1, Math.round((Number(baseDamage) || 0) * this.attackPower));
  };

  PlayerProgress.prototype.load = function (data) {
    data = data || {};
    this.level = clamp(parseInt(data.level, 10) || 1, 1, MAX_LEVEL);
    this.currentXP = Math.max(0, parseInt(data.xp, 10) || 0);
    const u = data.upgrades || {};
    this.upgrades = {
      taut: u.taut ? 1 : 0,
      edge: u.edge ? 1 : 0,
      lore: u.lore ? 1 : 0,
    };
    this.recalc();
    this.currentHealth = this.maxHealth;
    while (this.level < MAX_LEVEL && this.currentXP >= this.xpToNextLevel) this.levelUp(true);
    return this;
  };

  // Merge into roh.save so a later persistSave that includes .progress cannot fight this.
  PlayerProgress.prototype.save = function () {
    try {
      let s = {};
      try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") || {}; } catch (err) { s = {}; }
      s.progress = this.toJSON();
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch (err) { /* quota */ }
    return this;
  };

  function applyPack(id, progress) {
    const pack = SHOP_PACKS[id];
    if (!pack || !progress) return 0;
    return progress.addXP(pack.xp);
  }

  function applyUpgrade(id, progress) {
    const spec = SHOP_UPGRADES[id];
    if (!spec || !progress) return false;
    if (progress.upgrades[id]) return false;
    progress.upgrades[id] = 1;
    const prevMax = progress.maxHealth;
    progress.recalc();
    progress.currentHealth = Math.min(progress.maxHealth, progress.currentHealth + (progress.maxHealth - prevMax));
    progress.save();
    return true;
  }

  R.MAX_LEVEL = MAX_LEVEL;
  R.XP_DIFF = XP_DIFF;
  R.XP_KILL = XP_KILL;
  R.xpToNext = xpToNext;
  R.maxHealthAt = maxHealthAt;
  R.attackAt = attackAt;
  R.enemyLevel = enemyLevel;
  R.xpForKill = xpForKill;
  R.farmMul = farmMul;
  R.PlayerProgress = PlayerProgress;
  R.SHOP = {
    packs: SHOP_PACKS,
    upgrades: SHOP_UPGRADES,
    applyPack: applyPack,
    applyUpgrade: applyUpgrade,
  };
})();
