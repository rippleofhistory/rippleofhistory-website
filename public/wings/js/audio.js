/**
 * Small Web Audio kit. No sample files, so the tester stays self-contained.
 * The context starts on the first gesture (autoplay rules).
 */
(function (WOW) {
  function AudioBus() {
    this.ac = null;
    this.master = null;
    this.muted = false;
    this.lastShot = 0;
  }

  AudioBus.prototype.ensure = function () {
    try {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ac = new AC();
        this.master = this.ac.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.ac.destination);
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      return this.ac;
    } catch (err) {
      return null;
    }
  };

  AudioBus.prototype.toggle = function () {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.22;
    return this.muted;
  };

  AudioBus.prototype.tone = function (freq, dur, type, vol, slide) {
    const ac = this.ensure();
    if (!ac || this.muted) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  };

  AudioBus.prototype.noise = function (dur, vol, freq) {
    const ac = this.ensure();
    if (!ac || this.muted) return;
    const n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq || 900;
    const g = ac.createGain();
    g.gain.value = vol;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
  };

  AudioBus.prototype.rocket = function () {
    this.noise(0.09, 0.06, 420);
    this.tone(160, 0.08, 'sawtooth', 0.035, 60);
  };

  AudioBus.prototype.shot = function () {
    const now = performance.now();
    if (now - this.lastShot < 55) return;
    this.lastShot = now;
    this.tone(740, 0.045, 'triangle', 0.05, 280);
  };

  AudioBus.prototype.explode = function (big) {
    this.noise(big ? 0.45 : 0.22, big ? 0.5 : 0.28, big ? 520 : 900);
    this.tone(big ? 90 : 140, big ? 0.28 : 0.12, 'sine', big ? 0.18 : 0.08, 50);
  };

  AudioBus.prototype.pickup = function () {
    this.tone(523, 0.07, 'triangle', 0.08);
    const self = this;
    setTimeout(function () { self.tone(659, 0.07, 'triangle', 0.08); }, 70);
    setTimeout(function () { self.tone(784, 0.1, 'triangle', 0.09); }, 140);
  };

  AudioBus.prototype.hurt = function () {
    this.tone(110, 0.28, 'sawtooth', 0.08, 50);
    this.noise(0.2, 0.22, 400);
  };

  AudioBus.prototype.bomb = function () {
    this.noise(0.5, 0.45, 600);
    this.tone(180, 0.35, 'sine', 0.16, 60);
  };

  AudioBus.prototype.warning = function () {
    this.tone(440, 0.12, 'square', 0.06);
    const self = this;
    setTimeout(function () { self.tone(330, 0.18, 'square', 0.06); }, 160);
  };

  WOW.audio = new AudioBus();
})(window.WOW = window.WOW || {});
