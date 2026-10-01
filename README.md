# 故事书架

一个以阅读为中心的个人小说站，沿用 [Dan Koe 中文站](https://dankoe.fangs.cc/) 与 [Wait But Why 中译站](https://wbw.fangs.cc/) 的 VitePress 技术和排版方式。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

实际完成情况见 [CURRENT.md](CURRENT.md)。书目来自本次研究中的九部作品；章节是译文还是导读，均在阅读入口明确显示。

## 发布

```sh
bash deploy.sh
npm run verify:live
```

公开网站使用 Cloudflare Pages 与 [stories.fangs.cc](https://stories.fangs.cc/)，备用入口为 [story-shelf-reading.pages.dev](https://story-shelf-reading.pages.dev/)。`deploy.sh` 复用 FBT pages-site，先构建并核对本轮可发布章节，再上传和验证；上传后需要接续域名或校验时用 `bash deploy.sh resume`，避免重复上传。

GitHub 静态存档保留在 `imfangs/story-shelf-site`，可用 `bash archive-github.sh` 更新。它只推送 `gh-pages` 上的构建产物；本地 `main`、原文、翻译缓存和内部校对记录不随发布上传。初次 GitHub Pages 的域名、DNS和构建均正确，但自定义证书持续不可用，因此本轮正式托管改用已有的 Cloudflare Pages 路线。

`content/exceptions.json` 明确保存本轮未能提供全文的作品／章节，界面据此显示实际范围；原文访问缺口补齐后，移除对应例外并重新校验，不把例外作为自动跳过任意失败的办法。

开发时使用 `npm run dev`。修改内容并重新构建后，需重启 `npm run preview` 再核对成品；本次实测旧预览进程会继续返回缓存内容。

## 添加章节

在 `content/chapters/<book-id>/01.md`（或 `02.md`、`03.md`）填写正文，frontmatter 示例：

```yaml
---
title: 第 1 章
kind: translation
source: https://example.com/original
provenance: user-provided
verified: false
---
```

`kind` 可用 `translation`、`excerpt` 或 `guide`。译文仅在原文由用户提供、或具有适用授权时制作，正文不得用剧情概述替代。将 `verified` 设为 `true` 之前检查段落完整、顺序、专名和末段；导读需核对对应章的情节，标明含前三章剧透。生成和校验命令在 `package.json`。

节选另加 `selection: 01-selection.json`（与章节编号对应），私有源目录内的该文件保存 `sourceUrl` 与有序的 `selectedIds`。正文的段落 ID 必须与选段一致，且是原章段落的有序子集；原章 JSON 保持原样。节选页与书目入口明确显示“节选”，不计入完整译文数量。

原文文件放在 `private/`，默认不提交、不打包；阅读状态只保存在当前浏览器。没有账号、分析追踪或后台模型调用。
