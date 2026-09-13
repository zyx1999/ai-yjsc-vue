<template>
    <div class="Popup_wrapper">
        <div class="black_bg" @click="toShow()"></div>
        <UdSelectionPopup
            v-if="data.isShow"
            :menuList="data.menuList"
            :cancelOperation="cancelOperation"
            @cancel='cancel'
            @selectMenu='selectMenu'
        >
        </UdSelectionPopup>
    </div>
</template>
<script>
import {UdSelectionPopup}  from '@udesk/mbank-ui-v2';
export default {
    props:['data'],
    components: { UdSelectionPopup },
    data(){
        return {
            isShow:false,
            menuList: ['指纹密码登录','手势密码登录','切换/注册用户'],
            cancelOperation: '取消'
        }
    },
    methods: {
        cancel(data){
            this.data.isShow = data;
        },
        toShow(){
            this.data.isShow = true;
        },
        selectMenu(data){
            console.log(data);
            console.log('跳转链接'+data+'(index)的回调')
        }
    }
}
</script>