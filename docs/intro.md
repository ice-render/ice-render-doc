---
sidebar_position: 0
sidebar_label: 1.1 介绍
---

# ICE Render · 雪花渲染器（当前 v2.10.0）

**ICERender** 是一个用纯 TypeScript 编写的 Canvas 2D 交互图形渲染引擎，面向 ER 图、流程图、拓扑图等图编辑场景。它借鉴了 React 的组件模型与 W3C 的事件模型，提供嵌套坐标系、序列化、动画与 Visio 风格连接线，运行时零依赖（gl-matrix 在构建期内联）。

:::tip 本文档站分两层
- **引擎层（ice-render）** —— 本站核心，左侧「ice-render 引擎」分组：介绍 / 快速上手 / 指南 / 架构设计 / API 参考 / 二次开发。讲「渲染引擎本身怎么用、怎么实现」。
- **应用层（家族产品）** —— 基于引擎内核封装的上层产品，左侧「家族产品 · 应用层」分组：Entity Designer（ER 建模）、ice-chart（图表）、ice-web-components（Canvas UI 组件库），以及它们各自的 DSL。
- 一句话：**引擎提供坐标系 / 事件 / 渲染 / 序列化等底座；产品在其上收敛出领域能力。** 想搞懂底层，看「ice-render 引擎」；想直接拿来用，看「家族产品」。
:::

## 为什么选择 ICERender

### 极端规模下的内存与构建效率

通过原型继承共享默认 props/state（默认配置不复制）、WeakSet 让挂载 O(1)：

- 实测 100 万个最小矩形的堆增量约 **0.87GB**（朴素实现约 2.0GB）
- 构建约 6 秒

### 局部重绘是「可证明的像素契约」

- 默认脏矩形局部重绘；不满足条件时自动回退全量重绘（`ICE.init(ctx, { renderMode: 'full' })` 可强制全量）
- golden image 像素一致性回归保障两种渲染路径逐像素一致
- 组件级离屏缓存、渲染队列缓存、矩阵零分配
- 2026-09-11 实测约 2.2ms/帧（5000 图元场景）

### 小程序是一等公民

- `cross-platform/root` 适配层收敛全局对象
- 无 `Path2D` 的运行时自动降级（`PolyfillPath2D`），渲染结果逐像素一致
- 字体 / 图片 / 离屏画布 / dpr 全适配
- `ICE.init(ctx)` 可直接传入上下文，绕开 DOM

## 核心特性一览

- **架构与组件模型**：声明式可序列化渐变、`display: false` 整树隐藏、Shift 修饰键约束变换手柄
- **坐标系与变换**：完整仿射变换、任意嵌套坐标系、HiDPI 支持
- **交互与连接线**：统一 Pointer 输入层、变换控制面板、`linkShape: 'visio' | 'bezier'` 连线、箭头样式、视口缩放平移
- **扩展与无障碍**：插件三层注册点（组件 / 渲染钩子 / 工具）、无障碍原语（`getAccessibilityTree`）
- **序列化与动画**：稳定 typeId（`namespace:Type`，如 `ice-render:Rect`，重复注册明确抛错）、keyframes 关键帧动画、弹簧缓动（spring 三档）
- **子树不透明度**：`state.opacity ∈ [0,1]` 作用于组件自身及所有后代，淡入淡出 Modal / Drawer / Message 整棵子树生效（`opacity≠1` 自动走非不透明落墨，不进离屏缓存）
- **生命周期**：`ICE.destroy()` 与幂等 `init()`（可直接传 `HTMLCanvasElement` / `CanvasRenderingContext2D`），适配 React StrictMode 双挂载与 SPA 卸载重挂，销毁后可重新 init
- **工程化**：134 个测试套件、1100+ 个用例、Playwright 视觉回归（100 条）、publint + attw 发布门禁

## 2.3.0 新特性速览（动画全链 + 连线端点手柄 + 性能）

