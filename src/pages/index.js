import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

const features = [
  {
    title: '极端规模下的内存效率',
    icon: '🧊',
    description: (
      <>
        原型继承共享默认 props/state，默认配置零复制；WeakSet 让挂载 O(1)。实测 100 万个最小矩形的堆增量约
        0.87GB（朴素实现约 2.0GB），构建约 6 秒。
      </>
    ),
  },
  {
    title: '可证明的局部重绘契约',
    icon: '🎯',
    description: (
      <>
        默认脏矩形局部重绘，不满足条件时自动回退全量重绘；golden image
        像素一致性回归保障两种渲染路径逐像素一致。组件级离屏缓存、渲染队列缓存、矩阵零分配，5000
        图元场景实测约 2.2ms/帧。
      </>
    ),
  },
  {
    title: '小程序一等公民',
    icon: '❄️',
    description: (
      <>
        cross-platform 适配层收敛全局对象，无 Path2D 运行时自动降级（PolyfillPath2D）且逐像素一致；字体、图片、离屏画布、dpr
        全适配。ICE.init(ctx) 可直接传上下文，绕开 DOM。
      </>
    ),
  },
];

const npmCode = `import { ICE, ICERect } from 'ice-render';

const ice = new ICE();
ice.init('canvas-1', { renderMode: 'dirty-rect' });

const rect = new ICERect({
  left: 100, top: 100, width: 160, height: 90,
  style: { fillStyle: '#4dd0e1', strokeStyle: '#006064' },
  draggable: true,
});
ice.addChild(rect);`;

const umdCode = `<script src="https://unpkg.com/ice-render/dist/index.umd.js"></script>
<script>
  const ice = new ICE.ICE();
  ice.init('canvas-1');
  ice.addChild(new ICE.ICERect({ left: 100, top: 100, width: 160, height: 90 }));
</script>`;

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            快速开始 ⏱️ 5 分钟
          </Link>
          <Link className="button button--outline button--lg" to="/docs/api/ice">
            API 参考
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout description="ICERender（雪花渲染器）：面向 ER 图 / 流程图 / 拓扑图的高性能 Canvas 2D 交互图形渲染引擎">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {features.map((f, idx) => (
                <div className="col col--4" key={idx}>
                  <div className="text--center padding--md">
                    <div className={styles.featureIcon}>{f.icon}</div>
                  </div>
                  <div className="text--center padding-horiz--md">
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.quickStart}>
          <div className="container">
            <h2 className="text--center">快速上手</h2>
            <div className="row">
              <div className="col col--6">
                <h4>npm（ESM）</h4>
                <CodeBlock language="js">{npmCode}</CodeBlock>
              </div>
              <div className="col col--6">
                <h4>UMD（script 标签）</h4>
                <CodeBlock language="html">{umdCode}</CodeBlock>
              </div>
            </div>
            <p className="text--center">
              <Link to="/docs/getting-started/your-first-scene">继续阅读「你的第一个场景」→</Link>
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
