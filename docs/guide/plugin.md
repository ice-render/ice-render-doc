---
sidebar_position: 12
---

# 插件

插件机制让引擎在不修改核心代码的情况下注入自定义图元、渲染钩子与交互工具。

## 注册与卸载

```js
const removed = ice.use(myPlugin);   // 返回布尔，幂等（重复注册返回 false）
ice.unuse('my-plugin');              // 按名称卸载
ice.getPlugins();                    // 已注册插件列表
```

插件宿主为 `ice.plugins`（`PluginHost`），插件需符合 `ICEPlugin` 接口，包含 `name`、`setup` / `teardown` 生命周期。

## 三层注册点

| 注册点 | 说明 |
|---|---|
| `components` | 自定义图元。自动注册 typeId 反查，**可序列化** |
| `render(frame)` | 每帧钩子，拿到世界坐标上下文叠加绘制。全量与局部两条渲染路径都会调用 |
| `tools` | 交互工具。按 `match(component)` 挂载到命中组件；`exclusive: true` 可屏蔽内置变换面板 |

```js
const overlayPlugin = {
  name: 'my-overlay',
  setup(ice) { /* 生命周期 */ },
  teardown(ice) { /* 清理 */ },
  render(frame) {
    // 每帧叠加绘制（世界坐标系）
  },
  tools: [
    {
      match: (component) => component instanceof ICE.ICERect,
      exclusive: false,
      /* 工具实现 */
    },
  ],
};
ice.use(overlayPlugin);
```

## 选中集

插件常需要配合选中集工作：

```js
ice.setSelection([rectA, rectB]); // 返回布尔，表示选中集是否变化
```

参考示例：`examples/plugin/`。
