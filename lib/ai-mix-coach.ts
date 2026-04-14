import type { Track } from './setlist-manager';
import { getCompatibilityBreakdown } from './compatibility';

export interface AiMixInsight {
  headline: string;
  summary: string;
  cues: string[];
}

function getEnergyNarrative(a: Track, b: Track): string {
  if (a.energy === b.energy) return `Energi ${a.energy.toLowerCase()} ke ${b.energy.toLowerCase()} menjaga lantai tetap stabil.`;
  if (a.energy === 'Low' && b.energy === 'High') return 'Ini adalah momentum lift besar — timing drop harus presisi supaya crowd ikut naik.';
  if (a.energy === 'High' && b.energy === 'Low') return 'Gunakan transisi ini sebagai breathing space supaya set tidak terasa terlalu padat.';
  if (a.energy === 'Medium' && b.energy === 'High') return 'Pasangan ini ideal untuk buildup menuju peak-time section.';
  if (a.energy === 'High' && b.energy === 'Medium') return 'Turunkan energi secara elegan dengan filter atau echo tail agar groove tetap terjaga.';
  return 'Perubahan energi moderat — fokus di phrasing 8/16 bar agar perpindahan tetap natural.';
}

export function getAiMixInsight(a: Track, b: Track, position: number, totalTransitions: number): AiMixInsight {
  const breakdown = getCompatibilityBreakdown(a, b);
  const section = position <= Math.max(1, Math.ceil(totalTransitions * 0.3))
    ? 'opening'
    : position >= Math.max(1, Math.floor(totalTransitions * 0.75))
      ? 'closing'
      : 'peak';

  const headline =
    breakdown.score >= 85 ? 'AI Coach: Green-light transition' :
    breakdown.score >= 70 ? 'AI Coach: Crowd-safe blend' :
    breakdown.score >= 50 ? 'AI Coach: Manual finesse needed' :
    'AI Coach: Use FX to mask the jump';

  const summary = `${getEnergyNarrative(a, b)} Skor kompatibilitas ${breakdown.score}/100 dengan fokus utama pada ${breakdown.bpmDiff <= 3 ? 'beatmatch yang aman' : 'penyesuaian BPM'} dan relasi key ${breakdown.keyLabel.toLowerCase()}.`;

  const cues = [
    section === 'opening'
      ? 'Opening cue: biarkan intro track berikutnya terdengar tipis dulu sebelum bass masuk.'
      : section === 'closing'
        ? 'Closing cue: sisakan ruang napas 4–8 bar agar penonton merasa set mulai landing dengan halus.'
        : 'Peak cue: jaga tensi dengan EQ swap di phrase boundary, jangan terlalu cepat membuka full volume.',
    breakdown.bpmDiff <= 3
      ? 'Beatmatch cue: cukup dorong nudging kecil, tidak perlu pitch correction agresif.'
      : breakdown.bpmDiff <= 7
        ? 'Beatmatch cue: lock groove di breakdown lebih dulu, baru naikkan volume track tujuan.'
        : 'Beatmatch cue: pertimbangkan echo-out atau hard reset karena gap BPM cukup jauh.',
    breakdown.score >= 70
      ? 'Crowd cue: transisi ini aman untuk tetap menjaga momentum dancefloor.'
      : 'Crowd cue: gunakan filter, loop, atau reverb tail untuk menyamarkan perpindahan yang terasa kontras.',
  ];

  return { headline, summary, cues };
}
