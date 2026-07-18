TypeScript 类型系统的目标，是在 JavaScript 运行前描述值之间的关系并排除不可能状态。它主要采用结构化类型，并允许部分有意的不健全性来兼容 JavaScript；类型注解最终会擦除，不能替代运行时校验。

![两个对象按成员结构建立兼容关系，联合类型经过控制流守卫缩小到具体分支，泛型保持输入与输出的关联，运行时数据位于类型擦除边界之外](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/typescript-structural-narrowing-model-v1.webp)
*图：左侧是 structural compatibility，中间是 union narrowing，右侧 generic 保存关系；底部提醒外部数据需要 runtime parser。*

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

## 参考资料

- [TypeScript handbook: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [TypeScript handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript handbook: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)
