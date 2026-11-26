---
name: aj-diagrams
description: 给 Agent Journey 知识库文章画或重画配图（架构/流程/算法结构/LLM 原理/数据曲线）时必须用。产出跟网站主题一致的深色+浅色两版 PNG，自动检查字号、越界和压字。替换旧 AI 生成图、修小字 Archify 图、新文章配图都走这里。
---

# Agent Journey 主题配图

所有知识库配图用同一套组件（`scripts/diagram-kit/kit.mjs`）手写源码，一份源码出深、浅两版 PNG。
颜色、字号、线宽、圆角都在组件里定死，**作者只决定画什么、放在哪**——这是全站风格统一的保证。

不要用位图生成模型（gpt-image / image_gen / Codex $imagegen）画技术图：中文对但配色不准、关系会漏、不可编辑（2026-11-19 实测评估）。

## 1. 先判断这张图该怎么做

| 图里要讲的东西 | 做法 |
|---|---|
| 架构、组件、分层、流程、请求链路、状态机 | 本 skill：`k.box` + `k.arrow` + `k.frame/panel` |
| 树、图、链表、栈队列、数组/双指针、哈希桶、矩阵/DP 表、注意力掩码 | 本 skill：`k.node/edge`、`k.cells`、`k.matrix` |
| 曲线、增长趋势、对比柱状（数据驱动） | 本 skill 的 `k.lineChart` / `k.barChart`，数据写在源码里，**数值必须真实或可推导** |
| 产品界面、控制台、IDE 截图 | 不画：用真实截图或 HTML 还原，不在本 skill 范围 |
| 交互式 Archify 嵌入（`/archify/*.html`） | 保留，只按主题改色，不转静态图 |
| 已经工整、只是颜色不搭的 Excalidraw 图 | 可保留；要重画时用本 skill |
| 字太小的 Archify 静态 PNG | 用本 skill 重画 |

一张图只讲一件事。一篇文章需要讲两件事就画两张。

## 2. 环境（一次性）

```bash
# 仓库依赖（lockfile 指向 npmmirror，云端连不上时换源）
npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/ --replace-registry-host=registry.npmmirror.com
# 中文字体：73MB，不写进 package.json，按需装
npm i --no-save --ignore-scripts @fontsource/noto-sans-sc@5.3.1
```

`npm ci` 会把这个字体包删掉，之后要重装。浏览器用 puppeteer 自带 Chrome；云端容器会自动用 `/opt/pw-browsers` 的 Chromium，或用 `AJ_CHROME` 指定。
字体也可以用 `AJ_FONT_DIR` 指到别处已解压的 `@fontsource/noto-sans-sc`。渲染器会确认 Noto Sans SC 真的加载上了，**不会退回系统字体出图**。

## 3. 命名与文件位置

- 源码：`images/diagram-sources/<文章key>-<概念>-v<N>.aj.mjs`
- 产物：`images/<同名>.dark.png`、`images/<同名>.light.png`（2× 分辨率，宽 1920）
- 改图就升版本号（`-v2`），不覆盖已发布的对象名——OSS/CDN 有缓存，旧链接也要能回滚。

源码格式（参考 `images/diagram-sources/` 里的 11 张样例）：

```js
export const meta = {
  name: 'algorithm-hash-buckets-resize-v1',          // 必须和文件名一致，只用 a-z0-9-
  article: 'knowledge/data-structure/algorithm/algorithm-hash.md',
  alt: '一句完整的话描述图里的关系，供读屏和图片加载失败时用',
};

export default (k) => k.figure({
  h: 640,                        // 画布高由你定；宽固定 960
  title: '哈希表：从 key 到桶，碰撞与扩容',   // 图内标题：说结论，不只是名词
  subtitle: '一行补充：坐标/约定/示意说明',
  body: [ k.box({...}), k.arrow({...}), ... ].join(''),
});
```

## 4. 组件清单（`k.*`）

坐标系：画布 960 宽，内容区 x∈[40, 920]，标题占到 y≈100，内容从 y≈110 开始。

- `k.text({x,y,text,size,tone,anchor,weight})`：size 只用 `title/heading/body/label/note`（24/19/17/16/15），**不要写数字字号**
- `k.box({x,y,w,h,title,sub,tone,strong,titleSize,dashed})`：圆角框，文字自动垂直居中
- `k.arrow({points,tone,dashed,label,labelAt,labelAnchor,head,both})`：折线箭头，只走水平/垂直段
- `k.frame` 虚线分组；`k.panel` 实线面板（左上角标签）。面板底板会自动最先画，穿进面板的箭头不会被盖住
- `k.node` / `k.edge`：圆节点与连线（树、图），`badge` 标访问顺序
- `k.cells`：数组格子，`mark` 高亮、`pointers` 指针、`dim` 置灰、`textSize`
- `k.matrix`：方格矩阵（掩码、DP 表）
- `k.sum`：⊕ 节点
- `k.note({lead,text})`：底部一句话结论条
- `k.legend`、`k.lineChart`（支持 `logY`）、`k.barChart`
- 原始 SVG 片段可以直接拼进 body（如曲线箭头），颜色一律用 `k.t.*` / `k.color(tone)`，箭头 marker 用 `url(#m-<tone>)`

tone 语义固定，全站统一：