2.3.0 把「动画」从「能动」推进到「可控 + 可验证」，并修掉了两个真实性能 / 连接缺陷。要点（全部带回归与真实浏览器 e2e）：

- **动画写值通道（位图复用）**：`setState(patch, { paramsDirty: false })` + `ANIMATION_SAFE_KEYS` 白名单，纯绘制 / 变换键不再每帧重建离屏位图——1,000 个文本平移动画 **35.1ms → 2.7ms/帧**、复用率 100%。
- **分层渲染原语**：`ICE.linkViewport()` / `ice.followViewport()` 双层视口同步、`ice.setInputPassthrough(true)` 覆盖层穿透、`DOMEventDispatcher` 按目标 canvas 过滤多实例事件；10,000 静态 + 200 动画实测 **≈60×**（26~34ms → 0.4~0.6ms/帧）。另含跨实例迁移 `ice.moveComponentTo()` 与多层 SVG / PNG 合成导出。
- **帧调度与空闲停帧**：`FrameManager` 按需续帧，静止页面 500ms 内 **0 次帧回调**；动画新增 `fps` 降频、`prefers-reduced-motion` 直接落终态。
- **动画表达力**：`easing` 可直接传函数或 `registerEasing(name, fn)`；颜色 / 带单位数字串（如 `'12px'`）插值；`onStart/onUpdate/onRepeat/onComplete` 回调；`direction: 'alternate'`（yoyo）。
- **编排（时间轴 / 错峰）**：`ice.animationManager.timeline()` 的 `add/stagger/play/pause/restart`，以及运行时 `setAnimation(key, cfg)` / `removeAnimation(key)` / `replay()`。
- **结构化校验（Agent 闭环）**：`validateAnimations()` 纯函数产出 `{ severity, code, message, path }[]`（`ICE_ANIM_*`），运行期 `getDiagnostics()` 同源去重，Agent 不必再靠 console 文本判断配置被跳过。
- **连线端点手柄（应用层连接体验）**：线条组件新增 `linkEditable`（默认 `true`）单独控制端点手柄，与 `transformable`（旋转 / 缩放手柄）解耦；连接插槽改为「就近吸附」；抬起事件回到按下组件修复「拖得动、放不下」。
- **`coalesceRegions` 聚合预算**：脏块超 `MAX_COALESCE_REGIONS = 32` 直接塌缩并集盒，1000 块脏区从 **111s → 1ms**（修掉 O(k³) 退化）。

> ⚠️ **应用层迁移（破坏性行为变更）**：若你自己 `evtBus.on('ICE_FRAME_EVENT', …)` 做**逐帧计算**（时钟、令牌仿真、自绘指示器、自定义补间…），必须调 `ice.setContinuousFrames(true)`，否则引擎的空闲停帧会让逐帧逻辑停摆（"挂了监听"不再等于"帧还会来"）。用完记得 `setContinuousFrames(false)` 归还。

深入实现见 [18 · 动画机制](architecture/18-animation-architecture.mdx)、[16 · 连线端口评估](architecture/16-link-port-evaluation.md)、[04 · 渲染性能](architecture/04-rendering-performance.mdx)，完整清单见引擎仓库 `CHANGELOG.md`。

## 两层架构与生态

ice-render 是**引擎底座**；下表其余项目都是**基于它封装的应用层**产品（含各自的 DSL）。「层级」一列标明每一项属于哪一层。

