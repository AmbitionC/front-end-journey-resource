在JavaScript中，原型（Prototype）和原型链（Prototype Chain）是对象继承和属性查找的基础概念。它们是JavaScript实现继承的核心机制。

![](https://cdn.nlark.com/yuque/0/2024/png/577681/1717767315627-b1604ebc-f2f5-4ddb-8f75-3c8916d4e9a3.png)

<center><font style="color:#8A8F8D;">原型和原型链示意图</font></center>

#### 原型（Prototype）
在JavaScript中，几乎每个对象都有一个内部属性`[[Prototype]]`，它指向创建该对象时使用的构造函数的`prototype`属性。这个`prototype`属性是一个对象，包含了可以被对象继承的属性和方法。

当你尝试访问一个对象的属性或方法时，JavaScript引擎首先查找对象本身的属性。如果没有找到，它会沿着原型链向上查找，直到找到该属性或方法，或者到达原型链的末端（通常是`Object.prototype`）。



#### 原型链（Prototype Chain）
原型链是对象继承的实现机制。当你尝试访问一个对象的属性时，JavaScript引擎会沿着原型链向上查找，直到找到该属性或到达`Object.prototype`。这个查找过程形成了一个链式结构，即原型链。

例如：

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.sayName = function() {
  console.log(this.name);
};

const person = new Person("Alice");
person.sayName(); // 输出: Alice
```

在这个例子中，`person`对象有一个属性`name`，以及一个方法`sayName`。`person`的原型是`Person.prototype`，它本身是一个对象。当`person.sayName()`被调用时，JavaScript引擎首先在`person`对象上查找`sayName`方法，找不到后沿着原型链向上查找，最终在`Person.prototype`上找到并执行。



#### 原型链的特点
+ **继承**：对象可以通过原型链继承属性和方法。
+ **查找**：属性和方法的查找是沿着原型链进行的。
+ **末端**：原型链的末端通常是`Object.prototype`，所有对象的原型链都会终止在这里。
+ **性能**：频繁的原型链查找可能会影响性能，因此建议使用更现代的继承方式，如`class`和`extends`关键字。



#### 注意事项
+ 原型链允许对象继承其他对象的属性和方法，但不支持真正的类继承。
+ 通过`Object.create(proto)`可以创建一个新对象，其原型是传入的`proto`对象。
+ 通过`Object.getPrototypeOf(obj)`可以获取一个对象的原型。
+ 通过`Object.setPrototypeOf(obj, newProto)`可以改变一个对象的原型。

