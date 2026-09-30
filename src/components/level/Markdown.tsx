/**
 * A deliberately tiny Markdown subset for lesson text (no dependency):
 *   blank line = new block · "- " list · "> " key point · "### " heading
 *   **bold** · `code` · [[中文|English]] bilingual term
 */
import { Fragment, type ReactNode } from 'react';

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]|]+\|[^\]]+\]\])/g;

export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={key++}>{renderInline(tok.slice(2, -2))}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={key++}>{tok.slice(1, -1)}</code>);
    else {
      const [zh, en] = tok.slice(2, -2).split('|');
      out.push(
        <span className="term" key={key++}>
          {zh} <span className="en">{en}</span>
        </span>,
      );
    }
    last = at + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Inline({ text }: { text: string }) {
  return <>{renderInline(text)}</>;
}

/** One blank-line-separated block; list lines and text lines inside it become separate elements. */
function Block({ source }: { source: string }): ReactNode[] {
  const lines = source.split('\n').map((l) => l.trim());
  if (lines[0].startsWith('> ')) return [<p key="k" className="key">{renderInline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</p>];
  if (lines[0].startsWith('### ')) return [<h3 key="h">{renderInline(lines.join(' ').slice(4))}</h3>];
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const isItem = lines[i].startsWith('- ');
    const run: string[] = [];
    while (i < lines.length && lines[i].startsWith('- ') === isItem) run.push(lines[i++]);
    out.push(
      isItem
        ? <ul key={out.length}>{run.map((l, j) => <li key={j}>{renderInline(l.slice(2))}</li>)}</ul>
        : <p key={out.length}>{renderInline(run.join(' '))}</p>,
    );
  }
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/);
  return <div className="md">{blocks.flatMap((b, i) => Block({ source: b }).map((el, j) => <Fragment key={`${i}-${j}`}>{el}</Fragment>))}</div>;
}
