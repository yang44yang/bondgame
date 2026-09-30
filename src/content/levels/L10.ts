/** Level 10 · STRIPS: Principal and Interest (CLAUDE.md §4.10 outline, written out). */
import { accrued, cashflows, zeroPrice } from '../../math/bond.ts';
import { instrument, model, quotes, SETTLE_DATE, todayPrice, todayYield } from '../../data/snapshot.ts';
import { SIX_PACK_STRIPS_YIELD } from '../../data/assumptions.ts';
import type { Code } from '../../data/types.ts';
import type { LevelContent } from '../types.ts';
import { f1, f2, years } from '../calc.ts';
import { levelMeta } from './meta.ts';

const B = instrument('BOND36');
const Y36 = todayYield('BOND36');
const N = cashflows(B.coupon, B.maturity, SETTLE_DATE).length;
const DIRTY = todayPrice('BOND36') + accrued(B.coupon, B.maturity, SETTLE_DATE);
const SP36 = model('SP36').cleanPrice;
const SP36_AT_B36 = zeroPrice(Y36, B.maturity, SETTLE_DATE);
const cusip = (c: Code) => instrument(c).cusip!;
const bidY = (c: Code) => quotes(c)[0].bidYield!;
const NOV35 = quotes('NSP35N')[0].closing!;
const MAY36 = quotes('NSP36M')[0].bid!;
const TEN_Y_AT_5 = 100 / Math.pow(1.025, 20);
const y2 = (y: number) => (y * 100).toFixed(2) + '%';
const COST_100K = Math.round(SP36 * 10) * 100;

const lesson = `
第 1 关里，BOND36 还有 ${N} 次票息（每次 2.25），最后一次连本金 100 一起付。[[本息分离债|STRIPS]]就是把它拆开：${N} 次票息各成一只利息条，本金单独成一只本金条，一共 ${N + 1} 块，每一块单独卖。拆出来的每一块，中间不付息，到期一次付清，都是一只[[零息债|Zero-coupon Bond]]。财政部允许这样拆，也允许把拆开的块再合回原来的债，叫[[重组|Reconstitution]]。

拆出来的分两种。[[本金条|Principal STRIPS]]来自原债最后那笔本金：从 Bond 拆的，比如 SP36，CUSIP 是 \`${cusip('SP36')}\`；从 Note 拆的，比如 NSP36，是 \`${cusip('NSP36')}\`。[[利息条|Interest STRIPS]]来自某一期票息，比如 SI36，是 \`${cusip('SI36')}\`。同一天到期的利息条，不管从哪只债拆出来，都可以互相替换（fungible）。

> 首页六件套里有三行就是 2036 年 2 月 15 日到期的 STRIPS：SP36（Bond 拆出的本金条）、SI36（利息条）、NSP36（Note 拆出的本金条）。它们都在同一天付一笔 100、信用一样，所以价格几乎一样，都在 ${f1(SP36)} 左右。第四行 TSI36 是从 TIPS 拆出来的利息条，下一关讲。

零息债为什么这么便宜？它不付票息，全部回报都在"今天 ${f1(SP36)}、九年多后拿回 100"这个差价里。离到期越远越便宜：2048 年到期的 SP48 只要 ${f2(todayPrice('SP48'))}。把 BOND36 拆开、每块都按它自己的收益率 ${y2(Y36)} 定价，${N + 1} 块加起来正好是它的全价 ${f2(DIRTY)}：拆开和不拆，值一样多。

利息条通常比同一天到期的本金条便宜一点、收益率略高：截图里 2028 年 11 月到期的利息条 bid 收益率 ${bidY('SI28').toFixed(3)}%，本金条 ${bidY('SP28').toFixed(3)}%。

零息债有三个特点：
- 没有[[再投资风险|Reinvestment Risk]]：中间没有票息要再投资，今天买入的收益率就是持有到期的回报，一分不差。第 3 关说过，付息债做不到。
- [[久期|Duration]]等于剩余年限：同期限里对利率最敏感，价格起伏最大。第 8、9 关讲过。
- 适合"确定某一年要用一笔钱"：比如 2036 年 2 月要付 $100,000，今天花约 $${COST_100K.toLocaleString('en-US')} 买 $100,000 面值的 SP36，到期正好拿回 $100,000，中间什么都不用管。

最后一个噪音：IBKR 里 SI46（2046 年 5 月的利息条）的详情页写着 Issue Amount 1.00M、Amount Outstanding 0.00。利息条是拆出来的，不是财政部按期发行的，这两个字段对它没意义，看价格和到期日就够了。
`;

const demoGuide = `
- 点"拆开 STRIP it"：BOND36 变成 ${N + 1} 只零息债，${N} 个利息条和 1 个本金条。
- 每块的外框是到期那天付的钱，里面填的颜色是它今天值多少：离得越远，填得越少。
- 点任一块看它的到期日和价格；点 2036 年 2 月那块本金条，对上首页六件套。
- 看右边的合计：${N + 1} 块今天的价值加起来，正好等于 BOND36 的全价。
`;

