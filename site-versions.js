// 文档站涉及的各包版本号（单一来源）。
// 改版本只改这里：docusaurus.config.js（顶部导航）、sidebars.js（左侧菜单）、
// 各产品落地页的 H1 / 应用层徽标都会自动同步，避免版本号在多处散落、对不齐。
//
// 版本值取自 2026-09-15 家族版本现状盘点；若某包已发新版本，在此处 bump 即可。
module.exports = {
  // 渲染引擎内核（本站核心，也是所有应用层的地基）
  iceRender: '2.10.1',
  // 应用层产品
  entityDesigner: '0.3.2',
  iceChart: '0.23.2',
  iceWebComponents: '1.10.3',
  // DSL 兄弟包（ice-chart / ice-entity-designer 落地页与生态表引用）
  iceChartDsl: '0.2.6',
  entityDesignerDsl: '0.0.24',
  iceRenderDsl: '0.1.4',
};
