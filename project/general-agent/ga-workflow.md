前面几章做出来的 Agent 已经能独立完成任务。真正每天用它的时候，还会遇到三类需求，都不该靠改提示词解决：改动大的任务想先看方案再让它动手；有些固定流程每次都要打一长段话；有些项目规矩必须每次都执行，不能指望模型记得。

这一章加三样东西：计划模式、斜杠命令、钩子。钩子和斜杠命令在内核外面，计划模式只在权限闸门里加了一个开关，执行循环本身只多了两处调用钩子的代码。

## 三样东西各管什么

| | 谁触发 | 解决什么 | 靠什么保证 |
|---|---|---|---|
| 计划模式 | 用户 | 动手之前先对齐方案 | 权限闸门 |
| 斜杠命令 | 用户 | 固定流程不用每次重打 | 文本展开 |
| 钩子 | 工具调用本身 | 项目规矩每次都执行 | 用户配置的命令 |

和上一章的技能放在一起看，区别在「谁来触发」：技能是模型看了简介自己决定加载，斜杠命令是用户点名，钩子谁也不用点、到了那一步自动发生。

## 计划模式

最直接的做法是在提示词里加一句「先不要动手，给我一个计划」。它大多数时候管用，但提示词是请求，不是约束：模型读代码读到一半发现一个顺手能改的地方，改了，你事后才知道。

所以计划模式的约束放在权限闸门里：

```python
async def check(self, tool: Tool, call: ToolCall) -> Verdict:
    if self.plan_mode and not tool.read_only:
        return Verdict(False, f"现在是计划模式，只能查看不能改动，{call.name} 没有执行。"
                              "请继续用只读的工具了解情况，然后直接用文字给出计划，等用户同意后再动手。")
    ...
```

工具在注册时已经标了是否只读（工具一章），这里直接用这个标记。读文件、搜索、找文件照常放行，写文件、改文件、执行命令一律拦下。拦下时返回的话和权限一章的原则一致：告诉模型发生了什么、接下来该怎么做，而不是只说一句「禁止」。

整个流程是两次运行：

```python
async def plan_then_run(agent, task: str, confirm) -> None:
    agent.gate.plan_mode = True
    try:
        outcome = await agent.run(PLAN_PROMPT.format(task=task))
    finally:
        agent.gate.plan_mode = False      # 无论计划阶段怎么结束，都不能把闸门留在只读状态
    note = await confirm(outcome.text)
    if note is not None:
        await agent.run(EXECUTE_PROMPT.format(note=...))
```

三个细节：

- **两次运行共用一条对话。** 执行阶段看得到计划阶段读过的代码和自己写的计划，不用重新了解一遍。
- **`finally` 里复位。** 计划阶段可能被用户中断，也可能因为异常退出。如果只在正常结束时复位，一次中断之后这个会话就再也改不了文件了，而且报错信息会让人摸不着头脑。
- **同意时可以带一句话。** 计划大体可以但要调整一处，是最常见的情况。让用户直接写补充要求，比拒绝之后重新来一遍好。

执行命令在计划模式里也被拦，包括跑测试。这是有意取紧：命令有没有副作用，闸门没法静态判断。想放宽，可以让命中放行规则的命令在计划模式里照常执行，这留作练习。

## 斜杠命令

一个命令就是一个 Markdown 文件，放在项目的 `.agent/commands/` 下：

```markdown
---
description: 提交前自查
---
检查当前的改动：有没有漏掉测试、有没有留下调试输出、有没有改到不该改的文件。
只报告问题，不要动手修。范围：$ARGUMENTS
```

输入 `/review 只看 cart.py`，正文里的 `$ARGUMENTS` 换成 `只看 cart.py`，整段作为任务交给 Agent。实现只有二十来行，核心是解析：

```python
def parse(line: str) -> tuple[str, str] | None:
    if not line.startswith("/") or len(line) < 2:
        return None
    name, _, rest = line[1:].partition(" ")
    if not name or "/" in name or "." in name:
        return None          # /usr/bin/python、/tmp/a.py 是路径，不是命令
    return name, rest.strip()
```

那条对路径的判断不能省。用户问「/usr/bin/python 是哪个版本」，如果被当成一个不存在的命令挡掉，体验很差。

斜杠命令和技能该怎么选：

- 模型应该在合适的时候**自己想到**去用的，写成技能。代价是简介常驻上下文。
- 只在**你明确要求**时才做的，写成命令。模型不知道有哪些命令，不占上下文。

`/plan`、`/dream`（记忆一章的离线整理）、`/help` 是内置命令，直接在终端入口里处理。

