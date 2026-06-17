| API | 描述 |
| :---: | --- |
| **Promise 构造函数** | Promise 构造函数用于创建一个 Promise 实例。它接受一个函数作为参数，该函数会立即执行，并接受两个参数：resolve 和 reject 函数。 |
| **Promise.resolve()** | 返回一个已解析的 Promise 对象，解析的值可以是一个普通的值，也可以是另一个 Promise 对象。如果传入的是一个 Promise 对象，则直接返回该对象。 |
| **Promise.reject()** | 返回一个被拒绝的 Promise 对象，拒绝的原因通常是一个 Error 对象或一个表示失败原因的字符串。 |
| **Promise.all()** | 接收一个可迭代对象（如数组），并返回一个 Promise 实例，只有当所有的 Promise 都变成已解决时，该 Promise 才会变成已解决。 |
| **Promise.race()** | 接收一个可迭代对象，并返回一个 Promise 实例，只要迭代对象中的一个 Promise 变为已解决或已拒绝，该 Promise 就会变为相应的状态。 |
| **Promise.prototype.then()** | 添加解决（resolve）和拒绝（reject）状态的回调函数。 |
| **Promise.prototype.catch()** | 添加一个拒绝状态的回调函数，用于捕获 Promise 链中的任何错误。 |
| **Promise.prototype.finally()** | 添加一个回调函数，不管 Promise 最终的状态如何，都会执行此回调函数。 |




#### Promise的API
**（1）**`**Promise构造函数**`

```javascript
const promise = new Promise(executor);
```

+ `executor`是一个函数，它接收两个参数：`resolve`和`reject`。
+ `resolve`用于将Promise状态变为`fulfilled`，并传递结果值。
+ `reject`用于将Promise状态变为`rejected`，并传递错误信息。



**（2）**`**Promise.prototype.then()**`

```javascript
promise.then(onFulfilled, onRejected);
```

+ `onFulfilled`是一个可选的回调函数，在Promise状态变为`fulfilled`时被调用。
+ `onRejected`是一个可选的回调函数，在Promise状态变为`rejected`时被调用。



**（3）**`**Promise.prototype.catch()**`

```javascript
promise.catch(onRejected);
```

+ `catch()`方法是`.then(null, onRejected)`的语法糖，用于处理Promise的错误。



**（4）**`**Promise.prototype.finally()**`

```javascript
promise.finally(onFinally);
```

+ `onFinally`是一个可选的回调函数，无论Promise最终状态是`fulfilled`还是`rejected`，都会执行。
+ `finally`通常用于清理资源，如关闭数据库连接、释放文件句柄等。



**（5）**`**Promise.all()**`

```javascript
Promise.all(iterable);
```

+ `iterable`是一个可迭代对象，如数组。
+ `Promise.all()`返回一个新的Promise，它在`iterable`中的所有Promise都变为`fulfilled`时变为`fulfilled`，在任何一个Promise变为`rejected`时立即变为`rejected`。



**（6）**`**Promise.race()**`

```javascript
Promise.race(iterable);
```

+ `Promise.race()`返回一个新的Promise，它在`iterable`中的任何一个Promise变为`fulfilled`或`rejected`时立即变为相同的状态。



**（7）**`**Promise.resolve()**`

```javascript
const promise = Promise.resolve(value);
```

+ `value`可以是任何值，如果`value`是一个Promise，那么`Promise.resolve()`返回这个Promise。
+ 如果`value`不是一个Promise，`Promise.resolve()`返回一个新的`fulfilled`状态的Promise。



**（8）**`**Promise.reject()**`

```javascript
const promise = Promise.reject(reason);
```

+ `reason`是拒绝的原因。
+ `Promise.reject()`返回一个新的`rejected`状态的Promise。

