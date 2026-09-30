<template>
  <div class="chat-page">
    <div class="statusBar"></div>
    <mt-header class="chat-header" title="AI 智能助手">
      <router-link to="/" slot="left">
        <mt-button icon="back"></mt-button>
      </router-link>
      <mt-button slot="right" class="header-btn" @click="openDrawer">记录</mt-button>
    </mt-header>

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

    <input-bar :disabled="runActive" :sending="sending" @send="onSend" @stop="onStop" />

    <session-drawer
      :visible="drawerVisible"
      :sessions="sessions"
      :active-id="activeSessionId"
      @close="setDrawer(false)"
      @select="onSelect"
      @create="onCreate"
      @rename="onRename"
      @remove="onRemove"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { Toast } from 'mint-ui'
import MessageBubble from './components/messageBubble'
import InputBar from './components/inputBar'
import SessionDrawer from './components/sessionDrawer'
import { attachmentUrl } from '@/api/chat'

export default {
  name: 'ChatView',
  components: {
    MessageBubble,
    InputBar,
    SessionDrawer
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
      'drawerVisible'
    ])
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
    openDrawer () {
      this.setDrawer(true)
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
    onSelect (sessionId) {
      this.$store.dispatch('chat/openSession', sessionId).then(this.scrollToBottom).catch(error => {
        Toast({ message: error.message, position: 'bottom' })
      })
    },
    onCreate () {
      this.$store.dispatch('chat/newSession').catch(error => {
        Toast({ message: error.message, position: 'bottom' })
      })
    },
    onRename (payload) {
      this.$store.dispatch('chat/renameSession', payload).catch(error => {
        Toast({ message: error.message, position: 'bottom' })
      })
    },
    onRemove (sessionId) {
      this.$store.dispatch('chat/removeSession', sessionId).catch(error => {
        Toast({ message: error.message, position: 'bottom' })
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
  flex-direction: column;
  background: #f4f4f4;

  .statusBar {
    flex: none;
    height: 40px;
    background: #fff;
  }

  .chat-header {
    flex: none;
    background: #fff;
    color: #333;
    z-index: 20;

    .mint-header-title {
      font-weight: 600;
    }

    .header-btn {
      color: #00a996;
      font-size: 26px;
    }
  }

  .chat-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    -webkit-overflow-scrolling: touch;

    .chat-status {
      padding: 120px 60px;
      text-align: center;
      color: #999;
      font-size: 26px;

      .chat-status-text {
        margin: 0 0 24px;
      }

      .chat-retry {
        padding: 12px 48px;
        border: 1px solid #00c3ac;
        border-radius: 32px;
        background: none;
        color: #00a996;
        font-size: 26px;
      }
    }

    .chat-empty {
      padding: 160px 60px 60px;
      text-align: center;

      .chat-empty-title {
        margin: 0 0 20px;
        font-size: 34px;
        font-weight: 600;
        color: #333;
      }

      .chat-empty-sub {
        margin: 0;
        font-size: 26px;
        line-height: 40px;
        color: #9a9a9a;
      }
    }
  }
}
</style>
