CommonJS规范是一种用于服务器端JavaScript的模块系统，它定义了模块的创建、加载和导出行为。这个规范在Node.js中得到了广泛的应用，成为了Node.js模块化编程的基础。以下是CommonJS规范的核心概念和Node.js中的核心模块。

#### CommonJS规范
**（1）模块定义**：  
	CommonJS使用`module.exports`对象来定义模块的导出。你可以通过`module.exports`来指定模块的公共接口，任何对`module.exports`的修改都会反映在引用该模块的代码中。 

```javascript
// myModule.js
module.exports = {
  myFunction: function() {
    // ...
  }
};
```

**（2）模块加载**：  
	使用`require`函数来加载其他模块。`require`函数接受一个字符串参数，该字符串是模块的标识符（通常是模块文件的路径）。 

```javascript
// app.js
const myModule = require('./myModule');
myModule.myFunction();
```

**（3）同步加载**：  
	CommonJS模块是同步加载的，这意味着在模块被`require`之前，它必须完全加载并执行。这在服务器端环境中通常是可行的，但在浏览器环境中可能会导致性能问题。 

**（4）缓存**：  
	CommonJS模块在第一次加载后会被缓存，之后的`require`调用将直接返回缓存的模块，而不是重新加载。 



#### 核心模块
Node.js内置了一系列的核心模块，这些模块不需要额外安装就可以直接使用。以下是一些常用的核心模块：

**（1）**`**fs**`**（文件系统）**：  
	提供文件系统操作的API，包括读取、写入文件，以及文件和目录的管理。 

```javascript
const fs = require('fs');
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

**（2）**`**http**`：  
	提供创建HTTP服务器的API，用于处理HTTP请求和响应。 

```javascript
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello, World!');
});
server.listen(3000);
```

**（3）**`**path**`：  
	提供路径操作的实用工具，可以处理文件路径的分割、解析和连接。 

```javascript
const path = require('path');
const fullPath = path.join('/user/', 'dir', 'file.txt');
```

**（4）**`**util**`：  
	提供一些实用工具，如类型检查、对象复制、日期格式化等。 

```javascript
const util = require('util');
const obj = { a: 1, b: 2 };
console.log(util.inspect(obj));
```

**（5）**`**crypto**`：  
	提供加密和解密功能，包括散列算法、HMAC、加密和解密等。 

```javascript
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
hash.update('some data');
const result = hash.digest('hex');
```

**（6）**`**os**`：  
	提供操作系统相关的信息和功能，如获取内存使用情况、CPU信息等。 

```javascript
const os = require('os');
console.log(`Platform: ${os.platform()}`);
console.log(`Free memory: ${os.freemem()}`);
```



