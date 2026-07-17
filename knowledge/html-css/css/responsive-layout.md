现代响应式布局不应依赖“手机 375、平板 768、桌面 1440”三张截图。页面级结构可响应 viewport，组件应优先响应自己的容器；Grid/Flex 的 intrinsic layout 与 `minmax()`、`clamp()` 让内容在很多宽度上自然适配，只在真正失败处添加断点。

![Media Query 与 Container Query 分别控制页面和组件，并结合 Grid、Flex 与 clamp 的响应式布局](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/responsive-layout-container-breakpoint-v1.webp)
*图：同一 viewport 中容器宽度可不同；可复用卡片根据 container 改变内部结构，而非猜设备。*

## 先让布局具有内在弹性

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

同一卡片可能在主栏很宽、侧栏很窄，viewport query 无法知道局部空间。[CSS Containment Level 3](https://www.w3.org/TR/css-contain-3/)定义 size/style container queries。先为父容器设置 `container-type: inline-size`，再查询它：

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

## 参考资料

- [W3C：CSS Flexible Box Layout](https://www.w3.org/TR/css-flexbox-1/)
- [W3C：CSS Grid Layout Level 2](https://www.w3.org/TR/css-grid-2/)
- [W3C：Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/)
- [W3C：CSS Containment Level 3](https://www.w3.org/TR/css-contain-3/)
- [W3C WAI：Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
