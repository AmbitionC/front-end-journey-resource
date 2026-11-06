部署开源大模型不是“下载一个文件再启动端口”。模型许可、权重格式、分词器、运行时、硬件预算和服务边界必须彼此匹配，最终还要用自己的请求分布验收质量、吞吐和安全性。

## 先定义部署目标

选型前写清楚约束：任务类型、输入与输出长度、并发、首 token 延迟、总延迟、目标硬件、可接受精度损失、数据是否能离开设备，以及许可证是否允许当前用途。

同一个模型在“个人电脑离线助手”和“多 GPU 在线 API”中的最佳部署方式完全不同。不要先按排行榜下载最大模型，再被动处理显存和许可证问题。

## 模型卡与许可证是第一道门

[Hugging Face 的模型卡文档](https://huggingface.co/docs/hub/model-cards) 将预期用途、限制、训练数据、评测结果、许可证等作为模型说明的重要组成。部署前至少核对：

- 仓库与具体权重文件是否有明确许可证；
- 商业使用、再分发、托管服务或衍生模型是否受限；
- 模型卡声明的语言、任务、上下文长度和已知偏差；
- 是否需要执行仓库中的自定义代码；
- 量化权重是否来自可信发布者，是否说明量化方法与基座版本。

“代码仓库开源”不代表“模型权重可任意使用”。许可证解释涉及实际业务时，应由有资质人员确认，而不是让模型替代法律判断。

## 权重、容器格式与运行时

**safetensors** 是面向张量的安全、快速序列化格式，强调避免加载时执行任意代码并支持惰性加载；它不等于一个推理引擎。[官方文档](https://huggingface.co/docs/safetensors/main/index) 说明了其格式和跨框架绑定。

**GGUF** 常用于 `llama.cpp` 生态，把模型张量和运行所需元数据组织在单一文件中，并广泛承载多种量化版本。它也不是“任何模型都能直接运行”的万能格式：架构、tokenizer、聊天模板和量化类型仍需运行时支持。[llama.cpp](https://github.com/ggml-org/llama.cpp) 的目标是以较少依赖在多种本地硬件上进行 LLM 推理，并提供模型转换、量化与服务工具。

判断兼容性时逐项核对：模型架构、配置、tokenizer 文件、特殊 token、聊天模板、权重 dtype/量化类型、运行时版本。扩展名相同只说明容器相似，不保证语义兼容。

## 量化是资源与质量的交换

将权重从 FP16/BF16 压缩到更低位宽通常能降低显存和带宽需求，但质量影响取决于模型、层、量化算法、任务和上下文长度。文件名中的 “Q4” 或 “INT4” 不能单独说明精度。

应在目标硬件上比较至少三条基线：未量化或高精度版本、候选量化版本、能满足业务的更小模型。观察任务质量、首 token 延迟、生成速度、峰值内存和并发吞吐；对代码、数学、低频语言和结构化输出分别抽样。

## 运行时选择：吞吐还是本地适配

![从模型审查、格式与运行时到 API、可观测性和验收的部署栈](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-open-source-deployment-serving-stack-v1.webp)
*图：模型文件只是部署栈的一层；硬件预算、服务控制和验收共同决定能否上线。*

以两类常见路线为例：

- **vLLM 类 GPU 服务**：面向数据中心 GPU 与多请求调度，提供连续批处理、KV Cache 管理及 HTTP 服务能力；当前功能与兼容模型应以[官方文档](https://docs.vllm.ai/en/stable/)为准。
- **llama.cpp 类本地运行时**：强调 CPU、消费级 GPU 和多平台可移植性，适合本地、边缘或小规模服务；其 `llama-server` 提供包括聊天补全在内的 HTTP 接口，具体端点和参数以[服务器文档](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)为准。

二者不是严格替代关系。选择时看目标硬件、支持的架构与量化格式、批处理、前缀缓存、并行策略、监控、升级成本，而不是只比较单请求 tokens/s。

## 先算三本内存账

1. **权重**：近似为参数量乘每参数字节数，再加量化 scale、元数据和运行时开销；
2. **KV Cache**：随层数、KV 头维度、上下文长度、批量和并发增长；
3. **激活与工作区**：受预填充长度、批处理、算子实现和图编译影响。

还需预留驱动、框架、碎片和突发请求空间。仅用“模型文件大小小于显存”判断可运行会漏掉后两本账。长上下文与高并发都可能让 KV Cache 成为主瓶颈。

## 从进程到可用 API

生产入口至少需要：

- 请求体与 token 上限校验；
- 身份认证、租户隔离和速率限制；
- 超时、取消、排队上限与背压；
- 流式连接断开后的资源释放；
- 模型版本、模板版本和采样参数记录；
- 健康检查、优雅下线与过载保护。

许多运行时提供“兼容某 API”的接口，但兼容通常只覆盖部分字段。工具调用、结构化输出、usage 统计、流式事件、错误码和聊天模板都可能不同。应用侧应通过适配层隔离供应商语义，并用契约测试确认真正依赖的字段。

## 把 Prefill 与 Decode 分开：分别看请求、KV 和故障

Prefill 处理整段输入并生成后续推理需要的 KV Cache；Decode 利用已有上下文逐步生成后续 token。前者通常更偏计算密集，后者通常更受内存访问与 KV 管理影响。统一引擎里，新来的长输入可能干扰正在解码的请求；PD 分离让两类工作分别调度和扩容。[SGLang 的 PD 文档](https://docs.sglang.ai/advanced_features/pd_disaggregation.html)说明了这类干扰及其分离方案。

分离也增加了缓存握手、槽位安排与传输成本。模型版本、KV 布局、并行配置和传输后端必须兼容；网络慢或输入短时，这些成本可能抵消调度收益。不能仅因“用了 PD”就宣称吞吐提高。

![请求网关分别派发预填充和解码请求，P 与 D 完成握手并传递 KV，D 在缓存就绪后返回输出](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-open-source-deployment-pd-request-v1.png)
*图：一次正常 PD 请求的逻辑阶段。具体的 D 节点选择、KV 槽位预留与并行时机依运行时版本和策略；此图不是某个面试项目的实际架构还原。*

以 SGLang 的网关/Router 为例，入口按模型与请求属性找到可用实例组，再结合负载、前缀亲和、会话约束和准入上限选择实例。PD 模式关联 P、D 两侧的请求，P 侧计算得到 KV，D 侧在必要缓存可用后继续解码；网关处理元数据与输出，向调用方返回结果。[网关说明](https://github.com/sgl-project/sglang/blob/main/sgl-model-gateway/README.md)与[路由生命周期](https://github.com/sgl-project/sglang/blob/main/sgl-router/ARCHITECTURE.md)给出了这些阶段，具体命令、策略和兼容能力应锁定部署版本再核对。

选择上游路由时，不能只轮询“请求数最少”的实例：一个长输入可能占用很多 P 侧计算，等待 KV 的请求也可能占住 D 侧容量。分别观察 P 的排队/未缓存输入量、D 的排队与 KV 容量，并用首 token 时延、逐 token 时延、拒绝率和超时率验收。Trace 要区分排队、P 计算、KV 握手/传输和首个 Decode；部分阶段可重叠，不把指标机械相加当作端到端耗时。

| 卡在哪一段 | 应观察的证据 | 当前请求的处理边界 |
| --- | --- | --- |
| P 不可用或一直排队 | 实例健康、排队长度、阶段进展与请求截止点 | 从新请求的可选集合移除故障实例；当前请求按有界错误或重试策略收敛 |
| KV 握手/传输未完成 | 两侧请求关联、传输状态、缓存就绪与等待超时 | 不把“P 算完”当成 D 已可用；失败时释放本次请求占用的状态 |
| D 故障或输出停滞 | 实例健康、已输出片段、进展与剩余预算 | 已输出后不能悄悄换一个生成结果拼接；明确结束错误或由上游决定重新开始 |

健康检查只说明实例是否可选，不证明某个请求成功。超时、取消和清理协议需按具体实现验证，不能把文档中的某个默认秒数当成业务总预算。推理未对外输出前，可在总预算内做有限重试；如果推理链还调用了有副作用的工具，工具结果未知时应查询原操作，不能随着模型重试再执行一次。一个请求失败也不应永久占住其他独立请求的队列。

## 安全边界

优先加载无需执行远程自定义代码的权重格式；对模型文件校验来源与哈希；在低权限容器或账户下运行服务；限制外网、文件系统和设备访问；不要把模型生成的工具参数直接执行。

模型服务器与业务授权必须分离。即使模型只在本地运行，Prompt Injection 仍可能通过文档或工具结果进入上下文。网络位置“在内网”不能替代输入校验、最小权限和人工审批。

## 可观测性与基准测试

至少记录：排队时间、首 token 延迟、端到端延迟、输入/输出 token、生成速度、并发、GPU/CPU/内存、KV Cache 命中与占用、取消率、OOM 和错误类型。日志应避免原样保存敏感 Prompt。

基准必须接近真实流量。分别测试短输入短输出、长输入短输出、短输入长输出和并发突发；预热后再测稳态，并同时报告 P50/P95/P99。vLLM 提供面向延迟、吞吐和服务压力的[基准命令](https://docs.vllm.ai/en/stable/benchmarking/cli.html)，但公开分数只有在硬件、版本、模型、dtype、长度分布和并发一致时才可比较。

## 上线验收清单

- 模型卡、许可证、来源和哈希已有记录；
- 架构、tokenizer、聊天模板与运行时版本锁定；
- 高精度与量化候选在业务集上完成回归；
- 权重、KV Cache、激活三类内存均有峰值余量；
- 并发、长上下文、取消和过载测试通过；
- API 适配层覆盖流式、错误和结构化输出差异；
- 认证、限流、最小权限和审计独立于模型；
- 可以回滚到已知模型与运行时组合。

## 小结

开源模型部署是一条从许可审查到生产验收的链路。先以业务任务和硬件预算筛选模型，再验证格式、tokenizer 与运行时兼容；量化要用真实任务评估，服务要补齐认证、背压、监控和回滚。能够启动只代表实验开始，能够在目标负载下稳定、合法、可观察地运行才算部署完成。

## 从 CUDA 执行到分布式梯度同步

[NVIDIA CUDA 编程模型](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html)把 GPU kernel 的工作组织为线程、线程块与 grid。硬件执行与内存层级决定访存、同步和分支成本；框架调用 CUDA 并不表示应用作者编写过 kernel，也不能仅凭 GPU 型号推导吞吐。

训练资源估算须分别计权重、梯度、优化器状态和中间激活；推理常还要计 KV Cache。数据并行通常给每个进程一份模型、分配不同数据，反向得到局部梯度，再同步后更新。[PyTorch DDP 设计](https://docs.pytorch.org/docs/2.14/notes/ddp.html)说明 autograd hook 将就绪梯度组织为 bucket，按约定顺序进行 all-reduce，并等待必要通信完成，使对应参数使用一致的平均梯度。计算通信可重叠，但 collective 次序不一致可能挂起；DDP 不会自动替应用完成所有数据划分。

部署模型与训练模型要分开回答。推理引擎可比较 [vLLM](https://docs.vllm.ai/)、[TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/) 与 [llama.cpp](https://github.com/ggml-org/llama.cpp)，逐项核对具体版本的模型、硬件、量化、批处理与并行支持，再在固定输入长度和并发下测首 token、逐 token 时延、吞吐与错误。这里列选型入口，不宣称它们都支持同一模型或设备。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 应用开发一、二面：规划、结构化输出与部署取舍](../../../interview/bytedance/base/bytedance-base-65.md)
- [字节 Agent 实习：推理、微调与工具编排](../../../interview/bytedance/base/bytedance-base-51.md)
- [腾讯混元 AI 后台开发暑期实习一面：数据安全、OpenClaw 与并发手写](../../../interview/tencent/ai/tencent-ai-27.md)
- [腾讯混元后台开发二面：推理调度、队列与缓存故障](../../../interview/tencent/ai/tencent-ai-30.md)
- [字节 Agent：AI Coding、技能设计与模型工程](../../../interview/bytedance/base/bytedance-base-49.md)
<!-- interview-source-history:end -->

## 参考资料

- [Hugging Face Model Cards](https://huggingface.co/docs/hub/model-cards)
- [Safetensors Documentation](https://huggingface.co/docs/safetensors/main/index)
- [vLLM Documentation](https://docs.vllm.ai/en/stable/)
- [vLLM Benchmark CLI](https://docs.vllm.ai/en/stable/benchmarking/cli.html)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [llama.cpp HTTP Server](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [SGLang：PD Disaggregation](https://docs.sglang.ai/advanced_features/pd_disaggregation.html)
- [SGLang Model Gateway](https://github.com/sgl-project/sglang/blob/main/sgl-model-gateway/README.md)
- [SGLang Router Architecture](https://github.com/sgl-project/sglang/blob/main/sgl-router/ARCHITECTURE.md)
