CSS权重是根据选择器的类型来计算的，具体规则如下：

#### 内联样式
在HTML元素的`style`属性中直接定义的样式具有最高的权重。 

```html
<div style="color: red;">这段文字是红色的</div>
```

 

#### ID选择器
每个ID选择器的权重为1。 

```css
#myId { color: blue; }
```

 

#### 类选择器、伪类和属性选择器
每个类选择器、伪类和属性选择器的权重为0.1。 

```css
.myClass { color: green; }
:hover { color: orange; }
```

 

#### 元素选择器和伪元素
每个元素选择器和伪元素的权重为0.01。 

```css
div { color: purple; }
::first-line { color: yellow; }
```

 

#### 通配符选择器
在CSS3中，`*`（通配符）选择器的权重为0.0001，但在CSS2中，`*`的权重是0。 

```css
* { color: black; }
```

 

#### 重要性
`!important`声明可以覆盖上述所有权重，但应谨慎使用。 

```css
div { color: red !important; }
```



