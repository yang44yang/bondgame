/** A playable level: demo canvas on the left, lesson / controls / quiz / side bet on the right. */
import { useCallback, useState } from 'react';
import type { LevelContent, Phase } from '../content/types.ts';
import { DemoHost } from '../components/demos/DemoHost.tsx';
import type { Reveal } from '../components/demos/types.ts';
import { DemoPanel } from '../components/level/DemoPanel.tsx';
import { Lesson } from '../components/level/Lesson.tsx';
import { Quiz } from '../components/level/Quiz.tsx';
import { SideBet } from '../components/level/SideBet.tsx';
import { LevelHeader } from '../components/shell/LevelHeader.tsx';
import type { Game } from '../game/useGame.ts';

export function LevelView({ content, game, onHome }: { content: LevelContent; game: Game; onHome: () => void }) {
  const id = content.id;
  const phases: Phase[] = content.bet ? ['lesson', 'demo', 'quiz', 'bet'] : ['lesson', 'demo', 'quiz'];
  const [phase, setPhase] = useState<Phase>('lesson');
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const record = game.state.bets[id];
  const cleared = game.state.progress >= id;

  const go = (p: Phase) => {
    setPhase(p);
    if (p === 'bet' && record && content.bet) setReveal({ ...content.bet.reveal, guess: record.guess, nonce: Date.now() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const clearLevel = game.clearLevel;
  const onClear = useCallback(() => clearLevel(id), [clearLevel, id]);

  const place = (guess: number) => {
    if (!content.bet) return;
    game.bet(id, guess, content.bet.answer, content.bet.tiers);
    setReveal({ ...content.bet.reveal, guess, nonce: Date.now() });
  };
  const replay = () => {
    if (content.bet && record) setReveal({ ...content.bet.reveal, guess: record.guess, nonce: Date.now() });
  };

  return (
    <div className="view">
      <LevelHeader
        meta={content} onBack={onHome} phase={phase} phases={phases} onPhase={go}
        done={{ quiz: cleared, bet: Boolean(record) }}
      />
      <DemoHost
        spec={content.demo}
        reveal={reveal}
        locked={phase === 'bet' && !record && Boolean(content.bet)}
        layout={(stage, controls) => (
          <div className="level-grid">
            <div className="stage-col">{stage}</div>
            <div className="panel-col">
              {phase === 'lesson' ? <Lesson source={content.lesson} onNext={() => go('demo')} /> : null}
              {phase === 'demo' ? <DemoPanel guide={content.demoGuide} controls={controls} onNext={() => go('quiz')} /> : null}
              {phase === 'quiz' ? (
                <Quiz bank={content.quiz} rule={content.quizRule} cleared={cleared} onClear={onClear} onNext={() => go(content.bet ? 'bet' : 'quiz')} />
              ) : null}
              {phase === 'bet' && content.bet ? (
                <SideBet
                  bet={content.bet} record={record} cleared={cleared}
                  onPlace={place} onReplay={replay} onFinish={onHome} onGoQuiz={() => go('quiz')}
                />
              ) : null}
            </div>
          </div>
        )}
      />
    </div>
  );
}
