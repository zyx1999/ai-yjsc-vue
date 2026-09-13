<template>
  <div class="mb-input1">
    <mt-header title="输入组件" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>
    <!-- 单行输入列表-带单位组件 -->
    <div class="input con_title">
      <h3><b>单行输入列表-带单位</b></h3>
    </div>
    <UdFormInputUnit  labelKey="左侧标题文字" unit="美元"
      placeholder="0.00美元" v-model="value" 
    >
    </UdFormInputUnit>
            
    <!-- 右侧带图标的列表组件 -->
    <div class="con_title btn">
      <h3><b>右侧带图标的列表</b></h3>
    </div>
    <UdFormInputIcon  labelKey="收款方"
          placeholder="请输入收款方名称" v-model="iconValue"
    >
      <img src="../../assets/images/about1.png" alt="" slot="icon">
    </UdFormInputIcon>

    <!-- 短信验证码列表组件 -->
    <div class="con_title btn">
      <h3><b>短信验证码(不包括具体短信验证码功能)</b></h3>
    </div>
    <UdInputVeriCode  labelKey="短信验证码"
                placeholder="请输入6位验证码" :action="action" v-model="codeValue" 
                @getVeriCode="getVeriCode"
            >
    </UdInputVeriCode>

    <!-- 步进器组件 -->
    <div class="con_title btn">
      <h3><b>步进器</b></h3>
    </div>

    <div class="UdAdder_wrapper"><UdAdder v-model="val" :minVal="min" :maxVal="max" @onFocus="showKB" @offFocus="hideKB"/></div>
    <UdCashKeyboard v-if="showKeyboard" @keyboardHide="hideKB" @keyboardInput="getInput" @keyboardDel="delInput"></UdCashKeyboard>
  </div>
</template>
<script>
import { UdFormInputUnit,UdFormInputIcon,UdInputVeriCode,UdAdder, UdCashKeyboard }  from '@udesk/mbank-ui-v2';
import formInput from '@/components/mbankComponent/formInput.vue'

export default {
    components:{UdInputVeriCode, formInput, UdFormInputUnit,UdFormInputIcon,UdAdder, UdCashKeyboard  },
    data() {
        return {
            value:'',
            action: '获取验证码',
            second: 60,
            timer: null,
            iconValue:'',
            showKeyboard: false,
            val: 5,
            min: 1,
            max: 20,
            codeValue:''
        }
    },
    methods: {
      handleBack(){
        this.$router.go(-1)
      },
      showIDKB(){
        this.showID = true;
      },
       getVeriCode() {
            if (!this.timer && this.second === 60) {
                this.second--
                this.action = this.second + 'S后重发'
                this.timer = setInterval(() => {
                    this.second--
                    if (this.second === 0) {
                        this.action = '获取验证码'
                        this.second = 60
                        clearInterval(this.timer);
                        this.timer = null
                    } else {
                        this.action = this.second + 'S后重发'
                    }
                }, 1000)
            }
        },
        showKB() {
            this.showKeyboard = true;
        },
        hideKB() {
            if (this.val < this.min) this.val = this.min
            this.showKeyboard = false;
        },
        getInput(data){
            let var_s = this.val.toString()
            if (var_s.search(/\./) !== -1 && data === '.') return
            if (var_s.search(/\./) !== -1 && var_s.split('.')[1].length >= 2) return
            if (var_s + data - 0 > this.max) {
                this.val = this.max
                return
            }
            if (var_s + data - 0 < this.min) {
                this.val = this.min
                return
            }
            this.val = var_s + data - 0;
        },
        delInput(){
            let var_s = this.val.toString()
            if (var_s.length > 0) {
                let len = var_s.length;
                this.val = var_s.substr(0, len - 1) - 0;
            }
        }
    },
}
</script>
<style lang="scss">
.mb-input1 {
  .FormInput_wrapper{
    width:100%;
    height:100%;
    position:fixed;
    top:0;
    left:0;
    background:#f2f2f2;
}
.input_wrapper{
    margin-top:30px;
}
.Icon{
    width:48px;
    height:48px;
    margin-left:8px;
}
}

</style>
<style lang="scss" scoped>

  .mb-input1 {
    .input {
      margin-top: 100px;
    }
    .btn {
        margin-top: 30px;
    }
  }
</style>