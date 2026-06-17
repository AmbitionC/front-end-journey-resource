CSS盒模型（Box Model）是网页设计中的一个基本概念，它定义了网页元素（尤其是块级元素）如何在页面上显示和排列。盒模型包括以下几个主要部分：

#### 内容区（Content Area）：
+ 这是元素内部的实际内容区域，如文本、图片等。
+ 内容区的宽度和高度可以通过`width`和`height`属性设置。



#### 内边距（Padding）： 
+ 内边距是内容区与边框之间的空间。
+ 它会影响元素的可视外观，但不会影响元素的布局和周围元素的位置。
+ 内边距的大小可以通过`padding-top`、`padding-right`、`padding-bottom`和`padding-left`属性设置，或者使用`padding`属性一次性设置所有四个方向的值。



#### 边框（Border）： 
+ 边框是围绕内容区和内边距的一条线。
+ 边框的样式、宽度和颜色可以通过`border-top-style`、`border-right-style`、`border-bottom-style`和`border-left-style`属性设置，以及`border-width`和`border-color`属性。
+ 边框也会影响元素的总宽度和高度。



#### 外边距（Margin）： 
+ 外边距是元素与其他元素之间的空间。
+ 它决定了元素在页面上的定位和与其他元素的距离。
+ 外边距的大小可以通过`margin-top`、`margin-right`、`margin-bottom`和`margin-left`属性设置，或者使用`margin`属性一次性设置所有四个方向的值。



#### 总宽度和总高度（Total Width and Total Height）： 
+ 元素的总宽度和总高度是由内容区、内边距和边框的宽度之和决定的。
+ 可以通过`box-sizing`属性来改变计算总宽度和总高度的方式，分为两种模式：`content-box`（默认值）和`border-box`。



#### 盒模型的计算方式
+  **内容盒模型（Content-box）**： 
    - 总宽度 = 内容区宽度 + 左边框宽度 + 右边框宽度 + 左内边距 + 右内边距
    - 总高度 = 内容区高度 + 上边框宽度 + 下边框宽度 + 上内边距 + 下内边距
+  **边框盒模型（Border-box）**： 
    - 总宽度 = 内容区宽度 + 左边框宽度 + 右边框宽度 + 左内边距 + 右内边距（边框宽度包含在内）
    - 总高度的计算方式与总宽度相同（边框宽度包含在内）

