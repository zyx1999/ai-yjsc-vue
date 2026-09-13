<template>
<div class="UdFormLabel_wrapper form-label-list">
    <div class="laber-wrapper">
      <UdFormInput  labelKey="收款人姓名"  :placeholder="placeholder" v-model="value"></UdFormInput> 
    </div> 
    <div class="laber-wrapper"> 
      <UdFormLabel labelKey="产品信息" labelValue="Au标准金">
      </UdFormLabel>
    </div>
    <div class="laber-wrapper">
      <UdFormLabel labelKey="通讯地址" labelValue="北京市东418号城区建国门内大街油通街建国门乙18号"></UdFormLabel>
    </div>
  </div>
</template>
<script>
import { UdFormLabel } from '@udesk/mbank-ui-v2';
import { UdFormInput } from '@udesk/mbank-ui-v2';
export default {
  components: { UdFormLabel, UdFormInput },
  data() {
    return {
       placeholder:'输入收款人姓名',
       value: ''
    }
  }
}
</script>
<style lang="scss">
.form-label-list .page_formlabel .s_left {
  width: auto!important;
  margin-left: 0px!important;
}
.form-label-list .labelSep {
  display: flex!important;
}
.form-label-list .page_formlabel .div_item {
  width: auto!important;
}
.form-label-list .page_formlabel .s_right {
  margin-right: 0!important;
}
</style>
<style lang="scss" scoped>
.UdFormLabel_wrapper {
    margin-top: 80px;
}

</style>