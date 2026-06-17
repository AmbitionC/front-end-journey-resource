在TypeScript中，类（Class）是一种面向对象编程的基本构建块，用于定义对象的结构和行为。类可以包含属性（Properties）、方法（Methods）、构造函数（Constructors）以及访问修饰符等。

#### 类的基本结构
```typescript
class Person {
  // 属性
  private name: string;
  protected age: number; // 子类中也可访问

  // 构造函数
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // 方法
  sayHello(): void {
    console.log(`Hello, my name is ${this.name}!`);
  }

  // 访问器（Getter）
  public getName(): string {
    return this.name;
  }

  // 访问器（Setter）
  public setName(name: string): void {
    this.name = name;
  }
}
```



#### 构造函数
构造函数是类的一个特殊方法，用于创建和初始化类的对象。当你使用`new`关键字创建一个类的实例时，构造函数被调用。

+ **默认构造函数**：如果类中没有定义任何构造函数，TypeScript会自动提供一个默认的构造函数。
+ **自定义构造函数**：你可以定义自己的构造函数来初始化类的属性。



#### 构造函数的用法
```typescript
// 创建Person类的实例
let person = new Person('Alice', 30);

// 使用sayHello方法
person.sayHello(); // 输出: Hello, my name is Alice!
```



#### 类的继承
TypeScript支持类之间的继承。一个类可以继承另一个类的属性和方法。

```typescript
class Employee extends Person {
  private department: string;

  constructor(name: string, age: number, department: string) {
    super(name, age); // 调用父类的构造函数
    this.department = department;
  }

  report(): void {
    console.log(`${this.name} works in ${this.department} department.`);
  }
}

// 创建Employee类的实例
let employee = new Employee('Bob', 25, 'HR');
employee.report(); // 输出: Bob works in HR department.
```



#### 静态成员
类还可以包含静态成员（属性和方法），这些成员属于类本身，而不是类的实例。

```typescript
class Utils {
  static pi: number = Math.PI;

  static calculateCircleArea(radius: number): number {
    return Utils.pi * radius * radius;
  }
}

// 使用静态属性和方法
console.log(Utils.calculateCircleArea(10)); // 输出: 314.1592653589793
```



#### 类的抽象化
使用`abstract`关键字可以定义抽象类，它不能被实例化，通常作为其他类的基类。

```typescript
abstract class Animal {
  abstract makeSound(): void;
}

class Dog extends Animal {
  makeSound(): void {
    console.log('Woof!');
  }
}

// Animal类不能被实例化
// let animal = new Animal(); // 错误
```



#### 类和构造函数的高级特性
+ **访问修饰符**：如`public`、`private`、`protected`，用于控制成员的可见性。
+ **类型注解**：为类的属性和方法提供类型信息。
+ **接口实现**：类可以实现一个或多个接口。
+ **泛型**：类和方法都可以使用泛型来支持多种类型的操作。

