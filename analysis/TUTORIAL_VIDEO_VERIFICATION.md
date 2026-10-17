# 网站教程视频入口

2026-10-17：按用户截图，在顶部模型状态左侧加入「▶ 使用教程」。使用相对地址 `./media/openresty-tutorial.mp4`，原生链接以新标签页打开浏览器播放器，保留原查询页。

## 视频与实施

- 来源为用户更换BGM后导出的 `video/openresty-quickstart-20261017/out/OpenResty使用教程-固定男声-可编辑版.mov`，269264502字节、210.047710秒。
- 网页文件为 `site/media/openresty-tutorial.mp4`，17901353字节、1920×1080、210.047710秒。H.264 CRF20、fast预设，MP4 faststart；AAC音频直接复制，源与输出音频包SHA256完全一致。没有修改用户MOV或重新混音。
- 正常构建和部署打包均复制整个site目录，媒体随页面进入dist。临时预览、Node同源服务及OpenResty部署模板补充MP4类型支持。
- 本机OpenResty的pi-site只增量更新index.html、styles.css与该MP4；现行配置只增加MP4后缀与MIME类型，检查成功后平滑重载。原认证、API和知识发布保持原实现。本批没有重建Pi容器镜像，运行网站静态文件由OpenResty提供，后续打包会收录源目录中的媒体。
- 回退副本在 `deployment/pi/.local/tutorial-backup-20261017/`，包含原入口配置及两个静态文件；实际部署位置在其中deployment.json记录。

## 验证结果

1. `npm run build`成功，知识发布仍为 `1.27.1.1-20040b374943dabc`。
2. 网站启动、Agent UI、Pi同源网站与部署打包相关52项测试通过；修改文件语法和diff空白检查通过。
3. Node临时隔离实例对MP4 HEAD返回200、`video/mp4`。
4. 本机实际 `http://localhost:30000/pi/` 页面看到入口位于模型状态左侧；点击后得到独立播放器标签，原页面保留。视频播放推进到52.88秒，readyState=4；跳转到120秒后解码正常、无media error。原生播放器提供暂停、进度条、音量与全屏。
5. 已登录浏览器的Range请求返回206、`video/mp4`、`bytes 0-1023/17901353`及1024字节。OpenResty配置检查及重载成功。

证据：`video/openresty-quickstart-20261017/out/qa/web-video.json`、`web-playback.json`、`web-tutorial-link.png`、`web-video-playback.png`。验证范围是入口、新标签页、播放与跳转；没有重新审核用户剪映导出的全片内容或主观混音听感，没有进行第二台设备验证。
