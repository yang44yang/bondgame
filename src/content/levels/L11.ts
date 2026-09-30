/** Level 11 · TIPS: Real Yield and Inflation (CLAUDE.md §4.11 outline, written out). */
import { accrued } from '../../math/bond.ts';
import { breakevenInflation } from '../../math/tips.ts';
import { instrument, model, screenMidYield, SETTLE_DATE, todayPrice } from '../../data/snapshot.ts';
import { TIPS_INDEX } from '../../data/tipsIndex.ts';
import type { LevelContent } from '../types.ts';
import { nominalCurve, yearsTo } from '../curve.ts';
import { f1, f2 } from '../calc.ts';
import { levelMeta } from './meta.ts';

const T56 = instrument('TIPS56');
const R56 = TIPS_INDEX.TIPS56;
const R50 = TIPS_INDEX.TIPS50;
const P56 = todayPrice('TIPS56');
const P50 = todayPrice('TIPS50');
const REAL56 = screenMidYield('TIPS56')! / 100;
const REAL50 = screenMidYield('TIPS50')! / 100;
const NOM50 = nominalCurve(yearsTo('TIPS50')) / 100;
const NOM56 = nominalCurve(yearsTo('TIPS56')) / 100;
const BE50 = breakevenInflation(NOM50, REAL50);
const BE56 = breakevenInflation(NOM56, REAL56);
const ACC56 = accrued(T56.coupon, T56.maturity, SETTLE_DATE);
const INV_10K = P56 * 100 * R56.indexRatio;
const ACC_10K = ACC56 * 100 * R56.indexRatio;
const CPI_UP = R56.refCpiSettle / R56.refCpiDated - 1;
const pct = (x: number, d = 2) => (x * 100).toFixed(d) + '%';
const money = (x: number) => '$' + Math.round(x).toLocaleString('en-US');
const money2 = (x: number) => '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r1 = (x: number) => Math.round(x * 1000) / 10; // percent, one decimal

const lesson = `
普通国债的票息和本金都是写死的美元数。通胀一高，到期拿回的 100 美元能买的东西就少了。[[通胀保值国债|Treasury Inflation-Protected Securities (TIPS)]]的本金跟着[[消费者物价指数|CPI]]走：CPI 涨 3%，本金就从 100 变成 103。

算法叫[[指数比率|Index Ratio]]：今天的参考 CPI ÷ 发行时的参考 CPI。TIPS56 在 2026 年 2 月发行，那时参考 CPI 是 ${R56.refCpiDated}；9 月 30 日是 ${R56.refCpiSettle.toFixed(3)}，index ratio 就是 ${R56.indexRatio.toFixed(5)}：$1,000 面值的本金现在算 ${money2(1000 * R56.indexRatio)}。票息按调整后的本金付：2.375% × ${money2(1000 * R56.indexRatio)} ÷ 2 = ${money2((0.02375 * 1000 * R56.indexRatio) / 2)}，每半年一次。到期时要是遇上通缩、本金跌破原始面值，就按原始面值还：本金有底。

> IBKR 屏幕上 TIPS 的价格和收益率都是"实际"的：价格 ${f2(P56)} 没乘 index ratio，收益率 ${pct(REAL56)} 是[[实际收益率|Real Yield]]，已经扣掉了通胀。实付 = 价格 × index ratio × 面值 + 应计利息 × index ratio。买 $10,000 面值的 TIPS56：${f2(P56)} × 100 × ${R56.indexRatio.toFixed(5)} = ${money(INV_10K)}，再加应计约 ${money(ACC_10K)}。IBKR 详情页不显示 index ratio，要去 TreasuryDirect 查，或者用 Order Ticket 第二步的 Amount 反推。

TIPS 和普通国债怎么比？同一年到期，普通国债收益率约 ${pct(NOM50, 1)}，TIPS 实际收益率约 ${pct(REAL50, 1)}，差的 ${pct(BE50, 1)} 叫[[盈亏平衡通胀|Breakeven Inflation]]：市场押的未来平均通胀。以后平均通胀高于它，TIPS 赢；低于它，普通国债赢。买 TIPS 就是押"通胀会比市场想的高"。作参考：从 2 月到 9 月，TIPS 用的参考 CPI 涨了 ${pct(CPI_UP, 1)}，才七个半月。

TIPS50 为什么只值 ${f2(P50)}？它的票息只有 0.25%，远低于 ${pct(REAL50, 1)} 的实际收益率，回报几乎全靠折价，和还剩 ${f1(yearsTo('TIPS50'))} 年的零息债差不多。它 2020 年就发了，index ratio 已经涨到 ${R50.indexRatio.toFixed(3)}：屏幕价 ${f2(P50)} × ${R50.indexRatio.toFixed(3)} ≈ ${f2(P50 * R50.indexRatio)}，这才是每 100 面值实际要付的钱。

首页六件套的第三行 TSI36，就是从 TIPS 拆出来的利息条，2036 年 2 月到期。它的收益率 ≈3.3% 也是实际收益率，不能直接和旁边 5.25% 的名义收益率比。

什么时候用 TIPS：担心未来通胀比 ${pct(BE50, 1)} 高，或者这笔钱将来要保住购买力，比如退休后的开销。它的缺点：点差更宽（TIPS56 是 0.43 点），价格也会跟着实际利率动，TIPS56 的久期约 ${Math.round(model('TIPS56').modDuration)}，不比长期国债稳。
`;

