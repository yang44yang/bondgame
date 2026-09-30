/** Level 4 · What You Actually Pay (CLAUDE.md §4.4 outline, written out). */
import { accrued, schedule } from '../../math/bond.ts';
import { daysBetween, isoDate } from '../../math/dates.ts';
import { orderCost, treasuryCommission } from '../../math/cost.ts';
import { IBKR_TREASURY_COMMISSION } from '../../data/assumptions.ts';
import { instrument, SETTLE_DATE, SNAPSHOT, todayPrice } from '../../data/snapshot.ts';
import type { LevelContent } from '../types.ts';
import { f2 } from '../calc.ts';
import { levelMeta } from './meta.ts';

const B = instrument('BOND36');
const P0 = todayPrice('BOND36');
const ACC = accrued(B.coupon, B.maturity, SETTLE_DATE); // 0.5625
const SCH = schedule(B.maturity, SETTLE_DATE);
const PREV = isoDate(SCH.prev); // 2026-08-15
const NEXT = isoDate(SCH.next); // 2027-02-15
const DAYS = daysBetween(PREV, SETTLE_DATE); // 46
const PERIOD = daysBetween(PREV, NEXT); // 184
const HALF = B.coupon / 2;
const MIN = IBKR_TREASURY_COMMISSION.min;
const fee = (face: number) => treasuryCommission(face, IBKR_TREASURY_COMMISSION);
const usd2 = (x: number) => '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctOf = (x: number, d = 2) => (x * 100).toFixed(d) + '%';

const TEN = orderCost(P0, ACC, 10_000, fee(10_000));
const HUNDRED = orderCost(P0, ACC, 100_000, fee(100_000));
// order2.png: 1 × SP43 at the 38.43 limit, zero coupon, Total uses the 6.50 midpoint of "5.00 … 8.00".
const TICKET = SNAPSHOT.orderTicket;
const SP43_MIN = orderCost(38.43, 0, 1_000, MIN);
const BET_FACE = 5_000;
const BET = orderCost(P0, ACC, BET_FACE, fee(BET_FACE));

const lesson = `
屏幕上的 ${f2(P0)} 是[[每 100 面值|Per 100]]的价。IBKR 下单时的数量单位也不是"张"，而是 \`THOUSAND FACE VALUE\`：填 1 就是 $1,000 面值，填 10 就是 $10,000。详情页 Details 块里的 \`Min Order Amount 1\` 和 \`Min Incremental Amount 1\` 也是这个单位：最少买 $1,000 面值，每次加 $1,000。所以买 $10,000 面值的 BOND36，数量填 10，钱是 ${f2(P0)} × 100 ≈ $${Math.round(TEN.amount).toLocaleString('en-US')}，还要再加两样东西。

第一样是[[应计利息|Accrued Interest]]。国债半年才付一次息，但利息每天都在长。上次付息日是 ${PREV}；你 9 月 29 日下单，9 月 30 日交割，这叫 T+1 [[结算|Settlement]]。中间这 ${DAYS} 天长出来的利息属于卖家。可到 ${NEXT} 付息时，财政部会把整整半年的 ${HALF} 全付给你。所以买的时候，你先把这 ${DAYS} 天的利息补给卖家：${DAYS} ÷ ${PERIOD} × ${HALF} = ${ACC}，每 $1,000 面值 $${(ACC * 10).toFixed(2)}。

> 屏幕上的价格叫[[净价|Clean Price]]，不含应计；你实际付的是[[全价|Dirty Price]]：全价 = 净价 + 应计利息。屏幕不报全价，是因为全价每天都在涨、每到付息日又掉回去，像锯齿；净价把锯齿去掉了，才看得出价格真正的涨跌。

付息日当天，应计归零：${NEXT} 结算的话应计是 0，前一天结算应计差不多是一整期的 ${HALF}。两种情况一样公平：前一天买，你多补给卖家一期利息，第二天财政部把这一期付给你。STRIPS 和 Bill 中间不付息，应计永远是 0，所以 Order Ticket 买 SP43 时 Accrued Interest 显示 ~0。

第二样是[[佣金|Commission]]。IBKR 的国债佣金是面值的 0.2 个基点，但每单最低 $${MIN}。面值 $250,000 以内，你付的都是这 $${MIN}。买 $1,000 面值、实付不到 $400 的 STRIPS，这 $${MIN} 占 ${pctOf(SP43_MIN.commissionShare, 1)}，差不多是三个月的利息；买 $100,000 面值的 BOND36，同样的 $${MIN} 只占 ${pctOf(HUNDRED.commissionShare, 3)}。面值越大，佣金占比越小。

把 order2.png 逐行读一遍。这一单是 SP43，数量 1（$1,000 面值），限价 38.43：
- \`Amount 384.30 USD\`：38.43 × 10，每 100 面值的价乘以 10 个 100。
- \`Commissions & Fees (est.) 5.00 ... 8.00 USD\`：佣金的预估区间，下限就是 $${MIN} 的最低佣金。
- \`Accrued Interest (est.) ~ 0 USD\`：零息债，没有应计。
- \`Total ~ 390.80 USD\`：384.30 加上佣金区间的中点 6.50。页面顶上那行"${TICKET.preview.Headline}"说的就是它。

实付公式：Total = 净价 × 面值 ÷ 100 + 应计 × 面值 ÷ 100 + 佣金。
`;

