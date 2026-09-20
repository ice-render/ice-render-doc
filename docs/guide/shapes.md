---
sidebar_position: 3
description: "ICE Render 图元与图形：内置形状、自定义绘制与命中检测，如何用声明式 API 构建可交互的图元节点。"
keywords:
  - "图元"
  - "图形绘制"
  - "命中检测"
  - "自定义形状"
  - "Canvas 节点"
---
import IceCanvas from '@site/src/components/IceCanvas';

# 图元手册

所有图元共享 [ICEComponent 通用 props](../api/ice-component.md)，下表只列各图元的专有 props。下面每个图元都配有**实时示例**——画布由 ice-render 内核在浏览器里直接渲染，可拖动试一试。

## 一览

| 图元 | 说明 |
|---|---|
| `ICERect` | 矩形 |
| `ICECircle` | 圆 |
| `ICEEllipse` | 椭圆 |
| `ICEStar` | 星形 |
| `ICEIsogon` | 等多边形 |
| `ICERose` | 玫瑰线（极坐标曲线） |
| `ICEText` | 文本（详见[文本](text.md)） |
| `ICEImage` | 图片 |
| `ICEPath` / `ICEDotPath` | 参数化路径 / 点序列路径 |
| `ICEGroup` | 容器（详见[分组与布局](group-and-layout.md)） |
| `ICEVisioLink` / `ICEBezier` / `ICEPolyLine` | 连线（详见[连线](line-and-link.md)） |

## ICERect

```js
new ICE.ICERect({ left: 0, top: 0, width: 160, height: 90, radius: 8 });
```

| prop | 默认值 | 说明 |
|---|---|---|
| `left/top/width/height` | `0` | 位置与尺寸 |
| `radius` | — | 圆角半径（自动钳制到 `min(w/2, h/2)`，给多大都不会溢出） |

<IceCanvas
  height={220}
  setup={(ICE, ice) => {
    const { ICERect } = ICE;
    ice.addChild(new ICERect({
      left: 280, top: 30, width: 200, height: 200, radius: 100,
      fill: false, stroke: true, style: { strokeStyle: '#ff0000', lineWidth: 3 },
    }));
  }}
/>

```jsx title="圆角矩形（radius 钳制到 min(w/2,h/2)，圆化到一半即两端变半圆）" {2-7}
ice.addChild(new ICERect({
  left: 280, top: 30, width: 200, height: 200, radius: 100,
  fill: false, stroke: true, style: { strokeStyle: '#ff0000', lineWidth: 3 },
}));
```

## ICECircle / ICEEllipse

```js
new ICE.ICECircle({ left: 100, top: 100, radius: 50 });
new ICE.ICEEllipse({ left: 100, top: 100, radiusX: 80, radiusY: 50 });
```

- `ICECircle`：`radius`（默认 10），也可由 width/height 推导，内部派生 `radiusX/radiusY`
- `ICEEllipse`：`radiusX` / `radiusY`

<IceCanvas
  height={240}
  setup={(ICE, ice) => {
    const { ICERect, ICECircle, ICEEllipse } = ICE;
    ice.addChild(new ICEEllipse({ left: 40, top: 40, width: 200, height: 110, fill: true, stroke: true,
      style: { fillStyle: '#4f8cff', strokeStyle: '#1f4fb0', lineWidth: 2 } }));
    ice.addChild(new ICERect({ left: 280, top: 40, width: 160, height: 110, fill: true, stroke: true,
      style: { fillStyle: '#ff7a59', strokeStyle: '#c2410c', lineWidth: 2 } }));
    ice.addChild(new ICECircle({ left: 500, top: 40, radius: 55, fill: true, stroke: true,
      style: { fillStyle: '#22c55e', strokeStyle: '#15803d', lineWidth: 2 } }));
  }}
/>

