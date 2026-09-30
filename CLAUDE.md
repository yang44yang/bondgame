# Bondgame — 美国国债教学游戏 交接文档

版本 v0.1（2026-09-30，Cowork 讨论定稿）。本文件是 Claude Code 的项目说明：第一部分是不变的设计决策，第二部分是数据与数学，第三部分是架构，第四部分是关卡内容（第 1、2 关写满，其余大纲），最后是待核实清单。改动设计决策前先回到本文件更新。

参考件在 `docs/`：`preview.html` 是 Cowork 里做的可运行预览（首页点亮机制、第 2 关闭环、第 9 关四线演示），里面的数学引擎和 SVG 画法可以直接抄；`bondmath.js` 是同一套引擎的 Node 版，附测试用例。全部原始截图在项目根目录的 `IBKR截图/`：网页版 Bond Scanner（Bill / Bond / Bond STRIPS Principal / Bond TIPS / Note 五个筛选页）、详情页（STRIPS Interest、Note、STRIPS Principal、老 Bond、TIPS、Bill）、Order Ticket 两步（`order.png`、`order2.png`）。仿界面照这些做。`IBKR截图/app/` 里三张 App 截图（BOND36 详情页、Feb 2036 筛选列表）只作数据来源，界面不照它。

---

## 一、设计决策（已定，不要改）

**玩家**：一位家人，有股票经验，对债券的认知停留在"买一个债到期拿票息"。一个人玩，每次 10 分钟，在自己的 IBKR 账户里操作。最终目标：能在 IBKR 网页版（iPad 浏览器里打开）看懂各类国债的区别，自己下单。下单那一下由 Yang 当面教，游戏教的是背后的原理，重点是利率风险和各品种的机制。

**形态**：闯关。前 12 关硬解锁（本关三道题全对才能进下一关），第 13、14 关全开。每关固定结构：讲解 2 分钟 → 演示 3 分钟 → 答题 3 分钟 → 小赌局 2 分钟。讲解可以偏长，多用生活类比（定存单、租约、借条），术语每次都双语：中文在前、英文原文在后，例如"到期收益率 Yield to Maturity (YTM)"。IBKR 是英文界面，他最终要认的是英文标签。

**范围**：只做美国国债（Bill / Note / Bond / STRIPS / TIPS）。不做公司债、市政债、ETF。税和汇率在第 13 关提一嘴。

**设备与部署**：iPad 横屏为默认版式，手机竖屏可用。纯静态站，部署到 socialcontract.capital 的 `/bondgame/` 子路径（VPS 上 nginx 静态文件）。没有后端、没有账号、没有 cron。数据用 2026-09-29 的 IBKR 快照烘进 JSON，不接实时数据。IBKR 的仿界面照 **网页版 Client Portal** 做（Bond Scanner 列表页、债券详情页、右侧 Order Ticket），不照 App 版；家人在 iPad 的浏览器里打开 IBKR 网页版和这个游戏。

**进度机制"点亮六件套"**：首页是一张仿 IBKR 网页版 Bond Scanner 的表，筛选条件 US Treasuries · 2036/02/01 To 2036/02/28 · Treasury Type: All，列出 2036 年 2 月到期的六行品种，列为 PRODUCT / CLOSING PRICE / CURRENT BID YIELD / CURRENT BID PRICE·SIZE / CURRENT ASK YIELD / CURRENT ASK PRICE·SIZE，外加一列 IBKR 没有的"久期"影子列。开局全部打码（模糊），每过一关点亮一块，第 12 关全亮后进入读屏总考。点亮映射见第四部分。

**直觉账户 Intuition Account**：每关末尾的小赌局给一个真实情景让他押一个数或方向，押得准就往直觉账户里加虚拟美元。这个账户在第 14 关沙盒里作为起始资金的加成（起始 $100,000 + 直觉账户余额），让前面的赌局有长期意义。

**沙盒赢的定义**：稳健度，不是收益最大化。规则见第四部分第 14 关。

**不追踪进度、不导出**：进度只存浏览器 localStorage。

---

## 二、数据与数学

### 2.1 固定教学数据集（快照 2026-09-29，结算日 2026-09-30）

所有价格按每 100 面值报价。"IBKR"列是屏幕上显示的数，"我算的"列是引擎按街头惯例（半年付息、实际/实际、T+1 结算）算出来的。两者对不上的地方见第五部分。

