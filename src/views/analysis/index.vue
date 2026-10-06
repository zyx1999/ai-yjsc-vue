<template>
  <div class="analysis-page">
    <header class="analysis-topbar">
      <button type="button" class="topbar-back" @click="goHome">‹ 工作台</button>
      <h1 class="topbar-title">{{ config.title }}</h1>
      <button type="button" class="topbar-history" @click="toggleHistory">🕘 历史会话</button>
      <span class="topbar-badge">云虾大模型</span>
    </header>

    <div v-if="historyOpen" class="history-mask" @click="historyOpen = false"></div>
    <aside class="history-drawer" :class="{ 'is-open': historyOpen }">
      <header class="history-head">
        <span class="history-head-title">历史会话</span>
        <button type="button" class="history-new" :disabled="busy" @click="newSession">＋ 新会话</button>
        <button type="button" class="history-close" aria-label="关闭历史会话" @click="historyOpen = false">×</button>
      </header>
      <p class="history-hint" v-if="busy">分析运行中，完成后可切换会话</p>
      <p v-if="historyError" class="history-hint is-error">{{ historyError }}</p>
      <p v-else-if="historyLoading && !history.length" class="history-hint">正在读取历史会话…</p>
      <p v-else-if="!history.length" class="history-hint">暂无历史会话，完成一次分析后会自动保存。</p>
      <ul v-else class="history-list">
        <li
          v-for="item in history"
          :key="item.task_id"
          class="history-item"
          :class="{ 'is-active': item.task_id === sessionId, 'is-disabled': busy }"
          @click="openSession(item)"
        >
          <div class="history-item-main">
            <span class="history-item-title">{{ historyTitle(item) }}</span>
            <span class="history-item-meta">{{ formatTime(item.last_used_at) }} · {{ item.message_count }} 条消息</span>
          </div>
          <button
            type="button"
            class="history-item-remove"
            :disabled="busy"
            aria-label="删除会话"
            @click.stop="removeSession(item)"
          >×</button>
        </li>
      </ul>
    </aside>

    <div ref="workspaceBody" class="workspace-body">
      <section class="chat-pane" :style="chatStyle">
        <div class="pane-heading">
          <span class="assistant-symbol">✦</span>
          <div>
            <h2>{{ config.title }}助手</h2>
            <p>{{ config.paneHint }}</p>
          </div>
        </div>

        <div ref="messageList" class="message-stream" aria-live="polite">
          <div v-if="!turns.length" class="assistant-welcome">
            <span class="welcome-icon">💬</span>
            <h3>上传材料，开始{{ config.title }}</h3>
            <p>{{ config.subtitle }}</p>
            <div class="welcome-tips">
              <span>⬆ 选择材料后自动上传到会话工作区</span>
              <span>📄 分析报告实时渲染在右侧</span>
              <span>🕘 历史会话可随时回看</span>
            </div>
          </div>

          <article v-for="turn in turns" :key="turn.id" class="chat-message" :class="turn.role">
            <small>{{ turn.role === 'user' ? '我' : config.title + '助手' }}</small>
            <template v-if="turn.role === 'user'">
              <p v-if="turn.files && turn.files.length" class="turn-files">
                <span v-for="file in turn.files" :key="file.key" class="turn-file">📄 {{ file.name }}</span>
              </p>
              <p class="turn-text">{{ turn.text }}</p>
            </template>
            <template v-else>
              <div v-if="turn.pending" class="turn-progress">
                <span class="turn-spinner"></span>
                <span class="turn-stage">{{ turn.stage || '正在处理，请稍候…' }}</span>
                <button type="button" class="turn-cancel" @click="cancelWait(turn)">停止等待</button>
              </div>
              <div v-else-if="turn.error" class="turn-error">
                <p>{{ turn.error }}</p>
              </div>
              <button
                v-else
                type="button"
                class="report-card"
                :class="{ 'is-viewing': isActiveTurn(turn) }"
                @click="viewReport(turn)"
              >
                <span class="report-card-icon">📄</span>
                <span class="report-card-main">
                  <span class="report-card-title">{{ reportTitle(turn) }}</span>
                  <span class="report-card-meta">{{ isActiveTurn(turn) ? '正在右侧查看' : '点击在右侧查看报告' }}</span>
                </span>
                <span class="report-card-arrow">›</span>
              </button>
            </template>
          </article>
        </div>

        <div class="upload-card">
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
            <textarea
              v-model="prompt"
              class="prompt-input"
              rows="3"
              :disabled="busy"
              placeholder="描述希望大模型如何分析上传的文件"
            ></textarea>
            <p v-if="sessionUnknown" class="prompt-warn">该会话上次运行结果待核实，建议新建会话继续分析。</p>
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
        </div>
        <p class="assistant-disclaimer">生成内容需结合原始资料核实</p>
      </section>

      <div
        v-if="!compact"
        class="workspace-divider"
        role="separator"
        aria-label="调整对话区宽度"
        aria-orientation="vertical"
        :aria-valuenow="chatWidth"
        aria-valuemin="320"
        aria-valuemax="560"
        tabindex="0"
        @mousedown="startResize"
        @keydown="resizeWithKeyboard"
      ><span /></div>

      <section class="report-pane">
        <div class="report-heading">
          <div class="report-identity">
            <span class="eyebrow">MARKDOWN 报告</span>
            <h1>{{ reportHeading }}</h1>
            <p v-if="activeReport">☁ 云虾大模型生成 · {{ activeReport.content.length }} 字</p>
            <p v-else>上传材料并开始分析，报告将实时渲染在此处</p>
          </div>
          <button v-if="activeReport" type="button" class="report-copy" @click="copyReport">复制 Markdown</button>
        </div>

        <div class="report-scroll">
          <div v-if="latestPending" class="report-pending">
            <span class="turn-spinner"></span>
            <p>{{ latestPending.stage || '大模型正在分析，请稍候…' }}</p>
          </div>
          <div v-else-if="activeReport" class="report-article">
            <markdown-view :content="activeReport.content" />
          </div>
          <div v-else class="report-empty">
            <span class="report-empty-icon">📄</span>
            <h3>暂无分析报告</h3>
            <p>在左侧上传材料并点击“开始分析”，生成的 Markdown 报告将在右侧展示；历史会话中的报告也可在此回看。</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
