import axios from 'axios'
import { backendBaseUrl, backendUrl, chatTimeoutMs } from './diligenceRuntime'
const client = axios.create({
  baseURL: backendBaseUrl,
  withCredentials: true,
  timeout: chatTimeoutMs
})
client.interceptors.response.use(
  (response) => {
    const envelope = response.data || {}
    if (envelope.status !== 'SUCCEEDED')
      throw new Error((envelope.error || {}).message || '操作未完成')
    return envelope.data
  },
  (error) => {
    throw new Error(
      (((error.response || {}).data || {}).error || {}).message ||
        error.message ||
        '网络请求失败'
    )
  }
)
const root = '/api/v1/diligence'
export const sessions = () => client.get(root + '/sessions')
export const createSession = () => client.post(root + '/sessions')
export const loadSession = (task) =>
  client.get(root + '/sessions/' + encodeURIComponent(task))
export const deleteSession = (task) =>
  client.delete(root + '/sessions/' + encodeURIComponent(task))
export const call = (task, route, args) =>
  client.post(root + '/' + route, { task_id: task, arguments: args })
export const chat = (task, text) =>
  client.post(root + '/sessions/' + encodeURIComponent(task) + '/chat', {
    text
  })
export const upload = (task, code, role, file) => {
  const data = new FormData()
  data.append('file', file)
  data.append('credit_code', code)
  data.append('role', role)
  return client.post(
    root + '/sessions/' + encodeURIComponent(task) + '/files',
    data
  )
}
export const fileUrl = (task, id) =>
  backendUrl(
    root +
      '/sessions/' +
      encodeURIComponent(task) +
      '/files/' +
      encodeURIComponent(id)
  )
export const catalogue = () => client.get(root + '/catalog')

export const proposalFiles = (task, id) =>
  client.get(
    root +
      '/sessions/' +
      encodeURIComponent(task) +
      '/proposals/' +
      encodeURIComponent(id) +
      '/files'
  )

// 服务端模型等待可能接近超时上限，客户端额外留出宽限，避免与服务端超时同时触发造成误判。
const STREAM_GRACE_MS = 120000

/** 连接未完整结束时的可恢复错误：后端可能仍在运行，调用方应轮询会话取得结果。 */
function pendingError(message) {
  const error = new Error(message)
  error.pending = true
  return error
}

// —— SSE 流日志：默认开启；浏览器控制台执行 localStorage.setItem('diligence.sseLog','0') 可关闭 ——
const SSE_LOG_PREFIX = '[SSE]'

function sseLogEnabled() {
  try {
    return window.localStorage.getItem('diligence.sseLog') !== '0'
  } catch (e) {
    return true
  }
}

function sseLog(level) {
  if (!sseLogEnabled()) return
  const args = Array.prototype.slice.call(arguments, 1)
  const logger = console[level] || console.log
  logger.apply(console, [SSE_LOG_PREFIX].concat(args))
}

// POST SSE over XHR keeps the existing browser stack; disconnect never resends a message.
export function streamChat(task, text, onEvent, attachment) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const elapsed = () => Date.now() - startedAt + 'ms'
    const xhr = new XMLHttpRequest()
    xhr.open(
      'POST',
      backendUrl(
        root + '/sessions/' + encodeURIComponent(task) + '/chat/events'
      )
    )
    xhr.withCredentials = true
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Accept', 'text/event-stream')
    xhr.timeout = chatTimeoutMs + STREAM_GRACE_MS
    sseLog('info', '开始', {
      task: task,
      textLength: text ? text.length : 0,
      attachment: !!attachment,
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
          const e = JSON.parse(data)
          if (e.sequence <= sequence) continue
          sequence = e.sequence
          frames += 1
          sseLog('log', '#' + e.sequence, e.type, elapsed(), e.payload)
          onEvent(e)
          if (
            ['run.completed', 'run.failed', 'run.unknown'].indexOf(e.type) >= 0
          )
            terminal = true
        } catch (err) {
          sseLog('error', '事件格式无效', elapsed(), data.slice(0, 200))
          reject(new Error('事件格式无效'))
          xhr.abort()
        }
      }
    }
    xhr.onload = () => {
      xhr.onprogress()
      if (xhr.status >= 200 && xhr.status < 300 && terminal) {
        sseLog('info', '流结束', { status: xhr.status, frames: frames, elapsed: elapsed() })
        resolve()
      } else {
        sseLog('warn', '连接未完整结束', {
          status: xhr.status,
          frames: frames,
          terminal: terminal,
          elapsed: elapsed()
        })
        reject(pendingError('连接未完整结束，正在等待后端结果'))
      }
    }
    xhr.onerror = xhr.ontimeout = () => {
      sseLog('warn', '连接中断', { frames: frames, elapsed: elapsed() })
      reject(pendingError('连接中断，正在等待后端结果'))
    }
    xhr.send(JSON.stringify(attachment ? { text, attachment } : { text }))
  })
}