| 代号 | 品种 | CUSIP | 票息 | 到期 | IBKR 价格 | IBKR Bid / Ask（收益率） | Size | 我算的 YTM | 修正久期 | 应计/100 | 用途 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BILL27 | US-T Govt Bill Sep02'27 | 912797WA1 | 0 | 2027-09-02 | 96.009 | 95.987 / 96.031（4.550% / 4.496%） | $25,000K | 4.46%（口径差，见五） | 0.90 | 0 | 曲线短端、零息 |
| BOND30 | US-T Govt Bond 6.25 May15'30（2000 年发的 30 年） | 912810FM5 | 6.25 | 2030-05-15 | 104.17 | 103.516 / ≈104.4（5.172% / 4.892%） | $1,000K | 4.98%（中间价） | 3.16 | 2.3438 | 溢价债、老券点差近 1 点 |
| BOND36 | US-T GOVT 4.5 Feb15'36（2006 年发的 30 年）**主线债** | 912810FT0 | 4.5 | 2036-02-15 | 95.480 | 95.414 / 95.547（5.121% / 5.103%） | $2,000K | 5.112%（与 IBKR 完全一致） | 7.47 | 0.5625 | 贯穿第一季 |
| NOTE36F | US-T Govt Note 4.125 Feb15'36（2026-02 发的 10 年） | 91282CPZ8 | 4.125 | 2036-02-15 | 91.77 | 91.84 / ≈91.85（5.238% / 5.237%） | $6,000K / $16,000K | 5.247% | 7.55 | 0.5156 | 同到期不同票息 |
| NOTE36A | US-T Govt Note 4.625 Aug15'36（2026-08-17 新发 10 年，发行量 91.6B） | 91282CRF0 | 4.625 | 2036-08-15 | 95.295 | 95.290 / 95.300（5.241% / 5.240%） | $40,000K / $15,000K | 5.241% | 7.73 | 0.5781 | 新券流动性（点差 0.01） |
| NOTE36M | US-T Govt Note 4.375 May15'36 | — | 4.375 | 2036-05-15 | 93.42 | 93.52 / —（5.241% / 5.240%） | $16,000K | — | — | — | 第 7 关对照 |
| SP36 | US-T GOVT STRIPS Principals Feb15'36 | 912803CX9 | 0 | 2036-02-15 | 未截 | — | — | 按 5.25% 定价 ≈61.52 | 9.14 | 0 | 六件套 |
| SI36 | US-T GOVT STRIPS Interests Feb15'36 | 9128335B2 | 0 | 2036-02-15 | 未截 | — | — | ≈61.5 | 9.14 | 0 | 六件套 |
| NSP36 | US-T GOVT Note STRIPS Principals Feb15'36 | 912821TV7 | 0 | 2036-02-15 | 未截 | — | — | ≈61.5 | 9.14 | 0 | 六件套 |
| TSI36 | US-T GOVT TIPS STRIPS Interests Feb15'36 | 912834HG6 | 0 | 2036-02-15 | 未截 | — | — | 按实际收益率 3.3% ≈73.6（未含 index ratio） | 9.1 | 0 | 六件套 |
| NSP36M | US-T Govt Note STRIPS Principal May15'36 | — | 0 | 2036-05-15 | 60.66 | 60.661 / —（5.263% / 5.244%） | $25,000K | — | — | 0 | 校准 SP36 价格 |
| SP48 | US-T Govt Bond STRIPS Principal Aug15'48（2018-08-15 拆出，14.7B） | 912803FE8 | 0 | 2048-08-15 | 29.097 | 29.035 / 29.159（5.734% / 5.714%） | $25,000K | 5.723% | 21.27 | 0 | 超长零息 |
| SP43 | US-T Govt Bond STRIPS Principal Nov15'43 | 912803GX5 | 0 | 2043-11-15 | 38.340 | 38.248 / 38.433（5.692% / 5.663%） | $25,000K | 5.677% | — | 0 | 下单页素材 |
| SI46 | US-T Govt Bond STRIPS Interest May15'46 | 912834QH4 | 0 | 2046-05-15 | 32.382 | 32.289 / 32.474（5.844% / 5.814%） | $25,000K | — | — | 0 | 利息条；Amount Outstanding 显示 0.00（噪音） |
| SI28 / SP28 | STRIPS Interest / Principal Nov15'28 | — | 0 | 2028-11-15 | 90.18 / 90.27 | 5.003% / 4.904%；4.962% / 4.872% | $25,000K | — | — | 0 | 同到期两种条价格几乎相同 |
| TIPS56 | US-T Govt Bond TIPS 2.375 Feb15'56（2026-02-27 新发 30 年，18.0B） | 912810US5 | 2.375 | 2056-02-15 | 82.809 | 82.594 / 83.023（实际 3.305% / 3.280%） | $25,000K | — | — | — | TIPS 主例 |
| TIPS50 | US-T Govt Bond TIPS 0.25 Feb15'50 | — | 0.25 | 2050-02-15 | 50.25 | 50.188 / —（3.335% / 3.295%） | $25,000K | — | — | — | 低票息 TIPS 为何只值 50 |

2026-09-29 的收益率曲线点（名义，用于第 6 关和沙盒基准）：0.9 年 4.50%（BILL27）、3.6 年 ≈5.0%（BOND30 中间价）、9.4–9.9 年 5.24%（NOTE36 系列）、17 年 5.68%（SP43）、22 年 5.72%（SP48）、20 年 5.83%（SI46 利息条，略高）。30 年名义约 5.8%（我推的，没有直接截图）。TIPS 实际收益率 20–30 年 ≈3.3%，盈亏平衡通胀 ≈2.4–2.5%（我算的）。

点差梯度（校准沙盒的合成 bid/ask）：新券 NOTE36A 0.01 点；主线债 BOND36 0.13；NOTE36F 0.01（bid 与 ask 收益率只差 0.1bp，但 size 不对称）；STRIPS 0.12–0.19；TIPS56 0.43；老券 BOND30 ≈0.9 点（收益率差 28bp）。

IBKR 网页版 Order Ticket 的关键字段（截图 order.png / order2.png，SP43 买 1 手）：数量单位 THOUSAND FACE VALUE（1 = $1,000 面值）；Order Type Limit；Limit Price 38.43；Time-in-Force Day；All or None；第二步显示 "Buy 1 US-T for about ~390.80 USD"、Amount 384.30 USD、Commissions & Fees (est.) 5.00…8.00 USD、Accrued Interest (est.) ~0（零息）、Total ~390.80 USD；下方有"Confirm Mandatory Cap Price"提示（IBKR 会给限价单设上限/下限）。详情页 Details 块里的 Min Order Amount 1 / Min Incremental Amount 1 同样以千面值计。

网页版界面结构（仿界面和读屏总考的依据）：Bond Scanner 页左栏 My Lists，主区标题 US Treasuries、筛选行（日期区间、Treasury Type）、"Showing 1 To 50 of N"、七列表格，底部 "Source: LSEG" 免责声明。详情页从上到下：头部（名字、US-T、BONDDESKG、价格与涨跌、Ask/Bid 各带收益率与 Size）、走势图（图表标题是全名 `US-T GOVT 4.5 Feb15'36 912810FT0 AA1 · United States Treasury · 1 · SMART`，默认画收益率）、Buy / Sell / Watch / Alert、Transaction History、Bond 区块下的 Issuer Information（Issuer Country、Bond Issuer Type、Issue Date、Announce Date、Last Trading Date、Issue Amount、Amount Outstanding、Initial Price、Face Value、Issuer Rating 表）、Details（IBCID、ISIN、Bond Type、Currency、Defaulted、Exchange Listed、Min Order Amount、Min Incremental Amount）、Bond Classification（Puttable、Callable、IsSoftCall、US Only 等）、Coupon Features（Coupon Type、Date From、Date To、Rate、First coupon date）、Bond Special Features（Perpetual、Subordinated、Convertible 等，国债全是 No）。

