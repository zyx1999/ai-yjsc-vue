<template>
  <div class="index-view">
    <section>
      <div class="statusBar"></div>
      <mt-header title="掌银 移动 H5 功能样例" fixed>
        <!-- <mt-button icon="search" slot="right" @click="handleBack"></mt-button> -->
        <!-- <mt-button icon="more" slot="right" @click="handleNotice"></mt-button> -->
      </mt-header>
     <div class="wrapper">      
      <div class="myPage"></div>
      <div class="content-one list-view-new">
        <h3>- 掌银UI组件 -</h3>
        <ul class="list">
        <li v-for="(item, index) in mbRoutes.slice(1, mbRoutes.length)" :key="index">
          <router-link class="list-item" :to="item.path">
            <img :src="require('@/assets/images/'+item.img+'.png')" class="list-img">
            {{item.name}}
            <i class="mint-cell-allow-right"></i>
          </router-link>
        </li>
      </ul>
        
        <!-- <div v-for="(item, index) in indexMores.slice(3, 4)" :key="index+'label'" class="content-left-img">
          <router-link class="list-item" :to="item.path">
            <img :src="require('@/assets/images/'+item.image+'.png')" class="contentImg">
            <p>{{item.name}}</p>
          </router-link>
        </div> -->
      </div>
     
      </div>
    </section>
  </div>
</template>

<script >

import mbRoutes from '../router/mbankRouter';
// 主页面，列表
export default {
  data() {
    return {
      mbRoutes
    };
  },
  methods: {
    handleBack() {
      this.$router.push("/indexSearch");
    },
    handleNotice() {
      this.$router.push("/indexNotice");
    }
  }
};
</script>
<style scoped lang="scss">
.list-view-new {
  .mint-header{
    padding: 0;
    .mint-header-button.is-left {
      display: flex;
      .mint-button{
        width: 48px;
        height: 48px;
        margin: 0 32px;
        padding: 0;
        .mint-button-icon{
          display: inline;
          vertical-align: baseline;
        }
        i {
          display: flex;
          width: 40px;
          height: 40px;
          font-size: 40px;
          flex-direction: column;
          justify-content: center;
        }
      }
    }
  }
  .myPage {
    background-color: #fafafa;
    color: #333;
    height: 270px;
    //overflow: scroll;
    background: url("../assets/images/bg-index.png");
    background-size: cover;
    overflow-x: hidden;
    text-align: center;
    .headerPhoto {
      width: 96px;
      height: 96px;
      margin: 50px 0 10px;
    }
    .headerLoginBtn {
      margin-top: 0;
      color: #202020;
      font-weight: 600;
      font-size: 36px;
    }
  }
  section {
    margin-top: -88px;
  }
  .list-img {
    width: 48px;
    height: 48px;
    margin:12px 36px 0 32px;
    position: relative;
    top: 12px;
  }
  .mint-cell-allow-right::after {
    top: auto;
    margin-top: 50px;
  }
  .list {
    // padding: 0 10px 0;
    margin-top: 0;
    background: #f4f4f4;
    li {
      height: 90px;
      list-style: none;
      margin-bottom: 20px;
      border: 0px!important;
      // border-bottom: 1px solid #f5f5f5;
      // padding-top: 5px;
      background: #fff;
      line-height: 90px;
      .list-item {
        color: inherit;
        text-decoration: none;
        .mint-cell-allow-right::after {
          width: 21px;
          height: 21px;
          right: 32px;
        }
      }
    }
  }
}
.mint-tab-container-wrap {
  padding-bottom: 97px;
}

body {
  margin: 0;
}
.index-view {
  h3 {
  font-size: 36px;  // 引导性文字和标题栏字体
  color: #000;  // 标题栏字体颜色    
  text-align: center;
  line-height: 64px;
  height: 64px;  // 列表标题高度
  margin: 0px 0px 14px 0px;
 }
  margin-top: 88px;
  .mint-header {
    background-color: #fafafa;
    color: #333;
    .mint-header-title {
      font-weight: 600;
      flex: none;
    }
    .mint-button {
      color: #333;
      margin-left: 3px;
      .mint-button-text {
        letter-spacing: 1px;
        font-weight: 600;
      }
    }
  }
 .wrapper {
    margin: 0px 0px!important;
  }    
  .myPage {
    background-color: #fafafa;
    color: inherit;
    height:200px;
    margin:32px 32px;
    border-radius: 10px;
    // height: calc(100vh * 0.25);
    //overflow: scroll;
    background: url("../assets/images/bg.jpg");
    // background: url("../../assets/bg_header.png");
    background-size: cover;
    overflow-x: hidden;
  }
  .headerPhoto {
    width: 60px;
    height: 60px;
    top: 7%;
    left: 8%;
    position: absolute;
  }
  .headerLoginBtn {
    top: 30%;
    left: 32%;
    position: relative;
    color: #fff;
    font-size: larger;
  }
  .content-one {
    min-height: 50px;
    overflow: hidden;
    border: 0px!important;
    // border-bottom: 5px solid #f5f5f5;
    padding-bottom: 20px;  // 内容模块之间间距
    .content-left-img {
      margin-bottom: 20px;
      float: left;
      width: 20%;
      text-align: center;
      .list-item {
       color: #222;
        text-decoration: none;
        font-family: inherit;        
        .contentImg {
          width: 64px;
          height: 64px;          
        }
        p {
          margin: 0 auto;
          padding-top: 16px;
          font-size: 26px;
          // 字符太长，省略 --shuhh
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      }
    }
  }
  .box-bottom {
    height: 10px;
    background-color: 10px;
  }
}
</style>