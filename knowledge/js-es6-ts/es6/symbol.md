`Symbol`是JavaScript中的一个内置类型，它是ES6（ECMAScript 2015）引入的一个新的原始数据类型。`Symbol`是一种强大的原始数据类型，它提供了创建唯一标识符的能力。通过使用`Symbol`，你可以在对象中存储额外的数据，而不会与其他属性名冲突。`Symbol`在创建唯一键、模块封装和避免全局属性名冲突等方面有着广泛的应用。

#### 基本语法
创建`Symbol`的语法非常简单，你可以使用`Symbol()`构造函数来创建一个新的`Symbol`值。

```javascript
const sym1 = Symbol();
const sym2 = Symbol('description');
```

`Symbol()`函数可以接受一个可选的字符串参数，这个参数仅用于调试目的，为`Symbol`提供描述，但它不会影响`Symbol`的唯一性。



#### 特点
+ **唯一性**：每个`Symbol`值都是唯一的，即使使用相同的描述创建两个`Symbol`，它们也是不相等的。
+ **不可枚举**：`Symbol`属性默认不可枚举，这意味着它们不会出现在`for...in`循环或`Object.keys`方法中。
+ **内置方法**：`Symbol`有许多内置方法，如`Symbol.for`和`Symbol.keyFor`，用于创建和检索全局`Symbol`。



#### 使用场景
+ **创建唯一键**：由于`Symbol`的唯一性，它可以用作对象的唯一键，这在创建缓存或存储唯一标识符时非常有用。
+ **模块封装**：使用`Symbol`作为私有属性或方法的键，可以在一定程度上封装模块的内部实现。
+ **避免属性名冲突**：使用`Symbol`作为属性名可以避免全局属性名冲突。



#### 示例
以下是一个`Symbol`的示例，展示了如何使用`Symbol`作为对象的唯一键。

```javascript
const myObject = {
  [Symbol('uniqueKey')]: 'uniqueValue'
};

console.log(myObject[Symbol('uniqueKey')]); // 输出: uniqueValue
console.log(myObject); // 输出: {}
```

在上面的例子中，即使`myObject`被打印出来，`Symbol`属性也不会显示，因为它不可枚举。



#### 注意事项
+ `Symbol`的描述是可选的，它不会影响`Symbol`的唯一性。
+ `Symbol`不能被转换为字符串或数字类型，尝试这样做会导致`TypeError`。
+ `Symbol`作为对象的键时，需要使用`[]`语法来访问，因为点语法（`.`）不会识别`Symbol`类型的属性名。

