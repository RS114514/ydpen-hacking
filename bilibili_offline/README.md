# 哔哩哔哩离线缓存与本地管理

## 目录规范
- **B 站离线视频目录**：`/userdisk/Favorite/Bilibili/`
- **其他本地影片目录**：`/userdisk/Favorite/Movies/`
- 两者严格独立隔离，互不干扰。

## 架构与工作流
1. **播放器下载按钮**：
   - 位于视频详情与播放页右侧【评论区】正下方，呈现为独立胶囊按钮【下载】。
   - 保留原版左侧完整的播放控制栏（返回列表、暂停/播放、加减秒）。
2. **下载与缩略图提取**：
   - 触控监听守护进程：`/userdisk/bin/bili-tap-listener`
   - 下载执行脚本：`/userdisk/bin/bili-download`
   - 下载视频时，自动读取当前视频对应的真实 B 站封面（cover URL）并存为同名 `.jpg` 图片。
   - 若无可用的在线封面或属于其他格式，自动调用 `/bin/ffmpeg` 抽取视频第 1 秒画面作为真实封面，绝不使用死图。
3. **缓存 Tab 呈现**：
   - PenBili 小程序底栏第 5 个 Tab【缓存】。
   - 仅扫描并呈现 `/userdisk/Favorite/Bilibili/*.mp4` 中的 B 站离线内容。
   - 封面通过本地 HTTP 服务直接加载真实 `.jpg` 封面，告别千篇一律的错误缩略图。
