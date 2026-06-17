在TypeScript中，装饰器（Decorator）是一种特殊类型的声明，它能够被附加到类声明、方法、访问符、属性或参数上。装饰器使用`@`符号加上任意的表达式，该表达式在运行时会被调用。装饰器允许开发者在不修改类文件的情况下，通过一种声明的方式来给类添加额外的功能。

#### TypeScript中的装饰器类型
TypeScript支持以下几种类型的装饰器：

+ **类装饰器（Class Decorators）**：附加到类声明上。 

```typescript
@sealed
class MyClass {}
```

+ **方法装饰器（Method Decorators）**：附加到方法上。 

```typescript
class MyClass {
  @log
  myMethod() {}
}
```

+ **访问符装饰器（Accessor Decorators）**：附加到访问器（getter/setter）上。 

```typescript
class MyClass {
  @log
  get myProperty() {
    return 123;
  }
}
```

+ **属性装饰器（Property Decorators）**：附加到属性上。 

```typescript
class MyClass {
  @log
  myProperty;
}
```

+ **参数装饰器（Parameter Decorators）**：附加到函数或构造函数的参数上。 

```typescript
class MyClass {
  constructor(@myDecorator param) {}
}
```

 

#### 装饰器的执行顺序
装饰器的执行顺序如下：

+ 参数装饰器
+ 方法装饰器
+ 访问符装饰器
+ 属性装饰器
+ 类装饰器



#### 装饰器的工厂函数
装饰器可以是一个函数，也可以是调用一个函数的结果。装饰器工厂函数允许你创建装饰器，它接收构造函数作为参数，并返回实际的装饰器函数。

```typescript
function myDecorator<T extends Function>(constructor: T) {
  console.log('装饰器执行了！');
  return class extends constructor {
    // 可以在这里添加额外的逻辑
  };
}

@myDecorator
class MyClass {}
```



#### 装饰器的应用
装饰器可以用于多种场景，包括：

+ **日志记录**：为类或方法添加日志记录功能。
+ **性能监控**：测量类或方法的执行时间。
+ **缓存**：为方法的结果添加缓存。
+ **依赖注入**：用于构造函数参数的自动依赖注入。
+ **访问控制**：控制对类成员的访问权限。



#### 注意事项
+ 装饰器是实验性特性，需要在`tsconfig.json`中启用`experimentalDecorators`选项。
+ 装饰器不能应用于JavaScript文件，因为它们是TypeScript的语法扩展。
+ 装饰器不能应用于字面量属性。



