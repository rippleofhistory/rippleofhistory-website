(() => {
  "use strict";
  const R = (window.ROH = window.ROH || {});
  const SAVE_KEY = "roh.save";

  /**
   * Inventory for Kael. Persist nested in roh.save.inventory.
   * Consumables, gear, and key items. Shop UI comes later.
   */
  const ITEM_DEFINITIONS = {
    health_potion_small: {
      name: "Small Health Potion",
      type: "consumable",
      stackable: true,
      maxStack: 10,
      effect: { heal: 40 },
      description: "Restores 40 HP",
    },
    health_potion_large: {
      name: "Large Health Potion",
      type: "consumable",
      stackable: true,
      maxStack: 5,
      effect: { heal: 100 },
      description: "Restores 100 HP",
    },
    rage_tonic: {
      name: "Rage Tonic",
      type: "consumable",
      stackable: true,
      maxStack: 5,
      effect: { attackBoost: 0.25, duration: 15000 },
      description: "+25% attack for 15s",
    },
    iron_sword: {
      name: "Iron Sword",
      type: "weapon",
      slot: "weapon",
      attackBonus: 0.15,
      description: "+15% attack power",
    },
    reinforced_armor: {
      name: "Reinforced Armor",
      type: "armor",
      slot: "armor",
      healthBonus: 30,
      damageReduction: 0.05,
      description: "+30 HP, +5% damage reduction",
    },
    veterans_medallion: {
      name: "Veteran's Medallion",
      type: "accessory",
      slot: "accessory",
      xpBonus: 0.10,
      description: "+10% XP gained",
    },
    tether_fragment: {
      name: "Tether Fragment",
      type: "key",
      stackable: true,
      maxStack: 99,
      description: "A fragment of the timeline tether",
    },
  };

  function emptyGear() {
    return { weapon: null, armor: null, accessory: null };
  }

  function Inventory(progress) {
    this.progress = progress;
    this.items = {};
    this.equipment = emptyGear();
    this.activeBuffs = [];
  }

  Inventory.prototype.def = function (itemId) {
    return ITEM_DEFINITIONS[itemId] || null;
  };

  Inventory.prototype.addItem = function (itemId, quantity) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return false;
    const n = Math.max(1, quantity | 0);
    if (!this.items[itemId]) this.items[itemId] = 0;
    if (def.stackable) {
      const max = def.maxStack || 99;
      this.items[itemId] = Math.min(max, this.items[itemId] + n);
    } else {
      this.items[itemId] = 1;
    }
    this.save();
    return true;
  };

  Inventory.prototype.removeItem = function (itemId, quantity) {
    const n = Math.max(1, quantity | 0);
    if (!this.items[itemId] || this.items[itemId] < n) return false;
    this.items[itemId] -= n;
    if (this.items[itemId] <= 0) delete this.items[itemId];
    this.save();
    return true;
  };

  Inventory.prototype.hasItem = function (itemId, quantity) {
    return (this.items[itemId] || 0) >= Math.max(1, quantity | 0);
  };

  Inventory.prototype.getQuantity = function (itemId) {
    return this.items[itemId] || 0;
  };

  Inventory.prototype.equip = function (itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def || !def.slot) return false;
    if (!this.hasItem(itemId)) return false;
    const slot = def.slot;
    if (this.equipment[slot]) this.unequip(slot);
    this.equipment[slot] = itemId;
    this.removeItem(itemId, 1);
    this.recalculateEquipmentStats();
    this.save();
    return true;
  };

  Inventory.prototype.unequip = function (slot) {
    const itemId = this.equipment[slot];
    if (!itemId) return false;
    this.equipment[slot] = null;
    this.addItem(itemId, 1);
    this.recalculateEquipmentStats();
    this.save();
    return true;
  };

  Inventory.prototype.recalculateEquipmentStats = function () {
    const bonuses = {
      attackMultiplier: 0,
      bonusMaxHealth: 0,
      damageReduction: 0,
      xpPercent: 0,
    };
    Object.keys(this.equipment).forEach((slot) => {
      const itemId = this.equipment[slot];
      if (!itemId) return;
      const def = ITEM_DEFINITIONS[itemId];
      if (!def) return;
      if (def.attackBonus) bonuses.attackMultiplier += def.attackBonus;
      if (def.healthBonus) bonuses.bonusMaxHealth += def.healthBonus;
      if (def.damageReduction) bonuses.damageReduction += def.damageReduction;
      if (def.xpBonus) bonuses.xpPercent += def.xpBonus;
    });
    bonuses.attackMultiplier += this.getActiveAttackBonus();
    if (!this.progress) return bonuses;
    const prev = this.progress.maxHealth;
    this.progress.equipmentBonuses = bonuses;
    if (typeof this.progress.applyAllStats === "function") this.progress.applyAllStats();
    else if (typeof this.progress.recalc === "function") this.progress.recalc();
    if (this.progress.maxHealth > prev) {
      this.progress.currentHealth = Math.min(
        this.progress.maxHealth,
        this.progress.currentHealth + (this.progress.maxHealth - prev)
      );
    }
    return bonuses;
  };

  Inventory.prototype.useItem = function (itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def || def.type !== "consumable") return false;
    if (!this.hasItem(itemId)) return false;
    this.removeItem(itemId, 1);
    this.applyEffect(def.effect || {});
    this.save();
    return true;
  };

  Inventory.prototype.applyEffect = function (effect) {
    if (!this.progress || !effect) return;
    if (effect.heal) {
      this.progress.currentHealth = Math.min(
        this.progress.maxHealth,
        this.progress.currentHealth + effect.heal
      );
    }
    if (effect.attackBoost && effect.duration) {
      this.activeBuffs.push({
        type: "attack",
        value: effect.attackBoost,
        expires: Date.now() + effect.duration,
      });
      this.recalculateEquipmentStats();
    }
  };

  Inventory.prototype.updateBuffs = function () {
    const now = Date.now();
    const before = this.activeBuffs.length;
    this.activeBuffs = this.activeBuffs.filter((b) => b.expires > now);
    if (this.activeBuffs.length !== before) this.recalculateEquipmentStats();
  };

  Inventory.prototype.getActiveAttackBonus = function () {
    return this.activeBuffs
      .filter((b) => b.type === "attack")
      .reduce((sum, b) => sum + b.value, 0);
  };

  Inventory.prototype.getDisplayList = function () {
    return Object.keys(this.items).map((id) => {
      const def = ITEM_DEFINITIONS[id] || { name: id, type: "unknown", description: "" };
      return {
        id,
        name: def.name,
        quantity: this.items[id],
        type: def.type,
        description: def.description,
      };
    });
  };

  Inventory.prototype.toJSON = function () {
    return {
      items: this.items,
      equipment: {
        weapon: this.equipment.weapon || null,
        armor: this.equipment.armor || null,
        accessory: this.equipment.accessory || null,
      },
    };
  };

  Inventory.prototype.load = function (data) {
    data = data || {};
    this.items = data.items && typeof data.items === "object" ? data.items : {};
    this.equipment = Object.assign(emptyGear(), data.equipment || {});
    this.activeBuffs = [];
    this.recalculateEquipmentStats();
    return this;
  };

  Inventory.prototype.save = function () {
    try {
      let s = {};
      try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") || {}; } catch (err) { s = {}; }
      s.inventory = this.toJSON();
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch (err) { /* quota */ }
    return this;
  };

  R.ITEMS = ITEM_DEFINITIONS;
  R.Inventory = Inventory;
})();
