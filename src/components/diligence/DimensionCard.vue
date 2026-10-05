<template>
  <section
    class="dimension-card"
    :class="{ 'wide-card': card.dimension === 'FINANCIALS' }"
  >
    <div class="card-head">
      <div class="card-title">
        <span class="card-icon"><i :class="icon" /></span>
        <div>
          <h3>{{ label }}</h3>
          <small>{{ card.groups.length }} 类资料 · {{ total }} 条记录</small>
        </div>
      </div>
      <span class="data-badge" :class="card.data_status.toLowerCase()"
        ><i />{{ statuses[card.data_status] || card.data_status }}</span
      >
    </div>
    <section v-if="orderedSummaries.length" class="summary-overview">
      <div class="summary-overview-title">
        <strong>调查摘要</strong><span>基于当前已取得资料</span>
      </div>
      <article v-for="field in orderedSummaries" :key="field.field_key" class="summary-item">
        <div><span :class="field.origin === 'AI_SUMMARY' ? 'ai-label' : ''">{{ field.origin === 'AI_SUMMARY' ? 'AI 解读' : '规则汇总' }}</span><h4>{{ field.label }}</h4></div>
        <p>{{ present(field.value) }}</p>
      </article>
    </section>
    <template v-if="card.dimension === 'FINANCIALS' && financialRows.length">
      <div class="financial-highlights">
        <div v-for="item in financialHighlights" :key="item.key">
          <span>{{ item.label }}</span
          ><strong
            >{{ number(item.value) }}<small>{{ item.unit }}</small></strong
          >
        </div>
      </div>
      <div class="financial-caption">
        <i class="el-icon-date" /> {{ financialPeriod }} · {{ scopeLabel }}
        <span>数据库采用值</span>
      </div>
    </template>
    <div
      v-else-if="preview.length && card.dimension === 'PROFILE'"
      class="preview-fields"
    >
      <div v-for="(field, i) in preview" :key="i">
        <span>{{ field.label }}</span
        ><strong :title="String(field.value)">{{ display(field) }}</strong>
      </div>
    </div>
    <div v-else-if="!preview.length" class="no-record">
      <i class="el-icon-document" /><span>{{
        statuses[card.data_status] || '暂无资料'
      }}</span>
    </div>
    <div v-if="readyMetrics.length" class="metric-glance">
      <div v-for="field in readyMetrics.slice(0, 3)" :key="field.field_key">
        <span>{{ field.label }}</span>
        <strong>{{ display(field) }}<small v-if="field.context.unit"> {{ field.context.unit }}</small></strong>
      </div>
    </div>
    <div class="group-chips">
      <span v-for="group in card.groups" :key="group.group_key"
        ><i
          :class="
            group.data_status === 'EMPTY'
              ? 'el-icon-circle-check'
              : 'el-icon-document'
          "
        />{{ present(group.title)
        }}<b>{{
          group.total_count === null ? '—' : group.total_count
        }}</b></span
      >
    </div>
    <div class="dimension-data">
      <div class="detail-summary">
        <span class="data-badge">{{ statuses[card.data_status] }}</span
        ><span
          >规则与总结：{{
            analysis[card.analysis_status] || card.analysis_status
          }}</span
        >
      </div>
      <p
        v-for="(item, i) in visibleLimitations"
        :key="'limit' + i"
        class="data-note"
      >
        {{ item }}
      </p>
      <div
        v-for="group in card.groups"
        :key="group.group_key"
        class="detail-group"
      >
        <h4>
          {{ present(group.title) }}
          <small
            >{{ statuses[group.data_status] }} ·
            {{
              group.total_count === null
                ? '数量未知'
                : group.total_count + ' 条'
            }}{{ group.complete ? '' : ' · 尚有未加载数据' }}</small
          >
        </h4>
        <p v-for="(item, i) in group.limitations" :key="i" class="data-note">
          {{ present(item) }}
        </p>
        <div v-for="row in group.rows" :key="row.record_id" class="detail-row">
          <p v-if="row.subject_relation !== 'TARGET'">
            关联主体：{{ present(row.subject_name) }}
          </p>
          <p
            v-if="row.fields[0] && row.fields[0].context.period"
            class="period-label"
          >
            {{ row.fields[0].context.period.start }} 至
            {{ row.fields[0].context.period.end }} ·
            {{ row.fields[0].context.unit }}
          </p>
          <div
            class="detail-field"
            v-for="field in row.fields"
            :key="field.field_key"
          >
            <span>{{ field.label }}</span
            ><strong>{{ display(field) }}</strong
            ><el-button
              v-if="field.editable"
              type="text"
              @click="$emit('edit', { row, field })"
              >修改</el-button
            >
          </div>
        </div>
        <el-button
          v-if="group.next_cursor"
          type="text"
          @click="$emit('page', group)"
          >加载下一页</el-button
        >
      </div>
      <details v-if="readyMetrics.length" class="detail-group" open>
        <summary>已算指标 · {{ readyMetrics.length }} 项</summary>
        <div
          class="detail-field"
          v-for="field in readyMetrics"
          :key="field.field_key"
        >
          <span>{{ field.label }}</span
          ><strong>{{ display(field) }}<small v-if="field.context.unit"> {{ field.context.unit }}</small></strong>
        </div>
      </details>
      <details v-if="pendingMetrics.length" class="detail-group">
        <summary>待确认或缺少数据 · {{ pendingMetrics.length }} 项</summary>
        <div
          class="detail-field"
          v-for="field in pendingMetrics"
          :key="field.field_key"
        >
          <span>{{ field.label }}</span
          ><strong>{{ display(field) }}</strong>
        </div>
      </details>
      <details class="evidence-list">
        <summary>数据依据 · {{ card.evidence.length }} 项</summary>
        <p v-for="e in card.evidence" :key="e.evidence_id">
          {{ e.source_id }} · {{ e.locator }}
        </p>
      </details>
    </div>
  </section>
