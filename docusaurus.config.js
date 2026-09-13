// @ts-check

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;
// 各包版本号单一来源（见 site-versions.js）；顶部导航与左侧菜单都从这里取
const V = require('./site-versions');

// 部署到 GitHub Pages 项目页：站点挂在 https://ice-render.github.io/ice-render-doc/ 下。
// baseUrl 必须以斜杠开头和结尾。注意：Docusaurus 不会对 siteConfig.scripts/stylesheets
// 的 src 自动套用 useBaseUrl（synthetic.js 原样输出），所以脚本路径必须手动带上 baseUrl
// 前缀，否则 `jsx live` 示例块在子路径部署下会 404。这里用同一常量驱动，避免两者漂移。
const baseUrl = '/ice-render-doc/';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ICE Render',
  tagline: '雪花渲染器 · 高性能 Canvas 2D 交互图形引擎',
  url: 'https://ice-render.github.io',
  baseUrl,
  onBrokenLinks: 'throw',
  // 文件名带 -ice 后缀用于破坏浏览器 favicon 缓存（旧恐龙图标一直被浏览器按 URL 缓存）
  favicon: 'img/favicon-ice.ico',
  organizationName: 'ice-render',
  projectName: 'ice-render',
  // 全局加载 ice-render 内核，供 `jsx live` 代码块直接使用 window.ICE（defer：HTML 解析后、水合前执行）
  // src 必须带 baseUrl 前缀（见上方说明）；baseUrl 改了这里也要跟着改，故用同一常量。
  scripts: [{ src: `${baseUrl}ice-render.js`, defer: true }],

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid', '@docusaurus/theme-live-codeblock'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/ice-render/ice-render-doc/tree/master',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // 默认深色模式（用户偏好）；保留右上角切换按钮，切到 light 也已修好高亮行配色
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: false,
      },
      navbar: {
        // 顶部导航标题直接带引擎版本，读者一进站点就知道文档对应哪版内核
        title: `ICE Render v${V.iceRender}`,
        logo: {
          alt: 'ICE Render Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: '文档',
          },
          {
            type: 'doc',
            docId: 'api/ice',
            position: 'left',
            label: 'API 参考',
          },
          {
            type: 'doc',
            docId: 'architecture/runtime',
            position: 'left',
            label: '架构设计',
          },
          {
            type: 'doc',
            docId: 'entity-designer/index',
            position: 'left',
            label: `Entity Designer v${V.entityDesigner}`,
          },
          {
            type: 'doc',
            docId: 'ice-chart/index',
            position: 'left',
            label: `ice-chart v${V.iceChart}`,
          },
          {
            type: 'doc',
            docId: 'ice-web-components/index',
            position: 'left',
            label: `ice-web-components v${V.iceWebComponents}`,
          },
          {
            href: 'https://github.com/ice-render/ice-render',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '文档',
            items: [
              {
                label: '快速上手',
                to: '/docs/getting-started/installation',
              },
              {
                label: 'API 参考',
                to: '/docs/api/ice',
              },
              {
                label: '架构设计',
                to: '/docs/architecture/runtime',
              },
            ],
          },
          {
            title: '生态',
            items: [
              {
                label: 'ice-render（引擎）',
                href: 'https://github.com/ice-render/ice-render',
              },
              {
                label: 'ice-render-dsl（AI Agent DSL）',
                href: 'https://www.npmjs.com/package/ice-render-dsl',
              },
              {
                label: 'ice-chart（图表库）',
                href: 'https://www.npmjs.com/package/@damoqiongqiu/ice-chart',
              },
              {
                label: 'ice-chart-dsl（图表 DSL）',
                href: 'https://www.npmjs.com/package/@damoqiongqiu/ice-chart-dsl',
              },
              {
                label: 'ice-entity-designer（ER 设计器）',
                href: 'https://www.npmjs.com/package/ice-entity-designer',
              },
              {
                label: 'ice-web-components（Canvas UI）',
                href: 'https://www.npmjs.com/package/ice-web-components',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} ICE Render · MIT © 大漠穷秋 · Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
