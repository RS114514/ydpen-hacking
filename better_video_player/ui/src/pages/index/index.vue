<template>
  <div class="screen">
    <div class="header">
      <text class="title">更好的视频</text>
      <div class="findbtn press" @click="goFiles"><text class="findtext">＋ 找视频</text></div>
    </div>

    <scroller class="list" show-scrollbar="false">
      <!-- 继续播放 -->
      <div class="resume press" v-if="resume" @click="playPath(resume.path, resume.name)">
        <div class="glyphbox"><text class="glyphtext">▶</text></div>
        <div class="resumemain">
          <text class="resumetitle">{{ resume.name }}</text>
          <text class="resumemeta">上次看到 {{ fmtTime(resume.positionMs) }} · {{ pct(resume) }}%</text>
        </div>
        <text class="chev">〉</text>
      </div>

      <!-- 历史 -->
      <text class="sectitle" v-if="historyList.length > 0">播放历史</text>
      <div v-for="(it, i) in historyList" :key="it.path" class="row press" @click="playPath(it.path, it.name)">
        <div class="glyphbox small"><text class="glyphtextdim">{{ i + 1 }}</text></div>
        <div class="rowmain">
          <text class="rowtitle">{{ it.name || it.path }}</text>
          <text class="rowmeta">{{ pct(it) }}% · {{ fmtTime(it.positionMs) }}{{ it.durationMs > 0 ? ' / ' + fmtTime(it.durationMs) : '' }}</text>
        </div>
        <text class="chev">〉</text>
      </div>
      <div class="emptywrap" v-if="historyList.length === 0 && !resume">
        <text class="emptytip">还没有播放记录。点右上角「找视频」，看看笔里有什么能看的。</text>
      </div>
      <div class="listpad"></div>
    </scroller>

    <app-toast></app-toast>
  </div>
</template>

<script>
import history from '../../utils/history.js'
import { fmtTime } from '../../utils/fmt.js'
import * as fs from '../../utils/pen-fs.js'
import * as lib from '../../utils/library.js'
import appToast from '../../components/app-toast.vue'

export default {
  components: { 'app-toast': appToast },
  data() {
    return {
      historyList: [],
      resume: null
    }
  },
  methods: {
    fmtTime,
    pct(it) {
      if (!it || !it.durationMs) return 0
      return Math.min(100, Math.round((it.positionMs || 0) / it.durationMs * 100))
    },
    playPath(path, name) {
      $falcon.navTo('player', { path, name: name || '' })
    },
    goFiles() {
      $falcon.navTo('files', {})
    },
    async refresh() {
      try {
        const st = await history.load()
        this.historyList = history.sorted(st.entries).slice(0, 20)
        this.resume = history.resumeCandidate(st.entries)
      } catch (e) {
        this.historyList = []
        this.resume = null
      }
    }
  },
  mounted() {
    // ---- TEMP TEST HOOK（验证后移除）----
    setTimeout(async () => {
      try {
        const r = await lib.scanVideos(fs, '/userdisk/Favorite/一些番剧', { maxDepth: 1, maxFound: 1 })
        if (r.videos.length > 0) {
          $falcon.trigger('bpv-toast', { text: 'TEST play ' + r.videos[0].name, ms: 6000 })
          $falcon.navTo('player', { path: r.videos[0].path, name: r.videos[0].name })
        } else {
          $falcon.trigger('bpv-toast', { text: 'TEST: 该目录未扫到视频', ms: 6000 })
        }
      } catch (e) {
        $falcon.trigger('bpv-toast', { text: 'TEST ERR ' + e, ms: 6000 })
      }
    }, 2500)
  },
  async onShow() {
    await this.refresh()
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
.header {
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
.title {
  color: #e8eef2;
  font-size: 6vh;
  flex: 1;
}
.findbtn {
  background-color: #123a37;
  border-radius: 1.2vw;
  padding: 0.8vh 2vw;
}
.findtext {
  color: #4fd6c3;
  font-size: 4.6vh;
}
.list {
  position: absolute;
  left: 0vw;
  top: 13.5vh;
  width: 100vw;
  height: 85.5vh;
}
.resume {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 1vh 2vw;
  padding: 1vh 1.5vw;
  background-color: #123a37;
  border-radius: 1.2vw;
}
.glyphbox {
  width: 6vw;
  height: 12vh;
  background-color: #0b3b37;
  border-radius: 1vw;
  display: flex;
  align-items: center;
  justify-content: center;
}
.glyphbox.small {
  background-color: #19242f;
}
.glyphtext {
  color: #4fd6c3;
  font-size: 5.4vh;
}
.glyphtextdim {
  color: #8ca0ad;
  font-size: 4.4vh;
}
.resumemain {
  flex: 1;
  margin-left: 1.5vw;
}
.resumetitle {
  color: #e8eef2;
  font-size: 4.8vh;
  lines: 1;
  text-overflow: ellipsis;
}
.resumemeta {
  color: #8ca0ad;
  font-size: 3.8vh;
}
.chev {
  color: #263340;
  font-size: 5vh;
}
.sectitle {
  color: #8ca0ad;
  font-size: 4vh;
  margin: 1.5vh 2vw 0;
}
.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 1.2vh 2vw;
  border-bottom-width: 1px;
  border-bottom-color: #1a2430;
}
.rowmain {
  flex: 1;
  margin-left: 1.5vw;
}
.rowtitle {
  color: #e8eef2;
  font-size: 4.6vh;
  lines: 1;
  text-overflow: ellipsis;
}
.rowmeta {
  color: #8ca0ad;
  font-size: 3.6vh;
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
