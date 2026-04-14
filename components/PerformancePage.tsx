'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Track } from '@/lib/setlist-manager';
import { recommendTransition } from '@/lib/transition-engine';
import { formatTime } from '@/lib/audio-analyzer';
import { getCompatibilityBreakdown } from '@/lib/compatibility';
import { getAiMixInsight } from '@/lib/ai-mix-coach';
import { EnergyBadge, CamelotBadge, BpmBadge, CompatBpmBadge, CompatKeyBadge } from './Badges';
import ScoreRing from './ScoreRing';
import CamelotWheel from './CamelotWheel';
import BpmPulse from './BpmPulse';

function IconChevronLeft() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function IconFinish() {
  return (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function TrackBanner({ track, label, accent }: { track: Track; label: string; accent: string }) {
  return (
    <div className="perf-section" style={{ borderColor: `${accent}44` }}>
      <p className="perf-section-title" style={{ color: accent }}>{label}</p>
      <p className="track-name-large">{track.title}</p>
      <div className="track-meta">
        <BpmBadge bpm={track.bpm} />
        <CamelotBadge camelot={track.key} keyName={track.keyName} />
        <EnergyBadge energy={track.energy} />
        <span className="badge badge-gray">{formatTime(track.duration)}</span>
      </div>
    </div>
  );
}

interface PerformancePageProps {
  setlist: Track[];
  initialIndex?: number;
  onBack: () => void;
}

export default function PerformancePage({ setlist, initialIndex = 0, onBack }: PerformancePageProps) {
  const maxIndex = setlist.length - 2;
  const [currentIdx, setCurrentIdx] = useState(Math.min(initialIndex, Math.max(maxIndex, 0)));

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const trackA = setlist[currentIdx];
  const trackB = setlist[currentIdx + 1];
  const totalTransitions = Math.max(0, setlist.length - 1);

  const recommendation = trackA && trackB
    ? recommendTransition({
        energyA: trackA.energy,
        energyB: trackB.energy,
        bpmA: trackA.bpm,
        bpmB: trackB.bpm,
        keyA: trackA.key,
        keyB: trackB.key,
      })
    : null;

  const breakdown = useMemo(() => trackA && trackB ? getCompatibilityBreakdown(trackA, trackB) : null, [trackA, trackB]);
  const aiInsight = useMemo(() => trackA && trackB ? getAiMixInsight(trackA, trackB, currentIdx + 1, totalTransitions) : null, [trackA, trackB, currentIdx, totalTransitions]);

  const goNext = useCallback(() => {
    if (currentIdx < maxIndex) setCurrentIdx(i => i + 1);
  }, [currentIdx, maxIndex]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }, [currentIdx]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }

  if (setlist.length === 0) {
    return (
      <div className="page-container" style={{ minHeight:'70vh', display:'grid', placeItems:'center' }}>
        <div className="empty-state">
          <IconFinish />
          <h3>Set kosong</h3>
          <p>Tambahkan lagu ke setlist terlebih dahulu.</p>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={onBack}>Kembali ke Set Builder</button>
        </div>
      </div>
    );
  }

  if (setlist.length < 2) {
    return (
      <div className="page-container" style={{ minHeight:'70vh', display:'grid', placeItems:'center' }}>
        <div className="empty-state">
          <IconFinish />
          <h3>Butuh minimal 2 lagu</h3>
          <p>Tambahkan lebih banyak lagu agar AI coach dan transisi bisa dihitung.</p>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={onBack}>Kembali ke Set Builder</button>
        </div>
      </div>
    );
  }

  const transitionPoint = trackA ? formatTime(trackA.transitionPoint) : '0:00';
  const queuePreview = setlist.slice(currentIdx, Math.min(currentIdx + 4, setlist.length));

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="app-header">
        <div className="app-header-brand">
          <p className="micro-label">Live performance cockpit</p>
          <span className="app-title">Transition {currentIdx + 1} / {totalTransitions}</span>
          <span className="app-subtitle">Swipe kiri/kanan atau gunakan tombol untuk navigasi antar transisi.</span>
        </div>
        <div className="header-actions">
          <button className="btn-ghost" onClick={onBack}><IconBack /> Set Builder</button>
          {breakdown && <div className="status-pill">Score {breakdown.score}</div>}
        </div>
      </div>

      <div className="page-container">
        <div style={{ padding:'0 4px 12px' }}>
          <div className="transition-dot-wrap" role="progressbar" aria-valuenow={currentIdx + 1} aria-valuemax={totalTransitions}>
            {Array.from({ length: totalTransitions }).map((_, i) => (
              <button key={i} className={`transition-dot ${i < currentIdx ? 'done' : i === currentIdx ? 'current' : ''}`} onClick={() => setCurrentIdx(i)} aria-label={`Transisi ${i + 1}`} style={{ cursor:'pointer', background: i < currentIdx ? '#58e8ff' : i === currentIdx ? '#ff4fd8' : '#2a3354', border:'none' }} />
            ))}
          </div>
        </div>

        <section className="hero-card" style={{ marginBottom: 16 }}>
          <div className="hero-grid">
            <div>
              <p className="micro-label">Now performing</p>
              <h1 className="hero-title">Pantau blend berikutnya lewat <span className="hero-accent">score ring, BPM pulse, dan AI cues</span>.</h1>
              <p className="section-subtitle" style={{ marginTop: 14 }}>
                Fokus utama kini ada pada kejelasan keputusan live: kapan masuk, seberapa aman blend-nya, dan apakah perlu bantuan FX untuk masking.
              </p>
            </div>
            <div className="hero-side">
              <BpmPulse bpm={trackA.bpm} label="Current pulse" />
            </div>
          </div>
        </section>

        <div className="performance-grid">
          <div>
            <TrackBanner track={trackA} label="NOW PLAYING" accent="#58e8ff" />
            <div style={{ display:'flex', justifyContent:'center', padding:'4px 0 8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4fd888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
            </div>
            <TrackBanner track={trackB} label="NEXT TRACK" accent="#ff4fd8" />

            <div className="dual-grid" style={{ marginTop: 16 }}>
              <div className="score-panel">
                <p className="micro-label">Blend quality</p>
                <ScoreRing score={breakdown?.score ?? 0} label="Compat" />
                <div>
                  <h3 className="section-title" style={{ fontSize: 20, marginBottom: 6 }}>{breakdown?.label ?? 'Awaiting analysis'}</h3>
                  <p className="section-subtitle">Skor ini menggabungkan BPM, Camelot relationship, dan perpindahan energi.</p>
                </div>
              </div>

              <CamelotWheel primaryKey={trackA.key} secondaryKey={trackB.key} title="Active harmonic map" size={240} />
            </div>

            <div className="perf-section" style={{ marginTop: 16 }}>
              <p className="perf-section-title">Kompatibilitas detail</p>
              <div style={{ display:'grid', gap:10 }}>
                <CompatBpmBadge bpmA={trackA.bpm} bpmB={trackB.bpm} />
                <CompatKeyBadge keyA={trackA.key} keyB={trackB.key} />
                <div className="track-meta">
                  <span className="badge badge-gray">Transition point {transitionPoint}</span>
                  <span className="badge badge-gray">Technique window {recommendation?.duration ?? '--'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="perf-section" style={{ marginBottom: 16 }}>
              <p className="perf-section-title">AI Mix Coach</p>
              <h3 className="section-title" style={{ fontSize: 20, marginBottom: 8 }}>{aiInsight?.headline}</h3>
              <p className="summary-copy">{aiInsight?.summary}</p>
              <ul className="ai-cue-list">
                {aiInsight?.cues.map((cue, index) => <li key={index}>{cue}</li>)}
              </ul>
            </div>

            {recommendation && (
              <div className="perf-section" style={{ marginBottom: 16 }}>
                <p className="perf-section-title">Recommended transition</p>
                <div className="technique-tag">{recommendation.technique}</div>
                <ol className="step-list" aria-label="Langkah-langkah transisi">
                  {recommendation.steps.map((step, i) => (
                    <li key={i} className="step-item">
                      <span className="step-num">{i + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {recommendation && (
              <div className="tips-box" style={{ marginBottom: 16 }}>
                <p className="micro-label" style={{ color:'rgba(255,232,177,.66)' }}>AI-powered tips</p>
                <p className="ai-copy" style={{ margin: 0 }}>{recommendation.tips}</p>
                <p className="ai-copy" style={{ margin:'12px 0 0', color:'#baf7ff' }}>{recommendation.keyAdvice}</p>
              </div>
            )}

            <div className="queue-strip">
              <p className="micro-label">Upcoming queue</p>
              {queuePreview.map((track, index) => (
                <div key={track.id} className="queue-track">
                  <div>
                    <strong>{index === 0 ? 'Current' : `+${index}`}. {track.title}</strong>
                    <span className="soft-copy">{track.key} · {track.bpm.toFixed(1)} BPM · {track.energy}</span>
                  </div>
                  <span className="badge badge-gray">{formatTime(track.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop: 18 }}>
          <button className="nav-btn-large nav-btn-prev" onClick={goPrev} disabled={currentIdx === 0}>
            <IconChevronLeft /> PREV
          </button>
          <button className="nav-btn-large nav-btn-next" onClick={goNext} disabled={currentIdx === maxIndex}>
            NEXT <IconChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
