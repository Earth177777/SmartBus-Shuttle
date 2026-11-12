// Pitch slide 9: a Parkhill bus stops at the LRT only if ALL are true.
export function shouldStopAtLrt({ lrtQueue, nextLrtBusSeats, freeSeats, viaLrtEtaSec, promisedEtaSec }) {
  return lrtQueue > nextLrtBusSeats && freeSeats > 0 && viaLrtEtaSec <= promisedEtaSec;
}

// Pitch slide 7: call a 2nd bus when the line is longer than one bus (one at a time).
export function needsExtraBus(queue, capacity, extraInFlight) {
  return queue > capacity && !extraInFlight;
}
