# 当前状态

更新：2026-10-01。用户确认已获得授权，并要求持续制作到中译阅读站上线；授权声明来源保存在 AGENTS.md。

## 已完成内容

- The Perfect Run、Mother of Learning、Super Supportive、Float：各自前三章完整译文。
- Honestly：完整短篇。
- The Wandering Inn：重写版 1.00 完整译文。
- Heartstopper：原站前三次正文更新（1-1、1-2、1-3），21 张原画与逐页完整中文文字。
- 以上完整译文合计17个阅读单元、1,772个对齐源块（包含场景分隔与漫画图像块）；新增节选见下一节。每本核验报告在 `content/reports/`；私有来源、术语表和校对证据在 `private/sources/`。

## 本轮调研节选（2026-10-01 续谈）

- 用户明确要求“这个可以做一些翻译哈。我们主要是调研。”，本轮新增节选，不扩大为两本完整章节。
- The QB Bad Boy and Me：前三章各一篇场景节选，共44个原段、1,517英文词，涵盖训练/舞蹈目标、车损/修车、家庭和朋友相处。
- Yes, Mr Knight：第一章三个片段，共22个原段、280英文词，涵盖工作、普通短信、人物评价和工作交代；未复现露骨性行为或性化身体描写。
- 两书均以 `excerpt` 单列，省略位置与编者观察明确标注；原始源文件保留，选择清单使用原段落 ID。旧 blocked 报告保留历史，新报告见 `content/reports/*excerpt*.json`。
- **已上线**：17个完整单元 + 4篇节选，共21个阅读单元、1,838个对齐源块。17份原有完整正文经字节比较保持原样。
- 构建与发布校验通过；选段 ID 与私有清单及原章顺序一致。真实 Chrome 回读书架的“阅读节选 · 3篇 / 1篇”、页面顶部“节选译文”、跳段说明与下一篇；390px 手机页面无水平溢出，缩短后的标题单行显示。浏览器无应用 error / warn。

## 明确缺口

- The Wandering Inn 的 1.01、1.02：作者正式目录、实际 Next 链接与旧版替代入口均要求订阅／授权密码；现有 Chrome 登录态无法读取，尚未制作这两章译文。
- The QB Bad Boy and Me：未制作完整章节；本轮只提供上方明确选取的场景节选。
- Yes, Mr Knight：未制作完整章节；本轮只提供上方明确选取的场景节选。
- 不将节选或导读算成整章完成。漫画原画遮挡或裁切文字保持明确缺口，未猜补。

## 工程与验证

- `npm run build` 与 `node scripts/validate.mjs --release` 通过；核对段落 ID 顺序与唯一性、乱码／控制字符、源文档案、章节产物和漫画本地图片。
- 阅读页按每本书独立生成上一章／下一章、目录与手动已读。已修复路由复用、跨标签状态同步、字号保存和损坏存储保护。
- 本轮 IAB 能渲染页面，但自动点击未产生效果；Chrome 对照确认站点交互正常，实际操作验收转 Chrome。已验证章节翻页、各章已读独立、刷新保存、跨标签字号／已读同步。
- 正式域名实读：书架显示九部作品，其中七部有完整译文、两部有调研节选；The Perfect Run 首章的101个正文段落及末段、下一章／上一章和已读状态已验证。漫画第三话五张图均实际解码；手机视口390 × 844、正文与图片无水平溢出。
- 稳定手机截图确认标题、作者、字号控件、中文段落清楚，侧栏关闭在屏幕外；初次尺寸切换中的过渡截图未用作最终验收。没有做实体 iPhone 或长期阅读舒适度验证。

## 发布

**已上线**：[stories.fangs.cc](https://stories.fangs.cc/)；备用入口 [story-shelf-reading.pages.dev](https://story-shelf-reading.pages.dev/)。

- 正式托管：Cloudflare Pages `story-shelf-reading`；当前部署 `8cf186d2-df72-44f5-ae5a-f57bcd8e20f8`，运行内容源码 `f2735db676f8ababedc50fefa9703a6663449c45`。
- 本轮节选更新回读：domain active，正常 DNS／TLS；141/141 个公开文件 SHA-256 与本地一致。CNAME 与 .nojekyll 为部署控制文件，显式排除。一次上传后有一个入口脚本暂时返回404，使用 resume 复用140个已通过项、补核该文件后全部通过；没有重复上传。回执 `.qa/pages-site.json`、`.qa/static-integrity.json`、`.qa/excerpt-resume-output.json`。
- 首次发布 `fa16b570`（源码 `d786818`）在2026-10-01 12:15回读129/129文件一致；当时备用域名另有28/28简洁路由核验，旧回执 `.qa/alias-integrity.json`、`.qa/alias-integrity-files.json` 不作为当前新增节选的验收证据。
- Aliyun DNS 的 stories 记录已从本轮新建的 GitHub 目标改到 `story-shelf-reading.pages.dev`，唯一记录、权重与 TTL 保持。未修改其他域名。
- GitHub 静态存档 `imfangs/story-shelf-site` 的 gh-pages 为 `7c09951c1fa90f93af13c0ace5647b14ef870228`。初始 GitHub Pages 构建和 DNS 正常，自定义证书长期未生效；没有证据证明签发队列状态。故转 Cloudflare，一次上传后通过 resume 完成域名与验证，没有重复上传。
- 本地源码、private/、译文校对原始记录不在公开仓库。后续部署入口与说明变更不改变已核验的网页内容。

本轮调研节选已完成。后续可按实际阅读需要扩充选段，或取得可读的 The Wandering Inn 1.01／1.02 后补齐；节选不记作完整章节。
