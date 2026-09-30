<template>
  <div class="session-list">
    <p v-if="!sessions.length" class="session-empty">暂无历史会话</p>
    <div
      v-for="item in sessions"
      :key="item.id"
      :class="['session-item', item.id === activeId ? 'session-item-active' : '']"
      @click="$emit('select', item.id)"
    >
      <div class="session-item-main">
        <p class="session-item-title">{{ item.title }}</p>
        <p class="session-item-time">{{ timeOf(item) }}</p>
      </div>
      <div class="session-item-actions">
        <span @click.stop="$emit('rename', item)">重命名</span>
        <span @click.stop="$emit('remove', item.id)">删除</span>
      </div>
    </div>
  </div>
</template>

<script>
import { prettyTime } from '@/utils/chatTime'

export default {
  name: 'SessionListPanel',
  props: {
    sessions: {
      type: Array,
      default: () => []
    },
    activeId: {
      type: [Number, String],
      default: null
    }
  },
  methods: {
    timeOf (item) {
      return prettyTime(item.lastMessageAt || item.createdAt)
    }
  }
}
</script>

<style scoped lang="scss">
.session-list {
  .session-empty {
    padding: 60px 0;
    text-align: center;
    color: #b5b5b5;
    font-size: 13px;
  }

  .session-item {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: #eef4f3;

      .session-item-actions {
        opacity: 1;
      }
    }

    &.session-item-active {
      background: #e6f7f4;
      box-shadow: inset 3px 0 0 #00c3ac;

      .session-item-title {
        color: #00a996;
      }
    }

    .session-item-main {
      flex: 1;
      min-width: 0;

      .session-item-title {
        margin: 0;
        font-size: 13px;
        color: #1f2d3d;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .session-item-time {
        margin: 3px 0 0;
        font-size: 12px;
        color: #9aa8b5;
      }
    }

    .session-item-actions {
      flex: none;
      margin-left: 10px;
      font-size: 12px;
      color: #7a8b9a;
      opacity: 0;
      transition: opacity 0.15s ease;

      span {
        margin-left: 10px;

        &:hover {
          color: #00a996;
        }
      }
    }
  }
}

// 手机/小窗口：触屏无 hover，操作常显、尺寸放大
@media (max-width: 750px) {
  .session-list {
    .session-empty {
      padding: 60px 0;
      font-size: 26px;
    }

    .session-item {
      margin-bottom: 12px;
      padding: 20px 24px;
      border-radius: 16px;

      .session-item-main {
        .session-item-title {
          font-size: 28px;
        }

        .session-item-time {
          font-size: 22px;
        }
      }

      .session-item-actions {
        opacity: 1;
        font-size: 24px;

        span {
          margin-left: 20px;
        }
      }
    }
  }
}
</style>
