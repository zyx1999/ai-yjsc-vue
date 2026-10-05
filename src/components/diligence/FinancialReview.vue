<template>
  <el-dialog
    title="财报差异核对"
    :visible="visible"
    width="92%"
    :close-on-click-modal="false"
    @close="$emit('close')"
  >
    <template v-if="proposal">
      <p>
        {{ proposal.subject.enterprise_name }} ·
        {{ proposal.subject.credit_code }}
      </p>
      <p>
        仅确认采用的值会写入；新增期间可确认新增。无写映射或口径未明的项目不可采用。
      </p>
      <div class="review-originals">
        <a
          v-for="file in files"
          :key="file.file_id"
          :href="file.url"
          target="_blank"
          rel="noopener"
          ><i class="el-icon-document" /> 查看原始 PDF · {{ file.name }}</a
        >
      </div>
      <el-table :data="rows" max-height="480" border>
        <el-table-column label="科目" min-width="130">
          <template slot-scope="s">
            <span v-if="s && s.row">{{ labels[s.row.candidate.field_key] || s.row.candidate.field_key }}</span>
          </template>
        </el-table-column>
        <el-table-column label="期间 / 口径" min-width="190">
          <template slot-scope="s">
            <span v-if="s && s.row">
              {{ period(s.row.candidate.context) }}<br />
              {{ s.row.candidate.context.scope }} / {{ s.row.candidate.context.currency }} /
              {{ s.row.candidate.context.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="原文值 / 库内值" min-width="120">
          <template slot-scope="s">
            <span v-if="s && s.row">
              {{ s.row.candidate.raw_value }} /
              {{ s.row.database_value === null ? '缺值' : s.row.database_value }}<br />
              {{ differences[s.row.difference] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="采用方式" width="130">
          <template slot-scope="s">
            <el-select v-if="s && s.row" v-model="s.row.action" :disabled="!s.row.writable">
              <el-option label="采用" value="ACCEPT" />
              <el-option label="修正" value="REPLACE" />
              <el-option label="忽略" value="IGNORE" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="修正值 / 阻断原因" min-width="170">
          <template slot-scope="s">
            <template v-if="s && s.row">
              <el-input v-if="s.row.action === 'REPLACE'" v-model="s.row.replacement" />
              <span v-else>{{ s.row.blockers.join('；') }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="依据" min-width="110">
          <template slot-scope="s">
            <span v-if="s && s.row">{{ s.row.candidate.evidence_refs.join('、') }}</span>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer"
        ><el-button :disabled="busy" @click="$emit('close')">稍后核对</el-button
        ><el-button type="primary" :loading="busy" @click="confirm"
          >确认采用并保存</el-button
        ></span
      >
    </template>
  </el-dialog>
</template>
<script>
export default {
  props: {
    proposal: Object,
    files: Array,
    visible: Boolean,
    busy: Boolean,
    labels: Object
  },
  data: () => ({
    rows: [],
    differences: {
      NEW: '新增',
      CHANGED: '有差异',
      UNCHANGED: '一致',
      UNCOMPARABLE: '口径待核对',
      INVALID: '需修正',
      MISSING_MAPPING: '缺少写映射'
    }
  }),
  watch: {
    proposal: {
      immediate: true,
      handler(value) {
        this.rows = value
          ? value.items.map((item) =>
              Object.assign({}, item, {
                action:
                  item.writable && item.candidate.normalized_value !== null
                    ? 'ACCEPT'
                    : 'IGNORE',
                replacement: item.candidate.normalized_value || ''
              })
            )
          : []
      }
    }
  },
  methods: {
    period(c) {
      return c.period ? c.period.start + ' 至 ' + c.period.end : '期间未识别'
    },
    confirm() {
      const decisions = this.rows.map((row) => {
        const d = {
          candidate_id: row.candidate.candidate_id,
          action: row.action
        }
        if (d.action === 'REPLACE') d.replacement_value = row.replacement.trim()
        return d
      })
      if (!decisions.some((d) => d.action !== 'IGNORE'))
        return this.$message.warning('没有采用项')
      if (
        decisions.some(
          (d) =>
            d.action === 'REPLACE' &&
            !/^-?(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(d.replacement_value)
        )
      )
        return this.$message.error('请修正非法金额或忽略该项')
      this.$emit('confirm', decisions)
    }
  }
}
</script>
