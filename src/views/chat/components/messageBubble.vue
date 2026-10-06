<template>
  <div :class="['bubble-row', isUser ? 'bubble-row-user' : 'bubble-row-assistant']">
    <div class="bubble-avatar">{{ isUser ? '我' : 'AI' }}</div>
    <div class="bubble">
      <run-progress
        v-if="!isUser && message.steps && message.steps.length"
        :steps="message.steps"
        :pending="message.pending"
      />
      <p v-if="isError" class="bubble-error">{{ message.content }}</p>
      <p v-else-if="message.pending && !message.content" class="bubble-loading">正在思考，请稍候…</p>
      <markdown-view
        v-else-if="isMarkdown"
        class="bubble-markdown"
        :content="message.content"
        :caret="message.revealing"
      />
      <p v-else class="bubble-text">{{ message.content }}<span v-if="message.revealing" class="bubble-caret">▍</span></p>
      <p v-if="isUser && message.error" class="bubble-error bubble-error-inline">{{ message.error }}</p>
      <div v-if="isUnknown" class="bubble-refresh" @click="$emit('refresh')">重新核实会话状态</div>
      <div v-if="message.attachments && message.attachments.length" class="bubble-files">
        <attachment-card
          v-for="file in message.attachments"
          :key="file.id || file.fileName"
          :file="file"
          @download="$emit('download', $event)"
        />
      </div>
      <p class="bubble-time">{{ timeText }}</p>
    </div>
  </div>
</template>

<script>
import RunProgress from './runProgress'
import AttachmentCard from './attachmentCard'
import MarkdownView from '@/components/markdown/MarkdownView.vue'
import { shortTime } from '@/utils/chatTime'

export default {
  name: 'MessageBubble',
  components: {
    RunProgress,
    AttachmentCard,
    MarkdownView
  },
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  computed: {
    isUser () {
      return this.message.role === 'USER'
    },
    isUnknown () {
      return !this.isUser && this.message.status === 'UNKNOWN'
    },
    isError () {
      return !this.isUser &&
        (this.message.status === 'FAILED' || this.message.status === 'UNKNOWN') &&
        !!this.message.content
    },
    // 助手答复按 Markdown 渲染（大模型返回报告型内容：标题 / 表格 / 列表等）
    isMarkdown () {
      return !this.isUser && !!this.message.content
    },
    timeText () {
      return shortTime(this.message.createdAt)
    }
  }
}
</script>

<style scoped lang="scss">
.bubble-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 18px;

  &.bubble-row-user {
    flex-direction: row-reverse;

    .bubble {
      background: #e6f7f4;
      color: #1f2d3d;
      border: 1px solid #d4f0eb;

      .bubble-time {
        text-align: right;
      }
    }

    .bubble-avatar {
      background: #00c3ac;
      color: #fff;
    }
  }

  &.bubble-row-assistant {
    .bubble {
      background: #fff;
      color: #263445;
      border: 1px solid #eceff3;
    }

    .bubble-avatar {
      background: #eaf6f4;
      color: #00a996;
    }
  }

  .bubble-avatar {
    flex: none;
    width: 34px;
    height: 34px;
    margin: 0 10px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    line-height: 34px;
    text-align: center;
    user-select: none;
  }

  .bubble {
    max-width: 72%;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 22px;
    word-break: break-word;
    box-shadow: 0 1px 3px rgba(31, 45, 61, 0.04);

    .bubble-text {
      margin: 0;
      white-space: pre-wrap;
    }

    .bubble-markdown {
      margin: 0;
    }

    .bubble-caret {
      display: inline-block;
      margin-left: 2px;
      color: #00a996;
      animation: caret-blink 0.9s step-end infinite;
    }

    .bubble-loading {
      margin: 0;
      color: #9aa8b5;
    }

    .bubble-error {
      margin: 0;
      color: #d9534f;
      white-space: pre-wrap;
    }

    .bubble-error-inline {
      margin-top: 6px;
      font-size: 12px;
    }

    .bubble-refresh {
      margin-top: 8px;
      font-size: 13px;
      color: #00a996;
      cursor: pointer;
      text-decoration: underline;
    }

    .bubble-files {
      display: flex;
      flex-direction: column;
    }

    .bubble-time {
      margin: 6px 0 0;
      font-size: 12px;
      color: #a8b3bf;
    }
  }
}

@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}

// 手机/小窗口：尺寸放大到设计稿骨架水平
@media (max-width: 750px) {
  .bubble-row {
    margin-bottom: 24px;

    .bubble-avatar {
      width: 60px;
      height: 60px;
      margin: 0 16px;
      font-size: 24px;
      line-height: 60px;
    }

    .bubble {
      max-width: 78%;
      padding: 22px 26px;
      border-radius: 20px;
      font-size: 28px;
      line-height: 42px;

      .bubble-error-inline {
        margin-top: 8px;
        font-size: 24px;
      }

      .bubble-refresh {
        margin-top: 12px;
        font-size: 24px;
      }

      .bubble-time {
        margin: 10px 0 0;
        font-size: 22px;
      }
    }
  }
}
</style>
