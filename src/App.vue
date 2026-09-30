<template>
  <div id="app">
      <router-view />
  </div>
</template>

<script>
import { setFontSize, getCookies, setBgColor, resetVantStyle } from '@/utils/preference'
import { getFontSize, getBgColor } from './api/demo'

import Vue from 'vue'
import { Tabbar, TabbarItem } from 'vant'

Vue.use(Tabbar)
Vue.use(TabbarItem)

export default {
  name: 'App',
  async mounted() {
    // 从cookie 中 获取 fontSize
    const size = getCookies('fontSize') || '30'

    // 从mock中获取
    // let size = await getFontSize();
    // if(size){
    //   this.fontSize = size.data
    // }else{
    //   this.fontSize = '30' // 默认15px
    // }

    // 设置当前字体大小
    setFontSize(size)

    // 从cookie 中 获取 bgColor
    const bgColor = getCookies('bgColor') || '#ffffff'

    // 从mock中获取
    // let bgColorData = await getBgColor()
    // let bgColor = bgColorData.data.bgColor || '#ffffff'

    // 设置当前主体颜色
    setBgColor(bgColor)
    // 设置是否重置vant样式
    if (process.env.VUE_APP_VANT_RESET == 'true') {
      resetVantStyle(true)
    } else {
      resetVantStyle(false)
    }

  }
}
</script>

<style>
#app {
  font-family: "Helvetica", "Pingfang SC", "Hiragino Sans GB", "Arial", "Droid Sans", "Microsoft YaHei", "sans-serif";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  /* margin-top: 60px; */
}
.fade-enter{
  opacity:0
}
.fade-leave{
  opacity:1;
}
.fade-enetr-active{
  transition:opacity .5s
}
.fade-leave-active{
 opacity:0;
 transition:opacity .5s
}
</style>
