import { useEffect, useRef, useState } from 'react';
import type { Question } from '../../content/types.ts';
import { ui } from '../../content/ui.ts';
import { drawQuiz, isCorrect, type DrawnQuestion } from '../../game/quiz.ts';
import { quizCleared } from '../../game/progress.ts';
import { tpl } from '../../lib/format.ts';
import { Inline } from './Markdown.tsx';

interface Props {
  bank: Question[];
  rule: { draw: number; need: number };
  cleared: boolean;
  onClear: () => void;
  onNext: () => void;
}

function QuestionCard({ d, index, total, picked, onPick }: { d: DrawnQuestion; index: number; total: number; picked: number | null; onPick: (k: number) => void }) {
  const answered = picked !== null;
  const right = answered && isCorrect(d, picked);
  const shownAnswer = d.order.indexOf(d.question.answer);
  return (
    <div className="box q">
      <div className="q-head">{tpl(ui.quiz.counter, { i: index + 1, n: total })}</div>
      <div className="q-text"><Inline text={d.question.q} /></div>
      <div className="opts">
        {d.order.map((orig, k) => {
          const cls = !answered ? '' : orig === d.question.answer ? ' is-right' : k === picked ? ' is-wrong' : ' is-muted';
          return (
            <button key={k} type="button" className={'opt' + cls} disabled={answered} onClick={() => onPick(k)}>
              <span className="opt-letter">{ui.quiz.letters[k]}</span>
              <span><Inline text={d.question.opts[orig]} /></span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className="feedback" aria-live="polite">
          {right ? (
            <p><span className="ok">{ui.quiz.correct}</span> <Inline text={d.question.why} /></p>
          ) : (
            <>
              <p>
                <span className="bad">{ui.quiz.wrong}</span> {ui.quiz.wrongPickBefore}
                <Inline text={d.question.opts[d.order[picked]]} />
                {ui.quiz.wrongPickAfter}
                <Inline text={d.question.wrong[d.order[picked]] ?? ''} />
              </p>
              <p>{tpl(ui.quiz.rightAnswer, { letter: ui.quiz.letters[shownAnswer] })}<Inline text={d.question.why} /></p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function Quiz({ bank, rule, cleared, onClear, onNext }: Props) {
  const [attempt, setAttempt] = useState(() => ({ n: 0, drawn: drawQuiz(bank, rule.draw) }));
  const [picked, setPicked] = useState<(number | null)[]>(() => Array(rule.draw).fill(null));
  const top = useRef<HTMLDivElement>(null);

  const results = attempt.drawn.map((d, i) => (picked[i] === null ? null : isCorrect(d, picked[i]!)));
  const done = results.every((r) => r !== null);
  const passed = done && quizCleared(results as boolean[], rule);
  const correct = results.filter((r) => r === true).length;

  useEffect(() => {
    if (passed) onClear();
  }, [passed, onClear]);

  const pick = (i: number, k: number) => setPicked((p) => p.map((v, j) => (j === i && v === null ? k : v)));
  const retry = () => {
    setAttempt((a) => ({ n: a.n + 1, drawn: drawQuiz(bank, rule.draw, a.drawn.map((d) => d.bank)) }));
    setPicked(Array(rule.draw).fill(null));
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="quiz" ref={top}>
      <div className="box">
        <p>{cleared ? ui.quiz.alreadyCleared : ui.quiz.intro}</p>
        {!cleared ? <p className="small muted">{ui.quiz.introEn}</p> : null}
      </div>
      {attempt.drawn.map((d, i) => (
        <QuestionCard key={`${attempt.n}-${d.bank}`} d={d} index={i} total={rule.draw} picked={picked[i]} onPick={(k) => pick(i, k)} />
      ))}
      {done ? (
        <div className={'quiz-result ' + (passed ? 'pass' : 'fail')} aria-live="polite">
          <p><b>{passed ? tpl(ui.quiz.passed, { n: rule.draw }) : tpl(ui.quiz.failed, { c: correct, n: rule.draw })}</b></p>
          <div className="btn-row">
            {passed ? (
              <button type="button" className="btn primary" onClick={onNext}>{ui.quiz.next}</button>
            ) : (
              <button type="button" className="btn primary" onClick={retry}>{ui.quiz.retry}</button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
