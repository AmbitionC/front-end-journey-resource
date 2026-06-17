可以使用CSS的边框属性来画一个三角形：

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Triangle</title>
<style>
    .triangle {
        width: 0;
        height: 0;
        border-left: 50px solid transparent; /* 左边框 */
        border-right: 50px solid transparent; /* 右边框 */
        border-bottom: 100px solid blue; /* 底边框 */
    }
</style>
</head>
<body>
    <div class="triangle"></div>
</body>
</html>
```

在这个示例中，我们创建了一个具有零宽度和零高度的div元素，并且使用border属性来定义三角形的边框。通过调整border的宽度和颜色，可以创建不同大小和颜色的三角形。

