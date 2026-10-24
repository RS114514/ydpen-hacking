<template>
  <div class="toastbox" v-if="visible">
    <text class="toasttext">{{ message }}</text>
  </div>
</template>
<script>
export default {
  data() {
    return { visible: false, message: '' }
  },
  methods: {
    show(text, ms) {
      this.message = String(text || '')
      this.visible = true
      if (this._tid) clearTimeout(this._tid)
      this._tid = setTimeout(() => { this.visible = false }, ms || 2200)
    }
  },
  mounted() {
    this._handler = info => {
      const d = info && info.data ? info.data : info
      if (d && d.text) this.show(d.text, d.ms)
    }
    try { $falcon.on('bpv-toast', this._handler) } catch (e) { /* 忽略 */ }
  },
  onUnload() {
    if (this._tid) clearTimeout(this._tid)
    try { $falcon.off('bpv-toast', this._handler) } catch (e) { /* 忽略 */ }
  }
}
</script>
<style lang="less" scoped>
@import "../styles/common.less";
.toastbox {
  position: fixed;
  left: 21.25vw;
  top: 37.8vh;
  width: 57.5vw;
  padding: 1.25vw 2vw;
  background-color: #1f2c38;
  border-radius: 1vw;
  z-index: 99;
}
.toasttext {
  color: #e8eef2;
  font-size: 5.51vh;
  line-height: 7.87vh;
  text-align: center;
}
</style>
