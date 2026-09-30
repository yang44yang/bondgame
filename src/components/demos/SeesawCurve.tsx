/** Level 2 demo: price/yield seesaw above the price–yield curve (CLAUDE.md §4.2, ported from docs/preview.html). */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { cleanPrice } from '../../math/bond.ts';
import { instrument, nameOf, SETTLE_DATE, todayPrice, todayYield } from '../../data/snapshot.ts';
import type { SeesawCurveProps } from '../../content/types.ts';
import { seesawText as T } from '../../content/demos.ts';
import { pct, signed, tpl } from '../../lib/format.ts';
import { svgX, tween } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const CW = 640;
const CH = 350;
const ML = 58;
const MR = 24;
const MT = 22;
const MB = 46;

export function SeesawCurve({ props, reveal, locked, layout }: DemoRuntimeProps<SeesawCurveProps>) {
  const inst = instrument(props.bond);
  const y0 = todayYield(props.bond);
  const p0 = todayPrice(props.bond);
  const price = (y: number) => cleanPrice(y, inst.coupon, inst.maturity, SETTLE_DATE);

  const [y, setY] = useState(y0);
  const [answer, setAnswer] = useState<{ y: number; guess: number } | null>(null);
  const yRef = useRef(y);
  yRef.current = y;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const lo = props.yieldMin * 100;
  const hi = props.yieldMax * 100;
  const { pMin, pMax, path } = useMemo(() => {
    const pMin = Math.floor(cleanPrice(props.yieldMax, inst.coupon, inst.maturity, SETTLE_DATE) / 20) * 20;
    const pMax = Math.ceil(cleanPrice(props.yieldMin, inst.coupon, inst.maturity, SETTLE_DATE) / 20) * 20;
    const sx = (v: number) => ML + ((v - lo) / (hi - lo)) * (CW - ML - MR);
    const sy = (p: number) => MT + ((pMax - p) / (pMax - pMin)) * (CH - MT - MB);
    const pts: string[] = [];
    for (let v = lo; v <= hi + 1e-9; v += 0.1) pts.push(`${sx(v).toFixed(1)},${sy(cleanPrice(v / 100, inst.coupon, inst.maturity, SETTLE_DATE)).toFixed(1)}`);
    return { pMin, pMax, path: 'M' + pts.join('L') };
  }, [inst, lo, hi]);
  const sx = (v: number) => ML + ((v - lo) / (hi - lo)) * (CW - ML - MR);
  const sy = (p: number) => MT + ((pMax - p) / (pMax - pMin)) * (CH - MT - MB);

  useEffect(() => {
    if (!reveal || reveal.kind !== 'setYield') return;
    setAnswer({ y: reveal.y, guess: reveal.guess });
    return tween(yRef.current, reveal.y, 900, setY);
  }, [reveal]);

  const setFromX = (ev: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const v = lo + ((svgX(ev, svgRef.current, CW) - ML) / (CW - ML - MR)) * (hi - lo);
    setY(Math.round(Math.max(lo, Math.min(hi, v)) * 100) / 10000);
  };

  const P = price(y);
  const status = P < 99.9 ? 'disc' : P > 100.1 ? 'prem' : 'par';
  const c = inst.coupon;

  // seesaw geometry
  const d = (y - y0) * 100;
  const tilt = Math.max(-2.5, Math.min(2.5, d)) * 14;
  const lx = 110;
  const rx = 530;
  const cy = 88;
  const ly = cy + tilt;
  const ry = cy - tilt;

  const stage = (
    <Stage title={T.stageTitle} subtitle={tpl(T.stageSub, { name: nameOf(props.bond).text, c, m: inst.maturity })} locked={locked}>
      <svg viewBox="0 0 640 150" role="img" aria-label={T.aria}>
        <line x1={lx} y1={ly} x2={rx} y2={ry} className="beam" />
        <polygon points={`320,${cy + 2} 300,130 340,130`} className="fulcrum" />
        <line x1={60} x2={580} y1={132} y2={132} className="ground" />
        <g transform={`translate(${lx},${ly})`}>
          <rect x={-64} y={-50} width={128} height={44} rx={8} className="weight w-price" />
          <text x={0} y={-33} textAnchor="middle" className="t-muted">{T.price}</text>
          <text x={0} y={-14} textAnchor="middle" className="t-strong">{P.toFixed(2)}</text>
        </g>
        <g transform={`translate(${rx},${ry})`}>
          <rect x={-64} y={-50} width={128} height={44} rx={8} className="weight w-yield" />
          <text x={0} y={-33} textAnchor="middle" className="t-muted">{T.yield}</text>
          <text x={0} y={-14} textAnchor="middle" className="t-strong">{pct(y)}</text>
        </g>
        <text x={320} y={148} textAnchor="middle" className="t-muted">
          {d > 0.05 ? T.higher : d < -0.05 ? T.lower : tpl(T.today, { p: p0.toFixed(2), y: pct(y0) })}
        </text>
      </svg>
      <svg
        ref={svgRef} viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label={T.aria}
        onPointerDown={(e) => { dragging.current = true; setFromX(e); }}
        onPointerMove={(e) => { if (dragging.current) setFromX(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      >
        {Array.from({ length: (pMax - pMin) / 20 + 1 }, (_, i) => pMin + i * 20).map((p) => (
          <g key={p}>
            <line x1={ML} x2={CW - MR} y1={sy(p)} y2={sy(p)} className="grid-line" />
            <text x={ML - 8} y={sy(p) + 4} textAnchor="end" className="t-num">{p}</text>
          </g>
        ))}
        {Array.from({ length: Math.round(hi - lo) + 1 }, (_, i) => lo + i).map((v) => (
          <text key={v} x={sx(v)} y={CH - MB + 18} textAnchor="middle" className="t-num">{v}%</text>
        ))}
        <text x={ML} y={CH - 6} className="t-axis">{T.axisX}</text>
        <text x={ML - 50} y={MT - 8} className="t-axis">{T.axisY}</text>
        <line x1={ML} x2={CW - MR} y1={sy(100)} y2={sy(100)} className="par-line" />
        <text x={ML + 6} y={sy(100) + 16} className="t-muted">{T.par}</text>
        <path d={path} className="curve" />

        <circle cx={sx(y0 * 100)} cy={sy(p0)} r={7} className="ring" />
        <text x={sx(y0 * 100) + 12} y={sy(p0) + 20} className="t-muted">{tpl(T.todayMarker, { p: p0.toFixed(2) })}</text>

        {answer ? (
          <g>
            <line x1={ML} x2={CW - MR} y1={sy(answer.guess)} y2={sy(answer.guess)} className="guess-line" />
            <text x={CW - MR} y={sy(answer.guess) - 6} textAnchor="end" className="t-guess">{tpl(T.guess, { p: answer.guess.toFixed(2) })}</text>
            <circle cx={sx(answer.y * 100)} cy={sy(price(answer.y))} r={11} className="ring-answer" />
            <text x={sx(answer.y * 100) - 14} y={sy(price(answer.y)) - 14} textAnchor="end" className="t-answer">
              {tpl(T.answer, { p: price(answer.y).toFixed(2) })}
            </text>
          </g>
        ) : null}

        <line x1={sx(y * 100)} x2={sx(y * 100)} y1={sy(P)} y2={CH - MB} className="guide" />
        <line x1={ML} x2={sx(y * 100)} y1={sy(P)} y2={sy(P)} className="guide" />
        <circle cx={sx(y * 100)} cy={sy(P)} r={7} className="dot" />
        <text x={sx(y * 100) + (y > 0.07 ? -12 : 12)} y={sy(P) - 12} textAnchor={y > 0.07 ? 'end' : 'start'} className="t-strong">
          {P.toFixed(2)} @ {pct(y)}
        </text>
      </svg>
    </Stage>
  );

  const pull = 100 - P;
  const controls = (
    <>
      <div className="box">
        <label className="label" htmlFor="yield-slider">{T.slider}<b>{pct(y)}</b></label>
        <input
          id="yield-slider" type="range" min={Math.round(lo * 100)} max={Math.round(hi * 100)} step={1}
          value={Math.round(y * 10000)} onChange={(e) => { setY(Number(e.target.value) / 10000); }}
        />
        <div className="kv"><span className="kv-k">{T.ytm}</span><span className="kv-v">{pct(y)}</span></div>
        <div className="kv"><span className="kv-k">{T.priceRow}</span><span className="kv-v">{P.toFixed(2)}</span></div>
        <div className="kv">
          <span className="kv-k">{T.status}</span>
          <span className={'pill ' + status}>{status === 'disc' ? T.discount : status === 'prem' ? T.premium : T.parPill}</span>
        </div>
        <p className="small muted">
          {status === 'disc' ? tpl(T.whyDiscount, { y: pct(y), c }) : status === 'prem' ? tpl(T.whyPremium, { y: pct(y), c }) : T.whyPar}
        </p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => setY(Math.round(y0 * 10000) / 10000)}>
            {tpl(T.reset, { p: p0.toFixed(2), y: pct(y0) })}
          </button>
        </div>
      </div>
      <div className="box">
        <h3 className="box-title">{T.breakdownTitle}</h3>
        <div className="kv"><span className="kv-k">{T.coupon}</span><span className="kv-v">{c.toFixed(2)}</span></div>
        <div className="kv"><span className="kv-k">{T.pull}</span><span className="kv-v">{signed(pull, 2)}</span></div>
        <div className="kv"><span className="kv-k">{T.currentYield}</span><span className="kv-v">{((c / P) * 100).toFixed(2)}%</span></div>
        <div className="kv"><span className="kv-k">{T.ytmBoth}</span><span className="kv-v">{pct(y)}</span></div>
      </div>
    </>
  );

  return <>{layout(stage, controls)}</>;
}