| 层级 | 项目 | 说明 |
|---|---|---|
| 引擎 | [ice-render](https://www.npmjs.com/package/ice-render) | 核心引擎（本站文档，当前 **v2.10.0**） |
| 引擎（DSL） | [ice-render-dsl](https://www.npmjs.com/package/ice-render-dsl) | **引擎级** JSON-first DSL 层，让 AI Agent 无需学习命令式 API 即可驱动引擎 |
| 应用 | [ice-chart](https://www.npmjs.com/package/@damoqiongqiu/ice-chart) | 基于引擎的交互式图表库（折线 / 饼 / 雷达 / K 线 / 桑基 / 关系图等），命中测试与交互全部由引擎承担 |
| 应用（DSL） | [ice-chart-dsl](https://www.npmjs.com/package/@damoqiongqiu/ice-chart-dsl) | 图表 DSL：一张表 + `encoding` 编译成 `ChartOption`，带结构化诊断 |
| 应用 | [ice-entity-designer](https://www.npmjs.com/package/ice-entity-designer) | 基于引擎的可视化建模工具集（当前 **v0.3.1**）：9 个域包（ER / 流程图 / BPMN / UML / 状态机 / 甘特 / 电力一次 / 电力二次 / 给水排水），随包附带 ice-render 内核 |
| 应用（DSL） | [ice-entity-designer-dsl](https://www.npmjs.com/package/ice-entity-designer-dsl) | 领域 DSL：七种 `kind` 的 JSON 文档，供 Agent 生成并渲染为可继续编辑的设计器实例 |
| 应用 | [ice-web-components](https://www.npmjs.com/package/ice-web-components) | 仿 Swing 风格的 Canvas 原生 UI 组件库（86 个组件，Bootstrap 5 令牌主题）；**暂无配套 DSL，走命令式组件 API** |

## AI Agent 接入：JSON-first DSL ⭐

> **不想写命令式图形代码？用 DSL。**
> ice-render 家族在引擎之上提供一层 **JSON-first DSL**——AI Agent（或任何代码生成器）只需产出一份结构化 JSON（`nodes` / `edges` / `options`，或 ER 场景的 `entities` / `relations`），引擎就能直接渲染，**完全不需要触碰 `ICE.ICERect` / `ICEPolyLine` 这类构造函数**。

这意味着接入 AI Agent 的成本极低：

- Agent 产出**数据（JSON）**，而不是拼接一长串引擎调用；同一份文档浏览器 / Node 通用
- 自带 `validateDsl()` schema 校验（重复 id、未知节点类型、悬空边），Agent 产出可即时自检
- **三层 DSL 各司其职**：**`ice-render-dsl`**（引擎级，通用流程图 / 拓扑图 / 依赖图）+ **`ice-entity-designer-dsl`**（应用层，ER / 数据库建模，可归一化为 TypeORM `EntitySchema`）+ **`ice-chart-dsl`**（应用层，图表：一张表 + `encoding` → `ChartOption`）。引擎级 DSL 直接驱动底层引擎；应用层 DSL 在引擎之上叠加领域语义，二者互不混用。

下面这条链路就是一份真实可渲染的 DSL 文档：

```json
{ "schemaVersion": 1,
  "nodes": [
    { "id": "a", "type": "rect", "left": 80, "top": 160, "width": 180, "height": 90,
      "style": { "fillStyle": "#dbeafe", "strokeStyle": "#2563eb", "lineWidth": 2 } },
    { "id": "b", "type": "star", "left": 520, "top": 150, "outerRadius": 70, "innerRadius": 30, "spikes": 6,
      "style": { "fillStyle": "#fde68a", "strokeStyle": "#d97706", "lineWidth": 2 } }
  ],
  "edges": [ { "id": "flow", "source": "a", "target": "b", "type": "visio",
               "sourcePort": "R", "targetPort": "L", "arrow": "end", "label": "render" } ],
  "options": { "fitViewport": true, "fitViewportPadding": 48 } }
```

渲染只需一行：`ICEDSL.renderDsl('canvas', dsl)`（浏览器）或 `import { renderDsl }`（Node）。

👉 完整说明、live 示例与 Agent 接入建议见 [DSL 与 AI Agent 接入](/docs/guide/dsl)。

## 下一步

- [安装](getting-started/installation.md)
- [你的第一个场景](getting-started/your-first-scene.md)
- [API 参考](api/ice.md)
- [架构设计](architecture/01-runtime.md)
