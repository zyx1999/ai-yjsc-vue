/**
 * 征信 / 流水分析窗口（文答）的会话 API。
 *
 * 对接后端新增的 /api/v1/analysis 接口（与尽调同源，调用方式参考 src/api/diligence.js）：
 * - 独立 axios 客户端，使用运行时配置的 backendBaseUrl（部署后可直接改）；
 * - 会话创建 / 读取、材料上传语义化导出，不依赖登录态；
 * - streamChat：POST over XHR 的 SSE 会话调用，带序列号去重、终态事件识别、
 *   [SSE] 调试日志（与尽调共用开关），断流/超时按“结果待核实”处理（error.pending，
 *   由调用方轮询会话恢复结果）。
 */
import axios from 'axios'
import { backendBaseUrl, backendUrl, chatTimeoutMs } from './diligenceRuntime'

const root = '/api/v1/analysis'

const client = axios.create({
  baseURL: backendBaseUrl,
  withCredentials: true,
  timeout: chatTimeoutMs
})

function unwrap (response) {
  const envelope = response.data || {}
  if (envelope.status !== 'SUCCEEDED') {
    const error = new Error((envelope.error || {}).message || '操作未完成')
    error.status = response.status || 0
    throw error
  }
  return envelope.data
}

function wrapError (error) {
  const response = error.response || {}
  const body = response.data || {}
  const wrapped = new Error(
    (body.error || {}).message || body.message || error.message || '网络请求失败'
  )
  wrapped.status = response.status || 0
  return wrapped
}

function request (config) {
  return client.request(config).then(unwrap, error => {
    throw wrapError(error)
  })
}

/** 创建分析会话（不触发登录）。 */
export function createSession () {
  return request({ url: root + '/sessions', method: 'post' })
}

/** 读取会话详情（用于断流后核实结果），返回 { session, messages }。 */
export function loadSession (sessionId) {
  return request({
    url: root + '/sessions/' + encodeURIComponent(sessionId),
    method: 'get'
  })
}

/** 上传分析材料（材料挂在会话下，供对话时引用）。 */
export function uploadFile (sessionId, file) {
  const data = new FormData()
  data.append('file', file)
  return request({
    url: root + '/sessions/' + encodeURIComponent(sessionId) + '/files',
    method: 'post',
    data: data,
    timeout: 120000
  })
}

/** 当前会话文件列表（平台工作区文件与后端已登记材料合并）。 */
export function listFiles (sessionId) {
  return request({
    url: root + '/sessions/' + encodeURIComponent(sessionId) + '/files',
    method: 'get'
  })
}

// 服务端模型等待可能接近超时上限，客户端额外留出宽限，避免与服务端超时同时触发造成误判。
const STREAM_GRACE_MS = 120000

/** 连接未完整结束时的可恢复错误：后端可能仍在运行，调用方应轮询会话取得结果。 */
function pendingError (message) {
  const error = new Error(message)
  error.pending = true
  return error
}

// —— SSE 流日志：与尽调共用开关；浏览器控制台执行 localStorage.setItem('diligence.sseLog','0') 可关闭 ——
const SSE_LOG_PREFIX = '[SSE]'

function sseLogEnabled () {
  try {
    return window.localStorage.getItem('diligence.sseLog') !== '0'
  } catch (e) {
    return true
  }
}

function sseLog (level) {
  if (!sseLogEnabled()) return
  const args = Array.prototype.slice.call(arguments, 1)
  const logger = console[level] || console.log
  logger.apply(console, [SSE_LOG_PREFIX].concat(args))
}

/** 日志摘要：去掉协议样板字段，保留业务字段（content/message/stage/code 等）。 */
function eventDetail (event) {
  const skipped = ['contract_version', 'event_id', 'run_id', 'sequence', 'type']
  const detail = {}
  Object.keys(event).forEach(key => {
    if (skipped.indexOf(key) < 0) detail[key] = event[key]
  })
  return detail
}

/**
 * 发送分析消息并消费 SSE 事件流（POST over XHR，兼容性优先）。
 * @param {string|number} sessionId 会话 id
 * @param {string} text 分析要求
 * @param {Array} attachmentIds 会话内附件 id 列表
 * @param {Function} onEvent 事件回调（run.progress / answer.completed / run.failed / run.unknown 等）
 * @returns {{promise: Promise, abort: Function}} 断流/超时时 promise 以 error.pending=true 拒绝
 */
