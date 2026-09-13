<template>
  <div class="card-wrapper">
    <div class="card-tip">
      <p class="title">{{data.title}}</p>
      <p class="sup-title">{{data.sup_title}}</p>
    </div>
    <div class="amt" @click="showKB">{{amt}}</div>
    <!-- <div class="nextButton">下一步</div> -->
    <UdIdCardKeyboard @getValue="getValue" @delVal="delVal" @hideBoard="hideBoard" v-show="data.isShow"></UdIdCardKeyboard>
  </div>
</template>
<script>
import { UdIdCardKeyboard } from '@udesk/mbank-ui-v2';
export default {
  props:['data'],
  components: { UdIdCardKeyboard },
  data() {
    return {
      isShow: true,
      amt: ""
    };
  },
  methods: {
    showKB() {
      this.data.isShow = true;
    },
    hideBoard() {
      this.data.isShow = false;
    },
    getValue(val) {
      console.log(val);
      if (this.amt.length <= 18) {
        this.amt = this.amt + val;
      } else {
        console.log("最大长度为18位");
      }
    },
    delVal() {
      if (this.amt != "") {
        let len = this.amt.length;
        this.amt = this.amt.substr(0, len - 1);
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.sup-title {
    margin-top: 20px;
    margin-left: 20px;
}
</style>