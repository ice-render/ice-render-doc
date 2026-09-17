---
sidebar_position: 5
description: "ICE Render 分组与布局：嵌套坐标系下的容器、自动布局与相对定位，组织复杂图形的层级与排布。"
keywords:
  - "分组"
  - "自动布局"
  - "嵌套坐标系"
  - "容器"
  - "相对定位"
---
# 分组与布局

`ICEGroup` 是容器组件，配合**布局管理器**（设计思想来自 Java Swing 的 `LayoutManager`，策略模式）
可以像写 Java Swing 一样组织图元：容器持有策略、策略只算位置。

## ICEGroup

```js
const group = new ICE.ICEGroup({ left: 100, top: 100 });
group.addChild(new ICE.ICERect({ left: 0, top: 0, width: 120, height: 60 }));
ice.addChild(group);
```

- 可任意深度嵌套，子组件使用父级局部坐标
- **布局不继承**（引擎 2.8 起，对齐 Swing 的 `Container.setLayout`）：父布局只负责给子容器**摆位置**，
  子容器要自动排布就**自己** `setLayout()`
- 设定布局后，**子组件的位置由布局接管**（默认把后代递归设为 `transformable: false`；
  要"边排边拖"用 `setLayout(manager, { disableTransform: false })`）

## 布局管理器

通过 `ICEGroup.setLayout(manager)` 设定：

```js
import { ICEGroup, ICEGridLayout } from 'ice-render';

const group = new ICEGroup({ left: 50, top: 50, width: 600, height: 400 });
// 参数就是构造入参本身：网格只认 cols / gapX / gapY（没有 rows，行数由子项数量决定）
group.setLayout(new ICEGridLayout({ cols: 3, gapX: 10, gapY: 10 }));

for (let i = 0; i < 9; i++) {
  group.addChild(new ICE.ICERect({ width: 100, height: 60, style: { fillStyle: '#4dd0e1' } }));
}
```

抽象基类是 `ICELayoutManager`，内置 **7 种具体布局**：

| 布局 | 说明 | 参数（默认值） |
|---|---|---|
| `ICEFlowLayout` | 流式：从左到右排，放不下换行（`fitContent` 时排成一行） | `gap=10`、`gapY=gap`、`align='left'`、`crossAlign='start'`、`pack='in-order'` |
| `ICEGridLayout` | 网格：按 `cols` 行优先填，**列宽全局对齐**；支持 `rows` 与 `gridSpan` 跨格 | `cols=2`、`gapX=10`、`gapY=10`、`cellSizing='content'\|'equal'` |
| `ICEBorderLayout` | 东西南北中五区（子项用 `state.layoutConstraint` 指定区域，默认 `center`） | `gap=5` |
| `ICEBoxLayout` | 单轴依次排（不换行）；`grow` 的项按权重瓜分剩余空间 | `axis='x'\|'y'`、`gap=5`、`align='start'\|'center'\|'end'\|'stretch'` |
| `ICECardLayout` | **同一时刻只显示一个子项**，`show(i)` / `next()` / `previous()` 切换 | `currentIndex=0` |
| `ICEOverlayLayout` | 所有子项叠在容器左上角 | — |
| `ICELayeredLayout` | **图布局**：按节点与连线做拓扑分层 + 层内排序，面向流程图 / ER 图 | `gapX=80`、`gapY=40`、`direction='horizontal'`、`crossAlign='start'` |

各布局参数详见 `examples/layout/` 下的 14 个示例（border / box / card / dashboard / flow / grid / layered / overlay 等）。

## 布局反射（reflow）

触发时机（细节与实现在 [23 · 布局机制](../architecture/23-layout.md)）：

- `setLayout()`、`addChild()` / `removeChild()` —— **立即**重排；
- 子项改 `width` / `height`、或 `setPreferredSize()` —— 标记 `requestLayout()` **并沿父链向上冒泡**，
  在**下一帧**合并重排一次（一帧内多次改动只排一次）；
