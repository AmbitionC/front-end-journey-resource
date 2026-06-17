柯里化是一种函数式编程的技术，它将接受多个参数的函数转换为接受单个参数的一系列函数。这样做的好处之一是能够部分应用函数，从而创建新的函数。

以下是一个通用的柯里化函数封装示例：

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function(...moreArgs) {
        return curried.apply(this, args.concat(moreArgs));
      };
    }
  };
}
```

使用这个 `curry` 函数，可以将任何函数转换为柯里化的版本。例如：

```javascript
function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3)); // 输出: 6
console.log(curriedAdd(1, 2)(3)); // 输出: 6
console.log(curriedAdd(1)(2, 3)); // 输出: 6
console.log(curriedAdd(1, 2, 3)); // 输出: 6
```

上面的 `curry` 函数能够接受任意数量的参数，并在满足函数的参数个数之后，返回函数的执行结果。这种通用封装的柯里化函数可以应用于任何具有固定参数数量的函数。

