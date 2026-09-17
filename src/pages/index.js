import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './index.module.css';

const features = [
  {
    title: '极端规模下的内存效率',
    icon: '🧊',
    description: (
      <>
        原型继承共享默认 props/state，默认配置零复制（`style` 按主题每实例派生）；WeakSet 让挂载 O(1)。
        实测 100 万个最小矩形的堆增量约 2.3GB（每图元 2.4KB；把整份默认表显式复制进每个实例约 7.4GB），
        构建约 6 秒（2026-09-10 示例页数据）。内存口径与复现方式见「渲染与性能」。
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
  {
    title: '无缝对接 AG-UI',
    icon: '🤝',
    description: (
      <>
        原生对接 AG-UI 协议：Agent 的事件流（run started / text message / tool call / state delta …）直接增量驱动 Canvas 渲染，绘图区即页面主体，无需手写胶水代码。可运行样例见{' '}
        <Link to="https://github.com/ice-render/ice-agent-console">ice-agent-console</Link>，接入方式见{' '}
        <Link to="/docs/guide/dsl">DSL 与 AI Agent 接入</Link>。
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

// 首页「案例」区：全部取自家族各仓的 README 示例截图，画面里的每一个像素都由引擎在 Canvas 上绘制。
// 宽幅主图用 ice-chart 的六套大屏（2.4:1，正好铺满一行不裁切）；下面 6 张按产品各取一张。
const showcaseFeatured = {
  img: 'img/showcase/ice-chart-dashboards.webp',
  tag: 'ice-chart',
  title: '六套数据大屏与图表库',
  docs: '/docs/ice-chart',
};

const showcase = [
  {
    img: 'img/showcase/web-components-admin.webp',
    tag: 'ice-web-components',
    title: '后台管理系统（80+ Canvas 控件）',
    docs: '/docs/ice-web-components',
  },
  {
    img: 'img/showcase/smart-water-process.webp',
    tag: 'ice-smart-water',
    title: '污水处理工艺流程图',
    docs: '/docs/ice-smart-water',
  },
  {
    img: 'img/showcase/agent-console-chart.webp',
    tag: 'ice-agent-console',
    title: 'AI Agent 驱动的绘图控制台',
    docs: '/docs/ice-agent-console',
  },
  {
    img: 'img/showcase/entity-designer-overview.webp',
    tag: 'ice-entity-designer',
    title: 'ER 实体关系建模（可导出 Schema）',
    docs: '/docs/entity-designer',
  },
  {
    img: 'img/showcase/game-xp-desktop.webp',
    tag: 'ice-game',
    title: '整机厅 · Windows XP 桌面',
    docs: '/docs/ice-game',
  },
  {
    img: 'img/showcase/web-components-arcade.webp',
    tag: 'ice-web-components',
    title: 'ICE Arcade 掌机（俄罗斯方块）',
    docs: '/docs/ice-web-components',
  },
];

function Showcase() {
  // useBaseUrl 是 hook，不能在 map 里调用；这里取一次 baseUrl 再手工拼接
  const baseUrl = useBaseUrl('/');
  const asset = (p) => baseUrl.replace(/\/?$/, '/') + p.replace(/^\//, '');

  return (
    <section className={styles.showcase}>
      <div className="container">
        <h2 className="text--center">看看用它能做出什么</h2>
        <p className="text--center">
          下面每一张界面都由引擎在 Canvas 上逐像素绘制 —— 没有 DOM 控件，也没有位图贴图。
        </p>
        <Link className={styles.featuredCard} to={showcaseFeatured.docs}>
          <img
            className={styles.featuredImg}
            src={asset(showcaseFeatured.img)}
            alt={showcaseFeatured.title}
            loading="lazy"
          />
          <span className={styles.caption}>
            <span className={styles.tag}>{showcaseFeatured.tag}</span>
            <span className={styles.captionTitle}>{showcaseFeatured.title}</span>
          </span>
        </Link>
        <div className={styles.showcaseGrid}>
          {showcase.map((s, idx) => (
            <Link className={styles.card} to={s.docs} key={idx}>
              <img className={styles.cardImg} src={asset(s.img)} alt={s.title} loading="lazy" />
              <span className={styles.caption}>
                <span className={styles.tag}>{s.tag}</span>
                <span className={styles.captionTitle}>{s.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

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
        <Showcase />
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {features.map((f, idx) => (
                <div className="col col--3" key={idx}>
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