IBKR 界面噪音字段（第 12 关要考"哪些可以不看"）：Announce Date 显示 Dec 31, 2012 或 Dec 31, 4712；SI46 的 Amount Outstanding 显示 0.00 而 Issue Amount 1.00M；Scanner 里出现无名"—"行；Issuer Rating 里的 TRACE I 不是评级；Exchange Listed Y 对国债无意义；Coupon Features 里的 Rate 把 4.625 显示成 4.6、2.375 显示成 2.4（**票息必须从名字里读**）；Initial Price 0.00。

### 2.2 bond-math 库规格（`src/math/bond.ts`）

约定：半年付息，实际/实际，结算日 = 交易日 + 1（快照用 2026-09-30）。付息日从到期日往前每 6 个月倒推。价格全部按每 100 面值。

需要的函数：`schedule(maturity, settle)` 返回上一/下一付息日和剩余期数；`dirtyPrice(y, c, maturity, settle)`；`accrued(c, maturity, settle)`；`cleanPrice`；`ytm(cleanPrice, c, maturity, settle)`（二分法即可）；`modDuration`（数值微分，用全价）；`macaulayDuration`（第 8 关天平用，返回各现金流的现值和时间，天平支点 = Σ t·PV / Σ PV）；`dv01`；`cashflows(c, maturity, settle)` 返回日期和金额数组（第 1 关时间轴用）；`zeroPrice(y, maturity, settle)` 就是 c = 0 的 cleanPrice（STRIPS 用半年复利，街头惯例）；`billPrice / billYield`（**Bill 单独口径**：实际/360 贴现率与债券等价收益率，见第五部分）；`tipsInvoice(price, indexRatio, face)`（第 11 关）。

测试用例（vitest，全部来自 IBKR 屏幕，settle 2026-09-30）：

| 输入 | 期望 |
|---|---|
| ytm(95.41406, 4.5, 2036-02-15) | 5.121% ±0.002 |
| ytm(95.54688, 4.5, 2036-02-15) | 5.103% ±0.002 |
| accrued(4.5, 2036-02-15) | 0.5625 |
| ytm(91.77, 4.125, 2036-02-15) | 5.247%（IBKR 显示 5.238，允许 ±0.01，差异来源待核实） |
| ytm(29.10, 0, 2048-08-15) | 5.72% ±0.01 |
| ytm(38.3405, 0, 2043-11-15) | 5.68% ±0.01 |
| modDuration(5.112%, 4.5, 2036-02-15) | 7.47 ±0.02 |
| cleanPrice(4.112%, 4.5, 2036-02-15) | 102.99 ±0.02 |
| cashflows(4.5, 2036-02-15).length | 19（2027-02-15 … 2036-02-15） |
| accrued(6.25, 2030-05-15) | 2.3438 |

`docs/bondmath.js` 已通过以上全部（Bill 除外）。

---

## 三、架构

**技术栈**：Vite + React 18 + TypeScript。图表全部手写 SVG（预览里的写法），不引图表库。无路由库，视图由状态切换。样式用 CSS 变量，不用 Tailwind。测试 vitest。

**目录**：

```
src/
  math/        bond.ts, bill.ts, tips.ts + *.test.ts
  data/        snapshot-2026-09-29.json（2.1 的全部数字）, curve.json, spreads.json
  content/     levels/L01.ts … L14.ts（讲解 markdown、演示配置、题库、小赌局）
  game/        progress.ts（localStorage、硬解锁）, wallet.ts（直觉账户）, lighting.ts（点亮映射）
  components/  shell（TopBar、LevelHeader、Timeline）, level（Lesson、Quiz、SideBet）,
               demos（CashflowTimeline、Seesaw、PriceYieldCurve、PullToPar、AccruedSawtooth、
                      CostCalculator、QuoteBar、YieldCurve、SideBySide、DurationBalance、
                      MultiBondChart、StripsExplode、TipsMeter、DecisionTree、Sandbox）,
               ibkr（ScannerTable 仿 Bond Scanner 列表、BondDetail 仿详情页、OrderTicket 仿右侧下单栏）
  views/       Home、Level、Exam、Sandbox
docs/          本文件、preview.html、bondmath.js、IBKR截图/
```

**内容与代码分离**：每关是一个 `LevelContent` 对象：`{ id, season, title, titleEn, lesson: string(markdown), demo: {component, props}, quiz: Question[], bet: SideBet, lights: string[] }`。`Question = { q, opts[4], answer, why, wrong: {idx: string} }`，答错要给"你选的这个错在哪"。改内容不碰组件。

**版式**：iPad 横屏（1180×820 / 1024×768）为默认：关卡页左 60% 演示画布、右 40% 讲解与控件；900px 以下上下堆叠。触控目标 ≥44px，滑块高 32px。首页为单列。字体系统栈（PingFang SC），数字 tabular-nums，价格用等宽。

**配色**（沿用 socialcontract.capital 的"纸上清绿"，浅色/深色两套，四条系列色已跑过色觉验证）：

| 令牌 | 浅色 | 深色 |
|---|---|---|
| bg / card | #FBFBF8 / #FFFFFF | #141816 / #1B201D |
| fg / muted / line | #1E2823 / #66716B / #E2E6DF | #E6EAE6 / #98A29B / #2B322D |
| green（主色、系列 1） | #2E9E5B | #3DAE68 |
| indigo（次色、系列 2） | #3B6BA5 | #5B8AD0 |
| amber（系列 3） | #B0731A | #B87B20 |
| plum（系列 4） | #8E5AA6 | #A77BC8 |
| down（下跌红） | #C4453C | #E06A61 |

