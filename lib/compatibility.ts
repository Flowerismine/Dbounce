import type { EnergyLevel } from './audio-analyzer';
import type { Track } from './setlist-manager';
import { getBpmCompatibility, getKeyCompatibility } from './audio-analyzer';

export interface CompatibilityBreakdown {
  score: number;
  keyScore: number;
  bpmScore: number;
  energyScore: number;
  level: 'stellar' | 'smooth' | 'usable' | 'risky';
  label: string;
  bpmDiff: number;
  keyLabel: string;
}

export function getEnergyFlowScore(a: EnergyLevel, b: EnergyLevel): number {
  const scale: Record<EnergyLevel, number> = { Low: 0, Medium: 1, High: 2 };
  const diff = scale[b] - scale[a];
  if (diff === 0) return 20;
  if (diff === 1) return 25;
  if (diff === -1) return 15;
  if (diff === 2) return 18;
  return 5;
}

export function getCompatibilityBreakdown(a: Pick<Track, 'bpm' | 'key' | 'energy'>, b: Pick<Track, 'bpm' | 'key' | 'energy'>): CompatibilityBreakdown {
  const keyResult = getKeyCompatibility(a.key, b.key);
  const bpmResult = getBpmCompatibility(a.bpm, b.bpm);
  const energyScore = getEnergyFlowScore(a.energy, b.energy);

  const keyScore =
    keyResult.level === 'perfect' ? 40 :
    keyResult.level === 'harmonic' ? 35 :
    keyResult.level === 'caution' ? 18 : 0;

  const bpmScore =
    bpmResult.level === 'perfect' ? 35 :
    bpmResult.level === 'ok' ? 22 : 5;

  const score = Math.max(0, Math.min(100, keyScore + bpmScore + energyScore));

  const meta =
    score >= 85 ? { level: 'stellar' as const, label: 'Festival-ready blend' } :
    score >= 70 ? { level: 'smooth' as const, label: 'Smooth transition' } :
    score >= 50 ? { level: 'usable' as const, label: 'Needs careful timing' } :
    { level: 'risky' as const, label: 'High-risk handoff' };

  return {
    score,
    keyScore,
    bpmScore,
    energyScore,
    level: meta.level,
    label: meta.label,
    bpmDiff: bpmResult.diff,
    keyLabel: keyResult.label,
  };
}

export function getAverageCompatibility(tracks: Track[]): number {
  if (tracks.length < 2) return 0;
  const scores = tracks.slice(1).map((track, index) => getCompatibilityBreakdown(tracks[index], track).score);
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}
