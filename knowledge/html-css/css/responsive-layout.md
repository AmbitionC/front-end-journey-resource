「怎么做响应式布局」「移动端适配有哪些方案」是前端面试的常见题，尤其在一面的 CSS 环节。只答「用媒体查询」是不够的，面试官会接着问 rem 和 vw 怎么选、组件放在侧栏里怎么办。

> **30 秒答法**：先加 `<meta name="viewport" content="width=device-width, initial-scale=1">`，让页面按设备宽度布局。然后先靠弹性布局本身适配：Flex 管一维、Grid 管二维，宽度用百分比和 `max-width`，字号和间距用 `clamp()` 平滑缩放。页面级的大结构用媒体查询在内容放不下的地方切换；可复用的组件用容器查询，按它所在容器的宽度变化，而不是按屏幕宽度。最后图片用 `srcset` 按实际显示宽度加载，并在 320px 宽和放大 400% 下检查不出现横向滚动。

现代响应式布局不应依赖“手机 375、平板 768、桌面 1440”三张截图。页面级结构可响应 viewport，组件应优先响应自己的容器；Grid/Flex 的 intrinsic layout 与 `minmax()`、`clamp()` 让内容在很多宽度上自然适配，只在真正失败处添加断点。

![媒体查询和容器查询各管一层。左侧是一个 viewport：@media 根据视口和媒体特征决定页面结构，比如分几栏、导航怎么排。同一个视口里，主栏容器宽、侧栏容器窄；同一个卡片组件放进两处，用 @container 看自己的父容器宽度：在宽容器里图文横排，在窄容器里图文竖排，而不是猜设备。右侧是四条配套规则：一条轴的内容分配用 Flex，两条轴对齐用 Grid；用 min-inline-size: 0 和 minmax(0, 1fr) 让元素允许缩小、防止长文本撑破；字号和间距用 clamp() 在上下限之间平滑缩放；用 hover 和 pointer 判断输入方式，不用宽度猜是不是触屏。底部提示：断点来自内容失败点，而不是设备名单；连续拖动宽度找溢出，窄屏和放大时不该出现二维滚动（具有二维意义的内容例外），视觉顺序要和 DOM 顺序一致](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/responsive-layout-container-breakpoint-v2.dark.png)
*图：同一个视口里主栏宽、侧栏窄，同一个卡片组件按自己的容器宽度变形；右边是 Flex/Grid、防撑破、clamp 和输入方式四条配套规则。*

## 先让布局具有内在弹性

移动端第一步是 viewport meta。没有它，手机浏览器会按一个较宽的虚拟宽度（常见是 980px 左右）排版再整体缩小，后面写的媒体查询都对不上：

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

不要加 `user-scalable=no` 或 `maximum-scale=1` 禁止缩放，这会让需要放大阅读的用户无法使用。

设置流式宽度、合理 max-width、可换行文本和弹性媒体。图片使用 `max-inline-size: 100%; block-size: auto`；容器用 `width: min(100% - 2rem, 72rem)`；避免固定像素高度截断放大文本。

字体和间距可用 `clamp(min, preferred, max)` 平滑缩放：

```css
.page {
  inline-size: min(100% - 2rem, 72rem);
  margin-inline: auto;
}

h1 { font-size: clamp(2rem, 5vw, 4.5rem); }
```

preferred 不要完全依赖 vw，需给最小/最大边界。正文行长用 `ch` 限制可读性，不能因为屏幕宽就铺满。

## Flexbox 与 Grid 的分工