export const L10: LevelContent = {
  ...levelMeta(10),
  lesson,
  demo: { component: 'StripsExplode', props: { bond: 'BOND36', sameDay: ['SP36', 'SI36', 'NSP36'] } },
  demoGuide,
  quiz: [
    {
      q: '首页六件套里，哪三行是普通的 STRIPS（不算 TIPS 拆出来的）？',
      opts: ['SP36、SI36、NSP36', 'BOND36、NOTE36F、SP36', 'SI36、TSI36、NSP36', 'SP36、SI36、TSI36'],
      answer: 0,
      why: '三行都是 2036 年 2 月 15 日到期的零息条：SP36 是 Bond 拆出的本金条，SI36 是利息条，NSP36 是 Note 拆出的本金条。',
      wrong: {
        1: 'BOND36 和 NOTE36F 是付息债，票息 4.5 和 4.125，不是 STRIPS。',
        2: 'TSI36 是从 TIPS 拆出来的，收益率是实际收益率，下一关讲。',
        3: '同上：TSI36 是 TIPS STRIPS。',
      },
    },
    {
      q: '六件套里哪一行是从 TIPS 拆出来的？',
      opts: ['TSI36（TIPS STRIPS Interest）', 'SI36（STRIPS Interest）', 'NSP36（Note STRIPS Principal）', 'NOTE36F'],
      answer: 0,
      why: '名字里写着 TIPS STRIPS。它屏幕上的收益率是实际收益率，不能直接和旁边的名义收益率比。',
      wrong: {
        1: 'SI36 是普通的利息条，从普通国债拆出来的。',
        2: 'NSP36 是从 Note 拆出的本金条。',
        3: 'NOTE36F 是付息的 Note，没被拆。',
      },
    },
    {
      q: '一只 10 年后到期的零息债，收益率 5%（半年复利），今天每 100 面值大约多少钱？',
      opts: [TEN_Y_AT_5.toFixed(0), '95', '50', '100'],
      answer: 0,
      why: `100 ÷ 1.025²⁰ ≈ ${f2(TEN_Y_AT_5)}。零息债没有票息，全部回报都在折价里。`,
      wrong: {
        1: '95 左右是付息债的价格水平；零息债没有票息，折价要深得多。',
        2: '太低了：按 5% 算，钱翻一倍要 14 年左右，10 年到不了一半。',
        3: '零息债今天一定低于 100，差价就是你的利息。',
      },
    },
    {
      q: 'SP36、SI36、NSP36 为什么价格几乎一样？',
      opts: ['都在 2036 年 2 月 15 日付一笔 100，信用一样，现金流一模一样', '财政部规定它们同价', 'IBKR 取了平均价', '它们其实是同一个 CUSIP'],
      answer: 0,
      why: '同一天、同一笔 100、同一个发行人，价值自然一样；小小的差别来自流动性，利息条通常略便宜一点。',
      wrong: {
        1: '没有这种规定，是市场自己把它们拉到一起的。',
        2: '每行都是它自己的报价。',
        3: '三个 CUSIP 都不一样：912803CX9、9128335B2、912821TV7。',
      },
    },
    {
      q: '为什么说 STRIPS 没有再投资风险？',
      opts: ['中间不付息，没有票息要再投资；买入的收益率就是持有到期的回报', '它的价格不会变', '财政部保证再投资的收益', '它的久期很短'],
      answer: 0,
      why: '付息债每半年给你一笔钱，你得按当时的利率再投出去；零息债一直攥着，到期一次给你，买入那天就锁定了回报。',
      wrong: {
        1: '价格会变，而且变得最多：零息债的久期最长。',
        2: '财政部不管你的再投资。',
        3: '正好相反，零息债的久期等于剩余年限，是同期限里最长的。',
      },
    },
    {
      q: '你确定 2036 年 2 月要付一笔 $100,000。用国债怎么准备最省心？',
      opts: ['今天买 $100,000 面值的 SP36，到期正好拿回 $100,000', '买 BOND36，每半年收票息', '买一年期 Bill，每年到期再买', '买 SP48，因为更便宜'],
      answer: 0,
      why: `日期和金额都对得上，今天只要约 $${COST_100K.toLocaleString('en-US')}，中间什么都不用管。`,
      wrong: {
        1: '票息要自己再投资，而且到期的本金加票息和 $100,000 对不齐。',
        2: '每年都要按当时的利率再买一次，利率跌了就凑不够。',
        3: 'SP48 2048 年才到期，2036 年要用钱就得提前卖，价格说不准。',
      },
    },
    {
      q: 'SI46 的详情页写着 Amount Outstanding 0.00。这说明？',
      opts: ['数据噪音：利息条是拆出来的，这个字段对它没意义', '已经没人持有了', '这只不能买', '它快违约了'],
      answer: 0,
      why: '看 STRIPS 只看价格、收益率和到期日；发行量这类字段对拆出来的利息条没意义。',
      wrong: {
        1: '屏幕上它有 $25,000K 的挂单，显然有人持有、有人在卖。',
        2: '能买：详情页有 Buy 按钮，Scanner 里也有报价。',
        3: '美国国债拆出来的条和原债一样，没有违约问题。',
      },
    },
  ],
  bet: {
    prompt: `首页六件套里的 SP36（Bond 拆出的本金条，2036 年 2 月 15 日到期）没有截到报价。同期限 STRIPS 的收益率约 ${y2(SIX_PACK_STRIPS_YIELD)}。猜它今天每 100 面值的价格。`,
    slider: { min: 40, max: 80, step: 0.5, initial: 70, unit: 'price' },
    answer: SP36,
    tiers: [{ maxErr: 1, reward: 500 }, { maxErr: 3, reward: 200 }],
    explain: `约 **${f2(SP36)}**：按 ${y2(SIX_PACK_STRIPS_YIELD)} 算的，这一行没有截图。屏幕上相邻的两只本金条，2035 年 11 月的 ${f2(NOV35)}、2036 年 5 月的 ${f2(MAY36)}，它正好夹在中间。按 BOND36 自己的 ${y2(Y36)} 算会是 ${f2(SP36_AT_B36)}，差的这点又是 BOND36 偏贵。还剩 ${f1(years('SP36'))} 年，久期 ${f1(model('SP36').modDuration)}。`,
    reveal: { kind: 'stripPiece', date: B.maturity, compare: 'SP36' },
  },
};
