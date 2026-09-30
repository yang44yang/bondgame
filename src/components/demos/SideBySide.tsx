/** Level 7 demo: three 2036 bonds side by side; one common yield moves all three prices (CLAUDE.md §4.7). */
import { useEffect, useMemo, useState } from 'react';
import { cleanPrice } from '../../math/bond.ts';
import { spreadTable } from '../../data/model.ts';
import { headerQuote, instrument, screenMidYield, SNAPSHOT, todayPrice, todayYield } from '../../data/snapshot.ts';
import type { Code } from '../../data/types.ts';
import type { SideBySideProps } from '../../content/types.ts';
import { BOND_LABELS, sideText as T } from '../../content/demos.ts';
import { scannerChrome } from '../../content/home.ts';
import { pct, signed, tpl } from '../../lib/format.ts';
import { tween } from '../../lib/animate.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 300;
const X0 = 70;
const X1 = 610;
const T0 = 44;
const B0 = 232;
const SERIES: Partial<Record<Code, number>> = { BOND36: 3, NOTE36F: 1, NOTE36A: 2 };
const SPREADS = spreadTable(SNAPSHOT);

export function SideBySide({ props, reveal, locked, layout }: DemoRuntimeProps<SideBySideProps>) {
  const [mode, setMode] = useState<'today' | 'same'>('today');
  const [y, setY] = useState(screenMidYield('NOTE36A')! / 100);
  const [answer, setAnswer] = useState<{ code: Code; guess: number } | null>(null);

  const bonds = props.bonds;
  const priceNow = (c: Code) => todayPrice(c);
  const priceAt = (c: Code, yy: number) => cleanPrice(yy, instrument(c).coupon, instrument(c).maturity);
  const shown = (c: Code) => (mode === 'today' ? priceNow(c) : priceAt(c, y));

  const [pMin, pMax] = useMemo(() => {
    const all = bonds.flatMap((c) => [priceNow(c), priceAt(c, props.yieldMin), priceAt(c, props.yieldMax)]);
    return [Math.floor(Math.min(...all) / 2) * 2, Math.ceil(Math.max(...all, 100) / 2) * 2];
  }, [bonds, props.yieldMin, props.yieldMax]);
  const py = (p: number) => T0 + ((pMax - p) / (pMax - pMin)) * (B0 - T0);
  const colW = (X1 - X0) / bonds.length;
  const cx = (i: number) => X0 + colW * (i + 0.5);

  useEffect(() => {
    if (!reveal || reveal.kind !== 'sameYield') return;
    setMode('same');
    setAnswer({ code: reveal.bond, guess: reveal.guess });
    return tween(y, reveal.y, 700, setY);
  }, [reveal]);

  const setSame = (yy: number) => { setMode('same'); setY(yy); };
  const gap = shown('BOND36') - shown('NOTE36F');
  const grid: number[] = [];
  for (let v = pMin; v <= pMax; v += 2) grid.push(v);

  const stage = (
    <Stage title={T.stageTitle} subtitle={mode === 'today' ? T.stageSubToday : tpl(T.stageSubSame, { y: pct(y) })} locked={locked}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria}>
        <text x={X0 - 56} y={T0 - 24} className="t-axis">{T.axisY}</text>
        {grid.map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={py(v)} y2={py(v)} className={v === 100 ? 'par-line' : 'grid-line'} />
            <text x={X0 - 8} y={py(v) + 4} textAnchor="end" className="t-num">{v}</text>
          </g>
        ))}
        {bonds.map((c, i) => {
          const p = shown(c);
          const inst = instrument(c);
          const series = SERIES[c] ?? 1;
          const ytm = mode === 'today' ? (screenMidYield(c) ?? todayYield(c) * 100) / 100 : y;
          return (
            <g key={c}>
              <text x={cx(i)} y={T0 - 26} textAnchor="middle" className="t-label">{tpl(T.ytmLine, { y: pct(ytm) })}</text>
              <rect x={cx(i) - 42} y={py(p)} width={84} height={B0 - py(p)} rx={4} className={`fill-${series}`} style={{ opacity: answer && answer.code !== c ? 0.35 : 0.9 }} />
              <text x={cx(i)} y={py(p) - 8} textAnchor="middle" className="t-strong">{p.toFixed(2)}</text>
              {mode === 'same' ? (
                <g>
                  <circle cx={cx(i) + 52} cy={py(priceNow(c))} r={6} className="ring" />
                  <text x={cx(i) + 52} y={py(priceNow(c)) + 20} textAnchor="middle" className="t-muted" style={{ fontSize: 11 }}>{tpl(T.ring, { p: priceNow(c).toFixed(2) })}</text>
                </g>
              ) : null}
              <text x={cx(i)} y={B0 + 20} textAnchor="middle" className="t-label t-bold">{BOND_LABELS[c]?.short ?? c}</text>
              <text x={cx(i)} y={B0 + 37} textAnchor="middle" className="t-muted">{tpl(T.couponLine, { c: inst.coupon })}</text>
              <text x={cx(i)} y={B0 + 54} textAnchor="middle" className="t-muted">{tpl(T.maturityLine, { m: inst.maturity.slice(0, 7) })}</text>
            </g>
          );
        })}
        {answer ? (() => {
          const i = bonds.indexOf(answer.code);
          if (i < 0) return null;
          return (
            <g>
              <line x1={X0} x2={X1} y1={py(answer.guess)} y2={py(answer.guess)} className="guess-line" />
              <text x={cx(i) + 50} y={py(answer.guess) - 6} className="t-guess">{tpl(T.guess, { p: answer.guess.toFixed(2) })}</text>
              <circle cx={cx(i)} cy={py(shown(answer.code))} r={10} className="ring-answer" />
            </g>
          );
        })() : null}
      </svg>
      <div className="ib-wrap" style={{ margin: 0, padding: 0 }}>
        <table className="dtable">
          <thead>
            <tr><th />{bonds.map((c) => <th key={c}>{BOND_LABELS[c]?.short ?? c}</th>)}</tr>
          </thead>
          <tbody>
            <tr><td>{T.rowCoupon}</td>{bonds.map((c) => <td key={c}>{instrument(c).coupon}</td>)}</tr>
            <tr><td>{T.rowMaturity}</td>{bonds.map((c) => <td key={c}>{instrument(c).maturity}</td>)}</tr>
            <tr><td>{T.rowPrice}</td>{bonds.map((c) => <td key={c}>{priceNow(c).toFixed(2)}</td>)}</tr>
            <tr><td>{T.rowYtm}</td>{bonds.map((c) => <td key={c}>{((screenMidYield(c) ?? 0)).toFixed(2)}%</td>)}</tr>
            <tr>
              <td>{T.rowSpread}</td>
              {bonds.map((c) => {
                const r = SPREADS.find((s) => s.code === c);
                return <td key={c}>{!r ? scannerChrome.dash : r.source === 'computed' && r.points < 0.01 ? T.spreadTiny : r.points.toFixed(3)}</td>;
              })}
            </tr>
            <tr>
              <td>{T.rowSize}</td>
              {bonds.map((c) => {
                const q = headerQuote(c);
                const k = (v: number | null) => (v === null ? scannerChrome.dash : `$${v.toLocaleString('en-US')}K`);
                return <td key={c} className="small wrap">{k(q.bidSizeK.value)} / {k(q.askSizeK.value)}</td>;
              })}
            </tr>
            <tr><td>{T.rowIssued}</td>{bonds.map((c) => <td key={c} className="small wrap">{T.issued[c as keyof typeof T.issued] ?? scannerChrome.dash}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </Stage>
  );

  const controls = (
    <div className="box">
      <div className="seg">
        <button type="button" className={'seg-btn' + (mode === 'today' ? ' is-on' : '')} aria-pressed={mode === 'today'} onClick={() => { setMode('today'); setAnswer(null); }}>{T.modeToday}</button>
        <button type="button" className={'seg-btn' + (mode === 'same' ? ' is-on' : '')} aria-pressed={mode === 'same'} onClick={() => setMode('same')}>{T.modeSame}</button>
      </div>
      <label className="label" htmlFor="same-y">{T.slider}<b>{pct(y)}</b></label>
      <input
        id="same-y" type="range" min={Math.round(props.yieldMin * 10000)} max={Math.round(props.yieldMax * 10000)} step={1}
        value={Math.round(y * 10000)} onChange={(e) => { setAnswer(null); setSame(Number(e.target.value) / 10000); }}
      />
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => { setAnswer(null); setSame(screenMidYield('NOTE36A')! / 100); }}>{tpl(T.quickNote, { y: pct(screenMidYield('NOTE36A')! / 100) })}</button>
        <button type="button" className="btn" onClick={() => { setAnswer(null); setSame(todayYield('BOND36')); }}>{tpl(T.quickBond, { y: pct(todayYield('BOND36')) })}</button>
      </div>
      <div className="kv"><span className="kv-k">{T.gap}</span><span className="kv-v">{signed(gap, 2)}</span></div>
    </div>
  );

  return <>{layout(stage, controls)}</>;
}
