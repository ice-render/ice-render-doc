---
sidebar_position: 14
---

# 小程序与跨平台

ICERender 把「小程序是一等公民」作为设计约束，而非事后适配。

## root 适配层

`cross-platform/root` 把引擎用到的全部全局对象收敛为一个适配层：

- `document` / `window` / `Image`
- `canvas` / `FontFace` / `devicePixelRatio`

在浏览器中它直接指向原生全局对象；在小程序中，宿主提供等价实现即可，引擎核心代码零修改。

## 直接传入上下文

`ice.init(ctx)` 的第一个参数可以直接传 Canvas 2D 上下文，完全绕开 DOM：

```js
// 小程序示例（伪代码）
const query = wx.createSelectorQuery();
query.select('#my-canvas').fields({ node: true }).exec((res) => {
  const canvas = res[0].node;
  const ctx = canvas.getContext('2d');
  const ice = new ICE();
  ice.init(ctx, { dpr: wx.getSystemInfoSync().pixelRatio });
});
```

## PolyfillPath2D

小程序运行时普遍没有 `Path2D`。引擎检测后自动降级为 `PolyfillPath2D`：

- 记录路径命令，渲染时重放
- 渲染结果与原生 `Path2D` **逐像素一致**（有像素一致性回归保障）
- 业务代码完全无感知

## 字体与图片

- 字体：`await ice.loadFont(family, source)` 统一预加载（小程序走对应 FontFace 等价物）
- 图片：统一经由 `ice.imageCache` 管理

## 离屏画布与 dpr

离屏缓存（`ObjectCache`）与 HiDPI 处理同样经由适配层，多画布/隐藏画布场景见 `examples/performance/multi-hidden-canvas.html`。
