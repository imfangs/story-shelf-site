# 故事书架

一个以阅读为中心的个人小说站，沿用 [Dan Koe 中文站](https://dankoe.fangs.cc/) 与 [Wait But Why 中译站](https://wbw.fangs.cc/) 的 VitePress 技术和排版方式。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

实际完成情况见 [CURRENT.md](CURRENT.md)。书目来自本次研究中的九部作品；章节是译文还是导读，均在阅读入口明确显示。

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

`kind` 可用 `translation` 或 `guide`。译文仅在原文由用户提供、或具有适用授权时制作，正文不得用剧情概述替代。将 `verified` 设为 `true` 之前检查段落完整、顺序、专名和末段；导读需核对对应章的情节，标明含前三章剧透。生成和校验命令在 `package.json`。

原文文件放在 `private/`，默认不提交、不打包；阅读状态只保存在当前浏览器。没有账号、分析追踪或后台模型调用。
