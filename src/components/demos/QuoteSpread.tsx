/** Level 5 demo: an IBKR-style Ask / Bid header you can trade against, and five real spreads (CLAUDE.md §4.5). */
import { useEffect, useRef, useState } from 'react';
import { headerQuote, nameOf, SNAPSHOT } from '../../data/snapshot.ts';
import { spreadTable } from '../../data/model.ts';
import type { Code } from '../../data/types.ts';
import type { QuoteSpreadProps } from '../../content/types.ts';
import { BOND_LABELS, quoteText as T } from '../../content/demos.ts';
import { scannerChrome } from '../../content/home.ts';
import { ui } from '../../content/ui.ts';
import { signed, tpl, usd } from '../../lib/format.ts';
import { prefersReducedMotion } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const SPREADS = spreadTable(SNAPSHOT);
const ROW_H = 34;
const LABEL_W = 172;
const BAR_W = 290;

type Fill = { buy: number | null; sell: number | null };

export function QuoteSpread({ props, reveal, locked, layout }: DemoRuntimeProps<QuoteSpreadProps>) {
  const [code, setCode] = useState<Code>(props.bonds[0]);
  const [faceK, setFaceK] = useState(props.defaultFaceK);
  const [fill, setFill] = useState<Fill>({ buy: null, sell: null });
  const [flash, setFlash] = useState<'ask' | 'bid' | null>(null);
  const timers = useRef<number[]>([]);

  const q = headerQuote(code);
  const face = faceK * 1000;
  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  useEffect(() => clearTimers, []);

  const buy = () => { setFill({ buy: q.ask.value, sell: null }); setFlash('ask'); };
  const sell = () => { setFill((f) => ({ ...f, sell: q.bid.value })); setFlash('bid'); };
  const choose = (c: Code) => { clearTimers(); setCode(c); setFill({ buy: null, sell: null }); setFlash(null); };

  useEffect(() => {
    if (!reveal || reveal.kind !== 'roundTrip') return;
    clearTimers();
    const rq = headerQuote(reveal.bond);
    setCode(reveal.bond);
    setFaceK(reveal.faceK);
    setFill({ buy: null, sell: null });
    const quick = prefersReducedMotion();
    timers.current.push(window.setTimeout(() => { setFill({ buy: rq.ask.value, sell: null }); setFlash('ask'); }, quick ? 0 : 450));
    timers.current.push(window.setTimeout(() => { setFill({ buy: rq.ask.value, sell: rq.bid.value }); setFlash('bid'); }, quick ? 0 : 1400));
  }, [reveal]);

  const loss = fill.buy !== null && fill.sell !== null ? ((fill.buy - fill.sell) * face) / 100 : null;
  const rows = props.bonds
    .map((c) => SPREADS.find((r) => r.code === c))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .sort((a, b) => a.points - b.points);
  const maxPts = Math.max(...rows.map((r) => r.points));
  const chartH = rows.length * ROW_H + 16;
  const size = (k: number | null) => (k === null ? '' : ` × $${k.toLocaleString('en-US')}K`);
  const px = (c: { value: number | null; computed: boolean }) =>
    c.value === null ? scannerChrome.dash : (c.computed ? scannerChrome.approx : '') + c.value.toFixed(3);
  const yl = (c: { value: number | null }) => (c.value === null ? '' : `(${c.value.toFixed(3)}%)`);

  const stage = (
    <Stage title={T.stageTitle} subtitle={T.stageSub} locked={locked}>
      <div className="ibq" aria-label={T.aria}>
        <div className="ibq-left">
          <div className="ibq-name">{nameOf(code, 'header').text}<span className="ibq-tag">{T.tag}</span></div>
          <div className="ibq-last">
            {q.last.value?.toFixed(5)}<span className="ibq-ccy">{T.ccy}</span>
            {q.change !== null ? (
              <span className={'ibq-chg ' + (q.change >= 0 ? 'up' : 'dn')}>{signed(q.change, 5)} {signed(q.changePct ?? 0, 2, '%')}</span>
            ) : null}
          </div>
        </div>
        <div className="ibq-quotes">
          <div className={'ibq-line ask' + (flash === 'ask' ? ' is-hit' : '')}>
            <span className="ibq-k">{T.ask}</span>
            <span className="ibq-v">{px(q.ask)}{yl(q.askYield)}<small>{size(q.askSizeK.value)}</small></span>
          </div>
          <div className={'ibq-line bid' + (flash === 'bid' ? ' is-hit' : '')}>
            <span className="ibq-k">{T.bid}</span>
            <span className="ibq-v">{px(q.bid)}{yl(q.bidYield)}<small>{size(q.bidSizeK.value)}</small></span>
          </div>
          <div className="ibq-btns">
            <button type="button" className="ib-buy" onClick={buy}>{T.buy}</button>
            <button type="button" className="ib-sell" onClick={sell}>{T.sell}</button>
          </div>
        </div>
      </div>
      <p className="ibq-fill" aria-live="polite">
        {fill.buy !== null && fill.sell === null ? tpl(T.bought, { p: fill.buy.toFixed(3), y: `${q.askYield.value?.toFixed(3)}%` }) : null}
        {fill.sell !== null && fill.buy === null ? tpl(T.soldAlone, { p: fill.sell.toFixed(3) }) : null}
        {loss !== null ? tpl(T.roundTrip, { face: usd(face), loss: usd(loss, 2) }) : null}
        {q.ask.computed ? <span className="note"> {T.approxNote}</span> : null}
      </p>
      <svg viewBox={`0 0 640 ${chartH + 22}`} role="img" aria-label={T.chartTitle}>
        <text x={0} y={14} className="t-axis">{T.chartTitle}</text>
        {rows.map((r, i) => {
          const yTop = 26 + i * ROW_H;
          const w = Math.max(3, (r.points / maxPts) * BAR_W);
          const on = r.code === code;
          return (
            <g key={r.code} onClick={() => choose(r.code as Code)} style={{ cursor: 'pointer' }}>
              <rect x={0} y={yTop} width={640} height={ROW_H - 4} className="bar-hit" />
              <text x={LABEL_W - 10} y={yTop + 19} textAnchor="end" className={'t-label' + (on ? ' t-bold' : '')}>{BOND_LABELS[r.code as Code]?.short ?? r.code}</text>
              <rect x={LABEL_W} y={yTop + 5} width={w} height={ROW_H - 14} rx={3} className={on ? 'bar-sel' : 'bar-principal'} />
              <text x={LABEL_W + w + 8} y={yTop + 19} className="t-num">
                {tpl(T.barValue, { p: r.points.toFixed(2), usd: usd(r.points * 1000) })}
              </text>
            </g>
          );
        })}
      </svg>
    </Stage>
  );

  const spreadRow = SPREADS.find((r) => r.code === code);
  const controls = (
    <>
      <div className="box">
        <div className="box-title">{T.pickBond}</div>
        <div className="seg">
          {props.bonds.map((c) => (
            <button key={c} type="button" className={'seg-btn' + (c === code ? ' is-on' : '')} aria-pressed={c === code} onClick={() => choose(c)}>
              {c}<span className="sub">{BOND_LABELS[c]?.short}</span>
            </button>
          ))}
        </div>
        <label className="label" htmlFor="rt-face">{T.faceSlider}<b>{tpl(T.faceValue, { k: faceK, usd: usd(face) })}</b></label>
        <input id="rt-face" type="range" min={1} max={props.faceMaxK} step={1} value={faceK} onChange={(e) => setFaceK(Number(e.target.value))} />
      </div>
      <div className="box" aria-live="polite">
        <div className="box-title">{T.logTitle}</div>
        <div className="kv"><span className="kv-k">{T.logBuy}</span><span className="kv-v">{fill.buy !== null ? fill.buy.toFixed(3) : T.none}</span></div>
        <div className="kv"><span className="kv-k">{T.logSell}</span><span className="kv-v">{fill.sell !== null ? fill.sell.toFixed(3) : T.none}</span></div>
        <div className="kv"><span className="kv-k">{T.logLoss}</span><span className={'kv-v' + (loss ? ' dn' : '')}>{loss !== null ? usd(-loss, 2) : T.none}</span></div>
        {spreadRow ? (
          <>
            <div className="kv"><span className="kv-k">{T.spreadRow}</span><span className="kv-v">{spreadRow.points.toFixed(3)}</span></div>
            {spreadRow.yieldBp !== null ? <div className="kv"><span className="kv-k">{T.spreadYield}</span><span className="kv-v">{tpl(ui.units.bp, { n: spreadRow.yieldBp.toFixed(1) })}</span></div> : null}
          </>
        ) : null}
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => { clearTimers(); setFill({ buy: null, sell: null }); setFlash(null); }}>{T.reset}</button>
        </div>
      </div>
    </>
  );

  return <>{layout(stage, controls)}</>;
}
