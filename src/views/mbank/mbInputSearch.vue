<template>
  <div class="mb-search">
    <mt-header title="搜索组件" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>

    <!-- 搜索组件 -->
    <div class="status con_title">
      <h3><b>搜索框组件(不包括具体搜索功能)</b></h3>
    </div>
    
    <div class="input_wrapper">
      <UdInputSearch placeholder="输入基金名称或代码" v-model="value" />
    </div>

    <p class="m-top">为您推荐</p>
      <div class="list">
        <UdLabelSearch msg="农银快e宝">
            <img src="../../assets/images/pineapple.png"/>
        </UdLabelSearch>
        <UdLabelSearch msg="农银策略精选混合">
            <img src="../../assets/images/pineapple.png"/>
        </UdLabelSearch>
        <UdLabelSearch msg="农银红利日结">
            <img src="../../assets/images/pineapple.png"/>
        </UdLabelSearch>
        <UdLabelSearch msg="农银中国优势混合">
            <img src="../../assets/images/pineapple.png"/>
        </UdLabelSearch>
      </div>
        
    <p class="m-top">历史搜索</p>
        <UdLabelHis :msgs="msgs"/>
    <p class="m-top" @click="msgs=[];" style="text-align:center;color:#666">清空搜索历史</p>
        
  </div>
</template>
<script>
import { UdInputSearch,UdLabelSearch ,UdLabelHis} from '@udesk/mbank-ui-v2'

export default {
    components:{ UdInputSearch,UdLabelSearch,UdLabelHis },
    data() {
      return {
        value:'',
        msgs: ['大家都在讨论1','大家都在讨论2','大家都在讨论3','大家都在讨论4'],
      }
    },
    methods: {
      handleBack() {
        this.$router.go(-1)
      }
    },
}
</script>
<style lang="scss">
.mb-search .UdLabelSearch_wrapper {
    // width: 4rem;
    background: #bfd775;
    height: 0.6rem;
    border-radius: 0.3rem;
    box-sizing: border-box;
    
    align-items: center;
    padding: 0 0.24rem;
        // margin: 0 0.2rem 0.2rem 0;
    
}
.mb-search .list {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
}
.input_wrapper{
    margin-top:30px;
    background: #fff;
    padding: 12px 32px 24px;
}
.mb-status .UdStatusPage_wrapper .statusIcon {
    width: 3rem!important;
    height: 3rem!important;
}
</style>
<style lang="scss" scoped>
.mb-search {
    .status {
        margin-top: 100px;
    }
    .m-top{
      margin-top: 50px;
    }
}
</style>