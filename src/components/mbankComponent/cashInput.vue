<template>
    <div class="inputDialog_wrapper">
        <UdCashInput @showkeyboard="showKB" :showKeyboard="showKeyboard" :value="amt" @clear="clearAll"></UdCashInput>
        <UdCashKeyboard v-if="showKeyboard" @keyboardHide="hideKB" @keyboardInput="getInput" @keyboardDel="delInput"></UdCashKeyboard>
    </div>
</template>
<script>
import { UdCashInput } from '@udesk/mbank-ui-v2';
import { UdCashKeyboard } from '@udesk/mbank-ui-v2';
export default {
    data(){
        return {
            showKeyboard: false,
            amt: "",
        }
    },
    methods:{
        showKB(){
            this.showKeyboard = true;
        },
        hideKB(){
            this.showKeyboard = false;
        },
        getInput(data){
            if (this.amt.search(/\./) !== -1 && data === '.') return
            if (this.amt.search(/\./) !== -1 && this.amt.split('.')[1].length >= 2) return
            this.amt = this.amt + data;
        },
        delInput(){
            if(this.amt != ""){
                let len = this.amt.length;
                this.amt = this.amt.substr(0, len -1);
            }
        },
        clearAll() {
            this.amt = ''
        }
    },
    components: { UdCashInput, UdCashKeyboard }
}
</script>
<style lang="scss">
.inputDialog_wrapper{
    margin: 30px;
    background-color: #fff;
    .inputDialog_con{
        margin-top: 20px;
    }
}
</style>