<template>
  <div class="screen">
    <!-- 顶栏 -->
    <div class="topbar">
      <div class="backbtn press" @click="goBack"><text class="backtext">〈 返回</text></div>
      <text class="pathtext">{{ scanning ? (path + ' · 扫描中…') : (path + ' · ' + videos.length + ' 个') }}</text>
    </div>

    <scroller class="list" show-scrollbar="false">
      <div class="emptywrap" v-if="!scanning && folders.length === 0 && videos.length === 0">
        <text class="emptytip">这里没有视频文件。去别的文件夹看看，或把 mp4/mkv 复制进笔里。</text>
      </div>
      <div v-for="f in folders" :key="'d' + f.key" class="row press" @click="enter(f.path)">
        <div class="glyphbox gdir"><text class="glyphtext">夹</text></div>
        <div class="rowmain">
          <text class="rowtitle">{{ f.name }}</text>
          <text class="rowmeta">文件夹</text>
        </div>
        <text class="chev">〉</text>
      </div>
      <div v-for="v in videos" :key="v.path" class="row press" @click="playVideo(v)">
        <div class="glyphbox gvid"><text class="glyphtextacc">▶</text></div>
        <div class="rowmain">
          <text class="rowtitle">{{ v.name }}</text>
          <text class="rowmeta">{{ v.meta }}</text>
        </div>
        <text class="chev">〉</text>
      </div>
      <div class="listpad"></div>
    </scroller>

    <app-toast></app-toast>
  </div>
</template>

<script>
import fs from '../../utils/pen-fs.js'
import lib from '../../utils/library.js'
import quality from '../../utils/quality.js'
import device from '../../utils/device.js'
import appToast from '../../components/app-toast.vue'

const ROOT = '/userdisk'

export default {
  components: { 'app-toast': appToast },
  data() {
    return {
      path: ROOT,
      folders: [],
      videos: [],
      scanning: false
    }
  },
  methods: {
    toast(text, ms) {
      $falcon.trigger('bpv-toast', { text, ms })
    },
    goBack() {
      if (this.path !== ROOT) {
        this.enter(lib.parentOf(this.path) || ROOT)
        return
      }
      this.$page.finish()
    },
    // 进入目录：列一级子目录 + 有限深度递归扫描该目录下的视频
    async enter(path) {
      this.path = path
      const gen = ++this._scanGen
      this.scanning = true
      this.videos = []
      this.folders = []
      const screen = await device.detectScreen()
      try {
        const result = await lib.scanVideos(fs, path, { maxDepth: 4, maxFound: 200 })
        if (gen !== this._scanGen) return
        this.folders = result.folders.map(p => ({
          path: p,
          name: p.slice(p.lastIndexOf('/') + 1),
          key: p
        }))
        this.videos = result.videos.map(v => {
          const hint = quality.parseResolutionFromName(v.name)
          const res = hint ? (hint.height >= 2160 ? '4K' : hint.height + 'P') : ''
          const smooth = hint && (hint.width > screen.w || hint.height > screen.h) ? ' · 自动流畅' : ''
          return {
            path: v.path,
            name: v.name,
            meta: (res + smooth).replace(/^ · /, ''),
            key: v.path
          }
        })
      } catch (e) {
        if (gen !== this._scanGen) return
        this.toast('目录读取失败')
      }
      this.scanning = false
    },
    playVideo(v) {
      $falcon.navTo('player', { path: v.path, name: v.name })
    }
  },
  // 本运行时不调用页面根组件的 onLoad：导航参数从 this.$page.options 取
  async mounted() {
    const o = (this.$page && this.$page.options) || {}
    this._scanGen = 0
    await this.enter(String(o.path || ROOT))
  }
}
</script>

<style lang="less" scoped>
@import "../../styles/common.less";
.screen {
  width: 100vw;
  height: 100vh;
  background-color: #0b0f14;
}
.topbar {
  position: absolute;
  left: 0vw;
  top: 0vh;
  width: 100vw;
  height: 13vh;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 2vw;
  border-bottom-width: 1px;
  border-bottom-color: #263340;
}
.backbtn {
  padding: 0.6vh 2vw;
  margin-right: 1.5vw;
}
.backtext {
  color: #4fd6c3;
  font-size: 4.6vh;
}
.pathtext {
  color: #8ca0ad;
  font-size: 3.9vh;
  lines: 1;
  text-overflow: ellipsis;
}
.list {
  position: absolute;
  left: 0vw;
  top: 13.5vh;
  width: 100vw;
  height: 85.5vh;
}
.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 1.4vh 2vw;
  border-bottom-width: 1px;
  border-bottom-color: #1a2430;
}
.glyphbox {
  width: 6.5vw;
  height: 13vh;
  border-radius: 1vw;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gdir {
  background-color: #19242f;
}
.gvid {
  background-color: #123a37;
}
.glyphtext {
  color: #8ca0ad;
  font-size: 4.4vh;
}
.glyphtextacc {
  color: #4fd6c3;
  font-size: 4.4vh;
}
.rowmain {
  flex: 1;
  margin-left: 1.5vw;
}
.rowtitle {
  color: #e8eef2;
  font-size: 4.4vh;
  lines: 1;
  text-overflow: ellipsis;
}
.rowmeta {
  color: #8ca0ad;
  font-size: 3.5vh;
}
.chev {
  color: #263340;
  font-size: 5vh;
}
.listpad {
  height: 4vh;
}
.emptywrap {
  padding: 6vh 4vw;
}
.emptytip {
  color: #8ca0ad;
  font-size: 4.2vh;
  line-height: 6.5vh;
}
</style>
