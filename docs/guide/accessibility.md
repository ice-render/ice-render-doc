---
sidebar_position: 13
---

# 无障碍（a11y）

Canvas 内容对屏幕阅读器天然不可见。ICERender 不自建 DOM 镜像，而是提供**无障碍原语**，由宿主应用决定如何呈现（如生成并行 DOM、对接读屏 API）。

## 无障碍树

```js
const tree = ice.getAccessibilityTree({
  includeTools: false,   // 是否包含工具层组件（默认 false）
  includeHidden: false,  // 是否包含 display:false 的隐藏组件（默认 false）
  filter: undefined,     // 自定义过滤函数
});
```

返回 `ICEAccessibleNode` 数组：

| 字段 | 说明 |
|---|---|
| `id` | 组件 id |
| `role` | `graphic / container / link / text / image / tool` |
| `label` | 优先级：`ariaLabel` → 文本内容 → id |
| `box` | 屏幕坐标下的 CSS 像素包围盒 |
| `visible` / `interactive` / `focusable` | 状态标记 |
| `tabIndex` / `selected` / `level` | 语义信息 |
| `parentId` | 树结构关系 |

## 焦点管理

```js
ice.setFocusedComponent(component);  // 设定焦点组件
const focused = ice.getFocusedComponent();
```

## 参考实现

引擎示例 `examples/a11y/a11y-mirror.html` 演示了如何用无障碍树生成并行 DOM 镜像。`buildAccessibilityTree` 也在包入口直接导出，可脱离 ICE 实例方法使用。
