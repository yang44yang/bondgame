/** All 14 levels: titles, what each one lights (CLAUDE.md §4.0), and an outline for levels not built yet. */
import type { LevelMeta } from '../types.ts';

const STD = { minutes: { lesson: 2, demo: 3, quiz: 3, bet: 2 }, quizRule: { draw: 3, need: 3 } };

export const LEVEL_META: LevelMeta[] = [
  {
    id: 1, season: 1, title: '债券的名字怎么读', titleEn: "Reading a Bond's Name", ...STD,
    lights: ['BOND36.product'], lightsLabel: 'BOND36 的名字 PRODUCT',
    outline: '把 US-T GOVT 4.5 Feb15\'36 912810FT0 AA1 拆开：发行人、票息 Coupon、到期日 Maturity、CUSIP、评级 Rating；再把 19 笔现金流 Cash Flow 排到时间轴上。',
  },
  {
    id: 2, season: 1, title: '价格为什么不是 100', titleEn: "Why the Price Isn't 100", ...STD,
    lights: ['BOND36.closing'], lightsLabel: 'BOND36 的 CLOSING PRICE 95.48',
    outline: '价格 Price 和到期收益率 Yield to Maturity (YTM) 是同一件事的两种说法：利率涨，价格跌。折价 Discount、溢价 Premium、平价 Par。',
  },
  {
    id: 3, season: 1, title: '到期收益率是什么', titleEn: 'What Yield to Maturity Means', ...STD,
    lights: ['BOND36.yields'], lightsLabel: 'BOND36 的 BID YIELD / ASK YIELD',
    outline: 'YTM 是让"今天的价格 = 未来现金流折现之和"成立的那个利率。收益率不变时，价格随时间向 100 靠拢（拉回面值 Pull to Par）；YTM 隐含"票息按同样利率再投资"的假设。',
  },
  {
    id: 4, season: 1, title: '实付多少钱', titleEn: 'What You Actually Pay', ...STD,
    lights: ['buyButton'], lightsLabel: '表下方的 Buy 按钮',
    outline: '净价 Clean Price、全价 Dirty Price、应计利息 Accrued Interest；Order Ticket 的数量单位 THOUSAND FACE VALUE；佣金 Commission 占实付的比例。',
  },
  {
    id: 5, season: 1, title: 'Bid / Ask：点差就是成本', titleEn: 'Bid / Ask and the Cost of the Spread', ...STD,
    lights: ['BOND36.quotes'], lightsLabel: 'BOND36 的 BID / ASK PRICE·SIZE',
    outline: '买在 Ask、卖在 Bid，差价 Spread 就是摩擦成本。新券 0.01、主线债 0.13、STRIPS 0.12–0.19、TIPS 0.43、老券 0.9：流动性梯度。Size 是对手盘愿意成交的面值。',
  },
  {
    id: 6, season: 2, title: 'Bill / Note / Bond 与收益率曲线', titleEn: 'Bills, Notes, Bonds and the Yield Curve', ...STD,
    lights: ['filterRow'], lightsLabel: '筛选行：日期区间 · Treasury Type',
    outline: '三类国债按发行期限命名；收益率曲线 Yield Curve 用 2026-09-29 的真实点画出来；Bond Scanner 怎么筛出 2036 年 2 月到期的所有品种。',
  },
  {
    id: 7, season: 2, title: '同一天到期的三只债', titleEn: 'Three Bonds, One Maturity', ...STD,
    lights: ['NOTE36F.row'], lightsLabel: 'NOTE36F 整行',
    outline: '4.5、4.125、4.625 三只 2036 年到期的债：票息不同、价格不同、收益率几乎一样。比较债只看 YTM 和点差，不看票息也不看价格高低。',
  },
  {
    id: 8, season: 2, title: '久期（上）', titleEn: 'Duration I', ...STD,
    lights: ['duration.dim'], lightsLabel: '久期影子列（灰）',
    outline: '久期 Duration = 你的钱被这个固定利率锁住的平均年数。用天平画麦考利久期 Macaulay Duration；修正久期 Modified Duration 估算：ΔP% ≈ −久期 × Δy；DV01。',
  },
  {
    id: 9, season: 2, title: '久期（下）与凸性', titleEn: 'Duration II and Convexity', ...STD,
    lights: ['duration.lit'], lightsLabel: '久期影子列点亮',
    outline: '四只真实的债对同一个利率变动的反应：期限越长、票息越低越敏感；凸性 Convexity 让涨跌不对称。',
  },
  {
    id: 10, season: 2, title: 'STRIPS：本金条与利息条', titleEn: 'STRIPS: Principal and Interest', ...STD,
    lights: ['SP36.row', 'SI36.row', 'NSP36.row'], lightsLabel: 'SP36 / SI36 / NSP36 三行',
    outline: '把一只付息债的每笔现金流拆开单卖，每一块都是零息债。本金条 Principal 与利息条 Interest；没有再投资风险；久期等于剩余年限。',
  },
  {
    id: 11, season: 2, title: 'TIPS：实际收益率与通胀', titleEn: 'TIPS: Real Yield and Inflation', ...STD,
    lights: ['TSI36.row'], lightsLabel: 'TSI36 行',
    outline: '本金随 CPI 调整（index ratio）；实际收益率 Real Yield ≈3.3% 对名义 ≈5.7%，差值是盈亏平衡通胀 Breakeven；IBKR 的 TIPS 价格是未调整价。',
  },
  {
    id: 12, season: 3, title: '读屏总考', titleEn: 'Final Screen Test', minutes: { quiz: 10 }, quizRule: { draw: 12, need: 10 },
    lights: [], lightsLabel: '全亮之后开考', view: 'exam',
    outline: '12 道读屏题，10 道通过：Bond Scanner 的六行七列、详情页每个区块、Order Ticket 的每个字段，以及哪些噪音字段可以不看。',
  },
  {
    id: 13, season: 3, title: '怎么选：持有到期、阶梯、税与汇率', titleEn: 'Choosing: Hold, Ladder, Tax and FX', minutes: { lesson: 4, demo: 3, quiz: 3 }, quizRule: { draw: 3, need: 3 },
    lights: [], lightsLabel: '不点亮，全开',
    outline: '持有到期 vs 交易；阶梯 Ladder；STRIPS vs 付息债；TIPS 何时划算；保证金 5% 不碰；W-8BEN 与利息预扣税；汇率波动可能比债券本身大。',
  },
  {
    id: 14, season: 3, title: '沙盒：几条利率路径都不翻车', titleEn: 'Sandbox: Survive Every Rate Path', minutes: { demo: 10 }, quizRule: { draw: 0, need: 0 },
    lights: [], lightsLabel: '不点亮，全开', view: 'sandbox',
    outline: '起始资金 $100,000 + 直觉账户余额，配一个国债组合，一次推进 12 个月，四条利率路径同时演算。赢的定义是稳健：最差路径也不亏。',
  },
];

export function levelMeta(id: number): LevelMeta {
  const m = LEVEL_META.find((l) => l.id === id);
  if (!m) throw new Error(`No level ${id}`);
  return m;
}
