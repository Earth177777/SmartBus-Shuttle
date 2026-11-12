// A small inline editor that opens next to whatever was clicked (In line counts, the clock).
let current = null;

export function closePopover() {
  current?.remove();
  current = null;
}

// opts: { label, type: 'number' | 'time', value, min, max, hint, onSubmit(value) -> true | string(error) }
export function openPopover(anchor, opts) {
  closePopover();
  const box = document.createElement('form');
  box.className = 'popover';
  box.setAttribute('role', 'dialog');
  box.innerHTML = `
    <label class="popover-label">${opts.label}</label>
    <div class="popover-row">
      <input type="${opts.type}" ${opts.min != null ? `min="${opts.min}"` : ''} ${opts.max != null ? `max="${opts.max}"` : ''} ${opts.type === 'number' ? 'step="1" inputmode="numeric"' : 'step="60"'} />
      <button type="submit" class="primary small">Set</button>
    </div>
    ${opts.hint ? `<div class="popover-hint">${opts.hint}</div>` : ''}
    <div class="popover-error" role="alert"></div>`;
  document.body.appendChild(box);
  const input = box.querySelector('input');
  input.value = opts.value ?? '';

  const r = anchor.getBoundingClientRect();
  const w = box.offsetWidth;
  const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
  const below = r.bottom + 8 + box.offsetHeight < window.innerHeight;
  box.style.left = `${left}px`;
  box.style.top = `${below ? r.bottom + 8 : Math.max(8, r.top - box.offsetHeight - 8)}px`;

  box.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = opts.onSubmit(input.value);
    if (res === true) closePopover();
    else box.querySelector('.popover-error').textContent = res || 'Not valid';
  });
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(); });
  setTimeout(() => {
    input.focus();
    input.select?.();
    const outside = (e) => {
      if (!box.isConnected) return document.removeEventListener('pointerdown', outside, true);
      if (!box.contains(e.target) && e.target !== anchor) { closePopover(); document.removeEventListener('pointerdown', outside, true); }
    };
    document.addEventListener('pointerdown', outside, true);
  });
  current = box;
  return box;
}
