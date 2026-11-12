// Guided tour (driver.js): the SmartShuttle pitch, then every part of this demo.
// Content follows the team's deck "APU SmartShuttle — Cloud Innovation Hackathon 2026".
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { icon } from './icons.js';

const SEEN_KEY = 'smartshuttle.tourSeen.v1';

export function createTour({ panel, world, app }) {
  const tab = (id) => () => panel.selectTab(id);

  const steps = [
    {
      popover: {
        title: `${icon('bus', 20)} SmartShuttle`,
        description:
          'Crowd-aware buses, smart queues and live ETAs for every APU student — our entry for APU Cloud Innovation Hackathon 2026 (Problem 01: Smart Campus, with Problem 03 value: data-driven decisions).<br><br>This tour explains the idea and every part of this demo. Use → or click Next.',
      },
    },
    {
      element: '#map',
      popover: {
        title: 'The problem',
        description:
          'APU\'s own shuttle page admits it runs on guesswork: <i>“APU does not guarantee a seat”</i>, and at peak <i>“buses may not follow the published schedules.”</i> The LRT shuttle runs 79 fixed trips a day and 7:30–8:45 is <b>continuous, not by schedule</b>. No live location, no queue visibility, no crowd data.',
        side: 'over',
      },
      onHighlightStarted: () => world.overview(),
    },
    {
      element: '#map',
      popover: {
        title: 'The network, on real roads',
        description:
          'Every coloured line is a real Campus Connect route, routed on OpenStreetMap roads with one-way streets (OSRM). Buses run APU\'s <b>real weekday timetable</b> (effective 22 Oct 2026). Drag to rotate, scroll to zoom, click a stop or bus to follow it.',
        side: 'over',
      },
    },
    {
      element: '.panel',
      popover: {
        title: 'Our solution: three cheap devices',
        description:
          '<b>1 · Stop box</b> — a camera + screen at each line: checks riders in, counts the line, shows the ETA.<br><b>2 · Bus tracker</b> — a pocket GPS radio on each bus.<br><b>3 · APU antenna</b> — one LoRaWAN gateway collects everything as planning data.<br><br>In this demo the people at stops are the stop-box counts, the moving buses are the trackers, and the Firebase tab is what the antenna stores.',
        side: 'left',
      },
      onHighlightStarted: tab('live'),
    },
    {
      element: '.hud',
      popover: {
        title: 'Time & traffic — click to change',
        description:
          'Click the clock in the corner to jump to any time from 06:30 to 22:30 — the whole day replays up to that moment. Below it is the traffic level for that hour (KL weekday model: heavy 7:30–9:00 and 17:30–19:00).',
        side: 'bottom',
      },
    },
    {
      element: '[data-k="screen"]',
      popover: {
        title: 'ETA screen at every stop',
        description:
          'The stop box screen from our deck: <b>Next bus</b> + ETA from live bus GPS, <b>In line</b> from the line camera, and <b>Status</b> Ongoing · Waiting · Offline. At APU it becomes a departures board for every route home. Alerts appear when an extra bus is called or a bus reroutes.',
        side: 'left',
      },
      onHighlightStarted: tab('live'),
    },
    {
      element: '[data-k="screen"]',
      popover: {
        title: 'Smart queue — try it',
        description:
          'Students just join their route\'s line; the face check-in timestamps each place in line (no app, no photos stored, consent once in APSpace). Here you can play the camera: <b>click any “In line” number</b> and type how many people are waiting.',
        side: 'left',
      },
    },
    {
      element: '[data-k="stats"]',
      popover: {
        title: 'Today so far',
        description: 'Riders boarded, extra buses called when a line overflowed, reroutes made by passing buses, and trips that left late.',
        side: 'left',
      },
    },
    {
      element: '[data-pane="logic"]',
      popover: {
        title: 'Logic: how every decision is made',
        description:
          'Our deck\'s <b>smart stop</b>, generalised: a bus with free seats pulls in at another route\'s crowded stop on its road only if <b>excess ≥ 5</b>, <b>free seats ≥ 3</b>, <b>detour ≤ 4 min</b> and <b>delay + detour ≤ 8 min</b> (the promised-ETA buffer). Each decision is shown with its real numbers and which checks passed.',
        side: 'left',
      },
      onHighlightStarted: tab('logic'),
    },
    {
      element: '[data-pane="analytics"]',
      popover: {
        title: 'Analytics: the real product is the data',
        description:
          'Buses deployed now and at peak, average and longest wait, on-time trips, seats filled, riders by hour and per route — the evidence APU needs for its next decision.',
        side: 'left',
      },
      onHighlightStarted: tab('analytics'),
    },
    {
      element: '[data-k="optimizer"]',
      popover: {
        title: 'Fleet optimizer',
        description:
          'Set a <b>max buses</b> cap and press Optimize: it replays the whole weekday for every route and finds the fewest buses that still run every trip with ≤10% more than 5 min late. If the cap is tight it trims the routes that suffer least. “Apply to routes” runs the day with that fleet.',
        side: 'left',
      },
    },
    {
      element: '[data-pane="firebase"]',
      popover: {
        title: 'Firebase → BigQuery',
        description:
          'Our lean Google Cloud stack: Firebase for live screens, BigQuery + Looker Studio for planning. This tab shows the documents written — <code>queue_events</code>, <code>ride_events</code>, <code>gps_events</code>, <code>trips</code> with our BigQuery field names — and the SQL behind each number. Export JSON to load it into BigQuery. (Simulated here; not connected.)',
        side: 'left',
      },
      onHighlightStarted: tab('firebase'),
    },
    {
      element: '[data-pane="edit"]',
      popover: {
        title: 'Retune the timetable',
        description:
          'Change any route\'s times, number of buses and seats, or switch it off, then watch the effect. This is the “timetable retuned every month” idea from our deck — edits are saved in this browser; Reset brings back APU\'s schedule.',
        side: 'left',
      },
      onHighlightStarted: tab('edit'),
    },
    {
      element: '.controls',
      popover: {
        title: 'Speed',
        description: '1× real time, 10×, or 60× to watch a whole rush hour in a minute.',
        side: 'top',
      },
      onHighlightStarted: tab('live'),
    },
    {
      popover: {
        title: 'Roadmap',
        description:
          '<b>Hackathon demo (17 Nov)</b> — laptop webcam as the stop box, simulated buses on real routes (this).<br><b>Pilot, one semester</b> — LRT ↔ APU: 2 stop boxes, 4 trackers, 1 antenna, ~RM 3,550, RM 0 monthly data.<br><b>Scale</b> — a stop box per route, a tracker on every bus.<br><br><i>Less waiting. Fuller buses. Better plans.</i> — Gilbert · Herbert Valentino · Louis · Nicholas',
      },
      onHighlightStarted: () => world.overview(),
    },
  ];

  const tour = driver({
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.55,
    stagePadding: 6,
    popoverClass: 'ss-tour',
    steps,
    onDestroyed: () => {
      app.paused = app.pausedBeforeTour ?? false;
      panel.selectTab('live');
      try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* storage unavailable */ }
    },
  });

  function start() {
    app.pausedBeforeTour = app.paused;
    tour.drive();
  }
  function startIfFirstVisit() {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch { seen = false; }
    if (!seen) setTimeout(start, 600);
  }
  return { start, startIfFirstVisit };
}
