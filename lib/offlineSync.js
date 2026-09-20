// Local IndexedDB caching for offline workouts

const DB_NAME = 'TemprFit_OfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_workouts';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveWorkoutLocally(workoutData) {
  if (typeof window === 'undefined' || !window.indexedDB) return false;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = `workout_${Date.now()}`;
    const payload = { id, ...workoutData, timestamp: Date.now() };
    await new Promise((resolve, reject) => {
      const req = store.put(payload);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return true;
  } catch (error) {
    console.error('Error saving workout locally:', error);
    return false;
  }
}

export async function getLocalWorkouts() {
  if (typeof window === 'undefined' || !window.indexedDB) return [];
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Error fetching local workouts:', error);
    return [];
  }
}

export async function removeLocalWorkout(id) {
  if (typeof window === 'undefined' || !window.indexedDB) return false;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return true;
  } catch (error) {
    console.error('Error removing local workout:', error);
    return false;
  }
}
