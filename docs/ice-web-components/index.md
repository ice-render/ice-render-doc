---
sidebar_position: 1
---

# ice-web-components · Canvas 原生 UI 组件库

**ice-web-components 是构建在 ice-render 引擎之上的 Swing 风格 Canvas UI 组件库（当前 `ice-web-components` v1.4.0）。** 它把所有 UI 像素——按钮、输入框、表格、弹窗、乃至焦点环与阴影——**全部画在一个 `<canvas>` 上**：没有 DOM widget，没有 CSS 框架，每一像素都由引擎绘制。

组件库直接采用 Bootstrap 5 的设计令牌（调色板、`--bs-border-radius`、字体等），并自带一套深色主题，换肤只需一次调用。目前落地 **86 个组件**，覆盖按钮 / 输入 / 选择 / 表格 / 树 / 菜单 / 模态 / 抽屉 / 通知 / 上传 / 日期时间 / 级联 / 穿梭 / 轮播 / 取色等。

MIT License · 作者：大漠穷秋（damoqiongqiu@126.com）

> ⚠️ **Just for fun**：作者明确说明这是出于探索与乐趣的项目，并非生产级、经实战检验的 UI 库。但它**有真实测试**——825 个单元测试（107 个套件）外加 8 个浏览器 QA 套件（277 条断言，用真实鼠标 / 键盘事件驱动 demo 页，任何 console 错误都会让 QA 失败）。

## 一个完整的实时例子（就是仓库里的 `examples/gallery.html`）

下面这个 iframe 直接嵌入了 `ice-web-components` 仓库 `examples/gallery.html` 的**完整代码**：86 个组件在一张画布上逐个排布，按钮点击、输入框、下拉、表格、弹窗、通知等交互全部可用。首次加载会从文档静态托管拉取 ~550KB 的 ice-render + ice-web-components UMD 运行时（无需联网）：

