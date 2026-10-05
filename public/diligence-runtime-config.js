// 智能尽调工作台部署后可直接修改，无需重新 npm run build。这里只允许公开的后端连接信息。
// backendBaseUrl：尽调后端地址。留空不设置时使用构建期 VUE_APP_BASE_API（与主应用共用同一转发）；
// 推荐同源反向代理，此时可设为 ''；独立上下文（如 WAR 部署在 /diligence）可设为 '/diligence'。
window.__YUERONG_CONFIG__ = {
  // backendBaseUrl: '',
  chatTimeoutMs: 600000
};
