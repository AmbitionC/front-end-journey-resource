IFC（Inline Formatting Context）和BFC（Block Formatting Context）是CSS中的两种布局上下文，用于控制元素在页面中的排列和布局。它们的主要区别在于元素的排列方式和布局规则。

#### IFC（Inline Formatting Context）：
+ IFC是行内格式化上下文，用于控制行内元素（例如文字、链接、图片等）在页面中的排列方式。
+ IFC中的元素会水平排列，宽度由内容决定，高度由元素的行高和字体大小决定。
+ IFC中的元素之间会受到水平方向上的相互影响，如文字之间的空格、换行等。
+ IFC中的元素可以通过设置`vertical-align`属性来控制垂直对齐方式。



#### BFC（Block Formatting Context）：
+ BFC是块级格式化上下文，用于控制块级元素（例如div、p、ul等）在页面中的排列和布局方式。
+ BFC中的元素会垂直排列，每个元素会从页面的顶部开始占据一行，不会与其他元素重叠。
+ BFC中的元素之间会受到垂直方向上的相互影响，如margin、padding、边框等。
+ BFC中的元素会创建一个独立的布局环境，不会受到外部元素的影响，可以防止浮动元素的溢出，从而实现自适应布局等效果。

