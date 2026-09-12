---
sidebar_position: 1
---

# ICE 类参考

`ICE` 是引擎主类，每个实例管理一个 canvas、一棵场景树与一组 Manager。

```js
import { ICE } from 'ice-render';
const ice = new ICE();
```

## 实例属性

| 属性 | 说明 |
|---|---|
| `viewport` | `{ scale, tx, ty }` 视口状态 |
| `dpr` | 设备像素比 |
| `theme` | 当前主题 |
| `plugins` | `PluginHost` 插件宿主 |
| `animationManager` | 动画管理器（每实例一个） |
| `eventDispatcher` | DOM 事件派发器 |
| `evtBus` | 全局事件总线（`EventBus`） |
| `controlPanelManager` | 变换控制面板管理器 |
| `alignmentGuide` | 对齐吸附管理器（`AlignmentGuideManager`） |
| `linkSlotManager` | 连线插槽管理器 |
| `serializer` / `deserializer` | 序列化器 |
| `imageCache` | 图片缓存 |
| `canvasWidth` / `canvasHeight` | 画布尺寸 |
| `dirty` | getter/setter，脏标记 |

## 生命周期

### `init(ctx, options?)`

初始化引擎。`ctx` 可以是 canvas 元素 id 字符串、canvas 元素或 Canvas 2D 上下文。

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `renderMode` | `'dirty-rect' \| 'full'` | `'dirty-rect'` | 渲染模式 |
| `dpr` | `number` | 自动探测 | 设备像素比 |

### `destroy()`

销毁实例，释放资源。

## 场景树

| 方法 | 说明 |
|---|---|
| `addChild(component, markDirty = true)` | 添加子组件 |
| `addChildren(arr)` | 批量添加 |
| `removeChild(component)` / `removeChildren(arr)` | 移除 |
| `clearAll()` | 清空场景树 |
| `addTool(tool)` / `removeTool(tool)` | 工具层（不参与序列化） |
| `findComponent(id)` | 按 id **递归**查找组件 |

## 类型注册

| 方法 | 说明 |
|---|---|
| `registerType(className, Clazz)` | 注册自定义组件类型（可序列化的前提） |
| `getTypeId(Clazz)` | 取组件类的稳定 typeId |
| `getType(className)` | 按 className 反查构造器 |

## 插件与选中

| 方法 | 说明 |
|---|---|
| `use(plugin): boolean` | 注册插件（幂等，重复返回 false） |
| `unuse(name)` | 按名称卸载插件 |
| `getPlugins()` | 已注册插件列表 |
| `setSelection(components): boolean` | 设定选中集，返回是否有变化 |

## 视口与坐标

| 方法 | 说明 |
|---|---|
| `setViewport(scale, tx, ty)` | 设定视口 |
| `zoomAt(screenX, screenY, factor, minScale?, maxScale?)` | 定点缩放 |
| `screenToWorld(sx, sy): [x, y]` | 屏幕 → 世界坐标 |
| `worldToScreen(wx, wy): [x, y]` | 世界 → 屏幕坐标 |
| `getRenderViewport()` | 渲染用视口快照 |
| `updateCanvasBoundingRect()` | 刷新画布包围盒缓存（窗口变化后调用） |
| `getInputRect()` | 输入层画布矩形 |
| `hitTest(sx, sy)` | 屏幕坐标命中测试，返回命中组件或 null |

## 主题

| 方法 | 说明 |
|---|---|
| `setTheme(theme: string \| Partial<ICESemanticTheme>)` | 按名称或部分覆盖切换主题，热生效 |
| `registerTheme(name, theme)` | 注册命名主题 |
| `getTheme()` | 读取当前主题 |

详见[主题与样式](../guide/theme-and-style.md)。

## 无障碍

| 方法 | 说明 |
|---|---|
| `getAccessibilityTree(options?)` | 构建无障碍树 |
| `setFocusedComponent(c)` / `getFocusedComponent()` | 焦点组件管理 |

## 序列化

| 方法 | 说明 |
|---|---|
| `toJSONString()` / `toJSONObject()` | 导出 |
| `fromJSONString(str)` / `fromJSONObject(obj)` | 还原 |

详见[序列化](../guide/serialization.md)。

## 上下文透传

直接代理底层 canvas 上下文的能力：

`createLinearGradient` / `createRadialGradient` / `createConicGradient` / `createPattern` / `getImageData` / `putImageData` / `createImageData` / `toDataURL` / `toBlob`

声明式渐变（`style.fillGradient` / `strokeGradient`）可序列化，优于运行时调用 `create*Gradient`。

## 其他

| 方法 | 说明 |
|---|---|
| `loadFont(family, source): Promise` | 预加载自定义字体 |
