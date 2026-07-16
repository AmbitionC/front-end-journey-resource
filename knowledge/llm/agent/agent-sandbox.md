Agent 沙箱的目标不是证明未知代码“绝对安全”，而是把一次执行限制在明确授予的能力、资源和时间窗口内，并在某一层失效时仍有下一层阻挡。模型、生成代码、下载依赖和工具输出都可能不可信，沙箱边界必须由模型之外的受信任组件建立。

## 先建立威胁模型

不同任务需要不同强度。运行纯计算表达式，主要担心 CPU、内存和解析器漏洞；运行用户项目测试，还涉及文件、进程、依赖与网络；浏览器自动化则可能接触登录态、下载、跨站请求和剪贴板。

至少列出需要保护的对象：宿主机文件、云凭证、其他租户数据、内网服务、用户会话、计算资源、审计系统和输出消费者。再列出攻击面：路径穿越、符号链接、fork bomb、syscall、容器逃逸、DNS 重绑定、元数据服务访问、提示注入后的数据外传，以及在输出中夹带脚本或密钥。

## Namespace 只是隔离视图

Linux namespace 可以让进程看到不同的进程树、挂载点、网络、用户和主机名。[Linux namespaces 手册](https://man7.org/linux/man-pages/man7/namespaces.7.html)列出了这些资源隔离机制。它们非常重要，但并不是完整安全策略：共享内核仍存在，错误挂载、过宽 capability、宿主 socket 或设备暴露都可能打穿边界。

常见基线包括非特权用户、user/PID/mount/network namespace、只读根文件系统、独立临时工作目录、最小化 `/proc`、禁用宿主 socket 和设备、丢弃 Linux capabilities、限制进程数和文件描述符。容器是封装方式，不等于自动获得这些约束。

## Syscall、资源与网络分层收口

[Linux seccomp filter 文档](https://www.kernel.org/doc/html/latest/userspace-api/seccomp_filter.html)明确说明 seccomp 通过过滤系统调用减少内核攻击面，但它不是完整沙箱。策略可只允许执行所需 syscall，并拒绝调试、挂载、内核模块、危险 namespace 创建等行为；同时还需要文件权限、capability、LSM、namespace 与资源限制。

资源预算至少包含 wall time、CPU time、内存、进程/线程数、磁盘字节、inode、输出大小和网络流量。超限应由宿主监督器终止整个进程组，而不是依赖子进程自行退出。网络默认 deny，只允许解析并访问批准域名、端口与协议；对解析后的 IP 再检查，屏蔽 loopback、链路本地、私网和云元数据地址。

![Agent 的执行请求先经过身份、审批、能力和预算策略，再凭最小能力令牌进入限制文件、网络、进程与时间的沙箱](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-sandbox-capability-boundary-v1.webp)
*图：策略代理在执行前发放窄能力，沙箱输出还要经过扫描和审计才能返回。*

## Capability 比环境继承更安全

不要把宿主环境变量、完整 HOME 或云凭证复制进沙箱。调用方应请求一组窄能力，例如“只读这三个文件”“向这个 HTTPS origin 发 GET”“写入 20 MB 临时目录”“运行 30 秒”。策略服务校验身份、租户、审批与预算后，发放短期能力令牌或直接建立资源句柄。

能力应不可转授、可过期、绑定 job ID，并由执行层重新验证。文件最好通过预打开目录或明确句柄访问，避免让代码在全局文件系统中寻找路径。[Wasmtime 安全文档](https://docs.wasmtime.dev/security.html)说明 WebAssembly/WASI 的安全边界与显式资源暴露模型，同时强调运行时配置、已知漏洞和 defense in depth 仍然重要；使用 WASM 不意味着宿主实现可以不设防。

## 文件系统设计

工作目录按 job 新建，基础镜像只读，写层可丢弃。导入文件先规范化路径，拒绝绝对路径、`..`、设备文件和越界符号链接。解压归档时限制文件数量、总大小和压缩比，防止 zip bomb。执行结束后按策略导出特定文件，而不是把整个目录打包返回。

代码依赖安装是额外供应链风险。更稳妥的方式是使用锁文件、内部镜像、批准包 allowlist 和无安装脚本模式；确需联网安装时使用隔离缓存，不把长期仓库 token 暴露给安装进程。

## 输出也属于攻击面

沙箱没有读取宿主密钥，不代表输出安全。输出可能包含用户文档、下载内容、超长日志、ANSI 控制序列、HTML/Markdown 注入或对下游 Agent 的提示注入。返回前应限制字节数，规范化编码，剥离控制字符，对文件做类型嗅探与恶意内容扫描，并标注来源。

日志中只保留必要摘要；敏感内容单独加密存储，并用受控链接按需访问。任何“把输出直接拼回系统提示”的做法都会把执行隔离变成新的上下文注入通道。

## 监督器与生命周期

宿主监督器负责创建沙箱、注入最小输入、启动、监控、超时取消、收集退出状态、扫描输出和销毁。状态至少区分 `created`、`running`、`cancelling`、`exited`、`killed`、`unknown`。取消请求不等于进程已经终止；只有监督器确认进程组与子资源清理完成，才能标记 killed。

每个 job 使用唯一 ID、镜像摘要、策略版本和资源账本。沙箱重用虽能降低启动成本，却会带来租户数据残留、后台进程和缓存污染；默认一次一环境，高吞吐场景也需经过可信清理和隔离证明后才允许池化。

## 常见错误

- 只启动 Docker 就宣称安全，没有丢 capability、网络和宿主挂载；
- 允许任意出网，导致内网探测或数据外传；
- 把完整代码仓库与 `.env` 一起挂载；
- 仅限制请求超时，没有限制子进程、CPU、磁盘与输出；
- 共享可写缓存或 HOME，造成跨任务污染；
- 信任文件扩展名与模型声明的 MIME；
- 将 seccomp 或 WASM 当作单一万能边界；
- 执行结束后直接把原始输出送入浏览器或另一个 Agent。

## 测试与观测

建立攻击性回归集：读取宿主路径、遍历/符号链接逃逸、访问 metadata IP、fork bomb、无限内存、超大输出、后台守护进程、归档炸弹、DNS 变更和恶意控制字符。测试不仅看进程失败，还要确认没有外部副作用、资源被回收且审计事件完整。

记录 job、principal、tenant、镜像 digest、策略版本、授予能力、拒绝原因、实际 CPU/内存/网络/磁盘、退出码、超时阶段、输出扫描结论和清理结果。指标关注沙箱启动延迟、策略拒绝率、预算终止、异常 syscall、网络阻断、逃逸探针和清理失败。

## 小结

可信沙箱来自多层、最小、默认拒绝的能力边界：namespace 隔离视图，seccomp 和 capability 缩小内核面，文件与网络策略限制可达资源，预算控制消耗，监督器确认生命周期，输出扫描保护下游。任何单层都可能失效，因此设计必须允许下一层继续阻断并留下证据。

## 参考资料

- [Linux man-pages — namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Linux Kernel — Seccomp BPF](https://www.kernel.org/doc/html/latest/userspace-api/seccomp_filter.html)
- [Wasmtime — Security](https://docs.wasmtime.dev/security.html)
