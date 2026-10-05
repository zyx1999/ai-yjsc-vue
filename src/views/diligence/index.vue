<template>
  <div class="diligence-shell" :class="{ 'chat-open': chatOpen }">
    <aside class="nav-rail">
      <div class="brand-lockup">
        <span class="brand-symbol">融</span>
        <div><strong>粤 e 融</strong><small>智能尽调工作台</small></div>
      </div>
      <button class="new-session" :disabled="busy" @click="create">
        <i class="el-icon-plus" /> 新建调查会话
      </button>
      <div class="nav-caption">工作空间</div>
      <div class="nav-current">
        <i class="el-icon-chat-dot-square" /> 企业尽调
      </div>
      <div class="nav-caption history-caption">
        最近会话 <span>{{ sessions.length }}</span>
      </div>
      <div class="session-list" aria-label="最近会话列表">
        <div
          v-for="s in sessions"
          :key="s.task_id"
          class="session-item"
          :class="{ selected: task === s.task_id }"
        >
          <button
            class="session-link"
            :disabled="busy"
            :title="present(s.title)"
            @click="select(s.task_id)"
          >
            <i class="el-icon-chat-line-square" /><span>{{ present(s.title) }}</span>
          </button>
          <el-popover
            v-model="s.menuOpen"
            placement="right-start"
            width="210"
            trigger="click"
            popper-class="session-action-popover"
            @show="openSessionMenu(s)"
            @hide="closeSessionMenu(s)"
          >
            <div v-if="confirmDeleteId === s.task_id" class="session-delete-confirm">
              <strong>删除这个会话？</strong>
              <p>此会话将从列表移除，页面内无法恢复。</p>
              <div class="session-delete-actions">
                <button :disabled="busy" @click="cancelSessionDelete(s)">取消</button>
                <button class="danger" :disabled="busy" @click="deleteSession(s)">确认删除</button>
              </div>
            </div>
            <button
              v-else
              class="session-delete-option"
              :disabled="busy"
              @click="confirmDeleteId = s.task_id"
            ><i class="el-icon-delete" /> 删除会话</button>
            <button
              slot="reference"
              class="session-more"
              :disabled="busy"
              :aria-label="'更多操作：' + s.title"
              :aria-expanded="s.menuOpen ? 'true' : 'false'"
              :title="'更多操作：' + s.title"
              @click.stop
            ><i class="el-icon-more" /></button>
          </el-popover>
        </div>
      </div>
      <div class="rail-bottom">
        <span class="avatar">经</span>
        <div>客户经理<small>尽调业务工作空间</small></div>
      </div>
    </aside>
    <div class="workspace-main">
      <header class="workspace-header">
        <div>
          <span class="breadcrumb"
            >工作空间 <i class="el-icon-arrow-right" /></span
          ><strong>企业尽调</strong>
        </div>
        <button class="chat-toggle" @click="chatOpen = !chatOpen">
          <i class="el-icon-chat-dot-round" />
          {{ chatOpen ? '收起助手' : '与助手对话' }}</button
        ><span class="header-hint"
          ><i class="el-icon-lock" /> 业务数据 · 按企业归集</span
        >
      </header>
      <div ref="workspaceBody" class="workspace-body">
        <section class="assistant-pane" :style="assistantStyle">
          <div class="pane-heading">
            <span class="assistant-symbol"
              ><i class="el-icon-magic-stick"
            /></span>
            <div>
              <h2>尽调助手</h2>
              <p>查询资料，核对材料，形成调查结果</p>
            </div>
          </div>
          <div class="message-list">
            <div v-if="!messages.length" class="assistant-welcome">
              <span class="welcome-icon"
                ><i class="el-icon-chat-dot-round"
              /></span>
              <h3>{{ task ? '从一家企业开始' : '先新建调查会话' }}</h3>
              <p>
                {{ task ? '输入企业名称或信用代码，查询调查信息。也可以选择企业后，上传财报或征信材料。' : '点击左侧“新建调查会话”，然后输入企业名称或信用代码。' }}
              </p>
              <div class="welcome-tips">
                <span
                  ><i class="el-icon-document-checked" />
                  七个维度，统一查看</span
                ><span><i class="el-icon-files" /> 原始材料与采用值可核对</span
                ><span
                  ><i class="el-icon-circle-check" /> 财报更新由您确认</span
                >
              </div>
            </div>
            <article
              v-for="(message, index) in messages"
              :key="index"
              :class="message.role"
            >
              <small>{{ message.role === 'user' ? '我' : '尽调助手' }}</small>
              <markdown-message
                v-if="message.role === 'assistant'"
                :content="present(message.text)"
              />
              <p v-else>{{ message.text }}</p>
            </article>
            <div v-if="busy" class="working">
              <i class="el-icon-loading" /> 正在处理，请稍候…
            </div>
          </div>
          <div class="composer">
            <div class="composer-attachments">
              <button :disabled="busy" @click="chooseUpload('FINANCIAL')"><i class="el-icon-upload2" /> 上传财报</button>
              <button :disabled="busy" @click="chooseUpload('CREDIT')"><i class="el-icon-document" /> 上传征信</button>
            </div>
            <p v-if="notice" class="composer-notice">{{ notice }}</p>
            <p v-if="pendingOperations.length" class="composer-notice"><i class="el-icon-loading" /> 后端正在处理，完成后自动刷新结果。</p>
            <p v-for="operation in failedOperations" :key="operation.operation_id" class="composer-notice">业务未完成：{{ (operation.error || {}).message || operation.stage }}</p>
            <el-input
              type="textarea"
              v-model="text"
              @keydown.native="onComposerKeydown"
              :rows="3"
              placeholder="输入企业名称关键字或统一社会信用代码，生成调查表"
              :disabled="busy"
            />
            <div>
              <span>一个会话对应一家企业</span
              ><button
                :disabled="busy || !task || !text.trim()"
                @click="send"
                aria-label="发送消息"
              >
                <i class="el-icon-top" />
              </button>
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
          :aria-valuenow="assistantWidth"
          aria-valuemin="300"
          :aria-valuemax="assistantMaxWidth"
          tabindex="0"
          @mousedown="startResize"
          @keydown="resizeWithKeyboard"
        ><span /></div>
        <section class="results-panel">
          <div class="panel-heading compact-heading">
            <div class="panel-identity">
              <h1>{{ subject ? present(subject.enterprise_name) : '企业调查' }}</h1>
              <p v-if="subject">企业调查 <span>·</span> {{ subject.credit_code }}</p>
              <p v-else>输入企业名称或统一社会信用代码，开始调查</p>
            </div>
            <el-button
              v-if="subject"
              class="refresh-investigation"
              icon="el-icon-refresh"
              :disabled="busy"
              @click="investigate"
              >{{ activeResult ? '更新调查表' : '生成调查表' }}</el-button
            >
          </div>
          <div v-if="!subject" class="resolve-bar">
            <i class="el-icon-search" /><el-input
              v-model="identifier"
              placeholder="输入统一社会信用代码或企业名称关键字"
              :disabled="busy"
              @keyup.enter.native="resolve"
            /><el-button
              type="primary"
              :disabled="busy || !task || !identifier.trim()"
              @click="resolve"
              >生成调查表</el-button
            >
          </div>
          <input
            ref="file"
            type="file"
            accept="application/pdf"
            style="display: none"
            @change="uploadFile"
          />
          <p v-if="notice" class="operation-notice">
            <i class="el-icon-info" /> {{ notice }}
          </p>
          <div
            v-for="p in activeProposals"
            :key="p.proposal_id"
            class="review-notice"
          >
            <div>
              <i class="el-icon-document-checked" /><span
                ><strong>财报差异待核对</strong
                ><small
                  >{{ present(p.subject.enterprise_name) }} ·
                  {{ p.items.length }} 个候选值</small
                ></span
              >
            </div>
            <el-button @click="openProposal(p.proposal_id)"
              >开始核对 <i class="el-icon-arrow-right"
            /></el-button>
          </div>
          <template v-if="activeResult"
            ><div class="section-heading">
              <h3>
                调查全景
                <span>{{ activeResult.dimensions.length }} / 7 维度</span>
              </h3>
              <button :disabled="busy" @click="exportResult(activeResult)">
                <i class="el-icon-download" /> 导出调查表
              </button>
            </div>
            <div class="dimension-menu" role="tablist" aria-label="调查维度">
              <button
                v-for="(label, key) in labels"
                :key="key"
                role="tab"
                :aria-selected="selectedDimension === key ? 'true' : 'false'"
                :class="{ active: selectedDimension === key }"
                @click="selectedDimension = key"
              >
                <span class="dimension-menu-icon"
                  ><i :class="dimensionIcon(key)" /></span
                ><strong>{{ dimensionShort(key) }}</strong
                ><small>{{ dimensionState(key) }}</small>
              </button>
            </div>
            <div class="selected-dimension" role="tabpanel">
              <dimension-card
                v-if="activeCard"
                :key="activeResult.result_id + activeCard.dimension"
                :card="activeCard"
                :label="labels[activeCard.dimension]"
                @page="page(activeResult, activeCard, $event)"
                @edit="edit(activeResult, $event)"
              />
              <div v-else class="empty-investigation">
                <h3>该维度尚未生成</h3>
                <el-button
                  :disabled="busy"
                  @click="investigate"
                  >更新完整调查表</el-button
                >
              </div>
            </div></template
          >
          <div v-else class="empty-investigation">
            <span><i class="el-icon-office-building" /></span>
            <h3>
              {{
                subject
                  ? '企业已确认，选择一项能力开始'
                  : '先选择企业，再开展调查'
              }}
            </h3>
            <p>提供企业名称关键字或统一社会信用代码后，先生成七维调查表。</p>
            <div class="empty-dimensions">
              <span v-for="(label, key) in labels" :key="key">{{ label }}</span>
            </div>
          </div>
          <footer class="results-footer">
            <i class="el-icon-document-checked" />
            数据来源与证据可在各卡片中查看 · 未确认规则不会作为正式结论
          </footer>
        </section>
      </div>
    </div>
    <financial-review
      :proposal="proposal"
      :files="proposalFiles"
      :visible="!!proposal"
      :busy="busy"
      :labels="fieldLabels"
      @close="proposal = null"
      @confirm="confirm"
    />
  </div>
