### 字节 Agent 开发日常实习一面（2026 年 8 月）

公司：字节跳动；岗位：Agent 开发；招聘场景：日常实习；轮次：一面。帖子发表于 2026 年 8 月，作者记录8.05、约1小时，日期文字未注明年份。

背景、经历及提问范围来自候选人自述，未独立证实。原题按可见记录归纳；各题下的答题思路为教学整理，不代表作者实际作答或企业标准答案。

## 教学演算：先走一次具体任务

教学设定用户只读查询租户A的订单o1。初态goal={tenant:A,order:o1,action:read}、result为空；模型节点提出查询，执行器从授权状态核对A后读取DB，返回{order:o1,amount:100,status:paid}，结果节点写入tool_results并保存检查点，回答“已付款，金额100个约定最小单位”。金额单位必须来自业务合同；模型提出B的订单时拒绝。恢复使用已保存结果与版本，不把重连当重新执行副作用；两并行节点同step写result无reducer会报错，须分开键或定义合并。例子未在完整环境运行。

#### （1）什么是 Token？

Token 是模型 tokenizer 按词表规则把输入切分后得到的离散单元，模型实际接收的是 Token ID，再通过嵌入层转换成向量。它不固定等于一个字、一个汉字或一个英文单词；同一段文本在不同模型上也可能得到不同 Token 数。

回答时最好继续说明工程影响：Token 数共同占用上下文窗口，影响输入输出计费、首 Token 延迟、截断策略和 KV Cache 规模。精确预算应使用目标模型对应的 tokenizer 或接口 usage，而不是按字符数硬估。

延伸阅读：[Token、Context Window 与 KV Cache](../../../knowledge/llm/basics/llm-token-context.md)。

#### （2）LangGraph 在项目中起什么作用？

LangGraph 适合把有状态、会分支、可循环的 Agent 流程显式建模为图：

- **State** 保存节点共享的结构化数据；
- **Node** 负责一个执行函数，可计算、调用模型或工具，不保证输出确定性；
- **Edge** 决定下一步执行哪个节点，条件边可表达重试、审批和结束；
- **Checkpointer** 在 graph super-step 边界保存状态，使中断恢复、人工审批和故障重试成为可能。

它的价值不是“让模型更聪明”，而是让控制流、状态更新和恢复边界可观察、可测试。项目回答必须落到自己的流程：哪些节点需要循环，为什么不用普通函数串联，失败后从哪里恢复。

#### （3）LangGraph 的 State 应保存哪些字段？

State 没有一套所有项目通用的固定字段，它由业务 schema 定义。一个工具型 Agent 可以包含：

下面为未在完整项目运行的类型示意。

```python
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_goal: str
    plan: list[str]
    current_step: int
    tool_results: dict[str, object]
    retry_count: int
    approval: Literal["pending", "approved", "rejected"]
    error: str | None
```

关键取舍是只保存驱动后续决策所需、能够序列化的状态；大文件、连接和临时句柄只存引用。`thread_id`、checkpoint ID 等运行标识通常放在运行配置或检查点元数据中，不应和业务字段混为一谈。并行节点在同一 super-step 更新同一个未定义 reducer 的键，会触发 InvalidUpdateError；应定义合并语义或避免并行写同一键。

延伸阅读：[工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)。

#### （4）JVM 为什么区分新生代和老年代？

以JDK21的G1为教学环境，分代假设是多数对象短命，因此年轻代回收可集中处理更可能释放的区域。G1把堆分成regions，普通对象从Eden分配，存活对象可能进入Survivor或Old；humongous对象可直接属于Old，并不是所有对象都先从新生代逐龄晋升。混合回收也会在处理年轻代的同时回收部分老年代区域，记忆集用于追踪跨区域引用。暂停受存活量、收集集合与并发阶段影响，目标不是绝对时限保证，参见[Oracle JDK21 G1 Heap Layout / GC Cycle](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-g1-garbage-collector1.html)。原帖未披露所用JDK/收集器，不能据此还原作者项目。

#### （5）怎样讲 Spring Boot 项目的亮点？

亮点不是框架清单，而是“问题—约束—方案—取舍—结果”的闭环。以秒杀异步削峰为例，可以这样组织：

1. 先说明流量峰值、库存一致性和响应时延约束；
2. 入口做限流和幂等校验，避免重复下单；
3. 用消息队列把接单与订单落库解耦，吸收瞬时峰值；
4. 说明库存扣减的真相源、失败补偿、消息重复和最终一致性；
5. 用压测数据、队列积压和错误率证明优化有效，并讲清方案的代价。

