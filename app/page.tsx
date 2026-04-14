'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Track } from '@/lib/setlist-manager';
import { saveLibrary, loadLibrary, saveSetlist, loadSetlist } from '@/lib/setlist-manager';
import { getAverageCompatibility } from '@/lib/compatibility';
import LibraryPage from '@/components/LibraryPage';
import SetBuilderPage from '@/components/SetBuilderPage';
import PerformancePage from '@/components/PerformancePage';
import BottomNav from '@/components/BottomNav';

type Page = 'library' | 'setbuilder' | 'performance';

function AppHeader({ page, libraryCount, setlistCount, avgCompatibility }: { page: Page; libraryCount: number; setlistCount: number; avgCompatibility: number }) {
  const titles: Record<Page, { title: string; subtitle: string }> = {
    library: {
      title: 'Premium crate management',
      subtitle: 'Upload, analisis, dan siapkan koleksi track dengan visual DJ aesthetic.',
    },
    setbuilder: {
      title: 'Build a harmonic journey',
      subtitle: 'Optimalkan flow energi, Camelot route, dan kompatibilitas antar track.',
    },
    performance: {
      title: 'Live performance cockpit',
      subtitle: 'Pantau transisi berikutnya dengan score ring, BPM pulse, dan AI coaching.',
    },
  };

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <p className="micro-label">DJ Bounce Assistant</p>
        <span className="app-title">{titles[page].title}</span>
        <span className="app-subtitle">{titles[page].subtitle}</span>
      </div>
      <div className="header-actions">
        <div className="status-pill">{libraryCount} tracks scanned</div>
        <div className="status-pill">{setlistCount} in set</div>
        <div className="status-pill">{avgCompatibility || 0} avg score</div>
      </div>
    </header>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('library');
  const [library, setLibraryState] = useState<Track[]>([]);
  const [setlist, setSetlistState] = useState<Track[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function init() {
      const [lib, set] = await Promise.all([loadLibrary(), loadSetlist()]);
      setLibraryState(lib);
      setSetlistState(set);
      setHydrated(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const setLibrary = useCallback((updater: Track[] | ((prev: Track[]) => Track[])) => {
    setLibraryState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveLibrary(next).catch(console.error);
      return next;
    });
  }, []);

  const setSetlist = useCallback((updater: Track[] | ((prev: Track[]) => Track[])) => {
    setSetlistState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveSetlist(next).catch(console.error);
      return next;
    });
  }, []);

  function handleAddToSet(track: Track) {
    setSetlist(prev => {
      if (prev.some(t => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }

  function handleRemoveFromSet(id: string) {
    setSetlist(prev => prev.filter(t => t.id !== id));
  }

  function handleSetlistChange(tracks: Track[]) {
    setSetlist(tracks);
  }

  if (!hydrated) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh', flexDirection:'column', gap:16, background:'#070813' }}>
        <div className="vinyl-deck" style={{ width: 112 }} />
        <p className="app-subtitle">Menyalakan premium DJ cockpit...</p>
      </div>
    );
  }

  const libraryCount = library.filter(t => !t.analyzing).length;
  const avgCompatibility = getAverageCompatibility(setlist);

  return (
    <div className="app-shell">
      {page !== 'performance' && (
        <AppHeader
          page={page}
          libraryCount={libraryCount}
          setlistCount={setlist.length}
          avgCompatibility={avgCompatibility}
        />
      )}

      <main>
        {page === 'library' && (
          <LibraryPage
            library={library}
            setlist={setlist}
            onLibraryChange={setLibrary}
            onAddToSet={handleAddToSet}
          />
        )}

        {page === 'setbuilder' && (
          <SetBuilderPage
            setlist={setlist}
            onSetlistChange={handleSetlistChange}
            onRemoveFromSet={handleRemoveFromSet}
            onGoPerformance={() => setPage('performance')}
          />
        )}

        {page === 'performance' && (
          <PerformancePage
            setlist={setlist}
            onBack={() => setPage('setbuilder')}
          />
        )}
      </main>

      <BottomNav
        current={page}
        setlistCount={setlist.length}
        libraryCount={libraryCount}
        onChange={p => setPage(p)}
      />
    </div>
  );
}
