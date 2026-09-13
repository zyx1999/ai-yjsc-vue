<template>
  <div>
    <mt-header title="结果页组件" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>

    <!-- 结果页组件 -->
    <div class="result con_title">
      <h3><b>结果页组件</b></h3>
    </div>
    <UdResultPage info="交易成功">
      <img src="../../assets/images/index_toast.png" alt="">
    </UdResultPage>
    
    <UdResultPage info="交易失败">
      <img src="../../assets/images/index_loadMore.png" alt="">
    </UdResultPage>
  </div>
</template>
<script>
import { UdResultPage }  from '@udesk/mbank-ui-v2';

export default {
    components:{UdResultPage},
    data() {
        return {
            
        }
    },
    methods: {
        handleBack() {
          this.$router.go(-1)
        }
    },
}
</script>