```jsx title="椭圆 / 矩形 / 圆" {1-9}
const { ICERect, ICECircle, ICEEllipse } = ICE;
ice.addChild(new ICEEllipse({ left: 40, top: 40, width: 200, height: 110, fill: true, stroke: true,
  style: { fillStyle: '#4f8cff', strokeStyle: '#1f4fb0', lineWidth: 2 } }));
ice.addChild(new ICECircle({ left: 500, top: 40, radius: 55, fill: true, stroke: true,
  style: { fillStyle: '#22c55e', strokeStyle: '#15803d', lineWidth: 2 } }));
```

## ICEIsogon（等多边形）

```js
new ICE.ICEIsogon({ left: 100, top: 100, radius: 50, edges: 6 }); // 六边形
```

| prop | 默认值 | 说明 |
|---|---|---|
| `radius` | `10` | 外接圆半径，与 width/height 联动重算 |
| `edges` | `3` | 边数（≥3） |

<IceCanvas
  height={200}
  setup={(ICE, ice) => {
    const { ICEIsogon } = ICE;
    [3, 5, 7, 9].forEach((e, i) => {
      ice.addChild(new ICEIsogon({ left: 50 + i * 175, top: 40, radius: 65, edges: e, startAngle: 90,
        fill: true, stroke: true,
        style: { fillStyle: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][i], strokeStyle: '#111', lineWidth: 2 } }));
    });
  }}
/>

```jsx title="正 N 边形（edges = 3 / 5 / 7 / 9）" {2-7}
[3, 5, 7, 9].forEach((e, i) => {
  ice.addChild(new ICEIsogon({ left: 50 + i * 175, top: 40, radius: 65, edges: e, startAngle: 90,
    fill: true, stroke: true,
    style: { fillStyle: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][i], strokeStyle: '#111', lineWidth: 2 } }));
});
```

## ICEStar

```js
new ICE.ICEStar({ left: 100, top: 100, radius: 50, spikes: 5 });
```

| prop | 默认值 | 说明 |
|---|---|---|
| `radius` | `10` | 半径，与 width/height 联动 |
| `spikes` | `5` | 角数 |

<IceCanvas
  height={200}
  setup={(ICE, ice) => {
    const { ICEStar, ICEIsogon } = ICE;
    ice.addChild(new ICEStar({ left: 60, top: 30, outerRadius: 70, innerRadius: 30, spikes: 5,
      fill: true, stroke: true, style: { fillStyle: '#f59e0b', strokeStyle: '#b45309', lineWidth: 2 } }));
    ice.addChild(new ICEIsogon({ left: 280, top: 30, radius: 70, edges: 6, startAngle: 90,
      fill: true, stroke: true, style: { fillStyle: '#a855f7', strokeStyle: '#7e22ce', lineWidth: 2 } }));
    ice.addChild(new ICEIsogon({ left: 500, top: 30, radius: 70, edges: 3, startAngle: 90,
      fill: true, stroke: true, style: { fillStyle: '#06b6d4', strokeStyle: '#0e7490', lineWidth: 2 } }));
  }}
/>

```jsx title="星形（spikes=5）与正 N 边形" {1-6}
const { ICEStar, ICEIsogon } = ICE;
ice.addChild(new ICEStar({ left: 60, top: 30, outerRadius: 70, innerRadius: 30, spikes: 5,
  fill: true, stroke: true, style: { fillStyle: '#f59e0b', strokeStyle: '#b45309', lineWidth: 2 } }));
ice.addChild(new ICEIsogon({ left: 280, top: 30, radius: 70, edges: 6, startAngle: 90,
  fill: true, stroke: true, style: { fillStyle: '#a855f7', strokeStyle: '#7e22ce', lineWidth: 2 } }));
```

## ICERose（玫瑰线）

极坐标玫瑰线图元，`leafNum` 即方程 `r = cos(kθ)` 里的 `k`：`k` 偶数出 2k 瓣、奇数出 k 瓣，`pointNumber` 控制采样密度。

```js
new ICE.ICERose({ left: 100, top: 100, radius: 90, leafNum: 4, pointNumber: 200 });
```

