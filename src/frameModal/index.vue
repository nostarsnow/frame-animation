<template>
  <div class="view-modal" ref="view">
    <img v-for="v in files" :src="v.data" :alt="v.name" :key="v.name" />
  </div>
</template>

<script>
import "viewerjs/dist/viewer.css";
import Viewer from "viewerjs";
export default {
  props: ["files"],
  data() {
    return {};
  },
  mounted() {
    this.viewer = new Viewer(this.$refs.view, {
      transition: false,
    });
    this.viewer.body = document.body;
    this.viewer.show();
    this.$refs.view.addEventListener("hidden", this.close);
  },
  methods: {
    close() {
      this.$refs.view.removeEventListener("hidden", this.close);
      this.$emit("close");
    },
  },
  destroyed() {
    this.viewer.destroy();
  },
};
</script>
<style lang="less">
.view-modal {
  display: none;
}
</style>
