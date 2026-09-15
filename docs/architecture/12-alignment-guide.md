# · 对齐吸附（AlignmentGuideManager）

## 目标与边界

拖拽组件时，把被拖组件的关键坐标与其他组件做最近匹配，命中阈值内自动吸附，并在工具层显示提示线。
默认**禁用**，应用层显式启用后才会生效：

```ts
ice.alignmentGuide.enable({
  threshold: 3,       // 磁吸像素（= 吸附半径）
  hysteresis: 1,      // 脱离余量（脱离阈值 = threshold + hysteresis）
  edge: true,
  center: true,
  spacing: false,     // 等间距候选默认关闭（见下「密集版面」）
  proximity: 0,       // 相关性门控半径（屏幕像素），0 = 关闭
  guideStyle: { fillStyle: '#EC4899' },  // 提示线样式（透传 canvas ctx）
  guideWidth: 1,      // 提示线宽（屏幕像素）
  guideZIndex: 10000010,
});
ice.alignmentGuide.disable();
```

未启用时零开销、零副作用，因此不改变既有拖拽行为。

提示线外观通过 `guideStyle` / `guideWidth` / `guideZIndex` 参数化，应用层可自由定制颜色、线宽、层级等。

## 关键坐标

- X：`left`(minX)、`centerX`、`right`(maxX)
- Y：`top`(minY)、`centerY`、`bottom`(maxY)

## 三类对齐

1. **边缘**：source 的 left/right/top/bottom 对齐 target 的同/异侧边缘。
2. **中心**：source 的 centerX/centerY 对齐 target 的中心。
3. **等间距**：source 中心位于两个目标中心的中点（source 需位于两者之间）。

## 两条铁律

- **X/Y 两轴分别计算**：`computeSnap` 返回 `{ x, y }`，各自取最小 delta 并分别吸附；
  不能只返回单轴，否则「本已对齐的轴」会以 delta=0 抢占另一轴的吸附。
- **阈值是屏幕像素**：计算时按 `1 / viewport.scale` 换算成世界坐标，保证缩放视口下磁吸视觉距离一致。
- **命中即锁定（粘性目标）**：一旦吸附到某条线，只要源盒还在 `threshold + hysteresis` 内就**继续用它**，
  不会因为旁边出现更近的线就改主意 —— 这是"密集版面里引导线/图元乱跳"的根因修复。

## 密集版面：为什么默认关掉等间距、阈值要收紧（2026-09-15）

现场：`ice-smart-water` 的工艺流程图有 **34 个单元**，拖动任一单元时引导线每步换一条、
图元被拽得正负交替（实测 24 步里 19 步在吸附、相邻步位移变化最大 18 世界 px）。量化后的根因：

| 候选种类 | 「离某条候选线 ≤4px」的概率（34 个单元、0.502× 缩放） |
|---|---|
| 边缘 + 中心 + 等间距、不限距离（**旧默认**） | **75%** |
| 边缘 + 中心 + 等间距 + 门控 80 | 49% |
| 边缘 + 中心（等间距关）+ 门控 80 | 36% |
| 仅边缘 + 门控 80 | 23% |

也就是说：**旧默认下拖动时有约 3/4 的时间"贴在某条候选线上"**（候选线沿拖动路径的中位间距只有 2px，
而阈值 6 屏幕 px 在 0.5× 缩放下等于 12 世界 px）。三条对策：

1. **等间距默认关闭**（`spacing: false`）：它是「任意两个目标中心的中点」这种**全图级别**的线，
   O(n²) 且用户无法预期线会出现在哪儿；需要它的应用显式 `spacing: true`。
2. **阈值按版面密度收紧**：阈值是吸附半径，必须明显小于候选线沿路径的间距。引擎默认 3；
   `ice-entity-designer` 这种密集版面用 **2**。
3. **相关性门控**（`proximity`，默认 0 = 关）：只在**另一轴**上与源盒相距不超过它的目标之间找对齐。
   它能砍半吸附概率（工艺图 80 屏幕 px：11/24 → 7/24），但会挡掉合法的远距离对齐
   （引擎对齐示例需要 ≥120、设计器流程图回归需要 ≥105 屏幕 px），因此默认关闭。

实测效果（同一段真机拖动）：吸附步数 **19/24 → 13/24**，单步修正幅度 **≤4.4 世界 px（≈2 屏幕 px）**，
相邻步位移变化 **18 → 6.1 世界 px**，且命中期间引导线不再换目标。

## 挂载与提示线

- 监听 `evtBus` 的 `mousedown` 记录被拖组件，监听其 `AFTER_MOVE` 做吸附修正 + 画线；
  `mouseup` 解除监听并清线。
- 提示线用 `toolNodes` 的 `ICERect`（细线），不参与序列化；拖拽结束清除。

## 验收

- 单测：`tests/control-panel/AlignmentGuideManager.test.ts`、`tests/control-panel/alignment-dense.test.ts`（密集版面 5 例）
- 交互：`e2e/visual/alignment.spec.ts`
- 示例：`examples/alignment/alignment-snap.html`
