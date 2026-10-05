/**
 * 尽调工作台样式/组件引导。
 *
 * Element UI 与本页样式仅在本路由的懒加载分包中引入：只有访问 /diligence 时才会注册组件、
 * 加载 Element 主题与本页 SCSS，避免影响移动端掌银页面。
 */
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import '@/styles/diligence.scss'

Vue.use(ElementUI, { size: 'small' })
