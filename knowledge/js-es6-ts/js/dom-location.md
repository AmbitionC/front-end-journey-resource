`location` 对象是浏览器中 `window` 对象的一个属性，用于获取或设置窗口的 URL 信息。它包含了当前窗口加载的文档的 URL 相关信息，比如协议、主机、路径、查询参数和哈希等。

下面是 `location` 对象的一些常见属性：

1. `**href**`**：** 返回或设置完整的 URL，包括协议、主机、路径、查询参数和哈希。
2. `**protocol**`**：** 返回或设置 URL 的协议部分（如 "http:" 或 "https:"）。
3. `**host**`**：** 返回或设置 URL 的主机部分（如 "example.com:8080"）。
4. `**hostname**`**：** 返回或设置 URL 的主机名部分（如 "example.com"）。
5. `**port**`**：** 返回或设置 URL 的端口部分（如 "8080"）。
6. `**pathname**`**：** 返回或设置 URL 的路径部分（如 "/path/to/file"）。
7. `**search**`**：** 返回或设置 URL 的查询参数部分（如 "?key=value"）。
8. `**hash**`**：** 返回或设置 URL 的哈希部分（如 "#section"）。

除了以上属性外，`location` 对象还有一些方法，比如 `reload()` 用于重新加载当前文档、`assign()` 用于加载新的 URL、`replace()` 用于替换当前的 URL 等。

例如，以下代码演示了如何使用 `location` 对象获取当前页面的 URL 并输出到控制台：

```javascript
console.log(window.location.href); // 输出当前页面的完整 URL
```

`location` 对象是操作浏览器地址栏的主要途径之一，它使得 JavaScript 能够动态地改变页面的 URL，实现页面跳转、重新加载和替换等操作。

