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

## 接入契约：宿主最少要做什么

引擎**不需要假 DOM**：画布对象就是小程序 canvas 节点本来的样子（只有 `width` / `height` / `getContext`），
没有 `getBoundingClientRect` 时引擎按「原点 (0,0) + 画布自身尺寸」兜底（`ICE.readCanvasRect()`），
正好对上小程序「触摸坐标相对画布」的语义。

宿主只需做三件事：

1. **取节点与尺寸**：`wx.createSelectorQuery().fields({ node: true, size: true })`，并按 dpr 设置 `canvas.width/height`（小程序画布不会自动跟随 CSS 尺寸）；
2. **换算触摸坐标**：小程序触摸事件的 `clientX/clientY` 是相对视口的，要减去画布在页面里的位置（`boundingClientRect()`）再投递；
3. **投递输入**：以引擎总线的 `ICE_TOUCHSTART / MOVE / END / CANCEL` 事件投递（引擎会归一化成 `mousedown/mousemove/mouseup` 派发给组件，业务代码与浏览器里一致）。

完整可运行的最小例子（含触摸适配层）见仓库 `examples/mini-program/`，页面可直接拷进小程序项目。

## 验证到了哪一层

**每次提交都会跑**：`tests/mini-program/` 在一个「小程序形状」的运行时里做回归 ——
把 `document` / `window` / `Path2D` / `requestAnimationFrame` / `FontFace` / `OffscreenCanvas` 全部摘掉，
只留 `wx.*`，画布对象只有 `width` / `height` / `getContext`，覆盖：

- 启动与出帧（无 rAF 时定时器兜底）、路径命令重放（无原生 `Path2D`）；
- 离屏缓存走 `wx.createOffscreenCanvas`，以及**老基础库没有它时自动关闭缓存、直接落墨**；
- 文本量测在老基础库（`measureText` 没有墨迹界标）下按 state 尺寸兜底，不抛错、不刷日志；
- 触摸输入归一化（含坐标换算与位移补算）、序列化往返、SVG 导出；
- 一条越界检查：全程不许触碰小程序 Canvas 2D 子集之外的成员。

**这一层覆盖不到的**（需要微信开发者工具模拟器或真机）：字体加载是否生效、
离屏 canvas 在真机上的行为与性能、低端机光栅化性能、低版本基础库的边界。
模拟器的 canvas 由 Chromium/Skia 实现，与真机实现不同 —— **模拟器通过不等于真机逐像素一致**。
