import { parseBlocks, inlineNodes, renderMarkdown } from '@/utils/markdown'

function mockH () {
  return (tag, data, children) => {
    if (Array.isArray(data) && children === undefined) {
      children = data
      data = null
    }
    return { tag: tag, data: data, children: children || [] }
  }
}

describe('Utils:markdown', () => {
  it('parses headings with different levels', () => {
    const blocks = parseBlocks('# 一级\n## 二级\n### 三级')
    expect(blocks.map(block => [block.type, block.level, block.text])).toEqual([
      ['heading', 1, '一级'],
      ['heading', 2, '二级'],
      ['heading', 3, '三级']
    ])
  })

  it('parses gfm tables used by credit reports', () => {
    const source = '| 项目 | 内容 |\n|------|------|\n| 姓名 | 陈国雄 |\n| 婚姻状况 | 已婚 |'
    const blocks = parseBlocks(source)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('table')
    expect(blocks[0].header).toEqual(['项目', '内容'])
    expect(blocks[0].rows).toEqual([['姓名', '陈国雄'], ['婚姻状况', '已婚']])
  })

  it('parses ordered and unordered lists', () => {
    const blocks = parseBlocks('- 无逾期记录\n- 无公共不良记录\n\n1. 第一项\n2. 第二项')
    expect(blocks[0]).toEqual({ type: 'unordered-list', items: ['无逾期记录', '无公共不良记录'] })
    expect(blocks[1]).toEqual({ type: 'ordered-list', items: ['第一项', '第二项'] })
  })

  it('terminates on empty list items (regression: page hangs)', () => {
    // 回归：仅 "- "/"1. " 的空条目曾让解析器在同一行无限循环，导致回答渲染时页面假死。
    const blocks = parseBlocks('- \n正常段落\n\n1. \n2. 正常项\n\n-　')
    expect(blocks.filter(block => block.type === 'unordered-list')).toEqual([
      { type: 'unordered-list', items: [''] },
      { type: 'unordered-list', items: [''] }
    ])
    expect(blocks.find(block => block.type === 'ordered-list')).toEqual({
      type: 'ordered-list',
      items: ['', '正常项']
    })
    expect(blocks.find(block => block.type === 'paragraph')).toEqual({
      type: 'paragraph',
      lines: ['正常段落']
    })
  })

  it('terminates on pathological fence and table drafts', () => {
    // 未闭合围栏、只有分隔行的表格草稿、全角空格条目都必须能解析结束。
    expect(parseBlocks('```js\nconst a = 1').length).toBe(1)
    expect(parseBlocks('|------|\n|------|').length).toBe(1)
    expect(parseBlocks('-　\n后续').length).toBe(2)
  })

  it('keeps paragraph line breaks and parses rules and quotes', () => {
    const blocks = parseBlocks('**报告编号**：2026\n**报告时间**：2026-07-13\n\n---\n\n> 风险提示：关注担保')
    expect(blocks[0].type).toBe('paragraph')
    expect(blocks[0].lines.length).toBe(2)
    expect(blocks[1].type).toBe('rule')
    expect(blocks[2]).toEqual({ type: 'quote', lines: ['风险提示：关注担保'] })
  })

  it('parses fenced code blocks with language', () => {
    const blocks = parseBlocks('```json\n{"a":1}\n```')
    expect(blocks[0]).toEqual({ type: 'code', language: 'json', text: '{"a":1}' })
  })

  it('renders inline bold, code and links', () => {
    const h = mockH()
    const nodes = inlineNodes(h, '**加粗** 与 `code` 与 [链接](https://example.com)')
    expect(nodes[0].tag).toBe('strong')
    expect(nodes[0].children[0]).toBe('加粗')
    expect(nodes.find(node => node.tag === 'code').children[0]).toBe('code')
    const link = nodes.find(node => node.tag === 'a')
    expect(link.data.attrs.href).toBe('https://example.com')
  })

  it('renders markdown blocks to vnodes', () => {
    const h = mockH()
    const nodes = renderMarkdown(h, '# 标题\n\n普通段落\n\n| a | b |\n|---|---|\n| 1 | 2 |')
    expect(nodes[0].tag).toBe('h1')
    expect(nodes[1].tag).toBe('p')
    expect(nodes[2].tag).toBe('div')
    expect(nodes[2].children[0].tag).toBe('table')
  })
})
