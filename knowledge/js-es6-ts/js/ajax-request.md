| 顺序 | 步骤 | 描述 |
| :---: | --- | --- |
| 1 | 创建 XMLHttpRequest 对象 | 使用 `new XMLHttpRequest()`创建 XMLHttpRequest 对象。 |
| 2 | 设置请求参数 | 使用 `open()`方法设置请求方法（GET、POST 等）、请求 URL 和是否异步标志位（true 或 false）。 |
| 3 | 设置请求头 | 使用 `setRequestHeader()`方法设置请求头，如 Content-Type、Authorization 等。 |
| 4 | 监听状态变化 | 使用 `onreadystatechange`事件监听请求状态的变化。 |
| 5 | 发送请求 | 使用 `send()`方法发送请求，如果是 POST 请求，可以将数据作为参数传入。 |
| 6 | 处理响应 | 在 `onreadystatechange`事件处理函数中，检查 `readyState`和 `status`属性来判断请求状态和响应状态。然后使用 `responseText` 或 `responseXML`属性获取响应数据。 |
| 7 | 处理响应数据 | 根据响应的数据格式（如 JSON、XML、文本等），解析和处理响应数据。 |


