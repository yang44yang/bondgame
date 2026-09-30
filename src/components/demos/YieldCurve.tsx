/** Level 6 demo: the 2026-09-29 curve from real points, a Treasury Type filter, and the sandbox paths (CLAUDE.md §4.6). */
import { useEffect, useMemo, useRef, useState } from 'react';
import { monotoneCubic } from '../../math/curve.ts';
import { yearsLeft } from '../../math/bond.ts';
import { instrument, nameOf, screenMidYield, scannerQuote, SETTLE_DATE } from '../../data/snapshot.ts';
import { pathShiftBp, ratePath, type PathId } from '../../data/ratePaths.ts';
import type { Code } from '../../data/types.ts';
import type { YieldCurveProps } from '../../content/types.ts';
import { BOND_LABELS, curveText as T } from '../../content/demos.ts';
import { matchesTreasuryType, TREASURY_TYPE_OPTIONS, type TreasuryTypeOption } from '../../game/scannerFilter.ts';
import { signed, tpl } from '../../lib/format.ts';
import { tween } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 380;
const X0 = 56;
const X1 = 600;
const T0 = 24;
const B0 = 330;
const X_MAX = 30;

interface Dot {
  code: Code;
  years: number;
  y: number;
  knot: boolean;
}

const PATH_LABEL: Record<PathId, string> = { P1: T.shiftP1, P2: T.shiftP2, P3: T.shiftP3, P4: T.shiftP4 };

