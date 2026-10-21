/**
 * Upgrade crates. They drift down under a parachute.
 * Pickup is overlap only — no magnet — with a generous radius.
 */
(function (WOW) {
  function PowerUp(x, y) {
    this.x = x;
    this.y = y;
    this.vy = 58;
    this.t = Math.random() * 2;
    this.r = 28;
    this.alive = true;
    this.life = 14;
  }

  PowerUp.prototype.update = function (dt) {
    this.t += dt;
    this.life -= dt;
    this.y += this.vy * dt;
    this.x += Math.sin(this.t * 1.6) * 18 * dt;
    if (this.life <= 0 || this.y > WOW.H + 40) this.alive = false;
  };

  PowerUp.prototype.draw = function (ctx) {
    const bob = Math.sin(this.t * 3) * 3;
    const pulse = 0.45 + Math.sin(this.t * 5) * 0.2;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#ffe08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y + 8, 18 + Math.sin(this.t * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    WOW.blit(ctx, 'crate', this.x, this.y + bob, 62, Math.sin(this.t * 1.4) * 0.06, 1);
  };

  WOW.PowerUp = PowerUp;
})(window.WOW = window.WOW || {});
