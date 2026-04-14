// ================================================================
// TRANSITION ENGINE
// Recommends DJ transition techniques based on energy & BPM
// ================================================================

import type { EnergyLevel } from './audio-analyzer';

export interface TransitionStep {
  text: string;
}

export interface TransitionRecommendation {
  technique: string;
  steps: string[];
  tips: string;
  duration: string;
  keyAdvice: string;
}

export interface TrackPair {
  energyA: EnergyLevel;
  energyB: EnergyLevel;
  bpmA: number;
  bpmB: number;
  keyA: string;
  keyB: string;
}

// ----------------------------------------------------------------
// Key advice per compatibility level
// ----------------------------------------------------------------
function getKeyAdvice(keyA: string, keyB: string): string {
  const numA = parseInt(keyA.replace(/[AB]/, ''));
  const numB = parseInt(keyB.replace(/[AB]/, ''));
  const letterA = keyA.slice(-1);
  const letterB = keyB.slice(-1);

  if (keyA === keyB) return 'Key identik — transisi akan sangat smooth secara harmoni.';

  const diff = Math.abs(numA - numB);
  const circDiff = Math.min(diff, 12 - diff);
  if (numA === numB && letterA !== letterB) return 'Key bersebelahan di Camelot Wheel — akan terdengar sangat harmonis.';
  if (circDiff === 1 && letterA === letterB) return 'Key bersebelahan di Camelot Wheel — sangat aman untuk transisi.';
  if (circDiff <= 2) return 'Key agak jauh — pertimbangkan untuk masuk di bagian breakdown agar telinga bisa beradaptasi.';
  return `Key clash (${keyA} → ${keyB}) — masuk di saat energy rendah atau breakdown untuk meminimalisir ketidakharmonisan.`;
}

