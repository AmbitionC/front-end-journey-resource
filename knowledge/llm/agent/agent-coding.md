Coding Agent 的任务不是输出一段看起来合理的代码，而是在指定仓库状态上产生最小、可验证、可审查的变更。它必须理解现有约束、保护用户未提交修改、运行与风险相称的验证，并用 diff 和证据交付。

## 仓库状态是输入的一部分

[SWE-bench 论文](https://arxiv.org/abs/2310.06770)从真实 GitHub issue 与对应代码变更构造仓库级任务，[官方站点](https://www.swebench.com/original.html)强调在给定仓库和执行环境中用测试评估。这揭示了与代码片段题的差异：同一句“修复分页”在不同 commit、依赖和测试下是不同任务。

开始前读取根目录、说明文件、构建配置、相关代码、测试和 `git status`。记录 base commit、当前分支、脏文件、运行时版本和任务验收标准。现有修改属于用户，不能因为影响测试就覆盖。

```ts
type CodingTask = {
  baseCommit: string;
  worktree: string;
  acceptance: string[];
  allowedPaths: string[];
  protectedChanges: { path: string; hash: string }[];
  verification: string[];
};
```

![Coding Agent 从 issue 与验收标准出发，检查仓库状态后在隔离 worktree 中计划、建立检查点、打补丁，依次格式化、类型检查、测试和 diff 审查，失败则修复重测](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-coding-repo-loop-v1.webp)
*图：测试通过后仍要 Diff Review；Handoff 携带实际变更与验证证据。*

## Inspect—Plan—Patch—Verify

先用搜索定位符号、调用方和测试，不要从文件名猜实现。理解数据流和错误路径后写短计划：要改哪些文件、为什么、如何验证、哪些行为保持不变。计划大于改动本身时，说明任务可能过度拆解。

补丁保持小而连贯。优先复用现有抽象和风格，避免顺手重构、升级依赖或格式化无关目录。修改公共接口时搜索所有消费者；删除代码前确认没有动态引用、生成步骤或文档契约。

## 隔离工作区

[Git worktree](https://git-scm.com/docs/git-worktree)允许同一仓库拥有多个关联工作目录，适合把 Agent 变更与用户主工作区隔离。隔离不等于随意：仍从明确 base 创建分支，避免两个 Agent 写同一 worktree，结束前确认没有遗漏的未跟踪文件。

不能创建隔离工作区时，在当前目录记录初始 status/diff，只触碰授权文件。任何会丢失修改的 reset、checkout 或 clean 都需要用户明确批准。

## 先复现，再修复

Bug 修复先建立失败证据：运行最小相关测试，或添加能在旧实现失败的回归测试。若无法复现，报告环境、假设和缺失信息；不要靠改动后“看起来更合理”证明修复。

对功能任务，验收测试覆盖用户可见行为和边界。测试不能只复制实现逻辑。外部服务使用 fixture/mock 时保留契约，必要时再运行集成验证。

## 验证金字塔

按反馈速度逐层运行：格式化/静态检查、类型检查、受影响单元测试、模块集成测试、构建、端到端或安全检查。小改动不必总跑全仓最慢套件，但高影响公共接口、依赖或配置变更需要扩大范围。

测试命令本身也来自仓库，不自行发明。失败时区分由补丁导致、环境缺失、预存失败或 flaky；保留原始错误摘要和命令。不要反复重跑直到偶然绿。

## Diff 是第二份交付物

[git diff 文档](https://git-scm.com/docs/git-diff)定义了工作树、索引和 commit 间的比较。完成前逐文件审查 diff：是否只改预期路径、是否有调试日志/秘密/生成垃圾、是否破坏错误处理、是否意外改变锁文件、注释和文档是否与实现一致。

[git status](https://git-scm.com/docs/git-status)用于检查已跟踪、未跟踪和暂存状态。测试产生的快照、覆盖率或下载文件不能悄悄进入提交。最终列出变更、验证命令与结果、剩余风险；没有运行的测试也明确说明。

## 外部副作用与工具安全

代码执行、依赖安装和测试脚本都可能不可信，在沙箱或受控工作区运行，限制网络、凭证和资源。不要把仓库 `.env`、SSH agent 或云 token 自动暴露给生成代码。依赖更新检查来源、锁文件和安装脚本。

推送、开 PR、合并、部署和发送评论是外部操作，不因“代码完成”自动获权。若任务授权发布，仍按范围提交、确认分支和 remote，再执行。

## 失败恢复

编译错误通常修补实现；测试暴露设计假设时回到计划；权限/依赖缺失则 blocked；与用户修改冲突时停止并报告。保存小检查点和 diff 方便回滚自己的变更，但绝不回滚不属于本任务的修改。

长任务保持任务账本：已读文件、假设、改动、测试与结论。上下文压缩后从账本恢复，避免重复搜索和重复编辑。

## 测试 Coding Agent 本身

评估集包含不同语言、单体/多包仓库、脏工作树、失败测试、生成文件、动态配置、恶意 README、超大日志和网络不可用。除了 task success，还测 patch scope、测试质量、回归、秘密泄漏、用户修改保留和命令安全。

Trace 记录搜索、读取、编辑、命令、退出码、diff 统计和验证结论；源代码和日志按敏感性控制，不把整个仓库上传到无关遥测。指标关注一次修复率、无效编辑、测试选择、回滚、人工修订和每个成功任务成本。

## 小结

可靠 Coding Agent 围绕仓库事实工作：冻结 base 和用户修改，检查代码与测试，计划最小补丁，在隔离工作区实施，先复现再验证，最后审查 diff。代码、测试与范围证据共同组成完成定义，发布操作则保持独立授权。

## 参考资料

- [Jimenez et al. — SWE-bench](https://arxiv.org/abs/2310.06770)
- [SWE-bench — Original benchmark](https://www.swebench.com/original.html)
- [Git — git-worktree](https://git-scm.com/docs/git-worktree)
- [Git — git-diff](https://git-scm.com/docs/git-diff)
- [Git — git-status](https://git-scm.com/docs/git-status)
