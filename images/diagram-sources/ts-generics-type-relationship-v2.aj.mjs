export const meta = {
  name: 'ts-generics-type-relationship-v2',
  article: 'knowledge/js-es6-ts/ts/ts-generics.md',
  alt: 'TypeScript 泛型的作用是保留输入和输出之间的类型关系。上排对比同一个 identity 函数的三种写法：参数和返回都写 any 时，identity(42) 的结果是 any，类型关系断了；写成 number 或 string 的联合类型时，传 42 得到的仍是联合类型，输入和输出对不上；写成泛型 T 时，传 42 得到 number，输入是什么输出就是什么。下排是泛型表达关系的三种工具：约束 T extends HasLength，longest 传入字符串数组返回的仍是 string 数组而不是 HasLength，约束只说明最低能力；keyof，K extends keyof T，getProperty(user, name) 返回 string，也就是 T[name]，K 只能是 id 或 name；默认类型参数 Box<T = unknown>，省略时给安全默认，不要默认成 any，带默认的参数放在尾部。key 来自运行时字符串输入时要先验证缩窄，不能用 as keyof T 骗过编译器',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 130, text: '同一个 identity，三种写法', size: 'label', tone: 'muted', weight: 600 }));
  const top = [
    ['(value: any) => any', 'identity(42) 得到 any\n类型关系断了', 'bad'],
    ['number | string 联合', 'identity(42) 得到联合类型\n输入和输出对不上', 'warn'],
    ['<T>(value: T) => T', 'identity(42) 得到 number\n输入是什么，输出就是什么', 'ok'],
  ];
  top.forEach(([t, sub, tone], i) => s.push(k.box({ x: 40 + i * 300, y: 144, w: 280, h: 84, title: t, sub, titleSize: 'body', tone })));

  s.push(k.text({ x: 40, y: 270, text: '泛型表达关系的三种工具', size: 'label', tone: 'muted', weight: 600 }));
  const tools = [
    ['约束：T extends HasLength', "longest(['a'], ['b', 'c'])\n→ string[]，不是 HasLength\n约束只说明最低能力"],
    ['keyof：K extends keyof T', "getProperty(user, 'name')\n→ string，即 T['name']\nK 只能是 'id' | 'name'"],
    ['默认：Box<T = unknown>', '省略时给安全默认\n不要默认成 any\n带默认的参数放在尾部'],
  ];
  tools.forEach(([t, sub], i) => s.push(k.box({ x: 40 + i * 300, y: 284, w: 280, h: 112, title: t, sub, titleSize: 'body', tone: 'accent' })));

  return k.figure({
    h: 520,
    title: 'TypeScript 泛型：保留输入和输出之间的关系',
    subtitle: 'any 切断关系，联合类型丢掉对应关系；类型参数把调用点的具体类型一路带下去',
    body: s.join('') + k.note({ x: 40, y: 424, w: 880, h: 52, lead: '运行时字符串要先验证：', text: "key 来自用户输入时先缩窄，不能用 as keyof T 骗过编译器。" }),
  });
};