export function YieldCurve({ props, reveal, locked, layout }: DemoRuntimeProps<YieldCurveProps>) {
  const [sel, setSel] = useState<Code | null>(null);
  const [filter, setFilter] = useState<TreasuryTypeOption>('All');
  const [pathId, setPathId] = useState<PathId | null>(null);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  tRef.current = t;
  const [read, setRead] = useState<{ years: number; guess: number } | null>(null);
  const stop = useRef<() => void>(() => {});
  useEffect(() => () => stop.current(), []);

  const dotOf = (code: Code, knot: boolean): Dot => ({ code, knot, years: yearsLeft(instrument(code).maturity, SETTLE_DATE), y: screenMidYield(code)! });
  const knots = useMemo(() => props.knots.map((c) => dotOf(c, true)), [props.knots]);
  const extras = useMemo(() => props.extras.map((c) => dotOf(c, false)), [props.extras]);
  const hidden = useMemo(() => props.revealExtras.map((c) => dotOf(c, false)), [props.revealExtras]);
  const curve = useMemo(
    () => monotoneCubic([...knots.map((k) => k.years), props.inferred.years], [...knots.map((k) => k.y), props.inferred.yield]),
    [knots, props.inferred],
  );

  const path = pathId ? ratePath(pathId) : null;
  const shifted = (x: number) => curve(x) + (path ? (t * pathShiftBp(path, x)) / 100 : 0);
  const [yLo, yHi] = path ? [3.5, 7.5] : [4.2, 6.2];
  const x = (yrs: number) => X0 + (yrs / X_MAX) * (X1 - X0);
  const y = (v: number) => T0 + ((yHi - v) / (yHi - yLo)) * (B0 - T0);
  const lastReal = knots[knots.length - 1].years;
  const line = (f: (v: number) => number, from: number, to: number) => {
    const pts: string[] = [];
    for (let v = from; v <= to + 1e-9; v += 0.1) pts.push(`${x(v).toFixed(1)},${y(f(v)).toFixed(1)}`);
    return 'M' + pts.join('L');
  };

  useEffect(() => {
    if (!reveal || reveal.kind !== 'curveRead') return;
    stop.current();
    setPathId(null);
    setT(0);
    setSel(null);
    setFilter('All');
    setRead({ years: reveal.years, guess: reveal.guess });
  }, [reveal]);

  const runPath = (id: PathId | null) => {
    stop.current();
    if (id === null) {
      stop.current = tween(tRef.current, 0, 500, setT, () => setPathId(null));
      return;
    }
    setPathId(id);
    setT(0);
    stop.current = tween(0, 1, 800, setT);
  };

  const dots = [...knots, ...extras, ...(read ? hidden : [])];
  const match = (d: Dot) => matchesTreasuryType(filter, instrument(d.code).treasuryType);
  const matches = dots.filter(match).length;
  const grid: number[] = [];
  for (let v = Math.ceil(yLo * 2) / 2; v <= yHi + 1e-9; v += path ? 0.5 : 0.25) grid.push(Math.round(v * 100) / 100);
  const selDot = dots.find((d) => d.code === sel) ?? null;

  const stage = (
    <Stage title={T.stageTitle} subtitle={T.stageSub} locked={locked}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria}>
        {grid.map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={y(v)} y2={y(v)} className="grid-line" />
            <text x={X0 - 8} y={y(v) + 4} textAnchor="end" className="t-num">{v.toFixed(2)}%</text>
          </g>
        ))}
        {[0, 5, 10, 15, 20, 25, 30].map((v) => (
          <text key={v} x={x(v)} y={B0 + 20} textAnchor="middle" className="t-num">{v}</text>
        ))}
        <text x={X1} y={H - 6} textAnchor="end" className="t-axis">{T.axisX}</text>
        <text x={X0 - 48} y={T0 - 10} className="t-axis">{T.axisY}</text>

        {path ? <path d={line(curve, knots[0].years, X_MAX)} className="curve" style={{ opacity: 0.3 }} /> : null}
        <path d={line(shifted, knots[0].years, lastReal)} className={path ? 'series series-3' : 'curve'} />
        <path d={line(shifted, lastReal, X_MAX)} className={path ? 'series series-3' : 'curve'} strokeDasharray="6 5" />
        {path ? (
          <text x={X1} y={y(shifted(X_MAX)) - 10} textAnchor="end" className="t-label">{PATH_LABEL[path.id]}</text>
        ) : null}

        {!path ? (
          <g>
            <circle cx={x(props.inferred.years)} cy={y(props.inferred.yield)} r={6} className="ring" />
            <text x={x(props.inferred.years) - 10} y={y(props.inferred.yield) + 22} textAnchor="end" className="t-muted">{T.inferred}</text>
          </g>
        ) : null}

        {!path
          ? dots.map((d) => {
              const on = match(d);
              const hiddenDot = props.revealExtras.includes(d.code);
              return (
                <g key={d.code} onClick={() => setSel(d.code)} style={{ cursor: 'pointer', opacity: on ? 1 : 0.18 }}>
                  <circle cx={x(d.years)} cy={y(d.y)} r={14} className="bar-hit" />
                  {hiddenDot ? (
                    <rect x={x(d.years) - 5} y={y(d.y) - 5} width={10} height={10} transform={`rotate(45 ${x(d.years)} ${y(d.y)})`} className="fill-4" />
                  ) : (
                    <circle cx={x(d.years)} cy={y(d.y)} r={d.knot ? 6 : 4.5} className={d.knot ? 'dot fill-2' : 'dot'} style={d.knot ? undefined : { fill: 'var(--muted)' }} />
                  )}
                  {sel === d.code ? <circle cx={x(d.years)} cy={y(d.y)} r={10} className="ring-answer" /> : null}
                </g>
              );
            })
          : null}
        {selDot && !path ? (
          <text x={x(selDot.years) + (selDot.years > 20 ? -14 : 14)} y={y(selDot.y) - 12} textAnchor={selDot.years > 20 ? 'end' : 'start'} className="t-strong">
            {BOND_LABELS[selDot.code]?.short ?? selDot.code} · {selDot.y.toFixed(2)}%
          </text>
        ) : null}

        {read && !path ? (
          <g>
            <line x1={x(read.years)} x2={x(read.years)} y1={y(curve(read.years))} y2={B0} className="guide" />
            <line x1={X0} x2={x(read.years)} y1={y(curve(read.years))} y2={y(curve(read.years))} className="guide" />
            <circle cx={x(read.years)} cy={y(curve(read.years))} r={9} className="ring-answer" />
            <text x={x(read.years) + 14} y={y(curve(read.years)) + 20} className="t-answer">
              {tpl(T.readAt, { y: read.years, v: curve(read.years).toFixed(2) + '%' })}
            </text>
            <line x1={X0} x2={X1} y1={y(read.guess)} y2={y(read.guess)} className="guess-line" />
            <text x={X1} y={y(read.guess) + 16} textAnchor="end" className="t-guess">{tpl(T.guess, { v: read.guess.toFixed(2) + '%' })}</text>
            {hidden.length ? (
              <text
                x={x((Math.min(...hidden.map((h) => h.years)) + Math.max(...hidden.map((h) => h.years))) / 2)}
                y={y(Math.max(...hidden.map((h) => h.y))) - 14}
                textAnchor="middle" className="t-label t-bold" style={{ fill: 'var(--plum)' }}
              >
                {T.realShort}
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>
    </Stage>
  );

  const q = selDot ? scannerQuote(selDot.code) : null;
  const inst = selDot ? instrument(selDot.code) : null;
  const controls = (
    <>
      <div className="box" aria-live="polite">
        <div className="box-title">{T.pickTitle}</div>
        {selDot && inst && q ? (
          <>
            <p className="ib-name" style={{ whiteSpace: 'normal' }}>{nameOf(selDot.code).text}</p>
            <div className="kv"><span className="kv-k">{T.rowType}</span><span className="kv-v small">{inst.treasuryType}</span></div>
            <div className="kv"><span className="kv-k">{T.rowMaturity}</span><span className="kv-v small">{inst.maturity}</span></div>
            <div className="kv"><span className="kv-k">{T.rowYears}</span><span className="kv-v">{tpl(T.years, { n: selDot.years.toFixed(1) })}</span></div>
            <div className="kv"><span className="kv-k">{T.rowYield}</span><span className="kv-v">{selDot.y.toFixed(3)}%</span></div>
            <div className="kv"><span className="kv-k">{T.rowBidAsk}</span><span className="kv-v small">{q.bidYield.value?.toFixed(3)}% / {q.askYield.value?.toFixed(3)}%</span></div>
            <div className="kv"><span className="kv-k">{T.rowPrice}</span><span className="kv-v">{q.closing.value?.toFixed(2)}</span></div>
          </>
        ) : (
          <p className="muted">{T.pickHint}</p>
        )}
      </div>
      <div className="box">
        <label className="box-title" htmlFor="tt-filter">{T.filterTitle}</label>
        <select id="tt-filter" className="ib-select" value={filter} onChange={(e) => setFilter(e.target.value as TreasuryTypeOption)}>
          {TREASURY_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <p className="small">{tpl(T.filterCount, { n: matches })}</p>
        {filter === 'Bond TIPS' ? <p className="small muted">{T.filterNone}</p> : null}
        <p className="note">{T.filterNote}</p>
      </div>
      <div className="box">
        <div className="box-title">{T.shiftTitle}</div>
        <div className="seg">
          {props.paths.map((id) => (
            <button key={id} type="button" className={'seg-btn' + (pathId === id ? ' is-on' : '')} aria-pressed={pathId === id} onClick={() => runPath(id)}>
              {PATH_LABEL[id]}
            </button>
          ))}
        </div>
        {path ? (
          <p className="small">
            {tpl(T.shiftDesc, {
              name: PATH_LABEL[path.id],
              s: tpl(T.bp, { n: signed(path.shortBp, 0) }),
              l: tpl(T.bp, { n: signed(path.longBp, 0) }),
            })}
          </p>
        ) : null}
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => runPath(null)} disabled={!path}>{T.shiftReset}</button>
        </div>
      </div>
    </>
  );

  return <>{layout(stage, controls)}</>;
}
