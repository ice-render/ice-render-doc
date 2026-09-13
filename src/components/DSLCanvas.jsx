import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useRef } from 'react';
import useAssetResolver from '../utils/assetUrl';

// ice-render DSL 以 UMD 形式放在 static/ice-render-dsl.js，全局挂载到 window.ICEDSL。
// 它依赖 static/ice-render.js（window.ICE），故需先后加载两个脚本。
// 文档站纯前端、不依赖任何服务端，这里只在客户端动态加载并渲染 JSON DSL。

let icePromise = null;
function loadScript(src) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (document.querySelector(`script[src="${src}"]`)) {
    return Promise.resolve(true);
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error(`${src} 加载失败`));
    document.head.appendChild(s);
  });
}

function ensureIce(src) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.ICE) return Promise.resolve(window.ICE);
  if (icePromise) return icePromise;
  icePromise = loadScript(src).then(() => window.ICE);
  return icePromise;
}

function ensureDsl(src) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.ICEDSL) return Promise.resolve(window.ICEDSL);
  return loadScript(src).then(() => window.ICEDSL);
}

function DSLCanvasInner({ height = 360, dsl, background = '#ffffff' }) {
  const ref = useRef(null);
  const resolveAsset = useAssetResolver();

  useEffect(() => {
    let ice = null;
    let cancelled = false;

    Promise.all([ensureIce(resolveAsset('/ice-render.js')), ensureDsl(resolveAsset('/ice-render-dsl.js'))])
      .then(([ICE, ICEDSL]) => {
        if (cancelled || !ref.current || !ICE || !ICEDSL) return;
        const canvas = ref.current;
        const result = ICEDSL.renderDsl(canvas, dsl);
        ice = result && result.ice;
      })
      .catch((e) => console.error('[DSLCanvas] 渲染出错:', e));

    return () => {
      cancelled = true;
      if (ice && typeof ice.destroy === 'function') {
        try {
          ice.destroy();
        } catch (e) {
          /* noop */
        }
      }
    };
    // dsl 通过闭包捕获首次渲染的引用；场景为静态 DSL，无需重复执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={ref}
      width={760}
      height={height}
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: 760,
        background,
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: 8,
        display: 'block',
        margin: '1rem 0',
      }}
    />
  );
}

// 用 BrowserOnly 包裹，确保 ICEDSL 只在浏览器端加载与渲染（避免 SSR 阶段访问 DOM）
export default function DSLCanvas(props) {
  return <BrowserOnly>{() => <DSLCanvasInner {...props} />}</BrowserOnly>;
}