/**
 * 征信 / 流水分析窗口（文答）：
 * 上传材料 → 后端 /api/v1/analysis 会话与材料接口（api/analysis.js，与尽调同源、不触发登录）→
 * 通过 SSE 获取大模型分析；断流/超时时轮询会话等待结果落库 → 以 Markdown 渲染报告。
 */
import { Toast } from 'mint-ui'
import {
  createSession,
  deleteSession,
  listFiles,
  listSessions,
  loadSession,
  streamChat,
  uploadFile
} from '@/api/analysis'
import MarkdownView from '@/components/markdown/MarkdownView.vue'

const MAX_FILES = 5
const MAX_FILE_SIZE = 20 * 1024 * 1024
const KINDS = {
  credit: {
    title: '征信分析',
    paneHint: '征信材料分析与风险提示',
    subtitle: '上传个人/企业征信报告（PDF、图片），由大模型输出信用状况分析报告。',
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    exts: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    uploadHint: '支持 PDF / 图片 / Word，单个不超过 20MB，最多 5 个',
    prompt: '分析个人征信，输出信用状况分析报告（含主体信息、账户概览、明细要点、逾期与担保、综合风险提示），使用 Markdown 表格。'
  },
  bankflow: {
    title: '流水分析',
    paneHint: '流水结构与异常交易分析',
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

/** 历史会话时间：今天显示时分，今年显示月-日，其余显示完整日期。 */
function formatTime (value) {
  if (!value) return ''
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  const pad = number => (number < 10 ? '0' + number : '' + number)
  const now = new Date()
  const time = pad(date.getHours()) + ':' + pad(date.getMinutes())
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return time
  }
  if (date.getFullYear() === now.getFullYear()) {
    return pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + time
  }
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
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
      sessionUnknown: false,
      turns: [],
      turnSeed: 0,
      activeStream: null,
      uploading: false,
      uploadQueued: false,
      sessionFiles: [],
      filesOpen: false,
      filesLoading: false,
      filesError: '',
      history: [],
      historyOpen: false,
      historyLoading: false,
      historyError: '',
      chatWidth: 420,
      windowWidth: 0,
      resizing: false,
      resizeStartX: 0,
      resizeStartWidth: 0,
      activeReportId: null,
      sessionTitle: ''
    }
  },
  computed: {
    config () {
      return KINDS[this.kind] || KINDS.credit
    },
    canStart () {
      return (
        !this.busy &&
        !this.sessionUnknown &&
        (this.files.length > 0 || (!!this.sessionId && !!this.prompt.trim()))
      )
    },
    /** 小窗口（≤750px）时左右分栏改为上下堆叠。 */
    compact () {
      return this.windowWidth <= 750
    },
    chatStyle () {
      return this.compact ? {} : { width: this.chatWidth + 'px' }
    },
    /** 右侧展示的报告：优先用户点选的轮次，否则为最近一次有内容的回答。 */
    activeReport () {
      if (this.activeReportId) {
        const selected = this.turns.find(
          turn => turn.id === this.activeReportId && turn.role === 'assistant' && turn.content
        )
        if (selected) return selected
      }
      for (let index = this.turns.length - 1; index >= 0; index--) {
        const turn = this.turns[index]
        if (turn.role === 'assistant' && turn.content) return turn
      }
      return null
    },
    latestPending () {
      const last = this.turns[this.turns.length - 1]
      return last && last.role === 'assistant' && last.pending ? last : null
    },
    reportHeading () {
      return this.sessionTitle || this.config.title + '报告'
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
    try {
      const stored = Number(window.localStorage.getItem('analysis.chatWidth'))
      if (isFinite(stored) && stored >= 320 && stored <= 560) this.chatWidth = stored
    } catch (error) {
      // 存储不可用时使用默认宽度
    }
    this.windowWidth = window.innerWidth
    window.addEventListener('resize', this.onViewportResize)
    this.applyKind()
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onViewportResize)
    this.stopResize()
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
      this.sessionUnknown = false
      this.busy = false
      this.dragging = false
      this.uploading = false
      this.uploadQueued = false
      this.prompt = this.config.prompt
      this.sessionFiles = []
      this.filesOpen = false
      this.filesLoading = false
      this.filesError = ''
      this.sessionTitle = ''
      this.activeReportId = null
      this.refreshHistory()
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
      // 参照尽调：会话直连创建，不触发登录；kind 用于历史会话按窗口区分。
      const session = await createSession(this.kind)
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
      this.activeReportId = null
      this.scrollMessages()
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
        this.refreshHistory()
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
            // 新一轮完成后右侧自动切到最新报告。
            this.activeReportId = null
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
      if (failure && failure.aborted) {
        turn.stage = ''
        turn.error = '已停止等待。后端可能仍在处理，结果可在历史会话中查看。'
        return
      }
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
    /** 停止等待当前运行（后端仍会继续，结果保留在历史会话）。 */
    cancelWait (turn) {
      if (!turn || !turn.pending) return
      turn.cancelRequested = true
      this.abortStream()
    },
    toggleHistory () {
      this.historyOpen = !this.historyOpen
      if (this.historyOpen) this.refreshHistory()
    },
    newSession () {
      if (this.busy) {
        Toast('分析运行中，完成后可新建会话')
        return
      }
      this.applyKind()
      this.historyOpen = false
    },
    historyTitle (item) {
      const title = item && item.title
      return !title || title === '新会话' ? '未命名会话' : title
    },
    formatTime,
    /** 读取当前窗口（kind）下的历史会话列表。 */
    async refreshHistory () {
      this.historyLoading = true
      try {
        const data = await listSessions(this.kind)
        this.history = (data && data.sessions) || []
        this.historyError = ''
      } catch (error) {
        this.historyError = error.message || '历史会话读取失败'
      } finally {
        this.historyLoading = false
      }
    },
    /** 打开历史会话：回放消息，并恢复本地已登记材料的引用能力。 */
    async openSession (item) {
      if (this.busy) {
        Toast('分析运行中，完成后可切换会话')
        return
      }
      if (!item || item.task_id === this.sessionId) {
        this.historyOpen = false
        return
      }
      try {
        const data = await loadSession(item.task_id)
        this.historyOpen = false
        this.sessionId = item.task_id
        this.sessionUnknown = !!(data && data.unknown_run)
        this.turns = this.turnsFromMessages((data && data.messages) || [])
        this.files = this.uploadedFromSession((data && data.files) || [])
        this.sessionTitle = data && data.title && data.title !== '新会话' ? data.title : ''
        this.activeReportId = null
        this.prompt = this.config.prompt
        this.refreshFiles()
        this.scrollMessages()
        if (this.sessionUnknown) Toast('该会话上次结果待核实，建议新建会话继续分析')
      } catch (error) {
        Toast('会话读取失败：' + (error.message || '请稍后重试'))
      }
    },
    /** 持久化消息 → 对话轮次（用户/助手），供打开历史会话时回放。 */
    turnsFromMessages (messages) {
      const turns = []
      messages.forEach(message => {
        const id = 'turn-' + (++this.turnSeed)
        if (message.role === 'USER') {
          turns.push({
            id: id,
            role: 'user',
            files: (message.files || []).map((name, index) => ({ key: id + '-f' + index, name: name })),
            text: message.content
          })
        } else {
          const failed = message.status === 'FAILED'
          turns.push({
            id: id,
            role: 'assistant',
            pending: false,
            stage: '',
            content: failed ? '' : message.content,
            error: failed ? message.content || '处理未完成' : ''
          })
        }
      })
      return turns
    },
    /** 会话内已登记材料 → 已上传文件项（继续对话时自动引用，无需重新上传）。 */
    uploadedFromSession (files) {
      return files
        .filter(file => file.file_id)
        .map(file => ({
          key: 'srv-' + file.file_id,
          name: file.name,
          size: file.size,
          raw: null,
          status: 'uploaded',
          fileId: file.file_id,
          error: ''
        }))
    },
    async removeSession (item) {
      if (this.busy) return
      if (!window.confirm('删除会话「' + this.historyTitle(item) + '」？删除后不可恢复。')) return
      try {
        await deleteSession(item.task_id)
        if (item.task_id === this.sessionId) {
          this.applyKind()
        } else {
          this.refreshHistory()
        }
      } catch (error) {
        Toast('删除失败：' + (error.message || '请稍后重试'))
      }
    },
    reset () {
      this.applyKind()
    },
    onViewportResize () {
      this.windowWidth = window.innerWidth
    },
    /** 拖动中线调整左侧对话区宽度（与尽调工作台一致）。 */
    startResize (event) {
      if (this.compact) return
      this.resizing = true
      this.resizeStartX = event.clientX
      this.resizeStartWidth = this.chatWidth
      window.addEventListener('mousemove', this.onResizing)
      window.addEventListener('mouseup', this.stopResize)
      document.body.style.userSelect = 'none'
    },
    onResizing (event) {
      if (!this.resizing) return
      this.chatWidth = Math.min(
        560,
        Math.max(320, this.resizeStartWidth + event.clientX - this.resizeStartX)
      )
    },
    stopResize () {
      if (!this.resizing) return
      this.resizing = false
      window.removeEventListener('mousemove', this.onResizing)
      window.removeEventListener('mouseup', this.stopResize)
      document.body.style.userSelect = ''
      this.persistChatWidth()
    },
    resizeWithKeyboard (event) {
      const step = event.shiftKey ? 48 : 16
      let next = this.chatWidth
      if (event.key === 'ArrowLeft') next -= step
      else if (event.key === 'ArrowRight') next += step
      else if (event.key === 'Home') next = 320
      else if (event.key === 'End') next = 560
      else return
      event.preventDefault()
      this.chatWidth = Math.min(560, Math.max(320, next))
      this.persistChatWidth()
    },
    persistChatWidth () {
      try {
        window.localStorage.setItem('analysis.chatWidth', String(this.chatWidth))
      } catch (error) {
        // 存储不可用时仅保留本次会话内的宽度
      }
    },
    viewReport (turn) {
      this.activeReportId = turn.id
    },
    isActiveTurn (turn) {
      return !!turn.content && this.activeReport === turn
    },
    /** 报告卡片标题：取正文首个非空行并去掉列表/标题符号。 */
    reportTitle (turn) {
      const firstLine = String(turn.content || '')
        .split('\n')
        .map(line => line.replace(/^[#>*\-\s\d.、]+/, '').trim())
        .find(line => !!line)
      const title = firstLine || '分析报告'
      return title.length > 30 ? title.slice(0, 30) + '…' : title
    },
    copyReport () {
      const report = this.activeReport
      if (!report) return
      const done = () => Toast('已复制 Markdown 报告')
      const failed = () => Toast('复制失败，请手动选择报告内容')
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(report.content).then(done, failed)
        return
      }
      try {
        const area = document.createElement('textarea')
        area.value = report.content
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        document.body.removeChild(area)
        done()
      } catch (error) {
        failed()
      }
    },
    scrollMessages () {
      this.$nextTick(() => {
        const list = this.$refs.messageList
        if (list) list.scrollTop = list.scrollHeight
      })
    }
  }
}
</script>

<style scoped lang="scss">
.analysis-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f1f4f4;

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

    .topbar-history {
      flex: none;
      margin-right: 8px;
      padding: 4px 10px;
      border: 1px solid rgba(255, 255, 255, 0.45);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      font-size: 12px;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.24);
      }
    }

    .topbar-badge {
      flex: none;
      padding: 3px 10px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.18);
      font-size: 12px;
    }
  }

  .workspace-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .chat-pane {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 420px;
    min-width: 0;
    padding: 18px 16px 10px;
    background: #fff;
    border-right: 1px solid #e2eaea;
  }

  .pane-heading {
    display: flex;
    gap: 10px;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 1px solid #f0f3f4;

    .assistant-symbol {
      display: grid;
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: #eaf5f2;
      color: #147d78;
      font-size: 18px;
      place-items: center;
    }

    h2 {
      margin: 0 0 4px;
      color: #1e3240;
      font-size: 15px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #7a8993;
      font-size: 11px;
    }
  }

  .message-stream {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 2px 10px;
  }

  .assistant-welcome {
    padding: 26px 4px;

    .welcome-icon {
      font-size: 26px;
    }

    h3 {
      margin: 12px 0 8px;
      color: #1e3240;
      font-size: 15px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #7a8993;
      font-size: 12px;
      line-height: 1.9;
    }

    .welcome-tips {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 18px;
      color: #5e737c;
      font-size: 11px;
    }
  }

  .chat-pane .upload-card {
    flex: none;
    margin-top: 8px;
    padding: 12px;
    background: #fbfdfd;
    box-shadow: none;
  }

  .workspace-divider {
    position: relative;
    z-index: 1;
    flex: 0 0 8px;
    width: 8px;
    cursor: col-resize;
    background: #e7eeee;
    touch-action: none;

    span {
      position: absolute;
      top: 50%;
      left: 2px;
      width: 4px;
      height: 48px;
      border-radius: 4px;
      background: #a5bbb9;
      transform: translateY(-50%);
    }

    &:hover,
    &:focus-visible {
      background: #d4e9e4;

      span {
        background: #147d78;
      }
    }
  }

  .report-pane {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 20px 26px 14px;
    background: #f5f7f8;
  }

  .report-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 14px;

    .report-identity {
      min-width: 0;

      .eyebrow {
        color: #93a0a8;
        font-size: 10px;
        letter-spacing: 1.6px;
      }

      h1 {
        overflow: hidden;
        margin: 6px 0 0;
        color: #1e3240;
        font-size: 21px;
        font-weight: 600;
        letter-spacing: 1px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      p {
        margin: 4px 0 0;
        color: #83929a;
        font-size: 11px;
      }
    }

    .report-copy {
      flex: none;
      padding: 6px 12px;
      border: 1px solid #cde0dc;
      border-radius: 6px;
      background: #fff;
      color: #147d78;
      font-size: 12px;
      cursor: pointer;

      &:hover {
        border-color: #8fc4bb;
        background: #f2fbf9;
      }
    }
  }

  .report-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 22px;
    border: 1px solid #e3eaea;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(31, 45, 61, 0.04);
  }

  .report-pending {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 60px 20px;
    color: #5c6b7a;
    font-size: 13px;
    text-align: center;

    .turn-spinner {
      width: 22px;
      height: 22px;
      border: 2px solid #d6e8e5;
      border-top-color: #00a996;
      border-radius: 50%;
      animation: analysis-spin 0.8s linear infinite;
    }

    p {
      margin: 0;
    }
  }

  .report-empty {
    padding: 46px 24px;
    color: #8a97a8;
    text-align: center;

    .report-empty-icon {
      font-size: 30px;
    }

    h3 {
      margin: 12px 0 8px;
      color: #5c6b7a;
      font-size: 15px;
      font-weight: 600;
    }

    p {
      max-width: 460px;
      margin: 0 auto;
      font-size: 12px;
      line-height: 1.9;
    }
  }

  .assistant-disclaimer {
    margin: 8px 0 0;
    color: #a1adb3;
    font-size: 10px;
    text-align: center;
  }

  .history-mask {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    background: rgba(13, 33, 31, 0.35);
  }

  .history-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    width: 340px;
    padding: 18px 16px;
    background: #fff;
    box-shadow: -10px 0 26px rgba(17, 43, 40, 0.18);
    transform: translateX(105%);
    transition: transform 0.25s ease;
    pointer-events: none;

    &.is-open {
      transform: translateX(0);
      pointer-events: auto;
    }

    .history-head {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .history-head-title {
        flex: 1;
        color: #20313c;
        font-size: 15px;
        font-weight: 600;
      }

      .history-new {
        flex: none;
        margin-right: 10px;
        padding: 4px 10px;
        border: 1px solid #bfe0da;
        border-radius: 12px;
        background: #f2fbf9;
        color: #0b8e80;
        font-size: 12px;
        cursor: pointer;

        &:hover {
          background: #e6f6f2;
        }

        &:disabled {
          opacity: 0.6;
          cursor: default;
        }
      }

      .history-close {
        flex: none;
        padding: 2px 4px;
        border: none;
        background: none;
        color: #9aa8b5;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;

        &:hover {
          color: #4a5a6a;
        }
      }
    }

    .history-hint {
      margin: 4px 0;
      color: #8a97a5;
      font-size: 12px;

      &.is-error {
        color: #d9534f;
      }
    }

    .history-list {
      flex: 1;
      margin: 4px 0 0;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }

    .history-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding: 10px 12px;
      border: 1px solid #edf1f0;
      border-radius: 8px;
      background: #fbfdfd;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;

      &:hover {
        border-color: #bfe0da;
      }

      &.is-active {
        border-color: #17a08f;
        background: #f2fbf9;
      }

      &.is-disabled {
        opacity: 0.65;
        cursor: default;
      }

      .history-item-main {
        flex: 1;
        min-width: 0;
      }

      .history-item-title {
        display: block;
        overflow: hidden;
        color: #2b3a4a;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .history-item-meta {
        display: block;
        margin-top: 3px;
        color: #93a1ae;
        font-size: 11px;
      }

      .history-item-remove {
        flex: none;
        padding: 2px 4px;
        border: none;
        background: none;
        color: #b6c1cc;
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
  }

  .upload-card {
    padding: 16px;
    border: 1px solid #e6edec;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(31, 45, 61, 0.05);
  }

  .upload-zone {
    padding: 12px 14px;
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
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #e6f5f2;
      color: #00a996;
      font-size: 16px;
    }

    .upload-zone-title {
      margin: 6px 0 2px;
      color: #2b3a4a;
      font-size: 13px;
      font-weight: 600;
    }

    .upload-zone-hint {
      margin: 0;
      color: #96a3b0;
      font-size: 11px;
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

    .prompt-warn {
      margin: 8px 0 0;
      color: #b07a1d;
      font-size: 12px;
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

  .chat-message {
    margin: 14px 0;
    padding: 11px 12px;
    border-radius: 9px;
    background: #f5f8f8;
    font-size: 12px;
    line-height: 1.8;

    &.user {
      background: #eaf4f1;
    }

    small {
      color: #6f858d;
      font-size: 10px;
    }

    .turn-files {
      display: flex;
      flex-wrap: wrap;
      margin: 6px 0 0;

      .turn-file {
        margin: 0 8px 4px 0;
        color: #0b8e80;
        font-size: 11px;
      }
    }

    .turn-text {
      margin: 6px 0 0;
      color: #324953;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .turn-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      color: #5c6b7a;

      .turn-spinner {
        flex: none;
        width: 13px;
        height: 13px;
        border: 2px solid #d6e8e5;
        border-top-color: #00a996;
        border-radius: 50%;
        animation: analysis-spin 0.8s linear infinite;
      }

      .turn-stage {
        flex: 1;
        min-width: 0;
      }

      .turn-cancel {
        flex: none;
        padding: 2px 10px;
        border: 1px solid #cfd9e2;
        border-radius: 10px;
        background: #fff;
        color: #5c6b7a;
        font-size: 11px;
        cursor: pointer;

        &:hover {
          border-color: #9fb2c2;
          color: #2b3a4a;
        }
      }
    }

    .turn-error {
      margin-top: 8px;
      color: #c25b52;
      font-size: 12px;

      p {
        margin: 0;
      }
    }
  }

  .report-card {
    display: flex;
    align-items: center;
    width: 100%;
    margin-top: 8px;
    padding: 9px 10px;
    border: 1px solid #d9e8e5;
    border-radius: 8px;
    background: #fff;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;

    &:hover {
      border-color: #9fd0c8;
    }

    &.is-viewing {
      border-color: #17a08f;
      background: #f2fbf9;
    }

    .report-card-icon {
      flex: none;
      margin-right: 8px;
      font-size: 15px;
    }

    .report-card-main {
      flex: 1;
      min-width: 0;
    }

    .report-card-title {
      display: block;
      overflow: hidden;
      color: #2b3a4a;
      font-size: 12px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .report-card-meta {
      display: block;
      margin-top: 3px;
      color: #93a1ae;
      font-size: 10px;
    }

    .report-card-arrow {
      flex: none;
      margin-left: 6px;
      color: #9fb2c2;
      font-size: 16px;
    }
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

      .topbar-history {
        margin-right: 14px;
        padding: 8px 20px;
        border-radius: 24px;
        font-size: 24px;
      }

      .topbar-badge {
        padding: 6px 18px;
        border-radius: 20px;
        font-size: 22px;
      }
    }

    .history-drawer {
      width: 88vw;
      padding: 32px 28px;

      .history-head {
        margin-bottom: 20px;

        .history-head-title {
          font-size: 30px;
        }

        .history-new {
          margin-right: 16px;
          padding: 8px 20px;
          border-radius: 24px;
          font-size: 24px;
        }

        .history-close {
          font-size: 36px;
        }
      }

      .history-hint {
        font-size: 24px;
      }

      .history-item {
        margin-bottom: 14px;
        padding: 18px 22px;
        border-radius: 14px;

        .history-item-title {
          font-size: 26px;
        }

        .history-item-meta {
          margin-top: 6px;
          font-size: 22px;
        }

        .history-item-remove {
          font-size: 32px;
        }
      }
    }

    .workspace-body {
      flex-direction: column;
      overflow-y: auto;
    }

    .chat-pane {
      width: 100%;
      height: 66vh;
      padding: 24px 16px 12px;
      border-right: none;
      border-bottom: 1px solid #e2eaea;
    }

    .workspace-divider {
      display: none;
    }

    .report-pane {
      flex: none;
      min-height: 68vh;
      padding: 24px 18px 18px;
    }

    .upload-card {
      padding: 28px;
      border-radius: 18px;
    }

    .upload-zone {
      padding: 24px 20px;
      border-radius: 14px;

      .upload-zone-icon {
        width: 56px;
        height: 56px;
        font-size: 28px;
      }

      .upload-zone-title {
        margin: 12px 0 6px;
        font-size: 26px;
      }

      .upload-zone-hint {
        font-size: 20px;
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

    .pane-heading {
      padding-bottom: 22px;

      .assistant-symbol {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        font-size: 34px;
      }

      h2 {
        margin-bottom: 6px;
        font-size: 30px;
      }

      p {
        font-size: 22px;
      }
    }

    .message-stream {
      padding: 8px 2px 16px;
    }

    .assistant-welcome {
      padding: 40px 8px;

      .welcome-icon {
        font-size: 48px;
      }

      h3 {
        margin: 20px 0 14px;
        font-size: 30px;
      }

      p {
        font-size: 24px;
        line-height: 2;
      }

      .welcome-tips {
        gap: 18px;
        margin-top: 30px;
        font-size: 22px;
      }
    }

    .chat-message {
      margin: 22px 0;
      padding: 20px 22px;
      border-radius: 16px;
      font-size: 24px;
      line-height: 1.8;

      small {
        font-size: 20px;
      }

      .turn-files .turn-file {
        margin: 0 12px 6px 0;
        font-size: 22px;
      }

      .turn-progress {
        gap: 14px;
        margin-top: 14px;

        .turn-spinner {
          width: 26px;
          height: 26px;
          border-width: 3px;
        }

        .turn-cancel {
          padding: 4px 18px;
          border-radius: 16px;
          font-size: 22px;
        }
      }

      .turn-error {
        margin-top: 14px;
        font-size: 24px;
      }
    }

    .report-card {
      margin-top: 14px;
      padding: 16px 18px;
      border-radius: 14px;

      .report-card-icon {
        margin-right: 14px;
        font-size: 30px;
      }

      .report-card-title {
        font-size: 24px;
      }

      .report-card-meta {
        margin-top: 6px;
        font-size: 20px;
      }

      .report-card-arrow {
        margin-left: 12px;
        font-size: 32px;
      }
    }

    .report-heading {
      margin-bottom: 22px;

      .report-identity {
        .eyebrow {
          font-size: 20px;
        }

        h1 {
          margin-top: 10px;
          font-size: 38px;
        }

        p {
          margin-top: 8px;
          font-size: 22px;
        }
      }

      .report-copy {
        padding: 12px 22px;
        border-radius: 12px;
        font-size: 24px;
      }
    }

    .report-scroll {
      padding: 30px 26px;
      border-radius: 18px;
    }

    .report-pending {
      padding: 90px 30px;
      font-size: 26px;

      .turn-spinner {
        width: 40px;
        height: 40px;
        border-width: 4px;
      }
    }

    .report-empty {
      padding: 80px 36px;

      .report-empty-icon {
        font-size: 56px;
      }

      h3 {
        margin: 20px 0 14px;
        font-size: 30px;
      }

      p {
        font-size: 24px;
        line-height: 2;
      }
    }

    .assistant-disclaimer {
      margin-top: 14px;
      font-size: 20px;
    }
  }
}
</style>
