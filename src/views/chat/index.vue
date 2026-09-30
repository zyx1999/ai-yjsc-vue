<template>
  <div class="chat-page">
    <div class="chat-shell">
      <!-- 左侧会话栏（PC 常驻；窄屏隐藏，用顶栏「会话」按钮打开抽屉） -->
      <aside class="chat-sidebar">
        <div class="sidebar-head">
          <span class="sidebar-brand">AI 智能助手</span>
          <span class="sidebar-sub">云虾大模型 · 对话办理业务</span>
        </div>
        <button type="button" class="sidebar-new" @click="onCreate">＋ 新建会话</button>
        <div class="sidebar-list">
          <session-list-panel
            :sessions="sessions"
            :active-id="activeSessionId"
            @select="onSelect"
            @rename="askRename"
            @remove="askRemove"
          />
        </div>
      </aside>

      <!-- 右侧对话主区 -->
      <section class="chat-main">
        <header class="chat-topbar">
          <div class="topbar-left">
            <button type="button" class="topbar-narrow-btn" @click="setDrawer(true)">☰ 会话</button>
            <h1 class="topbar-title">{{ activeTitle }}</h1>
          </div>
          <div class="topbar-right">
            <label class="stream-toggle" title="开启后应答逐段展示，关闭后整段直接展示">
              <span class="stream-toggle-label">流式输出</span>
              <van-switch :value="streamEnabled" size="20px" @change="onStreamChange" />
            </label>
            <router-link class="topbar-link" to="/">返回首页</router-link>
          </div>
        </header>

        <div ref="body" class="chat-body">
          <div v-if="loading" class="chat-status">正在连接服务…</div>
          <div v-else-if="error && !messages.length" class="chat-status">
            <p class="chat-status-text">{{ error }}</p>
            <button type="button" class="chat-retry" @click="retry">重试</button>
          </div>
          <template v-else>
            <div v-if="!messages.length" class="chat-empty">
              <p class="chat-empty-title">您好，我是云虾智能助手</p>
              <p class="chat-empty-sub">可以向我咨询业务、描述您的需求，或上传材料让我帮忙查看。</p>
            </div>
            <message-bubble
              v-for="message in messages"
              :key="message.localId"
              :message="message"
              @download="onDownload"
              @refresh="refresh"
            />
          </template>
        </div>

        <div class="chat-input-wrap">
          <input-bar :disabled="runActive" :sending="sending" @send="onSend" @stop="onStop" />
        </div>
      </section>
    </div>

    <session-drawer
      :visible="drawerVisible"
      :sessions="sessions"
      :active-id="activeSessionId"
      @close="setDrawer(false)"
      @select="onSelect"
      @create="onCreate"
      @rename="askRename"
      @remove="askRemove"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { Toast, MessageBox } from 'mint-ui'
import MessageBubble from './components/messageBubble'
import InputBar from './components/inputBar'
import SessionDrawer from './components/sessionDrawer'
import SessionListPanel from './components/sessionListPanel'
import { attachmentUrl } from '@/api/chat'

export default {
  name: 'ChatView',
  components: {
    MessageBubble,
    InputBar,
    SessionDrawer,
    SessionListPanel
  },
  computed: {
    ...mapState('chat', [
      'loading',
      'sessions',
      'activeSessionId',
      'messages',
      'sending',
      'runActive',
      'error',
      'drawerVisible',
      'streamEnabled'
    ]),
    activeTitle () {
      const session = this.sessions.find(item => item.id === this.activeSessionId)
      return session ? session.title : 'AI 智能助手'
    }
  },
  watch: {
    messages: {
      deep: true,
      handler () {
        this.scrollToBottom()
      }
    },
    error (value) {
      if (value) {
        Toast({ message: value, position: 'bottom', duration: 3000 })
      }
    }
  },
  created () {
    this.$store.dispatch('chat/init')
  },
  mounted () {
    this.scrollToBottom()
  },
  methods: {
    scrollToBottom () {
      this.$nextTick(() => {
        const body = this.$refs.body
        if (body) {
          body.scrollTop = body.scrollHeight
        }
      })
    },
    retry () {
      this.$store.dispatch('chat/init')
    },
    refresh () {
      this.$store.dispatch('chat/refreshActive').catch(error => {
        Toast({ message: error.message, position: 'bottom' })
      })
    },
    setDrawer (value) {
      this.$store.dispatch('chat/setDrawer', value)
    },
    onSend (payload) {
      this.$store.dispatch('chat/sendMessage', payload).then(this.scrollToBottom)
    },
    onStop () {
      this.$store.dispatch('chat/stopRun')
    },
    onStreamChange (value) {
      this.$store.dispatch('chat/setStreamEnabled', value)
    },
    onSelect (sessionId) {
      this.setDrawer(false)
      this.$store.dispatch('chat/openSession', sessionId).then(this.scrollToBottom).catch(error => {
        Toast({ message: error.message, position: 'bottom' })
      })
    },
    onCreate () {
      this.$store.dispatch('chat/newSession').catch(error => {
        Toast({ message: error.message, position: 'bottom' })
      })
    },
    askRename (item) {
      MessageBox({
        title: '重命名会话',
        message: '',
        showInput: true,
        inputValue: item.title,
        inputPattern: /^.{1,60}$/,
        inputErrorMessage: '标题需为 1-60 个字符',
        showCancelButton: true
      }).then(result => {
        const title = ((result && result.value) || '').trim()
        if (title) {
          return this.$store.dispatch('chat/renameSession', { id: item.id, title: title })
        }
        return null
      }).catch(error => {
        if (error && error.message) {
          Toast({ message: error.message, position: 'bottom' })
        }
      })
    },
    askRemove (sessionId) {
      MessageBox({
        title: '删除会话',
        message: '删除后会话将从列表中移除，是否继续？',
        showCancelButton: true
      }).then(() => {
        return this.$store.dispatch('chat/removeSession', sessionId)
      }).catch(error => {
        if (error && error.message) {
          Toast({ message: error.message, position: 'bottom' })
        }
      })
    },
    onDownload (file) {
      if (!this.activeSessionId || !file.id) {
        return
      }
      window.location.href = attachmentUrl(this.activeSessionId, file.id)
    }
  }
}
</script>

