// 文档站涉及的各包版本号（单一来源）。
// 改版本只改这里：docusaurus.config.js（顶部导航）、sidebars.js（左侧菜单）、
// 各产品落地页的 H1 / 应用层徽标都会自动同步，避免版本号在多处散落、对不齐。
//
// 版本值取自 2026-09-20 家族版本现状盘点；若某包已发新版本，在此处 bump 即可。
module.exports = {
  // 渲染引擎内核（本站核心，也是所有应用层的地基）
  iceRender: '4.2.0',
  // 应用层产品
  entityDesigner: '0.12.0',
  iceChart: '0.28.0',
  iceWebComponents: '1.22.4',
  // DSL 兄弟包（ice-chart / ice-entity-designer 落地页与生态表引用）
  iceChartDsl: '0.5.5',
  entityDesignerDsl: '0.0.37',
  iceRenderDsl: '0.4.4',
  iceWebComponentsDsl: '0.6.4',
  // 应用层新成员（演示型产品，private 未发 npm）
  iceSmartWater: '0.1.0',
  iceGame: '0.1.0',
  iceAgentConsole: '0.1.0',
};
