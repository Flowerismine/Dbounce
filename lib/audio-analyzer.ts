// ================================================================
// AUDIO ANALYZER — BPM, Key, Energy, Structure Detection
// All processing is CLIENT-SIDE via Web Audio API
// ================================================================

export type EnergyLevel = 'Low' | 'Medium' | 'High';

export interface StructureTimestamps {
  introEnd: number;
  firstDrop: number;
  breakdown: number;
  secondDrop: number;
  outroStart: number;
}

export interface SongAnalysis {
  bpm: number;
  key: string;        // e.g. "8A"
  keyName: string;    // e.g. "Am"
  energy: EnergyLevel;
  duration: number;   // seconds
  structure: StructureTimestamps;
  transitionPoint: number; // seconds
}

// ----------------------------------------------------------------
// Camelot Wheel lookup
// ----------------------------------------------------------------
const CAMELOT_MAP: Record<string, string> = {
  '1A':'Ab min','1B':'B maj','2A':'Eb min','2B':'F# maj',
  '3A':'Bb min','3B':'Db maj','4A':'F min','4B':'Ab maj',
  '5A':'C min','5B':'Eb maj','6A':'G min','6B':'Bb maj',
  '7A':'D min','7B':'F maj','8A':'A min','8B':'C maj',
  '9A':'E min','9B':'G maj','10A':'B min','10B':'D maj',
  '11A':'F# min','11B':'A maj','12A':'Db min','12B':'E maj',
};

// Krumhansl-Schmuckler key profiles (major, minor)
const KS_MAJOR = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
const KS_MINOR = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];

// Musical pitch classes → Camelot notation
// (C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7, Ab=8, A=9, Bb=10, B=11)
const PC_TO_CAMELOT_MAJOR: string[] = [
  '8B','3B','10B','5B','12B','7B','2B','9B','4B','11B','6B','1B',
];
const PC_TO_CAMELOT_MINOR: string[] = [
  '5A','12A','7A','2A','9A','4A','11A','6A','1A','8A','3A','10A',
];

