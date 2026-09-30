/**
 * SSE 帧解析（纯函数，便于单测）：
 * - 跨 chunk 缓冲，按空行（\n\n）切分帧；
 * - 合并多行 data:，忽略注释行与控制字段（id:/retry:）。
 */

/**
 * 创建帧缓冲器。
 * @returns {{ push: function(string): Array<{event: string, data: string}>, reset: function(): void }}
 */
export function createFrameBuffer () {
  let pending = ''
  return {
    push (chunk) {
      pending += String(chunk || '')
      // 统一换行（chunk 边界处已拼合的 \r\n 在此转换）
      pending = pending.replace(/\r\n/g, '\n')
      const frames = []
      let index
      while ((index = pending.indexOf('\n\n')) >= 0) {
        const raw = pending.slice(0, index)
        pending = pending.slice(index + 2)
        const frame = parseFrame(raw)
        if (frame) {
          frames.push(frame)
        }
      }
      return frames
    },
    reset () {
      pending = ''
    }
  }
}

/**
 * 解析单个原始帧文本。
 * @param {string} raw
 * @returns {{event: string, data: string}|null} 无 data 的帧（如注释）返回 null
 */
export function parseFrame (raw) {
  const lines = String(raw || '').split('\n')
  let event = 'message'
  const dataLines = []
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line.charCodeAt(line.length - 1) === 13) {
      line = line.slice(0, line.length - 1)
    }
    if (line.indexOf('event:') === 0) {
      event = line.slice(6).trim()
    } else if (line.indexOf('data:') === 0) {
      let value = line.slice(5)
      if (value.charAt(0) === ' ') {
        value = value.slice(1)
      }
      dataLines.push(value)
    }
  }
  if (dataLines.length === 0) {
    return null
  }
  return { event: event, data: dataLines.join('\n') }
}
