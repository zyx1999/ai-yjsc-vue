/**
 * 对话 REST API：统一携带会话 Cookie；未登录时自动演示登录并重试一次。
 */
import axios from 'axios'

const baseURL = process.env.VUE_APP_BASE_API || ''

const client = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true
})

let loginPromise = null

function wrapError (error) {
  const response = error.response || {}
  const body = response.data || {}
  const wrapped = new Error(body.message || error.message || '网络请求失败')
  wrapped.status = response.status || 0
  return wrapped
}

function unwrap (response) {
  const envelope = response.data || {}
  if (!envelope.success) {
    throw new Error(envelope.message || '操作未完成')
  }
  return envelope.data
}

function request (config) {
  return client.request(config).then(unwrap, error => {
    throw wrapError(error)
  })
}

/** 演示登录（幂等；401 时强制重新登录）。 */
export function ensureLogin (force) {
  if (force) {
    loginPromise = null
  }
  if (!loginPromise) {
    loginPromise = client.post('/api/v1/auth/demo-login').then(unwrap, error => {
      loginPromise = null
      throw wrapError(error)
    })
  }
  return loginPromise
}

function withLogin (call) {
  return ensureLogin().then(call).catch(error => {
    if (error.status === 401) {
      return ensureLogin(true).then(call)
    }
    throw error
  })
}

export function listSessions () {
  return withLogin(() => request({ url: '/api/v1/chat/sessions', method: 'get' }))
}

export function createSession () {
  return withLogin(() => request({ url: '/api/v1/chat/sessions', method: 'post' }))
}

export function getSession (sessionId) {
  return withLogin(() => request({
    url: '/api/v1/chat/sessions/' + encodeURIComponent(sessionId),
    method: 'get'
  }))
}

export function renameSession (sessionId, title) {
  return withLogin(() => request({
    url: '/api/v1/chat/sessions/' + encodeURIComponent(sessionId),
    method: 'patch',
    data: { title: title }
  }))
}

export function deleteSession (sessionId) {
  return withLogin(() => request({
    url: '/api/v1/chat/sessions/' + encodeURIComponent(sessionId),
    method: 'delete'
  }))
}

export function uploadAttachment (sessionId, file) {
  const data = new FormData()
  data.append('file', file)
  return withLogin(() => request({
    url: '/api/v1/chat/sessions/' + encodeURIComponent(sessionId) + '/attachments',
    method: 'post',
    data: data,
    timeout: 120000
  }))
}

/** 附件下载地址（经后端代理，浏览器直连）。 */
export function attachmentUrl (sessionId, attachmentId) {
  return baseURL + '/api/v1/chat/sessions/' + encodeURIComponent(sessionId) +
    '/attachments/' + encodeURIComponent(attachmentId) + '/content'
}

export function health () {
  return request({ url: '/api/v1/chat/health', method: 'get' })
}
