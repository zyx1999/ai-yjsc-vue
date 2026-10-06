<template>
  <div class="analysis-page">
    <header class="analysis-topbar">
      <button type="button" class="topbar-back" @click="goHome">‹ 工作台</button>
      <h1 class="topbar-title">{{ config.title }}</h1>
      <span class="topbar-badge">云虾大模型</span>
    </header>

    <main class="analysis-body">
      <p class="analysis-subtitle">{{ config.subtitle }}</p>

      <section class="upload-card">
        <div
          class="upload-zone"
          :class="{ 'is-dragging': dragging, 'is-disabled': busy }"
          role="button"
          aria-label="选择或拖拽上传文件"
          @click="pick"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <span class="upload-zone-icon">＋</span>
          <p class="upload-zone-title">点击选择文件，或拖拽到此处</p>
          <p class="upload-zone-hint">{{ config.uploadHint }}</p>
          <input
            ref="picker"
            type="file"
            class="upload-picker"
            multiple
            :accept="config.accept"
            @change="onPick"
          >
        </div>

        <ul v-if="files.length" class="upload-list">
          <li v-for="(file, index) in files" :key="file.key" class="upload-item">
            <span class="upload-item-type">{{ extOf(file.name).toUpperCase() }}</span>
            <span class="upload-item-name" :title="file.name">{{ file.name }}</span>
            <span class="upload-item-size">{{ formatSize(file.size) }}</span>
            <button
              type="button"
              class="upload-item-remove"
              :disabled="busy"
              :aria-label="'移除文件 ' + file.name"
              @click="removeFile(index)"
            >×</button>
          </li>
        </ul>

        <div class="prompt-field">
          <label class="prompt-label">分析要求</label>
          <textarea
            v-model="prompt"
            class="prompt-input"
            rows="2"
            :disabled="busy"
            placeholder="描述希望大模型如何分析上传的文件"
          ></textarea>
        </div>

        <div class="analysis-actions">
          <button type="button" class="action-primary" :disabled="!canStart" @click="start">
            <span v-if="busy" class="action-spinner"></span>{{ busy ? '分析中…' : primaryLabel }}
          </button>
          <button
            v-if="sessionStarted"
            type="button"
            class="action-ghost"
            :disabled="busy"
            @click="reset"
          >重新开始</button>
        </div>
      </section>

      <section v-if="turns.length" class="result-card" aria-live="polite">
        <div v-for="(turn, index) in turns" :key="turn.id" class="turn">
          <div v-if="turn.role === 'user'" class="turn-user">
            <span class="turn-role">我</span>
            <div class="turn-user-body">
              <p v-if="turn.files.length" class="turn-files">
                <span v-for="file in turn.files" :key="file.key" class="turn-file">📄 {{ file.name }}</span>
              </p>
              <p class="turn-text">{{ turn.text }}</p>
            </div>
          </div>
          <div v-else class="turn-assistant">
            <span class="turn-role">AI</span>
            <div class="turn-assistant-body">
              <div v-if="turn.pending" class="turn-progress">
                <span class="turn-spinner"></span><span>{{ turn.stage || '正在处理，请稍候…' }}</span>
              </div>
              <markdown-view v-else-if="turn.content" :content="turn.content" />
              <div v-else class="turn-error">
                <p>{{ turn.error || '未返回结果' }}</p>
                <button v-if="turn.canVerify" type="button" :disabled="busy" @click="verify(index)">核实结果</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <p v-else class="analysis-empty">
        上传文件并点击"开始分析"，大模型将以 Markdown 报告形式返回分析结果。
      </p>
    </main>
  </div>
</template>

<script>
/**
 * 征信 / 流水分析窗口：
 * 上传材料 → 复用 AI 智能助手的会话与附件接口上传 → 通过 SSE 获取大模型分析 →
 * 以 Markdown 渲染报告；窗口内可继续追问，会话与"AI 智能助手"共享。
 */
import { Toast } from 'mint-ui'
import { ensureLogin, createSession, uploadAttachment, getSession } from '@/api/chat'
import { streamMessage } from '@/api/chatStream'
import MarkdownView from '@/components/markdown/MarkdownView.vue'

