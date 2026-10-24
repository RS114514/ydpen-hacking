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
        <div class="nav-item" @click="goNav('settings')">
          <div class="nav-dot"></div>
          <text class="nav-label">参数</text>
        </div>
        <div class="nav-item nav-item-on">
          <div class="nav-dot nav-dot-on"></div>
          <text class="nav-label nav-label-on">自检</text>
        </div>
      </div>

      <div class="side-foot">
        <div class="foot-row">
          <div class="dot" :class="running ? 'dot-run' : 'dot-ok'"></div>
          <text class="foot-text">{{ running ? '自检进行中…' : '自检就绪' }}</text>
        </div>
        <div class="side-status">
          <text v-for="(l, li) in sideLines" :key="'ds' + li" :class="l.err ? 'status-err' : 'status-line'">{{ l.text }}</text>
        </div>
      </div>
    </div>

    <!-- 右栏：顶栏 + 状态卡片 -->
    <div class="main">
      <div class="topbar">
        <text class="topbar-title">系统自检</text>
        <text class="topbar-sub">检查链路与服务是否正常</text>
        <div class="topbar-actions">
          <div class="tbtn" :class="running ? 'tbtn-danger' : 'tbtn-str'" @click="onPrimaryTap">
            <text class="tbtn-text tbtn-text-on">{{ running ? '停止' : '开始自检' }}</text>
          </div>
        </div>
      </div>

      <scroller class="form" show-scrollbar="false" over-scroll="40px" over-fling="40px">
        <text class="sec">链路自检（每步都会写设备日志）</text>
        <div v-for="s in steps" :key="s.id" class="dcard">
          <div class="sdot" :class="dotOf(s.state)"></div>
          <div class="minfo">
            <text class="dcard-text">{{ s.label }}</text>
            <text class="dcard-sub">{{ s.detail || '等待检测…' }}</text>
          </div>
          <text class="dcard-state" :class="stateCls(s.state)">{{ stateText(s.state) }}</text>
        </div>

        <text class="sec">本次结果</text>
        <text class="row-note">{{ summary }}</text>
        <text class="row-note">实际发送的思考相关字段：{{ sentText }}</text>
        <text v-if="hint" class="row-note">{{ hint }}</text>

        <text class="sec">环境</text>
        <text class="row-note">{{ envText }}</text>
        <text class="row-note">通道说明：native httpjson 是唯一能发 JSON POST 并读到错误响应的通道（后台线程发请求，不卡界面）。它每次 HTTPS 请求会先试一次校验证书、失败后自动重试不校验，因此结果里出现「未校验证书」是正常的（笔端没有 CA 证书库）。</text>
        <div class="anchor"></div>
      </scroller>
    </div>
  </div>
</template>

<script>
import { loadConfig } from '../services/store.js';
import { activeModel } from '../services/config.js';
import { testModel, validateModel } from '../services/llm.js';
import { initTransport, transportInfo, cancelAll, netAvailable } from '../services/net.js';
import { storageAvailable, logWarn } from '../services/storage.js';
import { clipText } from '../services/util.js';

const STEPS = [
  { id: 'storage', label: '存储' },
  { id: 'native', label: 'native 模块' },
  { id: 'config', label: '模型配置' },
  { id: 'request', label: '真实 API 调用' }
];

