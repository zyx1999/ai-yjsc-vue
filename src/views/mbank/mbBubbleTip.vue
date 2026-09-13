<template>
  <div class="tip-wrapper">
    <mt-header title="气泡提示" class='bank-header' fixed>
    <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>   
    <!-- 提交按钮属自定义的触发事件 -->
    <div class="pushBtn" @click="isTipshow">提交</div>
    <UdBubbleTip  v-if="isShow" @visible="visible"  content="气泡提示框" :timer="timer">
    </UdBubbleTip>
  </div>
</template>
<script>
import { UdBubbleTip } from '@udesk/mbank-ui-v2';
export default {
    components: { UdBubbleTip },
   data(){
        return{
            isShow: false,
            timer: 1000
        }
    }, 
    methods: {
        isTipshow() {
            this.isShow = true
        },
        visible(){
            this.isShow = false
        },
        handleBack() {
          this.$router.go(-1)
        }
    }
}
</script>
<style lang="scss" scoped>
.pushBtn {
    margin: 180px;
    text-align: center;
}
</style>