const MAX_FILES = 5
const MAX_FILE_SIZE = 20 * 1024 * 1024
const KINDS = {
  credit: {
    title: '征信分析',
    subtitle: '上传个人/企业征信报告（PDF、图片），由大模型输出信用状况分析报告。',
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    exts: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    uploadHint: '支持 PDF / 图片 / Word，单个不超过 20MB，最多 5 个',
    prompt: '分析个人征信，输出信用状况分析报告（含主体信息、账户概览、明细要点、逾期与担保、综合风险提示），使用 Markdown 表格。'
  },
  bankflow: {
    title: '流水分析',
    subtitle: '上传银行流水（PDF、Excel、图片），由大模型输出收支结构与风险分析报告。',
    accept: '.pdf,.xls,.xlsx,.csv,.jpg,.jpeg,.png',
    exts: ['pdf', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png'],
    uploadHint: '支持 PDF / Excel / CSV / 图片，单个不超过 20MB，最多 5 个',
    prompt: '分析银行流水，输出流水分析报告（含账户概览、收支统计、异常交易识别、综合风险提示），使用 Markdown 表格。'
  }
}

function stageLabel (stage) {
  const labels = {
    skill_loaded: '已加载业务能力',
    reference_loaded: '已加载参考材料',
    workflow_called: '正在调用业务流程'
  }
  return labels[stage] || '处理中…'
}

function extOf (name) {
  const value = String(name || '')
  const index = value.lastIndexOf('.')
  return index >= 0 ? value.slice(index + 1).toLowerCase() : ''
}

function formatSize (bytes) {
  const value = Number(bytes)
  if (!isFinite(value) || value < 0) return ''
  if (value < 1024) return value + ' B'
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
  return (value / 1024 / 1024).toFixed(1) + ' MB'
}

export default {
  name: 'AnalysisView',
  components: { MarkdownView },
  props: {
    kind: {
      type: String,
      default: 'credit'
    }
  },
  data () {
    return {
      files: [],
      prompt: '',
      dragging: false,
      busy: false,
      sessionId: null,
      turns: [],
      turnSeed: 0,
      activeStream: null
    }
  },
  computed: {
    config () {
      return KINDS[this.kind] || KINDS.credit
    },
    canStart () {
      return !this.busy && (this.files.length > 0 || (!!this.sessionId && !!this.prompt.trim()))
    },
    primaryLabel () {
      return this.sessionId ? '继续分析' : '开始分析'
    },
    sessionStarted () {
      return !!this.sessionId || this.turns.length > 0
    }
  },
  watch: {
    kind () {
      this.applyKind()
    }
  },
  created () {
    this.applyKind()
  },
  beforeDestroy () {
    this.abortStream()
  },
  methods: {
    extOf,
    formatSize,
    applyKind () {
      this.abortStream()
      this.files = []
      this.turns = []
      this.sessionId = null
      this.busy = false
      this.dragging = false
      this.prompt = this.config.prompt
    },
    goHome () {
      this.$router.push('/diligence')
    },
    pick () {
      if (this.busy) return
      this.$refs.picker.click()
    },
    onPick (event) {
      this.addFiles(event.target.files)
      event.target.value = ''
    },
    onDragOver () {
      if (!this.busy) this.dragging = true
    },
    onDragLeave (event) {
      // 拖过子元素时也会触发 dragleave，焦点仍在区域内则忽略
      const current = event.currentTarget
      if (current && event.relatedTarget && current.contains(event.relatedTarget)) return
      this.dragging = false
    },
    onDrop (event) {
      this.dragging = false
      if (this.busy) return
      this.addFiles(event.dataTransfer && event.dataTransfer.files)
    },
    addFiles (list) {
      const picked = Array.prototype.slice.call(list || [])
      picked.forEach(file => {
        if (this.files.length >= MAX_FILES) {
          Toast('最多上传 ' + MAX_FILES + ' 个文件')
          return
        }
        if (this.config.exts.indexOf(extOf(file.name)) < 0) {
          Toast('不支持的文件类型：' + file.name)
          return
        }
        if (file.size > MAX_FILE_SIZE) {
          Toast('文件超过 20MB：' + file.name)
          return
        }
        const duplicated = this.files.some(item => item.name === file.name && item.size === file.size)
        if (duplicated) return
        this.files.push({
          key: file.name + '-' + file.size + '-' + file.lastModified,
          name: file.name,
          size: file.size,
          raw: file
        })
      })
    },
    removeFile (index) {
      if (this.busy) return
      this.files.splice(index, 1)
    },
    async ensureSession () {
      if (this.sessionId) return this.sessionId
      await ensureLogin()
      const session = await createSession()
      this.sessionId = session.id
      return this.sessionId
    },
    async start () {
      if (this.busy) return
      if (!this.canStart) {
        Toast(this.files.length || this.sessionId ? '请输入分析要求' : '请先选择要分析的文件')
        return
      }
      const instruction = this.prompt.trim() || this.config.prompt
      const pendingFiles = this.files.slice()
      const userTurn = {
        id: 'turn-' + (++this.turnSeed),
        role: 'user',
        files: pendingFiles.map(file => ({ key: file.key, name: file.name })),
        text: instruction
      }
      const assistantTurn = {
        id: 'turn-' + (++this.turnSeed),
        role: 'assistant',
        pending: true,
        stage: '正在准备…',
        content: '',
        error: '',
        canVerify: false
      }
      this.turns.push(userTurn, assistantTurn)
      this.busy = true
      try {
        const sessionId = await this.ensureSession()
        const attachmentIds = []
        for (let i = 0; i < pendingFiles.length; i++) {
          assistantTurn.stage = '正在上传文件 ' + (i + 1) + '/' + pendingFiles.length + '：' + pendingFiles[i].name
          const uploaded = await uploadAttachment(sessionId, pendingFiles[i].raw)
          attachmentIds.push(uploaded.id)
        }
        // 附件全部上传成功后本次文件即被消费；失败时保留列表便于重试
        this.files = []
        assistantTurn.stage = '大模型正在分析，请稍候…'
        await this.consumeStream(sessionId, instruction, attachmentIds, assistantTurn)
        if (!assistantTurn.content && !assistantTurn.error) {
          assistantTurn.error = '未获取到分析结果，请稍后重试。'
          assistantTurn.canVerify = true
        }
      } catch (error) {
        assistantTurn.error = error.message || '分析未完成，请稍后重试。'
        assistantTurn.canVerify = !!this.sessionId
      } finally {
        assistantTurn.pending = false
        this.activeStream = null
        this.busy = false
      }
    },
    consumeStream (sessionId, text, attachmentIds, turn) {
      return new Promise((resolve, reject) => {
        const stream = streamMessage(sessionId, { text, attachmentIds }, {
          onEvent: event => {
            if (event.type === 'run.progress') {
              turn.stage = event.message || stageLabel(event.stage)
            } else if (event.type === 'answer.completed') {
              turn.content = event.content || ''
              turn.stage = ''
            } else if (event.type === 'run.failed' || event.type === 'run.unknown') {
              turn.error = event.message || '处理未完成，请稍后重试。'
            }
          }
        })
        this.activeStream = stream
        stream.promise.then(resolve, reject)
      })
    },
    abortStream () {
      if (!this.activeStream) return
      try {
        this.activeStream.abort()
      } catch (error) {
        // 连接已结束时 abort 无副作用
      }
      this.activeStream = null
    },
    /** 连接中断/超时后，从会话中重新读取大模型已落库的分析结果。 */
    async verify (index) {
      const turn = this.turns[index]
      if (!turn || !this.sessionId || this.busy) return
      this.busy = true
      try {
        const detail = await getSession(this.sessionId)
        const messages = (detail && detail.messages) || []
        const shown = this.turns.filter((item, i) => i !== index && item.content).map(item => item.content)
        let content = ''
        for (let i = messages.length - 1; i >= 0; i--) {
          const message = messages[i]
          if (
            message.role === 'ASSISTANT' &&
            message.status === 'SUCCEEDED' &&
            message.content &&
            shown.indexOf(message.content) < 0
          ) {
            content = message.content
            break
          }
        }
        if (content) {
          turn.content = content
          turn.error = ''
          turn.canVerify = false
        } else {
          Toast('暂未获取到新的分析结果，后端可能仍在处理，请稍后再试')
        }
      } catch (error) {
        Toast(error.message || '核实失败，请稍后再试')
      } finally {
        this.busy = false
      }
    },
    reset () {
      this.applyKind()
    }
  }
}
</script>

<style scoped lang="scss">
.analysis-page {
  min-height: 100vh;
  background: #eef3f2;

  .analysis-topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 20px;
    background: linear-gradient(135deg, #147d78 0%, #1f5c6b 100%);
    color: #fff;
    box-shadow: 0 1px 6px rgba(20, 66, 63, 0.18);

    .topbar-back {
      flex: none;
      padding: 6px 2px;
      border: none;
      background: none;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
    }

    .topbar-title {
      flex: 1;
      margin: 0 12px;
      font-size: 16px;
      font-weight: 600;
    }

    .topbar-badge {
      flex: none;
      padding: 3px 10px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.18);
      font-size: 12px;
    }
  }

  .analysis-body {
    max-width: 860px;
    margin: 0 auto;
    padding: 18px 20px 60px;
  }

  .analysis-subtitle {
    margin: 2px 0 14px;
    color: #5c6b7a;
    font-size: 13px;
    line-height: 1.7;
  }

  .upload-card {
    padding: 16px;
    border: 1px solid #e6edec;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(31, 45, 61, 0.05);
  }

  .upload-zone {
    padding: 26px 16px;
    border: 1.5px dashed #b9d6d0;
    border-radius: 8px;
    background: #fafcfc;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;

    &.is-dragging {
      border-color: #00a996;
      background: #eef8f6;
    }

    &.is-disabled {
      opacity: 0.6;
      cursor: default;
    }

    .upload-zone-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e6f5f2;
      color: #00a996;
      font-size: 20px;
    }

    .upload-zone-title {
      margin: 10px 0 4px;
      color: #2b3a4a;
      font-size: 14px;
      font-weight: 600;
    }

    .upload-zone-hint {
      margin: 0;
      color: #96a3b0;
      font-size: 12px;
    }
  }

  .upload-picker {
    display: none;
  }

  .upload-list {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }

  .upload-item {
    display: flex;
    align-items: center;
    margin-top: 8px;
    padding: 8px 10px;
    border: 1px solid #eef2f1;
    border-radius: 6px;
    background: #fbfdfd;
    font-size: 13px;
    color: #3c4a58;

    .upload-item-type {
      flex: none;
      margin-right: 8px;
      padding: 1px 6px;
      border-radius: 4px;
      background: #e8f4f1;
      color: #0b8e80;
      font-size: 11px;
      font-weight: 600;
    }

    .upload-item-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .upload-item-size {
      flex: none;
      margin: 0 10px;
      color: #9aa8b5;
      font-size: 12px;
    }

    .upload-item-remove {
      flex: none;
      padding: 2px 4px;
      border: none;
      background: none;
      color: #9aa8b5;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;

      &:hover {
        color: #d9534f;
      }

      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
    }
  }

  .prompt-field {
    margin-top: 14px;

    .prompt-label {
      display: block;
      margin-bottom: 6px;
      color: #4a5a6a;
      font-size: 13px;
      font-weight: 600;
    }

    .prompt-input {
      width: 100%;
      box-sizing: border-box;
      padding: 9px 12px;
      border: 1px solid #dcdfe6;
      border-radius: 8px;
      font-size: 14px;
      line-height: 22px;
      font-family: inherit;
      resize: vertical;
      outline: none;

      &:focus {
        border-color: #00c3ac;
      }

      &:disabled {
        background: #f7f9f9;
      }
    }
  }

  .analysis-actions {
    display: flex;
    align-items: center;
    margin-top: 14px;

    .action-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 140px;
      height: 40px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #00c3ac, #0a9d90);
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .action-spinner {
        width: 14px;
        height: 14px;
        margin-right: 8px;
        border: 2px solid rgba(255, 255, 255, 0.45);
        border-top-color: #fff;
        border-radius: 50%;
        animation: analysis-spin 0.8s linear infinite;
      }
    }

    .action-ghost {
      height: 40px;
      margin-left: 12px;
      padding: 0 18px;
      border: 1px solid #cfe3df;
      border-radius: 8px;
      background: #fff;
      color: #0b8e80;
      font-size: 14px;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
    }
  }

  .result-card {
    margin-top: 16px;
    padding: 8px 16px;
    border: 1px solid #e6edec;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(31, 45, 61, 0.05);
  }

  .turn {
    padding: 12px 0;
    border-bottom: 1px dashed #eef2f1;

    &:last-child {
      border-bottom: none;
    }
  }

  .turn-user,
  .turn-assistant {
    display: flex;
    align-items: flex-start;
  }

  .turn-role {
    flex: none;
    width: 30px;
    height: 30px;
    margin-right: 10px;
    border-radius: 50%;
    background: #eaf6f4;
    color: #00a996;
    font-size: 12px;
    font-weight: 600;
    line-height: 30px;
    text-align: center;
    user-select: none;
  }

  .turn-user {
    .turn-role {
      background: #00c3ac;
      color: #fff;
    }

    .turn-user-body {
      flex: 1;
      min-width: 0;
      padding: 6px 12px;
      border-radius: 8px;
      background: #f2f7f6;
      color: #2b3a4a;
      font-size: 14px;
      line-height: 22px;

      .turn-files {
        display: flex;
        flex-wrap: wrap;
        margin: 0;

        .turn-file {
          margin: 0 8px 4px 0;
          color: #0b8e80;
          font-size: 13px;
        }
      }

      .turn-text {
        margin: 4px 0 0;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }
  }

  .turn-assistant-body {
    flex: 1;
    min-width: 0;
    padding-top: 2px;
    font-size: 14px;
    line-height: 22px;

    .turn-progress {
      display: flex;
      align-items: center;
      color: #5c6b7a;
      font-size: 14px;

      .turn-spinner {
        width: 14px;
        height: 14px;
        margin-right: 8px;
        border: 2px solid #d6e8e5;
        border-top-color: #00a996;
        border-radius: 50%;
        animation: analysis-spin 0.8s linear infinite;
      }
    }

    .turn-error {
      color: #d9534f;
      font-size: 14px;

      p {
        margin: 0 0 8px;
      }

      button {
        padding: 5px 14px;
        border: 1px solid #f0c9c5;
        border-radius: 6px;
        background: #fff;
        color: #d9534f;
        font-size: 13px;
        cursor: pointer;

        &:disabled {
          opacity: 0.5;
          cursor: default;
        }
      }
    }
  }

  .analysis-empty {
    margin-top: 16px;
    padding: 30px 20px;
    border: 1px dashed #dce7e6;
    border-radius: 10px;
    background: #fff;
    color: #8a97a8;
    font-size: 13px;
    text-align: center;
  }
}