const demoGuide = `
- 拖结算日滑块：绿线是[[全价|Dirty Price]]，每天爬一点，到 ${NEXT} 付息日掉回去；蓝线是[[净价|Clean Price]]，几乎是平的。
- 两条线之间的距离就是[[应计利息|Accrued Interest]]。
- 拖数量滑块，看下面仿 Order Ticket 的 Amount、Accrued、Commission、Total 怎么变：佣金一直是 $${MIN}，占比越来越小。
- 换成 SP43（STRIPS）：没有票息，两条线合成一条，Accrued Interest 永远是 0。
`;

export const L04: LevelContent = {
  ...levelMeta(4),
  lesson,
  demo: {
    component: 'AccruedCost',
    props: { bonds: ['BOND36', 'SP43'], dateFrom: '2026-08-15', dateTo: '2027-05-15', faceMaxK: 100, defaultFaceK: 10 },
  },
  demoGuide,
  quiz: [
    {
      q: '在 IBKR 买 $100,000 面值的 BOND36，Order Ticket 的数量 `THOUSAND FACE VALUE` 该填？',
      opts: ['100', '100,000', '1,000', '1'],
      answer: 0,
      why: 'THOUSAND FACE VALUE：1 = $1,000 面值。$100,000 ÷ $1,000 = 100。',
      wrong: {
        1: '单位是"千面值"。填 100,000 就成了一亿美元面值。',
        2: '1,000 是 $1,000,000 面值。',
        3: '1 只是 $1,000 面值。',
      },
    },
    {
      q: `9 月 30 日结算，买 $100,000 面值的 BOND36：净价 ${f2(P0)}，应计每 100 面值 ${ACC}。不算佣金，实付大约？`,
      opts: [usd2(P0 * 1000), usd2(HUNDRED.amount + HUNDRED.accrued), '$100,000.00', usd2(P0 * 1000 + ACC * 100)],
      answer: 1,
      why: `全价 = 净价 + 应计：(${f2(P0)} + ${ACC}) × 1,000 = ${usd2(HUNDRED.amount + HUNDRED.accrued)}，再加 $${MIN} 佣金。`,
      wrong: {
        0: '这是净价 Clean Price 的金额，漏了应计利息 Accrued Interest。',
        2: '100 是到期还的面值，不是今天的价。',
        3: `应计 ${ACC} 是每 100 面值的，$100,000 有 1,000 个 100，要乘 1,000，是 ${usd2(ACC * 1000)}。`,
      },
    },
    {
      q: '为什么买 SP43（STRIPS）时，Order Ticket 上的 Accrued Interest 是 ~0？',
      opts: ['IBKR 给免了', 'STRIPS 中间不付息，没有"已经长出来、还没付"的利息', '应计只在付息日前一天收', 'STRIPS 的应计被算进佣金里了'],
      answer: 1,
      why: '零息债没有票息，自然没有应计。它的回报全在"价格从 38 慢慢涨到 100"里。',
      wrong: {
        0: '应计不是费用，是补给卖家的利息，没有"免"这回事。',
        2: '应计从上次付息日起每天都在长，不是只收一天。',
        3: '佣金给 IBKR，应计给卖家，是两回事。',
      },
    },
    {
      q: `同一只 BOND36，结算日在 2027-02-14 和 2027-02-16（收益率不变），每 100 面值的实付差多少？`,
      opts: ['几乎一样', `14 日多付约 ${f2(accrued(B.coupon, B.maturity, '2027-02-14') - accrued(B.coupon, B.maturity, '2027-02-16'))}：那天的应计差不多是一整期票息`, `16 日多付约 ${HALF}`, '差 4.5'],
      answer: 1,
      why: `14 日结算，要把 ${HALF} 里的 183 天补给卖家，第二天财政部把 ${HALF} 付给你；16 日结算，应计几乎是 0，但这一期的 ${HALF} 已经付给了卖家。两边其实一样公平。`,
      wrong: {
        0: '净价几乎一样，但应计差了差不多一整期票息。',
        2: '方向反了：15 日付息后应计归零，16 日只有 1 天的应计。',
        3: `4.5 是一整年的票息；应计最多攒半年，也就是 ${HALF}。`,
      },
    },
    {
      q: `IBKR 国债佣金最低 $${MIN}。买 $1,000 面值的 SP43（Amount 384.30），这笔佣金大约占实付的？`,
      opts: ['0.005%', pctOf(SP43_MIN.commissionShare, 1), '5%', '13%'],
      answer: 1,
      why: `$${MIN} ÷ ${usd2(SP43_MIN.total)} ≈ ${pctOf(SP43_MIN.commissionShare, 1)}，差不多是三个月的利息。面值越大，这 $${MIN} 占比越小；$100,000 面值时只有 ${pctOf(HUNDRED.commissionShare, 3)}。`,
      wrong: {
        0: '这是 $100,000 面值时的比例。',
        2: `$${MIN} ÷ $100 才是 5%，这一单你付了将近 $390。`,
        3: `小数点错了一位：$${MIN} ÷ $389 ≈ 0.013，是 1.3%。`,
      },
    },
  ],
  bet: {
    prompt: `9 月 30 日结算，买 **$5,000** 面值的 BOND36：净价 ${f2(P0)}，应计每 100 面值 ${ACC}，佣金按最低 $${MIN}。这 $${MIN} 占你实付总额的百分之几？`,
    slider: { min: 0, max: 1, step: 0.01, initial: 0.5, unit: 'share' },
    answer: BET.commissionShare * 100,
    tiers: [{ maxErr: 0.03, reward: 500 }, { maxErr: 0.1, reward: 200 }],
    explain: `实付 = 50 × (${f2(P0)} + ${ACC}) + $${MIN} = **${usd2(BET.total)}**，$${MIN} 佣金占 **${pctOf(BET.commissionShare, 2)}**。同样的 $${MIN}，买 $1,000 面值的 SP43 占 ${pctOf(SP43_MIN.commissionShare, 1)}，买 $100,000 面值的 BOND36 只占 ${pctOf(HUNDRED.commissionShare, 3)}。买国债，一次买够量比拆成几次划算。`,
    reveal: { kind: 'costTicket', bond: 'BOND36', faceK: BET_FACE / 1000 },
  },
};
