// Optional Firestore sync for the phone view. Loaded lazily so the offline demo never downloads Firebase.
//   live/state ← the latest snapshot (every SNAPSHOT_MS)
import { firebaseConfig, firestoreEmulator } from './firebase.config.js';

const SNAPSHOT_MS = 2000;

export const firebaseEnabled = () => !!firebaseConfig;

let fs = null; // { db, doc, setDoc, onSnapshot, ... }
async function connect() {
  if (fs || !firebaseConfig) return fs;
  const [{ initializeApp }, store] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
  const app = initializeApp(firebaseConfig);
  const db = store.getFirestore(app);
  if (firestoreEmulator) {
    const [host, port] = firestoreEmulator.split(':');
    store.connectFirestoreEmulator(db, host, Number(port));
  }
  fs = { db, ...store };
  return fs;
}

// Writer: call push(snapshot) as often as you like; it throttles itself.
export function createFirebaseWriter() {
  const status = { enabled: firebaseEnabled(), projectId: firebaseConfig?.projectId ?? null, lastWrite: null, error: null, written: 0 };
  let last = 0;
  let busy = false;

  async function push(snapshot) {
    if (!status.enabled || busy || Date.now() - last < SNAPSHOT_MS) return;
    busy = true;
    try {
      const f = await connect();
      await f.setDoc(f.doc(f.db, 'live', 'state'), { ...snapshot, updatedAt: new Date().toISOString() });
      last = Date.now();
      status.lastWrite = new Date();
      status.error = null;
      status.written++;
    } catch (err) {
      status.error = String(err.message ?? err).slice(0, 160);
    } finally {
      busy = false;
    }
  }
  return { status, push };
}

// Reader for the phone card: calls onState(snapshot) whenever live/state changes.
export async function subscribeFirebase(onState, onError) {
  const f = await connect();
  if (!f) return null;
  return f.onSnapshot(f.doc(f.db, 'live', 'state'), (d) => d.exists() && onState(d.data()), (e) => onError?.(e));
}
