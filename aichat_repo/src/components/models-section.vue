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
        <div class="nav-item nav-item-on">
          <div class="nav-dot nav-dot-on"></div>
          <text class="nav-label nav-label-on">模型</text>
        </div>
        <div class="nav-item" @click="goNav('settings')">
          <div class="nav-dot"></div>
          <text class="nav-label">参数</text>
        </div>
        <div class="nav-item" @click="goNav('diag')">
          <div class="nav-dot"></div>
          <text class="nav-label">自检</text>
        </div>
      </div>

      <div class="side-foot">
        <div class="foot-row">
          <div class="dot" :class="statusErr ? 'dot-err' : 'dot-ok'"></div>
          <text class="foot-text">{{ models.length }} 个模型</text>
        </div>
        <div class="side-status">
          <text v-for="(l, li) in sideLines" :key="'ms' + li" :class="l.err ? 'status-err' : 'status-line'">{{ l.text }}</text>
        </div>
      </div>
    </div>

    <!-- 右栏：顶栏（操作按钮） + 内容 -->
    <div class="main">
      <div class="topbar">
        <text class="topbar-title">{{ sideTitle }}</text>
        <div class="topbar-actions">
          <div v-for="b in topButtons" :key="b.id" class="tbtn" :class="b.cls" @click="onTopAction(b.id)">
            <text class="tbtn-text" :class="b.textCls">{{ b.label }}</text>
          </div>
        </div>
      </div>

      <!-- ===== 模型列表 ===== -->
      <scroller v-if="view === 'list'" class="form" show-scrollbar="false" over-scroll="40px" over-fling="40px">
        <text class="sec">已配置的模型（点「切换」即用于对话）</text>
        <div v-for="m in models" :key="m.id" class="mrow" :class="m.id === cfg.activeId ? 'mrow-on' : ''">
          <div class="mavatar" :class="m.id === cfg.activeId ? 'mavatar-on' : ''">
            <text class="mavatar-text" :class="m.id === cfg.activeId ? 'mavatar-text-on' : ''">{{ avatarOf(m) }}</text>
          </div>
          <div class="minfo">
            <text class="mname" :class="m.id === cfg.activeId ? 'mname-on' : ''">{{ m.label }}</text>
            <text class="msub" :class="m.id === cfg.activeId ? 'msub-on' : ''">{{ subOf(m) }}</text>
          </div>
          <div class="mini" :class="m.id === cfg.activeId ? 'mini-on' : ''" @click="activate(m)">
            <text class="mini-text mini-text-on">{{ m.id === cfg.activeId ? '当前' : '切换' }}</text>
          </div>
          <div class="mini" @click="edit(m)"><text class="mini-text">编辑</text></div>
          <div class="mdot" :class="m.id === cfg.activeId ? 'mdot-on' : ''"></div>
        </div>

        <text class="sec">说明</text>
        <text class="row-note">API Key 只存在本机小程序存储里，不会上传到别处；界面上始终打码显示。模型名与地址各家迭代很快，可点「拉取」直接从服务商拉真实可用的模型名。</text>
        <div class="anchor"></div>
      </scroller>

      <!-- ===== 编辑模型 ===== -->
      <scroller v-else-if="view === 'edit'" class="form" show-scrollbar="false" over-scroll="40px" over-fling="40px">
        <text class="sec">身份</text>
        <div class="row" @click="editText('label', '显示名称', 24)"><text class="row-key">显示名称</text><text class="row-val">{{ draft.label }}</text></div>
        <div class="row" @click="editText('baseUrl', 'Base URL，例如 https://api.deepseek.com', 160)">
          <text class="row-key">Base URL</text><text class="row-val">{{ draft.baseUrl || '（未填）' }}</text>
        </div>
        <div class="row" @click="editKey"><text class="row-key">API Key</text><text class="row-val">{{ keyDisplay }}</text></div>
        <!-- 扫描填入 API Key：扫一下屏幕/纸上的 Key，点这里直接填，免去在笔上逐字打字 -->
        <div class="row">
          <text class="row-key">从扫描填入</text>
          <text class="row-val" :class="scanKeyText ? 'row-val-on' : 'row-val-dim'" @click="fillKeyFromScan">{{ scanKeyText || '（还没有扫描记录）' }}</text>
          <div class="mini" @click="refreshScanFromStore"><text class="mini-text">刷新</text></div>
        </div>
        <div class="row" @click="editText('model', '模型名，例如 deepseek-flash', 80)">
          <text class="row-key">模型名</text><text class="row-val">{{ draft.model || '（未填）' }}</text>
        </div>

        <text class="sec">思考（reasoning）</text>
        <div class="row" @click="cycleThinkStyle">
          <text class="row-key">思考方式</text><text class="row-val">{{ thinkStyleLabel }} ▸</text>
        </div>
        <text class="row-note">{{ thinkStyleHint }}</text>
        <div v-if="draft.thinkStyle === 'model'" class="row" @click="editText('thinkModel', '思考档模型名', 80)">
          <text class="row-key">思考档模型</text><text class="row-val">{{ draft.thinkModel || '（未填）' }}</text>
        </div>
        <div v-if="draft.thinkStyle === 'model'" class="row" @click="editText('fastModel', '快答档模型名', 80)">
          <text class="row-key">快答档模型</text><text class="row-val">{{ draft.fastModel || '（未填）' }}</text>
        </div>
        <div v-if="draft.thinkStyle === 'reasoning_effort' || draft.thinkStyle === 'thinking_object'" class="row" @click="editText('effortOptions', '如 low,high,max（留空=不限制）', 60)">
          <text class="row-key">强度可选值</text><text class="row-val">{{ draft.effortOptions || '不限制' }}</text>
        </div>
        <div v-if="draft.thinkStyle === 'thinking_object'" class="row" @click="toggleField('effortWithThinking')">
          <text class="row-key">另发思考强度</text>
          <text class="row-val" :class="draft.effortWithThinking ? 'row-val-on' : 'row-val-dim'">{{ draft.effortWithThinking ? '是（thinking + reasoning_effort）' : '否（只发 thinking.type）' }}</text>
        </div>

        <text class="sec">高级</text>
        <div class="row" @click="toggleField('omitTemperature')">
          <text class="row-key">不发送 temperature</text>
          <text class="row-val" :class="draft.omitTemperature ? 'row-val-on' : 'row-val-dim'">{{ draft.omitTemperature ? '是' : '否' }}</text>
        </div>
        <div class="row" @click="toggleField('omitTopP')">
          <text class="row-key">不发送 top_p</text>
          <text class="row-val" :class="draft.omitTopP ? 'row-val-on' : 'row-val-dim'">{{ draft.omitTopP ? '是' : '否' }}</text>
        </div>
        <div class="row" @click="toggleField('tempIgnoredWhenThinking')">
          <text class="row-key">思考时温度无效</text>
          <text class="row-val" :class="draft.tempIgnoredWhenThinking ? 'row-val-on' : 'row-val-dim'">{{ draft.tempIgnoredWhenThinking ? '是' : '否' }}</text>
        </div>
        <div class="row" @click="cycleMaxTokensField">
          <text class="row-key">长度字段</text><text class="row-val">{{ draft.maxTokensField }} ▸</text>
        </div>
        <div class="row" @click="editText('maxTokensOverride', '0=用全局设置；Kimi 建议 16000', 8)">
          <text class="row-key">长度覆盖</text><text class="row-val">{{ draft.maxTokensOverride > 0 ? draft.maxTokensOverride : '用全局设置' }}</text>
        </div>
        <div class="row" @click="editText('extraHeaders', '每行一条，如 X-Foo: bar', 300)">
          <text class="row-key">额外请求头</text><text class="row-val">{{ draft.extraHeaders ? '已填 ' + draft.extraHeaders.length + ' 字' : '（无）' }}</text>
        </div>
        <div class="row" @click="editText('extraBody', '附加参数 JSON，例如把 top_k 设为 20', 300)">
          <text class="row-key">附加参数JSON</text><text class="row-val">{{ extraBodyDisplay }}</text>
        </div>
        <text v-if="draft.note" class="row-note">备注：{{ draft.note }}</text>
        <div class="anchor"></div>
      </scroller>

      <!-- ===== 添加预设 ===== -->
      <scroller v-else-if="view === 'add'" class="form" show-scrollbar="false" over-scroll="40px" over-fling="40px">
        <text class="sec">从预设添加（添加后可在编辑页随意改）</text>
        <div v-for="p in presetList" :key="p.model.key" class="prow">
          <div class="minfo">
            <text class="pname">{{ p.model.label }}</text>
            <text class="psub">{{ p.preset.vendor }} · {{ p.model.model }} · {{ shortThink(p.model) }}</text>
          </div>
          <div class="mini" :class="p.added ? 'mini-on' : ''" @click="addPreset(p)">
            <text class="mini-text mini-text-on">{{ p.added ? '已添加' : '添加' }}</text>
          </div>
        </div>
        <div class="anchor"></div>
      </scroller>

      <!-- ===== 选模型名 ===== -->
      <scroller v-else-if="view === 'pick'" class="form" show-scrollbar="false" over-scroll="40px" over-fling="40px">
        <text class="sec">点一个模型名即选中（共 {{ fetched.length }} 个）</text>
        <div v-for="(id, ii) in fetched" :key="'fm' + ii" class="prow" @click="pickModel(id)">
          <div class="minfo">
            <text class="pname">{{ id }}</text>
            <text class="psub">{{ id === draft.model ? '当前模型名' : '点此选用' }}</text>
          </div>
        </div>
        <div class="anchor"></div>
      </scroller>
    </div>
  </div>
