import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/root.js', import.meta.url), 'utf8');
let invocation = 0;

async function setupComponent(hlMock, npageMock = null) {
  const calls = [];
  globalThis.__hlTest = hlMock;
  const text = source.replace("import hl from 'hl';", 'const hl = globalThis.__hlTest;');
  const { default: component } = await import('data:text/javascript;base64,' + Buffer.from(text).toString('base64') + '#' + invocation++);
  
  const pageMock = {
    finish() { calls.push('finish'); },
    $npage: npageMock || {
      listeners: {},
      setSupportBack(val) { calls.push(`setSupportBack(${val})`); },
      on(event, fn) {
        calls.push(`on(${event})`);
        this.listeners[event] = fn;
      },
      off(event, fn) {
        calls.push(`off(${event})`);
        if (this.listeners[event] === fn) delete this.listeners[event];
      }
    }
  };

  const instance = {
    ...component.data(),
    ...component.methods,
    $page: pageMock
  };

  return { instance, calls, pageMock };
}

test('对抗测试 1.1: 高频快速连续触发 handleBack 50 次，防重入锁确保 hl.stop 仅执行一次', async () => {
  let stopCalls = 0;
  const hlMock = {
    stop() {
      stopCalls++;
      return { ok: true };
    },
    save() { return { ok: true }; },
    isRunning() { return true; }
  };

  const { instance, calls } = await setupComponent(hlMock);
  
  // 模拟用户在几毫秒内狂按 50 次返回键
  for (let i = 0; i < 50; i++) {
    instance.handleBack();
  }

  assert.equal(stopCalls, 1, 'hl.stop 必须且只能被调用一次');
  assert.equal(instance.exiting, true, 'exiting 标志必须置为 true');
  assert.equal(calls.filter(c => c === 'finish').length, 1, 'finish 必须且只能调用一次');
});

test('对抗测试 1.2: onHide 与 _backpressed 竞态对抗，退出中 onHide 严禁触发二次保存', async () => {
  const opLog = [];
  const hlMock = {
    stop() {
      opLog.push('stop_begin');
      // 模拟 stop 过程中的耗时或中间状态
      opLog.push('stop_end');
      return { ok: true };
    },
    save() {
      opLog.push('save');
      return { ok: true };
    },
    isRunning() { return true; }
  };

  const { instance, calls } = await setupComponent(hlMock);
  
  // 模拟物理按键触发
  instance.onShow();
  // 模拟 backpressed 触发退出
  instance.handleBack();

  // 此时系统由于退出动画可能立即派发 onHide
  instance.onHide();

  assert.equal(instance.exiting, true);
  assert.ok(!opLog.includes('save'), '正在退出状态下，onHide 严禁并发调用 save');
  assert.deepEqual(opLog, ['stop_begin', 'stop_end']);
});

test('对抗测试 1.3: 先 onHide 后物理返回，生命周期顺序与保存退出互不破坏', async () => {
  const opLog = [];
  const hlMock = {
    stop() {
      opLog.push('stop');
      return { ok: true };
    },
    save() {
      opLog.push('save');
      return { ok: true };
    },
    isRunning() { return true; }
  };

  const { instance } = await setupComponent(hlMock);
  instance.onShow();

  // 切后台触发 onHide
  instance.onHide();
  assert.deepEqual(opLog, ['save']);

  // 用户随后切回并按返回键
  instance.onShow();
  instance.handleBack();
  assert.deepEqual(opLog, ['save', 'stop']);
  assert.equal(instance.exiting, true);
});

test('对抗测试 1.4: 存盘失败故障恢复与重试通道验证', async () => {
  let attempt = 0;
  const hlMock = {
    stop() {
      attempt++;
      if (attempt === 1) {
        return { ok: false }; // 首次存盘超时或失败
      }
      return { ok: true }; // 重试成功
    },
    save() { return { ok: true }; },
    isRunning() { return true; }
  };

  const { instance, calls } = await setupComponent(hlMock);
  
  // 首次按下返回键，底层存盘失败
  instance.handleBack();
  
  assert.equal(instance.exiting, false, '存盘失败时必须重置 exiting = false');
  assert.ok(!calls.includes('finish'), '存盘失败时不应退出页面');
  assert.match(instance.statusText, /未能确认存档并退出|请重试/, '状态文本必须提示重试');

  // 用户再次按下返回键（重试）
  instance.handleBack();
  
  assert.equal(attempt, 2, '重试应当再次调用 stop');
  assert.equal(instance.exiting, true, '重试成功后 exiting 必须置为 true');
  assert.ok(calls.includes('finish'), '重试成功后必须正常退出页面');
});

test('对抗测试 1.5: 底层抛出未捕获异常时的容错与锁释放验证', async () => {
  let fail = true;
  const hlMock = {
    stop() {
      if (fail) {
        throw new Error('XRCON_SOCKET_BROKEN');
      }
      return { ok: true };
    },
    save() { return { ok: true }; },
    isRunning() { return true; }
  };

  const { instance, calls } = await setupComponent(hlMock);
  
  // 触发异常
  instance.handleBack();
  
  assert.equal(instance.exiting, false, '抛出异常时 catch 块必须重置 exiting = false');
  assert.ok(!calls.includes('finish'), '发生异常时不应调用 finish');
  assert.match(instance.statusText, /XRCON_SOCKET_BROKEN/, '错误信息应当如实记录');

  // 修复后再次尝试
  fail = false;
  instance.handleBack();
  assert.equal(instance.exiting, true);
  assert.ok(calls.includes('finish'));
});

test('对抗测试 1.6: onUnload 在非 exiting 状态下安全终止', async () => {
  const opLog = [];
  let running = true;
  const hlMock = {
    stop() {
      opLog.push('stop');
      running = false;
      return { ok: true };
    },
    isRunning() { return running; }
  };

  const { instance } = await setupComponent(hlMock);
  
  // 场景 A: 正常退出已置 exiting = true，onUnload 不应重复调用 stop
  instance.exiting = true;
  instance.onUnload();
  assert.deepEqual(opLog, []);

  // 场景 B: 异常销毁（未通过 handleBack，exiting = false 且 isRunning 为 true）
  instance.exiting = false;
  instance.onUnload();
  assert.deepEqual(opLog, ['stop']);
});
