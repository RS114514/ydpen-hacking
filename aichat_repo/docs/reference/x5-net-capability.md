# Youdao X5 (Falcon/QuickJS) networking capability — evidence report

Scope: `PenBili-2.3.1\PenBili-2.3.1` in `C:\Users\PC\Desktop\AiPenChat`.
Question source: can we build an AI chat client that POSTs JSON to OpenAI/DeepSeek-compatible
LLM APIs over HTTPS with an `Authorization` header?

**Short answer: yes — but only through the bundled native module `libs/libjsapi_httpjson.so`
(`import('httpjson')`), using `startPost` + `takeResult` polling. No streaming/SSE, no true
cancellation, TLS verification effectively off (fallback), 60–120 s requests are fine.
Rebuilding/patching the `.so` is impossible on this machine (no `zig`).**

Note on paths requested: `docs\evidence\` does **not** exist. The evidence corpus is
`profiles\youdao-x5.md` (device profile, 379 lines) + `profiles\evidence\` (~200 `.txt`/`.png`
device artifacts) + `bilibili-x5-feasibility.md`. `native\` has **no README** (only `build.ps1`
comments). All files below are plain text and were read directly.

---

## A. JSON POST over HTTPS with custom headers

### A.1 The exact native API

Module: `libs/libjsapi_httpjson.so`, imported as `httpjson`. Five exports, registered in
`native\csrc\httpjson.c:651-665`:

```c
/* native\csrc\httpjson.c:651-665 */
static int httpjson_module_init(JSContext *ctx, JSModuleDef *m) {
    JSValue def = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, def, "postSync",   JS_NewCFunction(ctx, js_post_sync,    "postSync",   5));
    JS_SetPropertyStr(ctx, def, "startPost",  JS_NewCFunction(ctx, js_start_post,   "startPost",  4));
    JS_SetPropertyStr(ctx, def, "takeResult", JS_NewCFunction(ctx, js_take_result,  "takeResult", 1));
    JS_SetPropertyStr(ctx, def, "cancelAll",  JS_NewCFunction(ctx, js_cancel_all,   "cancelAll",  0));
    JS_SetPropertyStr(ctx, def, "getBinary",  JS_NewCFunction(ctx, js_get_binary,   "getBinary",  3));
    JS_SetModuleExport(ctx, m, "default", def);
    JS_SetModuleExport(ctx, m, "postSync",   JS_NewCFunction(ctx, js_post_sync,   "postSync",   5));
    ... (same five names re-exported as named exports)
}
```

Both import styles work: `m.startPost` and `m.default.startPost`.

#### `postSync` — EXISTS, but **synchronous (blocks QuickJS/UI thread)**

```c
/* native\csrc\httpjson.c:263-268 */
/* postSync(url, headers, body, timeoutMs[, mode])
 *   mode: 0/缺省 = 先校验证书，遇证书错误自动回退（结果 insecure=true）
 *         1       = 直接跳过证书校验（诊断用）
 *         2       = 严格校验，不回退
 * 返回 { status, body, error, curlCode, insecure }
 */
