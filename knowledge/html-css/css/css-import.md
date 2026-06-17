CSS可以通过多种方式引入到HTML文档中：

####  内联样式
直接在HTML标签的`style`属性中写入样式。 

```html
<div style="color: red;">这段文字是红色的</div>
```

 

####  内部样式表
在HTML文档的`<head>`部分使用`<style>`标签定义样式。 

```html
<style>
  div { color: green; }
</style>
```

 

####  外部样式表
通过`<link>`标签在HTML文档的`<head>`部分引入一个外部的CSS文件。 

```html
<link rel="stylesheet" type="text/css" href="styles.css">
```

 

#### 权重和引入方式的关系
+ **内联样式**的权重高于**内部样式表**和**外部样式表**。
+ **内部样式表**和**外部样式表**的权重相同，但它们的规则顺序会影响最终的样式，后面的规则会覆盖前面的规则（如果权重相同）。
+ 使用`!important`可以覆盖所有其他规则，但应尽量避免使用，因为它会使CSS维护变得困难。