// ----------------------------------------------------------------
// BPM Detection via onset / autocorrelation
// ----------------------------------------------------------------
function detectBPM(channelData: Float32Array, sampleRate: number): number {
  // Downsample to ~11025 Hz equivalent for speed
  const decimFactor = Math.floor(sampleRate / 11025);
  const decimated: number[] = [];
  for (let i = 0; i < channelData.length; i += decimFactor) {
    decimated.push(Math.abs(channelData[i]));
  }
  const effRate = sampleRate / decimFactor;

  // Apply low-pass smoothing to get onset envelope
  const smoothed: number[] = new Array(decimated.length).fill(0);
  const smoothWindow = Math.floor(effRate * 0.01);
  for (let i = smoothWindow; i < decimated.length; i++) {
    let sum = 0;
    for (let j = 0; j < smoothWindow; j++) sum += decimated[i - j];
    smoothed[i] = sum / smoothWindow;
  }

  // Compute difference function (onset detection)
  const diff: number[] = new Array(smoothed.length).fill(0);
  for (let i = 1; i < smoothed.length; i++) {
    const d = smoothed[i] - smoothed[i - 1];
    diff[i] = d > 0 ? d : 0;
  }

  // Autocorrelation over plausible beat lag range (140–160 BPM target)
  const minLagSamples = Math.floor(effRate * 60 / 200); // 200 BPM max
  const maxLagSamples = Math.floor(effRate * 60 / 90);  // 90 BPM min
  const analysisLen = Math.min(diff.length, Math.floor(effRate * 30)); // 30s max

  let bestLag = minLagSamples;
  let bestCorr = -Infinity;

  for (let lag = minLagSamples; lag <= maxLagSamples && lag < analysisLen; lag++) {
    let corr = 0;
    const count = analysisLen - lag;
    for (let i = 0; i < count; i++) {
      corr += diff[i] * diff[i + lag];
    }
    corr /= count;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  let bpm = (effRate / bestLag) * 60;

  // Indobounce range correction
  while (bpm < 75) bpm *= 2;
  while (bpm > 200) bpm /= 2;

  // Round to nearest 0.5
  return Math.round(bpm * 2) / 2;
}

// ----------------------------------------------------------------
// Key Detection — Krumhansl-Schmuckler Algorithm
// ----------------------------------------------------------------
function computeChromagram(channelData: Float32Array, sampleRate: number): number[] {
  const chroma: number[] = new Array(12).fill(0);
  // Analyse up to 60 seconds
  const analysisLen = Math.min(channelData.length, sampleRate * 60);
  const hopSize = 4096;
  const fftSize = 8192;

  let frameCount = 0;
  for (let start = 0; start + fftSize < analysisLen; start += hopSize) {
    // Simple FFT approximation: use direct frequency bin mapping
    for (let pc = 0; pc < 12; pc++) {
      const freq = 440 * Math.pow(2, (pc - 9) / 12); // base pitch class freq
      let re = 0, im = 0;
      const step = Math.ceil(fftSize / 128);
      for (let i = 0; i < fftSize; i += step) {
        const angle = (2 * Math.PI * freq * (start + i)) / sampleRate;
        re += channelData[start + i] * Math.cos(angle);
        im += channelData[start + i] * Math.sin(angle);
      }
      // Accumulate across all octaves (3 octaves)
      for (let oct = 0; oct < 3; oct++) {
        const f2 = freq * Math.pow(2, oct);
        let r2 = 0, i2 = 0;
        for (let i = 0; i < fftSize; i += step) {
          const angle = (2 * Math.PI * f2 * (start + i)) / sampleRate;
          r2 += channelData[start + i] * Math.cos(angle);
          i2 += channelData[start + i] * Math.sin(angle);
        }
        chroma[pc] += Math.sqrt(r2 * r2 + i2 * i2);
      }
    }
    frameCount++;
    if (frameCount > 100) break; // limit for performance
  }

  // Normalise
  const max = Math.max(...chroma, 1e-10);
  return chroma.map(v => v / max);
}

function krumhanslSchmuckler(chroma: number[]): { pitchClass: number; isMajor: boolean } {
  const N = 12;
  let bestScore = -Infinity;
  let bestPC = 0;
  let bestMajor = true;

  for (let pc = 0; pc < N; pc++) {
    // Rotate chroma to align with profile
    const rotated = [...chroma.slice(pc), ...chroma.slice(0, pc)];
    const majorCorr = pearson(rotated, KS_MAJOR);
    const minorCorr = pearson(rotated, KS_MINOR);

    if (majorCorr > bestScore) { bestScore = majorCorr; bestPC = pc; bestMajor = true; }
    if (minorCorr > bestScore) { bestScore = minorCorr; bestPC = pc; bestMajor = false; }
  }

  return { pitchClass: bestPC, isMajor: bestMajor };
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const aa = a[i] - meanA, bb = b[i] - meanB;
    num += aa * bb; da += aa * aa; db += bb * bb;
  }
  return num / (Math.sqrt(da) * Math.sqrt(db) + 1e-10);
}

// ----------------------------------------------------------------
// Energy Detection
// ----------------------------------------------------------------
function detectEnergy(channelData: Float32Array): EnergyLevel {
  // RMS across whole track
  let sum = 0;
  for (let i = 0; i < channelData.length; i++) sum += channelData[i] * channelData[i];
  const rms = Math.sqrt(sum / channelData.length);

  if (rms > 0.18) return 'High';
  if (rms > 0.08) return 'Medium';
  return 'Low';
}

