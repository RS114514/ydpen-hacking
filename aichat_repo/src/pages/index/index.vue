<template>
  <div class="page">
    <!-- 左栏：品牌 + 主导航 + 底部状态 -->
    <div class="side">
      <div class="brand">
        <div class="brand-logo"><text class="brand-logo-text">AI</text></div>
        <text class="brand-name">AI Chat</text>
      </div>

      <div class="nav">
        <div class="nav-item nav-item-on">
          <div class="nav-dot nav-dot-on"></div>
          <text class="nav-label nav-label-on">对话</text>
        </div>
        <div class="nav-item" @click="goModels">
          <div class="nav-dot"></div>
          <text class="nav-label">模型</text>
        </div>
        <div class="nav-item" @click="goSettings">
          <div class="nav-dot"></div>
          <text class="nav-label">参数</text>
        </div>
        <div class="nav-item" @click="goDiag">
          <div class="nav-dot"></div>
          <text class="nav-label">自检</text>
        </div>
      </div>

      <div class="side-foot">
        <div class="foot-row">
          <div class="dot" :class="linkCls"></div>
          <text class="foot-text">{{ transport.label }}</text>
        </div>
        <div class="side-status">
          <text v-for="(l, li) in statusLines" :key="'st' + li" :class="l.err ? 'status-err' : 'status-line'">{{ l.text }}</text>
        </div>
      </div>
    </div>

    <!-- 右栏：顶栏 + 消息 + 输入条 -->
    <div class="main">
      <div class="topbar">
        <text class="topbar-title">AI Chat</text>
        <div class="topbar-actions">
          <div class="model-chip" @click="goModels">
            <text class="model-chip-text">{{ modelLabel }}</text>
          </div>
          <div class="tbtn" :class="thinkOn ? 'tbtn-on' : ''" @click="toggleThink">
            <text class="tbtn-text" :class="thinkOn ? 'tbtn-text-on' : ''">{{ thinkLabel }}</text>
          </div>
          <div class="tbtn" :class="confirmClear ? 'tbtn-str' : ''" @click="onClearTap">
            <text class="tbtn-text" :class="confirmClear ? 'tbtn-text-on' : ''">{{ clearLabel }}</text>
          </div>
        </div>
      </div>

      <scroller class="msgs" show-scrollbar="false" over-scroll="40px" over-fling="40px">
        <div v-if="messages.length === 0 && !busy" class="empty">
          <text class="empty-title">还没有对话</text>
          <text class="empty-tip">点下面的输入条，用系统输入法打字（支持中文语音/手写）；再点右边的圆形按钮发送。</text>
        </div>

        <div v-for="m in messages" :key="m.id" class="msg" :class="msgClass(m)">
          <div class="msg-head">
            <text class="msg-role" :class="roleClass(m)">{{ roleLabel(m) }}</text>
            <text class="msg-meta" :class="m.role === 'user' ? 'msg-meta-u' : ''">{{ metaOf(m) }}</text>
          </div>

          <div v-if="m.reasoning" class="think">
            <text class="think-title" @click="toggleReasoning(m.id)">{{ reasoningTitle(m) }}</text>
            <text class="think-text" :class="isReasoningOpen(m.id) ? 'think-open' : 'think-closed'">{{ m.reasoning }}</text>
          </div>

          <div v-for="(b, bi) in blocksOf(m)" :key="m.id + 'b' + bi" class="blk">
            <div v-if="b.t === 'code'" class="code">
              <text class="code-lang">{{ b.lang || '代码' }}</text>
              <text class="code-text">{{ b.text }}</text>
            </div>
            <div v-else-if="b.t === 'hr'" class="hr-line"></div>
            <text v-else :class="blockClass(b)">{{ b.text }}</text>
          </div>

          <text v-if="m.error" class="msg-err" @click="retryLast(m)">{{ m.error }}（点此重试）</text>
          <text v-if="m.truncated" class="msg-warn">输出达到长度上限被截断，可在「参数」里调大最大输出。</text>
        </div>

        <div v-if="busy" class="msg">
          <div class="msg-head">
            <text class="msg-role">AI</text>
            <text class="msg-meta">{{ busyMeta }}</text>
          </div>
          <text class="pending">{{ busyText }}</text>
        </div>

        <div ref="end" class="anchor"></div>
      </scroller>

      <div class="composer">
        <!-- 最近扫描：放在输入条左侧，点一下把扫描到的文字填进输入框（不自动发送） -->
        <div class="scan-chip" :class="scanLive ? 'scan-chip-live' : ''" @click="fillFromScan">
          <text class="scan-chip-name">{{ scanName }}</text>
          <text class="scan-chip-text" :class="scanLive ? 'scan-chip-text-live' : ''">{{ scanShort }}</text>
        </div>
        <div class="scan-refresh" @click="refreshScan"><text class="scan-refresh-text">刷</text></div>

        <div class="composer-box" @click="openInput">
          <text class="composer-text" :class="draft ? '' : 'composer-ph'">{{ draft || '输入问题…' }}</text>
        </div>

        <div v-if="busy" class="cbtn cbtn-stop" @click="stop">
          <text class="cbtn-text">停止</text>
        </div>
        <div v-else class="cbtn cbtn-ghost" @click="openInput">
          <text class="cbtn-text">输入</text>
        </div>

        <div class="cbtn" :class="busy ? 'cbtn-dim' : ''" @click="send">
          <text class="cbtn-text" :class="busy ? 'cbtn-text-dim' : ''">发送</text>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { input } from '../../services/input.js';
