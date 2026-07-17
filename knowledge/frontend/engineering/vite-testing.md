Vite 优化的是前端开发与构建反馈，测试体系验证的是行为边界；二者共享模块解析和转换能力，却不能互相替代。理解 dev server 的按需模块、production build 的 bundling，再按单元、组件、浏览器和 E2E 分层，才能既快又有信心。

![Vite 开发服务器、生产构建与 Vitest 单元、组件、浏览器和 E2E 测试的分层管线](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/vite-testing-build-test-pipeline-v1.webp)
*图：开发按需转换模块，生产输出优化 bundle；不同测试层共享配置但覆盖不同真实边界。*

## 开发与生产是两条路径

[Why Vite](https://vite.dev/guide/why.html)说明，开发时利用浏览器原生 ES modules，按请求转换源码；依赖预构建减少大量模块请求，并把 CommonJS 等依赖转换成合适形式。源码修改后 HMR 只更新受影响模块，避免整包重建。

生产构建则对应用图进行 bundling、tree-shaking、chunking、压缩和资源处理，输出可部署文件。dev 正常不保证 build 正常：动态 import、环境变量、base path、chunk 加载和浏览器目标可能只在生产路径暴露。

## 配置与插件边界

[Vite Guide](https://vite.dev/guide/)介绍 `vite.config`、插件、资源和环境变量。配置按 command/mode 分支时要保持可读，避免测试、开发和构建得到三套隐式 alias。插件顺序会影响 transform，调试时记录文件经过哪些插件。

只有 `VITE_` 前缀变量默认暴露给客户端，但前缀不是安全机制：进入前端 bundle 的任何值都可被用户读取，不能放 secret。配置值在构建时替换，运行时环境若要变化，应通过独立公开配置文件或服务端注入。

## 测试层次

单元测试验证纯函数、reducer 和边界，快且定位清晰；组件测试验证 DOM、交互与可访问语义；browser mode 在真实浏览器执行需要布局、Canvas 或浏览器 API 的测试；E2E 从部署入口验证路由、网络和后端集成。

[Vitest Guide](https://vitest.dev/guide/)展示与 Vite 配置和转换模型的集成。共享不是把所有测试都放 jsdom：jsdom 不实现完整 layout、navigation 和浏览器安全模型。把最小数量的关键场景放真实浏览器/E2E，其余下沉到更快层。

## 可测试的模块边界

把解析、验证和状态转换写成无副作用函数；网络、时间、随机数和存储通过接口注入。组件测试模拟用户行为，不测试内部 state 变量。查询使用 role/name，既稳定又验证基本可访问性。

mock 只替换真正的外部边界。过度 mock 让测试验证“自己编的世界”；例如把 API client、query cache 和组件全 mock，无法发现契约不兼容。使用固定 fixture、contract test 或 MSW 模拟 HTTP 协议更接近真实边界。

## 异步、时间与隔离

每个测试恢复 mock、timer、DOM 和全局状态。fake timers 适合 debounce/retry，但 Promise microtask 与 timer 的推进顺序要明确。不要靠固定 sleep 等待 UI，应该等待可观察状态。

并行测试不能共享数据库用户、端口或可变文件；用唯一 testId 和独立资源。失败时保留 seed、请求日志、截图与 Trace。flaky test 先隔离根因，不能无限 retry 把不确定性变绿。

## Build 与 Preview 验证

CI 至少执行 typecheck/lint、unit/component、`vite build`，再对构建产物用静态服务器或 `vite preview` 做 smoke。preview 用于本地检查，不是生产服务器。测试 base path、history fallback、静态资源 MIME、缓存 header 和 source map 策略。

bundle size budget 和 chunk 列表可发现意外依赖；但大小变化不一定是回归，需要结合加载路径。动态 import 失败、旧 HTML 引用已删除 hash 文件等发布问题，还需原子部署和回滚验证。

## Coverage 与质量门禁

覆盖率显示哪些代码执行过，不证明断言有效。对核心状态机、权限和错误恢复设置行为用例；行覆盖率作为趋势和缺口提示。mutation testing 或故意破坏实现可评估测试是否真正捕获错误。

失败门禁按风险：类型错误和单元失败阻止合并；关键 E2E 阻止发布；非关键跨浏览器回归可进入有 owner 的隔离队列，但不能长期忽略。

## 实践矩阵

验证开发 HMR、冷启动、生产 build、preview；测试 Chrome/WebKit、移动 viewport、键盘、慢网、离线、API 500 和 chunk 加载失败。锁定 Node、Vite、插件与浏览器版本，依赖升级单独观察。

高效前端流水线的目标不是“测试越多越好”，而是让每个风险在成本最低、最接近其真实边界的一层被捕获，并确保最终生产 bundle 也经历过真实执行。

## 参考资料

- [Vite：Why Vite](https://vite.dev/guide/why.html)
- [Vite：Guide](https://vite.dev/guide/)
- [Vitest：Guide](https://vitest.dev/guide/)
