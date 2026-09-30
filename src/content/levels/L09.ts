/** Level 9 · Duration II and Convexity (CLAUDE.md §4.9; lesson text from docs/preview.html). */
import { model, todayPrice } from '../../data/snapshot.ts';
import type { LevelContent } from '../types.ts';
import { f1, f2, pctChange, s1, years } from '../calc.ts';
import { levelMeta } from './meta.ts';

/** Modified duration rounded to one decimal, the way the table shows it, so text arithmetic adds up. */
const DUR = (c: Parameters<typeof model>[0]) => Math.round(model(c).modDuration * 10) / 10;
const SP48_DN1 = pctChange('SP48', -0.01); // ≈ +24%
const SP48_UP1 = pctChange('SP48', 0.01); // ≈ −19%
const SP48_DN2 = pctChange('SP48', -0.02); // bet answer ≈ +53%
const SP48_UP2 = pctChange('SP48', 0.02);
const B36_UP2 = pctChange('BOND36', 0.02); // ≈ −13.9%
const BILL_UP1 = pctChange('BILL27', 0.01);

const lesson = `
上一关你学了[[久期|Duration]]的定义：利率每变 1%，价格大约变百分之几。这一关把四只真实的债放在一起，对同一个利率变动，看它们的反应差多少。

还是用[[租约|Lease]]打比方。签一年租约和签二十年固定租金租约，市场租金一变，两份合同的价值差别天差地别：一年的那份，明年就能按新价重签，几乎不受影响；二十年的那份，每一年的差价都要算进去。久期就是"你的钱被这个固定利率锁住的平均年数"，锁得越久，利率一动你越有感觉。

> 规律只有两条：[[剩余年限|Years to Maturity]]越长，越敏感；[[票息|Coupon]]越低（[[零息|Zero-coupon]]最低），越敏感。零息债的钱全部锁到最后一天，所以久期等于剩余年限，是同期限里最敏感的。

严格说，"等于剩余年限"的是[[麦考利久期|Macaulay Duration]]；表里那一列是[[修正久期|Modified Duration]]，再除以 1 + 收益率/2，所以还剩 ${f1(years('SP48'))} 年的本金条修正久期是 ${f1(DUR('SP48'))}。

还有一个细节：曲线是弯的（[[凸性|Convexity]]）。利率降 1% 涨的，比利率升 1% 跌的多。这是债券对持有人的一点小偏心，久期越长，偏心越明显。
`;

const demoGuide = `
- 拖右边的滑块，或者在图上左右拖：所有收益率一起变动，这叫[[平行移动|Parallel Shift]]。
- 四条线越陡，那只债的久期越长。
- 对比 +100 和 −100 两个点：同一只债，降 1% 涨的比升 1% 跌的多，这就是[[凸性|Convexity]]。
- 表里最后一列是[[修正久期|Modified Duration]]：利率变 1%，价格大约变百分之几。
`;

