import { levelMeta } from '../content/levels/index.ts';
import { ui } from '../content/ui.ts';
import { LevelHeader } from '../components/shell/LevelHeader.tsx';
import { examReady } from '../game/lighting.ts';

export function Exam({ progress, onHome }: { progress: number; onHome: () => void }) {
  return (
    <div className="view placeholder">
      <LevelHeader meta={levelMeta(12)} onBack={onHome} />
      <div className="box">
        <p>{examReady(progress) ? ui.exam.body : ui.exam.locked}</p>
        <p className="muted">{levelMeta(12).outline}</p>
      </div>
    </div>
  );
}
