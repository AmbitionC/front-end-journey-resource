`async`函数是JavaScript中的一种特殊函数，它用于简化异步编程。`async`关键字用于声明一个函数，它可以包含多个异步操作，而这些异步操作不需要显式地使用回调函数或`Promise`链来处理。`async`函数内部的代码就像同步代码一样书写，这使得异步逻辑更加易于理解和维护。

#### 基本语法
```javascript
async function myAsyncFunction() {
  // 异步操作
}
```



#### 特点
**（1）返回值**：`async`函数总是返回一个`Promise`对象。如果你在函数内部返回一个值，它会自动被包装成一个`Promise`对象（即`resolve`的`Promise`）。

```javascript
async function getData() {
  return 'data';
}

// 这将创建一个Promise对象
const promise = getData();
promise.then(data => {
  console.log(data); // 输出: data
});
```

**（2）异常处理**：如果在`async`函数内部抛出异常，它会自动被拒绝成一个`Promise`对象（即`reject`的`Promise`）。

```javascript
async function getData() {
  throw new Error('出错了');
}

// 这个Promise将会被拒绝
const promise = getData();
promise.catch(error => {
  console.error(error); // 输出: 出错了
});
```

**（3）await关键字**：在`async`函数内部，可以使用`await`关键字来等待一个`Promise`的完成。`await`会暂停函数的执行，直到等待的`Promise`被解决（resolved）或拒绝（rejected）。

```javascript
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  return data;
}
```



#### 使用场景
+ 当你需要处理多个异步操作时，`async`函数可以让代码看起来更像同步代码，提高代码的可读性。
+ 在编写单元测试时，`async`函数可以简化异步测试用例的编写。
+ 在处理网络请求、文件操作等异步API时，`async`和`await`提供了一种更加直观的方式来组织代码。



#### 注意事项
+ `async`函数内部的`return`语句返回的是一个`Promise`对象，即使返回的是一个非`Promise`值。
+ 在`async`函数内部使用`await`时，确保等待的是一个`Promise`对象，否则会导致语法错误。
+ `async`函数不能与`generator`函数的`yield`关键字一起使用。

