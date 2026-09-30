/** Home page: a look-alike of IBKR's web Bond Scanner whose cells light up level by level (CLAUDE.md §1, §4.0). */
import type { ReactNode } from 'react';
import { SCANNER_ROWS, scannerChrome as C } from '../../content/home.ts';
import type { LightKey } from '../../content/types.ts';
import { ui } from '../../content/ui.ts';
import { nameOf, scannerQuote, type ScannerCell } from '../../data/snapshot.ts';
import { cellState, durationState, examReady, isLit, justLit, type CellState } from '../../game/lighting.ts';

function Cell({ state, just, children }: { state: CellState; just?: boolean; children: ReactNode }) {
  return (
    <span className={`cell is-${state}` + (just ? ' is-just' : '')}>
      <span className="v" aria-hidden={state === 'blur' || undefined}>{children}</span>
      {state === 'blur' ? <span className="sr-only">{C.notLit}</span> : null}
    </span>
  );
}

const calc = (text: string) => <span className="calc">{C.approx}{text}</span>;

function closingText(c: ScannerCell): ReactNode {
  if (c.value === null) return C.dash;
  return c.computed ? calc(c.value.toFixed(2)) : c.value.toFixed(2);
}
function priceText(c: ScannerCell): ReactNode {
  if (c.value === null) return C.dash;
  return c.computed ? calc(c.value.toFixed(2)) : c.value.toFixed(4);
}
function yieldText(c: ScannerCell): ReactNode {
  if (c.value === null) return C.dash;
  return c.computed ? calc(c.value.toFixed(2) + '%') : c.value.toFixed(3) + '%';
}
function sizeText(c: ScannerCell): ReactNode {
  if (c.value === null) return null;
  return <span className="ib-size">{C.sizePrefix}{c.value.toLocaleString('en-US')}{C.sizeSuffix}</span>;
}

export function ScannerTable({ progress, seen, onExam }: { progress: number; seen: number; onExam: () => void }) {
  const st = (key: LightKey) => ({ state: cellState(key, progress), just: justLit(key, progress, seen) });
  const dur = durationState(progress);
  const durJust = justLit('duration.dim', progress, seen) || justLit('duration.lit', progress, seen);
  const exam = examReady(progress);

  return (
    <section className="ib" aria-label={ui.scannerAria}>
      <div className="ib-top">
        <h2 className="ib-title">{C.title}</h2>
        <div className="ib-actions" aria-hidden="true">
          <span className="ib-refresh">{C.refresh}</span>
          <span className="ib-btn">{C.startOver}</span>
          <span className="ib-btn">{C.edit}</span>
        </div>
      </div>
      <div className="ib-heading">{C.heading}</div>
      <div className="ib-filter">
        <Cell {...st('filterRow')}>
          <span className="ib-link">{C.dateFrom}</span> {C.to} <span className="ib-link">{C.dateTo}</span>{'  '}
          {C.typeLabel} <span className="ib-link">{C.typeValue}</span>
        </Cell>
      </div>
      <div className="ib-meta">
        <span>{C.showing}</span>
        <span className="ib-pager" aria-hidden="true"><span className="on">{C.page}</span></span>
      </div>
      <div className="ib-wrap">
        <table className="ib-table">
          <thead>
            <tr>
              <th>{C.columns.product}</th>
              <th>{C.columns.closing}</th>
              <th>{C.columns.closingYield}</th>
              <th>{C.columns.bidYield}</th>
              <th>{C.columns.bid}</th>
              <th>{C.sortMark} {C.columns.askYield}</th>
              <th>{C.columns.ask}</th>
              <th className="ghost">{C.columns.duration}<span className="hint">{ui.home.durationHint}</span></th>
            </tr>
          </thead>
          <tbody>
            {SCANNER_ROWS.map((row) => {
              const q = scannerQuote(row.code);
              return (
                <tr key={row.code}>
                  <td>
                    <Cell {...st(row.product)}>
                      <span className="ib-name">{nameOf(row.code).text}</span>
                      <span className="ib-sub">{C.issuer}</span>
                      {isLit(row.product, progress) ? <span className="ib-note">{row.note}</span> : null}
                    </Cell>
                  </td>
                  <td className="num"><Cell {...st(row.closing)}>{closingText(q.closing)}</Cell></td>
                  <td className="num"><Cell {...st(row.yields)}>{C.dash}</Cell></td>
                  <td className="num"><Cell {...st(row.yields)}>{yieldText(q.bidYield)}</Cell></td>
                  <td className="num"><Cell {...st(row.quotes)}>{priceText(q.bid)}{sizeText(q.bidSizeK)}</Cell></td>
                  <td className="num"><Cell {...st(row.yields)}>{yieldText(q.askYield)}</Cell></td>
                  <td className="num"><Cell {...st(row.quotes)}>{priceText(q.ask)}{sizeText(q.askSizeK)}</Cell></td>
                  <td className="num ghost"><Cell state={dur} just={durJust}>{q.duration.value?.toFixed(1) ?? C.dash}</Cell></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="ib-foot">
        <div className="ib-trade">
          <Cell {...st('buyButton')}>
            <button type="button" className="ib-buy" disabled>{C.buy}</button>{' '}
            <button type="button" className="ib-sell" disabled>{C.sell}</button>
          </Cell>
          <span className="note">{isLit('buyButton', progress) ? ui.home.buyCaptionLit : ui.home.buyCaption}</span>
        </div>
        <div className="ib-trade">
          <Cell state={exam ? 'lit' : 'blur'} just={exam && seen < 11}>
            <button type="button" className="btn primary" disabled={!exam} onClick={onExam}>{ui.home.examButton}</button>
          </Cell>
          {!exam ? <span className="note">{ui.home.examCaption}</span> : null}
        </div>
      </div>
      <div className="ib-source">
        <span>{C.source}</span>
        <span className="legend"><i />{ui.home.legendBlur}</span>
        <span>{ui.home.legendCalc}</span>
        <span>{ui.home.legendSource}</span>
      </div>
    </section>
  );
}
