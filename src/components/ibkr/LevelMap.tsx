import { LEVEL_META, LEVELS } from '../../content/levels/index.ts';
import type { LevelMeta, Season } from '../../content/types.ts';
import { ui } from '../../content/ui.ts';
import { cardStatus, isUnlocked } from '../../game/progress.ts';
import { tpl } from '../../lib/format.ts';

function LevelCard({ meta, progress, onOpen }: { meta: LevelMeta; progress: number; onOpen: (id: number) => void }) {
  const status = cardStatus(meta.id, progress);
  const unlocked = isUnlocked(meta.id, progress);
  const built = Boolean(LEVELS[meta.id]);
  const label = !unlocked ? ui.map.locked
    : meta.view ? ui.map.enter
    : !built ? ui.map.outline
    : status === 'done' ? ui.map.replay
    : ui.map.start;
  return (
    <div className={'card ' + status}>
      <div className="card-n">
        <span>{tpl(ui.levelNo, { n: meta.id })} · {ui.map.duration}</span>
        <b>{ui.map.status[status]}</b>
      </div>
      <div className="card-t">{meta.title}<span className="en">{meta.titleEn}</span></div>
      <div className="card-lights">{tpl(ui.map.lightsLine, { what: meta.lightsLabel })}</div>
      <button type="button" className={'btn' + (unlocked && built && status !== 'done' ? ' primary' : '')} disabled={!unlocked} onClick={() => onOpen(meta.id)}>
        {label}
      </button>
    </div>
  );
}

export function LevelMap({ progress, onOpen }: { progress: number; onOpen: (id: number) => void }) {
  return (
    <section className="map" aria-label={ui.mapAria}>
      <h2>{ui.map.title.zh} <span className="en">{ui.map.title.en}</span></h2>
      {([1, 2, 3] as Season[]).map((s) => (
        <div className="season" key={s}>
          <h3>{ui.seasons[s].zh} <span className="en">{ui.seasons[s].en}</span></h3>
          <div className="cards">
            {LEVEL_META.filter((m) => m.season === s).map((m) => (
              <LevelCard key={m.id} meta={m} progress={progress} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
