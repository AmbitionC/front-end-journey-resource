#### Flexbox
使用CSS的Flexbox布局可以轻松实现水平垂直居中，即使元素的宽高未知。

```css
.parent {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 100%; /* 父元素的高度，根据需要设置 */
}
.child {
  /* 子元素的样式，宽高不固定也没关系 */
}
```

```html
<div class="parent">
  <div class="child">内容</div>
</div>
```



#### Grid
CSS Grid布局同样可以实现居中效果。

```css
.parent {
  display: grid;
  place-items: center; /* 水平和垂直居中 */
  height: 100%; /* 父元素的高度，根据需要设置 */
}
.child {
  /* 子元素的样式，宽高不固定也没关系 */
}
```

```html
<div class="parent">
  <div class="child">内容</div>
</div>
```



#### 绝对定位和变换
使用绝对定位和CSS变换（translate）也可以实现居中效果。

```css
.parent {
  position: relative;
  height: 100%; /* 父元素的高度，根据需要设置 */
}
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 使用变换向左和向上偏移自身宽高的50% */
}
```

```html
<div class="parent">
  <div class="child">内容</div>
</div>
```



#### 表格单元格布局
将父元素设置为表格单元格布局，也可以实现居中。

```css
.parent {
  display: table;
  width: 100%; /* 根据需要设置宽度 */
  height: 100%; /* 父元素的高度，根据需要设置 */
}
.child {
  display: table-cell;
  vertical-align: middle; /* 垂直居中 */
  text-align: center; /* 水平居中 */
}
```

```html
<div class="parent">
  <div class="child">内容</div>
</div>
```

