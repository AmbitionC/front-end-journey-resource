TypeScript 中的泛型提供了一种创建可重用组件的方式，这些组件能够操作多种类型的数据而不丢失类型安全。泛型的主要用途包括：

#### 代码复用
泛型允许你编写一个函数或类，它可以适用于多种数据类型，而不是仅限于一种特定类型。

```typescript
function identity<T>(arg: T): T {
  return arg;
}

let output = identity<string>("Hello World");  // 类型为 string
let output2 = identity<number>(123);           // 类型为 number
```



#### 保持类型一致性
使用泛型可以确保函数或方法的输入和输出类型保持一致。

```typescript
function swap<T>(arr: Array<T>, index1: number, index2: number): Array<T> {
  const temp = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = temp;
  return arr;
}
```



#### 增强代码的可读性和可维护性
泛型使得代码的意图更加明确，因为它们清晰地表达了函数或类可以处理的数据类型。

```typescript
interface Pair<T, U> {
  first: T;
  second: U;
}

let pair = { first: 'Hello', second: 123 };
```



#### 创建高度灵活的数据结构
泛型可以用于创建数组、链表、栈、队列等数据结构，这些结构可以处理不同类型的数据。

```typescript
class Stack<T> {
  private items: T[] = [];
  push(item: T) {
    this.items.push(item);
  }
  pop(): T {
    return this.items.pop();
  }
}
```



#### 类型安全
泛型提供了编译时类型检查，帮助开发者避免类型错误。

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

const result = getProperty({ name: 'Alice', age: 25 }, 'age'); // 类型为 number
```



#### 避免类型转换
在没有泛型的情况下，可能需要进行类型断言或类型转换来确保操作的正确性。泛型可以消除这种需求。

```typescript
function arrayMove<T>(arr: Array<T>, fromIndex: number, toIndex: number) {
  arr.splice(toIndex, 0, arr.splice(fromIndex, 1)[0]);
}
```



#### 支持有条件的类型
泛型可以与条件类型一起使用，创建复杂的类型逻辑。

```typescript
type FirstType<T> = T extends any[] ? T[number] : T;
```



#### 与现代JavaScript特性结合
泛型与ES6+的新特性（如类、接口、装饰器等）结合，提供了一种现代的、类型安全的编程方式。