</template>
<script>
import './element-bootstrap'
import * as api from '@/api/diligence'
import DimensionCard from '@/components/diligence/DimensionCard.vue'
import FinancialReview from '@/components/diligence/FinancialReview.vue'
import MarkdownMessage from '@/components/diligence/MarkdownMessage.vue'
const dimensionNames = {
  PROFILE: '企业概况与股权关系',
  OPERATIONS: '经营与资质',
  FINANCIALS: '财务报表',
  CREDIT: '融资与征信',
  BANKING: '资金流水与银行往来',
  LEGAL: '涉诉、处罚与黑名单',
  IP: '知识产权'
}
function id() {
  return 'request-' + Date.now() + '-' + Math.random().toString(36).slice(2)
}
export default {
  components: { DimensionCard, FinancialReview, MarkdownMessage },
  data: () => ({
    selectedDimension: 'PROFILE',
    chatOpen: false,
    assistantWidth: 380,
    windowWidth: typeof window === 'undefined' ? 1280 : window.innerWidth,
    sessions: [],
    confirmDeleteId: '',
    task: '',
    messages: [],
    results: [],
    subject: null,
    investigationReady: false,
    identifier: '',
    text: '',
    busy: false,
    notice: '',
    businessOperations: [],
    pollTimer: null,
    loadSequence: 0,
    editing: false,
    role: '',
    proposalId: '',
    proposal: null,
    proposals: [],
    proposalFiles: [],
    activeCode: '',
    confirmKey: '',
    labels: dimensionNames,
    fieldLabels: {}
  }),
  async created() {
    await this.run(async () => {
      await this.refreshSessions()
      const c = await api.catalogue()
      Object.keys(c.financial_fields).forEach((k) => {
        this.$set(this.fieldLabels, k, c.financial_fields[k].label)
      })
      if (this.sessions.length) await this.load(this.sessions[0].task_id)
    })
    if (!this.task || this.results.length > 1) await this.create()
  },
  mounted() {
    try {
      const saved = Number(window.localStorage.getItem('diligence.assistantWidth'))
      if (saved >= 300 && saved <= 900) this.assistantWidth = saved
    } catch (e) {
      // Storage can be disabled; resizing remains available for this visit.
    }
    window.addEventListener('resize', this.onWindowResize)
    this.$nextTick(this.onWindowResize)
  },
  beforeDestroy() {
    clearTimeout(this.pollTimer)
    this.loadSequence++
    window.removeEventListener('resize', this.onWindowResize)
    this.stopResize()
  },
  computed: {
    pendingOperations() {
      return this.businessOperations.filter((o) => o.status === 'RUNNING')
    },
    failedOperations() {
      return this.businessOperations.filter((o) => o.status === 'FAILED').slice(-3)
    },
    compact() {
      return this.windowWidth <= 1000
    },
    assistantMaxWidth() {
      const navigationWidth = this.windowWidth <= 1190 ? 164 : 204
      return Math.max(300, this.windowWidth - navigationWidth - 440)
    },
    assistantStyle() {
      return {
        width: (this.compact
          ? Math.min(this.assistantWidth, this.windowWidth - 80)
          : this.assistantWidth) + 'px'
      }
    },
    activeCard() {
      return this.activeResult
        ? this.activeResult.dimensions.find(
            (c) => c.dimension === this.selectedDimension
          )
        : null
    },
    activeResult() {
      return (
        this.results.find((r) => r.subject.credit_code === this.activeCode) ||
        null
      )
    },
    activeProposals() {
      return this.proposals.filter(
        (p) => !this.activeResult || p.subject.credit_code === this.activeCode
      )
    }
  },
  methods: {
    present(value) {
      return typeof value === 'string' ? value.replace(/（模拟）/g, '') : value
    },
    async refreshSessions() {
      this.sessions = (await api.sessions()).map((s) =>
        Object.assign({}, s, { menuOpen: false })
      )
    },
    openSessionMenu(session) {
      this.sessions.forEach((s) => {
        if (s.task_id !== session.task_id) s.menuOpen = false
      })
      this.confirmDeleteId = ''
    },
    closeSessionMenu(session) {
      if (this.confirmDeleteId === session.task_id) this.confirmDeleteId = ''
    },
    cancelSessionDelete(session) {
      session.menuOpen = false
      this.confirmDeleteId = ''
    },
    clearSession() {
      clearTimeout(this.pollTimer)
      this.loadSequence++
      this.businessOperations = []
      this.task = ''
      this.selectedDimension = 'PROFILE'
      this.messages = []
      this.results = []
      this.proposals = []
      this.subject = null
      this.investigationReady = false
      this.activeCode = ''
      this.identifier = ''
      this.text = ''
      this.proposal = null
      this.proposalId = ''
      this.notice = ''
    },
    async deleteSession(session) {
      await this.run(async () => {
        await api.deleteSession(session.task_id)
        session.menuOpen = false
        this.confirmDeleteId = ''
        await this.refreshSessions()
        if (this.task === session.task_id) {
          this.clearSession()
          if (this.sessions.length) await this.load(this.sessions[0].task_id)
        }
        this.$message.success('会话已删除')
      })
    },
    onWindowResize() {
      this.windowWidth = window.innerWidth
      if (!this.compact)
        this.assistantWidth = Math.min(this.assistantWidth, this.assistantMaxWidth)
    },
    setAssistantWidth(width) {
      this.assistantWidth = Math.max(300, Math.min(width, this.assistantMaxWidth))
    },
    rememberAssistantWidth() {
      try {
        window.localStorage.setItem('diligence.assistantWidth', String(this.assistantWidth))
      } catch (e) {
        // Keep the current layout even when storage is unavailable.
      }
    },
    startResize(event) {
      if (event.button !== 0) return
      event.preventDefault()
      this.previousUserSelect = document.body.style.userSelect
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', this.moveResize)
      window.addEventListener('mouseup', this.stopResize)
    },
    moveResize(event) {
      this.setAssistantWidth(event.clientX - this.$refs.workspaceBody.getBoundingClientRect().left)
    },
    stopResize() {
      window.removeEventListener('mousemove', this.moveResize)
      window.removeEventListener('mouseup', this.stopResize)
      if (this.previousUserSelect !== undefined) {
        document.body.style.userSelect = this.previousUserSelect
        this.previousUserSelect = undefined
        this.rememberAssistantWidth()
      }
    },
    resizeWithKeyboard(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      this.setAssistantWidth(this.assistantWidth + (event.key === 'ArrowRight' ? 24 : -24))
      this.rememberAssistantWidth()
    },
    dimensionState(key) {
      const c =
        this.activeResult &&
        this.activeResult.dimensions.find((d) => d.dimension === key)
      if (!c) return '尚未查询'
      if (c.data_status === 'UNAVAILABLE') return '待接入'
      if (c.data_status === 'FAILED') return '查询失败'
      if (c.data_status === 'PARTIAL') return '部分资料'
      return this.dimensionCount(key) + ' 条记录'
    },
    dimensionCount(key) {
      const c =
        this.activeResult &&
        this.activeResult.dimensions.find((d) => d.dimension === key)
      return c ? c.groups.reduce((n, g) => n + (g.total_count || 0), 0) : null
    },
    dimensionIcon(key) {
      return {
        PROFILE: 'el-icon-office-building',
        OPERATIONS: 'el-icon-s-operation',
        FINANCIALS: 'el-icon-data-analysis',
        CREDIT: 'el-icon-bank-card',
        BANKING: 'el-icon-sort',
        LEGAL: 'el-icon-document-checked',
        IP: 'el-icon-medal'
      }[key]
    },
    dimensionShort(key) {
      return {
        PROFILE: '企业概况',
        OPERATIONS: '经营资质',
        FINANCIALS: '财务报表',
        CREDIT: '融资征信',
        BANKING: '银行往来',
        LEGAL: '涉诉处罚',
        IP: '知识产权'
      }[key]
    },
    selectEnterprise(result) {
      this.activeCode = result.subject.credit_code
      this.subject = result.subject
    },
    async useExample() {
      this.identifier = '91310000MA00000001'
      await this.resolve()
    },

    async run(action) {
      if (this.busy) return
      this.busy = true
      try {
        await action()
      } catch (e) {
        this.$message.error(e.message)
      } finally {
        this.busy = false
      }
    },
    async load(task, background = false) {
      clearTimeout(this.pollTimer)
      const sequence = ++this.loadSequence
      const s = await api.loadSession(task)
      if (sequence !== this.loadSequence || (background && this.task !== task)) return
      this.businessOperations = s.business_operations || []
      this.task = task
      this.messages = s.messages
      if (!background || JSON.stringify(this.results.map((r) => [r.result_id, r.version])) !== JSON.stringify(s.results.map((r) => [r.result_id, r.version])))
        this.results = s.results
      this.proposals = s.proposals || []
      this.investigationReady = !!s.investigation_ready
      this.subject = s.bound_subject || null
      if (!this.results.some((r) => r.subject.credit_code === this.activeCode))
        this.activeCode = this.results.length
          ? this.results[0].subject.credit_code
          : ''
      if (this.activeResult) this.subject = this.activeResult.subject
      if (this.results.length > 1) {
        this.subject = null
        this.activeCode = ''
        this.notice = '这是旧版多企业会话。请新建会话，每个会话只调查一家企业。'
      }
      this.schedulePoll(task)
    },
    schedulePoll(task) {
      clearTimeout(this.pollTimer)
      if (!this.pendingOperations.length) return
      this.pollTimer = setTimeout(async () => {
        if (this.task !== task) return
        if (this.busy || this.editing || this.proposal) {
          this.schedulePoll(task)
          return
        }
        try {
          await this.load(task, true)
        } catch (e) {
          if (this.task === task) {
            this.notice = '暂时无法查询业务进度，正在重试。'
            this.schedulePoll(task)
          }
        }
      }, 2000)
    },
    async select(task) {
      this.subject = null
      this.proposal = null
      this.proposalId = ''
      this.notice = ''
      await this.run(() => this.load(task))
    },
    async create() {
      await this.run(async () => {
        const s = await api.createSession()
        await this.refreshSessions()
        this.subject = null
        this.notice = ''
        await this.load(s.task_id)
      })
    },
    ordered(cards) {
      const order = Object.keys(dimensionNames)
      return cards
        .slice()
        .sort((a, b) => order.indexOf(a.dimension) - order.indexOf(b.dimension))
    },
    async resolve() {
      await this.run(async () => {
        const value = this.identifier.trim()
        if (value) await this.performChat(value)
      })
    },
    assistantCount() {
      return this.messages.reduce(
        (total, message) => total + (message.role === 'assistant' ? 1 : 0),
        0
      )
    },
    // 连接可能因长耗时模型等待被网关/浏览器中断，但后端仍在运行并会持久化回复：
    // 轮询会话，直到出现新的助手回复或达到等待上限。
    async awaitAssistantReply(assistantBefore) {
      const deadline = Date.now() + 10 * 60 * 1000
      for (;;) {
        try {
          await this.load(this.task, true)
        } catch (e) {
          // 轮询期间的瞬时错误忽略，继续等待后端结果落地。
        }
        if (this.assistantCount() > assistantBefore) return true
        if (Date.now() >= deadline) return false
        this.notice = '后端仍在处理，正在等待结果返回…'
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    },
    async performChat(text, attachment) {
      const assistantBefore = this.assistantCount()
      let failure = null
      let failed = false
      try {
        await api.streamChat(this.task, text, (event) => {
          if (event.type === 'run.progress') this.notice = '正在处理…'
          if (event.type === 'run.completed' && this.notice === '正在处理…')
            this.notice = ''
          if (event.type === 'confirmation.required') {
            this.proposalId = event.payload.proposal_id
            this.confirmKey = id()
          }
          if (event.type === 'run.unknown' || event.type === 'run.failed') {
            failed = true
            this.notice = event.payload.error.message
          }
        }, attachment)
      } catch (error) {
        failure = error
      }
      // 连接不完整结束（超时/中断）时后端可能仍在运行，等待其结果而不是直接报错。
      let recovered = false
      if (failure && failure.pending) {
        recovered = await this.awaitAssistantReply(assistantBefore)
      }
      await this.load(this.task)
      await this.refreshSessions()
      if (this.proposalId) await this.readProposal(this.proposalId)
      if (failure && !recovered) throw failure
      if (recovered || (!failed && this.notice === '正在处理…')) this.notice = ''
    },
    onComposerKeydown(event) {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return
      event.preventDefault()
      if (!event.repeat) this.send()
    },
    async send() {
      if (this.busy || !this.task || !this.text.trim()) return
      const text = this.text.trim()
      await this.run(async () => {
        this.text = ''
        await this.performChat(text)
      })
    },
    async investigate() {
      if (!this.subject) return
      await this.run(async () => {
        await this.performChat('更新调查表')
      })
    },
    async page(result, card, group) {
      await this.run(async () => {
        await api.call(this.task, 'data/query', {
          credit_code: result.subject.credit_code,
          dimension: card.dimension,
          group_key: group.group_key,
          cursor: group.next_cursor,
          topic: 'ALL'
        })
        await this.load(this.task)
      })
    },
    chooseUpload(role) {
      if (!this.subject || !this.investigationReady) {
        this.notice = '请先提供企业名称或统一社会信用代码并生成调查表。'
        return this.$message.warning(this.notice)
      }
      if (this.busy) return
      this.role = role
      this.$refs.file.click()
    },
    async uploadFile(event) {
      const file = event.target.files[0]
      event.target.value = ''
      if (!file || !this.subject) return
      const subject = Object.assign({}, this.subject)
      const role = this.role
      await this.run(async () => {
        const saved = await api.upload(this.task, subject.credit_code, role, file)
        await this.performChat(
          role === 'FINANCIAL' ? '请处理刚上传的财报' : '请比对刚上传的征信报告',
          { file_id: saved.file_id }
        )
      })
    },
    async openProposal(id) {
      await this.run(() => this.readProposal(id || this.proposalId))
    },
    async readProposal(id) {
      this.proposalId = id
      this.confirmKey = id + '-confirm'
      this.proposal = await api.call(this.task, 'financial/proposals/read', {
        proposal_id: id
      })
      const refs = await api.proposalFiles(this.task, id)
      this.proposalFiles = refs.map((f) =>
        Object.assign({}, f, { url: api.fileUrl(this.task, f.file_id) })
      )
    },
    async confirm(decisions) {
      await this.run(async () => {
        const op = await api.call(this.task, 'financial/confirm', {
          proposal_id: this.proposal.proposal_id,
          baseline_token: this.proposal.baseline_token,
          idempotency_key: this.confirmKey,
          decisions
        })
        this.notice =
          op.status === 'SUCCEEDED'
            ? '已保存并刷新财报。'
            : (op.error || {}).message || '请核实操作状态'
        if (op.status === 'SUCCEEDED') {
          this.proposal = null
          this.proposalId = ''
        }
        await this.load(this.task)
      })
    },
    async edit(result, item) {
      this.editing = true
      try {
        const answer = await this.$prompt(
          item.field.label + '（' + result.subject.enterprise_name + '）',
          '修改数据库源字段',
          {
            inputValue: String(item.field.value || ''),
            inputPattern: /^-?(0|[1-9][0-9]*)(\.[0-9]+)?$/,
            inputErrorMessage: '请输入合法金额'
          }
        )
        await this.run(async () => {
          const op = await api.call(this.task, 'source-fields/save', {
            result_id: result.result_id,
            base_version: result.version,
            idempotency_key: id(),
            changes: [
              {
                record_id: item.row.record_id,
                field_key: item.field.field_key,
                value: answer.value
              }
            ]
          })
          if (op.status !== 'SUCCEEDED')
            throw new Error((op.error || {}).message || '保存结果待核实')
          await this.load(this.task)
        })
      } catch (e) {
        if (e && e.message) this.$message.error(e.message)
      } finally {
        this.editing = false
      }
    },
    async exportResult(result) {
      await this.run(async () => {
        const r = await api.call(this.task, 'results/export', {
          result_id: result.result_id,
          version: result.version,
          format: 'DOCX',
          idempotency_key: id()
        })
        if (r.file_id) {
          const a = document.createElement('a')
          a.href = api.fileUrl(this.task, r.file_id)
          a.download = '企业调查表.docx'
          a.click()
        }
      })
    }
  }
}
</script>
