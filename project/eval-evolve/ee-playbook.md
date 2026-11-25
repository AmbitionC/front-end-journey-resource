第一级每次都重写整段提示词。重写有两个代价：内容越改越概括，细节在一次次改写里被磨掉；偶尔一次糟糕的改写会把积累的经验整体冲掉。第二级换一种做法：把经验存成一本条目化的手册，只增补、只修订个别条目，不整体重写。

本章实践的方法是 ACE，论文《Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models》，有官方开源实现。

## ACE 要解决的两个问题

论文指出了整体重写式方法的两个毛病：

| 问题 | 表现 |
|---|---|
| 简洁偏好 | 优化过程倾向于产出简短概括的指令，具体的领域经验被丢掉 |
| 上下文塌缩 | 让模型反复整体重写一份长上下文，某一次它会把内容压成很短的摘要，之前的积累丢失，效果骤降 |

ACE 的回答是把上下文看作一本不断充实的手册，而不是一段要被不断精炼的文字。

## 三个角色

![ACE 的三个角色：执行者带着经验手册完成任务并产出轨迹，反思者对照结果提炼这次运行的教训，整理者把教训变成对手册的增量修改（新增条目、修改某条、调整计数），更新后的手册下次再交给执行者](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/project-ee-playbook-ace-roles-v1.dark.png)

*图：上面一排是一次任务里三个角色的接力，下面的手册是跨任务留下来的东西。*

| 角色 | 输入 | 输出 |
|---|---|---|
| 执行者 | 任务、当前手册 | 轨迹，并标出用到了哪些条目 |
| 反思者 | 轨迹、评分结果 | 这次哪里做对了、哪里做错了、哪些条目有帮助或有误导 |
| 整理者 | 反思结果、当前手册 | 一组增量操作：新增条目、修改某条、调整计数 |

把反思和整理分开是有意的。反思者只管从一次运行里看出教训，整理者只管维护手册的结构。让一个模型同时做两件事，它会倾向于顺手重写整本手册。

## 手册的数据结构

```python
@dataclass
class PlaybookItem:
    id: str                 # 稳定的编号，如 "verify-003"
    section: str            # 分类：定位 / 修改 / 验证 / 沟通 ……
    content: str            # 一条具体的经验
    helpful: int = 0        # 被用到且任务成功的次数
    harmful: int = 0        # 被用到且被反思者认为有误导的次数
    created_in: str = ""    # 哪个版本加入的
```

一条好的条目是具体的、带适用条件的：

```text
差：注意验证修改。
好：修改函数签名后，先用搜索工具找出所有调用点并逐一更新，再运行测试。
    只运行被修改文件对应的测试会漏掉其他模块的调用方。
```

## 增量操作

整理者不输出新的手册，只输出操作列表，由代码来执行合并：

```python
@dataclass
class Delta:
    op: Literal["add", "update", "mark"]
    item_id: str | None = None
    section: str | None = None
    content: str | None = None
    helpful: int = 0
    harmful: int = 0

def apply(playbook: list[PlaybookItem], deltas: list[Delta]) -> list[PlaybookItem]:
    items = {i.id: replace(i) for i in playbook}
    for d in deltas:
        if d.op == "add":
            new_id = next_id(d.section, items)
            items[new_id] = PlaybookItem(new_id, d.section, d.content)
        elif d.op == "update":
            items[d.item_id].content = d.content
        elif d.op == "mark":
            items[d.item_id].helpful += d.helpful
            items[d.item_id].harmful += d.harmful
    return list(items.values())
```

合并由确定的代码完成，模型没有机会把整本手册改掉。没有被操作提到的条目原样保留。这就是防止上下文塌缩的机制。

## 增长与修剪

只增不减的手册会无限变长。ACE 把这一步叫增长与精炼，论文里的做法是前两条，第三条是本项目加的：

- **去重。** 用向量相似度找出内容相近的条目，合并成一条，计数相加。
- **懒修剪。** 可以每次更新后都精炼，也可以等手册长度超过设定的预算时再做。本项目用后一种。
- **淘汰（本项目的设计）。** 误导次数明显多于帮助次数的条目，移除。论文给每个条目记了帮助和误导的次数，但没有规定这样一条淘汰规则。