```

* Argument order/type: `url` string; `headers` string (or `null`/`undefined`) — **one string**,
  lines `"Key: value"` joined by `\r\n` or `\n`; `body` string (length taken with
  `JS_ToCStringLen`, so embedded NULs survive); `timeoutMs` int (`<=0` ⇒ 60000); `mode` int.
* Return: a **JS object**, not a string:

```c
/* native\csrc\httpjson.c:251-261 */
static JSValue build_result(JSContext *ctx, struct resp_buf *b, long status, int curlCode,
                            const char *errMsg, int insecure) {
    JSValue obj = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, obj, "status",   JS_NewInt32(ctx, (int)status));
    JS_SetPropertyStr(ctx, obj, "body",     JS_NewStringLen(ctx, b->data ? b->data : "", b->len));
    JS_SetPropertyStr(ctx, obj, "curlCode", JS_NewInt32(ctx, curlCode));
    JS_SetPropertyStr(ctx, obj, "insecure", JS_NewBool(ctx, insecure ? 1 : 0));
    if (errMsg) JS_SetPropertyStr(ctx, obj, "error", JS_NewString(ctx, errMsg));
    else        JS_SetPropertyStr(ctx, obj, "error", JS_NULL);
    return obj;
}
```

* Arg-count guard / arity (proves order): `httpjson.c:284-298` (`argc < 3` ⇒ TypeError
  `"httpjson.postSync(url, headers, body, timeoutMs[, mode])"`), and `httpjson.c:296-298`
  (`argv[3]`=timeoutMs, `argv[4]`=mode).
* `curl_easy_perform` is called **on the JS thread** (`httpjson.c:302-303`, `149`) ⇒ the UI
  freezes for the whole request. The header comment says it explicitly:
  `native\csrc\httpjson.c:19` — `同步接口 postSync 保留给诊断使用。`

#### `startPost` / `takeResult` — the async path (use this one)

```c
/* native\csrc\httpjson.c:517-518 */
/* startPost(url, headers, body, timeoutMs) -> 任务 id（0 表示失败） */
static JSValue js_start_post(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
```

* Argument order/type: `url` string; `headers` string | null; `body` string (verbatim);
  `timeoutMs` int (`<=0` ⇒ 60000, `httpjson.c:538-539`). Arity 4, min 3 args (`httpjson.c:528`).
  **There is no `mode` argument on `startPost`** (see E.3).
* Return value: `JS_NewInt32(ctx, j->id)` (`httpjson.c:590`), ids from a global counter starting
  at 1 (`g_next_id = 1`, `httpjson.c:404`, `571`). The comment "`0 表示失败`" is **stale** — real
  failures `JS_ThrowInternalError` (`httpjson.c:546,567,587`) instead of returning 0.
* The request runs on a **detached pthread**, so QuickJS is free (`httpjson.c:570-590`):

```c
/* native\csrc\httpjson.c:576-590 */
    if (pthread_create(&th, NULL, job_thread, j) != 0) { ...; return JS_ThrowInternalError(...); }
    pthread_detach(th);
    return JS_NewInt32(ctx, j->id);
```

* `takeResult(id)`: `null` while pending, otherwise **a JSON string** (not an object) that must be
  `JSON.parse`d (`httpjson.c:593-623`, `616`: `res = JS_NewString(ctx, j->result ? j->result : "{}")`).
  The string is produced by `marshal_result` with this exact shape and key order
  (`httpjson.c:455-471`):

```c
/* native\csrc\httpjson.c:455-471 */
static char *marshal_result(long status, int curlCode, const char *errMsg, struct resp_buf *b, int insecure) {
    ... buf_put(&out, "{\"status\":", 10); ...
    ... ",\"curlCode\":" ... ",\"insecure\":" ... ",\"error\":" ... ",\"body\":" ...
    buf_put_json_string(&out, b->data ? b->data : "", b->len);   /* body JSON-escaped, length-exact */
```

  ⇒ `{"status":200,"curlCode":0,"insecure":1,"error":null,"body":"{...LLM answer...}"}`
  Taking the result **frees** the job (`httpjson.c:613-621`); `takeResult` with a bad/consumed id
  returns `null` (`httpjson.c:601-612`).
* `cancelAll()` — see D.3.

### A.2 Is the body sent verbatim, or re-serialized?

**Verbatim.** The C code takes the JS string's byte length and hands the pointer straight to libcurl:

```c
/* native\csrc\httpjson.c:129-137 (do_post) */
    curl_easy_setopt(h, CURLOPT_URL, url);
    if (list) curl_easy_setopt(h, CURLOPT_HTTPHEADER, list);
    curl_easy_setopt(h, CURLOPT_POST, 1L);
    curl_easy_setopt(h, CURLOPT_POSTFIELDS, body);
    curl_easy_setopt(h, CURLOPT_POSTFIELDSIZE, bodyLen);
    curl_easy_setopt(h, CURLOPT_WRITEFUNCTION, write_cb);
    curl_easy_setopt(h, CURLOPT_WRITEDATA, out);
    curl_easy_setopt(h, CURLOPT_TIMEOUT_MS, timeoutMs);
    curl_easy_setopt(h, CURLOPT_CONNECTTIMEOUT_MS, 15000L);
```

with `bodyLen` from `JS_ToCStringLen(ctx, &bodyLen, argv[2])` (`httpjson.c:290`, `532`).
No `JSON.stringify`, no escaping, no content sniffing. Same for headers — the header string is
split on `\n`, trailing `\r`/spaces trimmed, each line appended to a `curl_slist`
(`httpjson.c:114-127`), so `Authorization: Bearer sk-...` and `Content-Type: application/json`
arrive byte-identical.

### A.3 Ready-made JS wrapper (already in the repo) + copy-paste usage

`src\services\net.js:139-213` is a generic "POST raw body with header lines" wrapper. It does not
inject form encoding, so it *is* a JSON POST if you pass JSON + JSON headers:

```js
/* src\services\net.js:139-147 */
export function headersToLines(headers) {
  const lines = [];
  if (!headers) return '';
  Object.keys(headers).forEach((k) => {
    const v = headers[k];
    if (typeof v === 'string' && v) lines.push(k + ': ' + v);
  });
  return lines.join('\r\n');
}

/* src\services\net.js:149-157 */
async function loadHttpJson() {
  try {
    const m = await import('httpjson');
    const mod = m && (typeof m.startPost === 'function' ? m : m.default);
    return mod || null;
  } catch (e) { return null; }
}

/* src\services\net.js:170 */
    id = mod.startPost(url, headerText, String(body == null ? '' : body), limit);
/* src\services\net.js:176-211 — polls every 150ms, rejects after limit+2000ms, resolves
   { statusCode: Number(r.status)||0, body: <string>, errorMessage: r.error ? String(r.error) : '' } */
```

Usage for an LLM call (works against the shipped `.so` as-is):

```js
import { httpPostForm } from './services/net.js';   // generic raw-body POST (native httpjson)

const res = await httpPostForm(
  'https://api.deepseek.com/chat/completions',
  JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], stream: false }),
  {
    timeout: 120000,                                 // CURLOPT_TIMEOUT_MS, ms
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-...'
    }
  }
);
// res = { statusCode, body, errorMessage }; res.body is the response text (parse with tryParseJson)
```

Calling the module directly (no dependency on net.js) if you prefer:

```js
const m = await import('httpjson');
const mod = (typeof m.startPost === 'function') ? m : m.default;
const id = mod.startPost(url, 'Content-Type: application/json\r\nAuthorization: Bearer sk-...',
                         jsonString, 120000);        // -> int id >= 1
