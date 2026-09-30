/**
 * 消息 SSE 流（POST over XHR，兼容性优先）：
 * - 事件：run.started / run.progress / answer.completed / run.completed / run.failed / run.unknown；
 * - 按 sequence 去重；收到终止事件（run.completed / run.failed / run.unknown）后正常结束；
 * - 断流、超时与未收到终止事件均视为失败（结果未知），由调用方提示刷新会话核实。
 */
import { createFrameBuffer } from '@/utils/sseParser'

const TERMINAL_EVENTS = ['run.completed', 'run.failed', 'run.unknown']

/**
 * 发送消息并消费 SSE 事件流。
 * @param {number|string} sessionId 业务会话 id
 * @param {{text: string, attachmentIds?: Array<number>}} payload
 * @param {{onEvent?: Function, timeoutMs?: number}} options
 * @returns {{promise: Promise, abort: Function}}
 */
export function streamMessage (sessionId, payload, options) {
  const opts = options || {}
  const onEvent = opts.onEvent || function () {}
  // 后端读取云虾默认 5 分钟（AI_READ_TIMEOUT_MS），前端留 1 分钟余量
  const timeoutMs = opts.timeoutMs || 360000
  const url = (process.env.VUE_APP_BASE_API || '') + '/api/v1/chat/sessions/' +
    encodeURIComponent(sessionId) + '/messages'

  const xhr = new XMLHttpRequest()
  xhr.open('POST', url)
  xhr.withCredentials = true
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.setRequestHeader('Accept', 'text/event-stream')
  xhr.timeout = timeoutMs

  const buffer = createFrameBuffer()
  let offset = 0
  let sequence = 0
  let terminal = false
  let finished = false

  const promise = new Promise((resolve, reject) => {
    const settle = (fn, value) => {
      if (!finished) {
        finished = true
        fn(value)
      }
    }

    const consume = () => {
      const chunk = xhr.responseText.slice(offset)
      offset = xhr.responseText.length
      if (!chunk) {
        return
      }
      let frames
      try {
        frames = buffer.push(chunk)
      } catch (error) {
        xhr.abort()
        settle(reject, new Error('事件格式无效'))
        return
      }
      for (let i = 0; i < frames.length; i++) {
        let parsed
        try {
          parsed = JSON.parse(frames[i].data)
        } catch (error) {
          xhr.abort()
          settle(reject, new Error('事件格式无效'))
          return
        }
        if (typeof parsed.sequence === 'number') {
          if (parsed.sequence <= sequence) {
            continue
          }
          sequence = parsed.sequence
        }
        onEvent(parsed)
        if (TERMINAL_EVENTS.indexOf(parsed.type) >= 0) {
          terminal = true
        }
      }
    }

    xhr.onprogress = consume

    xhr.onload = () => {
      consume()
      const ok = xhr.status >= 200 && xhr.status < 300
      if (ok && terminal) {
        settle(resolve)
        return
      }
      if (ok) {
        settle(reject, new Error('连接未完整结束，请重新进入会话核实结果'))
        return
      }
      let message = '请求失败（HTTP ' + xhr.status + '）'
      try {
        const body = JSON.parse(xhr.responseText)
        if (body && body.message) {
          message = body.message
        }
      } catch (ignored) {
        // 非 JSON 响应体，使用默认提示
      }
      settle(reject, new Error(message))
    }

    xhr.onerror = () => settle(reject, new Error('网络异常，连接中断'))
    xhr.ontimeout = () => settle(reject, new Error('响应超时，请重新进入会话核实结果'))
    xhr.onabort = () => {
      const error = new Error('已停止等待')
      error.aborted = true
      settle(reject, error)
    }

    xhr.send(JSON.stringify(payload))
  })

  return {
    promise: promise,
    abort: () => xhr.abort()
  }
}
