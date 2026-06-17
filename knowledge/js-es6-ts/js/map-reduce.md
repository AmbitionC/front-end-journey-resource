`map`和`reduce`是JavaScript中数组对象的两个非常强大的高阶函数，它们允许你以声明式的方式处理数组数据集合。

#### `map`方法
`map`方法创建一个新数组，其结果是该数组中的每个元素都调用一个提供的函数后的返回值。这个方法不会改变原始数组，而是返回一个新数组。

```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(number => number * 2);
// doubled是 [2, 4, 6, 8, 10]
```

在上面的例子中，`map`方法遍历`numbers`数组中的每个元素，将每个元素乘以2，并将结果放入一个新数组`doubled`中。



#### `reduce`方法
`reduce`方法将数组中的所有元素组合成一个单一的值。它接受一个回调函数（reducer）和一个初始值（accumulator），回调函数会被依次调用，每个调用的结果会作为下一次调用的累加器（accumulator）的值。

```javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
// sum是 15
```

在这个例子中，`reduce`方法将`numbers`数组中的所有元素相加。累加器的初始值设置为0。对于数组中的每个元素，回调函数将其与累加器的当前值相加，并返回新的累加器值。最终，`reduce`方法返回所有元素的总和。



#### `reduce`方法的变体
JavaScript还提供了`reduceRight`方法，它与`reduce`类似，但是从数组的末尾开始迭代。

```javascript
const numbers = [1, 2, 3, 4, 5];
const product = numbers.reduceRight((accumulator, currentValue) => accumulator * currentValue, 1);
// product是 120
```

在这个例子中，`reduceRight`方法从数组的最后一个元素开始，将所有元素相乘得到一个乘积。



#### 使用场景
+ `**map**`：当你需要对数组的每个元素应用一个函数，并将结果收集到一个新数组中时，使用`map`。
+ `**reduce**`：当你需要根据数组中的所有元素计算一个单一的值时，使用`reduce`。例如，计算总和、平均值、最大值或最小值。