@keyframes analysis-spin {
  to {
    transform: rotate(360deg);
  }
}

// 手机/小窗口：整体尺寸放大到设计稿骨架水平（px 经 pxtorem 换算后与桌面 1:1 观感一致）
@media (max-width: 750px) {
  .analysis-page {
    .analysis-topbar {
      height: 96px;
      padding: 0 32px;

      .topbar-back {
        font-size: 26px;
      }

      .topbar-title {
        margin: 0 20px;
        font-size: 32px;
      }

      .topbar-badge {
        padding: 6px 18px;
        border-radius: 20px;
        font-size: 22px;
      }
    }

    .analysis-body {
      padding: 28px 28px 120px;
    }

    .analysis-subtitle {
      margin-bottom: 24px;
      font-size: 24px;
    }

    .upload-card {
      padding: 28px;
      border-radius: 18px;
    }

    .upload-zone {
      padding: 48px 28px;
      border-radius: 14px;

      .upload-zone-icon {
        width: 72px;
        height: 72px;
        font-size: 36px;
      }

      .upload-zone-title {
        margin: 18px 0 8px;
        font-size: 28px;
      }

      .upload-zone-hint {
        font-size: 22px;
      }
    }

    .upload-item {
      margin-top: 14px;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 24px;

      .upload-item-type {
        margin-right: 14px;
        padding: 2px 12px;
        border-radius: 8px;
        font-size: 20px;
      }

      .upload-item-size {
        margin: 0 18px;
        font-size: 22px;
      }

      .upload-item-remove {
        font-size: 30px;
      }
    }

    .prompt-field {
      margin-top: 26px;

      .prompt-label {
        margin-bottom: 12px;
        font-size: 24px;
      }

      .prompt-input {
        padding: 16px 22px;
        border-radius: 14px;
        font-size: 26px;
        line-height: 40px;
      }
    }

    .analysis-actions {
      margin-top: 26px;

      .action-primary {
        min-width: 240px;
        height: 76px;
        border-radius: 14px;
        font-size: 28px;

        .action-spinner {
          width: 26px;
          height: 26px;
          margin-right: 14px;
          border-width: 3px;
        }
      }

      .action-ghost {
        height: 76px;
        margin-left: 20px;
        padding: 0 32px;
        border-radius: 14px;
        font-size: 26px;
      }
    }

    .result-card {
      margin-top: 28px;
      padding: 14px 28px;
      border-radius: 18px;
    }

    .turn {
      padding: 22px 0;
    }

    .turn-role {
      width: 56px;
      height: 56px;
      margin-right: 18px;
      font-size: 22px;
      line-height: 56px;
    }

    .turn-user {
      .turn-user-body {
        padding: 12px 22px;
        border-radius: 14px;
        font-size: 26px;
        line-height: 40px;

        .turn-files .turn-file {
          margin: 0 14px 6px 0;
          font-size: 24px;
        }
      }
    }

    .turn-assistant-body {
      padding-top: 4px;
      font-size: 26px;
      line-height: 40px;

      .turn-progress {
        font-size: 26px;

        .turn-spinner {
          width: 26px;
          height: 26px;
          margin-right: 14px;
          border-width: 3px;
        }
      }

      .turn-error {
        font-size: 26px;

        button {
          padding: 10px 26px;
          border-radius: 12px;
          font-size: 24px;
        }
      }
    }

    .analysis-empty {
      margin-top: 28px;
      padding: 60px 32px;
      border-radius: 18px;
      font-size: 24px;
    }
  }
}
</style>
