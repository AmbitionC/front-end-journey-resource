## 概述

HTML 和 CSS 是前端开发的基础语言。HTML（HyperText Markup Language，超文本标记语言）负责网页的 **结构**，CSS（Cascading Style Sheets，层叠样式表）负责网页的 **表现和布局**。前端开发者的主要任务就是使用 HTML 构建页面结构，用 CSS 美化页面，并确保在不同设备和浏览器上的一致体验。

掌握 HTML 与 CSS，不仅能够让你快速搭建静态页面，也为学习 JavaScript、前端框架和响应式开发打下坚实基础。


## 为什么学习 HTML & CSS

虽然现代前端框架（如 React、Vue、Svelte）可以让我们更高效地开发复杂应用，但底层依然是 HTML 和 CSS。如果对它们理解不深，可能会出现以下问题：

* 页面布局不规范，跨浏览器显示不一致。
* CSS 样式难以维护，导致代码臃肿。
* 无法灵活利用语义化标签，提高 SEO 与可访问性。
* 响应式设计困难，移动端适配效率低。

因此，前端开发者必须先 **精通 HTML 和 CSS**，再学习框架和高级技术。

## HTML 基础

### HTML 的作用

HTML 用于描述网页内容的 **结构和语义**。HTML 文档由一系列 **标签（Tag）** 构成，每个标签通常有 **开始标签、内容和结束标签**。

```html
<p>这是一个段落</p>
<a href="https://example.com">这是一个链接</a>
```

* `<p>` 用于段落
* `<a>` 用于超链接

### HTML 文档结构

一个标准 HTML 文档通常包含以下结构：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>示例页面</title>
</head>
<body>
    <h1>网页标题</h1>
    <p>这里是正文内容</p>
</body>
</html>
```

说明：

* `<!DOCTYPE html>`：声明 HTML5 文档类型
* `<html>`：根节点
* `<head>`：包含页面元信息，如标题、字符集、样式表
* `<body>`：页面可视内容

### 常用 HTML 标签分类

1. **文本标签**：`<h1>~<h6>`、`<p>`、`<span>`、`<strong>`、`<em>`
2. **列表标签**：`<ul>`、`<ol>`、`<li>`
3. **链接与图片**：`<a>`、`<img>`
4. **表格标签**：`<table>`、`<tr>`、`<td>`、`<th>`
5. **表单标签**：`<form>`、`<input>`、`<textarea>`、`<select>`
6. **语义化标签**：`<header>`、`<footer>`、`<article>`、`<section>`

**前端工程实践建议**：

* 优先使用语义化标签，提高 SEO 和可访问性
* 图片加 `alt` 属性，提高屏幕阅读器体验
* 表单使用 `<label>` 绑定，提高可点击区域

## CSS 基础

CSS 用于控制 HTML 元素的 **样式、布局和视觉效果**。

### CSS 的作用

1. 控制字体：字体大小、颜色、行高
2. 控制布局：宽度、高度、外边距、内边距
3. 控制背景：颜色、图片、渐变
4. 控制元素状态：悬停、点击等交互效果

### CSS 的引入方式

1. **内联样式**：

```html
<p style="color: red; font-size: 16px;">红色段落</p>
```

2. **内部样式表**（在 `<head>` 中）：

```html
<style>
p {
    color: blue;
    font-size: 18px;
}
</style>
```

3. **外部样式表**：

```html
<link rel="stylesheet" href="styles.css">
```

> 工程实践中，推荐使用 **外部样式表**，便于维护和复用。

## CSS 选择器

CSS 通过选择器选择 HTML 元素并应用样式：

1. **元素选择器**：`p { color: red; }`
2. **类选择器**：`.btn { background: blue; }`
3. **ID选择器**：`#header { height: 60px; }`
4. **组合选择器**：`div p { font-size: 14px; }`
5. **伪类选择器**：`a:hover { color: green; }`
6. **伪元素选择器**：`p::first-letter { font-size: 20px; }`

**工程实践建议**：

* 尽量使用类选择器而非 ID，方便复用
* 使用语义化类名，推荐 BEM 命名规范
* 避免过度依赖层级选择器，减少 CSS 耦合

## CSS 布局基础

### 盒模型

每个 HTML 元素都可以看作一个盒子，包含：

1. **内容（Content）**
2. **内边距（Padding）**
3. **边框（Border）**
4. **外边距（Margin）**

```css
div {
    width: 100px;
    padding: 10px;
    border: 2px solid black;
    margin: 5px;
}
```

* 元素总宽度 = width + padding*2 + border*2 + margin\*2（非 `box-sizing: border-box` 时）

### 常用布局方式

1. **块级布局（Block）**

   * 默认布局模式，元素从上到下排列
2. **行内布局（Inline）**

   * 元素在一行显示，不占用整行
3. **浮动布局（Float）**

   * 旧式布局方案，用于图文环绕
4. **Flex 布局（弹性盒子）**

   * 一维布局，适合水平或垂直排列
5. **Grid 布局（网格布局）**

   * 二维布局，适合复杂页面

**示例：Flex 布局**

```css
.container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
```

* `justify-content` 控制水平排列
* `align-items` 控制垂直对齐

### 响应式设计

* 使用 **百分比、vw/vh、em/rem** 单位，而非固定 px
* 使用 **媒体查询**：

```css
@media screen and (max-width: 768px) {
    .container {
        flex-direction: column;
    }
}
```

* 手机、平板、PC 页面自适应布局，提高用户体验

## CSS 高级特性

### 过渡与动画

* **过渡（Transition）**：

```css
button {
    background: blue;
    transition: background 0.3s ease;
}
button:hover {
    background: green;
}
```

* **关键帧动画（Keyframes）**：

```css
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
div {
    animation: fadeIn 2s linear infinite;
}
```

### 伪类和伪元素

* **伪类**：`:hover`, `:nth-child(2)`
* **伪元素**：`::before`, `::after` 用于装饰内容

### CSS 变量

```css
:root {
    --primary-color: #3498db;
}
button {
    background: var(--primary-color);
}
```

* 提高样式复用性和可维护性

## 实战案例：简单网页布局

```html
<header>
    <h1>我的博客</h1>
</header>
<nav>
    <ul>
        <li><a href="#">首页</a></li>
        <li><a href="#">文章</a></li>
        <li><a href="#">关于</a></li>
    </ul>
</nav>
<main>
    <article>
        <h2>文章标题</h2>
        <p>文章内容...</p>
    </article>
</main>
<footer>
    <p>© 2025 前端课程</p>
</footer>
```

```css
body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
header, footer { background: #333; color: #fff; text-align: center; padding: 20px; }
nav ul { display: flex; list-style: none; padding: 0; background: #555; margin: 0; }
nav li { margin: 0 10px; }
nav a { color: #fff; text-decoration: none; }
main { padding: 20px; }
```

* 使用语义化标签
* Flex 布局实现导航水平排列
* 简单颜色和间距控制页面美观

## 推荐学习资源

### 书籍

1. 《HTML & CSS: Design and Build Websites》—— Jon Duckett
2. 《CSS 权威指南》—— Eric A. Meyer
3. 《精通 CSS》—— Zachary B. & Dave Shea

### 在线网站

* [MDN Web Docs](https://developer.mozilla.org/) —— HTML、CSS 文档与教程
* [w3schools](https://www.w3schools.com/) —— 快速学习与示例
* [CSS-Tricks](https://css-tricks.com/) —— CSS 技巧、布局方案
* [CodePen](https://codepen.io/) —— 在线练习和效果展示
