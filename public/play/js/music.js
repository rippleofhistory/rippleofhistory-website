(() => {
  "use strict";
  const R = (window.ROH = window.ROH || {});

  const SONGS = {
    intro: { bpm: 84, steps: 32, wave: "triangle", bass: "sine",
      mel: [64,0,67,0,71,0,67,0,64,0,62,0,67,0,71,0,72,0,71,0,67,0,64,0,62,0,59,0,62,0,64,0],
      bas: [40,40,0,0,45,45,0,0,40,40,0,0,38,38,0,0,33,33,0,0,38,38,0,0,40,40,0,0,35,35,0,0] },
    1: { bpm: 112, steps: 32, wave: "sawtooth", bass: "square",
      mel: [62,0,65,67,69,0,67,65,62,0,58,0,62,65,67,0,69,71,69,67,65,0,62,0,58,60,62,0,65,0,62,0],
      bas: [38,38,38,0,45,45,43,0,38,38,38,0,33,33,36,0,38,38,45,0,43,43,41,0,38,0,33,0,38,38,36,0] },
    2: { bpm: 118, steps: 32, wave: "square", bass: "square",
      mel: [67,67,71,0,74,0,71,67,69,0,71,0,74,76,74,0,72,0,71,69,67,0,64,0,67,69,71,0,67,0,62,0],
      bas: [43,43,43,43,47,47,45,0,43,43,40,0,38,38,43,0,43,43,47,0,45,45,43,0,38,40,43,0,43,0,38,0] },
    3: { bpm: 96, steps: 32, wave: "sawtooth", bass: "sine",
      mel: [57,0,60,0,64,0,60,0,57,55,57,0,52,0,55,0,57,0,60,64,67,0,64,60,57,0,55,0,52,0,57,0],
      bas: [33,33,0,0,40,40,0,0,33,33,0,0,28,28,0,0,33,33,40,0,36,36,0,0,33,0,28,0,33,33,31,0] },
    4: { bpm: 108, steps: 24, wave: "triangle", bass: "square",
      mel: [58,0,62,65,67,0,65,62,58,0,55,0,58,62,65,0,67,70,67,65,62,0,58,0],
      bas: [34,34,34,41,41,39,34,34,34,29,29,32,34,34,41,0,39,39,34,0,29,32,34,0] },
    5: { bpm: 100, steps: 32, wave: "square", bass: "sawtooth",
      mel: [57,0,0,57,60,0,57,0,53,0,0,55,57,0,0,0,60,0,57,0,53,0,50,0,53,55,57,0,53,0,50,0],
      bas: [33,0,33,0,40,0,33,0,29,0,29,0,33,0,28,0,33,0,33,0,29,0,24,0,29,0,33,0,28,0,33,0] },
    6: { bpm: 92, steps: 32, wave: "triangle", bass: "sawtooth",
      mel: [61,0,64,0,68,64,61,0,59,0,61,0,56,0,59,0,61,64,68,0,64,0,61,0,56,58,61,0,59,0,56,0],
      bas: [37,0,37,0,44,0,37,0,32,0,32,0,37,0,30,0,37,37,44,0,42,0,37,0,32,0,30,0,37,0,32,0] },
  };

  let ctx = null, gain = null, timer = 0, step = 0, key = null, song = null;

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function beep(freq, dur, type, vol, t0) {
    if (!ctx || !freq) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(freq, t0);
    f.type = "lowpass";
    f.frequency.setValueAtTime(type === "sawtooth" ? 1400 : 2400, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f);
    f.connect(g);
    g.connect(gain);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function tick() {
    if (!song || !ctx) return;
    const t0 = ctx.currentTime;
    const dur = 60 / song.bpm / 2;
    const i = step % song.steps;
    const m = song.mel[i];
    const b = song.bas[i];
    if (m) beep(midi(m), dur * 1.6, song.wave, 0.045, t0);
    if (b) beep(midi(b), dur * 1.8, song.bass, 0.055, t0);
    if (i % 4 === 0) beep(midi(b || 36) * 0.5, dur * 0.4, "sine", 0.03, t0);
    step++;
  }

  R.musicStart = function (actx, master, which) {
    ctx = actx;
    if (!gain) {
      gain = actx.createGain();
      gain.gain.value = 0.85;
      gain.connect(master);
    }
    const next = SONGS[which] || SONGS.intro;
    if (song === next && timer) return;
    R.musicStop();
    song = next;
    key = which;
    step = 0;
    const ms = (60 / song.bpm / 2) * 1000;
    tick();
    timer = setInterval(tick, ms);
  };

  R.musicStop = function () {
    if (timer) { clearInterval(timer); timer = 0; }
    song = null;
  };

  R.musicMute = function (on) {
    if (gain) gain.gain.value = on ? 0 : 0.85;
  };
})();