<style scoped lang="scss">
.chat-page {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  background: #eef1f5;

  .chat-shell {
    display: flex;
    width: 100%;
    max-width: 1200px;
    height: 100%;
    background: #fff;
    box-shadow: 0 0 24px rgba(31, 45, 61, 0.08);
  }

  // —— 左侧会话栏 ——
  .chat-sidebar {
    flex: none;
    display: flex;
    flex-direction: column;
    width: 260px;
    border-right: 1px solid #eceff3;
    background: #f8fafb;

    .sidebar-head {
      padding: 20px 18px 4px;

      .sidebar-brand {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #1f2d3d;
      }

      .sidebar-sub {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: #8a97a8;
      }
    }

    .sidebar-new {
      margin: 14px 16px 10px;
      padding: 9px 0;
      border: 1px solid #00c3ac;
      border-radius: 8px;
      background: #00c3ac;
      color: #fff;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        background: #00b39e;
      }
    }

    .sidebar-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 10px 16px;
    }
  }

  // —— 右侧对话主区 ——
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .chat-topbar {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      padding: 0 24px;
      border-bottom: 1px solid #eceff3;

      .topbar-left {
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .topbar-narrow-btn {
        display: none;
        margin-right: 12px;
        padding: 6px 10px;
        border: 1px solid #dcdfe6;
        border-radius: 6px;
        background: #fff;
        color: #4a5a6a;
        font-size: 13px;
        cursor: pointer;
      }

      .topbar-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2d3d;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .topbar-right {
        flex: none;
        display: flex;
        align-items: center;
      }

      .stream-toggle {
        display: flex;
        align-items: center;
        margin-right: 20px;
        cursor: pointer;

        .stream-toggle-label {
          margin-right: 8px;
          font-size: 13px;
          color: #5a6a7a;
        }
      }

      .topbar-link {
        font-size: 13px;
        color: #00a996;
        text-decoration: none;
      }
    }

    .chat-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px 28px;
      background: #fbfcfd;

      .chat-status {
        padding: 80px 24px;
        text-align: center;
        color: #8a97a8;
        font-size: 14px;

        .chat-status-text {
          margin: 0 0 16px;
        }

        .chat-retry {
          padding: 7px 22px;
          border: 1px solid #00c3ac;
          border-radius: 16px;
          background: none;
          color: #00a996;
          font-size: 13px;
          cursor: pointer;
        }
      }

      .chat-empty {
        padding: 120px 40px 40px;
        text-align: center;

        .chat-empty-title {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 600;
          color: #1f2d3d;
        }

        .chat-empty-sub {
          margin: 0;
          font-size: 14px;
          line-height: 22px;
          color: #9aa8b5;
        }
      }
    }

    .chat-input-wrap {
      flex: none;
      border-top: 1px solid #eceff3;
      background: #fff;
    }
  }
}

// 窄屏（小窗口/平板）：隐藏常驻侧栏，改用抽屉
@media (max-width: 960px) {
  .chat-page {
    .chat-shell {
      max-width: none;
      box-shadow: none;
    }

    .chat-sidebar {
      display: none;
    }

    .chat-main .chat-topbar .topbar-narrow-btn {
      display: inline-block;
    }
  }
}

// 手机宽度（根字号按屏宽/7.5 换算）：关键尺寸放大到设计稿骨架水平
@media (max-width: 750px) {
  .chat-page {
    .chat-main {
      .chat-topbar {
        height: 88px;
        padding: 0 24px;

        .topbar-narrow-btn {
          padding: 10px 16px;
          font-size: 24px;
        }

        .topbar-title {
          font-size: 28px;
        }

        .stream-toggle {
          margin-right: 20px;

          .stream-toggle-label {
            font-size: 24px;
          }
        }

        .topbar-link {
          font-size: 24px;
        }
      }

      .chat-body {
        padding: 24px;

        .chat-status {
          padding: 120px 60px;
          font-size: 26px;

          .chat-status-text {
            margin: 0 0 24px;
          }

          .chat-retry {
            padding: 12px 48px;
            border-radius: 32px;
            font-size: 26px;
          }
        }

        .chat-empty {
          padding: 160px 60px 60px;

          .chat-empty-title {
            margin: 0 0 20px;
            font-size: 34px;
          }

          .chat-empty-sub {
            font-size: 26px;
            line-height: 40px;
          }
        }
      }
    }
  }
}
</style>
