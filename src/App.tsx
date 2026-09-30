import { useEffect } from 'react';
import { LEVEL_META, LEVELS, levelMeta } from './content/levels/index.ts';
import { TopBar } from './components/shell/TopBar.tsx';
import { isUnlocked } from './game/progress.ts';
import { useGame } from './game/useGame.ts';
import { DEV, useView } from './lib/route.ts';
import { Exam } from './views/Exam.tsx';
import { Home } from './views/Home.tsx';
import { LevelView } from './views/Level.tsx';
import { LevelPlaceholder } from './views/LevelPlaceholder.tsx';
import { Sandbox } from './views/Sandbox.tsx';

export function App() {
  const [view, go] = useView();
  const game = useGame();
  const { progress } = game.state;
  const home = () => go({ name: 'home' });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const open = (id: number) => {
    const meta = levelMeta(id);
    if (meta.view === 'exam') go({ name: 'exam' });
    else if (meta.view === 'sandbox') go({ name: 'sandbox' });
    else go({ name: 'level', id });
  };

  let body;
  if (view.name === 'level' && LEVEL_META.some((m) => m.id === view.id)) {
    const content = LEVELS[view.id];
    const meta = levelMeta(view.id);
    body = content && isUnlocked(view.id, progress)
      ? <LevelView key={view.id} content={content} game={game} onHome={home} />
      : <LevelPlaceholder meta={meta} game={game} dev={DEV} onHome={home} />;
  } else if (view.name === 'exam') {
    body = <Exam progress={progress} onHome={home} />;
  } else if (view.name === 'sandbox') {
    body = <Sandbox wallet={game.state.wallet} onHome={home} />;
  } else {
    body = <Home game={game} dev={DEV} onOpen={open} onExam={() => go({ name: 'exam' })} />;
  }

  return (
    <>
      <TopBar wallet={game.state.wallet} progress={progress} onHome={home} />
      <main>{body}</main>
    </>
  );
}
