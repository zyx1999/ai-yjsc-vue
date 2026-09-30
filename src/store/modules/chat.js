/**
 * 对话状态模块：会话列表、当前会话消息、运行中状态与 SSE 事件处理。
 *
 * 消息对象统一结构（保证 Vue 2 响应式字段完整）：
 * { localId, id, role, content, status, error, errorCode, attachments, steps, pending, createdAt }
 */
import {
  ensureLogin,
  listSessions,
  createSession,
  getSession,
  renameSession,
  deleteSession,
  uploadAttachment
} from '@/api/chat'
import { streamMessage } from '@/api/chatStream'

let activeStream = null
let localIdSeed = 0

function nextLocalId (prefix) {
  localIdSeed += 1
  return prefix + '_' + localIdSeed + '_' + Date.now()
}

function toUiMessage (dto) {
  return {
    localId: 's_' + dto.id,
    id: dto.id,
    role: dto.role,
    content: dto.content || '',
    status: dto.status,
    error: null,
    errorCode: dto.errorCode || null,
    attachments: dto.attachments || [],
    steps: [],
    pending: false,
    createdAt: dto.createdAt || Date.now()
  }
}

const state = {
  ready: false,
  loading: false,
  sessions: [],
  activeSessionId: null,
  messages: [],
  sending: false,
  runActive: false,
  runAssistantId: null,
  error: null,
  drawerVisible: false
}

const mutations = {
  SET_READY (state, value) {
    state.ready = value
  },
  SET_LOADING (state, value) {
    state.loading = value
  },
  SET_SESSIONS (state, value) {
    state.sessions = value
  },
  SET_ACTIVE (state, value) {
    state.activeSessionId = value
  },
  SET_MESSAGES (state, value) {
    state.messages = value
  },
  PUSH_MESSAGE (state, message) {
    state.messages.push(message)
  },
  PATCH_MESSAGE (state, payload) {
    const message = state.messages.find(item => item.localId === payload.id)
    if (message) {
      Object.assign(message, payload.patch)
    }
  },
  APPEND_STEP (state, payload) {
    const message = state.messages.find(item => item.localId === payload.id)
    if (message && message.steps) {
      message.steps.push(payload.step)
    }
  },
  UPDATE_SESSION (state, payload) {
    const session = state.sessions.find(item => item.id === payload.id)
    if (session) {
      Object.assign(session, payload.patch)
    }
  },
  SET_SENDING (state, value) {
    state.sending = value
  },
  SET_RUN_ACTIVE (state, value) {
    state.runActive = value
  },
  SET_RUN_ASSISTANT (state, value) {
    state.runAssistantId = value
  },
  SET_ERROR (state, value) {
    state.error = value
  },
  SET_DRAWER (state, value) {
    state.drawerVisible = value
  }
}

