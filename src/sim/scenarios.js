// One-click "what if" days. Each scenario multiplies demand and traffic by time of day.
const h = (sec) => sec / 3600;
const between = (sec, a, b) => h(sec) >= a && h(sec) < b;

export const SCENARIOS = [
  {
    id: 'normal',
    name: 'Normal day',
    icon: 'bus',
    description: 'A regular weekday on APU\'s timetable.',
    demand: () => 1,
    traffic: () => 1,
  },
  {
    id: 'exam',
    name: 'Exam week',
    icon: 'exam',
    description: 'Everyone comes in early for 9 AM papers and leaves right after the 12 PM and 4 PM papers end.',
    demand: (lineId, dir, sec) => {
      if (dir === 'out') return between(sec, 7, 9) ? 1.5 : 0.8;
      return between(sec, 12, 13.5) || between(sec, 16, 17.5) ? 1.8 : 0.7;
    },
    traffic: () => 1,
  },
  {
    id: 'rain',
    name: 'Heavy rain',
    icon: 'rain',
    description: 'Nobody walks: more riders on every route, and traffic crawls all day.',
    demand: () => 1.3,
    traffic: (sec) => (between(sec, 7, 10) || between(sec, 16.5, 20) ? 1.4 : 1.2),
  },
  {
    id: 'stadium',
    name: 'Stadium event',
    icon: 'stadium',
    description: 'A match at Bukit Jalil National Stadium: evening roads around the LRT jam and the LRT line home overflows.',
    demand: (lineId, dir, sec) => (lineId === 'lrt' && dir === 'back' && between(sec, 16.5, 20) ? 1.8 : 1),
    traffic: (sec) => (between(sec, 16.5, 21) ? 1.5 : 1),
  },
  {
    id: 'lrt_delay',
    name: 'LRT delay',
    icon: 'train',
    description: 'Trains bunch up in the morning: crowds pour out of Bukit Jalil LRT at once.',
    demand: (lineId, dir, sec) => (lineId === 'lrt' && dir === 'out' && between(sec, 7.5, 9.5) ? 2 : 1),
    traffic: () => 1,
  },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}