// ----------------------------------------------------------------
// Main recommendation function
// ----------------------------------------------------------------
export function recommendTransition(pair: TrackPair): TransitionRecommendation {
  const { energyA, energyB, bpmA, bpmB, keyA, keyB } = pair;
  const bpmDiff = Math.abs(bpmA - bpmB);
  const keyAdvice = getKeyAdvice(keyA, keyB);

  if (bpmDiff > 7) {
    return {
      technique: 'Hard Reset (Echo + Cut)',
      steps: [
        'Aktifkan Echo/Delay effect di Track A dan putar volume echo ke max.',
        'Fade out Track A secara perlahan — biarkan echo bergema.',
        'Tunggu 2–3 detik silence agar telinga "reset".',
        `Drop Track B langsung di bagian yang kuat (drop/hook) — pastikan BPM ${bpmB} sudah terkunci di pitch fader edjing.`,
      ],
      tips: `BPM berbeda jauh (selisih ${bpmDiff.toFixed(1)} BPM) — jeda silence akan me-reset ekspektasi telinga penonton sehingga perubahan BPM terasa natural.`,
      duration: '~8 detik',
      keyAdvice,
    };
  }

  if (bpmDiff > 3) {
    return {
      technique: 'Breakdown Bridge',
      steps: [
        'Tunggu bagian breakdown Track A (energi rendah / low section).',
        'Saat breakdown, mulai play intro Track B di volume rendah.',
        'Gunakan pitch fader di edjing untuk gradual match BPM Track B ke Track A.',
        'Naikkan volume Track B, fade out Track A saat BPM sudah tersync.',
      ],
      tips: `BPM selisih ${bpmDiff.toFixed(1)} BPM — gunakan breakdown sebagai jembatan. Edjing memiliki pitch sync yang bisa membantu penyesuaian BPM secara gradual.`,
      duration: '~35 detik',
      keyAdvice,
    };
  }

  // bpmDiff <= 3: energy-based recommendations
  if (energyA === 'High' && energyB === 'High') {
    return {
      technique: 'Bass Swap (EQ Transition)',
      steps: [
        'Sync Track B di headphone — pastikan beatgrid sudah terkunci rapi.',
        'Play Track B dari awal dengan volume rendah (fader di 30%).',
        'Naikkan volume Track B perlahan selama 8 bar.',
        'Swap bass: cut Low EQ Track A hingga nol, boost Low EQ Track B ke penuh.',
        'Fade out Track A selama 8 bar berikutnya — crossfader ke Track B.',
      ],
      tips: 'Kedua track high energy — jaga momentum! Jangan biarkan ada gap atau drop energi. Bass swap yang rapi akan membuat transisi terasa seamless.',
      duration: '~30 detik',
      keyAdvice,
    };
  }

  if (energyA === 'High' && energyB === 'Medium') {
    return {
      technique: 'Filter Sweep + Fade',
      steps: [
        'Aktifkan Low Pass Filter di Track A — putar filter secara gradual.',
        'Saat filter sudah hampir full (suara jadi muffled), mulai play Track B volume medium.',
        'Naikkan volume Track B sambil terus fade out Track A.',
        'Lepas filter di Track B jika ada untuk restore full frequency.',
      ],
      tips: 'Turunkan energi secara smooth — jangan drop mendadak. Filter sweep memberi sinyal audial bahwa energi sedang berubah.',
      duration: '~25 detik',
      keyAdvice,
    };
  }

  if (energyA === 'Medium' && energyB === 'High') {
    return {
      technique: 'Build & Drop',
      steps: [
        'Tunggu bagian breakdown/low section Track A.',
        'Saat breakdown Track A, mulai play intro Track B (biarkan buildup terdengar).',
        'Layer keduanya — biarkan anticipation build-up Track B terdengar.',
        'Cut Track A tepat saat drop Track B masuk — full volume!',
        'Biarkan Track B take over sepenuhnya untuk maksimal impact.',
      ],
      tips: 'Naikkan energi — biarkan penonton anticipate the drop. Timing cut yang tepat di momen drop akan menciptakan efek yang sangat impactful.',
      duration: '~20 detik',
      keyAdvice,
    };
  }

  if (energyA === 'Low' && energyB === 'Low') {
    return {
      technique: 'Long Crossfade',
      steps: [
        'Mulai play Track B dengan volume sangat rendah.',
        'Crossfade perlahan selama 16–32 bar — tidak perlu terburu-buru.',
        'Fade out Track A secara gradual sambil Track B semakin terdengar.',
        'Biarkan Track B ambil alih sepenuhnya dengan natural.',
      ],
      tips: 'Transisi ambient — biarkan mengalir natural. Tidak perlu teknik khusus, yang penting smooth dan tidak ada dead air.',
      duration: '~45 detik',
      keyAdvice,
    };
  }

  if (energyA === 'Medium' && energyB === 'Medium') {
    return {
      technique: 'EQ Blend',
      steps: [
        'Play Track B, tapi cut Low EQ dan Mid EQ Track B ke nol.',
        'Blend hi-hats dan tops Track B dengan groove Track A.',
        'Gradual swap: naikkan Low EQ Track B perlahan, turunkan Low EQ Track A.',
        'Terakhir naikkan Mid EQ Track B, fade out Track A sepenuhnya.',
      ],
      tips: 'Smooth blend — maintain the groove. EQ blend yang baik membuat penonton tidak sadar kalau track sudah berganti.',
      duration: '~30 detik',
      keyAdvice,
    };
  }

  if (energyA === 'Low' && energyB === 'High') {
    return {
      technique: 'Silent Drop / Hard Cut',
      steps: [
        'Biarkan Track A fade out sampai hampir hening — volume sangat rendah.',
        'Beri jeda 1–2 detik silence penuh (ini adalah momen tension).',
        'Drop Track B langsung di bagian drop/hook — full volume sekaligus!',
        'Biarkan energi meledak — crowd akan merespons dengan baik.',
      ],
      tips: 'Efek surprise! Contrast antara silence dan high energy akan menciptakan impact yang sangat besar. Pastikan pilih moment yang tepat.',
      duration: '~5 detik',
      keyAdvice,
    };
  }

  if (energyA === 'High' && energyB === 'Low') {
    return {
      technique: 'Echo Out / Reverb Tail',
      steps: [
        'Aktifkan Echo atau Reverb effect di Track A dan naikkan wet ke max.',
        'Fade out Track A sambil echo/reverb berjalan — biarkan trail-nya terdengar.',
        'Saat echo hampir habis, mulai play Track B dengan volume sangat rendah.',
        'Naikkan volume Track B secara gradual — biarkan suasana settle.',
      ],
      tips: 'Beri penonton waktu istirahat — turunkan energi dengan elegan menggunakan reverb tail. Jangan terburu-buru naik ke full volume.',
      duration: '~20 detik',
      keyAdvice,
    };
  }

  // Default fallback
  return {
    technique: 'Standard Crossfade',
    steps: [
      'Play Track B dari awal dengan volume rendah.',
      'Naikkan volume Track B perlahan selama 8 bar.',
      'Fade out Track A secara gradual.',
      'Track B ambil alih sepenuhnya.',
    ],
    tips: 'Transisi standar yang selalu aman digunakan untuk situasi apapun.',
    duration: '~20 detik',
    keyAdvice,
  };
}
