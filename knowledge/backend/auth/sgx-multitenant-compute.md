面试给定“租户有 1GB 输入，EPC 可用预算约 512MB”，应先区分总数据量、当前工作集和系统的实际 EPC 容量。EPC（Enclave Page Cache）承载受 SGX 保护的 enclave 页；enclave 是一段隔离执行的代码与状态。**512MB 是本题假设，不是 SGX 通用规格**，实际容量依赖处理器、平台配置和运行环境。[Intel 的容量说明](https://www.intel.com/content/www/us/en/support/articles/000059614/processors/intel-xeon-processors.html)要求按平台确认。

本文用租户 A 的订单金额求和贯穿讨论：输入对象 `orders/v7` 约 1GB，输出只有总额。为便于演算，下面具体取 1GiB（1,024MiB）输入、16MiB 一块，共 64 块；这不是原题给出的精确单位或块大小。目标是限制受保护工作集，同时拒绝被替换、截断或回放的输入，并判断吞吐瓶颈。这里是设计演算，没有在 SGX 实机运行，也没有吞吐或换页性能测量。

## 先分清两条数据离开 EPC 的路径

一条路径是系统软件把 EPC 页逐出，CPU 执行 SGX 指令保护页；另一条是应用主动把业务对象保存到外部存储。两者保护对象不同，不应混成“SGX 自动加密了所有磁盘文件”。

### SGX 指令保护的 EPC 分页

工作集超过预算时，系统软件可用 SGX 分页指令逐出页；它管理调度和非可信存储，保护由 CPU 的 SGX 机制执行。[Intel EWB/ELDU 说明](https://www.intel.com/content/www/us/en/support/articles/000088228/software/intel-security-products.html)明确换出前加密、装回时解密。

原始研究 [SGX Explained §5.5.2、§5.5.4、§5.5.5](https://eprint.iacr.org/2016/086.pdf)进一步解释：EWB 输出加密页、页元数据与 MAC 标签，页版本保存在受保护的版本数组中；ELDU/ELDB 装回时核验 EWB 产生的 MAC。页内容、元数据和版本共同参与保护，校验失败不能把被篡改页当可信状态装回。这是 EPC 页逐出与恢复的边界，不可外推为任意业务对象、数据库版本或 enclave 重建后的应用状态都自动新鲜。

因此 1GB 输入不一定意味着“无法运行”，但让大量随机访问不断跨越 EPC 预算，可能付出页逐出、恢复与访问等待成本。[Intel 性能白皮书的 Excessive writing of pages 小节](https://cdrdv2-public.intel.com/671502/intel-sgx-performance-considerations.pdf)解释了逐出页的额外开销及并发 enclave 带来的资源压力。是否成为瓶颈需要实际量测；不能由 `1GB > 512MB` 直接推出吞吐下降多少。

### 应用主动外置对象

如果应用自己把订单块写到对象存储，它不是调用 EWB 保存 EPC 页，而是在业务层处理数据。本文选用成熟库提供的 AES-256-GCM 作为 AEAD（认证加密）示例；关联数据是随密文认证、但不加密的身份字段。应用把租户、对象 ID、版本、清单摘要、用途、块序号和块长度作无歧义编码，enclave 按可信任务要求重建这些字段再验证，不能直接采用文件自报的字段。

[RFC 5116 §1.2、§2、§3.1、§5.2](https://www.rfc-editor.org/rfc/rfc5116.html)定义 AEAD 接口、nonce 要求和 AES-256-GCM，但不包办抗重放、访问控制或整份输入是否齐全。旧 v6 密文在它原来的身份字段下仍可能认证通过；enclave 必须用本次任务可信选定的 v7 字段核验。旧清单即使签名有效，也不能单独证明它就是当前应处理的版本。

GCM 的 nonce 是每次加密使用的数值，同一密钥下必须唯一，本文采用 12 字节 nonce。租户使用独立密钥；同一租户密钥跨对象、版本和重启继续使用时，由可信、可持久化且不能被主机回滚的计数器先预留 nonce 区间再加密，崩溃后跳过已预留区间，耗尽时禁止回绕。**块序号从 0 重开、版本写进关联数据，都不会创造新的 nonce 空间。** 重试可返回已有密文；若要重新加密就取新 nonce。恢复时无法确认计数器进度，应停止用旧密钥写入，或由可信密钥服务发放从未使用的新密钥。这是按 [RFC 5116 §3.1 与 GCM nonce 重用边界 §5.1.1](https://www.rfc-editor.org/rfc/rfc5116.html)设计的应用规则。

## 最小端到端：只求和，不把 1GB 同时装进 enclave

先确认求和允许分块，金额按业务选定的整数最小单位累计，并定义溢出处理。示例假设记录边界与块边界对齐；实际格式若跨块，还需有界的解析状态与单条记录长度上限。下面的 16MiB 块大小仅用于说明，不是硬件或性能建议。可信任务清单（manifest）规定“本次必须处理哪些字节”，它和逐块认证分别解决完整覆盖与单块篡改的问题。以下步骤是从这些机制推导的设计方案。

1. **接入与授权**：可信逻辑接收任务 `(tenant=A, object=orders, expectedVersion=7)`，检查调用者的对象读取与结果接收权限。从数据拥有者的可信版本服务取得本次任务选定的 manifest 摘要，再取得并验证对应清单。清单绑定租户、对象、版本、密钥 ID、总字节数、块大小、总块数、末块长度和按原始字节计算的抗碰撞内容摘要。示例值是 1,073,741,824 字节、64 块、末块 16MiB。旧清单签名本身不能替代可信版本记录。远程证明为 enclave 身份、平台状态和密钥释放策略提供证据；它不代替业务授权。[Intel 证明服务的 Remote Attestation 小节](https://www.intel.com/content/www/us/en/developer/tools/software-guard-extensions/attestation-services.html)说明了身份与安全通信的用途。
2. **读取一块**：enclave 持有 `nextIndex=0`，向不可信存储请求第 0 块。先限制长度，将本块密文与元数据复制到 enclave 管理的缓冲区，避免验证后外部缓冲区又被改写；再根据 manifest 和 `nextIndex` 构造关联数据、验证标签并解密。只有序号、长度与预期一致且认证通过，才解析金额。缺块、重复块、错误标签或超长输入都不能进入累计状态。[Intel 开发指南 Inputs Passed by Reference，p.13](https://community.intel.com/legacyfs/online/drupal_files/managed/33/70/intel-sgx-developer-guide.pdf)要求防止外部数据在检查后被修改。
3. **更新小状态**：enclave 保存累计总额、已处理字节数、内容摘要状态和下一块位置。处理完第 0 块，`nextIndex` 才变成 1；释放或复用本块缓冲区，再请求第 1 块。因此输入总量与峰值工作集不相等，计算也不能对未验证的块先产生外部结果。
4. **读取下一块**：调度器限制并发租户的在途块。若实现同时保留 16MiB 密文和 16MiB 明文，一个在途任务仅这两份缓冲区就占 32MiB，8 个是 256MiB；这是内存预算演算。代码、线程栈、运行时、中间状态和分页元数据还要占空间，须按所有活跃租户的峰值之和预留余量，不能用 `512/16=32` 宣称支持 32 个租户。
5. **产出与恢复**：只有全部预期序号均处理一次，块数为 64、累计字节数和末块长度匹配，并且完整内容摘要等于 manifest 的承诺，才通过 enclave 内建立的认证加密通道，向获授权接收方输出与任务及清单摘要绑定的结果。断点同时绑定清单摘要、累计值、摘要状态、字节数和 `nextIndex`，经认证加密保存；重启后还要与可信进度记录中的断点代次/摘要核对，才可继续。解密成功不证明断点最新，也不能把旧累计值与新的块位置混用。

现在检查截断反例：主机正确返回第 0–31 块，每个标签都有效、序号也连续，然后谎报 EOF。若代码把 EOF 当结束条件，就会输出半份订单的总额。上述设计此时仍期望 `nextIndex=32` 的第 32 块，且只有 32/64 块、512MiB/1GiB，因此拒绝“完成”；EOF 不能改写可信 manifest。这也是为什么“逐块 AEAD + 连续序号”仍不足以证明整份输入完整。

这里少量累计状态能准确替代已处理输入，所以分块成立。反例是算法要求对全部记录作随机两两比较，或构建大于预算的索引；只把输入切成小块不会让中间状态自然变小。需要换算法、外部排序/分区、受保护的外置中间结果，或减少并发/增加实际资源，并检查结果语义是否相同。

## 多租户隔离不止“一租户一个 enclave”

独立 enclave 可提供执行边界，但任务入口、密钥释放、对象路径、缓存、日志和输出仍需一致的租户范围。单个 enclave 服务多个租户时，可信代码就是隔离的一部分：所有读取和解密都从授权合同绑定租户，不能直接相信模型或外部请求提供的 tenantId。

检查两个反例：租户 A 提交 B 的对象路径，必须在权限/对象合同处拒绝；A 的块序号 1 被替换成 A 的块序号 2，必须在关联数据和期望序号处失败。只验证“密文没被改过”不能解释这些隔离要求。

SGX 也不保证主机始终提供 CPU、内存或 I/O：任务要靠主机调度，主机仍可拖延或拒绝执行。远程证明认证的是执行环境与软件身份，不是在证明该软件没有 bug。访问模式和侧信道要按具体威胁模型处理；[Intel 开发指南 Protection from Side-Channel Attacks，p.51](https://community.intel.com/legacyfs/online/drupal_files/managed/33/70/intel-sgx-developer-guide.pdf)明确要求开发者承担相应防护责任。受保护执行不会修复 enclave 内部错误算法或越权代码；前面的授权、输入检查和可信状态都是安全前提。

## PV 增长四倍，为什么完成吞吐不增长

先定义口径：PV 若表示进入页面或提交需求，是到达量；吞吐是单位时间完成的合格任务数，两者不同。固定资源接近饱和后，需求增长可能主要增加排队，不能据此认定 SGX 异常。

仍用相同的 1GiB 求和任务作假设演算：固定机器的完成能力为 10 项/分钟，提交量原已达 10 项/分钟，稳定时完成量也是 10 项/分钟；若 PV 与提交一一对应，四倍后是 40 项/分钟。忽略瞬时波动且无丢弃时，每分钟新增 30 项积压，完成吞吐仍为 10 项/分钟；有界队列则可能开始拒绝请求。这里的容量是假设，不是 SGX 基准结果。若每次提交的数据本身也变大，每项服务时间还可能增加，任务数吞吐甚至下降，因此要同时比较任务数、字节数与输入分布。

用同一输入、算法和资源配置，分别改变并发与工作集，记录成功率、排队时间、执行延迟分位和完成吞吐。再拆解 CPU 计算、加解密、EPC 分页、存储/网络、锁与连接池等待：如果较小工作集显著减少分页且吞吐恢复，才增强分页瓶颈假设；如果 CPU 已饱和而分页没有同步变化，先查算法/profile；如果 CPU 低而等待高，查 I/O 和配额。都是诊断路径，不是未经测量的结论。

## 面试口述与教学补充

“我先把总输入和活跃工作集分开。求和可分块，限制并发并保留小累计状态；EPC 分页由 SGX 指令保护，应用外置对象还要 AEAD、唯一 nonce 和可信 manifest，防止替换、截断与旧版本回放。证明不替业务授权。四倍 PV 先核对到达量与完成量，再量测分页、CPU 和等待；固定资源饱和时可能只增加队列。”

以下为教学模拟追问，不是来源面经原题：

- **64 块中只返回前 32 块，然后 EOF；标签和序号都正确，能输出吗？** 不能；可信 manifest 仍要求完整的 64 块、总长度和内容摘要，合法前缀不等于完整对象。对应“产出与恢复”的完成条件。
- **改成全局排序，16MiB 分块还能直接求结果吗？** 不能照搬求和累计器；需要外部归并等算法及受保护中间对象，核对排序语义并重新估计工作集。对应分块成立的边界。
- **重启后写 v8，块序号又从 0 开始，能在同一密钥下复用 v7 的 nonce 吗？** 不能；关联数据中的版本不会解除 GCM 的唯一性要求，必须继续可信计数器，或使用从未用过的新密钥。对应应用外置对象的 nonce 规则。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云 Agent Infra 一面：SGX、吞吐与日志写入（2026 年 9 月发帖）](../../../interview/alibaba/ai/alibaba-ai-8.md)（cluster-21f88c2e7c88）
<!-- interview-source-history:end -->

## 参考资料与核验范围

核验于 2026-10-02。Intel 支持页与证明服务是滚动文档；容量页标注 **Last Reviewed: 06/01/2026**，不是发布或更新日期。SGX Explained 为 ePrint 2016/086，页面记录最后修订于 2017-02-21；本文只用其分页机制，不外推旧代容量。开发指南取 Windows 2.7（2020-03）版的输入与侧信道边界；性能白皮书标注 ©2018，用于开销原因，不采用旧环境的性能数字。RFC 5116（2008-01）用于 AEAD 接口和 GCM nonce 约束。

- [Intel：EPC页加密与EWB/ELDU](https://www.intel.com/content/www/us/en/support/articles/000088228/software/intel-security-products.html)
- [Intel：按处理器与配置确认EPC容量](https://www.intel.com/content/www/us/en/support/articles/000059614/processors/intel-xeon-processors.html)
- [Intel：Attestation Services / DCAP](https://www.intel.com/content/www/us/en/developer/tools/software-guard-extensions/attestation-services.html)
- [Costan、Devadas：SGX Explained，§5.5.2/5.5.4/5.5.5](https://eprint.iacr.org/2016/086.pdf)
- [RFC 5116：AEAD接口、nonce与抗重放边界](https://www.rfc-editor.org/rfc/rfc5116.html)
- [Intel：Developer Guide 2.7，Inputs Passed by Reference 与 Protection from Side-Channel Attacks](https://community.intel.com/legacyfs/online/drupal_files/managed/33/70/intel-sgx-developer-guide.pdf)
- [Intel：Performance Considerations，Excessive writing of pages 与 Additional Performance Notes](https://cdrdv2-public.intel.com/671502/intel-sgx-performance-considerations.pdf)
