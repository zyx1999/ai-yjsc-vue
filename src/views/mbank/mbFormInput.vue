<template>
  <div class="mb-input">
    <mt-header title="输入组件" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>
    <!-- 固定格式输入列表组件 -->
    <div class="input con_title">
      <h3><b>固定格式输入</b></h3>
    </div>
    <formInput />

    <!-- 金额输入框组件 -->
    <div class="con_title btn">
      <h3><b>金额输入框</b></h3>
    </div>
    <cashInput />

    <!-- 普通输入组件 -->
    <div class="con_title btn">
      <h3><b>输入框</b></h3>
    </div>

    <UdFormInput labelKey="标题" :isSep="true" placeholder="请输入文本" :value="value" type="text" :readonly="false"/>
    
    

    <!-- 多行输入列表组件 -->
    <div class="con_title btn">
      <h3><b>多行输入</b></h3>
    </div>

    <UdMultiInput 
      placeholder="右侧未输入时提示文字"
      labelKey="家庭住址信息"
      v-model="multiInputValue"
    >
      <img src="../../assets/images/alert.png" slot="tip">
    </UdMultiInput>

    

  </div>
</template>
<script>
import { UdFormInput, UdMultiInput }  from '@udesk/mbank-ui-v2';
import cashInput from '@/components/mbankComponent/cashInput.vue'
import formInput from '@/components/mbankComponent/formInput.vue'

export default {
    components:{UdFormInput, cashInput, UdMultiInput, formInput},
    data() {
        return {
            value:'',
            multiInputValue:'',
            formInputValue:110102199712101114
        }
    },
    methods: {
      handleBack(){
        this.$router.go(-1)
      },
      showIDKB(){
        this.showID = true;
      }
    },
}
</script>
<style lang="scss" scoped>

  .mb-input {
    .input {
      margin-top: 130px;
    }
    .btn {
        margin-top: 20px;
    }
  }
</style>