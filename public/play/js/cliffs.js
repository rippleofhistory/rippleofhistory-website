/**
 * Battle of Britain, 1940, inside The Rip in History.
 * The flight is the Wings white-cliffs level. Lives, death, and the next
 * mission stay with Ripple. Wings of WW2 is only named when the coast holds.
 */
(() => {
  "use strict";

  const canvas = document.getElementById("cliffs");
  if (!canvas || !window.WOW || !WOW.Game) {
    throw new Error("cliffs host loaded before the wings sortie");
  }

  canvas.width = WOW.W * WOW.SCALE;
  canvas.height = WOW.H * WOW.SCALE;

  const level = (WOW.LEVELS || []).filter((row) => row.id === "white-cliffs")[0];
  if (!level) throw new Error("white-cliffs sortie missing from wings");

  function storyLevel() {
    level.name = "BATTLE OF BRITAIN";
    level.short = "1940";
    level.clear = "THE COAST HOLDS";
    level.nextHint = "ENTER  ·  1942";
  }
  storyLevel();

  const game = new WOW.Game(canvas);
  game.noteScore = function () {};

  let running = false;
  let left = false;
  let pending = {};
  let lastT = 0;
  let onDesert = null;
  let onTitle = null;
  let onLife = null;
  let onDowned = null;

  if (WOW.loadAssets) WOW.loadAssets();

  function stage() {
    return document.getElementById("stage");
  }

  function showCanvas() {
    const root = stage();
    if (root) root.classList.add("cliffs-on");
    canvas.removeAttribute("aria-hidden");
  }

  function hideCanvas() {
    const root = stage();
    if (root) root.classList.remove("cliffs-on");
    canvas.setAttribute("aria-hidden", "true");
  }

  function clearInput() {
    if (!game.input) return;
    game.input.keys = Object.create(null);
    game.input.prev = Object.create(null);
    game.input.pointer.held = false;
    game.input.pointer.edge = false;
  }

  function syncMute(on) {
    if (!WOW.audio) return;
    WOW.audio.muted = !!on;
    if (WOW.audio.master) WOW.audio.master.gain.value = on ? 0 : 0.22;
  }

  function silence() {
    syncMute(true);
  }

  function outcome() {
    return {
      lives: game.player ? game.player.lives : 0,
      airScore: game.score || 0,
    };
  }

  function leave(fn) {
    if (left) return;
    left = true;
    running = false;
    hideCanvas();
    clearInput();
    silence();
    try {
      fn(outcome());
    } catch (err) {
      left = false;
      throw err;
    }
  }

  function toDesert() {
    leave((info) => { if (typeof onDesert === "function") onDesert(info); });
  }

  function toRippleTitle() {
    leave(() => { if (typeof onTitle === "function") onTitle(); });
  }

  function toDead() {
    leave((info) => { if (typeof onDowned === "function") onDowned(info); });
  }

  function bindPilot() {
    const pilot = game.player;
    if (!pilot || pilot._rohBound) return;
    const origHit = pilot.hit.bind(pilot);
    pilot.hit = function (host) {
      origHit(host);
      if (typeof onLife === "function") onLife(pilot.lives);
      if (host.mode === "gameover") toDead();
    };
    pilot._rohBound = true;
  }

  function paintLabel(ctx, draw) {
    const origFill = ctx.fillText;
    ctx.fillText = function (text, x, y) {
      if (typeof text === "string" && /\d+\/\d+$/.test(text)) text = "1940";
      if (text === "PAUSED") text = "TIME HELD";
      return origFill.call(ctx, text, x, y);
    };
    try { draw(); }
    finally { ctx.fillText = origFill; }
  }

  const origBanner = game.drawBanner;
  game.drawBanner = function (ctx) {
    if (this.mode === "victory" || this.mode === "gameover") return;
    origBanner.call(this, ctx);
  };

  const origHUD = game.drawHUD;
  game.drawHUD = function (ctx) {
    paintLabel(ctx, () => origHUD.call(this, ctx));
  };

  const origPause = game.drawPause;
  game.drawPause = function (ctx) {
    paintLabel(ctx, () => origPause.call(this, ctx));
  };

  game.drawEnd = function (ctx) {
    if (this.mode !== "victory") return;
    ctx.save();
    ctx.fillStyle = "#07101c";
    ctx.strokeStyle = "rgba(230, 195, 92, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(36, 188, 408, 320, 10);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#e6c35c";
    ctx.font = '700 22px Georgia, "Palatino Linotype", serif';
    ctx.fillText("THE COAST HOLDS", WOW.W / 2, 236);
    ctx.fillStyle = "#f3ead2";
    ctx.font = '16px Georgia, "Palatino Linotype", serif';
    ctx.fillText("1940. Britain keeps the sky.", WOW.W / 2, 276);
    ctx.fillStyle = "rgba(230, 195, 92, 0.92)";
    ctx.font = '15px Georgia, "Palatino Linotype", serif';
    ctx.fillText("The rest of the air war", WOW.W / 2, 324);
    ctx.fillText("is Wings of WW2.", WOW.W / 2, 348);
    ctx.fillStyle = "#f3ead2";
    ctx.font = '14px Georgia, "Palatino Linotype", serif';
    ctx.fillText("Next, the SAS desert. 1942.", WOW.W / 2, 392);
    ctx.fillStyle = "#e6c35c";
    ctx.font = '700 15px Georgia, "Palatino Linotype", serif';
    ctx.fillText("ENTER  ·  CONTINUE", WOW.W / 2, 448);
    ctx.restore();
  };

  const origMeta = game.handleMeta;
  game.handleMeta = function () {
    const input = this.input;
    if (this.mode === "gameover") {
      toDead();
      return;
    }
    if (this.mode === "victory" && (input.pressed("Enter") || input.pointer.edge)) {
      toDesert();
      return;
    }
    if (this.mode === "title") {
      toRippleTitle();
      return;
    }
    origMeta.call(this);
  };

  game.continueSortie = function () {
    toDesert();
  };

  const origStart = game.startLevel.bind(game);
  game.startLevel = function (save) {
    const next = Object.assign({}, save || {});
    if (!next.levelId) next.levelId = "white-cliffs";
    origStart(next);
  };

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.034, (now - lastT) / 1000);
    lastT = now;
    game.frame(dt);
    if (running) requestAnimationFrame(loop);
  }

  function start(opts) {
    pending = opts || {};
    left = false;
    storyLevel();
    showCanvas();
    clearInput();
    const save = { levelId: "white-cliffs" };
    if (pending.lives != null) save.lives = pending.lives;
    game.startLevel(save);
    bindPilot();
    if (typeof onLife === "function" && game.player) onLife(game.player.lives);
    syncMute(!!pending.muted);
    if (!running) {
      running = true;
      lastT = performance.now();
      requestAnimationFrame(loop);
    } else {
      lastT = performance.now();
    }
  }

  function state() {
    const img = WOW.images && WOW.images.player;
    return {
      active: running,
      mode: game.mode,
      levelId: game.level ? game.level.id : "",
      levelName: game.level ? game.level.name : "",
      scenery: game.level ? game.level.scenery : "",
      lives: game.player ? game.player.lives : 0,
      score: game.score || 0,
      assets: !!WOW.assetsReady,
      playerImage: !!(img && img.width),
      t: game.waves ? game.waves.t : 0,
    };
  }

  hideCanvas();

  window.ROHCliffs = {
    start: start,
    handoff: toDesert,
    title: toRippleTitle,
    syncMute: syncMute,
    state: state,
    forceMode: (mode) => { game.mode = mode; },
    debugHit: () => {
      if (!game.player) return;
      game.player.iFrames = 0;
      game.player.spawn = 0;
      game.player.alive = true;
      game.player.hit(game);
    },
    debugLives: (n) => {
      if (!game.player) return;
      game.player.lives = n;
      if (typeof onLife === "function") onLife(n);
    },
    set onDesert(fn) { onDesert = fn; },
    set onTitle(fn) { onTitle = fn; },
    set onLife(fn) { onLife = fn; },
    set onDowned(fn) { onDowned = fn; },
  };
})();
