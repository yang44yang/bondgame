/** Level 3 · What Yield to Maturity Means (CLAUDE.md §4.3 outline, written out). */
import { accrued, cashflows, cleanPrice } from '../../math/bond.ts';
import { yearsBetween } from '../../math/dates.ts';
import { instrument, SETTLE_DATE, todayPrice, todayYield } from '../../data/snapshot.ts';
import type { LevelContent } from '../types.ts';
import { f1, f2, years } from '../calc.ts';
import { levelMeta } from './meta.ts';

const B = instrument('BOND36');
const P0 = todayPrice('BOND36');
const Y0 = todayYield('BOND36');
const DIRTY0 = P0 + accrued(B.coupon, B.maturity, SETTLE_DATE);
const N = cashflows(B.coupon, B.maturity, SETTLE_DATE).length;
const P30 = todayPrice('BOND30');
const Y30 = todayYield('BOND30');
const CY36 = (B.coupon / P0) * 100;
const CY30 = (instrument('BOND30').coupon / P30) * 100;

const BET_DATE = '2031-02-15';
const BET_ANSWER = cleanPrice(Y0, B.coupon, B.maturity, BET_DATE);
/** What a straight line from today's price to 100 would give on the bet date. */
const LINEAR = P0 + (100 - P0) * (yearsBetween(SETTLE_DATE, BET_DATE) / years('BOND36'));
const y2 = (y: number) => (y * 100).toFixed(2) + '%';

const lesson = `
上一关说：价格 Price 和到期收益率是同一件事的两种说法。这一关把它说精确。[[到期收益率|Yield to Maturity (YTM)]]的定义只有一句话：让"今天付的钱 = 未来每一笔现金流按这个利率折回今天的总和"成立的那个利率。

先说[[折现|Discounting]]。一年后的 105 元，按 5% 算，今天只值 100 元；两年后的 110.25 元，今天也只值 100 元。离今天越远的钱，折得越狠。YTM 就是一个统一的折扣率：用它把 2027 年 2 月的 2.25、2027 年 8 月的 2.25……一直到 2036 年 2 月的 102.25，一共 ${N} 笔全部折回今天，加起来正好等于你今天实付的 ${f2(DIRTY0)}（屏幕价 ${f2(P0)} 再加一点应计利息，第 4 关讲）。这个利率算出来是 ${y2(Y0)}。

换个说法：你借给朋友 ${f2(P0)} 元，他答应每半年还你 2.25，九年多以后再还 100。这笔借款的"内部年化"是多少？不是 4.5%，那是按 100 算的；而是能让这 ${N} 笔还款折回今天正好等于 ${f2(P0)} 的那个利率。公司财务里这叫[[内部收益率|Internal Rate of Return (IRR)]]，债券里就叫 YTM。

再对比一次[[当前收益率|Current Yield]]：票息 ÷ 价格，4.5 ÷ ${f2(P0)} = ${CY36.toFixed(2)}%。它只算了每年拿多少，没算到期多拿回来的 ${f2(100 - P0)} 点。溢价债正好反过来：BOND30 票息 6.25、价格 ${f2(P30)}，当前收益率 ${CY30.toFixed(2)}% 看着很高，但到期只还 100，多付的 ${f2(P30 - 100)} 点要亏回去，YTM 只有 ${y2(Y30)}。

> [[拉回面值|Pull to Par]]：如果收益率一直不变，价格会随着时间一步步走向 100，到期那天正好是 100。折价债一路涨，溢价债一路跌。这不是赚也不是亏，是买的那天就定好的：折价债每年"涨回来"的那部分，本来就算在 ${y2(Y0)} 里了。

所以打算持有到期的人，中间价格怎么晃，都不影响他拿到的 YTM。只有一个前提：[[再投资|Reinvestment]]。YTM 的算法默认你每半年收到的 2.25，都能按同样的 ${y2(Y0)} 再投资出去。实际做不到：票息到账那天的利率可能是 3%，也可能是 7%。这叫[[再投资风险|Reinvestment Risk]]。想彻底没有这个问题，就买中间不付息的零息债，第 10 关的 STRIPS。

最后回到 IBKR 屏幕：Scanner 里每只债有两个收益率，CURRENT BID YIELD 5.121% 和 CURRENT ASK YIELD 5.103%。它们就是分别按买价和卖价算出来的 YTM。为什么有两个、你该看哪一个，第 5 关讲。
`;

const demoGuide = `
- 拖日期滑块，或者点"播放"：收益率一直是 ${y2(Y0)}，看价格怎么从 ${f2(P0)} 走到 100。
- 看下面的票息柱：每过半年又收到一笔 2.25，越攒越高。
- 切到 BOND30：溢价债从 ${f2(P30)} 一路跌向 100，但它票息高，票息柱长得更快。
- 两条线都在到期那天碰到 100：这就是[[拉回面值|Pull to Par]]。
`;

