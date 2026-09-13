/*
 * @Author: your name
 * @Date: 2021-03-30 13:51:15
 * @LastEditTime: 2021-03-30 16:11:01
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: \mobile-template\src\permission.js
 */
import Vue from 'vue'
import router from './router'
import mockArr from '../mock/jsapi'   //引用 JSAPI 本地 MOCK 数据
import packageConfig from '../package.json' // 引用 package.json

// 判断是否登录
router.beforeEach((to, from, next) => {
  // 设置浏览器页签标题
  window.document.title = to.meta.title + ' - ' +packageConfig.qpcnName
  next()
})