export default {
  name: 'PageDiag',
  data() {
    return {
      steps: STEPS.map((s) => ({ id: s.id, label: s.label, state: 'pending', detail: '' })),
      running: false,
      summary: '准备就绪，点左侧「开始自检」',
      hint: '',
      sentText: '（尚未调用）',
      envText: '',
      transportLabel: '探测中…',
      statusErr: false
    };
  },
  computed: {
    sideLines() {
      const out = [];
      out.push({ text: '通道：' + this.transportLabel, err: false });
      out.push({ text: this.running ? '进行中…' : '空闲', err: this.statusErr });
      return out;
    }
  },
  created() {
    this.gen = 0;
    this.load();
  },
  methods: {
    async load() {
      this.envText = '逻辑画布 800x254 · 存储 ' + (storageAvailable() ? '可用' : '不可用（内存态）');
      await initTransport();
      const info = transportInfo();
      this.transportLabel = info.label;
      this.applyStepLater('native', info.name === 'native' ? 'ok' : info.name === 'none' ? 'fail' : 'skip', info.detail);
      this.applyStepLater('storage', storageAvailable() ? 'ok' : 'skip', storageAvailable() ? 'jsapi.storage 可用' : '无 jsapi.storage');
    },
    applyStepLater(id, state, detail) {
      const arr = this.steps.slice();
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].id === id) {
          arr[i] = { id: arr[i].id, label: arr[i].label, state: state, detail: detail };
          break;
        }
      }
      this.steps = arr;
    },
    applyStep(id, state, detail) {
      this.applyStepLater(id, state, detail);
      logWarn('[diag] step ' + id + ' ' + state + (detail ? ' | ' + detail : ''));
    },
    // 状态点（新版卡片用圆点代替字符图形，不依赖字体）
    dotOf(state) {
      if (state === 'ok') return 'sdot-ok';
      if (state === 'fail') return 'sdot-err';
      if (state === 'running') return 'sdot-run';
      return 'sdot';
    },
    stateText(state) {
      if (state === 'ok') return '正常';
      if (state === 'fail') return '失败';
      if (state === 'running') return '检测中';
      if (state === 'skip') return '跳过';
      return '待检';
    },
    stateCls(state) {
      if (state === 'ok') return 'dcard-state-ok';
      if (state === 'fail') return 'dcard-state-err';
      return 'dcard-state';
    },
    goNav(key) {
      // 本页现在是 panel 里的一个区块组件：导航一律抛给 panel 决定。
      // key==='index' -> panel 出栈回对话；其余 -> panel 原地切视图（瞬时，无页面跳转）。
      this.$emit('nav', key);
    },
    goBack() {
      try {
        this.$emit('nav', 'index');
      } catch (e) {
        this.summary = '返回失败：' + ((e && e.message) || e);
      }
    },

    onPrimaryTap() {
      if (this.running) {
        this.gen++;
        this.running = false;
        cancelAll();
        this.summary = '已手动停止';
        return;
      }
      this.run();
    },

    async run() {
      const myGen = ++this.gen;
      this.running = true;
      this.hint = '';
      this.statusErr = false;
      this.steps = STEPS.map((s) => ({ id: s.id, label: s.label, state: 'pending', detail: '' }));
      this.summary = '自检中…';

      // 1 存储
      this.applyStep('storage', 'running', '');
      const okStorage = storageAvailable();
      this.applyStep('storage', okStorage ? 'ok' : 'skip', okStorage ? 'jsapi.storage 可用' : '无 jsapi.storage（退化为内存态）');

      // 2 native 模块
      this.applyStep('native', 'running', '');
      await initTransport();
      if (myGen !== this.gen) return;
      const info = transportInfo();
      this.transportLabel = info.label;
      if (!netAvailable()) {
        this.applyStep('native', 'fail', info.detail);
        this.finishFail('没有任何网络通道');
        return;
      }
      const nat = info.name === 'native';
      this.applyStep('native', nat ? 'ok' : 'fail', nat ? 'startPost/takeResult 可用' : info.detail + '（POST JSON 会失败）');

      // 3 配置
      this.applyStep('config', 'running', '');
      const cfg = await loadConfig();
      if (myGen !== this.gen) return;
      const model = activeModel(cfg);
      const v = validateModel(model);
      if (!model) {
        this.applyStep('config', 'fail', '没有模型');
        this.finishFail('请先到模型页添加模型');
        return;
      }
      if (!v.ok) {
        this.applyStep('config', 'fail', v.problems.join('，'));
        this.finishFail('模型配置不完整');
        return;
      }
      this.applyStep('config', 'ok', model.label + ' · ' + model.baseUrl + ' · ' + model.model);

      // 4 真实调用
      this.applyStep('request', 'running', '等待服务端响应…');
      this.summary = '正在真实调用（思考档可能要几十秒）…';
      let r;
      try {
        r = await testModel(model, cfg.params);
      } catch (e) {
        r = { ok: false, error: { message: '内部错误', detail: (e && e.message) || String(e) }, ms: 0 };
      }
      if (myGen !== this.gen) return;

      if (!r.ok) {
        const e = r.error || {};
        this.applyStep('request', 'fail', (e.message || '失败') + (e.detail ? '：' + e.detail : ''));
        this.finishFail('API 调用失败，按上面那行提示排查');
        return;
      }
      const flags = [];
      if (r.transport) flags.push(r.transport);
      if (r.insecure) flags.push('未校验证书');
      this.applyStep(
        'request',
        'ok',
        r.ms + 'ms · ' + flags.join(' · ') + ' · 思考 ' + (r.reasoning ? r.reasoning.length + '字' : '无')
      );
      this.running = false;
      this.summary = '通过：' + r.ms + 'ms，回复「' + clipText(r.text || '（无正文）', 40) + '」';
      // 把「这次实际发了哪些思考相关字段」和厂商已知限制显示出来
      this.sentText = r.notes && r.notes.length ? r.notes.join('；') : '（无）';
      if (r.hints && r.hints.length) {
        this.hint = r.hints.join('；');
      } else if (!r.reasoning) {
        this.hint =
          '本次没有思考内容。若模型是思考档，常见原因：① 思考开关是「关」；② 该服务商只在流式返回思考正文' +
          '（本应用不支持流式，OpenAI 的 /chat/completions 就属于这种）；③ 该模型不返回思考。';
      }
      logWarn('[diag] PASS ms=' + r.ms + ' reasonLen=' + (r.reasoning ? r.reasoning.length : 0));
    },

    finishFail(reason) {
      this.running = false;
      this.statusErr = true;
      this.summary = '失败于：' + reason;
      logWarn('[diag] FAIL ' + reason);
    },

    destroyed() {
      this.gen++;
      this.running = false;
      cancelAll();
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
