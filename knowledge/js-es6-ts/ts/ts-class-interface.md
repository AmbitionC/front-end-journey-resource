在TypeScript中实现封装，主要是通过类（classes）和接口（interfaces）来完成。封装是面向对象编程（OOP）中的一个核心概念，它涉及隐藏对象的内部状态和实现细节，仅暴露出一个可以被外界访问和操作的接口。

#### 使用类（Classes）实现封装
+ **私有成员**：使用`private`关键字来声明私有成员，这些成员只能在类的内部访问。 

```typescript
class User {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public getName(): string {
    return this.name;
  }
}
```

+ **公共成员**：使用`public`关键字声明公共成员，这些成员可以被类的外部访问。 

```typescript
class Counter {
  public count: number = 0;

  increment() {
    this.count++;
  }
}
```

+ **受保护的成员**：使用`protected`关键字声明受保护的成员，这些成员可以在类的内部和子类中访问。 

```typescript
class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }
}

class Dog extends Animal {
  bark() {
    console.log(`${this.name} says woof!`);
  }
}
```

+ **只读成员**：使用`readonly`关键字声明只读成员，这些成员一旦被初始化后就不能被重新赋值。 

```typescript
class Product {
  readonly id: number;

  constructor(id: number) {
    this.id = id;
  }
}
```

+ **访问器**：使用getter和setter来控制对类成员的访问和赋值。 

```typescript
class Account {
  private _balance: number = 0;

  public get balance(): number {
    return this._balance;
  }

  public deposit(amount: number): void {
    this._balance += amount;
  }

  public withdraw(amount: number): void {
    if (amount <= this._balance) {
      this._balance -= amount;
    } else {
      console.log("Insufficient funds");
    }
  }
}
```

 

#### 使用接口（Interfaces）实现封装
接口主要用于定义对象的结构，而不涉及具体的实现细节。

+ **定义接口**：使用`interface`关键字定义接口，它规定了实现该接口的对象必须有哪些成员。 

```typescript
interface Vehicle {
  start(): void;
  stop(): void;
}
```

+ **实现接口**：类通过`implements`关键字实现接口，确保类遵循接口的结构。 

```typescript
class Car implements Vehicle {
  start() {
    console.log("Car is starting");
  }

  stop() {
    console.log("Car is stopping");
  }
}
```

 