// ----------------------------------------------------------------
// Structure Detection
// ----------------------------------------------------------------
function detectStructure(channelData: Float32Array, sampleRate: number, duration: number): StructureTimestamps {
  const segCount = 8;
  const segLen = Math.floor(channelData.length / segCount);
  const segEnergy: number[] = [];

  for (let s = 0; s < segCount; s++) {
    let sum = 0;
    const start = s * segLen;
    for (let i = start; i < start + segLen; i++) sum += channelData[i] * channelData[i];
    segEnergy.push(Math.sqrt(sum / segLen));
  }

  const maxE = Math.max(...segEnergy);
  const normalized = segEnergy.map(e => e / maxE);

  // Find intro end (first high energy crossing)
  let introEndSeg = 1;
  for (let i = 1; i < segCount; i++) {
    if (normalized[i] > 0.6) { introEndSeg = i; break; }
  }

  // Find first drop (highest energy segment)
  const firstDropSeg = normalized.indexOf(Math.max(...normalized));

  // Find breakdown (low energy after first drop)
  let breakdownSeg = firstDropSeg + 1;
  for (let i = firstDropSeg + 1; i < segCount - 1; i++) {
    if (normalized[i] < 0.4) { breakdownSeg = i; break; }
  }

  // Find second drop (highest energy after breakdown)
  let secondDropSeg = breakdownSeg + 1;
  let maxAfterBreak = 0;
  for (let i = breakdownSeg + 1; i < segCount; i++) {
    if (normalized[i] > maxAfterBreak) { maxAfterBreak = normalized[i]; secondDropSeg = i; }
  }

  // Outro = last 2 segments
  const outroStartSeg = Math.max(segCount - 2, secondDropSeg + 1);

  const segDuration = duration / segCount;
  return {
    introEnd: introEndSeg * segDuration,
    firstDrop: firstDropSeg * segDuration,
    breakdown: breakdownSeg * segDuration,
    secondDrop: secondDropSeg * segDuration,
    outroStart: outroStartSeg * segDuration,
  };
}

// ----------------------------------------------------------------
// Main Analysis Function
// ----------------------------------------------------------------
export async function analyzeSong(
  file: File,
  onProgress: (pct: number) => void
): Promise<SongAnalysis> {
  onProgress(5);

  const arrayBuffer = await file.arrayBuffer();
  onProgress(20);

  // Decode audio
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate: 44100 });
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    ctx.close();
  }
  onProgress(40);

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // BPM
  const bpm = detectBPM(channelData, sampleRate);
  onProgress(60);

  // Key
  const chroma = computeChromagram(channelData, sampleRate);
  onProgress(75);
  const { pitchClass, isMajor } = krumhanslSchmuckler(chroma);
  const camelot = isMajor ? PC_TO_CAMELOT_MAJOR[pitchClass] : PC_TO_CAMELOT_MINOR[pitchClass];
  const keyName = CAMELOT_MAP[camelot] ?? 'Unknown';
  onProgress(85);

  // Energy
  const energy = detectEnergy(channelData);
  onProgress(92);

  // Structure
  const structure = detectStructure(channelData, sampleRate, duration);

  // Transition point = outroStart, fallback to 80% of duration
  const transitionPoint = structure.outroStart > 0
    ? structure.outroStart
    : duration * 0.80;

  onProgress(100);

  return { bpm, key: camelot, keyName, energy, duration, structure, transitionPoint };
}

// ----------------------------------------------------------------
// Key Compatibility Checker
// ----------------------------------------------------------------
export function getKeyCompatibility(keyA: string, keyB: string): { level: 'perfect' | 'harmonic' | 'caution' | 'clash'; label: string } {
  if (!keyA || !keyB) return { level: 'clash', label: 'Data tidak lengkap' };

  const numA = parseInt(keyA.replace(/[AB]/, ''));
  const numB = parseInt(keyB.replace(/[AB]/, ''));
  const letterA = keyA.slice(-1);
  const letterB = keyB.slice(-1);

  if (keyA === keyB) return { level: 'perfect', label: `${keyA} → ${keyB} (Identik)` };
  if (numA === numB && letterA !== letterB) return { level: 'harmonic', label: `${keyA} → ${keyB} (Harmonis)` };

  const diff = Math.abs(numA - numB);
  const circDiff = Math.min(diff, 12 - diff);

  if (circDiff === 1 && letterA === letterB) return { level: 'harmonic', label: `${keyA} → ${keyB} (Harmonis)` };
  if (circDiff <= 2) return { level: 'caution', label: `${keyA} → ${keyB} (Hati-hati)` };
  return { level: 'clash', label: `${keyA} → ${keyB} (Clash)` };
}

export function getBpmCompatibility(bpmA: number, bpmB: number): { level: 'perfect' | 'ok' | 'hard'; diff: number } {
  const diff = Math.abs(bpmA - bpmB);
  if (diff <= 3) return { level: 'perfect', diff };
  if (diff <= 7) return { level: 'ok', diff };
  return { level: 'hard', diff };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getCamelotMap(): Record<string, string> {
  return { ...CAMELOT_MAP };
}
