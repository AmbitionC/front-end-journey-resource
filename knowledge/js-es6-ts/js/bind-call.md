| 描述 | `bind` | `call` | `apply` |
| :---: | --- | --- | --- |
| 过程 | 返回一个新函数，其 `this`<br/> 值设置为提供的值，但不立即执行。 | 调用函数，其 `this`<br/> 值设置为提供的值，并传递一个参数列表作为函数的参数，并立即执行该函数。 | 调用函数，其 `this`<br/> 值设置为提供的值，并传递一个数组作为函数的参数，并立即执行该函数。 |
| 参数传递 | 参数是在调用新函数时传递给它的参数。 | 参数是直接传递给函数的参数列表。 | 参数是作为数组传递给函数的。 |
| 返回值 | 返回一个新函数。 | 直接调用函数，并返回函数的执行结果。 | 直接调用函数，并返回函数的执行结果。 |
| 使用场景 | 通常用于创建具有特定上下文的函数，并在稍后调用。 | 用于在当前上下文中立即调用函数，并且参数数量已知。 | 用于在当前上下文中立即调用函数，并且参数数量已知。 |


代码示例：

```javascript
const obj = {
  name: 'Alice',
  greet: function(message) {
    console.log(`${message}, ${this.name}!`);
  }
};

const obj2 = {
  name: 'Bob'
};

// 使用 bind 方法
const boundGreet = obj.greet.bind(obj2);
boundGreet('Hello'); // 输出: Hello, Bob!

// 使用 call 方法
obj.greet.call(obj2, 'Hi'); // 输出: Hi, Bob!

// 使用 apply 方法
obj.greet.apply(obj2, ['Hey']); // 输出: Hey, Bob!

```

