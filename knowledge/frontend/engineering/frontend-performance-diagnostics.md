“页面卡”不是一个可修复的根因。它可能是输入被主线程长任务阻塞、一次渲染触发了昂贵的 style/layout/paint、网络让关键资源晚到，或 React 把无关组件重复渲染。性能诊断的起点应是可复现交互和测量基线，而不是先加 `memo` 或删动画。

![前端性能诊断从用户交互和现场指标进入 Performance trace，沿主线程长任务、渲染管线、网络与 React 渲染四条证据路径定位，并以回归指标验证修复](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/frontend-performance-diagnostics-v1.svg)
*图：trace 用来缩小嫌疑范围；修复需要回到相同场景和相同指标验证，而不是只看一次开发机感受。*

## 概览：把“卡顿”变成可检验假设

先记录场景：设备/CPU 限制、网络条件、路由、输入动作、数据规模和发生频率。分别采集现场真实用户数据（RUM）与可控实验数据；前者告诉你影响范围，后者帮助稳定复现。至少区分加载体验（LCP）、视觉稳定性（CLS）和交互响应（INP），不要用一个分数解释所有问题。

Chrome DevTools 的 Performance 面板可记录交互，并展示本地 Interaction to Next Paint、LCP 与 CLS；它还能把长任务标记到主线程轨道上。[Performance 面板概览](https://developer.chrome.com/docs/devtools/performance/overview)和[运行时分析指南](https://developer.chrome.com/docs/devtools/performance)给出了当前工具行为。

## 核心模型：一次交互穿过哪些阶段

一次点击到用户看到更新，大致经过：输入排队 → 事件处理 → JavaScript/框架更新 → 样式计算 → layout → paint/composite → 下一帧呈现。任何一段过长都可能推迟可见反馈；因此“JS 时间少”不代表交互快，“网络很快”也不代表滚动流畅。

W3C Long Tasks API 将持续时间超过 50ms 的事件循环任务、其后的 microtask checkpoint，或渲染步骤等记录为 long task。[规范](https://www.w3.org/TR/longtasks-1/)说明它们会垄断 UI 线程并阻塞输入等关键任务。50ms 是定位信号，不是性能目标：许多小任务、频繁布局或等待关键网络资源同样能造成体验问题。

诊断时把 trace 读成四条证据链：

| 证据链 | 常见信号 | 优先验证的假设 |
| --- | --- | --- |
| 主线程 | 长 `Task`、大段脚本、频繁 GC | 同步计算、第三方脚本、过量状态更新 |
| 渲染 | `Recalculate Style`/`Layout`/`Paint` 突增 | 强制同步布局、大面积重绘、DOM 规模 |
| 网络 | 关键请求排队、慢 TTFB、瀑布依赖 | 阻塞资源、缓存缺失、请求发现过晚 |
| React | interaction 时重复 render/commit | 状态放置过高、不稳定 props、昂贵派生计算 |

## 诊断方法：从指标到最小修复

### 1. 固定场景并建立基线

在无痕窗口或受控 profile 下执行同一动作多次，记录 p50/p75/p95，而非选最好的一次。保留 trace、CPU profile、网络瀑布和版本号。若现场 RUM 指出的是慢设备，桌面开发机上的 60fps 不能否定问题。

```ts
// 将长任务关联到版本、路由和交互上下文；避免上报 URL 参数或用户内容。
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration >= 50) {
      report({ type: 'long-task', start: entry.startTime, duration: entry.duration });
    }
  }
}).observe({ type: 'longtask', buffered: true });
```

Long Task 的 attribution 不是完整的函数级火焰图，跨源内容也可能只能显示受限归因；应以 Performance trace 和 source map/CPU profile 继续定位，而不是把一个 long-task 条目当作最终根因。

### 2. 在 trace 里先找最长的用户可见阻塞

录制“点击—看到结果”的窗口，在 Main 轨道展开最长任务：它是脚本、样式、布局、绘制，还是 GC？沿调用栈回到应用代码或第三方来源。然后检查该任务前后是否有网络等待、动画帧丢失或重复渲染。DevTools 的 Insights 还会提示 LCP/INP 子阶段、第三方和重复 JavaScript 等问题，但提示是候选假设，仍要回到 trace 验证。[Performance 功能参考](https://developer.chrome.com/docs/devtools/performance/reference)说明了这些洞察的范围。

### 3. 对应证据做小而可逆的改动

- **长 JavaScript**：拆分大循环，分批处理或转 Worker；不要用 `setTimeout` 把同一总量拆碎却仍在每帧抢占。
- **布局抖动**：先批量读取几何信息，再批量写 DOM；避免在写 style 后立刻读 `offsetWidth` 触发同步 layout。
- **重绘过大**：缩小更新区域，避免高频改变会触发布局/绘制的属性；滚动和动画优先使用适合合成的路径，但先用 trace 确认。
- **网络关键路径**：删除无关阻塞资源，预加载真正的 LCP 资源，压缩/缓存可复用资产，并检查服务器响应和依赖链。
- **React 提交过多**：用 React DevTools Profiler 找出 render/commit，先把状态下沉、稳定 props、缓存昂贵派生值；`memo` 只在比较成本低且确实跳过足够渲染时才有价值。React 官方的 [Profiler 文档](https://react.dev/reference/react/Profiler)说明了 `actualDuration`、`baseDuration` 和 commit 回调的含义。

### 4. 用同一指标验证并防回归

每项改动后在相同脚本、相同节流条件下重录，比较交互延迟、long-task 总阻塞时间、相关 render 次数和关键网络时序。若 INP 改善却 LCP 变差，保留这个权衡而不是只报一个漂亮数字。把关键交互放进性能预算和持续监控，防止依赖升级或新功能悄悄带回回归。

## 失败边界与常见误区

- **只看 Lighthouse 一次跑分**：它是合成诊断，不等于真实用户分布；用 RUM 验证影响人群。
- **把所有问题归咎 React**：长任务可能来自解析、第三方、GC 或 layout；先看 Main 轨道证据。
- **盲目 `useMemo`/`memo`**：依赖变化仍会重算，比较本身有成本，还可能掩盖状态架构问题。
- **把长任务阈值当成功线**：没有单个 50ms 任务也可能有连续小任务或网络等待；指标需结合交互场景。
- **忽略第三方与权限边界**：广告、监控和嵌入内容可能主导主线程；应量化其成本、延迟加载或隔离，并评估业务影响。

## 面试追问

1. **用户说“点击卡”，第一步做什么？** 复现并记录 trace/RUM 版本、设备与网络，明确是输入延迟、渲染还是加载；不先猜优化手段。
2. **如何从 Performance trace 找强制同步布局？** 找到写样式后紧接着的几何读取，以及随后的 `Recalculate Style`/`Layout`；将读写分批后再对比 trace。
3. **INP 与长任务是什么关系？** 长任务常让输入排队或延迟呈现，但 INP 覆盖一次交互到下一次绘制的全链路；二者不能互相替代。
4. **React 性能怎样避免“优化了没效果”？** 先在 Profiler 证明哪些组件的 render/commit 构成瓶颈，改后复测相同交互并检查整体指标而非单个组件耗时。

## 小结

前端性能诊断是一条证据链：用真实指标发现范围，用可复现场景和 trace 定位阻塞阶段，用最小改动验证因果，再以相同指标防回归。主线程、渲染、网络和 React 都可能是根因；只有把它们放回同一次用户交互中，优化才会稳定改善体验。

## Canvas 分层与视口裁切：先证明成本在哪里

图形界面同时使用像素绘制与交互图形层时，应明确数据状态、坐标变换和事件命中的负责者。缩放、拖拽和高 DPI 下，各层需使用一致的转换；离屏节点若不绘制，交互层也不能继续错误命中不可见内容。这里是一般分层原理，不预设某版 X6 或某个候选人项目的实现。

裁切依实际成本而定：千节点可能很轻，也可能因复杂文本、连线或布局很重。固定图内容、设备、视口与拖动脚本，对比可见对象数、帧耗时及交互延迟，检查快速移入区域是否缺内容。预加载保留适量视口外余量，但更多余量也会吃掉裁切收益。

## PV、UV 与浏览器性能条目不能混算

PV 依已定义的页面/路由访问事件计数；UV 在指定窗口与允许的主体标识上去重，不等于准确自然人数。SPA 路由、文档导航、后台重试与重复上报应有不同事件语义，并限制个人信息采集。

FCP 是浏览器首次绘制文本、图像等内容的文档指标，不是 Vue mounted 的时间。使用 paint observer 的 buffered 模式读取已产生条目，并筛选 first-contentful-paint；Observer 不支持时按产品需要降级，不能伪造 FCP。

```javascript
function observeFCP(onMetric) {
  if (typeof PerformanceObserver === 'undefined' ||
      !PerformanceObserver.supportedEntryTypes?.includes('paint')) return null;
  const observer = new PerformanceObserver(list => {
    const entry = list.getEntries().find(item => item.name === 'first-contentful-paint');
    if (entry) { observer.disconnect(); onMetric(entry.startTime); }
  });
  observer.observe({type: 'paint', buffered: true});
  return () => observer.disconnect();
}
```

这是只观测一次文档 FCP 的教学函数；埋点系统仍应做文档级去重、支持检测和异常处理。SPA 每次路由切换不会因此产生新文档 FCP。[MDN PerformancePaintTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming)解释条目来源；[Web Vitals 文档](https://web.dev/articles/vitals)区分 LCP、INP 与 CLS 的不同体验维度，FCP 不能代替它们。

## 搜索输入：减少请求与防止旧响应覆盖

防抖是在输入一段时间稳定后执行；节流是限制一定窗口内的执行频率，二者不能互换。搜索通常可以防抖，但用户按回车可立即查询，输入法组合阶段也要定义行为。定时器只决定最早执行时机，不保证精确毫秒。

减少请求还不够：为每次有效查询带递增版本，响应落地前检查是否仍为最新，或取消旧 fetch 并仍检查状态。AbortController 无法保证服务端此前的动作被撤销；组件卸载也要清理定时器与请求。[DOM AbortSignal](https://dom.spec.whatwg.org/#interface-abortsignal)与[HTML 定时器规则](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers)分别定义取消信号与计时边界。

验证快速连续输入、旧请求后返回、回车、输入法与卸载，检查请求量与结果正确性。单测最终显示文本不能证明旧响应从未覆盖过新结果。

### 大列表：可视范围、缓冲和动态高度

[Vue 性能文档](https://vuejs.org/guide/best-practices/performance.html#virtualize-large-lists)建议仅渲染当前或临近可视范围的项。固定高度时由 scrollTop 与项高算开始索引，按容器高度算结束索引，顶部与底部占位保留完整滚动长度；overscan 扩展范围，减少快滚空白，也增加节点成本。

聊天条目高度会随流式文本增长，不能永久假定固定项高。测量实际高度并维护累计偏移；重新测量或切换列表时保留稳定消息 ID、滚动锚点、输入与焦点。用户在底部可按产品合同跟随新内容，正在读历史时避免强制跳到底。是否按 30 条切换仅为某个自述场景，阈值由真实设备和数据测试决定。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [OPPO AI 全栈一面：Prompt 到 UI、RAG 与前端性能（2026 年 8 月）](../../../interview/oppo/ai/oppo-ai-2.md)
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)
- [字节剪映 AI 前端一面：Agent 运行时、MCP 与性能](../../../interview/bytedance/base/bytedance-base-30.md)
- [字节前端全栈实习一面：渲染、Worker与认证](../../../interview/bytedance/base/bytedance-base-38.md)
- [字节全栈：多智能体导购、客户端与系统评测](../../../interview/bytedance/base/bytedance-base-43.md)
- [字节全栈：预请求、列表复用与 ThreadLocal](../../../interview/bytedance/base/bytedance-base-44.md)
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../../interview/bytedance/base/bytedance-base-53.md)
<!-- interview-source-history:end -->

## 参考资料

- [Chrome DevTools：Performance panel](https://developer.chrome.com/docs/devtools/performance/overview)
- [W3C：Long Tasks API](https://www.w3.org/TR/longtasks-1/)
- [React：Profiler](https://react.dev/reference/react/Profiler)
