<template>
  <div class="page">
    <!-- 面板页：模型 / 参数 / 自检 三个区块合并在同一页里，原地换视图。
         这么做的原因：原来是三个独立页面，子页之间互切要靠
         「finish() 出栈 + navTo() 压栈」两步，真机上会看到一帧退回对话页的闪动。
         合成一页后切区块是纯状态切换，瞬时完成、没有页面栈，也就没有闪动。
         （对话页仍是独立页面：它要保持在栈底，否则正在生成的回答会被销毁中断。） -->
    <ModelsSection v-if="view === 'models'" @nav="onNav"></ModelsSection>
    <SettingsSection v-else-if="view === 'settings'" @nav="onNav"></SettingsSection>
    <DiagSection v-else-if="view === 'diag'" @nav="onNav"></DiagSection>
  </div>
</template>

<script>
import ModelsSection from '../../components/models-section.vue';
import SettingsSection from '../../components/settings-section.vue';
import DiagSection from '../../components/diag-section.vue';
import { getPanelView, loadPanelView, setPanelView } from '../../services/ui.js';
import { logWarn } from '../../services/storage.js';

export default {
  name: 'PagePanel',
  components: { ModelsSection, SettingsSection, DiagSection },
  data() {
    return {
      // 同步取初值：进面板前对话页已经 setPanelView() 过，所以这里立刻就是对的
      view: getPanelView()
    };
  },
  created() {
    // 冷启动兜底（正常流程用不到，取值不同才会触发一次视图切换）
    this.syncStored();
  },
  methods: {
    async syncStored() {
      try {
        const v = await loadPanelView();
        if (v && v !== this.view) {
          this.view = v;
          logWarn('[panel] 从存储恢复区块: ' + v);
        }
      } catch (e) {
        /* 忽略 */
      }
    },
    // 区块组件把导航意图抛上来，在这里统一处理
    onNav(key) {
      if (key === 'index') {
        // 回对话 = 出栈（对话页在栈底，正常只有一个 finish）
        try {
          this.$page.finish();
        } catch (e) {
          logWarn('[panel] finish 失败: ' + ((e && e.message) || e));
        }
        return;
      }
      if (key === this.view) return;
      setPanelView(key);
      this.view = key; // 原地切视图：无 navTo、无出栈、无过渡
      logWarn('[panel] 切到区块: ' + key);
    }
  }
};
</script>

<style lang="less" scoped>
/* 无 <style> 块时样式完全不进 bundle（真机黑屏证据），故每个页面都必须带。
   区块组件各自带 form.less，本页只兜一个根尺寸。 */
@import "../../styles/var.less";

.page {
  width: 800px;
  height: 254px;
  flex-direction: row;
  background-color: @bg;
}
</style>
