/** Levels whose content is not built yet: outline, what they light, and a dev-only "mark cleared". */
import type { LevelMeta } from '../content/types.ts';
import { ui } from '../content/ui.ts';
import { LevelHeader } from '../components/shell/LevelHeader.tsx';
import { HARD_UNLOCK_MAX, isUnlocked } from '../game/progress.ts';
import type { Game } from '../game/useGame.ts';
import { tpl } from '../lib/format.ts';

export function LevelPlaceholder({ meta, game, dev, onHome }: { meta: LevelMeta; game: Game; dev: boolean; onHome: () => void }) {
  const { progress } = game.state;
  const unlocked = isUnlocked(meta.id, progress);
  return (
    <div className="view placeholder">
      <LevelHeader meta={meta} onBack={onHome} />
      {!unlocked ? (
        <div className="box"><p>{tpl(ui.level.locked, { n: progress + 1 })}</p></div>
      ) : (
        <div className="box">
          <p><b>{ui.level.notBuilt}</b></p>
          <h3 className="box-title">{ui.level.outline}</h3>
          <p>{meta.outline}</p>
          {meta.lights.length ? <p className="muted">{tpl(ui.map.lightsLine, { what: meta.lightsLabel })}</p> : null}
          {dev && meta.id <= HARD_UNLOCK_MAX && progress < meta.id ? (
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => { game.clearLevel(meta.id); onHome(); }}>{ui.level.devSkip}</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
