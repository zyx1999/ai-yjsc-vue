<template>
  <div class="mb-status">
    <mt-header title="状态页组件" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>

    <!-- 结果页组件 -->
    <div class="status con_title">
      <h3><b>状态页组件</b></h3>
    </div>

    <UdStatusPage info="暂无产品">
        <img src="../../assets/images/order-tabbar.png">
    </UdStatusPage>
    
  </div>
</template>
<script>
import { UdStatusPage } from '@udesk/mbank-ui-v2';

export default {
    components:{UdStatusPage },
    data() {
      return {
          
      }
    },
    methods: {
      handleBack(){
        this.$router.go(-1)
      }
    },
}
</script>
<style lang="scss">
.mb-status .UdStatusPage_wrapper .statusIcon {
    width: 3rem!important;
    height: 3rem!important;
}
</style>
<style lang="scss" scoped>
.mb-status {
    .status {
        margin-top: 100px;
    }
}
</style>