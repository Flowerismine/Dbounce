'use client';

import { useMemo, useRef, useState } from 'react';
import type { Track } from '@/lib/setlist-manager';
import { sortByBPM, sortByKey, filenameToTitle } from '@/lib/setlist-manager';
import { analyzeSong, formatTime } from '@/lib/audio-analyzer';
import { EnergyBadge, CamelotBadge, BpmBadge } from './Badges';

function IconMusic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconSort() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="11" y2="6"/><line x1="4" y1="12" x2="17" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

interface SongCardProps {
  track: Track;
  inSetlist: boolean;
  onAddToSet: (track: Track) => void;
  onDelete: (id: string) => void;
}

function SongCard({ track, inSetlist, onAddToSet, onDelete }: SongCardProps) {
  return (
    <div className={`dj-card animate-fade-in ${track.error ? 'danger' : ''}`}>
      {track.analyzing && (
        <div>
          <p className="micro-label">Realtime audio analysis</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:10 }}>
            <span style={{ color:'#58e8ff', fontWeight:800 }}>Menganalisis waveform & harmonic key...</span>
            <span className="soft-copy">{track.analyzeProgress ?? 0}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${track.analyzeProgress ?? 0}%` }} />
          </div>
          <p className="soft-copy" style={{ marginTop:8 }}>{track.filename}</p>
        </div>
      )}

      {track.error && !track.analyzing && (
        <div>
          <p className="micro-label">Audio analysis failed</p>
          <h3 className="section-title" style={{ fontSize:18, marginBottom:8 }}>Gagal membaca track</h3>
          <p className="soft-copy">{track.filename}</p>
          <button className="btn-danger" style={{ marginTop:12 }} onClick={() => onDelete(track.id)}>
            <IconTrash /> Hapus
          </button>
        </div>
      )}

      {!track.analyzing && !track.error && (
        <div>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p className="micro-label">Track profile</p>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ color:'#58e8ff', flexShrink:0 }}><IconMusic /></span>
                <h3 style={{ fontSize:18, fontWeight:900, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>
                  {track.title}
                </h3>
              </div>
              <div className="track-meta">
                <BpmBadge bpm={track.bpm} />
                <CamelotBadge camelot={track.key} keyName={track.keyName} />
                <EnergyBadge energy={track.energy} />
                <span className="badge badge-gray">{formatTime(track.duration)}</span>
              </div>
            </div>
          </div>
          <div className="hero-actions" style={{ marginTop:14 }}>
            {!inSetlist ? (
              <button className="btn-add" onClick={() => onAddToSet(track)}>
                <IconPlus /> Tambah ke Set
              </button>
            ) : (
              <span className="badge badge-success">Sudah masuk setlist</span>
            )}
            <button className="btn-danger" onClick={() => onDelete(track.id)}>
              <IconTrash /> Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface LibraryPageProps {
  library: Track[];
  setlist: Track[];
  onLibraryChange: (tracks: Track[] | ((prev: Track[]) => Track[])) => void;
  onAddToSet: (track: Track) => void;
}

export default function LibraryPage({ library, setlist, onLibraryChange, onAddToSet }: LibraryPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const setlistIds = useMemo(() => new Set(setlist.map(t => t.id)), [setlist]);

  const filtered = useMemo(() => {
    return library.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.filename.toLowerCase().includes(search.toLowerCase())
    );
  }, [library, search]);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const audioFiles = Array.from(files).filter(f =>
      f.type.startsWith('audio/') || /\.(mp3|wav|flac|ogg|aac|m4a)$/i.test(f.name)
    );
    if (!audioFiles.length) return;

    const placeholders: Track[] = audioFiles.map(f => ({
      id: `track_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      filename: f.name,
      title: filenameToTitle(f.name),
      bpm: 0, key: '', keyName: '', energy: 'Medium',
      duration: 0, transitionPoint: 0,
      analyzing: true, analyzeProgress: 0,
    }));

    onLibraryChange([...library, ...placeholders]);

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const placeholder = placeholders[i];

      try {
        const result = await analyzeSong(file, (pct) => {
          onLibraryChange(prev => prev.map(t => t.id === placeholder.id ? { ...t, analyzeProgress: pct } : t));
        });

        onLibraryChange(prev => prev.map(t =>
          t.id === placeholder.id
            ? { ...t, ...result, analyzing: false, analyzeProgress: undefined }
            : t
        ));
      } catch (err) {
        onLibraryChange(prev => prev.map(t =>
          t.id === placeholder.id
            ? { ...t, analyzing: false, error: String(err), analyzeProgress: undefined }
            : t
        ));
      }
    }
  }

  function handleDelete(id: string) {
    onLibraryChange(library.filter(t => t.id !== id));
  }

  function handleSortBPM() {
    const ready = library.filter(t => !t.analyzing);
    const analyzing = library.filter(t => t.analyzing);
    onLibraryChange([...sortByBPM(ready), ...analyzing]);
  }

  function handleSortKey() {
    const ready = library.filter(t => !t.analyzing);
    const analyzing = library.filter(t => t.analyzing);
    onLibraryChange([...sortByKey(ready), ...analyzing]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  const analyzingCount = library.filter(t => t.analyzing).length;
  const readyTracks = library.filter(t => !t.analyzing && !t.error);
  const avgBpm = readyTracks.length ? (readyTracks.reduce((sum, track) => sum + track.bpm, 0) / readyTracks.length).toFixed(1) : '--';
  const harmonicReady = readyTracks.filter(track => Boolean(track.key)).length;

  return (
    <div className="page-container">
      <section className="hero-card">
        <div className="hero-grid">
          <div>
            <p className="micro-label">Premium DJ aesthetic</p>
            <h1 className="hero-title">Scan crate, map tempo, dan susun set dengan <span className="hero-accent">visual yang lebih premium</span>.</h1>
            <p className="section-subtitle" style={{ maxWidth: 620, marginTop: 14 }}>
              Semua analisis tetap berjalan client-side, tapi sekarang tampil dengan feel booth modern: neon glassmorphism, visual cadence, dan data yang lebih mudah dibaca saat prep set.
            </p>
            <div className="hero-stats" style={{ marginTop: 18 }}>
              <div className="stat-box"><span className="stat-value">{readyTracks.length}</span><span className="stat-label">Tracks siap mix</span></div>
              <div className="stat-box"><span className="stat-value">{avgBpm}</span><span className="stat-label">Average BPM</span></div>
              <div className="stat-box"><span className="stat-value">{harmonicReady}</span><span className="stat-label">Camelot detected</span></div>
            </div>
          </div>
          <div className="hero-side">
            <div className="vinyl-deck" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="upload-zone" onDragOver={e => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} aria-label="Upload file audio" onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a" multiple style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} aria-hidden="true" />
        <div style={{ color:'#58e8ff', marginBottom:10, display:'flex', justifyContent:'center' }}><IconUpload /></div>
        <h2 className="section-title" style={{ marginBottom: 8 }}>Drop track untuk mulai analisis</h2>
        <p className="section-subtitle">Ketuk atau drag & drop file MP3 / WAV / FLAC. App akan membaca BPM, Camelot key, energi, dan titik transisi.</p>
        {analyzingCount > 0 && <p style={{ marginTop: 12, color:'#58e8ff', fontWeight:800 }} className="animate-pulse-cyan">Menganalisis {analyzingCount} track...</p>}
      </div>

      {library.length > 0 && (
        <>
          <div className="overview-grid">
            <div>
              <p className="micro-label">Collection insight</p>
              <h3 className="section-title">{library.length} total file</h3>
              <p className="section-subtitle">Semua track yang diunggah tersimpan lokal di device untuk sesi berikutnya.</p>
            </div>
            <div>
              <p className="micro-label">Set readiness</p>
              <h3 className="section-title">{setlist.length} queued</h3>
              <p className="section-subtitle">Track yang sudah cocok bisa langsung dilempar ke Set Builder tanpa upload ulang.</p>
            </div>
            <div>
              <p className="micro-label">Realtime analysis</p>
              <h3 className="section-title">{analyzingCount} processing</h3>
              <p className="section-subtitle">Progress bar kini tampil lebih jelas agar status analisis lebih terasa live.</p>
            </div>
          </div>

          <div className="search-input-wrap" style={{ marginBottom:10 }}>
            <span style={{ color:'#687196' }}><IconSearch /></span>
            <input type="search" className="search-input" placeholder="Cari judul atau filename..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Cari lagu di library" />
          </div>

          <div className="sort-row" style={{ marginBottom: 14 }}>
            <button className="btn-ghost" onClick={handleSortBPM}><IconSort /> Sort BPM</button>
            <button className="btn-ghost" onClick={handleSortKey}><IconSort /> Sort Camelot</button>
            <span className="status-pill" style={{ marginLeft:'auto' }}>{filtered.length} visible</span>
          </div>
        </>
      )}

      {filtered.length === 0 && library.length === 0 && (
        <div className="empty-state">
          <IconMusic />
          <h3>Library masih kosong</h3>
          <p>Upload beberapa track dulu. Setelah itu Anda bisa melihat BPM, Camelot key, energy level, dan menambahkannya ke setlist.</p>
        </div>
      )}

      {filtered.length === 0 && library.length > 0 && (
        <div className="empty-state">
          <IconSearch />
          <h3>Tidak ada hasil</h3>
          <p>Pencarian “{search}” belum menemukan track yang cocok.</p>
        </div>
      )}

      <div className="song-grid">
        {filtered.map(track => (
          <SongCard key={track.id} track={track} inSetlist={setlistIds.has(track.id)} onAddToSet={onAddToSet} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
