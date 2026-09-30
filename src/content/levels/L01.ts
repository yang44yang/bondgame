/** Level 1 · Reading a Bond's Name (CLAUDE.md §4.1). */
import { cashflows } from '../../math/bond.ts';
import { instrument, SETTLE_DATE } from '../../data/snapshot.ts';
import type { LevelContent } from '../types.ts';
import { f1, years } from '../calc.ts';
import { levelMeta } from './meta.ts';

const B = instrument('BOND36');
const FLOWS = cashflows(B.coupon, B.maturity, SETTLE_DATE);
const N = FLOWS.length; // 19
const HALF = B.coupon / 2; // 2.25
const BET_FACE = 10_000;
const BET_ANSWER = N * HALF * (BET_FACE / 100); // 4,275

const lesson = `
你在 IBKR 里看到的每一只国债都有一长串名字。Bond Scanner 列表里显示的是短名 \`US-T Govt Bond 4.5 Feb15'36\`，点进详情页，走势图标题上是全名 \`US-T GOVT 4.5 Feb15'36 912810FT0 AA1 · United States Treasury · 1 · SMART\`。这串东西不是随便排的，它是这张债的身份证，每一段都有含义。先把它拆开。

- \`US-T\` 是[[美国国债|United States Treasury]]，发债的人是美国财政部。
- \`GOVT\` 是[[发行人类型|Issuer Type]]：政府债。
- \`4.5\` 是[[票息|Coupon]]，每年按面值的 4.5% 付利息；美国国债一律半年付一次，所以每半年付 ${HALF}。
- \`Feb15'36\` 是[[到期日|Maturity]]：2036 年 2 月 15 日，那天你拿回[[面值|Face Value]]。
- \`912810FT0\` 是 CUSIP，九位的证券编号，相当于车的车架号：名字可能重，CUSIP 不会重，IBKR 里搜债最可靠的方式就是搜 CUSIP。
- \`AA1\` 是穆迪 Moody's 给的[[评级|Rating]]，美国国债 2025 年从最高档 Aaa 下调到 Aa1，这个数对交易没有影响，认识就行。

> 把债券想成一张写死条款的[[借条|IOU]]：谁借（US-T）、借多少（面值）、每年给多少利息（票息）、什么时候还（到期）。这四条写在借条上，一辈子不变。以后会变的，只有这张借条在别人手里转手的价格，那是下一关的事。

面值 Face Value 在 IBKR 详情页的 Issuer Information 里显示 \`1,000.00\`，意思是一张的面值是 1,000 美元；但所有报价都按[[每 100 面值|Per 100]]来写，95.48 的意思是每 100 面值卖 95.48 美元，一张 1,000 面值就是 954.80 美元。付息信息在 Coupon Features 块：Coupon Type \`FIXED\`，每年 2 月 15 日和 8 月 15 日各付一次，每 100 面值付 ${HALF}，每 1,000 面值付 22.50。注意那个 Rate 字段会把 4.625 显示成 \`4.6\`、2.375 显示成 \`2.4\`，**票息要从名字里读**。

名字里的 Bill、Note、Bond 三个词先只认名字，第 6 关细讲：Bill 是一年以内的，不付票息，靠折价赚钱；Note 是 2 到 10 年的；Bond 是 20 到 30 年的。注意这个分类按**发行时**的期限定，不按现在还剩多久。4.5 Feb'36 是 2006 年发的 30 年期 Bond，今天只剩 ${f1(years('BOND36'))} 年，名字里还是 Bond，就像一个 60 岁的人身份证上的出生年份不会跟着年龄改。

最后一个概念：[[现金流|Cash Flow]]。从今天到 2036 年 2 月，这张债一共还会给你 ${N} 次票息，最后一次连本金一起给。把它们排在时间轴上，你就看见了你买的到底是什么：不是一个"4.5%"，而是 ${N} 笔 ${HALF} 和一笔 100，日期都写死了。
`;

const demoGuide = `
左边是这只债从今天到到期的每一笔[[现金流|Cash Flow]]，每根柱子一笔。

- 点任一根柱子（或在图上左右滑），看日期和金额。
- 切换[[面值|Face Value]] $1,000 / $10,000 / $100,000：美元数跟着变，每 100 面值永远是 ${HALF}。
- 换成 NOTE36F：同一天到期，[[票息|Coupon]] 4.125，每根柱子变矮成 2.0625。
- 换成 SP36：只剩最后一根 100。这是零息的本金条 STRIPS，第 10 关讲。
`;

