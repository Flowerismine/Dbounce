interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ScoreRing({ score, size = 132, strokeWidth = 12, label = 'Compatibility' }: ScoreRingProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  const theme =
    safeScore >= 85 ? { color: '#62f4b4', glow: 'rgba(98,244,180,.55)', text: 'STELLAR' } :
    safeScore >= 70 ? { color: '#54d0ff', glow: 'rgba(84,208,255,.55)', text: 'SMOOTH' } :
    safeScore >= 50 ? { color: '#ffcf5a', glow: 'rgba(255,207,90,.55)', text: 'USABLE' } :
    { color: '#ff628d', glow: 'rgba(255,98,141,.55)', text: 'RISKY' };

  return (
    <div className="score-ring-wrap" aria-label={`${label} ${safeScore} dari 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring-svg" role="img">
        <defs>
          <linearGradient id={`ringGradient-${size}-${safeScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7cff" />
            <stop offset="55%" stopColor={theme.color} />
            <stop offset="100%" stopColor="#ff4fd8" />
          </linearGradient>
          <filter id={`ringGlow-${size}-${safeScore}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme.glow} />
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ringGradient-${size}-${safeScore})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter={`url(#ringGlow-${size}-${safeScore})`}
        />
      </svg>
      <div className="score-ring-center">
        <div className="score-ring-value">{safeScore}</div>
        <div className="score-ring-label">{label}</div>
        <div className="score-ring-tier">{theme.text}</div>
      </div>
    </div>
  );
}
