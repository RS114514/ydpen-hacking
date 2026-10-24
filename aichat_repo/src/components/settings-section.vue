<template>
  <div class="page">
    <!-- 左栏：品牌 + 主导航 + 底部状态 -->
    <div class="side">
      <div class="brand">
        <div class="brand-logo"><text class="brand-logo-text">AI</text></div>
        <text class="brand-name">AI Chat</text>
      </div>

      <div class="nav">
        <div class="nav-item" @click="goNav('index')">
          <div class="nav-dot"></div>
          <text class="nav-label">对话</text>
        </div>
        <div class="nav-item" @click="goNav('models')">
          <div class="nav-dot"></div>
          <text class="nav-label">模型</text>
        </div>
        <div class="nav-item nav-item-on">
          <div class="nav-dot nav-dot-on"></div>
          <text class="nav-label nav-label-on">参数</text>
        </div>
        <div class="nav-item" @click="goNav('diag')">
          <div class="nav-dot"></div>
          <text class="nav-label">自检</text>
        </div>
      </div>

      <div class="side-foot">
        <div class="foot-row">
          <div class="dot" :class="dirty ? 'dot-err' : 'dot-ok'"></div>
          <text class="foot-text">{{ dirty ? '有未保存改动' : '已保存' }}</text>
        </div>
        <div class="side-status">
          <text v-for="(l, li) in sideLines" :key="'ss' + li" :class="l.err ? 'status-err' : 'status-line'">{{ l.text }}</text>
        </div>
      </div>
    </div>

    <!-- 右栏：顶栏 + 参数卡片 -->
    <div class="main">
      <div class="topbar">
        <text class="topbar-title">参数</text>
        <text class="topbar-sub">{{ modelLabel }}</text>
        <div class="topbar-actions">
          <div class="tbtn" @click="resetAll">
            <text class="tbtn-text">{{ confirmReset ? '再点一次' : '恢复默认' }}</text>
          </div>
          <div class="tbtn" :class="dirty ? 'tbtn-str' : ''" @click="save">
            <text class="tbtn-text" :class="dirty ? 'tbtn-text-on' : 'tbtn-text-dim'">{{ dirty ? '保存' : '已保存' }}</text>
          </div>
        </div>
      </div>

      <scroller class="form" show-scrollbar="false" over-scroll="40px" over-fling="40px">
        <text class="sec">思考（reasoning） · {{ styleExplain }}</text>
        <div class="row" @click="toggleThink">
          <text class="row-key">思考开关</text>
          <text class="row-val" :class="p.think === 'on' ? 'row-val-on' : 'row-val-dim'">{{ p.think === 'on' ? '开（先思考再回答）' : '关（直接回答，更快）' }}</text>
        </div>
        <div v-if="showEffort" class="row">
          <text class="row-key">思考强度</text>
          <div class="seg">
            <div v-for="e in effortChoices" :key="e.id" class="seg-item" :class="p.thinkEffort === e.id ? 'seg-on' : ''" @click="setEffort(e.id)">
              <text class="seg-text" :class="p.thinkEffort === e.id ? 'seg-text-on' : ''">{{ e.label }}</text>
            </div>
          </div>
        </div>
        <div v-if="showBudget" class="row">
          <text class="row-key">思考预算</text>
          <div class="step" @click="bumpBudget(-256)"><text class="step-text">-</text></div>
          <text class="step-val">{{ p.thinkBudget }}</text>
          <div class="step" @click="bumpBudget(256)"><text class="step-text">+</text></div>
          <text class="row-warn">{{ p.thinkBudget === 0 ? ' 不限' : '' }}</text>
        </div>
        <text v-if="!showBudget && !showEffort" class="row-note">该档位没有可调的思考参数（模型行为固定）。要更细的控制可在模型编辑页用「附加参数JSON」直接塞字段。</text>

        <text class="sec">采样与长度</text>
        <div class="row">
          <text class="row-key">温度</text>
          <div class="step" @click="bumpTemp(-0.1)"><text class="step-text">-</text></div>
          <text class="step-val">{{ tempText }}</text>
          <div class="step" @click="bumpTemp(0.1)"><text class="step-text">+</text></div>
          <text v-if="tempIgnored" class="row-warn"> 思考时无效</text>
        </div>
        <text class="row-note">低温度更稳定准确（查词、翻译），高温度更发散（写作、头脑风暴）。</text>

        <div class="row">
          <text class="row-key">最大输出</text>
          <div class="step" @click="bumpMax(-128)"><text class="step-text">-</text></div>
          <text class="step-val">{{ effectiveMax }}</text>
          <div class="step" @click="bumpMax(128)"><text class="step-text">+</text></div>
        </div>
        <text class="row-note">{{ maxNote }}</text>

        <div class="row" @click="toggleTopP">
          <text class="row-key">发送 top_p</text>
          <text class="row-val" :class="p.useTopP ? 'row-val-on' : 'row-val-dim'">{{ p.useTopP ? '是' : '否（多数情况不必开）' }}</text>
        </div>
        <div v-if="p.useTopP" class="row">
          <text class="row-key">top_p</text>
          <div class="step" @click="bumpTopP(-0.05)"><text class="step-text">-</text></div>
          <text class="step-val">{{ p.topP.toFixed(2) }}</text>
          <div class="step" @click="bumpTopP(0.05)"><text class="step-text">+</text></div>
        </div>

        <text class="sec">对话与网络</text>
        <div class="row">
          <text class="row-key">携带上下文</text>
          <div class="step" @click="bumpRounds(-1)"><text class="step-text">-</text></div>
          <text class="step-val">{{ p.historyRounds }} 轮</text>
          <div class="step" @click="bumpRounds(1)"><text class="step-text">+</text></div>
        </div>
        <text class="row-note">0 = 每次只发当前这一句（最省流量、最快）；笔端内存与网速有限，建议 3~6 轮。</text>

        <div class="row">
          <text class="row-key">等待超时</text>
          <div class="step" @click="bumpTimeout(-5)"><text class="step-text">-</text></div>
          <text class="step-val">{{ p.timeoutSec }} 秒</text>
          <div class="step" @click="bumpTimeout(5)"><text class="step-text">+</text></div>
        </div>
        <text class="row-note">思考档模型可能要等 30 秒以上；超时后本次请求按失败处理。</text>

        <text class="sec">系统提示词（决定回答风格）</text>
        <div class="readonly" @click="editSystem">
          <text class="readonly-title">点此修改（{{ p.systemPrompt.length }} 字）</text>
          <text class="readonly-text">{{ p.systemPrompt }}</text>
        </div>
        <div class="anchor"></div>
      </scroller>
    </div>
  </div>
