<template>
    <div class="UdDoubleBtnDialog_wrapper">
        <div class="UdDoubleBtnDialog_bg" @click="toShow()"></div>
        <UdDialog
            v-if="data.isShow"
            :dialogTitle="data.title"
            :content="data.content"
            :confirmOperation="data.confirmOperation"
            :cancelOperation="data.cancelOperation"
            :autoClose="false"
            @cancel='cancel'
            @confirm="confirm"
            @clickBg='clickBg'
        >
        </UdDialog>
    </div>
</template>
<script>
import { UdDialog } from '@udesk/mbank-ui-v2';
export default {
    components: { UdDialog },
    props: ['data'],
    data() {
        return {
            isShow: false,
        }
    },
    methods: {
        toShow(){
            this.data.isShow = true;
        },
        cancel(){
            this.data.isShow = false;
        },
        confirm(){
            this.$emit('confirm')
            this.data.isShow = false;
            

        },
         clickBg(){
            this.data.isShow = false;
        }
    }
}
</script>