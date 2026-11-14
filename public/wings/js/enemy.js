/**
 * Enemy fighters, flak, dive attacks, bombers, and the two sortie bosses.
 * Patterns write vx/vy. The sprite stays nose-up on disk and is rotated here.
 */
(function (WOW) {
  function Enemy(type, x, y, opts) {
    const spec = WOW.ENEMIES[type];
    this.type = type;
    this.sprite = spec.sprite;
    this.w = spec.w;
    this.hp = spec.hp;
    this.maxHp = spec.hp;
    this.r = spec.r;
    this.score = spec.score;
    this.drop = spec.drop;
    this.pattern = spec.pattern;
    this.shot = spec.shot || '';
    this.shootEvery = spec.shoot;
    this.name = spec.name || '';
    this.boss = type === 'boss' || type === 'boss2' || type === 'ace';
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = spec.vy;
    this.t = 0;
    this.cool = 0.45 + Math.random() * 0.4;
    this.alive = true;
    this.seed = Math.random() * Math.PI * 2;
    this.flash = 0;
    this.forceDrop = false;
    this.diving = 0;
    this.diveT = 0;
    this.diveX = x;
    this.diveCd = 5;
    this.addT = 6;
    this.homeY = 132;
    if (opts) {
      if (opts.vx != null) this.vx = opts.vx;
      if (opts.vy != null) this.vy = opts.vy;
      if (opts.forceDrop) this.forceDrop = true;
    }
  }

  Enemy.prototype.update = function (dt, game) {
    if (!this.alive) return;
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 4);
    this.runPattern(dt, game);
    /* The boss moves itself inside the pattern so a dive can be a lerp. */
    if (!this.boss) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.pattern !== 'sweep' && this.pattern !== 'gun') {
        this.x = WOW.clamp(this.x, 28, WOW.W - 28);
      }
    }

    if (!this.boss && this.y > WOW.H + 90) this.alive = false;
    if (!this.boss && this.shootEvery > 0 && this.y > 30 && this.y < WOW.H - 80) {
      this.cool -= dt;
      if (this.cool <= 0) {
        this.cool = this.shootEvery * (0.85 + Math.random() * 0.35);
        this.fire(game);
      }
    }
  };

  Enemy.prototype.runPattern = function (dt, game) {
    const W = WOW.W;
    if (this.pattern === 'straight') {
      this.vx = Math.sin(this.t * 1.5 + this.seed) * 26;
    } else if (this.pattern === 'sweep') {
      const margin = 64;
      if (this.x < margin) this.vx = Math.abs(this.vx) || 150;
      else if (this.x > W - margin) this.vx = -Math.abs(this.vx) || -150;
      else {
        this.vx *= Math.pow(0.35, dt);
        this.vx += Math.sin(this.t * 2 + this.seed) * 16;
        this.vy = Math.min(160, this.vy + 55 * dt);
      }
    } else if (this.pattern === 'dive') {
      if (this.t < 0.8) {
        this.vx = WOW.clamp((game.player.x - this.x) * 1.5, -220, 220);
        this.vy = 55;
      } else {
        this.vy = Math.min(360, this.vy + 320 * dt);
        this.vx *= Math.pow(0.15, dt);
      }
    } else if (this.pattern === 'weave') {
      this.vx = Math.sin(this.t * 2.1 + this.seed) * 130;
      if (this.t > 13) this.vy = 170;
      else if (this.y > WOW.H * 0.48) this.vy = -55;
      else if (this.y < 70) this.vy = 80;
      else this.vy = 36;
    } else if (this.pattern === 'cruise') {
      this.vx = Math.sin(this.t * 0.7 + this.seed) * 40;
      if (this.t > 15) this.vy = 90;
      else this.vy = this.y > WOW.H * 0.4 ? 32 : 50;
    } else if (this.pattern === 'gun') {
      this.vx = 0;
      this.vy = 42;
    } else if (this.pattern === 'boss' || this.pattern === 'boss2') {
      this.runBoss(dt, game);
    } else if (this.pattern === 'ace') {
      this.runAce(dt, game);
    }
  };

  Enemy.prototype.runBoss = function (dt, game) {
    const phase = this.hp / this.maxHp > 0.68 ? 1 : this.hp / this.maxHp > 0.36 ? 2 : 3;
    this.phase = phase;
    if (this.diving === 1) {
      this.diveT -= dt;
      this.flash = 1;
      this.vx = 0;
      this.vy = 0;
      if (this.diveT <= 0) {
        this.diving = 2;
        this.diveT = 0.72;
      }
      return;
    }
    if (this.diving === 2) {
      this.diveT -= dt;
      this.x += (this.diveX - this.x) * Math.min(1, dt * 7);
      const destY = this.pattern === 'boss2' ? 250 : 470;
      this.y += (destY - this.y) * Math.min(1, dt * 5.5);
      this.vx = 0;
      this.vy = 0;
      if (this.diveT <= 0) {
        this.diving = 3;
        this.diveT = 1;
      }
      return;
    }
    if (this.diving === 3) {
      this.diveT -= dt;
      this.y += (this.homeY - this.y) * Math.min(1, dt * 2.4);
      this.vy = 0;
      this.vx = 0;
      if (this.diveT <= 0) this.diving = 0;
      return;
    }

    const cliff = this.pattern === 'boss2';
    const sway = phase === 1 ? 110 : phase === 2 ? 145 : 165;
    const freq = phase === 1 ? 0.65 : phase === 2 ? 1 : 1.3;
    const tx = WOW.W / 2 + Math.sin(this.t * freq + this.seed) * sway;
    this.x += (tx - this.x) * Math.min(1, dt * 2);
    this.y += (this.homeY - this.y) * Math.min(1, dt * 1.5);
    this.vx = Math.cos(this.t * freq + this.seed) * 80;
    this.vy = 0;

    this.cool -= dt;
    if (this.cool <= 0 && game.enemyShots.length < 70) {
      if (cliff && phase === 1) {
        this.fan(game, 3, 0.85, 180);
        this.mine(game);
        this.cool = 1.35;
      } else if (cliff && phase === 2) {
        this.aimed(game, 3, 0.2, 230, 0.12);
        this.mine(game);
        this.cool = 0.9;
      } else if (cliff) {
        this.fan(game, 5, 1.2, 200);
        this.mine(game);
        this.cool = 0.62;
      } else if (phase === 1) {
        this.aimed(game, 3, 0.18, 220, 0.2);
        this.cool = 1.25;
      } else if (phase === 2) {
        if (Math.random() < 0.5) this.fan(game, 5, 1.05, 190);
        else this.aimed(game, 2, 0.12, 250, 0.12);
        this.cool = 0.82;
      } else {
        this.aimed(game, 3, 0.14, 270, 0.1);
        if (Math.random() < 0.45) this.fan(game, 6, 1.15, 200);
        this.cool = 0.58;
      }
    }

    if (phase >= 2) {
      this.addT -= dt;
      if (this.addT <= 0) {
        this.addT = cliff ? 7.5 : 8.5;
        if (cliff) {
          game.queueEnemy(new Enemy('fighter', WOW.W / 2 - 80, -30));
          game.queueEnemy(new Enemy('fighter', WOW.W / 2 + 80, -30));
        } else {
          game.queueEnemy(new Enemy('sweeper', -30, 90, { vx: 150, vy: 50 }));
          game.queueEnemy(new Enemy('sweeper', WOW.W + 30, 150, { vx: -150, vy: 50 }));
        }
      }
    }
    if (phase === 3) {
      this.diveCd -= dt;
      if (this.diveCd <= 0) {
        this.diveCd = 8;
        this.diving = 1;
        this.diveT = 0.55;
        this.diveX = game.player.x;
      }
    }
  };

  /* Fighter leader. Stays in the top of the lane and rakes the box. */
  Enemy.prototype.runAce = function (dt, game) {
    const phase = this.hp / this.maxHp > 0.5 ? 1 : 2;
    this.phase = phase;
    const sway = phase === 1 ? 100 : 150;
    const freq = phase === 1 ? 0.85 : 1.35;
    const tx = WOW.W / 2 + Math.sin(this.t * freq + this.seed) * sway;
    this.x += (tx - this.x) * Math.min(1, dt * 2.6);
    this.y += (118 - this.y) * Math.min(1, dt * 1.7);
    this.vx = Math.cos(this.t * freq + this.seed) * 100;
    this.vy = 0;
    this.cool -= dt;
    if (this.cool <= 0 && game.enemyShots.length < 74) {
      this.aimed(game, phase === 1 ? 3 : 4, 0.16, 255, 0.08);
      if (phase === 2) this.fan(game, 4, 0.95, 185);
      this.cool = phase === 1 ? 0.78 : 0.48;
    }
    if (phase === 2) {
      this.addT -= dt;
      if (this.addT <= 0) {
        this.addT = 6.5;
        game.queueEnemy(new Enemy('fighter', WOW.W / 2 - 70, -24));
        game.queueEnemy(new Enemy('fighter', WOW.W / 2 + 70, -24));
      }
    }
  };

  Enemy.prototype.fire = function (game) {
    if (game.enemyShots.length > 80) return;
    if (this.shot === 'down') {
      this.shell(game, this.x, this.y + 16, 0, 210);
    } else if (this.shot === 'across') {
      const dir = this.x < WOW.W / 2 ? 1 : -1;
      const aim = WOW.clamp((game.player.y - this.y) * 0.18, -50, 90);
      this.shell(game, this.x + dir * 10, this.y, dir * 250, aim);
    } else if (this.shot === 'aimed') {
      this.aimed(game, 2, 0.14, 240, 0.22);
    } else if (this.shot === 'fan') {
      this.fan(game, 3, 0.7, 200);
    }
  };

  Enemy.prototype.shell = function (game, x, y, vx, vy) {
    game.enemyShots.push(new WOW.Projectile(x, y, vx, vy, { r: 4, dmg: 1, life: 4 }));
  };

  Enemy.prototype.aimed = function (game, count, spread, speed, inaccuracy) {
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const base = Math.atan2(dx, dy);
    const mid = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      const a = base + (i - mid) * spread + (Math.random() - 0.5) * inaccuracy;
      this.shell(game, this.x, this.y + 10, Math.sin(a) * speed, Math.cos(a) * speed);
    }
  };

  Enemy.prototype.mine = function (game) {
    const vx = (Math.random() - 0.5) * 36;
    game.enemyShots.push(new WOW.Projectile(
      this.x + (Math.random() - 0.5) * 50,
      this.y + 24,
      vx,
      76,
      { r: 6.5, dmg: 1, life: 6 }
    ));
  };

  Enemy.prototype.fan = function (game, count, width, speed) {
    const mid = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      const a = (i - mid) * (width / Math.max(1, count - 1));
      this.shell(game, this.x, this.y + 18, Math.sin(a) * speed, Math.cos(a) * speed);
    }
  };

  /* Sprite nose is up. atan2(vx, -vy) turns that nose onto the velocity. */
  Enemy.prototype.heading = function () {
    if (this.boss || this.pattern === 'cruise') {
      return Math.PI + WOW.clamp(this.vx / 280, -0.3, 0.3);
    }
    const sp = Math.hypot(this.vx, this.vy);
    if (sp < 12) return Math.PI;
    return Math.atan2(this.vx, -this.vy);
  };

  Enemy.prototype.hurt = function (amount, game) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flash = 1;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      game.onKill(this);
    }
  };

  Enemy.prototype.drawGun = function (ctx) {
    const dir = this.x < WOW.W / 2 ? 1 : -1;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#6d5b3c';
    ctx.fillRect(-13, -8, 26, 16);
    ctx.strokeStyle = '#2a2418';
    ctx.lineWidth = 1;
    ctx.strokeRect(-13, -8, 26, 16);
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(dir > 0 ? 2 : -18, -2.5, 16, 5);
    ctx.fillStyle = '#3a3a36';
    ctx.fillRect(-4, -16, 8, 12);
    if (this.flash > 0.4) {
      ctx.fillStyle = 'rgba(255, 242, 192, 0.85)';
      ctx.fillRect(-10, -6, 20, 12);
    }
    ctx.restore();
  };

  Enemy.prototype.draw = function (ctx) {
    if (this.pattern === 'gun') {
      this.drawGun(ctx);
      return;
    }
    const rot = this.heading();
    WOW.shadow(ctx, this.x, this.y, this.r + 6);
    if (this.type === 'elite') {
      ctx.save();
      ctx.strokeStyle = 'rgba(230, 195, 92, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    if (this.flash > 0.4) ctx.filter = 'brightness(2.2)';
    WOW.blit(ctx, this.sprite, this.x, this.y, this.w, rot, 1);
    ctx.filter = 'none';
    ctx.restore();
  };

  WOW.Enemy = Enemy;
})(window.WOW = window.WOW || {});
