'use client';

import type { EnergyLevel } from '@/lib/audio-analyzer';

export function EnergyBadge({ energy }: { energy: EnergyLevel }) {
  const map: Record<EnergyLevel, { cls: string; label: string }> = {
    High:   { cls: 'badge-magenta', label: 'High Energy' },
    Medium: { cls: 'badge-orange',  label: 'Medium Energy' },
    Low:    { cls: 'badge-cyan',    label: 'Low Energy' },
  };
  const { cls, label } = map[energy];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function CamelotBadge({ camelot, keyName }: { camelot: string; keyName: string }) {
  if (!camelot) return null;
  return <span className="badge badge-cyan">{camelot} · {keyName}</span>;
}

export function BpmBadge({ bpm }: { bpm: number }) {
  return <span className="badge badge-magenta">{bpm > 0 ? bpm.toFixed(1) : '--'} BPM</span>;
}

export function CompatBpmBadge({ bpmA, bpmB }: { bpmA: number; bpmB: number }) {
  const diff = Math.abs(bpmA - bpmB);
  if (diff <= 3) {
    return <span className="compat-ok"><OkIcon /> BPM: {diff === 0 ? 'Perfect match' : `+/- ${diff.toFixed(1)}`}</span>;
  }
  if (diff <= 7) {
    return <span className="compat-warn"><WarnIcon /> BPM: +/- {diff.toFixed(1)}</span>;
  }
  return <span className="compat-bad"><BadIcon /> BPM: +/- {diff.toFixed(1)}</span>;
}

export function CompatKeyBadge({ keyA, keyB }: { keyA: string; keyB: string }) {
  if (!keyA || !keyB) return null;
  const numA = parseInt(keyA.replace(/[AB]/, ''));
  const numB = parseInt(keyB.replace(/[AB]/, ''));
  const letterA = keyA.slice(-1);
  const letterB = keyB.slice(-1);

  if (keyA === keyB) {
    return <span className="compat-ok"><OkIcon /> Key: {keyA} identical</span>;
  }
  if (numA === numB && letterA !== letterB) {
    return <span className="compat-ok"><OkIcon /> Key: {keyA} → {keyB} relative</span>;
  }

  const diff = Math.abs(numA - numB);
  const circDiff = Math.min(diff, 12 - diff);

  if (circDiff === 1 && letterA === letterB) {
    return <span className="compat-ok"><OkIcon /> Key: {keyA} → {keyB} adjacent</span>;
  }
  if (circDiff <= 2) {
    return <span className="compat-warn"><WarnIcon /> Key: {keyA} → {keyB} caution</span>;
  }
  return <span className="compat-bad"><BadIcon /> Key: {keyA} → {keyB} clash</span>;
}

function OkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function BadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}
