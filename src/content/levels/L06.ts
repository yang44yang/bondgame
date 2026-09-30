/** Level 6 · Bills, Notes, Bonds and the Yield Curve (CLAUDE.md §4.6 outline, written out). */
import { screenMidYield } from '../../data/snapshot.ts';
import type { Code } from '../../data/types.ts';
import type { LevelContent } from '../types.ts';
import { CURVE_30Y, CURVE_KNOTS as KNOTS, nominalCurve as CURVE, yearsTo as yrs } from '../curve.ts';
import { levelMeta } from './meta.ts';

const EXTRAS: Code[] = ['BOND36', 'NOTE36F', 'NOTE36M', 'NSP36M', 'SI46'];
const REAL_2Y: Code[] = ['SP28A', 'SP28', 'SI28', 'SP29'];
const mid = (c: Code) => screenMidYield(c)!;
const p2 = (x: number) => x.toFixed(2) + '%';
const AT2 = CURVE(2);
const LINEAR2 = mid('BILL27') + ((2 - yrs('BILL27')) / (yrs('BOND30') - yrs('BILL27'))) * (mid('BOND30') - mid('BILL27'));
const REAL_LO = Math.min(...REAL_2Y.map(mid));
const REAL_HI = Math.max(...REAL_2Y.map(mid));

const lesson = `
美国国债按**发行时**的期限分三类，名字里直接写着：
- [[国库券|Bill]]：一年以内到期（最长 52 周）。不付票息，折价卖、到期还 100，赚的就是差价。IBKR 里叫 \`US-T Govt Bill Sep02'27\`。
- [[中期国债|Note]]：发行期限 2、3、5、7、10 年，半年付一次息。
- [[长期国债|Bond]]：发行期限 20、30 年，半年付一次息。

第 1 关说过：分类看发行时，不看还剩多久。2006 年发的 30 年期 BOND36 今天只剩 9.4 年，名字里还是 Bond。

把不同期限的国债收益率按"还剩几年"排成一条线，就是[[收益率曲线|Yield Curve]]。2026-09-29 的真实点：0.9 年 ${p2(mid('BILL27'))}（BILL27），3.6 年约 ${mid('BOND30').toFixed(1)}%（BOND30），9.4 到 9.9 年 ${p2(mid('NOTE36A'))}（NOTE36 这几只），17 年 ${p2(mid('SP43'))}（SP43），22 年 ${p2(mid('SP48'))}（SP48）。钱借得越久，要的利息越高。

> 曲线的形状有三种。[[正常|Normal]]：向上，长期高于短期，最常见。[[平|Flat]]：长短差不多，常在转折的时候出现。[[倒挂|Inverted]]：短期高于长期，市场在押未来会降息，常被当作经济放缓的信号。今天这条是正常向上，而且短端陡、长端平：从 1 年到 10 年多了 ${(mid('NOTE36A') - mid('BILL27')).toFixed(2)} 个百分点，从 10 年到 22 年只多 ${(mid('SP48') - mid('NOTE36A')).toFixed(2)}。

曲线上有两个点不在线上。BOND36 比同一天到期的 Note 低了 13 个基点，下一关专门讲它。SI46 是利息条，比同期限的本金条收益率高一点。

在 IBKR 网页版里找债，用 Research 菜单里的 Bond Scanner，选 US Treasuries。筛选行有两样：到期日区间，比如 \`2036/02/01 To 2036/02/28\`；和 \`Treasury Type\`。下拉里看到过的选项有 Bill、Note、Bond、Bond STRIPS Principal、Bond STRIPS Interest、Note STRIPS Principal、Bond TIPS。列表可以按 CURRENT ASK YIELD 排序，就是表头那个小三角。

有个坑：Type 选 Note，Note STRIPS 也会混进来；选 Bond，Bond STRIPS 也会混进来。截图里 Type 选 Bond，排在最前面的全是 \`US-T Govt Bond STRIPS Interest 0.0 …\`。认名字里有没有 STRIPS、票息是不是 0.0。要找 2036 年 2 月到期的**所有**品种，Type 选 All，日期填那个月的第一天到最后一天，出来的就是首页那张表。

第 14 关的沙盒里，这条曲线会动：整体上移、变陡、变平。你的组合要在每一种里都不翻车。
`;

const demoGuide = `
- 点曲线上的任一个点，右边会显示它是哪只债、收益率和价格。
- 用仿 Bond Scanner 的 Treasury Type 下拉筛一筛：选 Note 看 Note STRIPS 怎么混进来，选 Bond 看 Bond STRIPS。
- 点"平行上移""变陡""变平"：第 14 关沙盒里的利率路径长这样。
- 注意曲线上没有 2 年的点，小赌局会问。
`;