</template>

<script>
import { input } from '../services/input.js';
import { loadConfig, saveConfig, resetParams } from '../services/store.js';
import {
  normalizeParams, activeModel, parseEffortOptions, effortLabel,
  EFFORT_OPTIONS, LIMITS
} from '../services/config.js';

const STYLE_EXPLAIN = {
  none: '当前模型不发送任何思考参数（模型行为固定）',
  model: '当前模型靠「切换模型名」来开/关思考',
  reasoning_effort: '当前模型用 reasoning_effort 调思考强度',
  enable_thinking: '当前模型用 enable_thinking（+思考预算）开/关思考',
  thinking_object: '当前模型用 thinking:{type,…} 开/关思考'
};

export default {
  name: 'PageSettings',
  data() {
    return {
      cfg: null,
      p: normalizeParams(null),
      dirty: false,
      status: '改完记得点右上角「保存」',
      statusErr: false,
      confirmReset: false
    };
  },
  computed: {
    model() {
      return activeModel(this.cfg);
    },
    modelLabel() {
      return this.model ? this.model.label : '（未配置）';
    },
    styleExplain() {
      const s = this.model ? this.model.thinkStyle : 'none';
      return STYLE_EXPLAIN[s] || '';
    },
    showEffort() {
      if (!this.model) return false;
      const s = this.model.thinkStyle;
      // reasoning_effort 方言本体；或 thinking 对象 + 额外用 reasoning_effort 调强度（DeepSeek）
      return s === 'reasoning_effort' || (s === 'thinking_object' && this.model.effortWithThinking === true);
    },
    // 强度枚举按模型声明收窄（如 GLM-5.3 只认 low/high/max）
    effortChoices() {
      const allowed = this.model ? parseEffortOptions(this.model.effortOptions) : [];
      if (allowed.length === 0) return EFFORT_OPTIONS;
      return EFFORT_OPTIONS.filter((e) => allowed.indexOf(e.id) >= 0);
    },
    // 思考预算只有「服务商文档里真有这个字段」时才显示
    // （enable_thinking → thinking_budget；thinking 对象只文档了 type，多塞会被严格校验拒）
    showBudget() {
      return !!this.model && this.model.thinkStyle === 'enable_thinking';
    },
    tempText() {
      return this.p.temperature.toFixed(1);
    },
    tempIgnored() {
      return !!(this.model && this.model.tempIgnoredWhenThinking && this.p.think === 'on');
    },
    effectiveMax() {
      if (this.model && this.model.maxTokensOverride > 0) return this.model.maxTokensOverride;
      return this.p.maxTokens;
    },
    maxNote() {
      if (this.model && this.model.maxTokensOverride > 0) {
        return '该模型在编辑页固定了 ' + this.model.maxTokensOverride + '（思考内容也占额度），全局值不生效。';
      }
      return '笔端屏幕小，回答太长既难读也费 token，建议 512~2048。';
    },
    sideLines() {
      const out = [];
      out.push({ text: '思考 ' + (this.p.think === 'on' ? '开' : '关') + ' · 温度 ' + this.tempText, err: false });
      out.push({ text: '上限 ' + this.effectiveMax + ' · 上下文 ' + this.p.historyRounds + ' 轮', err: false });
      out.push({ text: this.status, err: this.statusErr });
      return out;
    }
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.cfg = await loadConfig();
      this.p = normalizeParams(this.cfg.params);
    },
    goBack() {
      try {
        this.$emit('nav', 'index');
      } catch (e) {
        this.setStatus('返回失败', true);
      }
    },
    goNav(key) {
      // 本页现在是 panel 里的一个区块组件：导航一律抛给 panel 决定。
      // key==='index' -> panel 出栈回对话；其余 -> panel 原地切视图（瞬时，无页面跳转）。
      this.$emit('nav', key);
    },
    setStatus(text, isErr) {
      this.status = text;
      this.statusErr = !!isErr;
    },
    patch(patch) {
      this.p = Object.assign({}, this.p, patch);
      this.dirty = true;
    },
    clamp(v, key) {
      const L = LIMITS[key];
      const n = Number(v);
      if (!isFinite(n)) return L.min;
      // 浮点步进会累积误差，统一收敛到 1e-6
      const r = Math.round(n * 1e6) / 1e6;
      return Math.min(Math.max(r, L.min), L.max);
    },

    // ---- 思考 ----
    toggleThink() {
      const on = this.p.think !== 'on';
      this.patch({ think: on ? 'on' : 'off' });
      this.setStatus(on ? '思考已打开（回答前会先思考，更慢）' : '思考已关闭（更快）', false);
    },
    setEffort(id) {
      this.patch({ thinkEffort: id });
      this.setStatus('思考强度：' + effortLabel(id), false);
    },
    bumpBudget(d) {
      this.patch({ thinkBudget: Math.round(this.clamp(this.p.thinkBudget + d, 'thinkBudget')) });
    },

    // ---- 采样 ----
    bumpTemp(d) {
      this.patch({ temperature: this.clamp(this.p.temperature + d, 'temperature') });
    },
    bumpTopP(d) {
      this.patch({ topP: this.clamp(this.p.topP + d, 'topP') });
    },
    toggleTopP() {
      this.patch({ useTopP: !this.p.useTopP });
    },
    bumpMax(d) {
      // 步长自适应：小值细调，大值快进（64→32768 若一直 64 步要点 500 次）
      const cur = this.p.maxTokens;
      const step = cur >= 8192 ? 2048 : cur >= 2048 ? 512 : d > 0 ? 128 : 64;
      this.patch({ maxTokens: Math.round(this.clamp(cur + (d > 0 ? step : -step), 'maxTokens')) });
    },
    bumpRounds(d) {
      this.patch({ historyRounds: Math.round(this.clamp(this.p.historyRounds + d, 'historyRounds')) });
    },
    bumpTimeout(d) {
      this.patch({ timeoutSec: Math.round(this.clamp(this.p.timeoutSec + d, 'timeoutSec')) });
    },

    // ---- 系统提示词 ----
    async editSystem() {
      const r = await input.open({
        value: this.p.systemPrompt,
        placeholder: '例如：你是有道词典笔助手，回答要短',
        maxlength: 1000
      });
      if (r && r.confirmed && typeof r.text === 'string') {
        this.patch({ systemPrompt: r.text });
        this.setStatus('系统提示词已改，记得保存', false);
      } else if (r && r.error) {
        this.setStatus('输入法不可用：' + r.error, true);
      }
    },

    // ---- 保存 / 重置 ----
    async save() {
      const next = Object.assign({}, this.cfg, { params: normalizeParams(this.p) });
      this.cfg = next;
      await saveConfig(next);
      this.dirty = false;
      this.setStatus('已保存', false);
    },
    async resetAll() {
      if (!this.confirmReset) {
        this.confirmReset = true;
        this.setStatus('再点一次即恢复默认参数（模型与 API Key 不动）', false);
        const self = this;
        setTimeout(function () {
          self.confirmReset = false;
        }, 4000);
        return;
      }
      this.confirmReset = false;
      // 只重置生成参数：模型列表与 API Key 必须保留。
      // （早先这里调的是 resetConfig()，会把每个模型的 apiKey 清空 →
      //   用户点一下「恢复默认」之后所有请求都变成 401，属于破坏性 bug。）
      const cfg = resetParams(this.cfg);
      this.cfg = cfg;
      this.p = normalizeParams(cfg.params);
      this.dirty = false;
      this.setStatus('已恢复默认参数（模型与 Key 未改动）', false);
    }
  }
};
</script>

<style lang="less" scoped>
/* 无 <style> 块时样式完全不进 bundle（真机黑屏证据），故每个页面都必须带。 */
@import "../styles/form.less";

.anchor {
  width: 628px;
  height: 2px;
}
</style>
