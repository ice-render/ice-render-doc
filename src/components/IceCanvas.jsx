import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useRef } from 'react';

// ice-render 以 UMD 形式放在 static/ice-render.js，全局挂载到 window.ICE。
// 文档站纯前端、不依赖任何服务端，这里只在客户端动态加载并渲染。
let icePromise = null;
function ensureIce() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.ICE) return Promise.resolve(window.ICE);
  if (icePromise) return icePromise;
  icePromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/ice-render.js';
    s.async = true;
    s.onload = () => resolve(window.ICE);
    s.onerror = () => reject(new Error('ice-render.js 加载失败'));
    document.head.appendChild(s);
  });
  return icePromise;
}

function IceCanvasInner({ height = 360, setup, background = '#ffffff' }) {
  const ref = useRef(null);

  useEffect(() => {
    let ice = null;
    let cancelled = false;

    ensureIce()
      .then((ICE) => {
        if (cancelled || !ref.current || !ICE) return;
        const canvas = ref.current;
        ice = new ICE.ICE();
        ice.init(canvas);
        if (typeof setup === 'function') {
          try {
            setup(ICE, ice, canvas);
          } catch (e) {
            console.error('[IceCanvas] setup 执行出错:', e);
          }
        }
      })
      .catch((e) => console.error(e));

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
    // setup 通过闭包捕获首次渲染的引用；demo 为静态场景，无需重复执行
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

// 用 BrowserOnly 包裹，确保 ICE 只在浏览器端加载与渲染（避免 SSR 阶段访问 DOM）
export default function IceCanvas(props) {
  return <BrowserOnly>{() => <IceCanvasInner {...props} />}</BrowserOnly>;
}
