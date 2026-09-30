import Vue from 'vue'
import VueRouter from 'vue-router'
import mbRouters from './mbankRouter'

Vue.use(VueRouter)

const routes = [
    {
      path: '/',
      name: 'home',
      component: () => import (/*webpackChunkName:'home'*/ '@/views/indexMb.vue'),
      meta: {
        title: '首页'
      }
    },{
      path: '/mine',
      name: 'mine',
      component: () => import (/*webpackChunkName:'home'*/ '@/views/mine.vue'),
      meta: {
        title: '我的'
      }
    },{
      path: '/chat',
      name: 'chat',
      component: () => import (/*webpackChunkName:'chat'*/ '@/views/chat/index.vue'),
      meta: {
        title: 'AI智能助手',
        hideTabbar: true
      }
    },
    ...mbRouters
]

const router = new VueRouter({routes})

export default router