</template>

<script>
import { input } from '../services/input.js';
import { loadConfig, saveConfig } from '../services/store.js';
import { normalizeModel, modelFromPreset, THINK_STYLES, MAXTOKENS_FIELDS } from '../services/config.js';
import { allPresetModels } from '../services/presets.js';
import { testModel, listModels, validateModel } from '../services/llm.js';
import { maskKey, clipText, uid } from '../services/util.js';
import { initTransport } from '../services/net.js';
import { initScan, loadStoredScan, refreshScan as refreshScanService, getLastScan } from '../services/scan.js';
import { logWarn } from '../services/storage.js';

function copyModel(m) {
  return normalizeModel(JSON.parse(JSON.stringify(m)));
}

export default {
  name: 'PageModels',
  data() {
    return {
      cfg: null,
      view: 'list',
      draft: null,
      fetched: [],
      netBusy: false,
      scanText: '',
      status: '就绪',
      statusErr: false,
      confirmDel: false
    };
  },
  computed: {
    models() {
      return (this.cfg && this.cfg.models) || [];
    },
    sideTitle() {
      if (this.view === 'edit') return '编辑模型';
      if (this.view === 'add') return '添加模型';
      if (this.view === 'pick') return '选模型名';
      return '模型管理';
    },
    // 顶栏操作按钮表（按视图切换；用 v-for 渲染，避免出现空的 <template> 片段）
    topButtons() {
      const v = this.view;
      if (v === 'list') {
        return [{ id: 'add', label: '+ 添加模型', cls: 'tbtn-str', textCls: 'tbtn-text-on' }];
      }
      if (v === 'edit') {
        return [
          { id: 'save', label: '保存', cls: 'tbtn-str', textCls: 'tbtn-text-on' },
          { id: 'test', label: '测试', cls: '', textCls: '' },
          { id: 'fetch', label: '拉取', cls: '', textCls: '' },
          { id: 'cancelEdit', label: '返回', cls: '', textCls: '' },
          { id: 'del', label: this.delLabel, cls: 'tbtn-danger', textCls: 'tbtn-text-on' }
        ];
      }
      if (v === 'add') return [{ id: 'back', label: '返回', cls: '', textCls: '' }];
      if (v === 'pick') return [{ id: 'backToEdit', label: '返回', cls: '', textCls: '' }];
      return [];
    },
    presetList() {
      const addedKeys = {};
      this.models.forEach((m) => {
        if (m.key) addedKeys[m.key] = true;
      });
      return allPresetModels().map((p) => ({
        preset: p.preset,
        model: p.model,
        added: !!addedKeys[p.model.key]
      }));
    },
    keyDisplay() {
      if (!this.draft) return '';
      return this.draft.apiKey ? maskKey(this.draft.apiKey) : '（未填）';
    },
    extraBodyDisplay() {
      if (!this.draft) return '';
      const t = (this.draft.extraBody || '').trim();
      if (!t) return '（无）';
      return clipText(t, 34);
    },
    thinkStyleLabel() {
      if (!this.draft) return '';
      for (let i = 0; i < THINK_STYLES.length; i++) {
        if (THINK_STYLES[i].id === this.draft.thinkStyle) return THINK_STYLES[i].label;
      }
      return this.draft.thinkStyle;
    },
    thinkStyleHint() {
      if (!this.draft) return '';
      for (let i = 0; i < THINK_STYLES.length; i++) {
        if (THINK_STYLES[i].id === this.draft.thinkStyle) return THINK_STYLES[i].hint;
      }
      return '';
    },
    delLabel() {
      return this.confirmDel ? '再点一次删除' : '删除此模型';
    },
    // 「从扫描填入」那一行显示的文字（截断，避免撑破行高）
    scanKeyText() {
      const s = (this.scanText || '').replace(/\s+/g, ' ').trim();
      if (!s) return '';
      return s.length > 26 ? s.slice(0, 26) + '…' : s;
    },
    sideLines() {
      // 编辑视图侧栏被 5 个按钮占满（20 + 5×35 = 195px），留给状态区只有 ~41px，
      // 所以这里最多 2 行；超过就会被裁掉，而报错恰恰是最需要看见的时候。
      const out = [];
      if (this.view === 'edit' && this.draft) {
        const v = validateModel(this.draft);
        out.push({
          text: v.ok ? '配置完整 · ' + (this.draft.vendor || '自定义端点') : '缺：' + v.problems.join('，'),
          err: !v.ok
        });
      } else if (this.view === 'list') {
        out.push({ text: '点行即可切换模型', err: false });
      } else if (this.view === 'add') {
        out.push({ text: '共 ' + this.presetList.length + ' 个预设档', err: false });
      } else if (this.view === 'pick') {
        out.push({ text: '已拉取 ' + this.fetched.length + ' 个模型名', err: false });
      }
      out.push({ text: this.status, err: this.statusErr });
      return out;
    }
  },
  created() {
    this.load();
  },
  methods: {
    // 顶栏按钮统一入口（按钮由 topButtons 表驱动）
    onTopAction(id) {
      if (id === 'add') return this.goAdd();
      if (id === 'back') return this.backToList();
      if (id === 'save') return this.save();
      if (id === 'test') return this.test();
      if (id === 'fetch') return this.fetchModels();
      if (id === 'cancelEdit') return this.backToList();
      if (id === 'del') return this.del();
      if (id === 'backToEdit') return this.backToEdit();
      return undefined;
    },
    goNav(key) {
      // 本页现在是 panel 里的一个区块组件：导航一律抛给 panel 决定。
      // key==='index' -> panel 出栈回对话；其余 -> panel 原地切视图（瞬时，无页面跳转）。
      this.$emit('nav', key);
    },
    // 卡片左侧的字母头像（取显示名首字符）
    avatarOf(m) {
      const s = String((m && (m.label || m.model)) || '?').trim();
      return s ? s.charAt(0).toUpperCase() : '?';
    },
    async load() {
      try {
        this.cfg = await loadConfig();
        await initTransport();
        // 顺带把上一次扫描读出来，供「从扫描填入 API Key」使用
        await loadStoredScan();
        this.syncScanText();
        await initScan();
        this.syncScanText();
      } catch (e) {
        // 渲染期异常在真机上表现为整页黑，这里至少把原因写进设备日志
        this.setStatus('加载失败：' + ((e && e.message) || e), true);
        logWarn('[models] load 失败: ' + ((e && e.stack) || (e && e.message) || e));
      }
    },
    syncScanText() {
      const s = getLastScan();
      this.scanText = s && s.text ? s.text : '';
    },
    // 把扫描到的文字填进 API Key（去掉空白：OCR 常带空格）
    fillKeyFromScan() {
      const raw = (this.scanText || '').trim();
      if (!raw) {
        this.setStatus('还没有扫描记录，先扫一下 Key', true);
        return;
      }
      const cleaned = raw.replace(/\s+/g, '');
      this.patch('apiKey', cleaned);
      this.setStatus('已从扫描填入 Key（' + maskKey(cleaned) + '），记得保存', false);
    },
    async refreshScanFromStore() {
      try {
        await refreshScanService();
        this.syncScanText();
        this.setStatus(this.scanText ? '已刷新扫描记录' : '刷新了，但还没有扫描记录', false);
      } catch (e) {
        this.setStatus('刷新扫描失败', true);
      }
    },
    subOf(m) {
      const parts = [];
      if (m.vendor) parts.push(m.vendor);
      parts.push(m.model || '未填模型名');
      return clipText(parts.join(' · '), 30);
    },
    shortThink(pm) {
      for (let i = 0; i < THINK_STYLES.length; i++) {
        if (THINK_STYLES[i].id === pm.thinkStyle) return THINK_STYLES[i].label;
      }
      return pm.thinkStyle;
    },
    goBack() {
      try {
        this.$emit('nav', 'index');
      } catch (e) {
        this.setStatus('返回失败', true);
      }
    },
    setStatus(text, isErr) {
      this.status = text;
      this.statusErr = !!isErr;
    },
    goAdd() {
      this.view = 'add';
      this.setStatus('选一个预设档添加', false);
    },
    backToList() {
      this.view = 'list';
      this.confirmDel = false;
      this.load();
    },
    backToEdit() {
      this.view = 'edit';
      this.setStatus('已取消选择', false);
    },

    // ---- 列表操作 ----
    async activate(m) {
      const next = Object.assign({}, this.cfg, { activeId: m.id });
      this.cfg = next;
      await saveConfig(next);
      this.setStatus('已切换到「' + m.label + '」', false);
    },
    edit(m) {
      this.draft = copyModel(m);
      this.view = 'edit';
      this.confirmDel = false;
      this.fetched = [];
      this.setStatus('修改后点左侧「保存」', false);
    },

    // ---- 编辑操作 ----
    patch(field, value) {
      const d = Object.assign({}, this.draft);
      d[field] = value;
      this.draft = d;
    },
    toggleField(field) {
      this.patch(field, !this.draft[field]);
    },
    cycleThinkStyle() {
      const ids = THINK_STYLES.map((s) => s.id);
      let i = ids.indexOf(this.draft.thinkStyle);
      i = (i + 1) % ids.length;
      this.patch('thinkStyle', ids[i]);
      this.setStatus('思考方式：' + THINK_STYLES[i].label, false);
    },
    cycleMaxTokensField() {
      const ids = MAXTOKENS_FIELDS.map((f) => f.id);
      let i = ids.indexOf(this.draft.maxTokensField);
      i = (i + 1) % ids.length;
      this.patch('maxTokensField', ids[i]);
    },
    async editText(field, placeholder, maxlength) {
      const cur = String(this.draft[field] == null ? '' : this.draft[field]);
      const r = await input.open({ value: cur, placeholder: placeholder, maxlength: maxlength || 200 });
      if (r && r.confirmed) {
        this.patch(field, typeof r.text === 'string' ? r.text.trim() : '');
        this.setStatus('已更新', false);
      } else if (r && r.error) {
        this.setStatus('输入法不可用：' + r.error, true);
      }
    },
    async editKey() {
      const r = await input.open({
        value: '',
        placeholder: '粘贴 API Key（留空 = 不修改）',
        maxlength: 300
      });
      if (r && r.confirmed) {
        const t = (r.text || '').trim();
        if (t) {
          this.patch('apiKey', t);
          this.setStatus('Key 已更新（' + maskKey(t) + '）', false);
        } else {
          this.setStatus('Key 未修改', false);
        }
      } else if (r && r.error) {
        this.setStatus('输入法不可用：' + r.error, true);
      }
    },
    async fetchModels() {
      if (this.netBusy) return; // 防连点：native 侧同一时刻只应有一个在途 POST
      const v = validateModel(this.draft);
      if (!v.ok) {
        this.setStatus('先补全：' + v.problems.join('，'), true);
        return;
      }
      this.netBusy = true;
      this.setStatus('正在拉取模型列表…', false);
      let r;
      try {
        r = await listModels(this.draft);
      } finally {
        this.netBusy = false;
      }
      if (!r.ok) {
        this.setStatus('拉取失败：' + clipText(r.error, 40), true);
        return;
      }
      if (r.ids.length === 0) {
        this.setStatus('该端点没返回模型列表', true);
        return;
      }
      this.fetched = r.ids;
      this.view = 'pick';
      this.setStatus('拉到 ' + r.ids.length + ' 个模型，点选一个', false);
    },
    pickModel(id) {
      this.patch('model', id);
      this.view = 'edit';
      this.setStatus('模型名已设为 ' + clipText(id, 24), false);
    },
    async test() {
      if (this.netBusy) return; // 防连点：native 侧同一时刻只应有一个在途 POST
      const v = validateModel(this.draft);
      if (!v.ok) {
        this.setStatus('先补全：' + v.problems.join('，'), true);
        return;
      }
      this.netBusy = true;
      this.setStatus('测试中（可能几秒到几十秒）…', false);
      let r;
      try {
        r = await testModel(this.draft, this.cfg.params);
      } finally {
        this.netBusy = false;
      }
      if (r.ok) {
        const hints = (r.hints && r.hints.length) ? ' · ' + r.hints[0] : '';
        this.setStatus(clipText(r.text || '（有思考但无正文）', 34) + ' · ' + r.ms + 'ms' + hints, false);
      } else {
        const e = r.error || {};
        const hints = (r.hints && r.hints.length) ? '（' + r.hints[0] + '）' : '';
        this.setStatus('失败 ' + (e.message || '') + (e.detail ? '：' + e.detail : '') + hints, true);
      }
    },
    async save() {
      const d = normalizeModel(this.draft);
      if (!d.label) d.label = d.model || '未命名模型';
      const list = this.models.slice();
      let found = false;
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === d.id) {
          list[i] = d;
          found = true;
          break;
        }
      }
      if (!found) list.push(d);
      const next = Object.assign({}, this.cfg, { models: list });
      if (!next.activeId) next.activeId = d.id;
      this.cfg = next;
      await saveConfig(next);
      this.view = 'list';
      this.setStatus('已保存「' + d.label + '」', false);
    },
    async del() {
      if (!this.confirmDel) {
        this.confirmDel = true;
        this.setStatus('再点一次「删除此模型」即删除', false);
        const self = this;
        setTimeout(function () {
          self.confirmDel = false;
        }, 4000);
        return;
      }
      this.confirmDel = false;
      const id = this.draft.id;
      const list = this.models.filter((m) => m.id !== id);
      if (list.length === 0) {
        this.setStatus('至少保留一个模型', true);
        return;
      }
      const next = Object.assign({}, this.cfg, { models: list });
      if (next.activeId === id) next.activeId = list[0].id;
      this.cfg = next;
      await saveConfig(next);
      this.view = 'list';
      this.setStatus('已删除', false);
    },
    async addPreset(p) {
      if (p.added) {
        this.setStatus('该预设已在列表里', false);
        return;
      }
      const m = modelFromPreset(p.model.key);
      if (!m) {
        this.setStatus('预设读取失败', true);
        return;
      }
      m.id = uid('m');
      const list = this.models.concat([m]);
      const next = Object.assign({}, this.cfg, { models: list });
      this.cfg = next;
      await saveConfig(next);
      this.setStatus('已添加「' + m.label + '」，去填 API Key', false);
      this.draft = copyModel(m);
      this.view = 'edit';
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