const demoGuide = `
- 拖通胀滑块：绿线是普通国债，不管通胀多少，回报都是固定的名义收益率；蓝线是 TIPS，通胀越高，回报越高。
- 两条线交叉的地方，就是[[盈亏平衡通胀|Breakeven Inflation]]。
- 切换 TIPS56 和 TIPS50，看交叉点在哪。
- 右边算的是：$10,000 放到到期各变成多少，以及到期时本金涨到多少。
`;

export const L11: LevelContent = {
  ...levelMeta(11),
  lesson,
  demo: { component: 'TipsMeter', props: { tips: ['TIPS56', 'TIPS50'], inflationMax: 6 } },
  demoGuide,
  quiz: [
    {
      q: 'TIPS 的本金会怎样变？',
      opts: ['跟着 CPI 涨：本金 × index ratio', '固定是 100', '跟着市场利率变', '跟着美元汇率变'],
      answer: 0,
      why: 'Index ratio = 今天的参考 CPI ÷ 发行时的参考 CPI；本金乘上它。票息也按调整后的本金付。',
      wrong: {
        1: '那是普通国债。TIPS 的本金会随通胀调整。',
        2: '市场利率影响的是价格，不是本金。',
        3: '和汇率无关，只看美国 CPI。',
      },
    },
    {
      q: `同一年到期：普通国债收益率 ${pct(NOM50, 1)}，TIPS 实际收益率 ${pct(REAL50, 1)}。盈亏平衡通胀大约是？`,
      opts: [pct(BE50, 1), (r1(NOM50) + r1(REAL50)).toFixed(1) + '%', pct(REAL50, 1), pct(NOM50, 1)],
      answer: 0,
      why: `两个收益率相减，约 ${pct(BE50, 1)}：未来平均通胀高于它，TIPS 赢；低于它，普通国债赢。`,
      wrong: {
        1: '要相减，不是相加。',
        2: '这是 TIPS 的实际收益率本身。',
        3: '这是普通国债的名义收益率本身。',
      },
    },
    {
      q: `TIPS56 屏幕价 ${f2(P56)}，是不是打了八折的便宜货？`,
      opts: ['不是：票息 2.375 低于 3.3% 的实际收益率，所以折价；实付还要乘 index ratio', '是，八折就是便宜', '是，因为通胀会涨', '不是，因为 TIPS 不能在 IBKR 买'],
      answer: 0,
      why: `和第 2 关一样：票息低于收益率就折价。实付每 100 面值是 ${f2(P56)} × ${R56.indexRatio.toFixed(5)} ≈ ${f2(P56 * R56.indexRatio)}。`,
      wrong: {
        1: '价格低于 100 只说明票息低于收益率，不说明便宜。',
        2: '通胀的补偿已经在 index ratio 里了，价格本身是实际价格。',
        3: '能买，IBKR 的 Bond Scanner 里 Treasury Type 选 Bond TIPS。',
      },
    },
    {
      q: `买 $10,000 面值的 TIPS56，价格 ${f2(P56)}，index ratio ${R56.indexRatio.toFixed(5)}。不算应计和佣金，要付多少？`,
      opts: [money(INV_10K), money(P56 * 100), '$10,303', money(P56 * 100 / R56.indexRatio)],
      answer: 0,
      why: `价格 × index ratio × 面值 ÷ 100：${f2(P56)} × ${R56.indexRatio.toFixed(5)} × 100 = ${money(INV_10K)}。`,
      wrong: {
        1: '漏了 index ratio：TIPS 的实付要乘上它。',
        2: '这是调整后的本金，不是今天的价钱；价格 82.81 还没乘。',
        3: 'index ratio 要乘，不是除。',
      },
    },
    {
      q: `你认为未来 20 多年平均通胀会是 3.5%，高于盈亏平衡的 ${pct(BE50, 1)}。选哪个？`,
      opts: ['TIPS', '普通国债', '一样', '都不买'],
      answer: 0,
      why: '通胀高于盈亏平衡，TIPS 的"实际收益 + 通胀"就超过了普通国债的固定收益。',
      wrong: {
        1: '普通国债的回报是固定的；通胀越高，它的实际购买力越少。',
        2: '只有通胀正好等于盈亏平衡时才一样。',
        3: '这道题只比两种国债，不是在问要不要投资。',
      },
    },
    {
      q: `TIPS50 的价格只有 ${f2(P50)}，因为？`,
      opts: ['票息只有 0.25，远低于 3.3% 的实际收益率，回报几乎全靠折价', '它快违约了', '通胀是负的', 'IBKR 显示错了'],
      answer: 0,
      why: '和零息债一样：票息越低、期限越长，折价越深。',
      wrong: {
        1: '美国国债，没有违约问题。',
        2: '这几年通胀是正的，它的 index ratio 已经到了 1.3。',
        3: '没显示错，用第 3 关的定义就能算出这个价格。',
      },
    },
    {
      q: '六件套里 TSI36 的收益率约 3.3%，比旁边几行的 5.25% 低很多。为什么？',
      opts: ['它是 TIPS 拆出来的，屏幕上是实际收益率，通胀补偿另外算', '它更安全', '它更贵，因为流动性好', '数据错了'],
      answer: 0,
      why: '实际收益率 + 通胀 ≈ 名义收益率。比较时先换成同一种收益率。',
      wrong: {
        1: '都是美国国债，信用一样。',
        2: 'TIPS 的点差更宽，流动性反而更差。',
        3: '数据没错，只是口径不同。',
      },
    },
  ],
  bet: {
    prompt: `TIPS50（2050 年 2 月到期）的实际收益率是 ${pct(REAL50)}。未来这 ${f1(yearsTo('TIPS50'))} 年，平均每年通胀多少，它才能和同一年到期的普通国债打平？`,
    slider: { min: 0, max: 5, step: 0.05, initial: 1, unit: 'share' },
    answer: BE50 * 100,
    tiers: [{ maxErr: 0.15, reward: 500 }, { maxErr: 0.4, reward: 200 }],
    explain: `约 **${pct(BE50)}**。2050 年到期的普通国债，在第 6 关的曲线上大约是 ${pct(NOM50)}，减去 TIPS50 的 ${pct(REAL50)}，大约 2.4%；精确一点（半年复利）是 ${pct(BE50)}。30 年的 TIPS56 算出来是 ${pct(BE56)}，差不多。`,
    reveal: { kind: 'breakeven', tips: 'TIPS50' },
  },
};
