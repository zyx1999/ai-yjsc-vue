import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
    {
      // 前端启动直接进入智能尽调助手
      path: '/',
      redirect: '/diligence'
    },{
      path: '/chat',
      name: 'chat',
      component: () => import (/*webpackChunkName:'chat'*/ '@/views/chat/index.vue'),
      meta: {
        title: 'AI智能助手',
        hideTabbar: true
      }
    },{
      path: '/diligence',
      name: 'diligence',
      component: () => import (/*webpackChunkName:'diligence'*/ '@/views/diligence/index.vue'),
      meta: {
        title: '智能尽调工作台',
        hideTabbar: true
      }
    },{
      path: '*',
      redirect: '/diligence'
    },
]

const router = new VueRouter({routes})

export default router
