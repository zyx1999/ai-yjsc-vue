<template>
  <div>
    <UdTabSwitch
      :tabList="data.tabListMore"
      :tipCur="data.tipCur"
      @handleChange="handleChange"
    >
    </UdTabSwitch>
    <UdTabSwitch
      :tabList="data.tabList"
      :tipCur="data.tipCur"
      @handleChange="handleChange"
    >
    </UdTabSwitch>
    <p>选择的索引值：{{curIndex}}</p>
    <p>选择的ID值：{{curId}}</p>
    <p>选择的Title值：{{curTitle}}</p>
  </div>
</template>
<script>
import { UdTabSwitch } from '@udesk/mbank-ui-v2';
export default {
  components: { UdTabSwitch },
  props: ['data'],
  data() {
    return {
      tabNum:"01",
      tipCur: 1,
      curIndex:"",
      curId:"",
      curTitle:"",
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
      tabListMore: [
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
        },
      ]
    };
  },
  methods: {
    handleChange(index, data) {
      console.log("索引值="+index);
      console.log("当前id值" + data.id);
      this.curIndex = index;
      this.curId=data.id;
      this.curTitle = data.title;
    }
  }
};
</script>