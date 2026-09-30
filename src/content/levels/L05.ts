/** Level 5 · Bid / Ask and the Cost of the Spread (CLAUDE.md §4.5 outline, written out). */
import { headerQuote, instrument, SNAPSHOT } from '../../data/snapshot.ts';
import { spreadTable } from '../../data/model.ts';
import type { Code } from '../../data/types.ts';
import type { LevelContent } from '../types.ts';
import { levelMeta } from './meta.ts';

const Q36 = headerQuote('BOND36');
const QA = headerQuote('NOTE36A');
const SPREADS = spreadTable(SNAPSHOT);
const spread = (c: Code) => SPREADS.find((r) => r.code === c)!;
const S36 = Q36.ask.value! - Q36.bid.value!; // 0.1328
const px = (x: number | null, d = 3) => (x === null ? '—' : x.toFixed(d));
const usd = (x: number) => '$' + Math.round(x).toLocaleString('en-US');
const BET_FACE = 100_000;
const BET_ANSWER = (S36 * BET_FACE) / 100;
const TEN_K = (S36 * 10_000) / 100;
const OUTSTANDING = instrument('BOND36').records.flatMap((r) => (r.type === 'fields' ? [r.fields['Amount Outstanding']] : [])).find(Boolean);

const lesson = `
IBKR 详情页头部右边有两行报价。这是 NOTE36A 的截图：

- \`Ask ${px(QA.ask.value)}(${px(QA.askYield.value)}%) × $${QA.askSizeK.value!.toLocaleString('en-US')}K\`
- \`Bid ${px(QA.bid.value)}(${px(QA.bidYield.value)}%) × $${QA.bidSizeK.value!.toLocaleString('en-US')}K\`

每一行三样东西：价格、括号里的收益率、× 后面的 Size。

[[卖价|Ask]]是市场上有人愿意卖给你的最低价，你买就买在 Ask；[[买价|Bid]]是有人愿意从你手里买的最高价，你卖就卖在 Bid。Ask 永远比 Bid 高，中间的差叫[[点差|Spread]]。就像银行换汇：现汇买入价和卖出价之间那一截，就是你换过去再换回来白交的钱。

> 主线债 BOND36：Bid ${px(Q36.bid.value)}，Ask ${px(Q36.ask.value)}，点差 ${S36.toFixed(3)} 点。买 $100,000 面值、马上卖掉，什么都没发生，就亏了 ${S36.toFixed(3)} × 1,000 = ${usd(BET_ANSWER)}。点差是真金白银的交易成本，和佣金一样，只是不单独列出来。

收益率也分两个：Bid 收益率 ${px(Q36.bidYield.value)}%，Ask 收益率 ${px(Q36.askYield.value)}%。Bid 收益率更高，因为价格低、收益率就高（第 2 关的跷跷板）。你买在 Ask，锁定的是 Ask 收益率 ${px(Q36.askYield.value)}%，不是 ${px(Q36.bidYield.value)}%。Scanner 里的 CURRENT BID YIELD 和 CURRENT ASK YIELD 就是这两个数。

[[挂单量|Size]]：× 后面的 $${Q36.askSizeK.value!.toLocaleString('en-US')}K 是对手盘在这个价愿意成交的面值，K 是千，$${Q36.askSizeK.value!.toLocaleString('en-US')}K 就是 ${(Q36.askSizeK.value! / 10).toLocaleString('en-US')} 万美元面值。你买 $10,000 面值远远够；要是买得比它多，多出来的部分就得往更高的价去找。

点差大小取决于[[流动性|Liquidity]]：交易越活跃，点差越窄。2026-09-29 的真实点差，每 100 面值：
- 2026 年 8 月新发的 10 年期 NOTE36A：${spread('NOTE36A').points.toFixed(2)}
- 本金条 SP48：${spread('SP48').points.toFixed(2)}；主线债 BOND36：${spread('BOND36').points.toFixed(2)}
- 通胀保值债 TIPS56：${spread('TIPS56').points.toFixed(2)}
- 2000 年发的老券 BOND30：约 ${spread('BOND30').points.toFixed(2)}，收益率差 ${Math.round(spread('BOND30').yieldBp!)} 个基点

下单用[[限价单|Limit Order]]：Order Ticket 的 ORDER TYPE 选 Limit，LIMIT PRICE 填你最多愿意付的价，通常就填 Ask。确认时 IBKR 还会弹出 Confirm Mandatory Cap Price：为了防止成交价离谱，它可能给买单设一个上限、卖单设一个下限，限价填得太离谱的单子可能不成交。

持有到期的人，点差只在买入时付一次；来回倒腾的人，每一次都要付。
`;

const demoGuide = `
- 左上是仿 IBKR 详情页头部：Ask 一行红，Bid 一行蓝，括号里是收益率，× 后面是 [[挂单量|Size]]。
- 点 Buy：你买在 Ask，锁定的是 Ask 收益率。再点 Sell：你卖在 Bid。一买一卖亏掉的就是[[点差|Spread]]。
- 拖面值滑块，看亏掉的美元数怎么跟着变。
- 换几只债：下面的条形图是五只债的点差，越长越贵。
`;

