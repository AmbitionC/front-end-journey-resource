export const meta = {
  name: 'project-ee-playbook-ace-roles-v1',
  article: 'project/eval-evolve/ee-playbook.md',
  alt: 'ACE 的三个角色：执行者带着经验手册完成任务并产出轨迹，反思者对照结果提炼这次运行的教训，整理者把教训变成对手册的增量修改（新增条目、修改某条、调整计数），更新后的手册下次再交给执行者',
};

export default (k) => k.figure({
  h: 520,
  title: 'ACE：三个角色维护一本只做增量修改的经验手册',
  subtitle: '反思和整理分开：一个只管看出教训，一个只管维护手册的结构',
  body: [
    k.box({ x: 40, y: 150, w: 120, h: 80, title: '任务' }),
    k.arrow({ points: [[160, 190], [216, 190]] }),
    k.box({ x: 220, y: 150, w: 200, h: 80, title: '执行者', sub: '带着手册完成任务' }),
    k.arrow({ points: [[420, 190], [476, 190]], label: '轨迹', labelAt: [448, 180] }),
    k.box({ x: 480, y: 150, w: 200, h: 80, title: '反思者', sub: '这次对在哪、错在哪' }),
    k.arrow({ points: [[680, 190], [736, 190]], label: '教训', labelAt: [708, 180] }),
    k.box({ x: 740, y: 150, w: 180, h: 80, title: '整理者', sub: '变成增量修改', tone: 'accent' }),
    k.box({ x: 380, y: 320, w: 300, h: 90, title: '经验手册', sub: '每条记：内容、帮过几次、误导几次', tone: 'accent', strong: true }),
    k.arrow({ points: [[830, 230], [830, 365], [684, 365]], tone: 'accent', label: '新增 / 修改 / 调计数', labelAt: [820, 300], labelAnchor: 'end' }),
    k.arrow({ points: [[380, 365], [320, 365], [320, 234]], tone: 'accent', label: '下次带上', labelAt: [310, 300], labelAnchor: 'end' }),

    k.note({ x: 40, y: 440, w: 880, h: 56, lead: '只许增量修改：', text: '新增条目、修改某条、调整计数，不许整本重写。' }),
  ].join(''),
});
