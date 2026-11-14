/**
 * Wave manager. The event list comes from the active sortie.
 * Saturation holds the next spawn so a slow sortie does not dump every wave.
 * Boss entry waits until the sky is almost clear.
 */
(function (WOW) {
  function WaveManager(level) {
    this.reset(level);
  }

  WaveManager.prototype.reset = function (level) {
    this.t = 0;
    this.index = 0;
    this.bossSpawned = false;
    this.holdBoss = 0;
    this.level = level || WOW.LEVEL;
    this.events = this.level.events;
  };

  WaveManager.prototype.update = function (dt, game) {
    if (game.mode !== 'playing') return;
    this.t += dt;
    while (this.index < this.events.length) {
      const ev = this.events[this.index];
      if (this.t < ev.t) break;
      if (ev.kind === 'boss') {
        if (game.livingCount() > 1 && this.holdBoss < 12) {
          this.holdBoss += dt;
          this.t = ev.t;
          break;
        }
      } else if (game.livingCount() > ((this.level && this.level.cap) || 10)) {
        this.t = ev.t;
        break;
      }
      this.spawn(ev, game);
      this.index += 1;
    }
  };

  WaveManager.prototype.spawn = function (ev, game) {
    const W = WOW.W;
    if (ev.kind === 'vform') {
      const cols = [-2.15, -1.05, 1.05, 2.15];
      for (let i = 0; i < cols.length; i++) {
        const e = new WOW.Enemy('fighter', W / 2 + cols[i] * 48, -36 - Math.abs(cols[i]) * 34);
        game.enemies.push(e);
      }
      const lead = new WOW.Enemy('fighter', W / 2 + 78, -28);
      if (ev.drop === 'lead') lead.forceDrop = true;
      game.enemies.push(lead);
      return;
    }
    if (ev.kind === 'line') {
      const n = ev.n || 4;
      for (let i = 0; i < n; i++) {
        const x = (W * (i + 1)) / (n + 1);
        if (Math.abs(x - W / 2) < 36) continue;
        game.enemies.push(new WOW.Enemy('fighter', x, -30 - (i % 2) * 24));
      }
      return;
    }
    if (ev.kind === 'side') {
      const left = ev.side !== 'right';
      const n = ev.n || 3;
      for (let i = 0; i < n; i++) {
        game.enemies.push(new WOW.Enemy(
          'sweeper',
          left ? -36 : W + 36,
          60 + i * 78,
          { vx: left ? 155 : -155, vy: 34 }
        ));
      }
      return;
    }
    if (ev.kind === 'divers') {
      const n = ev.n || 4;
      for (let i = 0; i < n; i++) {
        const x = 50 + ((i + 0.5) / n) * (W - 100);
        game.enemies.push(new WOW.Enemy('diver', x, -24 - i * 42));
      }
      return;
    }
    if (ev.kind === 'bomber') {
      const b = new WOW.Enemy('bomber', W / 2, -90);
      if (ev.drop) b.forceDrop = true;
      game.enemies.push(b);
      game.enemies.push(new WOW.Enemy('fighter', W / 2 - 70, -40));
      game.enemies.push(new WOW.Enemy('fighter', W / 2 + 70, -40));
      return;
    }
    if (ev.kind === 'elite') {
      const e = new WOW.Enemy('elite', W / 2, -40);
      if (ev.drop) e.forceDrop = true;
      game.enemies.push(e);
      return;
    }
    if (ev.kind === 'flak') {
      /* Cliffs are a view from above. Batteries sit on the downs, not in the sea. */
      const cliffs = game.level && game.level.scenery === 'cliffs';
      const left = new WOW.Enemy('gun', cliffs ? 36 : 54, -28);
      const right = new WOW.Enemy('gun', cliffs ? 62 : W - 54, -78);
      if (ev.drop) left.forceDrop = true;
      game.enemies.push(left);
      game.enemies.push(right);
      return;
    }
    if (ev.kind === 'pincer') {
      game.enemies.push(new WOW.Enemy('diver', 90, -24));
      game.enemies.push(new WOW.Enemy('diver', W - 90, -48));
      game.enemies.push(new WOW.Enemy('fighter', 130, -90));
      game.enemies.push(new WOW.Enemy('fighter', W - 130, -110));
      return;
    }
    if (ev.kind === 'dense') {
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 4; i++) {
          const x = 70 + i * 100 + (row ? 40 : 0);
          game.enemies.push(new WOW.Enemy('fighter', x, -30 - row * 48));
        }
      }
      game.enemies.push(new WOW.Enemy('sweeper', -36, 80, { vx: 160, vy: 40 }));
      game.enemies.push(new WOW.Enemy('sweeper', W + 36, 140, { vx: -160, vy: 40 }));
      return;
    }
    if (ev.kind === 'armor') {
      const n = ev.n || 3;
      for (let i = 0; i < n; i++) {
        const x = 80 + ((i + 0.5) / n) * (W - 160);
        game.ground.push(new WOW.Ground(x, -36 - i * 54));
      }
      return;
    }
    if (ev.kind === 'boss') {
      const level = this.level || WOW.LEVEL;
      this.bossSpawned = true;
      game.banner = { text: level.bossBanner || 'JU 88 INBOUND', t: 1.8 };
      const boss = new WOW.Enemy(level.bossType || 'boss', W / 2, -120);
      if (level.bossHp) {
        boss.hp = level.bossHp;
        boss.maxHp = level.bossHp;
      }
      game.enemies.push(boss);
      WOW.audio.warning();
    }
  };

  WOW.WaveManager = WaveManager;
})(window.WOW = window.WOW || {});
