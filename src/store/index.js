import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import indexNav from './modules/indexNav'
import chat from './modules/chat'
Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    indexNav,
    chat
  },
  getters
})

export default store