// Pitch slide 7: call another bus when the line is longer than one bus (one at a time).
export function needsExtraBus(queue, capacity, extraInFlight) {
  return queue > capacity && !extraInFlight;
}
