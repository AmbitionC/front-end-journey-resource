使用 `new` 关键字创建一个类的实例时，其原理主要包括以下几个步骤：

1. 创建一个空的对象。
2. 将这个空对象的原型链指向构造函数的 `prototype` 属性。
3. 将构造函数的 `this` 指向这个空对象。
4. 执行构造函数内部的代码，并将属性和方法添加到这个空对象中。
5. 如果构造函数返回了一个对象，则返回该对象；否则，返回这个新创建的对象。



下面是一个简单的示例，演示了如何使用 `new` 关键字创建一个类的实例：

```javascript
// 定义一个类
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

// 使用 new 关键字创建一个类的实例
const person1 = new Person('Alice', 25);

console.log(person1); // 输出：Person { name: 'Alice', age: 25 }
```

在这个示例中，`new Person('Alice', 25)` 执行时，会按照上述步骤创建一个新的对象，并将其属性和方法初始化为构造函数 `Person` 中指定的值。最终返回的是这个新创建的对象 `person1`。

