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
    },
    ...mbRouters
]

const router = new VueRouter({routes})

export default router
