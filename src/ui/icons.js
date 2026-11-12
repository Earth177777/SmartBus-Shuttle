// Hugeicons (free, stroke-rounded) rendered as inline SVG strings.
import {
  Alert02Icon,
  AiBrain01Icon,
  Analytics01Icon,
  Bus01Icon,
  Cancel01Icon,
  Clock01Icon,
  DatabaseIcon,
  Download04Icon,
  HelpCircleIcon,
  PauseIcon,
  PencilEdit02Icon,
  PlayIcon,
  Settings02Icon,
  Tick02Icon,
  TrafficLightIcon,
  MapsLocation01Icon,
} from '@hugeicons/core-free-icons';

const ICONS = {
  alert: Alert02Icon,
  logic: AiBrain01Icon,
  analytics: Analytics01Icon,
  bus: Bus01Icon,
  no: Cancel01Icon,
  clock: Clock01Icon,
  database: DatabaseIcon,
  download: Download04Icon,
  help: HelpCircleIcon,
  pause: PauseIcon,
  edit: PencilEdit02Icon,
  play: PlayIcon,
  settings: Settings02Icon,
  yes: Tick02Icon,
  traffic: TrafficLightIcon,
  map: MapsLocation01Icon,
};

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function icon(name, size = 16, cls = '') {
  const def = ICONS[name];
  if (!def) return '';
  const body = def
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${kebab(k)}="${v}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
  return `<svg class="hgi ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;
}
