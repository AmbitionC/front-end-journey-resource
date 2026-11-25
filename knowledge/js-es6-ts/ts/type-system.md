TypeScript 类型系统的目标，是在 JavaScript 运行前描述值之间的关系并排除不可能状态。它主要采用结构化类型，并允许部分有意的不健全性来兼容 JavaScript；类型注解最终会擦除，不能替代运行时校验。

![TypeScript 类型系统的三件事和一条边界。结构化兼容：pixel 有 x、y、color，Point 只要 x、y，成员够就能赋值；但对象字面量直接赋值时仍会做额外属性检查。判别联合缩小：LoadState 按 status 区分，switch 进入 idle 分支什么也没有，loading 分支才能用 requestId，success 分支才能用 data，error 分支才能用 error；default 分支把值赋给 never 做穷尽检查，新增状态时编译器会提醒。泛型保留关系：first<T> 输入 readonly T[]，返回 T | undefined；mapValue<T, U> 接收 T 和从 T 到 U 的转换，返回 U；T 从实参推断并贯穿输入和输出，只用一次的类型参数不要硬泛型化。类型擦除边界：网络响应、用户输入、本地存储这些外部数据在运行时没有类型，先用 unknown 接收，经过 parser 校验，才得到 User 这样的领域类型；as User 断言只改变编译器视角，不检查字段，any 会沿调用链传播，只适合当迁移逃生口](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/typescript-structural-narrowing-model-v2.dark.png)
*图：上排依次是结构化兼容、判别联合缩小和泛型关系；下排是类型擦除边界，外部数据要从 unknown 经过 parser 才变成领域类型。*

---

## 结构化类型

[Type Compatibility 手册](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)说明 TypeScript 按成员结构判断兼容，而不是要求两个类型显式声明同一名义：

```typescript
type Point = { x: number; y: number };
const pixel = { x: 10, y: 20, color: 'red' };
const point: Point = pixel;
```

pixel 至少拥有 Point 所需的成员，所以变量赋值兼容。对象字面量直接赋给 Point 时还会做额外属性检查，用于捕捉拼写错误；它是基本兼容规则上的检查，不意味着 TypeScript 变成名义类型。

函数兼容需要分别考虑参数与返回值。回调可以忽略调用方提供的额外参数，但不能要求调用方不会提供的必需参数。开启 `strict`、`strictFunctionTypes` 和 `strictNullChecks`，能让公共边界更早暴露问题。

## unknown、any、never 与 void

- `any` 关闭相关静态检查并向调用链传播，适合作为迁移逃生口，不适合作为默认外部输入。
- `unknown` 表示尚未验证，使用前必须缩小。
- `never` 表示不可能出现的值，适合做联合穷尽检查。
- `void` 常用于表示调用方不使用返回值；它不等于“函数绝对不能返回任何值”。

[TypeScript 函数手册对 void 的说明](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)指出：上下文类型为 `() => void` 的回调可以返回一个值，只是调用方忽略它。这使 `array.forEach(item => output.push(item))` 合法；但显式声明 `function f(): void` 时，函数体不能返回有值表达式。

## 联合类型与控制流缩小

[Narrowing 手册](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)描述 `typeof`、`instanceof`、`in`、相等检查、predicate 与判别字段如何参与控制流分析。判别联合把状态与可用字段绑定：

```typescript
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading'; requestId: string }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function message<T>(state: LoadState<T>): string {
  switch (state.status) {
    case 'idle': return 'Ready';
    case 'loading': return `Loading ${state.requestId}`;
    case 'success': return 'Done';
    case 'error': return state.error.message;
    default: {
      const impossible: never = state;
      return impossible;
    }
  }
}
```

新增状态后，`never` 赋值迫使这里更新。自定义 predicate 只有在实现真实验证时才可信；随意返回 `value is User` 与断言一样会欺骗编译器。

## 泛型保留关系

联合 `string | number` 只表达一个值的可能集合，泛型可以表达多个位置之间的同一类型关系：

```typescript
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

function mapValue<T, U>(value: T, transform: (input: T) => U): U {
  return transform(value);
}
```

T 从实参推断并贯穿输入与输出。约束 `T extends { id: string }` 表示调用方仍保留具体类型，同时保证函数可访问 id；不要为只有一个位置使用的类型参数强行泛型化。

## 类型擦除与运行时边界

网络响应、用户输入和 localStorage 在运行时没有自动类型。类型断言 `payload as User` 只改变编译器视角，不检查字段。安全边界以 unknown 接收，再用 schema/parser 返回领域类型：

```typescript
type User = { id: string; name: string };

function parseUser(value: unknown): User {
  if (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  ) {
    return { id: value.id, name: value.name };
  }
  throw new TypeError('Invalid user payload');
}
```

大型 schema 更适合成熟校验库并生成明确错误。静态类型负责可信代码内部关系，runtime parser 负责跨信任边界，两者缺一不可。

## 建模检查清单

- 用判别联合替代互相矛盾的 boolean；
- 避免把 any 从适配层泄漏进领域层；
- 用 readonly 表达不应修改的输入；
- 为 null/undefined 明确语义，而不是到处非空断言；
- 公共类型减少不必要断言并开启严格模式；
- 外部数据先解析，解析失败进入显式错误路径。

## 先看 JS 运行时值，再谈静态类型

ECMAScript 的运行时类型包括 Undefined、Null、Boolean、String、Symbol、Number、BigInt 与 Object。[语言类型规范](https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html)定义了这些值。函数、数组属于对象范畴；typeof 的字符串结果并非完整类型分类，例如 typeof null 为 object。

这与 TypeScript 的 any、unknown、never 等静态建模概念不同。网络返回值没有自动附带可信类型；运行时判空、Array.isArray 与字段解析，才把实际数据转换为应用可用对象。不要因注解写了 number 就认为外部字符串已转成数字。

## 练一练

### 高频考点题 1：结构化类型

一个有 x、y、color 三个字段的变量，能赋给只声明了 x、y 的 Point 类型吗？

- A. 不能，类型名不同
- B. 只有 class 实例才能赋值给 Point 类型
- C. 不能，多了一个字段
- D. 能，它拥有 Point 所需成员

**答案：D。** TypeScript 按成员结构判断兼容；但对象字面量直接赋值时会做额外属性检查。

### 高频考点题 2：unknown 与 any

处理外部输入时，为什么推荐用 unknown 而不是 any？

- A. unknown 使用前必须先缩小类型
- B. unknown 运行速度更快
- C. any 不能接收对象
- D. unknown 会自动校验 JSON

**答案：A。** any 关闭静态检查并沿调用链传播；unknown 表示尚未验证，迫使你先检查。

### 高频考点题 3：类型断言

把网络响应写成 payload as User，运行时会检查字段吗？

- A. 会，字段缺失时抛错
- B. 会自动补全缺失字段
- C. 会，但只检查标记为必填的字段
- D. 不会，只改变编译器视角

**答案：D。** 类型在运行时被擦除；外部数据要用 schema 校验后再当作 User 使用。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
<!-- interview-source-history:end -->

## 参考资料

- [TypeScript handbook: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [TypeScript handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript handbook: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)
