/**
 * 对话时间工具：后端时间（'yyyy-MM-dd HH:mm:ss'）与浏览器解析的兼容处理。
 */
import { formatTime } from '@/utils/index'

/**
 * 将后端时间或时间戳转换为 Date。
 * @param {string|number|Date} value
 * @returns {Date|null}
 */
export function toDate (value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'number') {
    return new Date(value)
  }
  const text = String(value).replace(' ', 'T')
  const date = new Date(text)
  return isNaN(date.getTime()) ? null : date
}

/** 会话列表时间：相对时间（刚刚/分钟前…）。 */
export function prettyTime (value) {
  const date = toDate(value)
  if (!date) {
    return ''
  }
  return formatTime(date)
}

/** 消息时间：HH:mm。 */
export function shortTime (value) {
  const date = toDate(value)
  if (!date) {
    return ''
  }
  return formatTime(date, '{h}:{i}')
}

/** 附件大小格式化。 */
export function formatSize (bytes) {
  const value = Number(bytes) || 0
  if (value < 1024) {
    return value + ' B'
  }
  if (value < 1024 * 1024) {
    return (value / 1024).toFixed(1) + ' KB'
  }
  return (value / 1024 / 1024).toFixed(1) + ' MB'
}