**进度与解锁**：`progress` = 已通关的最高关号，存 localStorage。第 N 关（N ≤ 12）的题全对才能把 progress 推到 N。第 13、14 关不受限。直觉账户余额同样存 localStorage。

**部署**：`vite build --base=/bondgame/`，把 `dist/` 放到 VPS 网站根目录下的 `bondgame/`；nginx 加 `location /bondgame/ { try_files $uri $uri/ /bondgame/index.html; }`。

**实施顺序**：① `bond.ts` + 测试跑绿 ② `snapshot` JSON ③ 壳：视图切换、进度、首页仿 Bond Scanner 表与点亮、关卡地图 ④ 关卡引擎：Lesson / Quiz / SideBet 三个组件与内容 schema ⑤ 第 1、2 关内容与演示（CashflowTimeline、Seesaw + PriceYieldCurve）⑥ 第 3–11 关演示逐个做 ⑦ 第 12 关读屏总考 ⑧ 第 13 关 ⑨ 第 14 关沙盒 ⑩ 部署。数学先对，后面所有东西才站得住。

---

## 四、关卡内容

### 4.0 总表与点亮映射

| 季 | 关 | 主题 | 演示组件 | 通关点亮 |
|---|---|---|---|---|
| 一 | 1 | 债券的名字怎么读 | CashflowTimeline | BOND36 的 PRODUCT 列（名字 + "United States Treasury" 子行）|
| 一 | 2 | 价格为什么不是 100 | Seesaw + PriceYieldCurve | BOND36 的 CLOSING PRICE 95.48 |
| 一 | 3 | 到期收益率是什么 | PullToPar | BOND36 的 CURRENT BID YIELD / ASK YIELD |
| 一 | 4 | 实付多少钱 | AccruedSawtooth + CostCalculator | 表下方的 Buy 按钮（通往 Order Ticket）|
| 一 | 5 | Bid / Ask：点差就是成本 | QuoteBar + 点差对照 | BOND36 的 BID PRICE·SIZE / ASK PRICE·SIZE |
| 二 | 6 | Bill / Note / Bond 与收益率曲线 | YieldCurve | 筛选行（日期区间 · Treasury Type）|
| 二 | 7 | 同一天到期的三只债 | SideBySide | NOTE36F 整行 |
| 二 | 8 | 久期（上） | DurationBalance | "久期"影子列（灰） |
| 二 | 9 | 久期（下）与凸性 | MultiBondChart | "久期"影子列点亮 |
| 二 | 10 | STRIPS | StripsExplode | SP36 / SI36 / NSP36 三行 |
| 二 | 11 | TIPS | TipsMeter | TSI36 行 |
| 三 | 12 | 读屏总考 | BondDetail + OrderTicket 仿页 | 全亮 → 考试 |
| 三 | 13 | 怎么选 | DecisionTree | — |
| 三 | 14 | 沙盒 | Sandbox | — |

### 4.1 第 1 关 · 债券的名字怎么读 Reading a Bond's Name（写满）

**讲解**

你在 IBKR 里看到的每一只国债都有一长串名字。Bond Scanner 列表里显示的是短名 `US-T Govt Bond 4.5 Feb15'36`，点进详情页，走势图标题上是全名 `US-T GOVT 4.5 Feb15'36 912810FT0 AA1 · United States Treasury · 1 · SMART`。这串东西不是随便排的，它是这张债的身份证，每一段都有含义。先把它拆开。

`US-T` 是美国国债 United States Treasury，发债的人是美国财政部。`GOVT` 是发行人类型 Issuer Type：政府债。`4.5` 是票息 Coupon，每年按面值的 4.5% 付利息；美国国债一律半年付一次，所以每半年付 2.25。`Feb15'36` 是到期日 Maturity：2036 年 2 月 15 日，那天你拿回面值 Face Value。`912810FT0` 是 CUSIP，九位的证券编号，相当于车的车架号——名字可能重，CUSIP 不会重，IBKR 里搜债最可靠的方式就是搜 CUSIP。`AA1` 是穆迪 Moody's 给的评级 Rating，美国国债 2025 年从最高档 Aaa 下调到 Aa1，这个数对交易没有影响，认识就行。

把债券想成一张写死条款的借条 IOU：谁借（US-T）、借多少（面值）、每年给多少利息（票息）、什么时候还（到期）。这四条写在借条上，一辈子不变。以后会变的，只有这张借条在别人手里转手的价格——那是下一关的事。

面值 Face Value 在 IBKR 详情页的 Issuer Information 里显示 1,000.00，意思是一张的面值是 1,000 美元；但所有报价都按每 100 面值 Per 100 来写，95.48 的意思是每 100 面值卖 95.48 美元，一张 1,000 面值就是 954.80 美元。付息信息在 Coupon Features 块：Coupon Type FIXED，每年 2 月 15 日和 8 月 15 日各付一次，每 100 面值付 2.25，每 1,000 面值付 22.50。注意那个 Rate 字段会把 4.625 显示成 4.6、2.375 显示成 2.4，票息要从名字里读。

名字里的 Bill、Note、Bond 三个词先只认名字，第 6 关细讲：Bill 是一年以内的，不付票息，靠折价赚钱；Note 是 2 到 10 年的；Bond 是 20 到 30 年的。注意这个分类按**发行时**的期限定，不按现在还剩多久。4.5 Feb'36 是 2006 年发的 30 年期 Bond，今天只剩 9.4 年，名字里还是 Bond，就像一个 60 岁的人身份证上的出生年份不会跟着年龄改。

