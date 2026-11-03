这份记录自述字节 TRAE 后端开发秋招二面，主要围绕科研与项目追问，并有最小编辑距离手写题；未明确面试日期。下面保留可辨认的问题条件，回答思路为编辑补充，不代表当事人的现场作答或实际项目能力。

<details data-knowledge-key="agent-project-portfolio"><summary>（1）怎样简要介绍自己并说明科研工作内容？</summary></details>
<p>围绕目标岗位说明研究问题、个人职责、关键方法和可以核对的结果，再按追问展开实现与取舍。把本人完成、团队完成和仍未验证的部分分开，数据和结论以真实记录为依据。原文未披露具体科研课题，不能补造论文、指标或个人履历。</p>

<details data-knowledge-key="build-agent-framework"><summary>（2）项目中各个 Agent 的自动化逻辑是什么？</summary></details>
<p>分别说明各 Agent 的输入、状态、允许工具、输出合同和停止条件，再解释它们如何交接结果与处理依赖。自动化逻辑要落到受控执行循环、错误恢复和可验证终态，不能只列角色名称。共享状态、权限与并发合并也应有明确责任。</p>

<details data-knowledge-key="agent-tool-design"><summary>（3）Agent 使用了哪些工具，各自怎样工作？</summary></details>
<p>按任务逐个交代工具做什么、何时使用、参数与返回结构，以及权限、错误和副作用边界。模型负责提出候选调用，执行端独立校验输入和授权，再把实际结果交回运行循环。原文没有工具清单，应按真实项目回答，不能替其补上未出现的工具。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（4）项目的核心思想与实现方式是什么？</summary></details>
<p>从要解决的问题和现有做法的限制切入，沿输入、核心机制、输出与验收解释实现，而不是把依赖名串成清单。再说明本人负责的关键选择、失败出口和复现步骤。具体细节应来自实际科研或项目记录，编辑思路不代表现场实现。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（5）该方案与现有工具相比有哪些区别和优势？</summary></details>
<p>先选可比较的基线，在相同任务、数据、权限和资源边界下比较完成质量、失败类型与使用负担。优势应由可复现证据支持，同时交代牺牲了什么和哪些场景不适用。演示顺利、生成更多代码或主观感觉更好，都不能独立证明优于现有工具。</p>

<details data-knowledge-key="agent-project-deployment"><summary>（6）对不熟悉 Linux 的用户是否友好？</summary></details>
<p>先确认目标用户必须理解哪些环境与权限，再检查安装、配置、常用操作、错误反馈和恢复是否能由他人按说明完成。可把常用路径做成有前置校验的入口，并用不熟悉 Linux 的实际用户任务验证；高级能力和危险操作仍应明确显示边界。原文没有界面或部署细节，不能据此宣称该项目已经做到。</p>

<details data-knowledge-key="algorithm-string"><summary>（7）怎样实现最小编辑距离？</summary></details>
<p>原帖只给题名，先确认操作代价与字符粒度；教学模型采用插入、删除、替换各为 1，不把相邻交换算一次编辑。定义 dp[i][j] 为两串前缀的最小代价，空前缀以长度初始化，再从删除、插入、替换或相同字符保留三类候选中取最小。二维表时间与空间为 O((n+1)(m+1))；JavaScript 示例按 code point 处理，组合字素仍需另定分段与归一化规则。</p>
