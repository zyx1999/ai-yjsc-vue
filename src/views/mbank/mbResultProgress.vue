<template>
  <div class="mb-status">
    <mt-header title="结果页交易进度轴组件" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>

    <!-- 结果页交易进度轴组件 -->
    <div class="status con_title">
      <h3><b>结果页交易进度轴组件</b></h3>
    </div>

    <resultProgress :data="resultProgressData"/>
  </div>
</template>
<script>
import resultProgress from '@/components/mbankComponent/resultProgress.vue'

export default {
    components:{resultProgress  },
    data() {
      return {
        resultProgressData:{
          progressArr:[{
            stateTime:'2020-01-18 09:20:39',
            stateInfo:'成功转入资金1,000.00元',
            isChecked: true,//提示图标样式
            id:'0001'
          },{
            stateTime:'2020-01-18 23:59:59',
            stateInfo:'您预约赎回基金将在您指定的赎回日期提交至基金公司',
            isChecked: false,
            id:'0002'  
          },{
            stateTime:'2018-08-23 23:59:59前',
            stateInfo:'收益到账',
            isChecked: false,
            id:'0003'  
          }],
          infoList:[{
              stateTime:'2020-01-18 09:20:39',
              stateInfo:'成功转入资金1,000.00元',
              isChecked: true,//提示图标样式
              id:'0001'
          },{
            stateTime:'2020-01-18 23:59:59',
            stateInfo:'您预约赎回基金将在您指定的赎回日期提交至基金公司',
            isChecked: false,
            id:'0002'  
          }]
        },      
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
    .m-top{
      margin-top: 30px;
    }
}
</style>