最后一个概念：现金流 Cash Flow。从今天到 2036 年 2 月，这张债一共还会给你 19 次票息，最后一次连本金一起给。把它们排在时间轴上，你就看见了你买的到底是什么——不是一个"4.5%"，而是 19 笔 2.25 和一笔 100，日期都写死了。

**演示 CashflowTimeline**

横轴 2026-09 到 2036-02，每根柱子是一笔现金流：18 根 2.25，最后一根 102.25。点任一根显示日期和金额。三个切换：面值 $1,000 / $10,000 / $100,000（柱子上的美元数跟着变）；换成 NOTE36F（柱子变矮成 2.0625，最后一根 102.0625，同一天到期）；换成 SP36（只剩最后一根 100，其余消失——预告第 10 关）。

**题目**（三道全对通关；每题给"你选的错在哪"）

1. 名字里的 4.5 是什么？ A 价格 / B 每年的票息率，按面值算 / C 到期收益率 / D 剩余年限。答 B。A：价格是 95.48，在名字下面另一行。C：收益率是市场算出来的，会变；票息写在借条上，不变。D：年限看 Feb15'36。
2. `Feb15'36` 是什么？ A 发行日 / B 到期日 / C 下次付息日 / D 评级日。答 B。C：下次付息是 2027-02-15，恰好同月同日，但到期是 2036。
3. 面值 1,000、票息 4.5、半年付息，每次付你多少？ A $45 / B $22.50 / C $4.50 / D $2.25。答 B。A：那是一年的。C：4.5 是每 100 面值一年的。D：2.25 是每 100 面值半年的，你有 10 个 100。
4. 这只债只剩 9.4 年，为什么还叫 Bond 不叫 Note？ A 名字按发行时的期限定 / B IBKR 标错了 / C 剩余超过 5 年都叫 Bond / D 票息高的叫 Bond。答 A。
5. `AA1` 是什么？ A 交易所代码 / B 穆迪评级 / C 最高评级 / D 债券系列号。答 B。C：最高档是 Aaa，2025 年美国被下调到 Aa1。

**小赌局**：从今天到到期，一张 $10,000 面值的 4.5 Feb'36 一共会付给你多少票息（不含本金）？滑块 $2,000–$8,000，步长 $50。答案 19 × $225 = $4,275。偏差 ≤ $200 加 $500；≤ $500 加 $200；否则 0。揭晓时时间轴上 19 根柱子逐根点亮累加。

**点亮**：BOND36 的 PRODUCT 列。

### 4.2 第 2 关 · 价格为什么不是 100 Why the Price Isn't 100（写满）

**讲解**

你已经知道：一张面值 100、票息 4.5% 的国债，每半年给你 2.25，到期还你 100。这些条款写死在借条上，一辈子不变。你还不知道的是：这张借条从发行到到期的 30 年里，每一天都在市场上转手，转手价几乎从来不是 100。今天（2026-09-29）IBKR 上这只 4.5 Feb'36 的价格 Price 是 95.48。

拿定期存单打比方。你去年在银行存了一张三年期、年息 4.5% 的存单。今年银行给新客户的三年期利率涨到了 5.1%。这时你想把手里的存单转让给别人，他为什么要接？银行明明给他 5.1%。他只会在一种情况下接：你打折。折到他按这个折扣价买入、拿到期，实际年化也有 5.1% 为止。这个折扣价，就是 95.48。

再换个比方。一套房子签了十年固定租金的租约，市场租金涨了，这套房连同租约就没那么值钱了；市场租金跌了，这份锁定高租金的租约反而成了宝贝。租金就是票息，房价就是债券价格。

反过来的例子 IBKR 上也有：2000 年发的一只 6.25% 的老国债（6.25 May'30），今天卖 104.17，高于面值。因为现在市场利率只有 5% 左右，手里有 6.25% 票息的借条是香饽饽，别人愿意加价买。这叫溢价 Premium；95.48 那种叫折价 Discount；正好 100 叫平价 Par。

所以价格 Price 和到期收益率 Yield to Maturity (YTM) 是同一件事的两种说法。YTM 是"按今天的价格买入、持有到期、把票息和到期补回面值都算上"的年化回报。利率涨，价格跌；利率跌，价格涨。IBKR 上 95.48 旁边写的 5.11%，就是这个数。

折价债的回报来自两块：每年 4.5 的票息，加上到期时 95.48 补回 100 的 4.52 点。只看第一块，4.5 ÷ 95.48 = 4.71%，这叫当前收益率 Current Yield，它不是你的回报；两块合起来摊到 9.4 年，才是 5.11%。

一个反直觉的地方：债券价格下跌，对还没买的人是好事（更便宜的入场价、更高的收益率）；对已经持有、马上要卖的人是坏事；对打算持有到期的人无所谓，他拿到的每一笔现金流一分不少。第 3 关和第 8 关会分别展开这两头。

还有一个坑。IBKR 详情页那张走势图默认画的是**收益率 Yield**，不是价格（图上的 O/H/L/C 数值是 5.69、4.50 这种收益率数字，不是价格）。图往上走，是收益率在涨，价格在跌。看图之前先看数值量级。

**演示 Seesaw + PriceYieldCurve**（预览已实现）

上半：跷跷板，左端"价格 Price"，右端"收益率 Yield"，拖收益率滑块（1%–9%），一头升一头降。下半：价格–收益率曲线，横轴收益率、纵轴价格，虚线标面值 100，空心圈标"IBKR 今天 95.48 ↔ 5.11%"，实心点跟着滑块走。右栏：YTM、价格、折价/溢价/平价标签及一句解释、"回到今天"按钮；下面一个小表拆解持有到期回报：票息 4.50 / 到期补回 +4.52 / 当前收益率 4.71% / YTM 5.11%。

**题目**

