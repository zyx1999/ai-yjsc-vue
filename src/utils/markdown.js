/**
 * 轻量 Markdown 解析与渲染工具（纯函数，无第三方依赖，便于单测）。
 *
 * 覆盖大模型常见的报告型输出：
 * - 块级：标题 / 段落 / 引用 / 有序、无序列表 / 表格 / 围栏代码 / 分隔线；
 * - 行内：**加粗**、*斜体*、`行内代码`、链接；段落内换行渲染为 <br>。
 *
 * 解析保持"宽容"策略：不完整或未闭合的语法按普通文本渲染，适合流式/长文输出。
 */

export function isTableDivider (line) {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')))
}

export function splitTableRow (line) {
  let value = String(line || '').trim()
  if (value.charAt(0) === '|') value = value.slice(1)
  if (value.charAt(value.length - 1) === '|') value = value.slice(0, -1)
  return value.split('|').map(cell => cell.trim())
}

function startsBlock (lines, index) {
  const line = lines[index] || ''
  if (!line.trim()) return true
  if (/^```/.test(line.trim()) || /^(#{1,6})\s+/.test(line) || /^>\s?/.test(line)) return true
  if (/^\s*[-+*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line) || /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) return true
  return index + 1 < lines.length && line.indexOf('|') >= 0 && isTableDivider(lines[index + 1])
}

/** 将 Markdown 源文本解析为块级结构数组。 */
export function parseBlocks (source) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = line.trim().match(/^```\s*([^\s`]*)/)
    if (fence) {
      const code = []
      index += 1
      while (index < lines.length && !/^```\s*$/.test(lines[index].trim())) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      blocks.push({ type: 'code', language: fence[1] || '', text: code.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      index += 1
      continue
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: 'rule' })
      index += 1
      continue
    }

    if (index + 1 < lines.length && line.indexOf('|') >= 0 && isTableDivider(lines[index + 1])) {
      const rows = []
      const header = splitTableRow(line)
      index += 2
      while (index < lines.length && lines[index].trim() && lines[index].indexOf('|') >= 0) {
        rows.push(splitTableRow(lines[index]))
        index += 1
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    if (/^>\s?/.test(line)) {
      const quote = []
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push({ type: 'quote', lines: quote })
      continue
    }

    const unordered = /^\s*[-+*]\s+/.test(line)
    const ordered = /^\s*\d+\.\s+/.test(line)
    if (unordered || ordered) {
      const matcher = unordered ? /^\s*[-+*]\s+(.+)$/ : /^\s*\d+\.\s+(.+)$/
      const items = []
      while (index < lines.length) {
        const item = lines[index].match(matcher)
        if (!item) break
        items.push(item[1])
        index += 1
      }
      blocks.push({ type: ordered ? 'ordered-list' : 'unordered-list', items })
      continue
    }

    const paragraph = [line]
    index += 1
    while (index < lines.length && lines[index].trim() && !startsBlock(lines, index)) {
      paragraph.push(lines[index])
      index += 1
    }
    blocks.push({ type: 'paragraph', lines: paragraph })
  }
  return blocks
}

/** 行内语法：加粗、斜体、行内代码、链接。 */
export function inlineNodes (h, source) {
  const text = String(source || '')
  const nodes = []
  const token = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\))|(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)/g
  let cursor = 0
  let match
  while ((match = token.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index))
    const value = match[0]
    if (value.charAt(0) === '[') {
      const link = value.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
      nodes.push(h('a', { attrs: { href: link[2], target: '_blank', rel: 'noopener noreferrer' } }, [link[1]]))
    } else if (value.charAt(0) === '`') {
      nodes.push(h('code', [value.slice(1, -1)]))
    } else if (value.slice(0, 2) === '**' || value.slice(0, 2) === '__') {
      nodes.push(h('strong', [value.slice(2, -2)]))
    } else {
      nodes.push(h('em', [value.slice(1, -1)]))
    }
    cursor = token.lastIndex
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

/** 段落/引用内按行渲染，行间以 <br> 连接。 */
export function linesWithBreaks (h, lines) {
  const nodes = []
  lines.forEach((line, index) => {
    if (index) nodes.push(h('br'))
    Array.prototype.push.apply(nodes, inlineNodes(h, line))
  })
  return nodes
}

/**
 * 将 Markdown 源文本渲染为 vnode 数组（由调用组件放入容器元素）。
 * @param {Function} h createElement
 * @param {string} source Markdown 原文
 * @returns {Array} vnode 数组
 */
export function renderMarkdown (h, source) {
  return parseBlocks(source).map((block, blockIndex) => {
    const key = `markdown-${blockIndex}`
    if (block.type === 'heading') return h(`h${block.level}`, { key }, inlineNodes(h, block.text))
    if (block.type === 'rule') return h('hr', { key })
    if (block.type === 'code') {
      const attrs = block.language ? { 'data-language': block.language } : {}
      return h('pre', { key }, [h('code', { attrs }, [block.text])])
    }
    if (block.type === 'quote') return h('blockquote', { key }, linesWithBreaks(h, block.lines))
    if (block.type === 'unordered-list' || block.type === 'ordered-list') {
      const tag = block.type === 'ordered-list' ? 'ol' : 'ul'
      return h(tag, { key }, block.items.map((item, itemIndex) => h('li', { key: `${key}-${itemIndex}` }, inlineNodes(h, item))))
    }
    if (block.type === 'table') {
      const head = h('thead', [h('tr', block.header.map((cell, cellIndex) => h('th', { key: `${key}-h-${cellIndex}` }, inlineNodes(h, cell))))])
      const body = h('tbody', block.rows.map((row, rowIndex) => h('tr', { key: `${key}-r-${rowIndex}` }, block.header.map((cell, cellIndex) => h('td', { key: `${key}-c-${rowIndex}-${cellIndex}` }, inlineNodes(h, row[cellIndex] || ''))))))
      return h('div', { key, class: 'markdown-table-wrap' }, [h('table', [head, body])])
    }
    return h('p', { key }, linesWithBreaks(h, block.lines))
  })
}
