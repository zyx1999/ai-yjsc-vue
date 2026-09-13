<template>
  <div class="dialog_wrapper">
      <UdNotice
        v-if='data.isShow'
            :title="data.title"
            :content="data.content"
            :operation="data.operation"
            :autoClose="false"
            @cancel='cancel'
            @clickBg='clickBg'
      >
      </UdNotice>
  </div>
</template>
<script>
import { UdNotice } from '@udesk/mbank-ui-v2';
export default {
  name: 'SingleDialog',
  props: ['data'],
  components: { UdNotice },
  data(){
      return {
          isShow: false,
      }
  },
  methods:{
        toShow(){
            this.data.isShow = true;
        },
        cancel(){
            // 点击关闭的回调
            this.data.isShow = false;
        },
        clickBg(){
            this.data.isShow = false;
        }
    },
  
}
</script>