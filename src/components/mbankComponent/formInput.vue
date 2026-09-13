<template>
    <div class="FormInputFormat_wrapper">
        <div class="input_wrapper">
            <UdFormInputFormat 
                labelKey="身份证号码"
                type="IDCard"
                placeholder="右侧未输入时提示文字"
                v-model="value"
                @touchstart.native.capture="showIDKB"/>
            
            <UdIdCardKeyboard @getValue="getValue" @delVal="delVal" @hideBoard="hideIDBoard" v-show="showID"></UdIdCardKeyboard>
        </div>
    </div>
</template>
<script>
import { UdFormInputFormat, UdIdCardKeyboard } from '@udesk/mbank-ui-v2'
export default {
    components: { UdFormInputFormat, UdIdCardKeyboard },
    data(){
        return {
            value: '110102199712101114',
            value1: '',
            value2: '13000001102',
            showID: false,
            showPhone: false
        }
    },
    methods: {
        showIDKB() {
            this.showID = true;
        },
        hideIDBoard() {
            this.showID = false;
        },
        getValue(val) {
            if (this.value.length < 18) {
                this.value = this.value + val;
            } else {
                console.log("最大长度为18位");
            }
        },
        delVal() {
            if (this.value != "") {
                let len = this.value.length;
                this.value = this.value.substr(0, len - 1);
            }
        },
        showKB(){
          this.showPhone = true;
        },
        hideKB(){
            this.showPhone = false;
        },
        getInput(data){
            let amtLen = this.value2.length;
            console.log('getInput',data);
            if (amtLen < 11) {
                this.value2 = this.value2 + data;
            } else {
                console.log('最大长度为11位')
            }
        },
        delInput(){
            if(this.value2 != ""){
                let len = this.value2.length;
                this.value2 = this.value2.substr(0, len -1);
            }
        }
    }
}
</script>
<style lang="stylus">
.FormInputFormat_wrapper{
    width:100%;
}
.input_wrapper{
    margin-top:30px;
}
.Icon{
    width:48px;
    height:48px;
    margin-left:8px;
}
</style>