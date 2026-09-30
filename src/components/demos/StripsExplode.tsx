/** Level 10 demo: a coupon bond stripped into zero-coupon pieces; each piece shows what it pays and what it is worth today (CLAUDE.md §4.10). */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { accrued, cashflows, zeroPrice, yearsLeft } from '../../math/bond.ts';
import { yearsBetween } from '../../math/dates.ts';
import { instrument, model, nameOf, SETTLE_DATE, todayPrice, todayYield } from '../../data/snapshot.ts';
import { SIX_PACK_STRIPS_YIELD } from '../../data/assumptions.ts';
import type { StripsExplodeProps } from '../../content/types.ts';
import { BOND_LABELS, stripsText as T } from '../../content/demos.ts';
import { scannerChrome } from '../../content/home.ts';
import { pct, tpl } from '../../lib/format.ts';
import { svgX } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 360;
const X0 = 60;
const X1 = 590;
const BASE = 290;
const TOP = 70;
const COUPON_H = 64;
const LIFT = 10;

interface Piece {
  kind: 'I' | 'P';
  date: string;
  t: number;
  pays: number;
  zp: number;
  worth: number;
}

export function StripsExplode({ props, reveal, locked, layout }: DemoRuntimeProps<StripsExplodeProps>) {
  const inst = instrument(props.bond);
  const y = todayYield(props.bond);
  const [stripped, setStripped] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const pieces: Piece[] = useMemo(() => {
    const out: Piece[] = [];
    for (const f of cashflows(inst.coupon, inst.maturity, SETTLE_DATE)) {
      const zp = zeroPrice(y, f.date, SETTLE_DATE);
      if (f.coupon > 0) out.push({ kind: 'I', date: f.date, t: f.t, pays: f.coupon, zp, worth: (f.coupon * zp) / 100 });
      if (f.principal > 0) out.push({ kind: 'P', date: f.date, t: f.t, pays: f.principal, zp, worth: (f.principal * zp) / 100 });
    }
    return out;
  }, [inst, y]);
  const tMax = yearsLeft(inst.maturity, SETTLE_DATE);
  const x = (p: Piece) => X0 + (p.t / tMax) * (X1 - X0) + (stripped && p.kind === 'P' ? 18 : 0);
  const half = inst.coupon / 2;
  const hC = (amt: number) => (amt / half) * COUPON_H;
  const sum = pieces.reduce((s, p) => s + p.worth, 0);
  const principalIndex = pieces.findIndex((p) => p.kind === 'P');

  useEffect(() => {
    if (!reveal || reveal.kind !== 'stripPiece') return;
    setStripped(true);
    setSel(pieces.findIndex((p) => p.kind === 'P' && p.date === reveal.date));
    setGuess(reveal.guess);
  }, [reveal, pieces]);

  const pickAt = (ev: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || !stripped) return;
    const vx = svgX(ev, svgRef.current, W);
    let best = 0;
    pieces.forEach((p, i) => { if (Math.abs(x(p) - vx) < Math.abs(x(pieces[best]) - vx)) best = i; });
    setSel(best);
    setGuess(null);
  };

  const years: number[] = [];
  for (let yr = Number(SETTLE_DATE.slice(0, 4)) + 1; yr <= Number(inst.maturity.slice(0, 4)); yr++) years.push(yr);
  const selPiece = sel !== null ? pieces[sel] : null;
  const pTop = TOP;
  const couponTop = BASE - hC(half);

  const stage = (
    <Stage
      title={T.stageTitle}
      subtitle={stripped ? tpl(T.stageSubStrips, { y: pct(y) }) : tpl(T.stageSubBond, { name: nameOf(props.bond).text })}
      locked={locked}
    >
      <svg
        ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria}
        onPointerDown={(e) => { dragging.current = true; pickAt(e); }}
        onPointerMove={(e) => { if (dragging.current) pickAt(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      >
        {!stripped ? (
          <g>
            <line x1={x(pieces[0])} x2={x(pieces[principalIndex])} y1={TOP - 22} y2={TOP - 22} className="zero-line" />
            <text x={x(pieces[0])} y={TOP - 30} className="t-label t-bold">{BOND_LABELS[props.bond]?.short ?? props.bond}</text>
          </g>
        ) : null}

        {pieces.map((p, i) => {
          const lift = stripped ? LIFT : 0;
          const isSel = sel === i;
          if (p.kind === 'I') {
            const h = hC(p.pays);
            const bottom = BASE - lift;
            return (
              <g key={`${p.kind}-${p.date}`}>
                {stripped ? (
                  <>
                    <rect x={x(p) - 6} y={bottom - h} width={12} height={h} rx={2} className="strip-outline" />
                    <rect x={x(p) - 6} y={bottom - (h * p.zp) / 100} width={12} height={(h * p.zp) / 100} rx={2} className={isSel ? 'bar-sel' : 'bar-coupon'} />
                  </>
                ) : (
                  <rect x={x(p) - 6} y={BASE - h} width={12} height={h} rx={2} className="bar-coupon" />
                )}
              </g>
            );
          }
          // Principal: drawn with a break because 100 is not to scale against 2.25.
          const bottom = stripped ? BASE - LIFT : couponTop;
          const full = bottom - pTop;
          const mid = (pTop + bottom) / 2;
          return (
            <g key={`${p.kind}-${p.date}`}>
              {stripped ? (
                <>
                  <rect x={x(p) - 8} y={pTop} width={16} height={full} rx={2} className="strip-outline" />
                  <rect x={x(p) - 8} y={bottom - (full * p.zp) / 100} width={16} height={(full * p.zp) / 100} rx={2} className={isSel ? 'bar-sel' : 'bar-principal'} />
                </>
              ) : (
                <rect x={x(p) - 8} y={pTop} width={16} height={full} rx={2} className="bar-principal" />
              )}
              <line x1={x(p) - 12} x2={x(p) + 12} y1={mid + 6} y2={mid - 2} className="break-mark" />
              <line x1={x(p) - 12} x2={x(p) + 12} y1={mid + 14} y2={mid + 6} className="break-mark" />
            </g>
          );
        })}

        {selPiece ? (
          (() => {
            const cx = Math.max(X0 + 130, Math.min(X1 - 130, x(selPiece)));
            const compare = reveal && reveal.kind === 'stripPiece' && guess !== null && selPiece.kind === 'P' ? reveal.compare : null;
            return (
              <g>
                <rect x={cx - 128} y={6} width={256} height={compare ? 62 : 44} rx={8} className="callout-box" />
                <text x={cx} y={24} textAnchor="middle" className="t-label">
                  {selPiece.date} · {selPiece.kind === 'P' ? T.principal : T.interest}
                </text>
                <text x={cx} y={42} textAnchor="middle" className="t-strong">
                  {tpl(T.paysToWorth, { pays: selPiece.pays.toFixed(2), worth: selPiece.worth.toFixed(2) })}
                </text>
                {compare ? (
                  <text x={cx} y={60} textAnchor="middle" className="t-answer">
                    {tpl(T.callout, { date: selPiece.date, code: compare, p: model(compare).cleanPrice.toFixed(2) })}
                  </text>
                ) : null}
              </g>
            );
          })()
        ) : null}
        {guess !== null && selPiece?.kind === 'P' ? (
          <text x={Math.max(X0 + 130, Math.min(X1 - 130, x(selPiece)))} y={88} textAnchor="middle" className="t-guess">{tpl(T.guess, { p: guess.toFixed(2) })}</text>
        ) : null}

        <line x1={X0 - 10} x2={X1 + 26} y1={BASE} y2={BASE} className="zero-line" />
        {years.map((yr) => {
          const t = yearsBetween(SETTLE_DATE, `${yr}-01-01`);
          if (t <= 0 || t >= tMax) return null;
          const xx = X0 + (t / tMax) * (X1 - X0);
          return <text key={yr} x={xx} y={BASE + 20} textAnchor="middle" className="t-num">{yr}</text>;
        })}
        <text x={X0} y={BASE + 42} textAnchor="middle" className="t-muted">{T.today}</text>
        <text x={X1} y={BASE + 42} textAnchor="end" className="t-muted">{T.maturityAxis} {inst.maturity}</text>
      </svg>
    </Stage>
  );

  const clean = todayPrice(props.bond);
  const acc = accrued(inst.coupon, inst.maturity, SETTLE_DATE);
  const showSameDay = selPiece?.kind === 'P' || (stripped && sel === null);
  const controls = (
    <>
      <div className="box">
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => { setStripped((s) => !s); setSel(null); setGuess(null); }}>
            {stripped ? T.rebuild : T.strip}
          </button>
        </div>
      </div>
      <div className="box" aria-live="polite">
        {selPiece ? (
          <>
            <div className="box-title">{selPiece.kind === 'P' ? T.principal : T.interest}</div>
            <div className="kv"><span className="kv-k">{T.maturity}</span><span className="kv-v small">{selPiece.date}</span></div>
            <div className="kv"><span className="kv-k">{T.yearsLeft}</span><span className="kv-v">{selPiece.t.toFixed(1)}</span></div>
            <div className="kv"><span className="kv-k">{T.pays}</span><span className="kv-v">{selPiece.pays.toFixed(2)}</span></div>
            <div className="kv"><span className="kv-k">{T.zeroPrice}</span><span className="kv-v">{selPiece.zp.toFixed(2)}</span></div>
            <div className="kv"><span className="kv-k">{T.worth}</span><span className="kv-v">{selPiece.worth.toFixed(3)}</span></div>
            <div className="kv"><span className="kv-k">{T.yieldUsed}</span><span className="kv-v">{pct(y)}</span></div>
          </>
        ) : (
          <p className="muted">{T.pickHint}</p>
        )}
      </div>
      {stripped ? (
        <div className="box">
          <div className="box-title">{T.sumTitle}</div>
          <div className="kv"><span className="kv-k">{T.sumLabel}</span><span className="kv-v">{sum.toFixed(2)}</span></div>
          <p className="small muted">{tpl(T.sumEq, { clean: clean.toFixed(2), acc: acc.toFixed(4) })}</p>
        </div>
      ) : null}
      {stripped && showSameDay ? (
        <div className="box">
          <div className="box-title">{T.sameDayTitle}</div>
          {props.sameDay.map((c) => (
            <div className="kv" key={c}>
              <span className="kv-k">{c} · {BOND_LABELS[c]?.short}</span>
              <span className="kv-v calc">{scannerChrome.approx}{model(c).cleanPrice.toFixed(2)}</span>
            </div>
          ))}
          <p className="note">
            {tpl(T.sameDayNote, {
              y: pct(SIX_PACK_STRIPS_YIELD),
              p: model(props.sameDay[0]).cleanPrice.toFixed(2),
              y2: pct(y),
              p2: pieces[principalIndex].zp.toFixed(2),
            })}
          </p>
        </div>
      ) : null}
    </>
  );

  return <>{layout(stage, controls)}</>;
}