1. 票息 4.5% 的债，今天以 95.48 买入并持有到期，年化回报大约是？ A 4.5%，票息就是回报 / B 4.7%，4.5 ÷ 95.48 / C 5.1% / D 9.5%，4.5 加折价 5 点。答 C。A：票息按面值 100 算，你付的不是 100。B：这是当前收益率，漏了到期补回面值。D：4.52 点要摊到 9.4 年，不是一年吃完。
2. 明天市场利率上升，这只债的价格会？ A 上涨 / B 下跌 / C 不变，票息固定 / D 取决于美联储怎么说。答 B。C：票息固定，正因为如此价格才必须动。D：美联储影响的是利率，利率一动价格就动。
3. 2000 年发的 6.25% 老债现在卖 104.17，说明？ A 它更安全 / B 市场收益率低于 6.25%，多出来的票息被提前收了钱 / C 快到期所以贵 / D IBKR 报价错了。答 B。A：都是美国国债，信用一样。C：快到期的债价格向 100 靠拢。
4. 价格从 95 跌到 90，对谁是坏消息？ A 明天要买的人 / B 持有到期的人 / C 明天要卖的人 / D 都是坏消息。答 C。A：他买得更便宜。B：他的现金流一分不少。
5. IBKR 详情页那张图从 4.2 涨到 5.1，这半年这只债的价格？ A 涨了 / B 跌了 / C 图画的是价格所以涨了 / D 不能判断。答 B。C：4.2 到 5.1 的量级是收益率，价格在 95 上下。

**小赌局**：今天 95.48、5.11%。假设明天收益率降到 4.11%（降 100 个基点 basis points），价格会涨到多少？滑块 95–120，步长 0.5。答案 102.99（涨 7.5 点，7.9%）。偏差 ≤1 点加 $500；≤3 点加 $200；否则 0。揭晓时曲线上的点滑到 4.11%，并预告：第 8 关的公式是修正久期 7.5 × 1% ≈ 7.5%。

**点亮**：BOND36 的 CLOSING PRICE 95.48。

### 4.3 第 3 关 · 到期收益率是什么（大纲）

讲解要点：YTM 的精确定义是让"今天付的价格 = 未来所有现金流按这个利率折现的总和"成立的那个利率，类比"这笔投资的内部年化"；当前收益率 vs YTM 再讲一次；拉回面值 Pull to Par——收益率不变时，价格随时间向 100 靠拢，折价债一路涨、溢价债一路跌，这不是赚亏，是提前定好的；YTM 隐含"票息按同样利率再投资"的假设，实际做不到，这是 STRIPS 的卖点（第 10 关）。演示 PullToPar：时间滑块 2026→2036，收益率固定 5.11%，价格曲线从 95.48 爬到 100，下方累计票息柱；切到 BOND30 看 104 跌向 100。题目方向：定义题、方向题（价格高于/低于面值对应收益率高于/低于票息）、"再投资假设"概念题。小赌局：收益率一直不变，2031 年 2 月这只债价格是多少（答案用引擎算）。点亮：BOND36 的 CURRENT BID YIELD 5.121% / ASK YIELD 5.103%（两个数为什么不同留到第 5 关）。

### 4.4 第 4 关 · 实付多少钱（大纲）

讲解要点：报价每 100 面值，IBKR Order Ticket 的数量单位 THOUSAND FACE VALUE，填 1 = $1,000 面值，详情页 Min Order Amount 1 / Min Incremental Amount 1 也是这个单位；净价 Clean Price 是屏幕上的价，全价 Dirty Price = 净价 + 应计利息 Accrued Interest；应计 = 上次付息日到结算日之间的票息归卖方（BOND36 在 9/30 结算：46/184 × 2.25 = 0.5625，每千面值 $5.63）；结算 T+1；付息日当天应计归零（锯齿）；佣金：IBKR 国债最低 $5（Order Ticket 第二步显示 5.00…8.00），$1,000 面值一手佣金占 1.3–2%，面值越大占比越小；Order Ticket 第二步的 Total = Amount + Commission + Accrued，逐行讲一遍 order2.png。演示 AccruedSawtooth（时间滑块跨 2026-08-15 → 2027-02-15，净价平线、全价爬升、付息日掉回）+ CostCalculator（面值滑块 $1k–$100k，输出 Amount / Accrued / Commission / Total / 佣金占比）。题目方向：10 万面值实付；为什么 STRIPS 应计为 0；最低佣金占比。小赌局：买 $5,000 面值 BOND36，最低佣金占实付百分之几。点亮：Buy 按钮。

### 4.5 第 5 关 · Bid / Ask（大纲）

讲解要点：买在 Ask、卖在 Bid，一买一卖的差价 Spread 是摩擦成本（BOND36 0.133 点 → $10 万面值 $133）；Bid 收益率比 Ask 高，因为你买在高价拿低收益；Size 是对手盘愿意成交的面值（$2,000K = 200 万美元）；流动性梯度用真实点差讲：新券 0.01、主线债 0.13、STRIPS 0.15、TIPS 0.43、老券 0.9；限价单 Limit 与"Mandatory Cap Price"；详情页头部的 `Ask 95.300(5.240%) × $15,000K / Bid 95.290(5.241%) × $40,000K` 怎么读（价格、括号里的收益率、× 后面的 Size）。演示 QuoteBar（仿详情页头部的 Ask/Bid 块，点 Buy 显示你的成交价和收益率）+ 五只债点差条形图。题目方向：读屏题（你买入价是多少、成交后立刻卖出亏多少、哪只点差最贵）。小赌局：BOND36 买入后立刻卖出，10 万面值亏多少。点亮：BOND36 的 BID PRICE·SIZE / ASK PRICE·SIZE。

### 4.6 第 6 关 · Bill / Note / Bond 与收益率曲线（大纲）

