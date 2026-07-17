TypeScript 泛型的目的不是把类型写得更抽象，而是在调用者传入的具体类型之间保留关系。`any` 会切断关系，联合类型可能丢失对应关系，泛型则能表达“输入是什么，输出仍是什么”“key 必须属于这个对象”“返回值取决于参数”。

![TypeScript 泛型在输入输出间保持类型，并通过推断、约束、keyof 与默认类型表达关系](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/ts-generics-type-relationship-v1.webp)
*图：类型参数承载调用点的具体信息；constraint 限制能力，不应把 T 粗化成约束本身。*

## 从 identity 看关系

```ts
function identity<T>(value: T): T {
  return value;
}

const n = identity(42);    // number
const s = identity('hi');  // string
```

若写成 `(value:any)=>any`，返回值失去类型；写成 `number|string`，返回仍是联合，编译器不知道输入 number 对应输出 number。[TypeScript Generics Handbook](https://www.typescriptlang.org/docs/handbook/2/generics.html)用类型变量捕获调用者类型并继续传递。

命名在简单场景用 T/U/K/V，领域 API 用 `TData`、`TError`、`TKey` 更清楚。泛型参数只出现一次通常没有建立关系，可能直接使用具体类型或 unknown。

## 推断优先，显式参数兜底

编译器从实参、上下文返回类型和默认值推断 T。良好 API 让常见调用无需写 `<...>`；推断歧义或需要指定某部分时才显式提供。

多个参数共同推断可能产生 union 或报错，取决于 variance 和候选。若 API 要求相同类型，可让第一个参数确定 T，再用 `NoInfer` 等技巧阻止第二个扩宽，但复杂技巧要有真实需求与测试。

## Constraint 表达可用能力

泛型函数若读取 `.length`，必须约束 T：

```ts
interface HasLength { length: number }

function longest<T extends HasLength>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
```

返回 T 保留具体类型；若返回 HasLength 就丢失额外字段。constraint 说明最低能力，不会把 T 变成该接口。约束过强会拒绝合法输入，应只声明实现需要的成员。

## `keyof` 把 key 与对象连接

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Ada' };
const name = getProperty(user, 'name'); // string
```

K 只能是 T 的键，返回 `T[K]` 精确对应选择的属性。若 key 在运行时来自字符串输入，必须先验证/缩窄，不能 `as keyof T` 欺骗编译器。类型安全不替代运行时数据校验。

## 泛型接口、类与工厂

`Result<T,E>`、`Repository<TEntity,TId>` 和 `ApiResponse<T>` 把容器行为与载荷类型分开。类的 static 成员不能直接引用类实例类型参数，因为 static 在所有实例间共享。

工厂函数往往比泛型构造器更易推断：

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}
```

判别联合保留控制流缩窄，比 `value?:T,error?:E` 更能表达互斥状态。

## 默认类型参数

`type Box<T = unknown> = { value:T }` 让省略时有安全默认。必填参数不能放在可选默认参数后。默认应满足 constraint，并代表合理通用行为；默认 `any` 会把未指定调用变成静默逃生口。

API 演进中增加带默认的尾部类型参数通常更兼容；重排类型参数是破坏性变化。公开库需要 dts 测试验证常见推断。

## Conditional 与 Mapped Types

Conditional type `T extends U ? X : Y` 可按类型选择结果；对 naked union T 会分布。用 `[T] extends [U]` 可抑制分布。`infer` 从结构提取类型，例如 `ReturnType`。

Mapped type 遍历 `keyof T`：

```ts
type Optional<T> = { [K in keyof T]?: T[K] };
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (value: T[K]) => void
};
```

这些工具能表达强关系，也会产生难懂错误。复杂类型提供中间别名、文档与 type tests；不要为了“无运行时代码”实现不可维护的类型编程。

## Variance 与回调

类型参数在输入位置通常逆变、输出位置协变，既进又出趋于不变；TypeScript 还受结构类型和编译选项影响。可变 `Array<Dog>` 当作 `Array<Animal>` 写入 Cat 会不安全，readonly 容器更容易协变使用。

启用 `strictFunctionTypes` 等 strict 配置。库设计区分 `Producer<out T>` 的只读输出与 `Consumer<in T>` 的输入职责，即使不显式写 variance annotation，也让结构清楚。

## `unknown` 优于 `any`

不认识外部数据时使用 unknown，先 parse/validate 再得到 T。`JSON.parse` 或网络响应不会因为 `fetchJson<User>()` 就自动变成 User；泛型只承诺调用关系，不能验证运行时。

避免 `T = any`、双重断言和无约束 `as T`。若实现无法为任意 T 构造值，就不该返回 T；让调用者传 factory 或返回可能缺失的结构。

## 设计检查

用常见调用和错误调用做 `tsd`/dtslint 类型测试，检查推断结果和 `@ts-expect-error` 确实报错。关注错误信息：类型理论上精确但调用者看不懂，也不是好 API。

泛型设计最重要的问题是“我要保留哪条关系”。先用一句自然语言写出关系，再选择 T、constraint、keyof 或 conditional；如果说不清，就先用更简单的具体类型。

## 参考资料

- [TypeScript Handbook：Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
