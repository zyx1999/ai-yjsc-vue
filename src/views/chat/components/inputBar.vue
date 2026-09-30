<template>
  <div class="input-bar">
    <div v-if="files.length" class="input-files">
      <span v-for="(file, index) in files" :key="index" class="input-file">
        <span class="input-file-name">{{ file.name }}</span>
        <span class="input-file-remove" @click="removeFile(index)">×</span>
      </span>
    </div>
    <div class="input-row">
      <button type="button" class="input-attach" :disabled="disabled || sending" @click="pickFile">＋</button>
      <input ref="picker" type="file" class="input-picker" multiple @change="onFileChange">
      <textarea
        ref="textarea"
        v-model="text"
        class="input-text"
        rows="1"
        placeholder="请输入您的问题…"
        :disabled="disabled"
        @input="autoSize"
        @keydown.enter.exact.prevent="submit"
      ></textarea>
      <button v-if="!sending" type="button" class="input-send" :disabled="disabled || !canSend" @click="submit">发送</button>
      <button v-else type="button" class="input-stop" @click="$emit('stop')">停止</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InputBar',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    sending: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      text: '',
      files: []
    }
  },
  computed: {
    canSend () {
      return !!this.text.trim() || this.files.length > 0
    }
  },
  methods: {
    pickFile () {
      this.$refs.picker.click()
    },
    onFileChange (event) {
      const picked = event.target.files || []
      for (let i = 0; i < picked.length; i++) {
        this.files.push(picked[i])
      }
      event.target.value = ''
    },
    removeFile (index) {
      this.files.splice(index, 1)
    },
    submit () {
      if (!this.canSend || this.disabled || this.sending) {
        return
      }
      this.$emit('send', { text: this.text.trim(), files: this.files.slice() })
      this.text = ''
      this.files = []
      this.$nextTick(this.autoSize)
    },
    autoSize () {
      const textarea = this.$refs.textarea
      if (!textarea) {
        return
      }
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }
}
</script>

<style scoped lang="scss">
.input-bar {
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 24px calc(16px + env(safe-area-inset-bottom));

  .input-files {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 12px;

    .input-file {
      display: flex;
      align-items: center;
      max-width: 100%;
      margin: 0 12px 8px 0;
      padding: 8px 16px;
      border-radius: 12px;
      background: #f3f6f5;
      font-size: 24px;
      color: #4a4a4a;

      .input-file-name {
        max-width: 360px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .input-file-remove {
        margin-left: 12px;
        color: #999;
        font-size: 30px;
        line-height: 30px;
      }
    }
  }

  .input-row {
    display: flex;
    align-items: flex-end;
  }

  .input-picker {
    display: none;
  }

  .input-attach {
    flex: none;
    width: 64px;
    height: 64px;
    margin-right: 16px;
    border: none;
    border-radius: 50%;
    background: #f3f6f5;
    color: #6a6a6a;
    font-size: 40px;
    line-height: 64px;
    text-align: center;
    padding: 0;

    &:disabled {
      opacity: 0.5;
    }
  }

  .input-text {
    flex: 1;
    max-height: 120px;
    min-height: 64px;
    padding: 12px 20px;
    border: none;
    border-radius: 16px;
    background: #f6f6f6;
    font-size: 28px;
    line-height: 40px;
    resize: none;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }

  .input-send,
  .input-stop {
    flex: none;
    width: 128px;
    height: 64px;
    margin-left: 16px;
    border: none;
    border-radius: 32px;
    font-size: 28px;
    color: #fff;
    background: #00c3ac;

    &:disabled {
      opacity: 0.4;
    }
  }

  .input-stop {
    background: #f0f0f0;
    color: #666;
  }
}
</style>
