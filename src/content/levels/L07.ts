/** Level 7 · Three Bonds, One Maturity (CLAUDE.md §4.7 outline, written out). */
import { cleanPrice } from '../../math/bond.ts';
import { spreadTable } from '../../data/model.ts';
import { instrument, screenMidYield, SNAPSHOT, todayPrice, todayYield } from '../../data/snapshot.ts';
import type { Code } from '../../data/types.ts';
import type { LevelContent } from '../types.ts';
import { f2 } from '../calc.ts';
import { levelMeta } from './meta.ts';

const B36 = instrument('BOND36');
const NF = instrument('NOTE36F');
const P36 = todayPrice('BOND36');
const PF = todayPrice('NOTE36F');
const PA = todayPrice('NOTE36A');
const Y36 = screenMidYield('BOND36')! / 100;
const YF = screenMidYield('NOTE36F')! / 100;
const YA = screenMidYield('NOTE36A')! / 100;
const y2 = (y: number) => (y * 100).toFixed(2) + '%';
const GAP_TODAY = P36 - PF;
const GAP_SAME = cleanPrice(YA, B36.coupon, B36.maturity) - cleanPrice(YA, NF.coupon, NF.maturity);
const B36_AT_NOTES = cleanPrice(YA, B36.coupon, B36.maturity);
const BP_DIFF = Math.round((YA - Y36) * 10000);
const BET_Y = todayYield('BOND36');
const BET_ANSWER = cleanPrice(BET_Y, NF.coupon, NF.maturity);
const SPREAD = (c: Code) => spreadTable(SNAPSHOT).find((r) => r.code === c)!;
const P30 = todayPrice('BOND30');
/** Yield at the 104.17 price quoted in the text (the same figure level 3 uses), not the wide bid/ask midpoint. */
const Y30 = todayYield('BOND30');

const lesson = `
首页那张表里，有两只付息债都在 2036 年 2 月 15 日到期：BOND36（票息 4.5）和 NOTE36F（票息 4.125）。再拿一只 2026 年 8 月新发的 NOTE36A（票息 4.625，晚半年到期）作对照。三只的价格差得不少：${f2(P36)}、${f2(PF)}、${f2(PA)}；到期收益率却几乎一样：${y2(Y36)}、${y2(YF)}、${y2(YA)}（IBKR Bid / Ask 收益率的中点）。

为什么？票息低的，每年少拿钱，只能用更低的价格来补偿；票息高的，价格就高。到期日一样、收益率一样，价格就只由票息决定。NOTE36F 每年比 BOND36 少拿 0.375，九年多少拿的这些票息折回今天，值 ${f2(GAP_SAME)} 点：这就是它该便宜的部分。

> 比较国债只看两样：[[到期收益率|Yield to Maturity (YTM)]]和[[点差|Spread]]。不看票息高低，也不看价格高低。价格低不等于便宜，票息高也不等于赚得多。

但 BOND36 的收益率低了 ${BP_DIFF} 个基点。同一天到期、都是美国国债，本不该差这么多。第一反应是先怀疑数据：这只 2006 年发的老券交易少，屏幕上的报价可能是旧的；它两边的 Size 只有 $2,000K，远小于 NOTE36A 的 $40,000K。其次才怀疑市场。按 Note 的 ${y2(YA)} 算，BOND36 应该是 ${f2(B36_AT_NOTES)}；屏幕上是 ${f2(P36)}，贵了 ${f2(P36 - B36_AT_NOTES)} 点。两只一起摆在面前，就买收益率更高、点差更窄的那只。

[[新券|On-the-run]]和[[老券|Off-the-run]]：财政部最新发的那一期叫新券，交易最活跃、点差最窄，NOTE36A 点差只有 ${SPREAD('NOTE36A').points.toFixed(2)}，挂单 $40,000K；之前发的都叫老券，交易少、点差宽，BOND36 是 ${SPREAD('BOND36').points.toFixed(2)}。老券因为不好卖，收益率通常略**高**一点；BOND36 反而低，更说明这个报价可疑。

再看溢价债 BOND30：${f2(P30)} 买，到期收 100，看着要"亏"${f2(P30 - 100)} 点。可它每年票息 6.25，比市场多出一截，这几点是提前付的高票息。它的 YTM 约 ${y2(Y30)}，只剩 3.6 年，落在曲线更低的地方，和同期限的国债一样公道。

结论：在 Scanner 里把同期限的几只放在一起，看 CURRENT ASK YIELD（你买入时锁定的收益率）谁高、点差谁窄。票息、价格、发行年份，改变的只是现金流的样子，不改变划不划算。
`;

const demoGuide = `
- 先看"今天的 IBKR 报价"：三根柱子的价格差很多，上面的 YTM 却几乎一样，只有 BOND36 低了一截。
- 切到"同一个收益率"，拖滑块：三只的价格一起动，差距几乎不变，这个差距就是票息造成的。
- 点"都按 Note 的收益率"：BOND36 的柱子比圆圈（今天的报价）低，说明屏幕上的 BOND36 偏贵。
- 看下面的表：比较的时候只看 YTM 和点差两行。
`;

