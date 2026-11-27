(() => {
  "use strict";
  const R = (window.ROH = window.ROH || {});

  const SONGS = {
    intro: {
      bpm: 112, steps: 32,
      mel: [76,0,74,72,71,0,72,74,76,0,79,76,74,72,71,0,72,0,71,69,67,0,69,71,72,74,76,0,74,0,71,0],
      bas: [45,45,45,45,41,41,41,41,45,45,45,45,43,43,38,38,45,45,45,45,41,41,38,38,45,45,43,43,38,40,45,0],
    },
    1: {
      bpm: 128, steps: 32,
      mel: [65,0,69,70,72,0,70,69,65,0,62,0,65,69,70,0,72,74,72,70,69,0,65,0,62,64,65,0,69,0,65,0],
      bas: [38,38,38,38,45,45,43,43,38,38,38,38,33,33,36,36,38,38,45,45,43,43,41,41,38,38,33,33,38,38,36,0],
    },
    2: {
      bpm: 134, steps: 32,
      mel: [70,70,74,0,77,0,74,70,72,0,74,0,77,79,77,0,75,0,74,72,70,0,67,0,70,72,74,0,70,0,65,0],
      bas: [43,43,43,43,46,46,45,0,43,43,40,40,38,38,43,0,43,43,46,46,45,45,43,0,38,40,43,43,43,0,38,0],
    },
    3: {
      bpm: 120, steps: 32,
      mel: [64,0,67,0,71,0,67,64,62,0,64,0,59,0,62,0,64,67,71,0,67,0,64,0,59,62,64,0,62,0,59,0],
      bas: [40,40,40,40,47,47,45,0,40,40,40,0,35,35,38,0,40,40,47,0,43,43,40,0,35,0,40,40,40,40,38,0],
    },
    4: {
      bpm: 126, steps: 32,
      mel: [65,0,68,70,72,0,70,68,65,0,63,0,65,68,70,0,72,75,72,70,68,0,65,0,63,65,68,0,65,0,60,0],
      bas: [41,41,41,41,48,48,46,46,41,41,41,41,36,36,39,39,41,41,48,48,46,46,41,0,36,39,41,41,41,0,36,0],
    },
    5: {
      bpm: 132, steps: 32,
      mel: [69,0,0,69,72,0,69,0,65,0,0,67,69,0,0,0,72,0,69,0,65,0,62,0,65,67,69,0,65,0,62,0],
      bas: [33,0,33,33,40,0,33,0,29,0,29,29,33,0,28,0,33,0,33,33,29,0,24,0,29,29,33,0,28,0,33,0],
    },
    6: {
      bpm: 124, steps: 32,
      mel: [64,0,67,64,71,0,67,0,62,0,64,0,59,0,62,64,67,0,64,0,59,0,57,0,59,62,64,0,62,0,59,0],
      bas: [40,40,0,40,47,0,40,0,35,35,0,35,40,0,33,0,40,40,47,0,45,0,40,0,35,0,33,0,40,0,35,0],
    },
    7: {
      bpm: 138, steps: 32,
      mel: [73,0,76,0,80,76,73,0,71,0,73,0,68,0,71,0,73,76,80,0,76,0,73,0,68,70,73,0,71,0,68,0],
      bas: [42,42,42,42,49,49,47,47,42,42,42,42,37,37,40,40,42,42,49,49,47,47,42,0,37,40,42,42,42,0,37,0],
    },
  };

  let ctx = null, gain = null, delay = null, wet = null, noise = null;
  let timer = 0, step = 0, song = null;

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function noiseBuf() {
    if (noise) return noise;
    const n = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noise = n;
    return noise;
  }

  function env(vol, t0, a, hold, dur) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + a);
    g.gain.exponentialRampToValueAtTime(Math.max(vol * 0.4, 0.0002), t0 + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    return g;
  }

  function connectOut(node, toDelay) {
    node.connect(gain);
    if (toDelay && wet) node.connect(wet);
  }

  function kick(t0) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(148, t0);
    o.frequency.exponentialRampToValueAtTime(42, t0 + 0.11);
    g.gain.setValueAtTime(0.16, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    o.connect(g);
    g.connect(gain);
    o.start(t0);
    o.stop(t0 + 0.3);
  }

  function snare(t0) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf();
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(1800, t0);
    const g = env(0.09, t0, 0.005, 0.03, 0.16);
    src.connect(hp);
    hp.connect(g);
    g.connect(gain);
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(210, t0);
    o.frequency.exponentialRampToValueAtTime(120, t0 + 0.08);
    og.gain.setValueAtTime(0.05, t0);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
    o.connect(og);
    og.connect(gain);
    src.start(t0);
    src.stop(t0 + 0.18);
    o.start(t0);
    o.stop(t0 + 0.12);
  }

  function hat(t0, vol, open) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf();
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(open ? 7000 : 9000, t0);
    const g = env(vol, t0, 0.002, open ? 0.05 : 0.012, open ? 0.18 : 0.05);
    src.connect(hp);
    hp.connect(g);
    g.connect(gain);
    src.start(t0);
    src.stop(t0 + (open ? 0.2 : 0.06));
  }

  function tom(t0, freq) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t0);
    o.frequency.exponentialRampToValueAtTime(freq * 0.55, t0 + 0.14);
    g.gain.setValueAtTime(0.07, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.connect(g);
    g.connect(gain);
    o.start(t0);
    o.stop(t0 + 0.2);
  }

  function bassNote(n, dur, t0) {
    const freq = midi(n);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = "sawtooth";
    o2.type = "square";
    o1.frequency.setValueAtTime(freq, t0);
    o2.frequency.setValueAtTime(freq, t0);
    o2.detune.setValueAtTime(-8, t0);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.setValueAtTime(7.5, t0);
    f.frequency.setValueAtTime(220, t0);
    f.frequency.exponentialRampToValueAtTime(1600, t0 + 0.035);
    f.frequency.exponentialRampToValueAtTime(320, t0 + dur * 0.85);
    const g = env(0.07, t0, 0.012, dur * 0.25, dur);
    o1.connect(f);
    o2.connect(f);
    f.connect(g);
    connectOut(g, false);
    o1.start(t0);
    o2.start(t0);
    o1.stop(t0 + dur + 0.02);
    o2.stop(t0 + dur + 0.02);
    const fifth = ctx.createOscillator();
    fifth.type = "sawtooth";
    fifth.frequency.setValueAtTime(freq * 1.498, t0);
    const fg = env(0.022, t0, 0.02, dur * 0.2, dur * 0.9);
    const ff = ctx.createBiquadFilter();
    ff.type = "lowpass";
    ff.frequency.setValueAtTime(900, t0);
    fifth.connect(ff);
    ff.connect(fg);
    fg.connect(gain);
    fifth.start(t0);
    fifth.stop(t0 + dur);
  }

  function leadNote(n, dur, t0) {
    const freq = midi(n);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.setValueAtTime(2.2, t0);
    f.frequency.setValueAtTime(2200, t0);
    f.frequency.exponentialRampToValueAtTime(4800, t0 + 0.04);
    f.frequency.exponentialRampToValueAtTime(1800, t0 + dur);
    const g = env(0.042, t0, 0.01, dur * 0.35, dur);
    [-12, 7, 12].forEach((cents, i) => {
      const o = ctx.createOscillator();
      o.type = i === 1 ? "square" : "sawtooth";
      o.frequency.setValueAtTime(i === 1 ? freq * 0.5 : freq, t0);
      o.detune.setValueAtTime(cents, t0);
      o.connect(f);
      o.start(t0);
      o.stop(t0 + dur + 0.03);
    });
    f.connect(g);
    connectOut(g, true);
  }

  function ensureFx(actx, master) {
    ctx = actx;
    if (gain) return;
    gain = actx.createGain();
    gain.gain.value = 0.85;
    delay = actx.createDelay(0.5);
    delay.delayTime.value = 0.27;
    const fb = actx.createGain();
    fb.gain.value = 0.32;
    wet = actx.createGain();
    wet.gain.value = 0.28;
    const hp = actx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 400;
    gain.connect(master);
    wet.connect(hp);
    hp.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(master);
  }

  function tick() {
    if (!song || !ctx) return;
    const t0 = ctx.currentTime + 0.02;
    const dur = 60 / song.bpm / 2;
    const i = step % song.steps;
    const beat = i % 8;
    const bar = Math.floor(i / 8) % 4;
    const m = song.mel[i];
    const b = song.bas[i];

    if (beat === 0 || beat === 4) kick(t0);
    if (beat === 2 || beat === 6) snare(t0);
    hat(t0, beat % 2 === 0 ? 0.028 : 0.016, beat === 6 && bar === 3);
    if (bar === 3 && beat === 4) tom(t0, 180);
    if (bar === 3 && beat === 5) tom(t0, 240);
    if (bar === 3 && beat === 7) snare(t0);

    if (b) bassNote(b, dur * 1.25, t0);
    if (m) leadNote(m, dur * 1.55, t0);
    step++;
  }

  R.musicStart = function (actx, master, which) {
    if (!actx || !master) return;
    ensureFx(actx, master);
    const next = SONGS[which] || SONGS.intro;
    if (song === next && timer) return;
    R.musicStop();
    song = next;
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