| tone | 含义 |
|---|---|
| `accent` | 主角、当前步骤、正确路径（鼠尾草绿） |
| `ok` | 成功、命中、通过 |
| `bad` | 失败、冲突、错误、代价高 |
| `warn` | 注意、阈值、需要权衡 |
| `info` | 次要对象、另一条路径 |
| `muted` / `line` | 背景信息、普通连线 |

一张图里的颜色不超过 3 种 tone（不算 line/muted）。

## 5. 渲染与自动检查

```bash
npm run diagram -- images/diagram-sources/<name>.aj.mjs --preview /tmp/preview.png
```

检查项（任一不过就退出码 1，**不许带着问题提交**）：

- 字号 < 15px
- 文字出画布
- 方框/格子里的文字贴边或溢出（左右留 5px）
- 两段文字重叠
- 线条、箭头、边框穿过文字

`--preview` 会把深浅两版并排拼成一张，**必须亲眼看一遍预览**。自动检查抓不到的问题要人工看：

- 箭头方向和起止点是否表达了正确的关系（检查器只管像素，不管语义）
- 每个步骤/状态的数据是否真实推演得出（双指针每步的值、BFS 顺序、哈希下标……自己逐步算一遍）
- 浅色版里浅色系（warn/ok）文字是否够清楚
- 画面是否有一块空着、另一块挤着

## 6. 接进文章

1. 图片链接用深色版：`![<meta.alt>](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/<name>.dark.png)`
   - 网站在浅色主题下会自动换成 `.light.png`（front-end-journey `src/components/markdown.tsx`）
   - PDF 导出自动用 `.light.png`（`scripts/build-materials.mjs`）
2. 图下一行用斜体写一句说明，告诉读者看哪里（不是重复标题）。
3. 删除被替换的旧图引用；旧图文件先留着，等发布和回滚确认后再清。
4. `.png` 是普通静态图，不需要在 `knowledge/pdf-static-images.json` 新增登记。但如果这篇文章**本来就有登记**（里面有 mermaid/SVG 等），改了正文后要把该文章条目的 `articleSha256` 更新成新哈希（只改哈希，mermaid 源码和行号不变时其余字段不动），否则 `npm test` 的 PDF 固定映射检查会失败。
5. 更新 `.codex/diagram-migration-history.json` 里对应旧图的状态。
6. 跑 `npm test` 和 `npm run validate:tree`。

## 6½. 动效图（可逐步播放）

动画要多讲清一件事才做：图里的**状态会随时间变化**（指针移动、缓存增长、回调在队列间搬家、连接状态切换、令牌桶增减）优先做；普通流程只按顺序点亮，收益小；架构、分层、对比、清单不做。网站上右上角有重播 / 上一步 / 播放暂停 / 下一步，图下显示这一步的说明。

两种写法：

**帧动画（首选，状态推演类）**：`k.figure({ body, frames: [{ caption, body }, ...] })`。
- `body` 是一直显示的底图（面板、标签、结论条），每帧 `body` 是这一刻的完整状态，不是增量。
- 跨帧要「移动」的东西用 `k.keyed('名字', [...])` 包起来：同一个名字在相邻两帧位置不同，播放时会从旧位置滑过去（例：指针、队列里的回调卡片）。内容变了但位置没变的会淡入。
- 源码开头 `if (k.mode === 'still') return still(k);`：静态 PNG / PDF 直接用原来那张静态图的源码（import 进来），因为单独一帧讲不全。
- 箭头要跑流动点就加 `flow: true`。
- render.mjs 会逐帧跑字号 / 越界 / 压字检查。示例：`algorithm-array-two-pointers-anim`、`llm-token-context-kv-cache-anim`、`browser-event-loop-queues-anim`。

**分步点亮（流程类）**：

1. 源码里把每一步出现的图元包进 `k.step(n, [...])`（n 从 1 开始，同一步可以写多次）。
   答案、输出这类不该提前露出的内容用 `k.step(n, [...], { mode: 'reveal' })`，未到时完全隐藏；默认未到时淡显。
   框架、标题、底部结论条等一直显示的图元不包。
2. `k.figure({ ..., steps: ['第 1 步说明', ...] })`：一句话说清这一步发生了什么、为什么，数量要和用到的 k.step 对上。
3. `meta.name` 以 `-anim` 或 `-anim-vN` 结尾（阅读端靠它认出动效图），alt 里注明「可逐步播放」。
4. render.mjs 会额外导出 `images/<name>.{dark,light}.svg`；PNG 是全部步骤显示的终态，PDF、加载失败和「减少动态效果」都看它。
5. 文章照常引用 `<name>.dark.png`，不需要别的标记。台账里该条 `replacementAssets` 加上 svg 两个文件及哈希，并标 `"animated": true`。
6. 写完在浏览器里逐步点一遍（示例：`front-end-journey/src/components/AnimatedDiagram.tsx`），确认每一步单独看也讲得通。

## 7. 手机端

文章在手机上约 360px 宽，960 画布会缩到约 0.37 倍，15px 字变成约 5.6px——**手机上看不清是已知取舍**，靠点开大图（antd Image 预览）解决。所以：

- 不要为了塞内容把图画得更宽；内容多就拆两张
- 关键结论写进图下说明和正文，不能只在图里
