/** Level 11 demo: TIPS vs a nominal Treasury of the same maturity as average inflation varies (CLAUDE.md §4.11). */
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { breakevenInflation, growSemiannual, tipsNominalReturn } from '../../math/tips.ts';
import { screenMidYield } from '../../data/snapshot.ts';
import { TIPS_INDEX } from '../../data/tipsIndex.ts';
import type { TipsMeterProps } from '../../content/types.ts';
import { BOND_LABELS, tipsText as T } from '../../content/demos.ts';
import { nominalCurve, yearsTo } from '../../content/curve.ts';
import { pct, tpl, usd } from '../../lib/format.ts';
import { svgX, tween } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 330;
const X0 = 56;
const X1 = 604;
const T0 = 22;
const B0 = 280;
const Y_LO = 0.02;
const Y_HI = 0.1;

export function TipsMeter({ props, reveal, locked, layout }: DemoRuntimeProps<TipsMeterProps>) {
  const [code, setCode] = useState<'TIPS56' | 'TIPS50'>(props.tips[0]);
  const [pi, setPi] = useState(0.02);
  const [guess, setGuess] = useState<number | null>(null);
  const piRef = useRef(pi);
  piRef.current = pi;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const stop = useRef<() => void>(() => {});
  useEffect(() => () => stop.current(), []);

  const maxPi = props.inflationMax / 100;
  const years = yearsTo(code);
  const real = screenMidYield(code)! / 100;
  const nominal = nominalCurve(years) / 100;
  const be = breakevenInflation(nominal, real);
  const ratio = TIPS_INDEX[code].indexRatio;

  const x = (p: number) => X0 + (p / maxPi) * (X1 - X0);
  const y = (r: number) => T0 + ((Y_HI - r) / (Y_HI - Y_LO)) * (B0 - T0);
  const tipsLine = () => {
    const pts: string[] = [];
    for (let p = 0; p <= maxPi + 1e-9; p += 0.001) pts.push(`${x(p).toFixed(1)},${y(tipsNominalReturn(real, p)).toFixed(1)}`);
    return 'M' + pts.join('L');
  };

  useEffect(() => {
    if (!reveal || reveal.kind !== 'breakeven') return;
    stop.current();
    setCode(reveal.tips);
    setGuess(reveal.guess / 100);
    const target = breakevenInflation(nominalCurve(yearsTo(reveal.tips)) / 100, screenMidYield(reveal.tips)! / 100);
    stop.current = tween(piRef.current, target, 900, setPi);
  }, [reveal]);

  const setFromX = (ev: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    stop.current();
    const p = ((svgX(ev, svgRef.current, W) - X0) / (X1 - X0)) * maxPi;
    setPi(Math.round(Math.max(0, Math.min(maxPi, p)) * 1000) / 1000);
  };

  const tipsNow = tipsNominalReturn(real, pi);
  const grid: number[] = [];
  for (let r = Y_LO; r <= Y_HI + 1e-9; r += 0.01) grid.push(Math.round(r * 1000) / 1000);
  const ticks: number[] = [];
  for (let p = 0; p <= maxPi + 1e-9; p += 0.01) ticks.push(Math.round(p * 1000) / 1000);

  const stage = (
    <Stage title={T.stageTitle} subtitle={T.stageSub} locked={locked}>
      <svg
        ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria}
        onPointerDown={(e) => { dragging.current = true; setFromX(e); }}
        onPointerMove={(e) => { if (dragging.current) setFromX(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      >
        <rect x={X0} y={T0} width={x(be) - X0} height={B0 - T0} className="zone-nominal" />
        <rect x={x(be)} y={T0} width={X1 - x(be)} height={B0 - T0} className="zone-tips" />
        <text x={X0 + 8} y={T0 + 16} className="t-muted">{T.nominalWins}</text>
        <text x={X1 - 8} y={T0 + 16} textAnchor="end" className="t-muted">{T.tipsWins}</text>
        {grid.map((r) => (
          <g key={r}>
            <line x1={X0} x2={X1} y1={y(r)} y2={y(r)} className="grid-line" />
            <text x={X0 - 8} y={y(r) + 4} textAnchor="end" className="t-num">{(r * 100).toFixed(0)}%</text>
          </g>
        ))}
        {ticks.map((p) => (
          <text key={p} x={x(p)} y={B0 + 18} textAnchor="middle" className="t-num">{(p * 100).toFixed(0)}%</text>
        ))}
        <text x={X1} y={H - 6} textAnchor="end" className="t-axis">{T.axisX}</text>
        <text x={X0 - 48} y={T0 - 8} className="t-axis">{T.axisY}</text>

        <line x1={X0} x2={X1} y1={y(nominal)} y2={y(nominal)} className="series series-1" />
        <text x={X0 + 8} y={y(nominal) - 8} className="t-label">{tpl(T.nominal, { y: pct(nominal) })}</text>
        <path d={tipsLine()} className="series series-2" />
        <text x={x(0.005)} y={y(tipsNominalReturn(real, 0.005)) + 20} className="t-label">{tpl(T.tips, { r: pct(real) })}</text>

        <circle cx={x(be)} cy={y(nominal)} r={9} className="ring-answer" />
        <text x={x(be) + 12} y={y(nominal) + 24} className="t-answer">{tpl(T.breakeven, { b: pct(be) })}</text>

        {guess !== null ? (
          <g>
            <line x1={x(guess)} x2={x(guess)} y1={T0} y2={B0} className="guess-line" />
            <text x={x(guess) - 6} y={T0 + 34} textAnchor="end" className="t-guess">{tpl(T.guess, { v: pct(guess) })}</text>
          </g>
        ) : null}

        <line x1={x(pi)} x2={x(pi)} y1={T0} y2={B0} className="cross" />
        <circle cx={x(pi)} cy={y(nominal)} r={6} className="dot fill-1" />
        <circle cx={x(pi)} cy={y(tipsNow)} r={6} className="dot fill-2" />
      </svg>
    </Stage>
  );

  const principal = 10_000 * ratio * Math.pow(1 + pi, years);
  const controls = (
    <>
      <div className="box">
        <div className="box-title">{T.pickTips}</div>
        <div className="seg">
          {props.tips.map((c) => (
            <button key={c} type="button" className={'seg-btn' + (c === code ? ' is-on' : '')} aria-pressed={c === code} onClick={() => { setCode(c); setGuess(null); }}>
              {c}<span className="sub">{BOND_LABELS[c]?.short}</span>
            </button>
          ))}
        </div>
        <p className="small muted">{tpl(T.years, { n: years.toFixed(1) })}</p>
        <label className="label" htmlFor="infl">{T.slider}<b>{pct(pi, 1)}</b></label>
        <input id="infl" type="range" min={0} max={props.inflationMax * 100} step={10} value={Math.round(pi * 10000)} onChange={(e) => { stop.current(); setPi(Number(e.target.value) / 10000); }} />
      </div>
      <div className="box">
        <div className="kv"><span className="kv-k">{T.rowReal}</span><span className="kv-v">{pct(real)}</span></div>
        <div className="kv"><span className="kv-k">{T.rowNominal}</span><span className="kv-v">{pct(nominal)}</span></div>
        <div className="kv"><span className="kv-k">{T.rowBreakeven}</span><span className="kv-v">{pct(be)}</span></div>
        <div className="kv"><span className="kv-k">{T.rowRatio}</span><span className="kv-v">{ratio.toFixed(5)}</span></div>
        <div className="kv"><span className="kv-k">{T.rowPrincipal}</span><span className="kv-v">{usd(principal)}</span></div>
        <div className="kv"><span className="kv-k">{T.rowGrowNominal}</span><span className="kv-v">{usd(growSemiannual(10_000, nominal, years))}</span></div>
        <div className="kv"><span className="kv-k">{T.rowGrowTips}</span><span className={'kv-v ' + (tipsNow > nominal ? 'up' : 'dn')}>{usd(growSemiannual(10_000, tipsNow, years))}</span></div>
        <p className="note">{T.note}</p>
      </div>
    </>
  );

  return <>{layout(stage, controls)}</>;
}
