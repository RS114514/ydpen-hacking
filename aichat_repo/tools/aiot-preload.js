/*
 * aiot-vue-cli 兼容垫片（让 aiot-vue-cli@1.0.32 能在 Node >= 12 上加载）
 *
 * 病因（本机 Node 24 实测）：aiot-vue-cli 的 src/cli.js 在**模块加载期**就
 *   require('./cli-actions/web') → require('webpack-dev-server')
 *     → require('spdy') → require('http-deceiver')
 *       → process.binding('http_parser')      ← Node 12 起已删除该内部 binding
 * 于是 `node cli.js` 在任何 Node >= 12 上都以
 *   `Error: No such module: http_parser`
 * 直接崩掉，连 `--help` 都到不了。
 *
 * 修法：把 process.binding('http_parser') 补回来。http-deceiver 在**加载期**
 * 只需要三样东西（见 node_modules/http-deceiver/lib/deceiver.js:22-38）：
 *   HTTPParser 构造器、HTTPParser.methods（HTTP 动词表）、kOnHeaders/… 四个数字常量。
 * 补上这些就够它安全加载；真正的 HTTP/2 解析路径（dev-server 的 h2 支持）本工程不用，
 * 因此这里不实现 parse 逻辑。
 *
 * 为什么不直接把 webpack-dev-server 整个垫成桩：那样 `aiot-cli build-web` /
 * `preview`（浏览器预览）就没法用了——它们要真的 dev-server。补 binding 是修根因，
 * 打包与 web 预览两条路都能走。
 *
 * 用法（tools/build.js 已自动带上）：
 *   node --require <本文件> <aiot-vue-cli>/src/cli.js -q -p
 */
'use strict';

// 与 Node 内置 parser 一致的 HTTP 动词顺序（http-deceiver 用它做 method ↔ 序号映射）
const HTTP_METHODS = [
  'DELETE', 'GET', 'HEAD', 'POST', 'PUT', 'CONNECT', 'OPTIONS', 'TRACE', 'COPY',
  'LOCK', 'MKCOL', 'MOVE', 'PROPFIND', 'PROPPATCH', 'SEARCH', 'UNLOCK', 'BIND',
  'REBIND', 'UNBIND', 'ACL', 'REPORT', 'MKACTIVITY', 'CHECKOUT', 'MERGE',
  'M-SEARCH', 'NOTIFY', 'SUBSCRIBE', 'UNSUBSCRIBE', 'PATCH', 'PURGE',
  'MKCALENDAR', 'LINK', 'UNLINK', 'SOURCE', 'PRI'
];

class HTTPParserShim {
  constructor(type, options) {
    this.type = type;
    this.options = options || {};
  }
  // 真实解析不会走到（本工程只用打包与 web 预览，不用 dev-server 的 h2 服务）
  execute() {
    throw new Error('[aiot-preload] HTTPParserShim.execute 未实现（本工程不需要 h2 解析）');
  }
  finish() {}
  pause() {}
  resume() {}
  close() {}
}

HTTPParserShim.methods = HTTP_METHODS;
HTTPParserShim.kOnHeaders = 0;
HTTPParserShim.kOnHeadersComplete = 1;
HTTPParserShim.kOnMessageComplete = 2;
HTTPParserShim.kOnBody = 3;
HTTPParserShim.kOnExecute = 4;
HTTPParserShim.REQUEST = 0;
HTTPParserShim.RESPONSE = 1;

const originalBinding = typeof process.binding === 'function' ? process.binding.bind(process) : null;

if (originalBinding) {
  process.binding = function patchedBinding(name) {
    if (name === 'http_parser') {
      return { HTTPParser: HTTPParserShim, methods: HTTP_METHODS };
    }
    return originalBinding(name);
  };
}

if (process.env.AIOT_PRELOAD_VERBOSE === '1') {
  process.stderr.write('[aiot-preload] 已补回 process.binding("http_parser") 垫片\n');
}
