// Webcam stop box (pitch slide 6/12: "laptop webcam as the stop box").
// Detects people on this device and feeds the count into a stop's line. No images leave the browser.
import { countPeople, smoothCount } from '../sim/camera-count.js';
import { icon } from './icons.js';

const TICK_MS = 700;
const SMOOTH_N = 5;
const MIN_SCORE = 0.5;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createCameraBox(app, { lines, stops }) {
  const pickups = lines.flatMap((l) => l.pickups.map((id) => ({ id, code: l.code })));
  const box = document.createElement('section');
  box.className = 'camera-box';
  box.hidden = true;
  box.innerHTML = `
    <header><b>${icon('camera', 16)} Stop box camera</b><button class="ghost small" data-c="close" aria-label="Close camera">${icon('no', 14)}</button></header>
    <div class="cam-view"><video playsinline muted></video><canvas></canvas></div>
    <label class="cam-row">Counts the line at
      <select data-c="stop">${pickups.map((p) => `<option value="${p.id}">${esc(stops[p.id].name)} · ${esc(p.code)}</option>`).join('')}</select>
    </label>
    <div class="cam-count"><b data-c="count">–</b><span data-c="status">Starting…</span></div>
    <p class="cam-note">Runs on this device: only the count is used, no photos are stored or sent.</p>`;
  document.body.appendChild(box);
  const $ = (k) => box.querySelector(`[data-c="${k}"]`);
  const video = box.querySelector('video');
  const canvas = box.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  let stream = null;
  let model = null;
  let timer = null;
  const recent = [];

  function setStatus(text) { $('status').textContent = text; }

  async function loadModel() {
    if (model) return model;
    setStatus('Loading person detector…');
    const [, cocoSsd] = await Promise.all([import('@tensorflow/tfjs'), import('@tensorflow-models/coco-ssd')]);
    model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    return model;
  }

  function draw(preds) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.font = 'bold 16px system-ui, sans-serif';
    for (const p of preds) {
      if (p.class !== 'person' || p.score < MIN_SCORE) continue;
      const [x, y, w, h] = p.bbox;
      ctx.strokeStyle = '#22c55e';
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`${Math.round(p.score * 100)}%`, x + 4, y + 18);
    }
  }

  async function tick() {
    if (!stream || !model || video.readyState < 2) return;
    const preds = await model.detect(video);
    draw(preds);
    recent.push(countPeople(preds, MIN_SCORE));
    if (recent.length > SMOOTH_N) recent.shift();
    const n = smoothCount(recent);
    const stopId = $('stop').value;
    app.setQueue(stopId, n);
    $('count').textContent = n;
    setStatus(`${n === 1 ? 'person' : 'people'} in line → ${stops[stopId].name}`);
  }

  async function open(stopId) {
    box.hidden = false;
    if (stopId && box.querySelector(`option[value="${stopId}"]`)) $('stop').value = stopId;
    if (stream) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser has no camera access.');
      setStatus('Asking for camera…');
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      video.srcObject = stream;
      await video.play();
      await loadModel();
      setStatus('Step in front of the camera to join the line');
      timer = setInterval(() => { tick().catch((e) => setStatus(`Detector error: ${e.message}`)); }, TICK_MS);
    } catch (err) {
      setStatus(err.name === 'NotAllowedError' ? 'Camera blocked — allow camera access for this page.' : `Camera unavailable: ${err.message}`);
      stopStream();
    }
  }

  function stopStream() {
    clearInterval(timer);
    timer = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    recent.length = 0;
  }

  function close() {
    stopStream();
    box.hidden = true;
  }

  $('close').addEventListener('click', close);
  return { open, close, get running() { return !!stream; } };
}
