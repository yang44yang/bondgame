import { useEffect, useRef, useState } from 'react';
import { ui } from '../../content/ui.ts';
import { tpl, usd } from '../../lib/format.ts';

export function TopBar({ wallet, progress, onHome }: { wallet: number; progress: number; onHome: () => void }) {
  const [bump, setBump] = useState(false);
  const prev = useRef(wallet);
  useEffect(() => {
    if (wallet === prev.current) return;
    prev.current = wallet;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 900);
    return () => window.clearTimeout(t);
  }, [wallet]);

  return (
    <header className="topbar">
      <div className="topbar-in">
        <button type="button" className="brand" onClick={onHome}>
          {ui.brand.zh} <span className="en">{ui.brand.en}</span>
        </button>
        <div className="topbar-right">
          <span className="progress-label">{tpl(ui.progress, { n: progress })}</span>
          <span className={'wallet' + (bump ? ' bump' : '')} aria-live="polite">
            {ui.wallet.zh} <span className="en progress-label">{ui.wallet.en}</span>
            <b>{usd(wallet)}</b>
          </span>
        </div>
      </div>
    </header>
  );
}
