下面是以表格形式列出的常见 DOM 操作方式：

| 操作 | 描述 |
| :---: | --- |
| 选择元素 | 通过不同的选择器方法选取 DOM 元素，如 `getElementById('id')`<br/>、`getElementsByClassName('class')`<br/>、`getElementsByTagName('tag')`<br/> 等。 |
| 创建元素 | 使用 `createElement('tag')`<br/> 方法创建新的元素。 |
| 添加、删除和替换元素 | - `parentNode.appendChild(newNode)`<br/>：将新元素添加到父元素的子节点列表的末尾。 - `parentNode.removeChild(node)`<br/>：从父元素中移除子元素。 - `parentNode.replaceChild(newNode, oldNode)`<br/>：用新元素替换现有元素。 |
| 修改元素属性和内容 | - `getAttribute('attribute')`<br/> 和 `setAttribute('attribute', 'value')`<br/>：获取和设置元素属性值。 - `innerHTML`<br/> 和 `innerText`<br/>：获取或设置元素的 HTML 内容和文本内容。 |
| 遍历元素 | 使用 `childNodes`<br/>、`children`<br/>、`firstChild`<br/> 和 `lastChild`<br/> 获取和操作元素的子节点列表。 |
| 事件处理 | 通过 `addEventListener('event', callback)`<br/> 和 `removeEventListener('event', callback)`<br/> 添加和移除事件监听器。 |
| 样式操作 | 使用 `style.property`<br/> 获取或设置元素的行内样式属性，或者使用 `classList.add/remove/toggle('class')`<br/> 添加、移除或切换元素的类。 |


