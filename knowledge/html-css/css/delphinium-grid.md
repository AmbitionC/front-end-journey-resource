双飞翼布局是一种三栏布局，与圣杯布局类似，但双飞翼布局使用了更少的额外标记。以下是双飞翼布局的一种实现方式：



```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>双飞翼布局</title>
<style>
  .container {
    float: left;
    width: 100%;
  }
  .main {
    float: left;
    width: 100%;
    background-color: #f0f0f0;
  }
  .content {
    margin: 0 200px; /* 左右两侧栏的宽度 */
  }
  .left, .right {
    float: left;
    width: 200px; /* 左右两侧栏的宽度 */
    background-color: #ccc;
  }
  .left {
    margin-left: -100%; /* 将左侧栏左移一个父容器的宽度 */
  }
  .right {
    margin-left: -200px; /* 将右侧栏左移右侧栏的宽度 */
  }
</style>
</head>
<body>
  <div class="container">
    <div class="main">
      <div class="content">Main Content</div>
    </div>
    <div class="left">Left Sidebar</div>
    <div class="right">Right Sidebar</div>
  </div>
</body>
</html>
```



`.container`是包含所有元素的容器，`.main`占据了整个宽度，而`.left`和`.right`则使用`float`属性浮动到左侧，宽度固定为200px。`.content`用于设置`.main`内部的内容区域，左右两侧栏通过负边距来进行定位，从而实现布局的效果。

