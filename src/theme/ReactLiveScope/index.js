import React from 'react';

// 默认作用域：react-live 运行 JSX 需要 React 本身
const ReactLiveScope = {
  React,
  ...React,
};

// 暴露 ice-render 内核，使 `jsx live` 代码块能直接编辑运行 ICE API。
// 用 getter 延迟读取 window.ICE：ice-render.js 以 defer 方式全局加载，
// 模块求值时尚不一定就绪，编辑 / 渲染时才读当前值（避免首屏捕获到 undefined）。
Object.defineProperty(ReactLiveScope, 'ICE', {
  enumerable: true,
  configurable: true,
  get: () => (typeof window !== 'undefined' ? window.ICE : undefined),
});

export default ReactLiveScope;
