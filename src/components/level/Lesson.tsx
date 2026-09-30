import { ui } from '../../content/ui.ts';
import { Markdown } from './Markdown.tsx';

export function Lesson({ source, onNext }: { source: string; onNext: () => void }) {
  return (
    <div className="box">
      <Markdown source={source} />
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={onNext}>{ui.lesson.next}</button>
      </div>
    </div>
  );
}