</template>
<script>
export default {
  props: {
    card: { type: Object, required: true },
    label: { type: String, required: true }
  },
  data: () => ({
    statuses: {
      AVAILABLE: '资料已取得',
      EMPTY: '无相关记录',
      UNAVAILABLE: '待接入数据',
      PARTIAL: '部分资料',
      FORBIDDEN: '无访问权限',
      NOT_APPLICABLE: '不适用',
      FAILED: '查询失败'
    },
    analysis: {
      CURRENT: '已生成',
      NOT_GENERATED: '尚未生成',
      STALE: '待更新',
      RUNNING: '处理中',
      FAILED: '生成失败'
    }
  }),
  computed: {
    orderedSummaries() {
      const aiCodes = this.card.summaries
        .filter((field) => field.origin === 'AI_SUMMARY')
        .map((field) => field.field_key.replace(/^ai\./, ''))
      return this.card.summaries
        .filter((field) => !field.field_key.startsWith('reference.A') ||
          !aiCodes.includes(field.field_key.slice('reference.'.length)))
        .slice()
        .sort((a, b) => (a.origin === 'AI_SUMMARY' ? 0 : 1) -
          (b.origin === 'AI_SUMMARY' ? 0 : 1))
    },
    visibleLimitations() {
      return this.card.limitations.filter(
        (item) => item !== '模拟数据，仅用于开发演示'
      )
    },
    readyMetrics() {
      return this.card.metrics.filter((field) => field.value !== null)
    },
    pendingMetrics() {
      return this.card.metrics.filter((field) => field.value === null)
    },
    icon() {
      return {
        PROFILE: 'el-icon-office-building',
        OPERATIONS: 'el-icon-s-operation',
        FINANCIALS: 'el-icon-data-analysis',
        CREDIT: 'el-icon-bank-card',
        BANKING: 'el-icon-sort',
        LEGAL: 'el-icon-document-checked',
        IP: 'el-icon-medal'
      }[this.card.dimension]
    },
    total() {
      return this.card.groups.reduce((n, g) => n + (g.total_count || 0), 0)
    },
    preview() {
      const rows = this.card.groups.reduce((a, g) => a.concat(g.rows), [])
      if (!rows.length) return []
      return rows[0].fields
        .filter(
          (f) => !['企业名称', '统一社会信用代码', '注册地址'].includes(f.label)
        )
        .slice(0, 5)
    },
    financialRows() {
      return this.card.groups
        .reduce((a, g) => a.concat(g.rows), [])
        .slice()
        .sort((a, b) =>
          String((b.fields[0].context.period || {}).end).localeCompare(
            String((a.fields[0].context.period || {}).end)
          )
        )
    },
    financialHighlights() {
      const fields = this.financialRows[0].fields
      return [
        ['financial.f109', '总资产'],
        ['financial.f160', '营业收入'],
        ['financial.f170', '净利润']
      ].map(([key, label]) => {
        const f = fields.find((v) => v.field_key === key)
        return {
          key,
          label,
          value: f ? f.value : null,
          unit: f ? f.context.unit : ''
        }
      })
    },
    financialPeriod() {
      const c = this.financialRows[0].fields[0].context
      return c.period ? c.period.start + ' 至 ' + c.period.end : '期间未明'
    },
    scopeLabel() {
      return (
        { STANDALONE: '单体报表', CONSOLIDATED: '合并报表' }[
          this.financialRows[0].fields[0].context.scope
        ] || '口径待核对'
      )
    }
  },
  methods: {
    present(value) {
      return typeof value === 'string'
        ? value.replace(/（模拟(?:接口)?）/g, '')
          .replace('用于本地比对演示；正式库内基准接口待接入', '正式库内征信基准接口待接入')
        : value
    },
    display(f) {
      return this.present(f.value === null ? f.missing_reason : f.value)
    },
    number(v) {
      if (v === null) return '—'
      const p = String(v).split('.')
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return p.join('.')
    }
  }
}
</script>