[CSS Flexbox](https://www.w3.org/TR/css-flexbox-1/)是一维布局：沿主轴分配和对齐，适合工具栏、导航和一行卡片。[CSS Grid](https://www.w3.org/TR/css-grid-2/)定义二维 tracks 与 placement，适合页面区域和需要行列关系的布局。

Flex item 默认 `min-width:auto` 可能拒绝缩小，长文本导致溢出；常用 `min-inline-size:0`。Grid 中 `minmax(0,1fr)` 允许 track 缩小，`repeat(auto-fit,minmax(min(18rem,100%),1fr))` 可在无需断点时自动改变列数。

选择基于约束：一条轴的内容分配用 Flex，两条轴对齐用 Grid。两者可嵌套，不必争论替代关系。

## Media Query 控制页面环境

[Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/)允许根据 viewport、hover/pointer、color scheme、motion 等媒体特征应用样式。断点由内容失败点产生：当导航无法容纳时切换，而不是因为某品牌设备宽度。

```css
@media (min-width: 60rem) {
  .shell { grid-template-columns: 16rem minmax(0, 1fr); }
}

@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto; }
}
```

不要用 width 推断触摸能力；平板可能有鼠标，桌面也有触屏。用 hover/pointer 做增强，核心操作始终可用。

## Container Query 控制组件

同一卡片可能在主栏很宽、侧栏很窄，viewport query 无法知道局部空间。容器查询现在定义在 [CSS Conditional Rules Level 5](https://www.w3.org/TR/css-conditional-5/) 里（早期草案放在 CSS Containment Level 3）。先为父容器设置 `container-type: inline-size`，再查询它：

```css
.card-host { container-type: inline-size; }

.card { display: grid; gap: 1rem; }

@container (min-width: 30rem) {
  .card { grid-template-columns: auto 1fr auto; }
}
```

查询目标是祖先容器，不是元素自身，避免自依赖循环。给容器命名可让嵌套组件选对边界。组件文档写“窄/宽容器下行为”，而不是要求使用者放在某页面。

## Responsive 还包括输入和偏好

布局需适配键盘、触摸、鼠标、缩放、字体大小、横竖屏、safe area、深色和减少动画。使用逻辑属性 `inline-size`、`margin-inline` 支持不同书写方向。触摸目标足够大，hover 不是唯一入口。

移动端 viewport 高度受地址栏和键盘影响，可按场景使用 `dvh/svh/lvh`，并保留内容滚动。固定 footer 不应遮住聚焦输入；`env(safe-area-inset-*)` 只作为额外 padding。

## Reflow 与可访问性

[WCAG 2.2 Reflow Understanding](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)强调内容在窄宽与放大时无需二维滚动（具有二维意义的内容例外）。测试 320 CSS px 和 400% zoom，确保导航、表单错误、modal 和 sticky 区域仍可读可操作。

DOM 阅读顺序应与视觉顺序一致。Grid `order`/placement 只改变视觉会让键盘和屏幕阅读器顺序错乱。断点隐藏内容前确认信息仍有可访问替代，不因小屏删掉关键功能。

## 图片与性能

使用 `srcset`/`sizes` 提供与布局实际显示宽度匹配的资源，`picture` 用于 art direction。写 width/height 或 aspect-ratio 减少布局偏移；首屏关键图谨慎 preload，其余 lazy load。

CSS 隐藏的大图仍可能下载，需正确响应式图片标记。不同 DPR、网络和 data saver 下检查，不用 4K 背景图证明“响应式”。

## 测试矩阵

不要只拖拽三个 preset。连续改变容器宽度，找任何内容溢出或跳动点；测试长德文、中文无空格、动态字体、200/400% zoom、键盘、横屏、折叠屏和 reduced motion。组件在页面、侧栏、modal 中分别做 container 测试。

响应式设计的成熟标准是：内容和组件在一段连续条件空间中保持可理解、可操作，断点只是修复约束失败的少数工具，而不是设备名单。

## 面试常问

**rem、em、vw 怎么选？** rem 相对根元素字号，适合整体间距和字号；只要根字号没有写死成 px，用户调大浏览器字号时它会一起放大；em 相对当前元素字号，适合按钮内边距这类要跟着自身文字缩放的地方；vw 相对视口宽度，适合做 `clamp()` 中间的那一项，单独使用会让字号在大屏上失控、在小屏上过小。早年用 JS 动态改根字号（类似 flexible.js）的方案，现在多数场景可以用 vw 加 `clamp()` 代替。

**媒体查询和容器查询有什么区别？** 媒体查询看的是视口和设备特性，适合页面整体结构；容器查询看的是某个祖先容器的尺寸，适合同一个卡片既可能出现在宽主栏、也可能出现在窄侧栏的情况。

**移动端 1px 边框为什么看起来粗？** 在设备像素比为 2 或 3 的屏幕上，1 个 CSS 像素对应 2 到 3 个物理像素。常见做法是用伪元素画 1px 边框，再按设备像素比缩放：DPR 为 2 时 `transform: scaleY(0.5)`，DPR 为 3 时约 `scaleY(0.333)`，可以用 `@media (min-resolution: 3dppx)` 区分。这是横线的写法，竖线改用 `scaleX`；四条边都要细线时，常把伪元素宽高设为 200%、画好边框后整体 `scale(0.5)`（DPR 为 3 时对应 300% 和约 `scale(0.333)`），并设好 `transform-origin`；也可以在支持的浏览器里直接写 `0.5px`。先确认设计稿是否真的需要物理 1px，再选方案。

**断点设多少合适？** 没有标准答案。从窄到宽连续拖动，在内容开始挤压、换行难看的地方加断点，而不是按某几款设备的宽度来设。

## 练一练

### 高频考点题 1：viewport meta

移动端页面没加 viewport meta，会出现什么现象？

- A. 页面无法加载
- B. 页面会自动切换成深色模式并放大字体
- C. 只显示页面左上角
- D. 按约 980px 排版再整体缩小

**答案：D。** 应按设备宽度布局；也不要禁止缩放，否则需要放大阅读的用户无法使用。

### 高频考点题 2：Flex 还是 Grid

需要行和列两个方向都对齐的卡片网格，优先用？

- A. Flexbox
- B. float
- C. Grid
- D. table

**答案：C。** Flex 是一维布局，适合沿一条轴分配；Grid 擅长二维对齐，两者可以嵌套使用。

### 高频考点题 3：组件随容器变化

同一个卡片组件放在宽主栏和窄侧栏里，要呈现不同布局，应该用？

- A. 容器查询按所在容器宽度判断
- B. 媒体查询按屏幕宽度判断
- C. 用 JavaScript 读屏幕宽度
- D. 为每个位置写一个组件

**答案：A。** 媒体查询只知道 viewport，不知道局部空间；容器查询的目标是祖先容器，不是元素自身。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
<!-- interview-source-history:end -->

## 参考资料

- [W3C：CSS Flexible Box Layout](https://www.w3.org/TR/css-flexbox-1/)
- [W3C：CSS Grid Layout Level 2](https://www.w3.org/TR/css-grid-2/)
- [W3C：Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/)
- [W3C：CSS Conditional Rules Level 5（容器查询）](https://www.w3.org/TR/css-conditional-5/)
- [W3C WAI：Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