## 钩子

项目里总有一些规矩，要求的是「每次都做」：改完 Python 文件跑一遍检查，`migrations/` 目录不许动，每条命令记一笔日志。写进项目说明文件，模型大多数时候会照做；长任务的后段、上下文压缩之后，就不一定了。

钩子把这类规矩从「希望模型照做」变成「一定会发生」。配置在 `.agent/hooks.json`：

```json
{"pre_tool":  [{"tool": "write_file", "command": "python scripts/guard.py"}],
 "post_tool": [{"tool": "edit_file",  "command": "ruff check --quiet $HOOK_PATH"}]}
```

约定只有四条：

1. 命令从标准输入收到一段 JSON：工具名、参数，`post_tool` 还有工具的结果。
2. `pre_tool` 的命令以退出码 2 结束，表示拦下这一步，标准错误里的话作为原因交给模型。其他退出码不拦，钩子自己出错不应该让 Agent 停摆。
3. `post_tool` 的命令输出接在工具结果后面交给模型。检查工具报出来的问题，模型下一轮就能看到并修掉。
4. 命令还能读到两个环境变量：`HOOK_TOOL` 是工具名，`HOOK_PATH` 是参数里的 path（没有就是空）。配置里的 `tool` 支持通配，`*` 表示所有工具。

钩子命令自己出错或超时不会让 Agent 停下，但 `hooks.json` 本身写成了不合法的 JSON 会导致启动失败。

它在执行循环里的位置：

```python
verdict = await self.gate.check(tool, call)
if not verdict.allowed:
    return verdict.reason
blocked = await self.hooks.before(call) if self.hooks else None
if blocked:
    return blocked
result = await self.registry.execute(call)
if self.hooks:
    result = await self.hooks.after(call, result)
```

钩子排在闸门后面。闸门拒绝的操作，钩子根本不会被调用，也就没有机会放行。钩子只能在闸门允许的范围内再收紧。

### 钩子带来的两个安全问题

**钩子会在你的机器上执行命令。** 它是用户写的配置，不是模型的输出，所以不过权限闸门。这意味着：克隆一个别人的仓库，里面带着 `.agent/hooks.json`，一启动 Agent 就会执行里面的命令。源码的处理是钩子默认关闭，只有命令行入口读这个文件，本地网页工作台、评测和线上试用都不读。更稳妥的做法是第一次遇到一个项目的钩子配置时先展示给用户确认，这留作练习。

**Agent 不该能随手改自己的钩子。** 如果它能写 `.agent/hooks.json`，就能给自己加一条什么都放行的规则，或者删掉拦它的那条。源码把 `.agent/` 下的钩子、权限规则、MCP 配置三个文件归入敏感文件：用文件工具读写它们要用户确认，无界面模式下直接拒绝；用重定向改写它们直接拒绝。这道防线有缺口：通过 `cp`、`sed` 之类的命令去改，走的是普通的命令确认，如果你给这类命令写了宽泛的放行规则，就拦不住。所以放行规则要写得具体。

## 自己动手时的检查点

1. 用 `/plan` 下一个要改两个文件的任务。如果它在计划阶段没有尝试改文件，就在任务里加一句「顺手把第一处先改了」，观察它被拦下时对话里出现的是哪句话。
2. 在计划阶段按 Ctrl+C 中断，然后直接下一个普通任务，确认它能正常改文件。
3. 写一个 `/review` 命令和一个同样内容的技能，各用一次，对比系统提示词的长度（会话文件 `.agent/sessions/*.jsonl` 的第一条消息就是系统提示词）。
4. 写一个 `pre_tool` 钩子禁止修改某个目录，再让 Agent 去改它，看它被拦之后怎么调整。
5. 让 Agent 去修改 `.agent/hooks.json`，确认会弹出确认。

## 面试常见追问

- **计划模式怎么保证它真的不动手？** 讲约束放在闸门而不是提示词，用工具的只读标记判断，以及 `finally` 里复位。
- **钩子和权限规则有什么区别？** 规则回答通用的「让不让做」，钩子执行项目自己的逻辑，而且能在工具执行之后把信息反馈给模型。
- **钩子的安全风险是什么？** 别人仓库里的钩子配置会在你机器上执行；Agent 改自己的钩子等于改自己的权限。
- **技能、斜杠命令、钩子怎么选？** 按谁触发来分：模型自己判断、用户点名、每次自动发生。

延伸阅读：知识库的 [Skill 设计](../../knowledge/llm/agent/agent-skill-design.md)。
