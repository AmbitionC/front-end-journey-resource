圣杯布局是一种常见的三栏布局，其中中间栏先行放置于文档流中，两侧栏通过负边距进行定位，使其在页面中自然排序。以下是圣杯布局的一种实现方式：



```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>圣杯布局</title>
<style>
  .container {
    display: flex;
  }
  .main {
    flex: 1; /* 中间栏自动填充剩余空间 */
    background-color: #f0f0f0;
  }
  .left, .right {
    flex-basis: 200px; /* 侧边栏固定宽度 */
    background-color: #ccc;
  }
  .left {
    margin-left: -100%; /* 左侧栏向左移动一个父容器的宽度 */
    position: relative;
    left: -200px; /* 将左侧栏位置调整到正确位置 */
  }
  .right {
    margin-right: -200px; /* 右侧栏向右移动一个自身的宽度 */
    position: relative;
    right: -200px; /* 将右侧栏位置调整到正确位置 */
  }
</style>
</head>
<body>
  <div class="container">
    <div class="main">Main Content</div>
    <div class="left">Left Sidebar</div>
    <div class="right">Right Sidebar</div>
  </div>
</body>
</html>
```



`.container`是包含所有元素的容器，使用Flexbox布局。`.main`占据了剩余的空间，而`.left`和`.right`则使用`flex-basis`属性设置了固定的宽度，并通过负边距实现了位置的调整，使其位于`.main`的两侧。

