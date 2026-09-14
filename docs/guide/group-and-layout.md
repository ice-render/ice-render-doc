---
sidebar_position: 5
---

# 分组与布局

`ICEGroup` 是容器组件，配合 **Swing 风格的布局管理器**（策略模式）可以像写 Java Swing 一样组织图元。

## ICEGroup

```js
const group = new ICE.ICEGroup({ left: 100, top: 100 });
group.addChild(new ICE.ICERect({ left: 0, top: 0, width: 120, height: 60 }));
ice.addChild(group);
```

- 可任意深度嵌套，子组件使用父级局部坐标
- 未显式设定布局的子 Group 会自动继承父 Group 的布局
- 设定布局后，**子组件的位置由布局接管**（自动 `transformable: false`）

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
| `ICEFlowLayout` | 流式：从左到右排，放不下换行 | `gap=10`、`align` |
| `ICEGridLayout` | 网格：按 `cols` 行优先填，行高取该行最高子项 | `cols=2`、`gapX=10`、`gapY=10` |
| `ICEBorderLayout` | 东西南北中五区（子项用 `state.layoutConstraint` 指定区域，默认 `center`） | `gap=5` |
| `ICEBoxLayout` | 单轴依次排（不换行） | `axis='x'\|'y'`、`gap=5` |
| `ICECardLayout` | **同一时刻只显示一个子项**，`show(i)` / `next()` / `previous()` 切换 | `currentIndex=0` |
| `ICEOverlayLayout` | 所有子项叠在容器左上角 | — |
| `ICELayeredLayout` | **图布局**：按节点与连线做拓扑分层 + 层内排序，面向流程图 / ER 图 | `gapX=80`、`gapY=40` |

各布局参数详见 `examples/layout/` 下的 13 个示例（border / box / card / dashboard / flow / grid / layered / overlay 等）。

## 布局反射（reflow）

触发时机（细节与实现在 [23 · 布局机制](../architecture/23-layout.md)）：

- `setLayout()`、`addChild()` / `removeChild()` —— **立即**重排；
- 子项改 `width` / `height` —— 标记 `requestLayout()`，在**下一帧**合并重排一次（一帧内多次改动只排一次）；
- `doLayout()` 会先对各子项 `measure()` 再布局，所以首次布局拿到的不是 0。

业务代码不需要手工摆位。参考示例 `examples/layout/layout-reflow.html`。

> **存盘注意**：进快照的是布局**结果**（子项的 `left/top`），**布局策略本身不进快照**。
> 从快照还原后要自己重新 `setLayout()`，否则容器不再自动排布。

## 自定义布局

继承 `ICELayoutManager` 并实现排版逻辑即可挂入 `setLayout`——策略模式保证了布局算法与容器解耦。
