---
sidebar_position: 2
---

# ICEComponent 参考

`ICEComponent` 是所有图元的基类（1400+ 行），定义了通用 props、交互开关与坐标/包围盒方法。

## 实例属性

| 属性 | 说明 |
|---|---|
| `ice` | 所属 ICE 实例 |
| `root` | 场景树根 |
| `ctx` | Canvas 2D 上下文 |
| `evtBus` | 事件总线 |
| `parentNode` | 父组件 |
| `props` / `state` | 声明式配置 / 运行时状态 |

## 通用 props

### 位置与尺寸

| prop | 默认值 | 说明 |
|---|---|---|
| `left` / `top` / `width` / `height` | `0` | 局部坐标位置与尺寸 |

### 样式（style）

| 字段 | 默认值 | 说明 |
|---|---|---|
| `fillStyle` | `'red'` | 填充色 |
| `strokeStyle` | `'blue'` | 描边色 |
| `lineWidth` | `1` | 线宽 |
| `fillGradient` / `strokeGradient` | — | 声明式可序列化渐变 |
| `shadow` | — | 阴影预设 `'sm' / 'md' / 'lg'` |
| `textAlign` / `textBaseline` / `fontSize` / `fontFamily` / `fontWeight` | — | 文本相关（文本类组件） |
| `paddingTop` ~ `paddingRight` | — | 内边距 |

顶层还有 `fill: true` / `stroke: true` 开关控制是否绘制填充/描边。

### 描边进阶

| prop | 说明 |
|---|---|
| `lineDash: []` | 虚线段 |
| `lineDashOffset` | 虚线偏移 |
| `lineDashFlow: false` | 蚂蚁线流动动画 |
| `lineDashFlowSpeed: 60` | 流速（px/s） |
| `lineBorder` / `lineBorderWidth` / `lineBorderColor` | 水管壁外描边 |

### 变换

| prop | 默认值 | 说明 |
|---|---|---|
| `transform.translate` | `[0, 0]` | 平移 |
| `transform.scale` | `[1, 1]` | 缩放 |
| `transform.skew` | `[0, 0]` | 斜切 |
| `transform.rotate` | `0` | 旋转（度） |
| `origin` | `'localCenter'` | 变换原点，配合 `originX/originY` 自定义 |
| `linearMatrix` / `composedMatrix` | — | 底层矩阵 |

### 显隐与交互

| prop | 默认值 | 说明 |
|---|---|---|
| `display` | `true` | `false` 时**整树隐藏** |
| `draggable` | `true` | 可拖拽 |
| `transformable` | `true` | 显示变换手柄（缩放/旋转） |
| `interactive` | `true` | 可交互 |
| `linkable` | `true` | 可作为连线端点 |
| `showMinBoundingBox` / `showMaxBoundingBox` | — | 调试：显示包围盒 |

### 其他

| prop | 说明 |
|---|---|
| `animations: {}` | 动画配置（详见[动画](../guide/animation.md)） |

## 主要方法

### 状态与渲染

| 方法 | 说明 |
|---|---|
| `setState(newState)` | 更新 state（自动标脏） |
| `render()` | 渲染自身 |
| `renderTo(targetCtx, baseMatrix?)` | 渲染到外部上下文 |
| `isEffectivelyVisible()` | 整链可见性（父链上 display 全为 true） |
| `measure()` / `refreshParams()` | 度量与参数刷新 |

### 坐标与变换

| 方法 | 说明 |
|---|---|
| `setPosition(left, top, evt?)` | 设定局部坐标 |
| `moveGlobalPosition(tx, ty)` | 按全局位移移动 |
| `setGlobalPosition(left, top)` | 按全局坐标放置 |
| `setGlobalRotate(angle)` | 按全局角度旋转 |
| `localToGlobal(x, y)` / `globalToLocal(x, y)` | 坐标换算 |
| `calcAbsoluteOrigin()` / `calcAbsoluteLinearMatrix()` | 绝对原点/矩阵计算 |
| `getRotateAngle()` | 累计旋转角 |
| `getLocalLeftTop()` | 局部左上角 |

### 包围盒与命中

| 方法 | 说明 |
|---|---|
| `getMinBoundingBox(refresh?)` | 自身几何包围盒 |
| `getMaxBoundingBox(refresh?)` | 仿射变换后的包围盒 |
| `containsPoint(x, y)` | 点是否在组件内 |

### 事件与销毁

| 方法 | 说明 |
|---|---|
| `on / off / once / trigger` | 事件订阅（详见[事件系统](../guide/events.md)） |
| `destroy()` | 销毁组件 |
