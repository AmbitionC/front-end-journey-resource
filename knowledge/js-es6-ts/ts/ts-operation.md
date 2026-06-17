TypeScript支持多种高级类型操作，这些特性提供了强大的类型系统，使得代码更加类型安全。以下是一些TypeScript中的高级类型操作：

#### 1. 联合类型（Union Types）
允许你将多个类型组合成一个类型，表示一个值可以是几种类型之一。

```typescript
type StringOrNumber = string | number;
```



#### 2. 交叉类型（Intersection Types）
允许你将多个类型合并为一个类型，表示一个值同时具有多个类型的属性。

```typescript
type Person = { name: string };
type Loggable = { log: () => void };

type PersonLoggable = Person & Loggable;
```



#### 3. 字面量类型（Literal Types）
允许你将类型限制为特定的字面量值。

```typescript
type EventType = 'click' | 'mouseover' | 'keydown';
```



#### 4. 元组类型（Tuple Types）
允许你定义具有固定数量元素的数组，每个元素可以是不同的类型。

```typescript
type Pair = [string, number];
```



#### 5. 索引类型（Indexable Types）
允许你通过索引访问属性，类似于JavaScript中的对象。

```typescript
interface StringArray {
  [index: number]: string;
}
```



#### 6. 映射类型（Mapped Types）
允许你创建一个新类型，该类型是现有类型的每个属性的映射。

```typescript
type OptionsFlags<T> = {
  [P in keyof T]: boolean;
};
```



#### 7. 条件类型（Conditional Types）
允许你基于条件表达式创建类型。

```typescript
type IsNumber<T> = T extends number ? "number" : "not a number";
```



#### 8. 模板字面量类型（Template Literal Types）
允许你通过模板字符串的形式定义类型。

```typescript
type EventTypes = 'click' | 'mouseover';
type EventMap = `${EventTypes}`;
```



#### 9. 索引访问类型（Indexed Access Types）
允许你通过索引访问来获取类型的子类型。

```typescript
type StringMap = { [key: string]: string };
type Value = StringMap['someKey'];
```



#### 10. 查询类型（Query Types）- 新提案
允许你查询一个条件是否为真，并据此推断类型。

```typescript
type a = Extract<string, 'a' | 'b'>; // "a" | "b"
```



#### 11. 类型守卫（Type Guards）
允许你在运行时检查和排除类型的可能性。

```typescript
function isString(value: any): value is string {
  return typeof value === 'string';
}
```



#### 12. 类型推断（Type Inference）
允许编译器自动推断变量的类型。

```typescript
const myVar = "Hello World";
```



#### 13. 类型参数（Type Parameters）
允许为函数或类定义类型参数，提供类型重用和泛型支持。

```typescript
function identity<T>(arg: T): T {
  return arg;
}
```



#### 14. 修饰符（Modifiers）
允许你使用`readonly`、`?`（可选属性）等修饰符来修饰类型。

```typescript
type Point = {
  readonly x: number;
  y?: number;
};
```



#### 15. 声明合并（Declaration Merging）
允许你合并多个声明为一个声明。

```typescript
interface Name {
  first: string;
}

interface Name {
  last: string;
}

// 合并后的 Name 接口具有 first 和 last 属性
```

