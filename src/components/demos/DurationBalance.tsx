/** Level 8 demo: cash-flow present values as weights on a beam; the fulcrum is Macaulay duration (CLAUDE.md §4.8). */
import { useEffect, useState } from 'react';
import { cleanPrice, dirtyPrice, dv01, macaulayDuration, modDuration, yearsLeft } from '../../math/bond.ts';
import { addMonths, isoDate, toUTC } from '../../math/dates.ts';
import { instrument, SETTLE_DATE, todayYield } from '../../data/snapshot.ts';
import type { Code } from '../../data/types.ts';
import type { DurationBalanceProps } from '../../content/types.ts';
import { BOND_LABELS, balanceText as T } from '../../content/demos.ts';
import { pct, signed, tpl, usd } from '../../lib/format.ts';
import { Stage } from './Stage.tsx';
import type { DemoRuntimeProps } from './types.ts';

const W = 640;
const H = 290;
const X0 = 40;
const X1 = 610;
const BEAM = 196;
const MAX_H = 70;
const X_MAX = 30;

interface Bond {
  preset: Code | null;
  coupon: number;
  maturity: string;
  y: number;
}

function presetBond(code: Code): Bond {
  const i = instrument(code);
  return { preset: code, coupon: i.coupon, maturity: i.maturity, y: todayYield(code) };
}

/** Maturity for a custom bond: whole half-years after settlement, so coupons fall on clean dates. */
function customMaturity(years: number): string {
  return isoDate(addMonths(toUTC(SETTLE_DATE), Math.round(years * 2) * 6, true));
}

