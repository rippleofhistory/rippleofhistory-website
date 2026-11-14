/**
 * Wings of WW2 — six-sortie campaign. Dunkirk opens it.
 * Bismarck is the sideways sortie: Ark Royal, then the torpedo run.
 *
 * Extractable pieces, all on window.WOW:
 *   Player, Projectile, Enemy, PowerUp, WaveManager, Game, WEAPONS, LEVEL
 *
 * Host API, on window.WingsOfWW2:
 *   startLevel(save?), pause(), resume(), getScore(), getState(),
 *   onLevelComplete(fn), onGameOver(fn)
 *
 * save / getState fields that can carry into another stage:
 *   score, lives, weaponTier, bombs
 * Optional save.levelId starts that sortie. Omitted, startLevel begins Dunkirk.
 * getState also returns weaponName, laser, mode, levelId, levelName.
 *
 * The stage fires `wings:complete` and `wings:gameover` on window.
 */
(function (WOW) {
  function panel(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 16, 28, 0.8)';
    ctx.strokeStyle = 'rgba(230, 195, 92, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230, 195, 92, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 5, w - 10, h - 10, 6);
    ctx.stroke();
    ctx.restore();
  }

  function plate(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 12, 20, 0.82)';
    ctx.strokeStyle = 'rgba(230, 195, 92, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function lifeMark(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#e6c35c';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(6.5, 5);
    ctx.lineTo(0, 2.2);
    ctx.lineTo(-6.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 24, 8, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function Game(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new WOW.Input(canvas);
    this.fx = new WOW.Fx();
    this.onComplete = [];
    this.onOver = [];
    this.mode = 'title';
    this.side = null;
    this.decorT = 0;
    this.levelIndex = 0;
    this.level = WOW.LEVELS[0];
    this.best = 0;
    try { this.best = Number(localStorage.getItem('wow.best')) || 0; } catch (err) { /* private mode */ }
    this.resetWorld();
  }

  Game.prototype.resetWorld = function () {
    this.player = new WOW.Player();
    this.waves = new WOW.WaveManager(this.level);
    this.enemies = [];
    this.playerShots = [];
    this.enemyShots = [];
    this.powerups = [];
    this.spawnQ = [];
    this.ground = [];
    this.bursts = [];
    this.escorts = [];
    this.flakT = 1.1;
    this.score = 0;
    this.combo = 0;
    this.comboT = 0;
    this.time = 0;
    this.shake = 0;
    this.hitStop = 0;
    this.banner = null;
    this.deathT = 0;
    this.pendingVictory = 0;
    this.completeSent = false;
    this.overSent = false;
    this.fx.parts.length = 0;
    this.fx.floats.length = 0;
    this.fx.flash = 0;
    this.clouds = [];
    this.islands = [];
    this.foam = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * WOW.W,
        y: Math.random() * WOW.H,
        s: 130 + Math.random() * 100,
        a: 0.28 + Math.random() * 0.32,
        sp: 0.8 + Math.random() * 0.45,
      });
    }
    const scene = this.mode === 'title' ? 'sea' : (this.level && this.level.scenery);
    const islandN = scene === 'sea' ? 3 : 0;
    for (let i = 0; i < islandN; i++) {
      this.islands.push({
        x: 50 + Math.random() * (WOW.W - 100),
        y: Math.random() * WOW.H,
        s: 100 + Math.random() * 80,
        sp: 0.85 + Math.random() * 0.3,
      });
    }
    for (let i = 0; i < 56; i++) {
      this.foam.push({
        x: Math.random() * WOW.W,
        y: Math.random() * WOW.H,
        r: 0.8 + Math.random() * 2,
        a: 0.06 + Math.random() * 0.12,
        sp: 0.55 + Math.random() * 0.7,
      });
    }
  };

  Game.prototype.sortieIndex = function (save) {
    if (!save || !save.levelId) return 0;
    for (let i = 0; i < WOW.LEVELS.length; i++) {
      if (WOW.LEVELS[i].id === save.levelId) return i;
    }
    return 0;
  };

  /* Fresh sortie. save carries score, lives, weapon tier, and bombs. */
  Game.prototype.beginSortie = function (index, save) {
    this.levelIndex = WOW.clamp(index, 0, WOW.LEVELS.length - 1);
    this.level = WOW.LEVELS[this.levelIndex];
    WOW.LEVEL = this.level;
    this.mode = 'playing';
    this.resetWorld();
    if (save) {
      if (save.lives != null) this.player.lives = save.lives;
      if (save.weaponTier != null) this.player.tier = WOW.clamp(save.weaponTier, 0, WOW.WEAPONS.length - 1);
      if (save.bombs != null) this.player.bombs = save.bombs;
      if (save.score != null) this.score = save.score;
    }
    this.player.applyCraft(this.level.craft || 'spitfire');
    this.side = this.level.side ? new WOW.SideRun(this) : null;
    this.fitStage();
    this.mode = 'playing';
    this.banner = { text: this.level.name, t: 1.7 };
    WOW.audio.ensure();
  };

  /* Bismarck uses a wide stage. Every other sortie stays 480×720. */
  Game.prototype.fitStage = function () {
    const side = this.mode !== 'title' && this.level && this.level.side;
    const w = side ? 800 : 480;
    const h = side ? 450 : 720;
    if (this.canvas) this.canvas.classList.toggle('side', !!side);
    if (WOW.W === w && WOW.H === h && this.canvas && this.canvas.width === w * WOW.SCALE) return;
    WOW.W = w;
    WOW.H = h;
    if (!this.canvas) return;
    this.canvas.width = w * WOW.SCALE;
    this.canvas.height = h * WOW.SCALE;
    this.ctx = this.canvas.getContext('2d');
  };

  Game.prototype.startLevel = function (save) {
    this.beginSortie(this.sortieIndex(save), save);
  };

  Game.prototype.continueSortie = function () {
    if (this.levelIndex >= WOW.LEVELS.length - 1) {
      this.startLevel();
      return;
    }
    this.beginSortie(this.levelIndex + 1, {
      lives: this.player.lives,
      weaponTier: this.player.tier,
      bombs: this.player.bombs,
      score: this.score,
    });
  };

  Game.prototype.noteScore = function () {
    if (this.score <= this.best) return;
    this.best = this.score;
    try { localStorage.setItem('wow.best', String(this.best)); } catch (err) { /* private mode */ }
  };

  Game.prototype.pause = function () {
    if (this.mode === 'playing') this.mode = 'paused';
  };

  Game.prototype.resume = function () {
    if (this.mode === 'paused') this.mode = 'playing';
  };

  Game.prototype.getScore = function () {
    return this.score;
  };

  Game.prototype.getState = function () {
    const tier = this.player ? this.player.tier : 0;
    return {
      score: this.score,
      lives: this.player ? this.player.lives : 0,
      weaponTier: tier,
      weaponName: WOW.WEAPONS[tier].name,
      bombs: this.player ? this.player.bombs : 0,
      laser: this.player ? this.player.laser : 0,
      craft: this.player && this.player.craft ? this.player.craft.id : 'spitfire',
      mode: this.mode,
      levelId: this.level ? this.level.id : WOW.LEVELS[0].id,
      levelName: this.level ? this.level.name : WOW.LEVELS[0].name,
    };
  };

  Game.prototype.onLevelComplete = function (fn) { this.onComplete.push(fn); };
  Game.prototype.onGameOver = function (fn) { this.onOver.push(fn); };

  Game.prototype.emitOver = function () {
    if (this.overSent) return;
    this.overSent = true;
    this.noteScore();
    const state = this.getState();
    for (let i = 0; i < this.onOver.length; i++) this.onOver[i](state);
    window.dispatchEvent(new CustomEvent('wings:gameover', { detail: state }));
  };

  Game.prototype.finishLevel = function () {
    this.mode = 'victory';
    this.noteScore();
    if (this.completeSent) return;
    this.completeSent = true;
    const state = this.getState();
    for (let i = 0; i < this.onComplete.length; i++) this.onComplete[i](state);
    window.dispatchEvent(new CustomEvent('wings:complete', { detail: state }));
  };

  Game.prototype.livingCount = function () {
    let n = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].alive && !this.enemies[i].boss) n++;
    }
    return n;
  };

  Game.prototype.bossAlive = function () {
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].alive && this.enemies[i].boss) return true;
    }
    return false;
  };

  Game.prototype.bossRef = function () {
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].alive && this.enemies[i].boss) return this.enemies[i];
    }
    return null;
  };

  Game.prototype.queueEnemy = function (enemy) {
    this.spawnQ.push(enemy);
  };

  /* Crate pickup. Past rockets, a crate arms the timed heavy cannon and adds a bomb. */
  Game.prototype.grantUpgrade = function (x, y) {
    const p = this.player;
    if (p.tier < WOW.WEAPONS.length - 1) {
      p.tier += 1;
      this.banner = { text: WOW.WEAPONS[p.tier].name, t: 1.45 };
    } else {
      p.laser = Math.min(10, p.laser + WOW.LASER_TIME);
      p.bombs = Math.min(5, p.bombs + 1);
      this.banner = { text: 'HEAVY CANNON', t: 1.45 };
    }
    this.score += WOW.SCORE.crate;
    this.fx.explode(x, y, 'pickup');
    this.fx.float(x, y - 18, '+50', '#ffe08a');
    WOW.audio.pickup();
  };

  Game.prototype.onKill = function (enemy) {
    const big = enemy.boss || enemy.type === 'bomber';
    this.fx.explode(enemy.x, enemy.y, enemy.boss ? 'boss' : big ? 'big' : 'small');
    this.shake = Math.min(14, this.shake + (enemy.boss ? 11 : 3.5));
    this.hitStop = enemy.boss ? 0.1 : 0.028;
    WOW.audio.explode(!!enemy.boss || enemy.type === 'bomber');
    if (this.comboT > 0) this.combo += 1;
    else this.combo = 1;
    this.comboT = 1.25;
    const pts = enemy.score + (this.combo - 1) * 20;
    this.score += pts;
    this.fx.float(enemy.x, enemy.y - 12, String(pts), '#fff6d8');
    if (enemy.forceDrop || Math.random() < enemy.drop) {
      this.powerups.push(new WOW.PowerUp(enemy.x, enemy.y));
    }
    if (this.level && this.level.escort && this.player.escortLeft <= 0 && this.player.escort < 1) {
      this.player.escort = Math.min(1, this.player.escort + 0.08);
      if (this.player.escort >= 1 && !this.player.escortReady) {
        this.player.escortReady = true;
        this.banner = { text: 'ESCORT READY', t: 1.35 };
      }
    }
    if (enemy.boss) this.pendingVictory = 1.55;
  };

  Game.prototype.tickBanner = function (dt) {
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
  };

  Game.prototype.updateBackground = function (dt) {
    const drift = function (list, base) {
      for (let i = 0; i < list.length; i++) {
        const o = list[i];
        o.y += base * o.sp * dt;
        if (o.y > WOW.H + 90) {
          o.y = -90 - Math.random() * 40;
          o.x = 30 + Math.random() * (WOW.W - 60);
        }
      }
    };
    drift(this.foam, WOW.SCROLL.foam);
    drift(this.islands, WOW.SCROLL.island);
    drift(this.clouds, WOW.SCROLL.cloud);
  };

  Game.prototype.stepActors = function (dt) {
    for (let i = 0; i < this.enemies.length; i++) this.enemies[i].update(dt, this);
    for (let i = 0; i < this.playerShots.length; i++) this.playerShots[i].update(dt);
    for (let i = 0; i < this.enemyShots.length; i++) this.enemyShots[i].update(dt);
    for (let i = 0; i < this.powerups.length; i++) this.powerups[i].update(dt);
    for (let i = 0; i < this.ground.length; i++) this.ground[i].update(dt, this);
    this.collide();
    this.sweep();
    if (this.spawnQ.length) {
      for (let i = 0; i < this.spawnQ.length; i++) this.enemies.push(this.spawnQ[i]);
      this.spawnQ.length = 0;
    }
    this.fx.update(dt);
  };

  Game.prototype.blast = function (x, y, radius, dmg) {
    this.fx.explode(x, y, 'small');
    this.shake = Math.min(10, this.shake + 2.5);
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.alive) continue;
      const dist = Math.hypot(e.x - x, e.y - y);
      const limit = radius + e.r;
      if (dist >= limit) continue;
      const fall = 1 - dist / limit;
      e.hurt(Math.max(1, dmg * (0.4 + 0.6 * fall)), this);
    }
    for (let i = 0; i < this.ground.length; i++) {
      const tank = this.ground[i];
      if (!tank.alive) continue;
      const dist = Math.hypot(tank.x - x, tank.y - y);
      const limit = radius + tank.r;
      if (dist >= limit) continue;
      const fall = 1 - dist / limit;
      tank.hurt(Math.max(1, dmg * (0.4 + 0.6 * fall)), this);
    }
  };

  Game.prototype.collide = function () {
    const p = this.player;
    for (let s = 0; s < this.playerShots.length; s++) {
      const shot = this.playerShots[s];
      if (!shot.alive) continue;
      if (shot.rocket) {
        let struck = false;
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.alive && WOW.hit(shot.x, shot.y, shot.r, e.x, e.y, e.r)) {
            struck = true;
            break;
          }
        }
        if (!struck) {
          for (let g = 0; g < this.ground.length; g++) {
            const tank = this.ground[g];
            if (tank.alive && WOW.hit(shot.x, shot.y, shot.r, tank.x, tank.y, tank.r)) {
              struck = true;
              break;
            }
          }
        }
        if (struck) {
          shot.alive = false;
          this.blast(shot.x, shot.y, shot.splash || 36, shot.dmg);
        }
        continue;
      }
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (!e.alive) continue;
        if (WOW.hit(shot.x, shot.y, shot.r, e.x, e.y, e.r)) {
          shot.alive = false;
          e.hurt(shot.dmg, this);
          this.fx.burst(shot.x, shot.y, 'spark');
          break;
        }
      }
      if (!shot.alive) continue;
      for (let g = 0; g < this.ground.length; g++) {
        const tank = this.ground[g];
        if (!tank.alive) continue;
        if (WOW.hit(shot.x, shot.y, shot.r, tank.x, tank.y, tank.r)) {
          shot.alive = false;
          tank.hurt(shot.dmg, this);
          this.fx.burst(shot.x, shot.y, 'spark');
          break;
        }
      }
    }
    if (!p.alive) return;
    for (let s = 0; s < this.enemyShots.length; s++) {
      const shot = this.enemyShots[s];
      if (!shot.alive) continue;
      const dx = shot.x - p.x;
      const dy = shot.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < shot.r + (p.hitR || WOW.PLAYER.hitR)) {
        shot.alive = false;
        p.hit(this);
        return;
      }
      if (!shot.grazed && dist < 24) {
        shot.grazed = true;
        this.score += WOW.SCORE.graze;
        this.fx.burst(shot.x, shot.y, 'muzzle');
      }
    }
    if (!p.alive) return;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.alive) continue;
      if (WOW.hit(p.x, p.y, p.hitR || WOW.PLAYER.hitR, e.x, e.y, e.r * 0.72)) {
        p.hit(this);
        if (!e.boss) e.hurt(8, this);
        return;
      }
    }
    for (let i = 0; i < this.powerups.length; i++) {
      const c = this.powerups[i];
      if (!c.alive) continue;
      if (WOW.hit(p.x, p.y, 14, c.x, c.y, c.r)) {
        c.alive = false;
        this.grantUpgrade(c.x, c.y);
      }
    }
  };

  Game.prototype.sweep = function () {
    this.enemies = this.enemies.filter(function (e) { return e.alive; });
    this.playerShots = this.playerShots.filter(function (s) { return s.alive; });
    this.enemyShots = this.enemyShots.filter(function (s) { return s.alive; });
    this.powerups = this.powerups.filter(function (c) { return c.alive; });
    this.ground = this.ground.filter(function (g) { return g.alive; });
  };

  Game.prototype.respawn = function () {
    const p = this.player;
    p.alive = true;
    p.x = WOW.W / 2;
    p.y = WOW.H - 120;
    p.prevX = p.x;
    p.iFrames = 2.3;
    p.spawn = 0.28;
    p.laser = 0;
    this.enemyShots.length = 0;
    this.mode = 'playing';
  };

  Game.prototype.updateEscorts = function (dt) {
    const p = this.player;
    if (!p || p.escortLeft <= 0) return;
    p.escortLeft = Math.max(0, p.escortLeft - dt);
    for (let i = 0; i < this.escorts.length; i++) {
      const escort = this.escorts[i];
      const tx = p.x + escort.side * 86;
      const ty = p.y + 20;
      escort.x += (tx - escort.x) * Math.min(1, dt * 4.2);
      escort.y += (ty - escort.y) * Math.min(1, dt * 4.2);
      escort.cool -= dt;
      if (escort.cool <= 0) {
        escort.cool = 0.12;
        this.playerShots.push(new WOW.Projectile(
          escort.x, escort.y - 18, escort.side * 36, -WOW.SHOT_SPEED * 0.9,
          { friendly: true, dmg: 1, r: 3 }
        ));
      }
    }
    if (p.escortLeft <= 0) this.escorts.length = 0;
  };

  Game.prototype.spawnBurst = function () {
    const p = this.player;
    let x = 60;
    let y = 120;
    for (let n = 0; n < 6; n++) {
      x = 46 + Math.random() * (WOW.W - 92);
      y = 64 + Math.random() * (WOW.H * 0.58);
      if (!p || Math.hypot(x - p.x, y - p.y) > 78) break;
    }
    this.bursts.push({ x: x, y: y, t: 0.92, hit: false, r: 30 });
  };

  Game.prototype.updateFlak = function (dt) {
    if (!this.level || !this.level.flakEvery) return;
    this.flakT -= dt;
    if (this.flakT <= 0) {
      this.flakT = this.level.flakEvery * (0.72 + Math.random() * 0.55);
      this.spawnBurst();
    }
    const p = this.player;
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const burst = this.bursts[i];
      burst.t -= dt;
      if (!burst.hit && burst.t <= 0.34 && burst.t > 0.06 && p && p.alive) {
        if (WOW.hit(p.x, p.y, p.hitR || 8, burst.x, burst.y, burst.r * 0.72)) {
          burst.hit = true;
          p.hit(this);
        }
      }
      if (burst.t <= 0) this.bursts.splice(i, 1);
    }
  };

  Game.prototype.update = function (dt) {
    this.time += dt;
    this.updateBackground(dt);
    this.tickBanner(dt);
    this.comboT = Math.max(0, this.comboT - dt);
    if (this.comboT <= 0) this.combo = 0;
    this.shake = Math.max(0, this.shake - dt * 16);

    if (this.side && this.mode === 'playing') {
      this.side.update(dt);
      this.fx.update(dt);
      if (this.pendingVictory > 0) {
        this.pendingVictory -= dt;
        if (this.pendingVictory <= 0) this.finishLevel();
      }
      return;
    }

    if (this.mode === 'dying') {
      this.deathT -= dt;
      this.stepActors(dt);
      if (this.deathT <= 0) this.respawn();
      return;
    }

    this.player.update(dt, this);
    this.updateEscorts(dt);
    this.updateFlak(dt);
    this.waves.update(dt, this);
    this.stepActors(dt);
    if (this.pendingVictory > 0 && this.mode === 'playing') {
      this.pendingVictory -= dt;
      if (this.pendingVictory <= 0) this.finishLevel();
    }
  };

  Game.prototype.handleMeta = function () {
    const input = this.input;
    if (input.pressed('KeyM')) {
      WOW.audio.ensure();
      WOW.audio.toggle();
    }
    if (this.mode === 'title') {
      if (input.pressed('Enter') || input.pressed('Space') || input.pointer.edge) this.startLevel();
    } else if (this.mode === 'playing') {
      if (input.pressed('Escape') || input.pressed('KeyP')) this.pause();
      if (input.pressed('KeyF')) this.player.auto = !this.player.auto;
    } else if (this.mode === 'paused') {
      if (input.pressed('Escape') || input.pressed('KeyP') || input.pressed('Enter') || input.pointer.edge) {
        this.resume();
      }
    } else if (this.mode === 'gameover') {
      if (input.pressed('KeyR')) {
        this.mode = 'title';
        this.side = null;
        this.levelIndex = 0;
        this.level = WOW.LEVELS[0];
        WOW.LEVEL = this.level;
      } else if (input.pressed('Enter') || input.pointer.edge) {
        this.beginSortie(this.levelIndex);
      }
    } else if (this.mode === 'victory') {
      const last = this.levelIndex >= WOW.LEVELS.length - 1;
      if (input.pressed('KeyR')) this.beginSortie(this.levelIndex);
      else if (!last && (input.pressed('Enter') || input.pointer.edge)) this.continueSortie();
      else if (last && (input.pressed('Enter') || input.pointer.edge)) this.startLevel();
    }
  };

  Game.prototype.frame = function (dt) {
    this.fitStage();
    if (this.mode !== 'paused') this.decorT += dt;
    if (this.hitStop > 0 && (this.mode === 'playing' || this.mode === 'dying')) {
      this.hitStop -= dt;
    } else if (this.mode === 'playing' || this.mode === 'dying') {
      this.update(dt);
    } else if (this.mode !== 'paused') {
      this.updateBackground(dt);
      this.tickBanner(dt);
      this.fx.update(dt);
      this.shake = Math.max(0, this.shake - dt * 16);
    }
    this.draw();
    this.handleMeta();
    this.input.endFrame();
  };

  Game.prototype.draw = function () {
    const ctx = this.ctx;
    ctx.setTransform(WOW.SCALE, 0, 0, WOW.SCALE, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.clearRect(0, 0, WOW.W, WOW.H);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    if (this.side && this.mode !== 'title') {
      this.side.draw(ctx);
      this.fx.draw(ctx);
    } else {
      this.drawSea(ctx);
      if (this.mode !== 'title') {
        for (let i = 0; i < this.ground.length; i++) this.ground[i].draw(ctx);
        for (let i = 0; i < this.powerups.length; i++) this.powerups[i].draw(ctx);
        for (let i = 0; i < this.enemies.length; i++) this.enemies[i].draw(ctx);
        this.drawEscorts(ctx);
        if (this.player.alive) this.player.draw(ctx, this.input.focusHeld());
        this.drawBursts(ctx);
        for (let i = 0; i < this.enemyShots.length; i++) this.enemyShots[i].draw(ctx);
        for (let i = 0; i < this.playerShots.length; i++) this.playerShots[i].draw(ctx);
        this.fx.draw(ctx);
      }
    }
    ctx.restore();
    this.drawVignette(ctx);
    if (this.mode !== 'title') this.drawHUD(ctx);
    this.drawBanner(ctx);
    if (this.mode === 'title') this.drawTitle(ctx);
    else if (this.mode === 'paused') this.drawPause(ctx);
    else if (this.mode === 'gameover') this.drawEnd(ctx, 'SHOT DOWN', 'ENTER TO RETRY', 'R  BACK TO TITLE');
    else if (this.mode === 'victory') {
      const last = this.levelIndex >= WOW.LEVELS.length - 1;
      const title = last ? 'SORTIES COMPLETE' : this.level.clear;
      const hint = last ? 'ENTER TO FLY AGAIN' : this.level.nextHint;
      const sub = last ? '' : 'R  REPLAY THIS SORTIE';
      this.drawEnd(ctx, title, hint, sub);
    }
  };

  Game.prototype.drawSea = function (ctx) {
    const scene = this.mode !== 'title' && this.level ? this.level.scenery : 'sea';
    if (scene === 'forest') this.drawForest(ctx);
    else if (scene === 'reich') this.drawReich(ctx);
    else if (scene === 'dunkirk') this.drawDunkirk(ctx);
    else this.drawWater(ctx);
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      WOW.blit(ctx, 'cloud', c.x, c.y, c.s, 0, c.a);
    }
  };

  Game.prototype.drawWater = function (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, WOW.H);
    g.addColorStop(0, '#061624');
    g.addColorStop(0.38, '#0b4668');
    g.addColorStop(0.72, '#0a3a58');
    g.addColorStop(1, '#062433');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WOW.W, WOW.H);

    const off = (this.decorT * 28) % 52;
    ctx.lineWidth = 1.15;
    for (let i = 0; i < 16; i++) {
      const y = -16 + off + i * 48;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(186, 214, 228, 0.2)' : 'rgba(120, 168, 196, 0.16)';
      ctx.beginPath();
      for (let x = 0; x <= WOW.W; x += 16) {
        const wy = y + Math.sin(x * 0.04 + i * 1.3 + this.decorT * 1.4) * 2.6;
        if (x === 0) ctx.moveTo(0, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    for (let i = 0; i < this.foam.length; i++) {
      const f = this.foam[i];
      ctx.globalAlpha = f.a;
      ctx.fillStyle = '#d5ebf6';
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, f.r * 3.2, f.r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (this.level && this.level.scenery === 'cliffs' && this.mode !== 'title') this.drawCliffs(ctx);
    if (this.mode !== 'title') for (let i = 0; i < this.islands.length; i++) {
      const isl = this.islands[i];
      WOW.blit(ctx, 'island', isl.x, isl.y, isl.s, 0, 1);
    }
  };

  Game.prototype.drawForest = function (ctx) {
    const scroll = (this.decorT * 52) % 80;
    const ground = ctx.createLinearGradient(0, 0, 0, WOW.H);
    ground.addColorStop(0, '#10261c');
    ground.addColorStop(1, '#183628');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, WOW.W, WOW.H);
    for (let i = 0; i < 26; i++) {
      const y = ((i * 64 - scroll * 1.7) % (WOW.H + 100)) - 46;
      const x = 18 + ((i * 89) % (WOW.W - 36));
      ctx.fillStyle = 'rgba(6, 16, 10, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x + 5, y + 7, 36, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 3 === 0 ? '#1b4a32' : '#246044';
      ctx.beginPath();
      ctx.ellipse(x, y, 34, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(146, 186, 112, 0.38)';
      ctx.beginPath();
      ctx.ellipse(x - 8, y - 5, 14, 7, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2a261e';
    ctx.fillRect(WOW.W / 2 - 24, 0, 48, WOW.H);
    ctx.fillStyle = '#6a5e48';
    ctx.fillRect(WOW.W / 2 - 16, 0, 32, WOW.H);
    ctx.fillStyle = 'rgba(214, 196, 150, 0.7)';
    for (let y = -40 + (scroll % 64); y < WOW.H; y += 64) {
      ctx.fillRect(WOW.W / 2 - 1.5, y, 3, 14);
    }
    ctx.fillStyle = 'rgba(86, 110, 58, 0.45)';
    ctx.fillRect(WOW.W / 2 - 28, 0, 5, WOW.H);
    ctx.fillRect(WOW.W / 2 + 23, 0, 5, WOW.H);
  };

  Game.prototype.drawReich = function (ctx) {
    const scroll = (this.decorT * 46) % 96;
    const tones = ['#6d7c46', '#8d7348', '#56703e', '#7d6842'];
    const furrows = ['#5e6c3c', '#7a643c', '#4a6234', '#6c5a38'];
    ctx.fillStyle = '#243222';
    ctx.fillRect(0, 0, WOW.W, WOW.H);
    for (let row = -1; row < 10; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * 120 + 3;
        const y = row * 96 + scroll + 3;
        const idx = (row + col + 4) % tones.length;
        ctx.fillStyle = tones[idx];
        ctx.fillRect(x, y, 110, 84);
        ctx.fillStyle = furrows[idx];
        for (let f = 8; f < 76; f += 7) ctx.fillRect(x + 5, y + f, 100, 1.4);
        ctx.strokeStyle = 'rgba(22, 34, 18, 0.72)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, 107, 81);
      }
    }
    ctx.fillStyle = '#3e3a32';
    ctx.fillRect(WOW.W / 2 - 8, 0, 16, WOW.H);
    ctx.fillStyle = 'rgba(230, 214, 170, 0.45)';
    for (let y = (scroll % 46) - 16; y < WOW.H; y += 46) ctx.fillRect(WOW.W / 2 - 1, y, 2, 9);
  };

  Game.prototype.drawEscorts = function (ctx) {
    for (let i = 0; i < this.escorts.length; i++) {
      const escort = this.escorts[i];
      WOW.shadow(ctx, escort.x, escort.y, 16);
      WOW.blit(ctx, 'p47', escort.x, escort.y, 52, escort.side * 0.08, 1);
    }
  };

  Game.prototype.drawBursts = function (ctx) {
    for (let i = 0; i < this.bursts.length; i++) {
      const burst = this.bursts[i];
      if (burst.t > 0.34) {
        const k = (0.92 - burst.t) / 0.58;
        ctx.strokeStyle = 'rgba(230, 195, 92, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, 8 + k * burst.r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(28, 28, 28, 0.55)';
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(226, 120, 48, 0.55)';
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  /* Seven Sisters rhythm: headlands of turf, bays of chalk, sea to the right. */
  Game.prototype.cliffEdge = function (y, scroll) {
    return WOW.CLIFF_LIP
      + Math.sin((y + scroll) * 0.024) * 28
      + Math.sin(y * 0.07 + 1.2) * 10;
  };

  Game.prototype.drawCliffs = function (ctx) {
    const scroll = this.decorT * 52;
    const steps = 42;
    const trace = function (extra) {
      ctx.beginPath();
      ctx.moveTo(0, -40);
      for (let i = 0; i <= steps; i++) {
        const y = -40 + (i / steps) * (WOW.H + 80);
        ctx.lineTo(this.cliffEdge(y, scroll) + extra, y);
      }
      ctx.lineTo(0, WOW.H + 40);
      ctx.closePath();
    }.bind(this);

    trace(22);
    ctx.fillStyle = 'rgba(3, 12, 22, 0.42)';
    ctx.fill();

    trace(0);
    ctx.fillStyle = '#f7f4ec';
    ctx.fill();
    ctx.save();
    ctx.clip();
    const downs = ctx.createLinearGradient(0, 0, 90, 0);
    downs.addColorStop(0, '#2a6230');
    downs.addColorStop(1, '#3a7438');
    ctx.fillStyle = downs;
    ctx.fillRect(0, 0, 150, WOW.H);
    ctx.fillStyle = '#3f7c3c';
    for (let i = 0; i < 9; i++) {
      const y = ((i * 100 - scroll) % (WOW.H + 80)) - 30;
      ctx.beginPath();
      ctx.ellipse(26 + (i % 2) * 16, y, 30, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#6a9848';
    for (let i = 0; i < 5; i++) {
      const y = ((i * 160 + scroll * 0.35) % (WOW.H + 60)) - 20;
      ctx.beginPath();
      ctx.ellipse(18, y, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(92, 78, 62, 0.55)';
    for (let i = 0; i <= steps; i += 1) {
      const y = -40 + (i / steps) * (WOW.H + 80);
      const x = this.cliffEdge(y, scroll);
      ctx.fillRect(x - 16, y - 3, 16, 7);
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 252, 246, 0.85)';
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const y = -40 + (i / steps) * (WOW.H + 80);
      const x = this.cliffEdge(y, scroll);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(210, 230, 236, 0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const y = -40 + (i / steps) * (WOW.H + 80);
      const x = this.cliffEdge(y, scroll) + 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const lightY = ((scroll * 0.72) % (WOW.H + 90)) - 40;
    const lightX = WOW.CLIFF_LANE + 26;
    ctx.fillStyle = 'rgba(255, 220, 140, 0.18)';
    ctx.beginPath();
    ctx.arc(lightX, lightY - 22, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d7d2c6';
    ctx.fillRect(lightX - 8, lightY + 10, 16, 5);
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(lightX - 4, lightY - 18, 8, 28);
    ctx.fillStyle = '#9c2b22';
    ctx.fillRect(lightX - 4, lightY - 12, 8, 4);
    ctx.fillRect(lightX - 4, lightY - 2, 8, 4);
    ctx.fillRect(lightX - 4, lightY + 8, 8, 3);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(lightX - 6, lightY - 28, 12, 10);
    ctx.fillStyle = '#ffe9a0';
    ctx.fillRect(lightX - 3, lightY - 25, 6, 4);

    for (let i = 0; i < 3; i++) {
      const y = ((i * 250 + scroll * 0.55) % (WOW.H + 100)) - 50;
      const x = 214 + (i % 2) * 64;
      ctx.fillStyle = 'rgba(8, 20, 32, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x + 4, y + 3, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f7f3ea';
      ctx.beginPath();
      ctx.ellipse(x, y, 11, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4f7a38';
      ctx.beginPath();
      ctx.ellipse(x - 1, y - 11, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(220, 236, 242, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y + 16, 16, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  /* Dunkirk beach under the fighter: sand, queues, and the little ships. */
  Game.prototype.drawDunkirk = function (ctx) {
    const scroll = this.decorT * 50;
    const shoreX = function (y) {
      return 300 + Math.sin((y + scroll) * 0.018) * 14 + Math.sin(y * 0.05) * 5;
    };
    const troop = function (x, y) {
      const bob = Math.sin(this.decorT * 6 + y * 0.35) * 1.1;
      const px = x + bob;
      ctx.fillStyle = 'rgba(40, 28, 14, 0.28)';
      ctx.beginPath();
      ctx.ellipse(px, y + 5, 3.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3428';
      ctx.fillRect(px - 2.2, y + 1.4, 1.4, 3.6);
      ctx.fillRect(px + 0.8, y + 1.4, 1.4, 3.6);
      ctx.fillStyle = '#6b5c38';
      ctx.fillRect(px - 2.6, y - 3.2, 5.2, 5.2);
      ctx.fillStyle = '#8a7044';
      ctx.fillRect(px - 2.2, y - 2.6, 1.6, 3.4);
      ctx.fillStyle = '#3d4a2c';
      ctx.beginPath();
      ctx.arc(px, y - 5.1, 2.15, 0, Math.PI * 2);
      ctx.fill();
    }.bind(this);
    const boat = function (x, y) {
      ctx.fillStyle = 'rgba(220, 236, 242, 0.42)';
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 1, 18, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c282e';
      ctx.beginPath();
      ctx.moveTo(x - 16, y);
      ctx.lineTo(x - 8, y - 8);
      ctx.lineTo(x + 16, y - 7);
      ctx.lineTo(x + 22, y);
      ctx.lineTo(x + 16, y + 7);
      ctx.lineTo(x - 8, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a4a52';
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 7);
      ctx.lineTo(x + 14, y - 6);
      ctx.lineTo(x + 10, y - 1);
      ctx.lineTo(x - 6, y - 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c4a06a';
      ctx.fillRect(x - 1, y - 4, 8, 6);
      ctx.fillStyle = '#141a1e';
      ctx.fillRect(x + 2, y - 11, 2, 7);
    };

    const sea = ctx.createLinearGradient(0, 0, 0, WOW.H);
    sea.addColorStop(0, '#163848');
    sea.addColorStop(1, '#0c2230');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, WOW.W, WOW.H);
    ctx.strokeStyle = 'rgba(170, 206, 220, 0.16)';
    ctx.lineWidth = 1;
    const swell = (this.decorT * 22) % 36;
    for (let i = 0; i < 18; i++) {
      const y = -10 + swell + i * 42;
      ctx.beginPath();
      for (let x = 260; x <= WOW.W; x += 18) {
        const wy = y + Math.sin(x * 0.05 + i) * 2;
        if (x === 260) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(0, -30);
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const y = -30 + (i / steps) * (WOW.H + 60);
      ctx.lineTo(shoreX(y), y);
    }
    ctx.lineTo(0, WOW.H + 30);
    ctx.closePath();
    const sand = ctx.createLinearGradient(0, 0, 280, 0);
    sand.addColorStop(0, '#c9b07a');
    sand.addColorStop(0.55, '#e4d2a4');
    sand.addColorStop(1, '#d2b888');
    ctx.fillStyle = sand;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#edd9a8';
    for (let i = 0; i < 7; i++) {
      const y = ((i * 120 - scroll) % (WOW.H + 80)) - 20;
      ctx.beginPath();
      ctx.ellipse(120 + (i % 3) * 40, y, 34, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(120, 96, 58, 0.16)';
    for (let i = 0; i < 18; i++) {
      const y = ((i * 46 - scroll * 0.6) % (WOW.H + 40)) - 10;
      ctx.beginPath();
      ctx.ellipse(70 + (i * 37) % 160, y, 2.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = '#b89a68';
    ctx.lineWidth = 14;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const y = -30 + (i / steps) * (WOW.H + 60);
      const x = shoreX(y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(236, 242, 236, 0.82)';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < 16; i++) {
      const y = ((i * 48 - scroll) % (WOW.H + 48)) - 24;
      const w = 20 + (i % 4) * 7;
      const h = 16 + (i % 3) * 6;
      const x = 8 + (i % 2) * 16;
      ctx.fillStyle = 'rgba(20, 14, 10, 0.28)';
      ctx.fillRect(x + 2, y + 3, w, h);
      ctx.fillStyle = i % 5 === 0 ? '#6a4e40' : '#7a7162';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = i % 2 === 0 ? '#8d4a3a' : '#4e463c';
      ctx.beginPath();
      ctx.moveTo(x - 1, y);
      ctx.lineTo(x + w / 2, y - 6);
      ctx.lineTo(x + w + 1, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(214, 196, 150, 0.55)';
      ctx.fillRect(x + 3, y + 5, 3, 4);
    }

    const gap = 108;
    const row0 = (scroll % gap) - 20;
    for (let row = -1; row < 9; row++) {
      const y = row0 + row * gap;
      const end = shoreX(y) - 18;
      for (let x = 108; x < end; x += 20) {
        troop(x, y - 6);
        troop(x + 8, y + 6);
      }
      boat(shoreX(y) + 22, y);
      troop(shoreX(y) - 6, y + 2);
    }

    const moleY = (scroll % 680) - 60;
    if (moleY > -30 && moleY < WOW.H + 30) {
      const mx = shoreX(moleY);
      ctx.fillStyle = '#4a4034';
      ctx.fillRect(mx - 6, moleY - 7, 128, 14);
      ctx.fillStyle = '#2a241c';
      ctx.fillRect(mx - 6, moleY - 7, 128, 2);
      for (let x = mx + 6; x < mx + 110; x += 16) troop(x, moleY - 1);
      boat(mx + 132, moleY);
    }

    const shipY = ((scroll * 0.8) % (WOW.H + 180)) - 70;
    ctx.fillStyle = 'rgba(200, 220, 230, 0.28)';
    ctx.beginPath();
    ctx.ellipse(400, shipY + 16, 28, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#243038';
    ctx.beginPath();
    ctx.moveTo(418, shipY - 28);
    ctx.lineTo(460, shipY - 6);
    ctx.lineTo(448, shipY + 28);
    ctx.lineTo(408, shipY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3c4c56';
    ctx.fillRect(424, shipY - 16, 18, 10);
    ctx.fillStyle = '#141c20';
    ctx.fillRect(430, shipY - 28, 5, 14);
    ctx.fillStyle = '#9c2b22';
    ctx.fillRect(426, shipY - 8, 8, 3);

    for (let i = 0; i < 4; i++) {
      const y = ((i * 180 - scroll) % (WOW.H + 80)) - 20;
      const x = 24 + (i % 2) * 18;
      ctx.fillStyle = 'rgba(72, 70, 66, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x + 4, y - 26, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(90, 88, 82, 0.28)';
      ctx.beginPath();
      ctx.ellipse(x + 10, y - 46, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < this.foam.length; i++) {
      const f = this.foam[i];
      if (f.x < shoreX(f.y) + 6) continue;
      ctx.globalAlpha = f.a;
      ctx.fillStyle = '#e7f3f8';
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, f.r * 3.2, f.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  Game.prototype.drawVignette = function (ctx) {
    const g = ctx.createRadialGradient(WOW.W / 2, WOW.H / 2, WOW.H * 0.25, WOW.W / 2, WOW.H / 2, WOW.H * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WOW.W, WOW.H);
  };

  Game.prototype.drawHUD = function (ctx) {
    plate(ctx, 10, 8, 138, 42);
    ctx.textAlign = 'left';
    ctx.font = '700 11px "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = 'rgba(243,234,210,0.78)';
    ctx.fillText('SCORE', 18, 22);
    ctx.font = '700 22px "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#e6c35c';
    ctx.fillText(String(this.score).padStart(6, '0'), 18, 44);
    if (this.combo >= 2) {
      ctx.font = '700 13px "Segoe UI", Tahoma, sans-serif';
      ctx.fillStyle = '#fff6d8';
      ctx.fillText('CHAIN x' + Math.min(8, this.combo), 16, 64);
    }

    const lives = this.player.lives;
    for (let i = 0; i < lives; i++) lifeMark(ctx, WOW.W - 22 - i * 18, 28);

    const boss = this.bossRef();
    if (boss) {
      const bw = 230;
      const bh = 8;
      const x = (WOW.W - bw) / 2;
      const y = 62;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = '#e25b3a';
      ctx.fillRect(x, y, bw * Math.max(0, boss.hp / boss.maxHp), bh);
      ctx.strokeStyle = '#e6c35c';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
      ctx.font = '700 11px "Segoe UI", Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f3ead2';
      ctx.fillText(boss.name || 'JU 88', WOW.W / 2, y + 22);
    }

    plate(ctx, 10, WOW.H - 34, 92, 24);
    ctx.textAlign = 'left';
    ctx.font = '700 13px "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#f3ead2';
    ctx.fillText('BOMB  ' + this.player.bombs, 18, WOW.H - 17);
    if (this.level && this.level.escort) {
      const charging = this.player.escortLeft > 0;
      const ready = this.player.escort >= 1 && !charging;
      const fill = charging ? this.player.escortLeft / WOW.ESCORT_TIME : this.player.escort;
      ctx.font = '700 11px "Segoe UI", Tahoma, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = ready ? '#b7e39a' : 'rgba(243,234,210,0.75)';
      ctx.fillText(ready ? 'E  ESCORT' : 'ESCORT', 16, WOW.H - 46);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(78, WOW.H - 54, 92, 6);
      ctx.fillStyle = ready || charging ? '#9fd48a' : '#e6c35c';
      ctx.fillRect(78, WOW.H - 54, 92 * WOW.clamp(fill, 0, 1), 6);
    }
    if (this.level) {
      ctx.font = '700 10px "Segoe UI", Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(243,234,210,0.55)';
      ctx.textAlign = 'right';
      ctx.fillText(this.level.short + '  ' + (this.levelIndex + 1) + '/' + WOW.LEVELS.length, WOW.W - 16, 48);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#e6c35c';
    if (this.side) {
      plate(ctx, WOW.W - 248, WOW.H - 34, 236, 24);
      ctx.font = '700 13px "Segoe UI", Tahoma, sans-serif';
      ctx.fillText(this.side.hint(), WOW.W - 18, WOW.H - 17);
    } else {
      plate(ctx, WOW.W - 156, WOW.H - 40, 144, 30);
      const name = WOW.WEAPONS[this.player.tier].name;
      ctx.fillText(name, WOW.W - 16, WOW.H - 18);
      for (let i = 0; i < WOW.WEAPONS.length; i++) {
        ctx.fillStyle = i <= this.player.tier ? '#e6c35c' : 'rgba(243,234,210,0.25)';
        ctx.fillRect(WOW.W - 16 - (WOW.WEAPONS.length - i) * 12, WOW.H - 32, 8, 4);
      }
      if (this.player.laser > 0) {
        const w = 70 * (this.player.laser / 10);
        ctx.fillStyle = '#fff6d0';
        ctx.fillRect(WOW.W - 16 - 70, WOW.H - 40, w, 3);
      }
      if (!this.player.auto) {
        ctx.font = '700 11px "Segoe UI", Tahoma, sans-serif';
        ctx.fillStyle = 'rgba(243,234,210,0.75)';
        ctx.fillText('MANUAL', WOW.W - 16, WOW.H - 48);
      }
    }
    if (WOW.audio.muted) {
      ctx.textAlign = 'center';
      ctx.font = '700 11px "Segoe UI", Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(243,234,210,0.7)';
      ctx.fillText('MUTED', WOW.W / 2, WOW.H - 18);
    }
  };

  Game.prototype.drawBanner = function (ctx) {
    if (!this.banner || this.mode === 'title') return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.banner.t * 2);
    ctx.textAlign = 'center';
    ctx.font = '700 26px Georgia, "Palatino Linotype", serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#e6c35c';
    ctx.fillText(this.banner.text, WOW.W / 2, WOW.H * 0.38);
    ctx.restore();
  };

  Game.prototype.drawTitle = function (ctx) {
    ctx.fillStyle = 'rgba(4, 10, 18, 0.28)';
    ctx.fillRect(0, 0, WOW.W, WOW.H);
    const bob = Math.sin(this.decorT * 1.5) * 7;
    WOW.shadow(ctx, WOW.W / 2, 430 + bob, 40);
    WOW.blit(ctx, 'player', WOW.W / 2, 408 + bob, 168, Math.sin(this.decorT * 0.8) * 0.05, 1);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(230, 195, 92, 0.8)';
    ctx.font = '12px Georgia, "Palatino Linotype", serif';
    ctx.fillText('RIPPLE OF HISTORY PRESENTS', WOW.W / 2, 118);
    ctx.fillStyle = '#f3ead2';
    ctx.font = '700 34px Georgia, "Palatino Linotype", serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 12;
    ctx.fillText('WINGS OF WW2', WOW.W / 2, 162);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(230, 195, 92, 0.85)';
    ctx.beginPath();
    ctx.moveTo(WOW.W / 2 - 70, 178);
    ctx.lineTo(WOW.W / 2 + 70, 178);
    ctx.stroke();
    ctx.fillStyle = '#e6c35c';
    ctx.font = '16px Georgia, "Palatino Linotype", serif';
    ctx.fillText('DUNKIRK', WOW.W / 2, 204);
    ctx.fillStyle = 'rgba(243,234,210,0.8)';
    ctx.font = '14px Georgia, "Palatino Linotype", serif';
    ctx.fillText('CLIFFS · BISMARCK · SCHWEINFURT · BULGE · GERMANY', WOW.W / 2, 228);

    ctx.fillStyle = 'rgba(243,234,210,0.88)';
    ctx.font = '13px "Segoe UI", Tahoma, sans-serif';
    const lines = [
      'ARROWS / WASD   MOVE',
      'SHIFT  FOCUS    X  BOMB    E  ESCORT',
      'SPACE / CLICK   SHOOT',
      'F  AUTOFIRE     M  MUTE     ESC  PAUSE',
    ];
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], WOW.W / 2, 520 + i * 22);

    if (this.best > 0) {
      ctx.fillStyle = 'rgba(230, 195, 92, 0.85)';
      ctx.font = '13px "Segoe UI", Tahoma, sans-serif';
      ctx.fillText('BEST  ' + String(this.best).padStart(6, '0'), WOW.W / 2, 618);
    }

    if (Math.floor(this.decorT * 2) % 2 === 0) {
      ctx.fillStyle = '#e6c35c';
      ctx.font = '700 16px Georgia, "Palatino Linotype", serif';
      ctx.fillText('PRESS ENTER', WOW.W / 2, 650);
    }
  };

  Game.prototype.drawPause = function (ctx) {
    const landscape = WOW.H < 520;
    const y = landscape ? (WOW.H - 150) / 2 : 280;
    panel(ctx, landscape ? (WOW.W - 260) / 2 : 110, y, 260, 150);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e6c35c';
    ctx.font = '700 28px Georgia, "Palatino Linotype", serif';
    ctx.fillText('PAUSED', WOW.W / 2, y + 60);
    ctx.fillStyle = '#f3ead2';
    ctx.font = '14px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('ENTER TO RESUME', WOW.W / 2, y + 104);
  };

  Game.prototype.drawEnd = function (ctx, title, hint, sub) {
    const landscape = WOW.H < 520;
    const y = landscape ? (WOW.H - 250) / 2 : 230;
    const gear = this.mode === 'victory' && this.side ? 'TORPEDOES' : WOW.WEAPONS[this.player.tier].name;
    panel(ctx, landscape ? (WOW.W - 340) / 2 : 70, y, 340, 250);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e6c35c';
    ctx.font = '700 28px Georgia, "Palatino Linotype", serif';
    ctx.fillText(title, WOW.W / 2, y + 56);
    ctx.fillStyle = '#f3ead2';
    ctx.font = '700 14px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('SCORE  ' + String(this.score).padStart(6, '0'), WOW.W / 2, y + 102);
    ctx.font = '14px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText(gear, WOW.W / 2, y + 130);
    ctx.fillStyle = 'rgba(230, 195, 92, 0.85)';
    ctx.font = '13px Georgia, "Palatino Linotype", serif';
    ctx.fillText('A RIPPLE OF HISTORY SORTIE', WOW.W / 2, y + 162);
    if (this.best > 0) {
      ctx.fillStyle = 'rgba(243,234,210,0.7)';
      ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
      ctx.fillText('BEST  ' + String(this.best).padStart(6, '0'), WOW.W / 2, y + 186);
    }
    if (Math.floor(this.decorT * 2) % 2 === 0) {
      ctx.fillStyle = '#e6c35c';
      ctx.font = '700 15px Georgia, "Palatino Linotype", serif';
      ctx.fillText(hint, WOW.W / 2, y + 214);
    }
    if (sub) {
      ctx.fillStyle = 'rgba(243,234,210,0.75)';
      ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
      ctx.fillText(sub, WOW.W / 2, y + 236);
    }
  };

  WOW.Game = Game;
})(window.WOW = window.WOW || {});
