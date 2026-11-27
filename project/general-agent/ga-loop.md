执行循环是整个系统的心脏。它的逻辑可以用一句话说完：调模型，如果模型要求调用工具就执行并把结果喂回去，否则结束。这一章讲清楚这句话背后需要处理的所有情况。

## 最小实现

先看去掉一切保护之后的样子：

```python
async def run(task: str) -> str:
    messages = [system_message(), user_message(task)]
    while True:
        reply = await model.chat(messages, tools=registry.schemas())
        messages.append(reply)
        if not reply.tool_calls:
            return reply.content
        for call in reply.tool_calls:
            result = await registry.execute(call)
            messages.append(tool_message(call.id, result))
```

十行左右，已经是一个能工作的 Agent。本章剩下的内容都是在回答：这十行在真实任务里会在哪里出问题。

## 状态流转

![执行循环的状态流转：拼装上下文后调用模型；回复里没有工具调用就结束，接口报错或超时进入重试，未超过上限回到调用模型，超过则失败退出；回复里有工具调用时先做权限判定，放行则执行工具，拒绝则记录拒绝，两者都追加结果，然后检查出口，继续则回到拼装上下文，达到最大轮次或被中断则强制收尾后结束](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/project-ga-loop-state-machine-v1.dark.png)

*正常出口只有一个：模型的回复里不再有工具调用；另外两个出口是重试超限和强制收尾。*

## 终止条件

循环必须有明确的出口，否则一次卡住的任务会一直烧钱。

| 出口 | 触发条件 | 处理 |
|---|---|---|
| 正常结束 | 模型的回复里没有工具调用 | 返回回复文本 |
| 轮次上限 | 循环次数达到上限，默认 50，可配置 | 再调一次模型，不提供工具，要求它总结已完成和未完成的部分 |
| 用户中断 | 按下中断键 | 取消正在执行的工具，落盘会话 |
| 连续失败 | 同一个工具用同样的参数连续失败 3 次 | 往上下文里插入一条提示，要求换一种做法 |
| 接口故障 | 模型接口重试后仍失败 | 落盘会话后退出，保证可以从检查点恢复 |

轮次上限那一行值得注意：到了上限不能直接断掉，否则用户拿不到任何交代。最后一次调用不提供工具定义，模型就只能用文字收尾。

## 一次回复里有多个工具调用

模型经常在一次回复里要求同时读三个文件。处理规则是：

- 全部是只读工具：并行执行，按原始顺序把结果追加回去。
- 包含会修改状态的工具：整批按顺序执行。两次文件修改并行会互相覆盖，一次修改和一次读取并行则读到的内容不确定。
- 无论哪种情况，每个工具调用都必须有一条对应的结果消息。漏掉任何一条，下一次调用模型时接口会直接报错。

```python
async def execute_batch(calls: list[ToolCall]) -> list[Message]:
    if all(registry.get(c.name).read_only for c in calls):
        results = await asyncio.gather(*(guarded_execute(c) for c in calls))
    else:
        results = [await guarded_execute(c) for c in calls]
    return [tool_message(c.id, r) for c, r in zip(calls, results)]
```

`guarded_execute` 里依次做三件事：过权限闸门、带超时地执行、把异常转成文字。

## 工具出错不是程序出错

文件不存在、命令返回非零、参数类型不对，这些都应该变成一段文字作为工具结果交回模型，而不是抛异常让循环崩掉。模型看到错误信息后通常能自己纠正。

错误信息要写给模型看，所以要包含它下一步需要的线索：

```text
差：Error: ENOENT
好：文件 src/cart.py 不存在。当前目录下名称相近的文件有：shop/cart.py、shop/cart_utils.py
```

只有两类问题应该真的中断循环：模型接口本身不可用，以及用户主动中断。

## 流式输出

终端里要让用户看到模型一边想一边输出，所以模型调用用流式接口。流式带来一个实现细节：工具调用的参数是一小段一小段到达的 JSON 片段，必须按调用编号拼接完整后再解析，不能收到一段解析一段。

执行循环把过程中的事情统一成事件发给交互层，自己不直接打印：

```python
@dataclass
class Event:
    kind: Literal["text_delta", "tool_start", "tool_end", "ask_permission", "done"]
    data: dict
```

终端界面、研究进度页和无界面模式各自订阅这些事件。这就是架构图里三种入口能共用一个内核的原因。

## 可回放的会话记录

每追加一条消息，就往会话文件里写一行 JSON。这个文件有三个用途：程序崩溃后可以恢复、调试时可以逐步回看、评测时作为评分依据。

写入时机要在执行之前和之后各一次。只在最后写的话，一旦某个命令卡死，你连它执行的是什么都查不到。

## 自己动手时的检查点

写完这一章对应的代码后，用下面几种情况验证：

1. 让它执行一个必定失败的命令，确认它能读到错误并换一种做法，而不是程序崩溃。
2. 把轮次上限临时改成 3，确认超限后能拿到一段总结。
3. 任务执行到一半按中断键，确认会话文件完整，且能看到最后一步在做什么。
4. 让它同时读三个文件，确认结果顺序和调用顺序一致。

## 面试常见追问

- **Agent 陷入死循环怎么办？** 轮次上限、连续失败检测、重复调用检测三层。能说出到了上限如何体面收尾会加分。
- **工具调用失败怎么处理？** 区分工具层错误和系统层错误，前者交回模型，后者才中断。
- **为什么并行工具调用要区分只读和写入？** 讲清楚竞态的具体例子。

延伸阅读：[Agent Run Loop、轮次与终止条件](../../knowledge/llm/agent/agent-run-loop.md)、[并行工具调用与依赖调度](../../knowledge/llm/agent/agent-parallel-tools.md)、[工具超时、取消与重试](../../knowledge/llm/agent/agent-tool-timeout.md)。
