<template>
  <a-tooltip overlayClassName="code-tip-view">
    <template slot="title">
      <CodeView :code="code" :showDownload="showDownload"/>
    </template>
    <slot></slot>
  </a-tooltip>
</template>
<script>
import CodeView from './CodeView'
export default {
  name: 'code-tip-view',
  props: ['code','showDownload'],
  components: {
    CodeView
  }
}
</script>
<style lang="less">
.code-tip-view {
  max-width: 380px;
  .ant-tooltip-inner {
    padding: 0;
  }
}
</style>