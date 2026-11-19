export const meta = {
  name: 'agent-coding-repo-loop-v2',
  article: 'knowledge/llm/agent/agent-coding.md',
  alt: 'Coding Agent 从任务和验收标准出发，先读仓库、做计划、建检查点，再进入隔离 worktree 打补丁；依次格式化、类型检查、单元测试和集成测试，失败就修复重测，通过后还要做 diff 审查，最后带着实际改动和验证证据交付',
};

export default (k) => k.figure({
  h: 590,
  title: 'Coding Agent 执行循环：改完要能证明',
  subtitle: '从验收标准出发，在隔离 worktree 里改代码；验证不过就修，过了还要看 diff',
  body: [
    k.box({ x: 40, y: 120, w: 170, h: 84, title: '任务 + 验收标准', sub: 'issue、完成定义' }),
    k.arrow({ points: [[210, 162], [266, 162]] }),
    k.box({ x: 270, y: 120, w: 170, h: 84, title: '读仓库', sub: '状态、文件、测试' }),
    k.arrow({ points: [[440, 162], [496, 162]] }),
    k.box({ x: 500, y: 120, w: 170, h: 84, title: '计划', sub: '改哪里、怎么验证' }),
    k.arrow({ points: [[670, 162], [726, 162]] }),
    k.box({ x: 730, y: 120, w: 190, h: 84, title: '建检查点', sub: '记下 HEAD 和保护文件', tone: 'warn' }),
    k.arrow({ points: [[825, 204], [825, 240], [145, 240], [145, 306]], label: '进入隔离 worktree', labelAt: [485, 232] }),

    k.frame({ x: 40, y: 270, w: 680, h: 220, label: 'worktree（隔离分支，主干不受影响）', labelPos: 'bottom' }),
    k.box({ x: 70, y: 310, w: 150, h: 90, title: '打补丁', sub: '最小改动', tone: 'accent' }),
    k.arrow({ points: [[220, 355], [276, 355]] }),
    k.box({ x: 280, y: 296, w: 190, h: 118, title: '验证', sub: '格式化 → 类型检查\n单元 → 集成测试' }),
    k.arrow({ points: [[470, 355], [526, 355]], tone: 'ok' }),
    k.box({ x: 530, y: 310, w: 170, h: 90, title: 'Diff 审查', sub: '对照验收逐条看' }),
    k.arrow({ points: [[375, 414], [375, 446], [145, 446], [145, 404]], tone: 'bad', dashed: true, label: '失败：修复后重测', labelAt: [260, 438] }),
    k.arrow({ points: [[700, 355], [756, 355]], tone: 'ok' }),
    k.box({ x: 760, y: 310, w: 160, h: 90, title: '交付', sub: '改动 + 验证证据', tone: 'ok' }),

    k.note({ x: 40, y: 510, w: 880, h: 56, lead: '测试通过 ≠ 可以交付：', text: '还要看 diff 有没有越界、动没动受保护文件；交付时附上真实跑过的命令和结果。' }),
  ].join(''),
});
