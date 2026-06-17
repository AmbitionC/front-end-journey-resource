下表总结了 `addEventListener` 和 `onClick` 的区别：

| 特性 | addEventListener | onClick |
| :---: | --- | --- |
| 用法 | 通过函数调用添加事件监听器 | 直接在 HTML 元素属性中添加事件处理程序 |
| 绑定多个事件处理程序 | 可以绑定多个事件处理程序 | 只能绑定一个事件处理程序 |
| 事件处理程序覆盖 | 不会覆盖已绑定的同类型事件处理程序 | 每次赋值都会覆盖前一个事件处理程序 |
| 对象上的使用 | 可以在任何 DOM 对象上使用 | 仅适用于 HTML 元素 |
| 事件类型 | 可以监听任何类型的事件，如 click、mouseover 等 | 仅适用于 click 事件 |
| 代码清晰度 | 可以将 HTML 结构和 JavaScript 代码分离 | HTML 结构和 JavaScript 代码耦合度较高 |
| 兼容性 | 兼容性较好 | 兼容性较差 |


`addEventListener` 通常是更加灵活和推荐的事件处理方式，因为它允许绑定多个事件处理程序、不会覆盖已有的事件处理程序、适用于任何 DOM 对象，并且能够实现 HTML 结构和 JavaScript 代码的分离。相比之下，`onClick` 更适合简单的场景，但由于其代码和 HTML 结构的耦合度较高，因此在维护和扩展方面可能不如 `addEventListener` 方式灵活。

