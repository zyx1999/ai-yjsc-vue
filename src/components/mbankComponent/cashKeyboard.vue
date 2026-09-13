<template>
  <div>
    <div class="title">{{data.title}}:</div>
    <div class="amt" id='div_amt' @click="showKB" >{{amt}}</div>
    <UdCashKeyboard v-if="data.showKeyboard" @keyboardHide="hideKB" @keyboardInput="getInput" @keyboardDel="delInput"/>
  </div>
</template>
<script>
import { UdCashKeyboard } from '@udesk/mbank-ui-v2';
export default {
    props:['data'],
    data() {
      return {
        showKeyboard: false,
        amt: "",
        ckbLength:11
      };
  },
    components: { UdCashKeyboard },
    methods:{
      showKB(){
          console.log('showKB()');
          this.data.showKeyboard = true;
      },
      hideKB(){
          console.log('hideKB()');
          this.data.showKeyboard = false;
      },
      getInput(data){
        let amtLen = this.amt.length;
        console.log('getInput',data);
        if(amtLen <= this.ckbLength){
          this.amt = this.amt + data;
        } else {
          console.log('最大长度为12位')
        }
      },
      delInput(){
          if(this.amt != ""){
              let len = this.amt.length;
              this.amt = this.amt.substr(0, len -1);
          }
      }
  }
}
</script>
<style lang="scss" scoped>
.title {
    margin-left: 20px;
}
.amt {
  margin-top: 20px;
  font-weight: bold;
  margin-left: 20px;

}
</style>