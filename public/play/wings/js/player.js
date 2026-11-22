/**
 * Player fighter. Fixed near the bottom of the waterfall.
 * Weapon tier is permanent for the sortie. Rockets are the top of the ladder.
 * The heavy cannon is a timed beam granted by a crate collected past rockets.
 * Wing pods are the R-Type "options": they lag behind and fire on their own.
 */
(function (WOW) {
  function Player() {
    this.reset(true);
  }

  Player.prototype.reset = function (full) {
    this.x = WOW.W / 2;
    this.y = WOW.H - 110;
    this.prevX = this.x;
    this.vx = 0;
    this.vy = 0;
    this.bank = 0;
    this.engineT = 0;
    this.cool = 0;
    this.podCool = 0;
    this.rocketCool = 0;
    this.iFrames = 1.5;
    this.alive = true;
    this.auto = true;
    this.laser = 0;
    this.bombCd = 0;
    this.spawn = 0.35;
    this.pods = [
      { x: this.x - 46, y: this.y + 20 },
      { x: this.x + 46, y: this.y + 20 },
    ];
    this.applyCraft('spitfire');
    if (full) {
      this.lives = WOW.PLAYER.lives;
      this.bombs = WOW.PLAYER.bombs;
      this.tier = 0;
    }
  };

  Player.prototype.applyCraft = function (id) {
    const craft = WOW.CRAFT[id] || WOW.CRAFT.spitfire;
    this.craft = craft;
    this.speed = craft.speed;
    this.focusSpeed = craft.focus;
    this.hitR = craft.hitR;
    this.drawW = craft.drawW;
    this.minY = craft.minY;
    this.sprite = craft.sprite;
    this.escort = 0;
    this.escortLeft = 0;
    this.escortReady = false;
  };

  Player.prototype.update = function (dt, game) {
    if (!this.alive) return;
    if (this.spawn > 0) {
      this.spawn -= dt;
      const u = 1 - Math.max(this.spawn, 0) / 0.35;
      this.y = WOW.H - 36 - u * 74;
    }

    const input = game.input;
    const focus = input.focusHeld();
    const speed = focus ? (this.focusSpeed || WOW.PLAYER.focus) : (this.speed || WOW.PLAYER.speed);
    const axes = input.moveAxes();
    const mag = Math.hypot(axes.x, axes.y);
    this.engineT = (this.engineT || 0) + dt;
    this.vx = this.vx || 0;
    this.vy = this.vy || 0;
    if (this.spawn <= 0) {
      if (mag > 0) {
        const tx = (axes.x / mag) * speed;
        const ty = (axes.y / mag) * speed;
        const k = Math.min(1, dt * 6.2);
        this.vx += (tx - this.vx) * k;
        this.vy += (ty - this.vy) * k;
      } else {
        const drag = Math.max(0, 1 - dt * 5.4);
        this.vx *= drag;
        this.vy *= drag;
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    if (input.touchLiftPending) {
      if (this.spawn <= 0 && input.pointer.held && input.pointer.touch && input.touchOrigin) {
        const scale = input.playfieldPerCss();
        const cdx = (input.touchOrigin.x - this.x) / scale.x;
        const cdy = (input.touchOrigin.y - this.y) / scale.y;
        input.touchLift = (cdx * cdx + cdy * cdy) <= 100 * 100 ? 70 * scale.y : 0;
      }
      input.touchLiftPending = false;
    }
    if (this.spawn <= 0 && input.pointer.touch) {
      this.x += input.touchDx;
      this.y += input.touchDy;
      if (input.pointer.held && input.touchLift > 0) {
        const targetY = input.pointer.y - input.touchLift;
        this.y += (targetY - this.y) * Math.min(1, dt * 9);
      }
    } else if (input.pointer.held && this.spawn <= 0) {
      const k = Math.min(1, dt * (focus ? 8 : 14));
      this.x += (input.pointer.x - this.x) * k;
      this.y += (input.pointer.y - this.y) * k;
    }

    const edge = (this.craft && this.craft.edge) || 20;
    this.x = WOW.clamp(this.x, edge, WOW.W - edge);
    const minY = this.minY || WOW.PLAYER.minY;
    const tail = this.craft && this.craft.id === 'fortress' ? 100 : 72;
    this.y = WOW.clamp(this.y, minY, WOW.H - tail);
    this.x = WOW.clamp(this.x, 0, WOW.W);
    this.y = WOW.clamp(this.y, 0, WOW.H);

    const visVx = (this.x - this.prevX) / Math.max(dt, 0.001);
    this.prevX = this.x;
    const targetBank = WOW.clamp(visVx / 380, -0.58, 0.58);
    this.bank += (targetBank - this.bank) * Math.min(1, dt * 5.5);

    if (this.iFrames > 0) this.iFrames -= dt;
    if (this.bombCd > 0) this.bombCd -= dt;
    if (this.laser > 0) this.laser = Math.max(0, this.laser - dt);

    this.cool -= dt;
    if (this.rocketCool > 0) this.rocketCool -= dt;
    const shooting = this.auto || input.shootHeld();
    const isFort = this.craft && this.craft.id === 'fortress';
    const kind = WOW.WEAPONS[this.tier].kind;
    if (shooting && this.spawn <= 0) {
      if (!isFort && kind === 'rockets') {
        if (this.rocketCool <= 0) {
          this.fireRockets(game);
          this.rocketCool = WOW.WEAPONS[this.tier].rate;
        }
      } else if (this.cool <= 0) {
        this.fire(game);
        const pace = isFort ? 1.22 : 1;
        const rateTier = isFort ? Math.min(this.tier, 3) : this.tier;
        this.cool = WOW.WEAPONS[rateTier].rate * pace;
      }
      if (isFort && kind === 'rockets' && this.rocketCool <= 0) {
        this.fireRockets(game);
        this.rocketCool = 0.46;
      }
    }
    this.updatePods(dt, game);

    if (this.laser > 0) this.applyLaser(dt, game);
    if (game.level && game.level.escort) this.chargeEscort(dt, game);
    if (input.pressed('KeyE')) this.callEscort(game);
    if (input.bombPressed()) this.useBomb(game);
  };

  Player.prototype.chargeEscort = function (dt, game) {
    if (this.escortLeft > 0) return;
    if (this.escort >= 1) return;
    this.escort = Math.min(1, this.escort + dt / WOW.ESCORT_FILL);
    if (this.escort >= 1 && !this.escortReady) {
      this.escortReady = true;
      game.banner = { text: 'ESCORT READY', t: 1.35 };
    }
  };

  Player.prototype.callEscort = function (game) {
    if (!game.level || !game.level.escort) return;
    if (this.escort < 1 || this.escortLeft > 0 || !this.alive) return;
    this.escort = 0;
    this.escortReady = false;
    this.escortLeft = WOW.ESCORT_TIME;
    game.escorts = [
      { side: -1, x: this.x - 78, y: this.y + 24, cool: 0 },
      { side: 1, x: this.x + 78, y: this.y + 24, cool: 0 },
    ];
    game.banner = { text: 'LITTLE FRIENDS', t: 1.45 };
    WOW.audio.warning();
  };

  Player.prototype.fire = function (game) {
    if (this.craft && this.craft.id === 'fortress') {
      this.fireFortress(game);
      return;
    }
    const kind = WOW.WEAPONS[this.tier].kind;
    const y = this.y - 34;
    const s = WOW.SHOT_SPEED;
    if (kind === 'single') this.shot(game, this.x, y, 0, -s);
    if (kind === 'dual' || kind === 'pods') {
      this.shot(game, this.x - 12, y, 0, -s);
      this.shot(game, this.x + 12, y + 1, 0, -s);
    }
    if (kind === 'spread') {
      this.shot(game, this.x, y, 0, -s);
      this.shot(game, this.x, y, Math.sin(-0.22) * s, -Math.cos(0.22) * s);
      this.shot(game, this.x, y, Math.sin(0.22) * s, -Math.cos(0.22) * s);
    }
    game.fx.burst(this.x, y, 'muzzle');
    WOW.audio.shot();
  };

  /* Nose, waist, and tail guns. Tiers open more of the box. */
  Player.prototype.fireFortress = function (game) {
    const y = this.y - 52;
    const s = WOW.SHOT_SPEED * 0.82;
    const tier = this.tier;
    this.shot(game, this.x - 14, y, 0, -s);
    this.shot(game, this.x + 14, y, 0, -s);
    if (tier >= 1) {
      this.shot(game, this.x - 46, this.y - 8, -s * 0.32, -s * 0.82);
      this.shot(game, this.x + 46, this.y - 8, s * 0.32, -s * 0.82);
    }
    if (tier >= 2) {
      this.shot(game, this.x, this.y + 36, -70, s * 0.42);
      this.shot(game, this.x, this.y + 36, 70, s * 0.42);
    }
    if (tier >= 3) {
      this.shot(game, this.x, y, Math.sin(-0.16) * s, -Math.cos(0.16) * s);
      this.shot(game, this.x, y, Math.sin(0.16) * s, -Math.cos(0.16) * s);
    }
    game.fx.burst(this.x, y, 'muzzle');
    WOW.audio.shot();
  };

  Player.prototype.shot = function (game, x, y, vx, vy) {
    game.playerShots.push(new WOW.Projectile(x, y, vx, vy, {
      friendly: true, dmg: 1, r: 3.2,
    }));
  };

  /* Wing pair. Pods keep the machine-gun stream once that tier is owned. */
  Player.prototype.fireRockets = function (game) {
    const y = this.y - 28;
    const s = 430;
    this.rocket(game, this.x - 18, y, -28, -s);
    this.rocket(game, this.x + 18, y, 28, -s);
    WOW.audio.rocket();
  };

  Player.prototype.rocket = function (game, x, y, vx, vy) {
    game.playerShots.push(new WOW.Projectile(x, y, vx, vy, {
      friendly: true, dmg: 5, r: 6, rocket: true, splash: 40,
    }));
  };

  Player.prototype.updatePods = function (dt, game) {
    const targets = [
      { x: this.x - 48, y: this.y + 28 },
      { x: this.x + 48, y: this.y + 28 },
    ];
    for (let i = 0; i < 2; i++) {
      const p = this.pods[i];
      const k = Math.min(1, dt * 5.5);
      p.x += (targets[i].x - p.x) * k;
      p.y += (targets[i].y - p.y) * k;
    }
    if (this.tier < 3 || this.spawn > 0) return;
    if (this.craft && this.craft.id === 'fortress') return;
    this.podCool -= dt;
    if (this.podCool > 0) return;
    if (!(this.auto || game.input.shootHeld())) return;
    this.podCool = 0.15;
    this.shot(game, this.pods[0].x, this.pods[0].y - 12, -50, -600);
    this.shot(game, this.pods[1].x, this.pods[1].y - 12, 50, -600);
  };

  /* Beam damages anything overlapping the vertical lane from the nose to the top. */
  Player.prototype.applyLaser = function (dt, game) {
    const dmg = WOW.LASER_DPS * dt;
    const half = 12;
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      if (!e.alive) continue;
      if (e.y > this.y) continue;
      if (Math.abs(e.x - this.x) < e.r + half) e.hurt(dmg, game);
    }
    if (!game.ground) return;
    for (let i = 0; i < game.ground.length; i++) {
      const tank = game.ground[i];
      if (!tank.alive || tank.y > this.y) continue;
      if (Math.abs(tank.x - this.x) < tank.r + half) tank.hurt(dmg, game);
    }
  };

  Player.prototype.useBomb = function (game) {
    if (this.bombs <= 0 || this.bombCd > 0 || !this.alive) return;
    this.bombs -= 1;
    this.bombCd = 0.45;
    game.enemyShots.length = 0;
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      if (!e.alive) continue;
      e.hurt(e.boss ? 48 : e.hp, game);
    }
    if (game.ground) {
      for (let i = 0; i < game.ground.length; i++) {
        const tank = game.ground[i];
        if (!tank.alive) continue;
        const dx = tank.x - this.x;
        const dy = tank.y - this.y;
        if (dx * dx + dy * dy < 190 * 190) tank.hurt(tank.hp, game);
      }
    }
    game.fx.bombFlash();
    game.fx.explode(this.x, this.y, 'boss');
    WOW.audio.bomb();
  };

  Player.prototype.hit = function (game) {
    if (this.iFrames > 0 || !this.alive || this.spawn > 0) return;
    this.alive = false;
    this.lives -= 1;
    this.laser = 0;
    game.fx.explode(this.x, this.y, 'player');
    game.addShake(5);
    game.hitStop = 0.09;
    WOW.audio.hurt();
    if (this.lives <= 0) {
      game.mode = 'gameover';
      game.emitOver();
    } else {
      game.mode = 'dying';
      game.deathT = 0.9;
    }
  };

  Player.prototype.draw = function (ctx, showHit) {
    if (!this.alive) return;
    const blink = this.iFrames > 0 && Math.floor(performance.now() / 70) % 2 === 0;
    const alpha = blink ? 0.35 : 1;
    const sprite = this.sprite || 'player';
    const t = this.engineT || 0;
    const vibX = Math.sin(t * 68) * 0.55;
    const vibY = Math.cos(t * 91) * 0.4;
    const vibR = Math.sin(t * 74) * 0.016;
    const roll = this.bank + vibR;
    const dx = this.x + vibX;
    const dy = this.y + vibY;
    if (this.tier >= 3 && !(this.craft && this.craft.id === 'fortress')) {
      for (let i = 0; i < this.pods.length; i++) {
        const p = this.pods[i];
        WOW.blit(ctx, sprite, p.x + vibX * 0.4, p.y + vibY * 0.4, 40, roll * 0.4, alpha);
      }
    }
    const drawW = this.drawW || WOW.PLAYER.drawW;
    WOW.blit(ctx, sprite, dx, dy, drawW, roll, alpha);
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(roll);
    ctx.globalAlpha = 0.2 * alpha;
    ctx.fillStyle = '#d8d2b4';
    ctx.beginPath();
    ctx.ellipse(0, -drawW * 0.34, drawW * 0.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#fff8e4';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (showHit) {
      ctx.strokeStyle = 'rgba(255,248,228,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.hitR || WOW.PLAYER.hitR, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.laser > 0) {
      const flicker = 0.75 + Math.sin(performance.now() / 30) * 0.25;
      ctx.save();
      ctx.globalAlpha = 0.22 * flicker;
      ctx.fillStyle = '#fff4c8';
      ctx.fillRect(this.x - 16, 0, 32, this.y - 30);
      ctx.globalAlpha = 0.55 * flicker;
      ctx.fillStyle = '#ffe7a4';
      ctx.fillRect(this.x - 5, 0, 10, this.y - 30);
      ctx.globalAlpha = 0.95 * flicker;
      ctx.fillStyle = '#fffdf6';
      ctx.fillRect(this.x - 1.4, 0, 2.8, this.y - 30);
      ctx.restore();
    }
  };

  WOW.Player = Player;
})(window.WOW = window.WOW || {});
