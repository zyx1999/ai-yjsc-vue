<template>
  <div class="run-progress">
    <div v-for="(step, index) in steps" :key="index" class="run-step">
      <span class="run-dot"></span>
      <span class="run-title">{{ step.title }}</span>
      <span v-if="step.message" class="run-message">{{ step.message }}</span>
    </div>
    <div v-if="pending" class="run-step run-step-pending">
      <span class="run-dot run-dot-active"></span>
      <span class="run-title">正在处理，请稍候…</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RunProgress',
  props: {
    steps: {
      type: Array,
      default: () => []
    },
    pending: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped lang="scss">
.run-progress {
  margin-bottom: 16px;

  .run-step {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: 8px;
    font-size: 24px;
    color: #7a7a7a;
    line-height: 36px;

    .run-dot {
      flex: none;
      width: 12px;
      height: 12px;
      margin-right: 12px;
      border-radius: 50%;
      background: #00c3ac;
      position: relative;
      top: -2px;
    }

    .run-dot-active {
      animation: run-blink 1s ease-in-out infinite;
    }

    .run-title {
      color: #5a5a5a;
    }

    .run-message {
      margin-left: 8px;
      color: #9a9a9a;
    }
  }
}

@keyframes run-blink {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}
</style>
