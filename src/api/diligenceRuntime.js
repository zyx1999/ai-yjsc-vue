// 普通请求、SSE、文件下载必须使用同一个部署入口。
// 与主应用共用同一转发：window.__YUERONG_CONFIG__（部署后可直接改）> VUE_APP_BASE_API（主应用代理前缀，如 /dev-api）。
const configured = window.__YUERONG_CONFIG__ || {}
const base = configured.backendBaseUrl === undefined
  ? (process.env.VUE_APP_BASE_API || '') : configured.backendBaseUrl
if (typeof base !== 'string' || (base && !/^(https?:\/\/|\/(?!\/))/.test(base)) || /[?#\\\s]/.test(base)) {
  throw new Error('diligenceRuntime 的 backendBaseUrl 必须是HTTP(S)地址或同源路径')
}
export const backendBaseUrl = base.replace(/\/+$/, '')
export const chatTimeoutMs = configured.chatTimeoutMs === undefined ? 600000 : configured.chatTimeoutMs
if (!Number.isInteger(chatTimeoutMs) || chatTimeoutMs < 1000 || chatTimeoutMs > 1800000) {
  throw new Error('diligenceRuntime 的 chatTimeoutMs 必须是1000至1800000的整数毫秒')
}

export function backendUrl(path) {
  // 后端业务接口只返回相对API路径，不允许下载链接跳转任意站点。
  if (typeof path !== 'string' || !/^\/api\//.test(path) || /[\\\r\n]/.test(path)) {
    throw new Error('非法的后端API路径')
  }
  return backendBaseUrl + path
}
