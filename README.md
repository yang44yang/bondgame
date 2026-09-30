# Bondgame · 美国国债教学游戏

一个闯关式的小游戏：学会在 IBKR 网页版里看懂美国国债（Bill / Note / Bond / STRIPS / TIPS），弄明白价格、到期收益率、应计利息、点差和久期，然后自己下单。每关 10 分钟：讲解、演示、答题、小赌局。

纯静态站：Vite + React 18 + TypeScript，图表全部手写 SVG，没有后端。进度只存在浏览器的 localStorage 里。设计文档见 [CLAUDE.md](CLAUDE.md)。

目前可以玩第 1–11 关，其余关卡显示大纲。

## 运行

```bash
npm install
npm run dev
```

- 打开 http://localhost:5173 。地址后面加 `?dev=1` 会出现进度滑块和“跳关”按钮。
- `npm test` 跑全部测试：债券数学、数据快照、关卡内容。
- `npm run build` 输出 `dist/`，按部署在 `/bondgame/` 子路径构建。
- `npm run build:data` 在改了引擎或假设之后重新生成快照里的计算值。

## 目录

- `src/math`：债券、国库券、TIPS、下单成本的计算，附测试。
- `src/data`：2026-09-29 的 IBKR 数据快照。每条记录都标了 `source`，区分屏幕上显示的数和引擎算出来的数。
- `src/content`：全部文案和关卡内容。组件里不写文案。
- `src/components`、`src/views`：界面。

## 数据来源

快照里标为 `ibkr` 的数字，来自 2026-09-29 的 IBKR 网页版和 App 截图。截图本身不在这个仓库里，JSON 的 `screenshot` 字段记录了每个数字出自哪一张。没有截图时，检查截图文件是否存在的那条测试会自动跳过。

仅用于学习，不构成投资建议。Educational only, not investment advice.