export function DurationBalance({ props, reveal, locked, layout }: DemoRuntimeProps<DurationBalanceProps>) {
  const [bond, setBond] = useState<Bond>(() => presetBond(props.presets[0]));
  const [shock, setShock] = useState<{ dyBp: number; faceK: number } | null>(null);

  useEffect(() => {
    if (!reveal || reveal.kind !== 'durationShift') return;
    setBond(presetBond(reveal.bond));
    setShock({ dyBp: reveal.dyBp, faceK: reveal.faceK });
  }, [reveal]);

  const years = yearsLeft(bond.maturity, SETTLE_DATE);
  const { years: mac, flows } = macaulayDuration(bond.y, bond.coupon, bond.maturity);
  const mod = modDuration(bond.y, bond.coupon, bond.maturity);
  const dv = dv01(bond.y, bond.coupon, bond.maturity) * 1000;
  const x = (t: number) => X0 + (t / X_MAX) * (X1 - X0);

  const setCustom = (patch: Partial<{ coupon: number; years: number }>) => {
    setShock(null);
    setBond((b) => ({
      preset: null,
      y: b.y,
      coupon: patch.coupon ?? b.coupon,
      maturity: patch.years !== undefined ? customMaturity(patch.years) : b.maturity,
    }));
  };

  const shockView = shock
    ? (() => {
        const dy = shock.dyBp / 10000;
        const face = shock.faceK * 1000;
        const mv = (dirtyPrice(bond.y, bond.coupon, bond.maturity) * face) / 100;
        const est = -mod * dy * mv;
        const act = ((cleanPrice(bond.y + dy, bond.coupon, bond.maturity) - cleanPrice(bond.y, bond.coupon, bond.maturity)) * face) / 100;
        const money = (v: number) => (v > 0 ? '+' : '') + usd(v);
        return { title: tpl(T.revealTitle, { d: signed(shock.dyBp / 100, 2, '%').replace('−', ''), face: usd(face) }), est: money(est), act: money(act) };
      })()
    : null;

  const stage = (
    <Stage title={T.stageTitle} subtitle={T.stageSub} locked={locked}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.aria}>
        {flows.map((f) => {
          // Area proportional to present value, so a weight twice as heavy looks twice as big.
          const r = Math.max(2.5, Math.sqrt(f.pv) * 3);
          return <circle key={f.date} cx={x(f.t)} cy={BEAM - 3 - r} r={r} className={f.cf > 50 ? 'bar-principal' : 'bar-coupon'} style={{ opacity: 0.9 }} />;
        })}
        <line x1={x(0)} x2={x(years)} y1={BEAM} y2={BEAM} className="beam" />
        <line x1={x(years)} x2={x(years)} y1={BEAM - MAX_H - 16} y2={BEAM + 4} className="ref-line" />
        <text x={x(years) + (years > 24 ? -6 : 6)} y={BEAM - MAX_H - 20} textAnchor={years > 24 ? 'end' : 'start'} className="t-muted">
          {tpl(T.maturity, { t: years.toFixed(1) })}
        </text>
        <polygon points={`${x(mac)},${BEAM + 3} ${x(mac) - 16},${BEAM + 34} ${x(mac) + 16},${BEAM + 34}`} className="fulcrum" style={{ fill: 'var(--amber)' }} />
        <line x1={X0 - 10} x2={X1} y1={BEAM + 34} y2={BEAM + 34} className="ground" />
        <text x={x(mac)} y={BEAM + 54} textAnchor="middle" className="t-strong">{tpl(T.fulcrum, { d: mac.toFixed(2) })}</text>
        {[0, 5, 10, 15, 20, 25, 30].map((v) => (
          <text key={v} x={x(v)} y={H - 6} textAnchor="middle" className="t-num">{v}</text>
        ))}
        <text x={X1} y={H - 22} textAnchor="end" className="t-axis">{T.axisX}</text>
        {shockView ? (
          <g>
            <rect x={W - 262} y={8} width={254} height={70} rx={8} className="callout-box" />
            <text x={W - 250} y={30} className="t-label">{shockView.title}</text>
            <text x={W - 250} y={50} className="t-muted">{tpl(T.revealEst, { v: shockView.est })}</text>
            <text x={W - 250} y={70} className="t-answer">{tpl(T.revealAct, { v: shockView.act })}</text>
          </g>
        ) : null}
      </svg>
    </Stage>
  );

  const controls = (
    <>
      <div className="box">
        <div className="box-title">{T.preset}</div>
        <div className="seg">
          {props.presets.map((c) => (
            <button key={c} type="button" className={'seg-btn' + (bond.preset === c ? ' is-on' : '')} aria-pressed={bond.preset === c} onClick={() => { setShock(null); setBond(presetBond(c)); }}>
              {c}<span className="sub">{BOND_LABELS[c]?.short}</span>
            </button>
          ))}
        </div>
        {bond.preset === null ? <p className="small muted">{T.custom}</p> : null}
        <label className="label" htmlFor="bal-coupon">{T.couponSlider}<b>{tpl(T.pctVal, { n: bond.coupon.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') })}</b></label>
        <input id="bal-coupon" type="range" min={0} max={props.couponMax} step={0.125} value={bond.coupon} onChange={(e) => setCustom({ coupon: Number(e.target.value) })} />
        <label className="label" htmlFor="bal-years">{T.yearsSlider}<b>{tpl(T.yearsVal, { n: years.toFixed(1) })}</b></label>
        <input id="bal-years" type="range" min={0.5} max={props.yearsMax} step={0.5} value={Math.round(years * 2) / 2} onChange={(e) => setCustom({ years: Number(e.target.value) })} />
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => { setShock(null); setBond((b) => ({ ...b, preset: null, coupon: 0 })); }}>{T.zero}</button>
        </div>
      </div>
      <div className="box">
        <div className="kv"><span className="kv-k">{T.yieldRow}</span><span className="kv-v">{pct(bond.y)}</span></div>
        <div className="kv"><span className="kv-k">{T.macaulay}</span><span className="kv-v">{mac.toFixed(2)}</span></div>
        <div className="kv"><span className="kv-k">{T.modified}</span><span className="kv-v">{mod.toFixed(2)}</span></div>
        <div className="kv"><span className="kv-k">{T.dv01}</span><span className="kv-v">{usd(dv, 2)}</span></div>
        <div className="kv"><span className="kv-k">{T.estimate}</span><span className="kv-v dn">{signed(-mod, 1, '%')}</span></div>
      </div>
    </>
  );

  return <>{layout(stage, controls)}</>;
}
