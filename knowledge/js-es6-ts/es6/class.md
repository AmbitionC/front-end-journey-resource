在JavaScript中，`class`关键字是ES6引入的一种新的语法糖，它提供了一种更接近传统面向对象编程语言（如Java和C#）的方式来定义和使用对象。`class`关键字使得创建对象和实现继承变得更加简洁和直观。

#### `class`基本语法
一个基本的`class`定义包括构造函数、方法和属性。

```javascript
class MyClass {
  // 构造函数
  constructor(param1, param2) {
    this.property1 = param1;
    this.property2 = param2;
  }

  // 实例方法
  instanceMethod() {
    console.log(this.property1 + ' ' + this.property2);
  }

  // 静态方法
  static staticMethod() {
    console.log('This is a static method.');
  }

  //  getter
  get property() {
    return this.property1 + ' ' + this.property2;
  }

  // setter
  set property(value) {
    let [prop1, prop2] = value.split(' ');
    this.property1 = prop1;
    this.property2 = prop2;
  }
}

// 创建实例
let myInstance = new MyClass('Hello', 'World');
myInstance.instanceMethod(); // 输出: Hello World
console.log(myInstance.property); // 输出: Hello World
myInstance.property = 'Good Bye Cruel World'; // 设置属性
console.log(myInstance.property); // 输出: Good Bye Cruel
MyClass.staticMethod(); // 输出: This is a static method.
```



#### 继承
在JavaScript中，`class`可以通过`extends`关键字实现继承。子类可以访问父类的构造函数、方法和属性，并且可以添加或覆盖它们。

```javascript
class ParentClass {
  constructor(message) {
    this.message = message;
  }

  displayMessage() {
    console.log(this.message);
  }
}

class ChildClass extends ParentClass {
  constructor(message, extraMessage) {
    super(message); // 调用父类的构造函数
    this.extraMessage = extraMessage;
  }

  displayExtraMessage() {
    console.log(this.extraMessage);
  }

  // 覆盖父类方法
  displayMessage() {
    console.log(super.message + ' ' + this.extraMessage);
  }
}

let childInstance = new ChildClass('Hello', 'World');
childInstance.displayMessage(); // 输出: Hello World
childInstance.displayExtraMessage(); // 输出: World
```



#### 访问父类方法和属性
在子类中，可以通过`super`关键字访问父类的构造函数、静态方法和属性。



#### 注意事项
+ `class`关键字只是`prototype`链的语法糖，JavaScript中依然是基于原型的继承。
+ 在`class`中使用`new.target`可以检测构造函数是被直接调用还是通过`new`关键字调用。
+ 静态属性和方法绑定到`class`本身，而不是实例。
+ 私有属性和方法（使用`#`前缀）目前是提案阶段的特性，尚未成为正式标准。

