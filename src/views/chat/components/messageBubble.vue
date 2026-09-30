<template>
  <div :class="['bubble-row', isUser ? 'bubble-row-user' : 'bubble-row-assistant']">
    <div class="bubble">
      <run-progress
        v-if="!isUser && message.steps && message.steps.length"
        :steps="message.steps"
        :pending="message.pending"
      />
      <p v-if="isError" class="bubble-error">{{ message.content }}</p>
      <p v-else-if="message.pending && !message.content" class="bubble-loading">正在思考，请稍候…</p>
      <p v-else class="bubble-text">{{ message.content }}</p>
      <div v-if="isUnknown" class="bubble-refresh" @click="$emit('refresh')">重新核实会话状态</div>
      <div v-if="message.attachments && message.attachments.length" class="bubble-files">
        <attachment-card
          v-for="file in message.attachments"
          :key="file.id"
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
import { shortTime } from '@/utils/chatTime'

export default {
  name: 'MessageBubble',
  components: {
    RunProgress,
    AttachmentCard
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
    timeText () {
      return shortTime(this.message.createdAt)
    }
  }
}
</script>

<style scoped lang="scss">
.bubble-row {
  display: flex;
  margin-bottom: 24px;

  &.bubble-row-user {
    justify-content: flex-end;

    .bubble {
      background: #00c3ac;
      color: #fff;

      .bubble-time {
        color: rgba(255, 255, 255, 0.75);
        text-align: right;
      }

      .attachment-card {
        border: none;
      }
    }
  }

  &.bubble-row-assistant {
    justify-content: flex-start;

    .bubble {
      background: #fff;
      color: #333;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
  }

  .bubble {
    max-width: 580px;
    padding: 22px 26px 14px;
    border-radius: 20px;
    font-size: 28px;
    line-height: 42px;
    word-break: break-word;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

    .bubble-text {
      margin: 0;
      white-space: pre-wrap;
    }

    .bubble-loading {
      margin: 0;
      color: #9a9a9a;
    }

    .bubble-error {
      margin: 0;
      color: #d9534f;
      white-space: pre-wrap;
    }

    .bubble-refresh {
      margin-top: 12px;
      font-size: 24px;
      color: #00c3ac;
      text-decoration: underline;
    }

    .bubble-files {
      display: flex;
      flex-direction: column;
    }

    .bubble-time {
      margin: 10px 0 0;
      font-size: 22px;
      color: #b5b5b5;
    }
  }
}
</style>
