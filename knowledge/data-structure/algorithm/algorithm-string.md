#### 1. 字符串反转
**问题**：反转一个字符串。  
**解法**：使用`split`、`reverse`和`join`方法。

```javascript
const reverseString = (str) => str.split('').reverse().join('');
console.log(reverseString("hello")); // "olleh"
```



#### 2. 驼峰命名转换
**问题**：将字符串转换为驼峰命名（小驼峰或大驼峰）。  
**解法**：使用正则表达式和`replace`方法。

```javascript
const toCamelCase = (str) =>
  str.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', ''));

console.log(toCamelCase("hello_world")); // "helloWorld"
console.log(toCamelCase("HELLO_WORLD")); // "helloWorld"
```



#### 3. 检查回文字符串
**问题**：判断一个字符串是否是回文。  
**解法**：使用`slice`和`reverse`方法。

```javascript
const isPalindrome = (str) => {
  const cleanStr = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return cleanStr === cleanStr.slice().reverse().join('');
};

console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
```



#### 4. 字符串中字符的出现次数
**问题**：计算字符串中每个字符的出现次数。  
**解法**：使用`split`、`map`和`reduce`方法。

```javascript
const charCount = (str) =>
  str
    .split('')
    .map((char) => ({ [char]: str.split(char).length - 1 }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});

console.log(charCount("hello")); // { h: 1, e: 1, l: 2, o: 1 }
```



#### 5. 替换字符串中的所有匹配项
**问题**：替换字符串中所有匹配的子串。  
**解法**：使用正则表达式的`replace`方法。

```javascript
const replaceAll = (str, find, replace) =>
  str.replace(new RegExp(find, 'g'), replace);

console.log(replaceAll("hello world", "l", "X")); // "heXo worXd"
```



#### 5. 截取字符串
**问题**：实现一个函数，根据给定的开始索引和结束索引截取字符串。  
**解法**：使用`slice`方法。

```javascript
const substring = (str, start, end) => str.slice(start, end);
console.log(substring("Hello, World!", 7, 12)); // "World"
```



#### 6. 格式化字符串
**问题**：实现一个函数，用于格式化字符串，插入变量。  
**解法**：使用模板字符串和解构赋值。

```javascript
const formatString = (str, ...args) =>
  str.replace(/{(\d)}/g, (_, index) => args[index]);

console.log(formatString("Hello, {0}! Welcome to {1}.", "Alice", "Wonderland")); // "Hello, Alice! Welcome to Wonderland."
```



#### 7. 判断字符串是否包含另一个字符串
**问题**：判断一个字符串是否包含另一个字符串。  
**解法**：使用`includes`方法。

```javascript
const contains = (str, search) => str.includes(search);
console.log(contains("Hello, World!", "World")); // true
```



#### 8. 统计字符串中元音字母的数量
**问题**：统计字符串中元音字母的数量。  
**解法**：使用正则表达式和`match`方法。

```javascript
const countVowels = (str) => (str.match(/[aeiou]/gi) || []).length;
console.log(countVowels("Hello, World!")); // 3
```



#### 9. 转换字符串为数组
**问题**：将字符串转换为字符数组。  
**解法**：使用`split`方法。

```javascript
const toArray = (str) => str.split('');
console.log(toArray("hello")); // ["h", "e", "l", "l", "o"]
```

