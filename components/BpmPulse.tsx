interface BpmPulseProps {
  bpm: number;
  label?: string;
}

export default function BpmPulse({ bpm, label = 'BPM Pulse' }: BpmPulseProps) {
  const safeBpm = bpm > 0 ? bpm : 128;
  const pulseDuration = `${Math.max(0.35, Math.min(1.4, 60 / safeBpm)).toFixed(2)}s`;

  return (
    <div className="bpm-pulse-card" aria-label={`${label} ${safeBpm.toFixed(1)} BPM`}>
      <div className="bpm-pulse-stage" style={{ ['--pulse-duration' as string]: pulseDuration }}>
        <span className="bpm-core" />
        <span className="bpm-wave bpm-wave-1" />
        <span className="bpm-wave bpm-wave-2" />
        <span className="bpm-wave bpm-wave-3" />
      </div>
      <div>
        <p className="micro-label">{label}</p>
        <p className="pulse-bpm-value">{safeBpm.toFixed(1)} BPM</p>
        <p className="soft-copy">Visual pulse mengikuti tempo track aktif.</p>
      </div>
    </div>
  );
}
