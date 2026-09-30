/** Interface text. Chinese first, English after, as on every screen of the game. */
export const ui = {
  brand: { zh: '债券游戏', en: 'Bond Game' },
  wallet: { zh: '直觉账户', en: 'Intuition Account' },
  progress: '已通关 Cleared {n} / 12',

  phases: {
    lesson: { zh: '讲解', en: 'Read' },
    demo: { zh: '演示', en: 'Play' },
    quiz: { zh: '答题', en: 'Quiz' },
    bet: { zh: '小赌局', en: 'Side Bet' },
  },
  minutes: '{n}′',
  seasons: {
    1: { zh: '第一季 · 一只债', en: 'Season 1 · One Bond' },
    2: { zh: '第二季 · 一堆债', en: 'Season 2 · Many Bonds' },
    3: { zh: '第三季 · 上手', en: 'Season 3 · Hands On' },
  },
  levelNo: '第 {n} 关',
  back: '← 首页 Home',

  lesson: { next: '下一步：演示 Next: Play →' },
  demo: { guideTitle: '试试这几件事 Try this', next: '下一步：答题 Next: Quiz →' },

  quiz: {
    intro: '三道题全对才能通关。答错会告诉你错在哪，然后换一组再来。',
    introEn: 'Get all three right to clear the level.',
    alreadyCleared: '你已经通关了，这里随便再练。Already cleared: practice freely.',
    correct: '答对了 Correct.',
    wrong: '不对 Not quite.',
    wrongPickBefore: '你选的「',
    wrongPickAfter: '」错在：',
    rightAnswer: '正确答案 Answer: {letter}。',
    passed: '{n} / {n} 全对，通关！Level cleared.',
    failed: '{c} / {n}，还差一点。Not yet.',
    retry: '换一组再来 Try another set',
    next: '下一步：小赌局 Next: Side Bet →',
    letters: ['A', 'B', 'C', 'D'],
    counter: '第 {i} / {n} 题',
  },

  bet: {
    title: { zh: '小赌局', en: 'Side Bet' },
    rule: '押得准，直觉账户就进账：偏差 ≤ {t1} 加 {r1}；≤ {t2} 加 {r2}。每关只能押一次。',
    yourGuess: '你押 Your bet',
    place: '下注 Place Bet',
    answer: '答案 Answer',
    offBy: '偏差 Off by',
    won: '直觉账户 +{r}',
    lost: '这次没中，直觉账户 +$0',
    replay: '再看一遍揭晓 Replay',
    finish: '通关 → 回首页看点亮 Back to the scanner →',
    needQuiz: '先把三道题答全对，才能通关。Clear the quiz first.',
    goQuiz: '去答题 Go to Quiz',
    locked: '先押再看：押完这张图才会揭晓。Place your bet to unlock the chart.',
    errSuffix: { usd: '', price: ' 点 pts', pct: ' 个百分点 pp', share: ' 个百分点 pp' },
    sliderLabel: '拖动押注 Drag to bet',
  },

  level: {
    phasesAria: '关卡步骤 Level steps',
    notBuilt: '本关内容在下一个里程碑。Coming in the next milestone.',
    outline: '这一关讲什么 What this level covers',
    locked: '这一关还锁着。先通关第 {n} 关。Locked: clear level {n} first.',
    devSkip: '开发：把本关记为已通关 Dev: mark cleared',
  },

  map: {
    title: { zh: '关卡地图', en: 'Level Map' },
    status: { done: '已点亮 Lit', current: '当前 Current', locked: '锁定 Locked', open: '全开 Open' },
    start: '开始 Start',
    replay: '重玩 Replay',
    outline: '看大纲 Outline',
    locked: '锁定 Locked',
    enter: '进入 Enter',
    duration: '10 min',
    lightsLine: '通关点亮：{what}',
  },

  home: {
    title: '看懂这一屏，然后自己下单。',
    titleEn: 'Read this screen, then place the order yourself.',
    intro:
      '终局目标：IBKR 里 2036 年 2 月到期的六个品种。你现在只认识票息 Coupon 和到期日 Maturity，所以整屏都是模糊的。每过一关，点亮一块；第 11 关之后全亮，进入第 12 关读屏总考。',
    justLit: '刚点亮 Just lit：{what}',
    legendBlur: '模糊 = 还没点亮 Not lit yet',
    legendCalc: '带 ≈ 的数是引擎按当天收益率曲线算的，截图里没有这一行的报价 ≈ = computed, not on screen',
    legendSource: '其余数字来自 2026-09-29 IBKR 屏幕 Other numbers are from IBKR screens on 2026-09-29',
    buyCaption: '第 4 关：知道实付多少钱才点亮 Lit at Level 4',
    buyCaptionLit: '第 4 关演示过 Order Ticket 怎么算钱；完整仿页在第 12 关 Full mock ticket in Level 12',
    examButton: '读屏总考 Final Screen Test',
    examCaption: '第 11 关之后全亮，开考 Opens when every cell is lit',
    durationHint: 'IBKR 没有这一列 Not on IBKR',
  },

  scannerAria: 'IBKR 网页版 Bond Scanner 仿界面 Mock IBKR Bond Scanner',
  mapAria: '关卡地图 Level map',

  dev: {
    title: '开发模式 Dev mode',
    progress: '模拟进度：已通关到第 {n} 关 Simulated progress',
    reset: '清空进度和直觉账户 Reset everything',
    confirmReset: '确定清空？进度和直觉账户都会归零。',
  },

  exam: {
    body: '六件套全亮之后开考：12 道读屏题，答对 10 道通过。题目用 IBKR 网页版的 Bond Scanner、详情页和 Order Ticket。这一关在下一个里程碑做。',
    locked: '还没全亮。先通关第 11 关。Light every cell first.',
  },

  sandbox: {
    body: '用真实的 2026-09-29 报价配一个国债组合，一次推进 12 个月，四条利率路径同时演算。赢的定义是稳健：最差的那条路径也不亏。这一关在下一个里程碑做。',
    capital: '起始资金 Starting capital',
    formula: '$100,000 + 直觉账户 {wallet} = {total}',
  },

  units: {
    bp: '{n} bp',
  },
};

export type UI = typeof ui;
