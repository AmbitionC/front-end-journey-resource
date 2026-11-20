公司：腾讯；岗位：游戏安全后台开发；轮次：一面。原文未明确面试年份，因此不补年份。

本文仅整理已见文字；配图内容未能核验。DCI、Pi 及自研 Harness 的项目细节保留待补。以下回答思路由编辑整理，不代表当事人的现场作答或实验结果。

<details data-knowledge-key="os-process-thread"><summary>（1）从操作系统进程角度看，Python 脚本和 Java 程序怎样运行起来，解释器或 JVM 与业务代码是什么关系？</summary></details>
<p>以普通命令行启动为例，操作系统装入 Python 解释器或 Java 启动器，运行时在该进程内执行脚本或业务字节码；业务代码不天然另占一个进程。Linux/POSIX 的经典启动路径可由父进程 fork 后在子进程 exec 装入运行时，exec 替换映像且保持 PID。Python 解析执行、JVM 类加载与执行属于用户态运行时机制，进程创建、装载和调度则属于操作系统层面的解释。</p>

<details data-knowledge-key="agent-intent-clarification"><summary>（2）关键词意图路由的规则怎样匹配和维护？为什么不全部交给大模型，命中比例又怎样统计？</summary></details>
<p>先界定精确命令、子串或正则等匹配方式，再把规则标识、优先级、目标意图和版本一起管理，回归否定、多意图及冲突样本。边界清楚的请求可用规则提出候选，模糊请求再进入模型或澄清，但任何路径都要保留权限和槽位检查。命中比例应按固定时间窗、版本与请求去重口径实测，并另查命中后正确性；原文没有给出实际方法或比例，不能替项目补一个数字。</p>

<details data-binding-status="pending_semantic_verification"><summary>（3）原文提到的 DCI 问答是怎样实现的？</summary><p>关联知识点待核实。</p></details>
<p>原文未展开 DCI 的含义、输入输出与系统边界，无法据此补写实现。保留原题，待关键定义与实际过程补齐后再关联知识点。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）项目是否只是用 Python 调用 Pi 进程，Agent 本身没有改动？</summary><p>关联知识点待核实。</p></details>
<p>这是原文中的确认式提问，未记录当事人的确认回答。Pi 对应产品、仓库、版本及实际改动均未说明，不能推定具体实现。</p>

<details data-binding-status="pending_semantic_verification"><summary>（5）自研 Harness 与消融实验做了什么，能否据此判断工具质量比 Agent 能力更重要？</summary><p>关联知识点待核实。</p></details>
<p>原文没有给出 Harness 实现、对照变量、数据、指标或真实实验结果。保留追问，不能把面试官提出的假设写成实验结论，也暂不据此关联知识点。</p>

<details data-knowledge-key="agent-architecture"><summary>（6）结合一个项目，怎样说明 AI Agent 是如何工作的？</summary></details>
<p>沿目标与观察、状态更新、模型决策、受控工具执行、结果校验和继续或停止的循环说明各模块职责。模型负责提出下一步，宿主负责工具、权限、预算和状态；一次工具返回成功也不等于任务已经完成。项目陈述应展示真实轨迹和自己的改动，不能把框架名称当成实现证明。</p>

<details data-knowledge-key="function-calling"><summary>（7）外部工具在哪里执行，大模型又怎样知道有哪些工具可调用？</summary></details>
<p>应用向模型提供当前允许的工具名称、用途和参数 Schema，模型据此提出带调用标识的结构化请求。宿主完成参数、业务与权限校验后，在实际工具服务或受控执行环境中调用，再把结果与原调用关联回传。自定义工具不会因为模型生成了名称就自动在模型内部执行，也不能用工具描述替代服务端授权。</p>