<iframe
  src="/ice-web-components/gallery.html"
  title="ice-web-components 组件画廊"
  loading="lazy"
  style={{ width: '100%', height: '1000px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}
/>

## 趣味示例（Just for fun）

下面这些都是**用 ice-web-components 写的完整小应用**，直接以 iframe 嵌入（鼠标、键盘全部可用，运行时从本站静态托管拉取，无需联网）。它们最能体现「一个 canvas 上能画出多好玩的东西」：

> 📐 这些 demo 的画布比文档栏更宽，iframe 内会出现**横向滚动条**——把框往右拖就能看到完整画面（鼠标 / 键盘交互始终准确，因为引擎按 CSS 像素做坐标映射，不做缩放）。

### 🖥️ ICE Desktop · Windows XP

纯 ICE 组件复刻的 XP 桌面：开机自检 → 启动菜单 → 桌面 + 任务栏 + 开始菜单 + 可拖拽窗口。它顺便演示了组件库的主题系统（`iceUIManager.registerTheme('xp', ICE_XP_THEME)`），一套令牌切出整台机器的皮肤。

<iframe
  src="/ice-web-components/windows-xp.html"
  title="ICE Desktop · Windows XP"
  loading="lazy"
  style={{ width: '100%', height: '900px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#000' }}
/>

### 🎮 ICE Arcade

一台纯组件绘制的掌机，卡带即插即换：**2048 / 贪吃蛇 / 俄罗斯方块 / 扫雷**。游戏规则全部落在纯逻辑模型里（各自有单测），画面里**没有一个位图资源**——机壳、屏幕框、HUD、按键全是 ICE 组件。

<iframe
  src="/ice-web-components/arcade.html"
  title="ICE Arcade"
  loading="lazy"
  style={{ width: '100%', height: '800px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#080a0f' }}
/>

### 🎨 ICE Pixel Studio

像素画板：铅笔 / 橡皮 / 直线 / 矩形 / 油漆桶，**撤销重做** + **PNG / SVG 导出**，全部由 canvas 组件绘制。

<iframe
  src="/ice-web-components/pixel-editor.html"
  title="ICE Pixel Studio"
  loading="lazy"
  style={{ width: '100%', height: '920px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}
/>

### 🧪 ICE Algorithm Sandbox

算法可视化：排序（冒泡 / 插入 / 选择 / 归并 / 快速）+ 寻路（BFS / DFS / Dijkstra / A\*），可**播放、单步、倒带、变速**，回放每一步的轨迹。

<iframe
  src="/ice-web-components/algorithm-sandbox.html"
  title="ICE Algorithm Sandbox"
  loading="lazy"
  style={{ width: '100%', height: '920px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}
/>

### 💻 ICE-DOS Terminal

一个能敲的 DOS 终端：**虚拟文件系统** + 16 条命令 + 历史记录 / TAB 补全 / 清屏，逻辑全在纯模型里（点一下框内、直接用键盘 input）。

<iframe
  src="/ice-web-components/dos-terminal.html"
  title="ICE-DOS Terminal"
  loading="lazy"
  style={{ width: '100%', height: '920px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}
/>

> 还有更多能力向 demo 没放进上面（避免页面过长）：`examples/admin.html`（管理后台）、`examples/workbench.html`（工作台）、`examples/custom-component.html`（自定义组件）。它们同样零外部依赖，需要时也能以同样方式嵌入。

## 核心能力

| 能力 | 说明 |
| --- | --- |
| 86 个组件 | 按钮 / 输入 / 选择 / 表格 / 树 / 菜单 / 模态 / 抽屉 / 通知 / 上传 / 日期时间 / 级联 / 穿梭 / 轮播 / 取色，以及标签、徽标、头像、骨架、加载等小件 |
| 统一的浮层栈 | Modal / Drawer / Dropdown / Tooltip / Popover / Popconfirm / Select / DatePicker / Cascader 全部走 `ICEOverlayManager`：12 种 Placement、自动翻转 + 夹紧到可视区、Esc / 点击外部关闭、焦点陷阱、进退场动画 |
| 表单同步 + 异步校验 | `ICEFormModel`（required / min / max / length / pattern / custom / **asyncValidator**），`ICEFormItem` 展示错误与「校验中」态，`submitAsync()` 等待异步规则 |
| 键盘与焦点 | Tab / Shift+Tab 轮换、Enter/Space 激活、方向键驱动滑块 / 菜单 / 标签页 / 评分；焦点环绘制在所有内容之上 |
| 主题 | Bootstrap 5 令牌主题（含深色主题），一次调用换肤 |
| 与引擎无命名冲突 | 运行时导出与 `ice-render` 互不相交（有专门的回归测试守护） |
| 真实测试 | 825 单测（107 套件）+ 8 个浏览器 QA 套件（277 断言，真实键鼠驱动 demo 页，console 报错即失败） |

## 快速开始

### 安装

```bash
# 组件库会自动拉入 ice-render 作为依赖
npm install ice-web-components
```

### 在浏览器里（无构建，UMD 全局 `ICEWEB`）

注意**引擎要先于组件库引入**：

```html
<canvas id="canvas" width="900" height="600"></canvas>
<script src="./ice-render.umd.js"></script>
<script src="./ice-web-components.umd.js"></script>
<script>
  const ice = new ICEWEB.ICE().init('canvas');
  new ICEWEB.ICEHoverManager(ice).start();   // canvas 无原生 hover：显式开启
  ICEWEB.getICEFocusManager(ice).start();    // Tab / Enter / Esc 处理

  const panel = new ICEWEB.ICEPanel({ left: 24, top: 24, width: 372, height: 192 });
  panel.addChild(new ICEWEB.ICELabel({ left: 24, top: 20, text: 'Quick start' }));

  const button = new ICEWEB.ICEButton({ left: 24, top: 64, width: 140, text: 'Click me' });
  const hint = new ICEWEB.ICELabel({ left: 24, top: 112, text: 'clicked 0 times' });
  let count = 0;
  button.on('click', () => {
    count += 1;
    hint.setText(`clicked ${count} times`);
    ICEWEB.ICEMessage.success(ice, `clicked ${count} times`);
  });

  panel.addChildren([button, hint]);
  ice.addChild(panel);
</script>
```

### 在打包工程里（ES Module）

```ts
import { ICE } from 'ice-render';
import {
  ICEButton,
  ICEHoverManager,
  ICELabel,
  ICEMessage,
  ICEPanel,
  getICEFocusManager,
} from 'ice-web-components';

const ice = new ICE().init('canvas');
new ICEHoverManager(ice).start();
getICEFocusManager(ice).start();

const panel = new ICEPanel({ left: 24, top: 24, width: 372, height: 192 });
panel.addChild(new ICELabel({ left: 24, top: 20, text: 'Quick start' }));

const button = new ICEButton({ left: 24, top: 64, width: 140, text: 'Click me' });
button.on('click', () => ICEMessage.success(ice, 'clicked!'));
panel.addChild(button);
ice.addChild(panel);
```

:::caution 没有 DSL 兄弟包
与 ice-render / ice-entity-designer / ice-chart 不同，**ice-web-components 目前没有配套的 JSON-first DSL**——它走的是命令式组件 API（`new ICEButton(...)` / `new ICEPanel(...)` 这种），AI Agent 需要直接拼装组件树，而非产出一份纯 JSON 文档。如果你的场景想用 DSL 驱动 UI，目前需要在 Agent 侧把「意图 → 组件树」这层自己写掉。
:::

## 相关链接

- GitHub：[ice-web-components](https://github.com/ice-render/ice-web-components)
- npm：[ice-web-components](https://www.npmjs.com/package/ice-web-components)
- 引擎内核文档：[ICE Render 介绍](/docs/intro)
