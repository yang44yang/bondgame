/** Level 8 · Duration I (CLAUDE.md §4.8 outline, written out). */
import { cleanPrice, dirtyPrice, dv01, macaulayDuration, modDuration, yearsLeft } from '../../math/bond.ts';
import { instrument, SETTLE_DATE, todayYield } from '../../data/snapshot.ts';
import type { LevelContent } from '../types.ts';
import { f1, f2 } from '../calc.ts';
import { levelMeta } from './meta.ts';

const B = instrument('BOND36');
const Y = todayYield('BOND36');
const MAC = macaulayDuration(Y, B.coupon, B.maturity).years;
const MOD = modDuration(Y, B.coupon, B.maturity);
const YRS = yearsLeft(B.maturity, SETTLE_DATE);
const DIRTY = dirtyPrice(Y, B.coupon, B.maturity);
const MV100K = DIRTY * 1000;
const DV01_100K = dv01(Y, B.coupon, B.maturity) * 1000;
const moveUSD = (dy: number, faceK: number) => (cleanPrice(Y + dy, B.coupon, B.maturity) - cleanPrice(Y, B.coupon, B.maturity)) * faceK * 10;
const UP50 = moveUSD(0.005, 100);
const BET_FACE_K = 50;
const BET = moveUSD(-0.0075, BET_FACE_K);
const BET_LINEAR = MOD * 0.0075 * DIRTY * BET_FACE_K * 10;
const usd0 = (x: number) => (x < 0 ? '−$' : '+$') + Math.abs(Math.round(x)).toLocaleString('en-US');

const lesson = `
第 2 关的小赌局里，利率降 1%，BOND36 涨了 7.9%。这一关回答：为什么是 7.9%，别的债又会是多少。答案叫[[久期|Duration]]。

直觉：久期是**你的钱被这个固定利率锁住的平均年数**。签一年的租约，市场租金一变，明年就能按新价重签，几乎没影响；签二十年固定租金的租约，每一年的差价都要算进去。钱锁得越久，利率一动，价值变得越多。

[[麦考利久期|Macaulay Duration]]这样算：把每一笔现金流折回今天（它的[[现值|Present Value (PV)]]），当成挂在时间轴上的砝码，看天平的支点落在哪里，久期就是几年。BOND36 有 19 笔：最后一笔 102.25 最重，前面 18 笔 2.25 把支点往左拉了一点。支点落在 ${f2(MAC)} 年，比剩下的 ${f1(YRS)} 年短。

> 规律：票息越低，前面的砝码越轻，支点越靠右；期限越长，支点越靠右；零息债只有最后一个砝码，支点就在到期日，久期等于剩余年限。

真正拿来估算的是[[修正久期|Modified Duration]]：麦考利久期 ÷ (1 + 收益率/2)。BOND36：${f2(MAC)} ÷ ${(1 + Y / 2).toFixed(4)} = ${f2(MOD)}。它的用法只有一句：价格变化百分比 ≈ −修正久期 × 收益率变化。利率升 1%，BOND36 跌约 ${f1(MOD)}%；升 0.5%，跌约 ${f1(MOD / 2)}%。

换成钱：$100,000 面值的 BOND36，今天市值 $${Math.round(MV100K).toLocaleString('en-US')}（全价）。利率升 0.5%，久期估算是 ${usd0(-MOD * 0.005 * MV100K)}，实际 ${usd0(UP50)}，差一点点是因为曲线是弯的，下一关讲。

[[DV01|Dollar Value of 01]]：利率变 1 个基点（0.01%），价值变多少钱。BOND36 每 $100,000 面值约 $${DV01_100K.toFixed(0)}。利率变 10 个基点就是 $${(DV01_100K * 10).toFixed(0)} 左右。

首页那张表的最右边有一列"久期"，IBKR 不显示，这一关点亮成灰色；下一关把几只债放在一起比，它就全亮。
`;

const demoGuide = `
- 横梁是时间，砝码是每笔现金流的现值，三角形支点就是麦考利久期。
- 把票息拖到 0：前面的砝码全没了，支点滑到最右端，久期 = 剩余年限。
- 把票息拖高：前面的砝码变重，支点往左移，久期变短。
- 拖剩余年限：期限越长，支点越靠右。
- 右边的数字：修正久期和 DV01 就是估算价格变化用的。
`;