讲解要点：三类定义（Bill ≤1 年零息贴现；Note 2/3/5/7/10 年；Bond 20/30 年；按发行期限命名）；收益率曲线 = 各期限收益率连线，用 2026-09-29 真实点（0.9 年 4.50%、3.6 年 5.0%、9.4 年 5.24%、17 年 5.68%、22 年 5.72%）；形状：正常向上、平、倒挂各代表什么；网页版 Bond Scanner 怎么用：Treasury Type 下拉（Bill / Note / Bond / Bond STRIPS Principal / Bond STRIPS Interest / Note STRIPS Principal / Bond TIPS …）、到期日区间、按 Ask Yield 排序，以及 Type 选 Bond 时 STRIPS 也会混进来（截图 2、11）。演示 YieldCurve：点某点显示对应的债，三个按钮"平行上移 / 变陡 / 变平"预告沙盒。题目方向：分类题、读曲线题、"要找 2036 年到期的所有品种该怎么筛"。小赌局：2 年期今天的收益率大约（曲线上没画点，让他插值，答案 ≈4.7%，我推的）。点亮：筛选行。

### 4.7 第 7 关 · 同一天到期的三只债（大纲）

讲解要点：BOND36 4.5%（95.48，5.11%）、NOTE36F 4.125%（91.77，5.24%）、NOTE36A 4.625%（95.30，5.24%）；票息不同价格不同，收益率理论上应几乎一样；实际 BOND36 低了 13bp，先怀疑数据（老券报价陈旧、Size 小），再怀疑市场；新券 On-the-run vs 老券 Off-the-run；溢价债 BOND30：104 买、到期收 100，"亏"的 4 点是提前付的高票息，YTM 5.0% 和别人一样；比较债只看 YTM 和点差，不看票息也不看价格高低。演示 SideBySide：三只债并排（价格、票息、YTM、点差、Size），"等收益率"滑块让三只价格同步变。题目方向："哪只更划算"陷阱题（答案：看 YTM 和点差，不是看价格低）；"4.125 比 4.5 便宜 3.7 点是不是捡漏"。小赌局：NOTE36F 若也按 5.11% 定价，价格应是（答 92.72）。点亮：NOTE36F 整行。

### 4.8 第 8 关 · 久期（上）（大纲）

讲解要点：久期 Duration 的直觉是"你的钱被这个固定利率锁住的平均年数"，类比一年租约 vs 二十年固定租金租约；Macaulay 久期 = 现金流现值的时间加权平均，用天平画；修正久期 Modified Duration ≈ Macaulay ÷ (1 + y/2)，BOND36 ≈ 7.5；估算公式 ΔP% ≈ −修正久期 × Δy；DV01 = 利率变 1 个基点的美元变化。演示 DurationBalance：横梁上的砝码是各期现金流的现值，支点是久期；票息滑块（票息越低支点越右）、到期滑块（越长越右）、切到零息支点滑到最右端。题目方向：估算题（利率升 0.5%，10 万面值 BOND36 市值变化约 −$3,500）。小赌局：同上换个数。点亮：久期影子列灰显。

### 4.9 第 9 关 · 久期（下）与凸性（大纲，预览已实现演示）

讲解见 preview.html。演示 MultiBondChart：BILL27、BOND30、BOND36、SP48 四条线，横轴收益率平行变动 −300…+300bp，纵轴价格变化 %，可拖；表格列剩余年限、今价、新价、变化、修正久期（0.9 / 3.2 / 7.5 / 21.3）。题目：利率降 1% 哪只赚最多（SP48 +24%，但升 1% 也是它跌最多 −19%）；涨跌为何不对称（凸性）。点亮：久期影子列点亮。

### 4.10 第 10 关 · STRIPS（大纲）

讲解要点：把一只付息债的每笔现金流拆开单卖，每一块都是零息债；本金条 Principal（CUSIP 912803 / 912821 前缀，后者从 Note 拆）与利息条 Interest（9128335 前缀，同日到期的利息条可互换 fungible，所以 SI36 / SP36 / NSP36 价格几乎一样）；价格远低于 100（Feb'36 ≈61.5，Aug'48 29.1）；没有再投资风险，锁定收益率；久期 = 剩余年限，同期限里最敏感；适合"确定某年要用一笔钱"；IBKR 里 SI46 的 Amount Outstanding 显示 0 是数据噪音。演示 StripsExplode：BOND36 炸成 19 个利息条 + 1 个本金条，点任一块显示零息价格与到期日，把 Feb'36 那块和六件套对上。题目方向：识别题（六件套里哪三行是 STRIPS、哪行是 TIPS STRIPS）、零息价格计算、"为什么利息条和本金条价格一样"。小赌局：SP36 今天价格（≈61.5）。点亮：SP36 / SI36 / NSP36。

### 4.11 第 11 关 · TIPS（大纲）

讲解要点：本金随 CPI 调整（index ratio），票息按调整后本金付；实际收益率 Real Yield ≈3.3% vs 名义 ≈5.7%，差值 ≈2.4% 是盈亏平衡通胀 Breakeven；IBKR 页面上的 TIPS 价格是未调整价，实付 = 价格 × index ratio × 面值 + 应计，详情页不显示 index ratio（去 TreasuryDirect 查，或看 Order Ticket 第二步的 Amount 反推）；TIPS56 新发 index ratio ≈1.01，TIPS50 ≈1.25（待核实）；TIPS50 票息 0.25 所以价格只有 50；TIPS STRIPS 利息条就是六件套第三行；何时划算：你预期未来通胀高于盈亏平衡。演示 TipsMeter：CPI 路径滑块（0–6%），显示本金、票息、总回报，和 BOND36 名义债对照，交叉点就是盈亏平衡。题目方向：概念题、盈亏平衡计算、"TIPS 价格 82 是不是便宜"。小赌局：未来 10 年平均通胀多少 TIPS 和名义债打平。点亮：TSI36。

### 4.12 第 12 关 · 读屏总考（大纲）

