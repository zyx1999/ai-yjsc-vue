<template>
  <div class="attachment-card" @click="onClick">
    <span class="attachment-icon">📎</span>
    <span class="attachment-name">{{ file.fileName }}</span>
    <span class="attachment-size">{{ sizeText }}</span>
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
      this.$emit('download', this.file)
    }
  }
}
</script>

<style scoped lang="scss">
.attachment-card {
  display: flex;
  align-items: center;
  max-width: 520px;
  margin-top: 12px;
  padding: 14px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 24px;

  .attachment-icon {
    flex: none;
    margin-right: 10px;
  }

  .attachment-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #333;
  }

  .attachment-size {
    flex: none;
    margin-left: 12px;
    color: #999;
  }
}
</style>
