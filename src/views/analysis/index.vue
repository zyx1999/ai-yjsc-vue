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
            <span class="upload-item-status" :class="fileStatusClass(file)">{{ fileStatusText(file) }}</span>
            <button
              v-if="file.status === 'failed'"
              type="button"
              class="upload-item-retry"
              :disabled="busy"
              @click="retryUpload"
            >重试</button>
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

        <div v-if="sessionId" class="session-files">
          <button type="button" class="session-files-head" @click="toggleFiles">
            <span class="session-files-icon">📎</span>
            <span class="session-files-title">会话文件</span>
            <span class="session-files-count">{{ sessionFiles.length }}</span>
            <span class="session-files-action">{{ filesOpen ? '收起' : '展开' }}</span>
          </button>
          <div v-if="filesOpen" class="session-files-body">
            <p v-if="filesLoading" class="session-files-hint">正在读取文件列表…</p>
            <p v-else-if="!sessionFiles.length" class="session-files-hint">当前会话暂无文件</p>
            <ul v-else class="session-files-list">
              <li v-for="file in sessionFiles" :key="file.name" class="session-file">
                <span class="session-file-name" :title="file.name">{{ file.name }}</span>
                <span class="session-file-size">{{ formatSize(file.size) }}</span>
                <span class="session-file-tag" :class="file.source">{{ file.source === 'platform' ? '平台' : '本地' }}</span>
              </li>
            </ul>
            <p v-if="filesError" class="session-files-hint is-error">{{ filesError }}</p>
          </div>
        </div>
      </section>

      <section v-if="turns.length" class="result-card" aria-live="polite">
        <div v-for="turn in turns" :key="turn.id" class="turn">
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
 * 征信 / 流水分析窗口（文答）：
 * 上传材料 → 后端 /api/v1/analysis 会话与材料接口（api/analysis.js，与尽调同源、不触发登录）→
 * 通过 SSE 获取大模型分析；断流/超时时轮询会话等待结果落库 → 以 Markdown 渲染报告。
 */
