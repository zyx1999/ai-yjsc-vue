<template>
  <div class="mb-list">
    <mt-header title="列表组件" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>   
    <!-- 普通列表组件 -->
    <div class="con_title btn">
      <h3><b>普通列表</b></h3>
    </div>
    <formLabelList />
    <div class="con_title btn">
      <h3><b>可用金额列表</b></h3>
    </div>
    <div>
      <UdCashLabel title='交易金额' acc='6228****6688' amountTip ='可用金额' amount = '1509.94元'>
      </UdCashLabel>
    </div>
    
    <div class="con_title btn">
      <h3><b>下拉列表(不包括弹框样式)</b></h3>
    </div>

    <UdFormLabelList :isSep="isSep" :isSelect="isSelect" :labelValue="labelValue" :labelKey="labelKey" @showList="showList">
      <img class="labelIcon" src="../../assets/images/alert.png" alt="">
    </UdFormLabelList>

    <div class="con_title btn">
      <h3><b>右侧箭头列表</b></h3>
    </div>
    <UdFormLabelRoute :isSep="isSep" :labelValue="labelValue" :labelKey="labelKey" @toNext="toNext">
        <img class="labelIcon" src="../../assets/images/alert.png" alt="">
    </UdFormLabelRoute>

    <div class="con_title btn">
      <h3><b>双向选择按钮列表</b></h3>
    </div>

    <UdFormBiLabel highlight="L" :isSep="true" :labelKey="labelKey" :leftValue="leftValue" :rightValue="rightValue" @switchTo="switchTo">
      <img class="labelIcon" src="../../assets/images/alert.png" alt="">
    </UdFormBiLabel>
  </div>
</template>
<script>
import formLabelList from '@/components/mbankComponent/formLabelList.vue'
import { UdCashLabel, UdFormLabelRoute, UdFormLabelList, UdFormBiLabel }  from '@udesk/mbank-ui-v2';

export default {
    components:{formLabelList, UdCashLabel, UdFormLabelList, UdFormLabelRoute, UdFormBiLabel},
    data() {
        return {
            labelKey:"左侧标题文字",
            labelValue:"提示文字",
            isSelect:false,
            isSep:true,
            leftValue:"买入",
            rightValue:"卖出",
        }
    },
    methods: {
        handleBack(){
            this.$router.go(-1)        
        },
        showList() {
           console.log("下拉弹框");
        },
        switchTo() {

        },
        toNext(){}
    },
}
</script>
<style lang="scss" scoped>
.btn{
  margin-top: 100px;
}
</style>