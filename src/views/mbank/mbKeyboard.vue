<template>
  <div class="mb-keyboard">
    <mt-header title="键盘" class='bank-header' fixed>
      <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
    </mt-header>   
    <div class="btn">
      <cashKeyboard :data="cashKeyboardData"/>
      <button class="ud-btn" @click="toShow1">1.键盘-金额键盘</button>

      <cardKeyboard class="cardkey" :data="cardKeyboardData"/>
      <button class="ud-btn" @click="toShow2">2.键盘-身份证号键盘</button>

    </div> 
    
  </div>
</template>
<script>
import  cashKeyboard  from '@/components/mbankComponent/cashKeyboard.vue'
import  cardKeyboard  from '@/components/mbankComponent/cardKeyboard.vue'

export default {
  components:{cashKeyboard, cardKeyboard},
  data() {
    return {
      cashKeyboardData: {
        title:'用款金额',
        showKeyboard:false
      },
      cardKeyboardData: {
        title: '绑定本人身份证',
        sup_title: '绑定身份证，即可查看您名下所有农行卡及其余额',
        isShow: false
      }   
    }
  },
  methods: {
    toShow1(){
      this.cashKeyboardData.showKeyboard = true
    },
    toShow2(){
      this.cardKeyboardData.isShow = true

    },
    handleBack(){
      this.$router.go(-1);
    }
  },
}
</script>
<style lang="scss" scoped>
.mb-keyboard{
    .btn {
        margin-top: 120px;  
        .ud-btn{
        margin-bottom: 30px;
        margin-top: 20px;
        }
    }
    .cardkey{
        margin-top: 100px;
    }
}
</style>