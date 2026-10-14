![最小 Agent 运行时：用户目标进入 orchestrator，模型决定下一步，tool registry 执行受控调用，state store 保存可恢复状态，guardrails 包围输入输出，trace 贯穿全链路；标出最大步数和审批点](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/build-agent-framework-runtime-boundaries-v1.webp)
*图：沿“用户目标 → orchestrator → 模型决策 → 受控工具 → 状态写回”阅读，注意 guardrails、审批点、最大步数和 trace 分别约束哪一段。*

---

Agent 框架是连接大语言模型（LLM）与真实世界任务的工程骨架。理解它的核心抽象，不仅能让你更好地使用 LangChain、AutoGen 这样的成熟框架，更能在它们满足不了需求时，有能力自己动手裁剪一套。（参见 [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)）

---

## 为什么要自己搭框架

成熟框架（LangChain、AutoGen 等）提供了极大的便利，但也带来了代价：

- **过度抽象**：Chain、Retriever、Runnable……概念层叠，初学者入门成本高。
- **快速迭代**：商业框架 API 变动频繁，升级后代码常常跑不起来。
- **黑盒化**：核心循环被封装得严严实实，出了问题只能翻 Issue。
- **依赖爆炸**：安装一个框架可能带来上百个间接依赖，与其它项目冲突。

自建框架并不是为了取代它们，而是让你真正理解"框架在做什么"，从使用者跃升为构建者。

---

## 核心抽象：Agent 的五块积木

本例用五个组件演示最小文本交互运行时。计算器与文本工具循环用于说明模块协作；真实模型适配与生产运行还需权限、持久化、超时、结果校验和审计边界：

<iframe
  src="/archify/build-agent-framework.html"
  title="最小 Agent 运行时交互架构图"
></iframe>

