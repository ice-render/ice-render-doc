---
sidebar_position: 6
---

import IceCanvas from '@site/src/components/IceCanvas';

# 连线

ICERender 提供工程图级别的连接线能力：Visio 风格正交连线、贝塞尔曲线、折线、端点插槽吸附、箭头与蚂蚁线动画。下面每个能力都配有**实时示例**，可拖动验证。

## ICEVisioLink（Visio 风格连线）

```js
const link = new ICE.ICEVisioLink({
  startPoint: [100, 100],
  endPoint: [300, 200],
  linkShape: 'visio',       // 'visio' | 'bezier'
  arrowStyle: 'filled',     // 'filled' | 'hollow'
  arrow: 'end',             // 箭头端点选择（如 'both'）
  escapeDistance: 30,       // 端点疏散距离
});
ice.addChild(link);
```

| prop | 默认值 | 说明 |
|---|---|---|
| `startPoint` / `endPoint` | `[0,0]` / `[10,10]` | 端点坐标 |
| `linkShape` | `'visio'` | 连线形状：Visio 正交 / 贝塞尔 |
| `arrowStyle` | `'filled'` | 箭头填充 / 空心 |
| `arrow` | — | 箭头出现在哪些端点（如 `'both'`） |
| `escapeDistance` | `30` | 从端点出发的疏散段长度 |

## ICEBezier / ICEPolyLine

- `ICEBezier`：贝塞尔曲线，`curveType` 支持 `cubic` / `quadratic`
- `ICEPolyLine`：折线；`__localBox()` 会把连线标签矩形并入包围盒

`ICEPolyLine` 用同一个组件表达**直线、折线、曲线**——`curveType` 缺省为直线（两点折线退化为直线）；`curveType: 'quadratic' | 'cubic'` 时，`points` 的前 3 / 4 个点被解释为「起点 + 控制点 + 终点」。

### 折线 / 直线（ICEPolyLine）

`ICEPolyLine` 是一切折线/直线的表达。两点折线即一条直线：

<IceCanvas
  height={240}
  setup={(ICE, ice) => {
    const { ICEPolyLine } = ICE;
    ice.addChild(new ICEPolyLine({ points: [[40, 40], [700, 200]], stroke: true,
      style: { strokeStyle: '#1f4fb0', lineWidth: 3 } }));
  }}
/>

```jsx title="两点成线" {1-6}
const { ICEPolyLine } = ICE;
ice.addChild(new ICEPolyLine({ points: [[40, 40], [700, 200]], stroke: true,
  style: { strokeStyle: '#1f4fb0', lineWidth: 3 } }));
```

### 带箭头的直角坐标系

直接用 `arrow: 'end'`（或 `'start'` / `'both'`）即可，箭头长度与角度由 `arrowLength` / `arrowAngel`（弧度）控制：

<IceCanvas
  height={280}
  setup={(ICE, ice) => {
    const { ICEPolyLine } = ICE;
    const ox = 80, oy = 230, L = 580;
    ice.addChild(new ICEPolyLine({ points: [[ox, oy], [ox + L, oy]], arrow: 'end',
      stroke: true, style: { strokeStyle: '#64748b', lineWidth: 2 } }));
    ice.addChild(new ICEPolyLine({ points: [[ox, oy], [ox, oy - L]], arrow: 'end',
      stroke: true, style: { strokeStyle: '#64748b', lineWidth: 2 } }));
  }}
/>

```jsx title="坐标轴箭头（arrow: 'none' | 'start' | 'end' | 'both'）" {2-5}
ice.addChild(new ICEPolyLine({ points: [[ox, oy], [ox + L, oy]], arrow: 'end',
  stroke: true, style: { strokeStyle: '#64748b', lineWidth: 2 } }));
```

### 在坐标系里画 y = kx + b

把数学坐标（y 向上为正）映射到画布坐标（y 向下为正）：`screenY = oy - (k*x + b)`，按步长采样直线上的屏幕点：

<IceCanvas
  height={300}
  setup={(ICE, ice) => {
    const { ICEPolyLine } = ICE;
    const ox = 80, oy = 250, L = 580;
    ice.addChild(new ICEPolyLine({ points: [[ox, oy], [ox + L, oy]], arrow: 'end',
      stroke: true, style: { strokeStyle: '#64748b', lineWidth: 2 } }));
    ice.addChild(new ICEPolyLine({ points: [[ox, oy], [ox, oy - L]], arrow: 'end',
      stroke: true, style: { strokeStyle: '#64748b', lineWidth: 2 } }));
    const drawLine = (k, b, minX, maxX, color) => {
      const pts = [];
      for (let x = minX; x <= maxX; x += 1) pts.push([ox + x, oy - (k * x + b)]);
      ice.addChild(new ICEPolyLine({ points: pts, stroke: true, style: { strokeStyle: color, lineWidth: 2 } }));
    };
    drawLine(1, 0, -60, 60, '#ff3300');
    drawLine(2, 0, -40, 40, '#16a34a');
    drawLine(-1, 0, -60, 60, '#2563eb');
  }}
/>

