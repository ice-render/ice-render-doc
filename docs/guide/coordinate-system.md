---
sidebar_position: 2
---

# 坐标系与变换

ICERender 提供完整的仿射变换与**任意深度嵌套的坐标系**——每个组件都有自己的局部坐标系，子组件的坐标永远相对于父组件。

## 变换配置

```js
const rect = new ICE.ICERect({
  left: 100, top: 100, width: 120, height: 80,
  transform: {
    translate: [0, 0],   // 平移
    scale: [1, 1],       // 缩放
    skew: [0, 0],        // 斜切
    rotate: 0,           // 旋转（度）
  },
});
```

### 变换原点

默认原点为 `localCenter`（组件局部中心），也可通过 `origin` + `originX/originY` 自定义。

## 嵌套坐标系

```js
const outer = new ICE.ICEGroup({ left: 100, top: 100 });
outer.transform.rotate = 15; // 外层旋转 15°

const inner = new ICE.ICERect({ left: 50, top: 50, width: 80, height: 60 });
outer.addChild(inner);
```

`inner` 的 `(50, 50)` 是**外层旋转后的坐标系**中的坐标。父级的一切仿射变换自动作用于子树——`display: false` 也会整树隐藏。

## 局部坐标 ↔ 全局坐标

```js
const [gx, gy] = rect.localToGlobal(x, y);   // 局部 → 全局（世界）
const [lx, ly] = rect.globalToLocal(gx, gy); // 全局 → 局部
```

组件上的便捷方法：

- `setPosition(left, top)`：设置局部坐标
- `setGlobalPosition(left, top)`：按全局坐标放置（自动换算）
- `moveGlobalPosition(tx, ty)`：按全局位移量移动
- `setGlobalRotate(angle)`：按全局角度旋转
- `getRotateAngle()`：读取累计旋转角

## 世界坐标 ↔ 屏幕坐标

视口（缩放/平移）把世界坐标映射到屏幕像素：

```js
const [wx, wy] = ice.screenToWorld(sx, sy);   // 屏幕 → 世界
const [sx, sy] = ice.worldToScreen(wx, wy);   // 世界 → 屏幕
```

视口操作详见[视口与缩放](viewport.md)。

## 包围盒

每个组件有两级包围盒：

- `getMinBoundingBox()`：自身几何包围盒（不含变换）
- `getMaxBoundingBox()`：应用全部仿射变换后的包围盒（命中测试、脏区计算的基础）

传入 `true` 可强制刷新缓存。

## HiDPI

`ice.init(el, { dpr })` 显式指定设备像素比，或交给引擎自动探测，保证高分屏下清晰渲染。缩放视口时引擎内部统一按 `getRenderViewport()` 处理矩阵，无需手工换算。
