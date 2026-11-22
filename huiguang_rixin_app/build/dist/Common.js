// common.js —— 基础辅助与原生接口桥接

export function log(msg) {
  console.log('[AVG] ' + msg);
}

export function playSound(name) {
  try {
    if (typeof $falcon !== 'undefined' && $falcon.jsapi && $falcon.jsapi.media) {
      $falcon.jsapi.media.playSe('/userdisk/huiguang_rixin/audio/' + name + '.opus');
    }
  } catch (e) {
    log('playSound err: ' + e);
  }
}

export function playBgm(name) {
  try {
    if (typeof $falcon !== 'undefined' && $falcon.jsapi && $falcon.jsapi.media) {
      $falcon.jsapi.media.playBgm('/userdisk/huiguang_rixin/audio/' + name + '.opus', true);
    }
  } catch (e) {
    log('playBgm err: ' + e);
  }
}
