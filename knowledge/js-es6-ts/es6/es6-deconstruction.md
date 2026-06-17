ES6（ECMAScript 2015）引入了解构赋值（Destructuring assignment），这是一种新的赋值语法，允许你从数组或对象中提取数据并赋值给新的变量。解构赋值可以使代码更加简洁和易于阅读。

#### 数组解构
数组解构允许你将数组中的值分别赋给不同的变量。

```javascript
// 基本用法
const a = [1, 2, 3];
const [x, y, z] = a;

// 交换两个变量的值
[x, y] = [y, x];

// 忽略某些值
const [first, , third] = a;

// 使用索引
const [first, second] = a; // first = 1, second = 2
```



#### 对象解构
对象解构允许你从对象中提取属性并赋值给变量。

```javascript
// 基本用法
const person = { firstName: 'Jane', lastName: 'Doe' };
const { firstName, lastName } = person;

// 默认值
const { firstName, lastName = 'Unknown' } = person;

// 重命名属性
const { first: firstName, last: lastName } = person;
```



#### 函数参数解构
你可以在函数参数中使用解构赋值。

```javascript
// 数组参数
function greet({name, age}) {
  console.log(`Hello, ${name}! You are ${age} years old.`);
}

greet({ name: 'John', age: 30 }); // 输出: Hello, John! You are 30 years old.

// 对象参数
function getPerson({ firstName, lastName }) {
  return `${firstName} ${lastName}`;
}

const personString = getPerson({ firstName: 'Jane', lastName: 'Doe' });
```



#### 字符串解构
字符串也可以进行解构，字符串的每个字符可以被赋值给不同的变量。

```javascript
const [a, b, c, d, e] = 'Hello';
```



#### 嵌套解构
解构赋值可以嵌套使用，例如，你可以在对象中解构另一个对象。

```javascript
const { place: { name } } = { place: { name: 'Earth' } };
```



#### 注意事项
+ 解构赋值是浅拷贝，如果解构的对象或数组中包含嵌套对象或数组，需要额外的步骤来深拷贝。
+ 在解构时，变量的顺序很重要，它们应该与要解构的数据结构相匹配。
+ 默认值只在变量未被赋值时使用，如果变量已经被赋值，即使该值是`undefined`，默认值也不会被应用。
+ 解构赋值可以用于任何可迭代对象（如Map、Set等），但需要使用`for...of`循环或其他方法来迭代。



