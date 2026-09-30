<template>
  <van-popup :value="visible" position="right" class="session-drawer" :style="popupStyle" @input="onInput">
    <div class="drawer-head">
      <span class="drawer-title">会话记录</span>
      <button type="button" class="drawer-new" @click="$emit('create')">＋ 新会话</button>
    </div>
    <div class="drawer-list">
      <session-list-panel
        :sessions="sessions"
        :active-id="activeId"
        @select="$emit('select', $event)"
        @rename="$emit('rename', $event)"
        @remove="$emit('remove', $event)"
      />
    </div>
  </van-popup>
</template>

<script>
import SessionListPanel from './sessionListPanel'

export default {
  name: 'SessionDrawer',
  components: {
    SessionListPanel
  },
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
    }
  }
}
</script>

<style scoped lang="scss">
.session-drawer {
  display: flex;
  flex-direction: column;
  background: #f7f9fa;

  .drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    background: #fff;
    border-bottom: 1px solid #eceff3;

    .drawer-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2d3d;
    }

    .drawer-new {
      border: none;
      background: none;
      padding: 0;
      font-size: 13px;
      color: #00a996;
      cursor: pointer;
    }
  }

  .drawer-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }
}

@media (max-width: 750px) {
  .session-drawer {
    .drawer-head {
      padding: 24px 28px;

      .drawer-title {
        font-size: 32px;
      }

      .drawer-new {
        font-size: 26px;
      }
    }

    .drawer-list {
      padding: 12px 0;
    }
  }
}
</style>
