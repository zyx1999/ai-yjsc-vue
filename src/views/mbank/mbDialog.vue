<template>
  <div class="mb-dialog">
    <mt-header title="普通弹框" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>
    <div class="btn">
      <button class="ud-btn" @click="toShow1">1.普通弹框-单按钮弹框</button>
      <button class="ud-btn" @click="toShow2">2.普通弹框-双按钮弹框</button>
      <button class="ud-btn" @click="toShow3">3.普通弹框-协议弹框</button>
      <button class="ud-btn" @click="toShow4">4.普通弹框-多协议弹框</button>
    </div>
    
    <SingleDialog :data="SingleDialogData"/>
    <DoubleDialog :data="doubleDialogData" @confirm="confirm"/>
    <protocolDialog :data="protocolDialogData" @confirm="confirm"/>
    <multiProtocolDialog :data="multiProtocolDialogData" @confirm="confirm"/>

  </div>
</template>
<script>
import  SingleDialog  from '@/components/mbankComponent/singleDialog.vue'
import  DoubleDialog  from '@/components/mbankComponent/doubleDialog.vue'
import  protocolDialog  from '@/components/mbankComponent/protocolDialog.vue'
import  multiProtocolDialog  from '@/components/mbankComponent/multiProtocolDialog.vue'

export default {
  name:'mbDialog',
  components:{ SingleDialog, DoubleDialog, protocolDialog, multiProtocolDialog },
  data() {
    return {
      // 单按钮弹框参数
      SingleDialogData: {
        isShow: false,  // 控制弹框是否显示
        title: '温馨提示',  //弹框标题，可以自定义
        content: '确认以后此状态不可撤回！',
        operation: '关闭'
      },
      // 双按钮弹框参数
      doubleDialogData: {
        isShow: false,  // 控制弹框是否显示
        title: '温馨提示',  //弹框标题，可以自定义
        content: '确认以后此状态不可撤回！',
        confirmOperation: '重新测评',
        cancelOperation: '关闭'
      },
      // 协议弹框参数
      protocolDialogData: {
        isShow: false,  // 控制弹框是否显示
        title: '小微企业*****借款合同',  //弹框标题，可以自定义
        supTitle:'ABC(2020)1043-1(第二版)',
        content: '',
        confirmOperation: '已阅读',
        cancelOperation: '关闭',
        count: 5
      },
      // 多协议弹框参数
      multiProtocolDialogData: {
        isShow: false,  // 控制弹框是否显示
        infoTitle: '《续捷e贷业务授权协议》、《个人征信授权书》、《人脸信息采集授权书》',  //弹框标题，可以自定义
        content: '',
        confirmOperation: '已阅读',
        cancelOperation: '关闭',
        count: 5
      }
    }
  },
  created() {
    this.multiProtocolDialogData.content = '<div class="sup_title">续捷e贷业务授权协议</div>尊敬的投资者：<br/><p>开放式基金是一种投资型产品，不是产品储蓄存款、不是银行理财产品。基金再投资运作过程中可能面临各种风险，既包括基金自身的管理风险等。基金管理人不保证本基金一定盈利，也不保证最低收益，您的本金可能出现亏损。</p><p>我行仅为基金代理销售机构对基金管理人的行为不承担法律责任，对您的投资本金和收益不承担保证兜底责任。您须使用自有资金购买我行代销的基金产品，本次投资是您独立自主做出的决定，投资的盈亏将由您自己承担。</P><p>您在我行提交交易申请，须由基金管理人确认是否交易成功。产品业绩等信息可通过我行柜面、网上银行、手机银行、自助终端或基金管理人官网等渠道进行查询。如果您有任何意见和建议，可拨打我行客服电话95599或向当地网点。</p>'
    this.protocolDialogData.content = '<div  class="main_title"><p>尊敬的投资者：</p><p>开放式基金是一种投资型产品，不是产品储蓄存款、不是银行理财产品。基金再投资运作过程中可能面临各种风险，既包括基金自身的管理风险等。基金管理人不保证本基金一定盈利，也不保证最低收益，您的本金可能出现亏损。</p><p>我行仅为基金代理销售机构对基金管理人的行为不承担法律责任，对您的投资本金和收益不承担保证兜底责任。您须使用自有资金购买我行代销的基金产品，本次投资是您独立自主做出的决定，投资的盈亏将由您自己承担。</P><p>您在我行提交交易申请，须由基金管理人确认是否交易成功。产品业绩等息可通过我行柜面、网上银行、手机银行、自助终端或基金管理人官网等渠道进行查询。如果您有任何意见和建议，可拨打我行客服电话95599或向当地网点。</p></div>'
  },
  methods: {
    handleBack(){
      this.$router.go(-1)
    },
    toShow1(){
      this.SingleDialogData.isShow = true
    },
    toShow2() {
      this.doubleDialogData.isShow = true
    },
    toShow3() {
      this.protocolDialogData.isShow = true
    },
    toShow4() {
      this.multiProtocolDialogData.isShow = true
    },
    toShow5() {
      this.doubleDialogData.isShow = true
    },
    confirm() {
      this.$toast({
        message: '确定了！',
        position: 'middle',
        duration: 1000
    })
    },
    confirm1() {

      this.$toast({
        message: '确定了！',
        position: 'middle',
        duration: 1000
    })
    }
  },
}
</script>
<style lang="scss" scoped>
.mb-dialog{
  .btn{
    margin-top: 120px;
    .ud-btn {
      margin-bottom: 30px;
    }
  }
}
</style>