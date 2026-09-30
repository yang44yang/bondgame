import type { LevelMeta, Phase } from '../../content/types.ts';
import { ui } from '../../content/ui.ts';
import { tpl } from '../../lib/format.ts';

const ORDER: Phase[] = ['lesson', 'demo', 'quiz', 'bet'];

interface Props {
  meta: LevelMeta;
  onBack: () => void;
  phase?: Phase;
  phases?: Phase[];
  done?: Partial<Record<Phase, boolean>>;
  onPhase?: (p: Phase) => void;
}

export function LevelHeader({ meta, onBack, phase, phases = [], done = {}, onPhase }: Props) {
  const season = ui.seasons[meta.season];
  const list = ORDER.filter((p) => phases.includes(p));
  return (
    <header className="level-head">
      <div className="titles">
        <div className="eyebrow">
          <button type="button" className="btn link" onClick={onBack}>{ui.back}</button>
          <span>{season.zh} · {season.en}</span>
        </div>
        <h1 className="level-title">
          {tpl(ui.levelNo, { n: meta.id })} · {meta.title} <span className="en">{meta.titleEn}</span>
        </h1>
      </div>
      {phase && list.length ? (
        <nav aria-label={ui.level.phasesAria}>
          <ol className="phases">
            {list.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  className={'phase' + (p === phase ? ' is-active' : '') + (done[p] ? ' is-done' : '')}
                  aria-current={p === phase ? 'step' : undefined}
                  onClick={() => onPhase?.(p)}
                >
                  {ui.phases[p].zh} <span className="en">{ui.phases[p].en}</span>
                  {meta.minutes[p] ? <span className="min">{tpl(ui.minutes, { n: meta.minutes[p]! })}</span> : null}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </header>
  );
}