// later, in a timer:
const raw = mod.takeResult(id);                      // null | JSON string
```

---

## B. Can jsapi `$falcon.jsapi.http.request` do POST JSON?

**No — not usable for raw JSON, and the "double JSON serialization" claim is about `data` in
general (any string body), not form bodies only.** The strongest evidence is the header comment of
the native module that was written specifically to replace this path:

```c
/* native\csrc\httpjson.c:1-8 */
/*
 * httpjson —— 有道词典笔 Falcon 原生 JSAPI（纯 C）
 *
 * 存在原因：运行时的 $falcon.jsapi.http.request 会对 data 字符串做二次 JSON 序列化
 * （httpbin 实测：Content-Length 明显大于原始 JSON，服务端 json 字段收到的是字符串），
 * 也无法通过任何开关发送原始请求体，导致 DeepSeek/GLM 等 OpenAI 兼容 API 返回 422。
 *
 * 本模块直接调用设备自带的 libcurl，把 JS 传入的字符串原样作为 POST body 发送。
 */
```

Supporting quotes:

* `src\services\net.js:136` — `// jsapi http 的 data 会被二次 JSON 序列化（deepseek-x5 实测）发不了 form → 只走 native。`
* `src\services\bili\reply.js:15` — `// 通过 client.postForm 走 native httpjson（原样 form body；jsapi POST 会二次 JSON 化不可用）。`
* `src\services\bili\qrlogin.js:10` — `// → code:0 {url, auth_code}（GET=405 必须 POST；原样 form body 需 native httpjson）`
* `bilibili-x5-feasibility.md:36` — `自定义头字段名是 header(单数)；不暴露响应头；非 2xx 拿不到响应体`
* `src\services\net.js:1-7` — runtime contract: success `{result:<body>}` (no statusCode),
  non-2xx `{error:3,result:{errorMessage:'curl ... resCode:N'}}`, response headers never visible.

Reading of the evidence (explicit):

* PROVEN: a **string** `data` is serialized a second time (the server's JSON body becomes a JSON
  *string*; `Content-Length` grows). This kills form POST **and** JSON POST equally — the claim is
  not form-specific. No runtime switch exists to send a raw body.
* PROVEN (negative evidence): the app never uses jsapi POST at all — `method: 'GET'` is the only
  method in the codebase (`src\services\net.js:113`), and every POST funnels through
  `httpPostForm` (`client.js:106-107`, `156-168`).
* NOT PROVEN here (speculation): what an **object** `data` produces (single serialization? which
  Content-Type?) is not documented anywhere in this repo. `httpjson.c:4-8` says the OpenAI-
  compatible 422 problem was the reason the whole path was abandoned, which implies the object
  path did not suffice either — but the mechanism is not recorded. Treat jsapi JSON POST as
  unsupported and use native.

---

## C. Streaming / SSE — **none exists. Definitively.**

Evidence (all of `httpjson.c`, plus `net.js`):

1. The only response callback is a whole-body accumulator; it never touches JS:

```c
/* native\csrc\httpjson.c:69-84 */
static size_t write_cb(char *ptr, size_t size, size_t nmemb, void *userdata) {
    struct resp_buf *b = (struct resp_buf *)userdata;
    size_t n = size * nmemb;
    if (b->len + n + 1 > b->cap) { ...cap *= 2... }
    memcpy(b->data + b->len, ptr, n);
    b->len += n;
    b->data[b->len] = '\0';
    return n;
}
```