```jsx title="y = kx + b（screenY = oy - (k*x + b)）" {2-6}
const drawLine = (k, b, minX, maxX, color) => {
  const pts = [];
  for (let x = minX; x <= maxX; x += 1) pts.push([ox + x, oy - (k * x + b)]);
  ice.addChild(new ICEPolyLine({ points: pts, stroke: true, style: { strokeStyle: color, lineWidth: 2 } }));
};
```

> 画布 y 轴向下为正、数学 y 轴向上为正，所以样本点屏幕纵坐标要取 `oy - (k*x + b)`。`ICEPolyLine` 的 `left/top` 永远等于 `points[0]`，你只需关心点集本身。

## 曲线（贝塞尔 / 圆弧）

### 三次贝塞尔

`bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x,y)` → `points: [起点, 控制点1, 控制点2, 终点]`，`curveType:'cubic'`：

<IceCanvas
  height={260}
  setup={(ICE, ice) => {
    const { ICEPolyLine } = ICE;
    ice.addChild(new ICEPolyLine({ points: [[60, 220], [200, 40], [340, 40], [480, 220]],
      curveType: 'cubic', stroke: true, lineWidth: 3, style: { strokeStyle: '#4f8cff' } }));
  }}
/>

```jsx title="三次贝塞尔（起/控1/控2/终）" {1-6}
ice.addChild(new ICEPolyLine({ points: [[60, 220], [200, 40], [340, 40], [480, 220]],
  curveType: 'cubic', stroke: true, lineWidth: 3, style: { strokeStyle: '#4f8cff' } }));
```

### 二次贝塞尔

`quadraticCurveTo(cpx,cpy,x,y)` → `points: [起点, 控制点, 终点]`，`curveType:'quadratic'`：

<IceCanvas
  height={260}
  setup={(ICE, ice) => {
    const { ICEPolyLine } = ICE;
    ice.addChild(new ICEPolyLine({ points: [[60, 220], [270, 40], [480, 220]],
      curveType: 'quadratic', stroke: true, lineWidth: 3, style: { strokeStyle: '#ff7a59' } }));
  }}
/>

```jsx title="二次贝塞尔（起/控/终）" {1-5}
ice.addChild(new ICEPolyLine({ points: [[60, 220], [270, 40], [480, 220]],
  curveType: 'quadratic', stroke: true, lineWidth: 3, style: { strokeStyle: '#ff7a59' } }));
```

### 部分圆弧

`context.arc` 画一段不闭合圆弧，可沿圆弧采样点集、用 `ICEPolyLine` 连成开放曲线（效果一致；引擎也提供 `ICEEllipse` 的 `startAngle` / `endAngle` 直接画弧，但会自带闭合的两条半径，这里用采样更贴近「部分圆弧」的意图）：

<IceCanvas
  height={260}
  setup={(ICE, ice) => {
    const { ICEPolyLine } = ICE;
    const arcPoints = (cx, cy, r, a0, a1, steps) => {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const a = a0 + (a1 - a0) * (i / steps);
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return pts;
    };
    ice.addChild(new ICEPolyLine({ points: arcPoints(260, 140, 100, 0, Math.PI / 4, 48),
      stroke: true, lineWidth: 3, style: { strokeStyle: '#22c55e' } }));
  }}
/>

```jsx title="采样圆弧" {2-8}
const arcPoints = (cx, cy, r, a0, a1, steps) => {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
};
ice.addChild(new ICEPolyLine({ points: arcPoints(260, 140, 100, 0, Math.PI / 4, 48),
  stroke: true, lineWidth: 3, style: { strokeStyle: '#22c55e' } }));
```

> ice-render 是**保留模式**引擎，不暴露原始 `Path2D` 字符串——所有路径都用图元组件（或其 `dots` / `points`）表达，好处是自动获得命中检测、拖动、序列化与局部重绘。

## 插槽吸附（LinkSlot / LinkHook）

`ICELinkSlot` 提供上/右/下/左/中心五个方向的吸附端点，`ICELinkHook` 是组件上的挂钩。把连线两端挂到 Hook 上后，拖动实体时连线自动跟随：

```js
const slot = new ICE.ICELinkSlot({ /* 五向吸附 */ });
```

由 `ice.linkSlotManager` 统一管理插槽的复用与碰撞检测。完整示例见 `examples/line-and-link/`（basic / curve / visio / link-label / link-set-links / marching-ants）。

## 连线标签

连线可以携带 label 文本，标签矩形会计入连线包围盒（拖拽命中、脏区计算都正确）。

## 蚂蚁线（marching ants）

所有连线（以及普通图元）支持虚线流动动画：

```js
new ICE.ICEVisioLink({
  lineDash: [6, 4],
  lineDashFlow: true,        // 开启流动
  lineDashFlowSpeed: 60,     // 速度（px/s）
});
```

## 水管壁效果

`lineBorder / lineBorderWidth / lineBorderColor` 可以为连线加一层外描边，形成「水管壁」效果：

```js
new ICE.ICEPolyLine({
  lineBorder: true,
  lineBorderWidth: 8,
  lineBorderColor: '#b0bec5',
});
```

## 扩展自定义连线

继承 `ICEVisioLink` 并实现 `toEntityObject()` 即可得到可序列化的业务连线（如 ER 关系线），完整示例见引擎 README「二次开发」一节。
