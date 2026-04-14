const wheelNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

interface CamelotWheelProps {
  primaryKey?: string;
  secondaryKey?: string;
  title?: string;
  size?: number;
}

function parseCamelot(key?: string) {
  if (!key) return null;
  const match = key.match(/(\d{1,2})([AB])/);
  if (!match) return null;
  return { number: Number(match[1]), letter: match[2] as 'A' | 'B' };
}

export default function CamelotWheel({ primaryKey, secondaryKey, title = 'Camelot Wheel', size = 240 }: CamelotWheelProps) {
  const center = size / 2;
  const outerRadius = size * 0.42;
  const innerRadius = size * 0.26;
  const primary = parseCamelot(primaryKey);
  const secondary = parseCamelot(secondaryKey);

  return (
    <div className="camelot-card">
      <div className="camelot-header-row">
        <div>
          <p className="micro-label">Harmonic mixing</p>
          <h3 className="section-title">{title}</h3>
        </div>
        <div className="camelot-legend">
          {primaryKey && <span className="legend-chip legend-chip-primary">Current {primaryKey}</span>}
          {secondaryKey && <span className="legend-chip legend-chip-secondary">Next {secondaryKey}</span>}
        </div>
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="camelot-wheel-svg" role="img" aria-label={title}>
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle cx={center} cy={center} r={outerRadius + 12} fill="url(#wheelGlow)" />
        <circle cx={center} cy={center} r={outerRadius} fill="rgba(13,18,34,.82)" stroke="rgba(255,255,255,.08)" />
        <circle cx={center} cy={center} r={innerRadius} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.08)" />
        {wheelNumbers.map((number, index) => {
          const angle = (-90 + index * 30) * (Math.PI / 180);
          const xOuter = center + Math.cos(angle) * (outerRadius - 22);
          const yOuter = center + Math.sin(angle) * (outerRadius - 22);
          const xInner = center + Math.cos(angle) * (innerRadius + 20);
          const yInner = center + Math.sin(angle) * (innerRadius + 20);
          const isPrimaryA = primary?.number === number && primary.letter === 'A';
          const isSecondaryA = secondary?.number === number && secondary.letter === 'A';
          const isPrimaryB = primary?.number === number && primary.letter === 'B';
          const isSecondaryB = secondary?.number === number && secondary.letter === 'B';

          return (
            <g key={number}>
              <circle cx={xOuter} cy={yOuter} r={17} className={`camelot-node ${isPrimaryA ? 'active-primary' : ''} ${isSecondaryA ? 'active-secondary' : ''}`} />
              <text x={xOuter} y={yOuter + 4} textAnchor="middle" className="camelot-node-text">{number}A</text>
              <circle cx={xInner} cy={yInner} r={17} className={`camelot-node camelot-node-inner ${isPrimaryB ? 'active-primary' : ''} ${isSecondaryB ? 'active-secondary' : ''}`} />
              <text x={xInner} y={yInner + 4} textAnchor="middle" className="camelot-node-text">{number}B</text>
            </g>
          );
        })}
        <text x={center} y={center - 6} textAnchor="middle" className="camelot-center-label">MOVE</text>
        <text x={center} y={center + 16} textAnchor="middle" className="camelot-center-sub">same, relative, ±1</text>
      </svg>
    </div>
  );
}
