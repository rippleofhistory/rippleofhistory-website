/**
 * Boot. Classic scripts (not modules) so the page runs from disk.
 * window.WingsOfWW2 is the small API another game can call.
 */
(function () {
  const canvas = document.getElementById('game');
  canvas.width = WOW.W * WOW.SCALE;
  canvas.height = WOW.H * WOW.SCALE;
  const game = new WOW.Game(canvas);

  const api = {
    startLevel: function (save) { game.startLevel(save); },
    pause: function () { game.pause(); },
    resume: function () { game.resume(); },
    getScore: function () { return game.getScore(); },
    getState: function () { return game.getState(); },
    onLevelComplete: function (fn) { game.onLevelComplete(fn); },
    onGameOver: function (fn) { game.onGameOver(fn); },
  };
  window.WingsOfWW2 = api;

  window.__wow = {
    game: game,
    snap: function () {
      const state = game.getState();
      state.enemies = game.livingCount();
      state.boss = game.bossAlive();
      state.bossName = game.bossRef() ? game.bossRef().name : '';
      state.px = game.player.x;
      state.py = game.player.y;
      state.playerShots = game.playerShots.length;
      state.enemyShots = game.enemyShots.length;
      state.crates = game.powerups.length;
      state.t = game.waves.t;
      state.assets = !!WOW.assetsReady;
      state.auto = game.player.auto;
      state.escorts = game.escorts.length;
      state.ground = game.ground.length;
      state.sidePhase = game.side ? game.side.phase : '';
      state.sideHits = game.side ? game.side.hits : 0;
      state.sideT = game.side ? game.side.t : 0;
      state.turn = !!(game.side && game.side.turnedAway());
      return state;
    },
    giveCrate: function () { game.grantUpgrade(game.player.x, game.player.y - 20); },
    clearEnemies: function () {
      game.enemies.length = 0;
      game.enemyShots.length = 0;
    },
    skipToBoss: function () {
      game.enemies.length = 0;
      game.enemyShots.length = 0;
      game.waves.index = game.waves.events.length - 1;
      game.waves.t = game.waves.events[game.waves.events.length - 1].t;
      game.waves.holdBoss = 0;
      game.waves.bossSpawned = false;
    },
    killBoss: function () {
      for (let i = 0; i < game.enemies.length; i++) {
        const e = game.enemies[i];
        if (e.boss && e.alive) e.hurt(e.hp, game);
      }
    },
    spawnBulletOnPlayer: function () {
      game.enemyShots.push(new WOW.Projectile(game.player.x, game.player.y, 0, 20, { r: 4 }));
    },
  };

  WOW.loadAssets();
  canvas.focus();

  let last = performance.now();
  function loop(now) {
    if (window.__WOW_HALT) return;
    const dt = Math.min(0.034, (now - last) / 1000);
    last = now;
    game.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
