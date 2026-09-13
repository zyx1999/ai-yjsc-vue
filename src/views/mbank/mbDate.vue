<template>
    <div class="mb-date">
      <mt-header title="筛选组件" class='bank-header' fixed>
        <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
       </mt-header>
        <div class="m-top con_title">
        <h3><b>时间筛选组件（不包含时间选择弹框）</b></h3>
        </div>
        <UdDateScreen :startDate="startDate" :endDate="endDate" @selBegin="selBegin" @selEnd="selEnd" title="交易时间"></UdDateScreen>
        <div class="m-top con_title">
        <h3><b>类型筛选组件</b></h3>
        </div>
        <div class="ud-btn-screen-box">
            <div class="ud-btn-screen-title">交易类型</div>
            <div class="btnScreen_wrapper">
                <div class="ud-btn-screen" :class="{'ud-btn-screen-active':curBtnIndex == index}" v-for="(item,index) in btnArr" :key="index" @click="changeBtn(index)">{{item}}</div>
            </div>
        </div>
    </div>
</template>
<script>
import {UdDateScreen,UdBtnScreen } from '@udesk/mbank-ui-v2';
export default {
    components: { UdDateScreen,UdBtnScreen  },
    data(){
        return {
            curStartDate:"20201022",
            curEndDate:"20201214",
            curBtnIndex:0,
            btnArr:["全部","收入","支出"]
        }
    },
    computed: {
        startDate() {
            return this.formatDate(this.curStartDate, "/");
        },
        endDate() {
            return this.formatDate(this.curEndDate, "/");
        }
    },
    methods:{
        handleBack() {
            this.$router.go(-1)
        },
        changeBtn(curIndex){
            this.curBtnIndex = curIndex;
        },
        formatDate(input, sep) {
            if (this.isEmpty(input)) {
                return "";
            }
            var year = input.substr(0, 4);
            var month = input.substr(4, 2);
            var day = input.substr(6, 2);
            return year + sep + month + sep + day;
        },
        isEmpty(input) {
            if ((input == undefined) | (input == "")) {
                return true;
            } else {
                return false;
            }
        },
        selBegin(){
            console.log("点击开始日期框触发");
        },
        selEnd(){
            console.log("点击结束日期框触发");
        }
    }
}
</script>
<style lang="scss" scoped>

.mb-date {
    .btnScreen_wrapper {
        display: flex;
    }
    .m-top {
        margin-top: 100px;
    }
}
</style>