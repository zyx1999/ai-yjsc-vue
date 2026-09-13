<template>
    <div class="UdMultiInfoDialog_wrapper">
        <UdMultiInfoDialog
            v-if='data.isShow' 
            :count='data.count'
            :cancelOperation="data.cancelOperation"
            :confirmOperation="data.confirmOperation"
            @cancel='cancel'
            @confirm='confirm'
            @clickBg="clickBg"
        >
            <template v-slot:InfoMultiMessage>
                <div class="MultiMessage">
                    <div class='info_title'><span class="info_tip">以下包括</span>{{data.infoTitle}}</div>
                    <div v-html="data.content"></div>
                    
                </div>
            </template>
        </UdMultiInfoDialog>
        <div class="dialog_bg" @click="toShow"></div>
    </div>
</template>
<script>
import { UdMultiInfoDialog } from '@udesk/mbank-ui-v2';
export default {
  props: ['data'],
  data() {
    return {
            isShow: false,
            // 倒计时秒数
            count: 5
        };
    },
    methods:{
        toShow() {
            this.data.isShow = true;
        },
        cancel(data) {
            this.data.isShow = data;
        },
        confirm() {
            this.data.isShow = false;
            this.$emit('confirm')
        },
        clickBg(data){
            this.data.isShow = data;
        }
    },
    components: { UdMultiInfoDialog }
}
</script>