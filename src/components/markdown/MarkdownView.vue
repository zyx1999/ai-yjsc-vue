<script>
/**
 * 通用 Markdown 渲染组件：用于展示大模型返回的报告型 Markdown 内容。
 *
 * - 解析逻辑见 @/utils/markdown（标题 / 表格 / 列表 / 引用 / 代码 / 分隔线 / 行内样式）；
 * - 组件自带样式，可在任意页面直接使用（与尽调工作台专用样式互不影响）；
 * - caret 为可选流式光标，用于"逐段输出"过程中的视觉提示。
 */
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'MarkdownView',
  props: {
    content: { type: String, default: '' },
    caret: { type: Boolean, default: false }
  },
  render (h) {
    const children = this.content ? renderMarkdown(h, this.content) : []
    if (this.caret) children.push(h('span', { class: 'markdown-caret' }, '▍'))
    return h('div', { class: 'markdown-view' }, children)
  }
}
</script>

<style lang="scss" scoped>
.markdown-view {
  line-height: 1.75;
  color: inherit;
  word-break: break-word;

  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }

  p {
    margin: 8px 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 16px 0 8px;
    font-weight: 600;
    line-height: 1.45;
  }

  h1 {
    font-size: 1.3em;
  }

  h2 {
    font-size: 1.18em;
  }

  h3 {
    font-size: 1.08em;
  }

  h4,
  h5,
  h6 {
    font-size: 1em;
  }

  ul,
  ol {
    margin: 8px 0;
    padding-left: 22px;
  }

  ul {
    list-style: disc outside;
  }

  ol {
    list-style: decimal outside;
  }

  li {
    margin: 4px 0;
    // 全局基础样式重置了 li 的 list-style，这里恢复列表符号
    list-style: inherit;
  }

  blockquote {
    margin: 10px 0;
    padding: 5px 0 5px 12px;
    border-left: 3px solid #b8d8d2;
    border-radius: 0 2px 2px 0;
    background: #f6faf9;
    color: #5c707a;
  }

  hr {
    margin: 14px 0;
    border: 0;
    border-top: 1px solid #e3eaec;
  }

  pre {
    margin: 10px 0;
    padding: 10px 12px;
    overflow-x: auto;
    border-radius: 6px;
    background: #f3f6f6;
    font-size: 0.92em;
    line-height: 1.6;
  }

  :not(pre) > code {
    padding: 1px 5px;
    border-radius: 3px;
    background: #eef4f3;
    font-size: 0.92em;
  }

  a {
    color: #0b8e80;
    text-decoration: underline;
  }

  .markdown-table-wrap {
    max-width: 100%;
    margin: 10px 0;
    overflow-x: auto;
  }

  table {
    min-width: 100%;
    border-collapse: collapse;
    font-size: 0.95em;
  }

  th,
  td {
    padding: 7px 10px;
    border: 1px solid #e3eaec;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f3f8f7;
    font-weight: 600;
    white-space: nowrap;
  }

  tbody tr:nth-child(even) {
    background: #fafcfc;
  }

  .markdown-caret {
    display: inline-block;
    margin-left: 2px;
    color: #00a996;
    animation: markdown-caret-blink 0.9s step-end infinite;
  }
}

@keyframes markdown-caret-blink {
  50% {
    opacity: 0;
  }
}
</style>
