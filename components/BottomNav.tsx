'use client';

type Page = 'library' | 'setbuilder' | 'performance';

interface BottomNavProps {
  current: Page;
  setlistCount: number;
  libraryCount: number;
  onChange: (page: Page) => void;
}

function LibIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  );
}
function SetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}
function PerfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}

export default function BottomNav({ current, setlistCount, libraryCount, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      <button className={`bottom-nav-item ${current === 'library' ? 'active' : ''}`} onClick={() => onChange('library')} aria-current={current === 'library' ? 'page' : undefined}>
        <LibIcon />
        <span>Library</span>
        <span className="nav-chip">{libraryCount > 99 ? '99+' : libraryCount}</span>
      </button>

      <button className={`bottom-nav-item ${current === 'setbuilder' ? 'active' : ''}`} onClick={() => onChange('setbuilder')} aria-current={current === 'setbuilder' ? 'page' : undefined}>
        <SetIcon />
        <span>Set Builder</span>
        <span className="nav-chip">{setlistCount}</span>
      </button>

      <button className={`bottom-nav-item ${current === 'performance' ? 'active' : ''}`} onClick={() => onChange('performance')} aria-current={current === 'performance' ? 'page' : undefined}>
        <PerfIcon />
        <span>DJ Mode</span>
        <span className="nav-chip">LIVE</span>
      </button>
    </nav>
  );
}
