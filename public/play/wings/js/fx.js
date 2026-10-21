/**
 * Explosions, muzzle sparks, floating score, and screen shake.
 * Particles are pooled by splicing dead ones. Cap keeps a dense wave cheap.
 */
(function (WOW) {
  function Fx() {
    this.parts = [];
    this.floats = [];
    this.flash = 0;
  }

  Fx.prototype.burst = function (x, y, kind) {
    const spec = {
      muzzle: { n: 4, life: 0.08, speed: 40, color: '#fff1c2', size: 2, type: 'spark' },
      spark: { n: 6, life: 0.22, speed: 90, color: '#ffd27a', size: 2, type: 'spark' },
      small: { n: 16, life: 0.4, speed: 160, color: '#ffb15a', size: 2.4, type: 'spark', smoke: 6 },
      big: { n: 28, life: 0.55, speed: 220, color: '#ff8a3a', size: 3, type: 'spark', smoke: 10, debris: 8 },
      boss: { n: 48, life: 0.7, speed: 280, color: '#ffd27a', size: 3.4, type: 'spark', smoke: 16, debris: 14 },
      player: { n: 30, life: 0.55, speed: 240, color: '#ffe08a', size: 3, type: 'spark', smoke: 10, debris: 8 },
      pickup: { n: 14, life: 0.4, speed: 120, color: '#ffe27a', size: 2.2, type: 'spark' },
    }[kind] || { n: 8, life: 0.3, speed: 100, color: '#ffb15a', size: 2, type: 'spark' };

    for (let i = 0; i < spec.n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spec.speed * (0.35 + Math.random());
      this.parts.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: spec.life * (0.6 + Math.random() * 0.6),
        max: spec.life,
        color: spec.color,
        size: spec.size * (0.7 + Math.random()),
        kind: 'spark',
      });
    }
    const smoke = spec.smoke || 0;
    for (let i = 0; i < smoke; i++) {
      this.parts.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 24,
        vy: -20 - Math.random() * 30,
        life: 0.7 + Math.random() * 0.4,
        max: 0.9,
        color: 'rgba(70,70,70,',
        size: 8 + Math.random() * 10,
        kind: 'smoke',
      });
    }
    const debris = spec.debris || 0;
    for (let i = 0; i < debris; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 160;
      this.parts.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: 0.6 + Math.random() * 0.4,
        max: 0.8,
        color: Math.random() < 0.5 ? '#6d7a55' : '#c4b08a',
        size: 2 + Math.random() * 3,
        kind: 'debris',
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 10,
      });
    }
    if (this.parts.length > 420) this.parts.splice(0, this.parts.length - 420);
  };

  Fx.prototype.explode = function (x, y, scale) {
    this.burst(x, y, scale || 'small');
  };

  Fx.prototype.float = function (x, y, text, color) {
    this.floats.push({ x: x, y: y, text: text, life: 0.7, color: color || '#fff6d8' });
  };

  Fx.prototype.bombFlash = function () {
    this.flash = 1;
  };

  Fx.prototype.update = function (dt) {
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'smoke') {
        p.vy -= 10 * dt;
        p.size += 18 * dt;
      } else if (p.kind === 'debris') {
        p.vy += 90 * dt;
        p.rot += p.spin * dt;
      }
    }
    this.parts = this.parts.filter(function (p) { return p.life > 0; });
    for (let i = 0; i < this.floats.length; i++) {
      const f = this.floats[i];
      f.life -= dt;
      f.y -= 36 * dt;
    }
    this.floats = this.floats.filter(function (f) { return f.life > 0; });
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6);
  };

  Fx.prototype.draw = function (ctx) {
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      if (p.kind === 'smoke') {
        ctx.fillStyle = 'rgba(210,210,210,' + (0.18 * a) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'debris') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.font = '700 13px "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < this.floats.length; i++) {
      const f = this.floats[i];
      ctx.globalAlpha = Math.max(0, f.life / 0.7);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(255,244,220,' + (this.flash * 0.65) + ')';
      ctx.fillRect(0, 0, WOW.W, WOW.H);
    }
  };

  WOW.Fx = Fx;
})(window.WOW = window.WOW || {});