export const L08: LevelContent = {
  ...levelMeta(8),
  lesson,
  demo: { component: 'DurationBalance', props: { presets: ['BOND36', 'SP36', 'BOND30', 'SP48'], couponMax: 10, yearsMax: 30 } },
  demoGuide,
  quiz: [
    {
      q: `BOND36 修正久期 ${f1(MOD)}。所有收益率升 0.5%，你手里 $100,000 面值的市值大约变化？`,
      opts: ['约 −$3,500', '约 −$500', '约 −$7,500', '约 +$3,500'],
      answer: 0,
      why: `${f1(MOD)} × 0.5% ≈ 3.7%，乘以市值 $${Math.round(MV100K).toLocaleString('en-US')} 约 $3,600；凸性让实际少跌一点，是 ${usd0(UP50)}。`,
      wrong: {
        1: '0.5% 是利率的变化，价格的变化要再乘以久期。',
        2: `那是利率升 1% 的幅度：${f1(MOD)} × 1%。`,
        3: '方向反了：利率升，价格跌。',
      },
    },
    {
      q: '久期天平上，三角形支点代表什么？',
      opts: ['麦考利久期：现金流现值的加权平均时间', '到期日', '下一次付息日', '票息率'],
      answer: 0,
      why: '每笔现金流的现值是砝码，挂在它到账的时间上；天平平衡的那个点，就是久期。',
      wrong: {
        1: '只有零息债的支点在到期日；付息债前面有砝码，支点会往左。',
        2: '下一次付息只是第一个砝码的位置。',
        3: '票息决定砝码有多重，不是支点的位置。',
      },
    },
    {
      q: '同样还剩 10 年到期，票息 1% 和票息 8% 的两只债，哪只久期更长？',
      opts: ['票息 1% 的', '票息 8% 的', '一样长，都是 10 年', '看不出来'],
      answer: 0,
      why: '票息越低，前面的砝码越轻，支点越靠右，久期越长，对利率越敏感。',
      wrong: {
        1: '票息高，前面的砝码重，支点被拉向左边。',
        2: '只有零息债的久期等于剩余年限；付息债都更短。',
        3: '看得出来：票息越低久期越长，这是天平上的规律。',
      },
    },
    {
      q: '还剩 9.4 年的零息本金条，麦考利久期是多少？',
      opts: ['9.4 年', '0 年', '4.7 年', '7.5 年'],
      answer: 0,
      why: '零息债只有到期那一个砝码，支点就在到期日，久期等于剩余年限。',
      wrong: {
        1: '零息债不是没有现金流，只是全在最后一天。',
        2: '4.7 是 9.4 的一半；砝码全在最后，支点不会在中间。',
        3: '7.5 左右是付息债 BOND36 的久期；零息债没有前面的砝码，更长。',
      },
    },
    {
      q: 'DV01 是什么？',
      opts: ['利率变 1 个基点，债券价值变多少钱', '这只债每天的利息', '买价和卖价的差', 'IBKR 收的佣金'],
      answer: 0,
      why: `DV01 = Dollar Value of 01：利率变 0.01%，价值变多少美元。BOND36 每 $100,000 面值约 $${DV01_100K.toFixed(0)}。`,
      wrong: {
        1: '每天的利息是应计利息的增长，和 DV01 无关。',
        2: '那是点差 Spread，第 5 关讲的。',
        3: '佣金第 4 关讲过，最低 $5。',
      },
    },
    {
      q: `BOND36 的麦考利久期 ${f2(MAC)} 年，修正久期却是 ${f2(MOD)}。为什么修正的小一点？`,
      opts: ['修正久期 = 麦考利久期 ÷ (1 + 收益率/2)', '修正久期扣掉了应计利息', '修正久期只算票息不算本金', 'IBKR 的算法不同'],
      answer: 0,
      why: `半年付息的债，修正久期 = 麦考利久期 ÷ (1 + y/2)：${f2(MAC)} ÷ ${(1 + Y / 2).toFixed(4)} = ${f2(MOD)}。估算价格变化用的是修正久期。`,
      wrong: {
        1: '应计利息不影响久期的公式。',
        2: '本金是最重的那个砝码，当然算在里面。',
        3: 'IBKR 根本不显示久期，这是标准公式。',
      },
    },
  ],
  bet: {
    prompt: `所有收益率一起**降 0.75%**。你手里有 **$50,000** 面值的 BOND36（修正久期 ${f1(MOD)}，市值约 $${Math.round(DIRTY * 500).toLocaleString('en-US')}）。市值大约变化多少美元？`,
    slider: { min: -5_000, max: 5_000, step: 50, initial: 0, unit: 'usdChange' },
    answer: BET,
    tiers: [{ maxErr: 150, reward: 500 }, { maxErr: 400, reward: 200 }],
    explain: `久期估算：${f1(MOD)} × 0.75% × $${Math.round(DIRTY * 500).toLocaleString('en-US')} ≈ **${usd0(BET_LINEAR)}**；实际 **${usd0(BET)}**，多出来的一点是凸性 Convexity 送的，第 9 关讲。方向记牢：利率降，价格涨。`,
    reveal: { kind: 'durationShift', bond: 'BOND36', dyBp: -75, faceK: BET_FACE_K },
  },
};