*图：沿“用户目标 → Planner → Executor → 最终回复”阅读主链路；可切换上方视图观察 LLM、Memory 与 Tool Registry 的协作，也可以[单独打开交互图](https://www.agent-journey.cn/archify/build-agent-framework.html)。*

### 1. LLM 接口（Model Layer）

LLM 是 Agent 的"大脑"，框架需要为它抽象一个统一入口，使切换模型提供商（OpenAI、Anthropic、本地 Ollama）不影响上层逻辑。

```python
# llm.py
import os
from openai import OpenAI
from typing import Iterator

class HelloAgentsLLM:
    """统一 LLM 接口，兼容 OpenAI 规范的任何服务"""

    def __init__(self, model: str = None, api_key: str = None, base_url: str = None):
        self.model = model or os.getenv("LLM_MODEL_ID", "gpt-4o-mini")
        self.api_key = api_key or os.getenv("LLM_API_KEY")
        self.base_url = base_url or os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self._client = OpenAI(api_key=self.api_key, base_url=self.base_url)

    def invoke(self, messages: list[dict]) -> str:
        """同步调用，返回完整响应文本"""
        resp = self._client.chat.completions.create(
            model=self.model, messages=messages
        )
        return resp.choices[0].message.content

    def stream_invoke(self, messages: list[dict]) -> Iterator[str]:
        """流式调用，逐文本片段返回；片段不等于一个 token"""
        stream = self._client.chat.completions.create(
            model=self.model, messages=messages, stream=True
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
```

这个适配器只覆盖已确认兼容 Chat Completions 的文本路径。`base_url` 和 `model` 是配置入口，不是跨供应商兼容保证；鉴权、消息角色、工具协议、流式事件、错误码与能力仍需逐项适配和契约测试。[openai-python 官方示例](https://github.com/openai/openai-python)说明本 SDK 的请求方式，不证明其他服务自动兼容。

---

### 2. Memory 记忆

记忆管理处理的核心问题是：**如何在上下文窗口有限的情况下，保留最有价值的信息**。

```python
# memory.py
from dataclasses import dataclass, field
from typing import Literal

MessageRole = Literal["user", "assistant", "system", "tool"]

@dataclass
class Message:
    role: MessageRole
    content: str

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


class ConversationMemory:
    """滑动窗口短期记忆"""

    def __init__(self, max_turns: int = 20):
        self._messages: list[Message] = []
        self.max_turns = max_turns  # 保留最近 N 条

    def add(self, role: MessageRole, content: str):
        self._messages.append(Message(role=role, content=content))
        # 超出窗口时，从最早的非 system 消息开始裁剪
        non_system = [m for m in self._messages if m.role != "system"]
        if len(non_system) > self.max_turns * 2:
            self._messages = [m for m in self._messages if m.role == "system"] \
                           + non_system[-(self.max_turns * 2):]

    def to_messages(self) -> list[dict]:
        return [m.to_dict() for m in self._messages]

    def clear(self):
        self._messages = [m for m in self._messages if m.role == "system"]
```

实际框架中还会有更复杂的策略：摘要压缩（Summary Memory）、向量检索（Vector Memory）、外部持久化（数据库）。但对初学者而言，滑动窗口是最直观、最稳定的起点。

---

### 3. Tool 工具

工具是 Agent 与外部世界（API、文件系统、代码执行环境）交互的唯一通道。一个好的工具抽象应该做到：定义清晰、易于注册、执行安全。

```python
# tool.py
from abc import ABC, abstractmethod
import ast
import math
import operator

class BaseTool(ABC):
    name: str        # 工具唯一名称，用于 LLM 识别
    description: str # 自然语言描述，影响 LLM 是否选择该工具

    @abstractmethod
    def run(self, input_text: str) -> str:
        """执行工具，输入输出均为字符串"""
        ...


class CalculatorTool(BaseTool):
    name = "calculator"
    description = "执行数学表达式计算，如 '2 + 3 * 4'。只传入合法的数学表达式。"

    def run(self, input_text: str) -> str:
        try:
            # 只解释受限算术 AST；不执行模型提供的 Python 代码。
            if len(input_text) > 128:
                raise ValueError("表达式过长")
            tree = ast.parse(input_text, mode="eval")
            if sum(1 for _ in ast.walk(tree)) > 64:
                raise ValueError("表达式节点过多")
            binary = {ast.Add: operator.add, ast.Sub: operator.sub,
                      ast.Mult: operator.mul, ast.Div: operator.truediv}
            unary = {ast.UAdd: operator.pos, ast.USub: operator.neg}

            def evaluate(node):
                if isinstance(node, ast.Expression):
                    return evaluate(node.body)
                if isinstance(node, ast.Constant) and type(node.value) in (int, float):
                    value = node.value
                elif isinstance(node, ast.UnaryOp) and type(node.op) in unary:
                    value = unary[type(node.op)](evaluate(node.operand))
                elif isinstance(node, ast.BinOp) and type(node.op) in binary:
                    value = binary[type(node.op)](evaluate(node.left), evaluate(node.right))
                else:
                    raise ValueError("只支持数字与加减乘除")
                if not math.isfinite(value) or abs(value) > 1e12:
                    raise ValueError("数值超过本例预算")
                return value

            return str(evaluate(tree))
        except Exception as e:
            return f"计算错误：{e}"


class ToolRegistry:
    """工具注册表，管理工具的注册与执行"""

    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def execute(self, tool_name: str, input_text: str) -> str:
        tool = self._tools.get(tool_name)
        if not tool:
            return f"错误：未找到工具 '{tool_name}'"
        return tool.run(input_text)

    def descriptions(self) -> str:
        return "\n".join(
            f"- {t.name}: {t.description}" for t in self._tools.values()
        )
```

解析成 AST 本身不构成完整沙箱。[Python AST 文档](https://docs.python.org/3/library/ast.html)提醒复杂输入可能消耗资源；上面长度、节点数和值域是本例策略，生产仍由宿主限制 CPU、内存与墙钟时间。Python 的 [eval 文档](https://docs.python.org/3/library/functions.html#eval)也明确指出不可信输入的代码执行风险。

---

### 4. Planner 规划器

规划器负责将复杂问题**拆解成有序的子步骤**。最经典的实现是 Plan-and-Solve：先让 LLM 输出一份计划，再逐步执行。

```python
# planner.py
import ast
import re

PLANNER_PROMPT = """
你是一个规划专家。请将下面的问题分解为若干独立、可执行的步骤。
输出格式必须是 Python 列表，例如：["步骤1", "步骤2", "步骤3"]

问题：{question}
"""

class Planner:
    def __init__(self, llm):
        self.llm = llm

    def plan(self, question: str) -> list[str]:
        prompt = PLANNER_PROMPT.format(question=question)
        response = self.llm.invoke([{"role": "user", "content": prompt}])

        # 从响应中解析 Python 列表
        match = re.search(r'\[.*?\]', response, re.DOTALL)
        if match:
            try:
                return ast.literal_eval(match.group())
            except Exception:
                pass
        # 解析失败时降级：整个问题作为单步骤
        return [question]
```

---

### 5. Executor 执行器

执行器是框架的"发动机"，它驱动 Agent 的核心循环（Agent Loop）：**Thought → Action → Observation → 循环**。

这就是著名的 **ReAct**（Reasoning + Acting）范式。

```python
# executor.py
import re
from tool import ToolRegistry

REACT_PROMPT = """你是一个具备推理和行动能力的 AI 助手。

## 可用工具
{tools}

## 执行规则
每次回应只做一步，严格使用以下格式：
Thought: 分析当前情况，决定下一步
Action: tool_name[input]   （调用工具）
或
Action: Finish[最终答案]   （回答完毕）

## 问题
{question}

## 执行历史
{history}

现在开始："""

class ReActExecutor:
    def __init__(self, llm, tool_registry: ToolRegistry, max_steps: int = 8):
        self.llm = llm
        self.tools = tool_registry
        self.max_steps = max_steps

    def run(self, question: str) -> str:
        history = []

        for step in range(self.max_steps):
            prompt = REACT_PROMPT.format(
                tools=self.tools.descriptions(),
                question=question,
                history="\n".join(history) or "（无）"
            )
            response = self.llm.invoke([{"role": "user", "content": prompt}])

            # 解析 Action
            action_match = re.search(r'Action:\s*(.+?)(?:\n|$)', response)
            if not action_match:
                return "模型响应缺少 Action，任务未完成。"

            action = action_match.group(1).strip()

            if action.startswith("Finish"):
                # 提取 Finish[答案] 中的答案
                answer_match = re.search(r'Finish\[(.+)\]', action, re.DOTALL)
                return answer_match.group(1).strip() if answer_match else action

            # 解析工具调用 tool_name[input]
            tool_match = re.search(r'(\w+)\[(.+)\]', action, re.DOTALL)
            if tool_match:
                tool_name, tool_input = tool_match.group(1), tool_match.group(2)
                observation = self.tools.execute(tool_name, tool_input)
                history.append(f"Action: {action}")
                history.append(f"Observation: {observation}")

        return "已达最大步数，无法得出结论。"
```

---

## 拼装一个最小可用框架

[OpenAI Agents SDK 文档](https://openai.github.io/openai-agents-python/) 把运行循环、tools、handoffs、sessions、guardrails 与 tracing 作为可组合能力；自建 runtime 也应明确这些职责由谁拥有。


有了五块积木，组装 Agent 只需几行：

```python
# agent.py
from abc import ABC, abstractmethod
from memory import ConversationMemory
from executor import ReActExecutor
from tool import ToolRegistry

class Agent(ABC):
    def __init__(self, name: str, llm, system_prompt: str = None):
        self.name = name
        self.llm = llm
        self.memory = ConversationMemory()
        if system_prompt:
            self.memory.add("system", system_prompt)

    @abstractmethod
    def run(self, input_text: str) -> str: ...


class SimpleAgent(Agent):
    """最简单的对话 Agent：无工具，纯对话"""

    def run(self, input_text: str) -> str:
        self.memory.add("user", input_text)
        response = self.llm.invoke(self.memory.to_messages())
        self.memory.add("assistant", response)
        return response


class ReActAgent(Agent):
    """带工具调用的 ReAct Agent"""

    def __init__(self, name, llm, tool_registry: ToolRegistry, **kwargs):
        super().__init__(name, llm, **kwargs)
        self.executor = ReActExecutor(llm, tool_registry)

    def run(self, input_text: str) -> str:
        return self.executor.run(input_text)
```

以下代码按上面的 llm.py、memory.py、tool.py、executor.py、agent.py 分文件组织；openai 与 python-dotenv 是额外依赖，真实模型请求还需要配置和独立验证：

```python
from llm import HelloAgentsLLM
from agent import SimpleAgent, ReActAgent
from tool import ToolRegistry, CalculatorTool
from dotenv import load_dotenv
load_dotenv()

llm = HelloAgentsLLM()

# SimpleAgent
agent = SimpleAgent("助手", llm, system_prompt="你是一个有帮助的 AI 助手")
print(agent.run("Python 的 GIL 是什么？"))

# ReActAgent + 计算器
registry = ToolRegistry()
registry.register(CalculatorTool())

react = ReActAgent("计算专家", llm, tool_registry=registry)
print(react.run("(15 * 8 + 32) / 4 等于多少？"))
```

---

## 框架演进路线

| 阶段 | 新增能力 | 关键技术 |
|------|----------|----------|
| v0 最小框架 | 单轮对话 | LLM + Message |
| v1 基础 Agent | 多轮记忆 + 工具调用 | Memory + ToolRegistry |
| v2 规划执行 | 复杂任务分解 | Planner + ReAct |
| v3 多 Agent | 角色分工协作 | A2A / GroupChat |
| v4 通信协议 | 工具生态互联 | MCP / Function Calling |

---

## 常见误区与最佳实践

**误区一：把 `max_steps` 设太大**
ReAct 循环不收敛时，高上限会放大无效调用。按任务评测选择步数，并结合墙钟、token、费用和无进展检测；本例的 8 步仅是教学参数。预算耗尽应返回未完成状态与已验证进展，不能把固定 5–8 步当成所有任务的默认。

**误区二：工具描述写得太含糊**
`description` 直接决定 LLM 是否正确选用工具。应当写清楚"适用场景"和"入参格式"，而不是一句话带过。

**误区三：Memory 无限增长**
Context Window 有限，不做裁剪会导致调用失败。滑动窗口、摘要压缩是标配。

**误区四：把框架当银弹**
复杂框架（LangChain/AutoGen）适合特定场景，但它们也增加了调试难度。原型阶段用裸 LLM + 少量工具往往更快。

---

## 面试常问

- **Agent Loop 的核心是什么？** Thought-Action-Observation 循环；终止条件是输出 `Finish` 或达到最大步数。
- **ReAct 与 Plan-and-Solve 的区别？** ReAct 是动态决策（每步根据 Observation 再规划）；Plan-and-Solve 先生成全局计划再逐步执行，适合步骤确定的任务。
- **为什么需要 ToolRegistry？** 解耦工具定义与 Agent 逻辑；LLM 只需要知道工具名和描述，不需要知道实现细节。
- **Memory 的三种策略？** 滑动窗口（最简单）、摘要压缩（节省 token）、向量检索（适合长期知识库）。

---

## LangChain 组件与 LangGraph 状态执行

[LangChain 概览](https://docs.langchain.com/oss/python/langchain/overview)提供模型、工具与 Agent 的集成组件；[LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)用 state、node、edge 描述执行：state 是跨步骤数据合同，node 读取状态并返回更新，edge 决定后续步骤，条件边表达分支。每个字段的 reducer 决定更新替换还是合并；累加 reducer 接到空列表不等于清空旧结果。

检查点保存运行状态，结合 thread 标识组织恢复与人工中断；选用持久后端和故障策略才能跨进程延续。恢复可能重放步骤，外部写操作仍需幂等与对账。状态字段要标明所有者与合并规则，并行节点不能任意同时覆盖同一业务事实。

固定的短线性任务可直接组合调用，清楚可查；复杂分支、等待、恢复与长期状态才更需要显式图。选择框架时比较状态可观察性、失败路径、持久化与集成成本，不能把“用了 LangGraph”当可靠执行的证明。本节解释当前文档概念，不保证任一旧版 SDK 调用形式相同。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent 暑期实习一面：摘要、工具预算与链表](../../../interview/bytedance/base/bytedance-base-27.md)
- [字节 Agent Infra 校招：运行时、MySQL 与 LRU](../../../interview/bytedance/base/bytedance-base-25.md)
- [字节飞书 AI 应用一面：Runtime、评测与后端基础](../../../interview/bytedance/base/bytedance-base-24.md)
- [vivo Agent 秋招线下面：Harness 与工程诊断](../../../interview/vivo/ai/vivo-ai-1.md)
- [字节 Agent 开发实习一面：自进化与评测](../../../interview/bytedance/base/bytedance-base-8.md)
- [腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)
- [字节 Agent 一面：会话记忆、并发更新与算法](../../../interview/bytedance/base/bytedance-base-29.md)
- [字节剪映 AI 前端一面：Agent 运行时、MCP 与性能](../../../interview/bytedance/base/bytedance-base-30.md)
- [字节 AI 平台一面：Agent 评测、框架与数据结构](../../../interview/bytedance/base/bytedance-base-33.md)
- [字节 Agent 实习：异步消息、上下文与容器隔离](../../../interview/bytedance/base/bytedance-base-41.md)
- [字节 Agent：AI Coding、技能设计与模型工程](../../../interview/bytedance/base/bytedance-base-49.md)
- [字节 Agent 实习：推理、微调与工具编排](../../../interview/bytedance/base/bytedance-base-51.md)
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../../interview/bytedance/base/bytedance-base-53.md)
<!-- interview-source-history:end -->

## 学习阅读（不计专题频次）

- [蚂蚁 Agent 实习一面：缓存、消息与 RAG](../../../interview/antfin/ai/antfin-ai-6.md)（原题是框架与语言选型；自行搭建 Python 最小框架仅作背景学习。不是完整专题被考察的证据，不计专题频次。）

## 参考资料

- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OpenAI Agents SDK documentation](https://openai.github.io/openai-agents-python/)
- [openai-python 官方仓库](https://github.com/openai/openai-python)（适配器示例范围，本次核验于 2026-10-14）。
- [Python：ast](https://docs.python.org/3/library/ast.html)（语法树与资源风险，本次核验于 2026-10-14）。
- [Python：eval](https://docs.python.org/3/library/functions.html#eval)（不可信代码风险，本次核验于 2026-10-14）。
