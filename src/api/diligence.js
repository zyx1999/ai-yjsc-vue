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

// POST SSE over XHR keeps the existing browser stack; disconnect never resends a message.
export function streamChat(task, text, onEvent, attachment) {
  return new Promise((resolve, reject) => {
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
    xhr.timeout = chatTimeoutMs
    let offset = 0
    let pending = ''
    let sequence = 0
    let terminal = false
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
        if (!data) continue
        try {
          const e = JSON.parse(data)
          if (e.sequence <= sequence) continue
          sequence = e.sequence
          onEvent(e)
          if (
            ['run.completed', 'run.failed', 'run.unknown'].indexOf(e.type) >= 0
          )
            terminal = true
        } catch (err) {
          reject(new Error('事件格式无效'))
          xhr.abort()
        }
      }
    }
    xhr.onload = () => {
      xhr.onprogress()
      if (xhr.status >= 200 && xhr.status < 300 && terminal) resolve()
      else reject(new Error('连接未完整结束，请重新读取会话核实结果'))
    }
    xhr.onerror = xhr.ontimeout = () =>
      reject(new Error('连接中断，请核实结果，不要重复提交'))
    xhr.send(JSON.stringify(attachment ? { text, attachment } : { text }))
  })
}