2. Delivery is in one shot in all three paths: `postSync` → `JS_NewStringLen` of the whole body
   (`httpjson.c:255`); `takeResult` → one JSON string containing the whole body
   (`httpjson.c:616`, `marshal_result` `455-471`); `getBinary` → one `JS_NewArrayBufferCopy`
   (`httpjson.c:377`).
3. There is **no** `onData`/`onProgress`/chunk API anywhere: grep over `httpjson.c` for
   `postJSMessage|XFERINFO|PROGRESS|HEADERFUNCTION` → **no matches**; grep over `src\` for
   `onProgress|onData|EventSource|text/event-stream` → none (only unrelated hits).
4. The module surface is exactly the five functions in `httpjson.c:651-665`; `net.js` exposes only
   `httpGet`, `httpPostForm`, `httpGetBinary`, `cancelNativePosts` (`net.js:94,160,230,216`).

Consequence: a `stream:true` SSE response can only be delivered **after** the connection closes,
as one big string. Chunk-by-chunk rendering is impossible with the shipped `.so`.

If streaming is later required, the SDK already documents the two building blocks (both require a
**C source change + rebuild**, see G):

* `native\iot-miniapp-sdk\include\jsmodules\JSCModuleExtension.h:26-35` —
  `int postJSMessage(CJSMessageFunction func, void* context, int argc, char* argv[]);`
  with the comment `因为js函数不能跨线程调用用，所以一些后台任务的js回调，需要post到js线程来执行`
  (the worker thread could push each `write_cb` chunk to the JS thread);
* or a second, append-only buffer + a `takeChunk(id)` polling export in the same style as
  `takeResult` (pure addition to `httpjson.c`, no SDK callback needed);
* `native\iot-miniapp-sdk\include\jsapis\ExtensionProxyBase.h:82-95` shows the JSAPI-extension
  event route (`sendCustomEvent`, `$falcon.on("customEvent", ...)`) for a fully new module.

---

## D. Timeouts and cancellation

### D.1 Timeout semantics (milliseconds)

```c
/* native\csrc\httpjson.c:136-137 (do_post; do_get identical at 201-202) */
    curl_easy_setopt(h, CURLOPT_TIMEOUT_MS, timeoutMs);
    curl_easy_setopt(h, CURLOPT_CONNECTTIMEOUT_MS, 15000L);
