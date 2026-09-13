<template>
  <div class="UdInfoDialog_wrapper">
        <UdInfoDialog 
            v-if='data.isShow' 
            :count='data.count'
            :cancelOperation="data.cancelOperation"
            :confirmOperation="data.confirmOperation"
            @cancel='cancel'
            @confirm='confirm'
            @clickBg='clickBg'
        >
            <template v-slot:InfoDialogTitle>
                小微企业*****借款合同
                <div class="sup_title">{{data.supTitle}}</div>
            </template>
            <template v-slot:InfoDialogMessage>
                <div  class="main_title">
                    <p>尊敬的投资者：</p>
                    <p>开放式基金是一种投资型产品，不是产品储蓄存款、不是银行理财产品。
                    基金再投资运作过程中可能面临各种风险，既包括基金自身的管理风险等。
                    基金管理人不保证本基金一定盈利，也不保证最低收益，您的本金可能出现亏损。</p>
                    <p>我行仅为基金代理销售机构对基金管理人的行为不承担法律责任，
                    对您的投资本金和收益不承担保证兜底责任。您须使用自有资金购买我行代销的基金产品，
                    本次投资是您独立自主做出的决定，投资的盈亏将由您自己承担。</P>
                    <p>您在我行提交交易申请，须由基金管理人确认是否交易成功。
                    产品业绩等信息可通过我行柜面、网上银行、手机银行、自助终端或基金管理人官网等渠道进行查询。
                    如果您有任何意见和建议，可拨打我行客服电话95599或向当地网点。</p>
                </div>
            </template>
        </UdInfoDialog>
        <div class="dialog_bg" @click="toShow"></div>
  </div>
</template>
<script>
import { UdInfoDialog } from '@udesk/mbank-ui-v2';
export default {
  props: ['data'],
  data() {
    return {
            isShow: false,
            // 倒计时秒数
            
        };
    },
    methods:{
        toShow() {
            console.log('bg1')
            this.data.isShow = true;
        },
        cancel(data) {
            this.data.isShow = false;
            console.log("点击取消的回调");
        },
        confirm() {
            this.data.isShow = false;
            this.$emit('confirm')
            console.log("点击确定的回调");
        },
        clickBg(data){
            console.log('bg')
            this.data.isShow = false;
        }
    },
    components: { UdInfoDialog }
}
</script>