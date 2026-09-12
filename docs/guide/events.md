---
sidebar_position: 7
---

# 事件系统

ICERender 实现了 W3C 风格的事件模型：组件与全局事件总线（`ice.evtBus`）共用同一套 `ICEEventTarget` API。

## 基础 API

```js
rect.on('click', handler);        // 订阅
rect.off('click', handler);       // 取消订阅
rect.once('click', handler);      // 只触发一次
rect.trigger('my-event', originalEvent, param); // 手动触发
```

同时支持 W3C 别名：`addEventListener` / `removeEventListener` / `dispatchEvent`。

### 暂停与恢复

```js
rect.suspend('click');   // 暂停某事件（不移除监听器）
rect.resume('click');    // 恢复
rect.purgeEvents();      // 清空该目标上的全部事件
rect.hasListener();      // 是否有监听器
```

## 统一 Pointer 输入层

引擎把 mouse / touch / 触控笔统一为 Pointer 输入（`input-normalize` 层）：

- 运行时没有 `PointerEvent` 时自动回退到 mouse + touch 合成
- 原生事件统一转成 `ICEEvent` 注入事件总线
- 修饰键（`shiftKey` 等）完整透传——例如拖动变换手柄时按住 Shift 可启用约束模式

## 引擎事件名

常用事件名定义在 `ICE_EVENT_NAME_CONSTS` 中：

| 常量 | 说明 |
|---|---|
| `ICE_FRAME_EVENT` | 每帧触发（FrameManager 全局调度） |
| `BEFORE_RENDER` / `AFTER_RENDER` | 渲染前后 |
| `BEFORE_ADD` / `AFTER_ADD` | 添加子组件前后 |
| `BEFORE_REMOVE` / `AFTER_REMOVE` | 移除子组件前后 |
| `BEFORE_MOVE` / `AFTER_MOVE` | 移动前后 |
| `BEFORE_RESIZE` / `AFTER_RESIZE` | 缩放前后 |
| `BEFORE_ROTATE` / `AFTER_ROTATE` | 旋转前后 |
| `ROUND_FINISH` | 一轮交互结束 |
| `HOOK_MOUSEDOWN` / `HOOK_MOUSEMOVE` / `HOOK_MOUSEUP` | 变换手柄钩子事件 |
| `ICE_WHEEL` | 滚轮 |
| `ICE_POINTER*` / `ICE_TOUCH*` | 统一 Pointer / 触摸输入事件 |

监听方式（组件级或全局总线级均可）：

```js
rect.on(ICE.ICE_EVENT_NAME_CONSTS.AFTER_RESIZE, (evt) => {
  console.log('新尺寸', evt.param);
});
```

## 全局事件总线

`ice.evtBus` 是每个 ICE 实例一条的 `EventBus`，Manager 之间的协作都走它。你也可以用它做跨组件通信：

```js
ice.evtBus.on('my-global-event', handler);
ice.evtBus.trigger('my-global-event', null, { foo: 1 });
```

## 命中测试

```js
const component = ice.hitTest(screenX, screenY); // 命中返回组件，否则 null
```

示例：`examples/event/`（dbclick / eventbus / keyboard / pojo）。