```python
def refine(items: list[PlaybookItem], budget_tokens: int) -> list[PlaybookItem]:
    items = merge_near_duplicates(items, threshold=0.9)
    items = [i for i in items if not (i.harmful >= 3 and i.harmful > i.helpful)]
    if count_tokens(items) > budget_tokens:
        items.sort(key=lambda i: i.helpful - i.harmful, reverse=True)
        items = take_within_budget(items, budget_tokens)
    return items
```

相似度阈值 0.9、淘汰条件里的 3 次，是本项目的起步值，不是论文给的参数。

## 手册怎么进上下文

第一个项目里已经有现成的位置：手册和项目说明文件一样，放在系统提示词之后、对话之前，属于稳定内容。条目带着编号一起放进去，并要求执行者在回复末尾列出它参考了哪些编号，反思者才能给对应条目记功或记过。

手册变长之后，可以改成只放各分类的标题和高分条目，其余条目按需检索。这和长期记忆“索引常驻、正文按需”的做法相同。

## 离线和在线两种用法

| | 离线 | 在线 |
|---|---|---|
| 什么时候更新 | 在进化集上集中跑若干遍 | Agent 日常使用时每完成一个任务就更新 |
| 有没有标准答案 | 有评分器的判定 | 只有执行反馈，如测试是否通过、命令是否报错 |
| 本项目里 | 主要做这个，产出的手册过准入闸门后合入 | 作为选做 |

论文报告 ACE 可以在没有标注答案的情况下，仅凭执行反馈来改进。在线模式听上去更吸引人，但它也意味着手册在没有验收的情况下变化，副作用一章会讨论这个风险。

## 接入准入闸门

离线跑完若干遍后，得到一本新手册。和第一级一样，它只是候选：

```python
candidate = current.with_playbook(new_items, note=f"新增 {added} 条，修改 {updated} 条，淘汰 {removed} 条")
new_version = await gate.admit(candidate, baseline=current)
```

被拒绝时，可以退一步做条目级的排查：把新增条目分成几组分别验收，找出是哪一组导致了退步。条目化的结构让这种定位成为可能，整段重写的提示词做不到。

## 第一级和第二级怎么配合

两者改的是不同的东西，可以叠加：

| | 系统提示词 | 经验手册 |
|---|---|---|
| 内容 | 身份、总体行为准则 | 具体情形下的具体做法 |
| 更新方式 | 整段改写 | 逐条增补 |
| 适合放什么 | 少量、稳定、处处适用的要求 | 大量、具体、有适用条件的经验 |

一个实用的分工：先用第一级把总体准则调好，再用第二级积累细节经验。

## 自己动手时的检查点

1. 实现三个角色和增量合并，在进化集上跑两遍，看手册长出了哪些条目。
2. 故意让整理者整体重写手册，对比几轮之后手册的长度和内容，观察塌缩现象是否出现。
3. 实现去重和淘汰，确认手册长度稳定在预算内。
4. 新手册过准入闸门；被拒绝时做一次条目分组排查。

## 面试常见追问

- **Agent 怎么从经验里学习？** 执行、反思、整理三个角色，条目化的手册，增量更新。
- **和直接优化提示词有什么区别？** 讲简洁偏好和上下文塌缩两个问题，以及增量合并为什么能避免。
- **手册越来越长怎么办？** 去重、按计数淘汰、超预算时修剪、条目按需检索。
- **这和长期记忆是什么关系？** 记忆存的是关于用户和项目的事实，手册存的是做事的方法；存储和检索机制可以共用。

延伸阅读：[ACE 论文](https://arxiv.org/abs/2510.04618)、[官方实现 ace-agent/ace](https://github.com/ace-agent/ace)、知识库的 [上下文工程](../../knowledge/llm/agent/context-engineering.md)、[遗忘策略、冲突处理与记忆更新](../../knowledge/llm/agent/agent-memory-forgetting.md)。
