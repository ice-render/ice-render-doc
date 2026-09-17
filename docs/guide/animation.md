---
sidebar_position: 9
description: "ICE Render 动画系统：时间轴、缓动、属性通道与动画调度，用声明式方式为图形与连接线添加高性能动画。"
keywords:
  - "Canvas 动画"
  - "缓动"
  - "时间轴"
  - "动画调度"
  - "ICE Render"
---
# 动画

动画通过组件的 `props.animations` 声明式配置，由 `ice.animationManager`（每实例一个）驱动补间。

## 单段动画

```js
const rect = new ICE.ICERect({
  left: 100, top: 100, width: 80, height: 60,
  animations: {
    'transform.rotate': {
      from: 0,
      to: 360,
      duration: 1000,
      easing: 'out',
      loop: true,
    },
  },
});
ice.addChild(rect);
ice.animationManager.add(rect);
```

配置项：

| 字段 | 说明 |
|---|---|
| `from` / `to` | 起止值；值是数组时**逐元素补间** |
| `duration` | 时长（ms），也可用 motion token：`'fast'`(100) / `'normal'`(200) / `'slow'`(300) / `'slower'`(500) |
| `delay` | 延迟启动 |
| `easing` | 缓动名（见下） |
| `loop` | 是否循环 |
| `iterationCount` | 迭代次数 |
| `round` | 是否取整（避免亚像素抖动） |
| `keyframes` | 关键帧时间轴（见下） |

动画的 key 是**点路径**：`'transform.rotate'`、`'left'`、`'top'` 等任意可补间的数值属性。

## 关键帧（keyframes）

```js
animations: {
  'left': {
    duration: 1200,
    keyframes: [
      { offset: 0, value: 0, easing: 'out' },
      { offset: 0.5, value: 300 },
      { offset: 1, value: 150, easing: 'inOut' },
    ],
  },
}
```

每个关键帧用 `offset`（0~1）定位，可携带独立的 `easing`。

## 缓动

| 缓动名 | 说明 |
|---|---|
| `linear` | 线性 |
| `out` / `inOut` / `outQuart` | 经典缓动 |
| `spring` / `springSoft` / `springSnappy` | 弹簧物理缓动（软/标准/干脆三档） |

## AnimationManager

```js
ice.animationManager.add(component);      // 参与动画（addChild 后需要）
ice.animationManager.remove(component);
ice.animationManager.start();
ice.animationManager.stop();
ice.animationManager.pause();
ice.animationManager.resume();
ice.animationManager.isPaused();
```

动画时长/缓动也可通过[主题 motion token](theme-and-style.md) 统一管控。

示例：`examples/animation/`（basic / extended / keyframes / loop）与压测 `examples/performance/animation-stress.html`。
