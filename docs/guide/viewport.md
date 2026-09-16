---
sidebar_position: 11
---

# 视口与缩放

ICE 实例维护一个视口（viewport），把世界坐标映射到屏幕像素，支持缩放、平移与定点缩放。

## 视口状态

```js
ice.viewport; // { scale, tx, ty }
```

```js
ice.setViewport(scale, tx, ty); // 直接设定
```

## 定点缩放

围绕屏幕上某个点缩放（鼠标滚轮缩放画布的标准做法）：

```js
ice.zoomAt(screenX, screenY, factor, minScale, maxScale);
```

- `factor > 1` 放大，`< 1` 缩小
- `minScale` / `maxScale` 可选，限制缩放范围

## 坐标换算

```js
const [wx, wy] = ice.screenToWorld(sx, sy);
const [sx, sy] = ice.worldToScreen(wx, wy);
```

业务代码中凡涉及鼠标位置判断，**永远先换算到世界坐标**再做几何判断。

## HiDPI

```js
ice.init(el, { dpr: 2 });
```

显式指定设备像素比；引擎默认 `dpr = 1`，**不自动探测** `devicePixelRatio`，只有显式传 `dpr > 1` 才启用 HiDPI（backing store 放大到 cssSize × dpr）。窗口/画布尺寸变化后调用 `ice.updateCanvasBoundingRect()` 刷新缓存的包围盒矩形。

## 其他

- `ice.getRenderViewport()`：渲染用的视口快照（渲染过程中使用，避免帧内视口变化）
- `ice.getInputRect()`：输入层使用的画布矩形
- 矩阵换算内部全部零分配，缩放平移不产生 GC 压力

示例：`examples/viewport/viewport-zoom.html`。
