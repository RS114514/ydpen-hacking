/*
 * 离线回归测试（Node 直接跑，不需要设备）：
 *   node test/run.mjs
 *
 * 覆盖「不依赖设备」的核心逻辑——也就是这个应用最容易错的那些翻译：
 *   · 配置归一化（旧版/损坏 JSON 不能把脏值带进请求体）
 *   · 各服务商「思考开关」方言 → 请求体字段（DeepSeek/GLM/Kimi/Qwen/OpenAI）
 *   · 上下文裁剪规则（停掉的、报错的回合不进上下文）
 *   · 各家错误体解析（OpenAI/GLM/Kimi/SiliconFlow 形状都不一样）
 *   · Markdown 降级成块、请求头拼装（含抑制 Expect: 100-continue 的那一行）
 *
 * 实现说明：src/ 下的模块是 ESM，而工程 package.json 没有 type:module
 * （aiot-vue-cli 的构建链路要求如此）。所以这里把 services 复制到
 * test/.tmp 并放一个 {"type":"module"} 的 package.json，再 import——
 * 这样既不动构建配置，又能对**真实源码**做测试。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const svcDir = path.join(here, '..', 'src', 'services');
const tmpDir = path.join(here, '.tmp');

fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module' }));
for (const f of fs.readdirSync(svcDir)) {
  if (f.endsWith('.js')) fs.copyFileSync(path.join(svcDir, f), path.join(tmpDir, f));
}

const imp = (name) => import(pathToFileURL(path.join(tmpDir, name)).href);

const util = await imp('util.js');
const config = await imp('config.js');
const presets = await imp('presets.js');
const markdown = await imp('markdown.js');
const chat = await imp('chat.js');
const llm = await imp('llm.js');
const net = await imp('net.js');

// ---- 迷你断言 ----
let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else failures.push(name + (detail ? '  [' + detail + ']' : ''));
}
function eq(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  ok(name, a === e, 'got ' + a + ' want ' + e);
}
function section(title) {
  console.log('\n' + title);
}

// ============================================================
section('util：URL 与脱敏');
eq('normalizeBaseUrl 去尾斜杠', util.normalizeBaseUrl('https://api.deepseek.com/'), 'https://api.deepseek.com');
eq('normalizeBaseUrl 去空白', util.normalizeBaseUrl('  https://a.com/v1/  '), 'https://a.com/v1');
eq('chatCompletionsUrl 补路径', util.chatCompletionsUrl('https://api.deepseek.com'), 'https://api.deepseek.com/chat/completions');
eq('chatCompletionsUrl 已含路径不重复', util.chatCompletionsUrl('https://x/v1/chat/completions'), 'https://x/v1/chat/completions');
eq('chatCompletionsUrl 空值', util.chatCompletionsUrl(''), '');
eq('modelsUrl', util.modelsUrl('https://x/v1'), 'https://x/v1/models');
eq('modelsUrl 从 chat 路径回退', util.modelsUrl('https://x/v1/chat/completions'), 'https://x/v1/models');
ok('maskKey 不泄露中段', util.maskKey('sk-abcdefghijklmnop').indexOf('defghijkl') < 0, util.maskKey('sk-abcdefghijklmnop'));
eq('maskKey 空', util.maskKey(''), '（未填写）');
eq('parseHeaderLines 解析并忽略注释/坏行', util.parseHeaderLines('# c\nX-A: 1\n\nnocolon\nX-B:2'), { 'X-A': '1', 'X-B': '2' });
eq('clampNum 越界收敛', util.clampNum(99, 0, 2, 1), 2);
eq('clampNum NaN 回落', util.clampNum('abc', 0, 2, 1), 1);
eq('fmtDuration 秒', util.fmtDuration(2345), '2.3s');

// ============================================================
section('net：请求头拼装（native 契约）');
const hl = net.headersToLines({ 'Content-Type': 'application/json', Authorization: 'Bearer k', Empty: '' });
ok('第一行是 Expect:（抑制 100-continue）', hl.split('\r\n')[0].replace(/\s+$/, '') === 'Expect:', hl.split('\r\n')[0]);
ok('包含 Content-Type', hl.indexOf('Content-Type: application/json') >= 0);
ok('包含 Authorization', hl.indexOf('Authorization: Bearer k') >= 0);
ok('丢弃空值请求头', hl.indexOf('Empty') < 0);
eq('clampTimeout 下限', net.clampTimeout(1), 5000);
eq('clampTimeout 上限', net.clampTimeout(1e9), 300000);
eq('statusText 401', net.statusText(401), '认证失败（API Key 无效或未填）');
ok('curlCodeText 6 = DNS', net.curlCodeText(6).indexOf('域名') >= 0);
eq('tryParseJson 非 JSON 返回 null', net.tryParseJson('hello'), null);
eq('tryParseJson 解析对象', net.tryParseJson('{"a":1}'), { a: 1 });

// ============================================================
section('config：默认配置与预设');
const def = config.defaultConfig();
eq('默认启用 2 个模型（DeepSeek 快答+思考）', def.models.length, 2);
eq('默认激活第一个', def.activeId, def.models[0].id);
eq('默认模型名是 deepseek-flash', def.models[0].model, 'deepseek-flash');
eq('第二个是 deepseek-v4-pro', def.models[1].model, 'deepseek-v4-pro');
eq('Base URL 无 /v1 后缀（官方文档格式）', def.models[0].baseUrl, 'https://api.deepseek.com');
eq('默认思考关', def.params.think, 'off');
eq('默认超时 90s', def.params.timeoutSec, 90);

const dsFlash = config.modelFromPreset('deepseek-flash');
eq('预设 deepseek-flash 思考方言', dsFlash.thinkStyle, 'thinking_object');
ok('预设 deepseek-flash 标记「思考时温度无效」', dsFlash.tempIgnoredWhenThinking === true);

const kimi = config.modelFromPreset('kimi-fast');
ok('Kimi 预设不发送 temperature', kimi.omitTemperature === true);
ok('Kimi 预设不发送 top_p', kimi.omitTopP === true);
eq('Kimi 预设覆盖输出上限为 16000', kimi.maxTokensOverride, 16000);

const glmThink = config.modelFromPreset('glm-think');
eq('GLM-5.3 用 reasoning_effort', glmThink.thinkStyle, 'reasoning_effort');
eq('GLM-5.3 强度只允许 low/high/max', config.parseEffortOptions(glmThink.effortOptions), ['low', 'high', 'max']);

const openaiReason = config.modelFromPreset('openai-reason');
eq('OpenAI 推理用 max_completion_tokens', openaiReason.maxTokensField, 'max_completion_tokens');

// ============================================================
section('config：归一化抗脏数据');
const dirty = config.normalizeConfig({
  version: 99,
  activeId: 'not-exist',
  models: [
    { label: '', baseUrl: ' https://a.com/ ', model: '  m1 ', thinkStyle: 'bogus', maxTokensOverride: 1e9 },
    null,
    { baseUrl: '', model: '' }
  ],
  params: { temperature: 99, maxTokens: -5, historyRounds: 'x', think: 'yes', thinkBudget: -1 }
});
eq('脏模型被过滤（只剩 1 条有效）', dirty.models.length, 1);
eq('label 空 → 兜底名', dirty.models[0].label, '未命名模型');
eq('baseUrl 归一化', dirty.models[0].baseUrl, 'https://a.com');
eq('model 去空白', dirty.models[0].model, 'm1');
eq('未知 thinkStyle → none', dirty.models[0].thinkStyle, 'none');
eq('maxTokensOverride 收敛到自身上限', dirty.models[0].maxTokensOverride, config.LIMITS.maxTokensOverride.max);
eq('activeId 失效 → 回落到第一个', dirty.activeId, dirty.models[0].id);
eq('temperature 越界收敛', dirty.params.temperature, 2);
eq('maxTokens 下限收敛', dirty.params.maxTokens, 64);
eq('historyRounds 非法回落默认', dirty.params.historyRounds, config.DEFAULT_PARAMS.historyRounds);
eq('think 非 on → off', dirty.params.think, 'off');
eq('thinkBudget 下限收敛', dirty.params.thinkBudget, 0);
eq('完全损坏的输入 → 默认配置', config.normalizeConfig('garbage').models.length, 2);
eq('null → 默认配置', config.normalizeConfig(null).models.length, 2);

// ============================================================
section('config：思考方言 → 请求体');
const msgs = [{ role: 'user', content: 'hi' }];
function bodyFor(modelKey, paramsPatch) {
  const m = config.modelFromPreset(modelKey);
  const p = Object.assign(config.normalizeParams(null), paramsPatch || {});
  return config.buildRequestBody(m, p, msgs);
}

// 1) thinking_object（DeepSeek / GLM 老档 / Kimi）
let r = bodyFor('deepseek-flash', { think: 'off' });
eq('DeepSeek 关思考 → thinking.type=disabled', r.body.thinking, { type: 'disabled' });
eq('DeepSeek 关思考模型名不变', r.body.model, 'deepseek-flash');
eq('始终 stream:false', r.body.stream, false);
ok('关思考时不发 reasoning_effort', r.body.reasoning_effort === undefined);
ok('thinking 对象里只放 type（不带未文档化的 budget_tokens）', Object.keys(r.body.thinking).length === 1);

r = bodyFor('deepseek-flash', { think: 'on' });
eq('DeepSeek 开思考 → thinking.type=enabled', r.body.thinking, { type: 'enabled' });
eq('DeepSeek 开思考 → 同时给 reasoning_effort 默认中档', r.body.reasoning_effort, 'high');
r = bodyFor('deepseek-flash', { think: 'on', thinkEffort: 'max' });
eq('DeepSeek 思考强度可取 max', r.body.reasoning_effort, 'max');
r = bodyFor('deepseek-flash', { think: 'on', thinkEffort: 'minimal' });
eq('DeepSeek 不在允许集合(仅 low/high/max)的强度收敛为 high', r.body.reasoning_effort, 'high');

// 2) reasoning_effort（OpenAI / GLM-5.3 / Kimi-K3）
r = bodyFor('openai-reason', { think: 'on', thinkEffort: 'high' });
eq('OpenAI 开思考 → reasoning_effort=high', r.body.reasoning_effort, 'high');
eq('OpenAI 用 max_completion_tokens', r.body.max_completion_tokens, config.DEFAULT_PARAMS.maxTokens);
ok('OpenAI 不出现 max_tokens', r.body.max_tokens === undefined);

// GLM-5.3 不支持 none → 关思考时不能发 reasoning_effort（发了会 400）
r = bodyFor('glm-think', { think: 'off' });
ok('GLM-5.3 关思考 → 不发送 reasoning_effort', r.body.reasoning_effort === undefined);
ok('GLM-5.3 关思考 → 给出「无法关闭」提示', r.hints.join('').indexOf('无法关闭思考') >= 0);

// 强度不在允许集合里 → 收敛到 high
r = bodyFor('glm-think', { think: 'on', thinkEffort: 'medium' });
eq('不在允许集合的强度收敛为 high', r.body.reasoning_effort, 'high');
r = bodyFor('glm-think', { think: 'on', thinkEffort: 'low' });
eq('允许集合内的强度原样保留', r.body.reasoning_effort, 'low');

// 不限制取值时，关思考用 none 表达
const openaiFast = config.modelFromPreset('openai-reason');
openaiFast.effortOptions = '';
r = config.buildRequestBody(openaiFast, config.normalizeParams({ think: 'off' }), msgs);
eq('不限制取值时关思考发 reasoning_effort=none', r.body.reasoning_effort, 'none');

// 3) enable_thinking（Qwen / SiliconFlow）
r = bodyFor('qwen-think', { think: 'on', thinkBudget: 4096 });
eq('Qwen 开思考 → enable_thinking=true', r.body.enable_thinking, true);
eq('Qwen 开思考 → thinking_budget=4096', r.body.thinking_budget, 4096);
r = bodyFor('qwen-think', { think: 'off' });
eq('Qwen 关思考 → enable_thinking=false', r.body.enable_thinking, false);
ok('Qwen 开思考时提示非流式风险', bodyFor('qwen-think', { think: 'on' }).hints.join('').indexOf('非流式') >= 0);

// 4) 采样参数与省略规则
r = bodyFor('deepseek-flash', { think: 'off', temperature: 0.3, maxTokens: 700 });
eq('普通模型发 temperature', r.body.temperature, 0.3);
eq('普通模型用 max_tokens', r.body.max_tokens, 700);
ok('默认不发 top_p', r.body.top_p === undefined);
r = bodyFor('deepseek-flash', { useTopP: true, topP: 0.9 });
eq('打开后发 top_p', r.body.top_p, 0.9);
r = bodyFor('kimi-fast', { temperature: 0.3, maxTokens: 700 });
ok('Kimi 不发 temperature', r.body.temperature === undefined);
eq('Kimi 用覆盖后的输出上限', r.body.max_tokens, 16000);
ok('Kimi 给出「不接受 temperature」提示', r.hints.join('').indexOf('不接受 temperature') >= 0);
r = bodyFor('deepseek-flash', { think: 'on' });
ok('思考模式下提示温度不生效', r.hints.join('').indexOf('temperature 不生效') >= 0);

// 5) model 方言（切模型名）
const switchModel = config.normalizeModel({
  label: 'SW', baseUrl: 'https://x/v1', model: 'fast-1', thinkStyle: 'model',
  fastModel: 'fast-1', thinkModel: 'think-1'
});
r = config.buildRequestBody(switchModel, config.normalizeParams({ think: 'off' }), msgs);
eq('model 方言关 → 快答模型名', r.body.model, 'fast-1');
r = config.buildRequestBody(switchModel, config.normalizeParams({ think: 'on' }), msgs);
eq('model 方言开 → 思考模型名', r.body.model, 'think-1');

// 6) 附加参数 JSON（高级逃生口）
const extra = config.normalizeModel({
  label: 'EX', baseUrl: 'https://x/v1', model: 'm', thinkStyle: 'none',
  extraBody: '{"top_k":20,"temperature":0.1}'
});
r = config.buildRequestBody(extra, config.normalizeParams({ temperature: 0.9 }), msgs);
eq('附加参数可覆盖全局温度', r.body.temperature, 0.1);
eq('附加参数可新增字段', r.body.top_k, 20);
const badExtra = config.normalizeModel({ label: 'BX', baseUrl: 'https://x/v1', model: 'm', extraBody: '{oops' });
r = config.buildRequestBody(badExtra, config.normalizeParams(null), msgs);
ok('非法附加参数被忽略而不是崩', r.notes.join('').indexOf('不是合法 JSON') >= 0);

// ============================================================
section('llm：上下文裁剪');
function mk(role, text, extra) {
  return Object.assign({ id: 'i' + Math.random(), role, text, reasoning: '', ts: 0, ms: 0, model: '', usage: null, error: '', truncated: false, cancelled: false }, extra || {});
}
let cfg = config.defaultConfig();
cfg.models = [config.modelFromPreset('deepseek-flash')];
cfg.activeId = cfg.models[0].id;
cfg.params = config.normalizeParams({ historyRounds: 1, systemPrompt: 'SYS' });

let history = [mk('user', 'q1'), mk('assistant', 'a1'), mk('user', 'q2'), mk('assistant', 'a2')];
let m = llm.buildMessages(cfg, history, 'q3');
// historyRounds=1 → 保留最后 1 轮（user+assistant = 2 条）
eq('消息数 = system + 1轮(2条) + 本轮', m.length, 4);
eq('首条是 system', m[0], { role: 'system', content: 'SYS' });
eq('保留的是最后一轮', [m[1].content, m[2].content], ['q2', 'a2']);
eq('末条是本轮提问', m[3], { role: 'user', content: 'q3' });

cfg.params = config.normalizeParams({ historyRounds: 0, systemPrompt: '' });
m = llm.buildMessages(cfg, history, 'q3');
eq('轮数为 0 → 只发当前句', m.length, 1);
eq('无 system 时不占位', m[0].role, 'user');

cfg.params = config.normalizeParams({ historyRounds: 6, systemPrompt: 'SYS' });
history = [mk('user', 'q1'), mk('assistant', 'a1', { cancelled: true }), mk('user', 'q2'), mk('assistant', '', { error: '失败' }), mk('user', 'q3'), mk('assistant', 'a3')];
m = llm.buildMessages(cfg, history, 'q4');
const contents = m.map((x) => x.content);
ok('被停止的回合不进上下文', contents.indexOf('a1') < 0, JSON.stringify(contents));
ok('报错的空回复不进上下文', contents.indexOf('') < 0);
eq('有效历史保留 q1/a3', contents.indexOf('q1') >= 0 && contents.indexOf('a3') >= 0, true);

// ============================================================
section('llm：各家错误体解析');
eq('OpenAI 形状', llm.extractApiError({ json: { error: { message: 'Incorrect API key', type: 'invalid_request_error', code: 'invalid_api_key' } } }), 'Incorrect API key');
eq('GLM 形状（code 是字符串）', llm.extractApiError({ json: { error: { code: '1001', message: '鉴权失败' } } }), '鉴权失败');
eq('Kimi 形状（无 code）', llm.extractApiError({ json: { error: { type: 'invalid_request_error', message: 'temperature cannot be modified' } } }), 'temperature cannot be modified');
eq('SiliconFlow 扁平形状', llm.extractApiError({ json: { code: 20012, message: 'Invalid model', data: null } }), 'Invalid model');
eq('裸字符串错误体', llm.extractApiError({ json: null, body: 'Invalid token' }), 'Invalid token');
eq('HTML 错误页', llm.extractApiError({ json: null, body: '<html><body>502 Bad Gateway</body></html>' }), '服务端返回了 HTML（多半是地址不对或需要代理）');
eq('只有错误码', llm.extractApiError({ json: { error: { code: 500 } } }), '错误码 500');

let d = llm.describeFailure({ status: 0, curlCode: 6, error: 'Could not resolve host' });
eq('状态码 0 → 归为网络类', d.kind, 'network');
ok('状态码 0 → 翻译 curl 码', d.message.indexOf('域名') >= 0, d.message);
d = llm.describeFailure({ status: 401, json: { error: { message: 'bad key' } } });
eq('401 → 认证类提示', d.message, '认证失败（API Key 无效或未填）');
eq('401 → 带上服务商原文', d.detail, 'bad key');
d = llm.describeFailure({ status: 503, json: null, body: 'oops' });
eq('5xx → server 类', d.kind, 'server');

// 配置不完整时不该发请求
const bad = { id: 'x', label: 'X', baseUrl: '', apiKey: '', model: '' };
const v = llm.validateModel(bad);
eq('校验能列出全部缺失项', v.problems.length, 3);
ok('校验不通过', v.ok === false);
const goodv = llm.validateModel({ baseUrl: 'ftp://x', apiKey: 'k', model: 'm' });
ok('非 http(s) 协议被拒', goodv.ok === false && goodv.problems.join('').indexOf('http') >= 0);

// ============================================================
section('markdown：降级成块');
let bl = markdown.mdToBlocks('# 标题\n\n这是**粗体**和`代码`。\n\n- 甲\n- 乙\n\n```js\nconst a = 1;\n```\n\n> 引用\n\n| a | b |\n| --- | --- |\n| 1 | 2 |');
eq('块类型序列', bl.map((b) => b.t), ['h', 'p', 'li', 'code', 'quote', 'p']);
eq('标题文本去 #', bl[0].text, '标题');
eq('行内粗体/代码标记被清掉', bl[1].text, '这是粗体和代码。');
eq('代码块语言被保留', bl[3].lang, 'js');
eq('代码块内容原样', bl[3].text, 'const a = 1;');
eq('列表项带项目符号', bl[2].text, '· 甲\n· 乙');
eq('表格行转成竖线分隔', bl[5].text, 'a ｜ b\n1 ｜ 2');
eq('mdToPlain 去掉块结构', markdown.mdToPlain('**a**\n\nb'), 'a\nb');
eq('链接保留文字与地址', markdown.stripInline('见[文档](https://x.dev)'), '见文档（https://x.dev）');
eq('图片变成占位', markdown.stripInline('![图](u.png)'), '[图片 图]');
eq('未闭合代码围栏也能收尾', markdown.mdToBlocks('```\nabc').map((b) => b.t), ['code']);
ok('空输入返回空数组', markdown.mdToBlocks('').length === 0);
ok('token 估算：中文按字算', markdown.estimateTokens('你好世界') >= 4);
ok('token 估算：英文按 4 字符算', markdown.estimateTokens('abcdefgh') === 2);
ok('消息 token 估算含每条开销', markdown.estimateMessagesTokens([{ role: 'user', content: 'abcd' }]) >= 5);

// ============================================================
section('chat：记录归一化与裁剪');
let h = chat.normalizeHistory({ messages: [mk('user', 'hi'), mk('assistant', ''), mk('assistant', 'yo', { reasoning: 'r' }), null] });
eq('空内容记录被丢弃', h.messages.length, 2);
eq('role 保留', h.messages[0].role, 'user');
eq('reasoning 保留', h.messages[1].reasoning, 'r');
eq('版本号写入', h.version, chat.HISTORY_SCHEMA_VERSION);
h = chat.normalizeHistory('garbage');
eq('损坏输入 → 空历史', h.messages.length, 0);
let many = [];
for (let i = 0; i < chat.MAX_MESSAGES + 10; i++) many.push(mk('user', 'm' + i));
eq('超长历史按上限裁剪', chat.normalizeHistory({ messages: many }).messages.length, chat.MAX_MESSAGES);
eq('裁剪保留最新的', chat.normalizeHistory({ messages: many }).messages[chat.MAX_MESSAGES - 1].text, 'm' + (chat.MAX_MESSAGES + 9));
let arr = chat.appendMessage([], mk('user', 'a'));
arr = chat.appendMessage(arr, mk('assistant', 'b'));
eq('追加两条', arr.length, 2);
arr = chat.replaceMessage(arr, arr[1].id, { text: 'b2', ms: 12 });
eq('替换生效', arr[1].text, 'b2');
eq('替换后其它字段保留', arr[1].ms, 12);
eq('historySummary 统计', chat.historySummary(arr), '1 问 · 1 答');
eq('historySummary 空态', chat.historySummary([]), '还没有对话');
eq('lastError 取最后一条', chat.lastError([mk('assistant', '', { error: 'e1' }), mk('user', 'x'), mk('assistant', '', { error: 'e2' })]), 'e2');

// ============================================================
section('storage：键名与设备契约');
const storage = await imp('storage.js');
eq('配置键', storage.KEYS.config, 'apc_config');
eq('历史键', storage.KEYS.history, 'apc_history');
eq('无 $falcon 时退化为内存态（不抛异常）', storage.storageAvailable(), false);
eq('归一化 {data} 形态', storage.normalizeStoredValue({ data: 'v' }), 'v');
eq('归一化 {value} 形态', storage.normalizeStoredValue({ value: 'v' }), 'v');
eq('归一化字符串形态', storage.normalizeStoredValue('v'), 'v');
eq('归一化 null', storage.normalizeStoredValue(null), '');
const gjc = await storage.getJsonChecked('nope', null);
eq('getJsonChecked 在「确实没存过」时报 ok', gjc.ok, true);
eq('并且标记 empty', gjc.empty, true);
await storage.setJson('__t', { a: 1 });
eq('getJsonChecked 读回写入值', (await storage.getJsonChecked('__t', null)).value, { a: 1 });
eq('setJson 后 ok 仍为 true', (await storage.getJsonChecked('__t', null)).ok, true);

// ============================================================
section('store：读失败不得覆盖真实数据（防 API Key 被清空）');
const store = await imp('store.js');
const lc = await store.loadConfigChecked();
eq('无存储时 loadConfigChecked 报 ok（内存态算读成功）', lc.ok, true);
eq('并给出默认配置', lc.cfg.models.length, 2);

const customCfg = config.normalizeConfig({
  models: [
    { id: 'mine', label: '我的模型', baseUrl: 'https://api.deepseek.com', model: 'deepseek-flash', apiKey: 'sk-secret-1234' }
  ],
  activeId: 'mine',
  params: { temperature: 1.5, think: 'on', maxTokens: 4096 }
});
eq('自定义配置带 Key', customCfg.models[0].apiKey, 'sk-secret-1234');

// 「恢复默认参数」必须保留模型与 Key —— 早先误用 resetConfig() 会把 Key 清空，
// 用户点一下按钮之后所有请求都变成 401（破坏性 bug，这里做回归防护）。
const afterReset = store.resetParams(customCfg);
eq('resetParams 后模型仍在', afterReset.models.length, 1);
eq('resetParams 后 API Key 未被清空', afterReset.models[0].apiKey, 'sk-secret-1234');
eq('resetParams 后 activeId 不变', afterReset.activeId, 'mine');
eq('resetParams 确实重置了温度', afterReset.params.temperature, config.DEFAULT_PARAMS.temperature);
eq('resetParams 确实重置了思考开关', afterReset.params.think, 'off');
eq('resetParams 确实重置了最大输出', afterReset.params.maxTokens, config.DEFAULT_PARAMS.maxTokens);

// 出厂重置（清 Key）是另一个函数，语义清晰分开
const afterFactory = store.resetConfig();
eq('resetConfig 会回到内置预设', afterFactory.models.length, 2);
eq('resetConfig 不含用户 Key', afterFactory.models[0].apiKey, '');

// ============================================================
section('presets：厂商限制被正确建模');
const oaReason = config.modelFromPreset('openai-reason');
ok('OpenAI 推理档不发送 temperature（只接受默认温度）', oaReason.omitTemperature === true);
ok('OpenAI 推理档的备注说明了思考正文拿不到', oaReason.note.indexOf('拿不到') >= 0 || oaReason.note.indexOf('平台限制') >= 0);
const dsPro = config.modelFromPreset('deepseek-v4-pro');
ok('DeepSeek Pro 同时发 thinking.type 与 reasoning_effort', dsPro.effortWithThinking === true);
eq('DeepSeek 强度只允许 low/high/max', config.parseEffortOptions(dsPro.effortOptions), ['low', 'high', 'max']);
const kimiK3 = config.modelFromPreset('kimi-think');
ok('Kimi K3 用 reasoning_effort 而非 thinking', kimiK3.thinkStyle === 'reasoning_effort');
ok('Kimi 档位不复用 DeepSeek 的 effortWithThinking', kimiK3.effortWithThinking !== true);
const glm5 = config.modelFromPreset('glm-think');
ok('GLM-5.3 不接受 none（关思考时不发该字段）', config.parseEffortOptions(glm5.effortOptions).indexOf('none') < 0);

// ============================================================
console.log('\n' + '='.repeat(56));
if (failures.length === 0) {
  console.log('全部通过：' + pass + ' 项断言');
} else {
  console.log('通过 ' + pass + ' 项，失败 ' + failures.length + ' 项：');
  failures.forEach((f) => console.log('  ✗ ' + f));
}
fs.rmSync(tmpDir, { recursive: true, force: true });
process.exit(failures.length === 0 ? 0 : 1);
