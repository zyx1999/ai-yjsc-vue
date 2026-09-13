<template>
  <div>
    <div class="m-top">
      <UdResultProgress :progressArr="data.progressArr"></UdResultProgress>
    </div>
    <div class="m-top">
      <UdResultProgress :progressArr="data.infoList"></UdResultProgress>
    </div>
  </div>
</template>
<script>
import { UdResultProgress }  from '@udesk/mbank-ui-v2';
export default {
    components: { UdResultProgress },
    props: ['data'],
    data(){
        return{
             
        }
    }
}
</script>
<style lang="scss" scoped>
    .m-top {
        margin-top: 30px;
    }
</style>