export const L09: LevelContent = {
  ...levelMeta(9),
  lesson,
  demo: { component: 'MultiBondChart', props: { bonds: ['BILL27', 'BOND30', 'BOND36', 'SP48'], shiftMinBp: -300, shiftMaxBp: 300, stepBp: 25 } },
  demoGuide,
  quiz: [
    {
      q: '你判断未来一年利率会降 1%。四只里哪只赚最多？',
      opts: ["Bill Sep'27", "Bond 6.25 May'30", "Bond 4.5 Feb'36", "STRIPS Principal Aug'48"],
      answer: 3,
      why: `久期 ${f1(DUR('SP48'))} 的 STRIPS 涨约 ${f1(SP48_DN1)}%。但同一件事的另一面：如果你判断错了、利率升 1%，它也是跌得最多的那只（约 ${s1(SP48_UP1)}%）。押方向之前，先看久期决定押多大。`,
      wrong: {
        0: '一年内到期的债，利率怎么变它都快拿回 100 了，几乎不动。',
        1: `${f1(years('BOND30'))} 年、高票息，久期只有 ${f1(DUR('BOND30'))}。`,
        2: `${f1(years('BOND36'))} 年、久期 ${f1(DUR('BOND36'))}，是第二敏感的；但零息的 ${f1(years('SP48'))} 年长条更敏感。`,
      },
    },
    {
      q: '利率升 1% 和降 1%，同一只债的涨跌幅为什么不对称？',
      opts: ['市场偏好上涨', '凸性 Convexity：价格–收益率曲线是弯的', 'IBKR 的算法问题', '票息 Coupon 不对称'],
      answer: 1,
      why: '价格随收益率变化的曲线向下凸，所以利率降时涨得多、利率升时跌得少。久期越长，这个不对称越明显。',
      wrong: {
        0: '和市场情绪无关，是数学。',
        2: '任何计算器算出来都一样。',
        3: '票息是固定的，不存在不对称。',
      },
    },
    {
      q: `主线债 4.5 Feb'36 的修正久期 Modified Duration 约 ${f1(DUR('BOND36'))}。所有收益率一起升 2%，它的价格大约？`,
      opts: [
        `跌 ${f1(DUR('BOND36'))}%`,
        `跌约 ${f1(-B36_UP2)}%：久期估 ${f1(2 * DUR('BOND36'))}%，凸性让实际少跌一点`,
        `跌约 ${f1(4 * DUR('BOND36') - -B36_UP2)}%：久期估 ${f1(2 * DUR('BOND36'))}%，凸性让实际多跌一点`,
        '跌 2%',
      ],
      answer: 1,
      why: `ΔP% ≈ −修正久期 × Δy = −${f1(DUR('BOND36'))} × 2% = −${f1(2 * DUR('BOND36'))}%。实际是 ${s1(B36_UP2)}%，凸性 Convexity 让跌幅小了一点。`,
      wrong: {
        0: `${f1(DUR('BOND36'))}% 是利率变 1% 的幅度，这里变了 2%。`,
        2: '凸性的方向反了：它让涨得更多、跌得更少，对持有人有利。',
        3: '价格变化 ≈ 久期 × 利率变化，不是利率变化本身。',
      },
    },
    {
      q: "为什么 Bill Sep'27 那条线几乎是平的？",
      opts: ['国库券 Bill 不受利率影响', `它不到一年就到期，钱锁得短，久期只有 ${f1(DUR('BILL27'))}`, '它是零息的，零息债最不敏感', 'IBKR 没给它报价'],
      answer: 1,
      why: '久期看的是钱被锁多久。不到一年就把 100 还给你，利率怎么变，你都很快能按新利率重新投资。',
      wrong: {
        0: `受影响，只是很小：利率升 1%，它跌约 ${f1(-BILL_UP1)}%。`,
        2: '零息反而是同期限里最敏感的；它不敏感是因为期限短。',
        3: `有报价，今天 ${f2(todayPrice('BILL27'))}。`,
      },
    },
    {
      q: `如果换成一只和主线债同一天到期、还剩 ${f1(years('SP36'))} 年的零息本金条，它的修正久期大约是？`,
      opts: [
        `${f1(DUR('BOND36'))}，和同期限的付息债一样`,
        `${f1(DUR('SP36'))} 左右：零息的钱全部锁到最后一天`,
        `${f1(DUR('SP48'))}，和 Aug'48 一样`,
        '0：零息没有现金流，所以没有久期',
      ],
      answer: 1,
      why: `零息债的麦考利久期 Macaulay Duration 就是剩余年限 ${f1(years('SP36'))}，修正久期再除以 1 + 收益率/2，约 ${f1(DUR('SP36'))}。首页六件套里 STRIPS 那几行的久期就是这个数。`,
      wrong: {
        0: `付息债每半年先还你一点，平均锁的时间比 ${f1(years('BOND36'))} 年短；零息一分不先还。`,
        2: `久期跟剩余年限走，${f1(years('SP36'))} 年的零息不会有 ${f1(years('SP48'))} 年那么长的久期。`,
        3: '零息有现金流，只是全在最后一天，所以久期反而最长。',
      },
    },
  ],
  bet: {
    prompt: `明天所有收益率一起降 **2%**（−200 个基点 basis points）。STRIPS Aug'48 的价格会涨百分之几？修正久期 ${f1(DUR('SP48'))} × 2% ≈ ${f1(2 * DUR('SP48'))}% 是直线估算；凸性 Convexity 会让它偏多少，凭直觉押。`,
    slider: { min: 20, max: 80, step: 1, initial: 40, unit: 'pct' },
    answer: SP48_DN2,
    tiers: [{ maxErr: 3, reward: 500 }, { maxErr: 8, reward: 200 }],
    explain: `实际涨 **${s1(SP48_DN2)}%**，比久期直线估的 +${f1(2 * DUR('SP48'))}% 多出 ${f1(SP48_DN2 - 2 * DUR('SP48'))} 个百分点，这就是凸性 Convexity。反过来升 2%，它跌 ${s1(SP48_UP2)}%，比直线估的少跌。久期越长，这个偏心越大。`,
    reveal: { kind: 'setShift', bp: -200, highlight: 'SP48' },
  },
};
