/** Level 9 demo: four real bonds under one parallel yield shift (CLAUDE.md §4.9, ported from docs/preview.html). */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { priceAt } from '../../math/instrument.ts';
import { yearsLeft } from '../../math/bond.ts';
import { instrument, model, priceable, SETTLE_DATE, todayPrice, todayYield } from '../../data/snapshot.ts';
import type { Code } from '../../data/types.ts';
import type { MultiBondChartProps } from '../../content/types.ts';
import { BOND_LABELS, multiText as T } from '../../content/demos.ts';
import { signed, tpl } from '../../lib/format.ts';
import { ui } from '../../content/ui.ts';
import { svgX, tween } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 400;
const L = 56;
const R = 146;
const TOP = 20;
const B = 44;

interface Line {
  code: Code;
  series: number;
  y0: number;
  p0: number;
  dur: number;
  yrs: number;
}

export function MultiBondChart({ props, reveal, locked, layout }: DemoRuntimeProps<MultiBondChartProps>) {
  const lines: Line[] = useMemo(
    () => props.bonds.map((code, i) => ({
      code, series: i + 1, y0: todayYield(code), p0: todayPrice(code), dur: model(code).modDuration,
      yrs: yearsLeft(instrument(code).maturity, SETTLE_DATE),
    })),
    [props.bonds],
  );
  const priceOf = (b: Line, bp: number) => priceAt(priceable(b.code), b.y0 + bp / 10000, SETTLE_DATE);
  const pctAt = (b: Line, bp: number) => (priceOf(b, bp) / b.p0 - 1) * 100;

  const [bp, setBp] = useState(0);
  const [hl, setHl] = useState<Code | null>(null);
  const bpRef = useRef(bp);
  bpRef.current = bp;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const { vMin, vMax, paths } = useMemo(() => {
    let lo = 0;
    let hi = 0;
    for (const b of lines) {
      lo = Math.min(lo, pctAt(b, props.shiftMaxBp));
      hi = Math.max(hi, pctAt(b, props.shiftMinBp));
    }
    const vMin = Math.floor(lo / 20) * 20;
    const vMax = Math.ceil(hi / 20) * 20;
    const xs = (d: number) => L + ((d - props.shiftMinBp) / (props.shiftMaxBp - props.shiftMinBp)) * (W - L - R);
    const ys = (v: number) => TOP + ((vMax - v) / (vMax - vMin)) * (H - TOP - B);
    const paths = lines.map((b) => {
      const pts: string[] = [];
      for (let d = props.shiftMinBp; d <= props.shiftMaxBp; d += 10) pts.push(`${xs(d).toFixed(1)},${ys(pctAt(b, d)).toFixed(1)}`);
      return 'M' + pts.join('L');
    });
    return { vMin, vMax, paths };
  }, [lines, props.shiftMinBp, props.shiftMaxBp]);
  const xs = (d: number) => L + ((d - props.shiftMinBp) / (props.shiftMaxBp - props.shiftMinBp)) * (W - L - R);
  const ys = (v: number) => TOP + ((vMax - v) / (vMax - vMin)) * (H - TOP - B);

  useEffect(() => {
    if (!reveal || reveal.kind !== 'setShift') return;
    setHl(reveal.highlight);
    return tween(bpRef.current, reveal.bp, 900, setBp);
  }, [reveal]);

  const setFromX = (ev: PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const d = props.shiftMinBp + ((svgX(ev, svgRef.current, W) - L) / (W - L - R)) * (props.shiftMaxBp - props.shiftMinBp);
    const snapped = Math.round(d / props.stepBp) * props.stepBp;
    setBp(Math.max(props.shiftMinBp, Math.min(props.shiftMaxBp, snapped)));
    setHl(null);
  };

  const shown = Math.round(bp);
  // right-edge labels, pushed apart so they never overlap
  const ends = lines.map((b, i) => ({ i, y: ys(pctAt(b, props.shiftMaxBp)) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 15) ends[k].y = ends[k - 1].y + 15;
  // values next to the crosshair dots
  const cx = xs(bp);
  const tags = lines.map((b, i) => ({ i, v: pctAt(b, bp), y: ys(pctAt(b, bp)) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < tags.length; k++) if (tags[k].y - tags[k - 1].y < 15) tags[k].y = tags[k - 1].y + 15;
  const tagLeft = cx > W - R - 70;

  const ticks: number[] = [];
  for (let d = props.shiftMinBp; d <= props.shiftMaxBp; d += 100) ticks.push(d);
  const grid: number[] = [];
  for (let v = vMin; v <= vMax; v += 20) grid.push(v);

  const stage = (
    <Stage title={T.stageTitle} subtitle={T.stageSub} locked={locked}>
      <svg
        ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria}
        onPointerDown={(e) => { dragging.current = true; setFromX(e); }}
        onPointerMove={(e) => { if (dragging.current) setFromX(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      >
        {grid.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={ys(v)} y2={ys(v)} className={v === 0 ? 'zero-line' : 'grid-line'} />
            <text x={L - 8} y={ys(v) + 4} textAnchor="end" className="t-num">{signed(v, 0, '%')}</text>
          </g>
        ))}
        {ticks.map((d) => (
          <text key={d} x={xs(d)} y={H - B + 18} textAnchor="middle" className="t-num">{signed(d, 0)}</text>
        ))}
        <text x={L} y={H - 6} className="t-axis">{T.axisX}</text>
        <text x={L - 50} y={TOP - 8} className="t-axis">{T.axisY}</text>
        {lines.map((b, i) => (
          <path key={b.code} d={paths[i]} className={`series series-${b.series}` + (hl ? (hl === b.code ? ' is-hl' : ' is-faded') : '')} />
        ))}
        {ends.map((e) => (
          <text key={e.i} x={W - R + 8} y={e.y + 4} className="t-label">{BOND_LABELS[lines[e.i].code]?.short ?? lines[e.i].code}</text>
        ))}
        <line x1={cx} x2={cx} y1={TOP} y2={H - B} className="cross" />
        {lines.map((b) => (
          <circle key={b.code} cx={cx} cy={ys(pctAt(b, bp))} r={6} className={`dot fill-${b.series}`} />
        ))}
        {shown !== 0
          ? tags.map((t) => (
              <text key={t.i} x={tagLeft ? cx - 10 : cx + 10} y={t.y + 4} textAnchor={tagLeft ? 'end' : 'start'} className="t-strong" style={{ fill: `var(--s${lines[t.i].series})`, fontSize: 12.5 }}>
                {signed(t.v, 1, '%')}
              </text>
            ))
          : null}
      </svg>
    </Stage>
  );

  const controls = (
    <div className="box">
      <label className="label" htmlFor="shift-slider">{T.slider}<b>{tpl(ui.units.bp, { n: signed(shown, 0) })}</b></label>
      <input
        id="shift-slider" type="range" min={props.shiftMinBp} max={props.shiftMaxBp} step={props.stepBp} value={shown}
        onChange={(e) => { setBp(Number(e.target.value)); setHl(null); }}
      />
      <div className="ib-wrap" style={{ margin: 0, padding: 0 }}>
        <table className="dtable">
          <thead>
            <tr><th>{T.colBond}</th><th>{T.colYears}</th><th>{T.colNow}</th><th>{T.colNew}</th><th>{T.colChange}</th><th>{T.colDuration}</th></tr>
          </thead>
          <tbody>
            {lines.map((b) => {
              const np = priceOf(b, bp);
              const ch = (np / b.p0 - 1) * 100;
              return (
                <tr key={b.code} className={hl === b.code ? 'is-hl' : undefined}>
                  <td className="nowrap" title={BOND_LABELS[b.code]?.line}><span className={`sw fill-${b.series}`} />{BOND_LABELS[b.code]?.short ?? b.code}</td>
                  <td>{b.yrs.toFixed(1)}</td>
                  <td>{b.p0.toFixed(2)}</td>
                  <td>{np.toFixed(2)}</td>
                  <td className={ch > 0.005 ? 'up' : ch < -0.005 ? 'dn' : undefined}>{signed(ch, 1, '%')}</td>
                  <td>{b.dur.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="note">{T.note}</p>
    </div>
  );

  return <>{layout(stage, controls)}</>;
}