六件套全亮后开考。素材是 IBKR **网页版** 的页面，截图齐全（Scanner 五个筛选页、六种详情页、Order Ticket 两步）。12 题，10 题通过。覆盖：Scanner 六行各是什么、七列各是什么；详情页头部（价格与涨跌、Ask/Bid 各带收益率和 Size、BONDDESKG 是交易场所）；走势图默认画收益率；Issuer Information（Issue Date 与 Last Trading Date、Issue Amount 与 Amount Outstanding、Face Value、Issuer Rating 表里 MOODY AA1 是评级而 TRACE I 不是）；Details（IBCID / ISIN / Bond Type / Min Order Amount）；Bond Classification（Callable / Puttable 全 No）；Coupon Features（Rate 显示 4.6 的坑、First coupon date）；Bond Special Features 全 No 的含义（国债没有任何花样条款）；Order Ticket 字段（THOUSAND FACE VALUE、Limit、Amount、Commission、Accrued、Total、Mandatory Cap Price）；噪音字段题（Announce Date 4712、Amount Outstanding 0、Initial Price 0、Scanner 里的无名行）。仿页组件 BondDetail / OrderTicket 只还原字段和布局逻辑，不追求像素级；题目考"这个字段是什么意思"，不考"它在屏幕哪个位置"。

### 4.13 第 13 关 · 怎么选（大纲）

讲解要点：持有到期 vs 交易（前者只看 YTM 和到期日，后者看久期和点差）；阶梯 Ladder（1 / 3 / 5 / 10 年各买一档，每年有到期可再投）；STRIPS vs 付息债（确定用钱日期选 STRIPS，要现金流选付息）；TIPS 何时；再投资风险；国债在 IBKR 的保证金要求只有 5%（App 详情页显示 Initial / Maintenance Margin 5.00%），意味着理论上可以 20 倍杠杆，本游戏不教、建议不碰；税：非美国居民持有国债利息无美国预扣税，IBKR 填 W-8BEN；汇率：美元资产的人民币计价波动可能比债券本身大；IBKR 闲置现金利率 vs 直接买 Bill。演示 DecisionTree：回答三个问题（什么时候用钱 / 要不要现金流 / 担不担心通胀）→ 推荐品种类型。题目方向：情景题。无小赌局。

### 4.14 第 14 关 · 沙盒（大纲，规则已定）

起始资金 $100,000 + 直觉账户余额。可买：BILL27、BOND30、BOND36、NOTE36F、SP36、SP48、TIPS56、现金（IBKR 闲置现金利率假设 3.5%，待核实）。买在 Ask、卖在 Bid，付佣金（最低 $5）和应计。玩家配好组合后一次性推进 12 个月，票息按月入账为现金，到期的 BILL27 变现金。四条利率路径同时演算，曲线变动线性插值到每月：

| 路径 | 曲线变动（12 个月末） | 通胀假设（TIPS 用） |
|---|---|---|
| P1 平行上行 | 全期限 +150bp | 3.5% |
| P2 平行下行 | 全期限 −150bp | 1.5% |
| P3 变陡 | 短端 −50bp、长端 +100bp | 3.0% |
| P4 变平 / 倒挂 | 短端 +100bp、长端 −50bp | 2.0% |

评分：每条路径的总回报 = (期末市值 + 累计现金) ÷ 起始 − 1。最差路径 ≥ 0 → 及格"没翻车"；最差路径 ≥ 0 且四条路径平均 ≥ 同期 BILL27 收益 + 0.5% → 优秀"承担了有回报的风险"。结果页每条路径给回报拆解：票息收入 / 价格变动 / 交易成本 / 通胀调整；标出翻车的路径和让你翻车的那只债。设计目的是让他亲眼看到三件事：全买 Bill 及格但不优秀；全买 SP48 一条路径 +30% 一条 −25%；阶梯组合四条都为正。进阶版（v2）允许每季度调仓一次、路径逐月揭示。

---

## 五、我不确定的 / 待核实

1. **Bill 口径**：引擎按半年复利算 BILL27 收益率 4.46%，IBKR 显示 4.50%。国库券按实际/360 贴现率报价，再换算成债券等价收益率 BEY。`bill.ts` 要单独实现，用 IBKR 的 95.987 / 96.031 ↔ 4.550% / 4.496% 作测试用例。
2. **BOND36 比同到期 Note 收益率低 13bp**（5.11% vs 5.24%）。四只 2035–2036 年到期的 Note 整齐落在 5.236–5.241%，只有这只 2006 年的老 Bond 是异类。最可能是老券报价陈旧或数据源不同，未能从截图确认。教学上按"先怀疑数据"处理，但沙盒定价时用曲线（5.24%）而不是用 95.48，否则会产生假的套利机会。
3. **IBKR 国债佣金表**：下单页显示 5.00…8.00 美元预估；记忆里是面值的 0.2bp、最低 $5，需在 IBKR 定价页核实后写进 CostCalculator。
4. **TIPS index ratio**：TIPS56 ≈1.01、TIPS50 ≈1.25 是估的，去 TreasuryDirect 查当天数。
5. **穆迪下调日期**：2025 年 5 月 Aaa → Aa1，核实。
6. **沙盒的闲置现金利率**：假设 3.5%，按 IBKR 当前基准利率减 0.5% 核实。
7. **30 年名义收益率**：截图里没有 30 年付息债，5.8% 是从 SI46 推的。
8. **六件套本身的网页版页面没有截图**：BOND36 的价格和 Bid/Ask 来自 App 截图，NOTE36F 来自 Note Scanner，四只 STRIPS / TIPS STRIPS 的 Feb'36 价格是算的。仿 Scanner 表里这几行的显示名按网页版命名规则推（`US-T Govt Bond STRIPS Principal 0.0 Feb15'36` 这种），TIPS STRIPS 的网页版名字是推测。Treasury Type 下拉的完整选项列表也没截到，已知的有 Bill、Note、Bond、Bond STRIPS Principal、Bond STRIPS Interest、Note STRIPS Principal、Bond TIPS。
