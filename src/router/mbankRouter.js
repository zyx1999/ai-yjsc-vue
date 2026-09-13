import mbDialog from '@/views/mbank/mbDialog.vue'
import indexMb from '@/views/indexMb.vue'
import mbButton from '@/views/mbank/mbButton.vue'
import bottomDialog from '@/views/mbank/bottomDialog.vue'
import mbKeyboard from '@/views/mbank/mbKeyboard.vue'
import mbBubbleTip from '@/views/mbank/mbBubbleTip.vue'
import mbList from '@/views/mbank/mbList.vue'
import mbFormInput from '@/views/mbank/mbFormInput.vue'
import mbFormInput1 from '@/views/mbank/mbFormInput1.vue'
import mbResult from '@/views/mbank/mbResult.vue'
import mbStatus from '@/views/mbank/mbStatus.vue'
import mbResultProgress from '@/views/mbank/mbResultProgress.vue'
import mbInputSearch from '@/views/mbank/mbInputSearch.vue'
import mbDate from '@/views/mbank/mbDate.vue'

const routes = [
  {
    path: '/indexMb',
    name: 'indexMb',
    component: indexMb,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //普通弹框组件
    path: '/mbDialog',
    name: 'mbDialog',
    component: mbDialog,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //底部弹框组件
    path: '/bottomDialog',
    name: 'bottomDialog',
    component: bottomDialog,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //键盘组件
    path: '/mbKeyboard',
    name: 'mbKeyboard',
    component: mbKeyboard,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //按钮组件
    path: '/mbButton',
    name: 'mbButton',
    component: mbButton,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //气泡组件
    path: '/mbBubbleTip',
    name: 'mbBubbleTip',
    component: mbBubbleTip,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //列表组件
    path: '/mbList',
    name: 'mbList',
    component: mbList,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //输入组件
    path: '/mbFormInput',
    name: 'mbFormInput',
    component: mbFormInput,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //输入组件
    path: '/mbFormInput1',
    name: 'mbFormInput1',
    component: mbFormInput1,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //结果组件
    path: '/mbResult',
    name: 'mbResult',
    component: mbResult,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //状态组件
    path: '/mbStatus',
    name: 'mbStatus',
    component: mbStatus,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //结果交易进度轴组件
    path: '/mbResultProgress',
    name: 'mbResultProgress',
    component: mbResultProgress,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //搜索框组件
    path: '/mbInputSearch',
    name: 'mbInputSearch',
    component: mbInputSearch,
    img: 'list_toast',
    image: 'index_toast'
  },
  {  //搜索框组件
    path: '/mbDate',
    name: 'mbDate',
    component: mbDate,
    img: 'list_toast',
    image: 'index_toast'
  }
]
export default routes
