'use client';

import { useMemo, useRef, useState } from 'react';
import type { Track } from '@/lib/setlist-manager';
import { autoArrange } from '@/lib/setlist-manager';
import { formatTime } from '@/lib/audio-analyzer';
import { getAverageCompatibility, getCompatibilityBreakdown } from '@/lib/compatibility';
import { EnergyBadge, CamelotBadge, BpmBadge, CompatBpmBadge, CompatKeyBadge } from './Badges';
import ScoreRing from './ScoreRing';
import CamelotWheel from './CamelotWheel';

function IconGrip() {
  return (
    <svg className="drag-handle" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
      <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
    </svg>
  );
}
function IconWand() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2m4.243 2.757L17.828 6.1M20 9h2M4 20l9.586-9.586M18.364 5.636l-1.414 1.414a2 2 0 010 2.829L4 22 2 20 14.121 7.879a2 2 0 012.829 0l1.414-1.414"/>
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}
function IconRemove() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconList() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function CompatBridge({ a, b }: { a: Track; b: Track }) {
  const breakdown = getCompatibilityBreakdown(a, b);
  const color = breakdown.score >= 85 ? '#62f4b4' : breakdown.score >= 70 ? '#58e8ff' : breakdown.score >= 50 ? '#ffc866' : '#ff688c';

  return (
    <div className="compat-bridge" aria-label="Kompatibilitas antar track">
      <div className="compat-bridge-line" style={{ background: `${color}55` }} />
      <div className="compat-bridge-inner">
        <CompatBpmBadge bpmA={a.bpm} bpmB={b.bpm} />
        <span className="badge badge-gray">Score {breakdown.score}</span>
        <CompatKeyBadge keyA={a.key} keyB={b.key} />
      </div>
      <div className="compat-bridge-line" style={{ background: `${color}55` }} />
    </div>
  );
}

function EnergyGraph({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) return null;
  return (
    <div className="energy-panel">
      <p className="micro-label">Energy flow preview</p>
      <h3 className="section-title" style={{ fontSize:20, marginBottom: 8 }}>Perjalanan energi set</h3>
      <div className="energy-graph" aria-hidden="true">
        {tracks.map(t => <div key={t.id} className={`energy-bar energy-${t.energy.toLowerCase()}`} title={`${t.title} — ${t.energy}`} />)}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
        <span className="soft-copy">Track 1</span>
        <span className="soft-copy">Track {tracks.length}</span>
      </div>
    </div>
  );
}

interface SetBuilderPageProps {
  setlist: Track[];
  onSetlistChange: (tracks: Track[]) => void;
  onRemoveFromSet: (id: string) => void;
  onGoPerformance: () => void;
}