import { Toast } from 'mint-ui'
import { createSession, loadSession, uploadFile, listFiles, streamChat } from '@/api/analysis'
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
      activeStream: null,
      uploading: false,
      uploadQueued: false,
      sessionFiles: [],
      filesOpen: false,
      filesLoading: false,
      filesError: ''
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
      this.uploading = false
      this.uploadQueued = false
      this.prompt = this.config.prompt
      this.sessionFiles = []
      this.filesOpen = false
      this.filesLoading = false
      this.filesError = ''
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
      let added = false
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
          raw: file,
          status: 'pending',
          fileId: '',
          error: ''
        })
        added = true
      })
      // 选择即上传：对话前材料已进入平台会话工作区，避免“模型看不到文件”的静默失败。
      if (added) this.drainUploads()
    },
    removeFile (index) {
      if (this.busy) return
      this.files.splice(index, 1)
    },
    /** 串行上传未完成/失败的文件；上传失败会显式标红并可点“重试”。 */
    async drainUploads () {
      if (this.uploading) {
        this.uploadQueued = true
        return
      }
      this.uploading = true
      try {
        while (true) {
          const queue = this.files.filter(file => file.status !== 'uploaded' && file.status !== 'uploading')
          if (!queue.length) break
          const sessionId = await this.ensureSession()
          for (let i = 0; i < queue.length; i++) {
            const file = queue[i]
            file.status = 'uploading'
            file.error = ''
            try {
              const uploaded = await uploadFile(sessionId, file.raw)
              file.fileId = uploaded.file_id
              file.status = 'uploaded'
            } catch (error) {
              file.status = 'failed'
              file.error = error.message || '上传失败'
              Toast('文件上传失败：' + file.name)
            }
          }
          this.refreshFiles()
          if (!this.uploadQueued) break
          this.uploadQueued = false
        }
      } catch (error) {
        this.files
          .filter(file => file.status === 'pending' || file.status === 'uploading')
          .forEach(file => {
            file.status = 'failed'
            file.error = error.message || '上传失败'
          })
        Toast('文件上传失败：' + (error.message || '请稍后重试'))
      } finally {
        this.uploading = false
      }
    },
    retryUpload () {
      this.drainUploads()
    },
    fileStatusText (file) {
      if (file.status === 'failed') return '上传失败'
      if (file.status === 'uploading') return '上传中…'
      if (file.status === 'uploaded') return '已上传'
      return '待上传'
    },
    fileStatusClass (file) {
      return {
        'is-uploading': file.status === 'uploading',
        'is-uploaded': file.status === 'uploaded',
        'is-failed': file.status === 'failed'
      }
    },
    async ensureSession () {
      if (this.sessionId) return this.sessionId
      // 参照尽调：会话直连创建，不触发登录
      const session = await createSession()
      this.sessionId = session.task_id
      return this.sessionId
    },
    async start () {
      if (this.busy) return
      if (!this.canStart) {
        Toast(this.files.length || this.sessionId ? '请输入分析要求' : '请先选择要分析的文件')
        return
      }
      await this.drainUploads()
      const failed = this.files.filter(file => file.status === 'failed')
      if (failed.length) {
        Toast('有文件上传失败，请重试或移除：' + failed.map(file => file.name).join('、'))
        return
      }
      const instruction = this.prompt.trim() || this.config.prompt
      // 每次分析都携带当前全部已上传材料（含此前轮次，文件保留在列表中），
      // 避免“继续分析”时模型看不到文件而回答“当前工作区没有发现文件”。
      const attachmentFiles = this.files.filter(file => file.status === 'uploaded' && file.fileId)
      const userTurn = {
        id: 'turn-' + (++this.turnSeed),
        role: 'user',
        files: attachmentFiles.map(file => ({ key: file.key, name: file.name })),
        text: instruction
      }
      const assistantTurn = {
        id: 'turn-' + (++this.turnSeed),
        role: 'assistant',
        pending: true,
        stage: '正在准备…',
        content: '',
        error: ''
      }
      this.turns.push(userTurn, assistantTurn)
      this.busy = true
      try {
        const sessionId = await this.ensureSession()
        await this.performChat(sessionId, assistantTurn, instruction, attachmentFiles.map(file => file.fileId))
      } catch (error) {
        assistantTurn.error = error.message || '分析未完成，请稍后重试。'
      } finally {
        assistantTurn.pending = false
        this.activeStream = null
        this.busy = false
        this.refreshFiles()
      }
    },
    // 参照尽调 performChat：SSE 会话调用；断流时不直接失败，轮询会话等待结果落库。
    async performChat (sessionId, turn, text, attachmentIds) {
      turn.stage = '大模型正在分析，请稍候…'
      let failure = null
      try {
        const stream = streamChat(sessionId, text, attachmentIds, event => {
          if (event.type === 'run.progress') {
            turn.stage = event.message || stageLabel(event.stage)
          } else if (event.type === 'answer.completed') {
            turn.content = event.content || ''
            turn.stage = ''
          } else if (event.type === 'run.failed' || event.type === 'run.unknown') {
            turn.error = event.message || '处理未完成，请稍后重试。'
          }
        })
        this.activeStream = stream
        await stream.promise
      } catch (error) {
        failure = error
      }
      // 连接不完整结束（超时/中断）时后端可能仍在运行：轮询会话，直到结果落库。
      if (failure && failure.pending && await this.awaitAssistantReply(turn)) return
      if (failure && !failure.aborted) throw failure
      if (!turn.content && !turn.error) turn.error = '未获取到分析结果，请稍后重试。'
    },
    // 连接可能因长耗时模型等待被网关/浏览器中断，但后端仍在运行并会持久化回复：
    // 轮询会话，直到出现新的助手回复或达到等待上限（参照尽调 awaitAssistantReply）。
    async awaitAssistantReply (turn) {
      const deadline = Date.now() + 10 * 60 * 1000
      const shown = this.turns
        .filter(item => item !== turn && item.role === 'assistant' && item.content)
        .map(item => item.content)
      for (;;) {
        if (!this.sessionId || this._isDestroyed || this.turns.indexOf(turn) < 0) return false
        try {
          const detail = await loadSession(this.sessionId)
          const messages = (detail && detail.messages) || []
          for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i]
            if (
              message.role === 'ASSISTANT' &&
              message.content &&
              shown.indexOf(message.content) < 0
            ) {
              if (message.status === 'FAILED') {
                turn.error = message.content
              } else {
                turn.content = message.content
                turn.error = ''
              }
              turn.stage = ''
              return true
            }
          }
        } catch (error) {
          // 轮询期间的瞬时错误忽略，继续等待后端结果落地。
        }
        if (Date.now() >= deadline) return false
        turn.stage = '后端仍在处理，正在等待结果返回…'
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
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
    /** 会话文件列表（平台工作区 + 本地已登记材料），上传与运行完成后自动刷新。 */
    async refreshFiles () {
      if (!this.sessionId) {
        this.sessionFiles = []
        this.filesError = ''
        return
      }
      this.filesLoading = true
      try {
        const data = await listFiles(this.sessionId)
        this.sessionFiles = (data && data.files) || []
        this.filesError = (data && data.platform_error) || ''
      } catch (error) {
        this.filesError = error.message || '文件列表读取失败'
      } finally {
        this.filesLoading = false
      }
    },
    toggleFiles () {
      this.filesOpen = !this.filesOpen
      if (this.filesOpen) this.refreshFiles()
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

    .upload-item-status {
      flex: none;
      margin-right: 6px;
      padding: 1px 6px;
      border-radius: 4px;
      background: #f0f3f6;
      color: #7a8a99;
      font-size: 11px;

      &.is-uploading {
        background: #eef6ff;
        color: #2f7fd0;
      }

      &.is-uploaded {
        background: #e8f4f1;
        color: #0b8e80;
      }

      &.is-failed {
        background: #fdeeee;
        color: #d9534f;
      }
    }

    .upload-item-retry {
      flex: none;
      margin-right: 6px;
      padding: 2px 8px;
      border: 1px solid #d9c7c7;
      border-radius: 4px;
      background: #fff;
      color: #d9534f;
      font-size: 12px;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
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

  .session-files {
    margin-top: 12px;
    border: 1px solid #e8f0ee;
    border-radius: 8px;
    background: #fafcfc;
    overflow: hidden;
  }

  .session-files-head {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 9px 12px;
    border: none;
    background: none;
    font-size: 13px;
    color: #3c4a58;
    cursor: pointer;

    .session-files-icon {
      margin-right: 6px;
    }

    .session-files-title {
      font-weight: 600;
    }

    .session-files-count {
      margin-left: 8px;
      padding: 0 7px;
      border-radius: 9px;
      background: #e8f4f1;
      color: #0b8e80;
      font-size: 11px;
      line-height: 18px;
    }

    .session-files-action {
      margin-left: auto;
      color: #8a97a8;
      font-size: 12px;
    }
  }

  .session-files-body {
    padding: 0 12px 10px;
    border-top: 1px dashed #e8f0ee;
  }

  .session-files-hint {
    margin: 9px 0 0;
    color: #8a97a8;
    font-size: 12px;

    &.is-error {
      color: #d9534f;
    }
  }

  .session-files-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .session-file {
    display: flex;
    align-items: center;
    margin-top: 8px;
    font-size: 13px;
    color: #3c4a58;

    .session-file-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .session-file-size {
      flex: none;
      margin: 0 10px;
      color: #9aa8b5;
      font-size: 12px;
    }

    .session-file-tag {
      flex: none;
      padding: 1px 7px;
      border-radius: 8px;
      font-size: 11px;

      &.platform {
        background: #e6f5f2;
        color: #0b8e80;
      }

      &.local {
        background: #fdf3e4;
        color: #b07a1d;
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

      .upload-item-status {
        margin-right: 12px;
        padding: 2px 12px;
        border-radius: 8px;
        font-size: 20px;
      }

      .upload-item-retry {
        margin-right: 12px;
        padding: 4px 16px;
        border-radius: 8px;
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

    .session-files {
      margin-top: 22px;
      border-radius: 14px;
    }

    .session-files-head {
      padding: 16px 22px;
      font-size: 26px;

      .session-files-icon {
        margin-right: 12px;
      }

      .session-files-count {
        margin-left: 14px;
        padding: 0 12px;
        border-radius: 16px;
        font-size: 20px;
        line-height: 34px;
      }

      .session-files-action {
        font-size: 22px;
      }
    }

    .session-files-body {
      padding: 0 22px 18px;
    }

    .session-files-hint {
      margin-top: 16px;
      font-size: 22px;
    }

    .session-file {
      margin-top: 14px;
      font-size: 24px;

      .session-file-size {
        margin: 0 16px;
        font-size: 22px;
      }

      .session-file-tag {
        padding: 2px 12px;
        border-radius: 14px;
        font-size: 20px;
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
