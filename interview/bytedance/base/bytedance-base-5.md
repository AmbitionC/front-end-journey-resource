### 字节 Agent 开发日常实习一面（2026 年 8 月）

这份面经来自一篇 A 级第一手记录。下面保留真实提问范围，并把原帖中较零散的回答整理为可复习、可追问的版本。

#### （1）什么是 Token？

Token 是模型 tokenizer 按词表规则把输入切分后得到的离散单元，模型实际接收的是 Token ID，再通过嵌入层转换成向量。它不固定等于一个字、一个汉字或一个英文单词；同一段文本在不同模型上也可能得到不同 Token 数。

回答时最好继续说明工程影响：Token 数共同占用上下文窗口，影响输入输出计费、首 Token 延迟、截断策略和 KV Cache 规模。精确预算应使用目标模型对应的 tokenizer 或接口 usage，而不是按字符数硬估。

延伸阅读：[Token、Context Window 与 KV Cache](../../../knowledge/llm/basics/llm-token-context.md)。

#### （2）LangGraph 在项目中起什么作用？

LangGraph 适合把有状态、会分支、可循环的 Agent 流程显式建模为图：

- **State** 保存节点共享的结构化数据；
- **Node** 负责一次确定的计算、模型调用或工具调用；
- **Edge** 决定下一步执行哪个节点，条件边可表达重试、审批和结束；
- **Checkpointer** 在 graph super-step 边界保存状态，使中断恢复、人工审批和故障重试成为可能。

它的价值不是“让模型更聪明”，而是让控制流、状态更新和恢复边界可观察、可测试。项目回答必须落到自己的流程：哪些节点需要循环，为什么不用普通函数串联，失败后从哪里恢复。

#### （3）LangGraph 的 State 应保存哪些字段？

State 没有一套所有项目通用的固定字段，它由业务 schema 定义。一个工具型 Agent 可以包含：

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

关键取舍是只保存驱动后续决策所需、能够序列化的状态；大文件、连接和临时句柄只存引用。`thread_id`、checkpoint ID 等运行标识通常放在运行配置或检查点元数据中，不应和业务字段混为一谈。并行节点写同一字段时还要定义 reducer，否则更新可能互相覆盖。

延伸阅读：[工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)。

#### （4）JVM 为什么区分新生代和老年代？

分代收集利用“多数对象很快死亡，少数对象长期存活”的经验规律：新对象优先进入新生代，新生代满时只处理较小区域；多次存活的对象晋升到老年代，老年代以更低频率回收。这样大多数回收只扫描新生代中的少量存活对象，通常比每次遍历整个堆更高效。

不要把“Minor GC 一定快、Major GC 一定慢”说成绝对规则；暂停时间还取决于收集器、堆布局、存活对象和并发阶段。面试中应先讲分代假设，再讲晋升、对象年龄和跨代引用带来的记忆集成本。

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