| prop | 默认值 | 说明 |
|---|---|---|
| `radius` | `10` | 外接圆半径 |
| `leafNum` | — | 瓣数 `k` |
| `pointNumber` | — | 采样点密度 |

<IceCanvas
  height={260}
  setup={(ICE, ice) => {
    const { ICERose } = ICE;
    ice.addChild(new ICERose({ left: 110, top: 40, radius: 90, leafNum: 4, pointNumber: 200,
      stroke: true, fill: false, style: { strokeStyle: '#2563eb', lineWidth: 2 } }));
    ice.addChild(new ICERose({ left: 410, top: 40, radius: 90, leafNum: 5, pointNumber: 200,
      stroke: true, fill: false, style: { strokeStyle: '#7c3aed', lineWidth: 2 } }));
  }}
/>

```jsx title="玫瑰线（leafNum = 4 / 5）" {1-6}
const { ICERose } = ICE;
ice.addChild(new ICERose({ left: 110, top: 40, radius: 90, leafNum: 4, pointNumber: 200,
  stroke: true, fill: false, style: { strokeStyle: '#2563eb', lineWidth: 2 } }));
```

## 极坐标曲线（采样点集）

极坐标曲线本质是「按公式算出一系列点」。除了专用图元（`ICERose` / `ICEIsogon`），也常用手算点集喂给 `ICEPolyLine` / `ICEDotPath`。下面用阿基米德螺旋 `r = a + b·θ` 演示采样画法：

<IceCanvas
  height={300}
  setup={(ICE, ice) => {
    const { ICEPolyLine } = ICE;
    const spiral = (origin, angularSpeed, linearSpeed, maxTime, color) => {
      const pts = [];
      for (let t = 0; t < maxTime; t++) {
        const a = t * angularSpeed;
        pts.push([origin[0] + t * linearSpeed * Math.cos(a), origin[1] + t * linearSpeed * Math.sin(a)]);
      }
      ice.addChild(new ICEPolyLine({ points: pts, stroke: true, style: { strokeStyle: color, lineWidth: 1 } }));
    };
    spiral([180, 150], Math.PI / 30, 1, 200, '#ef4444');
    spiral([540, 150], Math.PI / 40, 2, 300, '#16a34a');
  }}
/>

```jsx title="阿基米德螺旋（采样点集喂给 ICPolyLine）" {2-7}
const spiral = (origin, angularSpeed, linearSpeed, maxTime, color) => {
  const pts = [];
  for (let t = 0; t < maxTime; t++) {
    const a = t * angularSpeed;
    pts.push([origin[0] + t * linearSpeed * Math.cos(a), origin[1] + t * linearSpeed * Math.sin(a)]);
  }
  ice.addChild(new ICEPolyLine({ points: pts, stroke: true, style: { strokeStyle: color, lineWidth: 1 } }));
};
```

## ICEImage

```js
const img = new ICE.ICEImage({ left: 100, top: 100, width: 200, height: 150, src: './logo.png' });
ice.addChild(img);
```

支持 sprite 精灵图与 clip 裁剪（见 `examples/image/`）。图片经由引擎统一的 `ice.imageCache` 管理加载。

## ICEPath / ICEDotPath

- `ICEPath`：参数化路径图元（含 `ICEBezier` 的 cubic/quadratic 曲线）
- `ICEDotPath`：点序列路径

:::info
路径对象一律走 `Path2DRecorder`（转发原生 `Path2D` + 记录命令流）：命令流用于 SVG 导出与形状断言，业务代码无感知。
:::

## 样式速查

所有图元的 `style` 支持：`fillStyle` / `strokeStyle` / `lineWidth`、`fillGradient` / `strokeGradient`（声明式可序列化渐变）、`shadow: 'sm' | 'md' | 'lg'` 阴影预设、`textAlign` / `textBaseline` 等。配合 `preset`（`'card'` / `'button'` / `'title'` 等）可以一行拿到成套样式，详见[主题与样式](theme-and-style.md)。
