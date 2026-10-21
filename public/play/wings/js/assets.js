/**
 * Sprite loader. Painted plates are PNG with real alpha.
 * If a file is missing, a flat silhouette keeps the tester playable.
 * Nose of every aircraft file points up.
 */
(function (WOW) {
  WOW.images = {};
  WOW.assetsReady = false;

  WOW.FILES = {
    player: 'wings/assets/player.png',
    bf109: 'wings/assets/bf109.png',
    fw190: 'wings/assets/fw190.png',
    bomber: 'wings/assets/bomber.png',
    crate: 'wings/assets/crate.png',
    cloud: 'wings/assets/cloud.png',
    island: 'wings/assets/island.png',
    b17: 'wings/assets/b17.png',
    p47: 'wings/assets/p47.png',
    tank: 'wings/assets/tank.png',
  };

  WOW.loadAssets = function () {
    const names = Object.keys(WOW.FILES);
    return Promise.all(names.map(function (name) {
      return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () {
          WOW.images[name] = img;
          resolve();
        };
        img.onerror = function () {
          WOW.images[name] = null;
          resolve();
        };
        img.src = WOW.FILES[name];
      });
    })).then(function () {
      WOW.assetsReady = true;
    });
  };

  WOW.blit = function (ctx, name, x, y, w, rot, alpha) {
    const img = WOW.images[name];
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    if (img) {
      const h = w * (img.height / img.width);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      silhouette(ctx, name, w);
    }
    ctx.restore();
  };

  function silhouette(ctx, name, w) {
    const h = name === 'bomber' ? w * 0.72 : name === 'crate' ? w * 1.15 : w * 0.8;
    ctx.fillStyle = name === 'player' ? '#7f8f62' : name === 'crate' ? '#e0b23a' : '#5e6a48';
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (name === 'cloud') {
      ctx.ellipse(0, 0, w * 0.4, w * 0.22, 0, 0, Math.PI * 2);
    } else if (name === 'island') {
      ctx.ellipse(0, 0, w * 0.36, w * 0.24, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#cbb98a';
    } else if (name === 'crate') {
      ctx.rect(-w * 0.28, -h * 0.2, w * 0.56, h * 0.4);
    } else {
      ctx.moveTo(0, -h * 0.48);
      ctx.lineTo(w * 0.46, h * 0.05);
      ctx.lineTo(w * 0.12, h * 0.08);
      ctx.lineTo(w * 0.16, h * 0.42);
      ctx.lineTo(0, h * 0.28);
      ctx.lineTo(-w * 0.16, h * 0.42);
      ctx.lineTo(-w * 0.12, h * 0.08);
      ctx.lineTo(-w * 0.46, h * 0.05);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  WOW.shadow = function (ctx, x, y, rx) {
    ctx.save();
    ctx.translate(x + 3, y + rx * 0.55);
    ctx.scale(1, 0.38);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
})(window.WOW = window.WOW || {});
