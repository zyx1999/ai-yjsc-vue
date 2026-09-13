<template>
    <div>
        <div class="checkBox_wrapper">
            <div class="fist_line" v-for="(item,index) of data.cardList" :key="index">
                <div class="circle" :class='{sequence:index==1}'>{{item.sequence}}</div>
                <label class="cardCon">
                    <div>
                        <p class="cardNum">{{item.cardNum}}</p>
                        <p class="cardDetail">{{item.cardDetail}}</p>
                    </div>
                    <input type="checkbox" 
                        :value="item.checkVal"
                        v-model="checked"
                        @change="CheckChange"
                        class="ud-checkbox"
                        >
                </label>
            </div>
            checked: {{checked}}
        </div>
    </div>
</template>
<script>
import { UdCheckBoxBtn } from '@udesk/mbank-ui-v2';
export default {
    components: { UdCheckBoxBtn },
    props: ['data'],
    data(){
        return {
            checked: ["1"],
            
        }
    },
    methods: {
        CheckChange(data){
        }
    }
}
</script>
<style lang="scss" scoped>
.cardCon {
    display: flex;
    justify-content: space-between;
}
.fist_line {
    margin: 0 20px;
}
</style>