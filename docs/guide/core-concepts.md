---
sidebar_position: 1
---

# 核心概念

ICERender 的编程模型可以概括为：**React 式的组件/props/state + W3C 式的事件模型 + 场景树**。

## 组件（ICEComponent）

一切可见之物都是组件。`ICEComponent` 是所有图元的基类，`ICERect`、`ICEText`、`ICEGroup`、`ICEVisioLink` 等都继承自它。每个组件持有：

- `props`：描述「组件长什么样」的声明式配置（位置、尺寸、样式、交互开关……）
- `state`：组件内部的运行时状态
- `parentNode`：父组件引用，构成场景树

### props 与 state 的关系

`props` 是你传入的配置，`state` 由引擎维护。修改组件外观的正确方式是 `setState`：

```js
rect.setState({ style: { fillStyle: '#ff5252' } });
```

:::tip 原型继承的默认值
引擎通过原型继承共享默认 props/state——默认配置**不复制**。这正是 100 万图元只占约 0.87GB 堆内存的原因。你传入的字段会以「实例自有属性」的形式覆盖原型上的默认值。
:::

## 场景树

一个 `ICE` 实例管理一棵场景树：

```js
ice.addChild(component);        // 添加子组件（默认自动标记脏区）
ice.addChildren([a, b, c]);     // 批量添加
ice.removeChild(component);     // 移除
ice.clearAll();                 // 清空整棵树
ice.findComponent('rect-1');    // 按 id 递归查找
```

`ICEGroup` 可以嵌套任意深度，子组件坐标相对于父容器（详见[坐标系](coordinate-system.md)）。

## 帧循环与渲染

引擎的渲染是**按需的**：

1. `FrameManager`（全局单例）把 `requestAnimationFrame` 统一转成 `ICE_FRAME_EVENT`
2. `CanvasRenderer` 做脏检查；有脏区时执行渲染
3. 默认走**脏矩形局部重绘**，只重绘脏区覆盖的部分；条件不满足时自动回退全量重绘

修改组件后调用 `setState` / `addChild` 等方法会自动标记脏区，你通常不需要手动管理重绘。确有需要时也可操作 `ice.dirty`。

## 事件模型

组件与全局事件总线（`ice.evtBus`）共用 `ICEEventTarget` API：`on / off / once / trigger`，并支持 `addEventListener` 等 W3C 别名。详见[事件系统](events.md)。

## 工具层与交互开关

每个组件默认带有交互能力开关（默认全部为 `true`）：

| prop | 说明 |
|---|---|
| `draggable` | 是否可拖拽 |
| `transformable` | 是否显示变换手柄（缩放/旋转） |
| `interactive` | 是否可交互 |
| `linkable` | 是否可作为连线端点 |

引擎还提供工具层：`ice.addTool(tool) / removeTool(tool)` 用于添加不参与序列化的辅助 UI。

## 扩展点概览

| 能力 | 入口 | 文档 |
|---|---|---|
| 主题与样式 | `ice.setTheme / registerTheme`，`preset` 预设 | [主题与样式](theme-and-style.md) |
| 动画 | `props.animations` + `ice.animationManager` | [动画](animation.md) |
| 布局 | `ICEGroup.setLayout(manager)` | [分组与布局](group-and-layout.md) |
| 连线 | `ICEVisioLink`、`ICELinkSlot` | [连线](line-and-link.md) |
| 序列化 | `ice.toJSONString / fromJSONString` | [序列化](serialization.md) |
| 插件 | `ice.use(plugin)` | [插件](plugin.md) |
| 无障碍 | `ice.getAccessibilityTree()` | [无障碍](accessibility.md) |
