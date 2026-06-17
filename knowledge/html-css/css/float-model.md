浮动模型是一种CSS布局技术，通过将元素向左或向右浮动，使得元素脱离文档流并沿着包含它的块级容器的左侧或右侧移动。浮动元素会影响其后的非浮动元素的布局。

清除浮动的方法是用来解决浮动元素对后续元素布局的影响，常见的清除浮动的方法有以下几种：

#### 使用clear属性
在浮动元素的父容器或者需要清除浮动的元素之后添加一个空的块级元素，并设置其clear属性为left、right或both。 

```css
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}
```

  
	在父容器的最后一个子元素后添加一个清除浮动的伪元素，以防止父容器的高度塌陷。 



#### 使用overflow属性
设置浮动元素的父容器的overflow属性为hidden或auto，可以触发BFC，从而清除浮动。 

```css
.parent {
  overflow: hidden; /* 或者 overflow: auto; */
}
```

  
	当设置overflow属性时，父容器会包裹浮动元素，从而使其具有高度，达到清除浮动的效果。   


#### 使用clearfix类
通过为父容器添加clearfix类，并使用:before或:after伪元素清除浮动。 

```css
.clearfix::after {
  content: "";
  display: table;
  clear: both;
}
```

