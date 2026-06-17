JavaScript中的`String`对象提供了许多有用的方法来处理字符串。以下是一些常见的字符串方法，它们可以帮助你执行各种操作，如搜索、替换、分割和转换字符串等。

#### 搜索和位置
**（1）**`indexOf()`: 返回在字符串中可以找到给定子字符串的第一个位置的索引，如果不存在，则返回-1。 

```javascript
let str = "Hello, World!";
let index = str.indexOf("World"); // index为7
```

 

**（2）**`lastIndexOf()`: 返回在字符串中可以找到给定子字符串的最后一个位置的索引，如果不存在，则返回-1。 

```javascript
let str = "Hello, World!";
let index = str.lastIndexOf("l"); // index为10
```

 

**（3）**`search()`: 返回字符串中匹配给定正则表达式的子字符串的位置。 

```javascript
let str = "Hello, World!";
let position = str.search(/World/); // position为7
```

 

**（4）**`match()`: 根据参数中的正则表达式，返回匹配的子数组。 

```javascript
let str = "Hello, World!";
let matches = str.match(/(\w+), (\w+)!/); // matches为["Hello, World!", "Hello", "World"]
```

 

#### 替换和格式化
**（1）**`replace()`: 用一些字符替换字符串中匹配正则表达式的部分。 

```javascript
let str = "Hello, World!";
let newStr = str.replace("World", "JavaScript"); // newStr为"Hello, JavaScript!"
```

 

**（2）**`replaceAll()`: 用一些字符替换字符串中所有匹配正则表达式的部分。 

```javascript
let str = "Hello, World!";
let newStr = str.replaceAll("l", "ll"); // newStr为"Heelllo, Woorld!"
```

 

**（3）**`slice()`: 返回一个新字符串，包含从开始到结束（不包括结束）选择的字符串的一部分。 

```javascript
let str = "Hello, World!";
let substring = str.slice(7, 12); // substring为"World"
```

 

**（4）**`substring()`: 返回一个新字符串，包含两个指定位置之间的字符。 

```javascript
let str = "Hello, World!";
let substring = str.substring(7, 12); // substring为"World"
```

 

**（5）**`padStart()`: 用另一个字符串填充当前字符串的开始部分，直到达到指定的长度。 

```javascript
let str = "123";
let paddedStr = str.padStart(5, "0"); // paddedStr为"00123"
```

 

**（6）**`padEnd()`: 用另一个字符串填充当前字符串的结束部分，直到达到指定的长度。 

```javascript
let str = "123";
let paddedStr = str.padEnd(5, "0"); // paddedStr为"12300"
```

 

#### 分割和转换
**（1）**`split()`: 根据给定的分隔符将字符串分割成子字符串数组。 

```javascript
let str = "Hello, World!";
let parts = str.split(","); // parts为["Hello", " World!"]
```

 

**（2）**`toLowerCase()`: 将字符串转换为小写。 

```javascript
let str = "Hello, World!";
let lowerCaseStr = str.toLowerCase(); // lowerCaseStr为"hello, world!"
```

 

**（3）**`toUpperCase()`: 将字符串转换为大写。 

```javascript
let str = "Hello, World!";
let upperCaseStr = str.toUpperCase(); // upperCaseStr为"HELLO, WORLD!"
```

 

**（4）**`trim()`: 移除字符串两端的空白字符。 

```javascript
let str = "   Hello, World!   ";
let trimmedStr = str.trim(); // trimmedStr为"Hello, World!"
```

 

**（5）**`charAt()`: 返回字符串中指定位置的字符。 

```javascript
let str = "Hello, World!";
let char = str.charAt(7); // char为"W"
```

 

**（6）**`concat()`: 连接两个或多个字符串，并返回结果。 

```javascript
let str1 = "Hello, ";
let str2 = "World!";
let combinedStr = str1.concat(str2); // combinedStr为"Hello, World!"
```