export const L05: LevelContent = {
  ...levelMeta(5),
  lesson,
  demo: { component: 'QuoteSpread', props: { bonds: ['NOTE36A', 'BOND36', 'SP48', 'TIPS56', 'BOND30'], faceMaxK: 100, defaultFaceK: 100 } },
  demoGuide,
  quiz: [
    {
      q: `详情页头部写着 \`Ask ${px(QA.ask.value)}(${px(QA.askYield.value)}%)\` 和 \`Bid ${px(QA.bid.value)}(${px(QA.bidYield.value)}%)\`。你现在点 Buy 买入，成交价大约是？`,
      opts: [px(QA.bid.value), px(QA.ask.value), `${px(QA.last.value)}（中间）`, px(QA.askYield.value)],
      answer: 1,
      why: `买在 Ask，卖在 Bid。你付 ${px(QA.ask.value)}，锁定的收益率是 ${px(QA.askYield.value)}%。`,
      wrong: {
        0: `${px(QA.bid.value)} 是 Bid：别人从你手里买的价。你要买，就得付卖家要的价。`,
        2: '中间价只是参考，没人按它卖给你。',
        3: `${px(QA.askYield.value)} 是括号里的收益率，不是价格。`,
      },
    },
    {
      q: `BOND36：Bid ${px(Q36.bid.value)}，Ask ${px(Q36.ask.value)}。买 $10,000 面值后马上卖掉，价格没变，亏多少（不算佣金）？`,
      opts: ['$0，价格没变', `$${TEN_K.toFixed(2)}`, `$${BET_ANSWER.toFixed(2)}`, `$${(TEN_K / 10).toFixed(2)}`],
      answer: 1,
      why: `点差 × 面值 ÷ 100 = ${S36.toFixed(3)} × 100 = $${TEN_K.toFixed(2)}。这就是一买一卖的摩擦成本。`,
      wrong: {
        0: `价格没变，但你买在 Ask、卖在 Bid，中间差了 ${S36.toFixed(3)} 点。`,
        2: `那是 $100,000 面值的亏损。$10,000 是 100 个 100，${S36.toFixed(3)} × 100 = $${TEN_K.toFixed(2)}。`,
        3: '少算了一位：$10,000 面值是 100 个 100。',
      },
    },
    {
      q: '下面四只里，一买一卖成本最高的是？',
      opts: ['2026 年新发的 10 年期 NOTE36A', '主线债 BOND36', '通胀保值债 TIPS56', '2000 年发的老券 BOND30'],
      answer: 3,
      why: `老券 BOND30 点差约 ${spread('BOND30').points.toFixed(2)} 点，收益率差 ${Math.round(spread('BOND30').yieldBp!)} bp。越老、越冷门，点差越宽。`,
      wrong: {
        0: `新券最活跃，点差只有 ${spread('NOTE36A').points.toFixed(2)}。`,
        1: `${spread('BOND36').points.toFixed(2)} 点，中等。`,
        2: `${spread('TIPS56').points.toFixed(2)} 点，不便宜，但老券更贵。`,
      },
    },
    {
      q: `为什么 BOND36 的 Bid 收益率（${px(Q36.bidYield.value)}%）比 Ask 收益率（${px(Q36.askYield.value)}%）高？`,
      opts: ['Bid 价格低，价格低收益率就高', 'Bid 是给卖家的奖励', 'IBKR 算错了', 'Bid 收益率里含了佣金'],
      answer: 0,
      why: `同一只债，价格越低收益率越高。你买在 Ask，所以你拿到的是较低的 ${px(Q36.askYield.value)}%。`,
      wrong: {
        1: '收益率不是奖励，是由价格算出来的。',
        2: '没算错，用第 2 关的跷跷板就能验证。',
        3: '佣金不在收益率里，另算。',
      },
    },
    {
      q: `\`Ask ${px(Q36.ask.value)} × $${Q36.askSizeK.value!.toLocaleString('en-US')}K\` 里的 $${Q36.askSizeK.value!.toLocaleString('en-US')}K 是什么？`,
      opts: ['这只债一共发行了 20 亿', `卖家在这个价愿意卖的面值：${(Q36.askSizeK.value! / 10).toLocaleString('en-US')} 万美元`, '今天成交了 2,000 笔', '最少要买 $2,000'],
      answer: 1,
      why: `K 是千：$${Q36.askSizeK.value!.toLocaleString('en-US')}K = $${(Q36.askSizeK.value! * 1000).toLocaleString('en-US')} 面值。你要买的比它少，就全在这个价成交；比它多，多出来的部分要往更高的价找。`,
      wrong: {
        0: `发行量要看详情页的 Issue Amount；这只的 Amount Outstanding 是 ${OUTSTANDING}。`,
        2: 'Size 不是成交笔数，是挂着等成交的数量。',
        3: '最小下单量是 Min Order Amount 1，也就是 $1,000 面值。',
      },
    },
  ],
  bet: {
    prompt: `BOND36：Bid ${px(Q36.bid.value)}，Ask ${px(Q36.ask.value)}。买 **$100,000** 面值，马上卖掉，价格一点没变，不算佣金。你亏了多少钱？`,
    slider: { min: 0, max: 1_000, step: 5, initial: 500, unit: 'usd' },
    answer: BET_ANSWER,
    tiers: [{ maxErr: 20, reward: 500 }, { maxErr: 60, reward: 200 }],
    explain: `${S36.toFixed(3)} 点 × 1,000 = **${usd(BET_ANSWER)}**。持有到期的人，这笔成本只在买入时付一次；来回倒腾的人，每一次都要付。同样 $100,000 面值，新券 NOTE36A 来回只要 ${usd(spread('NOTE36A').points * 1000)}，老券 BOND30 要 ${usd(spread('BOND30').points * 1000)}。`,
    reveal: { kind: 'roundTrip', bond: 'BOND36', faceK: BET_FACE / 1000 },
  },
};