export const L06: LevelContent = {
  ...levelMeta(6),
  lesson,
  demo: {
    component: 'YieldCurve',
    props: { knots: KNOTS, extras: EXTRAS, revealExtras: REAL_2Y, inferred: CURVE_30Y, paths: ['P1', 'P3', 'P4'] },
  },
  demoGuide,
  quiz: [
    {
      q: '下面哪一只是国库券 Bill？',
      opts: ["`US-T Govt Bill Sep02'27`", "`US-T Govt Note 4.625 Aug15'36`", "`US-T Govt Bond 6.25 May15'30`", "`US-T Govt Bond STRIPS Principal 0.0 Aug15'48`"],
      answer: 0,
      why: 'Bill 一年以内到期、不付票息，名字里直接写着 Bill。',
      wrong: {
        1: 'Note 是发行期限 2 到 10 年的付息债。',
        2: 'Bond 是发行期限 20、30 年的付息债；这只 2030 年就到期，是因为它 2000 年就发了。',
        3: 'STRIPS 虽然也不付息，但它是从 Bond 拆出来的本金条，名字里写着 Bond STRIPS。',
      },
    },
    {
      q: '2026 年发行、2036 年到期的国债，名字里写的是？',
      opts: ['Note', 'Bill', 'Bond', '要看今天还剩几年'],
      answer: 0,
      why: '发行时期限 10 年，就是 Note，一辈子都叫 Note。',
      wrong: {
        1: 'Bill 是一年以内到期的。',
        2: 'Bond 是发行期限 20、30 年的。',
        3: '名字按发行时的期限定，不看今天还剩多久。',
      },
    },
    {
      q: `今天的曲线：1 年期约 ${p2(mid('BILL27'))}，10 年期约 ${p2(mid('NOTE36A'))}，22 年约 ${p2(mid('SP48'))}。这条曲线是什么形状？`,
      opts: ['正常向上：短端陡、长端平', '倒挂', '完全平', '向下'],
      answer: 0,
      why: '长期收益率高于短期，是正常 Normal 的曲线；前 10 年升得快，后面升得慢。',
      wrong: {
        1: '倒挂是短期高于长期，今天正好相反。',
        2: '1 年和 22 年差了 1 个多百分点，不算平。',
        3: '收益率随期限一路升高，是向上。',
      },
    },
    {
      q: '如果 1 年期收益率 5.5%，10 年期只有 4.5%，这叫？',
      opts: ['倒挂 Inverted', '正常 Normal', '平 Flat', '长期国债更安全'],
      answer: 0,
      why: '短期高于长期叫倒挂 Inverted：市场在押未来会降息，常被当作经济放缓的信号。',
      wrong: {
        1: '正常是长期高于短期。',
        2: '平是长短差不多，这里差了 1 个百分点。',
        3: '都是美国国债，信用一样；收益率高低由期限和市场预期决定。',
      },
    },
    {
      q: '要在 IBKR 找出 2036 年到期的**所有**国债品种（付息债、STRIPS、TIPS STRIPS 都要），筛选该怎么设？',
      opts: ['Treasury Type 选 All，到期日区间填 2036/01/01 To 2036/12/31', 'Treasury Type 选 Bond，不填日期', 'Treasury Type 选 Note，日期填 2036', '在搜索框里搜 2036'],
      answer: 0,
      why: '类型选 All 才不会漏；到期日区间把范围收到 2036 年。首页那张表就是这样筛出来的，只是区间收窄到了 2 月。',
      wrong: {
        1: '只选 Bond 会漏掉 Note、Note STRIPS 和 TIPS 系列；不填日期还会把所有年份都列出来。',
        2: '只选 Note 会漏掉 Bond 和 Bond STRIPS。',
        3: '搜索框是搜名字或 CUSIP 的，筛到期日要用 Bond Scanner 的日期区间。',
      },
    },
    {
      q: 'Treasury Type 选了 Bond，列表最上面却全是 `US-T Govt Bond STRIPS Interest 0.0 …`。为什么？',
      opts: ['Bond 类型里也包括从 Bond 拆出来的 STRIPS，按 Ask 收益率排序它们排在前面', 'IBKR 出错了', '筛选没生效', 'STRIPS 就是 Bond 的另一个名字'],
      answer: 0,
      why: '选 Bond 会带出 Bond STRIPS，选 Note 会带出 Note STRIPS。认名字里的 STRIPS 和 0.0 票息。',
      wrong: {
        1: '没出错，IBKR 的分类就是这样。',
        2: '生效了：普通 Bond 也在列表里，只是排在后面。',
        3: 'STRIPS 是从 Bond 拆出来的零息条，和付息的 Bond 不是一回事，第 10 关讲。',
      },
    },
  ],
  bet: {
    prompt: '曲线上没有 2 年期的点。从曲线上估一估：**还剩 2 年**的美国国债，今天收益率大约是多少？',
    slider: { min: 4.3, max: 5.3, step: 0.01, initial: 4.5, unit: 'share' },
    answer: AT2,
    tiers: [{ maxErr: 0.05, reward: 500 }, { maxErr: 0.15, reward: 200 }],
    explain: `从曲线上读，2 年约 **${p2(AT2)}**；用直线连 0.9 年和 3.6 年两个点，是 ${p2(LINEAR2)}。可 IBKR 屏幕上 2 年左右到期的本金条，收益率在 ${p2(REAL_LO)} 到 ${p2(REAL_HI)} 之间，比曲线估的还高 0.15 左右：曲线只用几个点连成，点和点之间都是估的。真要买某个期限，就在 Bond Scanner 里直接找那个期限的债。`,
    reveal: { kind: 'curveRead', years: 2 },
  },
};
