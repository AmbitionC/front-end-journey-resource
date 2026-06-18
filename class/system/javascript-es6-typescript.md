## 一、JavaScript 基础概念

### 1. JavaScript 是什么

JavaScript 是一种**解释型、弱类型、基于原型的脚本语言**，最早由网景公司设计，用来在浏览器中操作网页。如今它不仅仅用于前端，还能在服务端（Node.js）、桌面应用（Electron）、移动端（React Native）、甚至物联网设备中运行。

特点：

* **解释型**：无需编译，直接在运行环境中解释执行。
* **弱类型**：变量声明时不需要指定类型，可以随时赋不同类型的值。
* **基于原型**：对象继承基于原型链，而不是传统的类继承。
* **单线程**：事件循环机制保证了异步操作的高效执行。

### 2. JavaScript 的运行环境

* **浏览器**：通过内置的 JavaScript 引擎执行，如 Chrome 的 V8、Firefox 的 SpiderMonkey。
* **Node.js**：基于 V8 的服务端运行环境，支持文件、网络等操作。

### 3. 基本语法

```javascript
// 变量声明
var x = 10;       // 函数作用域
let y = 20;       // 块级作用域
const PI = 3.14;  // 常量，不可重新赋值

// 数据类型
let name = "Alice";  // 字符串
let age = 25;        // 数字
let isStudent = true; // 布尔
let scores = [90, 85, 100]; // 数组
let person = { name: "Alice", age: 25 }; // 对象

// 函数
function add(a, b) {
  return a + b;
}
console.log(add(2, 3)); // 输出 5
```


## 二、ES6 的核心特性

ES6（ECMAScript 2015）为 JavaScript 带来了革命性的提升，让开发者可以更高效、优雅地写代码。

### 1. 块级作用域 (`let` 和 `const`)

```javascript
if (true) {
  let a = 10;
  const b = 20;
  console.log(a, b); // 10 20
}
// console.log(a, b); // 报错，超出作用域
```

**说明**：`let` 和 `const` 避免了 `var` 带来的变量提升和作用域混乱问题。

### 2. 模板字符串

```javascript
let name = "Alice";
let message = `Hello, ${name}!`;
console.log(message); // Hello, Alice!
```

支持多行字符串和变量插值，更适合生成 HTML。

### 3. 解构赋值

```javascript
// 数组解构
let [a, b] = [1, 2];
console.log(a, b); // 1 2

// 对象解构
let { name, age } = { name: "Alice", age: 25 };
console.log(name, age); // Alice 25
```

### 4. 箭头函数

```javascript
let add = (a, b) => a + b;
console.log(add(2, 3)); // 5
```

特点：

* 简洁语法
* 自动绑定 `this`

### 5. 类与继承

```javascript
class Person {
  constructor(name) {
    this.name = name;
  }
  greet() {
    console.log(`Hello, I am ${this.name}`);
  }
}

class Student extends Person {
  constructor(name, major) {
    super(name);
    this.major = major;
  }
  study() {
    console.log(`${this.name} is studying ${this.major}`);
  }
}

let s = new Student("Alice", "CS");
s.greet(); // Hello, I am Alice
s.study(); // Alice is studying CS
```

这是对 ES5 原型继承的一次大幅优化。

### 6. Promise 与异步

```javascript
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve("Data loaded"), 1000);
  });
}

fetchData().then(data => console.log(data));
```

### 7. `async/await`

```javascript
async function load() {
  let data = await fetchData();
  console.log(data);
}
load();
```

**说明**：`async/await` 基于 `Promise`，让异步代码写起来像同步。

## 三、TypeScript：给 JavaScript 加上类型系统

TypeScript 是 JavaScript 的超集，增加了**类型检查、接口、泛型**等特性，让大型项目更稳定。

### 1. 基础类型

```typescript
let age: number = 25;
let name: string = "Alice";
let isStudent: boolean = true;
let scores: number[] = [90, 85, 100];
```

### 2. 接口 (`interface`)

```typescript
interface Person {
  name: string;
  age: number;
}

let p: Person = { name: "Alice", age: 25 };
```

### 3. 类与继承

```typescript
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  greet(): void {
    console.log(`Hello, I am ${this.name}`);
  }
}

class Student extends Person {
  major: string;
  constructor(name: string, major: string) {
    super(name);
    this.major = major;
  }
  study(): void {
    console.log(`${this.name} is studying ${this.major}`);
  }
}
```

### 4. 泛型

```typescript
function identity<T>(arg: T): T {
  return arg;
}
let output = identity<string>("Hello");
```

### 5. 类型推断与联合类型

```typescript
let x = 10; // 自动推断为 number
let y: number | string; // 联合类型
y = "Alice";
y = 20;
```


## 四、结合示例：从 JS 到 TS 的进化

### 示例：用户管理模块

#### JavaScript 写法

```javascript
function createUser(name, age) {
  return { name, age };
}

let user = createUser("Alice", 25);
console.log(user.name.toUpperCase()); // "ALICE"
```

问题：没有类型检查，如果 `user.name` 不小心写成数字会出错。

#### TypeScript 写法

```typescript
interface User {
  name: string;
  age: number;
}

function createUser(name: string, age: number): User {
  return { name, age };
}

let user = createUser("Alice", 25);
console.log(user.name.toUpperCase()); // "ALICE"
```

好处：编译阶段即可发现错误，减少运行时 bug。


## 五、学习建议与资料

### 学习路线

1. 打好 JavaScript 基础（语法、DOM、事件循环）。
2. 学习 ES6 特性（模块化、类、Promise、解构）。
3. 逐步迁移到 TypeScript（类型、接口、泛型）。
4. 结合框架（React/Vue/Angular）深入应用。

### 推荐资料

* 《JavaScript 高级程序设计》
* 《你不知道的 JavaScript》系列
* 《TypeScript 手册》 (官网)
* MDN 文档（最权威的参考）