export function streamChat (sessionId, text, attachmentIds, onEvent) {
  const url = backendUrl(root + '/sessions/' + encodeURIComponent(sessionId) + '/chat/events')
  const xhr = new XMLHttpRequest()
  let finished = false
  let rejectPending = null

  const promise = new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const elapsed = () => Date.now() - startedAt + 'ms'
    const settle = (fn, value) => {
      if (finished) return
      finished = true
      fn(value)
    }
    rejectPending = (message) => settle(reject, pendingError(message))

    xhr.open('POST', url)
    xhr.withCredentials = true
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Accept', 'text/event-stream')
    xhr.timeout = chatTimeoutMs + STREAM_GRACE_MS
    sseLog('info', '开始', {
      sessionId: sessionId,
      textLength: text ? text.length : 0,
      attachments: (attachmentIds || []).length,
      timeoutMs: xhr.timeout
    })

    let offset = 0
    let pending = ''
    let sequence = 0
    let terminal = false
    let frames = 0

    xhr.onprogress = () => {
      pending += xhr.responseText.slice(offset)
      offset = xhr.responseText.length
      pending = pending.replace(/\r\n/g, '\n')
      let boundary
      while ((boundary = pending.indexOf('\n\n')) >= 0) {
        const frame = pending.slice(0, boundary)
        pending = pending.slice(boundary + 2)
        const data = frame
          .split('\n')
          .filter((line) => line.indexOf('data:') === 0)
          .map((line) => line.slice(5).trim())
          .join('\n')
        if (!data) {
          // 无 data 行：心跳/注释帧（如 :keep-alive），不参与业务。
          if (frame.trim()) sseLog('debug', '心跳帧', elapsed(), frame.trim().slice(0, 80))
          continue
        }
        try {
          const event = JSON.parse(data)
          if (event.sequence <= sequence) continue
          sequence = event.sequence
          frames += 1
          sseLog('log', '#' + event.sequence, event.type, elapsed(), eventDetail(event))
          onEvent(event)
          if (
            ['run.completed', 'run.failed', 'run.unknown'].indexOf(event.type) >= 0
          )
            terminal = true
        } catch (err) {
          sseLog('error', '事件格式无效', elapsed(), data.slice(0, 200))
          settle(reject, new Error('事件格式无效'))
          xhr.abort()
        }
      }
    }

    xhr.onload = () => {
      xhr.onprogress()
      if (xhr.status >= 200 && xhr.status < 300 && terminal) {
        sseLog('info', '流结束', { status: xhr.status, frames: frames, elapsed: elapsed() })
        settle(resolve)
      } else if (xhr.status >= 400) {
        // 会话不存在/运行被占用等 HTTP 失败：直接展示后端错误，不做“待核实”等待。
        let message = '请求失败（HTTP ' + xhr.status + '）'
        try {
          const body = JSON.parse(xhr.responseText)
          message = (body.error || {}).message || message
        } catch (ignored) {
          // 非 JSON 响应体使用默认提示
        }
        sseLog('warn', '请求被拒绝', { status: xhr.status, message: message })
        settle(reject, new Error(message))
      } else {
        sseLog('warn', '连接未完整结束', {
          status: xhr.status,
          frames: frames,
          terminal: terminal,
          elapsed: elapsed()
        })
        rejectPending('连接未完整结束，正在等待后端结果')
      }
    }

    xhr.onerror = xhr.ontimeout = () => {
      sseLog('warn', '连接中断', { frames: frames, elapsed: elapsed() })
      rejectPending('连接中断，正在等待后端结果')
    }

    xhr.onabort = () => {
      const error = new Error('已停止等待')
      error.aborted = true
      settle(reject, error)
    }

    try {
      xhr.send(JSON.stringify((attachmentIds && attachmentIds.length) ? { text, attachment_ids: attachmentIds } : { text }))
    } catch (error) {
      settle(reject, error)
    }
  })

  return {
    promise: promise,
    abort: () => {
      if (!finished) xhr.abort()
    }
  }
}
