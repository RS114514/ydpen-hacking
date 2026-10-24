<template>
  <div class="mask" v-if="open" @click="cancel">
    <div class="sheet" @click="noop">
      <text class="sheettitle">{{ title }}</text>
      <scroller class="sheetlist" show-scrollbar="false">
        <div v-for="(act, i) in actions" :key="i" class="srow press" @click="pick(i)">
          <text class="srowtext" :class="act.danger ? 'srowdanger' : 'srownormal'">{{ act.label }}</text>
        </div>
        <div class="srow press" @click="cancel">
          <text class="srowtext srowcancel">取消</text>
        </div>
      </scroller>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    open: { default: false },
    title: { default: '' },
    actions: { default: () => [] } // [{label, danger, key}]
  },
  methods: {
    pick(i) {
      this.$emit('action', this.actions[i] ? this.actions[i].key : null)
    },
    cancel() {
      this.$emit('action', null)
    },
    noop() { /* 阻断冒泡到 mask */ }
  }
}
</script>
<style lang="less" scoped>
@import "../styles/common.less";
.mask {
  position: fixed;
  left: 0vw;
  top: 0vh;
  width: 100vw;
  height: 100vh;
  background-color: rgba(5, 8, 12, 0.72);
  z-index: 90;
}
.sheet {
  position: absolute;
  left: 61.25vw;
  top: 5.51vh;
  width: 36.25vw;
  height: 88.98vh;
  background-color: #19242f;
  border-radius: 1.5vw;
  border-width: 1px;
  border-color: #263340;
  padding: 1.5vw;
}
.sheettitle {
  color: #8ca0ad;
  font-size: 4.72vh;
  line-height: 7.09vh;
  margin-bottom: 1.57vh;
}
.sheetlist {
  width: 33.25vw;
  height: 70.87vh;
}
.srow {
  height: 14.96vh;
  border-radius: 1vw;
  justify-content: center;
  margin-top: 1.57vh;
  background-color: #121922;
}
.srowtext {
  font-size: 5.91vh;
  line-height: 7.87vh;
  text-align: center;
}
.srownormal { color: #e8eef2; }
.srowdanger { color: #ff6b72; }
.srowcancel { color: #8ca0ad; }
</style>