<details data-knowledge-key="transformer-arch"><summary>（8）大模型收到请求后如何生成下一个 token？何时停止，EOS 标识符又如何产生？</summary></details>
<p>以常见自回归 Transformer 为例，输入经分词和多层计算后得到词表上的 logits，再由解码器贪心选择或按调整后的分布采样一个 token，追加到前缀继续预测。在训练数据用 EOS 标记结束边界、且该位置参与训练目标时，模型会学习预测这一特殊 token ID；推理选出它后，生成循环按配置停止。达到长度上限、命中停止串等条件也能结束输出，所以不能把每次停止都解释成生成了 EOS。</p>

<details data-knowledge-key="llm-token-context"><summary>（9）KV Cache 是做什么的？为什么新生成的 token 需要看前面的 token？</summary></details>
<p>KV Cache 保存各层已处理位置的 K/V，让 Decode 只计算新位置的 Q/K/V，并读取历史缓存，避免重算整个前缀。自回归预测以前缀为条件，较早的词也可能决定后续内容，所以只输入最新 token 时仍需相应历史缓存。标准全量因果注意力可读取此前未被屏蔽的位置，但这不表示每个位置同等重要；滑动窗口、分块等注意力的可见范围和缓存上限不同，不能说所有模型每步都必须读取全部历史。</p>

<details data-knowledge-key="function-calling"><summary>（10）单次模型调用本身不保留应用状态，为什么 Agent loop 能延续之前的信息？</summary></details>
<p>循环的宿主保存消息、工具调用与结果，每轮把所需历史重新组装给模型，或按具体提供方协议引用服务端保存的会话状态。延续的是应用管理的上下文，不是一次请求自动修改了模型权重；文件或数据库里有记录，也不表示模型这一轮已经读到它。还要控制历史预算、校验新旧状态和停止条件，不能仅凭“记得前文”保证稳定产出。</p>

<details data-binding-status="pending_semantic_verification"><summary>（11）是否查看过原文所称 Pi 中相关功能的实现？</summary><p>关联知识点待核实。</p></details>
<p>原文未给出 Pi 的确切标识、版本、代码路径或候选人的回答。待对象及实现证据明确后再核对，暂不推断某个同名项目。</p>

<details data-knowledge-key="os-process-thread"><summary>（12）操作系统中的进程怎样启动，并在启动后运行、阻塞和退出？</summary></details>
<p>以 Linux/POSIX 为例，创建进程与装入程序是不同步骤：fork 创建新 PID 的子进程，exec 在同一 PID 下替换程序映像，具体启动器也可能采用 posix_spawn。装载与用户态初始化后，可运行执行流由内核调度，等待 I/O 时可能阻塞并在条件满足后被唤醒。程序退出后父进程可通过等待接口取得退出状态，不能把“有资源”当作完整启动过程。</p>

<details data-knowledge-key="fastapi-basics"><summary>（13）FastAPI 是什么，主要用来解决哪些 Web 服务开发问题？</summary></details>
<p>FastAPI 是用于构建 Python API 的 Web 框架，基于 Starlette 的 ASGI 能力，并用 Python 类型声明与 Pydantic 支持数据校验和序列化。它提供路由、依赖注入以及基于 OpenAPI 的自动接口文档，常用于把业务逻辑或模型调用包装成 HTTP 服务。async 路由适合配合非阻塞 I/O，但同步阻塞调用和 CPU 密集工作仍需按执行模型处理，框架不会自动把所有任务变成并行计算。</p>

<details data-knowledge-key="spring-mvc-request-routing"><summary>（14）在 Spring Boot 的 Servlet/MVC 应用中，HTTP 请求怎样按地址进入对应业务方法？若自己设计分派机制，哈希定位类后怎样通用调用，业务控制器必须继承统一基类吗？</summary></details>
<p>Servlet 容器先接收请求，经适用的 Filter 链后交给 DispatcherServlet；后者用 HandlerMapping 找到处理器，再选择 HandlerAdapter 解析参数并调用控制器方法。注解式控制器通过 RequestMapping/GetMapping 等声明路径、HTTP 方法和其他匹配条件，返回值再按消息转换或视图协议处理。若设计简化分派器，应分开注册元数据、匹配条件、参数绑定与适配调用；哈希找类只是局部手段，注解路由并不要求每个业务控制器继承统一基类。</p>

