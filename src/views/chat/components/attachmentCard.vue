<template>
  <div class="attachment-card" :class="file.uploading ? 'attachment-uploading' : ''" @click="onClick">
    <span class="attachment-icon">📎</span>
    <span class="attachment-name">{{ file.fileName }}</span>
    <span class="attachment-size">{{ file.uploading ? '上传中…' : sizeText }}</span>
  </div>
</template>

<script>
import { formatSize } from '@/utils/chatTime'

export default {
  name: 'AttachmentCard',
  props: {
    file: {
      type: Object,
      required: true
    }
  },
  computed: {
    sizeText () {
      return formatSize(this.file.sizeBytes || this.file.size || 0)
    }
  },
  methods: {
    onClick () {
      if (this.file.uploading) {
        return
      }
      this.$emit('download', this.file)
    }
  }
}
</script>

<style scoped lang="scss">
.attachment-card {
  display: flex;
  align-items: center;
  max-width: 420px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f6f8fa;
  border: 1px solid #e5eaef;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    border-color: #00c3ac;
  }

  &.attachment-uploading {
    opacity: 0.75;
    cursor: default;
  }

  .attachment-icon {
    flex: none;
    margin-right: 8px;
  }

  .attachment-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #263445;
  }

  .attachment-size {
    flex: none;
    margin-left: 10px;
    color: #8a97a8;
  }
}

@media (max-width: 750px) {
  .attachment-card {
    max-width: 520px;
    margin-top: 12px;
    padding: 14px 20px;
    border-radius: 16px;
    font-size: 24px;

    .attachment-icon {
      margin-right: 10px;
    }

    .attachment-size {
      margin-left: 12px;
    }
  }
}
</style>
