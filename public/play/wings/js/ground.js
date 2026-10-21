/**
 * Tanks on the forest floor. They scroll with the sortie, shoot upward,
 * and pay extra points when strafed or bombed. They do not collide with
 * the fighter: they are below it.
 */
(function (WOW) {
  function Ground(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 18;
    this.maxHp = 18;
    this.r = 16;
    this.vy = 50;
    this.score = WOW.SCORE.tank;
    this.alive = true;
    this.cool = 0.6 + Math.random() * 0.8;
    this.flash = 0;
  }

  Ground.prototype.update = function (dt, game) {
    if (!this.alive) return;
    this.y += this.vy * dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 4);
    if (this.y > WOW.H + 50) {
      this.alive = false;
      return;
    }
    const player = game.player;
    if (!player.alive || this.y > player.y - 10 || this.y < 24) return;
    this.cool -= dt;
    if (this.cool > 0 || game.enemyShots.length > 70) return;
    this.cool = 2.15;
    const dx = player.x - this.x;
    game.enemyShots.push(new WOW.Projectile(
      this.x,
      this.y + 6,
      WOW.clamp(dx * 0.45, -80, 80),
      210,
      { r: 3.4, dmg: 1, life: 3.2 }
    ));
  };

  Ground.prototype.hurt = function (amount, game) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flash = 1;
    if (this.hp > 0) return;
    this.hp = 0;
    this.alive = false;
    game.score += this.score;
    game.fx.explode(this.x, this.y, 'big');
    game.fx.float(this.x, this.y - 12, String(this.score), '#ffe08a');
    game.shake = Math.min(12, game.shake + 4);
    WOW.audio.explode(false);
  };

  Ground.prototype.draw = function (ctx) {
    ctx.save();
    if (this.flash > 0.4) ctx.filter = 'brightness(2.1)';
    WOW.shadow(ctx, this.x, this.y + 4, 14);
    /* Plate nose points up. Half a turn aims the gun down the road. */
    WOW.blit(ctx, 'tank', this.x, this.y, 52, Math.PI, 1);
    ctx.filter = 'none';
    const bw = 28;
    const hp = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(this.x - bw / 2, this.y - 24, bw, 3);
    ctx.fillStyle = '#e6c35c';
    ctx.fillRect(this.x - bw / 2, this.y - 24, bw * hp, 3);
    ctx.restore();
  };

  WOW.Ground = Ground;
})(window.WOW = window.WOW || {});
