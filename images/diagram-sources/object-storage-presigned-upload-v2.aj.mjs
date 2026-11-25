export const meta = {
  name: 'object-storage-presigned-upload-v2',
  article: 'knowledge/backend/storage/object-storage.md',
  alt: '对象存储的受控直传流程，三方是客户端、业务服务和对象存储。第一步客户端向业务服务申请上传。第二步业务服务认证用户、检查配额，创建 pending object，key 用 tenant 加不可猜测的随机 ID 而不是文件名，签名锁定 method、key、类型和大小。第三步业务服务把短期 PUT 或 multipart 签名返回给客户端。第四步客户端直接把对象传到对象存储，不经过业务服务。第五步客户端提交完成通知，这个通知可能重复，状态转换要幂等。第六步业务服务用 HEAD 校验对象的大小、类型、hash 和 versionId。第七步才标记 ready，恶意文件扫描完成前隔离下载，上传返回 200 不等于业务对象可用。下方两条策略：版本化后普通删除只留下 delete marker，旧版本可恢复，数据库记录正在使用的 versionId；生命周期规则从业务保留期倒推，清理过期的 pending 上传和未完成的 multipart，设定非当前版本的恢复窗口，低频存储层有最短存储期和取回费用',
};

export default (k) => {
  const s = [];
  const L = k.t.faint;
  const lane = (x, y1, y2) => `<path d="M ${x} ${y1} V ${y2}" stroke="${L}" stroke-width="1.5" stroke-dasharray="4 5" fill="none"/>`;
  s.push(k.box({ x: 40, y: 120, w: 160, h: 44, title: '客户端', titleSize: 'body', tone: 'muted', strong: true }));
  s.push(k.box({ x: 370, y: 120, w: 200, h: 44, title: '业务服务', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.box({ x: 760, y: 120, w: 160, h: 44, title: '对象存储', titleSize: 'body', tone: 'info', strong: true }));
  s.push(lane(120, 164, 560), lane(840, 164, 560));
  s.push(lane(470, 164, 214), lane(470, 278, 338), lane(470, 376, 494));

  s.push(k.arrow({ points: [[120, 194], [470, 194]], label: '① 申请上传', labelAt: [295, 186] }));
  s.push(k.box({ x: 280, y: 214, w: 380, h: 64, title: '② 认证、查配额、建 pending object', sub: 'key 用 tenant/随机 ID；签名锁定方法、类型、大小', titleSize: 'label', tone: 'accent' }));
  s.push(k.arrow({ points: [[470, 312], [120, 312]], label: '③ 短期 PUT 签名', labelAt: [295, 304] }));
  s.push(k.arrow({ points: [[120, 364], [840, 364]], tone: 'info', label: '④ 直传对象，不经过业务服务', labelAt: [480, 356] }));
  s.push(k.arrow({ points: [[120, 416], [470, 416]], label: '⑤ 完成通知（可重复）', labelAt: [295, 408] }));
  s.push(k.arrow({ points: [[470, 466], [840, 466]], label: '⑥ HEAD 校验大小 · 类型 · hash', labelAt: [655, 458] }));
  s.push(k.box({ x: 300, y: 494, w: 340, h: 66, title: '⑦ 校验通过才标记 ready', sub: '扫描完成前隔离下载；200 ≠ 可用', titleSize: 'label', tone: 'ok' }));

  s.push(k.box({ x: 40, y: 590, w: 430, h: 84, title: '版本', sub: '删除只留 delete marker，旧版本可恢复\n数据库记正在使用的 versionId', titleSize: 'body', tone: 'muted' }));
  s.push(k.box({ x: 490, y: 590, w: 430, h: 84, title: '生命周期', sub: '清理过期 pending 和未完成 multipart\n低频层有最短存储期和取回费', titleSize: 'body', tone: 'muted' }));

  return k.figure({
    h: 790,
    title: '对象存储：签发受限能力，直传后由服务端验收',
    subtitle: 'Presigned URL 是谁拿到谁能用的临时能力；对象可用要以服务端校验为准',
    body: s.join('') + k.note({ x: 40, y: 698, w: 880, h: 52, lead: '完成回调要幂等：', text: '同一对象的完成通知可能来多次，pending → ready 的状态转换只能发生一次。' }),
  });
};
