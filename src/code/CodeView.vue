<template>
  <div class="code-view">
    <pre v-highlightjs="formatCode"><code class="html"></code></pre>
    <div class="icons">
      <el-tooltip :content="copyed ? '复制成功！' : '复制代码'">
        <i
          type="copy"
          class="copy el-icon-document-copy"
          v-clipboard:copy="formatCode"
          v-clipboard:success="onCopy"
        ></i>
      </el-tooltip>

      <el-tooltip content="下载代码" v-if="showDownload">
        <i
          type="download"
          class="download el-icon-download"
          @click="download"
        ></i>
      </el-tooltip>
    </div>
  </div>
</template>
<script>
export default {
  name: "code-view",
  props: {
    code: {},
    showDownload: {
      default() {
        return true;
      },
    },
  },
  data() {
    return {
      copyed: false,
    };
  },
  methods: {
    onCopy() {
      this.copyed = true;
      setTimeout(() => {
        this.copyed = false;
      }, 3000);
    },
    download() {
      this.$download(this.formatCode, "index.html", true);
    },
  },
  computed: {
    formatCode() {
      return this.code;
      return this.code.constructor === Object
        ? JSON.stringify(this.code)
        : this.code;
    },
  },
};
</script>
<style lang="less" scoped>
.code-view {
  color: #fff;
  border-radius: 5px;
  padding: 48px 18px 12px 18px;
  color: #cfd2d1;
  box-shadow: rgba(0, 0, 0, 0.55) 0px 20px 30px;
  border-radius: 5px;
  background: url(./code-view.svg) #151718 no-repeat 18px 15px;
  position: relative;
  .html{
    background:none;
    font-size: 14px;
  }
  pre {
    margin: 0;
    padding-bottom: 12px;
  }
  .icons {
    position: absolute;
    right: 18px;
    top: 14px;
    font-size: 18px;
    i {
      cursor: pointer;
      margin: 0 5px;
      &:hover {
        color: #fff;
      }
    }
  }
}
</style>
