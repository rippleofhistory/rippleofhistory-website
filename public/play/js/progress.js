(() => {
  "use strict";
  const R = (window.ROH = window.ROH || {});

  /**
   * Light RPG for Kael. Drop-in: new ROH.PlayerProgress(), then
   *   kill  → ROH.onEnemyDeath(progress, e, difficulty, era)
   *   hurt  → progress.takeDamage(dmg); player.hp = progress.currentHealth
   *   hit   → e.hp -= progress.dealDamage(base)
   *   spawn → player.hp = progress.maxHealth
   * XP table, effectiveLevel, and Insane solid hits live in ROH.ENEMY (js/enemy.js).
   * Nested in roh.save.progress so persistSave cannot wipe it.
   * Shop: PlayerProgress.applyXPPack / applyPermanentUpgrade after a verified
   * Stripe or Play Billing grant. No checkout UI or prices in this file.
   */
  const MAX_LEVEL = 100;
  const SAVE_KEY = "roh.save";

  const XP_DIFF = (R.ENEMY && R.ENEMY.difficulty) || { easy: 0.4, medium: 1, hard: 1.7, insane: 3 };

  /**
   * Player combat scaling. Tune these anchors only.
   *   maxHealth  L1=100, L25=130, L50=170, L75=200, L100=230
   *   attackPower = 1 + 0.008*(level-1)     L25=1.192  L50=1.392  L75=1.592  L100=1.792
   *   damageReduction = 0.18*(level-1)/99   L50≈8.9%   L100=18%
   *   xpToNext   L1=80, L25=1400, L50=5500, L75=14000  (L100 unused)
   * dealDamage:  round(baseWeaponDamage * attackPower)
   * takeDamage:  round(amount * (1 - damageReduction))
   */
  const SCALING = {
    hpL1: 100,
    hpL25: 130,
    hpL50: 170,
    hpL75: 200,
    hpL100: 230,
    atkPerLevel: 0.008,
    drAt100: 0.18,
  };

  const XP_CURVE = [
    { lv: 1, xp: 80 },
    { lv: 25, xp: 1400 },
    { lv: 50, xp: 5500 },
    { lv: 75, xp: 14000 },
    { lv: 100, xp: 25000 },
  ];

  const HP_CURVE = [
    { lv: 1, hp: SCALING.hpL1 },
    { lv: 25, hp: SCALING.hpL25 },
    { lv: 50, hp: SCALING.hpL50 },
    { lv: 75, hp: SCALING.hpL75 },
    { lv: 100, hp: SCALING.hpL100 },
  ];

  // Catalog SKUs only (no prices). Stripe / Play Billing maps a paid SKU → these grants.
  const SHOP_PACKS = {
    pouch: { id: "pouch", xp: 500 },
    crate: { id: "crate", xp: 2500 },
    chest: { id: "chest", xp: 10000 },
  };
  const SHOP_UPGRADES = {
    taut: { id: "taut", type: "health", value: 16 },
    edge: { id: "edge", type: "attack", value: 0.08 },
    lore: { id: "lore", type: "xp", value: 0.15 },
    headstart: { id: "headstart", type: "startLevel", value: 10 },
  };

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
  }

  function lerpSteps(level, steps, key) {
    const lv = clamp(level | 0, 1, MAX_LEVEL);
    for (let i = 0; i < steps.length - 1; i++) {
      const a = steps[i];
      const b = steps[i + 1];
      if (lv <= b.lv) {
        const t = (lv - a.lv) / (b.lv - a.lv);
        return a[key] + (b[key] - a[key]) * t;
      }
    }
    return steps[steps.length - 1][key];
  }

  // Piecewise through XP_CURVE. Easy 0.4× stalls once farmMul cuts in (gap > 4 vs the foe).
  function xpToNext(level) {
    return Math.round(lerpSteps(level, XP_CURVE, "xp"));
  }

  function maxHealthAt(level) {
    return Math.floor(lerpSteps(level, HP_CURVE, "hp"));
  }

  function attackAt(level) {
    return 1 + SCALING.atkPerLevel * (clamp(level, 1, MAX_LEVEL) - 1);
  }

  /**
   * Permanent paid bonuses. Stored on roh.save.progress.shop.
   * bonusMaxHealth — flat HP added after the level curve
   * bonusAttack    — added to attackPower (0.08 ≈ +8%)
   * bonusXPPercent — kill-XP multiplier (0.15 ≈ +15%)
   * bonusStartLevel — floor for Kael's level after a headstart pack
   */
  function ShopUpgrades(data) {
    data = data || {};
    this.bonusMaxHealth = Math.max(0, Number(data.bonusMaxHealth) || 0);
    this.bonusAttack = Math.max(0, Number(data.bonusAttack) || 0);
    this.bonusXPPercent = Math.max(0, Number(data.bonusXPPercent) || 0);
    this.bonusStartLevel = clamp(parseInt(data.bonusStartLevel, 10) || 1, 1, MAX_LEVEL);
  }

  ShopUpgrades.prototype.toJSON = function () {
    return {
      bonusMaxHealth: this.bonusMaxHealth,
      bonusAttack: this.bonusAttack,
      bonusXPPercent: this.bonusXPPercent,
      bonusStartLevel: this.bonusStartLevel,
    };
  };

  function shopFromSave(data) {
    data = data || {};
    if (data.shop) return new ShopUpgrades(data.shop);
    const u = data.upgrades || {};
    return new ShopUpgrades({
      bonusMaxHealth: u.taut ? 16 : 0,
      bonusAttack: u.edge ? 0.08 : 0,
      bonusXPPercent: u.lore ? 0.15 : 0,
      bonusStartLevel: 1,
    });
  }

  function damageReductionAt(level) {
    return SCALING.drAt100 * (clamp(level, 1, MAX_LEVEL) - 1) / 99;
  }

  // Full XP within farm.grace of the foe. Then perLevel off, cap at farm.cap.
  // L5 vs Alexander (gap 4) = full. L40 vs Alexander ≈ 77% off. L70+ early ≈ nothing.
  function farmMul(playerLevel, foeLevel) {
    if (foeLevel == null) return 1;
    const cfg = (R.ENEMY && R.ENEMY.farm) || {
      grace: 4, perLevel: 0.022, cap: 0.92, crushMul: 0.6, crushRatio: 2.5, crushGap: 50,
    };
    const foe = Math.max(1, foeLevel | 0);
    const over = playerLevel - foe;
    let mul = 1;
    if (over > cfg.grace) {
      mul *= 1 - Math.min(cfg.cap, (over - cfg.grace) * cfg.perLevel);
    }
    if (playerLevel > foe * cfg.crushRatio && over > cfg.crushGap) {
      mul *= cfg.crushMul;
    }
    return mul;
  }

  function PlayerProgress() {
    this.level = 1;
    this.currentXP = 0;
    this.xpToNextLevel = xpToNext(1);
    this.maxHealth = 100;
    this.currentHealth = 100;
    this.attackPower = 1;
    this.damageReduction = 0;
    this.lastTaken = 0;
    this.shop = new ShopUpgrades();
    this.onLevelUp = null;
  }

  PlayerProgress.prototype.recalc = function () {
    this.level = clamp(this.level | 0, 1, MAX_LEVEL);
    if (this.shop && this.level < this.shop.bonusStartLevel) this.level = this.shop.bonusStartLevel;
    this.xpToNextLevel = xpToNext(this.level);
    this.maxHealth = maxHealthAt(this.level) + Math.round(this.shop.bonusMaxHealth || 0);
    this.attackPower = attackAt(this.level) + (this.shop.bonusAttack || 0);
    this.damageReduction = damageReductionAt(this.level);
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
      shop: this.shop.toJSON(),
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
    this.currentHealth = this.maxHealth;
    if (!silent && typeof this.onLevelUp === "function") this.onLevelUp(this.level, this.maxHealth - prevMax);
    return this.level;
  };

  function xpGrant(gained, leveledUp, level) {
    return { gained: gained | 0, leveledUp: !!leveledUp, level: level | 0 };
  }

  function resolveKillXP(amountOrType) {
    if (typeof amountOrType === "string") {
      if (typeof R.xpForKill === "function") return R.xpForKill(amountOrType);
      const table = (R.ENEMY && R.ENEMY.xp) || {};
      return table[amountOrType] != null ? table[amountOrType] : 12;
    }
    return Math.max(0, Number(amountOrType) || 0);
  }

  /**
   * Kill: addXP(enemy.type, difficulty, enemy.effectiveLevel)
   * Pack: addXP(amount, null, null, { paid: true })
   * Returns { gained, leveledUp, level }.
   */
  PlayerProgress.prototype.addXP = function (amountOrType, difficulty, foeLevel, opts) {
    if (this.level >= MAX_LEVEL) return xpGrant(0, false, this.level);
    const paid = opts && opts.paid;
    let granted = paid ? Math.max(0, Number(amountOrType) || 0) : resolveKillXP(amountOrType);
    if (granted <= 0) return xpGrant(0, false, this.level);
    if (!paid) {
      if (difficulty) granted *= XP_DIFF[difficulty] != null ? XP_DIFF[difficulty] : 1;
      granted *= farmMul(this.level, foeLevel);
      granted *= 1 + (this.shop.bonusXPPercent || 0);
      granted = Math.max(1, Math.floor(granted));
    } else {
      granted = Math.floor(granted);
      if (granted <= 0) return xpGrant(0, false, this.level);
    }
    const startLv = this.level;
    this.currentXP += granted;
    while (this.level < MAX_LEVEL && this.currentXP >= this.xpToNextLevel) this.levelUp();
    if (this.level >= MAX_LEVEL) this.currentXP = 0;
    this.save();
    return xpGrant(granted, this.level > startLv, this.level);
  };

  PlayerProgress.prototype.takeDamage = function (amount) {
    const incoming = Math.max(0, Number(amount) || 0);
    const taken = Math.max(0, Math.round(incoming * (1 - this.damageReduction)));
    this.lastTaken = taken;
    this.currentHealth = Math.max(0, this.currentHealth - taken);
    return this.currentHealth;
  };

  PlayerProgress.prototype.dealDamage = function (baseWeaponDamage) {
    return Math.max(1, Math.round((Number(baseWeaponDamage) || 0) * this.attackPower));
  };

  /**
   * Stripe / Play Billing: after payment is verified, grant the pack XP.
   *   checkout.session.completed  →  progress.applyXPPack(SHOP.packs.crate.xp)
   * Do not call this from a buy-button click. Paid XP skips difficulty, farm, and bonusXPPercent.
   */
  PlayerProgress.prototype.applyXPPack = function (amount) {
    return this.addXP(amount, null, null, { paid: true }).gained;
  };

  /**
   * Stripe / Play Billing: after payment is verified, add a permanent bonus.
   *   type: "health" | "attack" | "xp" | "startLevel"
   *   progress.applyPermanentUpgrade("health", 20)
   *   progress.applyPermanentUpgrade("attack", 0.08)
   *   progress.applyPermanentUpgrade("xp", 0.15)
   *   progress.applyPermanentUpgrade("startLevel", 10)
   */
  PlayerProgress.prototype.applyPermanentUpgrade = function (type, value) {
    const n = Number(value);
    if (!(n > 0)) return false;
    const prevMax = this.maxHealth;
    if (type === "health" || type === "bonusMaxHealth") {
      this.shop.bonusMaxHealth += n;
    } else if (type === "attack" || type === "bonusAttack") {
      this.shop.bonusAttack += n;
    } else if (type === "xp" || type === "bonusXPPercent") {
      this.shop.bonusXPPercent += n;
    } else if (type === "startLevel" || type === "bonusStartLevel") {
      this.shop.bonusStartLevel = clamp(Math.max(this.shop.bonusStartLevel, Math.round(n)), 1, MAX_LEVEL);
      if (this.level < this.shop.bonusStartLevel) {
        this.level = this.shop.bonusStartLevel;
        this.currentXP = 0;
      }
    } else {
      return false;
    }
    this.recalc();
    if (this.maxHealth > prevMax) {
      this.currentHealth = Math.min(this.maxHealth, this.currentHealth + (this.maxHealth - prevMax));
    }
    this.save();
    return true;
  };

  PlayerProgress.prototype.load = function (data) {
    data = data || {};
    this.shop = shopFromSave(data);
    this.level = clamp(parseInt(data.level, 10) || 1, 1, MAX_LEVEL);
    this.currentXP = Math.max(0, parseInt(data.xp, 10) || 0);
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
    return progress.applyXPPack(pack.xp);
  }

  function applyUpgrade(id, progress) {
    const spec = SHOP_UPGRADES[id];
    if (!spec || !progress) return false;
    return progress.applyPermanentUpgrade(spec.type, spec.value);
  }

  /**
   * Stripe / Play Billing success callback.
   * Verify the session/purchase first, then:
   *   ROH.SHOP.onPaymentSuccess(progress, skuId)
   * skuId is a pack (pouch/crate/chest) or upgrade (taut/edge/lore/headstart).
   */
  function onPaymentSuccess(progress, skuId) {
    if (!progress || !skuId) return null;
    if (SHOP_PACKS[skuId]) return applyPack(skuId, progress);
    if (SHOP_UPGRADES[skuId]) return applyUpgrade(skuId, progress);
    return null;
  }

  function previewInsaneHit(level, era) {
    const p = new PlayerProgress();
    p.load({ level: level, xp: 0 });
    const raw = 14;
    const applied = Math.max(1, Math.round(raw * 2.7));
    const incoming = R.insaneSolidDamage
      ? R.insaneSolidDamage(applied, raw, "insane", era == null ? 1 : era, p.level)
      : applied;
    p.takeDamage(incoming);
    return {
      level: p.level,
      maxHealth: p.maxHealth,
      attackPower: +p.attackPower.toFixed(3),
      damageReduction: +p.damageReduction.toFixed(4),
      incoming: incoming,
      taken: p.lastTaken,
      hpAfter: p.currentHealth,
      survives: p.currentHealth > 0,
    };
  }

  function debugInsane() {
    const rows = [1, 40, 49, 50, 100].map((lv) => previewInsaneHit(lv, 1));
    if (typeof console !== "undefined" && console.table) console.table(rows);
    return rows;
  }

  R.MAX_LEVEL = MAX_LEVEL;
  R.SCALING = SCALING;
  R.XP_CURVE = XP_CURVE;
  R.XP_DIFF = XP_DIFF;
  R.xpToNext = xpToNext;
  R.maxHealthAt = maxHealthAt;
  R.attackAt = attackAt;
  R.damageReductionAt = damageReductionAt;
  R.previewInsaneHit = previewInsaneHit;
  R.debugInsane = debugInsane;
  R.farmMul = farmMul;
  R.ShopUpgrades = ShopUpgrades;
  R.PlayerProgress = PlayerProgress;
  R.SHOP = {
    packs: SHOP_PACKS,
    upgrades: SHOP_UPGRADES,
    applyPack: applyPack,
    applyUpgrade: applyUpgrade,
    onPaymentSuccess: onPaymentSuccess,
  };
})();
