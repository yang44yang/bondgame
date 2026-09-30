import type { ReactNode } from 'react';
import { ui } from '../../content/ui.ts';
import { Markdown } from './Markdown.tsx';

export function DemoPanel({ guide, controls, onNext }: { guide: string; controls: ReactNode; onNext: () => void }) {
  return (
    <>
      <div className="box">
        <h3 className="box-title">{ui.demo.guideTitle}</h3>
        <Markdown source={guide} />
      </div>
      {controls}
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={onNext}>{ui.demo.next}</button>
      </div>
    </>
  );
}
