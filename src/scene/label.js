import * as THREE from 'three';

// Text sprite that always faces the camera and keeps a constant screen-ish size.
export function makeLabel(text, { bg = '#111827', fg = '#ffffff', scale = 1 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sprite.renderOrder = 10;

  function set(value) {
    const font = 'bold 40px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(value).width) + 36;
    canvas.width = w;
    canvas.height = 64;
    ctx.font = font;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, 64, 18);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textBaseline = 'middle';
    ctx.fillText(value, 18, 34);
    tex.needsUpdate = true;
    sprite.scale.set((w / 64) * 22 * scale, 22 * scale, 1);
  }
  set(text);
  sprite.userData.setText = set;
  return sprite;
}
