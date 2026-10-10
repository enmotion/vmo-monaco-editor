import { defineConfig } from 'vitepress'

const sections = (lang: 'en' | 'zh') => {
  const zh = lang === 'zh'
  return [{ text: zh ? '使用指南' : 'Guide', items: [
    ['getting-started', zh ? '快速开始' : 'Getting started'],
    ['editor', zh ? '普通编辑器' : 'Editor'],
    ['diff-editor', zh ? '差异编辑与审阅' : 'Diff editor & review'],
    ['toolbar', zh ? '工具栏与控件' : 'Toolbar & controls'],
    ['preview', zh ? '预览组件' : 'Previews'],
    ['completion', zh ? '代码补全与类型' : 'Completion & types'],
    ['faq', zh ? '常见问题与发布' : 'FAQ & deployment']
  ].map(([slug, text]) => ({ text, link: `${lang === 'zh' ? '' : '/en'}/guide/${slug}` })) }]
}
export default defineConfig({
  title: 'VMO Monaco Editor',
  description: 'Vue 3 Monaco editor, diff review and preview components',
  base: '/vmo-monaco-editor/',
  cleanUrls: true,
  lastUpdated: true,
  locales: {
    root: { link: '/', label: '简体中文', lang: 'zh-CN', title: 'VMO Monaco Editor', description: 'Vue 3 代码编辑、差异审阅与内容预览组件', themeConfig: {
      nav: [{ text: '指南', link: '/guide/getting-started' }, { text: 'API', link: '/guide/editor' }],
      sidebar: sections('zh'), outline: { label: '本页目录', level: [2, 3] },
      docFooter: { prev: '上一页', next: '下一页' }, lastUpdated: { text: '最后更新' }
    } },
    en: { label: 'English', lang: 'en-US', themeConfig: {
      nav: [{ text: 'Guide', link: '/en/guide/getting-started' }, { text: 'API', link: '/en/guide/editor' }],
      sidebar: sections('en'), outline: { level: [2, 3] }
    } }
  },
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [{ icon: 'github', link: 'https://github.com/enmotion/vmo-monaco-editor' }],
    search: { provider: 'local', options: { locales: { root: { translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: { noResultsText: '没有找到结果', resetButtonTitle: '清除搜索', footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' } }
    } } } } },
    editLink: { pattern: 'https://github.com/enmotion/vmo-monaco-editor/edit/master/docs/:path', text: 'Edit this page on GitHub' },
    footer: { message: 'Vue 3 · Monaco Editor · VitePress' }
  },
  vite: { css: { postcss: { plugins: [] } } }
})
