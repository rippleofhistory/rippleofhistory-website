/**
 * Keyboard + pointer. Pointer-held flight is direct; keys are velocity.
 * Edges are sampled once per frame so a held key does not repeat a bomb.
 */
(function (WOW) {
  function Input(canvas) {
    this.canvas = canvas;
    this.keys = Object.create(null);
    this.prev = Object.create(null);
    this.pointer = { x: WOW.W / 2, y: WOW.H - 120, held: false, inside: false, edge: false };
    const self = this;

    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      self.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) {
      self.keys[e.code] = false;
    });
    window.addEventListener('blur', function () {
      self.keys = Object.create(null);
      self.pointer.held = false;
    });

    canvas.addEventListener('pointerdown', function (e) {
      canvas.focus();
      self.pointer.held = true;
      self.pointer.edge = true;
      self.place(e);
    });
    canvas.addEventListener('pointermove', function (e) {
      self.place(e);
    });
    const up = function () { self.pointer.held = false; };
    window.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', function () { self.pointer.inside = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  Input.prototype.place = function (e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * WOW.W;
    this.pointer.y = ((e.clientY - r.top) / r.height) * WOW.H;
    this.pointer.inside = true;
  };

  Input.prototype.down = function (code) {
    return !!this.keys[code];
  };

  Input.prototype.pressed = function (code) {
    return !!this.keys[code] && !this.prev[code];
  };

  Input.prototype.shootHeld = function () {
    return this.down('Space') || this.down('KeyZ') || this.down('KeyJ') || this.pointer.held;
  };

  Input.prototype.moveAxes = function () {
    let x = 0;
    let y = 0;
    if (this.down('ArrowLeft') || this.down('KeyA')) x -= 1;
    if (this.down('ArrowRight') || this.down('KeyD')) x += 1;
    if (this.down('ArrowUp') || this.down('KeyW')) y -= 1;
    if (this.down('ArrowDown') || this.down('KeyS')) y += 1;
    return { x: x, y: y };
  };

  Input.prototype.focusHeld = function () {
    return this.down('ShiftLeft') || this.down('ShiftRight');
  };

  Input.prototype.bombPressed = function () {
    return this.pressed('KeyX') || this.pressed('KeyC');
  };

  Input.prototype.endFrame = function () {
    this.prev = Object.assign(Object.create(null), this.keys);
    this.pointer.edge = false;
  };

  WOW.Input = Input;
})(window.WOW = window.WOW || {});
