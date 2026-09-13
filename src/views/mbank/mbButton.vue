<template>
    <div class="btn-wrapper">
      <mt-header title="按钮" class='bank-header' fixed>
        <mt-button icon="back" slot="left" @click="handleBack"></mt-button>
      </mt-header>   
      <!-- 基础按钮 -->
      <div class="con_title btn">
        <h3><b>基础按钮</b></h3>
      </div>
      <button class="ud-btn">基础按钮</button>
      <hr>
      <!-- 基础按钮,不可点击 -->
      <div class="con_title">
        <h3><b>基础按钮(不可点击)</b></h3>
      </div>
      <button class="ud-btn ud-btn_disabled">基础按钮</button>
      <hr>
      <!-- 线框按钮 -->
      <div class="con_title">
        <h3><b>线框按钮</b></h3>
      </div>
      <button class="ud-btn ud-btn-outline">线框按钮</button>
      <hr>
      <!-- 分支流程按钮 -->
      <div class="con_title">
        <h3><b>分支流程按钮</b></h3>
      </div>
      <div class="branch">
        <button class="ud-btn ud-btn-inline ud-btn-outline">分支流程</button>
        <button class="ud-btn ud-btn-inline">主流程</button>
      </div>
      <hr>

      <div class="con_title">
        <h3><b>列表删除按钮</b></h3>
      </div>
      <h1>说明：滑动出现删除按钮（需要在手机模式下）</h1>
        <div  class="card_list">
            <ul>
                <li class="list-item" data-type="0" v-for="(item, index) of cardList" :key="index">
                    <UdDelBtn @delete="deleteHandle(index)" :key="index">
                        <div class="flexDetail">
                            <div class="cardIcon">
                                <img :src="item.icon" alt="icon" />
                            </div>
                            <div class="cardDetail">
                                <div class="card_name">
                                    <span class="c_name">{{item.name}}</span>
                                    <span class="c_time">{{item.time}}</span>
                                </div>
                                <p class="card_num">{{item.cardNum}}</p>
                            </div>
                        </div>
                    </UdDelBtn>
                </li>
            </ul>
        </div>
      <hr>
      <div class="con_title"> 
        <h3><b>协议勾选按钮</b></h3>
      </div>
      <div class="UdProtocolBtn_wrapper">
        <input type="checkbox" class="ud-protocal-btn">
        <div class="agreementCon">我已阅读并接受<span class="notes">《基金业务网上服务协议》</span>、<span class="notes">《投资人权益须知》</span></div> 
      </div>
      <hr>
      <div class="con_title"> 
        <h3><b>单选按钮</b></h3>
      </div>
      <div class="radio-item">
        <input type="radio" id="one" value="One" v-model="picked" class="ud-radio">
        <p>
          <label for="one">One</label>
        </p>
        </div>
      <div class="radio-item">
        <input type="radio" id="two" value="Two" v-model="picked" class="ud-radio">
        <p>
          <label for="two">Two</label>
        </p>
      </div>
      <hr>
      <div class="con_title"> 
        <h3><b>复选按钮</b></h3>
      </div>
      <checkBoxBtn :data="checkBoxBtnData"/>
      <hr>
      <div class="con_title"> 
        <h3><b>开关按钮</b></h3>
      </div>
      <div class="ud-switch-box-item">
        <input type="checkbox" class="ud-switch" v-model="isSwitchOpen">
        <p>①开关状态：{{isSwitchOpen}}</p>
      </div>
      <hr>
      <div class="con_title"> 
        <h3><b>收藏按钮</b></h3>
      </div>

      <div class="collection_wrapper" v-for="(item,index) of checkList" :key="index">
        <form class="item_wrapper">
          <label class="item_label">
            <input
              type="checkbox"
              v-model="item.checkVal"
              class="ud-collection"
            />
          </label>
        </form>
      </div>
      <hr>

      <div class="con_title"> 
        <h3><b>tab切换按钮</b></h3>
      </div>
      <tabSwitch :data="tabSwitchData" />

    </div>
</template>
<script>
import { UdBtn,UdDelBtn,UdProtocolBtn } from '@udesk/mbank-ui-v2';
import checkBoxBtn from '@/components/mbankComponent/checkBoxBtn.vue'
import tabSwitch from '@/components/mbankComponent/tabSwitch.vue'

export default {
    components: { UdBtn,UdDelBtn,UdProtocolBtn, checkBoxBtn, tabSwitch},
    data() {
      return {
        isSwitchOpen: false,
        checkBoxBtnData:{
          cardList:[
            {
                
                checkVal: "1"
            }
          ]
        },
        picked: '',
        cardList:[
          {
            'icon':require("../../assets/images/工行.png"),
              'name': "李四",
              'time': '2018-07-11 09:24:58',
              'cardNum': "中国工商银行（6228****2679）",
              "delBtn":"删除"
          },
        ],
        checkList: [
        {
          val: "anxin",
          checkVal: false,
          supTitle: "安信消费医药主题",
          businessCode: "000974",
          rate: "0.5268",
          increase: "+2.70%"
        }],
        tabSwitchData:{
          tipCur:1,
          tabList: [
        {
          title: "成交纪录",
          id: "00021"
        },
        {
          title: "合约损益",
          id: "00022"
        },
        {
          title: "强平记录",
          id: "00023"
        },
      ],
          tabListMore:[
            {
              title: "活期",
              id: "01"
            },
            {
              title: "定期",
              id: "02"
            },
            {
              title: "私行",
              id: "03"
            },
            {
              title: "结构化",
              id: "04"
            },
            {
              title: "外币",
              id: "05"
            },
            {
              title: "重疾医疗",
              id: "06"
            },
            {
              title: "年金养老",
              id: "07"
            },
            {
              title: "人寿保险",
              id: "08"
            },
            {
              title: "意外保障",
              id: "09"
            }]
        }
      }
    },
    methods: {
        deleteHandle (index) {
            this.cardList.splice(index, 1);
        },
        handleBack() {
            this.$router.go(-1);
        }
    },
}
</script>
<style lang="scss">
.delBtn{
    height: auto!important;
}
</style>
<style lang="scss" scoped>

.UdDelBtn_wrapper {
    display: flex;
   
}
.btn-wrapper {
  
  .flexDetail {
    display: flex;
    align-items: center;
  }
  .con_title {
    margin-bottom: 20px;
  }
  .btn{
    margin-top: 120px;
  }
  .ud-btn_disabled {
    cursor: not-allowed;
    background-image: none!important;
    background-color: #ffe6b2!important;
    border: none!important;
  }
  .ud-btn-outline {
    color: #ffa900;
    background-color: #ffffff;
    border: 0.02rem solid #ffa900;
    border-radius: 0.08rem;
    text-align: center;
    cursor: pointer;
    display: inline-block;
    position: relative;
  }
  .branch {
    display: flex;
    .ud-btn {
      width: 50%;
    }
  }
}
.UdProtocolBtn_wrapper{
  display:flex;
  justify-content: flex-start;
  margin:30px 32px;
   .agreementCon {
      font-size: 28px;
      line-height: 42px;
      margin-left: 8px;
      width: 650px;
      box-sizing:border-box;
      display: inline-block;
      padding-right: 32px;
      color: #333;
      .notes {
        color: #00b893;
      }
    }
  }
  .collection_wrapper {
    height: 100px;
  }
</style>