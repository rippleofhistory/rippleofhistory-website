/**
 * Bismarck, 26 May 1941. Side view, not the waterfall.
 * A Swordfish rolls off Ark Royal in a night storm, then drops torpedoes
 * on Bismarck during the lulls in the flak.
 */
(function (WOW) {
  var LAUNCH_PITCH = 0.08;

  function SideRun(game) {
    this.game = game;
    this.t = 0;
    this.phase = 'deck';
    this.phaseT = 0;
    this.seaY = 318;
    this.deckLen = 390;
    this.pivot = { x: 168, y: 292 };
    this.along = 28;
    this.speed = 0;
    this.pitch = 0;
    this.holdPitch = null;
    this.forceOpen = false;
    this.px = 0;
    this.py = 0;
    this.ax = 180;
    this.ay = 150;
    this.shipX = 560;
    this.hits = 0;
    this.need = 3;
    this.dropT = 0;
    this.torps = [];
    this.shells = [];
    this.shellT = 0.3;
    this.flash = 0;
    this.rain = [];
    for (var i = 0; i < 80; i++) {
      this.rain.push({
        x: Math.random() * 800,
        y: Math.random() * 450,
        v: 420 + Math.random() * 260,
      });
    }
    this.placeOnDeck();
  }

  SideRun.prototype.turnedAway = function () {
    if (window.__WOW_FORCE_TURN) return true;
    var touch = navigator.maxTouchPoints > 0;
    if (!touch) return false;
    return window.innerHeight > window.innerWidth + 30;
  };

  SideRun.prototype.deckPoint = function (along) {
    var c = Math.cos(this.pitch);
    var s = Math.sin(this.pitch);
    return {
      x: this.pivot.x + along * c,
      y: this.pivot.y - along * s,
    };
  };

  SideRun.prototype.placeOnDeck = function () {
    var p = this.deckPoint(this.along);
    this.px = p.x;
    this.py = p.y - 14;
    this.game.player.x = this.px;
    this.game.player.y = this.py;
  };

  SideRun.prototype.opening = function () {
    if (this.forceOpen) return true;
    return (this.t % 5) > 3.15;
  };

  /* Low, and the stern is a torpedo-run ahead. That is the drop. */
  SideRun.prototype.dropWindow = function () {
    if (this.phase !== 'attack') return false;
    if (!this.opening()) return false;
    var gap = this.shipX - this.ax;
    var low = this.ay > this.seaY - 58 && this.ay < this.seaY - 22;
    return gap > 120 && gap < 210 && low;
  };

  SideRun.prototype.hint = function () {
    if (this.phase === 'deck') {
      return this.pitch > LAUNCH_PITCH ? 'BOW UP — RIGHT TO LAUNCH' : 'BOW DOWN — WAIT';
    }
    if (this.phase === 'crash') return 'IN THE DRINK';
    if (this.dropWindow()) return 'SPACE — DROP';
    return 'SPACE  TORPEDO';
  };

  SideRun.prototype.resetDeck = function () {
    this.phase = 'deck';
    this.phaseT = 0;
    this.along = 28;
    this.speed = 0;
    this.torps.length = 0;
    this.shells.length = 0;
    this.placeOnDeck();
  };

  SideRun.prototype.crash = function () {
    if (this.phase === 'crash') return;
    var game = this.game;
    this.phase = 'crash';
    this.phaseT = 1.2;
    game.player.lives -= 1;
    game.fx.explode(this.px, this.py, 'player');
    game.shake = 10;
    WOW.audio.hurt();
    if (game.player.lives <= 0) {
      game.mode = 'gameover';
      game.emitOver();
    }
  };

  SideRun.prototype.tryDrop = function () {
    if (this.phase !== 'attack' || this.dropT > 0) return;
    this.dropT = 2.3;
    var good = this.dropWindow();
    this.torps.push({
      x: this.ax + 18,
      y: this.ay + 6,
      vx: 240,
      vy: 60,
      wet: false,
      good: good,
      life: 3.4,
    });
    WOW.audio.rocket();
  };

  SideRun.prototype.strike = function (torp) {
    torp.life = 0;
    this.hits += 1;
    var game = this.game;
    game.score += WOW.SCORE.torpedo;
    game.fx.explode(torp.x, this.seaY - 8, 'big');
    game.shake = 8;
    WOW.audio.explode(false);
    var done = this.hits >= this.need;
    game.banner = { text: done ? 'RUDDER JAMMED' : 'TORPEDO HIT', t: 1.45 };
    if (done) game.pendingVictory = 1.45;
  };

  SideRun.prototype.accelerating = function (input) {
    if (input.down('ArrowRight') || input.down('KeyD')) return true;
    return input.pointer.held && input.pointer.x > WOW.W * 0.55;
  };

  SideRun.prototype.update = function (dt) {
    var game = this.game;
    if (this.turnedAway()) return;
    this.t += dt;
    if (this.dropT > 0) this.dropT = Math.max(0, this.dropT - dt);
    this.flash = Math.max(0, this.flash - dt * 1.3);
    if (Math.random() < dt * 0.18) this.flash = 1;
    this.pitch = this.holdPitch != null ? this.holdPitch : Math.sin(this.t * 0.7) * 0.2;

    if (this.phase === 'crash') {
      this.py += 70 * dt;
      this.phaseT -= dt;
      game.player.x = this.px;
      game.player.y = this.py;
      if (this.phaseT <= 0 && game.mode === 'playing') this.resetDeck();
      this.stepTorps(dt);
      return;
    }

    if (this.phase === 'deck') this.updateDeck(dt);
    else if (this.phase === 'climb') this.updateClimb(dt);
    else if (this.phase === 'attack') this.updateAttack(dt);

    this.stepTorps(dt);
    this.stepShells(dt);
    game.player.x = this.phase === 'deck' ? this.px : this.ax;
    game.player.y = this.phase === 'deck' ? this.py : this.ay;
  };

  SideRun.prototype.updateDeck = function (dt) {
    var input = this.game.input;
    if (this.accelerating(input)) this.speed = Math.min(280, this.speed + 480 * dt);
    else this.speed = Math.max(0, this.speed - 240 * dt);
    this.along += this.speed * dt;
    if (this.along >= this.deckLen) {
      var bow = this.deckPoint(this.deckLen);
      this.px = bow.x;
      this.py = bow.y - 14;
      this.ax = bow.x;
      this.ay = bow.y - 14;
      if (this.pitch > LAUNCH_PITCH) {
        this.phase = 'climb';
        this.phaseT = 1.35;
        this.game.banner = { text: 'STRINGBAGS AWAY', t: 1.5 };
        WOW.audio.warning();
      } else {
        this.crash();
      }
      return;
    }
    this.placeOnDeck();
  };

  SideRun.prototype.updateClimb = function (dt) {
    this.phaseT -= dt;
    var u = 1 - Math.max(this.phaseT, 0) / 1.35;
    var bow = this.deckPoint(this.deckLen);
    this.ax = bow.x + (180 - bow.x) * u;
    this.ay = (bow.y - 14) + (150 - (bow.y - 14)) * u;
    this.px = this.ax;
    this.py = this.ay;
    if (this.phaseT <= 0) {
      this.phase = 'attack';
      this.ax = 180;
      this.ay = 150;
      this.shipX = 560;
      this.game.banner = { text: 'BISMARCK AHEAD', t: 1.5 };
    }
  };

  SideRun.prototype.updateAttack = function (dt) {
    var input = this.game.input;
    var axes = input.moveAxes();
    this.ay += axes.y * 175 * dt;
    this.ax += axes.x * 150 * dt;
    if (input.pointer.held) {
      this.ay += (input.pointer.y - this.ay) * Math.min(1, dt * 7);
      this.ax += ((input.pointer.x > WOW.W * 0.5 ? 40 : -40)) * dt;
    }
    this.ay = WOW.clamp(this.ay, 46, this.seaY - 22);
    this.ax = WOW.clamp(this.ax, 80, 300);
    this.px = this.ax;
    this.py = this.ay;
    this.shipX = 530 + Math.sin(this.t * 0.32) * 64;

    if (input.pressed('Space') || input.pressed('KeyX') || input.pointer.edge) this.tryDrop();

    this.shellT -= dt;
    if (this.shellT <= 0) {
      this.shellT = 0.34;
      var open = this.opening();
      var fromY = this.seaY - 78;
      var aim = open ? 36 + Math.random() * 70 : 40 + Math.random() * 200;
      this.shells.push({
        x: this.shipX + 90,
        y: fromY,
        vx: -200 - Math.random() * 70,
        vy: (aim - fromY) * 0.45,
        r: 3.4,
        life: 3.2,
      });
    }

    for (var i = 0; i < this.shells.length; i++) {
      var shell = this.shells[i];
      if (shell.life <= 0) continue;
      if (WOW.hit(shell.x, shell.y, shell.r, this.ax, this.ay, 14)) {
        this.px = this.ax;
        this.py = this.ay;
        this.crash();
        return;
      }
    }
  };

  SideRun.prototype.stepTorps = function (dt) {
    for (var i = this.torps.length - 1; i >= 0; i--) {
      var torp = this.torps[i];
      torp.life -= dt;
      if (!torp.wet) {
        torp.vy += 280 * dt;
        torp.x += torp.vx * dt;
        torp.y += torp.vy * dt;
        if (torp.y >= this.seaY - 5) {
          torp.y = this.seaY - 5;
          torp.wet = true;
          torp.vy = 0;
          this.game.fx.burst(torp.x, torp.y, 'spark');
          if (!torp.good) torp.life = Math.min(torp.life, 0.28);
        }
      } else if (torp.good) {
        var tx = this.shipX + 24;
        torp.x += (tx - torp.x) * Math.min(1, dt * 1.6) + 30 * dt;
        if (torp.x >= this.shipX - 2) {
          this.strike(torp);
        }
      } else {
        torp.x += 80 * dt;
      }
      if (torp.life <= 0) this.torps.splice(i, 1);
    }
  };

  SideRun.prototype.stepShells = function (dt) {
    for (var i = this.shells.length - 1; i >= 0; i--) {
      var shell = this.shells[i];
      shell.life -= dt;
      shell.x += shell.vx * dt;
      shell.y += shell.vy * dt;
      if (shell.life <= 0 || shell.x < -20 || shell.y < -20 || shell.y > WOW.H + 20) {
        this.shells.splice(i, 1);
      }
    }
  };

  SideRun.prototype.draw = function (ctx) {
    this.drawSky(ctx);
    this.drawSea(ctx);
    if (this.phase === 'attack' || this.phase === 'climb' || this.hits > 0) {
      if (this.phase !== 'deck') this.drawBismarck(ctx);
    }
    if (this.phase === 'deck' || this.phase === 'crash' || this.phase === 'climb') this.drawCarrier(ctx);
    if (this.phase === 'attack') this.drawDropBand(ctx);

    for (var i = 0; i < this.shells.length; i++) {
      var shell = this.shells[i];
      ctx.fillStyle = 'rgba(255, 220, 120, 0.9)';
      ctx.beginPath();
      ctx.arc(shell.x, shell.y, shell.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (var t = 0; t < this.torps.length; t++) {
      var torp = this.torps[t];
      ctx.save();
      ctx.translate(torp.x, torp.y);
      ctx.fillStyle = '#1c2420';
      ctx.fillRect(-8, -2, 16, 4);
      ctx.fillStyle = '#c4b48a';
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(13, 0);
      ctx.lineTo(8, 2);
      ctx.fill();
      ctx.restore();
    }

    var rot = this.phase === 'deck' || this.phase === 'crash' ? -this.pitch : Math.sin(this.t * 2) * 0.04;
    var showTorp = this.phase !== 'attack' || this.dropT <= 0.2;
    drawSwordfish(ctx, this.phase === 'deck' || this.phase === 'crash' ? this.px : this.ax, this.phase === 'deck' || this.phase === 'crash' ? this.py : this.ay, rot, showTorp && this.phase !== 'crash');

    if (this.phase === 'deck') {
      ctx.textAlign = 'center';
      ctx.font = '700 22px Georgia, "Palatino Linotype", serif';
      ctx.fillStyle = this.pitch > LAUNCH_PITCH ? '#e6c35c' : '#e25b3a';
      ctx.fillText(this.pitch > LAUNCH_PITCH ? 'BOW UP' : 'BOW DOWN', WOW.W / 2, 78);
      ctx.font = '13px "Segoe UI", Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(243,234,210,0.8)';
      ctx.fillText('ARK ROYAL  ·  HOLD RIGHT OR D', WOW.W / 2, 102);
    }

    if (this.turnedAway()) this.drawTurn(ctx);
  };

  SideRun.prototype.drawSky = function (ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, this.seaY);
    g.addColorStop(0, '#05070d');
    g.addColorStop(1, '#1a2740');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WOW.W, WOW.H);
    ctx.fillStyle = 'rgba(232, 226, 206, 0.75)';
    for (var s = 0; s < 28; s++) {
      var sx = (s * 97) % WOW.W;
      var sy = (s * 53) % (this.seaY - 20);
      ctx.fillRect(sx, sy, s % 5 === 0 ? 1.6 : 1, s % 5 === 0 ? 1.6 : 1);
    }
    if (this.flash > 0.2) {
      ctx.fillStyle = 'rgba(214, 226, 242, ' + (this.flash * 0.18) + ')';
      ctx.fillRect(0, 0, WOW.W, this.seaY);
    }
    ctx.strokeStyle = 'rgba(210, 220, 230, 0.28)';
    ctx.lineWidth = 1;
    for (var i = 0; i < this.rain.length; i++) {
      var drop = this.rain[i];
      drop.y += drop.v * 0.016;
      drop.x -= 40 * 0.016;
      if (drop.y > WOW.H) {
        drop.y = -10;
        drop.x = Math.random() * WOW.W;
      }
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 3, drop.y + 10);
      ctx.stroke();
    }
  };

  SideRun.prototype.drawSea = function (ctx) {
    var g = ctx.createLinearGradient(0, this.seaY - 8, 0, WOW.H);
    g.addColorStop(0, '#1a4560');
    g.addColorStop(0.18, '#102838');
    g.addColorStop(1, '#070f16');
    ctx.fillStyle = g;
    ctx.fillRect(0, this.seaY - 2, WOW.W, WOW.H - this.seaY + 2);
    var scroll = this.t * 46;
    ctx.lineWidth = 1.15;
    for (var i = 0; i < 7; i++) {
      var y = this.seaY + 10 + i * 16;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(198, 220, 230, 0.28)' : 'rgba(90, 130, 150, 0.22)';
      ctx.beginPath();
      for (var x = 0; x <= WOW.W; x += 16) {
        var wy = y + Math.sin((x + scroll + i * 40) * 0.035) * 3.2;
        if (x === 0) ctx.moveTo(0, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
  };

  SideRun.prototype.drawCarrier = function (ctx) {
    var bow = this.deckPoint(this.deckLen);
    var stern = this.deckPoint(0);
    ctx.save();
    ctx.translate(this.pivot.x, this.pivot.y);
    ctx.rotate(-this.pitch);
    var hull = ctx.createLinearGradient(0, 8, 0, 46);
    hull.addColorStop(0, '#3a4450');
    hull.addColorStop(0.45, '#242a32');
    hull.addColorStop(1, '#12161c');
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(-40, 12);
    ctx.lineTo(this.deckLen + 14, 14);
    ctx.lineTo(this.deckLen - 18, 40);
    ctx.lineTo(18, 48);
    ctx.lineTo(-34, 32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a2228';
    ctx.fillRect(-30, 14, this.deckLen + 20, 4);
    var deck = ctx.createLinearGradient(0, -10, 0, 8);
    deck.addColorStop(0, '#5a6470');
    deck.addColorStop(1, '#343c46');
    ctx.fillStyle = deck;
    ctx.beginPath();
    ctx.moveTo(-30, -8);
    ctx.lineTo(this.deckLen + 6, -9);
    ctx.lineTo(this.deckLen + 16, 2);
    ctx.lineTo(this.deckLen - 4, 8);
    ctx.lineTo(-32, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(230, 210, 150, 0.8)';
    ctx.setLineDash([12, 9]);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(this.deckLen - 28, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c2ccd4';
    for (var w = 40; w < this.deckLen - 40; w += 36) ctx.fillRect(w, -7, 8, 2);
    ctx.fillStyle = '#2a3138';
    ctx.fillRect(this.deckLen * 0.56, -34, 40, 28);
    ctx.fillStyle = '#d7dee6';
    ctx.fillRect(this.deckLen * 0.56 + 6, -28, 5, 4);
    ctx.fillRect(this.deckLen * 0.56 + 16, -28, 5, 4);
    ctx.fillRect(this.deckLen * 0.56 + 26, -28, 5, 4);
    ctx.fillStyle = '#161a1e';
    ctx.fillRect(this.deckLen * 0.6, -56, 14, 24);
    ctx.fillStyle = '#8a9096';
    ctx.fillRect(this.deckLen * 0.6 - 4, -58, 22, 4);
    ctx.fillStyle = this.pitch > LAUNCH_PITCH ? '#e6c35c' : '#e25b3a';
    ctx.fillRect(this.deckLen - 16, -12, 10, 6);
    ctx.restore();

    ctx.strokeStyle = 'rgba(190, 214, 224, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(stern.x - 10, this.seaY + 4);
    ctx.quadraticCurveTo(stern.x - 40, this.seaY + 10, stern.x - 70, this.seaY + 2);
    ctx.stroke();
    if (bow.y > this.seaY - 6) {
      ctx.fillStyle = 'rgba(200, 224, 232, 0.5)';
      ctx.beginPath();
      ctx.ellipse(bow.x, this.seaY, 34, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  SideRun.prototype.drawBismarck = function (ctx) {
    var x = this.shipX;
    var y = this.seaY;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(150, 170, 180, 0.22)';
    ctx.beginPath();
    ctx.ellipse(40, 8, 36, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    var hull = ctx.createLinearGradient(0, -30, 0, 12);
    hull.addColorStop(0, '#6a7580');
    hull.addColorStop(0.4, '#3e4852');
    hull.addColorStop(1, '#1c242c');
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(6, -4);
    ctx.lineTo(28, 10);
    ctx.lineTo(214, 12);
    ctx.lineTo(252, -2);
    ctx.lineTo(236, -24);
    ctx.lineTo(48, -26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a333c';
    ctx.fillRect(24, -6, 196, 8);
    ctx.fillStyle = '#c5ced6';
    ctx.fillRect(30, -16, 190, 2);
    ctx.fillStyle = '#4a5560';
    ctx.fillRect(36, -40, 28, 16);
    ctx.fillRect(70, -40, 28, 16);
    ctx.fillRect(168, -38, 26, 14);
    ctx.fillStyle = '#1a2026';
    ctx.fillRect(42, -44, 16, 3);
    ctx.fillRect(76, -44, 16, 3);
    ctx.fillRect(174, -42, 14, 3);
    ctx.fillStyle = '#525c66';
    ctx.fillRect(108, -64, 42, 40);
    ctx.fillStyle = '#d5dde4';
    ctx.fillRect(114, -52, 6, 5);
    ctx.fillRect(126, -52, 6, 5);
    ctx.fillRect(138, -52, 6, 5);
    ctx.fillStyle = '#14181c';
    ctx.fillRect(118, -86, 12, 24);
    ctx.fillStyle = '#8d949c';
    ctx.fillRect(112, -88, 24, 4);
    ctx.fillStyle = '#9c2b22';
    ctx.fillRect(150, -20, 10, 4);
    if (this.hits > 0) {
      ctx.fillStyle = 'rgba(40, 40, 38, 0.6)';
      ctx.beginPath();
      ctx.ellipse(48, -36, 16 + this.hits * 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(180, 70, 30, 0.45)';
      ctx.beginPath();
      ctx.ellipse(40, -8, 10 + this.hits * 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    var bw = 160;
    var hp = 1 - this.hits / this.need;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 40, y - 108, bw, 7);
    ctx.fillStyle = '#e25b3a';
    ctx.fillRect(x + 40, y - 108, bw * Math.max(0, hp), 7);
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 40.5, y - 107.5, bw - 1, 6);
  };

  SideRun.prototype.drawDropBand = function (ctx) {
    var y = this.seaY - 40;
    var hot = this.dropWindow();
    ctx.strokeStyle = hot ? 'rgba(230, 195, 92, 0.95)' : 'rgba(230, 195, 92, 0.28)';
    ctx.lineWidth = hot ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(this.ax - 20, y);
    ctx.lineTo(this.shipX, y);
    ctx.stroke();
    if (hot) {
      ctx.fillStyle = '#e6c35c';
      ctx.font = '700 14px Georgia, "Palatino Linotype", serif';
      ctx.textAlign = 'center';
      ctx.fillText('DROP', (this.ax + this.shipX) / 2, y - 8);
    }
  };

  SideRun.prototype.drawTurn = function (ctx) {
    ctx.fillStyle = 'rgba(4, 8, 14, 0.82)';
    ctx.fillRect(0, 0, WOW.W, WOW.H);
    ctx.save();
    ctx.translate(WOW.W / 2, WOW.H / 2 - 20);
    ctx.rotate(Math.sin(this.t * 2) * 0.5);
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 3;
    ctx.strokeRect(-28, -46, 56, 92);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e6c35c';
    ctx.font = '700 28px Georgia, "Palatino Linotype", serif';
    ctx.fillText('TURN YOUR PHONE', WOW.W / 2, WOW.H / 2 + 70);
    ctx.fillStyle = '#f3ead2';
    ctx.font = '14px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('THIS SORTIE IS SIDEWAYS', WOW.W / 2, WOW.H / 2 + 96);
  };

  function drawSwordfish(ctx, x, y, rot, withTorp) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(4, 16, 28, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(rot);
    ctx.fillStyle = '#5a6846';
    ctx.beginPath();
    ctx.moveTo(-24, 1);
    ctx.lineTo(18, 0);
    ctx.lineTo(16, 6);
    ctx.lineTo(-26, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7e8c64';
    ctx.beginPath();
    ctx.moveTo(-32, -17);
    ctx.lineTo(24, -19);
    ctx.lineTo(22, -12);
    ctx.lineTo(-30, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(-28, -17.5, 46, 1.4);
    ctx.strokeStyle = '#1a1c18';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(-14, -12);
    ctx.lineTo(-12, 3);
    ctx.moveTo(8, -14);
    ctx.lineTo(8, 2);
    ctx.stroke();
    ctx.fillStyle = '#c3cba8';
    ctx.beginPath();
    ctx.ellipse(0, -5, 24, 6.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8f9b78';
    ctx.beginPath();
    ctx.ellipse(-2, -3, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6e7b54';
    ctx.beginPath();
    ctx.moveTo(-20, -7);
    ctx.lineTo(-36, -15);
    ctx.lineTo(-30, -5);
    ctx.lineTo(-36, 2);
    ctx.lineTo(-20, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#242824';
    ctx.beginPath();
    ctx.arc(20, -5, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(230, 234, 220, 0.38)';
    ctx.beginPath();
    ctx.ellipse(27, -5, 2.4, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(186, 214, 222, 0.9)';
    ctx.beginPath();
    ctx.ellipse(5, -9, 5.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d3f86';
    ctx.beginPath();
    ctx.arc(-6, -16, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f5f2';
    ctx.beginPath();
    ctx.arc(-6, -16, 2.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b4332c';
    ctx.beginPath();
    ctx.arc(-6, -16, 1.05, 0, Math.PI * 2);
    ctx.fill();
    if (withTorp) {
      ctx.fillStyle = '#161c18';
      ctx.fillRect(-2, 3, 20, 3.4);
      ctx.fillStyle = '#c8b48a';
      ctx.beginPath();
      ctx.moveTo(18, 3);
      ctx.lineTo(24, 4.7);
      ctx.lineTo(18, 6.4);
      ctx.fill();
    }
    ctx.restore();
  }

  WOW.SideRun = SideRun;
})(window.WOW = window.WOW || {});
