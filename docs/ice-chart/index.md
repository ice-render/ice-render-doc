---
sidebar_position: 1
---

# ice-chart · 交互式图表库

**ice-chart 是构建在 ice-render 引擎之上的交互式图表库（当前 `@damoqiongqiu/ice-chart` v0.17.2）。** 它不是「把数据画成图」的又一个图表库——命中测试、事件派发、嵌套坐标系、脏矩形局部重绘**全部交给 ice-render 引擎**，图表层只负责把「数据 ↔ 像素 ↔ 语义事件」这三件事打通。

于是**悬停高亮、点击下钻、框选缩放、缩放平移、图例联动、跨图联动、键盘导航都是内建能力**，而不是事后打补丁的插件——因为每一个系列组件都实现了 `containsLocalPoint`，把「画出来什么样」和「点得到哪里」统一在同一份像素缓存里。

MIT License · 作者：大漠穷秋（damoqiongqiu@126.com）

## 一个完整的实时大屏例子（就是仓库里的 `examples/dashboard-market.html`）

下面这个 iframe 直接嵌入了 `ice-chart` 仓库 `examples/dashboard-market.html` 的**完整代码**：行情监控大屏（K 线、深度、资金流、板块、委托队列等一整屏图表），所有交互（悬停十字准星、框选缩放、图例联动、键盘导航）都由引擎内建。首次加载会从文档静态托管拉取 ~450KB 的 ice-render + ice-chart UMD 运行时（无需联网）：

<iframe
  src="/ice-chart/dashboard-market.html"
  title="ice-chart 行情监控大屏"
  loading="lazy"
  style={{ width: '100%', height: '820px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#0b1020' }}
/>

> 这就是 ice-chart 的核心卖点：**图表层不碰 DOM 事件，只声明「数据 → 像素 → 语义事件」，命中与派发全部由引擎承担。** 同一份引擎实例池还能让多张图共享统一的事件语义，跨图联动因此水到渠成。

## 核心能力

| 能力 | 说明 |
| --- | --- |
| 图表类型 | 折线 / 面积 / 柱状 / 堆叠柱 / 饼 / 玫瑰 / 雷达 / 仪表盘 / 漏斗 / 水位球 / 散点 / 气泡 / 箱线 / 桑基 / 关系图 / 树图 / 热力 / K 线 / 时序等，均基于 ice-render 图元 |
| 内建交互 | 悬停高亮 + 压暗其它系列、点击下钻、框选缩放、滚轮缩放、拖拽平移、图例联动、跨图联动、键盘导航——命中由引擎承担，0 插件成本 |
| 设计语言 | 直接采用 Bootstrap 5 调色板与令牌（`--bs-border-radius`、`--bs-body-font-family` 等），换肤只需覆盖 `theme.colorPalette` 或派生 `BOOTSTRAP_TOKENS` |
| 大屏脚手架 | `dash-kit` 1~12 列栅格 + 一套空间利用率审计（墨迹横向占宽 / 图形直径占分配直径门禁），避免「右侧浪费太多」 |
| 像素契约 | `rebuildPixels()` 重算一次点集，`render()` 与 `hitTestIndex()` 消费同一份缓存——「看得见的点」与「点得到的点」不可能漂移 |
| AI Agent DSL | `ice-chart-dsl`：一张表 + `encoding` 直接编译成 `ChartOption`，带结构化诊断（见下节） |

## 快速开始

### 安装

```bash
# 图表库 + 引擎（二者都要装；ice-render 是 peer 依赖，一个页面多张图共用同一引擎实例池）
npm install @damoqiongqiu/ice-chart ice-render
```

### 在浏览器里（无构建，UMD 全局 `ICEChart`）

注意**引擎要先于图表引入**：

```html
<canvas id="chart" width="960" height="420"></canvas>
<script src="./ice-render.umd.js"></script>
<script src="./ice-chart.umd.js"></script>
<script>
  ICEChart.createChart('chart', {
    title: { text: '近 30 天流量' },
    tooltip: { trigger: 'axis' },
    interaction: {
      hover: { enabled: true, dimOthers: true },
      brush: { enabled: true, axes: 'x', mode: 'zoom' },
      zoom: { enabled: true, axes: 'x', wheel: true },
      pan: { enabled: true, axes: 'x' },
      keyboard: true,
    },
    xAxis: { type: 'category' },
    yAxis: { name: '访问量' },
    series: [
      { id: 'pv', type: 'line', name: '访问量', data: [820, 932, 901, 1290] },
      { id: 'uv', type: 'area', name: '独立访客', data: [320, 402, 391, 520] },
    ],
  });
</script>
```

### 在打包工程里（ES Module）

```ts
import { createChart } from '@damoqiongqiu/ice-chart';

const chart = createChart('canvas-id', {
  title: { text: '近 30 天流量' },
  tooltip: { trigger: 'axis' },
  interaction: { hover: { enabled: true, dimOthers: true } },
  xAxis: { type: 'category' },
  yAxis: { name: '访问量' },
  series: [{ id: 'pv', type: 'line', name: '访问量', data: [820, 932, 901, 1290] }],
});

chart.on('item:click', (params) => {
  console.log(params.seriesName, params.xValue, params.value, params.data);
});
```

