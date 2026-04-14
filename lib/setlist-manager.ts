// ================================================================
// SETLIST MANAGER
// Auto-arrange algorithm for optimal track ordering
// ================================================================

import type { EnergyLevel } from './audio-analyzer';
import { getKeyCompatibility, getBpmCompatibility } from './audio-analyzer';

export interface Track {
  id: string;
  filename: string;
  title: string;
  bpm: number;
  key: string;
  keyName: string;
  energy: EnergyLevel;
  duration: number;
  transitionPoint: number;
  analyzing?: boolean;
  analyzeProgress?: number;
  error?: string;
}

// ----------------------------------------------------------------
// Compatibility scoring between two tracks (0–100)
// ----------------------------------------------------------------
export function compatScore(a: Track, b: Track): number {
  const keyResult = getKeyCompatibility(a.key, b.key);
  const bpmResult = getBpmCompatibility(a.bpm, b.bpm);

  // Key score (0–40)
  const keyScore =
    keyResult.level === 'perfect' ? 40 :
    keyResult.level === 'harmonic' ? 35 :
    keyResult.level === 'caution' ? 18 : 0;

  // BPM score (0–35)
  const bpmScore =
    bpmResult.level === 'perfect' ? 35 :
    bpmResult.level === 'ok' ? 22 : 5;

  // Energy flow score (0–25)
  const eScore = energyFlowScore(a.energy, b.energy);

  return keyScore + bpmScore + eScore;
}

// Evaluate how well energy transitions from A → B
function energyFlowScore(eA: EnergyLevel, eB: EnergyLevel): number {
  const EV: Record<EnergyLevel, number> = { Low: 0, Medium: 1, High: 2 };
  const diff = EV[eB] - EV[eA];
  // Prefer same or one step up; penalise large drops
  if (diff === 0) return 20;
  if (diff === 1) return 25;   // energy up = good
  if (diff === -1) return 15;  // gentle drop = ok
  if (diff === 2) return 18;   // big jump = acceptable
  return 5;                    // big drop = bad
}

// ----------------------------------------------------------------
// Desired energy curve for a set
// ----------------------------------------------------------------
function getDesiredEnergyCurve(total: number): EnergyLevel[] {
  if (total <= 4) return ['Medium', 'High', 'High', 'Medium'];
  if (total <= 8) {
    return ['Medium', 'High', 'High', 'Medium', 'High', 'High', 'Medium', 'Low'];
  }
  // Full curve for 9+
  const curve: EnergyLevel[] = ['Medium'];
  const highPeak = Math.floor(total * 0.35);
  const firstBreak = Math.floor(total * 0.45);
  const secondPeak = Math.floor(total * 0.70);
  const windDown = Math.floor(total * 0.85);

  for (let i = 1; i < total; i++) {
    if (i <= highPeak) curve.push('High');
    else if (i === firstBreak) curve.push('Medium');
    else if (i <= secondPeak) curve.push('High');
    else if (i <= windDown) curve.push('Medium');
    else curve.push('Low');
  }
  return curve.slice(0, total);
}

// ----------------------------------------------------------------
// Auto-Arrange — greedy algorithm
// ----------------------------------------------------------------
export function autoArrange(tracks: Track[]): Track[] {
  if (tracks.length <= 1) return [...tracks];

  const remaining = [...tracks];
  const curve = getDesiredEnergyCurve(tracks.length);
  const result: Track[] = [];

  // Start with first desired energy level (Medium)
  const startEnergy = curve[0];
  const startIdx = remaining.findIndex(t => t.energy === startEnergy);
  const startTrack = startIdx >= 0 ? remaining.splice(startIdx, 1)[0] : remaining.shift()!;
  result.push(startTrack);

  while (remaining.length > 0) {
    const position = result.length;
    const desiredEnergy = curve[position] ?? curve[curve.length - 1];
    const current = result[result.length - 1];

    let bestScore = -1;
    let bestIdx = 0;

    remaining.forEach((candidate, idx) => {
      let score = compatScore(current, candidate);

      // Bonus for matching desired energy
      if (candidate.energy === desiredEnergy) score += 15;
      else if (
        (desiredEnergy === 'High' && candidate.energy === 'Medium') ||
        (desiredEnergy === 'Medium' && candidate.energy !== 'Low')
      ) score += 5;

      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    result.push(remaining.splice(bestIdx, 1)[0]);
  }

  return result;
}

// ----------------------------------------------------------------
// Sort helpers
// ----------------------------------------------------------------
export function sortByBPM(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => a.bpm - b.bpm);
}

export function sortByKey(tracks: Track[]): Track[] {
  const numOf = (k: string) => parseInt(k.replace(/[AB]/, ''));
  const letOf = (k: string) => k.slice(-1);
  return [...tracks].sort((a, b) => {
    const nd = numOf(a.key) - numOf(b.key);
    if (nd !== 0) return nd;
    return letOf(a.key).localeCompare(letOf(b.key));
  });
}

// ----------------------------------------------------------------
// IndexedDB persistence
// ----------------------------------------------------------------
const DB_NAME = 'DJBounceDB';
const DB_VERSION = 1;
const LIBRARY_STORE = 'library';
const SETLIST_STORE = 'setlist';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LIBRARY_STORE)) {
        db.createObjectStore(LIBRARY_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETLIST_STORE)) {
        db.createObjectStore(SETLIST_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLibrary(tracks: Track[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LIBRARY_STORE, 'readwrite');
    const store = tx.objectStore(LIBRARY_STORE);
    store.clear();
    tracks.forEach(t => store.put(t));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadLibrary(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LIBRARY_STORE, 'readonly');
      const req = tx.objectStore(LIBRARY_STORE).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveSetlist(tracks: Track[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETLIST_STORE, 'readwrite');
    const store = tx.objectStore(SETLIST_STORE);
    store.clear();
    tracks.forEach((t, i) => store.put({ ...t, _order: i }));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadSetlist(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETLIST_STORE, 'readonly');
      const req = tx.objectStore(SETLIST_STORE).getAll();
      req.onsuccess = () => {
        const tracks = (req.result ?? []) as (Track & { _order: number })[];
        resolve(tracks.sort((a, b) => a._order - b._order));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------
// Clean filename → display title
// ----------------------------------------------------------------
export function filenameToTitle(filename: string): string {
  return filename
    .replace(/\.(mp3|wav|flac|ogg|aac|m4a)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}