/* native\csrc\httpjson.c:47-53 */
#define CURLOPT_TIMEOUT_MS 155
#define CURLOPT_CONNECTTIMEOUT_MS 156
```

* `timeoutMs` = **total transfer** timeout, ms; JS-supplied; `<=0` ⇒ default 60000
  (`httpjson.c:297`, `539`); `getBinary` default 30000 (`httpjson.c:350`).
* Connect timeout is hard-coded 15000 ms. No low-speed/read-idle timeout.
* JS layer defaults: `net.js:162` `const limit = o.timeout || 15000;`, `net.js:104` same for GET;
  the poll guard rejects at `limit + 2000` (`net.js:186-189`) and `httpGet` guards at `limit + 500`
  (`net.js:130`). **Pass `timeout: 120000` for LLM calls** — otherwise you abort at 17 s.
* Runtime jsapi GET has the same 15 s convention (`client.js:16 DEFAULT_TIMEOUT = 15000`).

### D.2 Is a 60–120 s request feasible without freezing the QuickJS UI thread?

**Yes — with `startPost`/`takeResult` only.** `startPost` spawns a detached pthread and returns the
id immediately (`httpjson.c:570-590`); `net.js` then polls with a JS timer
(`setInterval(..., 150)`, `net.js:176`, `211`), so the JS event loop keeps running. `takeResult`
only takes a mutex briefly and copies the finished body (`httpjson.c:605-622`).

**No — with `postSync` and `getBinary`**: both call `curl_easy_perform` directly on the JS thread
(`httpjson.c:149` reached from `269-303`; `214` reached from `333-353`). `net.js:241`
(`r = mod.getBinary(url, headersToLines(o.headers), limit);`) is therefore a *blocking* download —
the repo even works around it in the page by yielding between segments
(`src\pages\index\index.vue:979` `await new Promise((resolve) => setTimeout(resolve, 0));`).

Caveats for a chat client (all evidenced):

* Thread-per-request, no pool: each `startPost` does `pthread_create` + `pthread_detach`
  (`httpjson.c:576-589`).
* No `curl_global_init` anywhere in the module (grep: no matches). The device's libcurl is
  **7.77.0** (strings in `native\stubs\libcurl.so.4`: `libcurl/7.77.0`), whose lazy global init is
  not thread-safe (thread-safe only from 7.84). Keep **one in-flight POST at a time**, or add
  `curl_global_init` when you next rebuild.
* New curl handle per request → no keep-alive/TLS resumption; every LLM call pays a fresh TCP+TLS
  handshake (`curl_easy_init`/`curl_easy_cleanup` at `httpjson.c:109`/`161`).
* `CURLOPT_ACCEPT_ENCODING ""` is set (`httpjson.c:140`) ⇒ responses are transparently decompressed.

### D.3 Cancellation

```c
/* native\csrc\httpjson.c:625-649 */
/* cancelAll()：页面销毁时调用；进行中的任务标记取消，完成后自行回收 */
static JSValue js_cancel_all(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    ...
        if (j->state == 1) { *pp = j->next; free(...); }   /* finished → free */
        else { j->cancelled = 1; pp = &j->next; }          /* in flight → flag only */
```

* `cancelAll()` is the **only** cancellation primitive; there is no per-request cancel
  (`httpjson.c:651-665`).
* It does **not** abort in-flight I/O: the curl transfer keeps running until `CURLOPT_TIMEOUT_MS`
  expires; the worker then frees the job because `j->cancelled` is set
  (`httpjson.c:499-514`). Instant cancellation would require `CURLOPT_XFERINFOFUNCTION` and a
  checked flag — absent (grep: no matches) and would need a rebuild.
* App-level hook: `src\services\net.js:216-225` `cancelNativePosts()` → `mod.cancelAll()`
  (comment `net.js:215` `页面卸载时丢弃在途 native 请求（幂等）`).
* Practical recommendation: to "stop generating", stop polling and call `cancelAll()`; show the
  partial state from the last received body. A truly aborted HTTP request is not achievable today.

---

## E. TLS / HTTPS

### E.1 HTTPS works (device libcurl with OpenSSL)

`native\stubs\libcurl.so.4` is the **device** library (ARM EABI5 hard-float, `e_machine 40`), and
`tools\inspect_elf.py` reports:

```
  NEEDED   libcares.so.2
  NEEDED   libssl.so.1.1
  NEEDED   libcrypto.so.1.1
  NEEDED   libz.so.1
  NEEDED   libc.so.6
  SONAME   libcurl.so.4
```

plus the version string `libcurl/7.77.0` and `SSL certificate problem: %s`.

### E.2 Verification is effectively OFF (no CA store on the device)

* `profiles\youdao-x5.md:160-162`:
  `设备无 CA 证书库：笔端 curl https://api.bilibili.com/... → curl: (60) SSL certificate problem:
  unable to get local issuer certificate（须 -k）。运行时 jsapi http 与 ffmpeg 不校验证书`
* `bilibili-x5-feasibility.md:37`: `HTTPS: 无 CA 库（/etc/ssl/certs 为空），但运行时与 ffmpeg 都不校验证书 → 可直连 https`
* `bilibili-x5-feasibility.md:50`: `笔上 curl 直连 https 默认证书校验失败（无 CA），-k 后正常`.

### E.3 TLS knobs in the native module (verify-then-fallback, automatic)

```c
/* native\csrc\httpjson.c:141-147 */
    if (insecure) {
        curl_easy_setopt(h, CURLOPT_SSL_VERIFYPEER, 0L);
        curl_easy_setopt(h, CURLOPT_SSL_VERIFYHOST, 0L);
    } else {
        curl_easy_setopt(h, CURLOPT_SSL_VERIFYPEER, 1L);
        curl_easy_setopt(h, CURLOPT_SSL_VERIFYHOST, 2L);
    }
```

```c
/* native\csrc\httpjson.c:263-266 (postSync modes)  +  230-247 (cert error codes) */
/*   mode: 0/缺省 = 先校验证书，遇证书错误自动回退（结果 insecure=true）
 *         1       = 直接跳过证书校验（诊断用）
 *         2       = 严格校验，不回退 */
static int is_cert_error(int code) { case 35: case 51: case 58: case 59: case 60:
                                     case 66: case 77: case 83: case 90: case 91: return 1; ... }
```

```c
/* native\csrc\httpjson.c:305-316 — the fallback actually retries the whole POST */
    if (errMsg && mode == 0 && is_cert_error(curlCode)) {
        ... do_post(url, headers ? headers : "", body, (long)bodyLen, (long)timeoutMs, 1,
                    &b, &status, &curlCode, &errMsg);
        insecure = 1;
    }
```

* Default (`mode 0`) = "try verified, on a cert error redo the request with verification disabled
  and flag `insecure:true`". `getBinary` uses the same policy unconditionally (`httpjson.c:354-363`).
* **The async path (`startPost`) has no `mode` argument and always runs `mode = 0`**
  (`j->mode = 0;` `httpjson.c:557`; fallback in `job_thread` `484-494`). So every HTTPS call made
  through `startPost`/`net.js` pays one failed TLS handshake before succeeding, and the result
  carries `insecure: 1`. To skip the wasted handshake you must either use the synchronous
  `postSync(url, headers, body, timeout, 1)` (blocks the UI) or patch the C source (needs `zig`).
* `CURLOPT_FOLLOWLOCATION, 1L` (`httpjson.c:138`) ⇒ 301/302 followed, matching the runtime's
  documented behaviour (`profiles\youdao-x5.md:120-123`). (libcurl's own rules govern whether
  custom `Authorization` survives a cross-host redirect — irrelevant for OpenAI/DeepSeek endpoints
  that do not redirect; no repo evidence about header forwarding.)
* No scheme restriction: `curl_easy_setopt(h, CURLOPT_URL, url)` with no validation
  (`httpjson.c:129`) ⇒ plain `http://` also works (e.g. a LAN relay).
* On-device HTTPS-by-native proof: the TV passport QR login is an HTTPS **form POST** executed by
  this module — `profiles\youdao-x5.md:237`
  (`GET=405 必须 POST → form 原样 body 走 native libjsapi_httpjson.so（zig 自编，双 so 入包）`)
  — and it succeeded on device: `profiles\evidence\app1_20260923-125355_log.txt:63,71`
  `[bili] session restored mid=1015677450 uname=56dz` (cookie obtained ⇒ HTTPS POST returned 200).

### E.4 Implementation notes (libcurl documented behaviour, not repo evidence)

* libcurl sets `Content-Type: application/x-www-form-urlencoded` automatically for
  `CURLOPT_POSTFIELDS`; our explicit `Content-Type: application/json` line overrides it (that is
  what the slist at `httpjson.c:130` is for).
* libcurl adds `Expect: 100-continue` for POST bodies > 1024 bytes. To suppress it you need a
  header line `Expect:` with an empty value — which `net.js:84` drops (`if (typeof v === 'string' && v)`),
  but the C side trims trailing spaces (`httpjson.c:121`), so passing the value `' '`
  (single space) lands as `Expect:` in the slist and suppresses it. Worth doing for long prompts.

---

## F. Response size limits

* **jsapi http truncates large bodies** — `profiles\youdao-x5.md:350`:
  `坑2：jsapi http 拿二进制废（1.2MB 被截成 2/193 字节）→ native httpjson.getBinary`
  and `src\services\net.js:228`:
  `// jsapi http 实测把 1.2MB body 截成 2 字节（0x22…）不可用——只有 native curl 能保字节。`
* **Native path has no truncation and no cap**: `write_cb` doubles the buffer as needed
  (`httpjson.c:72-79`), `takeResult`/`postSync` return the full body with an explicit length
  (`JS_NewStringLen`, `httpjson.c:255`), `getBinary` uses `JS_NewArrayBufferCopy` on `b.len`
  (`httpjson.c:377`).
* Device-proven large bodies: fixture `api-mock\fixtures\dm_seg.bin` = 1,236,855 bytes fetched via
  `getBinary`; `profiles\evidence\app1_20260925-002212_log.txt:79`
  `[bili] danmaku real n=497 pkgs=3 span=0..1056316` and
  `profiles\evidence\app1_20260925-070108_log.txt:89`
  `[bili] danmaku real n=601/602 pkgs=7 span=0..2301088` (multi-MB across packages, bytes intact).
* Real limits are RAM and copies, not the module: device has `MemTotal 352 MB`,
  `MemAvailable 175~222 MB` (`bilibili-x5-feasibility.md:32`). For `takeResult` the peak is
  ~2–3× the body (C buffer → JSON-escaped string → `JSON.parse`d copy). A few-hundred-KB LLM
  response is comfortable; QuickJS 20200705 string-size ceilings were not probed here (unverified).

---

## G. Packaging and importing a native module

### G.1 Exact import

```js
/* src\services\net.js:149-157 */
async function loadHttpJson() {
  try {
    const m = await import('httpjson');
    const mod = m && (typeof m.startPost === 'function' ? m : m.default);
    return mod || null;
  } catch (e) { return null; }
}
```

Convention (only two native imports exist in the whole app — grep `import('` over `src\`):
`src\services\player.js:35` `const m = await import('player');` (file `libs/libjsapi_player.so`,
`player.js:1`) and `net.js:151` `await import('httpjson')` (file `libs/libjsapi_httpjson.so`,
`net.js:137`). So: **`.so` named `libjsapi_<name>.so` ↔ `import('<name>')`**, the name being
self-registered from inside the library:

```c
/* native\csrc\httpjson.c:683-687 */
extern void registerCModuleLoader(const char *moduleName, LoadCModuleFunction loader);
JQUICK_EXPORT void custom_init_jsapis(void) {
    registerCModuleLoader("httpjson", &httpjson_module_load);
}
```

(identical convention in the official SDK macro `DEF_MODULE_EXPORT_FUNC`, `jqmisc.h:97-104`;
`JQUICK_EXPORT` = `__attribute__((visibility("default")))`, `jquick_config.h:9`. The `dlopen`
side lives in the closed `libfalcon.so`, not in this repo — the file-name ↔ module-name rule is
inferred from the two working modules.)

### G.2 Where the `.so` must live in the AMR

`PenBili.amr` is a ZIP; its entries (read directly):

```
app.js.bin                     1140
app_icon.png                   4939
base-page-dca68d51.js.bin      2171
diag.js.bin                   13542
index.js.bin                  82508
manifest.json                   916
player-479c1847.js.bin        30548
libs/libjsapi_httpjson.so     15072
libs/libjsapi_player.so       32372
```

`manifest.json` inside the AMR carries integrity data for the libs:

```json
    "libs/libjsapi_httpjson.so": { "size": 15072, "md5": "d1b6efb6c3993841a5d5b84aad4de687" },
    "libs/libjsapi_player.so":   { "size": 32372, "md5": "d21601cac816e801195fb680ee8274c8" }
```

Source side: put the files in the app's `libs\` folder; `aiot-vue-cli` copies them verbatim
(comment `native\build.ps1:5` `产物由 aiot-vue-cli 原样打包进 AMR libs/`; the `.falcon_\libs\`
staging dir in the sibling copy confirms it). On install the runtime flattens + renames them
(`profiles\youdao-x5.md:51` and `:178`):
`装机后 native 库被展平重命名：<slot>/libs/libjsapi_player_<hash>.so` — the rename does not break
`import('player')`, again because the name is self-registered.

### G.3 `libs\` inventory (workspace, verified)

| file | bytes | MD5 | SHA-256 | ELF |
|---|---|---|---|---|
| `libs\libjsapi_httpjson.so` | 15 072 | `d1b6efb6c3993841a5d5b84aad4de687` | `6360C3C8F278CB4B1F45D4A1FCEB55D7F2B65D3E270D7E41467D45BFE9BFC3A8` | ARM EABI5 hard-float DYN, SONAME `libjsapi_httpjson.so`, NEEDED `libquickjs.so`, `libcurl.so.4`, `libc.so.6`, `libpthread.so.0`, max GLIBC 2.4, exports `custom_init_jsapis` |
| `libs\libjsapi_player.so` | 32 372 | `d21601cac816e801195fb680ee8274c8` | `0EFF4E115B2C80CC7193AB089906691DDF9D8C2FBF3FEB59BD7FC92158BBEF8E` | ARM EABI5 hard-float DYN, NEEDED `libquickjs.so`, `libc.so.6`, `libpthread.so.0`, GLIBC ≤2.17 |

(both inspected with `tools\inspect_elf.py`, which is exactly the pre-packaging gate in
`build.ps1:49-52` and `tools\deploy.ps1:57-58`).

### G.4 Can the existing `.so` be reused as-is in a new app? — **YES** (no rebuild needed)

* `libs\libjsapi_httpjson.so` is **byte-identical** to the copy shipped inside `PenBili.amr` and to
  the sibling checkout (`C:\Users\PC\Desktop\PenBili-main\libs\...`, same MD5) — i.e. it is the
  already device-verified artifact.
* It depends only on firmware-provided libs (`libcurl.so.4`, `libquickjs.so`, libc/libpthread) and
  on nothing app-specific: it is a plain JSAPI module registering the name `httpjson`.
* What it already proves on a real pen (fw 3.4.6): HTTPS form POST with custom headers (TV passport
  login → `session restored ...`), certificate-error fallback, and 1.2 MB+ binary GET.
* For the chat client you only need this one file copied to `<newapp>\libs\libjsapi_httpjson.so`;
  `libjsapi_player.so` is the ffmpeg/fb video player and irrelevant to chat.

### G.5 Toolchain required to rebuild it — and its presence on THIS machine

`native\build.ps1` (the whole recipe):

```powershell
# native\build.ps1:7-18
$base = Split-Path -Parent $PSScriptRoot
$zig = $env:ZIG_EXE
if (-not $zig) {
  $cand = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'env\pyzig\ziglang\zig.exe'
  if (Test-Path $cand) { $zig = $cand }
}
if (-not $zig -or -not (Test-Path $zig)) { Write-Error '找不到 zig：请设置 ZIG_EXE 指向 zig.exe（ziglang.org 或 pip install ziglang）' }

# native\build.ps1:20-45
$common = @(
  'cc', '-target', 'arm-linux-gnueabihf.2.23', '-O2', '-g0', '-Wl,-s', '-fPIC', '-shared', '-fvisibility=hidden',
  '-I', "$base\native\iot-miniapp-sdk\include"
)
$hargs = $common + @(
  '-o', "$base\libs\libjsapi_httpjson.so",
  "$base\native\csrc\httpjson.c",
  "$base\native\stubs\libquickjs.so",
  "$base\native\stubs\libcurl.so.4",
  '-lpthread',
  '-Wl,-soname,libjsapi_httpjson.so'
)
& $zig @hargs
# native\build.ps1:47-52 → then python tools\inspect_elf.py on both .so
```

i.e. **zig** (repo claims `zig 0.16`, used as a C cross-compiler for
`arm-linux-gnueabihf.2.23`; per `profiles\youdao-x5.md:22` `toolchain: "zig 0.16 cc -target
arm-linux-gnueabihf.2.23（env/pyzig），纯 C，无 libstdc++ 依赖"`), plus **python** for the ELF gate.

Measured on this machine:

| check | result |
|---|---|
| `Get-Command zig` | nothing (not on PATH) |
| `$env:ZIG_EXE` | empty |
| `…\PenBili-2.3.1\PenBili-2.3.1\env\pyzig\ziglang\zig.exe` (build.ps1 fallback) | `False` |
| `C:\Users\PC\Desktop\AiPenChat\env\pyzig\ziglang\zig.exe` | `False` |
| `C:\Users\PC\Desktop\env\pyzig\ziglang\zig.exe` | `False` (no `env\` dir exists) |
| shallow search `C:\Users\PC\Desktop -Recurse -Depth 5 -Filter zig*` | no hits |
| `zig.exe` under `%LOCALAPPDATA%\Programs`, `C:\Python314\Lib\site-packages`, scoop, chocolatey, `C:\Program Files`, `C:\zig`, `C:\tools` | no hits |
| `python -m pip show ziglang` | `WARNING: Package(s) not found: ziglang` |
| `python` | present: `C:\Python314\python.exe` |
| `node` | present: `C:\Program Files\nodejs\node.exe` |

⇒ **Rebuilding/patching `libjsapi_httpjson.so` is not possible on this machine as-is.** Install zig
first (`pip install ziglang` reproduces the repo's own `env\pyzig\ziglang\zig.exe` layout, or fetch
from ziglang.org), then `$env:ZIG_EXE='…\zig.exe'; npm run native`. Anything that needs SSE
streaming, response-header capture, instant cancellation, `mode=1` on the async path, or
`curl_global_init` **requires** that install.

Related packaging tool (JS side, no zig needed): `package.json:18` expects
`../env/node_modules/aiot-vue-cli/src/cli.js` — absent in this workspace. A working
**aiot-vue-cli 1.0.32** (bin `aiot-cli`, with `cli-libs\aiot-qjsc-tool\assets\bin\win32\qjsc20200705.exe`)
exists outside the workspace at `C:\Users\PC\Desktop\PenBili-main\node_modules\aiot-vue-cli`.
The workspace itself has **no** `node_modules` (`Test-Path` → `False`), so `npm ci` would be needed
before building a new app.

---

## Bottom line for the AI chat client

1. Transport: `await import('httpjson')` → `startPost(url, headerLines, jsonString, ms)` +
   `takeResult(id)` polling; body goes out **verbatim**; headers are `"K: v"` lines joined `\r\n`.
   Ready-made: `httpPostForm(url, jsonString, { headers, timeout })` from `src\services\net.js`.
2. Set `Content-Type: application/json` and `Authorization: Bearer …` explicitly; pass
   `timeout: 90000–120000` (default 15 s would abort; the poll guard is `timeout+2000`).
3. Never use `postSync` or `getBinary` for chat (they block the QuickJS thread); `startPost` runs on
   its own pthread, so a 2-minute LLM call cannot freeze the UI.
4. Streaming: not possible with the shipped `.so`; send `stream:false` (or accept the whole SSE text
   at the end). Adding real streaming means editing `httpjson.c` + rebuilding with zig (absent here).
5. Cancellation: `cancelAll()` only discards results; an in-flight request keeps running until its
   `timeoutMs` expires.
6. HTTPS: supported by the device's libcurl 7.77.0/OpenSSL 1.1, but with no CA store the module
   always ends up unverified (one wasted handshake, `insecure:1` in the result). This is invisible
   at the JS layer (`net.js` drops the field) — worth surfacing for diagnostics.
7. Sizes: no truncation on the native path (1.2 MB–2.3 MB proven on device), unlike jsapi http
   (1.2 MB → 2 bytes). RAM (352 MB total) and the ~2–3× transient copies are the real ceiling.
8. Packaging: drop the existing 15 072-byte `libs\libjsapi_httpjson.so` (MD5 `d1b6efb6…`) into the
   new app's `libs\`, keep `import('httpjson')`, and pack with aiot-vue-cli — the runtime installs it
   as `libs/libjsapi_httpjson_<hash>.so` and the module name still resolves.