import { loadConfig, loadConfigChecked, saveConfig } from '../../services/store.js';
import {
  newMessage, loadHistoryChecked, saveHistory, clearHistory, appendMessage
} from '../../services/chat.js';
import { chat } from '../../services/llm.js';
import { activeModel } from '../../services/config.js';
import { mdToBlocks } from '../../services/markdown.js';
import { fmtDuration, fmtTime, clipText } from '../../services/util.js';
import { initTransport, transportInfo, cancelAll } from '../../services/net.js';
import {
  initScan, loadStoredScan, refreshScan as refreshScanService, onScanChange, getLastScan
} from '../../services/scan.js';
import { logWarn } from '../../services/storage.js';
import { setPanelView } from '../../services/ui.js';

const STYLE_LABEL = {
  none: '不发送思考参数',
  model: '切换模型名',
  reasoning_effort: 'reasoning_effort',
  enable_thinking: 'enable_thinking',
  thinking_object: 'thinking 对象'
};

export default {
  name: 'PageChat',
  data() {
    return {
      cfg: null,
      messages: [],
      draft: '',
      busy: false,
      elapsedMs: 0,
      lastRun: null,
      status: '就绪',
      statusErr: false,
      confirmClear: false,
      openReasoning: {},
      transport: { name: 'unknown', label: '探测中…', detail: '' },
      // 最近扫描（放输入框左侧）；scanning 时显示实时增长的识别文本
      scanState: { ready: false, scanning: false, liveText: '', text: '', translation: '', src: '', dst: '', ts: 0 }
    };
  },
  computed: {
    model() {
      return activeModel(this.cfg);
    },
    params() {
      return (this.cfg && this.cfg.params) || {};
    },
    modelLabel() {
      return this.model ? this.model.label : '（未配置模型）';
    },
    thinkOn() {
      return this.params.think === 'on';
    },
    thinkLabel() {
      return this.thinkOn ? '思考：开' : '思考：关';
    },
    clearLabel() {
      return this.confirmClear ? '再点一次清空' : '新对话';
    },
    busyText() {
      if (this.params.think === 'on') return '思考中…（思考档通常更慢，请稍候）';
      return '正在生成…';
    },
    busyMeta() {
      return '已等待 ' + (this.elapsedMs / 1000).toFixed(1) + 's · 上限 ' + (this.params.timeoutSec || 90) + 's';
    },
    statusLines() {
      // 侧栏只剩 ~65px 放状态，固定 3 行（前两行各 1 行、末行 2 行）；
      // 「上限 / 上下文轮数」这类不常看的信息留给参数页，避免把状态区挤爆。
      const out = [];
      const m = this.model;
      if (m) {
        out.push({ text: '思考' + (this.thinkOn ? '开' : '关') + ' · 温度 ' + this.params.temperature, err: false });
      }
      let line3 = this.transport.label;
      if (this.lastRun) {
        line3 =
          fmtDuration(this.lastRun.ms) +
          (this.lastRun.usage && this.lastRun.usage.total ? ' · ' + this.lastRun.usage.total + 'tok' : '');
      }
      // 通道名已经在上面的 foot-row 里带状态点显示了，这里不再重复
      out.push({ text: line3 === this.transport.label ? '通道就绪' : line3, err: this.transport.name === 'none' });
      out.push({ text: this.status, err: this.statusIsError });
      return out;
    },
    statusIsError() {
      if (this.statusErr) return true;
      // 不只匹配开头：'配置读取失败，…' / '输入法不可用：…' 这类也要标红
      return this.status.indexOf('失败') >= 0 || this.status.indexOf('不可用') >= 0 || this.status.indexOf('错误') >= 0;
    },
    // ---- 最近扫描卡片 ----
    scanLive() {
      return !!this.scanState.scanning;
    },
    scanName() {
      if (this.scanState.scanning) return '扫描中…';
      if (this.scanState.text) return '最近扫描';
      if (!this.scanState.ready) return '扫描不可用';
      return '扫描';
    },
    scanShort() {
      const s = this.scanState.scanning ? this.scanState.liveText : this.scanState.text;
      if (!s) return this.scanState.ready ? '点此填入' : '——';
      const t = String(s).replace(/\s+/g, ' ').trim();
      return t.length > 12 ? t.slice(0, 12) + '…' : t;
    },
    scanFull() {
      return this.scanState.scanning ? this.scanState.liveText : this.scanState.text;
    },
    // 左栏底部那颗状态点：native 传输通道在 = 绿，否则红
    linkCls() {
      return this.transport.name === 'native' ? 'dot-ok' : 'dot-err';
    }
  },
  created() {
    this.gen = 0;
    this.timer = 0;
    this._blocks = {};
    this.loadAll();
    this.setupScan();
  },
  methods: {
    // ---- 数据装载 ----
    async loadAll() {
      const cr = await loadConfigChecked();
      this.cfg = cr.cfg;
      // 读失败时给个明确状态：默认配置已经在界面上了，但**不能**当成用户配置
      this.status = cr.ok ? '就绪' : '配置读取失败，当前显示默认值';
      const hr = await loadHistoryChecked();
      if (hr.ok) {
        this.messages = hr.history.messages;
      } else {
        // 读失败不要把空历史当成真实状态（否则下一次保存会覆盖掉旧对话）
        this.messages = hr.history.messages;
        this.status = '历史读取失败，本次对话不会被保存覆盖';
        this.statusErr = true;
      }
      this.refreshTransport();
      this.scrollToEnd();
    },
    async refreshTransport() {
      await initTransport();
      this.transport = transportInfo();
    },

    // ---- 扫描接入 ----
    // 先把存储里的上一次扫描读出来（冷启动也能立刻显示），再动态加载 lookup_word。
    // 全程 try/catch：扫描模块不可用时只是卡片显示「扫描不可用」，绝不影响聊天。
    async setupScan() {
      const self = this;
      try {
        this._scanOff = onScanChange(function (snap) {
          self.scanState = snap;
        });
      } catch (e) {
        /* 忽略 */
      }
      try {
        await loadStoredScan();
        this.scanState = this.scanStateFromService();
        await initScan();
        this.scanState = this.scanStateFromService();
      } catch (e) {
        logWarn('[index] 扫描初始化失败: ' + ((e && e.message) || e));
      }
    },
    scanStateFromService() {
      const s = getLastScan();
      const snap = {
        ready: true,
        scanning: false,
        liveText: '',
        text: s ? s.text : '',
        translation: s ? s.translation : '',
        src: s ? s.src : '',
        dst: s ? s.dst : '',
        ts: s ? s.ts : 0
      };
      return snap;
    },
    // 点卡片：把扫描文字填进输入框（用户可以再改，也可以直接发送）
    fillFromScan() {
      const t = this.scanFull;
      if (!t) {
        this.status = this.scanState.ready ? '还没有扫描记录，先扫一下' : '扫描模块不可用';
        return;
      }
      this.draft = t;
      this.status = '已填入 ' + String(t).length + ' 字，点「发送」提问';
    },
    async refreshScan() {
      try {
        await refreshScanService();
        this.scanState = this.scanStateFromService();
        this.status = this.scanState.text ? '已刷新扫描记录' : '刷新了，但还没有扫描记录';
      } catch (e) {
        this.status = '刷新扫描失败';
      }
    },
    // 从模型页/参数页返回时刷新（onShow 由 base-page 转发）
    async onShow() {
      const prevActive = this.cfg && this.cfg.activeId;
      try {
        this.cfg = await loadConfig();
      } catch (e) {
        /* 保留旧配置 */
      }
      if (this.cfg && prevActive && this.cfg.activeId !== prevActive) {
        this.status = '已切换模型';
        this.confirmClear = false;
      }
      this.refreshTransport();
    },
    onHide() {
      // 切后台/拉起输入法都不打断在途请求（只有 onUnload 才收尾）
    },
    onUnload() {
      this.gen++;
      this.stopTimer();
      input.dispose();
      cancelAll();
      if (this._scanOff) {
        try {
          this._scanOff();
        } catch (e) {
          /* 忽略 */
        }
        this._scanOff = null;
      }
    },

    // ---- 渲染辅助 ----
    msgClass(m) {
      if (m.error && !m.text) return 'msg-err-box';
      return m.role === 'user' ? 'msg-u' : '';
    },
    roleClass(m) {
      return m.role === 'user' ? 'role-u' : m.role === 'system' ? 'role-sys' : '';
    },
    roleLabel(m) {
      return m.role === 'user' ? '我' : m.role === 'assistant' ? 'AI' : '系统';
    },
    metaOf(m) {
      const parts = [];
      if (m.model) parts.push(clipText(m.model, 18));
      if (m.ms) parts.push(fmtDuration(m.ms));
      if (m.usage && m.usage.total) parts.push(m.usage.total + ' tok');
      parts.push(fmtTime(m.ts));
      return parts.join(' · ');
    },
    // 块缓存：消息完成后内容不再变，避免每帧重新解析 Markdown
    blocksOf(m) {
      const key = m.id + '#' + (m.text ? m.text.length : 0);
      if (this._blocks[key]) return this._blocks[key];
      const blocks = mdToBlocks(m.text);
      this._blocks[key] = blocks;
      // 简单的缓存上限，防止长会话无限增长
      const keys = Object.keys(this._blocks);
      if (keys.length > 120) {
        for (let i = 0; i < 40; i++) delete this._blocks[keys[i]];
      }
      return blocks;
    },
    blockClass(b) {
      if (b.t === 'h') return 't-h';
      if (b.t === 'li') return 't-li';
      if (b.t === 'quote') return 't-quote';
      if (b.t === 'hr') return 't-hr';
      return 't-p';
    },
    reasoningTitle(m) {
      const open = this.isReasoningOpen(m.id);
      return '思考过程 ' + (open ? '（点此收起）' : '（点此展开）') + ' · ' + m.reasoning.length + ' 字';
    },
    isReasoningOpen(id) {
      return this.openReasoning[id] !== false;
    },
    toggleReasoning(id) {
      const next = {};
      Object.keys(this.openReasoning).forEach((k) => {
        next[k] = this.openReasoning[k];
      });
      next[id] = !this.isReasoningOpen(id);
      this.openReasoning = next;
    },

    // ---- 导航 ----
    // 模型/参数/自检 三个区块现在合并在 panel 页里：先记下要进哪个区块，再压入 panel。
    // 进面板后它们之间互切是纯视图切换（原地换组件），不会再出现退回对话页的闪动。
    goPanel(view) {
      try {
        setPanelView(view);
        $falcon.navTo('panel');
      } catch (e) {
        this.status = '打开面板失败：' + ((e && e.message) || e);
        this.statusErr = true;
      }
    },
    goModels() {
      this.goPanel('models');
    },
    goSettings() {
      this.goPanel('settings');
    },
    goDiag() {
      this.goPanel('diag');
    },

    // ---- 交互 ----
    async toggleThink() {
      if (!this.cfg) return;
      const next = {
        version: this.cfg.version,
        activeId: this.cfg.activeId,
        models: this.cfg.models,
        params: Object.assign({}, this.cfg.params)
      };
      next.params.think = this.thinkOn ? 'off' : 'on';
      this.cfg = next;
      await saveConfig(this.cfg);
      const m = this.model;
      this.status = '思考已' + (this.thinkOn ? '打开' : '关闭') + '（' + (m ? STYLE_LABEL[m.thinkStyle] || '' : '') + '）';
    },
    onClearTap() {
      if (!this.confirmClear) {
        this.confirmClear = true;
        this.status = '再点一次「新对话」即清空';
        const self = this;
        setTimeout(function () {
          self.confirmClear = false;
        }, 4000);
        return;
      }
      this.confirmClear = false;
      // 清空必须同时作废在途请求：否则答案会在清空后落地，
      // 变成一条没有问题的 AI 气泡被写进历史，而「停止」按钮指向的回合已经不存在了。
      if (this.busy) {
        this.gen++;
        this.busy = false;
        this.stopTimer();
        cancelAll();
      }
      this.messages = [];
      this._blocks = {};
      this.lastRun = null;
      clearHistory();
      this.status = '已清空对话';
      this.scrollToEnd();
    },
    async openInput() {
      const r = await input.open({
        value: this.draft || '',
        placeholder: '输入你想问的…',
        maxlength: 600
      });
      if (r && r.confirmed && typeof r.text === 'string' && r.text) {
        this.draft = r.text;
        this.status = '已输入 ' + r.text.length + ' 字，点发送';
      } else if (r && r.error) {
        this.status = '输入法不可用：' + r.error;
      }
    },
    startTimer() {
      this.stopTimer();
      const self = this;
      this.elapsedMs = 0;
      this.timer = setInterval(function () {
        self.elapsedMs += 200;
      }, 200);
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = 0;
      }
    },
    scrollToEnd() {
      const self = this;
      setTimeout(function () {
        try {
          if (self.$page && self.$page.$dom && self.$page.$dom.scrollToElement && self.$refs.end) {
            self.$page.$dom.scrollToElement(self.$refs.end, { offset: 0 });
          }
        } catch (e) {
          /* 滚动失败不影响功能 */
        }
      }, 40);
    },

    // ---- 发送 / 停止 / 重试 ----
    async send() {
      if (this.busy) {
        this.status = '上一条还在生成中，可点「停止」';
        return;
      }
      const text = (this.draft || '').trim();
      if (!text) {
        this.openInput();
        return;
      }
      const historyBefore = this.messages.slice();
      const userMsg = newMessage('user', text);
      this.messages = appendMessage(this.messages, userMsg);
      this.draft = '';
      const myGen = ++this.gen;
      this.busy = true;
      this.startTimer();
      this.status = '请求中…';
      saveHistory(this.messages);
      this.scrollToEnd();

      let r;
      try {
        r = await chat(this.cfg, { history: historyBefore, userText: text });
      } catch (e) {
        r = { ok: false, error: { kind: 'internal', message: '内部错误', detail: (e && e.message) || String(e) }, ms: 0 };
      }

      if (myGen !== this.gen) {
        // 已停止：不再改动列表（stop() 已写入占位消息）
        return;
      }
      this.busy = false;
      this.stopTimer();

      if (!r.ok) {
        const err = r.error || { message: '未知错误' };
        const line = err.message + (err.detail ? '：' + err.detail : '');
        const hints = (r.requestBody && r.requestBody.hints) || [];
        this.messages = appendMessage(
          this.messages,
          newMessage('assistant', '', {
            error: clipText(line, 160),
            ms: r.ms || 0,
            model: this.model ? this.model.model : ''
          })
        );
        // 厂商已知限制优先显示（例如「千问非流式不允许开思考」），比一句通用报错有用得多
        this.status = hints.length
          ? clipText(hints[0], 26)
          : '失败：' + clipText(err.message, 18);
        logWarn('[chat] 失败 kind=' + err.kind + ' status=' + (r.status || 0));
      } else {
        this.messages = appendMessage(
          this.messages,
          newMessage('assistant', r.text, {
            reasoning: r.reasoning || '',
            ms: r.ms,
            model: r.model || '',
            usage: r.usage,
            truncated: r.finishReason === 'length'
          })
        );
        this.lastRun = {
          ms: r.ms,
          usage: r.usage,
          transport: r.transport,
          insecure: r.insecure,
          contextTokens: r.contextTokens
        };
        this.status = '完成 · ' + fmtDuration(r.ms) + (r.insecure ? ' · 未校验证书' : '');
      }
      saveHistory(this.messages);
      this.scrollToEnd();
    },

    stop() {
      if (!this.busy) return;
      this.gen++; // 作废本轮结果
      this.busy = false;
      this.stopTimer();
      cancelAll();
      this.messages = appendMessage(
        this.messages,
        newMessage('assistant', '（已停止等待）', { cancelled: true, ms: this.elapsedMs })
      );
      saveHistory(this.messages);
      this.status = '已停止（连接会在服务端超时前收尾）';
      this.scrollToEnd();
    },

    // 点某条错误提示 → 只重发**那一条**对应的提问
    async retryLast(errMsg) {
      if (this.busy) return;
      const list = this.messages.slice();
      // 从被点的那条消息往回找最近的用户提问；没有入参就退回最后一条
      let anchor = list.length - 1;
      if (errMsg && errMsg.id) {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === errMsg.id) {
            anchor = i;
            break;
          }
        }
      }
      let userIdx = -1;
      for (let i = anchor; i >= 0; i--) {
        if (list[i].role === 'user' && list[i].text) {
          userIdx = i;
          break;
        }
      }
      if (userIdx < 0) {
        this.status = '没有可重试的问题';
        return;
      }
      const text = list[userIdx].text;
      // 把这一问**及其之后**的记录全部去掉：send() 会重新追加这一问，
      // 若只删掉报错的回复，同一句会在上下文里出现两次（模型会重复回答）。
      this.messages = list.slice(0, userIdx);
      this.draft = text;
      await this.send();
    }
  }
};
</script>

<style lang="less" scoped>
/* 样式必须以 <style> 块形式存在于 .vue 内（真机证据：无 style 块时规则完全不进 bundle → 页面全黑）。 */
@import "../../styles/chat.less";
</style>
