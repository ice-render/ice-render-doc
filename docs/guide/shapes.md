---
sidebar_position: 3
---

# 图元手册

所有图元共享 [ICEComponent 通用 props](../api/ice-component.md)，下表只列各图元的专有 props。

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
| `radius` | — | 圆角半径 |

## ICECircle / ICEEllipse

```js
new ICE.ICECircle({ left: 100, top: 100, radius: 50 });
new ICE.ICEEllipse({ left: 100, top: 100, radiusX: 80, radiusY: 50 });
```

- `ICECircle`：`radius`（默认 10），也可由 width/height 推导，内部派生 `radiusX/radiusY`
- `ICEEllipse`：`radiusX` / `radiusY`

## ICEIsogon（等多边形）

```js
new ICE.ICEIsogon({ left: 100, top: 100, radius: 50, edges: 6 }); // 六边形
```

| prop | 默认值 | 说明 |
|---|---|---|
| `radius` | `10` | 外接圆半径，与 width/height 联动重算 |
| `edges` | `3` | 边数（≥3） |

## ICEStar

```js
new ICE.ICEStar({ left: 100, top: 100, radius: 50, spikes: 5 });
```

| prop | 默认值 | 说明 |
|---|---|---|
| `radius` | `10` | 半径，与 width/height 联动 |
| `spikes` | `5` | 角数 |

## ICERose

极坐标玫瑰线图元，参数见示例 `examples/shapes/shapes-rose.html`。

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
在小程序等无 `Path2D` 的运行时，引擎自动降级为 `PolyfillPath2D`（记录路径命令、渲染时重放），渲染结果与原生逐像素一致，业务代码无感知。
:::

## 样式速查

所有图元的 `style` 支持：`fillStyle` / `strokeStyle` / `lineWidth`、`fillGradient` / `strokeGradient`（声明式可序列化渐变）、`shadow: 'sm' | 'md' | 'lg'` 阴影预设、`textAlign` / `textBaseline` 等。配合 `preset`（`'card'` / `'button'` / `'title'` 等）可以一行拿到成套样式，详见[主题与样式](theme-and-style.md)。