export const L03: LevelContent = {
  ...levelMeta(3),
  lesson,
  demo: { component: 'PullToPar', props: { bonds: ['BOND36', 'BOND30'] } },
  demoGuide,
  quiz: [
    {
      q: '到期收益率 Yield to Maturity (YTM) 是什么？',
      opts: ['票息 ÷ 价格', '让"今天的价格 = 未来所有现金流折现之和"成立的那个利率', '债券每年付给你的利息', '美联储定的利率'],
      answer: 1,
      why: 'YTM 是这笔投资的"内部年化"：用它把每一笔票息和最后的本金折回今天，加起来正好等于你付的钱。',
      wrong: {
        0: '这是当前收益率 Current Yield，只算了票息，没算到期补回（或亏回）面值的那一块。',
        2: '那是票息 Coupon，写在借条上一辈子不变；YTM 跟着价格每天在变。',
        3: '美联储定的是短期政策利率；每只债的 YTM 由它自己的价格算出来。',
      },
    },
    {
      q: '一只债票息 Coupon 3%，今天价格 92。它的到期收益率 YTM？',
      opts: ['高于 3%', '低于 3%', '正好 3%', '看不出来'],
      answer: 0,
      why: '价格低于面值 ⇔ YTM 高于票息（折价 Discount）；价格高于面值 ⇔ YTM 低于票息（溢价 Premium）；正好 100 ⇔ 相等（平价 Par）。',
      wrong: {
        1: '价格低于 100 是折价：你付得少、到期拿回 100，回报比票息高。',
        2: '只有价格正好是 100（平价 Par）时，YTM 才等于票息。',
        3: '看得出来：价格和面值比一比，就知道 YTM 比票息高还是低。',
      },
    },
    {
      q: `收益率一直不变，BOND30（6.25 May'30，今天 ${f2(P30)}）的价格接下来会？`,
      opts: ['一路涨，因为票息高', '一路跌向 100，到期正好 100', `一直保持 ${f2(P30)}`, '到期时跌破 100'],
      answer: 1,
      why: '拉回面值 Pull to Par：溢价债一路跌向 100，折价债一路涨向 100。这是买的那天就定好的，已经算在 YTM 里，不是亏钱。',
      wrong: {
        0: '票息高是它现在贵的原因，不是它还会涨的原因。到期只还 100。',
        2: '收益率不变，价格也会动：离到期越近，越向 100 靠拢。',
        3: '到期那天财政部按面值 100 还钱，不会低于 100。',
      },
    },
    {
      q: `你 ${f2(P30)} 买了 BOND30，持有到期拿回 100，"亏了 ${f2(P30 - 100)} 点"。这笔投资的年化回报大约是？`,
      opts: ['负的，因为亏了本金', `约 ${f1(Y30 * 100)}%：多拿的票息把这几点补回来还有余`, '6.25%，就是票息', `${f1(CY30)}%，票息 ÷ 价格`],
      answer: 1,
      why: `YTM 约 ${y2(Y30)}，和别的国债差不多。溢价买入、到期"亏"的那几点，是提前付给卖家的高票息，早就算进去了。`,
      wrong: {
        0: `只看了本金这一头。每年 6.25 的票息比市场多拿 1 个多点，${f1(years('BOND30'))} 年攒下来比 ${f2(P30 - 100)} 点多。`,
        2: `票息按面值 100 算，你付的是 ${f2(P30)}，还要摊掉多付的那几点。`,
        3: `这是当前收益率 Current Yield，没算到期亏回的 ${f2(P30 - 100)} 点。`,
      },
    },
    {
      q: `YTM ${y2(Y0)} 默认了一件事，实际上做不到。是什么？`,
      opts: ['票息会跟着利率调整', `每次收到的票息都能按同样的 ${y2(Y0)} 再投资`, '你会在到期前卖掉', '价格每天不变'],
      answer: 1,
      why: '每半年到账的票息要找地方再投资。利率变了，再投资的回报就变了，这叫再投资风险 Reinvestment Risk。零息的 STRIPS 中间不付息，没有这个问题，第 10 关讲。',
      wrong: {
        0: '国债票息是固定的，写在借条上；这是条款，不是假设。',
        2: '正好相反，YTM 假设你一直持有到期。',
        3: 'YTM 不要求价格不变；持有到期的人根本不在乎中间的价格。',
      },
    },
  ],
  bet: {
    prompt: `收益率一直保持 ${y2(Y0)} 不变。到 **2031 年 2 月 15 日**，这只 4.5 Feb'36 的价格是多少？今天是 ${f2(P0)}，到期是 100。拖滑块押一个数。`,
    slider: { min: 95, max: 100, step: 0.05, initial: 95.5, unit: 'price' },
    answer: BET_ANSWER,
    tiers: [{ maxErr: 0.25, reward: 500 }, { maxErr: 0.75, reward: 200 }],
    explain: `答案是 **${f2(BET_ANSWER)}**。如果价格沿直线走向 100，那天该是 ${f2(LINEAR)}；实际更低，因为拉回面值是前慢后快：离到期越近，每年补回来的越多。不管哪条路，到期那天都正好是 100。`,
    reveal: { kind: 'setDate', bond: 'BOND36', date: BET_DATE },
  },
};