- 子项 `display` 变化（显隐）—— 同样请求父容器重排（对齐 Swing `Component.setVisible()`）；
  `FlowLayout` / `BoxLayout` / `BorderLayout` / `OverlayLayout` 跳过不可见子项，`GridLayout` 不跳（对齐 Swing）；
- `doLayout()` 先做**测量趟**（问子项 `getPreferredSize()`），再**自顶向下校验**：
  谁失效就重排谁并递归其子树，没失效的子树整棵跳过（对齐 Swing `Container.validateTree()`）。

业务代码不需要手工摆位。参考示例 `examples/layout/layout-reflow.html`。

### 尺寸协商与可组合排版（引擎 2.7 起，2.8 对齐 Swing）

| 能力 | 写法 | 一句话 |
|---|---|---|
| 首选尺寸（尺寸协商） | 子项 `getPreferredSize()` / `setPreferredSize([w, h])` | 父布局**问子项**要多大位置：声明过就用声明值；容器有布局就报策略算出的**内容尺寸**；都没有则报自己的盒子。**构造期给的 `width/height` 是边界，不是首选尺寸** |
| 按内容自适应 | `new ICEGroup({ fitContent: true })` | 容器把自身尺寸调成内容尺寸。`fitContent` 只是这个可选行为，**不再是"嵌套容器有自然尺寸"的前提**（有布局的容器本来就会报内容首选尺寸） |
| 内外距 | 容器 `padding` / 子项 `margin` | `number` 四边等距，或 `{top,right,bottom,left}`；七个布局口径一致 |
| 布局 + 交互共存 | `group.setLayout(manager, { disableTransform: false })` | 默认布局接管后禁止拖拽；传 `false` 则布局照常摆位、用户仍可拖 |
| 剩余空间 | 箱式 `grow`、网格 `gridSpan` | 定宽侧栏 + 自适应内容区；表头通栏 / 侧栏跨行 |
| 手动定位的子项 | 子项 `state.layoutIgnore: true` | 布局跳过它（也不计入首选尺寸）—— CSS `position: absolute` 的对应物 |
| 最小尺寸 | 子项 `setMinimumSize({ width: 120 })` | 空间不足时只有声明了 `grow` 的子项参与收缩，且不越过下限；**没声明 = 不可压缩**（既有界面行为不变） |

> 2.11 起「交互锁」是**独立的一维策略**：`setLayout(manager, { lockInteraction: false })` 或
> `group.setInteractionLock(false)` 只排位置、不接管交互（解锁按原值还原）；`group.setLayout(null)`
> 撤销布局时坐标留在原地、交互锁还原。`disableTransform` 是旧名字，仍然可用。

```js
// 定宽侧栏（90）+ 两块按 1:2 瓜分剩余空间的内容区
const row = new ICEGroup({ width: 560, height: 90, padding: 10 });
row.addChild(new ICERect({ width: 90, height: 60 }));
row.addChild(new ICERect({ width: 60, height: 60, grow: 1 }));
row.addChild(new ICERect({ width: 60, height: 60, grow: 2 }));
row.setLayout(new ICEBoxLayout({ axis: 'x', gap: 10 }));
```

完整演示见 `examples/layout/layout-composition.html`。

> **存盘注意（引擎 2.8 起）**：布局**结果**（子项的 `left/top`）与**策略**都进快照 ——
> 策略写成 `layout: { type, props }`，读回时按注册的类型重建，所以「存盘再打开」版式不散，之后增删子项照样会重排。
> 自研布局要能被序列化，得先 `ice.registerType('your-ns:MyLayout', MyLayout)` 并实现 `toJSON()`；
> 类型没注册时读回会**跳过策略、保留坐标**并记入 `deserializer.unknownTypes`（不会炸整份数据）。

## 自定义布局

继承 `ICELayoutManager` 并实现排版逻辑即可挂入 `setLayout`——策略模式保证了布局算法与容器解耦。
