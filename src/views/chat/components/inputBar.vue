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
        @keydown.enter.exact="onEnter"
      ></textarea>
      <button v-if="!sending" type="button" class="input-send" :disabled="disabled || !canSend" @click="submit">发送</button>
      <button v-else type="button" class="input-stop" @click="$emit('stop')">停止</button>
    </div>
    <p class="input-hint">Enter 发送 / Shift + Enter 换行，支持上传附件</p>
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
    onEnter (event) {
      // 中文输入法组合键期间不触发发送
      if (event && (event.isComposing || event.keyCode === 229)) {
        return
      }
      event.preventDefault()
      this.submit()
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
  padding: 14px 24px 16px;

  .input-files {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 10px;

    .input-file {
      display: flex;
      align-items: center;
      max-width: 100%;
      margin: 0 8px 8px 0;
      padding: 5px 10px;
      border-radius: 6px;
      background: #f3f6f5;
      font-size: 13px;
      color: #4a5a6a;

      .input-file-name {
        max-width: 260px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .input-file-remove {
        margin-left: 8px;
        color: #8a97a8;
        font-size: 16px;
        line-height: 16px;
        cursor: pointer;

        &:hover {
          color: #d9534f;
        }
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
    width: 36px;
    height: 36px;
    margin-right: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 50%;
    background: #fff;
    color: #6a7a8a;
    font-size: 20px;
    line-height: 34px;
    text-align: center;
    padding: 0;
    cursor: pointer;

    &:hover {
      border-color: #00c3ac;
      color: #00a996;
    }

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }

  .input-text {
    flex: 1;
    max-height: 120px;
    min-height: 40px;
    padding: 9px 14px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    background: #fff;
    font-size: 14px;
    line-height: 22px;
    resize: none;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;

    &:focus {
      border-color: #00c3ac;
    }
  }

  .input-send,
  .input-stop {
    flex: none;
    width: 88px;
    height: 40px;
    margin-left: 12px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    color: #fff;
    background: #00c3ac;
    cursor: pointer;

    &:hover {
      background: #00b39e;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  .input-stop {
    background: #f0f2f5;
    color: #5a6a7a;

    &:hover {
      background: #e6e9ee;
    }
  }

  .input-hint {
    margin: 8px 0 0 46px;
    font-size: 12px;
    color: #a8b3bf;
  }
}

@media (max-width: 750px) {
  .input-bar {
    padding: 16px 24px calc(16px + env(safe-area-inset-bottom));

    .input-files {
      margin-bottom: 12px;

      .input-file {
        margin: 0 12px 8px 0;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 24px;

        .input-file-name {
          max-width: 360px;
        }

        .input-file-remove {
          margin-left: 12px;
          font-size: 30px;
          line-height: 30px;
        }
      }
    }

    .input-attach {
      width: 64px;
      height: 64px;
      margin-right: 16px;
      font-size: 40px;
      line-height: 62px;
    }

    .input-text {
      min-height: 64px;
      padding: 12px 20px;
      border-radius: 16px;
      font-size: 28px;
      line-height: 40px;
    }

    .input-send,
    .input-stop {
      width: 128px;
      height: 64px;
      margin-left: 16px;
      border-radius: 32px;
      font-size: 28px;
    }

    .input-hint {
      display: none;
    }
  }
}
</style>