如果只能说“用了 Redis 和 MQ”，面试官无法判断候选人是否真正解决过问题。

#### （6）Java 中常见的锁有哪些，如何选择？

- `synchronized`：语言级互斥，结构简单，退出代码块会自动释放；
- `ReentrantLock`：支持可中断获取、超时、公平策略和多个条件队列，但必须在 `finally` 中释放；
- `ReentrantReadWriteLock`：读多写少时允许并发读；
- `StampedLock`：提供乐观读，适合特定读密集场景，但不是可重入锁；
- `Atomic*` / CAS：适合单变量或很小的无锁状态更新，冲突高时会产生重试成本。

选择依据是临界区、竞争强度、是否需要超时/中断、读写比例和可维护性，而不是背“锁越高级越快”。还要区分 JVM 进程内锁与 Redis/数据库等分布式协调手段。

#### （7）分页与分段怎样协作？

分段按代码、堆、栈等逻辑区域组织地址，便于表达保护和共享；分页把地址空间切成固定大小的页，便于物理内存分配和换页。采用段页式时，逻辑地址先由段号定位段表并完成边界/权限检查，再把段内偏移拆成页号和页内偏移，通过页表得到物理页框。

现代通用操作系统通常以分页为主要虚拟内存机制，但“段的逻辑视角”和“页的物理管理视角”仍是理解地址转换、保护和缺页处理的好方法。

#### （8）HTTP 和 HTTPS 有什么区别？

HTTPS 是在 HTTP 与传输层之间加入 TLS：握手阶段验证服务端证书、协商密钥，之后用对称加密保护内容并用完整性校验防篡改。它解决机密性、完整性和身份认证；HTTP 明文传输，不具备这些保证。

性能差异不能只回答“HTTPS 更慢”。现代 TLS 支持会话复用、TLS 1.3 更少的握手往返，真实开销还取决于网络 RTT、证书链和连接复用。

#### （9）如何删除字符串中的重复字符，并保持字典序最小且相对顺序不变？

这是“去除重复字母”的单调栈模型。统计每个字符剩余次数，用集合记录是否已入栈；新字符若比栈顶小、且栈顶后面还会再次出现，就弹出栈顶，给它以后重新进入的机会。

下面为未在完整项目运行的代码示意。

```ts
function removeDuplicateLetters(text: string): string {
  const remaining = new Map<string, number>();
  for (const char of text) remaining.set(char, (remaining.get(char) ?? 0) + 1);

  const stack: string[] = [];
  const used = new Set<string>();
  for (const char of text) {
    remaining.set(char, remaining.get(char)! - 1);
    if (used.has(char)) continue;
    while (
      stack.length > 0 &&
      stack.at(-1)! > char &&
      remaining.get(stack.at(-1)!)! > 0
    ) {
      used.delete(stack.pop()!);
    }
    stack.push(char);
    used.add(char);
  }
  return stack.join("");
}
```

时间复杂度为 $O(n)$，因为每个字符最多入栈、出栈各一次。

## 面试口述与教学追问

口述要点：图控制状态和恢复，工具执行权来自运行时；状态Schema合法不等于结果正确，按业务字段和证据验收，固定流程不必上复杂图。

下面是模拟变条件追问，不是来源面经原题：

- 如果图中两个并行节点写同一个状态键，怎样处理？——定义适合业务的 reducer，或分开键/所有者；不能默认后写覆盖。
- 原始日志太长，是否删除它们只保留摘要？——可减少活跃上下文，源记录仍按保留策略持久化并用引用回取，关键约束单独验证。

## 整理答案的核验资料

核验于 2026-10-02。LangGraph 为滚动文档；MCP使用2026-07-28规范，MySQL使用8.4。未声称执行了作者的项目或复现其面试。

- [LangGraph 状态 reducer 与并发错误](https://docs.langchain.com/oss/python/langgraph/errors/INVALID_CONCURRENT_GRAPH_UPDATE)
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)

- [JavaSE21 locks：锁与条件队列](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/package-summary.html)
- [OSTEP作者教材：Segmentation地址转换与保护](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-segmentation.pdf)（教学地址模型，非特定现代系统承诺）
- [RFC8446：TLS1.3握手与记录保护](https://www.rfc-editor.org/rfc/rfc8446)
