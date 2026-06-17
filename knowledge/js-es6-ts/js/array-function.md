JavaScript中的`Array`对象提供了许多有用的方法来处理数组数据。以下是一些常见的数组方法，它们可以帮助你执行各种操作，如添加/删除元素、排序、搜索和转换数组等。

#### 添加和删除元素
**（1）**`push()`: 向数组的末尾添加一个或多个元素，并返回新的长度。 

```javascript
let arr = [1, 2, 3];
arr.push(4); // arr变为[1, 2, 3, 4]
```

 

**（2）**`pop()`: 删除数组的最后一个元素，并返回被删除的元素。 

```javascript
let arr = [1, 2, 3, 4];
let lastElement = arr.pop(); // lastElement为4，arr变为[1, 2, 3]
```

 

**（3）**`shift()`: 删除数组的第一个元素，并返回被删除的元素。 

```javascript
let arr = [1, 2, 3, 4];
let firstElement = arr.shift(); // firstElement为1，arr变为[2, 3, 4]
```

 

**（4）**`unshift()`: 向数组的开头添加一个或多个元素，并返回新的长度。 

```javascript
let arr = [1, 2, 3];
arr.unshift(0); // arr变为[0, 1, 2, 3]
```

 

**（5）**`splice()`: 通过删除、替换或添加新元素来修改数组。 

```javascript
let arr = [1, 2, 3, 4];
arr.splice(1, 1, 'a', 'b'); // arr变为[1, 'a', 'b', 3, 4]
```

 

**（6）**`fill()`: 用一个静态值填充数组的所有元素。 

```javascript
let arr = [1, 2, 3, 4];
arr.fill(0); // arr变为[0, 0, 0, 0]
```



#### 排序和搜索
**（1）**`sort()`: 对数组元素进行排序，并返回数组。默认按字符串的Unicode码点进行排序。 

```javascript
let arr = [4, 2, 1, 3];
arr.sort(); // arr变为[1, 2, 3, 4]
```

 

**（2）**`reverse()`: 颠倒数组中元素的顺序，并返回数组。 

```javascript
let arr = [1, 2, 3, 4];
arr.reverse(); // arr变为[4, 3, 2, 1]
```

 

**（3）**`indexOf()`: 返回在数组中可以找到给定元素的第一个索引，如果不存在，则返回-1。 

```javascript
let arr = [1, 2, 3, 4];
let index = arr.indexOf(3); // index为2
```

 

**（4）**`lastIndexOf()`: 返回在数组中可以找到给定元素的最后一个索引，如果不存在，则返回-1。 

```javascript
let arr = [1, 2, 3, 4, 3];
let index = arr.lastIndexOf(3); // index为4
```

 

**（5）**`find()`: 返回数组中满足提供的测试函数的第一个元素的值。否则返回`undefined`。 

```javascript
let arr = [1, 2, 3, 4];
let found = arr.find(item => item > 2); // found为3
```

 

**（6）**`findIndex()`: 返回数组中满足提供的测试函数的第一个元素的索引。否则返回-1。 

```javascript
let arr = [1, 2, 3, 4];
let index = arr.findIndex(item => item > 2); // index为2
```

 

#### 转换数组
**（1）**`concat()`: 合并两个或多个数组，并返回一个新数组。 

```javascript
let arr1 = [1, 2];
let arr2 = [3, 4];
let combined = arr1.concat(arr2); // combined变为[1, 2, 3, 4]
```

 

**（2）**`slice()`: 返回一个新数组，包含从开始到结束（不包括结束）选择的数组的一部分。 

```javascript
let arr = [1, 2, 3, 4];
let sliced = arr.slice(1, 3); // sliced变为[2, 3]
```

 

**（3）**`map()`: 创建一个新数组，其结果是该数组中的每个元素都调用一个提供的函数后的返回值。 

```javascript
let arr = [1, 2, 3];
let doubled = arr.map(item => item * 2); // doubled变为[2, 4, 6]
```

 

**（4）**`filter()`: 创建一个新数组，包含通过所提供函数实现的测试的所有元素。 

```javascript
let arr = [1, 2, 3, 4];
let filtered = arr.filter(item => item > 2); // filtered变为[3, 4]
```

 

**（5）**`reduce()`: 对数组中的每个元素（从左到右）执行一个由您提供的reducer函数（升序执行），将其结果汇总为单个返回值。 

```javascript
let arr = [1, 2, 3, 4];
let sum = arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0); // sum为10
```

 

**（6）**`forEach()`: 对数组的每个元素执行一次提供的函数。 

```javascript
let arr = [1, 2, 3, 4];
arr.forEach(item => console.log(item)); // 依次打印1, 2, 3, 4
```