const actions = {
  /** 首次进入：登录 + 加载会话；无会话则创建；打开最近会话。 */
  async init ({ state, commit, dispatch }) {
    if (state.ready || state.loading) {
      return
    }
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      await ensureLogin()
      const sessions = await listSessions()
      commit('SET_SESSIONS', sortSessions(sessions || []))
      if (state.sessions.length > 0) {
        await dispatch('openSession', state.sessions[0].id)
      } else {
        await dispatch('newSession')
      }
      commit('SET_READY', true)
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async loadSessions ({ commit }, options) {
    const opts = options || {}
    try {
      const sessions = await listSessions()
      commit('SET_SESSIONS', sortSessions(sessions || []))
    } catch (error) {
      if (!opts.silent) {
        commit('SET_ERROR', error.message)
      }
    }
  },

  async newSession ({ commit, state }) {
    const session = await createSession()
    const sessions = [session].concat(state.sessions)
    commit('SET_SESSIONS', sessions)
    commit('SET_ACTIVE', session.id)
    commit('SET_MESSAGES', [])
    commit('SET_DRAWER', false)
    commit('SET_ERROR', null)
    commit('SET_READY', true)
    return session.id
  },

  async openSession ({ commit }, sessionId) {
    const detail = await getSession(sessionId)
    commit('SET_ACTIVE', sessionId)
    commit('SET_MESSAGES', (detail.messages || []).map(toUiMessage))
    if (detail.session) {
      commit('UPDATE_SESSION', { id: sessionId, patch: detail.session })
    }
    commit('SET_ERROR', null)
    return sessionId
  },

  async renameSession ({ commit }, payload) {
    const session = await renameSession(payload.id, payload.title)
    commit('UPDATE_SESSION', { id: payload.id, patch: session || { id: payload.id, title: payload.title } })
  },

  async removeSession ({ commit, state, dispatch }, sessionId) {
    await deleteSession(sessionId)
    commit('SET_SESSIONS', state.sessions.filter(item => item.id !== sessionId))
    if (state.activeSessionId === sessionId) {
      commit('SET_ACTIVE', null)
      commit('SET_MESSAGES', [])
      if (state.sessions.length > 0) {
        await dispatch('openSession', state.sessions[0].id)
      } else {
        await dispatch('newSession')
      }
    }
  },

  refreshActive ({ state, dispatch }) {
    if (state.activeSessionId) {
      return dispatch('openSession', state.activeSessionId)
    }
    return dispatch('newSession')
  },

  /** 发送消息：上传附件 → 乐观插入消息 → 消费 SSE → 结束清理。 */
  async sendMessage ({ state, commit, dispatch }, payload) {
    const text = (payload.text || '').trim()
    const files = payload.files || []
    if (state.runActive || (!text && files.length === 0)) {
      return
    }
    let sessionId = state.activeSessionId
    commit('SET_SENDING', true)
    commit('SET_ERROR', null)
    let stream
    try {
      if (!sessionId) {
        sessionId = await dispatch('newSession')
      }
      const uploaded = []
      for (let i = 0; i < files.length; i++) {
        uploaded.push(await uploadAttachment(sessionId, files[i]))
      }
      const userMessage = {
        localId: nextLocalId('u'),
        id: null,
        role: 'USER',
        content: text,
        status: 'SUCCEEDED',
        error: null,
        errorCode: null,
        attachments: uploaded,
        steps: [],
        pending: false,
        createdAt: Date.now()
      }
      const assistantMessage = {
        localId: nextLocalId('a'),
        id: null,
        role: 'ASSISTANT',
        content: '',
        status: 'PENDING',
        error: null,
        errorCode: null,
        attachments: [],
        steps: [],
        pending: true,
        createdAt: Date.now()
      }
      commit('PUSH_MESSAGE', userMessage)
      commit('PUSH_MESSAGE', assistantMessage)
      commit('SET_RUN_ASSISTANT', assistantMessage.localId)
      commit('SET_RUN_ACTIVE', true)
      dispatch('touchSession', { id: sessionId, text: text })

      stream = streamMessage(sessionId, {
        text: text,
        attachmentIds: uploaded.map(item => item.id)
      }, {
        onEvent: event => dispatch('handleRunEvent', event)
      })
      activeStream = stream
      try {
        await stream.promise
      } catch (error) {
        if (error.aborted) {
          commit('PATCH_MESSAGE', {
            id: assistantMessage.localId,
            patch: {
              pending: false,
              status: 'UNKNOWN',
              content: '已停止等待。本轮结果未知，请点击「重新核实」查看会话最新状态。',
              errorCode: 'CLIENT_ABORTED'
            }
          })
        } else {
          commit('PATCH_MESSAGE', {
            id: assistantMessage.localId,
            patch: {
              pending: false,
              status: 'FAILED',
              content: error.message,
              errorCode: 'CLIENT_ERROR'
            }
          })
        }
      }
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      activeStream = null
      commit('SET_SENDING', false)
      commit('SET_RUN_ACTIVE', false)
      commit('SET_RUN_ASSISTANT', null)
      dispatch('loadSessions', { silent: true })
    }
  },

  /** 应用事件处理（来自 chatStream 的 run.* 事件）。 */
  handleRunEvent ({ state, commit }, event) {
    const type = event && event.type
    const assistantId = state.runAssistantId
    if (!type) {
      return
    }
    if (type === 'run.progress' && assistantId) {
      commit('APPEND_STEP', {
        id: assistantId,
        step: {
          stage: event.stage,
          title: event.title || stageLabel(event.stage),
          message: event.message,
          skill: event.skill,
          seq: event.seq
        }
      })
    } else if (type === 'answer.completed' && assistantId) {
      commit('PATCH_MESSAGE', {
        id: assistantId,
        patch: {
          pending: false,
          status: 'SUCCEEDED',
          content: event.content || '',
          id: event.messageId || null,
          intentCode: event.intentCode || null
        }
      })
    } else if ((type === 'run.failed' || type === 'run.unknown') && assistantId) {
      commit('PATCH_MESSAGE', {
        id: assistantId,
        patch: {
          pending: false,
          status: type === 'run.unknown' ? 'UNKNOWN' : 'FAILED',
          content: event.message || '处理未完成，请稍后重试。',
          errorCode: event.code || null
        }
      })
    }
  },

  /** 发送即更新会话列表（标题/时间），保持列表顺序自然。 */
  touchSession ({ commit }, payload) {
    const patch = { lastMessageAt: new Date().toISOString() }
    commit('UPDATE_SESSION', { id: payload.id, patch: patch })
  },

  stopRun () {
    if (activeStream) {
      activeStream.abort()
    }
  },

  setDrawer ({ commit }, value) {
    commit('SET_DRAWER', value)
  }
}

function sortSessions (sessions) {
  return sessions.slice().sort((a, b) => {
    const left = new Date(a.lastMessageAt || a.createdAt || 0).getTime()
    const right = new Date(b.lastMessageAt || b.createdAt || 0).getTime()
    return right - left
  })
}

function stageLabel (stage) {
  const labels = {
    skill_loaded: '已加载业务能力',
    reference_loaded: '已加载参考材料',
    workflow_called: '正在调用业务流程'
  }
  return labels[stage] || '处理中'
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
