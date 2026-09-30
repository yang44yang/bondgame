import { useEffect, useState } from 'react';
import { LEVEL_META } from '../content/levels/index.ts';
import { ui } from '../content/ui.ts';
import { LevelMap } from '../components/ibkr/LevelMap.tsx';
import { ScannerTable } from '../components/ibkr/ScannerTable.tsx';
import type { Game } from '../game/useGame.ts';
import { tpl } from '../lib/format.ts';

export function Home({ game, dev, onOpen, onExam }: { game: Game; dev: boolean; onOpen: (id: number) => void; onExam: () => void }) {
  const { progress, seen } = game.state;
  const { markSeen } = game;
  // What was already seen when this page opened: cells lit since then glow once during this visit.
  const [seenAtOpen] = useState(seen);
  const fresh = LEVEL_META.filter((m) => m.id > seenAtOpen && m.id <= progress && m.lights.length > 0);

  useEffect(() => {
    markSeen();
  }, [progress, markSeen]);

  // Bring the first newly lit cell into view so its glow is not missed below the fold.
  useEffect(() => {
    if (seenAtOpen >= progress) return;
    const t = window.setTimeout(() => {
      document.querySelector('.cell.is-just')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [seenAtOpen, progress]);

  return (
    <div className="view">
      <section className="hero">
        <h1>{ui.home.title}</h1>
        <p className="h1-en">{ui.home.titleEn}</p>
        <p>{ui.home.intro}</p>
      </section>
      {fresh.length ? (
        <p className="banner" role="status">{tpl(ui.home.justLit, { what: fresh.map((m) => m.lightsLabel).join(' · ') })}</p>
      ) : null}
      {dev ? (
        <section className="devpanel">
          <h3>{ui.dev.title}</h3>
          <label className="label" htmlFor="dev-progress">{tpl(ui.dev.progress, { n: progress })}</label>
          <input id="dev-progress" type="range" min={0} max={12} step={1} value={progress} onChange={(e) => game.devSetProgress(Number(e.target.value))} />
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => { if (window.confirm(ui.dev.confirmReset)) game.reset(); }}>{ui.dev.reset}</button>
          </div>
        </section>
      ) : null}
      <ScannerTable progress={progress} seen={seenAtOpen} onExam={onExam} />
      <LevelMap progress={progress} onOpen={onOpen} />
    </div>
  );
}