> 包同时提供 ESM / CJS / UMD 三种产物与完整类型声明（`dist/types`），Vite / webpack / Rollup 直接 import，Node 侧 `require('@damoqiongqiu/ice-chart')` 也能拿到 CJS。

## AI Agent 接入：JSON-first DSL ⭐

:::tip
和 ice-render 家族的其它成员一样，**ice-chart 也提供一层 JSON-first DSL（`ice-chart-dsl`）**——AI Agent 只需产出「一张表 + 通道绑定（`encoding`）」，就能编译成 `ChartOption`，**完全不需要手写一长串 `series[].data`**。
:::

最直观的对比：同一份月度销量数据，左边手写 `option` 要把每一行数据拍进 `series[].data`，右边 DSL 只声明「`x` 列绑到「月份」、`y` 列绑到「销量」、`series` 列绑到「渠道」」——**两者编译出的 `ChartOption` 逐像素一致**（仓库里的 `dsl-vs-option.html` 带几何自检，任意不一致都会红字报出）。

下面这份「月度销量」就是一份真实可编译、可自检的 DSL 文档（不是截图）：

```json title="ice-chart-dsl 文档（AI Agent 可直接产出）"
{
  "schemaVersion": 1,
  "kind": "line",
  "title": "月度销量（DSL 编译）",
  "data": [
    ["1月", 120, "线上"], ["1月", 80, "线下"],
    ["2月", 142, "线上"], ["2月", 92, "线下"],
    ["3月", 168, "线上"], ["3月", 78, "线下"],
    ["4月", 154, "线上"], ["4月", 110, "线下"]
  ],
  "encoding": { "x": "月份", "y": "销量", "series": "渠道" },
  "options": {
    "interaction": {
      "hover": { "enabled": true, "dimOthers": true },
      "zoom": { "enabled": true, "axes": "x", "wheel": true },
      "pan": { "enabled": true, "axes": "x" },
      "brush": { "enabled": true, "axes": "x", "mode": "zoom" },
      "keyboard": true
    }
  }
}
```

DSL 契约（根节点只含这几个字段）：

| 字段 | 说明 |
| --- | --- |
| `schemaVersion` | DSL 版本号（当前 `1`） |
| `kind` | 图表类型：`line` / `bar` / `pie` / `radar` / `scatter` / `sankey` / `graph` / `gauge` / `funnel` 等 |
| `data` | 二维数据表（行数组，每行为一条记录） |
| `encoding` | 通道绑定：`x` / `y` / `series` / `color` / `size` 等列名——把「哪列数据」映射到「哪个视觉通道」 |
| `options` | 透传给 `createChart` 的 `option`：标题、坐标轴、交互、主题等 |

编译与自检：

```js
import { validateChartDsl, compileChartDsl } from '@damoqiongqiu/ice-chart-dsl';

const diagnostics = validateChartDsl(dsl);     // Agent 产出可即时自检：缺列 / 未知 kind / encoding 错绑
if (diagnostics.length === 0) {
  const option = compileChartDsl(dsl);        // → ChartOption，交给 createChart
  ICEChart.createChart('canvas', option);
}
```

- 浏览器：依次加载 `ice-render`、`ice-chart`、`ice-chart-dsl`，全局 `ICEChartDSL.validateChartDsl(...)` / `ICEChartDSL.compileChartDsl(...)` 即可。
- Node：`import { compileChartDsl } from '@damoqiongqiu/ice-chart-dsl'`（安装即自动带 `@damoqiongqiu/ice-chart`）。

:::info
这套「用户意图 → AI Agent → JSON DSL → 引擎」的接入思路，和 [DSL 与 AI Agent 接入](/docs/guide/dsl) 里 ice-render 通用 DSL 是同一套哲学——**Agent 只产出数据，引擎负责渲染与交互**。ER 建模用 `ice-entity-designer-dsl`，通用图形用 `ice-render-dsl`，图表用 `ice-chart-dsl`，三者互不混用。
:::

下面这个 iframe 嵌入了仓库里的 `examples/dsl-vs-option.html`，左边手写 `option`、右边 DSL 编译，**两张图逐像素一致**（右下角自检面板会实时打印诊断）：

<iframe
  src="/ice-chart/dsl-vs-option.html"
  title="ice-chart · 手写 option vs DSL"
  loading="lazy"
  style={{ width: '100%', height: '760px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}
/>

## 相关链接

- GitHub：[ice-chart](https://github.com/ice-render/ice-chart)
- npm：[@damoqiongqiu/ice-chart](https://www.npmjs.com/package/@damoqiongqiu/ice-chart) · [@damoqiongqiu/ice-chart-dsl](https://www.npmjs.com/package/@damoqiongqiu/ice-chart-dsl)
- 通用 DSL 与 AI Agent 接入：[DSL 与 AI Agent 接入](/docs/guide/dsl)
- 引擎内核文档：[ICE Render 介绍](/docs/intro)
