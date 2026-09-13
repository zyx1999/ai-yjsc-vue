import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import indexNav from './modules/indexNav'
Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    indexNav
  },
  getters
})

export default store