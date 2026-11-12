// APU Campus Connect routes and timetables. Edit here, then run `pnpm bake:routes` and `pnpm bake`.
// Timetables: "APU Campus Connect" schedule V1_20261022 (effective 22 Oct 2026), Monday–Friday.
// Pass prices: apu.edu.my/shuttle-services-campus-connect. Coordinates: OpenStreetMap (Nominatim / Photon).
// Not mapped yet (location not found in OpenStreetMap): APU UniStay @ Kingston Hotel, Bayu Jalil.
// Fortune Park's "(One South only)" trips are run from the Fortune Park stop until One South is located.

export const APU = { id: 'apu', name: 'APU Campus', lat: 3.0553, lon: 101.7006 };

export const STOPS = [
  APU,
  { id: 'lrt', name: 'LRT Bukit Jalil', lat: 3.0583, lon: 101.6922 },
  { id: 'parkhill', name: 'Parkhill Residence', lat: 3.05666, lon: 101.69597 },
  { id: 'fortune_park', name: 'Fortune Park', lat: 3.03695, lon: 101.70682 },
  { id: 'city_of_green', name: 'City of Green', lat: 3.04371, lon: 101.69191 },
  { id: 'maple', name: 'The Maple Residences', lat: 3.06505, lon: 101.68156 },
  { id: 'kuchai_sentral', name: 'Kuchai Sentral', lat: 3.0895, lon: 101.68458 },
  { id: 'divo', name: "D'IVO Residences", lat: 3.08715, lon: 101.67272 },
  { id: 'bloomsvale', name: 'Bloomsvale', lat: 3.07569, lon: 101.66069 },
  { id: 'harmony', name: 'The Harmony', lat: 3.08071, lon: 101.66687 },
  { id: 'm_vertica', name: 'M Vertica', lat: 3.11905, lon: 101.72701 },
];

const BUS = { vehicle: 'bus', capacity: 40 };
const VAN = { vehicle: 'van', capacity: 14 };

// pickups: boarding order on the way to APU; the return trip drops off in reverse.
// out: departures from the first pickup to APU. back: departures from APU.
// pickupOffsetMin: minutes after the first pickup's time that later pickups depart (from the PDF).
// continuous: [from, to, everyMin] — no fixed times, buses loop (LRT morning peak).
// fleet: vehicles assumed for the route (not published).
// load: share of the timetable's seats a day's riders fill (default 0.6) — sets demand per route.
export const LINES = [
  {
    id: 'lrt', code: 'LRT', name: 'LRT Bukit Jalil', pass: 'Free', color: '#2563eb', ...BUS, fleet: 4, load: 0.9,
    pickups: ['lrt'],
    continuous: ['07:30', '08:45', 6],
    out: ['07:30', '08:45', '09:00', '09:10', '09:20', '09:30', '09:50', '10:00', '10:05', '10:10', '10:15', '10:30', '10:35', '10:45', '11:00', '11:05', '11:10', '11:25', '11:40', '12:10', '12:30', '12:45', '13:00', '13:15', '13:20', '13:25', '13:40', '14:10', '14:25', '14:40', '15:05', '15:20', '15:40', '15:55', '16:10', '16:25', '17:10', '17:20', '17:30', '18:20'],
    back: ['10:35', '10:45', '11:30', '11:50', '12:10', '12:35', '12:50', '13:05', '13:10', '13:15', '13:30', '14:00', '14:15', '14:30', '14:45', '15:10', '15:20', '15:30', '15:45', '15:50', '16:00', '16:15', '16:30', '16:45', '16:50', '17:00', '17:10', '17:20', '17:30', '17:40', '18:00', '18:10', '18:15', '18:30', '18:40', '18:55', '19:15', '**20:45', '**21:45'],
  },
  {
    id: 'parkhill', code: 'PH', name: 'Parkhill', pass: 'RM70', color: '#0ea5e9', ...BUS, fleet: 1,
    pickups: ['parkhill'],
    out: ['07:45', '08:15', '08:45', '09:15', '10:15', '11:15', '13:45', '14:45'],
    back: ['11:30', '13:30', '14:30', '16:15', '17:15', '18:15', '19:15'],
  },
  {
    id: 'fortune_park', code: 'F.PARK', name: 'Fortune Park', pass: 'RM75', color: '#b45309', ...BUS, fleet: 2,
    pickups: ['fortune_park'],
    out: ['08:00', '08:15', '08:30', '09:00', '09:15', '09:30', '10:00', '10:15', '10:30', '11:00', '11:30', '12:00', '13:30', '14:30', '15:30', '16:20', '16:40', '17:40', '18:10'],
    back: ['10:30', '11:25', '12:20', '13:00', '13:15', '14:10', '15:00', '15:50', '16:00', '16:20', '16:55', '17:00', '17:30', '17:40', '18:00', '18:15', '18:40', '19:15'],
  },
  {
    id: 'city_of_green', code: 'COG', name: 'City of Green', pass: 'RM100', color: '#db2777', ...BUS, fleet: 2,
    pickups: ['city_of_green'],
    out: ['07:45', '08:20', '09:00', '09:45', '10:20', '11:00', '12:00', '13:00', '14:30', '15:00', '16:00'],
    back: ['10:35', '11:30', '12:30', '13:00', '14:00', '14:30', '15:30', '16:00', '16:30', '17:40', '18:00', '18:40', '19:00', '**20:45', '**21:45'],
  },
  {
    id: 'maple', code: 'MP', name: 'Maple', pass: 'RM100', color: '#14b8a6', ...BUS, fleet: 1,
    pickups: ['maple'],
    out: ['08:05', '10:20', '11:10', '13:10'],
    back: ['11:00', '13:00', '16:30', '18:30'],
  },
  {
    id: 'kuchai_sentral', code: 'KS', name: 'Kuchai Sentral', pass: 'RM140', color: '#0e7490', ...BUS, fleet: 1,
    pickups: ['kuchai_sentral'],
    out: ['07:45', '10:00', '11:35', '13:35'],
    back: ['11:00', '13:00', '16:30', '18:30'],
  },
  {
    id: 'divo', code: 'DV', name: "D'IVO", pass: 'RM140', color: '#e11d48', ...VAN, fleet: 1,
    pickups: ['divo'],
    out: ['07:45', '09:45', '11:25', '13:25'],
    back: ['11:00', '13:00', '16:30', '18:30'],
  },
  {
    id: 'bloomsvale', code: 'BV / HM', name: 'Bloomsvale / Harmony', pass: 'RM140', color: '#a16207', ...VAN, fleet: 2,
    pickups: ['bloomsvale', 'harmony'], pickupOffsetMin: { harmony: 10 },
    out: ['07:45', '09:30', '11:00', '13:30'],
    back: ['12:30', '13:00', '15:30', '16:30', '17:00', '17:30', '18:45'],
  },
  {
    id: 'm_vertica', code: 'MV', name: 'M Vertica', pass: 'RM140', color: '#7c3aed', ...BUS, fleet: 2,
    pickups: ['m_vertica'],
    out: ['07:45', '09:30', '10:30', '11:30', '14:30', '15:30'],
    back: ['14:00', '15:00', '16:20', '16:45', '17:45', '17:50', '18:45'],
  },
];
