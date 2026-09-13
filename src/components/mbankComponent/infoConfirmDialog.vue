<template>
<div class="UdPopup_wrapper">
    <div class="common_bg" @click="showDefault"></div>
    <UdPopUp @cancel="cancel" @finish="finish" :title="data.title" 
        :firstLineKey="data.firstLineKey" :fristLineValue="data.fristLineValue"  
        :list='data.list' :btn_name="data.btn_name"
        :isShareShow="data.isShareShow"
        v-if="data.isShareShow" 
     ></UdPopUp>
</div>
</template>
<script>
import { UdPopUp } from '@udesk/mbank-ui-v2';
export default {
    props:['data'],
    name:"UdPopUpCon",
    components: { UdPopUp },
    data() {
        return {
            isShareShow: false,
            list:[
                {name:'收款方', value:'刘牛'},
                {name:'收款账户', value:'6223****9058'},
                {name:'开户银行', value:'中国建设银行'}]
        }
    },
    methods:{
        cancel(data) {
            this.data.isShareShow = data.isShareShow;
        },
        finish(data) {
            this.data.isShareShow = data.isShareShow;
        },
        showDefault() {
            this.data.isShareShow = true;
        },
    }
}
</script>