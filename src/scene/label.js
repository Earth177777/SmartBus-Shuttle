import * as THREE from 'three';

const SCREEN_HEIGHT = 0.032; // label height as a share of the viewport, at scale 1

// Text sprite that always faces the camera and keeps the same on-screen size at any zoom.
export function makeLabel(text, { bg = '#111827', fg = '#ffffff', scale = 1 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }),
  );
  sprite.renderOrder = 10;
  let current = null;

  function set(value) {
    if (value === current) return;
    current = value;
    const font = 'bold 40px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(value).width) + 36;
    // GPU texture storage is fixed-size: drop it when the canvas size changes.
    if (canvas.width !== w) tex.dispose();
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
    const hgt = SCREEN_HEIGHT * scale;
    sprite.userData.base = { x: (w / 64) * hgt, y: hgt };
    applyParentScale();
  }
  // Labels inside a scaled group (pins, buses) cancel that scale so text stays the same size.
  let parentScale = 1;
  function applyParentScale(k = parentScale) {
    parentScale = k;
    const b = sprite.userData.base;
    if (b) sprite.scale.set(b.x / k, b.y / k, 1);
  }
  sprite.userData.setParentScale = applyParentScale;
  set(text);
  sprite.userData.setText = set;
  return sprite;
}