export default function SetBuilderPage({ setlist, onSetlistChange, onRemoveFromSet, onGoPerformance }: SetBuilderPageProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const touchStartY = useRef<number>(0);
  const touchDragIdx = useRef<number | null>(null);

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newList = [...setlist];
    const [moved] = newList.splice(dragIdx, 1);
    newList.splice(idx, 0, moved);
    onSetlistChange(newList);
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleAutoArrange() {
    onSetlistChange(autoArrange(setlist));
  }

  const avgCompatibility = useMemo(() => getAverageCompatibility(setlist), [setlist]);
  const totalDuration = useMemo(() => setlist.reduce((sum, track) => sum + track.duration, 0), [setlist]);
  const currentPair = setlist.length >= 2 ? getCompatibilityBreakdown(setlist[0], setlist[1]) : null;
  const lowestPair = useMemo(() => {
    if (setlist.length < 2) return null;
    return setlist.slice(1).map((track, index) => ({
      score: getCompatibilityBreakdown(setlist[index], track).score,
      a: setlist[index],
      b: track,
    })).sort((a, b) => a.score - b.score)[0];
  }, [setlist]);

  if (setlist.length === 0) {
    return (
      <div className="page-container">
        <div className="hero-card">
          <div className="hero-grid">
            <div>
              <p className="micro-label">Set Builder</p>
              <h1 className="hero-title">Susun perjalanan harmoni dengan <span className="hero-accent">compatibility-driven flow</span>.</h1>
              <p className="section-subtitle" style={{ marginTop: 14 }}>Tambahkan track dari Library untuk membuka overview premium: average compatibility, Camelot Wheel visualizer, dan insight pasangan transisi.</p>
            </div>
            <div className="hero-side"><div className="vinyl-deck" aria-hidden="true" /></div>
          </div>
        </div>
        <div className="empty-state">
          <IconList />
          <h3>Set masih kosong</h3>
          <p>Tambahkan lagu dari Library untuk mulai menyusun setlist-mu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <section className="hero-card">
        <div className="hero-grid">
          <div>
            <p className="micro-label">Smart set builder</p>
            <h1 className="hero-title">Optimalkan flow set dengan <span className="hero-accent">Camelot-aware sequencing</span>.</h1>
            <p className="section-subtitle" style={{ marginTop: 14 }}>Anda bisa drag, auto-arrange, lalu melihat kualitas blend rata-rata sebelum masuk DJ Mode.</p>
            <div className="hero-actions" style={{ marginTop: 18 }}>
              <button className="btn-ghost" onClick={handleAutoArrange}><IconWand /> Auto-Arrange</button>
              <button className="btn-primary" onClick={onGoPerformance}><IconPlay /> Masuk DJ Mode</button>
            </div>
          </div>
          <div className="hero-side">
            <div className="stat-box"><span className="stat-value">{setlist.length}</span><span className="stat-label">Tracks in set</span></div>
            <div className="stat-box"><span className="stat-value">{avgCompatibility}</span><span className="stat-label">Average compatibility</span></div>
            <div className="stat-box"><span className="stat-value">{formatTime(totalDuration)}</span><span className="stat-label">Estimated duration</span></div>
          </div>
        </div>
      </section>

      <div className="overview-grid">
        <div className="score-panel">
          <p className="micro-label">Set health</p>
          <ScoreRing score={avgCompatibility} label="Set Avg" />
          <p className="section-subtitle">Nilai ini merangkum BPM, Camelot key, dan alur energi di seluruh pasangan track.</p>
        </div>
        <div className="camelot-card">
          <CamelotWheel primaryKey={setlist[0]?.key} secondaryKey={setlist[1]?.key} title="Opening transition map" size={220} />
        </div>
        <div className="glass-panel">
          <p className="micro-label">Risk checkpoint</p>
          <h3 className="section-title" style={{ fontSize: 20, marginBottom: 8 }}>Pasangan paling sensitif</h3>
          {lowestPair ? (
            <>
              <p style={{ fontWeight: 800, margin:'0 0 6px' }}>{lowestPair.a.title} → {lowestPair.b.title}</p>
              <p className="section-subtitle" style={{ marginBottom: 12 }}>Skor {lowestPair.score}/100. Kandidat terbaik untuk memakai filter, breakdown bridge, atau echo tail.</p>
              <CompatBpmBadge bpmA={lowestPair.a.bpm} bpmB={lowestPair.b.bpm} />
              <div style={{ height: 8 }} />
              <CompatKeyBadge keyA={lowestPair.a.key} keyB={lowestPair.b.key} />
            </>
          ) : (
            <p className="section-subtitle">Tambahkan track kedua untuk melihat analisis risikonya.</p>
          )}
        </div>
      </div>

      <EnergyGraph tracks={setlist} />

      <div className="setlist-grid">
        {setlist.map((track, idx) => (
          <div key={track.id} role="listitem">
            {idx > 0 && <CompatBridge a={setlist[idx - 1]} b={track} />}
            <div className={`setlist-item ${dragIdx === idx ? 'dragging' : ''} ${dragOverIdx === idx && dragIdx !== idx ? 'drag-over' : ''}`} draggable onDragStart={() => handleDragStart(idx)} onDragOver={e => handleDragOver(e, idx)} onDrop={e => handleDrop(e, idx)} onDragEnd={handleDragEnd}>
              <div className="drag-handle" aria-hidden="true"><IconGrip /></div>
              <div className="track-num" aria-hidden="true">{idx + 1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:18, fontWeight:900, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 8px' }}>{track.title}</p>
                <div className="track-meta">
                  <BpmBadge bpm={track.bpm} />
                  <CamelotBadge camelot={track.key} keyName={track.keyName} />
                  <EnergyBadge energy={track.energy} />
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                <span className="soft-copy">{formatTime(track.duration)}</span>
                <button className="btn-danger" style={{ minHeight:36, padding:'0 12px' }} onClick={() => onRemoveFromSet(track.id)}><IconRemove /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="set-highlight" style={{ marginTop: 16 }}>
        <p className="micro-label">Ready for performance</p>
        <h3 className="section-title" style={{ marginBottom: 8 }}>Masuk DJ Mode untuk lihat score ring, BPM pulse, dan AI mix tips per transisi.</h3>
        <p className="section-subtitle" style={{ marginBottom: 14 }}>Mode performance sekarang dibuat seperti mini cockpit untuk memudahkan keputusan saat live.</p>
        <button className="btn-primary" onClick={onGoPerformance}><IconPlay /> Buka DJ Mode</button>
      </div>
    </div>
  );
}
