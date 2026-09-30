import { levelMeta } from '../content/levels/index.ts';
import { ui } from '../content/ui.ts';
import { LevelHeader } from '../components/shell/LevelHeader.tsx';
import { sandboxCapital } from '../game/wallet.ts';
import { tpl, usd } from '../lib/format.ts';

export function Sandbox({ wallet, onHome }: { wallet: number; onHome: () => void }) {
  return (
    <div className="view placeholder">
      <LevelHeader meta={levelMeta(14)} onBack={onHome} />
      <div className="box">
        <p>{ui.sandbox.body}</p>
        <div className="kv">
          <span className="kv-k">{ui.sandbox.capital}</span>
          <span className="kv-v">{usd(sandboxCapital(wallet))}</span>
        </div>
        <p className="muted">{tpl(ui.sandbox.formula, { wallet: usd(wallet), total: usd(sandboxCapital(wallet)) })}</p>
      </div>
    </div>
  );
}
