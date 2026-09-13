import Vue from 'vue'
import App from '@/App' // 引用模板定义
import router from '@/router' // 引用路由定义
import store from '@/store' // 引用状态定义
import MintUI from 'mint-ui' // 引用 MintUI 组件库
import Vant from 'vant' // 引用 Vant 组件库
import '@/cube-ui' // 按需引用 cube-ui 组件库
import Echarts from 'echarts' // 引用 Echarts 组件库
import Axios from 'axios' // 引用 Axios 异步请求组件

import 'mint-ui/lib/style.css' // 引用 MintUI 样式
import 'mint-ui/src/assets/font/iconfont.css'
import '@/styles/base.scss' // 引用基础样式
import '@/styles/common.scss' // 重置 Vant 样式
import '@/assets/font/vant_font/index.css'
import '@/styles/mobileBank/index.scss' // 引用掌银风格样式
import '@udesk/mbank-ui-v2/lib/style/index.css'

import '@/permission' //获取accesskey/路由守卫
import '@/utils/rem-flexible' // 开启移动端屏幕尺寸适配
import '../mock' // 引用本地 Mock 模拟数据

Vue.prototype.$echarts = Echarts // 注册 Echarts
Vue.prototype.$axios = Axios // 注册 Axios
Vue.prototype.$axios.options.emulateJSON = true
Vue.use(Vant) // 注册 Vant
Vue.use(MintUI) // 注册 Vant


// 隐藏构建类型提示
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  render: h => h(App)
})