export const L07: LevelContent = {
  ...levelMeta(7),
  lesson,
  demo: { component: 'SideBySide', props: { bonds: ['BOND36', 'NOTE36F', 'NOTE36A'], yieldMin: 0.045, yieldMax: 0.06 } },
  demoGuide,
  quiz: [
    {
      q: `BOND36 卖 ${f2(P36)}，NOTE36F 卖 ${f2(PF)}，同一天到期。哪只更划算？`,
      opts: [
        `NOTE36F：便宜 ${f2(GAP_TODAY)} 点`,
        'BOND36：票息更高',
        `NOTE36F：但原因是收益率高 ${BP_DIFF} 个基点、点差更窄，不是价格低`,
        '一样，都是美国国债',
      ],
      answer: 2,
      why: '比较国债只看到期收益率和点差。NOTE36F 两样都更好：收益率高 0.13 个百分点，点差不到 0.01。',
      wrong: {
        0: `价格低本身不说明划算：${f2(GAP_SAME)} 点是在补偿它少拿的票息。`,
        1: '票息高，价格也高；该比的是收益率。',
        3: '信用一样，但收益率和点差不一样，划算程度就不一样。',
      },
    },
    {
      q: `4.125 的 NOTE36F 比 4.5 的 BOND36 便宜 ${f2(GAP_TODAY)} 点。这是不是捡漏？`,
      opts: [
        `不是：其中约 ${f2(GAP_SAME)} 点是补偿少拿的票息，剩下的是 BOND36 本身偏贵`,
        '是，同一天到期，便宜就是赚',
        '是，因为 Note 比 Bond 安全',
        '不是，因为 NOTE36F 是新券所以更贵',
      ],
      answer: 0,
      why: `按同一个收益率算，两只只差 ${f2(GAP_SAME)} 点，这是票息差 0.375 折回今天的价值。今天差 ${f2(GAP_TODAY)}，多出来的部分是因为 BOND36 的收益率低了 ${BP_DIFF} 个基点。`,
      wrong: {
        1: '到期还的都是 100，但一路上 NOTE36F 每年少拿 0.375 的票息。',
        2: '都是美国国债，安全性一样。',
        3: 'NOTE36F 更便宜而不是更贵；新券更贵这一说法本身，也不是这道题的原因。',
      },
    },
    {
      q: '2026 年 8 月刚发行、点差 0.01、挂单 $40,000K 的 NOTE36A，这种债叫？',
      opts: ['新券 On-the-run', '老券 Off-the-run', '通胀保值债 TIPS', '零息本金条 STRIPS'],
      answer: 0,
      why: '财政部最新发的那一期叫新券 On-the-run，交易最活跃，点差最窄。',
      wrong: {
        1: '老券是之前发的那些，比如 2006 年的 BOND36。',
        2: 'TIPS 名字里会写 TIPS，收益率是实际收益率。',
        3: 'STRIPS 票息是 0.0，名字里写着 STRIPS。',
      },
    },
    {
      q: `同一天到期，NOTE36F 收益率 ${y2(YF)}，BOND36 只有 ${y2(Y36)}。第一反应应该是？`,
      opts: ['先怀疑数据：老券报价可能是旧的、Size 也小', '马上买 BOND36', '马上卖掉 NOTE36F', 'BOND36 的信用更好'],
      answer: 0,
      why: '同样的债、同样的到期日，收益率差 13 个基点不正常。先查报价是不是新的、挂单有多少，再下结论。',
      wrong: {
        1: 'BOND36 收益率更低，就是更贵；真要买，也该买收益率高的那只。',
        2: '没理由卖：NOTE36F 收益率更高、点差更窄。',
        3: '都是美国财政部的债，信用完全一样。',
      },
    },
    {
      q: `溢价债 BOND30 ${f2(P30)} 买入，到期只拿回 100。它的 YTM 约 ${y2(Y30)}，这说明？`,
      opts: [
        '它并不吃亏：多付的几点换来每年多拿的票息，收益率和同期限的国债差不多',
        '它一定亏钱，因为到期比买价低',
        '它比 BOND36 更划算，因为票息 6.25 更高',
        'IBKR 算错了',
      ],
      answer: 0,
      why: '溢价是提前付的高票息，已经算进 YTM。它的 YTM 比 BOND36 低，是因为只剩 3.6 年、在曲线更低的位置。',
      wrong: {
        1: '只看了本金一头：3.6 年里每年多拿的票息把这几点补回来了。',
        2: '票息高，价格也高；比划不划算要看 YTM。',
        3: '用第 3 关的定义就能算出这个数。',
      },
    },
    {
      q: '比较两只国债划不划算，该看哪两样？',
      opts: ['到期收益率和点差', '票息和价格', '发行年份和评级', '价格和 Size'],
      answer: 0,
      why: '到期收益率是你拿到的年化回报，点差是你进出要付的成本。其余的都只是现金流的样子。',
      wrong: {
        1: '票息和价格一起决定收益率，单看任何一个都会看错。',
        2: '美国国债评级都一样；发行年份只影响它是新券还是老券，最后还是体现在点差上。',
        3: 'Size 说明能成交多少，不说明划不划算。',
      },
    },
  ],
  bet: {
    prompt: `如果 NOTE36F 也按 BOND36 的收益率 ${y2(BET_Y)} 定价，它的价格应该是多少？今天屏幕上是 ${f2(PF)}。`,
    slider: { min: 90, max: 95, step: 0.05, initial: 91.5, unit: 'price' },
    answer: BET_ANSWER,
    tiers: [{ maxErr: 0.15, reward: 500 }, { maxErr: 0.5, reward: 200 }],
    explain: `答案是 **${f2(BET_ANSWER)}**，比今天的 ${f2(PF)} 高 ${f2(BET_ANSWER - PF)} 点。反过来说：同样的收益率，两只的价差只有 ${f2(P36 - BET_ANSWER)} 点，就是票息差的价值；今天差 ${f2(GAP_TODAY)}，是因为 BOND36 的收益率低了一截。`,
    reveal: { kind: 'sameYield', bond: 'NOTE36F', y: BET_Y },
  },
};
