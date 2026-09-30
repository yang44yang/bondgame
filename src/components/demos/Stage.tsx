import type { ReactNode } from 'react';
import { ui } from '../../content/ui.ts';

export function Stage({ title, subtitle, locked, children }: { title: string; subtitle?: ReactNode; locked: boolean; children: ReactNode }) {
  return (
    <section className="stage" aria-label={title}>
      <header className="stage-head">
        <h2 className="stage-title">{title}</h2>
        {subtitle ? <p className="stage-sub">{subtitle}</p> : null}
      </header>
      <div className={'stage-body' + (locked ? ' is-locked' : '')} aria-hidden={locked || undefined}>
        {children}
        {locked ? <div className="stage-lock"><span>{ui.bet.locked}</span></div> : null}
      </div>
    </section>
  );
}
