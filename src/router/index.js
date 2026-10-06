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
      // 征信分析窗口：上传征信报告，大模型输出 Markdown 分析报告
      path: '/analysis/credit',
      name: 'analysisCredit',
      component: () => import (/*webpackChunkName:'analysis'*/ '@/views/analysis/index.vue'),
      props: { kind: 'credit' },
      meta: {
        title: '征信分析',
        hideTabbar: true
      }
    },{
      // 流水分析窗口：上传银行流水，大模型输出 Markdown 分析报告
      path: '/analysis/bankflow',
      name: 'analysisBankflow',
      component: () => import (/*webpackChunkName:'analysis'*/ '@/views/analysis/index.vue'),
      props: { kind: 'bankflow' },
      meta: {
        title: '流水分析',
        hideTabbar: true
      }
    },{
      path: '*',
      redirect: '/diligence'
    },
]

const router = new VueRouter({routes})

export default router
