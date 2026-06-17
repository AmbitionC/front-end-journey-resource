`Proxy`是JavaScript中的一个内置对象，它允许你为另一个对象创建一个代理对象，从而可以拦截和自定义对该对象的各种操作。`Proxy`对象可以拦截如属性查找、赋值、枚举、函数调用等操作，这使得`Proxy`成为一个强大的工具，用于创建自定义的行为或修改现有对象的行为。

#### 基本语法
```javascript
const proxy = new Proxy(target, handler);
```

+ `target`：这是要创建代理的目标对象。
+ `handler`：这是一个对象，定义了代理对象的行为。它包含了一系列的“捕获器”（trap），用于自定义代理对象的操作。



#### 特点
+ **拦截操作**：`Proxy`可以拦截对目标对象的所有操作，包括属性访问、方法调用、属性定义和删除等。
+ **灵活的自定义**：通过在`handler`对象中定义不同的“捕获器”，你可以自定义各种操作的行为。
+ **不影响目标对象**：`Proxy`不会改变目标对象本身，所有的修改都是通过代理对象进行的。



#### 使用场景
+ **日志记录**：创建一个代理对象来记录对目标对象的访问和修改操作。
+ **数据验证**：在赋值操作中验证数据，确保数据符合预期的格式或范围。
+ **访问控制**：控制对目标对象的访问，例如，只读或只写。
+ **延迟加载**：延迟初始化对象，直到它被实际使用时。
+ **对象大小写转换**：自动将所有属性名转换为大写或小写。



#### 示例
以下是一个简单的`Proxy`示例，它创建了一个代理对象，用于记录对目标对象属性的访问：

```javascript
const target = {
  name: 'John',
  age: 30
};

const handler = {
  get: function(obj, prop) {
    console.log(`Accessing ${prop}`);
    return obj[prop];
  }
};

const proxy = new Proxy(target, handler);

console.log(proxy.name); // 输出: Accessing name, 然后输出 John
console.log(proxy.age);  // 输出: Accessing age, 然后输出 30
```



#### 注意事项
+ `Proxy`是一个高级功能，可能会导致一些难以调试的问题，特别是在拦截函数调用时。
+ `Proxy`不会拦截非代理对象上的操作，例如，如果你有一个代理对象`proxy`，直接对`target`对象的操作不会被拦截。
+ `Proxy`在某些情况下可能不适用，例如，`JSON.stringify`和`Object.assign`不会通过代理对象。

