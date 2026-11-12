// Same-browser live link between the 3D demo and the phone card (no server needed).
const NAME = 'smartshuttle-live';

export function createChannel() {
  try {
    return new BroadcastChannel(NAME);
  } catch {
    return null; // very old browsers: the phone card then needs Firebase
  }
}
