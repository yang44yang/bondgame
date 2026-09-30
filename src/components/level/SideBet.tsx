import { useState } from 'react';
import type { SideBet as Bet } from '../../content/types.ts';
import { ui } from '../../content/ui.ts';
import type { BetRecord } from '../../game/storage.ts';
import { signed, tpl, usd } from '../../lib/format.ts';
import { Markdown } from './Markdown.tsx';

interface Props {
  bet: Bet;
  record: BetRecord | undefined;
  cleared: boolean;
  onPlace: (guess: number) => void;
  onReplay: () => void;
  onFinish: () => void;
  onGoQuiz: () => void;
}

function formatValue(x: number, unit: Bet['slider']['unit']): string {
  if (unit === 'usd') return usd(x);
  if (unit === 'usdChange') return (x > 0 ? '+' : '') + usd(x);
  if (unit === 'pct') return signed(x, 1, '%');
  if (unit === 'share') return x.toFixed(2) + '%';
  return x.toFixed(2);
}

function formatErr(x: number, unit: Bet['slider']['unit']): string {
  const n = unit === 'usd' || unit === 'usdChange' ? usd(x) : x.toFixed(unit === 'pct' ? 1 : 2);
  return n + ui.bet.errSuffix[unit];
}

function ErrValue({ x, unit }: { x: number; unit: Bet['slider']['unit'] }) {
  const n = unit === 'usd' || unit === 'usdChange' ? usd(x) : x.toFixed(unit === 'pct' ? 1 : 2);
  return <>{n}<small className="en">{ui.bet.errSuffix[unit]}</small></>;
}

export function SideBet({ bet, record, cleared, onPlace, onReplay, onFinish, onGoQuiz }: Props) {
  const [guess, setGuess] = useState(bet.slider.initial);
  const tiers = [...bet.tiers].sort((a, b) => a.maxErr - b.maxErr);
  const rule = tpl(ui.bet.rule, {
    t1: formatErr(tiers[0].maxErr, bet.slider.unit), r1: usd(tiers[0].reward),
    t2: formatErr(tiers[1]?.maxErr ?? tiers[0].maxErr, bet.slider.unit), r2: usd(tiers[1]?.reward ?? 0),
  });
  const u = bet.slider.unit;

  return (
    <div className="box">
      <h3 className="box-title">{ui.bet.title.zh} <span className="en">{ui.bet.title.en}</span></h3>
      <Markdown source={bet.prompt} />
      <p className="bet-rule">{rule}</p>
      {!record ? (
        <>
          <label className="label" htmlFor="bet-slider">{ui.bet.yourGuess}</label>
          <output className="bet-value" htmlFor="bet-slider">{formatValue(guess, u)}</output>
          <input
            id="bet-slider" type="range" aria-label={ui.bet.sliderLabel}
            min={bet.slider.min} max={bet.slider.max} step={bet.slider.step} value={guess}
            onChange={(e) => setGuess(Number(e.target.value))}
          />
          <div className="btn-row">
            <button type="button" className="btn primary" onClick={() => onPlace(guess)}>{ui.bet.place}</button>
          </div>
        </>
      ) : (
        <div className="bet-result" aria-live="polite">
          <div className="bet-nums">
            <div><span>{ui.bet.answer}</span><b>{formatValue(record.answer, u)}</b></div>
            <div><span>{ui.bet.yourGuess}</span><b>{formatValue(record.guess, u)}</b></div>
            <div><span>{ui.bet.offBy}</span><b><ErrValue x={record.err} unit={u} /></b></div>
          </div>
          <p className={'reward ' + (record.reward > 0 ? 'win' : 'lose')}>
            {record.reward > 0 ? tpl(ui.bet.won, { r: usd(record.reward) }) : ui.bet.lost}
          </p>
          <Markdown source={bet.explain} />
          <div className="btn-row">
            <button type="button" className="btn" onClick={onReplay}>{ui.bet.replay}</button>
            {cleared ? (
              <button type="button" className="btn primary" onClick={onFinish}>{ui.bet.finish}</button>
            ) : (
              <button type="button" className="btn" onClick={onGoQuiz}>{ui.bet.goQuiz}</button>
            )}
          </div>
          {!cleared ? <p className="note">{ui.bet.needQuiz}</p> : null}
        </div>
      )}
    </div>
  );
}
