<script>
/**
 * 尽调工作台消息内的 Markdown 渲染（样式由 styles/diligence.scss 按 .markdown-message 提供）。
 * 解析逻辑统一收敛到 @/utils/markdown，避免多处重复维护。
 */
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'MarkdownMessage',
  props: {
    content: { type: String, default: '' }
  },
  render(h) {
    return h('div', { class: 'markdown-message' }, this.content ? renderMarkdown(h, this.content) : [])
  }
}
</script>