export const L01: LevelContent = {
  ...levelMeta(1),
  lesson,
  demo: { component: 'CashflowTimeline', props: { bonds: ['BOND36', 'NOTE36F', 'SP36'], faces: [1_000, 10_000, 100_000], defaultFace: 10_000 } },
  demoGuide,
  quiz: [
    {
      q: '名字里的 `4.5` 是什么？',
      opts: ['价格 Price', '每年的票息率 Coupon Rate，按面值算', '到期收益率 Yield to Maturity (YTM)', '剩余年限 Years to Maturity'],
      answer: 1,
      why: `\`4.5\` 是票息率 Coupon Rate：每 100 面值每年付 4.5 美元，分两次付，每次 ${HALF}。`,
      wrong: {
        0: '价格 Price 是 95.48，在名字下面另一行，而且每天都在变。',
        2: '收益率 Yield 是市场算出来的，每天都变；票息 Coupon 写在借条上，一辈子不变。',
        3: "剩余年限要看 `Feb15'36` 那一段，不看 4.5。",
      },
    },
    {
      q: "`Feb15'36` 是什么？",
      opts: ['发行日 Issue Date', '到期日 Maturity', '下次付息日 Next Coupon Date', '评级日期 Rating Date'],
      answer: 1,
      why: "`Feb15'36` 是 2036 年 2 月 15 日，到期日 Maturity。那天你拿回面值 Face Value，外加最后一次票息。",
      wrong: {
        0: '发行日 Issue Date 不写在名字里，要去详情页的 Issuer Information 看。这一只是 2006 年发的。',
        2: '下次付息是 2027-02-15，恰好同月同日，但年份是 2027 不是 2036。付息日是从到期日每半年往前倒推的，所以月日相同。',
        3: '名字里没有评级日期；评级是最后 `AA1` 那一段。',
      },
    },
    {
      q: `面值 Face Value $1,000、票息 Coupon 4.5、半年付息，每次付你多少？`,
      opts: ['$45', '$22.50', '$4.50', '$2.25'],
      answer: 1,
      why: '一年是 4.5% × $1,000 = $45，半年付一次，每次 $22.50。',
      wrong: {
        0: '$45 是一整年的。国债半年付一次，要除以 2。',
        2: '4.5 是每 100 面值一年的票息，不是每次付给你的美元数。',
        3: `${HALF} 是每 100 面值半年的。你有 10 个 100，要乘以 10。`,
      },
    },
    {
      q: `这只债只剩 ${f1(years('BOND36'))} 年，为什么名字里还叫 Bond 不叫 Note？`,
      opts: ['名字按发行时的期限定：它 2006 年发行时是 30 年期', 'IBKR 标错了', '剩余超过 5 年的都叫 Bond', '票息 Coupon 高的叫 Bond'],
      answer: 0,
      why: '身份证上的出生年份不会跟着年龄改。2006 年发行时是 30 年期，就一辈子叫 Bond。',
      wrong: {
        1: '没标错。按发行时的期限命名是财政部的规则，IBKR 照抄。',
        2: `分类不看剩余年限。同一天到期的 \`US-T Govt Note 4.125 Feb15'36\` 也只剩 ${f1(years('NOTE36F'))} 年，它叫 Note。`,
        3: "票息高低和名字无关。`US-T Govt Note 4.625 Aug15'36` 票息比 4.5 还高，也叫 Note。",
      },
    },
    {
      q: '名字最后的 `AA1` 是什么？',
      opts: ['交易所代码 Exchange Code', "穆迪 Moody's 给的评级 Rating", '最高评级 Top Rating', '债券系列号 Series Number'],
      answer: 1,
      why: "`AA1` 是穆迪 Moody's 的评级 Rating（IBKR 写成大写 AA1，穆迪自己写 Aa1）。认识就行，对交易没有影响。",
      wrong: {
        0: '交易场所在详情页头部，是 BONDDESKG 和 SMART，不在这一段。',
        2: '穆迪的最高档是 Aaa。美国国债 2025 年从 Aaa 下调到 Aa1，比最高档低一格。',
        3: '证券编号是 CUSIP `912810FT0` 那一段。',
      },
    },
  ],
  bet: {
    prompt: `从今天到到期，一张面值 Face Value **$10,000** 的 \`4.5 Feb'36\` 一共会付给你多少票息 Coupon（不含本金 Principal）？拖滑块押一个数。`,
    slider: { min: 2_000, max: 8_000, step: 50, initial: 5_000, unit: 'usd' },
    answer: BET_ANSWER,
    tiers: [{ maxErr: 200, reward: 500 }, { maxErr: 500, reward: 200 }],
    explain: `${N} 次 × 每次 $${(HALF * 100).toFixed(0)} = **$${BET_ANSWER.toLocaleString('en-US')}**。每 100 面值每次 ${HALF}，$10,000 是 100 个 100。注意这是票息加起来的总数，不是回报率：最后那一根里的 $10,000 本金只是把你的钱还给你。`,
    reveal: { kind: 'cashflowSum', bond: 'BOND36', face: BET_FACE },
  },
};
