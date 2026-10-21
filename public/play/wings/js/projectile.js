/**
 * Player tracers and enemy cannon shells.
 * Friendly shots die on the first target. The heavy cannon is not a projectile;
 * Player applies it as a beam in player.js.
 */
(function (WOW) {
  function Projectile(x, y, vx, vy, opts) {
    opts = opts || {};
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = opts.r || 3;
    this.dmg = opts.dmg || 1;
    this.friendly = !!opts.friendly;
    this.alive = true;
    this.grazed = false;
    this.life = opts.life || 2.4;
    this.rocket = !!opts.rocket;
    this.splash = opts.splash || 0;
  }

  Projectile.prototype.update = function (dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
    if (this.y < -30 || this.y > WOW.H + 30 || this.x < -30 || this.x > WOW.W + 30) {
      this.alive = false;
    }
  };

  Projectile.prototype.draw = function (ctx) {
    const ang = Math.atan2(this.vx, this.vy);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(ang);
    if (this.rocket) {
      ctx.fillStyle = 'rgba(255, 110, 40, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 3.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4f0e6';
      ctx.fillRect(-2.4, -8, 4.8, 16);
      ctx.fillStyle = '#c4522a';
      ctx.fillRect(-2.4, 2, 4.8, 5);
      ctx.fillStyle = '#f0d090';
      ctx.beginPath();
      ctx.moveTo(-2.6, -8);
      ctx.lineTo(0, -15);
      ctx.lineTo(2.6, -8);
      ctx.fill();
    } else if (this.friendly) {
      ctx.fillStyle = 'rgba(255, 220, 140, 0.35)';
      ctx.fillRect(-2.5, -12, 5, 16);
      ctx.fillStyle = '#fff6d2';
      ctx.fillRect(-1.2, -10, 2.4, 12);
    } else {
      ctx.fillStyle = 'rgba(255, 70, 40, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd0b2';
      ctx.beginPath();
      ctx.arc(0, 0, this.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  WOW.Projectile = Projectile;
})(window.WOW = window.WOW || {});
