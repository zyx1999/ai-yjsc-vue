<template>
  <van-popup :value="visible" position="right" class="session-drawer" :style="popupStyle" @input="onInput">
    <div class="drawer-head">
      <span class="drawer-title">会话记录</span>
      <button type="button" class="drawer-new" @click="$emit('create')">＋ 新会话</button>
    </div>
    <div class="drawer-list">
      <p v-if="!sessions.length" class="drawer-empty">暂无历史会话</p>
      <div
        v-for="item in sessions"
        :key="item.id"
        :class="['drawer-item', item.id === activeId ? 'drawer-item-active' : '']"
        @click="$emit('select', item.id)"
      >
        <div class="drawer-item-main">
          <p class="drawer-item-title">{{ item.title }}</p>
          <p class="drawer-item-time">{{ timeOf(item) }}</p>
        </div>
        <div class="drawer-item-actions">
          <span @click.stop="rename(item)">重命名</span>
          <span @click.stop="remove(item)">删除</span>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script>
import { MessageBox } from 'mint-ui'
import { prettyTime } from '@/utils/chatTime'

export default {
  name: 'SessionDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    sessions: {
      type: Array,
      default: () => []
    },
    activeId: {
      type: [Number, String],
      default: null
    }
  },
  data () {
    return {
      popupStyle: {
        width: '78%',
        height: '100%'
      }
    }
  },
  methods: {
    onInput (value) {
      if (!value) {
        this.$emit('close')
      }
    },
    timeOf (item) {
      return prettyTime(item.lastMessageAt || item.createdAt)
    },
    rename (item) {
      MessageBox({
        title: '重命名会话',
        message: '',
        showInput: true,
        inputValue: item.title,
        inputPattern: /^.{1,60}$/,
        inputErrorMessage: '标题需为 1-60 个字符',
        showCancelButton: true
      }).then(result => {
        const title = (result && result.value || '').trim()
        if (title) {
          this.$emit('rename', { id: item.id, title: title })
        }
      }).catch(() => {})
    },
    remove (item) {
      MessageBox({
        title: '删除会话',
        message: '删除后会话将从列表中移除，是否继续？',
        showCancelButton: true
      }).then(() => {
        this.$emit('remove', item.id)
      }).catch(() => {})
    }
  }
}
</script>

<style scoped lang="scss">
.session-drawer {
  display: flex;
  flex-direction: column;
  background: #f7f7f7;

  .drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px;
    background: #fff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .drawer-title {
      font-size: 32px;
      font-weight: 600;
      color: #333;
    }

    .drawer-new {
      border: none;
      background: none;
      padding: 0;
      font-size: 26px;
      color: #00c3ac;
    }
  }

  .drawer-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 0;

    .drawer-empty {
      padding: 60px 0;
      text-align: center;
      color: #b5b5b5;
      font-size: 26px;
    }

    .drawer-item {
      display: flex;
      align-items: center;
      margin: 12px 20px;
      padding: 20px 24px;
      border-radius: 16px;
      background: #fff;

      &.drawer-item-active {
        outline: 2px solid rgba(0, 195, 172, 0.6);

        .drawer-item-title {
          color: #00a996;
        }
      }

      .drawer-item-main {
        flex: 1;
        min-width: 0;

        .drawer-item-title {
          margin: 0;
          font-size: 28px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .drawer-item-time {
          margin: 8px 0 0;
          font-size: 22px;
          color: #b5b5b5;
        }
      }

      .drawer-item-actions {
        flex: none;
        margin-left: 16px;
        font-size: 24px;
        color: #7a7a7a;

        span {
          margin-left: 20px;
        }
      }
    }
  }
}
</style>
