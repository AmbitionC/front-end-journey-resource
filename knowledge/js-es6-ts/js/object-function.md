JavaScript中的`Object`是一个全局对象，它提供了许多方法来创建、复制、检查和操作对象。以下是一些常见的`Object`方法：

#### 创建和复制对象
**（1）**`Object.create(proto, [propertiesObject])`:  
	创建一个新对象，使用`proto`作为其原型，并可添加属性描述符。 

```javascript
const obj = Object.create(null, {
  prop1: { value: 'value1' },
  prop2: { value: 'value2' }
});
```

 

**（2）**`Object.assign(target, ...sources)`:  
	将所有可枚举属性的值从一个或多个源对象复制到目标对象，并返回目标对象。 

```javascript
const target = { a: 1 };
const source1 = { b: 2 };
const source2 = { c: 3 };
Object.assign(target, source1, source2);
// target现在是 { a: 1, b: 2, c: 3 }
```

 

**（3）**`Object.entries(object)`:  
	返回一个给定对象自身可枚举属性的键值对数组。 

```javascript
const obj = { a: 1, b: 2, c: 3 };
const entries = Object.entries(obj);
// entries是 [['a', 1], ['b', 2], ['c', 3]]
```

 

**（4）**`Object.keys(object)`:  
	返回一个由给定对象自身可枚举属性组成的数组，属性按在对象上枚举到的顺序排列。 

```javascript
const obj = { a: 1, b: 2, c: 3 };
const keys = Object.keys(obj);
// keys是 ['a', 'b', 'c']
```

 

**（5）**`Object.values(object)`:  
	返回一个给定对象自身可枚举属性值的数组，值按在对象上枚举到的顺序排列。 

```javascript
const obj = { a: 1, b: 2, c: 3 };
const values = Object.values(obj);
// values是 [1, 2, 3]
```

 

#### 检查对象
**（1）**`Object.prototype.hasOwnProperty.call(object, property)`:  
	检查对象自身属性中是否具有指定的属性，与`in`操作符不同，它不会检查原型链。 

```javascript
const obj = { a: 1 };
const hasA = Object.prototype.hasOwnProperty.call(obj, 'a'); // hasA是true
```

 

**（2）**`Object.is(value1, value2)`:  
	比较两个值是否是相同值，与`===`操作符不同，它能正确处理`NaN`和`0`/`-0`的情况。 

```javascript
const isEqual = Object.is(NaN, NaN); // isEqual是true
```

 

**（3）**`Object.isExtensible(object)`:  
	如果对象是可扩展的（即不能防止新属性被添加到它），则返回`true`，否则返回`false`。 

```javascript
const obj = {};
const isExtensible = Object.isExtensible(obj); // isExtensible是true
```

 

**（4）**`Object.getOwnPropertyDescriptor(object, property)`:  
	返回指定对象的属性的属性描述符。 

```javascript
const obj = { a: 1 };
const descriptor = Object.getOwnPropertyDescriptor(obj, 'a');
// descriptor是 { value: 1, writable: true, enumerable: true, configurable: true }
```

 

#### 对象操作
**（1）**`Object.freeze(object)`:  
	冻结一个对象，使其不再能够添加新属性，现有属性不能被删除，现有属性的可枚举性、可配置性、可写性以及值不能被改变。 

```javascript
const obj = { a: 1 };
Object.freeze(obj);
obj.a = 2; // 无效，obj仍然是 { a: 1 }
```

 

**（2）**`Object.seal(object)`:  
	密封一个对象，使其属性不可删除，不可配置，并且值不能被修改（除非属性是可写的）。 

```javascript
const obj = { a: 1 };
Object.seal(obj);
obj.a = 2; // 有效，obj现在是 { a: 2 }
```

 

**（3）**`Object.assign()` (重复):  
	除了创建和复制对象，`Object.assign()`也可以用来更新对象的属性。 

```javascript
const obj = { a: 1 };
Object.assign(obj, { a: 2, b: 3 });
// obj现在是 { a: 2, b: 3 }
```



