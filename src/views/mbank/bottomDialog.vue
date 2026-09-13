<template>
  <div class="mb-bottom-dialog">
    <mt-header title="底部弹框" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>   
    <div class="btn">
      <button class="ud-btn" @click="toShow1">1.底部弹框-信息确认弹框</button>
      <button class="ud-btn" @click="toShow2">2.底部弹框-功能选择弹框</button>
    </div> 
    <infoConfirmDialog :data="infoConfirmDialogData" />
    <selectDialog :data="selectDialogData" />
  </div>
</template>
<script>
import  infoConfirmDialog  from '@/components/mbankComponent/infoConfirmDialog.vue'
import  selectDialog  from '@/components/mbankComponent/selectDialog.vue'

export default {
  components:{infoConfirmDialog, selectDialog},
  data() {
    return {
      infoConfirmDialogData: {
        title: '信息确认',
        fristLineValue: '1000.00',
        btn_name:'确定',
        list:[
                {name:'收款方', value:'刘牛'},
                {name:'收款账户', value:'6223****9058'},
                {name:'开户银行', value:'中国建设银行'}],
        firstLineKey:'转账金额(元)',
        isShareShow: false
      },    
      selectDialogData: {
        menuList:['指纹密码登录','手势密码登录','切换/注册用户'],
        isShow: false
      },    
    }
  },
  methods: {
    toShow1() {
      this.infoConfirmDialogData.isShareShow = true
    },
    toShow2() {
      this.selectDialogData.isShow = true
    },
    handleBack() {
      this.$router.go(-1)
    }
  },
}
</script>
<style lang="scss" scoped>
.mb-bottom-dialog{
    .btn {
        margin-top: 120px;  
        .ud-btn{
        margin-bottom: 30px;
        }
    }
}
</style>